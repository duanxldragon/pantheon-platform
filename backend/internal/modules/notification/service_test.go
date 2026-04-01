package notification

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type failingNotificationDAO struct {
	NotificationDAO
	failInboxAt      int
	createInboxCalls int
	failMarkFailed   bool
	failMarkSuccess  bool
}

func (d *failingNotificationDAO) CreateInbox(ctx context.Context, inbox *NotificationInbox) error {
	d.createInboxCalls++
	if d.failInboxAt > 0 && d.createInboxCalls == d.failInboxAt {
		return errors.New("create inbox failed")
	}
	return d.NotificationDAO.CreateInbox(ctx, inbox)
}

func (d *failingNotificationDAO) MarkJobFailed(ctx context.Context, id uuid.UUID, attempts int, lastErr string) error {
	if d.failMarkFailed {
		return errors.New("mark job failed persistence error")
	}
	return d.NotificationDAO.MarkJobFailed(ctx, id, attempts, lastErr)
}

func (d *failingNotificationDAO) MarkJobSucceeded(ctx context.Context, id uuid.UUID) error {
	if d.failMarkSuccess {
		return errors.New("mark job succeeded persistence error")
	}
	return d.NotificationDAO.MarkJobSucceeded(ctx, id)
}

func newNotificationTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	dao := NewNotificationDAO(db)
	if err := db.AutoMigrate(dao.GetTenantModels()...); err != nil {
		t.Fatalf("migrate notification models: %v", err)
	}
	return db
}

func TestCreateNotificationRollsBackWhenInboxCreationFails(t *testing.T) {
	db := newNotificationTestDB(t)
	baseDAO := NewNotificationDAO(db)
	service := &notificationService{
		dao:       &failingNotificationDAO{NotificationDAO: baseDAO, failInboxAt: 2},
		txManager: database.NewTransactionManager(db, nil),
	}

	notificationID := uuid.New()
	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	record := &Notification{
		TenantID:    "tenant-a",
		Title:       "Test",
		Content:     "content",
		Channel:     ChannelSystem,
		Status:      StatusDraft,
		Priority:    PriorityMedium,
		ReceiverIDs: uuid.NewString() + "," + uuid.NewString(),
	}
	record.ID = notificationID
	err := service.CreateNotification(ctx, record)
	if err == nil {
		t.Fatal("expected inbox creation failure")
	}

	var notificationCount int64
	if err := db.Model(&Notification{}).Where("id = ?", notificationID.String()).Count(&notificationCount).Error; err != nil {
		t.Fatalf("count notifications: %v", err)
	}
	if notificationCount != 0 {
		t.Fatalf("expected notification rollback, got %d rows", notificationCount)
	}

	var inboxCount int64
	if err := db.Model(&NotificationInbox{}).Where("notification_id = ?", notificationID.String()).Count(&inboxCount).Error; err != nil {
		t.Fatalf("count inbox rows: %v", err)
	}
	if inboxCount != 0 {
		t.Fatalf("expected inbox rollback, got %d rows", inboxCount)
	}
}

func TestProcessJobReturnsJoinedErrorWhenFailureStatePersistenceFails(t *testing.T) {
	db := newNotificationTestDB(t)
	baseDAO := NewNotificationDAO(db)
	service := &notificationService{
		dao: &failingNotificationDAO{
			NotificationDAO: baseDAO,
			failMarkFailed:  true,
		},
	}

	job := &NotificationJob{
		TenantID:       "tenant-a",
		NotificationID: uuid.New(),
		Status:         JobPending,
		MaxAttempts:    1,
	}
	if err := db.Create(job).Error; err != nil {
		t.Fatalf("create job: %v", err)
	}

	_, err := service.processJob(context.WithValue(context.Background(), "tenant_id", "tenant-a"), job)
	if err == nil {
		t.Fatal("expected job processing error")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("expected record not found in joined error, got %v", err)
	}
	if !strings.Contains(err.Error(), "failed to persist job failure state") {
		t.Fatalf("expected joined persistence error, got %v", err)
	}
}

func TestProcessJobReturnsErrorWhenSuccessStatePersistenceFails(t *testing.T) {
	db := newNotificationTestDB(t)
	baseDAO := NewNotificationDAO(db)
	service := &notificationService{
		dao: &failingNotificationDAO{
			NotificationDAO: baseDAO,
			failMarkSuccess: true,
		},
	}

	notificationRecord := &Notification{
		TenantID:    "tenant-a",
		Title:       "Test",
		Content:     "content",
		Channel:     ChannelSystem,
		Status:      StatusQueued,
		Priority:    PriorityMedium,
		ReceiverIDs: uuid.NewString(),
	}
	if err := db.Create(notificationRecord).Error; err != nil {
		t.Fatalf("create notification: %v", err)
	}

	job := &NotificationJob{
		TenantID:       "tenant-a",
		NotificationID: notificationRecord.ID,
		Status:         JobPending,
		MaxAttempts:    1,
	}
	if err := db.Create(job).Error; err != nil {
		t.Fatalf("create job: %v", err)
	}

	_, err := service.processJob(context.WithValue(context.Background(), "tenant_id", "tenant-a"), job)
	if err == nil {
		t.Fatal("expected success persistence error")
	}
	if !strings.Contains(err.Error(), "failed to persist job success state") {
		t.Fatalf("unexpected error: %v", err)
	}
}

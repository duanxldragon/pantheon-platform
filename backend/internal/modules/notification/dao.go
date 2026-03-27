package notification

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type NotificationRepository interface {
	database.TenantMigrator

	Create(ctx context.Context, n *Notification) error
	GetByID(ctx context.Context, id string) (*Notification, error)
	List(ctx context.Context, req *NotificationListRequest) ([]*Notification, int64, error)
	Update(ctx context.Context, id string, n *Notification) error
	UpdateNotificationFields(ctx context.Context, id string, fields map[string]interface{}) error
	Delete(ctx context.Context, id string) error

	CreateInbox(ctx context.Context, inbox *NotificationInbox) error
	GetInbox(ctx context.Context, id string) (*NotificationInbox, error)
	ListInbox(ctx context.Context, receiverID string, req *InboxListRequest) ([]*NotificationInbox, int64, error)
	DeleteInbox(ctx context.Context, id string) error
	MarkAsRead(ctx context.Context, receiverID string, ids []string) error
	MarkAllAsRead(ctx context.Context, receiverID string) error
	GetUnreadCount(ctx context.Context, receiverID string) (int64, error)

	CreateTemplate(ctx context.Context, t *NotificationTemplate) error
	GetTemplateByID(ctx context.Context, id string) (*NotificationTemplate, error)
	ListTemplates(ctx context.Context, req *TemplateListRequest) ([]*NotificationTemplate, int64, error)
	UpdateTemplate(ctx context.Context, id string, t *NotificationTemplate) error
	DeleteTemplate(ctx context.Context, id string) error

	GetStats(ctx context.Context, receiverID string) (*NotificationStats, error)

	EnqueueJob(ctx context.Context, n *Notification, maxAttempts int, delay time.Duration) (*NotificationJob, error)
	FetchDueJobs(ctx context.Context, limit int) ([]*NotificationJob, error)
	MarkJobProcessing(ctx context.Context, id uuid.UUID) (bool, error)
	MarkJobSucceeded(ctx context.Context, id uuid.UUID) error
	RescheduleJob(ctx context.Context, id uuid.UUID, attempts int, nextRetry time.Time, lastErr string) error
	MarkJobFailed(ctx context.Context, id uuid.UUID, attempts int, lastErr string) error
}

type notificationRepository struct {
	db        *gorm.DB
	notifRepo *database.BaseDAO[Notification]
	inboxRepo *database.BaseDAO[NotificationInbox]
	tmplRepo  *database.BaseDAO[NotificationTemplate]
	jobRepo   *database.BaseDAO[NotificationJob]
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{
		db:        db,
		notifRepo: database.NewBaseDAO[Notification](db),
		inboxRepo: database.NewBaseDAO[NotificationInbox](db),
		tmplRepo:  database.NewBaseDAO[NotificationTemplate](db),
		jobRepo:   database.NewBaseDAO[NotificationJob](db),
	}
}

func (r *notificationRepository) GetTenantModels() []interface{} {
	return []interface{}{
		&Notification{},
		&NotificationInbox{},
		&NotificationTemplate{},
		&NotificationJob{},
	}
}

func tenantIDFromCtx(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func (r *notificationRepository) Create(ctx context.Context, n *Notification) error {
	if n.TenantID == "" {
		n.TenantID = tenantIDFromCtx(ctx)
	}
	return r.notifRepo.GetDB(ctx).Create(n).Error
}

func (r *notificationRepository) GetByID(ctx context.Context, id string) (*Notification, error) {
	var n Notification
	err := r.notifRepo.GetDB(ctx).Where("id = ?", id).First(&n).Error
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *notificationRepository) List(ctx context.Context, req *NotificationListRequest) ([]*Notification, int64, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	db := r.notifRepo.GetDB(ctx).Model(&Notification{})

	tid := req.TenantID
	if tid == "" {
		tid = tenantIDFromCtx(ctx)
	}
	if tid != "" {
		db = db.Where("tenant_id = ?", tid)
	}
	if req.Channel != "" {
		db = db.Where("channel = ?", req.Channel)
	}
	if req.Status != "" {
		db = db.Where("status = ?", req.Status)
	}
	if req.Priority != "" {
		db = db.Where("priority = ?", req.Priority)
	}
	if req.Keyword != "" {
		kw := "%" + strings.TrimSpace(req.Keyword) + "%"
		db = db.Where("title LIKE ? OR content LIKE ?", kw, kw)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	orderBy := "created_at"
	if req.OrderBy != "" {
		orderBy = req.OrderBy
	}
	orderDir := "asc"
	if req.OrderDesc {
		orderDir = "desc"
	}
	db = db.Order(fmt.Sprintf("%s %s", orderBy, orderDir))

	var items []*Notification
	offset := (req.Page - 1) * req.PageSize
	if err := db.Offset(offset).Limit(req.PageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *notificationRepository) Update(ctx context.Context, id string, n *Notification) error {
	return r.notifRepo.GetDB(ctx).Model(&Notification{}).Where("id = ?", id).Updates(n).Error
}

func (r *notificationRepository) UpdateNotificationFields(ctx context.Context, id string, fields map[string]interface{}) error {
	return r.notifRepo.GetDB(ctx).Model(&Notification{}).Where("id = ?", id).Updates(fields).Error
}

func (r *notificationRepository) Delete(ctx context.Context, id string) error {
	return r.notifRepo.GetDB(ctx).Where("id = ?", id).Delete(&Notification{}).Error
}

func (r *notificationRepository) CreateInbox(ctx context.Context, inbox *NotificationInbox) error {
	if inbox.TenantID == "" {
		inbox.TenantID = tenantIDFromCtx(ctx)
	}
	return r.inboxRepo.GetDB(ctx).Create(inbox).Error
}

func (r *notificationRepository) GetInbox(ctx context.Context, id string) (*NotificationInbox, error) {
	var inbox NotificationInbox
	err := r.inboxRepo.GetDB(ctx).Where("id = ?", id).
		Preload("NotificationRef").
		First(&inbox).Error
	if err != nil {
		return nil, err
	}
	return &inbox, nil
}

func (r *notificationRepository) ListInbox(ctx context.Context, receiverID string, req *InboxListRequest) ([]*NotificationInbox, int64, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	db := r.inboxRepo.GetDB(ctx).Model(&NotificationInbox{}).
		Where("receiver_id = ? AND is_deleted = ?", receiverID, false)

	tid := tenantIDFromCtx(ctx)
	if tid != "" {
		db = db.Where("tenant_id = ?", tid)
	}
	if req.IsRead != nil {
		db = db.Where("is_read = ?", *req.IsRead)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []*NotificationInbox
	offset := (req.Page - 1) * req.PageSize
	if err := db.Preload("NotificationRef").
		Order("created_at desc").
		Offset(offset).
		Limit(req.PageSize).
		Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *notificationRepository) DeleteInbox(ctx context.Context, id string) error {
	// soft-delete by flag for mailbox semantics
	return r.inboxRepo.GetDB(ctx).Model(&NotificationInbox{}).Where("id = ?", id).
		Update("is_deleted", true).Error
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, receiverID string, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	now := time.Now()
	return r.inboxRepo.GetDB(ctx).Model(&NotificationInbox{}).
		Where("receiver_id = ? AND id IN ?", receiverID, ids).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": &now,
		}).Error
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, receiverID string) error {
	now := time.Now()
	return r.inboxRepo.GetDB(ctx).Model(&NotificationInbox{}).
		Where("receiver_id = ? AND is_deleted = ?", receiverID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": &now,
		}).Error
}

func (r *notificationRepository) GetUnreadCount(ctx context.Context, receiverID string) (int64, error) {
	var cnt int64
	err := r.inboxRepo.GetDB(ctx).Model(&NotificationInbox{}).
		Where("receiver_id = ? AND is_deleted = ? AND is_read = ?", receiverID, false, false).
		Count(&cnt).Error
	return cnt, err
}

func (r *notificationRepository) CreateTemplate(ctx context.Context, t *NotificationTemplate) error {
	if t.TenantID == "" {
		t.TenantID = tenantIDFromCtx(ctx)
	}
	return r.tmplRepo.GetDB(ctx).Create(t).Error
}

func (r *notificationRepository) GetTemplateByID(ctx context.Context, id string) (*NotificationTemplate, error) {
	var t NotificationTemplate
	err := r.tmplRepo.GetDB(ctx).Where("id = ?", id).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *notificationRepository) ListTemplates(ctx context.Context, req *TemplateListRequest) ([]*NotificationTemplate, int64, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	db := r.tmplRepo.GetDB(ctx).Model(&NotificationTemplate{})

	tid := req.TenantID
	if tid == "" {
		tid = tenantIDFromCtx(ctx)
	}
	if tid != "" {
		db = db.Where("tenant_id = ?", tid)
	}
	if req.Channel != "" {
		db = db.Where("channel = ?", req.Channel)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []*NotificationTemplate
	offset := (req.Page - 1) * req.PageSize
	if err := db.Order("created_at desc").Offset(offset).Limit(req.PageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *notificationRepository) UpdateTemplate(ctx context.Context, id string, t *NotificationTemplate) error {
	return r.tmplRepo.GetDB(ctx).Model(&NotificationTemplate{}).Where("id = ?", id).Updates(t).Error
}

func (r *notificationRepository) DeleteTemplate(ctx context.Context, id string) error {
	return r.tmplRepo.GetDB(ctx).Where("id = ?", id).Delete(&NotificationTemplate{}).Error
}

func (r *notificationRepository) GetStats(ctx context.Context, receiverID string) (*NotificationStats, error) {
	db := r.inboxRepo.GetDB(ctx).Model(&NotificationInbox{}).
		Where("receiver_id = ? AND is_deleted = ?", receiverID, false)

	tid := tenantIDFromCtx(ctx)
	if tid != "" {
		db = db.Where("tenant_id = ?", tid)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var unread int64
	if err := db.Where("is_read = ?", false).Count(&unread).Error; err != nil {
		return nil, err
	}

	read := total - unread

	// Approximate "sent" metrics by inbox created time.
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	startOfWeek := startOfDay.AddDate(0, 0, -int(now.Weekday()))

	var sentToday int64
	if err := db.Where("created_at >= ?", startOfDay).Count(&sentToday).Error; err != nil {
		return nil, err
	}

	var sentWeek int64
	if err := db.Where("created_at >= ?", startOfWeek).Count(&sentWeek).Error; err != nil {
		return nil, err
	}

	return &NotificationStats{
		Total:     total,
		Unread:    unread,
		Read:      read,
		SentToday: sentToday,
		SentWeek:  sentWeek,
	}, nil
}

func (r *notificationRepository) EnqueueJob(ctx context.Context, n *Notification, maxAttempts int, delay time.Duration) (*NotificationJob, error) {
	job := &NotificationJob{
		TenantID:       n.TenantID,
		NotificationID: n.ID,
		Status:         JobPending,
		MaxAttempts:    maxAttempts,
	}
	if delay > 0 {
		next := time.Now().Add(delay)
		job.NextRetryAt = &next
	}
	if err := r.jobRepo.GetDB(ctx).Create(job).Error; err != nil {
		return nil, err
	}
	return job, nil
}

func (r *notificationRepository) FetchDueJobs(ctx context.Context, limit int) ([]*NotificationJob, error) {
	now := time.Now()
	var jobs []*NotificationJob
	db := r.jobRepo.GetDB(ctx).Where("status = ? AND (next_retry_at IS NULL OR next_retry_at <= ?)", JobPending, now).
		Order("created_at asc")
	if limit > 0 {
		db = db.Limit(limit)
	}
	if err := db.Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (r *notificationRepository) MarkJobProcessing(ctx context.Context, id uuid.UUID) (bool, error) {
	now := time.Now()
	res := r.jobRepo.GetDB(ctx).Model(&NotificationJob{}).
		Where("id = ? AND status = ?", id, JobPending).
		Updates(map[string]interface{}{
			"status":          JobProcessing,
			"updated_at":      now,
			"last_attempt_at": now,
		})
	return res.RowsAffected == 1, res.Error
}

func (r *notificationRepository) MarkJobSucceeded(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.jobRepo.GetDB(ctx).Model(&NotificationJob{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":        JobSucceeded,
			"last_error":    "",
			"next_retry_at": nil,
			"updated_at":    now,
		}).Error
}

func (r *notificationRepository) RescheduleJob(ctx context.Context, id uuid.UUID, attempts int, nextRetry time.Time, lastErr string) error {
	return r.jobRepo.GetDB(ctx).Model(&NotificationJob{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":        JobPending,
			"attempts":      attempts,
			"last_error":    lastErr,
			"next_retry_at": nextRetry,
			"updated_at":    time.Now(),
		}).Error
}

func (r *notificationRepository) MarkJobFailed(ctx context.Context, id uuid.UUID, attempts int, lastErr string) error {
	now := time.Now()
	return r.jobRepo.GetDB(ctx).Model(&NotificationJob{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":        JobFailed,
			"attempts":      attempts,
			"last_error":    lastErr,
			"next_retry_at": nil,
			"updated_at":    now,
		}).Error
}

func parseUUID(s string) (*uuid.UUID, error) {
	if strings.TrimSpace(s) == "" {
		return nil, nil
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

package position

import (
	"context"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type stubPositionUserDirectory struct {
	userIDsByPosition map[string][]string
}

func (s *stubPositionUserDirectory) ListUserIDsByPositionID(_ context.Context, positionID string) ([]string, error) {
	return s.userIDsByPosition[positionID], nil
}

type stubPositionAuthProvider struct {
	bumped [][]string
}

func (s *stubPositionAuthProvider) BumpUsersAuthVersion(_ context.Context, userIDs []string) error {
	s.bumped = append(s.bumped, append([]string(nil), userIDs...))
	return nil
}

type stubPositionDeptValidator struct{}

func (s stubPositionDeptValidator) GetDeptName(_ context.Context, _ string) (string, error) {
	return "", nil
}

func (s stubPositionDeptValidator) CheckDeptExists(_ context.Context, _ string) (bool, error) {
	return true, nil
}

type failingPositionDAO struct {
	PositionDAO
	deleteCalls       int
	updateStatusCalls int
	failDeleteAt      int
	failUpdateAt      int
}

func (d *failingPositionDAO) Delete(ctx context.Context, id interface{}) error {
	d.deleteCalls++
	if d.failDeleteAt > 0 && d.deleteCalls == d.failDeleteAt {
		return gorm.ErrInvalidTransaction
	}
	return d.PositionDAO.Delete(ctx, id)
}

func (d *failingPositionDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	d.updateStatusCalls++
	if d.failUpdateAt > 0 && d.updateStatusCalls == d.failUpdateAt {
		return gorm.ErrInvalidTransaction
	}
	return d.PositionDAO.UpdateStatus(ctx, id, status)
}

func newPositionBatchTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	dao := NewPositionDAO(db)
	if err := db.AutoMigrate(dao.GetTenantModels()...); err != nil {
		t.Fatalf("migrate position models: %v", err)
	}
	return db
}

func TestBatchDeleteDeletesPositionsAndBumpsUsers(t *testing.T) {
	db := newPositionBatchTestDB(t)
	authProvider := &stubPositionAuthProvider{}
	service := &positionService{
		dao:           NewPositionDAO(db),
		deptValidator: stubPositionDeptValidator{},
		userDirectory: &stubPositionUserDirectory{
			userIDsByPosition: map[string][]string{},
		},
		authProvider: authProvider,
		txManager:    database.NewTransactionManager(db, nil),
	}

	positionA := Position{
		ID:       uuid.New(),
		Name:     "OnCall",
		Code:     "oncall",
		Status:   "active",
		TenantID: "tenant-a",
	}
	positionB := Position{
		ID:       uuid.New(),
		Name:     "SRE",
		Code:     "sre-batch",
		Status:   "active",
		TenantID: "tenant-a",
	}
	if err := db.Create(&positionA).Error; err != nil {
		t.Fatalf("create position A: %v", err)
	}
	if err := db.Create(&positionB).Error; err != nil {
		t.Fatalf("create position B: %v", err)
	}

	service.userDirectory.(*stubPositionUserDirectory).userIDsByPosition[positionA.ID.String()] = []string{"user-1"}
	service.userDirectory.(*stubPositionUserDirectory).userIDsByPosition[positionB.ID.String()] = []string{"user-2"}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchDelete(ctx, []string{positionA.ID.String(), positionB.ID.String()}); err != nil {
		t.Fatalf("batch delete positions: %v", err)
	}

	var count int64
	if err := db.Model(&Position{}).Where("id IN ?", []string{positionA.ID.String(), positionB.ID.String()}).Count(&count).Error; err != nil {
		t.Fatalf("count positions: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected positions deleted, got %d", count)
	}
	if len(authProvider.bumped) != 1 {
		t.Fatalf("expected one auth bump call, got %#v", authProvider.bumped)
	}
	got := strings.Join(authProvider.bumped[0], ",")
	if !strings.Contains(got, "user-1") || !strings.Contains(got, "user-2") {
		t.Fatalf("expected both users in auth bump, got %#v", authProvider.bumped[0])
	}
}

func TestBatchUpdateStatusUpdatesPositionsAndBumpsUsers(t *testing.T) {
	db := newPositionBatchTestDB(t)
	authProvider := &stubPositionAuthProvider{}
	service := &positionService{
		dao:           NewPositionDAO(db),
		deptValidator: stubPositionDeptValidator{},
		userDirectory: &stubPositionUserDirectory{
			userIDsByPosition: map[string][]string{},
		},
		authProvider: authProvider,
		txManager:    database.NewTransactionManager(db, nil),
	}

	positionID := uuid.New()
	if err := db.Create(&Position{
		ID:       positionID,
		Name:     "Duty",
		Code:     "duty-batch",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create position: %v", err)
	}
	service.userDirectory.(*stubPositionUserDirectory).userIDsByPosition[positionID.String()] = []string{"user-3", "user-4"}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchUpdateStatus(ctx, &PositionStatusRequest{
		PositionIDs: []string{positionID.String()},
		Status:      "inactive",
	}); err != nil {
		t.Fatalf("batch update position status: %v", err)
	}

	var updated Position
	if err := db.First(&updated, "id = ?", positionID.String()).Error; err != nil {
		t.Fatalf("reload position: %v", err)
	}
	if updated.Status != "inactive" {
		t.Fatalf("expected inactive status, got %s", updated.Status)
	}
	if len(authProvider.bumped) != 1 {
		t.Fatalf("expected one auth bump call, got %#v", authProvider.bumped)
	}
	got := strings.Join(authProvider.bumped[0], ",")
	if !strings.Contains(got, "user-3") || !strings.Contains(got, "user-4") {
		t.Fatalf("expected users in auth bump, got %#v", authProvider.bumped[0])
	}
}

func TestBatchDeleteRollsBackOnDeleteFailure(t *testing.T) {
	db := newPositionBatchTestDB(t)
	baseDAO := NewPositionDAO(db)
	service := &positionService{
		dao: &failingPositionDAO{
			PositionDAO:  baseDAO,
			failDeleteAt: 2,
		},
		deptValidator: stubPositionDeptValidator{},
		userDirectory: &stubPositionUserDirectory{userIDsByPosition: map[string][]string{}},
		txManager:     database.NewTransactionManager(db, nil),
	}

	positionA := Position{ID: uuid.New(), Name: "Ops Lead", Code: "ops-lead-a", Status: "active", TenantID: "tenant-a"}
	positionB := Position{ID: uuid.New(), Name: "QA Lead", Code: "qa-lead-b", Status: "active", TenantID: "tenant-a"}
	if err := db.Create(&positionA).Error; err != nil {
		t.Fatalf("create position A: %v", err)
	}
	if err := db.Create(&positionB).Error; err != nil {
		t.Fatalf("create position B: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchDelete(ctx, []string{positionA.ID.String(), positionB.ID.String()}); err == nil {
		t.Fatal("expected delete failure")
	}

	var count int64
	if err := db.Model(&Position{}).Where("id IN ?", []string{positionA.ID.String(), positionB.ID.String()}).Count(&count).Error; err != nil {
		t.Fatalf("count positions: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected rollback to keep both positions, got %d", count)
	}
}

func TestBatchUpdateStatusRollsBackOnUpdateFailure(t *testing.T) {
	db := newPositionBatchTestDB(t)
	baseDAO := NewPositionDAO(db)
	authProvider := &stubPositionAuthProvider{}
	service := &positionService{
		dao: &failingPositionDAO{
			PositionDAO:  baseDAO,
			failUpdateAt: 2,
		},
		deptValidator: stubPositionDeptValidator{},
		userDirectory: &stubPositionUserDirectory{userIDsByPosition: map[string][]string{}},
		authProvider:  authProvider,
		txManager:     database.NewTransactionManager(db, nil),
	}

	positionA := Position{ID: uuid.New(), Name: "Ops Lead", Code: "ops-status-a", Status: "active", TenantID: "tenant-a"}
	positionB := Position{ID: uuid.New(), Name: "QA Lead", Code: "qa-status-b", Status: "active", TenantID: "tenant-a"}
	if err := db.Create(&positionA).Error; err != nil {
		t.Fatalf("create position A: %v", err)
	}
	if err := db.Create(&positionB).Error; err != nil {
		t.Fatalf("create position B: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchUpdateStatus(ctx, &PositionStatusRequest{
		PositionIDs: []string{positionA.ID.String(), positionB.ID.String()},
		Status:      "inactive",
	})
	if err == nil {
		t.Fatal("expected update failure")
	}

	var positions []Position
	if err := db.Where("id IN ?", []string{positionA.ID.String(), positionB.ID.String()}).Order("code").Find(&positions).Error; err != nil {
		t.Fatalf("reload positions: %v", err)
	}
	for _, position := range positions {
		if position.Status != "active" {
			t.Fatalf("expected rollback to keep active status, got %s for %s", position.Status, position.Name)
		}
	}
	if len(authProvider.bumped) != 0 {
		t.Fatalf("expected no auth bump on rollback, got %#v", authProvider.bumped)
	}
}

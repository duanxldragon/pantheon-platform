package dept

import (
	"context"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type stubDeptUserValidator struct {
	hasUsersByDept map[string]bool
	userIDsByDept  map[string][]string
	capturedDepts  [][]string
}

func (s *stubDeptUserValidator) GetUserName(_ context.Context, _ string) (string, error) {
	return "", nil
}

func (s *stubDeptUserValidator) CheckUserExists(_ context.Context, _ string) (bool, error) {
	return true, nil
}

func (s *stubDeptUserValidator) HasUsersInDept(_ context.Context, deptID string) (bool, error) {
	return s.hasUsersByDept[deptID], nil
}

func (s *stubDeptUserValidator) ListUserIDsByDepartmentIDs(_ context.Context, deptIDs []string) ([]string, error) {
	s.capturedDepts = append(s.capturedDepts, append([]string(nil), deptIDs...))
	var result []string
	for _, deptID := range deptIDs {
		result = append(result, s.userIDsByDept[deptID]...)
	}
	return result, nil
}

type stubDeptAuthProvider struct {
	bumped [][]string
}

func (s *stubDeptAuthProvider) BumpUsersAuthVersion(_ context.Context, userIDs []string) error {
	s.bumped = append(s.bumped, append([]string(nil), userIDs...))
	return nil
}

type failingDeptDAO struct {
	DepartmentDAO
	deleteCalls       int
	updateStatusCalls int
	failDeleteAt      int
	failUpdateAt      int
}

func (d *failingDeptDAO) Delete(ctx context.Context, id interface{}) error {
	d.deleteCalls++
	if d.failDeleteAt > 0 && d.deleteCalls == d.failDeleteAt {
		return gorm.ErrInvalidTransaction
	}
	return d.DepartmentDAO.Delete(ctx, id)
}

func (d *failingDeptDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	d.updateStatusCalls++
	if d.failUpdateAt > 0 && d.updateStatusCalls == d.failUpdateAt {
		return gorm.ErrInvalidTransaction
	}
	return d.DepartmentDAO.UpdateStatus(ctx, id, status)
}

func newDeptTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	dao := NewDepartmentDAO(db)
	if err := db.AutoMigrate(dao.GetTenantModels()...); err != nil {
		t.Fatalf("migrate department models: %v", err)
	}
	return db
}

func TestBatchDeleteRejectsDepartmentWithChildren(t *testing.T) {
	db := newDeptTestDB(t)
	service := &departmentService{
		dao:           NewDepartmentDAO(db),
		userValidator: &stubDeptUserValidator{hasUsersByDept: map[string]bool{}},
		txManager:     database.NewTransactionManager(db, nil),
	}

	parentID := uuid.New()
	childID := uuid.New()
	if err := db.Create(&Department{
		ID:       parentID,
		Name:     "R&D",
		Code:     "rd",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create parent department: %v", err)
	}
	if err := db.Create(&Department{
		ID:       childID,
		Name:     "Platform",
		Code:     "platform",
		Status:   "active",
		TenantID: "tenant-a",
		ParentID: &parentID,
	}).Error; err != nil {
		t.Fatalf("create child department: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchDelete(ctx, []string{parentID.String()})
	if err == nil {
		t.Fatal("expected error for department with children")
	}
	if !strings.Contains(err.Error(), "has children") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestBatchUpdateStatusBumpsDepartmentUsers(t *testing.T) {
	db := newDeptTestDB(t)
	userValidator := &stubDeptUserValidator{
		hasUsersByDept: map[string]bool{},
		userIDsByDept: map[string][]string{
			"dept-parent": {"user-1"},
			"dept-child":  {"user-2"},
		},
	}
	authProvider := &stubDeptAuthProvider{}
	service := &departmentService{
		dao:           NewDepartmentDAO(db),
		userValidator: userValidator,
		authProvider:  authProvider,
		txManager:     database.NewTransactionManager(db, nil),
	}

	parentID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	childID := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	if err := db.Create(&Department{
		ID:       parentID,
		Name:     "R&D",
		Code:     "rd-batch",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create parent department: %v", err)
	}
	if err := db.Create(&Department{
		ID:       childID,
		Name:     "Platform",
		Code:     "platform-batch",
		Status:   "active",
		TenantID: "tenant-a",
		ParentID: &parentID,
	}).Error; err != nil {
		t.Fatalf("create child department: %v", err)
	}

	userValidator.userIDsByDept[parentID.String()] = []string{"user-1"}
	userValidator.userIDsByDept[childID.String()] = []string{"user-2"}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchUpdateStatus(ctx, &DepartmentStatusRequest{
		DepartmentIDs: []string{parentID.String()},
		Status:        "inactive",
	}); err != nil {
		t.Fatalf("batch update department status: %v", err)
	}

	var updatedParent Department
	if err := db.First(&updatedParent, "id = ?", parentID.String()).Error; err != nil {
		t.Fatalf("reload parent department: %v", err)
	}
	if updatedParent.Status != "inactive" {
		t.Fatalf("expected inactive status, got %s", updatedParent.Status)
	}

	if len(authProvider.bumped) != 1 {
		t.Fatalf("expected one auth bump call, got %#v", authProvider.bumped)
	}
	got := strings.Join(authProvider.bumped[0], ",")
	if !strings.Contains(got, "user-1") || !strings.Contains(got, "user-2") {
		t.Fatalf("expected both affected users in bump call, got %#v", authProvider.bumped[0])
	}
}

func TestBatchDeleteRollsBackOnDeleteFailure(t *testing.T) {
	db := newDeptTestDB(t)
	baseDAO := NewDepartmentDAO(db)
	service := &departmentService{
		dao: &failingDeptDAO{
			DepartmentDAO: baseDAO,
			failDeleteAt:  2,
		},
		userValidator: &stubDeptUserValidator{hasUsersByDept: map[string]bool{}},
		txManager:     database.NewTransactionManager(db, nil),
	}

	deptA := Department{ID: uuid.New(), Name: "Ops", Code: "ops-batch-a", Status: "active", TenantID: "tenant-a"}
	deptB := Department{ID: uuid.New(), Name: "QA", Code: "qa-batch-b", Status: "active", TenantID: "tenant-a"}
	if err := db.Create(&deptA).Error; err != nil {
		t.Fatalf("create department A: %v", err)
	}
	if err := db.Create(&deptB).Error; err != nil {
		t.Fatalf("create department B: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchDelete(ctx, []string{deptA.ID.String(), deptB.ID.String()}); err == nil {
		t.Fatal("expected delete failure")
	}

	var count int64
	if err := db.Model(&Department{}).Where("id IN ?", []string{deptA.ID.String(), deptB.ID.String()}).Count(&count).Error; err != nil {
		t.Fatalf("count departments: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected rollback to keep both departments, got %d", count)
	}
}

func TestBatchUpdateStatusRollsBackOnUpdateFailure(t *testing.T) {
	db := newDeptTestDB(t)
	baseDAO := NewDepartmentDAO(db)
	authProvider := &stubDeptAuthProvider{}
	service := &departmentService{
		dao: &failingDeptDAO{
			DepartmentDAO: baseDAO,
			failUpdateAt:  2,
		},
		userValidator: &stubDeptUserValidator{
			hasUsersByDept: map[string]bool{},
			userIDsByDept:  map[string][]string{},
		},
		authProvider: authProvider,
		txManager:    database.NewTransactionManager(db, nil),
	}

	deptA := Department{ID: uuid.New(), Name: "Ops", Code: "ops-status-a", Status: "active", TenantID: "tenant-a"}
	deptB := Department{ID: uuid.New(), Name: "QA", Code: "qa-status-b", Status: "active", TenantID: "tenant-a"}
	if err := db.Create(&deptA).Error; err != nil {
		t.Fatalf("create department A: %v", err)
	}
	if err := db.Create(&deptB).Error; err != nil {
		t.Fatalf("create department B: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchUpdateStatus(ctx, &DepartmentStatusRequest{
		DepartmentIDs: []string{deptA.ID.String(), deptB.ID.String()},
		Status:        "inactive",
	})
	if err == nil {
		t.Fatal("expected update failure")
	}

	var departments []Department
	if err := db.Where("id IN ?", []string{deptA.ID.String(), deptB.ID.String()}).Order("code").Find(&departments).Error; err != nil {
		t.Fatalf("reload departments: %v", err)
	}
	for _, department := range departments {
		if department.Status != "active" {
			t.Fatalf("expected rollback to keep active status, got %s for %s", department.Status, department.Name)
		}
	}
	if len(authProvider.bumped) != 0 {
		t.Fatalf("expected no auth bump on rollback, got %#v", authProvider.bumped)
	}
}

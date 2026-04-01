package menu

import (
	"context"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type stubMenuAuthProvider struct {
	bumped []string
}

func (s *stubMenuAuthProvider) BumpRoleUsersAuthVersion(_ context.Context, roleID string) error {
	s.bumped = append(s.bumped, roleID)
	return nil
}

type failingMenuDAO struct {
	MenuDAO
	updateStatusCalls int
	failUpdateAt      int
}

func (d *failingMenuDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	d.updateStatusCalls++
	if d.failUpdateAt > 0 && d.updateStatusCalls == d.failUpdateAt {
		return gorm.ErrInvalidTransaction
	}
	return d.MenuDAO.UpdateStatus(ctx, id, status)
}

func (d *failingMenuDAO) WithTx(tx *gorm.DB) database.DAO[Menu] {
	return &failingMenuDAO{
		MenuDAO:      d.MenuDAO.WithTx(tx).(MenuDAO),
		failUpdateAt: d.failUpdateAt,
	}
}

func newMenuTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	dao := NewMenuDAO(db)
	if err := db.AutoMigrate(dao.GetTenantModels()...); err != nil {
		t.Fatalf("migrate menu models: %v", err)
	}

	return db
}

func TestBatchDeleteRejectsMenusWithUnselectedChildren(t *testing.T) {
	db := newMenuTestDB(t)
	service := &menuService{
		dao:          NewMenuDAO(db),
		authProvider: &stubMenuAuthProvider{},
		txManager:    database.NewTransactionManager(db, nil),
	}

	parentID := uuid.New()
	childID := uuid.New()
	if err := db.Create(&Menu{
		ID:       parentID,
		Name:     "System",
		Code:     "system",
		Path:     "/system",
		Type:     "directory",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create parent menu: %v", err)
	}
	if err := db.Create(&Menu{
		ID:       childID,
		Name:     "Users",
		Code:     "users",
		Path:     "/system/users",
		Type:     "menu",
		Status:   "active",
		TenantID: "tenant-a",
		ParentID: &parentID,
	}).Error; err != nil {
		t.Fatalf("create child menu: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchDelete(ctx, []string{parentID.String()})
	if err == nil {
		t.Fatal("expected error for unselected child menu")
	}
	if !strings.Contains(err.Error(), "unselected child menus") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestBatchDeleteRemovesMenusAndBumpsAffectedRoles(t *testing.T) {
	db := newMenuTestDB(t)
	authProvider := &stubMenuAuthProvider{}
	service := &menuService{
		dao:          NewMenuDAO(db),
		authProvider: authProvider,
		txManager:    database.NewTransactionManager(db, nil),
	}

	parentID := uuid.New()
	childID := uuid.New()
	roleID := "role-1"
	if err := db.Create(&Menu{
		ID:       parentID,
		Name:     "System",
		Code:     "system",
		Path:     "/system",
		Type:     "directory",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create parent menu: %v", err)
	}
	if err := db.Create(&Menu{
		ID:       childID,
		Name:     "Users",
		Code:     "users",
		Path:     "/system/users",
		Type:     "menu",
		Status:   "active",
		TenantID: "tenant-a",
		ParentID: &parentID,
	}).Error; err != nil {
		t.Fatalf("create child menu: %v", err)
	}
	if err := db.Create(&RoleMenuRelation{
		ID:     uuid.New(),
		RoleID: roleID,
		MenuID: childID.String(),
	}).Error; err != nil {
		t.Fatalf("create role menu relation: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchDelete(ctx, []string{parentID.String(), childID.String()}); err != nil {
		t.Fatalf("batch delete menus: %v", err)
	}

	var menuCount int64
	if err := db.Model(&Menu{}).Where("id IN ?", []string{parentID.String(), childID.String()}).Count(&menuCount).Error; err != nil {
		t.Fatalf("count menus: %v", err)
	}
	if menuCount != 0 {
		t.Fatalf("expected menus to be deleted, got %d", menuCount)
	}

	var relationCount int64
	if err := db.Model(&RoleMenuRelation{}).Where("menu_id = ?", childID.String()).Count(&relationCount).Error; err != nil {
		t.Fatalf("count role menu relations: %v", err)
	}
	if relationCount != 0 {
		t.Fatalf("expected role menu relations cleared, got %d", relationCount)
	}

	if len(authProvider.bumped) != 1 || authProvider.bumped[0] != roleID {
		t.Fatalf("expected bumped role %s, got %#v", roleID, authProvider.bumped)
	}
}

func TestBatchUpdateStatusUpdatesMenusAndBumpsRoles(t *testing.T) {
	db := newMenuTestDB(t)
	authProvider := &stubMenuAuthProvider{}
	service := &menuService{
		dao:          NewMenuDAO(db),
		authProvider: authProvider,
		txManager:    database.NewTransactionManager(db, nil),
	}

	menuID := uuid.New()
	roleID := "role-2"
	if err := db.Create(&Menu{
		ID:       menuID,
		Name:     "Audit",
		Code:     "audit",
		Path:     "/audit",
		Type:     "menu",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create menu: %v", err)
	}
	if err := db.Create(&RoleMenuRelation{
		ID:     uuid.New(),
		RoleID: roleID,
		MenuID: menuID.String(),
	}).Error; err != nil {
		t.Fatalf("create role menu relation: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchUpdateStatus(ctx, &MenuStatusRequest{
		MenuIDs: []string{menuID.String()},
		Status:  "inactive",
	}); err != nil {
		t.Fatalf("batch update menu status: %v", err)
	}

	var updated Menu
	if err := db.First(&updated, "id = ?", menuID.String()).Error; err != nil {
		t.Fatalf("reload menu: %v", err)
	}
	if updated.Status != "inactive" {
		t.Fatalf("expected inactive status, got %s", updated.Status)
	}

	if len(authProvider.bumped) != 1 || authProvider.bumped[0] != roleID {
		t.Fatalf("expected bumped role %s, got %#v", roleID, authProvider.bumped)
	}
}

func TestBatchUpdateStatusRollsBackOnUpdateFailure(t *testing.T) {
	db := newMenuTestDB(t)
	authProvider := &stubMenuAuthProvider{}
	baseDAO := NewMenuDAO(db)
	service := &menuService{
		dao: &failingMenuDAO{
			MenuDAO:      baseDAO,
			failUpdateAt: 2,
		},
		authProvider: authProvider,
		txManager:    database.NewTransactionManager(db, nil),
	}

	menuA := Menu{
		ID:       uuid.New(),
		Name:     "Audit",
		Code:     "audit-a",
		Path:     "/audit/a",
		Type:     "menu",
		Status:   "active",
		TenantID: "tenant-a",
	}
	menuB := Menu{
		ID:       uuid.New(),
		Name:     "Audit Settings",
		Code:     "audit-b",
		Path:     "/audit/b",
		Type:     "menu",
		Status:   "active",
		TenantID: "tenant-a",
	}
	if err := db.Create(&menuA).Error; err != nil {
		t.Fatalf("create menu A: %v", err)
	}
	if err := db.Create(&menuB).Error; err != nil {
		t.Fatalf("create menu B: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchUpdateStatus(ctx, &MenuStatusRequest{
		MenuIDs: []string{menuA.ID.String(), menuB.ID.String()},
		Status:  "inactive",
	})
	if err == nil {
		t.Fatal("expected update failure")
	}

	var menus []Menu
	if err := db.Where("id IN ?", []string{menuA.ID.String(), menuB.ID.String()}).Order("code").Find(&menus).Error; err != nil {
		t.Fatalf("reload menus: %v", err)
	}
	for _, menu := range menus {
		if menu.Status != "active" {
			t.Fatalf("expected rollback to keep active status, got %s for %s", menu.Status, menu.Name)
		}
	}
	if len(authProvider.bumped) != 0 {
		t.Fatalf("expected no auth bump on rollback, got %#v", authProvider.bumped)
	}
}

package permission

import (
	"context"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/modules/system/role"
	"pantheon-platform/backend/internal/shared/database"
)

type stubPermissionAuthProvider struct {
	updated []string
	bumped  []string
}

func (s *stubPermissionAuthProvider) UpdateRolePermissions(_ context.Context, roleID string, _ []role.PermissionRule) error {
	s.updated = append(s.updated, roleID)
	return nil
}

func (s *stubPermissionAuthProvider) BumpRoleUsersAuthVersion(_ context.Context, roleID string) error {
	s.bumped = append(s.bumped, roleID)
	return nil
}

type failingPermissionDAO struct {
	PermissionDAO
	updateStatusCalls int
	failUpdateAt      int
}

func (d *failingPermissionDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	d.updateStatusCalls++
	if d.failUpdateAt > 0 && d.updateStatusCalls == d.failUpdateAt {
		return gorm.ErrInvalidTransaction
	}
	return d.PermissionDAO.UpdateStatus(ctx, id, status)
}

func (d *failingPermissionDAO) WithTx(tx *gorm.DB) database.DAO[Permission] {
	return &failingPermissionDAO{
		PermissionDAO: d.PermissionDAO.WithTx(tx).(PermissionDAO),
		failUpdateAt:  d.failUpdateAt,
	}
}

func newPermissionTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	dao := NewPermissionDAO(db)
	if err := db.AutoMigrate(dao.GetTenantModels()...); err != nil {
		t.Fatalf("migrate permission models: %v", err)
	}
	if err := db.Exec(`CREATE TABLE system_role_permissions (
			id TEXT PRIMARY KEY,
			role_id TEXT,
			permission_id TEXT
		)`).Error; err != nil {
		t.Fatalf("create system_role_permissions: %v", err)
	}
	if err := db.Exec(`CREATE TABLE system_user_roles (
			id TEXT PRIMARY KEY,
			user_id TEXT,
			role_id TEXT
		)`).Error; err != nil {
		t.Fatalf("create system_user_roles: %v", err)
	}

	return db
}

func TestBatchDeleteDeletesPermissions(t *testing.T) {
	db := newPermissionTestDB(t)
	service := &permissionService{
		dao:       NewPermissionDAO(db),
		txManager: database.NewTransactionManager(db, nil),
	}

	permA := Permission{
		ID:       uuid.New(),
		Name:     "UserView",
		Code:     "userview",
		Type:     "button",
		Status:   "active",
		TenantID: "tenant-a",
	}
	permB := Permission{
		ID:       uuid.New(),
		Name:     "UserEdit",
		Code:     "useredit",
		Type:     "button",
		Status:   "active",
		TenantID: "tenant-a",
	}
	if err := db.Create(&permA).Error; err != nil {
		t.Fatalf("create permission A: %v", err)
	}
	if err := db.Create(&permB).Error; err != nil {
		t.Fatalf("create permission B: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchDelete(ctx, []string{permA.ID.String(), permB.ID.String(), permA.ID.String()}); err != nil {
		t.Fatalf("batch delete permissions: %v", err)
	}

	var count int64
	if err := db.Model(&Permission{}).Where("id IN ?", []string{permA.ID.String(), permB.ID.String()}).Count(&count).Error; err != nil {
		t.Fatalf("count permissions: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected permissions deleted, got %d", count)
	}
}

func TestBatchDeleteRejectsInUsePermission(t *testing.T) {
	db := newPermissionTestDB(t)
	service := &permissionService{
		dao:       NewPermissionDAO(db),
		txManager: database.NewTransactionManager(db, nil),
	}

	perm := Permission{
		ID:       uuid.New(),
		Name:     "RoleAssign",
		Code:     "roleassign",
		Type:     "button",
		Status:   "active",
		TenantID: "tenant-a",
	}
	if err := db.Create(&perm).Error; err != nil {
		t.Fatalf("create permission: %v", err)
	}
	if err := db.Exec(
		"INSERT INTO system_role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)",
		uuid.NewString(), "role-1", perm.ID.String(),
	).Error; err != nil {
		t.Fatalf("insert role permission relation: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchDelete(ctx, []string{perm.ID.String()})
	if err == nil {
		t.Fatal("expected error for in-use permission")
	}
	if !strings.Contains(err.Error(), "in use") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestBatchUpdateStatusUpdatesPermissionsAndSyncsRoles(t *testing.T) {
	db := newPermissionTestDB(t)
	authProvider := &stubPermissionAuthProvider{}
	service := &permissionService{
		dao:          NewPermissionDAO(db),
		authProvider: authProvider,
		txManager:    database.NewTransactionManager(db, nil),
	}

	perm := Permission{
		ID:       uuid.New(),
		Name:     "MenuView",
		Code:     "menuview",
		Type:     "menu",
		Resource: "/api/v1/system/menus",
		Action:   "GET",
		Status:   "active",
		TenantID: "tenant-a",
	}
	if err := db.Create(&perm).Error; err != nil {
		t.Fatalf("create permission: %v", err)
	}
	if err := db.Exec(
		"INSERT INTO system_role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)",
		uuid.NewString(), "role-2", perm.ID.String(),
	).Error; err != nil {
		t.Fatalf("insert role permission relation: %v", err)
	}
	if err := db.Exec(
		"INSERT INTO system_user_roles (id, user_id, role_id) VALUES (?, ?, ?)",
		uuid.NewString(), "user-2", "role-2",
	).Error; err != nil {
		t.Fatalf("insert user role relation: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := service.BatchUpdateStatus(ctx, &PermissionStatusRequest{
		PermissionIDs: []string{perm.ID.String()},
		Status:        "inactive",
	}); err != nil {
		t.Fatalf("batch update permission status: %v", err)
	}

	var updated Permission
	if err := db.First(&updated, "id = ?", perm.ID.String()).Error; err != nil {
		t.Fatalf("reload permission: %v", err)
	}
	if updated.Status != "inactive" {
		t.Fatalf("expected inactive status, got %s", updated.Status)
	}
	if len(authProvider.updated) != 1 || authProvider.updated[0] != "role-2" {
		t.Fatalf("expected role permissions updated for role-2, got %#v", authProvider.updated)
	}
	if len(authProvider.bumped) != 1 || authProvider.bumped[0] != "role-2" {
		t.Fatalf("expected auth version bump for role-2, got %#v", authProvider.bumped)
	}
}

func TestBatchUpdateStatusRollsBackOnUpdateFailure(t *testing.T) {
	db := newPermissionTestDB(t)
	authProvider := &stubPermissionAuthProvider{}
	baseDAO := NewPermissionDAO(db)
	service := &permissionService{
		dao: &failingPermissionDAO{
			PermissionDAO:  baseDAO,
			failUpdateAt:   2,
		},
		authProvider: authProvider,
		txManager:    database.NewTransactionManager(db, nil),
	}

	permA := Permission{
		ID:       uuid.New(),
		Name:     "MenuViewA",
		Code:     "menuview-a",
		Type:     "menu",
		Resource: "/api/v1/system/menus/a",
		Action:   "GET",
		Status:   "active",
		TenantID: "tenant-a",
	}
	permB := Permission{
		ID:       uuid.New(),
		Name:     "MenuViewB",
		Code:     "menuview-b",
		Type:     "menu",
		Resource: "/api/v1/system/menus/b",
		Action:   "GET",
		Status:   "active",
		TenantID: "tenant-a",
	}
	if err := db.Create(&permA).Error; err != nil {
		t.Fatalf("create permission A: %v", err)
	}
	if err := db.Create(&permB).Error; err != nil {
		t.Fatalf("create permission B: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchUpdateStatus(ctx, &PermissionStatusRequest{
		PermissionIDs: []string{permA.ID.String(), permB.ID.String()},
		Status:        "inactive",
	})
	if err == nil {
		t.Fatal("expected update failure")
	}

	var permissions []Permission
	if err := db.Where("id IN ?", []string{permA.ID.String(), permB.ID.String()}).Order("code").Find(&permissions).Error; err != nil {
		t.Fatalf("reload permissions: %v", err)
	}
	for _, permission := range permissions {
		if permission.Status != "active" {
			t.Fatalf("expected rollback to keep active status, got %s for %s", permission.Status, permission.Name)
		}
	}
	if len(authProvider.updated) != 0 || len(authProvider.bumped) != 0 {
		t.Fatalf("expected no auth sync on rollback, got updated=%#v bumped=%#v", authProvider.updated, authProvider.bumped)
	}
}

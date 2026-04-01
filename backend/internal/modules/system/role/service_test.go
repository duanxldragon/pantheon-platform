package role

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

type stubRoleUserValidator struct {
	inUse map[string]bool
}

func (s stubRoleUserValidator) CheckRoleInUse(_ context.Context, roleID string) (bool, error) {
	return s.inUse[roleID], nil
}

type stubRoleAuthProvider struct {
	removed       []string
	bumpedRoleIDs []string
	validateErr   error
	validateOK    bool
}

func (s *stubRoleAuthProvider) UpdateRolePermissions(_ context.Context, _ string, _ []PermissionRule) error {
	return nil
}

func (s *stubRoleAuthProvider) BumpRoleUsersAuthVersion(_ context.Context, roleID string) error {
	s.bumpedRoleIDs = append(s.bumpedRoleIDs, roleID)
	return nil
}

func (s *stubRoleAuthProvider) BumpUsersAuthVersion(_ context.Context, _ []string) error {
	return nil
}

func (s *stubRoleAuthProvider) RevokeUsersSessions(_ context.Context, _ []string) error {
	return nil
}

func (s *stubRoleAuthProvider) SyncRoleUsers(_ context.Context, _ string, _ []string, _ bool) error {
	return nil
}

func (s *stubRoleAuthProvider) RemoveRole(_ context.Context, roleID string) error {
	s.removed = append(s.removed, roleID)
	return nil
}

func (s *stubRoleAuthProvider) ValidateDataScope(_ string) (bool, error) {
	if s.validateErr != nil {
		return false, s.validateErr
	}
	return s.validateOK, nil
}

type stubRoleQuotaValidator struct {
	decreased int64
}

func (s *stubRoleQuotaValidator) CheckQuota(_ context.Context, _ string, _ string) error {
	return nil
}

func (s *stubRoleQuotaValidator) IncreaseUsage(_ context.Context, _ string, _ string, _ int64, _ string) error {
	return nil
}

func (s *stubRoleQuotaValidator) DecreaseUsage(_ context.Context, _ string, _ string, amount int64, _ string) error {
	s.decreased += amount
	return nil
}

func newRoleTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	dao := NewRoleDAO(db)
	if err := db.AutoMigrate(dao.GetTenantModels()...); err != nil {
		t.Fatalf("migrate role models: %v", err)
	}

	return db
}

func TestBatchDeleteRemovesRoleRelations(t *testing.T) {
	db := newRoleTestDB(t)
	dao := NewRoleDAO(db)
	authProvider := &stubRoleAuthProvider{}
	quotaValidator := &stubRoleQuotaValidator{}
	service := &roleService{
		dao:            dao,
		userValidator:  stubRoleUserValidator{inUse: map[string]bool{}},
		authProvider:   authProvider,
		quotaValidator: quotaValidator,
		txManager:      database.NewTransactionManager(db, nil),
	}

	roleID := uuid.New()
	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	if err := db.Create(&Role{
		ID:       roleID,
		Name:     "Ops",
		Code:     "ops",
		Type:     "custom",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create role: %v", err)
	}
	if err := db.Create(&RolePermission{
		ID:           uuid.New(),
		RoleID:       roleID,
		PermissionID: uuid.New(),
		TenantID:     "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create role permission: %v", err)
	}
	if err := db.Create(&RoleMenu{
		ID:       uuid.New(),
		RoleID:   roleID,
		MenuID:   uuid.New(),
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create role menu: %v", err)
	}

	if err := service.BatchDelete(ctx, []string{roleID.String(), roleID.String()}); err != nil {
		t.Fatalf("batch delete roles: %v", err)
	}

	var roleCount int64
	if err := db.Model(&Role{}).Where("id = ?", roleID.String()).Count(&roleCount).Error; err != nil {
		t.Fatalf("count roles: %v", err)
	}
	if roleCount != 0 {
		t.Fatalf("expected role to be deleted, got %d", roleCount)
	}

	var permissionCount int64
	if err := db.Model(&RolePermission{}).Where("role_id = ?", roleID.String()).Count(&permissionCount).Error; err != nil {
		t.Fatalf("count role permissions: %v", err)
	}
	if permissionCount != 0 {
		t.Fatalf("expected role permissions to be cleared, got %d", permissionCount)
	}

	var menuCount int64
	if err := db.Model(&RoleMenu{}).Where("role_id = ?", roleID.String()).Count(&menuCount).Error; err != nil {
		t.Fatalf("count role menus: %v", err)
	}
	if menuCount != 0 {
		t.Fatalf("expected role menus to be cleared, got %d", menuCount)
	}

	if len(authProvider.removed) != 1 || authProvider.removed[0] != roleID.String() {
		t.Fatalf("expected removed role %s, got %#v", roleID.String(), authProvider.removed)
	}
	if quotaValidator.decreased != 1 {
		t.Fatalf("expected quota decrease 1, got %d", quotaValidator.decreased)
	}
}

func TestBatchDeleteRejectsSystemRole(t *testing.T) {
	db := newRoleTestDB(t)
	dao := NewRoleDAO(db)
	service := &roleService{
		dao:           dao,
		userValidator: stubRoleUserValidator{inUse: map[string]bool{}},
		txManager:     database.NewTransactionManager(db, nil),
	}

	roleID := uuid.New()
	if err := db.Create(&Role{
		ID:       roleID,
		Name:     "SuperAdmin",
		Code:     "superadmin",
		Type:     "system",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create system role: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchDelete(ctx, []string{roleID.String()})
	if err == nil {
		t.Fatal("expected error for system role")
	}
	if !strings.Contains(err.Error(), "cannot be deleted") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestNormalizeRoleDataScope(t *testing.T) {
	if got := normalizeRoleDataScope("dept", "all"); got != "dept" {
		t.Fatalf("expected dept, got %s", got)
	}
	if got := normalizeRoleDataScope("project:project-a", "all"); got != "project:project-a" {
		t.Fatalf("expected custom rule to be preserved, got %s", got)
	}
	if got := normalizeRoleDataScope("", "self"); got != "self" {
		t.Fatalf("expected self fallback, got %s", got)
	}
	if got := normalizeRoleDataScope("invalid", ""); got != "all" {
		t.Fatalf("expected all fallback, got %s", got)
	}
}

func TestCreateAcceptsValidatedCustomDataScope(t *testing.T) {
	db := newRoleTestDB(t)
	dao := NewRoleDAO(db)
	authProvider := &stubRoleAuthProvider{validateOK: true}
	service := &roleService{
		dao:            dao,
		userValidator:  stubRoleUserValidator{inUse: map[string]bool{}},
		authProvider:   authProvider,
		quotaValidator: &stubRoleQuotaValidator{},
		txManager:      database.NewTransactionManager(db, nil),
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	role, err := service.Create(ctx, &RoleRequest{
		Name:      "Project Ops",
		Code:      "projectops",
		Type:      "custom",
		Status:    "active",
		DataScope: "project:project-a,project-b",
	})
	if err != nil {
		t.Fatalf("create role: %v", err)
	}
	if role.DataScope != "project:project-a,project-b" {
		t.Fatalf("expected preserved data scope, got %s", role.DataScope)
	}
}

func TestCreateRejectsInvalidCustomDataScope(t *testing.T) {
	db := newRoleTestDB(t)
	dao := NewRoleDAO(db)
	authProvider := &stubRoleAuthProvider{validateErr: errors.New("invalid custom scope")}
	service := &roleService{
		dao:            dao,
		userValidator:  stubRoleUserValidator{inUse: map[string]bool{}},
		authProvider:   authProvider,
		quotaValidator: &stubRoleQuotaValidator{},
		txManager:      database.NewTransactionManager(db, nil),
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.Create(ctx, &RoleRequest{
		Name:      "Broken Scope",
		Code:      "brokenscope",
		Type:      "custom",
		Status:    "active",
		DataScope: "custom:password_hash=@user_id",
	})
	if err == nil {
		t.Fatal("expected invalid data scope error")
	}
	if !errors.Is(err, errInvalidRoleDataScope) {
		t.Fatalf("expected invalid role data scope, got %v", err)
	}
}

func TestRoleSchemaMigrationCreatesTenantScopedIndexes(t *testing.T) {
	db := newRoleTestDB(t)

	if err := db.Exec(`CREATE UNIQUE INDEX idx_system_roles_name ON system_roles(name)`).Error; err != nil {
		t.Fatalf("create legacy name index: %v", err)
	}
	if err := db.Exec(`CREATE UNIQUE INDEX idx_system_roles_code ON system_roles(code)`).Error; err != nil {
		t.Fatalf("create legacy code index: %v", err)
	}

	if err := MigrateSchema(db); err != nil {
		t.Fatalf("migrate role schema: %v", err)
	}

	migrator := db.Migrator()
	if migrator.HasIndex(&Role{}, "idx_system_roles_name") {
		t.Fatal("expected legacy role name index to be dropped")
	}
	if migrator.HasIndex(&Role{}, "idx_system_roles_code") {
		t.Fatal("expected legacy role code index to be dropped")
	}
	if !migrator.HasIndex(&Role{}, "uniq_role_tenant_name") {
		t.Fatal("expected tenant name unique index to exist")
	}
	if !migrator.HasIndex(&Role{}, "uniq_role_tenant_code") {
		t.Fatal("expected tenant code unique index to exist")
	}
}

func TestUpdateBumpsRoleUsersWhenDataScopeChanges(t *testing.T) {
	db := newRoleTestDB(t)
	dao := NewRoleDAO(db)
	authProvider := &stubRoleAuthProvider{}
	service := &roleService{
		dao:           dao,
		userValidator: stubRoleUserValidator{inUse: map[string]bool{}},
		authProvider:  authProvider,
		txManager:     database.NewTransactionManager(db, nil),
	}

	roleID := uuid.New()
	if err := db.Create(&Role{
		ID:        roleID,
		Name:      "Ops",
		Code:      "ops",
		Type:      "custom",
		Status:    "active",
		DataScope: "self",
		TenantID:  "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create role: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	updateReq := &RoleUpdateRequest{DataScope: stringPtr("dept")}
	updated, err := service.Update(ctx, roleID.String(), updateReq)
	if err != nil {
		t.Fatalf("update role: %v", err)
	}
	if updated.DataScope != "dept" {
		t.Fatalf("expected updated data scope dept, got %s", updated.DataScope)
	}
	if len(authProvider.bumpedRoleIDs) != 1 || authProvider.bumpedRoleIDs[0] != roleID.String() {
		t.Fatalf("expected bumped role %s, got %#v", roleID.String(), authProvider.bumpedRoleIDs)
	}
}

func TestUpdateAppliesCodeAndDescription(t *testing.T) {
	db := newRoleTestDB(t)
	dao := NewRoleDAO(db)
	service := &roleService{
		dao:           dao,
		userValidator: stubRoleUserValidator{inUse: map[string]bool{}},
		authProvider:  &stubRoleAuthProvider{validateOK: true},
		txManager:     database.NewTransactionManager(db, nil),
	}

	roleID := uuid.New()
	if err := db.Create(&Role{
		ID:          roleID,
		Name:        "Ops",
		Code:        "ops",
		Description: "old",
		Type:        "custom",
		Status:      "active",
		DataScope:   "self",
		TenantID:    "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create role: %v", err)
	}

	newCode := "ops_new"
	newDesc := "new description"
	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	updated, err := service.Update(ctx, roleID.String(), &RoleUpdateRequest{
		Code:        &newCode,
		Description: &newDesc,
	})
	if err != nil {
		t.Fatalf("update role: %v", err)
	}
	if updated.Code != newCode {
		t.Fatalf("expected updated code %s, got %s", newCode, updated.Code)
	}
	if updated.Description != newDesc {
		t.Fatalf("expected updated description %s, got %s", newDesc, updated.Description)
	}
}

func TestCreateRejectsDuplicateRoleName(t *testing.T) {
	db := newRoleTestDB(t)
	dao := NewRoleDAO(db)
	service := &roleService{
		dao:            dao,
		userValidator:  stubRoleUserValidator{inUse: map[string]bool{}},
		authProvider:   &stubRoleAuthProvider{validateOK: true},
		quotaValidator: &stubRoleQuotaValidator{},
		txManager:      database.NewTransactionManager(db, nil),
	}

	if err := db.Create(&Role{
		ID:       uuid.New(),
		Name:     "Ops",
		Code:     "ops",
		Type:     "custom",
		Status:   "active",
		TenantID: "tenant-a",
	}).Error; err != nil {
		t.Fatalf("seed role: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.Create(ctx, &RoleRequest{
		Name:      "Ops",
		Code:      "ops2",
		Type:      "custom",
		Status:    "active",
		DataScope: "all",
	})
	if !errors.Is(err, errRoleNameExists) {
		t.Fatalf("expected duplicate role name error, got %v", err)
	}
}

func TestListAppliesSearchAndTypeFilters(t *testing.T) {
	db := newRoleTestDB(t)
	dao := NewRoleDAO(db)
	service := &roleService{
		dao:           dao,
		userValidator: stubRoleUserValidator{inUse: map[string]bool{}},
		authProvider:  &stubRoleAuthProvider{validateOK: true},
		txManager:     database.NewTransactionManager(db, nil),
	}

	seed := []Role{
		{ID: uuid.New(), Name: "Ops Admin", Code: "ops_admin", Type: "custom", Status: "active", TenantID: "tenant-a"},
		{ID: uuid.New(), Name: "Ops Viewer", Code: "ops_viewer", Type: "system", Status: "active", TenantID: "tenant-a"},
		{ID: uuid.New(), Name: "Finance Admin", Code: "finance_admin", Type: "custom", Status: "inactive", TenantID: "tenant-a"},
	}
	for _, item := range seed {
		record := item
		if err := db.Create(&record).Error; err != nil {
			t.Fatalf("seed role: %v", err)
		}
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	resp, err := service.List(ctx, &RoleListRequest{
		Page:     1,
		PageSize: 20,
		Search:   "ops",
		Type:     "custom",
		Status:   "active",
	})
	if err != nil {
		t.Fatalf("list roles: %v", err)
	}

	items, ok := resp.Items.([]*RoleResponse)
	if !ok {
		t.Fatalf("expected role response slice, got %T", resp.Items)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 filtered role, got %d", len(items))
	}
	if items[0].Code != "ops_admin" {
		t.Fatalf("expected ops_admin, got %s", items[0].Code)
	}
}

func stringPtr(value string) *string {
	return &value
}

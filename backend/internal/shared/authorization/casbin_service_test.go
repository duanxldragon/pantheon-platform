package service

import (
	"context"
	"fmt"
	"path/filepath"
	"reflect"
	"sort"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	systemrole "pantheon-platform/backend/internal/modules/system/role"
)

func newAuthorizationServiceTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&systemrole.CasbinRule{}); err != nil {
		t.Fatalf("migrate casbin rule: %v", err)
	}
	return db
}

func createAuthorizationScopeTables(t *testing.T, db *gorm.DB) {
	t.Helper()

	statements := []string{
		`CREATE TABLE system_roles (id TEXT PRIMARY KEY, data_scope TEXT)`,
		`CREATE TABLE system_user_roles (user_id TEXT, role_id TEXT)`,
		`CREATE TABLE system_users (id TEXT PRIMARY KEY, department_id TEXT)`,
		`CREATE TABLE system_dept (id TEXT PRIMARY KEY, parent_id TEXT, status TEXT)`,
	}

	for _, stmt := range statements {
		if err := db.Exec(stmt).Error; err != nil {
			t.Fatalf("exec %q: %v", stmt, err)
		}
	}
}

func TestGetUserPermissionsIncludesDirectPoliciesAndDeduplicates(t *testing.T) {
	db := newAuthorizationServiceTestDB(t)
	modelPath := filepath.Join("..", "..", "..", "config", "rbac_model.conf")

	service, err := NewAuthorizationService(db, modelPath)
	if err != nil {
		t.Fatalf("new authorization service: %v", err)
	}

	ctx := context.Background()
	if err := service.AddRoleForUser(ctx, "user-1", "role-1"); err != nil {
		t.Fatalf("add role for user: %v", err)
	}
	if err := service.AddPermissionForRole(ctx, "role-1", "/api/v1/system/users", "get"); err != nil {
		t.Fatalf("add first role permission: %v", err)
	}
	if err := service.AddPermissionForRole(ctx, "role-1", "/api/v1/system/users", "get"); err != nil {
		t.Fatalf("add duplicate role permission: %v", err)
	}

	enforcer, err := service.getEnforcer(ctx)
	if err != nil {
		t.Fatalf("get enforcer: %v", err)
	}
	if _, err := enforcer.AddPolicy("user-1", "/api/v1/system/profile", "get"); err != nil {
		t.Fatalf("add direct user policy: %v", err)
	}

	permissions, err := service.GetUserPermissions(ctx, "user-1")
	if err != nil {
		t.Fatalf("get user permissions: %v", err)
	}

	if len(permissions) != 2 {
		t.Fatalf("expected 2 unique permissions, got %#v", permissions)
	}
	if permissions[0] != "/api/v1/system/profile:get" {
		t.Fatalf("unexpected first permission: %#v", permissions)
	}
	if permissions[1] != "/api/v1/system/users:get" {
		t.Fatalf("unexpected second permission: %#v", permissions)
	}
}

func TestCheckDataScopeTreatsPrefixedRulesAsCustom(t *testing.T) {
	db := newAuthorizationServiceTestDB(t)
	createAuthorizationScopeTables(t, db)
	modelPath := filepath.Join("..", "..", "..", "config", "rbac_model.conf")

	service, err := NewAuthorizationService(db, modelPath)
	if err != nil {
		t.Fatalf("new authorization service: %v", err)
	}

	if err := db.Exec(`INSERT INTO system_roles (id, data_scope) VALUES (?, ?)`, "role-1", "project:project-a,project-b").Error; err != nil {
		t.Fatalf("insert role: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_user_roles (user_id, role_id) VALUES (?, ?)`, "user-1", "role-1").Error; err != nil {
		t.Fatalf("insert user role: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_db", db)
	scope, err := service.CheckDataScope(ctx, "user-1", "/api/v1/system/users")
	if err != nil {
		t.Fatalf("check data scope: %v", err)
	}
	if scope != DataScopeCustom {
		t.Fatalf("expected custom scope, got %s", scope)
	}
}

func TestGetDataScopeFilterParsesProjectScopeRule(t *testing.T) {
	db := newAuthorizationServiceTestDB(t)
	createAuthorizationScopeTables(t, db)
	modelPath := filepath.Join("..", "..", "..", "config", "rbac_model.conf")

	service, err := NewAuthorizationService(db, modelPath)
	if err != nil {
		t.Fatalf("new authorization service: %v", err)
	}

	if err := db.Exec(`INSERT INTO system_roles (id, data_scope) VALUES (?, ?)`, "role-1", "project: project-a, project-b, project-a ").Error; err != nil {
		t.Fatalf("insert role: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_user_roles (user_id, role_id) VALUES (?, ?)`, "user-1", "role-1").Error; err != nil {
		t.Fatalf("insert user role: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_db", db)
	filter, err := service.GetDataScopeFilter(ctx, "user-1", "/api/v1/system/users")
	if err != nil {
		t.Fatalf("get data scope filter: %v", err)
	}

	got, ok := filter["project_id"].([]string)
	if !ok {
		t.Fatalf("expected project_id filter, got %#v", filter)
	}
	want := []string{"project-a", "project-b"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("unexpected project filter: got %#v want %#v", got, want)
	}
}

func TestGetDataScopeFilterParsesDepartmentTreePlaceholder(t *testing.T) {
	db := newAuthorizationServiceTestDB(t)
	createAuthorizationScopeTables(t, db)
	modelPath := filepath.Join("..", "..", "..", "config", "rbac_model.conf")

	service, err := NewAuthorizationService(db, modelPath)
	if err != nil {
		t.Fatalf("new authorization service: %v", err)
	}

	if err := db.Exec(`INSERT INTO system_roles (id, data_scope) VALUES (?, ?)`, "role-1", "custom:department_id=@department_and_sub_ids").Error; err != nil {
		t.Fatalf("insert role: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_user_roles (user_id, role_id) VALUES (?, ?)`, "user-1", "role-1").Error; err != nil {
		t.Fatalf("insert user role: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_users (id, department_id) VALUES (?, ?)`, "user-1", "dept-root").Error; err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_dept (id, parent_id, status) VALUES (?, ?, ?)`, "dept-root", nil, "active").Error; err != nil {
		t.Fatalf("insert root dept: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_dept (id, parent_id, status) VALUES (?, ?, ?)`, "dept-child", "dept-root", "active").Error; err != nil {
		t.Fatalf("insert child dept: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_db", db)
	filter, err := service.GetDataScopeFilter(ctx, "user-1", "/api/v1/system/users")
	if err != nil {
		t.Fatalf("get data scope filter: %v", err)
	}

	got, ok := filter["department_id"].([]string)
	if !ok {
		t.Fatalf("expected department_id filter slice, got %#v", filter)
	}
	sort.Strings(got)
	want := []string{"dept-child", "dept-root"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("unexpected department filter: got %#v want %#v", got, want)
	}
}

func TestParseCustomScopeRuleRejectsUnsupportedField(t *testing.T) {
	db := newAuthorizationServiceTestDB(t)
	modelPath := filepath.Join("..", "..", "..", "config", "rbac_model.conf")

	service, err := NewAuthorizationService(db, modelPath)
	if err != nil {
		t.Fatalf("new authorization service: %v", err)
	}

	ok, err := service.ParseCustomScopeRule("custom:password_hash=@user_id")
	if err == nil {
		t.Fatal("expected invalid custom field error")
	}
	if ok {
		t.Fatal("expected rule validation to fail")
	}
}

func TestCheckPermissionAllowsExactWildcardPolicyResource(t *testing.T) {
	db := newAuthorizationServiceTestDB(t)
	modelPath := filepath.Join("..", "..", "..", "config", "rbac_model.conf")

	service, err := NewAuthorizationService(db, modelPath)
	if err != nil {
		t.Fatalf("new authorization service: %v", err)
	}

	ctx := context.Background()
	if err := service.AddRoleForUser(ctx, "user-1", "role-1"); err != nil {
		t.Fatalf("add role for user: %v", err)
	}
	if err := service.AddPermissionForRole(ctx, "role-1", "/api/v1/tenants/*", "*"); err != nil {
		t.Fatalf("add wildcard policy: %v", err)
	}

	if !service.CheckPermission(ctx, "user-1", "/api/v1/tenants/*", "*") {
		t.Fatal("expected exact wildcard permission resource to be allowed")
	}
}

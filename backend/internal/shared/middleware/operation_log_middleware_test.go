package middleware

import (
	"context"
	"testing"

	"pantheon-platform/backend/internal/shared/audit"
)

func TestBuildOperationAuditMetaForRolePermissions(t *testing.T) {
	req := map[string]interface{}{
		"permission_ids": []interface{}{"perm-1", "perm-2", "perm-3"},
	}

	meta := buildOperationAuditMeta(
		"/api/v1/system/roles/role-123/permissions",
		"POST",
		"role-123",
		req,
		nil,
	)

	if meta.Module != "system/roles" {
		t.Fatalf("unexpected module: %s", meta.Module)
	}
	if meta.Resource != "role_permission" {
		t.Fatalf("unexpected resource: %s", meta.Resource)
	}
	if meta.ResourceID != "role-123" {
		t.Fatalf("unexpected resource id: %s", meta.ResourceID)
	}
	if meta.Summary != "为角色（ID: role-123）分配 3 项权限" {
		t.Fatalf("unexpected summary: %s", meta.Summary)
	}
}

func TestBuildOperationAuditMetaForUserStatus(t *testing.T) {
	req := map[string]interface{}{
		"user_ids": []interface{}{"u1", "u2"},
		"status":   "inactive",
	}

	meta := buildOperationAuditMeta(
		"/api/v1/system/users/status",
		"PATCH",
		"",
		req,
		nil,
	)

	if meta.Resource != "user_status" {
		t.Fatalf("unexpected resource: %s", meta.Resource)
	}
	if meta.Summary != "批量将 2 个用户设置为停用" {
		t.Fatalf("unexpected summary: %s", meta.Summary)
	}
	if meta.Detail == "" {
		t.Fatal("expected detail to be generated")
	}
}

func TestExtractOperationErrorMessage(t *testing.T) {
	resp := map[string]interface{}{
		"code":    "UPDATE_ROLE_FAILED",
		"message": "角色更新失败",
	}

	got := extractOperationErrorMessage(500, "", resp)
	if got != "角色更新失败" {
		t.Fatalf("unexpected error message: %s", got)
	}
}

func TestMergeOperationAuditMeta(t *testing.T) {
	ctx, collector := audit.WithOperationContext(context.Background())
	collector.Set(audit.OperationFields{
		ResourceName: "管理员",
		Summary:      "禁用角色「管理员」，影响 4 个用户并强制失效会话",
		Detail:       "角色ID=role-1；affected_users=4",
	})

	base := operationAuditMeta{
		Module:     "system/roles",
		Resource:   "role",
		ResourceID: "role-1",
		Summary:    "更新角色",
	}

	merged := mergeOperationAuditMeta(base, audit.FromContext(ctx))
	if merged.ResourceName != "管理员" {
		t.Fatalf("unexpected resource name: %s", merged.ResourceName)
	}
	if merged.Summary != "禁用角色「管理员」，影响 4 个用户并强制失效会话" {
		t.Fatalf("unexpected summary: %s", merged.Summary)
	}
	if merged.Detail == "" {
		t.Fatal("expected detail to be merged")
	}
}

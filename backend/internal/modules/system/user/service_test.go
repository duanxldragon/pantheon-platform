package user

import (
	"testing"

	"github.com/google/uuid"
)

func TestBuildUserRoleAuditSummary(t *testing.T) {
	before := []*UserRoleInfo{
		{ID: "role-1", Name: "管理员"},
		{ID: "role-2", Name: "审计员"},
	}
	after := []*UserRoleInfo{
		{ID: "role-1", Name: "管理员"},
		{ID: "role-3", Name: "运维"},
	}

	got := buildUserRoleAuditSummary("alice", before, after)
	want := "更新用户「alice」角色：新增 1 个角色，移除 1 个角色，当前共 2 个角色"
	if got != want {
		t.Fatalf("unexpected summary: %s", got)
	}
}

func TestBuildUserUpdateAuditSummaryForStatus(t *testing.T) {
	got := buildUserUpdateAuditSummary("alice", "active", stringPtr("inactive"), nil, nil, "", "", "", "")
	want := "将用户「alice」设置为停用并强制其会话失效"
	if got != want {
		t.Fatalf("unexpected summary: %s", got)
	}
}

func TestBuildUserAuditDetail(t *testing.T) {
	before := []*UserRoleInfo{{ID: "role-1", Name: "管理员"}}
	after := []*UserRoleInfo{{ID: "role-2", Name: "运维"}}

	detail := buildUserAuditDetail("alice", "Alice", before, after, map[string]string{
		"action":           "assign_role",
		"refresh_strategy": "bump_auth_version",
	})

	if detail == "" {
		t.Fatal("expected detail to be generated")
	}
}

func TestBuildUserOrgAuditSummary(t *testing.T) {
	got := buildUserOrgAuditSummary("alice", "研发部", "运维部", "", "值班")
	want := "更新用户「alice」组织归属：部门由「研发部」调整为「运维部」，加入岗位「值班」"
	if got != want {
		t.Fatalf("unexpected org summary: %s", got)
	}
}

func TestUserMatchesDataScope(t *testing.T) {
	departmentID := "dept-a"
	record := &User{
		ID:           uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		DepartmentID: &departmentID,
	}

	if !userMatchesDataScope(record, map[string]interface{}{"id": record.ID.String()}) {
		t.Fatal("expected self scope to match exact user id")
	}
	if userMatchesDataScope(record, map[string]interface{}{"id": "22222222-2222-2222-2222-222222222222"}) {
		t.Fatal("expected self scope mismatch")
	}
	if !userMatchesDataScope(record, map[string]interface{}{"department_id": []string{"dept-x", "dept-a"}}) {
		t.Fatal("expected department scope to match user department")
	}
	if userMatchesDataScope(record, map[string]interface{}{"department_id": "dept-x"}) {
		t.Fatal("expected department scope mismatch")
	}
}

func stringPtr(value string) *string {
	return &value
}

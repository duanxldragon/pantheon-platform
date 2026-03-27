package user

import "testing"

func TestBuildUserRoleAuditSummary(t *testing.T) {
	before := []*UserRoleInfo{
		{ID: "role-1", Name: "\u7ba1\u7406\u5458"},
		{ID: "role-2", Name: "\u5ba1\u8ba1\u5458"},
	}
	after := []*UserRoleInfo{
		{ID: "role-1", Name: "\u7ba1\u7406\u5458"},
		{ID: "role-3", Name: "\u8fd0\u7ef4"},
	}

	got := buildUserRoleAuditSummary("alice", before, after)
	want := "\u66f4\u65b0\u7528\u6237\u300calice\u300d\u89d2\u8272\uff1a\u65b0\u589e 1 \u4e2a\u89d2\u8272\uff0c\u79fb\u9664 1 \u4e2a\u89d2\u8272\uff0c\u5f53\u524d\u5171 2 \u4e2a\u89d2\u8272"
	if got != want {
		t.Fatalf("unexpected summary: %s", got)
	}
}

func TestBuildUserUpdateAuditSummaryForStatus(t *testing.T) {
	got := buildUserUpdateAuditSummary("alice", "active", stringPtr("inactive"), nil, nil, "", "", "", "")
	want := "\u5c06\u7528\u6237\u300calice\u300d\u8bbe\u7f6e\u4e3a\u505c\u7528\u5e76\u5f3a\u5236\u5176\u4f1a\u8bdd\u5931\u6548"
	if got != want {
		t.Fatalf("unexpected summary: %s", got)
	}
}

func TestBuildUserAuditDetail(t *testing.T) {
	before := []*UserRoleInfo{{ID: "role-1", Name: "\u7ba1\u7406\u5458"}}
	after := []*UserRoleInfo{{ID: "role-2", Name: "\u8fd0\u7ef4"}}

	detail := buildUserAuditDetail("alice", "Alice", before, after, map[string]string{
		"action":           "assign_role",
		"refresh_strategy": "bump_auth_version",
	})

	if detail == "" {
		t.Fatal("expected detail to be generated")
	}
}

func TestBuildUserOrgAuditSummary(t *testing.T) {
	got := buildUserOrgAuditSummary("alice", "\u7814\u53d1\u90e8", "\u8fd0\u7ef4\u90e8", "", "\u503c\u73ed")
	want := "\u66f4\u65b0\u7528\u6237\u300calice\u300d\u7ec4\u7ec7\u5f52\u5c5e\uff1a\u90e8\u95e8\u7531\u300c\u7814\u53d1\u90e8\u300d\u8c03\u6574\u4e3a\u300c\u8fd0\u7ef4\u90e8\u300d\uff0c\u52a0\u5165\u5c97\u4f4d\u300c\u503c\u73ed\u300d"
	if got != want {
		t.Fatalf("unexpected org summary: %s", got)
	}
}

func stringPtr(value string) *string {
	return &value
}

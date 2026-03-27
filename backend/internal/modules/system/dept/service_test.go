package dept

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestBuildDepartmentAuditSummary(t *testing.T) {
	got := buildDepartmentAuditSummary("update", "\u7814\u53d1\u90e8", "active", 3)
	want := "\u66f4\u65b0\u90e8\u95e8\u300c\u7814\u53d1\u90e8\u300d\uff0c\u5f71\u54cd 3 \u4e2a\u7528\u6237\u5e76\u5237\u65b0\u6743\u9650"
	if got != want {
		t.Fatalf("unexpected summary: %s", got)
	}
}

func TestBuildDepartmentAuditDetail(t *testing.T) {
	got := buildDepartmentAuditDetail("dept-1", "\u7814\u53d1\u90e8", map[string]string{
		"code":             "rd",
		"affected_users":   "2",
		"refresh_strategy": "bump_auth_version",
	})

	for _, item := range []string{"\u90e8\u95e8ID=dept-1", "\u90e8\u95e8\u540d\u79f0=\u7814\u53d1\u90e8", "code=rd", "affected_users=2"} {
		if !strings.Contains(got, item) {
			t.Fatalf("expected %q in %q", item, got)
		}
	}
}

func TestToDepartmentResponseIncludesContactFields(t *testing.T) {
	department := &Department{
		ID:    uuid.New(),
		Name:  "研发部",
		Code:  "rd",
		Phone: "13800138000",
		Email: "rd@example.com",
	}

	resp := ToDepartmentResponse(department, nil, nil)
	if resp.Phone != "13800138000" || resp.Email != "rd@example.com" {
		t.Fatalf("unexpected contact fields: %#v", resp)
	}
}

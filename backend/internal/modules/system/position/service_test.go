package position

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestBuildPositionAuditSummary(t *testing.T) {
	got := buildPositionAuditSummary("delete", "\u503c\u73ed\u5de5\u7a0b\u5e08", "active", 2)
	want := "\u5220\u9664\u5c97\u4f4d\u300c\u503c\u73ed\u5de5\u7a0b\u5e08\u300d\uff0c\u5f71\u54cd 2 \u4e2a\u7528\u6237\u5e76\u5237\u65b0\u6743\u9650"
	if got != want {
		t.Fatalf("unexpected summary: %s", got)
	}
}

func TestBuildPositionAuditDetail(t *testing.T) {
	got := buildPositionAuditDetail("pos-1", "\u503c\u73ed\u5de5\u7a0b\u5e08", map[string]string{
		"code":             "duty",
		"affected_users":   "4",
		"refresh_strategy": "bump_auth_version",
	})

	for _, item := range []string{"\u5c97\u4f4dID=pos-1", "\u5c97\u4f4d\u540d\u79f0=\u503c\u73ed\u5de5\u7a0b\u5e08", "code=duty", "affected_users=4"} {
		if !strings.Contains(got, item) {
			t.Fatalf("expected %q in %q", item, got)
		}
	}
}

type stubDeptValidator struct {
	exists bool
	err    error
}

func (s stubDeptValidator) GetDeptName(_ context.Context, _ string) (string, error) {
	return "", nil
}

func (s stubDeptValidator) CheckDeptExists(_ context.Context, _ string) (bool, error) {
	return s.exists, s.err
}

func TestResolveDepartmentID(t *testing.T) {
	service := &positionService{deptValidator: stubDeptValidator{exists: true}}
	departmentID := uuid.NewString()

	got, err := service.resolveDepartmentID(context.Background(), &departmentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil || got.String() != departmentID {
		t.Fatalf("unexpected department id: %#v", got)
	}
}

func TestResolveDepartmentIDRejectsInactiveDepartment(t *testing.T) {
	service := &positionService{deptValidator: stubDeptValidator{exists: false}}
	departmentID := uuid.NewString()

	got, err := service.resolveDepartmentID(context.Background(), &departmentID)
	if err == nil {
		t.Fatal("expected error for inactive department")
	}
	if got != nil {
		t.Fatalf("expected nil department id, got %#v", got)
	}
}

func TestToPositionResponseIncludesExtendedFields(t *testing.T) {
	position := &Position{
		ID:               uuid.New(),
		Name:             "SRE",
		Code:             "sre",
		Category:         "技术岗",
		Description:      "岗位描述",
		Level:            3,
		Sort:             8,
		Status:           "active",
		Responsibilities: "负责平台稳定性",
		Requirements:     "熟悉 Go 与 Kubernetes",
	}

	resp := ToPositionResponse(position, nil)
	if resp.Category != "技术岗" || resp.Sort != 8 {
		t.Fatalf("unexpected response fields: %#v", resp)
	}
	if resp.Responsibilities == "" || resp.Requirements == "" {
		t.Fatalf("expected responsibilities and requirements in response: %#v", resp)
	}
}

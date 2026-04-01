package log

import (
	"context"
	"testing"
	"time"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type stubLogAuthProvider struct {
	filter map[string]interface{}
}

func (s *stubLogAuthProvider) GetDataScopeFilter(context.Context, string, string) (map[string]interface{}, error) {
	return s.filter, nil
}

func TestApplyDataScopeFilterRestrictsLogsToCurrentUser(t *testing.T) {
	service := &logService{
		authProvider: &stubLogAuthProvider{
			filter: map[string]interface{}{"user_id": "user-1"},
		},
	}

	ctx := context.WithValue(context.Background(), "user_id", "user-1")
	filter := service.applyDataScopeFilter(ctx, &LogFilter{}, "/api/v1/system/logs/login")
	if filter.UserID != "user-1" {
		t.Fatalf("expected scoped user id user-1, got %s", filter.UserID)
	}
}

func TestApplyDataScopeFilterFailsClosedWhenScopeCannotMapToLogs(t *testing.T) {
	service := &logService{
		authProvider: &stubLogAuthProvider{
			filter: map[string]interface{}{"department_id": []string{"dept-1"}},
		},
	}

	ctx := context.WithValue(context.Background(), "user_id", "user-1")
	filter := service.applyDataScopeFilter(ctx, &LogFilter{}, "/api/v1/system/logs/operation")
	if filter.UserID != "__no_access__" {
		t.Fatalf("expected fail-closed marker, got %s", filter.UserID)
	}
}

type stubOperationLogDAO struct {
	clearTenantID string
	clearFilter   *LogFilter
}

func (s *stubOperationLogDAO) Create(context.Context, OperationLog) error { return nil }
func (s *stubOperationLogDAO) GetByID(context.Context, interface{}) (OperationLog, error) {
	return OperationLog{}, nil
}
func (s *stubOperationLogDAO) Update(context.Context, OperationLog) error { return nil }
func (s *stubOperationLogDAO) Delete(context.Context, interface{}) error   { return nil }
func (s *stubOperationLogDAO) List(context.Context, int, int, map[string]interface{}) ([]OperationLog, int64, error) {
	return nil, 0, nil
}
func (s *stubOperationLogDAO) Count(context.Context, map[string]interface{}) (int64, error) {
	return 0, nil
}
func (s *stubOperationLogDAO) SoftDelete(context.Context, interface{}) error { return nil }
func (s *stubOperationLogDAO) Restore(context.Context, interface{}) error    { return nil }
func (s *stubOperationLogDAO) BatchCreate(context.Context, []OperationLog) error {
	return nil
}
func (s *stubOperationLogDAO) BatchUpdate(context.Context, []OperationLog) error { return nil }
func (s *stubOperationLogDAO) BatchDelete(context.Context, []interface{}) error   { return nil }
func (s *stubOperationLogDAO) WithTx(*gorm.DB) database.DAO[OperationLog]         { return s }
func (s *stubOperationLogDAO) GetTenantModels() []interface{}                     { return nil }
func (s *stubOperationLogDAO) ListLogs(context.Context, int, int, *LogFilter) ([]*OperationLog, int64, error) {
	return nil, 0, nil
}
func (s *stubOperationLogDAO) ClearLogs(_ context.Context, tenantID string, filter *LogFilter) error {
	s.clearTenantID = tenantID
	s.clearFilter = filter
	return nil
}

type stubLoginLogDAO struct {
	clearTenantID string
	clearFilter   *LogFilter
}

func (s *stubLoginLogDAO) Create(context.Context, LoginLog) error { return nil }
func (s *stubLoginLogDAO) GetByID(context.Context, interface{}) (LoginLog, error) {
	return LoginLog{}, nil
}
func (s *stubLoginLogDAO) Update(context.Context, LoginLog) error { return nil }
func (s *stubLoginLogDAO) Delete(context.Context, interface{}) error {
	return nil
}
func (s *stubLoginLogDAO) List(context.Context, int, int, map[string]interface{}) ([]LoginLog, int64, error) {
	return nil, 0, nil
}
func (s *stubLoginLogDAO) Count(context.Context, map[string]interface{}) (int64, error) {
	return 0, nil
}
func (s *stubLoginLogDAO) SoftDelete(context.Context, interface{}) error { return nil }
func (s *stubLoginLogDAO) Restore(context.Context, interface{}) error    { return nil }
func (s *stubLoginLogDAO) BatchCreate(context.Context, []LoginLog) error { return nil }
func (s *stubLoginLogDAO) BatchUpdate(context.Context, []LoginLog) error { return nil }
func (s *stubLoginLogDAO) BatchDelete(context.Context, []interface{}) error {
	return nil
}
func (s *stubLoginLogDAO) WithTx(*gorm.DB) database.DAO[LoginLog] { return s }
func (s *stubLoginLogDAO) GetTenantModels() []interface{}         { return nil }
func (s *stubLoginLogDAO) ListLogs(context.Context, int, int, *LogFilter) ([]*LoginLog, int64, error) {
	return nil, 0, nil
}
func (s *stubLoginLogDAO) ClearLogs(_ context.Context, tenantID string, filter *LogFilter) error {
	s.clearTenantID = tenantID
	s.clearFilter = filter
	return nil
}
func (s *stubLoginLogDAO) MarkLogout(context.Context, string, time.Time) error { return nil }

func TestClearOperationLogsRespectsDataScope(t *testing.T) {
	opDAO := &stubOperationLogDAO{}
	service := &logService{
		opDAO: opDAO,
		authProvider: &stubLogAuthProvider{
			filter: map[string]interface{}{"user_id": "user-1"},
		},
	}

	ctx := context.WithValue(context.Background(), "user_id", "user-1")
	ctx = context.WithValue(ctx, "tenant_id", "tenant-1")

	if err := service.ClearOperationLogs(ctx, nil, nil); err != nil {
		t.Fatalf("expected clear logs to succeed: %v", err)
	}
	if opDAO.clearTenantID != "tenant-1" {
		t.Fatalf("expected tenant tenant-1, got %s", opDAO.clearTenantID)
	}
	if opDAO.clearFilter == nil || opDAO.clearFilter.UserID != "user-1" {
		t.Fatalf("expected scoped user filter, got %#v", opDAO.clearFilter)
	}
}

func TestClearLoginLogsFailsClosedWhenScopeCannotMapToLogs(t *testing.T) {
	loginDAO := &stubLoginLogDAO{}
	service := &logService{
		loginDAO: loginDAO,
		authProvider: &stubLogAuthProvider{
			filter: map[string]interface{}{"department_id": []string{"dept-1"}},
		},
	}

	ctx := context.WithValue(context.Background(), "user_id", "user-1")
	ctx = context.WithValue(ctx, "tenant_id", "tenant-1")

	if err := service.ClearLoginLogs(ctx, nil, nil); err != nil {
		t.Fatalf("expected clear logs to succeed: %v", err)
	}
	if loginDAO.clearTenantID != "tenant-1" {
		t.Fatalf("expected tenant tenant-1, got %s", loginDAO.clearTenantID)
	}
	if loginDAO.clearFilter == nil || loginDAO.clearFilter.UserID != "__no_access__" {
		t.Fatalf("expected fail-closed filter, got %#v", loginDAO.clearFilter)
	}
}

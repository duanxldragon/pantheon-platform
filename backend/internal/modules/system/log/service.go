package log

import (
	"context"
	"time"

	"gorm.io/gorm"
)

type LogService interface {
	CreateOperationLog(ctx context.Context, log *OperationLog) error
	ListOperationLogs(ctx context.Context, page, pageSize int, filter *LogFilter) (*PageResponse, error)
	ClearOperationLogs(ctx context.Context, startDate, endDate *time.Time) error

	CreateLoginLog(ctx context.Context, log *LoginLog) error
	ListLoginLogs(ctx context.Context, page, pageSize int, filter *LogFilter) (*PageResponse, error)
	ClearLoginLogs(ctx context.Context, startDate, endDate *time.Time) error
	MarkLogout(ctx context.Context, userID string) error
}

type AuthorizationProvider interface {
	GetDataScopeFilter(ctx context.Context, userID, resource string) (map[string]interface{}, error)
}

type logService struct {
	opDAO             OperationLogDAO
	loginDAO          LoginLogDAO
	monitorDB         *gorm.DB
	enableMonitorSync bool
	authProvider      AuthorizationProvider
}

func NewLogService(opDAO OperationLogDAO, loginDAO LoginLogDAO, monitorDB *gorm.DB, authProvider AuthorizationProvider) LogService {
	return &logService{
		opDAO:             opDAO,
		loginDAO:          loginDAO,
		monitorDB:         monitorDB,
		enableMonitorSync: true,
		authProvider:      authProvider,
	}
}

func (s *logService) CreateOperationLog(ctx context.Context, log *OperationLog) error {
	tenantID := getTenantID(ctx)
	log.TenantID = tenantID
	err := s.opDAO.Create(ctx, *log)
	if err == nil && s.enableMonitorSync && s.monitorDB != nil {
		go func(record OperationLog, currentTenantID string) {
			record.TenantID = currentTenantID
			_ = s.monitorDB.Table("monitor_oper_logs").Create(&record).Error
		}(*log, tenantID)
	}
	return err
}

func (s *logService) ListOperationLogs(ctx context.Context, page, pageSize int, filter *LogFilter) (*PageResponse, error) {
	filter = s.applyDataScopeFilter(ctx, filter, "/api/v1/system/logs/operation")
	logs, total, err := s.opDAO.ListLogs(ctx, page, pageSize, filter)
	if err != nil {
		return nil, err
	}

	items := make([]*OperationLogResponse, len(logs))
	for i, record := range logs {
		items[i] = ToOperationLogResponse(record)
	}

	return &PageResponse{
		Items:      items,
		Pagination: Pagination{Page: int64(page), PageSize: int64(pageSize), Total: total},
	}, nil
}

func (s *logService) ClearOperationLogs(ctx context.Context, startDate, endDate *time.Time) error {
	filter := s.applyDataScopeFilter(ctx, &LogFilter{
		StartDate: startDate,
		EndDate:   endDate,
	}, "/api/v1/system/logs/operation")
	return s.opDAO.ClearLogs(ctx, getTenantID(ctx), filter)
}

func (s *logService) CreateLoginLog(ctx context.Context, log *LoginLog) error {
	tenantID := getTenantID(ctx)
	log.TenantID = tenantID
	err := s.loginDAO.Create(ctx, *log)
	if err == nil && s.enableMonitorSync && s.monitorDB != nil {
		go func(record LoginLog, currentTenantID string) {
			record.TenantID = currentTenantID
			_ = s.monitorDB.Table("monitor_login_logs").Create(&record).Error
		}(*log, tenantID)
	}
	return err
}

func (s *logService) ListLoginLogs(ctx context.Context, page, pageSize int, filter *LogFilter) (*PageResponse, error) {
	filter = s.applyDataScopeFilter(ctx, filter, "/api/v1/system/logs/login")
	logs, total, err := s.loginDAO.ListLogs(ctx, page, pageSize, filter)
	if err != nil {
		return nil, err
	}

	items := make([]*LoginLogResponse, len(logs))
	for i, record := range logs {
		items[i] = ToLoginLogResponse(record)
	}

	return &PageResponse{
		Items:      items,
		Pagination: Pagination{Page: int64(page), PageSize: int64(pageSize), Total: total},
	}, nil
}

func (s *logService) ClearLoginLogs(ctx context.Context, startDate, endDate *time.Time) error {
	filter := s.applyDataScopeFilter(ctx, &LogFilter{
		StartDate: startDate,
		EndDate:   endDate,
	}, "/api/v1/system/logs/login")
	return s.loginDAO.ClearLogs(ctx, getTenantID(ctx), filter)
}

func (s *logService) MarkLogout(ctx context.Context, userID string) error {
	if userID == "" {
		return nil
	}
	return s.loginDAO.MarkLogout(ctx, userID, time.Now())
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func getUserID(ctx context.Context) string {
	if userID, ok := ctx.Value("user_id").(string); ok {
		return userID
	}
	return ""
}

func (s *logService) applyDataScopeFilter(ctx context.Context, filter *LogFilter, resource string) *LogFilter {
	if filter == nil {
		filter = &LogFilter{}
	}
	currentUserID := getUserID(ctx)
	if currentUserID == "" || s == nil || s.authProvider == nil {
		return filter
	}

	scopeFilter, err := s.authProvider.GetDataScopeFilter(ctx, currentUserID, resource)
	if err != nil || scopeFilter == nil {
		return filter
	}

	scopedUserID := firstScopedUserID(scopeFilter)
	if scopedUserID == "" {
		filter.UserID = "__no_access__"
		return filter
	}
	if filter.UserID != "" && filter.UserID != scopedUserID {
		filter.UserID = "__no_access__"
		return filter
	}
	filter.UserID = scopedUserID
	return filter
}

func firstScopedUserID(scopeFilter map[string]interface{}) string {
	for _, key := range []string{"user_id", "id", "creator_id"} {
		raw, ok := scopeFilter[key]
		if !ok {
			continue
		}
		if userID, ok := raw.(string); ok && userID != "" {
			return userID
		}
	}
	return ""
}

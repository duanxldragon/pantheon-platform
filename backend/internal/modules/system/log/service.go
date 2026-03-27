package log

import (
	"context"
	"gorm.io/gorm"
	"time"
)

// ========== 服务接口 ==========

type LogService interface {
	CreateOperationLog(ctx context.Context, log *OperationLog) error
	ListOperationLogs(ctx context.Context, page, pageSize int, filter *LogFilter) (*PageResponse, error)
	ClearOperationLogs(ctx context.Context, startDate, endDate *time.Time) error

	CreateLoginLog(ctx context.Context, log *LoginLog) error
	ListLoginLogs(ctx context.Context, page, pageSize int, filter *LogFilter) (*PageResponse, error)
	ClearLoginLogs(ctx context.Context, startDate, endDate *time.Time) error
	MarkLogout(ctx context.Context, userID string) error
}

// ========== 服务实现 ==========

type logService struct {
	opRepo            OperationLogRepository
	loginRepo         LoginLogRepository
	monitorDB         *gorm.DB
	enableMonitorSync bool
}

func NewLogService(opRepo OperationLogRepository, loginRepo LoginLogRepository, monitorDB *gorm.DB) LogService {
	return &logService{
		opRepo:            opRepo,
		loginRepo:         loginRepo,
		monitorDB:         monitorDB,
		enableMonitorSync: true,
	}
}

func (s *logService) CreateOperationLog(ctx context.Context, log *OperationLog) error {
	tenantID := getTenantID(ctx)
	log.TenantID = tenantID
	err := s.opRepo.Create(ctx, *log)
	if err == nil && s.enableMonitorSync && s.monitorDB != nil {
		go func(l OperationLog, tID string) {
			l.TenantID = tID
			_ = s.monitorDB.Table("monitor_oper_logs").Create(&l).Error
		}(*log, tenantID)
	}
	return err
}

func (s *logService) ListOperationLogs(ctx context.Context, page, pageSize int, filter *LogFilter) (*PageResponse, error) {
	logs, total, err := s.opRepo.ListLogs(ctx, page, pageSize, filter)
	if err != nil {
		return nil, err
	}

	items := make([]*OperationLogResponse, len(logs))
	for i, l := range logs {
		items[i] = ToOperationLogResponse(l)
	}

	return &PageResponse{
		Items:      items,
		Pagination: Pagination{Page: int64(page), PageSize: int64(pageSize), Total: total},
	}, nil
}

func (s *logService) ClearOperationLogs(ctx context.Context, startDate, endDate *time.Time) error {
	return s.opRepo.ClearLogs(ctx, getTenantID(ctx), startDate, endDate)
}

func (s *logService) CreateLoginLog(ctx context.Context, log *LoginLog) error {
	tenantID := getTenantID(ctx)
	log.TenantID = tenantID
	err := s.loginRepo.Create(ctx, *log)
	if err == nil && s.enableMonitorSync && s.monitorDB != nil {
		go func(l LoginLog, tID string) {
			l.TenantID = tID
			_ = s.monitorDB.Table("monitor_login_logs").Create(&l).Error
		}(*log, tenantID)
	}
	return err
}

func (s *logService) ListLoginLogs(ctx context.Context, page, pageSize int, filter *LogFilter) (*PageResponse, error) {
	logs, total, err := s.loginRepo.ListLogs(ctx, page, pageSize, filter)
	if err != nil {
		return nil, err
	}

	items := make([]*LoginLogResponse, len(logs))
	for i, l := range logs {
		items[i] = ToLoginLogResponse(l)
	}

	return &PageResponse{
		Items:      items,
		Pagination: Pagination{Page: int64(page), PageSize: int64(pageSize), Total: total},
	}, nil
}

func (s *logService) ClearLoginLogs(ctx context.Context, startDate, endDate *time.Time) error {
	return s.loginRepo.ClearLogs(ctx, getTenantID(ctx), startDate, endDate)
}

func (s *logService) MarkLogout(ctx context.Context, userID string) error {
	if userID == "" {
		return nil
	}
	return s.loginRepo.MarkLogout(ctx, userID, time.Now())
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

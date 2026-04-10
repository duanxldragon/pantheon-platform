package log

import (
	"context"
	"strings"
	"time"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// OperationLogDAO defines operation log DAO behavior.
type OperationLogDAO interface {
	database.DAO[OperationLog]
	database.TenantMigrator
	ListLogs(ctx context.Context, page, pageSize int, filter *LogFilter) ([]*OperationLog, int64, error)
	ClearLogs(ctx context.Context, tenantID string, filter *LogFilter) error
}

// LoginLogDAO defines login log DAO behavior.
type LoginLogDAO interface {
	database.DAO[LoginLog]
	database.TenantMigrator
	ListLogs(ctx context.Context, page, pageSize int, filter *LogFilter) ([]*LoginLog, int64, error)
	ClearLogs(ctx context.Context, tenantID string, filter *LogFilter) error
	MarkLogout(ctx context.Context, userID string, logoutAt time.Time) error
}

type operationLogDAO struct {
	*database.BaseDAO[OperationLog]
}

// NewOperationLogDAO creates an operation log DAO.
func NewOperationLogDAO(db *gorm.DB) OperationLogDAO {
	return &operationLogDAO{
		BaseDAO: database.NewBaseDAO[OperationLog](db),
	}
}

func (r *operationLogDAO) GetTenantModels() []interface{} {
	return []interface{}{&OperationLog{}}
}

func (r *operationLogDAO) ListLogs(ctx context.Context, page, pageSize int, filter *LogFilter) ([]*OperationLog, int64, error) {
	var logs []*OperationLog
	var total int64

	query := r.GetDB(ctx).Model(&OperationLog{})

	if filter != nil {
		if v := strings.TrimSpace(filter.UserID); v != "" {
			query = query.Where("user_id = ?", v)
		}
		if v := strings.TrimSpace(filter.Username); v != "" {
			query = query.Where("username LIKE ?", "%"+v+"%")
		}
		if v := strings.TrimSpace(filter.Module); v != "" {
			query = query.Where("module = ?", v)
		}
		if v := strings.TrimSpace(filter.Action); v != "" {
			query = query.Where("action = ?", v)
		}
		switch filter.Status {
		case "success":
			query = query.Where("status >= 200 AND status < 400")
		case "failure":
			query = query.Where("status >= 400")
		}
		if filter.StartDate != nil {
			query = query.Where("created_at >= ?", *filter.StartDate)
		}
		if filter.EndDate != nil {
			query = query.Where("created_at <= ?", *filter.EndDate)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&logs).Error
	return logs, total, err
}

func (r *operationLogDAO) ClearLogs(ctx context.Context, tenantID string, filter *LogFilter) error {
	query := r.GetDB(ctx).Where("tenant_id = ?", tenantID)
	if filter != nil {
		if v := strings.TrimSpace(filter.UserID); v != "" {
			query = query.Where("user_id = ?", v)
		}
		if filter.StartDate != nil {
			query = query.Where("created_at >= ?", *filter.StartDate)
		}
		if filter.EndDate != nil {
			query = query.Where("created_at <= ?", *filter.EndDate)
		}
	}
	return query.Delete(&OperationLog{}).Error
}

func (r *operationLogDAO) WithTx(tx *gorm.DB) database.DAO[OperationLog] {
	return &operationLogDAO{
		BaseDAO: database.NewBaseDAO[OperationLog](tx),
	}
}

type loginLogDAO struct {
	*database.BaseDAO[LoginLog]
}

// NewLoginLogDAO creates a login log DAO.
func NewLoginLogDAO(db *gorm.DB) LoginLogDAO {
	return &loginLogDAO{
		BaseDAO: database.NewBaseDAO[LoginLog](db),
	}
}

func (r *loginLogDAO) GetTenantModels() []interface{} {
	return []interface{}{&LoginLog{}}
}

func (r *loginLogDAO) ListLogs(ctx context.Context, page, pageSize int, filter *LogFilter) ([]*LoginLog, int64, error) {
	var logs []*LoginLog
	var total int64

	query := r.GetDB(ctx).Model(&LoginLog{})

	if filter != nil {
		if v := strings.TrimSpace(filter.UserID); v != "" {
			query = query.Where("user_id = ?", v)
		}
		if v := strings.TrimSpace(filter.Username); v != "" {
			query = query.Where("username LIKE ?", "%"+v+"%")
		}
		if v := strings.TrimSpace(filter.Status); v != "" {
			query = query.Where("status = ?", v)
		}
		if filter.StartDate != nil {
			query = query.Where("login_at >= ?", *filter.StartDate)
		}
		if filter.EndDate != nil {
			query = query.Where("login_at <= ?", *filter.EndDate)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Order("login_at desc").Offset(offset).Limit(pageSize).Find(&logs).Error
	return logs, total, err
}

func (r *loginLogDAO) ClearLogs(ctx context.Context, tenantID string, filter *LogFilter) error {
	query := r.GetDB(ctx).Where("tenant_id = ?", tenantID)
	if filter != nil {
		if v := strings.TrimSpace(filter.UserID); v != "" {
			query = query.Where("user_id = ?", v)
		}
		if filter.StartDate != nil {
			query = query.Where("login_at >= ?", *filter.StartDate)
		}
		if filter.EndDate != nil {
			query = query.Where("login_at <= ?", *filter.EndDate)
		}
	}
	return query.Delete(&LoginLog{}).Error
}

func (r *loginLogDAO) MarkLogout(ctx context.Context, userID string, logoutAt time.Time) error {
	var latest LoginLog
	err := r.GetDB(ctx).
		Where("user_id = ? AND logout_at IS NULL", userID).
		Order("login_at desc").
		First(&latest).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil
		}
		return err
	}

	return r.GetDB(ctx).
		Model(&LoginLog{}).
		Where("id = ?", latest.ID).
		Update("logout_at", logoutAt).Error
}

func (r *loginLogDAO) WithTx(tx *gorm.DB) database.DAO[LoginLog] {
	return &loginLogDAO{
		BaseDAO: database.NewBaseDAO[LoginLog](tx),
	}
}

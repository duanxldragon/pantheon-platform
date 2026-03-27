package tenant

import (
	"github.com/google/uuid"
	"time"
)

// QuotaType identifies a tenant quota category.
type QuotaType string

const (
	QuotaTypeUsers   QuotaType = "users"
	QuotaTypeStorage QuotaType = "storage"
	QuotaTypeDepts   QuotaType = "depts"
	QuotaTypeRoles   QuotaType = "roles"
)

// TenantQuota stores quota limits and usage for a tenant.
type TenantQuota struct {
	ID           uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	TenantID     string    `json:"tenant_id" gorm:"type:char(36);notNull;index"`
	QuotaType    QuotaType `json:"quota_type" gorm:"size:50;notNull"`
	MaxValue     int64     `json:"max_value" gorm:"notNull"`
	CurrentValue int64     `json:"current_value" gorm:"default:0"`
	Unit         string    `json:"unit" gorm:"size:20"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// TableName returns the tenant quota table name.
func (TenantQuota) TableName() string {
	return "tenant_quotas"
}

// QuotaUsageLog records changes to tenant quota usage.
type QuotaUsageLog struct {
	ID          uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	TenantID    string    `json:"tenant_id" gorm:"type:char(36);notNull;index"`
	QuotaType   QuotaType `json:"quota_type" gorm:"size:50;notNull"`
	Action      string    `json:"action" gorm:"size:50;notNull"` // 'create', 'delete', 'increase', 'decrease'
	ChangeValue int64     `json:"change_value" gorm:"notNull"`
	OldValue    int64     `json:"old_value" gorm:"notNull"`
	NewValue    int64     `json:"new_value" gorm:"notNull"`
	Operator    string    `json:"operator" gorm:"size:100"`
	CreatedAt   time.Time `json:"created_at"`
}

// TableName returns the tenant quota usage log table name.
func (QuotaUsageLog) TableName() string {
	return "tenant_quota_usage_logs"
}

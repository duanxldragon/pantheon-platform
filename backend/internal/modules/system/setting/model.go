package setting

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Setting is a tenant-scoped system setting entry (key/value).
// Note: use column name config_key to avoid reserved keyword conflicts (e.g. MySQL "key").
type Setting struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	TenantID    string         `json:"tenant_id" gorm:"type:char(36);index;notNull"`
	Category    string         `json:"category" gorm:"size:50;index"`
	Key         string         `json:"key" gorm:"column:config_key;size:100;notNull;uniqueIndex:uniq_tenant_key,priority:2"`
	Value       string         `json:"value" gorm:"type:text;notNull"`
	Label       string         `json:"label" gorm:"size:100"`
	Type        string         `json:"type" gorm:"size:20;notNull;default:'text'"`
	Description string         `json:"description" gorm:"type:text"`
	Editable    bool           `json:"editable" gorm:"notNull;default:true"`
	UpdatedBy   string         `json:"updated_by" gorm:"size:50"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Setting) TableName() string {
	return "system_settings"
}


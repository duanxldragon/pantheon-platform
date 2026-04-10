package permission

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// Permission 权限模型
type Permission struct {
	ID          uuid.UUID      `json:"id" gorm:"size:36;primaryKey"`
	Name        string         `json:"name" gorm:"size:50;notNull;uniqueIndex"`
	Code        string         `json:"code" gorm:"size:50;notNull;uniqueIndex"`
	Description string         `json:"description" gorm:"type:text"`
	Type        string         `json:"type" gorm:"size:20;notNull;default:'menu'"`
	Resource    string         `json:"resource" gorm:"size:100"`
	Action      string         `json:"action" gorm:"size:50"`
	Status      string         `json:"status" gorm:"size:20;notNull;default:'active'"`
	TenantID    string         `json:"tenant_id" gorm:"size:36;index"`
	IsSystem    bool           `json:"is_system" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Permission) TableName() string {
	return "system_permissions"
}

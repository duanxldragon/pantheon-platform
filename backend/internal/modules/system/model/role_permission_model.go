package model

import (
	"time"

	"github.com/google/uuid"
)

// RolePermission 角色权限关联模型
type RolePermission struct {
	ID           uuid.UUID `json:"id" gorm:"size:36;primary_key"`
	RoleID       uuid.UUID `json:"role_id" gorm:"size:36;notNull;index"`
	PermissionID uuid.UUID `json:"permission_id" gorm:"size:36;notNull;index"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	TenantID     string    `json:"tenant_id" gorm:"size:36;index"`
}

// TableName 表名
func (RolePermission) TableName() string {
	return "system_role_permissions"
}

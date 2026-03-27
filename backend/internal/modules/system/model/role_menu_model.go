package model

import (
	"time"

	"github.com/google/uuid"
)

// RoleMenu 角色菜单关联模型
type RoleMenu struct {
	ID        uuid.UUID `json:"id" gorm:"type:char(36);primary_key"`
	RoleID    uuid.UUID `json:"role_id" gorm:"type:char(36);notNull;index"`
	MenuID    uuid.UUID `json:"menu_id" gorm:"type:char(36);notNull;index"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	TenantID  string    `json:"tenant_id" gorm:"type:char(36);index"`
}

// TableName 表名
func (RoleMenu) TableName() string {
	return "system_role_menus"
}

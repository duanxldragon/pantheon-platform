package model

import (
	"time"

	"github.com/google/uuid"
)

// UserRole 用户角色关联模型
type UserRole struct {
	ID        uuid.UUID `json:"id" gorm:"type:char(36);primary_key"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:char(36);notNull;index"`
	RoleID    uuid.UUID `json:"role_id" gorm:"type:char(36);notNull;index"`
	IsPrimary bool      `json:"is_primary" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	TenantID  string    `json:"tenant_id" gorm:"type:char(36);index"`
}

// TableName 表名
func (UserRole) TableName() string {
	return "system_user_roles"
}

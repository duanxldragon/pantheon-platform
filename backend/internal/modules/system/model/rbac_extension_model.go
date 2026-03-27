package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CasbinRule Casbin规则模型
type CasbinRule struct {
	ID    uint   `json:"id" gorm:"primaryKey"`
	PType string `json:"ptype" gorm:"size:100;index"`
	V0    string `json:"v0" gorm:"size:100;index"`
	V1    string `json:"v1" gorm:"size:100;index"`
	V2    string `json:"v2" gorm:"size:100;index"`
	V3    string `json:"v3" gorm:"size:100;index"`
	V4    string `json:"v4" gorm:"size:100;index"`
	V5    string `json:"v5" gorm:"size:100;index"`
}

// TableName 指定表名
func (CasbinRule) TableName() string {
	return "casbin_rule"
}

// UserRoleRelation 用户角色关联 (为了兼容性保留)
type UserRoleRelation struct {
	ID        uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	UserID    string    `json:"user_id" gorm:"size:36;index"`
	RoleID    string    `json:"role_id" gorm:"size:36;index"`
	IsPrimary bool      `json:"is_primary" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName 指定表名
func (UserRoleRelation) TableName() string {
	return "system_user_role_relations"
}

// BeforeCreate 创建前钩子
func (ur *UserRoleRelation) BeforeCreate(tx *gorm.DB) error {
	if ur.ID == uuid.Nil {
		ur.ID = uuid.New()
	}
	return nil
}

// FieldPermission 字段权限
type FieldPermission struct {
	ID          uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	RoleID      string    `json:"role_id" gorm:"size:36;index"`
	Module      string    `json:"module" gorm:"size:50;index"`
	Table       string    `json:"table_name" gorm:"size:100;index" gorm:"column:table_name"`
	Field       string    `json:"field" gorm:"size:100;index"`
	Permission  string    `json:"permission" gorm:"size:20"`
	Description string    `json:"description" gorm:"size:500"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName 指定表名
func (FieldPermission) TableName() string {
	return "system_field_permissions"
}

// BeforeCreate 创建前钩子
func (fp *FieldPermission) BeforeCreate(tx *gorm.DB) error {
	if fp.ID == uuid.Nil {
		fp.ID = uuid.New()
	}
	return nil
}

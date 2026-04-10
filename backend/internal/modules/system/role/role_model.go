package role

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// Role 角色模型
type Role struct {
	ID          uuid.UUID      `json:"id" gorm:"size:36;primaryKey"`
	Name        string         `json:"name" gorm:"size:50;notNull;uniqueIndex:uniq_role_tenant_name,priority:2"`
	Code        string         `json:"code" gorm:"size:50;notNull;uniqueIndex:uniq_role_tenant_code,priority:2"`
	Description string         `json:"description" gorm:"type:text"`
	Status      string         `json:"status" gorm:"size:20;notNull;default:'active'"`
	Type        string         `json:"type" gorm:"size:20;notNull;default:'custom'"`
	DataScope   string         `json:"data_scope" gorm:"size:255;notNull;default:'all'"`
	TenantID    string         `json:"tenant_id" gorm:"size:36;index;uniqueIndex:uniq_role_tenant_name,priority:1;uniqueIndex:uniq_role_tenant_code,priority:1"`
	IsSystem    bool           `json:"is_system" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Role) TableName() string {
	return "system_roles"
}

// RolePermission 角色权限关联模型
type RolePermission struct {
	ID           uuid.UUID `json:"id" gorm:"size:36;primaryKey"`
	RoleID       uuid.UUID `json:"role_id" gorm:"size:36;notNull;index"`
	PermissionID uuid.UUID `json:"permission_id" gorm:"size:36;notNull;index"`
	TenantID     string    `json:"tenant_id" gorm:"size:36;index"`
	CreatedAt    time.Time `json:"created_at"`
}

func (RolePermission) TableName() string {
	return "system_role_permissions"
}

// RoleMenu 角色菜单关联模型
type RoleMenu struct {
	ID        uuid.UUID `json:"id" gorm:"size:36;primaryKey"`
	RoleID    uuid.UUID `json:"role_id" gorm:"size:36;notNull;index"`
	MenuID    uuid.UUID `json:"menu_id" gorm:"size:36;notNull;index"`
	TenantID  string    `json:"tenant_id" gorm:"size:36;index"`
	CreatedAt time.Time `json:"created_at"`
}

func (RoleMenu) TableName() string {
	return "system_role_menus"
}

// CasbinRule Casbin规则模型 (由各模块通过适配器共享)
type CasbinRule struct {
	ID    uint   `gorm:"primaryKey;autoIncrement"`
	Ptype string `gorm:"size:100;index"`
	V0    string `gorm:"size:100;index"`
	V1    string `gorm:"size:100;index"`
	V2    string `gorm:"size:100;index"`
	V3    string `gorm:"size:100;index"`
	V4    string `gorm:"size:100;index"`
	V5    string `gorm:"size:100;index"`
}

func (CasbinRule) TableName() string {
	return "casbin_rule"
}

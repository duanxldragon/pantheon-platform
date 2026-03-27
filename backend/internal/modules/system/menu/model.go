package menu

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// Menu 菜单模型
type Menu struct {
	ID         uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	Name       string         `json:"name" gorm:"size:100;notNull"`
	Code       string         `json:"code" gorm:"size:50;notNull;uniqueIndex"`
	Path       string         `json:"path" gorm:"size:255"`
	Component  string         `json:"component" gorm:"size:255"`
	Icon       string         `json:"icon" gorm:"size:100"`
	Type       string         `json:"type" gorm:"size:20;notNull;default:'menu'"`
	ParentID   *uuid.UUID     `json:"parent_id,omitempty" gorm:"type:char(36);index"`
	Sort       int            `json:"sort" gorm:"default:0"`
	Status     string         `json:"status" gorm:"size:20;notNull;default:'active'"`
	IsExternal bool           `json:"is_external" gorm:"default:false"`
	TenantID   string         `json:"tenant_id" gorm:"type:char(36);index"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Menu) TableName() string {
	return "system_menus"
}

// RoleMenuRelation 角色菜单关联模型
type RoleMenuRelation struct {
	ID        uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	RoleID    string    `json:"role_id" gorm:"size:36;index"`
	MenuID    string    `json:"menu_id" gorm:"size:36;index"`
	CreatedAt time.Time `json:"created_at"`
}

func (RoleMenuRelation) TableName() string {
	return "system_role_menus"
}

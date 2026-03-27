package model

import (
	"time"
)

// User 用户模型
type User struct {
	BaseModel
	Username     string     `json:"username" gorm:"size:50;notNull;uniqueIndex"`
	RealName     string     `json:"real_name" gorm:"size:100;notNull"`
	Email        string     `json:"email" gorm:"size:100;notNull;uniqueIndex"`
	Phone        string     `json:"phone" gorm:"size:20"`
	Avatar       *string    `json:"avatar,omitempty" gorm:"size:255"`
	PasswordHash string     `json:"-" gorm:"size:255;notNull"`
	Status       string     `json:"status" gorm:"size:20;notNull;default:'active'"`
	TenantID     string     `json:"tenant_id" gorm:"type:char(36);index"`
	DepartmentID *string    `json:"department_id,omitempty" gorm:"type:char(36);index"`
	PositionID   *string    `json:"position_id,omitempty" gorm:"type:char(36)"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	LastLoginIP  string     `json:"last_login_ip,omitempty" gorm:"size:50"`
}

// TableName 表名
func (User) TableName() string {
	return "system_users"
}

// IsActive 是否激活
func (u *User) IsActive() bool {
	return u.Status == "active"
}

// Activate 激活用户
func (u *User) Activate() {
	u.Status = "active"
}

// Deactivate 停用用户
func (u *User) Deactivate() {
	u.Status = "inactive"
}

// Lock 锁定用户
func (u *User) Lock() {
	u.Status = "locked"
}

package user

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// User 用户模型
type User struct {
	ID           uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	Username     string         `json:"username" gorm:"size:50;notNull;uniqueIndex"`
	RealName     string         `json:"real_name" gorm:"size:100;notNull"`
	Email        string         `json:"email" gorm:"size:100;notNull;uniqueIndex"`
	Phone        string         `json:"phone" gorm:"size:20"`
	Avatar       *string        `json:"avatar,omitempty" gorm:"size:255"`
	PasswordHash string         `json:"-" gorm:"size:255;notNull"`
	Status       string         `json:"status" gorm:"size:20;notNull;default:'active'"`
	TenantID     string         `json:"tenant_id" gorm:"type:char(36);index"`
	DepartmentID *string        `json:"department_id,omitempty" gorm:"type:char(36);index"`
	PositionID   *string        `json:"position_id,omitempty" gorm:"type:char(36)"`
	LastLoginAt  *time.Time     `json:"last_login_at,omitempty"`
	LastLoginIP  string         `json:"last_login_ip,omitempty" gorm:"size:50"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 表名
func (User) TableName() string {
	return "system_users"
}

// UserRole 用户角色关联
type UserRole struct {
	ID     uuid.UUID `gorm:"type:char(36);primaryKey"`
	UserID uuid.UUID `gorm:"type:char(36);index"`
	RoleID uuid.UUID `gorm:"type:char(36);index"`
}

func (UserRole) TableName() string {
	return "system_user_roles"
}

package dept

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// Department 部门模型
type Department struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	Name        string         `json:"name" gorm:"size:100;notNull"`
	Code        string         `json:"code" gorm:"size:50;notNull;uniqueIndex"`
	Description string         `json:"description" gorm:"type:text"`
	ParentID    *uuid.UUID     `json:"parent_id,omitempty" gorm:"type:char(36);index"`
	Level       int            `json:"level" gorm:"notNull;default:1"`
	Sort        int            `json:"sort" gorm:"default:0"`
	Status      string         `json:"status" gorm:"size:20;notNull;default:'active'"`
	LeaderID    *uuid.UUID     `json:"leader_id,omitempty" gorm:"type:char(36)"`
	Phone       string         `json:"phone" gorm:"size:20"`
	Email       string         `json:"email" gorm:"size:100"`
	TenantID    string         `json:"tenant_id" gorm:"type:char(36);index"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 表名
func (Department) TableName() string {
	return "system_dept"
}

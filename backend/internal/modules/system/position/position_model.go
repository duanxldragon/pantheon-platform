package position

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// Position 岗位模型
type Position struct {
	ID               uuid.UUID      `json:"id" gorm:"size:36;primaryKey"`
	Name             string         `json:"name" gorm:"size:100;notNull"`
	Code             string         `json:"code" gorm:"size:50;notNull;uniqueIndex"`
	Category         string         `json:"category" gorm:"size:50;default:''"`
	Description      string         `json:"description" gorm:"type:text"`
	DepartmentID     *uuid.UUID     `json:"department_id,omitempty" gorm:"size:36;index"`
	Level            int            `json:"level" gorm:"notNull;default:1"`
	Sort             int            `json:"sort" gorm:"default:0"`
	Status           string         `json:"status" gorm:"size:20;notNull;default:'active'"`
	Responsibilities string         `json:"responsibilities" gorm:"type:text"`
	Requirements     string         `json:"requirements" gorm:"type:text"`
	TenantID         string         `json:"tenant_id" gorm:"size:36;index"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 表名
func (Position) TableName() string {
	return "system_post"
}

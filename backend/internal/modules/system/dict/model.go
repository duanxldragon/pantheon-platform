package dict

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// DictType 字典类型模型
type DictType struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	Name        string         `json:"name" gorm:"size:100;notNull;uniqueIndex:uniq_dict_type_tenant_name,priority:2"`
	Code        string         `json:"code" gorm:"size:50;notNull;uniqueIndex:uniq_dict_type_tenant_code,priority:2"`
	Description string         `json:"description" gorm:"type:text"`
	Status      string         `json:"status" gorm:"size:20;notNull;default:'active'"`
	TenantID    string         `json:"tenant_id" gorm:"type:char(36);uniqueIndex:uniq_dict_type_tenant_name,priority:1;uniqueIndex:uniq_dict_type_tenant_code,priority:1"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (DictType) TableName() string {
	return "system_dict_types"
}

// DictData 字典数据模型
type DictData struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	TypeID      uuid.UUID      `json:"type_id" gorm:"type:char(36);notNull;index"`
	Label       string         `json:"label" gorm:"size:255;notNull"`
	Value       string         `json:"value" gorm:"type:text"`
	Description string         `json:"description" gorm:"type:text"`
	Sort        int            `json:"sort" gorm:"default:0"`
	Status      string         `json:"status" gorm:"size:20;notNull;default:'active'"`
	TenantID    string         `json:"tenant_id" gorm:"type:char(36);index"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (DictData) TableName() string {
	return "system_dict_data"
}

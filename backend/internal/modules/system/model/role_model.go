package model

// Role 角色模型
type Role struct {
	BaseModel
	Name        string `json:"name" gorm:"size:50;notNull;uniqueIndex"`
	Code        string `json:"code" gorm:"size:50;notNull;uniqueIndex"`
	Description string `json:"description" gorm:"type:text"`
	Status      string `json:"status" gorm:"size:20;notNull;default:'active'"`
	Type        string `json:"type" gorm:"size:20;notNull;default:'custom'"`
	TenantID    string `json:"tenant_id" gorm:"size:36;index"`
	IsSystem    bool   `json:"is_system" gorm:"default:false"`
}

// TableName 表名
func (Role) TableName() string {
	return "system_roles"
}

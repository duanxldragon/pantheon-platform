package log

import (
	"time"

	"github.com/google/uuid"
)

// OperationLog 操作日志模型
type OperationLog struct {
	ID            uuid.UUID `json:"id" gorm:"size:36;primaryKey"`
	TenantID      string    `json:"tenant_id" gorm:"size:36;index"`
	UserID        string    `json:"user_id" gorm:"size:36;index"`
	Username      string    `json:"username" gorm:"size:50"`
	Module        string    `json:"module" gorm:"size:100;index"`
	Resource      string    `json:"resource" gorm:"size:100;index"`
	ResourceID    string    `json:"resource_id" gorm:"size:64;index"`
	ResourceName  string    `json:"resource_name" gorm:"size:255"`
	Action        string    `json:"action" gorm:"size:50"`
	Summary       string    `json:"summary" gorm:"size:255"`
	Detail        string    `json:"detail" gorm:"type:text"`
	Path          string    `json:"path" gorm:"size:255"`
	Method        string    `json:"method" gorm:"size:20"`
	IP            string    `json:"ip" gorm:"size:50"`
	Location      string    `json:"location" gorm:"size:255"`
	Status        int       `json:"status"`
	Request       string    `json:"request" gorm:"type:text"`
	Response      string    `json:"response" gorm:"type:text"`
	ErrorMessage  string    `json:"error_message" gorm:"type:text"`
	ExecutionTime int64     `json:"execution_time"`
	CreatedAt     time.Time `json:"created_at" gorm:"index"`
}

func (OperationLog) TableName() string {
	return "system_oper_log"
}

// LoginLog 登录日志模型
type LoginLog struct {
	ID       uuid.UUID  `json:"id" gorm:"size:36;primaryKey"`
	TenantID string     `json:"tenant_id" gorm:"size:36;index"`
	UserID   string     `json:"user_id" gorm:"size:36;index"`
	Username string     `json:"username" gorm:"size:50"`
	IP       string     `json:"ip" gorm:"size:50"`
	Location string     `json:"location" gorm:"size:255"`
	Browser  string     `json:"browser" gorm:"size:500"`
	OS       string     `json:"os" gorm:"size:100"`
	Status   string     `json:"status" gorm:"size:20"`
	Message  string     `json:"message" gorm:"size:255"`
	LoginAt  time.Time  `json:"login_at" gorm:"index"`
	LogoutAt *time.Time `json:"logout_at,omitempty"`
}

func (LoginLog) TableName() string {
	return "system_login_log"
}

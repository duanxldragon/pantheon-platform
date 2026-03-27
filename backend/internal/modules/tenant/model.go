package tenant

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// TenantStatus represents the lifecycle status of a tenant.
type TenantStatus string

const (
	TenantStatusPending  TenantStatus = "pending"
	TenantStatusActive   TenantStatus = "active"
	TenantStatusDisabled TenantStatus = "disabled"
)

// DatabaseType represents a tenant database engine.
type DatabaseType string

const (
	DBTypeMySQL      DatabaseType = "mysql"
	DBTypePostgreSQL DatabaseType = "postgresql"
	DBTypeSQLite     DatabaseType = "sqlite"
	DBTypeMSSQL      DatabaseType = "mssql"
)

// SSLMode represents the SSL mode for database connections.
type SSLMode string

const (
	SSLModeDisable SSLMode = "disable"
	SSLModeEnable  SSLMode = "enable"
)

// Tenant stores tenant metadata.
type Tenant struct {
	ID            uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	Name          string         `json:"name" gorm:"size:100;notNull"`
	Code          string         `json:"code" gorm:"size:50;notNull;uniqueIndex"`
	Description   string         `json:"description" gorm:"type:text"`
	ContactPerson string         `json:"contact_person" gorm:"size:100"`
	ExpireAt      *time.Time     `json:"expire_at,omitempty"`
	Status        TenantStatus   `json:"status" gorm:"size:20;notNull;default:'pending'"`
	IsFirstLogin  bool           `json:"is_first_login" gorm:"default:true"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName returns the tenant table name.
func (Tenant) TableName() string {
	return "tenants"
}

// TenantDatabaseConfig stores tenant database connection settings.
type TenantDatabaseConfig struct {
	ID                uuid.UUID    `json:"id" gorm:"type:char(36);primaryKey"`
	TenantID          string       `json:"tenant_id" gorm:"type:char(36);notNull;uniqueIndex"`
	DatabaseType      DatabaseType `json:"database_type" gorm:"size:20;notNull"`
	Host              string       `json:"host" gorm:"size:255"`
	Port              int          `json:"port"`
	Database          string       `json:"database" gorm:"size:100"`
	Username          string       `json:"username" gorm:"size:100"`
	PasswordEncrypted string       `json:"-" gorm:"size:255"`
	FilePath          string       `json:"file_path" gorm:"size:255"`
	SSLMode           SSLMode      `json:"ssl_mode" gorm:"size:20"`
	MaxOpenConns      int          `json:"max_open_conns" gorm:"default:100"`
	MaxIdleConns      int          `json:"max_idle_conns" gorm:"default:10"`
	ConnMaxLifetime   int          `json:"conn_max_lifetime" gorm:"default:3600"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
}

// TableName returns the tenant database config table name.
func (TenantDatabaseConfig) TableName() string {
	return "tenant_database_configs"
}

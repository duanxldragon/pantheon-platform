package model

import (
	"time"
)

// ModeConfig 模式配置
type ModeConfig struct {
	LoginMode string    `json:"login_mode"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SystemConfig 系统配置
type SystemConfig struct {
	MasterDBInitialized bool      `json:"master_db_initialized"`
	FirstTenantSetup    bool      `json:"first_tenant_setup"`
	LoginMode           string    `json:"login_mode"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// TenantConfig 租户配置
type TenantConfig struct {
	AutoCreateTenant    bool     `json:"auto_create_tenant"`
	RequireTenantCode   bool     `json:"require_tenant_code"`
	DefaultTenantCode   string   `json:"default_tenant_code"`
	MaxTenants          int      `json:"max_tenants"`
	DatabaseTypes       []string `json:"database_types"`
	DefaultDatabaseType string   `json:"mysql"`
	MaxConnections      int      `json:"max_connections"`
}

package tenant

import (
	"pantheon-platform/backend/internal/shared/database/factory"
)

// CreateTenantRequest carries tenant creation data.
type CreateTenantRequest struct {
	Name          string `json:"name" binding:"required"`
	Code          string `json:"code" binding:"required"`
	Description   string `json:"description"`
	ContactPerson string `json:"contact_person"`
	ExpireAt      string `json:"expire_at"`
}

// UpdateTenantRequest carries tenant update data.
type UpdateTenantRequest struct {
	Name          string `json:"name" binding:"required"`
	Description   string `json:"description"`
	ContactPerson string `json:"contact_person"`
	ExpireAt      string `json:"expire_at"`
}

// TenantStatusResponse returns tenant setup and status data.
type TenantStatusResponse struct {
	IsConfigured       bool   `json:"is_configured"`
	IsFirstLogin       bool   `json:"is_first_login"`
	DatabaseConfigured bool   `json:"database_configured"`
	TenantID           string `json:"tenant_id,omitempty"`
	TenantCode         string `json:"tenant_code,omitempty"`
	TenantName         string `json:"tenant_name,omitempty"`
	DatabaseType       string `json:"database_type,omitempty"`
	Status             string `json:"status"`
}

// TenantInfoResponse returns current tenant information.
type TenantInfoResponse struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Code               string `json:"code"`
	Description        string `json:"description,omitempty"`
	ContactPerson      string `json:"contact_person,omitempty"`
	ExpireAt           string `json:"expire_at,omitempty"`
	Status             string `json:"status"`
	DatabaseType       string `json:"database_type,omitempty"`
	DatabaseConfigured bool   `json:"database_configured"`
	CreatedAt          string `json:"created_at"`
}

// TestConnectionRequest carries database connection parameters for testing.
type TestConnectionRequest struct {
	DatabaseType string `json:"database_type"`
	Host         string `json:"host"`
	Port         int    `json:"port"`
	Database     string `json:"database"`
	Username     string `json:"username"`
	Password     string `json:"password"`
	FilePath     string `json:"filepath"`
	SSLMode      string `json:"ssl_mode"`
}

// SetupDatabaseRequest carries tenant database setup parameters.
type SetupDatabaseRequest struct {
	DatabaseType    string `json:"database_type"`
	Host            string `json:"host"`
	Port            int    `json:"port"`
	Database        string `json:"database"`
	Username        string `json:"username"`
	Password        string `json:"password"`
	FilePath        string `json:"filepath"`
	SSLMode         string `json:"ssl_mode"`
	MaxOpenConns    int    `json:"max_open_conns"`
	MaxIdleConns    int    `json:"max_idle_conns"`
	ConnMaxLifetime int    `json:"conn_max_lifetime"`
}

// SetupDatabaseResponse returns tenant database setup results.
type SetupDatabaseResponse struct {
	TenantID           string                   `json:"tenant_id"`
	ConfigID           string                   `json:"config_id"`
	DatabaseType       string                   `json:"database_type"`
	Database           string                   `json:"database"`
	Version            string                   `json:"version,omitempty"`
	InitializedModules []string                 `json:"initialized_modules,omitempty"`
	DeploymentMode     string                   `json:"deployment_mode,omitempty"`
	TenantStrategy     string                   `json:"tenant_strategy,omitempty"`
	Bootstrap          *TenantBootstrapResponse `json:"bootstrap,omitempty"`
	Message            string                   `json:"message"`
}

// TenantBootstrapResponse returns the default bootstrap result for a tenant database.
type TenantBootstrapResponse struct {
	Seeded          bool   `json:"seeded"`
	AdminCreated    bool   `json:"admin_created"`
	RoleCreated     bool   `json:"role_created"`
	AdminUsername   string `json:"admin_username,omitempty"`
	AdminEmail      string `json:"admin_email,omitempty"`
	InitialPassword string `json:"initial_password,omitempty"`
	RoleCode        string `json:"role_code,omitempty"`
	MenuCount       int    `json:"menu_count,omitempty"`
	PermissionCount int    `json:"permission_count,omitempty"`
}

// ConnectionTestResult aliases the shared database connection test result.
type ConnectionTestResult = factory.ConnectionTestResult

// QuotaUpsertRequest carries quota upsert items.
type QuotaUpsertRequest struct {
	Items []QuotaUpsertItem `json:"items" binding:"required,dive"`
}

// QuotaUpsertItem describes one quota upsert operation.
type QuotaUpsertItem struct {
	Type     string `json:"type" binding:"required"`
	MaxValue int64  `json:"maxValue" binding:"required"`
	Unit     string `json:"unit"`
}

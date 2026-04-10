package tenant

import (
	"pantheon-platform/backend/internal/shared/database/factory"
)

// CreateTenantRequest carries tenant creation data.
type CreateTenantRequest struct {
	Name          string `json:"name" binding:"required" example:"Acme China"`
	Code          string `json:"code" binding:"required" example:"acme_china"`
	Description   string `json:"description" example:"Regional tenant for China operations"`
	ContactPerson string `json:"contact_person" example:"Alice Chen"`
	ExpireAt      string `json:"expire_at" example:"2027-12-31T23:59:59Z"`
}

// UpdateTenantRequest carries tenant update data.
type UpdateTenantRequest struct {
	Name          string `json:"name" binding:"required" example:"Acme China"`
	Description   string `json:"description" example:"Regional tenant for China operations"`
	ContactPerson string `json:"contact_person" example:"Alice Chen"`
	ExpireAt      string `json:"expire_at" example:"2027-12-31T23:59:59Z"`
}

// TenantStatusResponse returns tenant setup and status data.
type TenantStatusResponse struct {
	IsConfigured       bool   `json:"is_configured" example:"true"`
	IsFirstLogin       bool   `json:"is_first_login" example:"false"`
	DatabaseConfigured bool   `json:"database_configured" example:"true"`
	TenantID           string `json:"tenant_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	TenantCode         string `json:"tenant_code,omitempty" example:"acme_china"`
	TenantName         string `json:"tenant_name,omitempty" example:"Acme China"`
	DatabaseType       string `json:"database_type,omitempty" example:"postgres"`
	Status             string `json:"status" example:"active"`
}

// TenantInfoResponse returns current tenant information.
type TenantInfoResponse struct {
	ID                 string `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name               string `json:"name" example:"Acme China"`
	Code               string `json:"code" example:"acme_china"`
	Description        string `json:"description,omitempty" example:"Regional tenant for China operations"`
	ContactPerson      string `json:"contact_person,omitempty" example:"Alice Chen"`
	ExpireAt           string `json:"expire_at,omitempty" example:"2027-12-31T23:59:59Z"`
	Status             string `json:"status" example:"active"`
	DatabaseType       string `json:"database_type,omitempty" example:"postgres"`
	DatabaseConfigured bool   `json:"database_configured" example:"true"`
	CreatedAt          string `json:"created_at" example:"2026-03-30T10:00:00Z"`
}

// TestConnectionRequest carries database connection parameters for testing.
type TestConnectionRequest struct {
	DatabaseType string `json:"database_type" example:"postgres"`
	Host         string `json:"host" example:"127.0.0.1"`
	Port         int    `json:"port" example:"5432"`
	Database     string `json:"database" example:"pantheon_tenant_acme_china"`
	Username     string `json:"username" example:"postgres"`
	Password     string `json:"password" example:"secret123"`
	FilePath     string `json:"filepath" example:"D:/data/pantheon_tenant_acme_china.db"`
	SSLMode      string `json:"ssl_mode" example:"disable"`
}

// SetupDatabaseRequest carries tenant database setup parameters.
type SetupDatabaseRequest struct {
	DatabaseType    string `json:"database_type" example:"postgres"`
	Host            string `json:"host" example:"127.0.0.1"`
	Port            int    `json:"port" example:"5432"`
	Database        string `json:"database" example:"pantheon_tenant_acme_china"`
	Username        string `json:"username" example:"postgres"`
	Password        string `json:"password" example:"secret123"`
	AdminPassword   string `json:"admin_password,omitempty" example:"Use a strong admin password"`
	FilePath        string `json:"filepath" example:"D:/data/pantheon_tenant_acme_china.db"`
	SSLMode         string `json:"ssl_mode" example:"disable"`
	MaxOpenConns    int    `json:"max_open_conns" example:"20"`
	MaxIdleConns    int    `json:"max_idle_conns" example:"10"`
	ConnMaxLifetime int    `json:"conn_max_lifetime" example:"3600"`
}

// SetupDatabaseResponse returns tenant database setup results.
type SetupDatabaseResponse struct {
	TenantID           string                   `json:"tenant_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	ConfigID           string                   `json:"config_id" example:"tenant-db-config-1"`
	DatabaseType       string                   `json:"database_type" example:"postgres"`
	Database           string                   `json:"database" example:"pantheon_tenant_acme_china"`
	Version            string                   `json:"version,omitempty" example:"16.2"`
	InitializedModules []string                 `json:"initialized_modules,omitempty" example:"auth,user,role,permission,menu"`
	DeploymentMode     string                   `json:"deployment_mode,omitempty" example:"single"`
	TenantStrategy     string                   `json:"tenant_strategy,omitempty" example:"shared_db"`
	Bootstrap          *TenantBootstrapResponse `json:"bootstrap,omitempty"`
	Message            string                   `json:"message" example:"tenant database initialized"`
}

// TenantBootstrapResponse returns the default bootstrap result for a tenant database.
type TenantBootstrapResponse struct {
	Seeded          bool   `json:"seeded" example:"true"`
	AdminCreated    bool   `json:"admin_created" example:"true"`
	RoleCreated     bool   `json:"role_created" example:"true"`
	AdminUsername   string `json:"admin_username,omitempty" example:"admin"`
	AdminEmail      string `json:"admin_email,omitempty" example:"admin@example.com"`
	RoleCode        string `json:"role_code,omitempty" example:"tenant_admin"`
	MenuCount       int    `json:"menu_count,omitempty" example:"42"`
	PermissionCount int    `json:"permission_count,omitempty" example:"128"`
}

// ConnectionTestResult aliases the shared database connection test result.
type ConnectionTestResult = factory.ConnectionTestResult

// QuotaUpsertRequest carries quota upsert items.
type QuotaUpsertRequest struct {
	Items []QuotaUpsertItem `json:"items" binding:"required,dive"`
}

// QuotaUpsertItem describes one quota upsert operation.
type QuotaUpsertItem struct {
	Type     string `json:"type" binding:"required" example:"users"`
	MaxValue int64  `json:"maxValue" binding:"required" example:"200"`
	Unit     string `json:"unit" example:"users"`
}

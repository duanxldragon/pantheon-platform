package tenant

import "pantheon-platform/backend/internal/shared/response"

type tenantStatusEnvelope struct {
	Code      int                   `json:"code" example:"0"`
	Message   string                `json:"message" example:"success"`
	Data      *TenantStatusResponse `json:"data"`
	Meta      *response.Meta        `json:"meta,omitempty"`
	Timestamp string                `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type tenantInfoEnvelope struct {
	Code      int                 `json:"code" example:"0"`
	Message   string              `json:"message" example:"success"`
	Data      *TenantInfoResponse `json:"data"`
	Meta      *response.Meta      `json:"meta,omitempty"`
	Timestamp string              `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type tenantSetupEnvelope struct {
	Code      int                    `json:"code" example:"0"`
	Message   string                 `json:"message" example:"success"`
	Data      *SetupDatabaseResponse `json:"data"`
	Meta      *response.Meta         `json:"meta,omitempty"`
	Timestamp string                 `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type tenantConnectionEnvelope struct {
	Code      int                   `json:"code" example:"0"`
	Message   string                `json:"message" example:"success"`
	Data      *ConnectionTestResult `json:"data"`
	Meta      *response.Meta        `json:"meta,omitempty"`
	Timestamp string                `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type tenantRecordEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      *Tenant        `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type tenantListData struct {
	Items      []*Tenant           `json:"items"`
	Pagination response.Pagination `json:"pagination"`
}
type tenantListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      tenantListData `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type tenantQuotaListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      []*TenantQuota `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type tenantQuotaUpsertData struct {
	Message string         `json:"message" example:"Tenant quotas updated"`
	Items   []*TenantQuota `json:"items"`
}
type tenantQuotaUpsertEnvelope struct {
	Code      int                   `json:"code" example:"0"`
	Message   string                `json:"message" example:"success"`
	Data      tenantQuotaUpsertData `json:"data"`
	Meta      *response.Meta        `json:"meta,omitempty"`
	Timestamp string                `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type tenantMessageData struct {
	Message string `json:"message" example:"success"`
}
type tenantMessageEnvelope struct {
	Code      int               `json:"code" example:"0"`
	Message   string            `json:"message" example:"success"`
	Data      tenantMessageData `json:"data"`
	Meta      *response.Meta    `json:"meta,omitempty"`
	Timestamp string            `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

// GetTenantStatusDoc godoc
// @Summary Get Tenant Status
// @Description Get tenant status by tenant code.
// @Tags Tenant
// @Accept json
// @Produce json
// @Param code query string true "Tenant code, such as default"
// @Success 200 {object} tenantStatusEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/status [get]
func GetTenantStatusDoc() {}

// TestConnectionDoc godoc
// @Summary Test Tenant Connection
// @Description Test a tenant database connection payload.
// @Tags Tenant
// @Accept json
// @Produce json
// @Param request body TestConnectionRequest true "Connection payload"
// @Success 200 {object} tenantConnectionEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/test-connection [post]
func TestConnectionDoc() {}

// SetupDatabaseDoc godoc
// @Summary Setup Current Tenant Database
// @Description Setup database for the current tenant.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body SetupDatabaseRequest true "Database setup payload"
// @Success 200 {object} tenantSetupEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/setup [post]
func SetupDatabaseDoc() {}

// SetupDatabaseForTenantDoc godoc
// @Summary Setup Tenant Database By ID
// @Description Setup database for a specified tenant.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Tenant ID"
// @Param request body SetupDatabaseRequest true "Database setup payload"
// @Success 200 {object} tenantSetupEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/{id}/setup [post]
func SetupDatabaseForTenantDoc() {}

// GetCurrentTenantDoc godoc
// @Summary Get Current Tenant
// @Description Get current tenant information.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} tenantInfoEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/current [get]
func GetCurrentTenantDoc() {}

// UpdateTenantDoc godoc
// @Summary Update Tenant
// @Description Update tenant base information.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Tenant ID"
// @Param request body UpdateTenantRequest true "Tenant update payload"
// @Success 200 {object} tenantInfoEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/{id} [put]
func UpdateTenantDoc() {}

// SwitchTenantDoc godoc
// @Summary Switch Tenant
// @Description Confirm or switch current tenant context.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Tenant ID"
// @Success 200 {object} tenantInfoEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/switch/{id} [post]
func SwitchTenantDoc() {}

// ActivateTenantDoc godoc
// @Summary Activate Tenant
// @Description Activate a tenant by ID.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Tenant ID"
// @Success 200 {object} tenantInfoEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/{id}/activate [put]
func ActivateTenantDoc() {}

// SuspendTenantDoc godoc
// @Summary Suspend Tenant
// @Description Suspend a tenant by ID.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Tenant ID"
// @Success 200 {object} tenantInfoEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/{id}/suspend [put]
func SuspendTenantDoc() {}

// DeleteTenantDoc godoc
// @Summary Delete Tenant
// @Description Delete a tenant by ID.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Tenant ID"
// @Success 200 {object} tenantMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/{id} [delete]
func DeleteTenantDoc() {}

// ListTenantQuotasDoc godoc
// @Summary List Tenant Quotas
// @Description List quota configuration for a tenant.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Tenant ID"
// @Success 200 {object} tenantQuotaListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/{id}/quotas [get]
func ListTenantQuotasDoc() {}

// UpsertTenantQuotasDoc godoc
// @Summary Upsert Tenant Quotas
// @Description Create or update quota configuration for a tenant.
// @Tags Tenant
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Tenant ID"
// @Param request body QuotaUpsertRequest true "Quota payload"
// @Success 200 {object} tenantQuotaUpsertEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/{id}/quotas [put]
func UpsertTenantQuotasDoc() {}

package tenant

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

// TenantErrorResponse documents tenant error responses.
type TenantErrorResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// TenantPageResponse documents paginated tenant responses.
type TenantPageResponse struct {
	Items      interface{} `json:"items"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int64       `json:"total_pages"`
}

// TenantHandler handles tenant module HTTP requests.
type TenantHandler struct {
	tenantService         TenantService
	tenantDatabaseService TenantDatabaseService
	quotaService          QuotaService
}

// NewTenantHandler creates a tenant handler.
func NewTenantHandler(tenantService TenantService, tenantDatabaseService TenantDatabaseService, quotaService QuotaService) *TenantHandler {
	return &TenantHandler{
		tenantService:         tenantService,
		tenantDatabaseService: tenantDatabaseService,
		quotaService:          quotaService,
	}
}

// RegisterTenant registers a new tenant in the system
// @Summary Register New Tenant
// @Description Create a new tenant record and initialize base configuration
// @Tags Tenant
// @Accept json
// @Produce json
// @Param request body CreateTenantRequest true "Tenant registration details"
// @Success 201 {object} tenantRecordEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/register [post]
func (h *TenantHandler) RegisterTenant(c *gin.Context) {
	if strings.TrimSpace(c.GetString("user_id")) == "" {
		response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
		return
	}

	var req CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	t, err := h.tenantService.CreateTenant(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, ErrInvalidTenantCode) {
			response.BadRequest(c, "INVALID_TENANT_CODE", "Tenant code must use lowercase letters, numbers, or underscores, start with a letter, and stay within 3-32 characters")
			return
		}
		if errors.Is(err, ErrTenantCodeAlreadyExists) {
			response.Conflict(c, "TENANT_CODE_ALREADY_EXISTS", "Tenant code already exists")
			return
		}
		response.InternalError(c, "CREATE_TENANT_FAILED", err.Error())
		return
	}

	response.Created(c, t)
}

// GetStatus returns tenant status information by code.
func (h *TenantHandler) GetStatus(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		response.BadRequest(c, "TENANT_CODE_REQUIRED", "Tenant code is required")
		return
	}

	status, err := h.tenantService.GetTenantStatus(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			response.NotFound(c, "TENANT_NOT_FOUND", "Tenant not found")
			return
		}
		response.InternalError(c, "GET_TENANT_STATUS_FAILED", err.Error())
		return
	}

	response.Success(c, status)
}

// SetupDatabase configures the database for the current tenant.
func (h *TenantHandler) SetupDatabase(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Unauthorized(c, "TENANT_CONTEXT_REQUIRED", "Tenant context is required")
		return
	}
	if !h.ensureTenantAccess(c, tenantID) {
		return
	}

	var req SetupDatabaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	resp, err := h.tenantDatabaseService.SetupDatabase(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.InternalError(c, "SETUP_DATABASE_FAILED", err.Error())
		return
	}

	response.Success(c, resp)
}

// SetupDatabaseForTenant configures the database for a specified tenant.
func (h *TenantHandler) SetupDatabaseForTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if tenantID == "" {
		response.BadRequest(c, "TENANT_ID_REQUIRED", "Tenant ID is required")
		return
	}

	var req SetupDatabaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	resp, err := h.tenantDatabaseService.SetupDatabase(c.Request.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			response.NotFound(c, "TENANT_NOT_FOUND", "Tenant not found")
			return
		}
		response.InternalError(c, "SETUP_DATABASE_FAILED", err.Error())
		return
	}

	response.Success(c, resp)
}

// ListTenants returns a paginated list of all tenants
// @Summary List All Tenants
// @Description Retrieve a list of registered tenants with pagination
// @Tags Tenant
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(20) minimum(1)
// @Success 200 {object} tenantListEnvelope
// @Failure 500 {object} response.ErrorDetail
// @Router /tenants/list [get]
func (h *TenantHandler) ListTenants(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	tenants, total, err := h.tenantService.ListTenants(c.Request.Context(), page, pageSize)
	if err != nil {
		response.InternalError(c, "LIST_TENANTS_FAILED", err.Error())
		return
	}

	response.SuccessPage(c, tenants, total, page, pageSize)
}

// UpdateTenant updates one tenant base information.
func (h *TenantHandler) UpdateTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if tenantID == "" {
		response.BadRequest(c, "TENANT_ID_REQUIRED", "Tenant ID is required")
		return
	}

	var req UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	tenantInfo, err := h.tenantService.UpdateTenant(c.Request.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			response.NotFound(c, "TENANT_NOT_FOUND", "Tenant not found")
			return
		}
		response.InternalError(c, "UPDATE_TENANT_FAILED", err.Error())
		return
	}

	response.Success(c, tenantInfo)
}

// TestConnection tests a tenant database connection payload.
func (h *TenantHandler) TestConnection(c *gin.Context) {
	var req TestConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	result, err := h.tenantDatabaseService.TestConnection(c.Request.Context(), &req)
	if err != nil && result == nil {
		response.InternalError(c, "TEST_CONNECTION_FAILED", err.Error())
		return
	}

	response.Success(c, result)
}

// GetCurrentTenant returns the current tenant information.
func (h *TenantHandler) GetCurrentTenant(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Unauthorized(c, "TENANT_CONTEXT_REQUIRED", "Tenant context is required")
		return
	}
	if !h.ensureTenantAccess(c, tenantID) {
		return
	}

	tenantInfo, err := h.tenantService.GetCurrentTenantInfo(c.Request.Context(), tenantID)
	if err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			response.NotFound(c, "TENANT_NOT_FOUND", "Tenant not found")
			return
		}
		response.InternalError(c, "GET_CURRENT_TENANT_FAILED", err.Error())
		return
	}

	response.Success(c, tenantInfo)
}

// SwitchTenant confirms or switches tenant context when supported.
func (h *TenantHandler) SwitchTenant(c *gin.Context) {
	currentTenantID := c.GetString("tenant_id")
	if currentTenantID == "" {
		response.Unauthorized(c, "TENANT_CONTEXT_REQUIRED", "Tenant context is required")
		return
	}
	if !h.ensureTenantAccess(c, currentTenantID) {
		return
	}

	targetTenantID := c.Param("id")
	if targetTenantID == "" {
		response.BadRequest(c, "TENANT_ID_REQUIRED", "Tenant ID is required")
		return
	}

	if targetTenantID != currentTenantID {
		response.BadRequest(c, "TENANT_SWITCH_NOT_SUPPORTED", "Current deployment only supports a single tenant per account")
		return
	}

	tenantInfo, err := h.tenantService.GetCurrentTenantInfo(c.Request.Context(), currentTenantID)
	if err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			response.NotFound(c, "TENANT_NOT_FOUND", "Tenant not found")
			return
		}
		response.InternalError(c, "GET_CURRENT_TENANT_FAILED", err.Error())
		return
	}

	response.SuccessWithMessage(c, "Tenant context confirmed", gin.H{
		"tenant": tenantInfo,
	})
}

// ActivateTenant re-activates one tenant.
func (h *TenantHandler) ActivateTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if tenantID == "" {
		response.BadRequest(c, "TENANT_ID_REQUIRED", "Tenant ID is required")
		return
	}

	if err := h.tenantService.ActivateTenant(c.Request.Context(), tenantID); err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			response.NotFound(c, "TENANT_NOT_FOUND", "Tenant not found")
			return
		}
		response.InternalError(c, "ACTIVATE_TENANT_FAILED", err.Error())
		return
	}

	response.SuccessWithMessage(c, "Tenant activated", gin.H{
		"id": tenantID,
	})
}

// SuspendTenant disables one tenant and revokes its sessions.
func (h *TenantHandler) SuspendTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if tenantID == "" {
		response.BadRequest(c, "TENANT_ID_REQUIRED", "Tenant ID is required")
		return
	}

	if err := h.tenantService.SuspendTenant(c.Request.Context(), tenantID); err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			response.NotFound(c, "TENANT_NOT_FOUND", "Tenant not found")
			return
		}
		response.InternalError(c, "SUSPEND_TENANT_FAILED", err.Error())
		return
	}

	response.SuccessWithMessage(c, "Tenant suspended", gin.H{
		"id": tenantID,
	})
}

// DeleteTenant deletes one tenant and clears related runtime resources.
func (h *TenantHandler) DeleteTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if tenantID == "" {
		response.BadRequest(c, "TENANT_ID_REQUIRED", "Tenant ID is required")
		return
	}

	if err := h.tenantService.DeleteTenant(c.Request.Context(), tenantID); err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			response.NotFound(c, "TENANT_NOT_FOUND", "Tenant not found")
			return
		}
		response.InternalError(c, "DELETE_TENANT_FAILED", err.Error())
		return
	}

	response.SuccessWithMessage(c, "Tenant deleted", gin.H{
		"id": tenantID,
	})
}

// ListTenantQuotas returns all quotas for one tenant.
func (h *TenantHandler) ListTenantQuotas(c *gin.Context) {
	tenantID := c.Param("id")
	if tenantID == "" {
		response.BadRequest(c, "TENANT_ID_REQUIRED", "Tenant ID is required")
		return
	}
	quotas, err := h.quotaService.ListQuotas(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, "LIST_QUOTAS_FAILED", err.Error())
		return
	}
	response.Success(c, quotas)
}

// UpsertTenantQuotas creates or updates tenant quota settings.
func (h *TenantHandler) UpsertTenantQuotas(c *gin.Context) {
	tenantID := c.Param("id")
	if tenantID == "" {
		response.BadRequest(c, "TENANT_ID_REQUIRED", "Tenant ID is required")
		return
	}
	var req QuotaUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid quota payload")
		return
	}
	if len(req.Items) == 0 {
		response.BadRequest(c, "EMPTY_PAYLOAD", "At least one quota item is required")
		return
	}
	for _, item := range req.Items {
		quotaType, err := normalizeQuotaType(item.Type)
		if err != nil {
			response.BadRequest(c, "INVALID_QUOTA_TYPE", err.Error())
			return
		}
		if item.MaxValue < 0 {
			response.BadRequest(c, "INVALID_MAX_VALUE", "maxValue must be >= 0")
			return
		}
		if err := h.quotaService.SetQuota(c.Request.Context(), tenantID, quotaType, item.MaxValue, item.Unit); err != nil {
			response.InternalError(c, "UPSERT_QUOTA_FAILED", err.Error())
			return
		}
	}
	quotas, err := h.quotaService.ListQuotas(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, "LIST_QUOTAS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{
		"message": "Tenant quotas updated",
		"items":   quotas,
	})
}

func normalizeQuotaType(value string) (QuotaType, error) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "users":
		return QuotaTypeUsers, nil
	case "storage":
		return QuotaTypeStorage, nil
	case "depts", "departments":
		return QuotaTypeDepts, nil
	case "roles":
		return QuotaTypeRoles, nil
	default:
		return "", fmt.Errorf("unsupported quota type: %s", value)
	}
}

func (h *TenantHandler) ensureTenantAccess(c *gin.Context, tenantID string) bool {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
		return false
	}

	allowed, err := h.tenantService.CheckUserTenantAccess(c.Request.Context(), userID, tenantID)
	if err != nil {
		response.InternalError(c, "TENANT_ACCESS_CHECK_FAILED", err.Error())
		return false
	}
	if !allowed {
		response.Forbidden(c, "TENANT_ACCESS_DENIED", "You do not have access to the requested tenant")
		return false
	}

	return true
}

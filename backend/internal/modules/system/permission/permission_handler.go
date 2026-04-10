package permission

import (
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type PermissionHandler struct {
	service PermissionService
}

func NewPermissionHandler(service PermissionService) *PermissionHandler {
	return &PermissionHandler{service: service}
}

// Create creates a permission.
// @Summary Create Permission
// @Description Create a permission in the current tenant.
// @Tags Permission Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body PermissionRequest true "Permission payload"
// @Success 201 {object} permissionEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/permissions [post]
func (h *PermissionHandler) Create(c *gin.Context) {
	var req PermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	perm, err := h.service.Create(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "CREATE_PERMISSION_FAILED", err.Error())
		return
	}
	response.Created(c, ToPermissionResponse(perm))
}

// GetByID gets permission detail by ID.
// @Summary Get Permission
// @Description Get permission detail by permission ID.
// @Tags Permission Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Permission ID"
// @Success 200 {object} permissionEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Router /system/permissions/{id} [get]
func (h *PermissionHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "PERMISSION_NOT_FOUND", "Permission not found")
		return
	}
	response.Success(c, resp)
}

// List lists permissions.
// @Summary List Permissions
// @Description Get paginated permission list.
// @Tags Permission Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(50) minimum(1) maximum(100)
// @Param search query string false "Search keyword matched against permission name or code"
// @Param status query string false "Permission status filter" Enums(active,inactive)
// @Success 200 {object} permissionListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/permissions [get]
func (h *PermissionHandler) List(c *gin.Context) {
	var req RoleListRequest
	_ = c.ShouldBindQuery(&req)
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 50
	}
	resp, err := h.service.List(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "LIST_PERMISSIONS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// Update updates a permission.
// @Summary Update Permission
// @Description Update permission information.
// @Tags Permission Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Permission ID"
// @Param request body PermissionRequest true "Permission payload"
// @Success 200 {object} permissionEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/permissions/{id} [put]
func (h *PermissionHandler) Update(c *gin.Context) {
	var req PermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	perm, err := h.service.Update(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		response.InternalError(c, "UPDATE_PERMISSION_FAILED", err.Error())
		return
	}
	response.Success(c, ToPermissionResponse(perm))
}

// Delete deletes a permission.
// @Summary Delete Permission
// @Description Delete a permission by ID.
// @Tags Permission Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Permission ID"
// @Success 200 {object} permissionMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/permissions/{id} [delete]
func (h *PermissionHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_PERMISSION_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchDelete deletes multiple permissions in one request.
// @Summary Batch Delete Permissions
// @Description Delete multiple permissions after checking that they are not bound to roles.
// @Tags Permission Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body PermissionBatchDeleteRequest true "Permission IDs"
// @Success 200 {object} permissionMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/permissions/batch-delete [post]
func (h *PermissionHandler) BatchDelete(c *gin.Context) {
	var req PermissionBatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchDelete(c.Request.Context(), req.PermissionIDs); err != nil {
		response.InternalError(c, "BATCH_DELETE_PERMISSION_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchUpdateStatus updates the status of multiple permissions.
// @Summary Batch Update Permission Status
// @Description Enable or disable multiple permissions and synchronize affected role authorization rules.
// @Tags Permission Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body PermissionStatusRequest true "Permission status payload"
// @Success 200 {object} permissionMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/permissions/status [patch]
func (h *PermissionHandler) BatchUpdateStatus(c *gin.Context) {
	var req PermissionStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchUpdateStatus(c.Request.Context(), &req); err != nil {
		response.InternalError(c, "BATCH_UPDATE_PERMISSION_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

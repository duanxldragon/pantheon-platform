package role

import (
	"errors"
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type RoleHandler struct {
	service RoleService
}

func NewRoleHandler(service RoleService) *RoleHandler {
	return &RoleHandler{service: service}
}

// Create creates a role.
// @Summary Create Role
// @Description Create a new role in the current tenant.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body RoleRequest true "Role payload"
// @Success 201 {object} roleEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/roles [post]
func (h *RoleHandler) Create(c *gin.Context) {
	var req RoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	r, err := h.service.Create(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, errInvalidRoleDataScope) {
			response.BadRequest(c, "INVALID_DATA_SCOPE", "Invalid role data scope", err.Error())
			return
		}
		if errors.Is(err, errRoleCodeExists) || errors.Is(err, errRoleNameExists) {
			response.BadRequest(c, "ROLE_CONFLICT", "Role code or name already exists", err.Error())
			return
		}
		response.InternalError(c, "CREATE_ROLE_FAILED", err.Error())
		return
	}
	response.Created(c, ToRoleResponse(r, nil, nil))
}

// GetByID gets role detail by ID.
// @Summary Get Role
// @Description Get role detail by role ID.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Role ID"
// @Success 200 {object} roleEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Router /system/roles/{id} [get]
func (h *RoleHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "ROLE_NOT_FOUND", "Role not found")
		return
	}
	response.Success(c, resp)
}

// List lists roles.
// @Summary List Roles
// @Description Get paginated role list for the current tenant.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param search query string false "Search keyword matched against role name or code"
// @Param type query string false "Role type filter" Enums(system,custom)
// @Param status query string false "Role status filter" Enums(active,inactive)
// @Success 200 {object} roleListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/roles [get]
func (h *RoleHandler) List(c *gin.Context) {
	var req RoleListRequest
	_ = c.ShouldBindQuery(&req)
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	resp, err := h.service.List(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "LIST_ROLES_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// Update updates a role.
// @Summary Update Role
// @Description Update role basic information and policy-related attributes.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Role ID"
// @Param request body RoleUpdateRequest true "Role payload"
// @Success 200 {object} roleEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/roles/{id} [put]
func (h *RoleHandler) Update(c *gin.Context) {
	var req RoleUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	r, err := h.service.Update(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		if errors.Is(err, errInvalidRoleDataScope) {
			response.BadRequest(c, "INVALID_DATA_SCOPE", "Invalid role data scope", err.Error())
			return
		}
		if errors.Is(err, errRoleCodeExists) || errors.Is(err, errRoleNameExists) {
			response.BadRequest(c, "ROLE_CONFLICT", "Role code or name already exists", err.Error())
			return
		}
		response.InternalError(c, "UPDATE_ROLE_FAILED", err.Error())
		return
	}
	response.Success(c, ToRoleResponse(r, nil, nil))
}

// Delete deletes a role.
// @Summary Delete Role
// @Description Delete a role by ID.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Role ID"
// @Success 200 {object} roleMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/roles/{id} [delete]
func (h *RoleHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_ROLE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchDelete deletes multiple roles in one request.
// @Summary Batch Delete Roles
// @Description Delete multiple custom roles after validating tenant ownership and member bindings.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body BatchDeleteRequest true "Role IDs"
// @Success 200 {object} roleMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/roles/batch-delete [post]
func (h *RoleHandler) BatchDelete(c *gin.Context) {
	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchDelete(c.Request.Context(), req.RoleIDs); err != nil {
		response.InternalError(c, "BATCH_DELETE_ROLE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchUpdateStatus updates the status of multiple roles.
// @Summary Batch Update Role Status
// @Description Enable or disable multiple roles and trigger the existing authorization refresh flow.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body RoleStatusRequest true "Role status payload"
// @Success 200 {object} roleMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/roles/status [patch]
func (h *RoleHandler) BatchUpdateStatus(c *gin.Context) {
	var req RoleStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchUpdateStatus(c.Request.Context(), &req); err != nil {
		response.InternalError(c, "BATCH_UPDATE_ROLE_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// AssignPermissions assigns permissions to a role.
// @Summary Assign Role Permissions
// @Description Replace the permission bindings of a role.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Role ID"
// @Param request body RolePermissionRequest true "Role permission payload"
// @Success 200 {object} roleMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/roles/{id}/permissions [post]
func (h *RoleHandler) AssignPermissions(c *gin.Context) {
	var req RolePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	req.RoleID = c.Param("id")
	if err := h.service.AssignPermissions(c.Request.Context(), &req); err != nil {
		response.InternalError(c, "ASSIGN_PERMISSIONS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// AssignMenus assigns menus to a role.
// @Summary Assign Role Menus
// @Description Replace the menu bindings of a role.
// @Tags Role Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Role ID"
// @Param request body RoleMenuRequest true "Role menu payload"
// @Success 200 {object} roleMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/roles/{id}/menus [post]
func (h *RoleHandler) AssignMenus(c *gin.Context) {
	var req RoleMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.AssignMenus(c.Request.Context(), c.Param("id"), req.MenuIDs); err != nil {
		response.InternalError(c, "ASSIGN_MENUS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

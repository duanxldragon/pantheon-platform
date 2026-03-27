package role

import (
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type RoleHandler struct {
	service RoleService
}

func NewRoleHandler(service RoleService) *RoleHandler {
	return &RoleHandler{service: service}
}

func (h *RoleHandler) Create(c *gin.Context) {
	var req RoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	r, err := h.service.Create(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "CREATE_ROLE_FAILED", err.Error())
		return
	}
	response.Created(c, ToRoleResponse(r, nil, nil))
}

func (h *RoleHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "ROLE_NOT_FOUND", "Role not found")
		return
	}
	response.Success(c, resp)
}

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

func (h *RoleHandler) Update(c *gin.Context) {
	var req RoleUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	r, err := h.service.Update(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		response.InternalError(c, "UPDATE_ROLE_FAILED", err.Error())
		return
	}
	response.Success(c, ToRoleResponse(r, nil, nil))
}

func (h *RoleHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_ROLE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

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

func (h *RoleHandler) RegisterRoutes(group *gin.RouterGroup) {
	roles := group.Group("/roles")
	{
		roles.GET("", h.List)
		roles.POST("", h.Create)
		roles.GET("/:id", h.GetByID)
		roles.PUT("/:id", h.Update)
		roles.DELETE("/:id", h.Delete)
		roles.POST("/:id/permissions", h.AssignPermissions)
		roles.POST("/:id/menus", h.AssignMenus)
	}
}

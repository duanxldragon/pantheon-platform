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

func (h *PermissionHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "PERMISSION_NOT_FOUND", "Permission not found")
		return
	}
	response.Success(c, resp)
}

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

func (h *PermissionHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_PERMISSION_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

func (h *PermissionHandler) RegisterRoutes(group *gin.RouterGroup) {
	perms := group.Group("/permissions")
	{
		perms.GET("", h.List)
		perms.POST("", h.Create)
		perms.GET("/:id", h.GetByID)
		perms.PUT("/:id", h.Update)
		perms.DELETE("/:id", h.Delete)
	}
}

package role

import "github.com/gin-gonic/gin"

// RegisterRoutes registers role routes.
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

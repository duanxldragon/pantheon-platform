package permission

import "github.com/gin-gonic/gin"

// RegisterRoutes registers permission routes.
func (h *PermissionHandler) RegisterRoutes(group *gin.RouterGroup) {
	perms := group.Group("/permissions")
	{
		perms.GET("", h.List)
		perms.POST("", h.Create)
		perms.POST("/batch-delete", h.BatchDelete)
		perms.PATCH("/status", h.BatchUpdateStatus)
		perms.GET("/:id", h.GetByID)
		perms.PUT("/:id", h.Update)
		perms.DELETE("/:id", h.Delete)
	}
}

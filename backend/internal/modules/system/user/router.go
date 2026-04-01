package user

import (
	"github.com/gin-gonic/gin"
	"pantheon-platform/backend/internal/shared/middleware"
)

// RegisterRoutes registers user routes.
func (h *UserHandler) RegisterRoutes(group *gin.RouterGroup) {
	users := group.Group("/users")
	{
		users.GET("", middleware.RequireDataScope("/api/v1/system/users"), h.List)
		users.POST("", h.Create)
		users.POST("/upload", h.UploadAvatar)
		users.GET("/:id", middleware.RequireDataScope("/api/v1/system/users"), h.GetByID)
		users.GET("/:id/permissions", middleware.RequireDataScope("/api/v1/system/users"), h.GetPermissions)
		users.PUT("/:id", h.Update)
		users.DELETE("/:id", h.Delete)
		users.PATCH("/status", h.BatchUpdateStatus)
		users.POST("/batch-delete", h.BatchDelete)
		users.PATCH("/:id/password", h.ResetPassword)
	}
}

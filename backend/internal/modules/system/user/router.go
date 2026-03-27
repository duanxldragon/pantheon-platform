package user

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers user routes.
func (h *UserHandler) RegisterRoutes(group *gin.RouterGroup) {
	users := group.Group("/users")
	{
		users.GET("", h.List)
		users.POST("", h.Create)
		users.POST("/upload", h.UploadAvatar)
		users.GET("/:id", h.GetByID)
		users.GET("/:id/permissions", h.GetPermissions)
		users.PUT("/:id", h.Update)
		users.DELETE("/:id", h.Delete)
		users.PATCH("/status", h.BatchUpdateStatus)
		users.POST("/batch-delete", h.BatchDelete)
		users.PATCH("/:id/password", h.ResetPassword)
	}
}

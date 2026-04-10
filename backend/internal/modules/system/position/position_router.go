package position

import "github.com/gin-gonic/gin"

// RegisterRoutes registers position routes.
func (h *PositionHandler) RegisterRoutes(group *gin.RouterGroup) {
	pos := group.Group("/positions")
	{
		pos.GET("", h.List)
		pos.POST("", h.Create)
		pos.POST("/batch-delete", h.BatchDelete)
		pos.PATCH("/status", h.BatchUpdateStatus)
		pos.GET("/:id", h.GetByID)
		pos.PUT("/:id", h.Update)
		pos.DELETE("/:id", h.Delete)
	}
}

package setting

import "github.com/gin-gonic/gin"

// RegisterRoutes registers setting routes.
func (h *SettingHandler) RegisterRoutes(group *gin.RouterGroup) {
	settings := group.Group("/settings")
	{
		settings.GET("", h.List)
		settings.PUT("/:key", h.Update)
		settings.POST("/batch", h.UpdateBatch)
	}
}

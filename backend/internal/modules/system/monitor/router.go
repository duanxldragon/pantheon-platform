package monitor

import "github.com/gin-gonic/gin"

// RegisterRoutes registers monitor routes.
func (h *MonitorHandler) RegisterRoutes(group *gin.RouterGroup) {
	mon := group.Group("/monitor")
	{
		mon.GET("/overview", h.Overview)
		mon.GET("/online-users", h.OnlineUsers)
	}
}

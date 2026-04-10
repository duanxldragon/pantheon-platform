package log

import "github.com/gin-gonic/gin"

// RegisterRoutes registers log routes.
func (h *LogHandler) RegisterRoutes(group *gin.RouterGroup) {
	logs := group.Group("/logs")
	{
		logs.GET("/operation", h.ListOperationLogs)
		logs.DELETE("/operation", h.ClearOperationLogs)
		logs.GET("/login", h.ListLoginLogs)
		logs.DELETE("/login", h.ClearLoginLogs)
	}
}

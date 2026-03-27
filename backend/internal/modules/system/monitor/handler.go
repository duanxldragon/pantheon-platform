package monitor

import (
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type MonitorHandler struct {
	svc MonitorService
}

func NewMonitorHandler(svc MonitorService) *MonitorHandler {
	return &MonitorHandler{svc: svc}
}

func (h *MonitorHandler) Overview(c *gin.Context) {
	resp, err := h.svc.Overview(c.Request.Context())
	if err != nil {
		response.InternalError(c, "MONITOR_OVERVIEW_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// OnlineUsers returns the count of currently online users.
func (h *MonitorHandler) OnlineUsers(c *gin.Context) {
	resp, err := h.svc.OnlineUsers(c.Request.Context())
	if err != nil {
		response.InternalError(c, "ONLINE_USERS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

func (h *MonitorHandler) RegisterRoutes(group *gin.RouterGroup) {
	mon := group.Group("/monitor")
	{
		mon.GET("/overview", h.Overview)
		mon.GET("/online-users", h.OnlineUsers)
	}
}

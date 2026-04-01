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

// Overview gets monitor overview.
// @Summary Get Monitor Overview
// @Description Get runtime, database, Redis, and service overview metrics.
// @Tags System Monitor
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} monitorOverviewEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/monitor/overview [get]
func (h *MonitorHandler) Overview(c *gin.Context) {
	resp, err := h.svc.Overview(c.Request.Context())
	if err != nil {
		response.InternalError(c, "MONITOR_OVERVIEW_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// OnlineUsers returns the count of currently online users.
// @Summary List Online Users
// @Description Get current online user sessions.
// @Tags System Monitor
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} monitorOnlineUsersEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/monitor/online-users [get]
func (h *MonitorHandler) OnlineUsers(c *gin.Context) {
	resp, err := h.svc.OnlineUsers(c.Request.Context())
	if err != nil {
		response.InternalError(c, "ONLINE_USERS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

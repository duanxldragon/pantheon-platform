package monitor

import "pantheon-platform/backend/internal/shared/response"

type monitorOverviewEnvelope struct {
	Code      int               `json:"code" example:"0"`
	Message   string            `json:"message" example:"success"`
	Data      *OverviewResponse `json:"data"`
	Meta      *response.Meta    `json:"meta,omitempty"`
	Timestamp string            `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type monitorOnlineUsersEnvelope struct {
	Code      int               `json:"code" example:"0"`
	Message   string            `json:"message" example:"success"`
	Data      *OnlineUserStatus `json:"data"`
	Meta      *response.Meta    `json:"meta,omitempty"`
	Timestamp string            `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

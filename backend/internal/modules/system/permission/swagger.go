package permission

import "pantheon-platform/backend/internal/shared/response"

type permissionMessageData struct {
	Message string `json:"message" example:"success"`
}

type permissionEnvelope struct {
	Code      int                 `json:"code" example:"0"`
	Message   string              `json:"message" example:"success"`
	Data      *PermissionResponse `json:"data"`
	Meta      *response.Meta      `json:"meta,omitempty"`
	Timestamp string              `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type permissionListData struct {
	Items      []*PermissionResponse `json:"items"`
	Pagination Pagination            `json:"pagination"`
}

type permissionListEnvelope struct {
	Code      int                `json:"code" example:"0"`
	Message   string             `json:"message" example:"success"`
	Data      permissionListData `json:"data"`
	Meta      *response.Meta     `json:"meta,omitempty"`
	Timestamp string             `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type permissionMessageEnvelope struct {
	Code      int                   `json:"code" example:"0"`
	Message   string                `json:"message" example:"success"`
	Data      permissionMessageData `json:"data"`
	Meta      *response.Meta        `json:"meta,omitempty"`
	Timestamp string                `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

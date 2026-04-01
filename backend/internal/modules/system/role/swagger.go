package role

import "pantheon-platform/backend/internal/shared/response"

type roleMessageData struct {
	Message string `json:"message" example:"success"`
}

type roleEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      *RoleResponse  `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type roleListData struct {
	Items      []*RoleResponse `json:"items"`
	Pagination Pagination      `json:"pagination"`
}

type roleListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      roleListData   `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type roleMessageEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      roleMessageData `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

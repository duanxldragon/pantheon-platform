package menu

import "pantheon-platform/backend/internal/shared/response"

type menuMessageData struct {
	Message string `json:"message" example:"success"`
}

type menuEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      *MenuResponse  `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type menuListData struct {
	Items      []*MenuResponse `json:"items"`
	Pagination Pagination      `json:"pagination"`
}

type menuListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      menuListData   `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type menuTreeEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      []*MenuResponse `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type menuMessageEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      menuMessageData `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

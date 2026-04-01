package position

import "pantheon-platform/backend/internal/shared/response"

type positionMessageData struct {
	Message string `json:"message" example:"success"`
}

type positionEnvelope struct {
	Code      int               `json:"code" example:"0"`
	Message   string            `json:"message" example:"success"`
	Data      *PositionResponse `json:"data"`
	Meta      *response.Meta    `json:"meta,omitempty"`
	Timestamp string            `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type positionListData struct {
	Items      []*PositionResponse `json:"items"`
	Pagination Pagination          `json:"pagination"`
}

type positionListEnvelope struct {
	Code      int              `json:"code" example:"0"`
	Message   string           `json:"message" example:"success"`
	Data      positionListData `json:"data"`
	Meta      *response.Meta   `json:"meta,omitempty"`
	Timestamp string           `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type positionMessageEnvelope struct {
	Code      int                 `json:"code" example:"0"`
	Message   string              `json:"message" example:"success"`
	Data      positionMessageData `json:"data"`
	Meta      *response.Meta      `json:"meta,omitempty"`
	Timestamp string              `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

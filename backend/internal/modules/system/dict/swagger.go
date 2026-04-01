package dict

import "pantheon-platform/backend/internal/shared/response"

type dictMessageData struct {
	Message string `json:"message" example:"success"`
}

type dictTypeEnvelope struct {
	Code      int               `json:"code" example:"0"`
	Message   string            `json:"message" example:"success"`
	Data      *DictTypeResponse `json:"data"`
	Meta      *response.Meta    `json:"meta,omitempty"`
	Timestamp string            `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type dictTypeListData struct {
	Items      []*DictTypeResponse `json:"items"`
	Pagination Pagination          `json:"pagination"`
}

type dictTypeListEnvelope struct {
	Code      int              `json:"code" example:"0"`
	Message   string           `json:"message" example:"success"`
	Data      dictTypeListData `json:"data"`
	Meta      *response.Meta   `json:"meta,omitempty"`
	Timestamp string           `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type dictDataEnvelope struct {
	Code      int               `json:"code" example:"0"`
	Message   string            `json:"message" example:"success"`
	Data      *DictDataResponse `json:"data"`
	Meta      *response.Meta    `json:"meta,omitempty"`
	Timestamp string            `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type dictDataListData struct {
	Items      []*DictDataResponse `json:"items"`
	Pagination Pagination          `json:"pagination"`
}

type dictDataListEnvelope struct {
	Code      int              `json:"code" example:"0"`
	Message   string           `json:"message" example:"success"`
	Data      dictDataListData `json:"data"`
	Meta      *response.Meta   `json:"meta,omitempty"`
	Timestamp string           `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type dictMessageEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      dictMessageData `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

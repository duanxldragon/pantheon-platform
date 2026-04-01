package log

import "pantheon-platform/backend/internal/shared/response"

type logMessageData struct {
	Message string `json:"message" example:"success"`
}

type operationLogListData struct {
	Items      []*OperationLogResponse `json:"items"`
	Pagination Pagination              `json:"pagination"`
}

type operationLogListEnvelope struct {
	Code      int                  `json:"code" example:"0"`
	Message   string               `json:"message" example:"success"`
	Data      operationLogListData `json:"data"`
	Meta      *response.Meta       `json:"meta,omitempty"`
	Timestamp string               `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type loginLogListData struct {
	Items      []*LoginLogResponse `json:"items"`
	Pagination Pagination          `json:"pagination"`
}

type loginLogListEnvelope struct {
	Code      int              `json:"code" example:"0"`
	Message   string           `json:"message" example:"success"`
	Data      loginLogListData `json:"data"`
	Meta      *response.Meta   `json:"meta,omitempty"`
	Timestamp string           `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type logMessageEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      logMessageData `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

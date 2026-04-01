package dept

import "pantheon-platform/backend/internal/shared/response"

type deptMessageData struct {
	Message string `json:"message" example:"success"`
}

type deptEnvelope struct {
	Code      int                 `json:"code" example:"0"`
	Message   string              `json:"message" example:"success"`
	Data      *DepartmentResponse `json:"data"`
	Meta      *response.Meta      `json:"meta,omitempty"`
	Timestamp string              `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type deptListData struct {
	Items      []*DepartmentResponse `json:"items"`
	Pagination Pagination            `json:"pagination"`
}

type deptListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      deptListData   `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type deptTreeEnvelope struct {
	Code      int                   `json:"code" example:"0"`
	Message   string                `json:"message" example:"success"`
	Data      []*DepartmentResponse `json:"data"`
	Meta      *response.Meta        `json:"meta,omitempty"`
	Timestamp string                `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type deptMessageEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      deptMessageData `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

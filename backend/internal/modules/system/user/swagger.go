package user

import "pantheon-platform/backend/internal/shared/response"

type userMessageData struct {
	Message string `json:"message" example:"success"`
}

type userAvatarUploadData struct {
	URL string `json:"url" example:"https://cdn.example.com/avatar/user-1.png"`
}

type userEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      *UserResponse  `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type userListData struct {
	Items      []*UserResponse `json:"items"`
	Pagination Pagination      `json:"pagination"`
}

type userListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      userListData   `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type userMessageEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      userMessageData `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type userStringListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      []string       `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type userAvatarUploadEnvelope struct {
	Code      int                  `json:"code" example:"0"`
	Message   string               `json:"message" example:"success"`
	Data      userAvatarUploadData `json:"data"`
	Meta      *response.Meta       `json:"meta,omitempty"`
	Timestamp string               `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

package setting

import "pantheon-platform/backend/internal/shared/response"

type settingMessageData struct {
	Message string `json:"message" example:"success"`
}

type settingBatchUpdateData struct {
	Message string `json:"message" example:"success"`
	Count   int    `json:"count" example:"2"`
}

type settingBatchUpdateRequest struct {
	Updates settingBatchUpdatePayload `json:"updates"`
}

type settingBatchUpdatePayload struct {
	SiteName    string `json:"site_name" example:"Pantheon Platform"`
	LoginNotice string `json:"login_notice" example:"Welcome back"`
}

type settingListEnvelope struct {
	Code      int                `json:"code" example:"0"`
	Message   string             `json:"message" example:"success"`
	Data      []*SettingResponse `json:"data"`
	Meta      *response.Meta     `json:"meta,omitempty"`
	Timestamp string             `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type settingMessageEnvelope struct {
	Code      int                `json:"code" example:"0"`
	Message   string             `json:"message" example:"success"`
	Data      settingMessageData `json:"data"`
	Meta      *response.Meta     `json:"meta,omitempty"`
	Timestamp string             `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

type settingBatchUpdateEnvelope struct {
	Code      int                    `json:"code" example:"0"`
	Message   string                 `json:"message" example:"success"`
	Data      settingBatchUpdateData `json:"data"`
	Meta      *response.Meta         `json:"meta,omitempty"`
	Timestamp string                 `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

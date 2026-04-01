package app

import (
	"pantheon-platform/backend/internal/modules/system/menu"
	"pantheon-platform/backend/internal/modules/system/user"
	"pantheon-platform/backend/internal/shared/response"
)

type UserProfileUpdateRequest = user.UserUpdateRequest

type UserPasswordUpdateRequest struct {
	Password    string `json:"password" binding:"required" example:"OldP@ssw0rd123"`
	NewPassword string `json:"new_password" binding:"required,min=6" example:"NewP@ssw0rd123"`
}

type appHealthResponse struct {
	Status      string `json:"status" example:"ok"`
	Environment string `json:"environment" example:"development"`
}
type appMessageData struct {
	Message string `json:"message" example:"success"`
}
type appStringListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      []string       `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type appMenuListEnvelope struct {
	Code      int                  `json:"code" example:"0"`
	Message   string               `json:"message" example:"success"`
	Data      []*menu.MenuResponse `json:"data"`
	Meta      *response.Meta       `json:"meta,omitempty"`
	Timestamp string               `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type appUserProfileEnvelope struct {
	Code      int                `json:"code" example:"0"`
	Message   string             `json:"message" example:"success"`
	Data      *user.UserResponse `json:"data"`
	Meta      *response.Meta     `json:"meta,omitempty"`
	Timestamp string             `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type appMessageEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      appMessageData `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

// HealthDoc godoc
// @Summary Health Check
// @Description Get service health information.
// @Tags Infrastructure
// @Accept json
// @Produce json
// @Success 200 {object} appHealthResponse
// @Router /health [get]
func HealthDoc() {}

// GetUserPermissionsDoc godoc
// @Summary Get Current User Permissions
// @Description Get aggregated permissions for the authenticated user after login.
// @Tags User Self-Service
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} appStringListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /user/permissions [get]
func GetUserPermissionsDoc() {}

// GetUserMenusDoc godoc
// @Summary Get Current User Menus
// @Description Get dynamic menu tree for the authenticated user after login.
// @Tags User Self-Service
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} appMenuListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /user/menus [get]
func GetUserMenusDoc() {}

// GetUserProfileDoc godoc
// @Summary Get Current User Profile
// @Description Get the profile of the authenticated user.
// @Tags User Self-Service
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} appUserProfileEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /user/profile [get]
func GetUserProfileDoc() {}

// UpdateUserProfileDoc godoc
// @Summary Update Current User Profile
// @Description Update the profile of the authenticated user.
// @Tags User Self-Service
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body UserProfileUpdateRequest true "User profile payload"
// @Success 200 {object} appUserProfileEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /user/profile [put]
func UpdateUserProfileDoc() {}

// UpdateUserPasswordDoc godoc
// @Summary Change Current User Password
// @Description Change password for the authenticated user.
// @Tags User Self-Service
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body UserPasswordUpdateRequest true "Password update payload"
// @Success 200 {object} appMessageEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /user/password [put]
func UpdateUserPasswordDoc() {}

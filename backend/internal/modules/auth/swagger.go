package auth

import (
	"time"

	"pantheon-platform/backend/internal/shared/response"
)

type authPublicConfigData struct {
	EnableMultiTenant       bool   `json:"enable_multi_tenant" example:"true"`
	Enable2FA               bool   `json:"enable_2fa" example:"true"`
	LoginRequiresTenantCode bool   `json:"login_requires_tenant_code" example:"true"`
	DeploymentMode          string `json:"deployment_mode" example:"single"`
	TenantStrategy          string `json:"tenant_strategy" example:"shared_db"`
}

type authMessageData struct {
	Message string `json:"message" example:"success"`
}

type authCurrentUserEnvelope struct {
	Code      int                  `json:"code" example:"0"`
	Message   string               `json:"message" example:"success"`
	Data      *CurrentUserResponse `json:"data"`
	Meta      *response.Meta       `json:"meta,omitempty"`
	Timestamp string               `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authLoginEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      *LoginResponse `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authRefreshEnvelope struct {
	Code      int                   `json:"code" example:"0"`
	Message   string                `json:"message" example:"success"`
	Data      *RefreshTokenResponse `json:"data"`
	Meta      *response.Meta        `json:"meta,omitempty"`
	Timestamp string                `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authConfigEnvelope struct {
	Code      int                  `json:"code" example:"0"`
	Message   string               `json:"message" example:"success"`
	Data      authPublicConfigData `json:"data"`
	Meta      *response.Meta       `json:"meta,omitempty"`
	Timestamp string               `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authApiKeyEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      *ApiKeyResponse `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authApiKeyListEnvelope struct {
	Code      int                 `json:"code" example:"0"`
	Message   string              `json:"message" example:"success"`
	Data      *ApiKeyListResponse `json:"data"`
	Meta      *response.Meta      `json:"meta,omitempty"`
	Timestamp string              `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authLoginAttemptsEnvelope struct {
	Code      int                  `json:"code" example:"0"`
	Message   string               `json:"message" example:"success"`
	Data      *LoginAttemptSummary `json:"data"`
	Meta      *response.Meta       `json:"meta,omitempty"`
	Timestamp string               `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authValidatePasswordEnvelope struct {
	Code      int                       `json:"code" example:"0"`
	Message   string                    `json:"message" example:"success"`
	Data      *ValidatePasswordResponse `json:"data"`
	Meta      *response.Meta            `json:"meta,omitempty"`
	Timestamp string                    `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authTwoFactorEnvelope struct {
	Code      int                    `json:"code" example:"0"`
	Message   string                 `json:"message" example:"success"`
	Data      *TwoFactorAuthResponse `json:"data"`
	Meta      *response.Meta         `json:"meta,omitempty"`
	Timestamp string                 `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authVerify2FAEnvelope struct {
	Code      int                `json:"code" example:"0"`
	Message   string             `json:"message" example:"success"`
	Data      *Verify2FAResponse `json:"data"`
	Meta      *response.Meta     `json:"meta,omitempty"`
	Timestamp string             `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authBackupCodesEnvelope struct {
	Code      int                          `json:"code" example:"0"`
	Message   string                       `json:"message" example:"success"`
	Data      *GenerateBackupCodesResponse `json:"data"`
	Meta      *response.Meta               `json:"meta,omitempty"`
	Timestamp string                       `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authSessionsEnvelope struct {
	Code      int                     `json:"code" example:"0"`
	Message   string                  `json:"message" example:"success"`
	Data      *ActiveSessionsResponse `json:"data"`
	Meta      *response.Meta          `json:"meta,omitempty"`
	Timestamp string                  `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authLoginHistoryItem struct {
	ID       string     `json:"id" example:"login-log-1"`
	Username string     `json:"username" example:"admin"`
	IP       string     `json:"ip" example:"127.0.0.1"`
	Location string     `json:"location" example:"Local"`
	Browser  string     `json:"browser" example:"Chrome"`
	OS       string     `json:"os" example:"Windows"`
	Status   string     `json:"status" example:"success"`
	Message  string     `json:"message" example:"success"`
	LoginAt  time.Time  `json:"login_at" example:"2026-03-30T09:00:00Z"`
	LogoutAt *time.Time `json:"logout_at,omitempty"`
}
type authLoginHistoryPagination struct {
	Page     int64 `json:"page" example:"1"`
	PageSize int64 `json:"page_size" example:"20"`
	Total    int64 `json:"total" example:"2"`
}
type authLoginHistoryData struct {
	Items      []*authLoginHistoryItem    `json:"items"`
	Pagination authLoginHistoryPagination `json:"pagination"`
}
type authLoginHistoryEnvelope struct {
	Code      int                  `json:"code" example:"0"`
	Message   string               `json:"message" example:"success"`
	Data      authLoginHistoryData `json:"data"`
	Meta      *response.Meta       `json:"meta,omitempty"`
	Timestamp string               `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type authMessageEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      authMessageData `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

// GetLoginHistoryDoc godoc
// @Summary Get Login History
// @Description Get paginated login history for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} authLoginHistoryEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/login-history [get]
func GetLoginHistoryDoc() {}

// GetLoginAttemptsDoc godoc
// @Summary Get Login Attempts
// @Description Get login attempt summary for a username and optional tenant code.
// @Tags Authentication
// @Accept json
// @Produce json
// @Param username query string true "Username used for the login attempt lookup"
// @Param tenant_code query string false "Tenant code filter in multi-tenant deployments"
// @Success 200 {object} authLoginAttemptsEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/attempts [get]
func GetLoginAttemptsDoc() {}

// ValidatePasswordDoc godoc
// @Summary Validate Password
// @Description Validate password strength against the default policy.
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body ValidatePasswordRequest true "Password validation payload"
// @Success 200 {object} authValidatePasswordEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Router /auth/validate-password [post]
func ValidatePasswordDoc() {}

// UnlockAccountDoc godoc
// @Summary Unlock Account
// @Description Clear lock state for a user account.
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body UnlockAccountRequest true "Unlock payload"
// @Success 200 {object} authMessageEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/unlock [post]
func UnlockAccountDoc() {}

// GetPublicConfigDoc godoc
// @Summary Get Public Auth Config
// @Description Get public authentication configuration.
// @Tags Authentication
// @Accept json
// @Produce json
// @Success 200 {object} authConfigEnvelope
// @Router /auth/config [get]
func GetPublicConfigDoc() {}

// CreateApiKeyDoc godoc
// @Summary Create API Key
// @Description Create an API key for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body CreateApiKeyRequest true "API key payload"
// @Success 201 {object} authApiKeyEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/api-keys [post]
func CreateApiKeyDoc() {}

// ListApiKeysDoc godoc
// @Summary List API Keys
// @Description List API keys for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} authApiKeyListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/api-keys [get]
func ListApiKeysDoc() {}

// UpdateApiKeyDoc godoc
// @Summary Update API Key
// @Description Update one API key for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "API Key ID"
// @Param request body UpdateApiKeyRequest true "API key payload"
// @Success 200 {object} authMessageEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/api-keys/{id} [put]
func UpdateApiKeyDoc() {}

// DeleteApiKeyDoc godoc
// @Summary Delete API Key
// @Description Delete one API key for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "API Key ID"
// @Success 200 {object} authMessageEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/api-keys/{id} [delete]
func DeleteApiKeyDoc() {}

// GetTwoFactorAuthStatusDoc godoc
// @Summary Get 2FA Status
// @Description Get current two-factor authentication status.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} authTwoFactorEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/2fa/status [get]
func GetTwoFactorAuthStatusDoc() {}

// EnableTwoFactorAuthDoc godoc
// @Summary Start 2FA Setup
// @Description Start two-factor authentication setup for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} authTwoFactorEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/2fa/enable [post]
func EnableTwoFactorAuthDoc() {}

// VerifyAndEnable2FADoc godoc
// @Summary Verify And Enable 2FA
// @Description Verify setup code and enable two-factor authentication.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body Enable2FARequest true "2FA verify payload"
// @Success 200 {object} authMessageEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Router /auth/2fa/verify [post]
func VerifyAndEnable2FADoc() {}

// DisableTwoFactorAuthDoc godoc
// @Summary Disable 2FA
// @Description Disable two-factor authentication for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body Disable2FARequest true "Disable 2FA payload"
// @Success 200 {object} authMessageEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Router /auth/2fa/disable [post]
func DisableTwoFactorAuthDoc() {}

// GenerateNewBackupCodesDoc godoc
// @Summary Regenerate Backup Codes
// @Description Generate new backup codes for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body GenerateBackupCodesRequest true "Backup code payload"
// @Success 200 {object} authBackupCodesEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/2fa/backup-codes [post]
func GenerateNewBackupCodesDoc() {}

// Verify2FACodeDoc godoc
// @Summary Verify 2FA Code
// @Description Verify a two-factor authentication code for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body Verify2FARequest true "2FA code payload"
// @Success 200 {object} authVerify2FAEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/2fa/verify-code [post]
func Verify2FACodeDoc() {}

// VerifyLogin2FADoc godoc
// @Summary Complete Login With 2FA
// @Description Complete login after password validation and 2FA verification.
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body Login2FAVerifyRequest true "Login 2FA payload"
// @Success 200 {object} authLoginEnvelope
// @Failure 400 {object} response.ErrorDetail
// @Failure 401 {object} response.ErrorDetail
// @Router /auth/2fa/login [post]
func VerifyLogin2FADoc() {}

// ListSessionsDoc godoc
// @Summary List Sessions
// @Description List active sessions for the current user.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} authSessionsEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/sessions [get]
func ListSessionsDoc() {}

// KickSessionDoc godoc
// @Summary Kick Session
// @Description Invalidate a specific active session.
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param jti path string true "Session JTI"
// @Success 200 {object} authMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /auth/sessions/{jti} [delete]
func KickSessionDoc() {}

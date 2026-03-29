package auth

import "github.com/google/uuid"

type CurrentUserResponse struct {
	ID           uuid.UUID `json:"id"`
	Username     string    `json:"username"`
	RealName     string    `json:"real_name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	Avatar       string    `json:"avatar"`
	Status       string    `json:"status"`
	TenantID     string    `json:"tenant_id,omitempty"`
	TenantCode   string    `json:"tenant_code,omitempty"`
	DepartmentID string    `json:"department_id,omitempty"`
	PositionID   string    `json:"position_id,omitempty"`
	RoleIDs      []string  `json:"role_ids,omitempty"`
	RoleNames    []string  `json:"role_names,omitempty"`
	LastLoginAt  string    `json:"last_login_at,omitempty"`
	LastLoginIP  string    `json:"last_login_ip,omitempty"`
}

type LoginRequest struct {
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password" binding:"required"`
	TenantCode string `json:"tenant_code"`
}

type LoginResponse struct {
	AccessToken             string              `json:"access_token,omitempty"`
	RefreshToken            string              `json:"refresh_token,omitempty"`
	TokenType               string              `json:"token_type,omitempty"`
	ExpiresIn               int                 `json:"expires_in,omitempty"`
	Require2FA              bool                `json:"require_2fa,omitempty"`
	TempToken               string              `json:"temp_token,omitempty"`
	EnableMultiTenant       bool                `json:"enable_multi_tenant"`
	LoginRequiresTenantCode bool                `json:"login_requires_tenant_code,omitempty"`
	User                    CurrentUserResponse `json:"user,omitempty"`
}

type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type RequestPasswordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ValidateResetTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type PasswordResetResponse struct {
	Message string `json:"message"`
	UserID  string `json:"user_id,omitempty"`
}

type CreateApiKeyRequest struct {
	Name        string `json:"name" binding:"required"`
	Permissions string `json:"permissions" binding:"required"`
}

type UpdateApiKeyRequest struct {
	Name        string `json:"name"`
	Permissions string `json:"permissions"`
}

type DeleteApiKeyRequest struct {
	ID string `json:"id" binding:"required"`
}

type UnlockAccountRequest struct {
	Username   string `json:"username" binding:"required"`
	TenantCode string `json:"tenant_code"`
	Email      string `json:"email,omitempty"`
}

type ApiKeyListResponse struct {
	Items []ApiKeyItem `json:"items"`
}

type ApiKeyItem struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	KeyPreview  string `json:"key_preview"`
	Permissions string `json:"permissions"`
	CreatedAt   string `json:"created_at"`
	LastUsed    string `json:"last_used,omitempty"`
}

type ApiKeyResponse struct {
	ID          string `json:"id"`
	UserID      string `json:"user_id"`
	Name        string `json:"name"`
	Key         string `json:"key"`
	Permissions string `json:"permissions"`
	LastUsed    string `json:"last_used,omitempty"`
	CreatedAt   string `json:"created_at"`
}

type ValidatePasswordRequest struct {
	Password string `json:"password" binding:"required,min=8,max=128"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

type ValidatePasswordResponse struct {
	Valid        bool             `json:"valid"`
	Strength     PasswordStrength `json:"strength"`
	Score        int              `json:"score"`
	Errors       []string         `json:"errors"`
	Requirements map[string]bool  `json:"requirements"`
}

type TwoFactorAuthResponse struct {
	Enabled     bool     `json:"enabled"`
	QRCodeURL   string   `json:"qr_code_url,omitempty"`
	Secret      string   `json:"secret,omitempty"`
	BackupCodes []string `json:"backup_codes,omitempty"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
}

type Enable2FARequest struct {
	Code string `json:"code" binding:"required,min=6,max=8"`
}

type Disable2FARequest struct {
	Password string `json:"password" binding:"required"`
}

type GenerateBackupCodesRequest struct {
	Count int `json:"count" binding:"required,min=1,max=10"`
}

type GenerateBackupCodesResponse struct {
	BackupCodes []string `json:"backup_codes"`
	AllCodes    []string `json:"all_codes"`
}

type Verify2FARequest struct {
	Code string `json:"code" binding:"required,min=6,max=8"`
}

type Login2FAVerifyRequest struct {
	TempToken string `json:"temp_token" binding:"required"`
	Code      string `json:"code" binding:"required"`
}

type Verify2FAResponse struct {
	Valid bool   `json:"valid"`
	Info  string `json:"info,omitempty"`
}

type LoginWith2FARequest struct {
	LoginRequest
	TwoFactorCode string `json:"two_factor_code" binding:"required,len=6"`
}

type SessionInfo struct {
	JTI        string `json:"jti"`
	DeviceName string `json:"device_name"`
	IPAddress  string `json:"ip_address"`
	LoginTime  int64  `json:"login_time"`
	LastActive int64  `json:"last_active"`
	IsCurrent  bool   `json:"is_current"`
}

type ActiveSessionsResponse struct {
	Sessions    []SessionInfo `json:"sessions"`
	MaxSessions int           `json:"max_sessions"`
}

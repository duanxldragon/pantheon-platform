package auth

import "github.com/google/uuid"

type CurrentUserResponse struct {
	ID           uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Username     string    `json:"username" example:"admin"`
	RealName     string    `json:"real_name" example:"Platform Admin"`
	Email        string    `json:"email" example:"admin@example.com"`
	Phone        string    `json:"phone" example:"13800138000"`
	Avatar       string    `json:"avatar" example:"https://cdn.example.com/avatar/admin.png"`
	Status       string    `json:"status" example:"active"`
	TenantID     string    `json:"tenant_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	TenantCode   string    `json:"tenant_code,omitempty" example:"default"`
	DepartmentID string    `json:"department_id,omitempty" example:"dept-root"`
	PositionID   string    `json:"position_id,omitempty" example:"position-admin"`
	RoleIDs      []string  `json:"role_ids,omitempty" example:"role-super-admin,role-auditor"`
	RoleNames    []string  `json:"role_names,omitempty" example:"Super Admin,Auditor"`
	LastLoginAt  string    `json:"last_login_at,omitempty" example:"2026-03-30T10:00:00Z"`
	LastLoginIP  string    `json:"last_login_ip,omitempty" example:"127.0.0.1"`
}

type LoginRequest struct {
	Username   string `json:"username" binding:"required" example:"admin"`
	Password   string `json:"password" binding:"required" example:"P@ssw0rd123"`
	TenantCode string `json:"tenant_code" example:"default"`
}

type LoginResponse struct {
	AccessToken             string              `json:"access_token,omitempty" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken            string              `json:"refresh_token,omitempty" example:"refresh_token_example"`
	TokenType               string              `json:"token_type,omitempty" example:"Bearer"`
	ExpiresIn               int                 `json:"expires_in,omitempty" example:"7200"`
	Require2FA              bool                `json:"require_2fa,omitempty" example:"false"`
	TempToken               string              `json:"temp_token,omitempty" example:"temp_token_example"`
	EnableMultiTenant       bool                `json:"enable_multi_tenant" example:"true"`
	LoginRequiresTenantCode bool                `json:"login_requires_tenant_code,omitempty" example:"true"`
	User                    CurrentUserResponse `json:"user,omitempty"`
}

type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token" example:"eyJhbGciOiJIUzI1NiJ9.refresh.new"`
	RefreshToken string `json:"refresh_token" example:"refresh_token_new_example"`
	TokenType    string `json:"token_type" example:"Bearer"`
	ExpiresIn    int    `json:"expires_in" example:"7200"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required" example:"refresh_token_example"`
}

type RequestPasswordResetRequest struct {
	Email string `json:"email" binding:"required,email" example:"admin@example.com"`
}

type ValidateResetTokenRequest struct {
	Token string `json:"token" binding:"required" example:"reset_token_example"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required" example:"reset_token_example"`
	Password string `json:"password" binding:"required,min=6" example:"N3wP@ssw0rd123"`
}

type PasswordResetResponse struct {
	Message string `json:"message" example:"password reset email sent"`
	UserID  string `json:"user_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
}

type CreateApiKeyRequest struct {
	Name        string   `json:"name" binding:"required" example:"CI Integration Key"`
	Permissions string   `json:"permissions" binding:"required" example:"system:user:list,system:user:create"`
	AllowedIPs  []string `json:"allowed_ips,omitempty" example:"10.0.0.10,192.168.1.0/24"`
	RateLimit   int      `json:"rate_limit,omitempty" example:"60"`
	ExpiresAt   string   `json:"expires_at,omitempty" example:"2026-07-01T00:00:00Z"`
}

type UpdateApiKeyRequest struct {
	Name        string   `json:"name" example:"CI Integration Key"`
	Permissions string   `json:"permissions" example:"system:user:list,system:user:create"`
	AllowedIPs  []string `json:"allowed_ips,omitempty" example:"10.0.0.10,192.168.1.0/24"`
	RateLimit   int      `json:"rate_limit,omitempty" example:"60"`
	ExpiresAt   string   `json:"expires_at,omitempty" example:"2026-07-01T00:00:00Z"`
}

type DeleteApiKeyRequest struct {
	ID string `json:"id" binding:"required" example:"api-key-1"`
}

type UnlockAccountRequest struct {
	Username   string `json:"username" binding:"required" example:"admin"`
	TenantCode string `json:"tenant_code" example:"default"`
	Email      string `json:"email,omitempty" example:"admin@example.com"`
}

type ApiKeyListResponse struct {
	Items []ApiKeyItem `json:"items"`
}

type ApiKeyItem struct {
	ID          string   `json:"id" example:"api-key-1"`
	Name        string   `json:"name" example:"CI Integration Key"`
	KeyPreview  string   `json:"key_preview" example:"pk_live_****abcd"`
	Permissions string   `json:"permissions" example:"system:user:list,system:user:create"`
	AllowedIPs  []string `json:"allowed_ips,omitempty" example:"10.0.0.10,192.168.1.0/24"`
	RateLimit   int      `json:"rate_limit" example:"60"`
	CreatedAt   string   `json:"created_at" example:"2026-03-30T10:00:00Z"`
	ExpiresAt   string   `json:"expires_at,omitempty" example:"2026-07-01T00:00:00Z"`
	LastUsed    string   `json:"last_used,omitempty" example:"2026-03-30T12:00:00Z"`
}

type ApiKeyResponse struct {
	ID          string   `json:"id" example:"api-key-1"`
	UserID      string   `json:"user_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string   `json:"name" example:"CI Integration Key"`
	Key         string   `json:"key" example:"pk_live_xxx"`
	Permissions string   `json:"permissions" example:"system:user:list,system:user:create"`
	AllowedIPs  []string `json:"allowed_ips,omitempty" example:"10.0.0.10,192.168.1.0/24"`
	RateLimit   int      `json:"rate_limit" example:"60"`
	ExpiresAt   string   `json:"expires_at,omitempty" example:"2026-07-01T00:00:00Z"`
	LastUsed    string   `json:"last_used,omitempty" example:"2026-03-30T12:00:00Z"`
	CreatedAt   string   `json:"created_at" example:"2026-03-30T10:00:00Z"`
}

type APIKeyAuthResult struct {
	KeyID       string
	UserID      string
	Permissions []string
	AllowedIPs  []string
	RateLimit   int
	AuthType    string
}

type ValidatePasswordRequest struct {
	Password string `json:"password" binding:"required,min=8,max=128" example:"P@ssw0rd123"`
	Username string `json:"username" example:"admin"`
	Email    string `json:"email" example:"admin@example.com"`
}

type ValidatePasswordResponse struct {
	Valid        bool             `json:"valid" example:"true"`
	Strength     PasswordStrength `json:"strength"`
	Score        int              `json:"score" example:"4"`
	Errors       []string         `json:"errors" example:"password_too_short,must_include_uppercase"`
	Requirements map[string]bool  `json:"requirements" example:"min_length:true,uppercase:false,number:true,special:true"`
}

type TwoFactorAuthResponse struct {
	Enabled     bool     `json:"enabled" example:"true"`
	QRCodeURL   string   `json:"qr_code_url,omitempty" example:"otpauth://totp/Pantheon:admin@example.com?secret=ABC123"`
	Secret      string   `json:"secret,omitempty" example:"ABC123DEF456"`
	BackupCodes []string `json:"backup_codes,omitempty" example:"PTN-123456,PTN-234567"`
	CreatedAt   string   `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt   string   `json:"updated_at" example:"2026-03-30T10:10:00Z"`
}

type Enable2FARequest struct {
	Code string `json:"code" binding:"required,min=6,max=8" example:"123456"`
}

type Disable2FARequest struct {
	Password string `json:"password" binding:"required" example:"P@ssw0rd123"`
}

type GenerateBackupCodesRequest struct {
	Count int `json:"count" binding:"required,min=1,max=10" example:"10"`
}

type GenerateBackupCodesResponse struct {
	BackupCodes []string `json:"backup_codes" example:"PTN-123456,PTN-234567"`
	AllCodes    []string `json:"all_codes" example:"PTN-123456,PTN-234567,PTN-345678"`
}

type Verify2FARequest struct {
	Code string `json:"code" binding:"required,min=6,max=8" example:"123456"`
}

type Login2FAVerifyRequest struct {
	TempToken string `json:"temp_token" binding:"required" example:"temp_token_example"`
	Code      string `json:"code" binding:"required" example:"123456"`
}

type Verify2FAResponse struct {
	Valid bool   `json:"valid" example:"true"`
	Info  string `json:"info,omitempty" example:"code accepted"`
}

type LoginWith2FARequest struct {
	LoginRequest
	TwoFactorCode string `json:"two_factor_code" binding:"required,len=6" example:"123456"`
}

type SessionInfo struct {
	JTI        string `json:"jti" example:"session-jti-1"`
	DeviceName string `json:"device_name" example:"Chrome on Windows"`
	IPAddress  string `json:"ip_address" example:"127.0.0.1"`
	LoginTime  int64  `json:"login_time" example:"1711783200"`
	LastActive int64  `json:"last_active" example:"1711786800"`
	IsCurrent  bool   `json:"is_current" example:"true"`
}

type ActiveSessionsResponse struct {
	Sessions    []SessionInfo `json:"sessions"`
	MaxSessions int           `json:"max_sessions" example:"5"`
}

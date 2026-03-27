package auth

import (
	"context"
	"gorm.io/gorm"
	"pantheon-platform/backend/internal/config"
	systemlog "pantheon-platform/backend/internal/modules/system/log"
	"pantheon-platform/backend/internal/modules/system/user"
	"pantheon-platform/backend/internal/modules/tenant"
	"pantheon-platform/backend/internal/shared/cache"
	"pantheon-platform/backend/internal/shared/database"
	"pantheon-platform/backend/internal/shared/middleware"
)

// AuthService defines authentication business capabilities.
type AuthService interface {
	GetPublicConfig() map[string]interface{}
	Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error)
	Logout(ctx context.Context, userID, jti string) error
	ValidateToken(tokenString string) (*middleware.Claims, error)
	RefreshToken(ctx context.Context, refreshToken string) (*RefreshTokenResponse, error)
	GetCurrentUser(ctx context.Context, userID, username, tenantID string) (*CurrentUserResponse, error)
	VerifyLogin2FA(ctx context.Context, tempToken, code, clientIP, userAgent string) (*LoginResponse, error)
	ListActiveSessions(ctx context.Context, userID, currentJTI string) (*ActiveSessionsResponse, error)
	KickSession(ctx context.Context, userID, jti string) error
	ParseTokenClaims(tokenString string) (*middleware.Claims, error)
	CreateApiKey(ctx context.Context, userID, name, permissions string) (*ApiKeyResponse, error)
	ListApiKeys(ctx context.Context, userID string) (*ApiKeyListResponse, error)
	DeleteApiKey(ctx context.Context, userID, keyID string) error
	UpdateApiKey(ctx context.Context, userID, keyID, name, permissions string) error
	ValidateApiKey(ctx context.Context, apiKey string) (string, error)
	GetLoginAttemptsSummary(ctx context.Context, username, tenantCode string) (*LoginAttemptSummary, error)
	UnlockAccount(ctx context.Context, username, tenantCode string) error
	GetTwoFactorAuthStatus(ctx context.Context, userID, tenantID string) (*TwoFactorAuthResponse, error)
	EnableTwoFactorAuth(ctx context.Context, userID, tenantID string) (*TwoFactorAuthResponse, error)
	VerifyAndEnable2FA(ctx context.Context, userID, tenantID, code string) error
	DisableTwoFactorAuth(ctx context.Context, userID, tenantID, password string) error
	GenerateNewBackupCodes(ctx context.Context, userID, tenantID string, count int) (*GenerateBackupCodesResponse, error)
	Verify2FACode(ctx context.Context, userID, tenantID, code string) (*Verify2FAResponse, error)
	GetTenantDB(tenantID string) *gorm.DB
}
type authService struct {
	masterDB    *gorm.DB
	dbManager   *database.Manager
	userService user.UserService
	tenantRepo  tenant.TenantRepository
	logService  systemlog.LogService
	redisClient *cache.RedisClient
	apiKeyRepo  ApiKeyRepository
	jwtSecret   []byte
	expiresIn   int
	config      *config.Config
}

// NewAuthService creates an authentication service.
func NewAuthService(
	masterDB *gorm.DB,
	dbManager *database.Manager,
	userService user.UserService,
	tenantRepo tenant.TenantRepository,
	logService systemlog.LogService,
	redisClient *cache.RedisClient,
	cfg *config.Config,
	apiKeyRepo ApiKeyRepository,
) AuthService {
	secret := cfg.JWTSecret
	if secret == "" {
		secret = "change-this-secret-in-production"
	}
	exp := cfg.JWTExpiresIn
	if exp <= 0 {
		exp = 7200
	}
	return &authService{
		masterDB:    masterDB,
		dbManager:   dbManager,
		userService: userService,
		tenantRepo:  tenantRepo,
		logService:  logService,
		redisClient: redisClient,
		apiKeyRepo:  apiKeyRepo,
		jwtSecret:   []byte(secret),
		expiresIn:   exp,
		config:      cfg,
	}
}

// GetPublicConfig returns the public authentication configuration.
func (s *authService) GetPublicConfig() map[string]interface{} {
	return map[string]interface{}{
		"enable_multi_tenant":        s.config.EnableMultiTenant,
		"enable_2fa":                 s.config.Security.Enable2FA,
		"login_requires_tenant_code": s.loginRequiresTenantCode(),
		"deployment_mode":            s.config.Deployment.Mode,
		"tenant_strategy":            s.config.Deployment.TenantStrategy,
	}
}

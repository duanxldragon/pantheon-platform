package auth

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	systemlog "pantheon-platform/backend/internal/modules/system/log"
	"pantheon-platform/backend/internal/modules/system/user"
	"pantheon-platform/backend/internal/modules/tenant"
	"pantheon-platform/backend/internal/shared/middleware"
)

func (s *authService) Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error) {
	var clientIP, userAgent string
	requestedTenantCode := strings.TrimSpace(req.TenantCode)

	if ip, ok := ctx.Value("client_ip").(string); ok {
		clientIP = ip
	}
	if ua, ok := ctx.Value("user_agent").(string); ok {
		userAgent = ua
	}

	if requestedTenantCode == "" && s.config != nil && s.config.IsPrivateSingleTenantMode() && s.config.DefaultTenantID != "" {
		if defaultTenant, err := s.tenantDAO.GetByID(ctx, s.config.DefaultTenantID); err == nil {
			requestedTenantCode = defaultTenant.Code
		}
	}

	// Check whether the account is locked before validating credentials.
	isLocked, _, err := s.checkAccountLocked(ctx, req.Username, requestedTenantCode)
	if err != nil {
		return nil, err
	}
	if isLocked {
		return nil, ErrAccountLocked
	}

	var userID string
	var username string
	var passwordHash string
	var realName string
	var email string
	var phone string
	var avatar string
	var status string
	var tenantID string
	var tenantCode string
	var departmentID string
	var positionID string

	writeCtx := ctx
	if requestedTenantCode != "" {
		// Resolve the tenant and switch the context to the tenant database.
		tenantRecord, err := s.tenantDAO.GetByCode(ctx, requestedTenantCode)
		if err != nil {
			if errors.Is(err, tenant.ErrTenantNotFound) {
				return nil, ErrInvalidCredentials
			}
			return nil, err
		}

		if tenantRecord.Status != tenant.TenantStatusActive {
			return nil, ErrTenantInactive
		}

		tenantID = tenantRecord.ID.String()
		tenantCode = tenantRecord.Code

		tenantDB := s.dbManager.GetTenantDB(tenantRecord.ID)
		if tenantDB == nil {
			return nil, ErrTenantDBNotConfigured
		}

		tenantCtx := context.WithValue(ctx, "tenant_db", tenantDB)
		tenantCtx = context.WithValue(tenantCtx, "tenant_id", tenantID)
		writeCtx = tenantCtx

		userRecord, err := s.userService.GetByUsername(tenantCtx, req.Username)
		if err != nil {
			return nil, ErrInvalidCredentials
		}

		if userRecord.TenantID != tenantID {
			return nil, ErrInvalidCredentials
		}

		userID = userRecord.ID.String()
		username = userRecord.Username
		passwordHash = userRecord.PasswordHash
		realName = userRecord.RealName
		email = userRecord.Email
		phone = userRecord.Phone
		if userRecord.Avatar != nil {
			avatar = *userRecord.Avatar
		}
		status = userRecord.Status
		if userRecord.DepartmentID != nil {
			departmentID = *userRecord.DepartmentID
		}
		if userRecord.PositionID != nil {
			positionID = *userRecord.PositionID
		}
	} else {
		// Platform admin users are stored in the master database.
		// Inject master DB into context so the user DAO can find the record
		// without a tenant-specific DB connection.
		masterCtx := context.WithValue(ctx, "tenant_db", s.masterDB)
		userRecord, err := s.userService.GetByUsername(masterCtx, req.Username)
		if err != nil {
			log.Printf("User not found, using fallback admin login: %v", err)
			return s.fallbackAdminLogin(req)
		}
		log.Printf("User found: %s, EnableMultiTenant=%v", userRecord.Username, s.config.EnableMultiTenant)

		userID = userRecord.ID.String()
		username = userRecord.Username
		passwordHash = userRecord.PasswordHash
		realName = userRecord.RealName
		email = userRecord.Email
		phone = userRecord.Phone
		if userRecord.Avatar != nil {
			avatar = *userRecord.Avatar
		}
		status = userRecord.Status
		// Platform admin user is stored in master DB but still belongs to a tenant (default tenant).
		tenantID = userRecord.TenantID
		if tenantID != "" {
			if tenantRecord, err := s.tenantDAO.GetByID(ctx, tenantID); err == nil {
				tenantCode = tenantRecord.Code
			}
		}
		if userRecord.DepartmentID != nil {
			departmentID = *userRecord.DepartmentID
		}
		if userRecord.PositionID != nil {
			positionID = *userRecord.PositionID
		}
	}

	if status != "active" {
		return nil, ErrUserInactive
	}

	// Validate the submitted password hash.
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		// Record the failed login attempt before returning.
		_ = s.recordLoginAttempt(ctx, req.Username, requestedTenantCode, clientIP, userAgent, false)
		return nil, ErrInvalidCredentials
	}

	if s.config.Security.Enable2FA && tenantID != "" {
		enabled, err := s.isTwoFactorEnabled(ctx, userID, tenantID)
		if err != nil {
			return nil, err
		}
		if enabled {
			tempToken, err := s.issuePending2FAToken(ctx, userID, username, tenantID)
			if err != nil {
				return nil, err
			}

			return &LoginResponse{
				Require2FA:              true,
				TempToken:               tempToken,
				EnableMultiTenant:       s.config.EnableMultiTenant,
				LoginRequiresTenantCode: s.loginRequiresTenantCode(),
			}, nil
		}
	}

	accessToken, err := s.generateToken(userID, username, tenantID, time.Duration(s.expiresIn)*time.Second)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateToken(userID, username, tenantID, 7*24*time.Hour)
	if err != nil {
		return nil, err
	}

	if err := s.storeSession(ctx, accessToken, time.Duration(s.expiresIn)*time.Second); err != nil {
		return nil, err
	}
	if err := s.storeRefreshSession(ctx, refreshToken, 7*24*time.Hour); err != nil {
		return nil, err
	}

	// Store session device fingerprint for concurrent login management
	_ = s.storeSessionFingerprint(ctx, userID, accessToken, userAgent, clientIP)

	// Record the successful login attempt.
	_ = s.recordLoginAttempt(ctx, req.Username, requestedTenantCode, clientIP, userAgent, true)

	// Best-effort login log.
	if s.logService != nil {
		ip, _ := ctx.Value("client_ip").(string)
		ua, _ := ctx.Value("user_agent").(string)
		_ = s.logService.CreateLoginLog(writeCtx, &systemlog.LoginLog{
			ID:       uuid.New(),
			UserID:   userID,
			Username: username,
			IP:       ip,
			Location: "",
			Browser:  ua,
			OS:       "",
			Status:   "success",
			Message:  "",
			LoginAt:  time.Now(),
		})
	}

	return &LoginResponse{
		AccessToken:             accessToken,
		RefreshToken:            refreshToken,
		TokenType:               "Bearer",
		ExpiresIn:               s.expiresIn,
		EnableMultiTenant:       s.config.EnableMultiTenant,
		LoginRequiresTenantCode: s.loginRequiresTenantCode(),
		User: CurrentUserResponse{
			ID:           uuid.MustParse(userID),
			Username:     username,
			RealName:     realName,
			Email:        email,
			Phone:        phone,
			Avatar:       avatar,
			Status:       status,
			TenantID:     tenantID,
			TenantCode:   tenantCode,
			DepartmentID: departmentID,
			PositionID:   positionID,
		},
	}, nil
}

func (s *authService) fallbackAdminLogin(req *LoginRequest) (*LoginResponse, error) {
	if s.config == nil || !s.config.DefaultAdmin.Enabled {
		return nil, ErrInvalidCredentials
	}

	if req.Username != s.config.DefaultAdmin.Username {
		return nil, ErrInvalidCredentials
	}

	password := s.config.DefaultAdmin.Password
	if password == "" {
		password = os.Getenv("DEFAULT_ADMIN_PASSWORD")
		if password == "" {
			return nil, ErrInvalidCredentials
		}
	}

	if req.Password != password {
		return nil, ErrInvalidCredentials
	}

	userID := uuid.New().String()
	accessToken, err := s.generateToken(userID, req.Username, "", time.Duration(s.expiresIn)*time.Second)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateToken(userID, req.Username, "", 7*24*time.Hour)
	if err != nil {
		return nil, err
	}

	if err := s.storeSession(context.Background(), accessToken, time.Duration(s.expiresIn)*time.Second); err != nil {
		return nil, err
	}
	if err := s.storeRefreshSession(context.Background(), refreshToken, 7*24*time.Hour); err != nil {
		return nil, err
	}

	return &LoginResponse{
		AccessToken:             accessToken,
		RefreshToken:            refreshToken,
		TokenType:               "Bearer",
		ExpiresIn:               s.expiresIn,
		EnableMultiTenant:       s.config.EnableMultiTenant,
		LoginRequiresTenantCode: s.loginRequiresTenantCode(),
		User:                    *s.getFallbackAdminUser(userID, req.Username),
	}, nil
}

func (s *authService) Logout(ctx context.Context, userID, jti string) error {
	// Best-effort logout log update.
	if s.logService != nil && userID != "" {
		_ = s.logService.MarkLogout(ctx, userID)
	}

	if s.redisClient != nil && userID != "" {
		// Revoke all tokens issued at/before now (best-effort global logout).
		revokedKey := fmt.Sprintf("auth:revoked_after:%s", userID)
		_ = s.redisClient.Set(ctx, revokedKey, fmt.Sprintf("%d", time.Now().Unix()), 8*24*time.Hour)

		// Also remove the current access session if present.
		if jti != "" {
			sessionKey := s.accessSessionKey(userID, jti)
			_ = s.redisClient.Del(ctx, sessionKey)
		}
		return nil
	}
	return nil
}

func (s *authService) ValidateToken(tokenString string) (*middleware.Claims, error) {
	claims, err := s.parseTokenClaims(tokenString)
	if err != nil {
		return nil, err
	}

	if s.redisClient != nil && claims.ID != "" {
		sessionKey := s.accessSessionKey(claims.UserID, claims.ID)
		exists, err := s.redisClient.Exists(context.Background(), sessionKey)
		if err != nil || !exists {
			return nil, ErrInvalidToken
		}
	}
	if s.redisClient != nil {
		if revoked, err := s.isRevoked(context.Background(), claims); err != nil || revoked {
			return nil, ErrInvalidToken
		}
	}

	return claims, nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*RefreshTokenResponse, error) {
	claims, err := s.parseTokenClaims(refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	// If Redis is configured, enforce refresh-session existence and rotation.
	if s.redisClient != nil && claims.UserID != "" && claims.ID != "" {
		oldKey := s.refreshSessionKey(claims.UserID, claims.ID)
		exists, err := s.redisClient.Exists(ctx, oldKey)
		if err != nil || !exists {
			return nil, ErrInvalidToken
		}
		if revoked, err := s.isRevoked(ctx, claims); err != nil || revoked {
			return nil, ErrInvalidToken
		}
		// One-time use refresh token: delete old token before issuing new ones.
		_ = s.redisClient.Del(ctx, oldKey)
	}

	newAccessToken, err := s.generateToken(claims.UserID, claims.Username, claims.TenantID, time.Duration(s.expiresIn)*time.Second)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := s.generateToken(claims.UserID, claims.Username, claims.TenantID, 7*24*time.Hour)
	if err != nil {
		return nil, err
	}

	if err := s.storeSession(ctx, newAccessToken, time.Duration(s.expiresIn)*time.Second); err != nil {
		return nil, err
	}
	if err := s.storeRefreshSession(ctx, newRefreshToken, 7*24*time.Hour); err != nil {
		return nil, err
	}

	return &RefreshTokenResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    s.expiresIn,
	}, nil
}

func (s *authService) GetCurrentUser(ctx context.Context, userID, username, tenantID string) (*CurrentUserResponse, error) {
	if userID == "" {
		return nil, ErrInvalidToken
	}

	queryDB := s.masterDB.WithContext(ctx)
	roleCtx := context.WithValue(ctx, "tenant_db", s.masterDB)
	if tenantID != "" {
		tenantUUID, err := uuid.Parse(tenantID)
		if err != nil {
			return nil, err
		}

		tenantDB := s.dbManager.GetTenantDB(tenantUUID)
		if tenantDB == nil {
			return nil, ErrTenantDBNotConfigured
		}
		queryDB = tenantDB.WithContext(ctx)
		roleCtx = context.WithValue(roleCtx, "tenant_db", tenantDB)
		roleCtx = context.WithValue(roleCtx, "tenant_id", tenantID)
	}

	var record user.User
	if err := queryDB.Where("id = ?", userID).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) && tenantID == "" && s.config != nil && s.config.DefaultAdmin.Enabled && username == s.config.DefaultAdmin.Username {
			return s.getFallbackAdminUser(userID, username), nil
		}
		return nil, err
	}

	resp := &CurrentUserResponse{
		ID:       record.ID,
		Username: record.Username,
		RealName: record.RealName,
		Email:    record.Email,
		Phone:    record.Phone,
		Status:   record.Status,
		TenantID: record.TenantID,
	}

	if roles, err := s.userService.GetRoles(roleCtx, userID); err == nil {
		roleIDs := make([]string, 0, len(roles))
		roleNames := make([]string, 0, len(roles))
		for _, role := range roles {
			if role == nil {
				continue
			}
			roleIDs = append(roleIDs, role.ID)
			roleNames = append(roleNames, role.Name)
		}
		resp.RoleIDs = roleIDs
		resp.RoleNames = roleNames
	}

	if record.Avatar != nil {
		resp.Avatar = *record.Avatar
	}
	if record.DepartmentID != nil {
		resp.DepartmentID = *record.DepartmentID
	}
	if record.PositionID != nil {
		resp.PositionID = *record.PositionID
	}
	if record.LastLoginAt != nil {
		resp.LastLoginAt = record.LastLoginAt.Format(time.RFC3339)
		resp.LastLoginIP = record.LastLoginIP
	}
	if tenantID != "" {
		if tenantRecord, err := s.tenantDAO.GetByID(ctx, tenantID); err == nil {
			resp.TenantCode = tenantRecord.Code
		}
	}

	return resp, nil
}

func (s *authService) loginRequiresTenantCode() bool {
	if s == nil || s.config == nil {
		return false
	}
	if s.config.IsPrivateSingleTenantMode() {
		return false
	}
	return s.config.EnableMultiTenant
}

func (s *authService) generateToken(userID, username, tenantID string, duration time.Duration) (string, error) {
	expiresAt := time.Now().Add(duration)
	jti := uuid.New().String()
	claims := &middleware.Claims{
		UserID:      userID,
		Username:    username,
		TenantID:    tenantID,
		AuthVersion: s.getUserAuthVersion(context.Background(), userID),
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "pantheon-platform",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *authService) parseTokenClaims(tokenString string) (*middleware.Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &middleware.Claims{}, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*middleware.Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

func (s *authService) storeSession(ctx context.Context, tokenString string, ttl time.Duration) error {
	if s.redisClient == nil {
		return nil
	}

	claims, err := s.parseTokenClaims(tokenString)
	if err != nil {
		return err
	}

	return s.redisClient.Set(ctx, s.accessSessionKey(claims.UserID, claims.ID), "1", ttl)
}

func (s *authService) storeRefreshSession(ctx context.Context, tokenString string, ttl time.Duration) error {
	if s.redisClient == nil {
		return nil
	}
	claims, err := s.parseTokenClaims(tokenString)
	if err != nil {
		return err
	}
	return s.redisClient.Set(ctx, s.refreshSessionKey(claims.UserID, claims.ID), "1", ttl)
}

func (s *authService) accessSessionKey(userID, jti string) string {
	return fmt.Sprintf("auth:session:%s:%s", userID, jti)
}

func (s *authService) refreshSessionKey(userID, jti string) string {
	return fmt.Sprintf("auth:refresh:%s:%s", userID, jti)
}

func (s *authService) authVersionKey(userID string) string {
	return fmt.Sprintf("auth:version:%s", userID)
}

func (s *authService) getUserAuthVersion(ctx context.Context, userID string) int64 {
	if s == nil || s.redisClient == nil || userID == "" {
		return 0
	}
	raw, err := s.redisClient.Get(ctx, s.authVersionKey(userID))
	if err != nil || raw == "" {
		return 0
	}
	version, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0
	}
	return version
}

func (s *authService) getFallbackAdminUser(userID, username string) *CurrentUserResponse {
	resp := &CurrentUserResponse{
		ID:       uuid.MustParse(userID),
		Username: username,
		RealName: "Administrator",
		Email:    "admin@pantheon.platform",
		Status:   "active",
	}

	if s.config != nil {
		if s.config.DefaultAdmin.RealName != "" {
			resp.RealName = s.config.DefaultAdmin.RealName
		}
		if s.config.DefaultAdmin.Email != "" {
			resp.Email = s.config.DefaultAdmin.Email
		}
	}

	return resp
}

// CreateApiKey creates a new API key for a user

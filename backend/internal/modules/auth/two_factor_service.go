package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	systemlog "pantheon-platform/backend/internal/modules/system/log"
	"pantheon-platform/backend/internal/modules/system/user"
)

func (s *authService) isTwoFactorEnabled(ctx context.Context, userID, tenantID string) (bool, error) {
	if tenantID == "" {
		return false, nil
	}

	tenantDB := s.GetTenantDB(tenantID)
	if tenantDB == nil {
		return false, ErrTenantDBNotConfigured
	}

	var twoFactorAuth TwoFactorAuth
	err := tenantDB.WithContext(ctx).
		Where("user_id = ?", userID).
		First(&twoFactorAuth).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}

	return twoFactorAuth.Enabled, nil
}

func (s *authService) pending2FAKey(token string) string {
	return fmt.Sprintf("auth:2fa:pending:%s", token)
}

func (s *authService) issuePending2FAToken(ctx context.Context, userID, username, tenantID string) (string, error) {
	if s.redisClient != nil {
		tempToken := uuid.NewString()
		payload := strings.Join([]string{userID, username, tenantID}, "\n")
		if err := s.redisClient.Set(ctx, s.pending2FAKey(tempToken), payload, 10*time.Minute); err != nil {
			return "", err
		}
		return tempToken, nil
	}

	token, err := s.generateToken(userID, username, tenantID, 10*time.Minute)
	if err != nil {
		return "", err
	}
	return "jwt:" + token, nil
}

func (s *authService) resolvePending2FA(ctx context.Context, tempToken string) (string, string, string, error) {
	if tempToken == "" {
		return "", "", "", ErrInvalidToken
	}

	if s.redisClient != nil {
		raw, err := s.redisClient.Get(ctx, s.pending2FAKey(tempToken))
		if err != nil || raw == "" {
			return "", "", "", ErrInvalidToken
		}
		parts := strings.SplitN(raw, "\n", 3)
		if len(parts) != 3 {
			return "", "", "", ErrInvalidToken
		}
		return parts[0], parts[1], parts[2], nil
	}

	if strings.HasPrefix(tempToken, "jwt:") {
		claims, err := s.parseTokenClaims(strings.TrimPrefix(tempToken, "jwt:"))
		if err != nil {
			return "", "", "", ErrInvalidToken
		}
		return claims.UserID, claims.Username, claims.TenantID, nil
	}

	return "", "", "", ErrInvalidToken
}

func (s *authService) clearPending2FA(ctx context.Context, tempToken string) {
	if s.redisClient != nil && tempToken != "" {
		_ = s.redisClient.Del(ctx, s.pending2FAKey(tempToken))
	}
}

func (s *authService) VerifyLogin2FA(ctx context.Context, tempToken, code, clientIP, userAgent string) (*LoginResponse, error) {
	userID, username, tenantID, err := s.resolvePending2FA(ctx, tempToken)
	if err != nil {
		return nil, err
	}

	result, err := s.Verify2FACode(ctx, userID, tenantID, code)
	if err != nil {
		return nil, err
	}
	if result == nil || !result.Valid {
		return nil, ErrInvalid2FACode
	}

	accessToken, refreshToken, sessionID, err := s.issueSessionTokens(userID, username, tenantID)
	if err != nil {
		return nil, err
	}

	if err := s.storeSession(ctx, accessToken, time.Duration(s.expiresIn)*time.Second); err != nil {
		return nil, err
	}
	if err := s.storeRefreshSession(ctx, refreshToken, 7*24*time.Hour); err != nil {
		return nil, err
	}
	_ = s.storeSessionFingerprint(ctx, userID, sessionID, userAgent, clientIP)
	s.clearPending2FA(ctx, tempToken)

	currentUser, err := s.GetCurrentUser(ctx, userID, username, tenantID)
	if err != nil {
		return nil, err
	}

	if s.logService != nil {
		writeCtx := ctx
		if tenantID != "" {
			if tenantUUID, parseErr := uuid.Parse(tenantID); parseErr == nil {
				if tenantDB := s.dbManager.GetTenantDB(tenantUUID); tenantDB != nil {
					writeCtx = context.WithValue(writeCtx, "tenant_db", tenantDB)
					writeCtx = context.WithValue(writeCtx, "tenant_id", tenantID)
				}
			}
		}
		_ = s.logService.CreateLoginLog(writeCtx, &systemlog.LoginLog{
			ID:       uuid.New(),
			UserID:   userID,
			Username: username,
			IP:       clientIP,
			Location: "",
			Browser:  userAgent,
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
		User:                    *currentUser,
	}, nil
}

// GetTwoFactorAuthStatus returns the current 2FA status for a user.
func (s *authService) GetTwoFactorAuthStatus(ctx context.Context, userID, tenantID string) (*TwoFactorAuthResponse, error) {
	tenantDB := s.GetTenantDB(tenantID)
	if tenantDB == nil {
		return nil, ErrTenantDBNotConfigured
	}

	var twoFactorAuth TwoFactorAuth
	err := tenantDB.WithContext(ctx).
		Where("user_id = ?", userID).
		First(&twoFactorAuth).Error

	if err == gorm.ErrRecordNotFound {
		return &TwoFactorAuthResponse{Enabled: false, CreatedAt: "", UpdatedAt: ""}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get 2FA status: %w", err)
	}

	return &TwoFactorAuthResponse{
		Enabled:   twoFactorAuth.Enabled,
		CreatedAt: time.Unix(twoFactorAuth.CreatedAt, 0).Format(time.RFC3339),
		UpdatedAt: time.Unix(twoFactorAuth.UpdatedAt, 0).Format(time.RFC3339),
	}, nil
}

// EnableTwoFactorAuth initializes 2FA settings and returns setup data.
func (s *authService) EnableTwoFactorAuth(ctx context.Context, userID, tenantID string) (*TwoFactorAuthResponse, error) {
	tenantDB := s.GetTenantDB(tenantID)
	if tenantDB == nil {
		return nil, ErrTenantDBNotConfigured
	}

	var existing TwoFactorAuth
	err := tenantDB.WithContext(ctx).Where("user_id = ?", userID).First(&existing).Error
	if err == nil && existing.Enabled {
		return nil, Err2FAAlreadyEnabled
	}

	secret, err := GenerateTOTPSecret()
	if err != nil {
		return nil, fmt.Errorf("failed to generate TOTP secret: %w", err)
	}
	codes, err := GenerateBackupCodes(10)
	if err != nil {
		return nil, fmt.Errorf("failed to generate backup codes: %w", err)
	}

	var dbUser *user.User
	err = tenantDB.WithContext(ctx).Where("id = ?", userID).First(&dbUser).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	qrCodeURL, err := GenerateTOTPQRCode(secret, dbUser.Username, "Pantheon Platform")
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	now := time.Now().UnixMilli()
	backupCodes, err := ParseBackupCodes(strings.Join(codes, ","))
	if err != nil {
		return nil, fmt.Errorf("failed to prepare backup codes: %w", err)
	}

	twoFactorAuth := &TwoFactorAuth{
		UserID:      userID,
		TenantID:    tenantID,
		Secret:      secret,
		Enabled:     false,
		BackupCodes: SerializeBackupCodes(backupCodes),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := tenantDB.WithContext(ctx).Save(twoFactorAuth).Error; err != nil {
		return nil, fmt.Errorf("failed to save 2FA settings: %w", err)
	}

	return &TwoFactorAuthResponse{
		Secret:      secret,
		QRCodeURL:   qrCodeURL,
		BackupCodes: codes,
		CreatedAt:   time.Unix(now, 0).Format(time.RFC3339),
		UpdatedAt:   time.Unix(now, 0).Format(time.RFC3339),
	}, nil
}

// VerifyAndEnable2FA verifies a setup code and enables 2FA.
func (s *authService) VerifyAndEnable2FA(ctx context.Context, userID, tenantID, code string) error {
	tenantDB := s.GetTenantDB(tenantID)
	if tenantDB == nil {
		return ErrTenantDBNotConfigured
	}

	var twoFactorAuth TwoFactorAuth
	err := tenantDB.WithContext(ctx).Where("user_id = ?", userID).First(&twoFactorAuth).Error
	if err == gorm.ErrRecordNotFound {
		return ErrTwoFactorNotEnabled
	}
	if err != nil {
		return fmt.Errorf("failed to get 2FA settings: %w", err)
	}

	backupCodes, err := ParseBackupCodes(twoFactorAuth.BackupCodes)
	if err != nil {
		return fmt.Errorf("failed to parse backup codes: %w", err)
	}
	if len(backupCodes) > 0 {
		valid, updatedCodes := UseBackupCode(backupCodes, code)
		if valid {
			twoFactorAuth.BackupCodes = SerializeBackupCodes(updatedCodes)
			twoFactorAuth.Enabled = true
			twoFactorAuth.UpdatedAt = time.Now().UnixMilli()
			if err := tenantDB.WithContext(ctx).Save(&twoFactorAuth).Error; err != nil {
				return fmt.Errorf("failed to update 2FA settings: %w", err)
			}
			return nil
		}
	}
	if !ValidateTOTPCode(twoFactorAuth.Secret, code) {
		return ErrInvalid2FACode
	}
	twoFactorAuth.Enabled = true
	twoFactorAuth.UpdatedAt = time.Now().UnixMilli()
	if err := tenantDB.WithContext(ctx).Save(&twoFactorAuth).Error; err != nil {
		return fmt.Errorf("failed to enable 2FA: %w", err)
	}
	return nil
}

// DisableTwoFactorAuth verifies the password and disables 2FA.
func (s *authService) DisableTwoFactorAuth(ctx context.Context, userID, tenantID, password string) error {
	tenantDB := s.GetTenantDB(tenantID)
	if tenantDB == nil {
		return ErrTenantDBNotConfigured
	}

	var dbUser user.User
	err := tenantDB.WithContext(ctx).Where("id = ?", userID).First(&dbUser).Error
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.PasswordHash), []byte(password)); err != nil {
		return ErrInvalidCredentials
	}
	result := tenantDB.WithContext(ctx).Model(&TwoFactorAuth{}).Where("user_id = ?", userID).Update("enabled", false)
	if result.Error != nil {
		return fmt.Errorf("failed to disable 2FA: %w", result.Error)
	}
	return nil
}

// GenerateNewBackupCodes replaces the existing backup codes for 2FA.
func (s *authService) GenerateNewBackupCodes(ctx context.Context, userID, tenantID string, count int) (*GenerateBackupCodesResponse, error) {
	tenantDB := s.GetTenantDB(tenantID)
	if tenantDB == nil {
		return nil, ErrTenantDBNotConfigured
	}

	var twoFactorAuth TwoFactorAuth
	err := tenantDB.WithContext(ctx).Where("user_id = ?", userID).First(&twoFactorAuth).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get 2FA settings: %w", err)
	}
	if !twoFactorAuth.Enabled {
		return nil, ErrTwoFactorNotEnabled
	}

	newCodes, err := GenerateBackupCodes(count)
	if err != nil {
		return nil, fmt.Errorf("failed to generate backup codes: %w", err)
	}
	backupCodes, err := ParseBackupCodes(strings.Join(newCodes, ","))
	if err != nil {
		return nil, fmt.Errorf("failed to serialize backup codes: %w", err)
	}
	twoFactorAuth.BackupCodes = SerializeBackupCodes(backupCodes)
	twoFactorAuth.UpdatedAt = time.Now().UnixMilli()
	if err := tenantDB.WithContext(ctx).Save(&twoFactorAuth).Error; err != nil {
		return nil, fmt.Errorf("failed to update backup codes: %w", err)
	}

	return &GenerateBackupCodesResponse{
		BackupCodes: newCodes,
		AllCodes:    append(newCodes, "********"),
	}, nil
}

// Verify2FACode validates a TOTP or backup code and returns the latest status.
func (s *authService) Verify2FACode(ctx context.Context, userID, tenantID, code string) (*Verify2FAResponse, error) {
	tenantDB := s.GetTenantDB(tenantID)
	if tenantDB == nil {
		return nil, ErrTenantDBNotConfigured
	}

	var twoFactorAuth TwoFactorAuth
	err := tenantDB.WithContext(ctx).Where("user_id = ?", userID).First(&twoFactorAuth).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get 2FA settings: %w", err)
	}
	if !twoFactorAuth.Enabled {
		return &Verify2FAResponse{Valid: false, Info: "auth.error.2fa_not_enabled"}, nil
	}

	backupCodes, err := ParseBackupCodes(twoFactorAuth.BackupCodes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse backup codes: %w", err)
	}
	if len(backupCodes) > 0 {
		valid, updatedCodes := UseBackupCode(backupCodes, code)
		if valid {
			twoFactorAuth.BackupCodes = SerializeBackupCodes(updatedCodes)
			twoFactorAuth.UpdatedAt = time.Now().UnixMilli()
			if err := tenantDB.WithContext(ctx).Save(&twoFactorAuth).Error; err != nil {
				return nil, fmt.Errorf("failed to update 2FA settings: %w", err)
			}
			return &Verify2FAResponse{Valid: true, Info: "auth.message.2fa_backup_code_used"}, nil
		}
	}
	if !ValidateTOTPCode(twoFactorAuth.Secret, code) {
		return &Verify2FAResponse{Valid: false, Info: "auth.error.invalid_2fa_code"}, nil
	}
	return &Verify2FAResponse{Valid: true, Info: "auth.message.2fa_code_valid"}, nil
}

// GetTenantDB returns the tenant database connection.
func (s *authService) GetTenantDB(tenantID string) *gorm.DB {
	if tenantID == "" {
		return nil
	}
	tenantIDUUID, err := uuid.Parse(tenantID)
	if err != nil {
		return nil
	}
	return s.dbManager.GetTenantDB(tenantIDUUID)
}

package auth

import (
	"context"
	"errors"
	"fmt"
	"time"
)

func (s *authService) checkAccountLocked(ctx context.Context, username, tenantCode string) (bool, *time.Time, error) {
	if s.redisClient == nil {
		return false, nil, nil
	}

	// Get the key for account lock status
	lockedKey := s.getAccountLockedKey(username, tenantCode)

	// Check if account is locked
	lockedRaw, err := s.redisClient.Get(ctx, lockedKey)
	if err == nil && lockedRaw != "" {
		lockedUntil, parseErr := time.Parse(time.RFC3339, lockedRaw)
		if parseErr == nil && lockedUntil.After(time.Now()) {
			return true, &lockedUntil, nil
		}
	}

	return false, nil, nil
}

// recordLoginAttempt records a login attempt (success or failure)
func (s *authService) recordLoginAttempt(ctx context.Context, username, tenantCode, clientIP, userAgent string, success bool) error {
	if s.redisClient == nil {
		return nil
	}

	key := s.getFailedAttemptsKey(username, tenantCode)
	lockedKey := s.getAccountLockedKey(username, tenantCode)

	if success {
		// On successful login, clear failed attempts counter and lock
		_ = s.redisClient.Del(ctx, key)
		_ = s.redisClient.Del(ctx, lockedKey)
		return nil
	}

	// Increment failed attempts counter
	attempts, err := s.redisClient.Incr(ctx, key)
	if err != nil {
		return err
	}

	// Set expiration for the counter
	_ = s.redisClient.Expire(ctx, key, FailedAttemptsWindow)

	// Check if max attempts reached
	if int(attempts) >= MaxFailedAttempts {
		// Lock the account
		lockedUntil := time.Now().Add(LockoutDuration)
		_ = s.redisClient.Set(ctx, lockedKey, lockedUntil.Format(time.RFC3339), LockoutDuration)

		// Record the lock event to database for audit
		_ = s.recordLoginAttemptToDB(ctx, username, tenantCode, clientIP, userAgent, false, int(attempts))
	}

	// Record the attempt to database
	return s.recordLoginAttemptToDB(ctx, username, tenantCode, clientIP, userAgent, false, int(attempts))
}

// getFailedAttemptsKey generates a Redis key for tracking failed login attempts
func (s *authService) getFailedAttemptsKey(username, tenantCode string) string {
	if tenantCode != "" {
		return fmt.Sprintf("auth:failed:%s@%s", username, tenantCode)
	}
	return fmt.Sprintf("auth:failed:%s", username)
}

// getAccountLockedKey generates a Redis key for account lock status
func (s *authService) getAccountLockedKey(username, tenantCode string) string {
	if tenantCode != "" {
		return fmt.Sprintf("auth:locked:%s@%s", username, tenantCode)
	}
	return fmt.Sprintf("auth:locked:%s", username)
}

// recordLoginAttemptToDB records a login attempt to the database for audit purposes
func (s *authService) recordLoginAttemptToDB(ctx context.Context, username, tenantCode, clientIP, userAgent string, success bool, attempts int) error {
	db := s.masterDB
	var tenantID string

	// Determine the correct database
	if tenantCode != "" {
		tenantRecord, err := s.tenantRepo.GetByCode(ctx, tenantCode)
		if err != nil {
			return nil // Skip recording if tenant not found
		}
		tenantID = tenantRecord.ID.String()
		tenantDB := s.dbManager.GetTenantDB(tenantRecord.ID)
		if tenantDB != nil {
			db = tenantDB
		}
	} else {
		// For platform admin, store in master DB
		if userRecord, err := s.userService.GetByUsername(ctx, username); err == nil {
			tenantID = userRecord.TenantID
		}
	}

	attempt := &LoginAttempt{
		Email:     username,
		IP:        clientIP,
		UserAgent: userAgent,
		Success:   success,
		AttemptAt: time.Now(),
	}

	if tenantID != "" {
		attempt.TenantID = &tenantID
	}

	return db.WithContext(ctx).Create(attempt).Error
}

// getFailedAttemptsCount returns the current failed attempts count for a user
func (s *authService) getFailedAttemptsCount(ctx context.Context, username, tenantCode string) (int, error) {
	if s.redisClient == nil {
		return 0, nil
	}

	key := s.getFailedAttemptsKey(username, tenantCode)
	raw, err := s.redisClient.Get(ctx, key)
	if err != nil {
		return 0, nil
	}

	var count int
	_, err = fmt.Sscanf(raw, "%d", &count)
	if err != nil {
		return 0, nil
	}

	return count, nil
}

// UnlockAccount manually unlocks a locked account
func (s *authService) UnlockAccount(ctx context.Context, username, tenantCode string) error {
	if s.redisClient == nil {
		return nil
	}

	key := s.getFailedAttemptsKey(username, tenantCode)
	lockedKey := s.getAccountLockedKey(username, tenantCode)

	// Clear failed attempts counter and lock
	if err := s.redisClient.Del(ctx, key); err != nil {
		return err
	}
	return s.redisClient.Del(ctx, lockedKey)
}

// GetLoginAttemptsSummary returns a summary of login attempts for a user
func (s *authService) GetLoginAttemptsSummary(ctx context.Context, username, tenantCode string) (*LoginAttemptSummary, error) {
	if s.redisClient == nil {
		return nil, nil
	}

	summary := &LoginAttemptSummary{
		Email: username,
	}

	// Get current failed attempts count from Redis
	count, err := s.getFailedAttemptsCount(ctx, username, tenantCode)
	if err == nil {
		summary.FailedCount = count
	}

	// Check if account is locked
	_, lockedUntil, err := s.checkAccountLocked(ctx, username, tenantCode)
	if err == nil && lockedUntil != nil {
		summary.LockedUntil = lockedUntil
	}

	// Get last attempt time from database
	db := s.masterDB
	if tenantCode != "" {
		tenantRecord, err := s.tenantRepo.GetByCode(ctx, tenantCode)
		if err == nil {
			tenantDB := s.dbManager.GetTenantDB(tenantRecord.ID)
			if tenantDB != nil {
				db = tenantDB
			}
		}
	}

	var lastAttempt LoginAttempt
	err = db.WithContext(ctx).
		Where("email = ?", username).
		Order("attempt_at DESC").
		First(&lastAttempt).Error

	if err == nil {
		summary.LastAttempt = lastAttempt.AttemptAt
	}

	return summary, nil
}

var (
	ErrInvalidCredentials    = errors.New("invalid credentials")
	ErrInvalidToken          = errors.New("invalid token")
	ErrUserInactive          = errors.New("user is inactive or locked")
	ErrTenantInactive        = errors.New("tenant is inactive")
	ErrTenantDBNotConfigured = errors.New("tenant database not configured")
	ErrAccountLocked         = errors.New("account is locked due to too many failed login attempts")
	ErrTwoFactorNotEnabled   = errors.New("two-factor authentication is not enabled")
	ErrInvalid2FACode        = errors.New("invalid two-factor authentication code")
	Err2FAAlreadyEnabled     = errors.New("two-factor authentication is already enabled")
)

// Login attempt configuration
const (
	MaxFailedAttempts    = 5
	LockoutDuration      = 30 * time.Minute
	FailedAttemptsWindow = 15 * time.Minute // Rolling window for failed login attempts.
)

package auth

import (
	"context"
	"fmt"
	"pantheon-platform/backend/internal/shared/middleware"
	"strconv"
	"strings"
	"time"
)

// ======================== Session Management (Concurrent Login) ========================

// storeSessionFingerprint stores device info for an active session.
func (s *authService) storeSessionFingerprint(ctx context.Context, userID, accessToken, userAgent, clientIP string) error {
	if s.redisClient == nil {
		return nil
	}
	claims, err := s.parseTokenClaims(accessToken)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("auth:session:device:%s:%s", userID, claims.ID)
	now := time.Now().Unix()

	// Store as a simple JSON-like hash using individual fields
	pipe := s.redisClient.GetClient().Pipeline()
	pipe.HSet(ctx, key, "device_name", truncateString(userAgent, 128))
	pipe.HSet(ctx, key, "ip", clientIP)
	pipe.HSet(ctx, key, "login_at", fmt.Sprintf("%d", now))
	pipe.HSet(ctx, key, "last_active", fmt.Sprintf("%d", now))
	pipe.Expire(ctx, key, time.Duration(s.expiresIn)*time.Second)
	_, err = pipe.Exec(ctx)
	return err
}

// ListActiveSessions returns all active sessions for a user.
func (s *authService) ListActiveSessions(ctx context.Context, userID, currentJTI string) (*ActiveSessionsResponse, error) {
	resp := &ActiveSessionsResponse{
		Sessions:    []SessionInfo{},
		MaxSessions: s.config.Security.MaxConcurrentSessions,
	}

	if s.redisClient == nil || userID == "" {
		return resp, nil
	}

	var keys []string
	var cursor uint64
	for {
		batch, next, err := s.redisClient.GetClient().Scan(ctx, cursor, fmt.Sprintf("auth:session:device:%s:*", userID), 100).Result()
		if err != nil {
			return resp, nil
		}
		keys = append(keys, batch...)
		cursor = next
		if cursor == 0 {
			break
		}
	}

	for _, key := range keys {
		result, err := s.redisClient.GetClient().HGetAll(ctx, key).Result()
		if err != nil || len(result) == 0 {
			continue
		}

		// Extract JTI from key: auth:session:device:{userID}:{jti}
		parts := strings.Split(key, ":")
		jti := ""
		if len(parts) >= 5 {
			jti = parts[4]
		}

		loginTime, _ := strconv.ParseInt(result["login_at"], 10, 64)
		lastActive, _ := strconv.ParseInt(result["last_active"], 10, 64)

		resp.Sessions = append(resp.Sessions, SessionInfo{
			JTI:        jti,
			DeviceName: result["device_name"],
			IPAddress:  result["ip"],
			LoginTime:  loginTime,
			LastActive: lastActive,
			IsCurrent:  jti == currentJTI,
		})
	}

	return resp, nil
}

// KickSession invalidates a specific session (single device kick).
func (s *authService) KickSession(ctx context.Context, userID, jti string) error {
	if s.redisClient == nil || userID == "" || jti == "" {
		return nil
	}

	// Delete the device fingerprint key
	deviceKey := fmt.Sprintf("auth:session:device:%s:%s", userID, jti)
	_ = s.redisClient.Del(ctx, deviceKey)

	// Delete the session key
	sessionKey := s.accessSessionKey(userID, jti)
	_ = s.redisClient.Del(ctx, sessionKey)

	// Delete the refresh session key
	refreshKey := s.refreshSessionKey(userID, jti)
	_ = s.redisClient.Del(ctx, refreshKey)

	// Add JTI to blacklist with remaining TTL
	blacklistKey := fmt.Sprintf("auth:session:blacklist:%s", jti)
	_ = s.redisClient.Set(ctx, blacklistKey, "1", time.Duration(s.expiresIn)*time.Second)

	return nil
}

// ParseTokenClaims exposes the private parseTokenClaims for handler use.
func (s *authService) ParseTokenClaims(tokenString string) (*middleware.Claims, error) {
	return s.parseTokenClaims(tokenString)
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}

func (s *authService) isRevoked(ctx context.Context, claims *middleware.Claims) (bool, error) {
	if s.redisClient == nil || claims == nil || claims.UserID == "" || claims.IssuedAt == nil {
		return false, nil
	}

	// Check per-session blacklist (kicked sessions)
	blacklistKey := fmt.Sprintf("auth:session:blacklist:%s", claims.ID)
	exists, err := s.redisClient.Exists(ctx, blacklistKey)
	if err == nil && exists {
		return true, nil
	}

	// Check global revocation timestamp
	key := fmt.Sprintf("auth:revoked_after:%s", claims.UserID)
	raw, err := s.redisClient.Get(ctx, key)
	if err != nil {
		// Key may not exist; treat as not revoked.
		return false, nil
	}
	revokedAfter, convErr := strconv.ParseInt(raw, 10, 64)
	if convErr != nil {
		return false, nil
	}
	return claims.IssuedAt.Time.Unix() <= revokedAfter, nil
}

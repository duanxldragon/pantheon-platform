package auth

import (
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"net"
	"strings"
	"time"

	"gorm.io/gorm"
)

const apiKeySelectorSeparator = ":"
const defaultAPIKeyLifetime = 90 * 24 * time.Hour
const defaultAPIKeyRateLimit = 60
const apiKeyRateLimitWindow = time.Minute

func (s *authService) CreateApiKey(ctx context.Context, userID, name, permissions string, allowedIPs []string, rateLimit int, expiresAt string) (*ApiKeyResponse, error) {
	if s.apiKeyDAO == nil {
		return nil, errors.New("api key DAO not initialized")
	}

	normalizedPermissions := normalizeAPIKeyPermissions(permissions)
	if normalizedPermissions == "" {
		return nil, errors.New("api key permissions are required")
	}

	normalizedAllowedIPs, err := normalizeAPIKeyAllowedIPs(allowedIPs)
	if err != nil {
		return nil, err
	}

	parsedExpiresAt, err := parseAPIKeyExpiresAt(expiresAt)
	if err != nil {
		return nil, err
	}

	normalizedRateLimit := normalizeAPIKeyRateLimit(rateLimit)

	selector := newAPIKeySelector()
	apiKey := fmt.Sprintf("sk_%s_%s", selector, uuid.New().String())

	hashedKey, err := bcrypt.GenerateFromPassword([]byte(apiKey), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newKey := &ApiKey{
		ID:          uuid.New(),
		UserID:      userID,
		Name:        name,
		Key:         encodeStoredAPIKey(selector, string(hashedKey)),
		Permissions: normalizedPermissions,
		AllowedIPs:  normalizedAllowedIPs,
		RateLimit:   normalizedRateLimit,
		ExpiresAt:   parsedExpiresAt,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.masterDB.WithContext(ctx).Create(newKey).Error; err != nil {
		return nil, err
	}

	return &ApiKeyResponse{
		ID:          newKey.ID.String(),
		UserID:      newKey.UserID,
		Name:        newKey.Name,
		Key:         apiKey, // Return the plain key only on creation
		Permissions: newKey.Permissions,
		AllowedIPs:  splitAPIKeyAllowedIPs(newKey.AllowedIPs),
		RateLimit:   newKey.RateLimit,
		ExpiresAt:   formatOptionalTime(newKey.ExpiresAt),
		CreatedAt:   newKey.CreatedAt.Format(time.RFC3339),
	}, nil
}

// ListApiKeys returns all API keys for a user
func (s *authService) ListApiKeys(ctx context.Context, userID string) (*ApiKeyListResponse, error) {
	if s.apiKeyDAO == nil {
		return nil, errors.New("api key DAO not initialized")
	}

	keys, err := s.listAPIKeysAcrossCandidateDBs(ctx, userID)
	if err != nil {
		return nil, err
	}

	items := make([]ApiKeyItem, len(keys))
	for i, key := range keys {
		items[i] = ApiKeyItem{
			ID:          key.ID.String(),
			Name:        key.Name,
			KeyPreview:  "********************",
			Permissions: key.Permissions,
			AllowedIPs:  splitAPIKeyAllowedIPs(key.AllowedIPs),
			RateLimit:   normalizeAPIKeyRateLimit(key.RateLimit),
			CreatedAt:   key.CreatedAt.Format(time.RFC3339),
			ExpiresAt:   formatOptionalTime(key.ExpiresAt),
		}
		if key.LastUsed != nil {
			items[i].LastUsed = key.LastUsed.Format(time.RFC3339)
		}
	}

	return &ApiKeyListResponse{Items: items}, nil
}

// DeleteApiKey deletes an API key
func (s *authService) DeleteApiKey(ctx context.Context, userID, keyID string) error {
	if s.apiKeyDAO == nil {
		return errors.New("api key DAO not initialized")
	}

	uuidID, err := uuid.Parse(keyID)
	if err != nil {
		return err
	}

	for _, db := range s.apiKeyCandidateDBs(ctx) {
		result := db.WithContext(ctx).Where("id = ? AND user_id = ?", uuidID, userID).Delete(&ApiKey{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected > 0 {
			return nil
		}
	}

	return ErrApiKeyNotFound
}

// UpdateApiKey updates an API key
func (s *authService) UpdateApiKey(ctx context.Context, userID, keyID, name, permissions string, allowedIPs []string, rateLimit int, expiresAt string) error {
	if s.apiKeyDAO == nil {
		return errors.New("api key DAO not initialized")
	}

	uuidID, err := uuid.Parse(keyID)
	if err != nil {
		return err
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if name != "" {
		updates["name"] = name
	}
	if permissions != "" {
		normalizedPermissions := normalizeAPIKeyPermissions(permissions)
		if normalizedPermissions == "" {
			return errors.New("api key permissions are required")
		}
		updates["permissions"] = normalizedPermissions
	}
	if allowedIPs != nil {
		normalizedAllowedIPs, err := normalizeAPIKeyAllowedIPs(allowedIPs)
		if err != nil {
			return err
		}
		updates["allowed_ips"] = normalizedAllowedIPs
	}
	if rateLimit > 0 {
		updates["rate_limit"] = normalizeAPIKeyRateLimit(rateLimit)
	}
	if strings.TrimSpace(expiresAt) != "" {
		parsedExpiresAt, err := parseAPIKeyExpiresAt(expiresAt)
		if err != nil {
			return err
		}
		updates["expires_at"] = parsedExpiresAt
	}

	for _, db := range s.apiKeyCandidateDBs(ctx) {
		result := db.WithContext(ctx).Model(&ApiKey{}).Where("id = ? AND user_id = ?", uuidID, userID).Updates(updates)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected > 0 {
			return nil
		}
	}

	return ErrApiKeyNotFound
}

// ValidateApiKey validates an API key and returns the user ID
func (s *authService) ValidateApiKey(ctx context.Context, apiKey string) (*APIKeyAuthResult, error) {
	if s.apiKeyDAO == nil {
		return nil, errors.New("api key DAO not initialized")
	}

	selector := extractAPIKeySelector(apiKey)
	for _, db := range s.apiKeyCandidateDBs(ctx) {
		keys, err := s.lookupAPIKeyCandidates(ctx, db, selector)
		if err != nil {
			return nil, err
		}

		for _, key := range keys {
			if bcrypt.CompareHashAndPassword([]byte(extractStoredAPIKeyHash(key.Key)), []byte(apiKey)) == nil {
				if key.ExpiresAt != nil && key.ExpiresAt.Before(time.Now()) {
					return nil, ErrAPIKeyExpired
				}
				if !isAPIKeyClientAllowed(getClientIPFromContext(ctx), splitAPIKeyAllowedIPs(key.AllowedIPs)) {
					return nil, ErrAPIKeyIPNotAllowed
				}
				if err := s.consumeAPIKeyRateLimit(ctx, key.ID.String(), normalizeAPIKeyRateLimit(key.RateLimit)); err != nil {
					return nil, err
				}
				now := time.Now()
				_ = db.WithContext(ctx).Model(&ApiKey{}).Where("id = ?", key.ID).Update("last_used", &now).Error
				return &APIKeyAuthResult{
					KeyID:       key.ID.String(),
					UserID:      key.UserID,
					Permissions: splitAPIKeyPermissions(key.Permissions),
					AllowedIPs:  splitAPIKeyAllowedIPs(key.AllowedIPs),
					RateLimit:   normalizeAPIKeyRateLimit(key.RateLimit),
					AuthType:    "api_key",
				}, nil
			}
		}
	}

	return nil, ErrInvalidCredentials
}

// getTenantIDFromContext extracts tenant ID from context
func getTenantIDFromContext(ctx context.Context) string {
	if tenantID, ok := ctx.Value("tenant_id").(string); ok {
		return tenantID
	}
	return ""
}

func (s *authService) apiKeyCandidateDBs(ctx context.Context) []*gorm.DB {
	dbs := []*gorm.DB{s.masterDB}
	tenantID := getTenantIDFromContext(ctx)
	if tenantID == "" || s.dbManager == nil {
		return dbs
	}

	tid, err := uuid.Parse(tenantID)
	if err != nil {
		return dbs
	}
	tenantDB := s.dbManager.GetTenantDB(tid)
	if tenantDB != nil && tenantDB != s.masterDB {
		dbs = append(dbs, tenantDB)
	}

	return dbs
}

func (s *authService) listAPIKeysAcrossCandidateDBs(ctx context.Context, userID string) ([]*ApiKey, error) {
	combined := make([]*ApiKey, 0)
	seen := make(map[string]struct{})

	for _, db := range s.apiKeyCandidateDBs(ctx) {
		var keys []*ApiKey
		if err := db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&keys).Error; err != nil {
			return nil, err
		}
		for _, key := range keys {
			if _, ok := seen[key.ID.String()]; ok {
				continue
			}
			seen[key.ID.String()] = struct{}{}
			combined = append(combined, key)
		}
	}

	return combined, nil
}

func (s *authService) lookupAPIKeyCandidates(ctx context.Context, db *gorm.DB, selector string) ([]*ApiKey, error) {
	keys := make([]*ApiKey, 0)
	if selector != "" {
		if err := db.WithContext(ctx).Model(&ApiKey{}).Where("`key` LIKE ?", selector+apiKeySelectorSeparator+"%").Find(&keys).Error; err != nil {
			return nil, err
		}
		if len(keys) > 0 {
			return keys, nil
		}
	}

	if err := db.WithContext(ctx).Model(&ApiKey{}).Where("`key` NOT LIKE ?", "%"+apiKeySelectorSeparator+"%").Find(&keys).Error; err != nil {
		return nil, err
	}
	return keys, nil
}

func newAPIKeySelector() string {
	return strings.ReplaceAll(uuid.NewString()[:12], "-", "")
}

func encodeStoredAPIKey(selector, hashedKey string) string {
	return selector + apiKeySelectorSeparator + hashedKey
}

func extractStoredAPIKeyHash(stored string) string {
	parts := strings.SplitN(stored, apiKeySelectorSeparator, 2)
	if len(parts) == 2 && parts[0] != "" && parts[1] != "" {
		return parts[1]
	}
	return stored
}

func extractAPIKeySelector(apiKey string) string {
	if !strings.HasPrefix(apiKey, "sk_") {
		return ""
	}
	parts := strings.SplitN(strings.TrimPrefix(apiKey, "sk_"), "_", 2)
	if len(parts) == 0 {
		return ""
	}
	return strings.TrimSpace(parts[0])
}

func normalizeAPIKeyPermissions(permissions string) string {
	parts := strings.Split(permissions, ",")
	normalized := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))

	for _, part := range parts {
		permission := strings.TrimSpace(part)
		if permission == "" {
			continue
		}
		if _, exists := seen[permission]; exists {
			continue
		}
		seen[permission] = struct{}{}
		normalized = append(normalized, permission)
	}

	return strings.Join(normalized, ",")
}

func splitAPIKeyPermissions(permissions string) []string {
	if strings.TrimSpace(permissions) == "" {
		return []string{}
	}

	return strings.Split(normalizeAPIKeyPermissions(permissions), ",")
}

func normalizeAPIKeyAllowedIPs(allowedIPs []string) (string, error) {
	if len(allowedIPs) == 0 {
		return "", nil
	}

	normalized := make([]string, 0, len(allowedIPs))
	seen := make(map[string]struct{}, len(allowedIPs))
	for _, raw := range allowedIPs {
		entry := strings.TrimSpace(raw)
		if entry == "" {
			continue
		}
		if _, _, err := net.ParseCIDR(entry); err != nil && net.ParseIP(entry) == nil {
			return "", errors.New("invalid api key allowed ip")
		}
		if _, exists := seen[entry]; exists {
			continue
		}
		seen[entry] = struct{}{}
		normalized = append(normalized, entry)
	}

	return strings.Join(normalized, ","), nil
}

func splitAPIKeyAllowedIPs(value string) []string {
	if strings.TrimSpace(value) == "" {
		return []string{}
	}

	parts := strings.Split(value, ",")
	allowedIPs := make([]string, 0, len(parts))
	for _, part := range parts {
		entry := strings.TrimSpace(part)
		if entry == "" {
			continue
		}
		allowedIPs = append(allowedIPs, entry)
	}

	return allowedIPs
}

func normalizeAPIKeyRateLimit(rateLimit int) int {
	if rateLimit <= 0 {
		return defaultAPIKeyRateLimit
	}
	return rateLimit
}

func parseAPIKeyExpiresAt(raw string) (*time.Time, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		defaultExpiresAt := time.Now().Add(defaultAPIKeyLifetime).UTC()
		return &defaultExpiresAt, nil
	}

	parsed, err := time.Parse(time.RFC3339, trimmed)
	if err != nil {
		return nil, errors.New("invalid api key expiry")
	}

	normalized := parsed.UTC()
	return &normalized, nil
}

func formatOptionalTime(value *time.Time) string {
	if value == nil {
		return ""
	}
	return value.UTC().Format(time.RFC3339)
}

func getClientIPFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}

	clientIP, _ := ctx.Value("client_ip").(string)
	return strings.TrimSpace(clientIP)
}

func isAPIKeyClientAllowed(clientIP string, allowedIPs []string) bool {
	if len(allowedIPs) == 0 {
		return true
	}

	ip := net.ParseIP(strings.TrimSpace(clientIP))
	if ip == nil {
		return false
	}

	for _, allowedIP := range allowedIPs {
		if _, network, err := net.ParseCIDR(allowedIP); err == nil && network.Contains(ip) {
			return true
		}
		if parsed := net.ParseIP(allowedIP); parsed != nil && parsed.Equal(ip) {
			return true
		}
	}

	return false
}

func (s *authService) consumeAPIKeyRateLimit(ctx context.Context, keyID string, limit int) error {
	if s == nil || s.redisClient == nil || keyID == "" {
		return nil
	}

	bucket := time.Now().UTC().Format("200601021504")
	redisKey := fmt.Sprintf("auth:api_key:rate_limit:%s:%s", keyID, bucket)
	current, err := s.redisClient.Incr(ctx, redisKey)
	if err != nil {
		return err
	}
	if current == 1 {
		_ = s.redisClient.Expire(ctx, redisKey, apiKeyRateLimitWindow+5*time.Second)
	}
	if current > int64(limit) {
		return ErrAPIKeyRateLimited
	}
	return nil
}

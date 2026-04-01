package auth

import (
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"strings"
	"time"

	"gorm.io/gorm"
)

const apiKeySelectorSeparator = ":"

func (s *authService) CreateApiKey(ctx context.Context, userID, name, permissions string) (*ApiKeyResponse, error) {
	if s.apiKeyDAO == nil {
		return nil, errors.New("api key DAO not initialized")
	}

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
		Permissions: permissions,
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
			CreatedAt:   key.CreatedAt.Format(time.RFC3339),
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
func (s *authService) UpdateApiKey(ctx context.Context, userID, keyID, name, permissions string) error {
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
		updates["permissions"] = permissions
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
func (s *authService) ValidateApiKey(ctx context.Context, apiKey string) (string, error) {
	if s.apiKeyDAO == nil {
		return "", errors.New("api key DAO not initialized")
	}

	selector := extractAPIKeySelector(apiKey)
	for _, db := range s.apiKeyCandidateDBs(ctx) {
		keys, err := s.lookupAPIKeyCandidates(ctx, db, selector)
		if err != nil {
			return "", err
		}

		for _, key := range keys {
			if bcrypt.CompareHashAndPassword([]byte(extractStoredAPIKeyHash(key.Key)), []byte(apiKey)) == nil {
				now := time.Now()
				_ = db.WithContext(ctx).Model(&ApiKey{}).Where("id = ?", key.ID).Update("last_used", &now).Error
				return key.UserID, nil
			}
		}
	}

	return "", ErrInvalidCredentials
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

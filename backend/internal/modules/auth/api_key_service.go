package auth

import (
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"pantheon-platform/backend/internal/modules/tenant"
	"time"
)

func (s *authService) CreateApiKey(ctx context.Context, userID, name, permissions string) (*ApiKeyResponse, error) {
	if s.apiKeyDAO == nil {
		return nil, errors.New("api key DAO not initialized")
	}

	// Generate a random API key
	apiKey := fmt.Sprintf("sk_%s", uuid.New().String())

	// Hash the key before storing
	hashedKey, err := bcrypt.GenerateFromPassword([]byte(apiKey), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newKey := &ApiKey{
		ID:          uuid.New(),
		UserID:      userID,
		Name:        name,
		Key:         string(hashedKey),
		Permissions: permissions,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Get the appropriate database (master for platform admin, tenant DB for tenant users)
	db := s.masterDB
	if tenantID := getTenantIDFromContext(ctx); tenantID != "" {
		if tid, err := uuid.Parse(tenantID); err == nil {
			if tenantDB := s.dbManager.GetTenantDB(tid); tenantDB != nil {
				db = tenantDB
			}
		}
	}

	// Save to database
	if err := db.WithContext(ctx).Create(newKey).Error; err != nil {
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

	// Get the appropriate database
	db := s.masterDB
	if tenantID := getTenantIDFromContext(ctx); tenantID != "" {
		if tid, err := uuid.Parse(tenantID); err == nil {
			if tenantDB := s.dbManager.GetTenantDB(tid); tenantDB != nil {
				db = tenantDB
			}
		}
	}

	var keys []*ApiKey
	err := db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&keys).Error
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

	// Get the appropriate database
	db := s.masterDB
	if tenantID := getTenantIDFromContext(ctx); tenantID != "" {
		if tid, err := uuid.Parse(tenantID); err == nil {
			if tenantDB := s.dbManager.GetTenantDB(tid); tenantDB != nil {
				db = tenantDB
			}
		}
	}

	// Delete the key (verify it belongs to the user)
	uuidID, err := uuid.Parse(keyID)
	if err != nil {
		return err
	}

	result := db.WithContext(ctx).Where("id = ? AND user_id = ?", uuidID, userID).Delete(&ApiKey{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrApiKeyNotFound
	}

	return nil
}

// UpdateApiKey updates an API key
func (s *authService) UpdateApiKey(ctx context.Context, userID, keyID, name, permissions string) error {
	if s.apiKeyDAO == nil {
		return errors.New("api key DAO not initialized")
	}

	// Get the appropriate database
	db := s.masterDB
	if tenantID := getTenantIDFromContext(ctx); tenantID != "" {
		if tid, err := uuid.Parse(tenantID); err == nil {
			if tenantDB := s.dbManager.GetTenantDB(tid); tenantDB != nil {
				db = tenantDB
			}
		}
	}

	// Update the key (verify it belongs to the user)
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

	result := db.WithContext(ctx).Model(&ApiKey{}).Where("id = ? AND user_id = ?", uuidID, userID).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrApiKeyNotFound
	}

	return nil
}

// ValidateApiKey validates an API key and returns the user ID
func (s *authService) ValidateApiKey(ctx context.Context, apiKey string) (string, error) {
	if s.apiKeyDAO == nil {
		return "", errors.New("api key DAO not initialized")
	}

	// Get the appropriate database
	db := s.masterDB

	var keys []*ApiKey
	err := db.WithContext(ctx).Find(&keys).Error
	if err != nil {
		return "", err
	}

	// Check each tenant database if multi-tenant is enabled
	if s.config.EnableMultiTenant {
		var tenantIDs []uuid.UUID
		err := s.masterDB.WithContext(ctx).Model(&tenant.Tenant{}).Pluck("id", &tenantIDs).Error
		if err == nil {
			for _, tid := range tenantIDs {
				if tenantDB := s.dbManager.GetTenantDB(tid); tenantDB != nil {
					var tenantKeys []*ApiKey
					err := tenantDB.WithContext(ctx).Find(&tenantKeys).Error
					if err == nil {
						keys = append(keys, tenantKeys...)
					}
				}
			}
		}
	}

	// Find matching key
	for _, key := range keys {
		if err := bcrypt.CompareHashAndPassword([]byte(key.Key), []byte(apiKey)); err == nil {
			// Update last used time
			_ = s.apiKeyDAO.UpdateLastUsed(ctx, key.ID.String())
			return key.UserID, nil
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

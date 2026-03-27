package auth

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrApiKeyNotFound = errors.New("api key not found")
)

// ApiKeyDAO defines API key persistence operations.
type ApiKeyDAO interface {
	Create(ctx context.Context, apiKey *ApiKey) error
	GetByID(ctx context.Context, id string) (*ApiKey, error)
	GetByUserID(ctx context.Context, userID string) ([]*ApiKey, error)
	Update(ctx context.Context, apiKey *ApiKey) error
	Delete(ctx context.Context, id string) error
	UpdateLastUsed(ctx context.Context, id string) error
}

type apiKeyDAO struct {
	db *gorm.DB
}

// NewApiKeyDAO creates a new API key DAO.
func NewApiKeyDAO(db *gorm.DB) ApiKeyDAO {
	return &apiKeyDAO{db: db}
}

func (r *apiKeyDAO) Create(ctx context.Context, apiKey *ApiKey) error {
	return r.db.WithContext(ctx).Create(apiKey).Error
}

func (r *apiKeyDAO) GetByID(ctx context.Context, id string) (*ApiKey, error) {
	var key ApiKey
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&key).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrApiKeyNotFound
		}
		return nil, err
	}
	return &key, nil
}

func (r *apiKeyDAO) GetByUserID(ctx context.Context, userID string) ([]*ApiKey, error) {
	var keys []*ApiKey
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&keys).Error
	return keys, err
}

func (r *apiKeyDAO) Update(ctx context.Context, apiKey *ApiKey) error {
	return r.db.WithContext(ctx).Save(apiKey).Error
}

func (r *apiKeyDAO) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&ApiKey{}, "id = ?", id).Error
}

func (r *apiKeyDAO) UpdateLastUsed(ctx context.Context, id string) error {
	uuidID, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	now := gorm.Expr("NOW()")
	return r.db.WithContext(ctx).Model(&ApiKey{}).Where("id = ?", uuidID).Update("last_used", now).Error
}

// GetTenantModels returns models that need to be migrated to tenant databases.
func (r *apiKeyDAO) GetTenantModels() []interface{} {
	// API keys are stored in master database only, not migrated to tenant databases.
	// This is intentional for centralized credential management.
	return []interface{}{}
}

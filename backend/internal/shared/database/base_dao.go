package database

import (
	"context"
	"strings"

	"gorm.io/gorm"
)

// DAO defines shared CRUD behavior for DAO implementations.
type DAO[T any] interface {
	Create(ctx context.Context, entity T) error
	GetByID(ctx context.Context, id interface{}) (T, error)
	Update(ctx context.Context, entity T) error
	Delete(ctx context.Context, id interface{}) error
	List(ctx context.Context, page, pageSize int, filters map[string]interface{}) ([]T, int64, error)
	Count(ctx context.Context, filters map[string]interface{}) (int64, error)
	SoftDelete(ctx context.Context, id interface{}) error
	Restore(ctx context.Context, id interface{}) error
	BatchCreate(ctx context.Context, entities []T) error
	BatchUpdate(ctx context.Context, entities []T) error
	BatchDelete(ctx context.Context, ids []interface{}) error
	WithTx(tx *gorm.DB) DAO[T]
}

// BaseDAO provides reusable DAO helpers on top of GORM.
type BaseDAO[T any] struct {
	db *gorm.DB
}

// NewBaseDAO creates a new shared base DAO.
func NewBaseDAO[T any](db *gorm.DB) *BaseDAO[T] {
	return &BaseDAO[T]{db: db}
}

// GetDB returns the tenant DB from context when present, otherwise the default DB.
func (r *BaseDAO[T]) GetDB(ctx context.Context) *gorm.DB {
	if ctx == nil {
		return r.db
	}
	if txDB, ok := ctx.Value("tx_db").(*gorm.DB); ok && txDB != nil {
		return txDB.WithContext(ctx)
	}
	if tenantDB, ok := ctx.Value("tenant_db").(*gorm.DB); ok {
		return tenantDB.WithContext(ctx)
	}
	return r.db.WithContext(ctx)
}

// WithTx returns a DAO bound to the provided transaction.
func (r *BaseDAO[T]) WithTx(tx *gorm.DB) DAO[T] {
	return &BaseDAO[T]{db: tx}
}

// Create persists an entity.
func (r *BaseDAO[T]) Create(ctx context.Context, entity T) error {
	return r.GetDB(ctx).Create(&entity).Error
}

// GetByID queries one entity by ID.
func (r *BaseDAO[T]) GetByID(ctx context.Context, id interface{}) (T, error) {
	var entity T
	err := r.GetDB(ctx).Where("id = ?", id).First(&entity).Error
	if err != nil {
		return entity, err
	}
	return entity, nil
}

// Update persists entity changes.
func (r *BaseDAO[T]) Update(ctx context.Context, entity T) error {
	return r.GetDB(ctx).Save(&entity).Error
}

// Delete removes one entity by ID.
func (r *BaseDAO[T]) Delete(ctx context.Context, id interface{}) error {
	var entity T
	return r.GetDB(ctx).Where("id = ?", id).Delete(&entity).Error
}

// List queries entities with pagination and filters.
func (r *BaseDAO[T]) List(ctx context.Context, page, pageSize int, filters map[string]interface{}) ([]T, int64, error) {
	var entities []T
	var total int64
	query := r.GetDB(ctx).Model(new(T))

	for key, value := range filters {
		query = applyFilter(query, key, value)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Offset(offset).Limit(pageSize).Find(&entities).Error
	if err != nil {
		return nil, 0, err
	}

	return entities, total, nil
}

// Count returns the total matched entities.
func (r *BaseDAO[T]) Count(ctx context.Context, filters map[string]interface{}) (int64, error) {
	var total int64
	query := r.GetDB(ctx).Model(new(T))

	for key, value := range filters {
		query = applyFilter(query, key, value)
	}

	if err := query.Count(&total).Error; err != nil {
		return 0, err
	}

	return total, nil
}

// SoftDelete soft-deletes one entity by ID.
func (r *BaseDAO[T]) SoftDelete(ctx context.Context, id interface{}) error {
	var entity T
	return r.GetDB(ctx).Where("id = ?", id).Delete(&entity).Error
}

// Restore clears soft-delete state by ID.
func (r *BaseDAO[T]) Restore(ctx context.Context, id interface{}) error {
	var entity T
	return r.GetDB(ctx).Unscoped().Model(&entity).Where("id = ?", id).Update("deleted_at", nil).Error
}

// BatchCreate persists multiple entities.
func (r *BaseDAO[T]) BatchCreate(ctx context.Context, entities []T) error {
	return r.GetDB(ctx).Create(&entities).Error
}

// BatchUpdate persists multiple entity updates.
func (r *BaseDAO[T]) BatchUpdate(ctx context.Context, entities []T) error {
	return r.GetDB(ctx).Save(&entities).Error
}

// BatchDelete deletes multiple entities by IDs.
func (r *BaseDAO[T]) BatchDelete(ctx context.Context, ids []interface{}) error {
	var entity T
	return r.GetDB(ctx).Where("id IN ?", ids).Delete(&entity).Error
}

func applyFilter(query *gorm.DB, key string, value interface{}) *gorm.DB {
	if strings.Contains(key, "?") || strings.Contains(key, " ") {
		if args, ok := value.([]interface{}); ok {
			return query.Where(key, args...)
		}
		return query.Where(key, value)
	}
	return query.Where(key+" = ?", value)
}

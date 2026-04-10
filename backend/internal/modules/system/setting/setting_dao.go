package setting

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type SettingDAO interface {
	database.DAO[Setting]
	database.TenantMigrator

	GetByKey(ctx context.Context, tenantID, key string) (*Setting, error)
	Upsert(ctx context.Context, s *Setting) error
	ListByTenant(ctx context.Context, tenantID string) ([]Setting, error)
}

type settingDAO struct {
	*database.BaseDAO[Setting]
}

func NewSettingDAO(db *gorm.DB) SettingDAO {
	return &settingDAO{BaseDAO: database.NewBaseDAO[Setting](db)}
}

func (r *settingDAO) GetTenantModels() []interface{} {
	return []interface{}{&Setting{}}
}

func (r *settingDAO) GetByKey(ctx context.Context, tenantID, key string) (*Setting, error) {
	var s Setting
	err := r.GetDB(ctx).Where("tenant_id = ? AND config_key = ?", tenantID, key).First(&s).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

func (r *settingDAO) Upsert(ctx context.Context, s *Setting) error {
	// GORM clause-based upsert differs across DBs; keep it simple and portable.
	existing, err := r.GetByKey(ctx, s.TenantID, s.Key)
	if err != nil {
		return err
	}
	if existing == nil {
		return r.GetDB(ctx).Create(s).Error
	}
	existing.Category = s.Category
	existing.Value = s.Value
	existing.Label = s.Label
	existing.Type = s.Type
	existing.Description = s.Description
	existing.Editable = s.Editable
	existing.UpdatedBy = s.UpdatedBy
	return r.GetDB(ctx).Save(existing).Error
}

func (r *settingDAO) ListByTenant(ctx context.Context, tenantID string) ([]Setting, error) {
	var out []Setting
	err := r.GetDB(ctx).Where("tenant_id = ?", tenantID).Order("category asc, config_key asc").Find(&out).Error
	return out, err
}

func (r *settingDAO) WithTx(tx *gorm.DB) database.DAO[Setting] {
	return &settingDAO{BaseDAO: database.NewBaseDAO[Setting](tx)}
}

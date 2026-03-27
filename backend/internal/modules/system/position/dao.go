package position

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// PositionRepository 岗位仓储接口
type PositionRepository interface {
	database.DAO[Position]
	database.TenantMigrator
	GetByCode(ctx context.Context, code string) (*Position, error)
	GetByName(ctx context.Context, name string) (*Position, error)
	UpdateStatus(ctx context.Context, id string, status string) error
}

// positionRepository 岗位仓储实现
type positionRepository struct {
	*database.BaseDAO[Position]
}

// NewPositionRepository 创建岗位仓储
func NewPositionRepository(db *gorm.DB) PositionRepository {
	return &positionRepository{
		BaseDAO: database.NewBaseDAO[Position](db),
	}
}

func (r *positionRepository) GetTenantModels() []interface{} {
	return []interface{}{
		&Position{},
	}
}

func (r *positionRepository) GetByCode(ctx context.Context, code string) (*Position, error) {
	var pos Position
	err := r.GetDB(ctx).Where("code = ?", code).First(&pos).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &pos, nil
}

func (r *positionRepository) GetByName(ctx context.Context, name string) (*Position, error) {
	var pos Position
	err := r.GetDB(ctx).Where("name = ?", name).First(&pos).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &pos, nil
}

func (r *positionRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&Position{}).Where("id = ?", id).Update("status", status).Error
}

func (r *positionRepository) WithTx(tx *gorm.DB) database.DAO[Position] {
	return &positionRepository{
		BaseDAO: database.NewBaseDAO[Position](tx),
	}
}

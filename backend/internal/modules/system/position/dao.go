package position

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// PositionDAO defines position DAO behavior.
type PositionDAO interface {
	database.DAO[Position]
	database.TenantMigrator
	GetByCode(ctx context.Context, code string) (*Position, error)
	GetByName(ctx context.Context, name string) (*Position, error)
	UpdateStatus(ctx context.Context, id string, status string) error
}

// positionDAO implements position DAO behavior.
type positionDAO struct {
	*database.BaseDAO[Position]
}

// NewPositionDAO creates a position DAO.
func NewPositionDAO(db *gorm.DB) PositionDAO {
	return &positionDAO{
		BaseDAO: database.NewBaseDAO[Position](db),
	}
}

func (r *positionDAO) GetTenantModels() []interface{} {
	return []interface{}{
		&Position{},
	}
}

func (r *positionDAO) GetByCode(ctx context.Context, code string) (*Position, error) {
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

func (r *positionDAO) GetByName(ctx context.Context, name string) (*Position, error) {
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

func (r *positionDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&Position{}).Where("id = ?", id).Update("status", status).Error
}

func (r *positionDAO) WithTx(tx *gorm.DB) database.DAO[Position] {
	return &positionDAO{
		BaseDAO: database.NewBaseDAO[Position](tx),
	}
}

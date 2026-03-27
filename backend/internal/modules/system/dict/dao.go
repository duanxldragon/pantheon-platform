package dict

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// DictTypeDAO defines dictionary type DAO behavior.
type DictTypeDAO interface {
	database.DAO[DictType]
	database.TenantMigrator
	GetByCode(ctx context.Context, code string) (*DictType, error)
	GetByName(ctx context.Context, name string) (*DictType, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	IsInUse(ctx context.Context, id string) (bool, error)
}

// DictDataDAO defines dictionary data DAO behavior.
type DictDataDAO interface {
	database.DAO[DictData]
	database.TenantMigrator
	GetByTypeID(ctx context.Context, typeID string, page, pageSize int) ([]*DictData, int64, error)
	GetByValue(ctx context.Context, typeID string, value string) (*DictData, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	BatchDeleteByType(ctx context.Context, typeID string) error
}

// dictTypeDAO implements dictionary type DAO behavior.
type dictTypeDAO struct {
	*database.BaseDAO[DictType]
}

// NewDictTypeDAO creates a dictionary type DAO.
func NewDictTypeDAO(db *gorm.DB) DictTypeDAO {
	return &dictTypeDAO{
		BaseDAO: database.NewBaseDAO[DictType](db),
	}
}

func (r *dictTypeDAO) GetTenantModels() []interface{} {
	return []interface{}{&DictType{}}
}

func (r *dictTypeDAO) GetByCode(ctx context.Context, code string) (*DictType, error) {
	var t DictType
	err := r.GetDB(ctx).Where("code = ?", code).First(&t).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

func (r *dictTypeDAO) GetByName(ctx context.Context, name string) (*DictType, error) {
	var t DictType
	err := r.GetDB(ctx).Where("name = ?", name).First(&t).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

func (r *dictTypeDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&DictType{}).Where("id = ?", id).Update("status", status).Error
}

func (r *dictTypeDAO) IsInUse(ctx context.Context, id string) (bool, error) {
	var count int64
	err := r.GetDB(ctx).Model(&DictData{}).Where("type_id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *dictTypeDAO) WithTx(tx *gorm.DB) database.DAO[DictType] {
	return &dictTypeDAO{
		BaseDAO: database.NewBaseDAO[DictType](tx),
	}
}

// dictDataDAO implements dictionary data DAO behavior.
type dictDataDAO struct {
	*database.BaseDAO[DictData]
}

// NewDictDataDAO creates a dictionary data DAO.
func NewDictDataDAO(db *gorm.DB) DictDataDAO {
	return &dictDataDAO{
		BaseDAO: database.NewBaseDAO[DictData](db),
	}
}

func (r *dictDataDAO) GetTenantModels() []interface{} {
	return []interface{}{&DictData{}}
}

func (r *dictDataDAO) GetByTypeID(ctx context.Context, typeID string, page, pageSize int) ([]*DictData, int64, error) {
	var data []*DictData
	var total int64
	query := r.GetDB(ctx).Where("type_id = ?", typeID)
	err := query.Model(&DictData{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	err = query.Order("sort asc").Offset(offset).Limit(pageSize).Find(&data).Error
	return data, total, err
}

func (r *dictDataDAO) GetByValue(ctx context.Context, typeID string, value string) (*DictData, error) {
	var d DictData
	err := r.GetDB(ctx).Where("type_id = ? AND value = ?", typeID, value).First(&d).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}

func (r *dictDataDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&DictData{}).Where("id = ?", id).Update("status", status).Error
}

func (r *dictDataDAO) BatchDeleteByType(ctx context.Context, typeID string) error {
	return r.GetDB(ctx).Where("type_id = ?", typeID).Delete(&DictData{}).Error
}

func (r *dictDataDAO) WithTx(tx *gorm.DB) database.DAO[DictData] {
	return &dictDataDAO{
		BaseDAO: database.NewBaseDAO[DictData](tx),
	}
}

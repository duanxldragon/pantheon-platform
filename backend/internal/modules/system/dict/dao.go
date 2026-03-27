package dict

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// DictTypeRepository 字典类型仓储接口
type DictTypeRepository interface {
	database.DAO[DictType]
	database.TenantMigrator
	GetByCode(ctx context.Context, code string) (*DictType, error)
	GetByName(ctx context.Context, name string) (*DictType, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	IsInUse(ctx context.Context, id string) (bool, error)
}

// DictDataRepository 字典数据仓储接口
type DictDataRepository interface {
	database.DAO[DictData]
	database.TenantMigrator
	GetByTypeID(ctx context.Context, typeID string, page, pageSize int) ([]*DictData, int64, error)
	GetByValue(ctx context.Context, typeID string, value string) (*DictData, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	BatchDeleteByType(ctx context.Context, typeID string) error
}

// dictTypeRepository 字典类型仓储实现
type dictTypeRepository struct {
	*database.BaseDAO[DictType]
}

func NewDictTypeRepository(db *gorm.DB) DictTypeRepository {
	return &dictTypeRepository{
		BaseDAO: database.NewBaseDAO[DictType](db),
	}
}

func (r *dictTypeRepository) GetTenantModels() []interface{} {
	return []interface{}{&DictType{}}
}

func (r *dictTypeRepository) GetByCode(ctx context.Context, code string) (*DictType, error) {
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

func (r *dictTypeRepository) GetByName(ctx context.Context, name string) (*DictType, error) {
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

func (r *dictTypeRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&DictType{}).Where("id = ?", id).Update("status", status).Error
}

func (r *dictTypeRepository) IsInUse(ctx context.Context, id string) (bool, error) {
	var count int64
	err := r.GetDB(ctx).Model(&DictData{}).Where("type_id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *dictTypeRepository) WithTx(tx *gorm.DB) database.DAO[DictType] {
	return &dictTypeRepository{
		BaseDAO: database.NewBaseDAO[DictType](tx),
	}
}

// dictDataRepository 字典数据仓储实现
type dictDataRepository struct {
	*database.BaseDAO[DictData]
}

func NewDictDataRepository(db *gorm.DB) DictDataRepository {
	return &dictDataRepository{
		BaseDAO: database.NewBaseDAO[DictData](db),
	}
}

func (r *dictDataRepository) GetTenantModels() []interface{} {
	return []interface{}{&DictData{}}
}

func (r *dictDataRepository) GetByTypeID(ctx context.Context, typeID string, page, pageSize int) ([]*DictData, int64, error) {
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

func (r *dictDataRepository) GetByValue(ctx context.Context, typeID string, value string) (*DictData, error) {
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

func (r *dictDataRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&DictData{}).Where("id = ?", id).Update("status", status).Error
}

func (r *dictDataRepository) BatchDeleteByType(ctx context.Context, typeID string) error {
	return r.GetDB(ctx).Where("type_id = ?", typeID).Delete(&DictData{}).Error
}

func (r *dictDataRepository) WithTx(tx *gorm.DB) database.DAO[DictData] {
	return &dictDataRepository{
		BaseDAO: database.NewBaseDAO[DictData](tx),
	}
}

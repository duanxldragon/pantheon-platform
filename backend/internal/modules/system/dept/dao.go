package dept

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// DepartmentRepository 部门仓储接口
type DepartmentRepository interface {
	database.DAO[Department]
	database.TenantMigrator
	GetByCode(ctx context.Context, code string) (*Department, error)
	GetByName(ctx context.Context, name string) (*Department, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	GetChildren(ctx context.Context, parentID string) ([]*Department, error)
	GetRoots(ctx context.Context) ([]*Department, error)
	GetTree(ctx context.Context) ([]*Department, error)
	HasChildren(ctx context.Context, id string) (bool, error)
	CheckCircularReference(ctx context.Context, id, parentID string) (bool, error)
}

// departmentRepository 部门仓储实现
type departmentRepository struct {
	*database.BaseDAO[Department]
}

// NewDepartmentRepository 创建部门仓储
func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &departmentRepository{
		BaseDAO: database.NewBaseDAO[Department](db),
	}
}

func (r *departmentRepository) GetTenantModels() []interface{} {
	return []interface{}{
		&Department{},
	}
}

func (r *departmentRepository) GetByCode(ctx context.Context, code string) (*Department, error) {
	var dept Department
	err := r.GetDB(ctx).Where("code = ?", code).First(&dept).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &dept, nil
}

func (r *departmentRepository) GetByName(ctx context.Context, name string) (*Department, error) {
	var dept Department
	err := r.GetDB(ctx).Where("name = ?", name).First(&dept).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &dept, nil
}

func (r *departmentRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&Department{}).Where("id = ?", id).Update("status", status).Error
}

func (r *departmentRepository) GetChildren(ctx context.Context, parentID string) ([]*Department, error) {
	var depts []*Department
	err := r.GetDB(ctx).Where("parent_id = ?", parentID).Find(&depts).Error
	return depts, err
}

func (r *departmentRepository) GetRoots(ctx context.Context) ([]*Department, error) {
	var depts []*Department
	err := r.GetDB(ctx).Where("parent_id IS NULL OR parent_id = ''").Find(&depts).Error
	return depts, err
}

func (r *departmentRepository) GetTree(ctx context.Context) ([]*Department, error) {
	var depts []*Department
	err := r.GetDB(ctx).Order("sort asc").Find(&depts).Error
	return depts, err
}

func (r *departmentRepository) HasChildren(ctx context.Context, id string) (bool, error) {
	var count int64
	err := r.GetDB(ctx).Model(&Department{}).Where("parent_id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *departmentRepository) CheckCircularReference(ctx context.Context, id, parentID string) (bool, error) {
	if id == parentID {
		return true, nil
	}
	currentParentID := parentID
	for currentParentID != "" {
		var dept Department
		err := r.GetDB(ctx).Where("id = ?", currentParentID).First(&dept).Error
		if err != nil {
			break
		}
		if dept.ParentID == nil {
			break
		}
		currentParentID = dept.ParentID.String()
		if currentParentID == id {
			return true, nil
		}
	}
	return false, nil
}

func (r *departmentRepository) WithTx(tx *gorm.DB) database.DAO[Department] {
	return &departmentRepository{
		BaseDAO: database.NewBaseDAO[Department](tx),
	}
}

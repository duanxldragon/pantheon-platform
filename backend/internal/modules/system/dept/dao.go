package dept

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// DepartmentDAO defines department DAO behavior.
type DepartmentDAO interface {
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

// departmentDAO implements department DAO behavior.
type departmentDAO struct {
	*database.BaseDAO[Department]
}

// NewDepartmentDAO creates a department DAO.
func NewDepartmentDAO(db *gorm.DB) DepartmentDAO {
	return &departmentDAO{
		BaseDAO: database.NewBaseDAO[Department](db),
	}
}

func (r *departmentDAO) GetTenantModels() []interface{} {
	return []interface{}{
		&Department{},
	}
}

func (r *departmentDAO) GetByCode(ctx context.Context, code string) (*Department, error) {
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

func (r *departmentDAO) GetByName(ctx context.Context, name string) (*Department, error) {
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

func (r *departmentDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&Department{}).Where("id = ?", id).Update("status", status).Error
}

func (r *departmentDAO) GetChildren(ctx context.Context, parentID string) ([]*Department, error) {
	var depts []*Department
	err := r.GetDB(ctx).Where("parent_id = ?", parentID).Find(&depts).Error
	return depts, err
}

func (r *departmentDAO) GetRoots(ctx context.Context) ([]*Department, error) {
	var depts []*Department
	err := r.GetDB(ctx).Where("parent_id IS NULL OR parent_id = ''").Find(&depts).Error
	return depts, err
}

func (r *departmentDAO) GetTree(ctx context.Context) ([]*Department, error) {
	var depts []*Department
	err := r.GetDB(ctx).Order("sort asc").Find(&depts).Error
	return depts, err
}

func (r *departmentDAO) HasChildren(ctx context.Context, id string) (bool, error) {
	var count int64
	err := r.GetDB(ctx).Model(&Department{}).Where("parent_id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *departmentDAO) CheckCircularReference(ctx context.Context, id, parentID string) (bool, error) {
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

func (r *departmentDAO) WithTx(tx *gorm.DB) database.DAO[Department] {
	return &departmentDAO{
		BaseDAO: database.NewBaseDAO[Department](tx),
	}
}

package role

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// RoleRepository 角色仓储接口
type RoleRepository interface {
	database.DAO[Role]
	database.TenantMigrator
	GetByCode(ctx context.Context, code string) (*Role, error)
	GetByName(ctx context.Context, name string) (*Role, error)
	UpdateStatus(ctx context.Context, id string, status string) error

	// 权限关联
	GetPermissions(ctx context.Context, id string) ([]*PermissionInfo, error)
	AddPermission(ctx context.Context, roleID, permissionID string) error
	RemovePermission(ctx context.Context, roleID, permissionID string) error
	ClearPermissions(ctx context.Context, roleID string) error
	GetUserIDsByRole(ctx context.Context, roleID string) ([]string, error)

	// 菜单关联
	GetMenuIDs(ctx context.Context, roleID string) ([]string, error)
	AssignMenus(ctx context.Context, roleID string, menuIDs []string) error
}

// roleRepository 角色仓储实现
type roleRepository struct {
	*database.BaseDAO[Role]
}

// NewRoleRepository 创建角色仓储
func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepository{
		BaseDAO: database.NewBaseDAO[Role](db),
	}
}

func (r *roleRepository) GetTenantModels() []interface{} {
	return []interface{}{
		&Role{},
		&RolePermission{},
		&RoleMenu{},
		&CasbinRule{},
	}
}

func (r *roleRepository) GetByCode(ctx context.Context, code string) (*Role, error) {
	var role Role
	err := r.GetDB(ctx).Where("code = ?", code).First(&role).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &role, nil
}

func (r *roleRepository) GetByName(ctx context.Context, name string) (*Role, error) {
	var role Role
	err := r.GetDB(ctx).Where("name = ?", name).First(&role).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &role, nil
}

func (r *roleRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&Role{}).Where("id = ?", id).Update("status", status).Error
}

func (r *roleRepository) GetPermissions(ctx context.Context, id string) ([]*PermissionInfo, error) {
	var perms []*PermissionInfo
	err := r.GetDB(ctx).
		Table("system_permissions").
		Select("system_permissions.id, system_permissions.name, system_permissions.code").
		Joins("JOIN system_role_permissions ON system_permissions.id = system_role_permissions.permission_id").
		Where("system_role_permissions.role_id = ?", id).
		Find(&perms).Error
	return perms, err
}

func (r *roleRepository) AddPermission(ctx context.Context, roleID, permissionID string) error {
	rid, _ := uuid.Parse(roleID)
	pid, _ := uuid.Parse(permissionID)
	return r.GetDB(ctx).Create(&RolePermission{
		ID:           uuid.New(),
		RoleID:       rid,
		PermissionID: pid,
	}).Error
}

func (r *roleRepository) RemovePermission(ctx context.Context, roleID, permissionID string) error {
	return r.GetDB(ctx).Where("role_id = ? AND permission_id = ?", roleID, permissionID).Delete(&RolePermission{}).Error
}

func (r *roleRepository) ClearPermissions(ctx context.Context, roleID string) error {
	return r.GetDB(ctx).Where("role_id = ?", roleID).Delete(&RolePermission{}).Error
}

func (r *roleRepository) GetUserIDsByRole(ctx context.Context, roleID string) ([]string, error) {
	var userIDs []string
	err := r.GetDB(ctx).
		Table("system_user_roles").
		Where("role_id = ?", roleID).
		Distinct().
		Pluck("user_id", &userIDs).Error
	return userIDs, err
}

func (r *roleRepository) GetMenuIDs(ctx context.Context, roleID string) ([]string, error) {
	var ids []string
	err := r.GetDB(ctx).Model(&RoleMenu{}).Where("role_id = ?", roleID).Pluck("menu_id", &ids).Error
	return ids, err
}

func (r *roleRepository) AssignMenus(ctx context.Context, roleID string, menuIDs []string) error {
	return r.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		tx.Where("role_id = ?", roleID).Delete(&RoleMenu{})
		rid, _ := uuid.Parse(roleID)
		for _, midStr := range menuIDs {
			mid, _ := uuid.Parse(midStr)
			tx.Create(&RoleMenu{
				ID:     uuid.New(),
				RoleID: rid,
				MenuID: mid,
			})
		}
		return nil
	})
}

func (r *roleRepository) WithTx(tx *gorm.DB) database.DAO[Role] {
	return &roleRepository{
		BaseDAO: database.NewBaseDAO[Role](tx),
	}
}

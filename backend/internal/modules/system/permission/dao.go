package permission

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/modules/system/role"
	"pantheon-platform/backend/internal/shared/database"
)

// PermissionDAO defines permission DAO behavior.
type PermissionDAO interface {
	database.DAO[Permission]
	database.TenantMigrator
	GetByCode(ctx context.Context, code string) (*Permission, error)
	GetByResource(ctx context.Context, resource string) ([]*Permission, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	IsInUse(ctx context.Context, id string) (bool, error)
	GetCodesByIDs(ctx context.Context, ids []string) ([]string, error)
	GetRoleIDsByPermission(ctx context.Context, id string) ([]string, error)
	GetUserIDsByRoleIDs(ctx context.Context, roleIDs []string) ([]string, error)
	GetPermissionRulesByRole(ctx context.Context, roleID string) ([]role.PermissionRule, error)
}

// permissionDAO implements permission DAO behavior.
type permissionDAO struct {
	*database.BaseDAO[Permission]
}

// NewPermissionDAO creates a permission DAO.
func NewPermissionDAO(db *gorm.DB) PermissionDAO {
	return &permissionDAO{
		BaseDAO: database.NewBaseDAO[Permission](db),
	}
}

func (r *permissionDAO) GetTenantModels() []interface{} {
	return []interface{}{
		&Permission{},
	}
}

func (r *permissionDAO) GetByCode(ctx context.Context, code string) (*Permission, error) {
	var perm Permission
	err := r.GetDB(ctx).Where("code = ?", code).First(&perm).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &perm, nil
}

func (r *permissionDAO) GetByResource(ctx context.Context, resource string) ([]*Permission, error) {
	var perms []*Permission
	err := r.GetDB(ctx).Where("resource = ?", resource).Find(&perms).Error
	return perms, err
}

func (r *permissionDAO) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&Permission{}).Where("id = ?", id).Update("status", status).Error
}

func (r *permissionDAO) IsInUse(ctx context.Context, id string) (bool, error) {
	var count int64
	err := r.GetDB(ctx).Table("system_role_permissions").Where("permission_id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *permissionDAO) GetCodesByIDs(ctx context.Context, ids []string) ([]string, error) {
	var codes []string
	err := r.GetDB(ctx).Model(&Permission{}).Where("id IN ?", ids).Pluck("code", &codes).Error
	return codes, err
}

func (r *permissionDAO) GetRoleIDsByPermission(ctx context.Context, id string) ([]string, error) {
	var roleIDs []string
	err := r.GetDB(ctx).
		Table("system_role_permissions").
		Where("permission_id = ?", id).
		Distinct().
		Pluck("role_id", &roleIDs).Error
	return roleIDs, err
}

func (r *permissionDAO) GetUserIDsByRoleIDs(ctx context.Context, roleIDs []string) ([]string, error) {
	var userIDs []string
	if len(roleIDs) == 0 {
		return userIDs, nil
	}

	err := r.GetDB(ctx).
		Table("system_user_roles").
		Where("role_id IN ?", roleIDs).
		Distinct().
		Pluck("user_id", &userIDs).Error
	return userIDs, err
}

func (r *permissionDAO) GetPermissionRulesByRole(ctx context.Context, roleID string) ([]role.PermissionRule, error) {
	var rules []role.PermissionRule
	err := r.GetDB(ctx).
		Table("system_permissions").
		Select("system_permissions.resource, system_permissions.action").
		Joins("JOIN system_role_permissions ON system_permissions.id = system_role_permissions.permission_id").
		Where("system_role_permissions.role_id = ? AND system_permissions.status = ?", roleID, "active").
		Find(&rules).Error
	return rules, err
}

func (r *permissionDAO) WithTx(tx *gorm.DB) database.DAO[Permission] {
	return &permissionDAO{
		BaseDAO: database.NewBaseDAO[Permission](tx),
	}
}

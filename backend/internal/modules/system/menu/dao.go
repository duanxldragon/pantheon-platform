package menu

import (
	"context"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// MenuRepository 菜单仓储接口
type MenuRepository interface {
	database.DAO[Menu]
	database.TenantMigrator
	GetByCode(ctx context.Context, code string) (*Menu, error)
	GetByPath(ctx context.Context, path string) (*Menu, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	GetChildren(ctx context.Context, parentID string) ([]*Menu, error)
	GetRoots(ctx context.Context) ([]*Menu, error)
	GetTree(ctx context.Context) ([]*Menu, error)
	GetTreeByUserID(ctx context.Context, userID string) ([]*Menu, error)
	HasChildren(ctx context.Context, id string) (bool, error)
	CheckCircularReference(ctx context.Context, id, parentID string) (bool, error)
	GetRoleIDsByMenu(ctx context.Context, menuID string) ([]string, error)
	GetUserIDsByRoleIDs(ctx context.Context, roleIDs []string) ([]string, error)
	ClearRoleRelations(ctx context.Context, menuID string) error
}

// menuRepository 菜单仓储实现
type menuRepository struct {
	*database.BaseDAO[Menu]
}

// NewMenuRepository 创建菜单仓储
func NewMenuRepository(db *gorm.DB) MenuRepository {
	return &menuRepository{
		BaseDAO: database.NewBaseDAO[Menu](db),
	}
}

func (r *menuRepository) GetTenantModels() []interface{} {
	return []interface{}{
		&Menu{},
		&RoleMenuRelation{},
	}
}

func (r *menuRepository) GetByCode(ctx context.Context, code string) (*Menu, error) {
	var m Menu
	err := r.GetDB(ctx).Where("code = ?", code).First(&m).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

func (r *menuRepository) GetByPath(ctx context.Context, path string) (*Menu, error) {
	var m Menu
	err := r.GetDB(ctx).Where("path = ?", path).First(&m).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

func (r *menuRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&Menu{}).Where("id = ?", id).Update("status", status).Error
}

func (r *menuRepository) GetChildren(ctx context.Context, parentID string) ([]*Menu, error) {
	var ms []*Menu
	err := r.GetDB(ctx).Where("parent_id = ?", parentID).Find(&ms).Error
	return ms, err
}

func (r *menuRepository) GetRoots(ctx context.Context) ([]*Menu, error) {
	var ms []*Menu
	err := r.GetDB(ctx).Where("parent_id IS NULL OR parent_id = ''").Find(&ms).Error
	return ms, err
}

func (r *menuRepository) GetTree(ctx context.Context) ([]*Menu, error) {
	var ms []*Menu
	err := r.GetDB(ctx).Order("sort asc").Find(&ms).Error
	return ms, err
}

func (r *menuRepository) GetTreeByUserID(ctx context.Context, userID string) ([]*Menu, error) {
	if userID == "" {
		return []*Menu{}, nil
	}

	var allMenus []*Menu
	if err := r.GetDB(ctx).
		Where("status = ?", "active").
		Order("sort asc").
		Find(&allMenus).Error; err != nil {
		return nil, err
	}
	if len(allMenus) == 0 {
		return []*Menu{}, nil
	}

	var assignedIDs []string
	if err := r.GetDB(ctx).
		Table("system_menus AS m").
		Distinct("m.id").
		Joins("JOIN system_role_menus rm ON rm.menu_id = m.id").
		Joins("JOIN system_user_roles ur ON ur.role_id = rm.role_id").
		Joins("JOIN system_roles sr ON sr.id = ur.role_id").
		Where("ur.user_id = ? AND m.status = ? AND sr.status = ?", userID, "active", "active").
		Pluck("m.id", &assignedIDs).Error; err != nil {
		return nil, err
	}
	if len(assignedIDs) == 0 {
		return []*Menu{}, nil
	}

	menuByID := make(map[string]*Menu, len(allMenus))
	for _, item := range allMenus {
		menuByID[item.ID.String()] = item
	}

	selected := make(map[string]struct{}, len(assignedIDs))
	for _, menuID := range assignedIDs {
		currentID := menuID
		for currentID != "" {
			if _, exists := selected[currentID]; exists {
				break
			}
			selected[currentID] = struct{}{}

			currentMenu, ok := menuByID[currentID]
			if !ok || currentMenu.ParentID == nil {
				break
			}
			currentID = currentMenu.ParentID.String()
		}
	}

	result := make([]*Menu, 0, len(selected))
	for _, item := range allMenus {
		if _, ok := selected[item.ID.String()]; ok {
			result = append(result, item)
		}
	}
	return result, nil
}

func (r *menuRepository) HasChildren(ctx context.Context, id string) (bool, error) {
	var count int64
	err := r.GetDB(ctx).Model(&Menu{}).Where("parent_id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *menuRepository) CheckCircularReference(ctx context.Context, id, parentID string) (bool, error) {
	if id == parentID {
		return true, nil
	}
	currentParentID := parentID
	for currentParentID != "" {
		var menu Menu
		err := r.GetDB(ctx).Where("id = ?", currentParentID).First(&menu).Error
		if err != nil {
			break
		}
		if menu.ParentID == nil {
			break
		}
		currentParentID = menu.ParentID.String()
		if currentParentID == id {
			return true, nil
		}
	}
	return false, nil
}

func (r *menuRepository) GetRoleIDsByMenu(ctx context.Context, menuID string) ([]string, error) {
	var ids []string
	err := r.GetDB(ctx).Model(&RoleMenuRelation{}).Where("menu_id = ?", menuID).Distinct().Pluck("role_id", &ids).Error
	return ids, err
}

func (r *menuRepository) GetUserIDsByRoleIDs(ctx context.Context, roleIDs []string) ([]string, error) {
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

func (r *menuRepository) ClearRoleRelations(ctx context.Context, menuID string) error {
	return r.GetDB(ctx).Where("menu_id = ?", menuID).Delete(&RoleMenuRelation{}).Error
}

func (r *menuRepository) WithTx(tx *gorm.DB) database.DAO[Menu] {
	return &menuRepository{
		BaseDAO: database.NewBaseDAO[Menu](tx),
	}
}

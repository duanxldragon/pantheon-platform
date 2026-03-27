package menu

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"pantheon-platform/backend/internal/shared/audit"
	"pantheon-platform/backend/internal/shared/database"
)

type AuthorizationProvider interface {
	BumpRoleUsersAuthVersion(ctx context.Context, roleID string) error
}

// ========== 服务接口 ==========

type MenuService interface {
	Create(ctx context.Context, req *MenuRequest) (*Menu, error)
	GetByID(ctx context.Context, id string) (*MenuResponse, error)
	Update(ctx context.Context, id string, req *MenuRequest) (*Menu, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, page, pageSize int, search string) (*PageResponse, error)
	GetTree(ctx context.Context, req *MenuTreeRequest) ([]*MenuResponse, error)
	GetUserTree(ctx context.Context, userID string) ([]*MenuResponse, error)
}

// ========== 服务实现 ==========

type menuService struct {
	repo         MenuRepository
	authProvider AuthorizationProvider
	txManager    database.TransactionManager
}

func NewMenuService(repo MenuRepository, authProvider AuthorizationProvider, txManager database.TransactionManager) MenuService {
	return &menuService{
		repo:         repo,
		authProvider: authProvider,
		txManager:    txManager,
	}
}

func (s *menuService) Create(ctx context.Context, req *MenuRequest) (*Menu, error) {
	if existing, _ := s.repo.GetByCode(ctx, req.Code); existing != nil {
		return nil, fmt.Errorf("menu code exists")
	}
	if existing, _ := s.repo.GetByPath(ctx, req.Path); existing != nil {
		return nil, fmt.Errorf("menu path exists")
	}
	if err := validateMenuRoute(req); err != nil {
		return nil, err
	}

	parentID, err := s.resolveParent(ctx, "", req.ParentID, req.Type)
	if err != nil {
		return nil, err
	}

	sort := 0
	if req.Sort != nil {
		sort = *req.Sort
	}

	m := &Menu{
		ID:         uuid.New(),
		Name:       req.Name,
		Code:       req.Code,
		Path:       req.Path,
		Component:  strings.TrimSpace(req.Component),
		Icon:       req.Icon,
		Type:       req.Type,
		ParentID:   parentID,
		Sort:       sort,
		Status:     req.Status,
		IsExternal: req.IsExternal,
		TenantID:   getTenantID(ctx),
	}

	err = s.repo.Create(ctx, *m)
	if err == nil {
		setMenuAuditFields(ctx, audit.OperationFields{
			Module:       "system/menus",
			Resource:     "menu",
			ResourceID:   m.ID.String(),
			ResourceName: m.Name,
			Summary:      fmt.Sprintf("创建菜单「%s」", m.Name),
			Detail:       buildMenuAuditDetail(m.ID.String(), m.Name, map[string]string{"path": m.Path, "type": m.Type, "status": m.Status}),
		})
	}
	return m, err
}

func (s *menuService) GetByID(ctx context.Context, id string) (*MenuResponse, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToMenuResponse(&m, nil), nil
}

func (s *menuService) Update(ctx context.Context, id string, req *MenuRequest) (*Menu, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	tenantID := getTenantID(ctx)
	if tenantID != "" && m.TenantID != tenantID {
		return nil, fmt.Errorf("menu not found in current tenant")
	}
	if existing, _ := s.repo.GetByCode(ctx, req.Code); existing != nil && existing.ID != m.ID {
		return nil, fmt.Errorf("menu code exists")
	}
	if existing, _ := s.repo.GetByPath(ctx, req.Path); existing != nil && existing.ID != m.ID {
		return nil, fmt.Errorf("menu path exists")
	}
	if err := validateMenuRoute(req); err != nil {
		return nil, err
	}

	parentID, err := s.resolveParent(ctx, id, req.ParentID, req.Type)
	if err != nil {
		return nil, err
	}

	roleIDs, _ := s.repo.GetRoleIDsByMenu(ctx, id)
	userIDs, _ := s.repo.GetUserIDsByRoleIDs(ctx, roleIDs)

	m.Name = req.Name
	m.Code = req.Code
	m.Path = req.Path
	m.Component = strings.TrimSpace(req.Component)
	m.Icon = req.Icon
	m.Type = req.Type
	m.ParentID = parentID
	m.Status = req.Status
	m.IsExternal = req.IsExternal
	if req.Sort != nil {
		m.Sort = *req.Sort
	}

	err = s.repo.Update(ctx, m)
	if err != nil {
		return nil, err
	}
	s.bumpMenuRoles(ctx, id)
	setMenuAuditFields(ctx, audit.OperationFields{
		Module:       "system/menus",
		Resource:     "menu",
		ResourceID:   m.ID.String(),
		ResourceName: m.Name,
		Summary:      fmt.Sprintf("更新菜单「%s」，影响 %d 个角色、%d 个用户的动态菜单权限", m.Name, len(uniqueStrings(roleIDs)), len(uniqueStrings(userIDs))),
		Detail:       buildMenuAuditDetail(m.ID.String(), m.Name, map[string]string{"path": m.Path, "type": m.Type, "status": m.Status, "affected_roles": fmt.Sprintf("%d", len(uniqueStrings(roleIDs))), "affected_users": fmt.Sprintf("%d", len(uniqueStrings(userIDs))), "refresh_strategy": "bump_auth_version"}),
	})
	return &m, nil
}

func (s *menuService) Delete(ctx context.Context, id string) error {
	menu, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if has, _ := s.repo.HasChildren(ctx, id); has {
		return fmt.Errorf("menu has children")
	}

	tenantID := getTenantID(ctx)
	if tenantID != "" && menu.TenantID != tenantID {
		return fmt.Errorf("menu not found in current tenant")
	}

	roleIDs, err := s.repo.GetRoleIDsByMenu(ctx, id)
	if err != nil {
		return err
	}

	err = s.txManager.Transaction(ctx, func(txDB *gorm.DB) error {
		repo := s.repo.WithTx(txDB).(MenuRepository)
		txCtx := context.WithValue(ctx, "tenant_db", txDB)
		if err := repo.ClearRoleRelations(txCtx, id); err != nil {
			return err
		}
		return repo.Delete(txCtx, id)
	})
	if err != nil {
		return err
	}
	s.bumpRoleUsers(ctx, roleIDs)
	userIDs, _ := s.repo.GetUserIDsByRoleIDs(ctx, roleIDs)
	setMenuAuditFields(ctx, audit.OperationFields{
		Module:       "system/menus",
		Resource:     "menu",
		ResourceID:   menu.ID.String(),
		ResourceName: menu.Name,
		Summary:      fmt.Sprintf("删除菜单「%s」，影响 %d 个角色、%d 个用户的动态菜单权限", menu.Name, len(uniqueStrings(roleIDs)), len(uniqueStrings(userIDs))),
		Detail:       buildMenuAuditDetail(menu.ID.String(), menu.Name, map[string]string{"path": menu.Path, "type": menu.Type, "status": menu.Status, "affected_roles": fmt.Sprintf("%d", len(uniqueStrings(roleIDs))), "affected_users": fmt.Sprintf("%d", len(uniqueStrings(userIDs))), "refresh_strategy": "bump_auth_version"}),
	})
	return nil
}

func (s *menuService) List(ctx context.Context, page, pageSize int, search string) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if search != "" {
		filters["name LIKE ?"] = "%" + search + "%"
	}

	ms, total, err := s.repo.List(ctx, page, pageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*MenuResponse, len(ms))
	for i, m := range ms {
		items[i] = ToMenuResponse(&m, nil)
	}

	return &PageResponse{
		Items: items,
		Pagination: Pagination{
			Page:     int64(page),
			PageSize: int64(pageSize),
			Total:    total,
		},
	}, nil
}

func (s *menuService) GetTree(ctx context.Context, req *MenuTreeRequest) ([]*MenuResponse, error) {
	ms, err := s.repo.GetTree(ctx)
	if err != nil {
		return nil, err
	}
	return buildMenuTree(ms, ""), nil
}

func (s *menuService) GetUserTree(ctx context.Context, userID string) ([]*MenuResponse, error) {
	ms, err := s.repo.GetTreeByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return buildMenuTree(ms, ""), nil
}

func buildMenuTree(menus []*Menu, parentID string) []*MenuResponse {
	var tree []*MenuResponse
	for _, m := range menus {
		pid := ""
		if m.ParentID != nil {
			pid = m.ParentID.String()
		}
		if pid == parentID {
			resp := ToMenuResponse(m, nil)
			children := buildMenuTree(menus, m.ID.String())
			for _, child := range children {
				resp.Children = append(resp.Children, *child)
			}
			tree = append(tree, resp)
		}
	}
	return tree
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func (s *menuService) resolveParent(ctx context.Context, menuID string, parentID *string, menuType string) (*uuid.UUID, error) {
	if parentID == nil || strings.TrimSpace(*parentID) == "" {
		if menuType == "button" {
			return nil, fmt.Errorf("button menu must have a parent menu")
		}
		return nil, nil
	}

	parentValue := strings.TrimSpace(*parentID)
	if menuID != "" && parentValue == menuID {
		return nil, fmt.Errorf("menu parent cannot be itself")
	}

	parent, err := s.repo.GetByID(ctx, parentValue)
	if err != nil {
		return nil, fmt.Errorf("parent menu not found")
	}
	if parent.Status != "active" {
		return nil, fmt.Errorf("parent menu is inactive")
	}
	if parent.Type == "button" {
		return nil, fmt.Errorf("button menu cannot contain child menus")
	}

	switch menuType {
	case "directory":
		if parent.Type != "directory" {
			return nil, fmt.Errorf("directory menu parent must be directory")
		}
	case "button":
		if parent.Type != "menu" {
			return nil, fmt.Errorf("button menu parent must be menu")
		}
	}

	if menuID != "" {
		circular, err := s.repo.CheckCircularReference(ctx, menuID, parentValue)
		if err != nil {
			return nil, err
		}
		if circular {
			return nil, fmt.Errorf("menu parent creates a circular reference")
		}
	}

	parentUUID, err := uuid.Parse(parentValue)
	if err != nil {
		return nil, fmt.Errorf("invalid parent menu id")
	}
	return &parentUUID, nil
}

func validateMenuRoute(req *MenuRequest) error {
	path := strings.TrimSpace(req.Path)
	component := strings.TrimSpace(req.Component)

	switch req.Type {
	case "directory":
		if req.IsExternal {
			return fmt.Errorf("directory menu cannot be external")
		}
		if component != "" {
			return fmt.Errorf("directory menu cannot set component")
		}
	case "button":
		if req.IsExternal {
			return fmt.Errorf("button menu cannot be external")
		}
		if component != "" {
			return fmt.Errorf("button menu cannot set component")
		}
	case "menu":
		if req.IsExternal {
			if component != "" {
				return fmt.Errorf("external menu cannot set component")
			}
			if !strings.HasPrefix(path, "http://") && !strings.HasPrefix(path, "https://") {
				return fmt.Errorf("external menu path must start with http:// or https://")
			}
		} else if component == "" {
			return fmt.Errorf("menu component is required")
		}
	}

	return nil
}

func (s *menuService) bumpMenuRoles(ctx context.Context, menuID string) {
	if s == nil || s.repo == nil || s.authProvider == nil || menuID == "" {
		return
	}
	roleIDs, err := s.repo.GetRoleIDsByMenu(ctx, menuID)
	if err != nil {
		return
	}
	s.bumpRoleUsers(ctx, roleIDs)
}

func (s *menuService) bumpRoleUsers(ctx context.Context, roleIDs []string) {
	if s == nil || s.authProvider == nil || len(roleIDs) == 0 {
		return
	}
	seen := make(map[string]struct{}, len(roleIDs))
	for _, roleID := range roleIDs {
		if roleID == "" {
			continue
		}
		if _, ok := seen[roleID]; ok {
			continue
		}
		seen[roleID] = struct{}{}
		_ = s.authProvider.BumpRoleUsersAuthVersion(ctx, roleID)
	}
}

func setMenuAuditFields(ctx context.Context, fields audit.OperationFields) {
	if collector := audit.FromContext(ctx); collector != nil {
		collector.Set(fields)
	}
}

func buildMenuAuditDetail(menuID, menuName string, attrs map[string]string) string {
	parts := []string{
		"菜单ID=" + menuID,
		"菜单名称=" + menuName,
	}
	for _, key := range []string{"path", "type", "status", "affected_roles", "affected_users", "refresh_strategy"} {
		if value := strings.TrimSpace(attrs[key]); value != "" {
			parts = append(parts, key+"="+value)
		}
	}
	return strings.Join(parts, "；")
}

func uniqueStrings(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

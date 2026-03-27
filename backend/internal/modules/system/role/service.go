package role

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/modules/system/menu"
	"pantheon-platform/backend/internal/shared/audit"
	"pantheon-platform/backend/internal/shared/database"
)

// External dependency interfaces.

type PermissionValidator interface {
	CheckPermissionExists(ctx context.Context, id string) (bool, error)
	GetPermissionRules(ctx context.Context, ids []string) ([]PermissionRule, error)
}

type UserValidator interface {
	CheckRoleInUse(ctx context.Context, roleID string) (bool, error)
}

type QuotaValidator interface {
	CheckQuota(ctx context.Context, tenantID string, quotaType string) error
	IncreaseUsage(ctx context.Context, tenantID string, quotaType string, amount int64, operator string) error
	DecreaseUsage(ctx context.Context, tenantID string, quotaType string, amount int64, operator string) error
}

type PermissionRule struct {
	Resource string
	Action   string
}

type AuthorizationProvider interface {
	UpdateRolePermissions(ctx context.Context, roleID string, rules []PermissionRule) error
	BumpRoleUsersAuthVersion(ctx context.Context, roleID string) error
	BumpUsersAuthVersion(ctx context.Context, userIDs []string) error
	RevokeUsersSessions(ctx context.Context, userIDs []string) error
	SyncRoleUsers(ctx context.Context, roleID string, userIDs []string, enabled bool) error
	RemoveRole(ctx context.Context, roleID string) error
}

// Role service interface.

type RoleService interface {
	Create(ctx context.Context, req *RoleRequest) (*Role, error)
	GetByID(ctx context.Context, id string) (*RoleResponse, error)
	Update(ctx context.Context, id string, req *RoleUpdateRequest) (*Role, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, req *RoleListRequest) (*PageResponse, error)

	AssignPermissions(ctx context.Context, req *RolePermissionRequest) error
	AssignMenus(ctx context.Context, roleID string, menuIDs []string) error
}

// roleService implements role business logic.

type roleService struct {
	dao            RoleDAO
	menuDAO        menu.MenuDAO
	permValidator  PermissionValidator
	userValidator  UserValidator
	quotaValidator QuotaValidator
	authProvider   AuthorizationProvider
	txManager      database.TransactionManager
}

func NewRoleService(
	dao RoleDAO,
	menuDAO menu.MenuDAO,
	permValidator PermissionValidator,
	userValidator UserValidator,
	quotaValidator QuotaValidator,
	authProvider AuthorizationProvider,
	txManager database.TransactionManager,
) RoleService {
	return &roleService{
		dao:            dao,
		menuDAO:        menuDAO,
		permValidator:  permValidator,
		userValidator:  userValidator,
		quotaValidator: quotaValidator,
		authProvider:   authProvider,
		txManager:      txManager,
	}
}

func (s *roleService) Create(ctx context.Context, req *RoleRequest) (*Role, error) {
	tenantID := getTenantID(ctx)
	if tenantID != "" && s.quotaValidator != nil {
		if err := s.quotaValidator.CheckQuota(ctx, tenantID, "roles"); err != nil {
			return nil, err
		}
	}

	if existing, _ := s.dao.GetByCode(ctx, req.Code); existing != nil {
		return nil, fmt.Errorf("role code exists")
	}

	role := &Role{
		ID:          uuid.New(),
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Type:        req.Type,
		Status:      req.Status,
		TenantID:    tenantID,
	}

	err := s.dao.Create(ctx, *role)
	if err == nil && tenantID != "" && s.quotaValidator != nil {
		_ = s.quotaValidator.IncreaseUsage(ctx, tenantID, "roles", 1, "system")
	}
	return role, err
}

func (s *roleService) GetByID(ctx context.Context, id string) (*RoleResponse, error) {
	role, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	perms, _ := s.dao.GetPermissions(ctx, id)
	menuIDs, _ := s.dao.GetMenuIDs(ctx, id)
	return ToRoleResponse(&role, s.convertPerms(perms), menuIDs), nil
}

func (s *roleService) Update(ctx context.Context, id string, req *RoleUpdateRequest) (*Role, error) {
	role, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	previousStatus := role.Status

	if req.Name != nil {
		role.Name = *req.Name
	}
	if req.Status != nil {
		role.Status = *req.Status
	}

	// Ensure the role belongs to the current tenant.
	tenantID := getTenantID(ctx)
	if role.TenantID != tenantID {
		return nil, fmt.Errorf("role not found in current tenant")
	}

	if err := s.dao.Update(ctx, role); err != nil {
		return nil, err
	}
	if req.Status != nil && previousStatus != role.Status {
		if err := s.handleRoleStatusChange(ctx, role); err != nil {
			return nil, err
		}
	} else {
		setOperationAuditFields(ctx, audit.OperationFields{
			Module:       "system/roles",
			Resource:     "role",
			ResourceID:   role.ID.String(),
			ResourceName: role.Name,
			Summary:      fmt.Sprintf("Updated role %q", role.Name),
			Detail:       buildRoleAuditDetail(role.ID.String(), role.Name, map[string]string{"status": role.Status}),
		})
	}
	return &role, nil
}

func (s *roleService) Delete(ctx context.Context, id string) error {
	role, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if inUse, _ := s.userValidator.CheckRoleInUse(ctx, id); inUse {
		return fmt.Errorf("role is in use by users")
	}

	// Ensure the role belongs to the current tenant.
	tenantID := getTenantID(ctx)
	if role.TenantID != tenantID {
		return fmt.Errorf("role not found in current tenant")
	}

	err = s.txManager.Transaction(ctx, func(tx *gorm.DB) error {
		txDAO := s.dao.WithTx(tx).(RoleDAO)
		_ = txDAO.ClearPermissions(ctx, id)
		if s.authProvider != nil {
			_ = s.authProvider.RemoveRole(ctx, role.ID.String())
		}
		return txDAO.Delete(ctx, id)
	})

	if err == nil && tenantID != "" && s.quotaValidator != nil {
		_ = s.quotaValidator.DecreaseUsage(ctx, tenantID, "roles", 1, "system")
	}

	return err
}

func (s *roleService) List(ctx context.Context, req *RoleListRequest) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if req.Status != "" {
		filters["status"] = req.Status
	}

	roles, total, err := s.dao.List(ctx, req.Page, req.PageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*RoleResponse, len(roles))
	for i, r := range roles {
		items[i] = ToRoleResponse(&r, nil, nil)
	}

	return &PageResponse{
		Items: items,
		Pagination: Pagination{
			Page:     int64(req.Page),
			PageSize: int64(req.PageSize),
			Total:    total,
		},
	}, nil
}

func (s *roleService) AssignPermissions(ctx context.Context, req *RolePermissionRequest) error {
	role, err := s.dao.GetByID(ctx, req.RoleID)
	if err != nil {
		return err
	}

	rules, err := s.permValidator.GetPermissionRules(ctx, req.PermissionIDs)
	if err != nil {
		return err
	}

	if err := s.txManager.Transaction(ctx, func(tx *gorm.DB) error {
		txDAO := s.dao.WithTx(tx).(RoleDAO)
		_ = txDAO.ClearPermissions(ctx, req.RoleID)
		for _, pid := range req.PermissionIDs {
			_ = txDAO.AddPermission(ctx, req.RoleID, pid)
		}
		if s.authProvider != nil {
			if role.Status == "active" {
				return s.authProvider.UpdateRolePermissions(ctx, role.ID.String(), rules)
			}
			return s.authProvider.UpdateRolePermissions(ctx, role.ID.String(), nil)
		}
		return nil
	}); err != nil {
		return err
	}
	if s.authProvider != nil {
		_ = s.authProvider.BumpRoleUsersAuthVersion(ctx, role.ID.String())
	}
	userIDs, _ := s.dao.GetUserIDsByRole(ctx, role.ID.String())
	setOperationAuditFields(ctx, audit.OperationFields{
		Module:       "system/roles",
		Resource:     "role_permission",
		ResourceID:   role.ID.String(),
		ResourceName: role.Name,
		Summary:      fmt.Sprintf("Assigned %d permissions to role %q and refreshed %d users", len(req.PermissionIDs), role.Name, len(userIDs)),
		Detail:       buildRoleAuditDetail(role.ID.String(), role.Name, map[string]string{"permission_count": fmt.Sprintf("%d", len(req.PermissionIDs)), "affected_users": fmt.Sprintf("%d", len(userIDs)), "refresh_strategy": "bump_auth_version"}),
	})
	return nil
}

func (s *roleService) AssignMenus(ctx context.Context, roleID string, menuIDs []string) error {
	role, err := s.dao.GetByID(ctx, roleID)
	if err != nil {
		return err
	}
	tenantID := getTenantID(ctx)
	if tenantID != "" && role.TenantID != tenantID {
		return fmt.Errorf("role not found in current tenant")
	}

	for _, menuID := range menuIDs {
		if s.menuDAO == nil {
			return fmt.Errorf("menu DAO not configured")
		}
		record, err := s.menuDAO.GetByID(ctx, menuID)
		if err != nil {
			return fmt.Errorf("menu not found")
		}
		if tenantID != "" && record.TenantID != tenantID {
			return fmt.Errorf("menu not found in current tenant")
		}
	}

	if err := s.dao.AssignMenus(ctx, roleID, menuIDs); err != nil {
		return err
	}
	if s.authProvider != nil {
		_ = s.authProvider.BumpRoleUsersAuthVersion(ctx, roleID)
	}
	userIDs, _ := s.dao.GetUserIDsByRole(ctx, roleID)
	setOperationAuditFields(ctx, audit.OperationFields{
		Module:       "system/roles",
		Resource:     "role_menu",
		ResourceID:   role.ID.String(),
		ResourceName: role.Name,
		Summary:      fmt.Sprintf("Assigned %d menus to role %q and refreshed %d users", len(menuIDs), role.Name, len(userIDs)),
		Detail:       buildRoleAuditDetail(role.ID.String(), role.Name, map[string]string{"menu_count": fmt.Sprintf("%d", len(menuIDs)), "affected_users": fmt.Sprintf("%d", len(userIDs)), "refresh_strategy": "bump_auth_version"}),
	})
	return nil
}

func (s *roleService) convertPerms(perms []*PermissionInfo) []PermissionInfo {
	res := make([]PermissionInfo, len(perms))
	for i, p := range perms {
		res[i] = *p
	}
	return res
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func (s *roleService) handleRoleStatusChange(ctx context.Context, role Role) error {
	if s == nil || s.authProvider == nil {
		return nil
	}

	userIDs, err := s.dao.GetUserIDsByRole(ctx, role.ID.String())
	if err != nil {
		return err
	}

	switch role.Status {
	case "inactive":
		if err := s.authProvider.UpdateRolePermissions(ctx, role.ID.String(), nil); err != nil {
			return err
		}
		if err := s.authProvider.SyncRoleUsers(ctx, role.ID.String(), userIDs, false); err != nil {
			return err
		}
		if err := s.authProvider.RevokeUsersSessions(ctx, userIDs); err != nil {
			return err
		}
		setOperationAuditFields(ctx, audit.OperationFields{
			Module:       "system/roles",
			Resource:     "role",
			ResourceID:   role.ID.String(),
			ResourceName: role.Name,
			Summary:      fmt.Sprintf("Disabled role %q, affected %d users, and revoked their sessions", role.Name, len(userIDs)),
			Detail:       buildRoleAuditDetail(role.ID.String(), role.Name, map[string]string{"status": "inactive", "affected_users": fmt.Sprintf("%d", len(userIDs)), "session_strategy": "revoke"}),
		})
	case "active":
		if err := s.restoreRoleAuthorization(ctx, role.ID.String(), userIDs); err != nil {
			return err
		}
		setOperationAuditFields(ctx, audit.OperationFields{
			Module:       "system/roles",
			Resource:     "role",
			ResourceID:   role.ID.String(),
			ResourceName: role.Name,
			Summary:      fmt.Sprintf("Enabled role %q and refreshed authorization for %d users", role.Name, len(userIDs)),
			Detail:       buildRoleAuditDetail(role.ID.String(), role.Name, map[string]string{"status": "active", "affected_users": fmt.Sprintf("%d", len(userIDs)), "session_strategy": "refresh_auth_version"}),
		})
	}

	return nil
}

func (s *roleService) restoreRoleAuthorization(ctx context.Context, roleID string, userIDs []string) error {
	if s == nil || s.authProvider == nil {
		return nil
	}

	perms, err := s.dao.GetPermissions(ctx, roleID)
	if err != nil {
		return err
	}

	permissionIDs := make([]string, 0, len(perms))
	for _, perm := range perms {
		if perm == nil || perm.ID == "" {
			continue
		}
		permissionIDs = append(permissionIDs, perm.ID)
	}

	rules := make([]PermissionRule, 0, len(permissionIDs))
	if len(permissionIDs) > 0 {
		rules, err = s.permValidator.GetPermissionRules(ctx, permissionIDs)
		if err != nil {
			return err
		}
	}

	if err := s.authProvider.UpdateRolePermissions(ctx, roleID, rules); err != nil {
		return err
	}
	if err := s.authProvider.SyncRoleUsers(ctx, roleID, userIDs, true); err != nil {
		return err
	}
	if err := s.authProvider.BumpUsersAuthVersion(ctx, userIDs); err != nil {
		return err
	}

	return nil
}

func setOperationAuditFields(ctx context.Context, fields audit.OperationFields) {
	if collector := audit.FromContext(ctx); collector != nil {
		collector.Set(fields)
	}
}

func buildRoleAuditDetail(roleID, roleName string, attributes map[string]string) string {
	items := []string{
		"role_id=" + roleID,
		"role_name=" + roleName,
	}
	for _, key := range []string{"status", "permission_count", "menu_count", "affected_users", "session_strategy", "refresh_strategy"} {
		if value := strings.TrimSpace(attributes[key]); value != "" {
			items = append(items, key+"="+value)
		}
	}
	return strings.Join(items, "; ")
}

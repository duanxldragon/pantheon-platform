package role

import (
	"context"
	"errors"
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
	ValidateDataScope(rule string) (bool, error)
}

var errInvalidRoleDataScope = errors.New("invalid role data scope")
var errRoleCodeExists = errors.New("role code exists")
var errRoleNameExists = errors.New("role name exists")

// Role service interface.

type RoleService interface {
	Create(ctx context.Context, req *RoleRequest) (*Role, error)
	GetByID(ctx context.Context, id string) (*RoleResponse, error)
	Update(ctx context.Context, id string, req *RoleUpdateRequest) (*Role, error)
	Delete(ctx context.Context, id string) error
	BatchDelete(ctx context.Context, ids []string) error
	BatchUpdateStatus(ctx context.Context, req *RoleStatusRequest) error
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
	if err := s.validateRoleDataScope(req.DataScope); err != nil {
		return nil, err
	}

	tenantID := getTenantID(ctx)
	if tenantID != "" && s.quotaValidator != nil {
		if err := s.quotaValidator.CheckQuota(ctx, tenantID, "roles"); err != nil {
			return nil, err
		}
	}

	if existing, _ := s.dao.GetByCode(ctx, req.Code); existing != nil {
		return nil, errRoleCodeExists
	}
	if existing, _ := s.dao.GetByName(ctx, req.Name); existing != nil {
		return nil, errRoleNameExists
	}

	role := &Role{
		ID:          uuid.New(),
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Type:        req.Type,
		Status:      req.Status,
		DataScope:   normalizeRoleDataScope(req.DataScope, "all"),
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
	userIDs, _ := s.dao.GetUserIDsByRole(ctx, id)
	resp := ToRoleResponse(&role, s.convertPerms(perms), menuIDs)
	resp.UserCount = len(userIDs)
	return resp, nil
}

func (s *roleService) Update(ctx context.Context, id string, req *RoleUpdateRequest) (*Role, error) {
	role, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	previousStatus := role.Status
	previousDataScope := role.DataScope

	if req.Name != nil {
		if existing, _ := s.dao.GetByName(ctx, *req.Name); existing != nil && existing.ID != role.ID {
			return nil, errRoleNameExists
		}
		role.Name = *req.Name
	}
	if req.Code != nil {
		if existing, _ := s.dao.GetByCode(ctx, *req.Code); existing != nil && existing.ID != role.ID {
			return nil, errRoleCodeExists
		}
		role.Code = *req.Code
	}
	if req.Description != nil {
		role.Description = *req.Description
	}
	if req.Status != nil {
		role.Status = *req.Status
	}
	if req.DataScope != nil {
		if err := s.validateRoleDataScope(*req.DataScope); err != nil {
			return nil, err
		}
		role.DataScope = normalizeRoleDataScope(*req.DataScope, role.DataScope)
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
		dataScopeChanged := previousDataScope != role.DataScope
		if dataScopeChanged && s.authProvider != nil {
			_ = s.authProvider.BumpRoleUsersAuthVersion(ctx, role.ID.String())
		}
		detail := map[string]string{"status": role.Status, "data_scope": role.DataScope}
		if dataScopeChanged {
			detail["refresh_strategy"] = "bump_auth_version"
		}
		setOperationAuditFields(ctx, audit.OperationFields{
			Module:       "system/roles",
			Resource:     "role",
			ResourceID:   role.ID.String(),
			ResourceName: role.Name,
			Summary:      fmt.Sprintf("Updated role %q", role.Name),
			Detail:       buildRoleAuditDetail(role.ID.String(), role.Name, detail),
		})
	}
	return &role, nil
}

func (s *roleService) Delete(ctx context.Context, id string) error {
	role, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if role.Type == "system" || role.IsSystem {
		return fmt.Errorf("system role cannot be deleted")
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
		txCtx := context.WithValue(ctx, "tx_db", tx)
		if err := txDAO.ClearPermissions(txCtx, id); err != nil {
			return err
		}
		if err := txDAO.ClearMenus(txCtx, id); err != nil {
			return err
		}
		if s.authProvider != nil {
			if err := s.authProvider.RemoveRole(txCtx, role.ID.String()); err != nil {
				return err
			}
		}
		return txDAO.Delete(txCtx, id)
	})

	if err == nil && tenantID != "" && s.quotaValidator != nil {
		_ = s.quotaValidator.DecreaseUsage(ctx, tenantID, "roles", 1, "system")
	}

	return err
}

func (s *roleService) BatchDelete(ctx context.Context, ids []string) error {
	tenantID := getTenantID(ctx)
	normalizedIDs := make([]string, 0, len(ids))
	roles := make([]Role, 0, len(ids))
	seen := make(map[string]struct{}, len(ids))

	for _, id := range ids {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}

		role, err := s.dao.GetByID(ctx, id)
		if err != nil {
			return err
		}
		if tenantID != "" && role.TenantID != tenantID {
			return fmt.Errorf("role not found in current tenant")
		}
		if role.Type == "system" || role.IsSystem {
			return fmt.Errorf("system role %q cannot be deleted", role.Name)
		}
		if inUse, _ := s.userValidator.CheckRoleInUse(ctx, id); inUse {
			return fmt.Errorf("role %q is in use by users", role.Name)
		}

		normalizedIDs = append(normalizedIDs, id)
		roles = append(roles, role)
	}

	if len(normalizedIDs) == 0 {
		return nil
	}

	err := s.txManager.Transaction(ctx, func(tx *gorm.DB) error {
		txDAO := s.dao.WithTx(tx).(RoleDAO)
		txCtx := context.WithValue(ctx, "tx_db", tx)
		for _, role := range roles {
			if err := txDAO.ClearPermissions(txCtx, role.ID.String()); err != nil {
				return err
			}
			if err := txDAO.ClearMenus(txCtx, role.ID.String()); err != nil {
				return err
			}
			if s.authProvider != nil {
				if err := s.authProvider.RemoveRole(txCtx, role.ID.String()); err != nil {
					return err
				}
			}
			if err := txDAO.Delete(txCtx, role.ID.String()); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return err
	}

	if tenantID != "" && s.quotaValidator != nil {
		_ = s.quotaValidator.DecreaseUsage(ctx, tenantID, "roles", int64(len(roles)), "system")
	}

	roleNames := make([]string, 0, len(roles))
	for _, role := range roles {
		roleNames = append(roleNames, role.Name)
	}
	setOperationAuditFields(ctx, audit.OperationFields{
		Module:   "system/roles",
		Resource: "role_batch_delete",
		Summary:  fmt.Sprintf("Batch deleted %d roles", len(roles)),
		Detail:   "deleted_roles=" + strings.Join(roleNames, ","),
	})

	return nil
}

func (s *roleService) BatchUpdateStatus(ctx context.Context, req *RoleStatusRequest) error {
	tenantID := getTenantID(ctx)
	roles := make([]Role, 0, len(req.RoleIDs))
	seen := make(map[string]struct{}, len(req.RoleIDs))

	for _, id := range req.RoleIDs {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}

		role, err := s.dao.GetByID(ctx, id)
		if err != nil {
			return err
		}
		if tenantID != "" && role.TenantID != tenantID {
			return fmt.Errorf("role not found in current tenant")
		}
		if role.Type == "system" || role.IsSystem {
			return fmt.Errorf("system role %q status cannot be changed in batch", role.Name)
		}
		if role.Status == req.Status {
			continue
		}
		roles = append(roles, role)
	}

	if len(roles) == 0 {
		return nil
	}

	for i := range roles {
		role := roles[i]
		role.Status = req.Status
		if err := s.dao.UpdateStatus(ctx, role.ID.String(), req.Status); err != nil {
			return err
		}
		if err := s.handleRoleStatusChange(ctx, role); err != nil {
			return err
		}
	}

	roleNames := make([]string, 0, len(roles))
	for _, role := range roles {
		roleNames = append(roleNames, role.Name)
	}
	setOperationAuditFields(ctx, audit.OperationFields{
		Module:   "system/roles",
		Resource: "role_status_batch",
		Summary:  fmt.Sprintf("Batch updated %d roles to %s", len(roles), req.Status),
		Detail:   "roles=" + strings.Join(roleNames, ",") + ";status=" + req.Status,
	})

	return nil
}

func (s *roleService) List(ctx context.Context, req *RoleListRequest) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if req.Status != "" {
		filters["status"] = req.Status
	}
	if strings.TrimSpace(req.Type) != "" {
		filters["type"] = strings.TrimSpace(req.Type)
	}
	if search := strings.TrimSpace(req.Search); search != "" {
		like := "%" + search + "%"
		filters["(name LIKE ? OR code LIKE ?)"] = []interface{}{like, like}
	}

	roles, total, err := s.dao.List(ctx, req.Page, req.PageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*RoleResponse, len(roles))
	for i, r := range roles {
		userIDs, _ := s.dao.GetUserIDsByRole(ctx, r.ID.String())
		menuIDs, _ := s.dao.GetMenuIDs(ctx, r.ID.String())
		resp := ToRoleResponse(&r, nil, menuIDs)
		resp.UserCount = len(userIDs)
		items[i] = resp
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
		txCtx := context.WithValue(ctx, "tx_db", tx)
		if err := txDAO.ClearPermissions(txCtx, req.RoleID); err != nil {
			return err
		}
		for _, pid := range req.PermissionIDs {
			if err := txDAO.AddPermission(txCtx, req.RoleID, pid); err != nil {
				return err
			}
		}
		if s.authProvider != nil {
			if role.Status == "active" {
				return s.authProvider.UpdateRolePermissions(txCtx, role.ID.String(), rules)
			}
			return s.authProvider.UpdateRolePermissions(txCtx, role.ID.String(), nil)
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
	for _, key := range []string{"status", "data_scope", "permission_count", "menu_count", "affected_users", "session_strategy", "refresh_strategy"} {
		if value := strings.TrimSpace(attributes[key]); value != "" {
			items = append(items, key+"="+value)
		}
	}
	return strings.Join(items, "; ")
}

func normalizeRoleDataScope(value, fallback string) string {
	value = strings.TrimSpace(value)
	if isSupportedRoleDataScopeValue(value) {
		return value
	}
	fallback = strings.TrimSpace(fallback)
	if isSupportedRoleDataScopeValue(fallback) {
		return fallback
	}
	return "all"
}

func (s *roleService) validateRoleDataScope(value string) error {
	value = strings.TrimSpace(value)
	if value == "" || isBasicRoleDataScope(value) {
		return nil
	}

	if s == nil || s.authProvider == nil {
		return fmt.Errorf("%w: %s", errInvalidRoleDataScope, value)
	}

	ok, err := s.authProvider.ValidateDataScope(value)
	if err != nil {
		return fmt.Errorf("%w: %v", errInvalidRoleDataScope, err)
	}
	if !ok {
		return fmt.Errorf("%w: %s", errInvalidRoleDataScope, value)
	}
	return nil
}

func isSupportedRoleDataScopeValue(value string) bool {
	value = strings.TrimSpace(value)
	return isBasicRoleDataScope(value) || isCustomRoleDataScope(value)
}

func isBasicRoleDataScope(value string) bool {
	switch strings.TrimSpace(value) {
	case "all", "custom", "dept", "dept_and_sub", "self":
		return true
	default:
		return false
	}
}

func isCustomRoleDataScope(value string) bool {
	value = strings.TrimSpace(value)
	return strings.HasPrefix(value, "dept:") ||
		strings.HasPrefix(value, "dept_and_sub:") ||
		strings.HasPrefix(value, "project:") ||
		strings.HasPrefix(value, "custom:")
}

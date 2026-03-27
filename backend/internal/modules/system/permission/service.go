package permission

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"pantheon-platform/backend/internal/modules/system/role"
	"pantheon-platform/backend/internal/shared/audit"
	"pantheon-platform/backend/internal/shared/database"
)

type AuthorizationProvider interface {
	UpdateRolePermissions(ctx context.Context, roleID string, rules []role.PermissionRule) error
	BumpRoleUsersAuthVersion(ctx context.Context, roleID string) error
}

// ========== Service Interface ==========

type PermissionService interface {
	Create(ctx context.Context, req *PermissionRequest) (*Permission, error)
	GetByID(ctx context.Context, id string) (*PermissionResponse, error)
	Update(ctx context.Context, id string, req *PermissionRequest) (*Permission, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, req *RoleListRequest) (*PageResponse, error)

	GetCodesByIDs(ctx context.Context, ids []string) ([]string, error)
}

// ========== Temporary Compatibility Types ==========
type RoleListRequest struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Search   string `form:"search"`
}

// ========== Service Implementation ==========

type permissionService struct {
	dao          PermissionDAO
	authProvider AuthorizationProvider
	txManager    database.TransactionManager
}

func NewPermissionService(dao PermissionDAO, authProvider AuthorizationProvider, txManager database.TransactionManager) PermissionService {
	return &permissionService{
		dao:          dao,
		authProvider: authProvider,
		txManager:    txManager,
	}
}

func (s *permissionService) Create(ctx context.Context, req *PermissionRequest) (*Permission, error) {
	if existing, _ := s.dao.GetByCode(ctx, req.Code); existing != nil {
		return nil, fmt.Errorf("permission code exists")
	}

	perm := &Permission{
		ID:          uuid.New(),
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Type:        req.Type,
		Resource:    req.Resource,
		Action:      req.Action,
		Status:      req.Status,
		TenantID:    getTenantID(ctx),
	}

	err := s.dao.Create(ctx, *perm)
	return perm, err
}

func (s *permissionService) GetByID(ctx context.Context, id string) (*PermissionResponse, error) {
	perm, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToPermissionResponse(&perm), nil
}

func (s *permissionService) Update(ctx context.Context, id string, req *PermissionRequest) (*Permission, error) {
	perm, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	perm.Name = req.Name
	perm.Description = req.Description
	perm.Resource = req.Resource
	perm.Action = req.Action
	perm.Status = req.Status

	if err := s.dao.Update(ctx, perm); err != nil {
		return nil, err
	}
	affectedRoles, affectedUsers, err := s.syncAffectedRolePermissions(ctx, id)
	if err != nil {
		return nil, err
	}
	setPermissionAuditFields(ctx, audit.OperationFields{
		Module:       "system/permissions",
		Resource:     "permission",
		ResourceID:   perm.ID.String(),
		ResourceName: perm.Name,
		Summary:      fmt.Sprintf("Updated permission %q and refreshed authorization for %d roles and %d users", perm.Name, affectedRoles, affectedUsers),
		Detail:       buildPermissionAuditDetail(perm.ID.String(), perm.Name, map[string]string{"affected_roles": fmt.Sprintf("%d", affectedRoles), "affected_users": fmt.Sprintf("%d", affectedUsers), "status": perm.Status}),
	})
	return &perm, nil
}

func (s *permissionService) Delete(ctx context.Context, id string) error {
	// Load the permission before validating tenant ownership.
	perm, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if inUse, _ := s.dao.IsInUse(ctx, id); inUse {
		return fmt.Errorf("permission is in use by roles")
	}

	// Ensure the permission belongs to the current tenant.
	tenantID := getTenantID(ctx)
	if perm.TenantID != tenantID {
		return fmt.Errorf("permission not found in current tenant")
	}

	return s.dao.Delete(ctx, id)
}

func (s *permissionService) List(ctx context.Context, req *RoleListRequest) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if req.Search != "" {
		filters["name LIKE ?"] = "%" + req.Search + "%"
	}

	perms, total, err := s.dao.List(ctx, req.Page, req.PageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*PermissionResponse, len(perms))
	for i, p := range perms {
		items[i] = ToPermissionResponse(&p)
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

func (s *permissionService) GetCodesByIDs(ctx context.Context, ids []string) ([]string, error) {
	return s.dao.GetCodesByIDs(ctx, ids)
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func (s *permissionService) syncAffectedRolePermissions(ctx context.Context, permissionID string) (int, int, error) {
	if s == nil || s.dao == nil || s.authProvider == nil || permissionID == "" {
		return 0, 0, nil
	}

	roleIDs, err := s.dao.GetRoleIDsByPermission(ctx, permissionID)
	if err != nil {
		return 0, 0, err
	}
	if len(roleIDs) == 0 {
		return 0, 0, nil
	}

	userIDs, err := s.dao.GetUserIDsByRoleIDs(ctx, roleIDs)
	if err != nil {
		return 0, 0, err
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

		rules, err := s.dao.GetPermissionRulesByRole(ctx, roleID)
		if err != nil {
			return 0, 0, err
		}
		if err := s.authProvider.UpdateRolePermissions(ctx, roleID, rules); err != nil {
			return 0, 0, err
		}
		if err := s.authProvider.BumpRoleUsersAuthVersion(ctx, roleID); err != nil {
			return 0, 0, err
		}
	}

	return len(seen), len(userIDs), nil
}

func setPermissionAuditFields(ctx context.Context, fields audit.OperationFields) {
	if collector := audit.FromContext(ctx); collector != nil {
		collector.Set(fields)
	}
}

func buildPermissionAuditDetail(permissionID, permissionName string, attributes map[string]string) string {
	items := []string{
		"permission_id=" + permissionID,
		"permission_name=" + permissionName,
	}
	for _, key := range []string{"status", "affected_roles", "affected_users"} {
		if value := strings.TrimSpace(attributes[key]); value != "" {
			items = append(items, key+"="+value)
		}
	}
	return strings.Join(items, "; ")
}

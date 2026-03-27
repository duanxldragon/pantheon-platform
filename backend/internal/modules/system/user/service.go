package user

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"pantheon-platform/backend/internal/shared/audit"
	"pantheon-platform/backend/internal/shared/database"
)

// ========== Dependency Contracts ==========

type RoleValidator interface {
	CheckRoleExists(ctx context.Context, id string) (bool, error)
}

type DeptValidator interface {
	GetDeptName(ctx context.Context, id string) (string, error)
	CheckDeptValid(ctx context.Context, id string) (bool, error)
}

type PositionValidator interface {
	GetPositionName(ctx context.Context, id string) (string, error)
	CheckPositionValid(ctx context.Context, id string) (bool, error)
}

type PasswordValidator interface {
	ValidatePassword(password, username, email string) error
}

type QuotaValidator interface {
	CheckQuota(ctx context.Context, tenantID string, quotaType string) error
	IncreaseUsage(ctx context.Context, tenantID string, quotaType string, amount int64, operator string) error
	DecreaseUsage(ctx context.Context, tenantID string, quotaType string, amount int64, operator string) error
}

type AuthorizationProvider interface {
	SetRolesForUser(ctx context.Context, userID string, roleIDs []string) error
	BumpUserAuthVersion(ctx context.Context, userID string) error
	RevokeUserSessions(ctx context.Context, userID string) error
	GetDataScopeFilter(ctx context.Context, userID, resource string) (map[string]interface{}, error)
	GetFieldPermissions(ctx context.Context, roleID, tableName string) (map[string]string, error)
}

// ========== Service Interface ==========

type UserService interface {
	Create(ctx context.Context, req *UserRequest) (*User, error)
	GetByID(ctx context.Context, id string) (*UserResponse, error)
	Update(ctx context.Context, id string, req *UserUpdateRequest) (*User, error)
	Delete(ctx context.Context, id string) error
	BatchDelete(ctx context.Context, userIDs []string) error
	List(ctx context.Context, req *UserListRequest) (*PageResponse, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	ChangePassword(ctx context.Context, req *PasswordUpdateRequest) error
	ResetPassword(ctx context.Context, userID string, newPassword string) error
	Activate(ctx context.Context, id string) error
	Deactivate(ctx context.Context, id string) error
	BatchUpdateStatus(ctx context.Context, req *UserStatusRequest) error
	AssignRole(ctx context.Context, req *UserRoleRequest) error
	CheckRoleInUse(ctx context.Context, roleID string) (bool, error)
	GetRoles(ctx context.Context, userID string) ([]*UserRoleInfo, error)
}

// ========== Service Implementation ==========

type userService struct {
	userDAO           UserDAO
	roleValidator     RoleValidator
	deptValidator     DeptValidator
	posValidator      PositionValidator
	passwordValidator PasswordValidator
	quotaValidator    QuotaValidator
	authProvider      AuthorizationProvider
	txManager         database.TransactionManager
}

// NewUserService creates a user service instance.
func NewUserService(
	userDAO UserDAO,
	roleValidator RoleValidator,
	deptValidator DeptValidator,
	posValidator PositionValidator,
	passwordValidator PasswordValidator,
	quotaValidator QuotaValidator,
	authProvider AuthorizationProvider,
	txManager database.TransactionManager,
) UserService {
	return &userService{
		userDAO:           userDAO,
		roleValidator:     roleValidator,
		deptValidator:     deptValidator,
		posValidator:      posValidator,
		passwordValidator: passwordValidator,
		quotaValidator:    quotaValidator,
		authProvider:      authProvider,
		txManager:         txManager,
	}
}

func (s *userService) Create(ctx context.Context, req *UserRequest) (*User, error) {
	tenantID := getTenantID(ctx)
	if tenantID != "" && s.quotaValidator != nil {
		if err := s.quotaValidator.CheckQuota(ctx, tenantID, "users"); err != nil {
			return nil, err
		}
	}

	// Validate password strength.
	if s.passwordValidator != nil {
		if err := s.passwordValidator.ValidatePassword(req.Password, req.Username, req.Email); err != nil {
			return nil, err
		}
	}

	if existing, _ := s.userDAO.GetByUsername(ctx, req.Username); existing != nil {
		return nil, fmt.Errorf("user already exists")
	}

	departmentID := normalizeOptionalID(req.DepartmentID)
	positionID := normalizeOptionalID(req.PositionID)
	roleIDs, err := normalizeIDs(req.RoleIDs)
	if err != nil {
		return nil, err
	}
	if err := s.validateAssignments(ctx, departmentID, positionID, roleIDs); err != nil {
		return nil, err
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	user := &User{
		Username:     req.Username,
		RealName:     req.RealName,
		Email:        req.Email,
		Phone:        req.Phone,
		PasswordHash: string(hashedPassword),
		Status:       "active",
		TenantID:     tenantID,
		DepartmentID: departmentID,
		PositionID:   positionID,
	}

	err = s.userDAO.Create(ctx, *user)
	if err != nil {
		return nil, err
	}

	if len(roleIDs) > 0 {
		for _, rid := range roleIDs {
			_ = s.userDAO.AssignRole(ctx, user.ID.String(), rid)
		}
		if s.authProvider != nil {
			_ = s.authProvider.SetRolesForUser(ctx, user.ID.String(), roleIDs)
		}
	}

	assignedRoles, _ := s.userDAO.GetRoles(ctx, user.ID.String())
	setUserAuditFields(ctx, audit.OperationFields{
		Module:       "system/users",
		Resource:     "user",
		ResourceID:   user.ID.String(),
		ResourceName: user.Username,
		Summary:      buildUserCreateAuditSummary(user.Username, assignedRoles),
		Detail:       buildUserAuditDetail(user.Username, user.RealName, nil, assignedRoles, map[string]string{"status": user.Status, "action": "create"}),
	})

	if tenantID != "" && s.quotaValidator != nil {
		_ = s.quotaValidator.IncreaseUsage(ctx, tenantID, "users", 1, "system")
	}

	return user, nil
}

func (s *userService) GetByID(ctx context.Context, id string) (*UserResponse, error) {
	u, err := s.userDAO.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	var deptName *string
	if u.DepartmentID != nil {
		name, _ := s.deptValidator.GetDeptName(ctx, *u.DepartmentID)
		if name != "" {
			deptName = &name
		}
	}

	var posName *string
	if u.PositionID != nil {
		name, _ := s.posValidator.GetPositionName(ctx, *u.PositionID)
		if name != "" {
			posName = &name
		}
	}

	roles, _ := s.userDAO.GetRoles(ctx, id)
	roleIDs := make([]string, 0, len(roles))
	roleNames := make([]string, 0, len(roles))
	for _, r := range roles {
		roleIDs = append(roleIDs, r.ID)
		roleNames = append(roleNames, r.Name)
	}

	// Load field-level permissions for the current operator when available.
	var fieldPerms map[string]string
	currentUserID := getUserID(ctx)
	if currentUserID != "" && s.authProvider != nil {
		opRoles, _ := s.userDAO.GetRoles(ctx, currentUserID)
		if len(opRoles) > 0 {
			// Use the first role as the current field-permission evaluation anchor.
			fieldPerms, _ = s.authProvider.GetFieldPermissions(ctx, opRoles[0].ID, "system_users")
		}
	}

	return ToUserResponse(&u, deptName, posName, roleIDs, roleNames, fieldPerms), nil
}

func (s *userService) Update(ctx context.Context, id string, req *UserUpdateRequest) (*User, error) {
	u, err := s.userDAO.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.ensureUserInTenant(ctx, &u); err != nil {
		return nil, err
	}
	beforeRoles, _ := s.userDAO.GetRoles(ctx, id)
	previousStatus := u.Status
	beforeDepartmentName := s.getDepartmentName(ctx, u.DepartmentID)
	beforePositionName := s.getPositionName(ctx, u.PositionID)

	departmentID := normalizeOptionalID(req.DepartmentID)
	positionID := normalizeOptionalID(req.PositionID)
	roleIDs := req.RoleIDs
	if req.RoleIDs != nil {
		roleIDs, err = normalizeIDs(req.RoleIDs)
		if err != nil {
			return nil, err
		}
	}
	if err := s.validateAssignments(ctx, departmentID, positionID, roleIDs); err != nil {
		return nil, err
	}

	if req.RealName != nil {
		u.RealName = *req.RealName
	}
	if req.Email != nil {
		u.Email = *req.Email
	}
	if req.Phone != nil {
		u.Phone = *req.Phone
	}
	if req.Avatar != nil {
		u.Avatar = req.Avatar
	}
	if req.Status != nil {
		u.Status = *req.Status
	}
	if req.DepartmentID != nil {
		u.DepartmentID = departmentID
	}
	if req.PositionID != nil {
		u.PositionID = positionID
	}

	err = s.userDAO.Update(ctx, u)
	if err != nil {
		return nil, err
	}

	if req.RoleIDs != nil {
		_ = s.userDAO.ClearRoles(ctx, id)
		for _, rid := range roleIDs {
			_ = s.userDAO.AssignRole(ctx, id, rid)
		}
		if s.authProvider != nil {
			_ = s.authProvider.SetRolesForUser(ctx, id, roleIDs)
			_ = s.authProvider.BumpUserAuthVersion(ctx, id)
		}
	}
	if req.Status != nil && *req.Status != "active" && s.authProvider != nil {
		_ = s.authProvider.RevokeUserSessions(ctx, id)
	}
	afterRoles, _ := s.userDAO.GetRoles(ctx, id)
	afterDepartmentName := s.getDepartmentName(ctx, u.DepartmentID)
	afterPositionName := s.getPositionName(ctx, u.PositionID)
	resource := "user"
	if diff := diffRoleSets(beforeRoles, afterRoles); len(diff.Added) > 0 || len(diff.Removed) > 0 {
		resource = "user_role"
	}
	attrs := buildUserUpdateAttributes(previousStatus, req.Status, req.DepartmentID, req.PositionID, beforeDepartmentName, afterDepartmentName, beforePositionName, afterPositionName)
	if beforeDepartmentName != afterDepartmentName && strings.TrimSpace(afterDepartmentName) != "" {
		attrs["department_name"] = afterDepartmentName
	}
	if beforePositionName != afterPositionName && strings.TrimSpace(afterPositionName) != "" {
		attrs["position_name"] = afterPositionName
	}
	setUserAuditFields(ctx, audit.OperationFields{
		Module:       "system/users",
		Resource:     resource,
		ResourceID:   u.ID.String(),
		ResourceName: u.Username,
		Summary:      buildUserUpdateAuditSummary(u.Username, previousStatus, req.Status, beforeRoles, afterRoles, beforeDepartmentName, afterDepartmentName, beforePositionName, afterPositionName),
		Detail: buildUserAuditDetail(
			u.Username,
			u.RealName,
			beforeRoles,
			afterRoles,
			attrs,
		),
	})

	return &u, nil
}

func (s *userService) Delete(ctx context.Context, id string) error {
	user, err := s.userDAO.GetByID(ctx, id)
	if err != nil {
		return err
	}

	tenantID := getTenantID(ctx)
	if user.TenantID != tenantID {
		return fmt.Errorf("user not found in current tenant")
	}

	err = s.userDAO.SoftDelete(ctx, id)
	if err == nil && tenantID != "" && s.quotaValidator != nil {
		_ = s.quotaValidator.DecreaseUsage(ctx, tenantID, "users", 1, "system")
	}
	if err == nil && s.authProvider != nil {
		_ = s.authProvider.RevokeUserSessions(ctx, id)
	}
	if err == nil {
		setUserAuditFields(ctx, audit.OperationFields{
			Module:       "system/users",
			Resource:     "user",
			ResourceID:   user.ID.String(),
			ResourceName: user.Username,
			Summary:      fmt.Sprintf("\u5220\u9664\u7528\u6237\u300c%s\u300d\u5e76\u5f3a\u5236\u5176\u4f1a\u8bdd\u5931\u6548", user.Username),
			Detail:       buildUserAuditDetail(user.Username, user.RealName, nil, nil, map[string]string{"action": "delete", "status": user.Status, "session_strategy": "revoke"}),
		})
	}
	return err
}

func (s *userService) BatchDelete(ctx context.Context, userIDs []string) error {
	tenantID := getTenantID(ctx)
	deletedUsers := make([]string, 0, len(userIDs))
	for _, id := range userIDs {
		user, err := s.userDAO.GetByID(ctx, id)
		if err != nil || user.TenantID != tenantID {
			continue
		}
		if err := s.userDAO.SoftDelete(ctx, id); err != nil {
			continue
		}
		if s.authProvider != nil {
			_ = s.authProvider.RevokeUserSessions(ctx, id)
		}
		if tenantID != "" && s.quotaValidator != nil {
			_ = s.quotaValidator.DecreaseUsage(ctx, tenantID, "users", 1, "system")
		}
		deletedUsers = append(deletedUsers, user.Username)
	}
	setUserAuditFields(ctx, audit.OperationFields{
		Module:   "system/users",
		Resource: "user_batch_delete",
		Summary:  fmt.Sprintf("\u6279\u91cf\u5220\u9664 %d \u4e2a\u7528\u6237\u5e76\u5f3a\u5236\u5931\u6548\u4f1a\u8bdd", len(deletedUsers)),
		Detail:   "\u5220\u9664\u7528\u6237=" + strings.Join(deletedUsers, "\u3001"),
	})
	return nil
}

func (s *userService) List(ctx context.Context, req *UserListRequest) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if req.Status != "" {
		filters["status"] = req.Status
	}

	// Merge data-scope constraints into list filters when authorization is enabled.
	userID := getUserID(ctx)
	if userID != "" && s.authProvider != nil {
		scopeFilter, err := s.authProvider.GetDataScopeFilter(ctx, userID, "/api/v1/system/users")
		if err == nil && scopeFilter != nil {
			for k, v := range scopeFilter {
				filters[k] = v
			}
		}
	}

	users, total, err := s.userDAO.List(ctx, req.Page, req.PageSize, filters)
	if err != nil {
		return nil, err
	}

	// Load field-level permissions for list response shaping when available.
	var fieldPerms map[string]string
	if userID != "" && s.authProvider != nil {
		opRoles, _ := s.userDAO.GetRoles(ctx, userID)
		if len(opRoles) > 0 {
			fieldPerms, _ = s.authProvider.GetFieldPermissions(ctx, opRoles[0].ID, "system_users")
		}
	}

	items := make([]*UserResponse, len(users))
	for i, u := range users {
		roles, _ := s.userDAO.GetRoles(ctx, u.ID.String())
		roleIDs := make([]string, 0, len(roles))
		roleNames := make([]string, 0, len(roles))
		for _, r := range roles {
			roleIDs = append(roleIDs, r.ID)
			roleNames = append(roleNames, r.Name)
		}
		userRecord := u
		items[i] = ToUserResponse(&userRecord, nil, nil, roleIDs, roleNames, fieldPerms)
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

func (s *userService) GetByUsername(ctx context.Context, username string) (*User, error) {
	return s.userDAO.GetByUsername(ctx, username)
}

func (s *userService) ChangePassword(ctx context.Context, req *PasswordUpdateRequest) error {
	u, err := s.userDAO.GetByID(ctx, req.UserID)
	if err != nil {
		return err
	}

	if s.passwordValidator != nil {
		if err := s.passwordValidator.ValidatePassword(req.NewPassword, u.Username, u.Email); err != nil {
			return err
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return fmt.Errorf("invalid password")
	}
	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	u.PasswordHash = string(hashed)
	if err := s.userDAO.Update(ctx, u); err != nil {
		return err
	}
	if s.authProvider != nil {
		_ = s.authProvider.RevokeUserSessions(ctx, req.UserID)
	}
	return nil
}

func (s *userService) ResetPassword(ctx context.Context, userID string, newPassword string) error {
	u, err := s.userDAO.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if err := s.ensureUserInTenant(ctx, &u); err != nil {
		return err
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashed)
	if err := s.userDAO.Update(ctx, u); err != nil {
		return err
	}
	if s.authProvider != nil {
		_ = s.authProvider.RevokeUserSessions(ctx, userID)
	}
	setUserAuditFields(ctx, audit.OperationFields{
		Module:     "system/users",
		Resource:   "user_password",
		ResourceID: u.ID.String(),
		Detail:     buildUserAuditDetail(u.Username, u.RealName, nil, nil, map[string]string{"action": "reset_password", "session_strategy": "revoke"}),
	})
	return nil
}

func (s *userService) Activate(ctx context.Context, id string) error {
	u, err := s.userDAO.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.ensureUserInTenant(ctx, &u); err != nil {
		return err
	}
	return s.userDAO.UpdateStatus(ctx, id, "active")
}

func (s *userService) Deactivate(ctx context.Context, id string) error {
	u, err := s.userDAO.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.ensureUserInTenant(ctx, &u); err != nil {
		return err
	}
	if err := s.userDAO.UpdateStatus(ctx, id, "inactive"); err != nil {
		return err
	}
	if s.authProvider != nil {
		_ = s.authProvider.RevokeUserSessions(ctx, id)
	}
	return nil
}

func (s *userService) BatchUpdateStatus(ctx context.Context, req *UserStatusRequest) error {
	tenantID := getTenantID(ctx)
	affectedUsers := make([]string, 0, len(req.UserIDs))
	for _, id := range req.UserIDs {
		user, err := s.userDAO.GetByID(ctx, id)
		if err != nil || user.TenantID != tenantID {
			continue
		}
		_ = s.userDAO.UpdateStatus(ctx, id, req.Status)
		if req.Status != "active" && s.authProvider != nil {
			_ = s.authProvider.RevokeUserSessions(ctx, id)
		}
		affectedUsers = append(affectedUsers, user.Username)
	}
	setUserAuditFields(ctx, audit.OperationFields{
		Module: "system/users",
		Detail: "\u7528\u6237=" + strings.Join(affectedUsers, "\u3001") + "\uff1bstatus=" + req.Status,
	})
	return nil
}

func (s *userService) AssignRole(ctx context.Context, req *UserRoleRequest) error {
	roleIDs, err := normalizeIDs(req.RoleIDs)
	if err != nil {
		return err
	}

	u, err := s.userDAO.GetByID(ctx, req.UserID)
	if err != nil {
		return err
	}
	if err := s.ensureUserInTenant(ctx, &u); err != nil {
		return err
	}
	beforeRoles, _ := s.userDAO.GetRoles(ctx, req.UserID)

	for _, rid := range roleIDs {
		if exists, _ := s.roleValidator.CheckRoleExists(ctx, rid); !exists {
			return fmt.Errorf("invalid role: %s", rid)
		}
	}
	_ = s.userDAO.ClearRoles(ctx, req.UserID)
	for _, rid := range roleIDs {
		_ = s.userDAO.AssignRole(ctx, req.UserID, rid)
	}
	if s.authProvider != nil {
		_ = s.authProvider.SetRolesForUser(ctx, req.UserID, roleIDs)
		_ = s.authProvider.BumpUserAuthVersion(ctx, req.UserID)
	}
	afterRoles, _ := s.userDAO.GetRoles(ctx, req.UserID)
	setUserAuditFields(ctx, audit.OperationFields{
		Module:       "system/users",
		Resource:     "user_role",
		ResourceID:   u.ID.String(),
		ResourceName: u.Username,
		Summary:      buildUserRoleAuditSummary(u.Username, beforeRoles, afterRoles),
		Detail:       buildUserAuditDetail(u.Username, u.RealName, beforeRoles, afterRoles, map[string]string{"action": "assign_role", "refresh_strategy": "bump_auth_version"}),
	})
	return nil
}

func (s *userService) CheckRoleInUse(ctx context.Context, roleID string) (bool, error) {
	return s.userDAO.CheckRoleInUse(ctx, roleID)
}

func (s *userService) GetRoles(ctx context.Context, userID string) ([]*UserRoleInfo, error) {
	return s.userDAO.GetRoles(ctx, userID)
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func getUserID(ctx context.Context) string {
	if uid, ok := ctx.Value("user_id").(string); ok {
		return uid
	}
	return ""
}

func (s *userService) ensureUserInTenant(ctx context.Context, user *User) error {
	if user == nil {
		return fmt.Errorf("user not found")
	}
	tenantID := getTenantID(ctx)
	if tenantID != "" && user.TenantID != tenantID {
		return fmt.Errorf("user not found in current tenant")
	}
	return nil
}

func (s *userService) validateAssignments(ctx context.Context, departmentID, positionID *string, roleIDs []string) error {
	if departmentID != nil {
		if valid, _ := s.deptValidator.CheckDeptValid(ctx, *departmentID); !valid {
			return fmt.Errorf("invalid department")
		}
	}
	if positionID != nil {
		if valid, _ := s.posValidator.CheckPositionValid(ctx, *positionID); !valid {
			return fmt.Errorf("invalid position")
		}
	}
	for _, roleID := range roleIDs {
		if exists, _ := s.roleValidator.CheckRoleExists(ctx, roleID); !exists {
			return fmt.Errorf("invalid role: %s", roleID)
		}
	}
	return nil
}

func normalizeOptionalID(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func normalizeIDs(values []string) ([]string, error) {
	if values == nil {
		return nil, nil
	}
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			return nil, fmt.Errorf("invalid empty id")
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}
	return result, nil
}

func setUserAuditFields(ctx context.Context, fields audit.OperationFields) {
	if collector := audit.FromContext(ctx); collector != nil {
		collector.Set(fields)
	}
}

func buildUserCreateAuditSummary(username string, assignedRoles []*UserRoleInfo) string {
	if len(assignedRoles) == 0 {
		return fmt.Sprintf("\u521b\u5efa\u7528\u6237\u300c%s\u300d", username)
	}
	return fmt.Sprintf("\u521b\u5efa\u7528\u6237\u300c%s\u300d\u5e76\u5206\u914d %d \u4e2a\u89d2\u8272", username, len(assignedRoles))
}

func buildUserUpdateAuditSummary(
	username,
	previousStatus string,
	nextStatus *string,
	beforeRoles,
	afterRoles []*UserRoleInfo,
	beforeDepartmentName,
	afterDepartmentName,
	beforePositionName,
	afterPositionName string,
) string {
	if diff := diffRoleSets(beforeRoles, afterRoles); len(diff.Added) > 0 || len(diff.Removed) > 0 {
		return buildUserRoleAuditSummary(username, beforeRoles, afterRoles)
	}
	if nextStatus != nil && previousStatus != *nextStatus {
		if *nextStatus == "active" {
			return fmt.Sprintf("\u542f\u7528\u7528\u6237\u300c%s\u300d", username)
		}
		return fmt.Sprintf("\u5c06\u7528\u6237\u300c%s\u300d\u8bbe\u7f6e\u4e3a%s\u5e76\u5f3a\u5236\u5176\u4f1a\u8bdd\u5931\u6548", username, userStatusText(*nextStatus))
	}
	if beforeDepartmentName != afterDepartmentName || beforePositionName != afterPositionName {
		return buildUserOrgAuditSummary(username, beforeDepartmentName, afterDepartmentName, beforePositionName, afterPositionName)
	}
	return fmt.Sprintf("\u66f4\u65b0\u7528\u6237\u300c%s\u300d\u57fa\u7840\u4fe1\u606f", username)
}

type roleDiff struct {
	Added   []string
	Removed []string
	Current []string
}

func buildUserRoleAuditSummary(username string, beforeRoles, afterRoles []*UserRoleInfo) string {
	diff := diffRoleSets(beforeRoles, afterRoles)
	parts := make([]string, 0, 3)
	if len(diff.Added) > 0 {
		parts = append(parts, fmt.Sprintf("\u65b0\u589e %d \u4e2a\u89d2\u8272", len(diff.Added)))
	}
	if len(diff.Removed) > 0 {
		parts = append(parts, fmt.Sprintf("\u79fb\u9664 %d \u4e2a\u89d2\u8272", len(diff.Removed)))
	}
	if len(parts) == 0 {
		return fmt.Sprintf("\u66f4\u65b0\u7528\u6237\u300c%s\u300d\u89d2\u8272\uff0c\u89d2\u8272\u672a\u53d1\u751f\u53d8\u5316", username)
	}
	return fmt.Sprintf("\u66f4\u65b0\u7528\u6237\u300c%s\u300d\u89d2\u8272\uff1a%s\uff0c\u5f53\u524d\u5171 %d \u4e2a\u89d2\u8272", username, strings.Join(parts, "\uff0c"), len(diff.Current))
}

func buildUserAuditDetail(username, realName string, beforeRoles, afterRoles []*UserRoleInfo, attrs map[string]string) string {
	parts := []string{"\u7528\u6237\u540d=" + username}
	if strings.TrimSpace(realName) != "" {
		parts = append(parts, "\u59d3\u540d="+realName)
	}

	if beforeRoles != nil || afterRoles != nil {
		diff := diffRoleSets(beforeRoles, afterRoles)
		if len(diff.Added) > 0 {
			parts = append(parts, "\u65b0\u589e\u89d2\u8272="+strings.Join(diff.Added, "\u3001"))
		}
		if len(diff.Removed) > 0 {
			parts = append(parts, "\u79fb\u9664\u89d2\u8272="+strings.Join(diff.Removed, "\u3001"))
		}
		if len(diff.Current) > 0 {
			parts = append(parts, "\u5f53\u524d\u89d2\u8272="+strings.Join(diff.Current, "\u3001"))
		}
	}

	for _, key := range []string{"action", "status", "department_id", "position_id", "session_strategy", "refresh_strategy"} {
		if value := strings.TrimSpace(attrs[key]); value != "" {
			parts = append(parts, key+"="+value)
		}
	}

	for _, pair := range [][2]string{
		{"before_department", "\u539f\u90e8\u95e8"},
		{"after_department", "\u65b0\u90e8\u95e8"},
		{"before_position", "\u539f\u5c97\u4f4d"},
		{"after_position", "\u65b0\u5c97\u4f4d"},
	} {
		if value := strings.TrimSpace(attrs[pair[0]]); value != "" {
			parts = append(parts, pair[1]+"="+value)
		}
	}

	return strings.Join(parts, "\uff1b")
}

func buildUserUpdateAttributes(
	previousStatus string,
	nextStatus *string,
	departmentID, positionID *string,
	beforeDepartmentName, afterDepartmentName, beforePositionName, afterPositionName string,
) map[string]string {
	attrs := map[string]string{}
	if nextStatus != nil && previousStatus != *nextStatus {
		attrs["status"] = *nextStatus
		if *nextStatus != "active" {
			attrs["session_strategy"] = "revoke"
		}
	}
	if departmentID != nil {
		attrs["department_id"] = strings.TrimSpace(*departmentID)
	}
	if positionID != nil {
		attrs["position_id"] = strings.TrimSpace(*positionID)
	}
	if beforeDepartmentName != afterDepartmentName {
		attrs["before_department"] = beforeDepartmentName
		attrs["after_department"] = afterDepartmentName
	}
	if beforePositionName != afterPositionName {
		attrs["before_position"] = beforePositionName
		attrs["after_position"] = afterPositionName
	}
	return attrs
}

func diffRoleSets(beforeRoles, afterRoles []*UserRoleInfo) roleDiff {
	before := make(map[string]string, len(beforeRoles))
	for _, role := range beforeRoles {
		if role == nil || role.ID == "" {
			continue
		}
		before[role.ID] = role.Name
	}

	after := make(map[string]string, len(afterRoles))
	for _, role := range afterRoles {
		if role == nil || role.ID == "" {
			continue
		}
		after[role.ID] = role.Name
	}

	diff := roleDiff{}
	for id, name := range after {
		if _, ok := before[id]; !ok {
			diff.Added = append(diff.Added, firstNonEmptyString(name, id))
		}
		diff.Current = append(diff.Current, firstNonEmptyString(name, id))
	}
	for id, name := range before {
		if _, ok := after[id]; !ok {
			diff.Removed = append(diff.Removed, firstNonEmptyString(name, id))
		}
	}

	sort.Strings(diff.Added)
	sort.Strings(diff.Removed)
	sort.Strings(diff.Current)
	return diff
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func userStatusText(status string) string {
	switch status {
	case "active":
		return "\u542f\u7528"
	case "inactive":
		return "\u505c\u7528"
	case "locked":
		return "\u9501\u5b9a"
	default:
		return status
	}
}

func buildUserOrgAuditSummary(username, beforeDepartmentName, afterDepartmentName, beforePositionName, afterPositionName string) string {
	parts := make([]string, 0, 2)
	if beforeDepartmentName != afterDepartmentName {
		switch {
		case beforeDepartmentName == "" && afterDepartmentName != "":
			parts = append(parts, fmt.Sprintf("\u52a0\u5165\u90e8\u95e8\u300c%s\u300d", afterDepartmentName))
		case beforeDepartmentName != "" && afterDepartmentName == "":
			parts = append(parts, fmt.Sprintf("\u79fb\u51fa\u90e8\u95e8\u300c%s\u300d", beforeDepartmentName))
		default:
			parts = append(parts, fmt.Sprintf("\u90e8\u95e8\u7531\u300c%s\u300d\u8c03\u6574\u4e3a\u300c%s\u300d", beforeDepartmentName, afterDepartmentName))
		}
	}
	if beforePositionName != afterPositionName {
		switch {
		case beforePositionName == "" && afterPositionName != "":
			parts = append(parts, fmt.Sprintf("\u52a0\u5165\u5c97\u4f4d\u300c%s\u300d", afterPositionName))
		case beforePositionName != "" && afterPositionName == "":
			parts = append(parts, fmt.Sprintf("\u79fb\u51fa\u5c97\u4f4d\u300c%s\u300d", beforePositionName))
		default:
			parts = append(parts, fmt.Sprintf("\u5c97\u4f4d\u7531\u300c%s\u300d\u8c03\u6574\u4e3a\u300c%s\u300d", beforePositionName, afterPositionName))
		}
	}
	if len(parts) == 0 {
		return fmt.Sprintf("\u66f4\u65b0\u7528\u6237\u300c%s\u300d\u7ec4\u7ec7\u5f52\u5c5e", username)
	}
	return fmt.Sprintf("\u66f4\u65b0\u7528\u6237\u300c%s\u300d\u7ec4\u7ec7\u5f52\u5c5e\uff1a%s", username, strings.Join(parts, "\uff0c"))
}

func (s *userService) getDepartmentName(ctx context.Context, departmentID *string) string {
	if departmentID == nil || s == nil || s.deptValidator == nil {
		return ""
	}
	name, _ := s.deptValidator.GetDeptName(ctx, strings.TrimSpace(*departmentID))
	return strings.TrimSpace(name)
}

func (s *userService) getPositionName(ctx context.Context, positionID *string) string {
	if positionID == nil || s == nil || s.posValidator == nil {
		return ""
	}
	name, _ := s.posValidator.GetPositionName(ctx, strings.TrimSpace(*positionID))
	return strings.TrimSpace(name)
}

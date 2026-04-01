package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"sort"
	"strings"
	"sync"
	"time"

	"pantheon-platform/backend/internal/modules/system/model"
	"pantheon-platform/backend/internal/shared/cache"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"gorm.io/gorm"
)

type DataScope string

const (
	DataScopeAll        DataScope = "all"
	DataScopeCustom     DataScope = "custom"
	DataScopeDept       DataScope = "dept"
	DataScopeDeptAndSub DataScope = "dept_and_sub"
	DataScopeSelf       DataScope = "self"
)

const (
	FieldPermissionRead  = "read"
	FieldPermissionWrite = "write"
	FieldPermissionHide  = "hide"
)

const (
	ctxKeyTxDB     = "tx_db"
	ctxKeyTenantDB = "tenant_db"
	ctxKeyTenantID = "tenant_id"
)

var (
	ErrUnauthorized = errors.New("unauthorized")

	customScopePrefixes = []string{"dept:", "dept_and_sub:", "project:", "custom:"}

	allowedCustomScopeFields = map[string]struct{}{
		"id":            {},
		"user_id":       {},
		"creator_id":    {},
		"department_id": {},
		"project_id":    {},
		"tenant_id":     {},
		"receiver_id":   {},
	}
)

const authStateTTL = 8 * 24 * time.Hour

type AuthorizationService struct {
	masterDB        *gorm.DB
	masterEnforcer  *casbin.Enforcer
	tenantEnforcers map[string]tenantEnforcerEntry
	modelPath       string
	redisClient     *cache.RedisClient
	mu              sync.RWMutex
}

type tenantEnforcerEntry struct {
	db       *gorm.DB
	enforcer *casbin.Enforcer
}

func NewAuthorizationService(db *gorm.DB, modelPath string) (*AuthorizationService, error) {
	adapter, err := gormadapter.NewAdapterByDB(db)
	if err != nil {
		return nil, fmt.Errorf("failed to create casbin adapter: %w", err)
	}

	enforcer, err := casbin.NewEnforcer(modelPath, adapter)
	if err != nil {
		return nil, fmt.Errorf("failed to create casbin enforcer: %w", err)
	}
	enforcer.EnableAutoSave(true)

	return &AuthorizationService{
		masterDB:        db,
		masterEnforcer:  enforcer,
		tenantEnforcers: make(map[string]tenantEnforcerEntry),
		modelPath:       modelPath,
	}, nil
}

func (s *AuthorizationService) SetRedisClient(redisClient *cache.RedisClient) {
	if s == nil {
		return
	}
	s.redisClient = redisClient
}

func (s *AuthorizationService) getEnforcer(ctx context.Context) (*casbin.Enforcer, error) {
	if s == nil {
		return nil, fmt.Errorf("authorization service is nil")
	}

	if txDB := txDBFromContext(ctx); txDB != nil {
		adapter, err := gormadapter.NewAdapterByDB(txDB)
		if err != nil {
			return nil, fmt.Errorf("failed to create transaction casbin adapter: %w", err)
		}
		enforcer, err := casbin.NewEnforcer(s.modelPath, adapter)
		if err != nil {
			return nil, fmt.Errorf("failed to create transaction casbin enforcer: %w", err)
		}
		enforcer.EnableAutoSave(true)
		return enforcer, nil
	}

	tenantDB, tenantID := tenantDBAndIDFromContext(ctx)
	if tenantDB == nil || tenantID == "" {
		return s.masterEnforcer, nil
	}

	adapter, err := gormadapter.NewAdapterByDB(tenantDB)
	if err != nil {
		return nil, fmt.Errorf("failed to create tenant casbin adapter: %w", err)
	}

	enforcer, err := casbin.NewEnforcer(s.modelPath, adapter)
	if err != nil {
		return nil, fmt.Errorf("failed to create tenant casbin enforcer: %w", err)
	}
	enforcer.EnableAutoSave(true)
	return enforcer, nil
}

func (s *AuthorizationService) CheckPermission(ctx context.Context, userID, resource, action string) bool {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return false
	}

	allowed, err := e.Enforce(userID, resource, action)
	if err != nil {
		return false
	}
	return allowed
}

func (s *AuthorizationService) CheckPermissionWithDomain(ctx context.Context, userID, domain, resource, action string) bool {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return false
	}

	allowed, err := e.Enforce(userID, domain, resource, action)
	if err != nil {
		return false
	}
	return allowed
}

func (s *AuthorizationService) GetUserPermissions(ctx context.Context, userID string) ([]string, error) {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return nil, err
	}

	permissionSet := make(map[string]struct{})

	roles, err := e.GetRolesForUser(userID)
	if err != nil {
		return nil, err
	}

	for _, roleID := range roles {
		policies, err := e.GetFilteredPolicy(0, roleID)
		if err != nil {
			log.Printf("warning: failed to load policy for role %s: %v", roleID, err)
			continue
		}
		for permission := range toPermissionSet(policies) {
			permissionSet[permission] = struct{}{}
		}
	}

	directPolicies, err := e.GetFilteredPolicy(0, userID)
	if err != nil {
		log.Printf("warning: failed to load direct policy for user %s: %v", userID, err)
	} else {
		for permission := range toPermissionSet(directPolicies) {
			permissionSet[permission] = struct{}{}
		}
	}

	permissions := make([]string, 0, len(permissionSet))
	for permission := range permissionSet {
		permissions = append(permissions, permission)
	}
	sort.Strings(permissions)

	return permissions, nil
}

func (s *AuthorizationService) AddPermissionForRole(ctx context.Context, roleID, resource, action string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.AddPolicy(roleID, resource, action)
	return err
}

func (s *AuthorizationService) RemovePermissionForRole(ctx context.Context, roleID, resource, action string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.RemovePolicy(roleID, resource, action)
	return err
}

func (s *AuthorizationService) AddPermissionsForRole(ctx context.Context, roleID string, permissions []struct {
	Resource string
	Action   string
}) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	rules := make([][]string, 0, len(permissions))
	for _, permission := range permissions {
		rules = append(rules, []string{roleID, permission.Resource, permission.Action})
	}

	_, err = e.AddPolicies(rules)
	return err
}

func (s *AuthorizationService) RemovePermissionsForRole(ctx context.Context, roleID string, permissions []struct {
	Resource string
	Action   string
}) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	rules := make([][]string, 0, len(permissions))
	for _, permission := range permissions {
		rules = append(rules, []string{roleID, permission.Resource, permission.Action})
	}

	_, err = e.RemovePolicies(rules)
	return err
}

func (s *AuthorizationService) ClearPermissionsForRole(ctx context.Context, roleID string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.DeletePermissionsForUser(roleID)
	return err
}

func (s *AuthorizationService) AddRoleForUser(ctx context.Context, userID, roleID string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.AddRoleForUser(userID, roleID)
	return err
}

func (s *AuthorizationService) DeleteRoleForUser(ctx context.Context, userID, roleID string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.DeleteRoleForUser(userID, roleID)
	return err
}

func (s *AuthorizationService) DeleteRolesForUser(ctx context.Context, userID string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.DeleteRolesForUser(userID)
	return err
}

func (s *AuthorizationService) GetRolesForUser(ctx context.Context, userID string) ([]string, error) {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return nil, err
	}

	return e.GetRolesForUser(userID)
}

func (s *AuthorizationService) SetRolesForUser(ctx context.Context, userID string, roleIDs []string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	if _, err := e.DeleteRolesForUser(userID); err != nil {
		return err
	}

	for _, roleID := range roleIDs {
		if _, err := e.AddRoleForUser(userID, roleID); err != nil {
			return err
		}
	}

	return nil
}

func (s *AuthorizationService) GetUsersForRole(ctx context.Context, roleID string) ([]string, error) {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return nil, err
	}

	return e.GetUsersForRole(roleID)
}

func (s *AuthorizationService) BumpUserAuthVersion(ctx context.Context, userID string) error {
	if s == nil || s.redisClient == nil || userID == "" {
		return nil
	}

	if _, err := s.redisClient.Incr(ctx, s.authVersionKey(userID)); err != nil {
		return err
	}
	_ = s.redisClient.Expire(ctx, s.authVersionKey(userID), authStateTTL)
	return nil
}

func (s *AuthorizationService) BumpUsersAuthVersion(ctx context.Context, userIDs []string) error {
	if s == nil || s.redisClient == nil || len(userIDs) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(userIDs))
	for _, userID := range userIDs {
		if userID == "" {
			continue
		}
		if _, ok := seen[userID]; ok {
			continue
		}
		seen[userID] = struct{}{}
		if err := s.BumpUserAuthVersion(ctx, userID); err != nil {
			return err
		}
	}

	return nil
}

func (s *AuthorizationService) BumpRoleUsersAuthVersion(ctx context.Context, roleID string) error {
	if s == nil || roleID == "" {
		return nil
	}

	userIDs, err := s.GetUsersForRole(ctx, roleID)
	if err != nil {
		return err
	}

	return s.BumpUsersAuthVersion(ctx, userIDs)
}

func (s *AuthorizationService) RevokeUserSessions(ctx context.Context, userID string) error {
	if s == nil || s.redisClient == nil || userID == "" {
		return nil
	}

	return s.redisClient.Set(ctx, s.revokedAfterKey(userID), fmt.Sprintf("%d", time.Now().Unix()), authStateTTL)
}

func (s *AuthorizationService) RevokeUsersSessions(ctx context.Context, userIDs []string) error {
	if s == nil || s.redisClient == nil || len(userIDs) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(userIDs))
	for _, userID := range userIDs {
		if userID == "" {
			continue
		}
		if _, ok := seen[userID]; ok {
			continue
		}
		seen[userID] = struct{}{}
		if err := s.RevokeUserSessions(ctx, userID); err != nil {
			return err
		}
	}

	return nil
}

func (s *AuthorizationService) CheckDataScope(ctx context.Context, userID, resource string) (DataScope, error) {
	maxScope := DataScopeSelf
	if userID == "" {
		return maxScope, ErrUnauthorized
	}

	scopes, err := s.loadUserRoleDataScopes(ctx, userID)
	if err != nil {
		return maxScope, err
	}

	for _, scope := range scopes {
		normalized := normalizeDataScope(scope)
		if normalized == "" {
			continue
		}
		if s.isDataScopeLarger(normalized, string(maxScope)) {
			maxScope = DataScope(normalized)
		}
	}

	return maxScope, nil
}

func (s *AuthorizationService) isDataScopeLarger(scope1, scope2 string) bool {
	scopeOrder := map[string]int{
		string(DataScopeSelf):       1,
		string(DataScopeDept):       2,
		string(DataScopeDeptAndSub): 3,
		string(DataScopeCustom):     4,
		string(DataScopeAll):        5,
	}

	return scopeOrder[scope1] > scopeOrder[scope2]
}

type DepartmentInfo struct {
	ID       string
	ParentID *string
}

func (s *AuthorizationService) GetUserDepartmentID(ctx context.Context, userID string) (string, error) {
	tenantDB := tenantDBFromContext(ctx)
	if tenantDB == nil {
		return "", fmt.Errorf("tenant db not found in context")
	}

	type userDepartment struct {
		DepartmentID *string
	}

	var row userDepartment
	err := tenantDB.Table("system_users").
		Select("department_id").
		Where("id = ?", userID).
		First(&row).Error
	if err != nil {
		return "", err
	}
	if row.DepartmentID == nil {
		return "", nil
	}

	return *row.DepartmentID, nil
}

func (s *AuthorizationService) GetDepartmentTree(ctx context.Context, deptID string) ([]string, error) {
	tenantDB := tenantDBFromContext(ctx)
	if tenantDB == nil {
		return nil, fmt.Errorf("tenant db not found in context")
	}

	deptIDs := make([]string, 0, 4)
	s.getDepartmentChildrenRecursive(tenantDB, deptID, &deptIDs)
	deptIDs = append(deptIDs, deptID)
	return deptIDs, nil
}

func (s *AuthorizationService) getDepartmentChildrenRecursive(db *gorm.DB, parentID string, deptIDs *[]string) {
	var departments []DepartmentInfo
	if err := db.Table("system_dept").
		Select("id, parent_id").
		Where("parent_id = ? AND status = ?", parentID, "active").
		Find(&departments).Error; err != nil {
		return
	}

	for _, department := range departments {
		*deptIDs = append(*deptIDs, department.ID)
		s.getDepartmentChildrenRecursive(db, department.ID, deptIDs)
	}
}

func (s *AuthorizationService) GetDataScopeFilter(ctx context.Context, userID, resource string) (map[string]interface{}, error) {
	scope, err := s.CheckDataScope(ctx, userID, resource)
	if err != nil {
		return nil, err
	}

	switch scope {
	case DataScopeAll:
		return nil, nil
	case DataScopeSelf:
		return s.selfScopeFilter(resource, userID), nil
	case DataScopeDept:
		deptID, err := s.GetUserDepartmentID(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get user department: %w", err)
		}
		if strings.TrimSpace(deptID) == "" {
			return denyAllScopeFilter(), nil
		}
		return map[string]interface{}{"department_id": deptID}, nil
	case DataScopeDeptAndSub:
		deptID, err := s.GetUserDepartmentID(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get user department: %w", err)
		}
		if strings.TrimSpace(deptID) == "" {
			return denyAllScopeFilter(), nil
		}
		deptIDs, err := s.GetDepartmentTree(ctx, deptID)
		if err != nil {
			return nil, fmt.Errorf("failed to get department tree: %w", err)
		}
		return map[string]interface{}{"department_id": deptIDs}, nil
	case DataScopeCustom:
		tenantDB := tenantDBFromContext(ctx)
		if tenantDB == nil {
			return nil, fmt.Errorf("tenant db not found in context")
		}

		scopes, err := s.loadUserRoleDataScopes(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to load user role data scopes: %w", err)
		}

		for _, roleScope := range scopes {
			roleScope = strings.TrimSpace(roleScope)
			if roleScope == "" || roleScope == string(DataScopeCustom) {
				continue
			}
			if !isCustomScopeRule(roleScope) {
				continue
			}

			filter, parseErr := s.parseCustomDataScope(ctx, roleScope, userID, tenantDB)
			if parseErr != nil {
				log.Printf("warning: failed to parse custom data scope %s: %v", roleScope, parseErr)
				continue
			}
			if filter != nil {
				return filter, nil
			}
		}

		return s.selfScopeFilter(resource, userID), nil
	default:
		return nil, fmt.Errorf("unknown data scope: %s", scope)
	}
}

func (s *AuthorizationService) parseCustomDataScope(ctx context.Context, rule, userID string, db *gorm.DB) (map[string]interface{}, error) {
	rule = strings.TrimSpace(rule)

	switch {
	case strings.HasPrefix(rule, "dept:"):
		return s.parseDepartmentScopeRule(rule[5:], userID, db)
	case strings.HasPrefix(rule, "dept_and_sub:"):
		return s.parseDepartmentAndSubScopeRule(ctx, rule[13:], userID, db)
	case strings.HasPrefix(rule, "project:"):
		return s.parseProjectScopeRule(rule[8:], userID, db)
	case strings.HasPrefix(rule, "custom:"):
		return s.parseCustomExpressionRule(ctx, rule[7:], userID, db)
	default:
		return nil, fmt.Errorf("unsupported custom rule format: %s", rule)
	}
}

func (s *AuthorizationService) parseDepartmentScopeRule(depts, userID string, db *gorm.DB) (map[string]interface{}, error) {
	deptIDs := splitTrimmedUnique(depts)
	if len(deptIDs) == 0 {
		return nil, fmt.Errorf("department scope requires at least one department id")
	}

	validDepts := make([]string, 0, len(deptIDs))
	type deptRow struct {
		ID string
	}

	for _, deptID := range deptIDs {
		var row deptRow
		err := firstMatchingDepartment(db, deptID, &row)
		if err == nil && row.ID != "" {
			validDepts = append(validDepts, deptID)
			continue
		}
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	if len(validDepts) == 0 {
		return denyAllScopeFilter(), nil
	}

	return map[string]interface{}{"department_id": validDepts}, nil
}

func (s *AuthorizationService) parseDepartmentAndSubScopeRule(ctx context.Context, deptID, userID string, db *gorm.DB) (map[string]interface{}, error) {
	deptID = strings.TrimSpace(deptID)
	if deptID == "" {
		return nil, fmt.Errorf("department id is required for dept_and_sub scope")
	}

	ctx = ensureTenantDB(ctx, db)
	deptIDs, err := s.GetDepartmentTree(ctx, deptID)
	if err != nil {
		return nil, err
	}
	if len(deptIDs) == 0 {
		return denyAllScopeFilter(), nil
	}

	return map[string]interface{}{"department_id": deptIDs}, nil
}

func (s *AuthorizationService) parseProjectScopeRule(projectIDs, userID string, db *gorm.DB) (map[string]interface{}, error) {
	ids := splitTrimmedUnique(projectIDs)
	if len(ids) == 0 {
		return nil, fmt.Errorf("project scope requires at least one project id")
	}

	return map[string]interface{}{"project_id": ids}, nil
}

func (s *AuthorizationService) parseCustomExpressionRule(ctx context.Context, expression, userID string, db *gorm.DB) (map[string]interface{}, error) {
	expression = strings.TrimSpace(expression)
	parts := strings.SplitN(expression, "=", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid custom expression, expected field=value")
	}

	field := strings.TrimSpace(parts[0])
	rawValue := strings.TrimSpace(parts[1])
	if _, ok := allowedCustomScopeFields[field]; !ok {
		return nil, fmt.Errorf("unsupported custom scope field: %s", field)
	}
	if rawValue == "" {
		return nil, fmt.Errorf("custom scope value is required")
	}

	ctx = ensureTenantDB(ctx, db)

	switch rawValue {
	case "@user_id":
		if !isUserScopedField(field) {
			return nil, fmt.Errorf("field %s does not support @user_id", field)
		}
		return map[string]interface{}{field: userID}, nil
	case "@department_id":
		if field != "department_id" {
			return nil, fmt.Errorf("field %s does not support @department_id", field)
		}
		deptID, err := s.GetUserDepartmentID(ctx, userID)
		if err != nil {
			return nil, err
		}
		if strings.TrimSpace(deptID) == "" {
			return denyAllScopeFilter(), nil
		}
		return map[string]interface{}{field: deptID}, nil
	case "@department_and_sub_ids":
		if field != "department_id" {
			return nil, fmt.Errorf("field %s does not support @department_and_sub_ids", field)
		}
		deptID, err := s.GetUserDepartmentID(ctx, userID)
		if err != nil {
			return nil, err
		}
		if strings.TrimSpace(deptID) == "" {
			return denyAllScopeFilter(), nil
		}
		deptIDs, err := s.GetDepartmentTree(ctx, deptID)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{field: deptIDs}, nil
	case "@tenant_id":
		if field != "tenant_id" {
			return nil, fmt.Errorf("field %s does not support @tenant_id", field)
		}
		tenantID, _ := ctx.Value(ctxKeyTenantID).(string)
		return map[string]interface{}{field: strings.TrimSpace(tenantID)}, nil
	default:
		values := splitTrimmedUnique(rawValue)
		if len(values) == 0 {
			return nil, fmt.Errorf("custom scope value is required")
		}
		if len(values) == 1 {
			return map[string]interface{}{field: values[0]}, nil
		}
		return map[string]interface{}{field: values}, nil
	}
}

func (s *AuthorizationService) GetFieldPermissions(ctx context.Context, roleID, tableName string) (map[string]string, error) {
	tenantDB := tenantDBFromContext(ctx)
	if tenantDB == nil {
		return map[string]string{}, nil
	}

	var fieldPerms []model.FieldPermission
	err := tenantDB.Table("system_field_permissions").
		Where("role_id = ? AND table_name = ?", roleID, tableName).
		Find(&fieldPerms).Error
	if err != nil {
		return map[string]string{}, err
	}

	result := make(map[string]string, len(fieldPerms))
	for _, fieldPerm := range fieldPerms {
		result[fieldPerm.Field] = fieldPerm.Permission
	}

	return result, nil
}

func (s *AuthorizationService) CheckFieldPermission(ctx context.Context, roleID, tableName, field, permission string) bool {
	permissions, err := s.GetFieldPermissions(ctx, roleID, tableName)
	if err != nil {
		return false
	}

	fieldPermission, exists := permissions[field]
	if !exists {
		return true
	}

	switch permission {
	case FieldPermissionRead:
		return fieldPermission == FieldPermissionRead || fieldPermission == FieldPermissionWrite
	case FieldPermissionWrite:
		return fieldPermission == FieldPermissionWrite
	default:
		return fieldPermission != FieldPermissionHide
	}
}

func (s *AuthorizationService) LoadPolicy(ctx context.Context) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}
	return e.LoadPolicy()
}

func (s *AuthorizationService) SavePolicy(ctx context.Context) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}
	return e.SavePolicy()
}

func (s *AuthorizationService) ReloadPolicy(ctx context.Context) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}
	return e.LoadPolicy()
}

func (s *AuthorizationService) HasCustomScopeRules(ctx context.Context, userID string) (bool, error) {
	scopes, err := s.loadUserRoleDataScopes(ctx, userID)
	if err != nil {
		return false, err
	}

	for _, scope := range scopes {
		if isCustomScopeRule(scope) || normalizeDataScope(scope) == string(DataScopeCustom) {
			return true, nil
		}
	}

	return false, nil
}

func (s *AuthorizationService) ParseCustomScopeRule(rule string) (bool, error) {
	rule = strings.TrimSpace(rule)
	if rule == "" || rule == string(DataScopeAll) {
		return false, nil
	}

	for _, prefix := range customScopePrefixes {
		if !strings.HasPrefix(rule, prefix) {
			continue
		}

		switch {
		case strings.HasPrefix(rule, "dept:"):
			if len(splitTrimmedUnique(rule[5:])) == 0 {
				return false, fmt.Errorf("department scope requires at least one department id")
			}
		case strings.HasPrefix(rule, "dept_and_sub:"):
			if strings.TrimSpace(rule[13:]) == "" {
				return false, fmt.Errorf("department id is required for dept_and_sub scope")
			}
		case strings.HasPrefix(rule, "project:"):
			if len(splitTrimmedUnique(rule[8:])) == 0 {
				return false, fmt.Errorf("project scope requires at least one project id")
			}
		case strings.HasPrefix(rule, "custom:"):
			if _, err := s.parseCustomExpressionRule(context.Background(), rule[7:], "user-id", nil); err != nil {
				return false, err
			}
		}

		return true, nil
	}

	return false, fmt.Errorf("invalid custom rule format, must start with one of: %v", customScopePrefixes)
}

func (s *AuthorizationService) selfScopeFilter(resource, userID string) map[string]interface{} {
	switch resource {
	case "/api/v1/system/users", "system_users":
		return map[string]interface{}{"id": userID}
	case "/api/v1/system/logs", "/api/v1/system/logs/operation", "/api/v1/system/logs/login", "system_oper_log", "system_login_log":
		return map[string]interface{}{"user_id": userID}
	default:
		return map[string]interface{}{"creator_id": userID}
	}
}

func (s *AuthorizationService) loadUserRoleDataScopes(ctx context.Context, userID string) ([]string, error) {
	tenantDB := tenantDBFromContext(ctx)
	if tenantDB == nil {
		return nil, fmt.Errorf("tenant db not found in context")
	}

	type roleScopeRow struct {
		DataScope string
	}

	attempts := []struct {
		roleTable     string
		userRoleTable string
	}{
		{roleTable: "system_roles", userRoleTable: "system_user_roles"},
		{roleTable: "sys_roles", userRoleTable: "sys_user_roles"},
	}

	for _, attempt := range attempts {
		var rows []roleScopeRow
		err := tenantDB.Table(attempt.roleTable).
			Select(attempt.roleTable+".data_scope").
			Joins("INNER JOIN "+attempt.userRoleTable+" ON "+attempt.userRoleTable+".role_id = "+attempt.roleTable+".id").
			Where(attempt.userRoleTable+".user_id = ? AND "+attempt.roleTable+".data_scope != ''", userID).
			Find(&rows).Error
		if err != nil {
			continue
		}

		scopes := make([]string, 0, len(rows))
		for _, row := range rows {
			if strings.TrimSpace(row.DataScope) == "" {
				continue
			}
			scopes = append(scopes, row.DataScope)
		}
		return scopes, nil
	}

	return nil, nil
}

func normalizeDataScope(scope string) string {
	scope = strings.TrimSpace(scope)
	switch scope {
	case string(DataScopeAll), string(DataScopeCustom), string(DataScopeDept), string(DataScopeDeptAndSub), string(DataScopeSelf):
		return scope
	default:
		if isCustomScopeRule(scope) {
			return string(DataScopeCustom)
		}
		return ""
	}
}

func isCustomScopeRule(scope string) bool {
	scope = strings.TrimSpace(scope)
	for _, prefix := range customScopePrefixes {
		if strings.HasPrefix(scope, prefix) {
			return true
		}
	}
	return false
}

func isUserScopedField(field string) bool {
	switch field {
	case "id", "user_id", "creator_id", "receiver_id":
		return true
	default:
		return false
	}
}

func splitTrimmedUnique(raw string) []string {
	parts := strings.Split(strings.TrimSpace(raw), ",")
	result := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if _, ok := seen[part]; ok {
			continue
		}
		seen[part] = struct{}{}
		result = append(result, part)
	}

	return result
}

func firstMatchingDepartment(db *gorm.DB, deptID string, out interface{}) error {
	tables := []string{"system_dept", "sys_departments"}
	var lastErr error

	for _, table := range tables {
		if err := db.Table(table).Where("id = ?", deptID).First(out).Error; err != nil {
			lastErr = err
			continue
		}
		return nil
	}

	return lastErr
}

func denyAllScopeFilter() map[string]interface{} {
	return map[string]interface{}{"id": ""}
}

func txDBFromContext(ctx context.Context) *gorm.DB {
	if ctx == nil {
		return nil
	}
	db, _ := ctx.Value(ctxKeyTxDB).(*gorm.DB)
	return db
}

func tenantDBFromContext(ctx context.Context) *gorm.DB {
	if ctx == nil {
		return nil
	}
	db, _ := ctx.Value(ctxKeyTenantDB).(*gorm.DB)
	return db
}

func tenantDBAndIDFromContext(ctx context.Context) (*gorm.DB, string) {
	if ctx == nil {
		return nil, ""
	}
	db, _ := ctx.Value(ctxKeyTenantDB).(*gorm.DB)
	tenantID, _ := ctx.Value(ctxKeyTenantID).(string)
	return db, tenantID
}

func ensureTenantDB(ctx context.Context, db *gorm.DB) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	if db != nil && tenantDBFromContext(ctx) == nil {
		ctx = context.WithValue(ctx, ctxKeyTenantDB, db)
	}
	return ctx
}

func (s *AuthorizationService) authVersionKey(userID string) string {
	return fmt.Sprintf("auth:version:%s", userID)
}

func (s *AuthorizationService) revokedAfterKey(userID string) string {
	return fmt.Sprintf("auth:revoked_after:%s", userID)
}

func toPermissionSet(policies [][]string) map[string]struct{} {
	result := make(map[string]struct{}, len(policies))
	for _, policy := range policies {
		if len(policy) < 3 {
			continue
		}

		resource := strings.TrimSpace(policy[1])
		action := strings.TrimSpace(policy[2])
		if resource == "" || action == "" {
			continue
		}

		result[fmt.Sprintf("%s:%s", resource, action)] = struct{}{}
	}

	return result
}

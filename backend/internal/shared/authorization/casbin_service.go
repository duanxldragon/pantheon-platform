package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"pantheon-platform/backend/internal/modules/system/model"
	"pantheon-platform/backend/internal/shared/cache"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"gorm.io/gorm"
)

// DataScope 数据权限范围
type DataScope string

const (
	DataScopeAll        DataScope = "all"          // 全部数据
	DataScopeCustom     DataScope = "custom"       // 自定义数据
	DataScopeDept       DataScope = "dept"         // 本部门数据
	DataScopeDeptAndSub DataScope = "dept_and_sub" // 本部门及子部门数据
	DataScopeSelf       DataScope = "self"         // 仅本人数据
)

// FieldPermissionType 字段权限类型
const (
	FieldPermissionRead  = "read"  // 可读
	FieldPermissionWrite = "write" // 可写
	FieldPermissionHide  = "hide"  // 隐藏
)

// 自定义错误
var (
	ErrUnauthorized = errors.New("unauthorized")
)

// AuthorizationService 授权服务
type AuthorizationService struct {
	masterDB        *gorm.DB
	masterEnforcer  *casbin.Enforcer
	tenantEnforcers map[string]*casbin.Enforcer
	modelPath       string
	redisClient     *cache.RedisClient
	mu              sync.RWMutex
}

// NewAuthorizationService 创建授权服务
func NewAuthorizationService(db *gorm.DB, modelPath string) (*AuthorizationService, error) {
	// 使用 GORM 适配器
	adapter, err := gormadapter.NewAdapterByDB(db)
	if err != nil {
		return nil, fmt.Errorf("failed to create casbin adapter: %w", err)
	}

	enforcer, err := casbin.NewEnforcer(modelPath, adapter)
	if err != nil {
		return nil, fmt.Errorf("failed to create casbin enforcer: %w", err)
	}

	// 自动保存策略
	enforcer.EnableAutoSave(true)

	return &AuthorizationService{
		masterDB:        db,
		masterEnforcer:  enforcer,
		tenantEnforcers: make(map[string]*casbin.Enforcer),
		modelPath:       modelPath,
	}, nil
}

const authStateTTL = 8 * 24 * time.Hour

func (s *AuthorizationService) SetRedisClient(redisClient *cache.RedisClient) {
	if s == nil {
		return
	}
	s.redisClient = redisClient
}

// getEnforcer 获取合适的 Enforcer (租户或全局)
func (s *AuthorizationService) getEnforcer(ctx context.Context) (*casbin.Enforcer, error) {
	s.mu.RLock()
	tenantDB, ok := ctx.Value("tenant_db").(*gorm.DB)
	tenantID, _ := ctx.Value("tenant_id").(string)
	s.mu.RUnlock()

	if !ok || tenantDB == nil || tenantID == "" {
		return s.masterEnforcer, nil
	}

	s.mu.RLock()
	enforcer, exists := s.tenantEnforcers[tenantID]
	s.mu.RUnlock()

	if exists {
		return enforcer, nil
	}

	// 创建新的租户 Enforcer
	s.mu.Lock()
	defer s.mu.Unlock()

	// 双重检查
	if enforcer, exists := s.tenantEnforcers[tenantID]; exists {
		return enforcer, nil
	}

	adapter, err := gormadapter.NewAdapterByDB(tenantDB)
	if err != nil {
		return nil, fmt.Errorf("failed to create tenant casbin adapter: %w", err)
	}

	newEnforcer, err := casbin.NewEnforcer(s.modelPath, adapter)
	if err != nil {
		return nil, fmt.Errorf("failed to create tenant casbin enforcer: %w", err)
	}

	newEnforcer.EnableAutoSave(true)
	s.tenantEnforcers[tenantID] = newEnforcer

	return newEnforcer, nil
}

// ========== RBAC 权限检查 ==========

// CheckPermission 检查用户是否有指定权限
func (s *AuthorizationService) CheckPermission(ctx context.Context, userID, resource, action string) bool {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return false
	}

	allowed, _ := e.Enforce(userID, resource, action)
	return allowed
}

// CheckPermissionWithDomain 检查用户在指定域（租户）的权限
func (s *AuthorizationService) CheckPermissionWithDomain(ctx context.Context, userID, domain, resource, action string) bool {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return false
	}

	allowed, _ := e.Enforce(userID, domain, resource, action)
	return allowed
}

// GetUserPermissions 获取用户的所有权限
func (s *AuthorizationService) GetUserPermissions(ctx context.Context, userID string) ([]string, error) {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return nil, err
	}

	permissions := make([]string, 0)

	// 获取用户的所有角色
	roles, err := e.GetRolesForUser(userID)
	if err != nil {
		return nil, err
	}

	// 收集所有权限
	for _, role := range roles {
		policies, err := e.GetFilteredPolicy(0, role)
		if err != nil {
			// 记录警告日志，但继续处理其他角色
			log.Printf("Warning: failed to load policy for role %s: %v", role, err)
			continue
		}
		for _, policy := range policies {
			if len(policy) >= 3 {
				resource := policy[1]
				action := policy[2]
				permissions = append(permissions, fmt.Sprintf("%s:%s", resource, action))
			}
		}
	}

	return permissions, nil
}

// ========== 角色权限管理 ==========

// AddPermissionForRole 为角色添加权限
func (s *AuthorizationService) AddPermissionForRole(ctx context.Context, roleID, resource, action string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.AddPolicy(roleID, resource, action)
	return err
}

// RemovePermissionForRole 移除角色权限
func (s *AuthorizationService) RemovePermissionForRole(ctx context.Context, roleID, resource, action string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.RemovePolicy(roleID, resource, action)
	return err
}

// AddPermissionsForRole 批量为角色添加权限
func (s *AuthorizationService) AddPermissionsForRole(ctx context.Context, roleID string, permissions []struct {
	Resource string
	Action   string
}) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	rules := make([][]string, len(permissions))
	for i, perm := range permissions {
		rules[i] = []string{roleID, perm.Resource, perm.Action}
	}

	_, err = e.AddPolicies(rules)
	return err
}

// RemovePermissionsForRole 批量移除角色权限
func (s *AuthorizationService) RemovePermissionsForRole(ctx context.Context, roleID string, permissions []struct {
	Resource string
	Action   string
}) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	rules := make([][]string, len(permissions))
	for i, perm := range permissions {
		rules[i] = []string{roleID, perm.Resource, perm.Action}
	}

	_, err = e.RemovePolicies(rules)
	return err
}

// ClearPermissionsForRole 清除角色的所有权限
func (s *AuthorizationService) ClearPermissionsForRole(ctx context.Context, roleID string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.DeletePermissionsForUser(roleID)
	return err
}

// ========== 用户角色管理 ==========

// AddRoleForUser 为用户添加角色
func (s *AuthorizationService) AddRoleForUser(ctx context.Context, userID, roleID string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.AddRoleForUser(userID, roleID)
	return err
}

// DeleteRoleForUser 删除用户角色
func (s *AuthorizationService) DeleteRoleForUser(ctx context.Context, userID, roleID string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.DeleteRoleForUser(userID, roleID)
	return err
}

// DeleteRolesForUser 删除用户的所有角色
func (s *AuthorizationService) DeleteRolesForUser(ctx context.Context, userID string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	_, err = e.DeleteRolesForUser(userID)
	return err
}

// GetRolesForUser 获取用户的所有角色
func (s *AuthorizationService) GetRolesForUser(ctx context.Context, userID string) ([]string, error) {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return nil, err
	}

	return e.GetRolesForUser(userID)
}

// SetRolesForUser 设置用户的角色（替换）
func (s *AuthorizationService) SetRolesForUser(ctx context.Context, userID string, roleIDs []string) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}

	// 先清除现有角色
	if _, err := e.DeleteRolesForUser(userID); err != nil {
		return err
	}

	// 添加新角色
	for _, roleID := range roleIDs {
		if _, err := e.AddRoleForUser(userID, roleID); err != nil {
			return err
		}
	}

	return nil
}

// GetUsersForRole 获取拥有指定角色的所有用户
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

// ========== 数据权限 ==========

// CheckDataScope 检查数据权限范围
func (s *AuthorizationService) CheckDataScope(ctx context.Context, userID, resource string) (DataScope, error) {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return DataScopeSelf, err
	}

	maxScope := DataScopeSelf
	if userID == "" {
		return maxScope, ErrUnauthorized
	}

	// 获取用户的所有角色
	roles, err := e.GetRolesForUser(userID)
	if err != nil {
		return maxScope, err
	}

	// 获取用户通过角色获得的所有权限
	maxScope = DataScopeSelf
	for _, role := range roles {
		permissions, err := e.GetPermissionsForUser(role)
		if err != nil {
			// 记录警告日志，但继续处理其他角色
			log.Printf("Warning: failed to get permissions for role %s: %v", role, err)
			continue
		}

		for _, permission := range permissions {
			if len(permission) >= 3 && permission[0] == resource {
				scope := permission[2]
				if s.isDataScopeLarger(scope, string(maxScope)) {
					maxScope = DataScope(scope)
				}
			}
		}
	}

	return maxScope, nil
}

// isDataScopeLarger 判断数据权限范围是否更大
func (s *AuthorizationService) isDataScopeLarger(scope1, scope2 string) bool {
	scopeOrder := map[string]int{
		"self":         1,
		"dept_and_sub": 2,
		"dept":         3,
		"custom":       4,
		"all":          5,
	}

	return scopeOrder[scope1] > scopeOrder[scope2]
}

// DepartmentInfo 部门信息
type DepartmentInfo struct {
	ID       string
	ParentID *string
}

// GetUserDepartmentID 获取用户的部门ID
func (s *AuthorizationService) GetUserDepartmentID(ctx context.Context, userID string) (string, error) {
	// 获取租户数据库
	tenantDB, ok := ctx.Value("tenant_db").(*gorm.DB)
	if !ok || tenantDB == nil {
		return "", fmt.Errorf("tenant db not found in context")
	}

	// 查询用户的部门ID
	type UserDepartment struct {
		DepartmentID *string
	}
	var userDept UserDepartment
	err := tenantDB.Table("system_users").
		Select("department_id").
		Where("id = ?", userID).
		First(&userDept).Error

	if err != nil {
		return "", err
	}

	if userDept.DepartmentID == nil {
		return "", nil
	}

	return *userDept.DepartmentID, nil
}

// GetDepartmentTree 获取部门树（包含所有子部门）
func (s *AuthorizationService) GetDepartmentTree(ctx context.Context, deptID string) ([]string, error) {
	// 获取租户数据库
	tenantDB, ok := ctx.Value("tenant_db").(*gorm.DB)
	if !ok || tenantDB == nil {
		return nil, fmt.Errorf("tenant db not found in context")
	}

	var deptIDs []string

	// 递归查询所有子部门ID
	s.getDepartmentChildrenRecursive(tenantDB, deptID, &deptIDs)

	// 添加自身部门ID
	deptIDs = append(deptIDs, deptID)

	return deptIDs, nil
}

// getDepartmentChildrenRecursive 递归获取子部门
func (s *AuthorizationService) getDepartmentChildrenRecursive(db *gorm.DB, parentID string, deptIDs *[]string) {
	var departments []DepartmentInfo

	err := db.Table("system_dept").
		Select("id, parent_id").
		Where("parent_id = ? AND status = ?", parentID, "active").
		Find(&departments).Error

	if err != nil {
		return
	}

	for _, dept := range departments {
		*deptIDs = append(*deptIDs, dept.ID)
		// 递归查询子部门
		s.getDepartmentChildrenRecursive(db, dept.ID, deptIDs)
	}
}

// GetDataScopeFilter 根据数据权限范围获取过滤条件
func (s *AuthorizationService) GetDataScopeFilter(ctx context.Context, userID, resource string) (map[string]interface{}, error) {
	scope, err := s.CheckDataScope(ctx, userID, resource)
	if err != nil {
		return nil, err
	}

	switch scope {
	case DataScopeAll:
		return nil, nil // 无限制
	case DataScopeSelf:
		return map[string]interface{}{"creator_id": userID}, nil
	case DataScopeDept:
		// 获取用户部门ID，只返回本部门数据
		deptID, err := s.GetUserDepartmentID(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get user department: %w", err)
		}
		if deptID == "" {
			// 用户没有部门，返回空结果
			return map[string]interface{}{"id": ""}, nil
		}
		return map[string]interface{}{"department_id": deptID}, nil
	case DataScopeDeptAndSub:
		// 获取用户部门及其所有子部门
		deptID, err := s.GetUserDepartmentID(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get user department: %w", err)
		}
		if deptID == "" {
			// 用户没有部门，返回空结果
			return map[string]interface{}{"id": ""}, nil
		}
		deptIDs, err := s.GetDepartmentTree(ctx, deptID)
		if err != nil {
			return nil, fmt.Errorf("failed to get department tree: %w", err)
		}
		// 返回部门及其子部门的ID列表
		return map[string]interface{}{"department_id": deptIDs}, nil
	case DataScopeCustom:
		// 自定义数据范围 - 支持基于业务规则的灵活权限控制
		// 获取租户数据库
		tenantDB, ok := ctx.Value("tenant_db").(*gorm.DB)
		if !ok || tenantDB == nil {
			return nil, fmt.Errorf("tenant db not found in context")
		}

		// 获取用户信息和角色
		type UserRoleInfo struct {
			RoleID    string
			RoleName  string
			DataScope string
		}
		var userRoles []UserRoleInfo
		err := tenantDB.Table("sys_user_roles").
			Joins("LEFT JOIN sys_roles ON sys_roles.id = sys_user_roles.role_id").
			Select("sys_roles.id, sys_roles.name as role_name, sys_roles.data_scope").
			Where("sys_user_roles.user_id = ?", userID).
			Find(&userRoles).Error

		if err != nil {
			return nil, fmt.Errorf("failed to load user roles: %w", err)
		}

		// 检查是否配置了自定义数据范围
		for _, role := range userRoles {
			if role.DataScope != "" && role.DataScope != "all" {
				// 解析并应用自定义规则
				filter, parseErr := s.parseCustomDataScope(role.DataScope, userID, tenantDB)
				if parseErr != nil {
					// 记录错误但继续处理其他角色
					log.Printf("Warning: failed to parse custom data scope %s for role %s: %v", role.DataScope, role.RoleName, parseErr)
					continue
				}
				if filter != nil {
					return filter, nil
				}
			}
		}

		// 没有自定义规则，默认返回当前用户数据
		return map[string]interface{}{"creator_id": userID}, nil
	default:
		return nil, fmt.Errorf("unknown data scope: %s", scope)
	}
}

// ========== 自定义数据范围解析 ==========

// parseCustomDataScope 解析自定义数据范围规则
func (s *AuthorizationService) parseCustomDataScope(rule string, userID string, db *gorm.DB) (map[string]interface{}, error) {
	// 规则格式支持：
	// 1. "dept:123,124" - 限制指定部门
	// 2. "dept_and_sub:125" - 限制指定部门及其子部门
	// 3. "project:abc,def" - 限制指定项目（需要实现项目相关表）
	// 4. "custom:sql_expr" - 自定义 SQL 表达式（高级功能）

	if strings.HasPrefix(rule, "dept:") {
		return s.parseDepartmentScopeRule(rule[5:], userID, db)
	}

	if strings.HasPrefix(rule, "dept_and_sub:") {
		return s.parseDepartmentAndSubScopeRule(rule[13:], userID, db)
	}

	if strings.HasPrefix(rule, "project:") {
		return s.parseProjectScopeRule(rule[8:], userID, db)
	}

	if strings.HasPrefix(rule, "custom:") {
		// 自定义表达式，需要实现更复杂的解析器
		return s.parseCustomExpressionRule(rule[7:], userID, db)
	}

	return nil, fmt.Errorf("unsupported custom rule format: %s", rule)
}

// parseDepartmentScopeRule 解析部门范围规则：dept:123,124
func (s *AuthorizationService) parseDepartmentScopeRule(depts string, userID string, db *gorm.DB) (map[string]interface{}, error) {
	deptIDs := strings.Split(strings.TrimSpace(depts), ",")
	result := make(map[string]interface{})

	// 验证部门ID是否存在
	var validDepts []string
	type DeptID struct {
		ID string
	}
	for _, deptID := range deptIDs {
		if deptID == "" {
			continue
		}
		var dept DeptID
		err := db.Table("sys_departments").Where("id = ?", deptID).First(&dept).Error
		if err != nil {
			return nil, err
		}
		if dept.ID != "" {
			validDepts = append(validDepts, deptID)
		}
	}

	result["department_id"] = validDepts
	return result, nil
}

// parseDepartmentAndSubScopeRule 解析部门及子部门范围规则：dept_and_sub:125
func (s *AuthorizationService) parseDepartmentAndSubScopeRule(deptID string, userID string, db *gorm.DB) (map[string]interface{}, error) {
	deptID = strings.TrimSpace(deptID)
	if deptID == "" {
		return nil, fmt.Errorf("department id is required for dept_and_sub scope")
	}

	// 获取部门及其所有子部门
	// Note: context.Background() is used here as a placeholder; in a real scenario, you might want to pass the context from the caller.
	deptIDs, err := s.GetDepartmentTree(context.WithValue(context.Background(), "tenant_db", db), deptID)
	if err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	result["department_id"] = deptIDs
	return result, nil
}

// parseProjectScopeRule 解析项目范围规则：project:abc,def
func (s *AuthorizationService) parseProjectScopeRule(projectIDs string, userID string, db *gorm.DB) (map[string]interface{}, error) {
	// TODO: 实现项目相关表和权限逻辑
	// 这里需要根据业务需求实现项目的关联逻辑
	// 例如：查询用户参与的项目，返回项目ID列表

	ids := strings.Split(strings.TrimSpace(projectIDs), ",")
	result := make(map[string]interface{})
	result["project_id"] = ids
	return result, nil
}

// parseCustomExpressionRule 解析自定义表达式规则：custom:expression
func (s *AuthorizationService) parseCustomExpressionRule(expression string, userID string, db *gorm.DB) (map[string]interface{}, error) {
	// TODO: 实现表达式解析器
	// 当前作为占位符实现，返回用户数据
	log.Printf("Custom expression rule not fully implemented: %s", expression)
	return map[string]interface{}{"creator_id": userID}, nil
}

// ========== 字段权限 ==========

// GetFieldPermissions 获取角色对指定表的字段权限
func (s *AuthorizationService) GetFieldPermissions(ctx context.Context, roleID, tableName string) (map[string]string, error) {
	// 获取租户数据库
	tenantDB, ok := ctx.Value("tenant_db").(*gorm.DB)
	if !ok || tenantDB == nil {
		return make(map[string]string), nil
	}

	var fieldPerms []model.FieldPermission
	err := tenantDB.Table("system_field_permissions").
		Where("role_id = ? AND table_name = ?", roleID, tableName).
		Find(&fieldPerms).Error

	if err != nil {
		return make(map[string]string), err
	}

	// 转换为map格式：字段名 -> 权限类型
	result := make(map[string]string)
	for _, fp := range fieldPerms {
		result[fp.Field] = fp.Permission
	}

	// 如果没有配置字段权限，返回空map（表示所有字段都有默认权限）
	return result, nil
}

// CheckFieldPermission 检查字段权限
func (s *AuthorizationService) CheckFieldPermission(ctx context.Context, roleID, tableName, field, permission string) bool {
	permissions, err := s.GetFieldPermissions(ctx, roleID, tableName)
	if err != nil {
		return false
	}

	perm, exists := permissions[field]
	if !exists {
		return true // 默认允许
	}

	if permission == FieldPermissionRead {
		return perm == FieldPermissionRead || perm == FieldPermissionWrite
	}
	if permission == FieldPermissionWrite {
		return perm == FieldPermissionWrite
	}

	return perm != FieldPermissionHide
}

// LoadPolicy 从数据库加载策略
func (s *AuthorizationService) LoadPolicy(ctx context.Context) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}
	return e.LoadPolicy()
}

// SavePolicy 保存策略到数据库
func (s *AuthorizationService) SavePolicy(ctx context.Context) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}
	return e.SavePolicy()
}

// ReloadPolicy 重新加载策略
func (s *AuthorizationService) ReloadPolicy(ctx context.Context) error {
	e, err := s.getEnforcer(ctx)
	if err != nil {
		return err
	}
	return e.LoadPolicy()
}

// ========== 自定义数据范围扩展方法 ==========

// HasCustomScopeRules 检查是否配置了自定义数据范围规则
func (s *AuthorizationService) HasCustomScopeRules(ctx context.Context, userID string) (bool, error) {
	tenantDB, ok := ctx.Value("tenant_db").(*gorm.DB)
	if !ok || tenantDB == nil {
		return false, fmt.Errorf("tenant db not found in context")
	}

	type RoleDataScope struct {
		DataScope string
	}
	var roles []RoleDataScope
	err := tenantDB.Table("sys_roles").
		Select("data_scope").
		InnerJoins("sys_user_roles ON sys_user_roles.role_id = sys_roles.id").
		Where("sys_user_roles.user_id = ? AND sys_roles.data_scope != '' AND sys_roles.data_scope != 'all'", userID).
		Find(&roles).Error

	if err != nil {
		return false, err
	}

	return len(roles) > 0, nil
}

// ParseCustomScopeRule 解析并验证自定义范围规则
func (s *AuthorizationService) ParseCustomScopeRule(rule string) (bool, error) {
	if rule == "" || rule == "all" {
		return false, nil
	}

	// 检查规则格式是否有效
	validPrefixes := []string{"dept:", "dept_and_sub:", "project:", "custom:"}
	hasValidPrefix := false
	for _, prefix := range validPrefixes {
		if strings.HasPrefix(rule, prefix) {
			hasValidPrefix = true
			break
		}
	}

	if !hasValidPrefix {
		return false, fmt.Errorf("invalid custom rule format, must start with one of: %v", validPrefixes)
	}

	return true, nil
}

func (s *AuthorizationService) authVersionKey(userID string) string {
	return fmt.Sprintf("auth:version:%s", userID)
}

func (s *AuthorizationService) revokedAfterKey(userID string) string {
	return fmt.Sprintf("auth:revoked_after:%s", userID)
}

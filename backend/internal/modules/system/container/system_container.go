package container

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/modules/auth"
	"pantheon-platform/backend/internal/modules/system/dept"
	"pantheon-platform/backend/internal/modules/system/dict"
	"pantheon-platform/backend/internal/modules/system/log"
	"pantheon-platform/backend/internal/modules/system/menu"
	"pantheon-platform/backend/internal/modules/system/monitor"
	"pantheon-platform/backend/internal/modules/system/permission"
	"pantheon-platform/backend/internal/modules/system/position"
	"pantheon-platform/backend/internal/modules/system/role"
	"pantheon-platform/backend/internal/modules/system/setting"
	"pantheon-platform/backend/internal/modules/system/user"
	"pantheon-platform/backend/internal/modules/tenant"
	authz "pantheon-platform/backend/internal/shared/authorization"
	"pantheon-platform/backend/internal/shared/cache"
	"pantheon-platform/backend/internal/shared/database"
	"pantheon-platform/backend/internal/shared/storage"
)

// ========== Container Interface ==========

type Container interface {
	GetUserHandler() *user.UserHandler
	GetRoleHandler() *role.RoleHandler
	GetPermissionHandler() *permission.PermissionHandler
	GetDepartmentHandler() *dept.DepartmentHandler
	GetPositionHandler() *position.PositionHandler
	GetMenuHandler() *menu.MenuHandler
	GetDictHandler() *dict.DictHandler
	GetLogHandler() *log.LogHandler
	GetSettingHandler() *setting.SettingHandler
	GetMonitorHandler() *monitor.MonitorHandler

	GetUserService() user.UserService
	GetRoleService() role.RoleService
	GetPermissionService() permission.PermissionService
	GetDepartmentService() dept.DepartmentService
	GetPositionService() position.PositionService
	GetMenuService() menu.MenuService
	GetDictService() dict.DictService
	GetLogService() log.LogService
	GetSettingService() setting.SettingService
	GetMonitorService() monitor.MonitorService
	SetRedisClient(rc *cache.RedisClient)

	GetUserDAO() user.UserDAO
	GetRoleDAO() role.RoleDAO
	GetPermissionDAO() permission.PermissionDAO
	GetDepartmentDAO() dept.DepartmentDAO
	GetPositionDAO() position.PositionDAO
	GetMenuDAO() menu.MenuDAO
	GetDictTypeDAO() dict.DictTypeDAO
	GetDictDataDAO() dict.DictDataDAO
	GetOperationLogDAO() log.OperationLogDAO
	GetLoginLogDAO() log.LoginLogDAO
	GetSettingDAO() setting.SettingDAO
	GetTransactionManager() database.TransactionManager
}

// ========== Container Implementation ==========

type container struct {
	db              *gorm.DB
	monitorDB       *gorm.DB
	authz           *authz.AuthorizationService
	dbManager       *database.Manager
	quotaSvc        tenant.QuotaService
	storageProvider storage.StorageProvider

	userService       user.UserService
	roleService       role.RoleService
	permissionService permission.PermissionService
	departmentService dept.DepartmentService
	positionService   position.PositionService
	menuService       menu.MenuService
	dictService       dict.DictService
	logService        log.LogService
	settingService    setting.SettingService
	monitorService    monitor.MonitorService

	userHandler       *user.UserHandler
	roleHandler       *role.RoleHandler
	permissionHandler *permission.PermissionHandler
	departmentHandler *dept.DepartmentHandler
	positionHandler   *position.PositionHandler
	menuHandler       *menu.MenuHandler
	dictHandler       *dict.DictHandler
	logHandler        *log.LogHandler
	settingHandler    *setting.SettingHandler
	monitorHandler    *monitor.MonitorHandler

	userDAO     user.UserDAO
	roleDAO     role.RoleDAO
	permDAO     permission.PermissionDAO
	deptDAO     dept.DepartmentDAO
	posDAO      position.PositionDAO
	menuDAO     menu.MenuDAO
	dictTypeDAO dict.DictTypeDAO
	dictDataDAO dict.DictDataDAO
	opLogDAO    log.OperationLogDAO
	loginLogDAO log.LoginLogDAO
	settingDAO  setting.SettingDAO
}

func NewContainer(
	db *gorm.DB,
	monitorDB *gorm.DB,
	authzSvc *authz.AuthorizationService,
	dbManager *database.Manager,
	quotaSvc tenant.QuotaService,
	storageProvider storage.StorageProvider,
) Container {
	c := &container{
		db:              db,
		monitorDB:       monitorDB,
		authz:           authzSvc,
		dbManager:       dbManager,
		quotaSvc:        quotaSvc,
		storageProvider: storageProvider,
	}

	c.initDAOs()
	c.initServices()
	c.initHandlers()

	return c
}

func (c *container) initDAOs() {
	c.userDAO = user.NewUserDAO(c.db)
	c.roleDAO = role.NewRoleDAO(c.db)
	c.permDAO = permission.NewPermissionDAO(c.db)
	c.deptDAO = dept.NewDepartmentDAO(c.db)
	c.posDAO = position.NewPositionDAO(c.db)
	c.menuDAO = menu.NewMenuDAO(c.db)
	c.dictTypeDAO = dict.NewDictTypeDAO(c.db)
	c.dictDataDAO = dict.NewDictDataDAO(c.db)
	c.opLogDAO = log.NewOperationLogDAO(c.db)
	c.loginLogDAO = log.NewLoginLogDAO(c.db)
	c.settingDAO = setting.NewSettingDAO(c.db)
}

func (c *container) initServices() {
	txManager := database.NewTransactionManager(c.db, c.dbManager)
	quotaValidator := &quotaValidatorAdapter{svc: c.quotaSvc}
	userDirectory := &userDirectoryAdapter{dao: c.userDAO}
	deptValidator := &departmentValidatorAdapter{dao: c.deptDAO}
	positionValidator := &positionValidatorAdapter{dao: c.posDAO}
	roleValidator := &roleValidatorAdapter{dao: c.roleDAO}
	permissionValidator := &permissionValidatorAdapter{dao: c.permDAO}
	authProvider := &authorizationAdapter{svc: c.authz}
	passwordValidator := &passwordPolicyAdapter{}

	c.logService = log.NewLogService(c.opLogDAO, c.loginLogDAO, c.monitorDB)
	c.departmentService = dept.NewDepartmentService(c.deptDAO, userDirectory, authProvider, txManager)
	c.positionService = position.NewPositionService(c.posDAO, deptValidator, userDirectory, authProvider, txManager)
	c.menuService = menu.NewMenuService(c.menuDAO, authProvider, txManager)
	c.dictService = dict.NewDictService(c.dictTypeDAO, c.dictDataDAO, txManager)
	c.permissionService = permission.NewPermissionService(c.permDAO, authProvider, txManager)
	c.settingService = setting.NewSettingService(c.settingDAO)
	c.monitorService = monitor.NewMonitorService(c.db, c.monitorDB, nil)

	c.roleService = role.NewRoleService(
		c.roleDAO,
		c.menuDAO,
		permissionValidator,
		userDirectory,
		quotaValidator,
		authProvider,
		txManager,
	)

	c.userService = user.NewUserService(
		c.userDAO,
		roleValidator,
		deptValidator,
		positionValidator,
		passwordValidator,
		quotaValidator,
		authProvider,
		txManager,
	)
}

func (c *container) initHandlers() {
	c.userHandler = user.NewUserHandler(c.userService, c.authz, c.storageProvider)
	c.roleHandler = role.NewRoleHandler(c.roleService)
	c.permissionHandler = permission.NewPermissionHandler(c.permissionService)
	c.departmentHandler = dept.NewDepartmentHandler(c.departmentService)
	c.positionHandler = position.NewPositionHandler(c.positionService)
	c.menuHandler = menu.NewMenuHandler(c.menuService)
	c.dictHandler = dict.NewDictHandler(c.dictService)
	c.logHandler = log.NewLogHandler(c.logService)
	c.settingHandler = setting.NewSettingHandler(c.settingService)
	c.monitorHandler = monitor.NewMonitorHandler(c.monitorService)
}

// Getters
func (c *container) GetUserHandler() *user.UserHandler                   { return c.userHandler }
func (c *container) GetRoleHandler() *role.RoleHandler                   { return c.roleHandler }
func (c *container) GetPermissionHandler() *permission.PermissionHandler { return c.permissionHandler }
func (c *container) GetDepartmentHandler() *dept.DepartmentHandler       { return c.departmentHandler }
func (c *container) GetPositionHandler() *position.PositionHandler       { return c.positionHandler }
func (c *container) GetMenuHandler() *menu.MenuHandler                   { return c.menuHandler }
func (c *container) GetDictHandler() *dict.DictHandler                   { return c.dictHandler }
func (c *container) GetLogHandler() *log.LogHandler                      { return c.logHandler }
func (c *container) GetSettingHandler() *setting.SettingHandler          { return c.settingHandler }
func (c *container) GetMonitorHandler() *monitor.MonitorHandler          { return c.monitorHandler }

func (c *container) GetUserService() user.UserService                   { return c.userService }
func (c *container) GetRoleService() role.RoleService                   { return c.roleService }
func (c *container) GetPermissionService() permission.PermissionService { return c.permissionService }
func (c *container) GetDepartmentService() dept.DepartmentService       { return c.departmentService }
func (c *container) GetPositionService() position.PositionService       { return c.positionService }
func (c *container) GetMenuService() menu.MenuService                   { return c.menuService }
func (c *container) GetDictService() dict.DictService                   { return c.dictService }
func (c *container) GetLogService() log.LogService                      { return c.logService }
func (c *container) GetSettingService() setting.SettingService          { return c.settingService }
func (c *container) GetMonitorService() monitor.MonitorService          { return c.monitorService }

// SetRedisClient injects the Redis client into the monitor service for health checks.
func (c *container) SetRedisClient(rc *cache.RedisClient) {
	c.monitorService = monitor.NewMonitorService(c.db, c.monitorDB, rc)
	c.monitorHandler = monitor.NewMonitorHandler(c.monitorService)
}

func (c *container) GetUserDAO() user.UserDAO                   { return c.userDAO }
func (c *container) GetRoleDAO() role.RoleDAO                   { return c.roleDAO }
func (c *container) GetPermissionDAO() permission.PermissionDAO { return c.permDAO }
func (c *container) GetDepartmentDAO() dept.DepartmentDAO       { return c.deptDAO }
func (c *container) GetPositionDAO() position.PositionDAO       { return c.posDAO }
func (c *container) GetMenuDAO() menu.MenuDAO                   { return c.menuDAO }
func (c *container) GetDictTypeDAO() dict.DictTypeDAO           { return c.dictTypeDAO }
func (c *container) GetDictDataDAO() dict.DictDataDAO           { return c.dictDataDAO }
func (c *container) GetOperationLogDAO() log.OperationLogDAO    { return c.opLogDAO }
func (c *container) GetLoginLogDAO() log.LoginLogDAO            { return c.loginLogDAO }
func (c *container) GetSettingDAO() setting.SettingDAO          { return c.settingDAO }
func (c *container) GetTransactionManager() database.TransactionManager {
	return database.NewTransactionManager(c.db, c.dbManager)
}

type passwordPolicyAdapter struct{}

func (a *passwordPolicyAdapter) ValidatePassword(password, username, email string) error {
	result := auth.ValidatePassword(password, username, email, auth.DefaultPasswordPolicy())
	if result == nil || result.Valid {
		return nil
	}
	return errors.New(strings.Join(result.Errors, ","))
}

type roleValidatorAdapter struct {
	dao role.RoleDAO
}

func (a *roleValidatorAdapter) CheckRoleExists(ctx context.Context, id string) (bool, error) {
	if a == nil || a.dao == nil {
		return false, nil
	}
	_, err := a.dao.GetByID(ctx, id)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	return false, err
}

type departmentValidatorAdapter struct {
	dao dept.DepartmentDAO
}

func (a *departmentValidatorAdapter) GetDeptName(ctx context.Context, id string) (string, error) {
	if a == nil || a.dao == nil || id == "" {
		return "", nil
	}
	record, err := a.dao.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	return record.Name, nil
}

func (a *departmentValidatorAdapter) CheckDeptExists(ctx context.Context, id string) (bool, error) {
	if a == nil || a.dao == nil || id == "" {
		return false, nil
	}
	record, err := a.dao.GetByID(ctx, id)
	if err == nil {
		return record.Status == "active", nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	return false, err
}

func (a *departmentValidatorAdapter) CheckDeptValid(ctx context.Context, id string) (bool, error) {
	return a.CheckDeptExists(ctx, id)
}

type positionValidatorAdapter struct {
	dao position.PositionDAO
}

func (a *positionValidatorAdapter) GetPositionName(ctx context.Context, id string) (string, error) {
	if a == nil || a.dao == nil || id == "" {
		return "", nil
	}
	record, err := a.dao.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	return record.Name, nil
}

func (a *positionValidatorAdapter) CheckPositionValid(ctx context.Context, id string) (bool, error) {
	if a == nil || a.dao == nil || id == "" {
		return false, nil
	}
	record, err := a.dao.GetByID(ctx, id)
	if err == nil {
		return record.Status == "active", nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	return false, err
}

type userDirectoryAdapter struct {
	dao user.UserDAO
}

func (a *userDirectoryAdapter) GetUserName(ctx context.Context, id string) (string, error) {
	if a == nil || a.dao == nil || id == "" {
		return "", nil
	}
	record, err := a.dao.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	if record.RealName != "" {
		return record.RealName, nil
	}
	return record.Username, nil
}

func (a *userDirectoryAdapter) CheckUserExists(ctx context.Context, id string) (bool, error) {
	if a == nil || a.dao == nil || id == "" {
		return false, nil
	}
	_, err := a.dao.GetByID(ctx, id)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	return false, err
}

func (a *userDirectoryAdapter) HasUsersInDept(ctx context.Context, deptID string) (bool, error) {
	if a == nil || a.dao == nil || deptID == "" {
		return false, nil
	}
	count, err := a.dao.Count(ctx, map[string]interface{}{"department_id": deptID})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (a *userDirectoryAdapter) ListUserIDsByDepartmentIDs(ctx context.Context, departmentIDs []string) ([]string, error) {
	if a == nil || a.dao == nil {
		return []string{}, nil
	}
	return a.dao.ListUserIDsByDepartmentIDs(ctx, departmentIDs)
}

func (a *userDirectoryAdapter) ListUserIDsByPositionID(ctx context.Context, positionID string) ([]string, error) {
	if a == nil || a.dao == nil {
		return []string{}, nil
	}
	return a.dao.ListUserIDsByPositionID(ctx, positionID)
}

func (a *userDirectoryAdapter) CheckRoleInUse(ctx context.Context, roleID string) (bool, error) {
	if a == nil || a.dao == nil || roleID == "" {
		return false, nil
	}
	return a.dao.CheckRoleInUse(ctx, roleID)
}

type permissionValidatorAdapter struct {
	dao permission.PermissionDAO
}

func (a *permissionValidatorAdapter) CheckPermissionExists(ctx context.Context, id string) (bool, error) {
	if a == nil || a.dao == nil || id == "" {
		return false, nil
	}
	_, err := a.dao.GetByID(ctx, id)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	return false, err
}

func (a *permissionValidatorAdapter) GetPermissionRules(ctx context.Context, ids []string) ([]role.PermissionRule, error) {
	rules := make([]role.PermissionRule, 0, len(ids))
	if a == nil || a.dao == nil {
		return rules, nil
	}
	for _, id := range ids {
		record, err := a.dao.GetByID(ctx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("permission not found")
			}
			return nil, err
		}
		rules = append(rules, role.PermissionRule{
			Resource: record.Resource,
			Action:   record.Action,
		})
	}
	return rules, nil
}

type quotaValidatorAdapter struct {
	svc tenant.QuotaService
}

func (a *quotaValidatorAdapter) CheckQuota(ctx context.Context, tenantID string, quotaType string) error {
	if a == nil || a.svc == nil || tenantID == "" || quotaType == "" {
		return nil
	}
	return a.svc.CheckQuota(ctx, tenantID, tenant.QuotaType(quotaType))
}

func (a *quotaValidatorAdapter) IncreaseUsage(ctx context.Context, tenantID string, quotaType string, amount int64, operator string) error {
	if a == nil || a.svc == nil || tenantID == "" || quotaType == "" {
		return nil
	}
	return a.svc.IncreaseUsage(ctx, tenantID, tenant.QuotaType(quotaType), amount, operator)
}

func (a *quotaValidatorAdapter) DecreaseUsage(ctx context.Context, tenantID string, quotaType string, amount int64, operator string) error {
	if a == nil || a.svc == nil || tenantID == "" || quotaType == "" {
		return nil
	}
	return a.svc.DecreaseUsage(ctx, tenantID, tenant.QuotaType(quotaType), amount, operator)
}

type authorizationAdapter struct {
	svc *authz.AuthorizationService
}

func (a *authorizationAdapter) SetRolesForUser(ctx context.Context, userID string, roleIDs []string) error {
	if a == nil || a.svc == nil {
		return nil
	}
	return a.svc.SetRolesForUser(ctx, userID, roleIDs)
}

func (a *authorizationAdapter) BumpUserAuthVersion(ctx context.Context, userID string) error {
	if a == nil || a.svc == nil {
		return nil
	}
	return a.svc.BumpUserAuthVersion(ctx, userID)
}

func (a *authorizationAdapter) BumpRoleUsersAuthVersion(ctx context.Context, roleID string) error {
	if a == nil || a.svc == nil {
		return nil
	}
	return a.svc.BumpRoleUsersAuthVersion(ctx, roleID)
}

func (a *authorizationAdapter) BumpUsersAuthVersion(ctx context.Context, userIDs []string) error {
	if a == nil || a.svc == nil {
		return nil
	}
	return a.svc.BumpUsersAuthVersion(ctx, userIDs)
}

func (a *authorizationAdapter) RevokeUserSessions(ctx context.Context, userID string) error {
	if a == nil || a.svc == nil {
		return nil
	}
	return a.svc.RevokeUserSessions(ctx, userID)
}

func (a *authorizationAdapter) RevokeUsersSessions(ctx context.Context, userIDs []string) error {
	if a == nil || a.svc == nil {
		return nil
	}
	return a.svc.RevokeUsersSessions(ctx, userIDs)
}

func (a *authorizationAdapter) GetDataScopeFilter(ctx context.Context, userID, resource string) (map[string]interface{}, error) {
	if a == nil || a.svc == nil {
		return map[string]interface{}{}, nil
	}
	return a.svc.GetDataScopeFilter(ctx, userID, resource)
}

func (a *authorizationAdapter) GetFieldPermissions(ctx context.Context, roleID, tableName string) (map[string]string, error) {
	if a == nil || a.svc == nil {
		return map[string]string{}, nil
	}
	return a.svc.GetFieldPermissions(ctx, roleID, tableName)
}

func (a *authorizationAdapter) UpdateRolePermissions(ctx context.Context, roleID string, rules []role.PermissionRule) error {
	if a == nil || a.svc == nil {
		return nil
	}
	if err := a.svc.ClearPermissionsForRole(ctx, roleID); err != nil {
		return err
	}
	permissions := make([]struct {
		Resource string
		Action   string
	}, 0, len(rules))
	for _, rule := range rules {
		permissions = append(permissions, struct {
			Resource string
			Action   string
		}{
			Resource: rule.Resource,
			Action:   rule.Action,
		})
	}
	if len(permissions) == 0 {
		return nil
	}
	return a.svc.AddPermissionsForRole(ctx, roleID, permissions)
}

func (a *authorizationAdapter) RemoveRole(ctx context.Context, roleID string) error {
	if a == nil || a.svc == nil {
		return nil
	}
	users, err := a.svc.GetUsersForRole(ctx, roleID)
	if err != nil {
		return err
	}
	for _, userID := range users {
		if err := a.svc.DeleteRoleForUser(ctx, userID, roleID); err != nil {
			return err
		}
	}
	return a.svc.ClearPermissionsForRole(ctx, roleID)
}

func (a *authorizationAdapter) SyncRoleUsers(ctx context.Context, roleID string, userIDs []string, enabled bool) error {
	if a == nil || a.svc == nil || roleID == "" || len(userIDs) == 0 {
		return nil
	}
	for _, userID := range userIDs {
		if userID == "" {
			continue
		}
		var err error
		if enabled {
			err = a.svc.AddRoleForUser(ctx, userID, roleID)
		} else {
			err = a.svc.DeleteRoleForUser(ctx, userID, roleID)
		}
		if err != nil {
			return err
		}
	}
	return nil
}

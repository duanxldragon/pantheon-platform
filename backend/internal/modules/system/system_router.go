package system

import (
	"github.com/gin-gonic/gin"

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
	"pantheon-platform/backend/internal/shared/middleware"
)

type SystemRouter struct {
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
}

func NewSystemRouter(
	userHandler *user.UserHandler,
	roleHandler *role.RoleHandler,
	permissionHandler *permission.PermissionHandler,
	departmentHandler *dept.DepartmentHandler,
	positionHandler *position.PositionHandler,
	menuHandler *menu.MenuHandler,
	dictHandler *dict.DictHandler,
	logHandler *log.LogHandler,
	settingHandler *setting.SettingHandler,
	monitorHandler *monitor.MonitorHandler,
) *SystemRouter {
	return &SystemRouter{
		userHandler:       userHandler,
		roleHandler:       roleHandler,
		permissionHandler: permissionHandler,
		departmentHandler: departmentHandler,
		positionHandler:   positionHandler,
		menuHandler:       menuHandler,
		dictHandler:       dictHandler,
		logHandler:        logHandler,
		settingHandler:    settingHandler,
		monitorHandler:    monitorHandler,
	}
}

func (r *SystemRouter) RegisterRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc, tenantMiddleware gin.HandlerFunc) {
	system := router.Group("/system")
	system.Use(authMiddleware, tenantMiddleware)
	if middleware.GlobalAuthService != nil {
		system.Use(middleware.Authz(middleware.GlobalAuthService))
	}
	{
		r.userHandler.RegisterRoutes(system)
		r.departmentHandler.RegisterRoutes(system)
		r.positionHandler.RegisterRoutes(system)
		r.roleHandler.RegisterRoutes(system)
		r.permissionHandler.RegisterRoutes(system)
		r.menuHandler.RegisterRoutes(system)
		r.dictHandler.RegisterRoutes(system)
		r.logHandler.RegisterRoutes(system)
		r.settingHandler.RegisterRoutes(system)
		r.monitorHandler.RegisterRoutes(system)
	}
}

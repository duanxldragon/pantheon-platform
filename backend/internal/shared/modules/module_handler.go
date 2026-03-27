package modules

import (
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

// ModuleHandler exposes read/write APIs for the module system.
// This package is currently not wired into app routing, but it must compile.
type ModuleHandler struct {
	manager *ModuleManager
}

func NewModuleHandler(manager *ModuleManager) *ModuleHandler {
	return &ModuleHandler{manager: manager}
}

func (h *ModuleHandler) ListModules(c *gin.Context) {
	modules := h.manager.GetRegistry().GetAllModules()

	infos := make([]*ModuleInfo, 0, len(modules))
	for _, m := range modules {
		infos = append(infos, m.GetInfo())
	}
	response.Success(c, infos)
}

func (h *ModuleHandler) GetModule(c *gin.Context) {
	moduleID := c.Param("id")
	m, err := h.manager.GetRegistry().GetModule(moduleID)
	if err != nil {
		response.NotFound(c, "MODULE_NOT_FOUND", "Module not found")
		return
	}
	response.Success(c, m.GetInfo())
}

func (h *ModuleHandler) EnableModule(c *gin.Context) {
	moduleID := c.Param("id")
	if err := h.manager.EnableModule(moduleID); err != nil {
		response.InternalError(c, "ENABLE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Module enabled successfully"})
}

func (h *ModuleHandler) DisableModule(c *gin.Context) {
	moduleID := c.Param("id")
	if err := h.manager.DisableModule(moduleID); err != nil {
		response.InternalError(c, "DISABLE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Module disabled successfully"})
}

func (h *ModuleHandler) LoadModule(c *gin.Context) {
	// Reserved for future: dynamic module loading (from path/url).
	response.Success(c, gin.H{"message": "Not implemented"})
}

func (h *ModuleHandler) UnloadModule(c *gin.Context) {
	moduleID := c.Param("id")
	if err := h.manager.UnloadModule(moduleID); err != nil {
		response.InternalError(c, "UNLOAD_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Module unloaded successfully"})
}

func (h *ModuleHandler) GetModuleRoutes(c *gin.Context) {
	moduleID := c.Param("id")
	m, err := h.manager.GetRegistry().GetModule(moduleID)
	if err != nil {
		response.NotFound(c, "MODULE_NOT_FOUND", "Module not found")
		return
	}
	response.Success(c, m.GetRoutes())
}

func (h *ModuleHandler) GetModulePermissions(c *gin.Context) {
	moduleID := c.Param("id")
	m, err := h.manager.GetRegistry().GetModule(moduleID)
	if err != nil {
		response.NotFound(c, "MODULE_NOT_FOUND", "Module not found")
		return
	}
	response.Success(c, m.GetPermissions())
}

func (h *ModuleHandler) GetAllRoutes(c *gin.Context) {
	response.Success(c, h.manager.GetRegistry().GetRoutes())
}

func (h *ModuleHandler) GetAllPermissions(c *gin.Context) {
	response.Success(c, h.manager.GetRegistry().GetPermissions())
}

func (h *ModuleHandler) GetDependencyGraph(c *gin.Context) {
	response.Success(c, h.manager.GetDependencyGraph())
}

func (h *ModuleHandler) CheckModuleDependencies(c *gin.Context) {
	moduleID := c.Param("id")
	if err := h.manager.CheckModuleDependencies(moduleID); err != nil {
		response.InternalError(c, "DEPENDENCY_CHECK_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Dependencies satisfied"})
}

func (h *ModuleHandler) CheckModuleHealth(c *gin.Context) {
	moduleID := c.Param("id")
	m, err := h.manager.GetRegistry().GetModule(moduleID)
	if err != nil {
		response.NotFound(c, "MODULE_NOT_FOUND", "Module not found")
		return
	}

	if err := m.CheckHealth(c.Request.Context()); err != nil {
		response.InternalError(c, "HEALTH_CHECK_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"status": "healthy"})
}

func (h *ModuleHandler) InstallModule(c *gin.Context) {
	// Reserved for future: download/install module packages.
	response.Success(c, gin.H{"message": "Not implemented"})
}

func (h *ModuleHandler) UninstallModule(c *gin.Context) {
	moduleID := c.Param("id")
	if err := h.manager.DisableModule(moduleID); err != nil {
		response.InternalError(c, "DISABLE_FAILED", err.Error())
		return
	}
	if err := h.manager.UnloadModule(moduleID); err != nil {
		response.InternalError(c, "UNLOAD_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Module uninstalled successfully"})
}

func (h *ModuleHandler) GetModuleTypes(c *gin.Context) {
	types := []ModuleType{
		ModuleTypeSystem,
		ModuleTypeBusiness,
		ModuleTypePlugin,
		ModuleTypeExtension,
	}
	response.Success(c, types)
}

func (h *ModuleHandler) GetModuleStatuses(c *gin.Context) {
	statuses := []ModuleStatus{
		ModuleStatusDisabled,
		ModuleStatusEnabled,
		ModuleStatusError,
	}
	response.Success(c, statuses)
}

// RegisterModuleRoutes registers module-management routes under `router`.
func RegisterModuleRoutes(router *gin.RouterGroup, handler *ModuleHandler) {
	modules := router.Group("/modules")
	{
		modules.GET("", handler.ListModules)
		modules.GET("/:id", handler.GetModule)
		modules.POST("/:id/enable", handler.EnableModule)
		modules.POST("/:id/disable", handler.DisableModule)
		modules.POST("/load", handler.LoadModule)
		modules.DELETE("/:id", handler.UnloadModule)

		modules.POST("/install", handler.InstallModule)
		modules.DELETE("/:id/uninstall", handler.UninstallModule)

		modules.GET("/:id/routes", handler.GetModuleRoutes)
		modules.GET("/:id/permissions", handler.GetModulePermissions)
		modules.GET("/routes", handler.GetAllRoutes)
		modules.GET("/permissions", handler.GetAllPermissions)

		modules.GET("/:id/dependencies/check", handler.CheckModuleDependencies)
		modules.GET("/:id/health", handler.CheckModuleHealth)
		modules.GET("/dependency-graph", handler.GetDependencyGraph)

		modules.GET("/types", handler.GetModuleTypes)
		modules.GET("/statuses", handler.GetModuleStatuses)
	}
}

// ModuleMiddleware attaches a matched module route (if any) to the gin context.
func ModuleMiddleware(manager *ModuleManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		routes := manager.GetRegistry().GetRoutes()

		for _, moduleRoutes := range routes {
			for _, route := range moduleRoutes {
				if route.Path == path && route.Method == c.Request.Method {
					c.Set("module_route", route)
					c.Next()
					return
				}
			}
		}

		c.Next()
	}
}


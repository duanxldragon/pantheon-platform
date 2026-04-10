package tenant

import (
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/middleware"
)

// TenantRouter registers tenant module routes.
type TenantRouter struct {
	handler *TenantHandler
}

// NewTenantRouter creates a tenant router.
func NewTenantRouter(handler *TenantHandler) *TenantRouter {
	return &TenantRouter{handler: handler}
}

// RegisterRoutes registers tenant routes on the engine.
func (r *TenantRouter) RegisterRoutes(router *gin.Engine, authMiddleware, tenantMiddleware gin.HandlerFunc) {
	r.registerRoutes(router.Group("/api/v1/tenants"), authMiddleware, tenantMiddleware)
}

func (r *TenantRouter) registerRoutes(tenant *gin.RouterGroup, authMiddleware, tenantMiddleware gin.HandlerFunc) {
	{
		tenant.GET("/status", r.handler.GetStatus)

		protected := tenant.Group("")
		protected.Use(authMiddleware, tenantMiddleware)
		{
			protected.POST("/register", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.RegisterTenant)
			protected.POST("/test-connection", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.TestConnection)
			protected.POST("/setup", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.SetupDatabase)
			protected.POST("/:id/setup", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.SetupDatabaseForTenant)
			protected.GET("/current", r.handler.GetCurrentTenant)
			protected.GET("/list", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.ListTenants)
			protected.PUT("/:id", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.UpdateTenant)
			protected.POST("/switch/:id", r.handler.SwitchTenant)
			protected.PUT("/:id/activate", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.ActivateTenant)
			protected.PUT("/:id/suspend", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.SuspendTenant)
			protected.DELETE("/:id", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.DeleteTenant)
			protected.GET("/:id/quotas", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.ListTenantQuotas)
			protected.PUT("/:id/quotas", middleware.RequirePermission("/api/v1/tenants/*", "*"), r.handler.UpsertTenantQuotas)
		}
	}
}

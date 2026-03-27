package tenant

import (
	"github.com/gin-gonic/gin"
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
func (r *TenantRouter) RegisterRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc) {
	r.registerRoutes(router.Group("/api/v1/tenants"), authMiddleware)
}

func (r *TenantRouter) registerRoutes(tenant *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	{
		tenant.POST("/register", r.handler.RegisterTenant)
		tenant.GET("/status", r.handler.GetStatus)
		tenant.POST("/test-connection", r.handler.TestConnection)

		protected := tenant.Group("")
		protected.Use(authMiddleware)
		{
			protected.POST("/setup", r.handler.SetupDatabase)
			protected.POST("/:id/setup", r.handler.SetupDatabaseForTenant)
			protected.GET("/current", r.handler.GetCurrentTenant)
			protected.GET("/list", r.handler.ListTenants)
			protected.PUT("/:id", r.handler.UpdateTenant)
			protected.POST("/switch/:id", r.handler.SwitchTenant)
			protected.PUT("/:id/activate", r.handler.ActivateTenant)
			protected.PUT("/:id/suspend", r.handler.SuspendTenant)
			protected.DELETE("/:id", r.handler.DeleteTenant)
			protected.GET("/:id/quotas", r.handler.ListTenantQuotas)
			protected.PUT("/:id/quotas", r.handler.UpsertTenantQuotas)
		}
	}
}

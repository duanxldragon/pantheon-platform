package middleware

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"pantheon-platform/backend/internal/config"
	"pantheon-platform/backend/internal/shared/database"
)

// Tenant resolves tenant identity and injects tenant DB context.
func Tenant(dbManager *database.Manager, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantIDStr := c.GetHeader("X-Tenant-ID")

		if tenantIDStr == "" {
			if tid, exists := c.Get("tenant_id"); exists {
				tenantIDStr = tid.(string)
			}
		}

		if tenantIDStr == "" {
			if cfg.IsPrivateSingleTenantMode() && cfg.DefaultTenantID != "" {
				tenantIDStr = cfg.DefaultTenantID
			}
			if !cfg.EnableMultiTenant {
				c.Next()
				return
			}
			if ShouldSkipAuthorization(c.Request.URL.Path) {
				c.Next()
				return
			}
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    "TENANT_NOT_FOUND",
				"message": "Tenant identification is required",
			})
			return
		}

		tenantID, err := uuid.Parse(tenantIDStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"code":    "INVALID_TENANT_ID",
				"message": "Invalid tenant ID format",
			})
			return
		}

		tenantDB := dbManager.GetTenantDB(tenantID)
		if tenantDB == nil {
			if cfg.DefaultTenantID != "" && tenantID.String() == cfg.DefaultTenantID {
				c.Set("tenant_id", tenantID.String())
				ctx := c.Request.Context()
				ctx = context.WithValue(ctx, "tenant_id", tenantID.String())
				c.Request = c.Request.WithContext(ctx)
				c.Next()
				return
			}

			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"code":    "TENANT_DB_NOT_READY",
				"message": "Tenant database is not ready or configured",
			})
			return
		}

		c.Set("tenant_db", tenantDB)
		c.Set("tenant_id", tenantID.String())

		ctx := c.Request.Context()
		ctx = context.WithValue(ctx, "tenant_id", tenantID.String())
		ctx = context.WithValue(ctx, "tenant_db", tenantDB)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"pantheon-platform/backend/internal/config"
	"pantheon-platform/backend/internal/shared/database"
)

// TenantAccessChecker validates whether one authenticated user can access a tenant context.
type TenantAccessChecker interface {
	CheckUserTenantAccess(ctx context.Context, userID, tenantID string) (bool, error)
}

// Tenant resolves tenant identity and injects tenant DB context.
func Tenant(dbManager *database.Manager, cfg *config.Config, checker TenantAccessChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		authTenantID := strings.TrimSpace(c.GetString("tenant_id"))
		headerTenantID := strings.TrimSpace(c.GetHeader("X-Tenant-ID"))
		tenantIDStr := authTenantID

		if authTenantID != "" && headerTenantID != "" && headerTenantID != authTenantID {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    "TENANT_CONTEXT_MISMATCH",
				"message": "Tenant header does not match the authenticated tenant context",
			})
			return
		}

		if tenantIDStr == "" {
			tenantIDStr = headerTenantID
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

		if authTenantID == "" && headerTenantID != "" && checker != nil {
			userID := strings.TrimSpace(c.GetString("user_id"))
			if userID != "" {
				allowed, err := checker.CheckUserTenantAccess(c.Request.Context(), userID, tenantIDStr)
				if err != nil {
					c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
						"code":    "TENANT_ACCESS_CHECK_FAILED",
						"message": "Failed to verify tenant access",
					})
					return
				}
				if !allowed {
					c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
						"code":    "TENANT_ACCESS_DENIED",
						"message": "You do not have access to the requested tenant",
					})
					return
				}
			}
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

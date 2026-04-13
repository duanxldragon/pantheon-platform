package auth

import (
	"pantheon-platform/backend/internal/shared/cache"
	sharedmiddleware "pantheon-platform/backend/internal/shared/middleware"

	"github.com/gin-gonic/gin"
)

// NewUnifiedAuthMiddleware accepts either Bearer JWT or X-API-Key credentials.
func NewUnifiedAuthMiddleware(redisClient *cache.RedisClient, authService AuthService) gin.HandlerFunc {
	jwtAuth := sharedmiddleware.Auth(redisClient)
	apiKeyAuth := ApiKeyAuth(authService)

	return func(c *gin.Context) {
		if c.GetHeader("X-API-Key") != "" {
			apiKeyAuth(c)
			return
		}

		jwtAuth(c)
	}
}

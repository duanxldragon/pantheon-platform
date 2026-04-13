package auth

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ApiKeyAuth validates API key from X-API-Key header and injects user info into context.
func ApiKeyAuth(authService AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "MISSING_API_KEY",
				"message": "X-API-Key header is required",
			})
			return
		}

		// Validate API key
		ctx := context.WithValue(c.Request.Context(), "client_ip", c.ClientIP())
		authResult, err := authService.ValidateApiKey(ctx, apiKey)
		if err != nil {
			statusCode := http.StatusUnauthorized
			code := "INVALID_API_KEY"
			message := "Invalid or expired API key"
			switch {
			case errors.Is(err, ErrAPIKeyIPNotAllowed):
				statusCode = http.StatusForbidden
				code = "API_KEY_IP_NOT_ALLOWED"
				message = "API key is not allowed from this IP"
			case errors.Is(err, ErrAPIKeyRateLimited):
				statusCode = http.StatusTooManyRequests
				code = "API_KEY_RATE_LIMITED"
				message = "API key rate limit exceeded"
			}
			c.AbortWithStatusJSON(statusCode, gin.H{
				"code":    code,
				"message": message,
			})
			return
		}

		// Set user context
		c.Set("user_id", authResult.UserID)
		c.Set("auth_type", authResult.AuthType)
		c.Set("api_key_id", authResult.KeyID)
		c.Set("api_key_permissions", authResult.Permissions)
		ctx = context.WithValue(ctx, "user_id", authResult.UserID)
		ctx = context.WithValue(ctx, "auth_type", authResult.AuthType)
		ctx = context.WithValue(ctx, "api_key_id", authResult.KeyID)
		ctx = context.WithValue(ctx, "api_key_permissions", authResult.Permissions)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

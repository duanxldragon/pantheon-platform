package auth

import (
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
		userID, err := authService.ValidateApiKey(c.Request.Context(), apiKey)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "INVALID_API_KEY",
				"message": "Invalid or expired API key",
			})
			return
		}

		// Set user context
		c.Set("user_id", userID)
		c.Set("auth_type", "api_key")

		c.Next()
	}
}

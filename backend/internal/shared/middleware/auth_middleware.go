package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"pantheon-platform/backend/internal/shared/cache"
)

// Claims defines the JWT claims we care about.
type Claims struct {
	UserID      string `json:"user_id"`
	Username    string `json:"username"`
	TenantID    string `json:"tenant_id,omitempty"`
	AuthVersion int64  `json:"auth_version,omitempty"`
	jwt.RegisteredClaims
}

var jwtSecret []byte

// SetJWTSecret sets the JWT secret used for token validation.
func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}

// Auth validates JWT and injects user/tenant info into the context.
// If Redis is configured, it also checks the session token (jti) exists.
func Auth(redisClient *cache.RedisClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "MISSING_TOKEN",
				"message": "Authorization header is required",
			})
			return
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "INVALID_TOKEN_FORMAT",
				"message": "Authorization header must start with 'Bearer '",
			})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		secret := jwtSecret
		if len(secret) == 0 {
			secret = []byte("change-this-secret-in-production")
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return secret, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "INVALID_TOKEN",
				"message": "Invalid or expired token",
			})
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "INVALID_TOKEN",
				"message": "Invalid token claims",
			})
			return
		}

		if redisClient != nil && claims.ID != "" {
			sessionKey := fmt.Sprintf("auth:session:%s:%s", claims.UserID, claims.ID)
			exists, err := redisClient.Exists(c.Request.Context(), sessionKey)
			if err != nil || !exists {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"code":    "SESSION_EXPIRED",
					"message": "Session has expired or been invalidated",
				})
				return
			}
		}
		if redisClient != nil && claims.UserID != "" && claims.IssuedAt != nil {
			revokedKey := fmt.Sprintf("auth:revoked_after:%s", claims.UserID)
			raw, err := redisClient.Get(c.Request.Context(), revokedKey)
			if err == nil && raw != "" {
				if ts, err := strconv.ParseInt(raw, 10, 64); err == nil {
					if claims.IssuedAt.Time.Unix() <= ts {
						c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
							"code":    "SESSION_REVOKED",
							"message": "Session has been revoked",
						})
						return
					}
				}
			}
		}
		if redisClient != nil && claims.UserID != "" {
			versionKey := fmt.Sprintf("auth:version:%s", claims.UserID)
			raw, err := redisClient.Get(c.Request.Context(), versionKey)
			if err == nil && raw != "" {
				if version, err := strconv.ParseInt(raw, 10, 64); err == nil && version > claims.AuthVersion {
					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
						"code":    "AUTH_VERSION_MISMATCH",
						"message": "Authorization has changed, token refresh required",
					})
					return
				}
			}
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("jti", claims.ID)
		if claims.TenantID != "" {
			c.Set("tenant_id", claims.TenantID)
		}

		c.Next()
	}
}

// GetUserID reads the user ID from gin context.
func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	s, ok := userID.(string)
	return s, ok
}

// GetTenantID reads the tenant ID from gin context.
func GetTenantID(c *gin.Context) (string, bool) {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		return "", false
	}
	s, ok := tenantID.(string)
	return s, ok
}

package middleware

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/config"
)

var defaultCORSExposeHeaders = []string{"Content-Type", "Content-Length", "X-Request-ID", "X-Tenant-ID"}

// CORS handles cross-origin requests using application configuration.
func CORS(cfg *config.Config) gin.HandlerFunc {
	allowedOrigins := []string{"http://localhost:3000", "http://localhost:5173"}
	allowedMethods := []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"}
	allowedHeaders := []string{"Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "Accept", "Accept-Language", "Origin", "Cache-Control", "X-Requested-With", "X-Request-ID", "X-Tenant-ID"}
	allowCredentials := true
	optionsMaxAge := 86400

	if cfg != nil {
		if len(cfg.AllowedOrigins) > 0 {
			allowedOrigins = cfg.AllowedOrigins
		}
		if len(cfg.AllowedMethods) > 0 {
			allowedMethods = cfg.AllowedMethods
		}
		if len(cfg.AllowedHeaders) > 0 {
			allowedHeaders = cfg.AllowedHeaders
		}
		allowCredentials = cfg.AllowCredentials
		if cfg.OptionsMaxAge > 0 {
			optionsMaxAge = cfg.OptionsMaxAge
		}
	}

	return func(c *gin.Context) {
		origin := strings.TrimSpace(c.GetHeader("Origin"))
		if origin != "" {
			if matchedOrigin, ok := matchAllowedOrigin(origin, allowedOrigins, allowCredentials); ok {
				c.Writer.Header().Set("Access-Control-Allow-Origin", matchedOrigin)
				c.Writer.Header().Add("Vary", "Origin")
			} else if c.Request.Method == http.MethodOptions {
				c.AbortWithStatus(http.StatusForbidden)
				return
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers", strings.Join(allowedHeaders, ", "))
		c.Writer.Header().Set("Access-Control-Expose-Headers", strings.Join(defaultCORSExposeHeaders, ", "))
		c.Writer.Header().Set("Access-Control-Allow-Methods", strings.Join(allowedMethods, ", "))
		c.Writer.Header().Set("Access-Control-Max-Age", strconv.Itoa(optionsMaxAge))
		if allowCredentials {
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func matchAllowedOrigin(origin string, allowedOrigins []string, allowCredentials bool) (string, bool) {
	if origin == "" {
		return "", false
	}

	for _, allowedOrigin := range allowedOrigins {
		allowedOrigin = strings.TrimSpace(allowedOrigin)
		if allowedOrigin == "" {
			continue
		}
		if allowedOrigin == "*" {
			if allowCredentials {
				return origin, true
			}
			return "*", true
		}
		if strings.EqualFold(allowedOrigin, origin) {
			return origin, true
		}
	}

	return "", false
}

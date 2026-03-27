package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeadersConfig represents security headers configuration
type SecurityHeadersConfig struct {
	EnableCSP         bool `json:"enable_csp"`          // Enable Content Security Policy
	EnableHSTS        bool `json:"enable_hsts"`         // Enable HTTP Strict Transport Security
	EnableXFrame      bool `json:"enable_xframe"`       // Enable X-Frame-Options
	EnableXSS         bool `json:"enable_xss"`          // Enable X-XSS-Protection
	EnableContentType bool `json:"enable_content_type"` // Enable X-Content-Type-Options
	EnableReferrer    bool `json:"enable_referrer"`     // Enable Referrer-Policy
}

// DefaultSecurityHeadersConfig returns default security headers configuration
func DefaultSecurityHeadersConfig() SecurityHeadersConfig {
	return SecurityHeadersConfig{
		EnableCSP:         true,
		EnableHSTS:        true,
		EnableXFrame:      true,
		EnableXSS:         true,
		EnableContentType: true,
		EnableReferrer:    true,
	}
}

// SecurityHeadersMiddleware adds security headers to responses
type SecurityHeadersMiddleware struct {
	config SecurityHeadersConfig
}

// NewSecurityHeadersMiddleware creates a new security headers middleware
func NewSecurityHeadersMiddleware(config SecurityHeadersConfig) *SecurityHeadersMiddleware {
	return &SecurityHeadersMiddleware{
		config: config,
	}
}

// Middleware returns Gin middleware handler
func (m *SecurityHeadersMiddleware) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Content Security Policy
		if m.config.EnableCSP {
			c.Header("Content-Security-Policy",
				"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'")
		}

		// HTTP Strict Transport Security
		if m.config.EnableHSTS {
			c.Header("Strict-Transport-Security",
				"max-age=31536000; includeSubDomains; preload")
		}

		// X-Frame-Options
		if m.config.EnableXFrame {
			c.Header("X-Frame-Options", "DENY")
		}

		// X-XSS-Protection
		if m.config.EnableXSS {
			c.Header("X-XSS-Protection", "1; mode=block")
		}

		// X-Content-Type-Options
		if m.config.EnableContentType {
			c.Header("X-Content-Type-Options", "nosniff")
		}

		// Referrer-Policy
		if m.config.EnableReferrer {
			c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		}

		// X-Download-Options
		c.Header("X-Download-Options", "noopen")

		// Permissions-Policy
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		c.Next()
	}
}

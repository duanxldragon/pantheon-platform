package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"pantheon-platform/backend/internal/shared/response"
)

// CSRFConfig represents CSRF middleware configuration
type CSRFConfig struct {
	TokenLength  int    `json:"token_length"`  // Token length in bytes
	CookieName   string `json:"cookie_name"`   // Cookie name
	HeaderName   string `json:"header_name"`   // Header name for CSRF token
	SecureCookie bool   `json:"secure_cookie"` // Cookie Secure flag
	SameSite     string `json:"same_site"`     // SameSite attribute
}

// DefaultCSRFConfig returns default CSRF configuration
func DefaultCSRFConfig() CSRFConfig {
	return CSRFConfig{
		TokenLength:  32,
		CookieName:   "csrf_token",
		HeaderName:   "X-CSRF-Token",
		SecureCookie: false,
		SameSite:     "Lax",
	}
}

// CSRFMiddleware represents CSRF middleware
type CSRFMiddleware struct {
	config CSRFConfig
}

// NewCSRFMiddleware creates a new CSRF middleware
func NewCSRFMiddleware(config CSRFConfig) *CSRFMiddleware {
	return &CSRFMiddleware{
		config: config,
	}
}

// Middleware returns Gin middleware handler
func (m *CSRFMiddleware) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip CSRF validation for GET, HEAD, OPTIONS
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			// Reuse token if present to avoid rotating on every GET request.
			token, err := c.Cookie(m.config.CookieName)
			if err != nil || token == "" {
				token = m.GenerateToken()
			}
			c.Set("csrf_token", token)
			c.SetSameSite(m.getSameSiteMode())
			c.SetCookie(
				m.config.CookieName,
				token,
				3600, // 1 hour
				"/",
				"",
				m.config.SecureCookie,
				true, // HttpOnly
			)
			c.Next()
			return
		}

		// Validate CSRF token for state-changing requests
		tokenInHeader := c.GetHeader(m.config.HeaderName)
		tokenInCookie, err := c.Cookie(m.config.CookieName)

		if err != nil || tokenInHeader == "" || tokenInCookie == "" || !constantTimeEquals(tokenInHeader, tokenInCookie) {
			response.Unauthorized(c, "INVALID_CSRF_TOKEN", "CSRF token validation failed")
			c.Abort()
			return
		}

		c.Next()
	}
}

// GenerateToken generates a random CSRF token
func (m *CSRFMiddleware) GenerateToken() string {
	bytes := make([]byte, m.config.TokenLength)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to UUID if crypto/rand fails
		return uuid.New().String()
	}
	return hex.EncodeToString(bytes)
}

// ValidateCSRF validates CSRF token from request
func (m *CSRFMiddleware) ValidateCSRF(c *gin.Context) bool {
	tokenInHeader := c.GetHeader(m.config.HeaderName)
	tokenInCookie, err := c.Cookie(m.config.CookieName)

	if err != nil || tokenInHeader == "" || tokenInCookie == "" {
		return false
	}

	return constantTimeEquals(tokenInHeader, tokenInCookie)
}

// GetCSRFToken gets CSRF token from context
func (m *CSRFMiddleware) GetCSRFToken(c *gin.Context) string {
	if token, exists := c.Get("csrf_token"); exists {
		return token.(string)
	}
	return ""
}

func constantTimeEquals(left, right string) bool {
	if len(left) != len(right) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(left), []byte(right)) == 1
}

// GetCSRFTokenHandler returns a handler that provides CSRF token
func (m *CSRFMiddleware) GetCSRFTokenHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := m.GenerateToken()
		c.SetSameSite(m.getSameSiteMode())
		c.SetCookie(
			m.config.CookieName,
			token,
			3600, // 1 hour
			"/",
			"",
			m.config.SecureCookie,
			true, // HttpOnly
		)
		response.Success(c, gin.H{
			"csrf_token": token,
		})
	}
}

// getSameSiteMode converts string to http.SameSite
func (m *CSRFMiddleware) getSameSiteMode() http.SameSite {
	switch m.config.SameSite {
	case "Strict":
		return http.SameSiteStrictMode
	case "None":
		return http.SameSiteNoneMode
	case "Lax", "":
		return http.SameSiteLaxMode
	default:
		return http.SameSiteDefaultMode
	}
}

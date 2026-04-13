package middleware

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

// AuthorizationServiceInterface defines authz capabilities required by middleware.
type AuthorizationServiceInterface interface {
	CheckPermission(ctx context.Context, userID, resource, action string) bool
	GetRolesForUser(ctx context.Context, userID string) ([]string, error)
	GetUserPermissions(ctx context.Context, userID string) ([]string, error)
	GetDataScopeFilter(ctx context.Context, userID, resource string) (map[string]interface{}, error)
}

// GlobalAuthService is the globally shared authz service used by helper middleware.
var GlobalAuthService AuthorizationServiceInterface

// Authz enforces Casbin-style authorization for the current request.
func Authz(authService AuthorizationServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			c.Abort()
			return
		}

		path := c.Request.URL.Path
		method := strings.ToLower(c.Request.Method)

		if ShouldSkipAuthorization(path) {
			c.Next()
			return
		}

		if !authService.CheckPermission(c.Request.Context(), userID, path, method) {
			response.Forbidden(c, "PERMISSION_DENIED", "Permission denied")
			c.Abort()
			return
		}
		if !allowByAPIKeyScope(c, path, method) {
			response.Forbidden(c, "API_KEY_SCOPE_DENIED", "API key scope denied")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermission builds middleware that requires one explicit permission.
func RequirePermission(resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if GlobalAuthService == nil {
			c.Next()
			return
		}

		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			c.Abort()
			return
		}

		allowed := GlobalAuthService.CheckPermission(c.Request.Context(), userID, resource, action)
		if !allowed && strings.Contains(resource, "*") {
			allowed = GlobalAuthService.CheckPermission(c.Request.Context(), userID, c.Request.URL.Path, action)
		}

		if !allowed {
			response.Forbidden(c, "PERMISSION_DENIED", "Permission denied")
			c.Abort()
			return
		}
		if !allowByAPIKeyScope(c, c.Request.URL.Path, strings.ToLower(c.Request.Method)) &&
			!allowByAPIKeyScope(c, resource, action) {
			response.Forbidden(c, "API_KEY_SCOPE_DENIED", "API key scope denied")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole builds middleware that requires one of the specified roles.
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if GlobalAuthService == nil {
			c.Next()
			return
		}

		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			c.Abort()
			return
		}

		userRoles, err := GlobalAuthService.GetRolesForUser(c.Request.Context(), userID)
		if err != nil {
			response.InternalError(c, "AUTH_SERVICE_ERROR", err.Error())
			c.Abort()
			return
		}

		hasRole := false
		for _, role := range roles {
			for _, userRole := range userRoles {
				if role == userRole {
					hasRole = true
					break
				}
			}
			if hasRole {
				break
			}
		}

		if !hasRole {
			response.Forbidden(c, "ROLE_DENIED", "Role denied")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireDataScope computes the caller's data-scope filter and injects it into request context.
func RequireDataScope(resource string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if GlobalAuthService == nil {
			c.Next()
			return
		}

		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			c.Abort()
			return
		}

		filter, err := GlobalAuthService.GetDataScopeFilter(c.Request.Context(), userID, resource)
		if err != nil {
			response.InternalError(c, "DATA_SCOPE_ERROR", err.Error())
			c.Abort()
			return
		}

		if filter != nil {
			c.Set("data_scope_filter", filter)
			ctx := context.WithValue(c.Request.Context(), "data_scope_filter", filter)
			c.Request = c.Request.WithContext(ctx)
		}

		c.Next()
	}
}

// SkipAuthPaths contains paths that do not require authentication.
var SkipAuthPaths = map[string]bool{
	"/health":              true,
	"/api/v1/auth/login":   true,
	"/api/v1/auth/refresh": true,
}

// SkipAuthorizationPaths contains paths that bypass authorization checks.
var SkipAuthorizationPaths = map[string]bool{
	"/health":                  true,
	"/api/v1/auth/login":       true,
	"/api/v1/auth/refresh":     true,
	"/api/v1/auth/logout":      true,
	"/api/v1/auth/current":     true,
	"/api/v1/users/current":    true,
	"/api/v1/user/permissions": true,
}

// ShouldSkipAuth reports whether a path should bypass authentication.
func ShouldSkipAuth(path string) bool {
	return SkipAuthPaths[path] || strings.HasPrefix(path, "/api/v1/auth/")
}

// ShouldSkipAuthorization reports whether a path should bypass authorization.
func ShouldSkipAuthorization(path string) bool {
	return SkipAuthorizationPaths[path] ||
		strings.HasPrefix(path, "/api/v1/auth/") ||
		strings.HasPrefix(path, "/api/v1/users/current")
}

func allowByAPIKeyScope(c *gin.Context, resource, action string) bool {
	if c == nil || c.GetString("auth_type") != "api_key" {
		return true
	}

	permissions := readAPIKeyPermissions(c)
	if len(permissions) == 0 {
		return false
	}

	resource = strings.TrimSpace(resource)
	action = strings.TrimSpace(strings.ToLower(action))

	for _, permission := range permissions {
		if matchesAPIKeyPermission(permission, resource, action) {
			return true
		}
	}

	return false
}

func readAPIKeyPermissions(c *gin.Context) []string {
	if c == nil {
		return nil
	}

	raw, exists := c.Get("api_key_permissions")
	if !exists {
		return nil
	}

	permissions, ok := raw.([]string)
	if !ok {
		return nil
	}

	return permissions
}

func matchesAPIKeyPermission(permission, resource, action string) bool {
	permission = strings.TrimSpace(permission)
	if permission == "" {
		return false
	}

	switch strings.ToLower(permission) {
	case "*", "*:*":
		return true
	case "read", "readonly":
		return isReadAction(action)
	case "write":
		return isWriteAction(action)
	}

	parts := strings.SplitN(permission, ":", 2)
	if len(parts) == 2 && strings.HasPrefix(parts[0], "/") {
		return matchScopedResource(parts[0], resource) && matchScopedAction(parts[1], action)
	}

	if strings.HasPrefix(permission, "/") {
		return matchScopedResource(permission, resource)
	}

	return false
}

func matchScopedResource(pattern, resource string) bool {
	pattern = strings.TrimSpace(pattern)
	resource = strings.TrimSpace(resource)
	if pattern == "*" {
		return true
	}
	if pattern == resource {
		return true
	}
	if strings.HasSuffix(pattern, "*") {
		return strings.HasPrefix(resource, strings.TrimSuffix(pattern, "*"))
	}
	return false
}

func matchScopedAction(pattern, action string) bool {
	pattern = strings.TrimSpace(strings.ToLower(pattern))
	action = strings.TrimSpace(strings.ToLower(action))

	switch pattern {
	case "", "*":
		return true
	case "read", "readonly":
		return isReadAction(action)
	case "write":
		return isWriteAction(action)
	default:
		return pattern == action
	}
}

func isReadAction(action string) bool {
	switch strings.ToLower(strings.TrimSpace(action)) {
	case "get", "head", "options":
		return true
	default:
		return false
	}
}

func isWriteAction(action string) bool {
	switch strings.ToLower(strings.TrimSpace(action)) {
	case "post", "put", "patch", "delete":
		return true
	default:
		return false
	}
}

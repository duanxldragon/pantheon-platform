package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

type stubAuthorizationService struct {
	checks []permissionCheck
}

type allowAllAuthorizationService struct{}

type permissionCheck struct {
	userID   string
	resource string
	action   string
}

func (s *stubAuthorizationService) CheckPermission(_ context.Context, userID, resource, action string) bool {
	s.checks = append(s.checks, permissionCheck{
		userID:   userID,
		resource: resource,
		action:   action,
	})

	return resource == "/api/v1/tenants/list" && action == "*"
}

func (*stubAuthorizationService) GetRolesForUser(context.Context, string) ([]string, error) {
	return nil, nil
}

func (*stubAuthorizationService) GetUserPermissions(context.Context, string) ([]string, error) {
	return nil, nil
}

func (*stubAuthorizationService) GetDataScopeFilter(context.Context, string, string) (map[string]interface{}, error) {
	return nil, nil
}

func (allowAllAuthorizationService) CheckPermission(context.Context, string, string, string) bool {
	return true
}

func (allowAllAuthorizationService) GetRolesForUser(context.Context, string) ([]string, error) {
	return nil, nil
}

func (allowAllAuthorizationService) GetUserPermissions(context.Context, string) ([]string, error) {
	return nil, nil
}

func (allowAllAuthorizationService) GetDataScopeFilter(context.Context, string, string) (map[string]interface{}, error) {
	return nil, nil
}

func TestRequirePermissionRetriesWildcardResourceWithRequestPath(t *testing.T) {
	gin.SetMode(gin.TestMode)

	authService := &stubAuthorizationService{}
	previous := GlobalAuthService
	GlobalAuthService = authService
	defer func() {
		GlobalAuthService = previous
	}()

	recorder := httptest.NewRecorder()
	calledNext := false
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", "user-1")
		c.Next()
	})
	router.GET("/api/v1/tenants/list", RequirePermission("/api/v1/tenants/*", "*"), func(c *gin.Context) {
		calledNext = true
		c.Status(http.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/tenants/list", nil)
	router.ServeHTTP(recorder, req)

	if !calledNext {
		t.Fatal("expected middleware to allow request after retrying with the actual path")
	}
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("unexpected status code: %d", recorder.Code)
	}
	if len(authService.checks) != 2 {
		t.Fatalf("expected two permission checks, got %d", len(authService.checks))
	}
	if authService.checks[0].resource != "/api/v1/tenants/*" {
		t.Fatalf("unexpected initial resource: %s", authService.checks[0].resource)
	}
	if authService.checks[1].resource != "/api/v1/tenants/list" {
		t.Fatalf("unexpected retried resource: %s", authService.checks[1].resource)
	}
}

func TestAuthzAllowsAPIKeyWhenScopeMatches(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", "user-1")
		c.Set("auth_type", "api_key")
		c.Set("api_key_permissions", []string{"/api/v1/system/users:get"})
		c.Next()
	})
	router.GET("/api/v1/system/users", Authz(allowAllAuthorizationService{}), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	recorder := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/system/users", nil)
	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", recorder.Code)
	}
}

func TestAuthzRejectsAPIKeyWhenScopeMissing(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", "user-1")
		c.Set("auth_type", "api_key")
		c.Set("api_key_permissions", []string{"/api/v1/system/users:get"})
		c.Next()
	})
	router.DELETE("/api/v1/system/users", Authz(allowAllAuthorizationService{}), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	recorder := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/system/users", nil)
	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", recorder.Code)
	}
}

package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestNewUnifiedAuthMiddlewareAcceptsAPIKey(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(NewUnifiedAuthMiddleware(nil, &stubAuthService{
		validateAPIKeyFn: func(ctx context.Context, apiKey string) (*APIKeyAuthResult, error) {
			if apiKey != "sk_test_value" {
				t.Fatalf("unexpected api key: %s", apiKey)
			}
			if got := ctx.Value("client_ip"); got != "192.0.2.10" {
				t.Fatalf("expected client ip in context, got %#v", got)
			}
			return &APIKeyAuthResult{
				KeyID:       "key-1",
				UserID:      "user-1",
				Permissions: []string{"read"},
				AuthType:    "api_key",
			}, nil
		},
	}))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"user_id":   c.GetString("user_id"),
			"auth_type": c.GetString("auth_type"),
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("X-API-Key", "sk_test_value")
	req.RemoteAddr = "192.0.2.10:12345"
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
	if body := recorder.Body.String(); body == "" || !strings.Contains(body, `"user_id":"user-1"`) || !strings.Contains(body, `"auth_type":"api_key"`) {
		t.Fatalf("unexpected body: %s", body)
	}
}

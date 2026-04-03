package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	systemlog "pantheon-platform/backend/internal/modules/system/log"
	"pantheon-platform/backend/internal/shared/middleware"
)

type stubAuthService struct {
	getCurrentUserFn          func(context.Context, string, string, string) (*CurrentUserResponse, error)
	getLoginAttemptsSummaryFn func(context.Context, string, string) (*LoginAttemptSummary, error)
	unlockAccountFn           func(context.Context, string, string) error
}

func (s *stubAuthService) GetPublicConfig() map[string]interface{} { return nil }
func (s *stubAuthService) Login(context.Context, *LoginRequest) (*LoginResponse, error) {
	return nil, nil
}
func (s *stubAuthService) Logout(context.Context, string, string) error { return nil }
func (s *stubAuthService) ValidateToken(string) (*middleware.Claims, error) {
	return nil, nil
}
func (s *stubAuthService) RefreshToken(context.Context, string) (*RefreshTokenResponse, error) {
	return nil, nil
}
func (s *stubAuthService) GetCurrentUser(ctx context.Context, userID, username, tenantID string) (*CurrentUserResponse, error) {
	if s.getCurrentUserFn != nil {
		return s.getCurrentUserFn(ctx, userID, username, tenantID)
	}
	return nil, nil
}
func (s *stubAuthService) VerifyLogin2FA(context.Context, string, string, string, string) (*LoginResponse, error) {
	return nil, nil
}
func (s *stubAuthService) ListActiveSessions(context.Context, string, string) (*ActiveSessionsResponse, error) {
	return nil, nil
}
func (s *stubAuthService) KickSession(context.Context, string, string) error { return nil }
func (s *stubAuthService) ParseTokenClaims(string) (*middleware.Claims, error) {
	return nil, nil
}
func (s *stubAuthService) CreateApiKey(context.Context, string, string, string) (*ApiKeyResponse, error) {
	return nil, nil
}
func (s *stubAuthService) ListApiKeys(context.Context, string) (*ApiKeyListResponse, error) {
	return nil, nil
}
func (s *stubAuthService) DeleteApiKey(context.Context, string, string) error { return nil }
func (s *stubAuthService) UpdateApiKey(context.Context, string, string, string, string) error {
	return nil
}
func (s *stubAuthService) ValidateApiKey(context.Context, string) (string, error) { return "", nil }
func (s *stubAuthService) GetLoginAttemptsSummary(ctx context.Context, username, tenantCode string) (*LoginAttemptSummary, error) {
	if s.getLoginAttemptsSummaryFn != nil {
		return s.getLoginAttemptsSummaryFn(ctx, username, tenantCode)
	}
	return nil, nil
}
func (s *stubAuthService) UnlockAccount(ctx context.Context, username, tenantCode string) error {
	if s.unlockAccountFn != nil {
		return s.unlockAccountFn(ctx, username, tenantCode)
	}
	return nil
}
func (s *stubAuthService) GetTwoFactorAuthStatus(context.Context, string, string) (*TwoFactorAuthResponse, error) {
	return nil, nil
}
func (s *stubAuthService) EnableTwoFactorAuth(context.Context, string, string) (*TwoFactorAuthResponse, error) {
	return nil, nil
}
func (s *stubAuthService) VerifyAndEnable2FA(context.Context, string, string, string) error {
	return nil
}
func (s *stubAuthService) DisableTwoFactorAuth(context.Context, string, string, string) error {
	return nil
}
func (s *stubAuthService) GenerateNewBackupCodes(context.Context, string, string, int) (*GenerateBackupCodesResponse, error) {
	return nil, nil
}
func (s *stubAuthService) Verify2FACode(context.Context, string, string, string) (*Verify2FAResponse, error) {
	return nil, nil
}
func (s *stubAuthService) GetCurrentUserLoginHistory(context.Context, string, string, int, int) (*systemlog.PageResponse, error) {
	return nil, nil
}
func (s *stubAuthService) GetTenantDB(string) *gorm.DB { return nil }

func TestGetLoginAttemptsRejectsCrossTenantLookup(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var summaryCalled bool
	handler := NewAuthHandler(&stubAuthService{
		getCurrentUserFn: func(context.Context, string, string, string) (*CurrentUserResponse, error) {
			return &CurrentUserResponse{TenantCode: "tenant-a"}, nil
		},
		getLoginAttemptsSummaryFn: func(context.Context, string, string) (*LoginAttemptSummary, error) {
			summaryCalled = true
			return &LoginAttemptSummary{}, nil
		},
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/auth/attempts?username=alice&tenant_code=tenant-b", nil)
	ctx.Set("user_id", "user-1")
	ctx.Set("username", "alice")
	ctx.Set("tenant_id", "tenant-id-a")

	handler.GetLoginAttempts(ctx)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", recorder.Code)
	}
	if summaryCalled {
		t.Fatalf("expected login attempt summary lookup to be blocked")
	}
}

func TestUnlockAccountUsesCurrentTenantCodeWhenTenantCodeOmitted(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var unlockedTenantCode string
	handler := NewAuthHandler(&stubAuthService{
		getCurrentUserFn: func(context.Context, string, string, string) (*CurrentUserResponse, error) {
			return &CurrentUserResponse{TenantCode: "tenant-a"}, nil
		},
		unlockAccountFn: func(_ context.Context, _ string, tenantCode string) error {
			unlockedTenantCode = tenantCode
			return nil
		},
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/unlock", strings.NewReader(`{"username":"alice"}`))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("user_id", "user-1")
	ctx.Set("username", "alice")
	ctx.Set("tenant_id", "tenant-id-a")

	handler.UnlockAccount(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
	if unlockedTenantCode != "tenant-a" {
		t.Fatalf("expected unlock to use current tenant code, got %q", unlockedTenantCode)
	}

	var payload map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected valid json response: %v", err)
	}
	if payload["code"] != float64(0) {
		t.Fatalf("expected success response, got %#v", payload)
	}
}

package user

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

type stubPermissionReader struct {
	perms       []string
	err         error
	calledUser  string
	calledCount int
}

func (s *stubPermissionReader) GetUserPermissions(_ context.Context, userID string) ([]string, error) {
	s.calledUser = userID
	s.calledCount++
	return s.perms, s.err
}

type stubUserService struct {
	getByID func(ctx context.Context, id string) (*UserResponse, error)
}

func (s *stubUserService) Create(context.Context, *UserRequest) (*User, error) { return nil, nil }
func (s *stubUserService) GetByID(ctx context.Context, id string) (*UserResponse, error) {
	if s.getByID != nil {
		return s.getByID(ctx, id)
	}
	return nil, nil
}
func (s *stubUserService) Update(context.Context, string, *UserUpdateRequest) (*User, error) {
	return nil, nil
}
func (s *stubUserService) Delete(context.Context, string) error                       { return nil }
func (s *stubUserService) BatchDelete(context.Context, []string) error                { return nil }
func (s *stubUserService) List(context.Context, *UserListRequest) (*PageResponse, error) {
	return nil, nil
}
func (s *stubUserService) GetByUsername(context.Context, string) (*User, error) { return nil, nil }
func (s *stubUserService) ChangePassword(context.Context, *PasswordUpdateRequest) error {
	return nil
}
func (s *stubUserService) ResetPassword(context.Context, string, string) error { return nil }
func (s *stubUserService) Activate(context.Context, string) error              { return nil }
func (s *stubUserService) Deactivate(context.Context, string) error            { return nil }
func (s *stubUserService) BatchUpdateStatus(context.Context, *UserStatusRequest) error {
	return nil
}
func (s *stubUserService) AssignRole(context.Context, *UserRoleRequest) error { return nil }
func (s *stubUserService) CheckRoleInUse(context.Context, string) (bool, error) {
	return false, nil
}
func (s *stubUserService) GetRoles(context.Context, string) ([]*UserRoleInfo, error) {
	return nil, nil
}

func TestGetPermissionsReturnsNotFoundWhenUserIsOutOfScope(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewUserHandler(&stubUserService{
		getByID: func(context.Context, string) (*UserResponse, error) {
			return nil, errors.New("user not found")
		},
	}, &stubPermissionReader{perms: []string{"perm:a"}}, nil)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodGet, "/users/user-1/permissions", nil)
	ctx.Request = req
	ctx.Params = gin.Params{{Key: "id", Value: "user-1"}}

	handler.GetPermissions(ctx)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}
}

func TestGetPermissionsLoadsPermissionsAfterReadableCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)

	authz := &stubPermissionReader{perms: []string{"perm:a", "perm:b"}}
	handler := NewUserHandler(&stubUserService{
		getByID: func(context.Context, string) (*UserResponse, error) {
			return &UserResponse{ID: "user-1"}, nil
		},
	}, authz, nil)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodGet, "/users/user-1/permissions", nil)
	ctx.Request = req
	ctx.Params = gin.Params{{Key: "id", Value: "user-1"}}

	handler.GetPermissions(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
	if authz.calledCount != 1 || authz.calledUser != "user-1" {
		t.Fatalf("expected permissions lookup for user-1, got user=%s count=%d", authz.calledUser, authz.calledCount)
	}

	var payload map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected valid json response: %v", err)
	}
	data, ok := payload["data"].([]any)
	if !ok || len(data) != 2 {
		t.Fatalf("expected 2 permissions in response, got %#v", payload["data"])
	}
}

func TestUpdateReturnsNotFoundWhenUserIsOutOfScope(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewUserHandler(&stubUserServiceWithErrors{updateErr: ErrUserNotFound}, nil, nil)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPut, "/users/user-1", strings.NewReader(`{"real_name":"Alice"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req
	ctx.Params = gin.Params{{Key: "id", Value: "user-1"}}

	handler.Update(ctx)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}
}

func TestCreateReturnsForbiddenWhenTargetScopeIsDenied(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewUserHandler(&stubUserServiceWithErrors{createErr: ErrUserScopeDenied}, nil, nil)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(`{"username":"alice","real_name":"Alice","email":"alice@example.com","password":"StrongP@ssw0rd","department_id":"dept-x"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	handler.Create(ctx)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", recorder.Code)
	}
}

func TestUpdateReturnsForbiddenWhenTargetScopeIsDenied(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewUserHandler(&stubUserServiceWithErrors{updateErr: ErrUserScopeDenied}, nil, nil)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPut, "/users/user-1", strings.NewReader(`{"department_id":"dept-x"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req
	ctx.Params = gin.Params{{Key: "id", Value: "user-1"}}

	handler.Update(ctx)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", recorder.Code)
	}
}

func TestDeleteReturnsNotFoundWhenUserIsOutOfScope(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewUserHandler(&stubUserServiceWithErrors{deleteErr: ErrUserNotFound}, nil, nil)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodDelete, "/users/user-1", nil)
	ctx.Request = req
	ctx.Params = gin.Params{{Key: "id", Value: "user-1"}}

	handler.Delete(ctx)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}
}

func TestResetPasswordReturnsNotFoundWhenUserIsOutOfScope(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewUserHandler(&stubUserServiceWithErrors{resetPasswordErr: ErrUserNotFound}, nil, nil)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPatch, "/users/user-1/password", strings.NewReader(`{"new_password":"StrongP@ssw0rd"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req
	ctx.Params = gin.Params{{Key: "id", Value: "user-1"}}

	handler.ResetPassword(ctx)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}
}

type stubUserServiceWithErrors struct {
	stubUserService
	createErr        error
	updateErr        error
	deleteErr        error
	resetPasswordErr error
}

func (s *stubUserServiceWithErrors) Create(context.Context, *UserRequest) (*User, error) {
	return nil, s.createErr
}

func (s *stubUserServiceWithErrors) Update(context.Context, string, *UserUpdateRequest) (*User, error) {
	return nil, s.updateErr
}

func (s *stubUserServiceWithErrors) Delete(context.Context, string) error {
	return s.deleteErr
}

func (s *stubUserServiceWithErrors) ResetPassword(context.Context, string, string) error {
	return s.resetPasswordErr
}

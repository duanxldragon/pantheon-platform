package user

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"pantheon-platform/backend/internal/shared/response"
	"pantheon-platform/backend/internal/shared/storage"
)

type PermissionReader interface {
	GetUserPermissions(ctx context.Context, userID string) ([]string, error)
}

// UserHandler implements HTTP handlers for user management.
type UserHandler struct {
	userService     UserService
	authz           PermissionReader
	storageProvider storage.StorageProvider
}

func NewUserHandler(userService UserService, authz PermissionReader, storageProvider storage.StorageProvider) *UserHandler {
	return &UserHandler{
		userService:     userService,
		authz:           authz,
		storageProvider: storageProvider,
	}
}

// Create creates a user.
// @Summary Create User
// @Description Create a system user in the current tenant.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body UserRequest true "User payload"
// @Success 201 {object} userEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users [post]
func (h *UserHandler) Create(c *gin.Context) {
	var req UserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}

	u, err := h.userService.Create(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, ErrUserScopeDenied) {
			response.Forbidden(c, "USER_SCOPE_DENIED", "Permission denied")
			return
		}
		response.InternalError(c, "CREATE_USER_FAILED", err.Error())
		return
	}

	// Return the full DTO (including role IDs/names).
	dto, err := h.userService.GetByID(c.Request.Context(), u.ID.String())
	if err != nil {
		response.Created(c, ToUserResponse(u, nil, nil, req.RoleIDs, []string{}, nil))
		return
	}
	response.Created(c, dto)
}

// GetByID gets user detail by ID.
// @Summary Get User
// @Description Get a user by ID.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Success 200 {object} userEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Router /system/users/{id} [get]
func (h *UserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	dto, err := h.userService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
		return
	}
	response.Success(c, dto)
}

// Update updates a user.
// @Summary Update User
// @Description Update user profile, organization assignments, role bindings, or status.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Param request body UserUpdateRequest true "User update payload"
// @Success 200 {object} userEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users/{id} [put]
func (h *UserHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req UserUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}

	if _, err := h.userService.Update(c.Request.Context(), id, &req); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
			return
		}
		if errors.Is(err, ErrUserScopeDenied) {
			response.Forbidden(c, "USER_SCOPE_DENIED", "Permission denied")
			return
		}
		response.InternalError(c, "UPDATE_USER_FAILED", err.Error())
		return
	}

	dto, err := h.userService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
		return
	}
	response.Success(c, dto)
}

// Delete deletes a user.
// @Summary Delete User
// @Description Delete a user by ID.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Success 200 {object} userMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users/{id} [delete]
func (h *UserHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.userService.Delete(c.Request.Context(), id); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
			return
		}
		response.InternalError(c, "DELETE_USER_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// List lists users.
// @Summary List Users
// @Description Get paginated users in the current tenant.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param search query string false "Search keyword matched against username, real name, email, or phone"
// @Param status query string false "User status filter" Enums(active,inactive)
// @Param department_id query string false "Department ID filter"
// @Param role_id query string false "Role ID filter"
// @Success 200 {object} userListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users [get]
func (h *UserHandler) List(c *gin.Context) {
	var req UserListRequest
	_ = c.ShouldBindQuery(&req)
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}

	resp, err := h.userService.List(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "LIST_USERS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// BatchUpdateStatus updates user status in batch.
// @Summary Batch Update User Status
// @Description Enable or disable multiple users in one request.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body UserStatusRequest true "User status payload"
// @Success 200 {object} userMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users/status [patch]
func (h *UserHandler) BatchUpdateStatus(c *gin.Context) {
	var req UserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}
	if err := h.userService.BatchUpdateStatus(c.Request.Context(), &req); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
			return
		}
		response.InternalError(c, "BATCH_UPDATE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchDelete deletes multiple users by IDs.
// @Summary Batch Delete Users
// @Description Delete multiple users in one request.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body BatchDeleteRequest true "User IDs"
// @Success 200 {object} userMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users/batch-delete [post]
func (h *UserHandler) BatchDelete(c *gin.Context) {
	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}
	if err := h.userService.BatchDelete(c.Request.Context(), req.UserIDs); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
			return
		}
		response.InternalError(c, "BATCH_DELETE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// ResetPassword resets a user's password (admin operation).
// @Summary Reset User Password
// @Description Reset password for a specified user.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Param request body AdminResetPasswordRequest true "New password payload"
// @Success 200 {object} userMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users/{id}/password [patch]
func (h *UserHandler) ResetPassword(c *gin.Context) {
	id := c.Param("id")
	var req AdminResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}
	if err := h.userService.ResetPassword(c.Request.Context(), id, req.NewPassword); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
			return
		}
		response.InternalError(c, "RESET_PASSWORD_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// GetPermissions returns the aggregated Casbin permissions for the specified user.
// @Summary Get User Permissions
// @Description Get aggregated permissions for a specified user.
// @Tags User Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Success 200 {object} userStringListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users/{id}/permissions [get]
func (h *UserHandler) GetPermissions(c *gin.Context) {
	if h.authz == nil {
		response.Success(c, []string{})
		return
	}

	userID := c.Param("id")
	if _, err := h.userService.GetByID(c.Request.Context(), userID); err != nil {
		response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
		return
	}

	perms, err := h.authz.GetUserPermissions(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "GET_USER_PERMISSIONS_FAILED", err.Error())
		return
	}
	response.Success(c, perms)
}

// UploadAvatar uploads a user avatar.
// @Summary Upload User Avatar
// @Description Upload an avatar file and return the accessible URL.
// @Tags User Management
// @Accept mpfd
// @Produce json
// @Security ApiKeyAuth
// @Param file formData file true "Avatar file"
// @Success 200 {object} userAvatarUploadEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/users/upload [post]
func (h *UserHandler) UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "INVALID_FILE", "No file uploaded")
		return
	}

	// 限制文件大小 (2MB)
	if file.Size > 2*1024*1024 {
		response.BadRequest(c, "FILE_TOO_LARGE", "File size exceeds 2MB limit")
		return
	}

	// 限制扩展名
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		response.BadRequest(c, "INVALID_FILE_TYPE", "Only JPG, PNG, GIF are allowed")
		return
	}

	// 打开文件流
	src, err := file.Open()
	if err != nil {
		response.InternalError(c, "FILE_OPEN_FAILED", "Failed to open uploaded file")
		return
	}
	defer src.Close()

	// 生成唯一文件名 (放在 avatars 子目录下)
	newFilename := fmt.Sprintf("avatars/%s%s", uuid.New().String(), ext)

	// 使用存储提供者上传
	fileURL, err := h.storageProvider.Upload(c.Request.Context(), newFilename, src, file.Size)
	if err != nil {
		response.InternalError(c, "UPLOAD_FAILED", "Failed to upload file to storage: "+err.Error())
		return
	}

	response.Success(c, gin.H{"url": fileURL})
}

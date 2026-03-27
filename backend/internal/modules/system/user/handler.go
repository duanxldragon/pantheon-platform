package user

import (
	"context"
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

func (h *UserHandler) Create(c *gin.Context) {
	var req UserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}

	u, err := h.userService.Create(c.Request.Context(), &req)
	if err != nil {
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

func (h *UserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	dto, err := h.userService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "USER_NOT_FOUND", "user.error.not_found")
		return
	}
	response.Success(c, dto)
}

func (h *UserHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req UserUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}

	if _, err := h.userService.Update(c.Request.Context(), id, &req); err != nil {
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

func (h *UserHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.userService.Delete(c.Request.Context(), id); err != nil {
		response.InternalError(c, "DELETE_USER_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

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

func (h *UserHandler) BatchUpdateStatus(c *gin.Context) {
	var req UserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}
	if err := h.userService.BatchUpdateStatus(c.Request.Context(), &req); err != nil {
		response.InternalError(c, "BATCH_UPDATE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchDelete deletes multiple users by IDs.
func (h *UserHandler) BatchDelete(c *gin.Context) {
	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}
	if err := h.userService.BatchDelete(c.Request.Context(), req.UserIDs); err != nil {
		response.InternalError(c, "BATCH_DELETE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// ResetPassword resets a user's password (admin operation).
func (h *UserHandler) ResetPassword(c *gin.Context) {
	id := c.Param("id")
	var req AdminResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "user.error.invalid_request_parameters", err.Error())
		return
	}
	if err := h.userService.ResetPassword(c.Request.Context(), id, req.NewPassword); err != nil {
		response.InternalError(c, "RESET_PASSWORD_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// GetPermissions returns the aggregated Casbin permissions for the specified user.
func (h *UserHandler) GetPermissions(c *gin.Context) {
	if h.authz == nil {
		response.Success(c, []string{})
		return
	}

	userID := c.Param("id")
	perms, err := h.authz.GetUserPermissions(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "GET_USER_PERMISSIONS_FAILED", err.Error())
		return
	}
	response.Success(c, perms)
}

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

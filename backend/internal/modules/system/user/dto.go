package user

import (
	"time"

	"pantheon-platform/backend/internal/shared/masking"
)

// UserRequest is the create-user request payload.
type UserRequest struct {
	Username     string   `json:"username" binding:"required,min=3,max=50"`
	RealName     string   `json:"real_name" binding:"required,max=100"`
	Email        string   `json:"email" binding:"required,email,max=100"`
	Phone        string   `json:"phone" binding:"max=20"`
	Password     string   `json:"password" binding:"required,min=6"`
	DepartmentID *string  `json:"department_id,omitempty"`
	PositionID   *string  `json:"position_id,omitempty"`
	RoleIDs      []string `json:"role_ids,omitempty"`
	Status       string   `json:"status,omitempty"`
}

// UserResponse is the user payload returned by APIs.
type UserResponse struct {
	ID             string   `json:"id"`
	Username       string   `json:"username"`
	RealName       string   `json:"real_name"`
	Email          string   `json:"email"`
	Phone          string   `json:"phone,omitempty"`
	Avatar         string   `json:"avatar,omitempty"`
	Status         string   `json:"status"`
	DepartmentID   *string  `json:"department_id,omitempty"`
	DepartmentName *string  `json:"department_name,omitempty"`
	PositionID     *string  `json:"position_id,omitempty"`
	PositionName   *string  `json:"position_name,omitempty"`
	RoleIDs        []string `json:"role_ids,omitempty"`
	RoleNames      []string `json:"role_names,omitempty"`
	LastLoginAt    *string  `json:"last_login_at,omitempty"`
	LastLoginIP    string   `json:"last_login_ip,omitempty"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
}

// UserListRequest is the list-users query payload.
type UserListRequest struct {
	Page         int    `json:"page" form:"page" binding:"min=1"`
	PageSize     int    `json:"page_size" form:"page_size" binding:"min=1,max=100"`
	Search       string `json:"search" form:"search"`
	Status       string `json:"status" form:"status"`
	DepartmentID string `json:"department_id" form:"department_id"`
	RoleID       string `json:"role_id" form:"role_id"`
}

// UserUpdateRequest is the update-user payload.
type UserUpdateRequest struct {
	RealName     *string  `json:"real_name" binding:"omitempty,max=100"`
	Email        *string  `json:"email" binding:"omitempty,email,max=100"`
	Phone        *string  `json:"phone" binding:"omitempty,max=20"`
	Avatar       *string  `json:"avatar"`
	DepartmentID *string  `json:"department_id"`
	PositionID   *string  `json:"position_id"`
	RoleIDs      []string `json:"role_ids"`
	Status       *string  `json:"status"`
}

// PasswordUpdateRequest is the change-password payload.
type PasswordUpdateRequest struct {
	UserID      string `json:"user_id" binding:"required"`
	Password    string `json:"password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// AdminResetPasswordRequest is used by administrators to reset a user's password.
type AdminResetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// UserStatusRequest is the batch status update payload.
type UserStatusRequest struct {
	UserIDs []string `json:"user_ids" binding:"required,min=1"`
	Status  string   `json:"status" binding:"required"`
}

// BatchDeleteRequest is the batch delete payload.
type BatchDeleteRequest struct {
	UserIDs []string `json:"user_ids" binding:"required,min=1"`
}

// UserRoleRequest is the user-role assignment payload.
type UserRoleRequest struct {
	UserID  string   `json:"user_id" binding:"required"`
	RoleIDs []string `json:"role_ids" binding:"required,min=1"`
}

type ImportResult struct {
	Total   int      `json:"total"`
	Success int      `json:"success"`
	Failed  int      `json:"failed"`
	Message string   `json:"message"`
	Errors  []string `json:"errors,omitempty"`
}

type ExportRequest struct {
	IDs []string `json:"ids"`
}

// ToUserResponse converts a User model into a response payload with masking and field-level permissions.
func ToUserResponse(user *User, deptName, posName *string, roleIDs []string, roleNames []string, fieldPerms map[string]string) *UserResponse {
	resp := &UserResponse{
		ID:           user.ID.String(),
		Username:     user.Username,
		RealName:     masking.MaskRealName(user.RealName),
		Email:        masking.MaskEmail(user.Email),
		Phone:        masking.MaskPhone(user.Phone),
		Status:       user.Status,
		DepartmentID: user.DepartmentID,
		PositionID:   user.PositionID,
		RoleIDs:      roleIDs,
		RoleNames:    roleNames,
		CreatedAt:    user.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    user.UpdatedAt.Format(time.RFC3339),
	}

	// 字段级权限过滤 (Hide 逻辑)
	if fieldPerms != nil {
		if fieldPerms["email"] == "hide" {
			resp.Email = "****"
		}
		if fieldPerms["phone"] == "hide" {
			resp.Phone = "****"
		}
		if fieldPerms["real_name"] == "hide" {
			resp.RealName = "****"
		}
	}

	if user.Avatar != nil {
		resp.Avatar = *user.Avatar
	}
	if deptName != nil {
		resp.DepartmentName = deptName
	}
	if posName != nil {
		resp.PositionName = posName
	}
	if user.LastLoginAt != nil {
		t := user.LastLoginAt.Format(time.RFC3339)
		resp.LastLoginAt = &t
		resp.LastLoginIP = user.LastLoginIP
	}

	return resp
}

type Pagination struct {
	Page       int64 `json:"page"`
	PageSize   int64 `json:"page_size"`
	Total      int64 `json:"total"`
	TotalPages int64 `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

type PageResponse struct {
	Items      interface{} `json:"items"`
	Pagination Pagination  `json:"pagination"`
}

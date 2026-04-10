package user

import (
	"time"

	"pantheon-platform/backend/internal/shared/masking"
)

// UserRequest is the create-user request payload.
type UserRequest struct {
	Username     string   `json:"username" binding:"required,min=3,max=50" example:"zhangsan"`
	RealName     string   `json:"real_name" binding:"required,max=100" example:"Zhang San"`
	Email        string   `json:"email" binding:"required,email,max=100" example:"zhangsan@example.com"`
	Phone        string   `json:"phone" binding:"max=20" example:"13800138000"`
	Password     string   `json:"password" binding:"required,min=6" example:"P@ssw0rd123"`
	DepartmentID *string  `json:"department_id,omitempty" example:"dept-tech"`
	PositionID   *string  `json:"position_id,omitempty" example:"position-dev"`
	RoleIDs      []string `json:"role_ids,omitempty" example:"role-admin,role-ops"`
	Status       string   `json:"status,omitempty" example:"active"`
}

// UserResponse is the user payload returned by APIs.
type UserResponse struct {
	ID             string   `json:"id" example:"user-1"`
	Username       string   `json:"username" example:"zhangsan"`
	RealName       string   `json:"real_name" example:"Zhang San"`
	Email          string   `json:"email" example:"z***n@example.com"`
	Phone          string   `json:"phone,omitempty" example:"138****8000"`
	Avatar         string   `json:"avatar,omitempty" example:"https://cdn.example.com/avatar/user-1.png"`
	Status         string   `json:"status" example:"active"`
	DepartmentID   *string  `json:"department_id,omitempty" example:"dept-tech"`
	DepartmentName *string  `json:"department_name,omitempty" example:"Technology"`
	PositionID     *string  `json:"position_id,omitempty" example:"position-dev"`
	PositionName   *string  `json:"position_name,omitempty" example:"Backend Engineer"`
	RoleIDs        []string `json:"role_ids,omitempty" example:"role-admin,role-auditor"`
	RoleNames      []string `json:"role_names,omitempty" example:"Administrator,Auditor"`
	LastLoginAt    *string  `json:"last_login_at,omitempty" example:"2026-03-30T09:30:00Z"`
	LastLoginIP    string   `json:"last_login_ip,omitempty" example:"127.0.0.1"`
	CreatedAt      string   `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt      string   `json:"updated_at" example:"2026-03-30T12:00:00Z"`
}

// UserListRequest is the list-users query payload.
type UserListRequest struct {
	Page         int    `json:"page" form:"page" binding:"min=1" example:"1"`
	PageSize     int    `json:"page_size" form:"page_size" binding:"min=1,max=100" example:"20"`
	Search       string `json:"search" form:"search" example:"zhangsan"`
	Status       string `json:"status" form:"status" example:"active"`
	DepartmentID string `json:"department_id" form:"department_id" example:"dept-tech"`
	RoleID       string `json:"role_id" form:"role_id" example:"role-admin"`
}

// UserUpdateRequest is the update-user payload.
type UserUpdateRequest struct {
	RealName     *string  `json:"real_name" binding:"omitempty,max=100" example:"Li Si"`
	Email        *string  `json:"email" binding:"omitempty,email,max=100" example:"lisi@example.com"`
	Phone        *string  `json:"phone" binding:"omitempty,max=20" example:"13900139000"`
	Avatar       *string  `json:"avatar" example:"https://cdn.example.com/avatar/user-2.png"`
	DepartmentID *string  `json:"department_id" example:"dept-tech"`
	PositionID   *string  `json:"position_id" example:"position-lead"`
	RoleIDs      []string `json:"role_ids" example:"role-admin,role-auditor"`
	Status       *string  `json:"status" example:"inactive"`
}

// PasswordUpdateRequest is the change-password payload.
type PasswordUpdateRequest struct {
	UserID      string `json:"user_id" binding:"required" example:"user-1"`
	Password    string `json:"password" binding:"required" example:"CurrentP@ssw0rd123"`
	NewPassword string `json:"new_password" binding:"required,min=6" example:"NewP@ssw0rd123"`
}

// AdminResetPasswordRequest is used by administrators to reset a user's password.
type AdminResetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6" example:"NewP@ssw0rd123"`
}

// UserStatusRequest is the batch status update payload.
type UserStatusRequest struct {
	UserIDs []string `json:"user_ids" binding:"required,min=1" example:"user-1,user-2"`
	Status  string   `json:"status" binding:"required" example:"inactive"`
}

// BatchDeleteRequest is the batch delete payload.
type BatchDeleteRequest struct {
	UserIDs []string `json:"user_ids" binding:"required,min=1" example:"user-1,user-2"`
}

// UserRoleRequest is the user-role assignment payload.
type UserRoleRequest struct {
	UserID  string   `json:"user_id" binding:"required" example:"user-1"`
	RoleIDs []string `json:"role_ids" binding:"required,min=1" example:"role-admin,role-auditor"`
}

type ImportResult struct {
	Total   int      `json:"total" example:"10"`
	Success int      `json:"success" example:"9"`
	Failed  int      `json:"failed" example:"1"`
	Message string   `json:"message" example:"import completed with partial failures"`
	Errors  []string `json:"errors,omitempty" example:"row 3: duplicate email"`
}

type ExportRequest struct {
	IDs []string `json:"ids" example:"user-1,user-2,user-3"`
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

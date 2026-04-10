package role

import (
	"time"

	_ "pantheon-platform/backend/internal/shared/validator"
)

// RoleRequest 角色请求DTO
type RoleRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=50" example:"Platform Admin"`
	Code        string `json:"code" binding:"required,min=2,max=50,codefmt" example:"platform_admin"`
	Description string `json:"description" binding:"max=500" example:"Built-in platform administrator role"`
	Type        string `json:"type" binding:"required,oneof=system custom" example:"system"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive" example:"active"`
	DataScope   string `json:"data_scope" binding:"omitempty,max=255" example:"all"`
}

// RoleResponse 角色响应DTO
type RoleResponse struct {
	ID          string           `json:"id" example:"role-admin"`
	Name        string           `json:"name" example:"Platform Admin"`
	Code        string           `json:"code" example:"platform_admin"`
	Description string           `json:"description" example:"Built-in platform administrator role"`
	Type        string           `json:"type" example:"system"`
	Status      string           `json:"status" example:"active"`
	DataScope   string           `json:"data_scope" example:"all"`
	UserCount   int              `json:"user_count,omitempty" example:"3"`
	MenuIDs     []string         `json:"menu_ids,omitempty" example:"menu-system,menu-user"`
	Permissions []PermissionInfo `json:"permissions,omitempty"`
	CreatedAt   string           `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt   string           `json:"updated_at" example:"2026-03-30T12:00:00Z"`
}

// PermissionInfo 权限简要信息 (用于解耦)
type PermissionInfo struct {
	ID   string `json:"id" example:"perm-user-list"`
	Name string `json:"name" example:"User List"`
	Code string `json:"code" example:"system_user_list"`
}

// RoleListRequest 角色列表请求DTO
type RoleListRequest struct {
	Page     int    `json:"page" form:"page" binding:"min=1" example:"1"`
	PageSize int    `json:"page_size" form:"page_size" binding:"min=1,max=100" example:"20"`
	Search   string `json:"search" form:"search" example:"admin"`
	Type     string `json:"type" form:"type" example:"system"`
	Status   string `json:"status" form:"status" example:"active"`
}

// RoleUpdateRequest 角色更新请求DTO
type RoleUpdateRequest struct {
	Name        *string `json:"name" binding:"omitempty,max=50" example:"Operations Admin"`
	Code        *string `json:"code" binding:"omitempty,max=50,codefmt" example:"ops_admin"`
	Description *string `json:"description" binding:"omitempty,max=500" example:"Operations management role"`
	Status      *string `json:"status" binding:"omitempty,oneof=active inactive" example:"active"`
	DataScope   *string `json:"data_scope" binding:"omitempty,max=255" example:"dept"`
}

// RolePermissionRequest 角色权限请求DTO
type RolePermissionRequest struct {
	RoleID        string   `json:"role_id" binding:"required" example:"role-admin"`
	PermissionIDs []string `json:"permission_ids" binding:"required,min=1" example:"perm-user-list,perm-user-create"`
}

type RoleMenuRequest struct {
	MenuIDs []string `json:"menu_ids" binding:"required,min=1" example:"menu-system,menu-user"`
}

type BatchDeleteRequest struct {
	RoleIDs []string `json:"role_ids" binding:"required,min=1" example:"role-admin,role-ops"`
}

type RoleStatusRequest struct {
	RoleIDs []string `json:"role_ids" binding:"required,min=1" example:"role-admin,role-ops"`
	Status  string   `json:"status" binding:"required,oneof=active inactive" example:"inactive"`
}

// ToRoleResponse 将模型转换为Response DTO
func ToRoleResponse(role *Role, permissions []PermissionInfo, menuIDs []string) *RoleResponse {
	return &RoleResponse{
		ID:          role.ID.String(),
		Name:        role.Name,
		Code:        role.Code,
		Description: role.Description,
		Type:        role.Type,
		Status:      role.Status,
		DataScope:   role.DataScope,
		MenuIDs:     menuIDs,
		Permissions: permissions,
		CreatedAt:   role.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   role.UpdatedAt.Format(time.RFC3339),
	}
}

type PageResponse struct {
	Items      interface{} `json:"items"`
	Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
	Page     int64 `json:"page"`
	PageSize int64 `json:"page_size"`
	Total    int64 `json:"total"`
}

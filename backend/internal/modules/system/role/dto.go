package role

import (
	"time"
)

// RoleRequest 角色请求DTO
type RoleRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=50"`
	Code        string `json:"code" binding:"required,min=2,max=50,alphanum"`
	Description string `json:"description" binding:"max=500"`
	Type        string `json:"type" binding:"required,oneof=system custom"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive"`
}

// RoleResponse 角色响应DTO
type RoleResponse struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Code        string           `json:"code"`
	Description string           `json:"description"`
	Type        string           `json:"type"`
	Status      string           `json:"status"`
	UserCount   int              `json:"user_count,omitempty"`
	MenuIDs     []string         `json:"menu_ids,omitempty"`
	Permissions []PermissionInfo `json:"permissions,omitempty"`
	CreatedAt   string           `json:"created_at"`
	UpdatedAt   string           `json:"updated_at"`
}

// PermissionInfo 权限简要信息 (用于解耦)
type PermissionInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Code string `json:"code"`
}

// RoleListRequest 角色列表请求DTO
type RoleListRequest struct {
	Page     int    `json:"page" form:"page" binding:"min=1"`
	PageSize int    `json:"page_size" form:"page_size" binding:"min=1,max=100"`
	Search   string `json:"search" form:"search"`
	Type     string `json:"type" form:"type"`
	Status   string `json:"status" form:"status"`
}

// RoleUpdateRequest 角色更新请求DTO
type RoleUpdateRequest struct {
	Name        *string `json:"name" binding:"omitempty,max=100"`
	Code        *string `json:"code" binding:"omitempty,max=50"`
	Description *string `json:"description"`
	Status      *string `json:"status" binding:"omitempty,oneof=active inactive"`
}

// RolePermissionRequest 角色权限请求DTO
type RolePermissionRequest struct {
	RoleID        string   `json:"role_id" binding:"required"`
	PermissionIDs []string `json:"permission_ids" binding:"required,min=1"`
}

type RoleMenuRequest struct {
	MenuIDs []string `json:"menu_ids" binding:"required,min=1"`
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

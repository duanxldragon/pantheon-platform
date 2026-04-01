package permission

import (
	"time"
)

// PermissionRequest 权限请求DTO
type PermissionRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=50" example:"User List"`
	Code        string `json:"code" binding:"required,min=2,max=100" example:"system:user:view"`
	Description string `json:"description" binding:"max=500" example:"Permission to view user list"`
	Type        string `json:"type" binding:"required,oneof=menu button api" example:"api"`
	Resource    string `json:"resource" example:"/system/users"`
	Action      string `json:"action" example:"GET"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive" example:"active"`
}

// PermissionResponse 权限响应DTO
type PermissionResponse struct {
	ID          string `json:"id" example:"perm-user-list"`
	Name        string `json:"name" example:"User List"`
	Code        string `json:"code" example:"system_user_list"`
	Description string `json:"description" example:"Permission to view user list"`
	Type        string `json:"type" example:"api"`
	Resource    string `json:"resource" example:"/system/users"`
	Action      string `json:"action" example:"GET"`
	Status      string `json:"status" example:"active"`
	CreatedAt   string `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt   string `json:"updated_at" example:"2026-03-30T12:00:00Z"`
}

type PermissionBatchDeleteRequest struct {
	PermissionIDs []string `json:"permission_ids" binding:"required,min=1" example:"perm-user-list,perm-user-create"`
}

type PermissionStatusRequest struct {
	PermissionIDs []string `json:"permission_ids" binding:"required,min=1" example:"perm-user-list,perm-user-create"`
	Status        string   `json:"status" binding:"required,oneof=active inactive" example:"inactive"`
}

// ToPermissionResponse 将模型转换为Response DTO
func ToPermissionResponse(perm *Permission) *PermissionResponse {
	return &PermissionResponse{
		ID:          perm.ID.String(),
		Name:        perm.Name,
		Code:        perm.Code,
		Description: perm.Description,
		Type:        perm.Type,
		Resource:    perm.Resource,
		Action:      perm.Action,
		Status:      perm.Status,
		CreatedAt:   perm.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   perm.UpdatedAt.Format(time.RFC3339),
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

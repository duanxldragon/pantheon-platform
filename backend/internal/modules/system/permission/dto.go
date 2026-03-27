package permission

import (
	"time"
)

// PermissionRequest 权限请求DTO
type PermissionRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=50"`
	Code        string `json:"code" binding:"required,min=2,max=50,alphanum"`
	Description string `json:"description" binding:"max=500"`
	Type        string `json:"type" binding:"required,oneof=menu button api"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive"`
}

// PermissionResponse 权限响应DTO
type PermissionResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
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

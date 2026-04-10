package menu

import (
	"time"

	_ "pantheon-platform/backend/internal/shared/validator"
)

// MenuRequest 菜单请求DTO
type MenuRequest struct {
	Name       string  `json:"name" binding:"required,min=2,max=100" example:"User Management"`
	Code       string  `json:"code" binding:"required,min=2,max=50,codefmt" example:"system_user"`
	Path       string  `json:"path" binding:"required,max=255" example:"/system/users"`
	Component  string  `json:"component" binding:"max=255" example:"system/UserManagement"`
	Icon       string  `json:"icon" binding:"max=100" example:"users"`
	Type       string  `json:"type" binding:"required,oneof=menu button directory" example:"menu"`
	ParentID   *string `json:"parent_id" example:"menu-system"`
	Sort       *int    `json:"sort" example:"10"`
	Status     string  `json:"status" binding:"omitempty,oneof=active inactive" example:"active"`
	IsExternal bool    `json:"is_external" example:"false"`
}

// MenuResponse 菜单响应DTO
type MenuResponse struct {
	ID         string         `json:"id" example:"menu-user"`
	Name       string         `json:"name" example:"User Management"`
	Code       string         `json:"code" example:"system_user"`
	Path       string         `json:"path" example:"/system/users"`
	Component  string         `json:"component,omitempty" example:"system/UserManagement"`
	Icon       string         `json:"icon" example:"users"`
	Type       string         `json:"type" example:"menu"`
	ParentID   *string        `json:"parent_id,omitempty" example:"menu-system"`
	ParentName *string        `json:"parent_name,omitempty" example:"System Management"`
	Sort       int            `json:"sort" example:"10"`
	Status     string         `json:"status" example:"active"`
	IsExternal bool           `json:"is_external" example:"false"`
	Children   []MenuResponse `json:"children,omitempty"`
	CreatedAt  string         `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt  string         `json:"updated_at" example:"2026-03-30T12:00:00Z"`
}

// MenuTreeRequest 菜单树请求DTO
type MenuTreeRequest struct {
	Status  string   `json:"status" form:"status" example:"active"`
	RoleIDs []string `json:"role_ids" form:"role_ids" example:"role-admin,role-ops"`
}

type MenuBatchDeleteRequest struct {
	MenuIDs []string `json:"menu_ids" binding:"required,min=1" example:"menu-user,menu-role"`
}

type MenuStatusRequest struct {
	MenuIDs []string `json:"menu_ids" binding:"required,min=1" example:"menu-user,menu-role"`
	Status  string   `json:"status" binding:"required,oneof=active inactive" example:"inactive"`
}

// ToMenuResponse 将模型转换为Response DTO
func ToMenuResponse(m *Menu, parentName *string) *MenuResponse {
	resp := &MenuResponse{
		ID:         m.ID.String(),
		Name:       m.Name,
		Code:       m.Code,
		Path:       m.Path,
		Component:  m.Component,
		Icon:       m.Icon,
		Type:       m.Type,
		Sort:       m.Sort,
		Status:     m.Status,
		IsExternal: m.IsExternal,
		CreatedAt:  m.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  m.UpdatedAt.Format(time.RFC3339),
	}

	if m.ParentID != nil {
		id := m.ParentID.String()
		resp.ParentID = &id
	}
	if parentName != nil {
		resp.ParentName = parentName
	}

	return resp
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

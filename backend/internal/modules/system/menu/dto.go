package menu

import (
	"time"
)

// MenuRequest 菜单请求DTO
type MenuRequest struct {
	Name       string  `json:"name" binding:"required,min=2,max=100"`
	Code       string  `json:"code" binding:"required,min=2,max=50,alphanum"`
	Path       string  `json:"path" binding:"required,max=255"`
	Component  string  `json:"component" binding:"max=255"`
	Icon       string  `json:"icon" binding:"max=100"`
	Type       string  `json:"type" binding:"required,oneof=menu button directory"`
	ParentID   *string `json:"parent_id"`
	Sort       *int    `json:"sort"`
	Status     string  `json:"status" binding:"omitempty,oneof=active inactive"`
	IsExternal bool    `json:"is_external"`
}

// MenuResponse 菜单响应DTO
type MenuResponse struct {
	ID         string         `json:"id"`
	Name       string         `json:"name"`
	Code       string         `json:"code"`
	Path       string         `json:"path"`
	Component  string         `json:"component,omitempty"`
	Icon       string         `json:"icon"`
	Type       string         `json:"type"`
	ParentID   *string        `json:"parent_id,omitempty"`
	ParentName *string        `json:"parent_name,omitempty"`
	Sort       int            `json:"sort"`
	Status     string         `json:"status"`
	IsExternal bool           `json:"is_external"`
	Children   []MenuResponse `json:"children,omitempty"`
	CreatedAt  string         `json:"created_at"`
	UpdatedAt  string         `json:"updated_at"`
}

// MenuTreeRequest 菜单树请求DTO
type MenuTreeRequest struct {
	Status  string   `json:"status" form:"status"`
	RoleIDs []string `json:"role_ids" form:"role_ids"`
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

package dict

import (
	"time"

	_ "pantheon-platform/backend/internal/shared/validator"
)

// DictTypeRequest 字典类型请求DTO
type DictTypeRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100" example:"User Status"`
	Code        string `json:"code" binding:"required,min=2,max=50,codefmt" example:"user_status"`
	Description string `json:"description" binding:"max=500" example:"Status options for user accounts"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive" example:"active"`
}

// DictTypeResponse 字典类型响应DTO
type DictTypeResponse struct {
	ID          string `json:"id" example:"dict-data-user-status-active"`
	Name        string `json:"name" example:"User Status"`
	Code        string `json:"code" example:"user_status"`
	Description string `json:"description" example:"Status options for user accounts"`
	Status      string `json:"status" example:"active"`
	CreatedAt   string `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt   string `json:"updated_at" example:"2026-03-30T12:00:00Z"`
}

// DictDataRequest 字典数据请求DTO
type DictDataRequest struct {
	TypeID      string `json:"type_id" binding:"required" example:"dict-type-user-status"`
	Label       string `json:"label" binding:"required,max=255" example:"Active"`
	Value       string `json:"value" binding:"required" example:"active"`
	Description string `json:"description" binding:"max=500" example:"Label description shown to administrators"`
	Sort        *int   `json:"sort" example:"1"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive" example:"active"`
}

// DictDataResponse 字典数据响应DTO
type DictDataResponse struct {
	ID          string `json:"id" example:"dict-data-user-status-active"`
	TypeID      string `json:"type_id" example:"dict-type-user-status"`
	Label       string `json:"label" example:"Active"`
	Value       string `json:"value" example:"active"`
	Description string `json:"description" example:"Label description shown to administrators"`
	Sort        int    `json:"sort" example:"1"`
	Status      string `json:"status" example:"active"`
	CreatedAt   string `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt   string `json:"updated_at" example:"2026-03-30T12:00:00Z"`
}

// ToDictTypeResponse 将模型转换为Response DTO
func ToDictTypeResponse(t *DictType) *DictTypeResponse {
	return &DictTypeResponse{
		ID:          t.ID.String(),
		Name:        t.Name,
		Code:        t.Code,
		Description: t.Description,
		Status:      t.Status,
		CreatedAt:   t.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   t.UpdatedAt.Format(time.RFC3339),
	}
}

// ToDictDataResponse 将模型转换为Response DTO
func ToDictDataResponse(d *DictData) *DictDataResponse {
	return &DictDataResponse{
		ID:          d.ID.String(),
		TypeID:      d.TypeID.String(),
		Label:       d.Label,
		Value:       d.Value,
		Description: d.Description,
		Sort:        d.Sort,
		Status:      d.Status,
		CreatedAt:   d.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   d.UpdatedAt.Format(time.RFC3339),
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

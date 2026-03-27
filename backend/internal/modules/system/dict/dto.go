package dict

import (
	"time"
)

// DictTypeRequest 字典类型请求DTO
type DictTypeRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	Code        string `json:"code" binding:"required,min=2,max=50,alphanum"`
	Description string `json:"description" binding:"max=500"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive"`
}

// DictTypeResponse 字典类型响应DTO
type DictTypeResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// DictDataRequest 字典数据请求DTO
type DictDataRequest struct {
	TypeID      string `json:"type_id" binding:"required"`
	Label       string `json:"label" binding:"required,max=255"`
	Value       string `json:"value" binding:"required"`
	Description string `json:"description" binding:"max=500"`
	Sort        *int   `json:"sort"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive"`
}

// DictDataResponse 字典数据响应DTO
type DictDataResponse struct {
	ID          string `json:"id"`
	TypeID      string `json:"type_id"`
	Label       string `json:"label"`
	Value       string `json:"value"`
	Description string `json:"description"`
	Sort        int    `json:"sort"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
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

package position

import (
	"time"
)

// PositionRequest 职位请求DTO
type PositionRequest struct {
	Name             string  `json:"name" binding:"required,min=2,max=100"`
	Code             string  `json:"code" binding:"required,min=2,max=50,alphanum"`
	Category         string  `json:"category" binding:"max=50"`
	Description      string  `json:"description" binding:"max=500"`
	DepartmentID     *string `json:"department_id"`
	Level            *int    `json:"level"`
	Sort             *int    `json:"sort"`
	Status           string  `json:"status" binding:"omitempty,oneof=active inactive"`
	Responsibilities string  `json:"responsibilities" binding:"max=2000"`
	Requirements     string  `json:"requirements" binding:"max=2000"`
}

// PositionResponse 职位响应DTO
type PositionResponse struct {
	ID               string  `json:"id"`
	Name             string  `json:"name"`
	Code             string  `json:"code"`
	Category         string  `json:"category"`
	Description      string  `json:"description"`
	DepartmentID     *string `json:"department_id,omitempty"`
	DepartmentName   *string `json:"department_name,omitempty"`
	Level            int     `json:"level"`
	Sort             int     `json:"sort"`
	Status           string  `json:"status"`
	Responsibilities string  `json:"responsibilities,omitempty"`
	Requirements     string  `json:"requirements,omitempty"`
	UserCount        int     `json:"user_count,omitempty"`
	CreatedAt        string  `json:"created_at"`
	UpdatedAt        string  `json:"updated_at"`
}

// PositionListRequest 职位列表请求DTO
type PositionListRequest struct {
	Page         int    `json:"page" form:"page" binding:"min=1"`
	PageSize     int    `json:"page_size" form:"page_size" binding:"min=1,max=100"`
	Search       string `json:"search" form:"search"`
	Status       string `json:"status" form:"status"`
	DepartmentID string `json:"department_id" form:"department_id"`
	Level        string `json:"level" form:"level"`
}

// ToPositionResponse 将模型转换为Response DTO
func ToPositionResponse(pos *Position, deptName *string) *PositionResponse {
	resp := &PositionResponse{
		ID:               pos.ID.String(),
		Name:             pos.Name,
		Code:             pos.Code,
		Category:         pos.Category,
		Description:      pos.Description,
		Level:            pos.Level,
		Sort:             pos.Sort,
		Status:           pos.Status,
		Responsibilities: pos.Responsibilities,
		Requirements:     pos.Requirements,
		CreatedAt:        pos.CreatedAt.Format(time.RFC3339),
		UpdatedAt:        pos.UpdatedAt.Format(time.RFC3339),
	}

	if pos.DepartmentID != nil {
		id := pos.DepartmentID.String()
		resp.DepartmentID = &id
	}
	if deptName != nil {
		resp.DepartmentName = deptName
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

package position

import (
	"time"

	_ "pantheon-platform/backend/internal/shared/validator"
)

// PositionRequest 职位请求DTO
type PositionRequest struct {
	Name             string  `json:"name" binding:"required,min=2,max=100" example:"Backend Engineer"`
	Code             string  `json:"code" binding:"required,min=2,max=50,codefmt" example:"backend_dev"`
	Category         string  `json:"category" binding:"max=50" example:"engineering"`
	Description      string  `json:"description" binding:"max=500" example:"Responsible for backend service development"`
	DepartmentID     *string `json:"department_id" example:"dept-tech"`
	Level            *int    `json:"level" example:"3"`
	Sort             *int    `json:"sort" example:"10"`
	Status           string  `json:"status" binding:"omitempty,oneof=active inactive" example:"active"`
	Responsibilities string  `json:"responsibilities" binding:"max=2000" example:"design APIs, implement services, review code"`
	Requirements     string  `json:"requirements" binding:"max=2000" example:"3+ years of Go development experience"`
}

type PositionBatchDeleteRequest struct {
	PositionIDs []string `json:"position_ids" binding:"required,min=1" example:"position-dev,position-lead"`
}

type PositionStatusRequest struct {
	PositionIDs []string `json:"position_ids" binding:"required,min=1" example:"position-dev,position-lead"`
	Status      string   `json:"status" binding:"required,oneof=active inactive" example:"inactive"`
}

// PositionResponse 职位响应DTO
type PositionResponse struct {
	ID               string  `json:"id" example:"position-dev"`
	Name             string  `json:"name" example:"Backend Engineer"`
	Code             string  `json:"code" example:"backend_dev"`
	Category         string  `json:"category" example:"engineering"`
	Description      string  `json:"description" example:"Responsible for backend service development"`
	DepartmentID     *string `json:"department_id,omitempty" example:"dept-tech"`
	DepartmentName   *string `json:"department_name,omitempty" example:"Technology"`
	Level            int     `json:"level" example:"3"`
	Sort             int     `json:"sort" example:"10"`
	Status           string  `json:"status" example:"active"`
	Responsibilities string  `json:"responsibilities,omitempty" example:"design APIs, implement services, review code"`
	Requirements     string  `json:"requirements,omitempty" example:"3+ years of Go development experience"`
	UserCount        int     `json:"user_count,omitempty" example:"8"`
	CreatedAt        string  `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt        string  `json:"updated_at" example:"2026-03-30T12:00:00Z"`
}

// PositionListRequest 职位列表请求DTO
type PositionListRequest struct {
	Page         int    `json:"page" form:"page" binding:"min=1" example:"1"`
	PageSize     int    `json:"page_size" form:"page_size" binding:"min=1,max=100" example:"20"`
	Search       string `json:"search" form:"search" example:"engineer"`
	Status       string `json:"status" form:"status" example:"active"`
	DepartmentID string `json:"department_id" form:"department_id" example:"dept-tech"`
	Level        string `json:"level" form:"level" example:"3"`
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

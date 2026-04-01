package dept

import (
	"time"

	_ "pantheon-platform/backend/internal/shared/validator"
)

// DepartmentRequest 部门请求DTO
type DepartmentRequest struct {
	Name        string  `json:"name" binding:"required,min=2,max=100" example:"Technology"`
	Code        string  `json:"code" binding:"required,min=2,max=50,codefmt" example:"tech"`
	Description string  `json:"description" binding:"max=500" example:"Core engineering department"`
	ParentID    *string `json:"parent_id" example:"dept-root"`
	LeaderID    *string `json:"leader_id" example:"user-leader"`
	Phone       string  `json:"phone" binding:"max=20" example:"010-88886666"`
	Email       string  `json:"email" binding:"omitempty,email,max=100" example:"tech@example.com"`
	Sort        *int    `json:"sort" example:"1"`
	Status      string  `json:"status" binding:"omitempty,oneof=active inactive" example:"active"`
}

// DepartmentResponse 部门响应DTO
type DepartmentResponse struct {
	ID          string               `json:"id" example:"dept-tech"`
	Name        string               `json:"name" example:"Technology"`
	Code        string               `json:"code" example:"tech"`
	Description string               `json:"description" example:"Core engineering department"`
	ParentID    *string              `json:"parent_id,omitempty" example:"dept-root"`
	ParentName  *string              `json:"parent_name,omitempty" example:"Head Office"`
	LeaderID    *string              `json:"leader_id,omitempty" example:"user-leader"`
	LeaderName  *string              `json:"leader_name,omitempty" example:"Alice Chen"`
	Phone       string               `json:"phone,omitempty" example:"010-88886666"`
	Email       string               `json:"email,omitempty" example:"tech@example.com"`
	Level       int                  `json:"level" example:"2"`
	Sort        int                  `json:"sort" example:"1"`
	Status      string               `json:"status" example:"active"`
	UserCount   int                  `json:"user_count,omitempty" example:"15"`
	Children    []DepartmentResponse `json:"children,omitempty"`
	CreatedAt   string               `json:"created_at" example:"2026-03-30T10:00:00Z"`
	UpdatedAt   string               `json:"updated_at" example:"2026-03-30T12:00:00Z"`
}

// DepartmentListRequest 部门列表请求DTO
type DepartmentListRequest struct {
	Page     int    `json:"page" form:"page" binding:"min=1" example:"1"`
	PageSize int    `json:"page_size" form:"page_size" binding:"min=1,max=100" example:"20"`
	Search   string `json:"search" form:"search" example:"tech"`
	Status   string `json:"status" form:"status" example:"active"`
	ParentID string `json:"parent_id" form:"parent_id" example:"dept-root"`
}

// DepartmentTreeRequest 部门树请求DTO
type DepartmentTreeRequest struct {
	Status   string `json:"status" form:"status" example:"active"`
	ParentID string `json:"parent_id" form:"parent_id" example:"dept-root"`
}

type DepartmentBatchDeleteRequest struct {
	DepartmentIDs []string `json:"department_ids" binding:"required,min=1" example:"dept-tech,dept-ops"`
}

type DepartmentStatusRequest struct {
	DepartmentIDs []string `json:"department_ids" binding:"required,min=1" example:"dept-tech,dept-ops"`
	Status        string   `json:"status" binding:"required,oneof=active inactive" example:"inactive"`
}

// ToDepartmentResponse 将模型转换为Response DTO
func ToDepartmentResponse(dept *Department, parentName, leaderName *string) *DepartmentResponse {
	resp := &DepartmentResponse{
		ID:          dept.ID.String(),
		Name:        dept.Name,
		Code:        dept.Code,
		Description: dept.Description,
		Phone:       dept.Phone,
		Email:       dept.Email,
		Level:       dept.Level,
		Sort:        dept.Sort,
		Status:      dept.Status,
		CreatedAt:   dept.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   dept.UpdatedAt.Format(time.RFC3339),
	}

	if dept.ParentID != nil {
		id := dept.ParentID.String()
		resp.ParentID = &id
	}
	if parentName != nil {
		resp.ParentName = parentName
	}
	if dept.LeaderID != nil {
		id := dept.LeaderID.String()
		resp.LeaderID = &id
	}
	if leaderName != nil {
		resp.LeaderName = leaderName
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

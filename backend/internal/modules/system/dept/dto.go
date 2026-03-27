package dept

import (
	"time"
)

// DepartmentRequest 部门请求DTO
type DepartmentRequest struct {
	Name        string  `json:"name" binding:"required,min=2,max=100"`
	Code        string  `json:"code" binding:"required,min=2,max=50,alphanum"`
	Description string  `json:"description" binding:"max=500"`
	ParentID    *string `json:"parent_id"`
	LeaderID    *string `json:"leader_id"`
	Phone       string  `json:"phone" binding:"max=20"`
	Email       string  `json:"email" binding:"omitempty,email,max=100"`
	Sort        *int    `json:"sort"`
	Status      string  `json:"status" binding:"omitempty,oneof=active inactive"`
}

// DepartmentResponse 部门响应DTO
type DepartmentResponse struct {
	ID          string               `json:"id"`
	Name        string               `json:"name"`
	Code        string               `json:"code"`
	Description string               `json:"description"`
	ParentID    *string              `json:"parent_id,omitempty"`
	ParentName  *string              `json:"parent_name,omitempty"`
	LeaderID    *string              `json:"leader_id,omitempty"`
	LeaderName  *string              `json:"leader_name,omitempty"`
	Phone       string               `json:"phone,omitempty"`
	Email       string               `json:"email,omitempty"`
	Level       int                  `json:"level"`
	Sort        int                  `json:"sort"`
	Status      string               `json:"status"`
	UserCount   int                  `json:"user_count,omitempty"`
	Children    []DepartmentResponse `json:"children,omitempty"`
	CreatedAt   string               `json:"created_at"`
	UpdatedAt   string               `json:"updated_at"`
}

// DepartmentListRequest 部门列表请求DTO
type DepartmentListRequest struct {
	Page     int    `json:"page" form:"page" binding:"min=1"`
	PageSize int    `json:"page_size" form:"page_size" binding:"min=1,max=100"`
	Search   string `json:"search" form:"search"`
	Status   string `json:"status" form:"status"`
	ParentID string `json:"parent_id" form:"parent_id"`
}

// DepartmentTreeRequest 部门树请求DTO
type DepartmentTreeRequest struct {
	Status   string `json:"status" form:"status"`
	ParentID string `json:"parent_id" form:"parent_id"`
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

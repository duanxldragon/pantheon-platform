package dept

import (
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type DepartmentHandler struct {
	service DepartmentService
}

func NewDepartmentHandler(service DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{service: service}
}

func (h *DepartmentHandler) Create(c *gin.Context) {
	var req DepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	d, err := h.service.Create(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "CREATE_DEPT_FAILED", err.Error())
		return
	}
	response.Created(c, ToDepartmentResponse(d, nil, nil))
}

func (h *DepartmentHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "DEPT_NOT_FOUND", "Department not found")
		return
	}
	response.Success(c, resp)
}

func (h *DepartmentHandler) List(c *gin.Context) {
	var req DepartmentListRequest
	_ = c.ShouldBindQuery(&req)
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	resp, err := h.service.List(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "LIST_DEPTS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

func (h *DepartmentHandler) GetTree(c *gin.Context) {
	var req DepartmentTreeRequest
	_ = c.ShouldBindQuery(&req)
	resp, err := h.service.GetTree(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "GET_TREE_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

func (h *DepartmentHandler) Update(c *gin.Context) {
	var req DepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	d, err := h.service.Update(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		response.InternalError(c, "UPDATE_DEPT_FAILED", err.Error())
		return
	}
	response.Success(c, ToDepartmentResponse(d, nil, nil))
}

func (h *DepartmentHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_DEPT_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

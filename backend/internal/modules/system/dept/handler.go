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

// Create creates a department.
// @Summary Create Department
// @Description Create a department in the current tenant.
// @Tags Department Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body DepartmentRequest true "Department payload"
// @Success 201 {object} deptEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/depts [post]
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

// GetByID gets department detail by ID.
// @Summary Get Department
// @Description Get department detail by department ID.
// @Tags Department Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Department ID"
// @Success 200 {object} deptEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Router /system/depts/{id} [get]
func (h *DepartmentHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "DEPT_NOT_FOUND", "Department not found")
		return
	}
	response.Success(c, resp)
}

// List lists departments.
// @Summary List Departments
// @Description Get paginated department list.
// @Tags Department Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param search query string false "Search keyword matched against department name or code"
// @Param status query string false "Department status filter" Enums(active,inactive)
// @Param parent_id query string false "Parent department ID filter"
// @Success 200 {object} deptListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/depts [get]
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

// GetTree gets the department tree.
// @Summary Get Department Tree
// @Description Get hierarchical department tree.
// @Tags Department Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param status query string false "Department status filter" Enums(active,inactive)
// @Param parent_id query string false "Root parent department ID; omit to build the full tree"
// @Success 200 {object} deptTreeEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/depts/tree [get]
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

// Update updates a department.
// @Summary Update Department
// @Description Update department information.
// @Tags Department Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Department ID"
// @Param request body DepartmentRequest true "Department payload"
// @Success 200 {object} deptEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/depts/{id} [put]
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

// Delete deletes a department.
// @Summary Delete Department
// @Description Delete a department by ID.
// @Tags Department Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Department ID"
// @Success 200 {object} deptMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/depts/{id} [delete]
func (h *DepartmentHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_DEPT_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchDelete deletes multiple departments in one request.
// @Summary Batch Delete Departments
// @Description Delete multiple departments after validating that each department has no direct child departments or direct members.
// @Tags Department Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body DepartmentBatchDeleteRequest true "Department IDs"
// @Success 200 {object} deptMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/depts/batch-delete [post]
func (h *DepartmentHandler) BatchDelete(c *gin.Context) {
	var req DepartmentBatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchDelete(c.Request.Context(), req.DepartmentIDs); err != nil {
		response.InternalError(c, "BATCH_DELETE_DEPT_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchUpdateStatus updates the status of multiple departments.
// @Summary Batch Update Department Status
// @Description Enable or disable multiple departments and refresh affected department users.
// @Tags Department Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body DepartmentStatusRequest true "Department status payload"
// @Success 200 {object} deptMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/depts/status [patch]
func (h *DepartmentHandler) BatchUpdateStatus(c *gin.Context) {
	var req DepartmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchUpdateStatus(c.Request.Context(), &req); err != nil {
		response.InternalError(c, "BATCH_UPDATE_DEPT_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

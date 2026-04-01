package position

import (
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type PositionHandler struct {
	service PositionService
}

func NewPositionHandler(service PositionService) *PositionHandler {
	return &PositionHandler{service: service}
}

// Create creates a position.
// @Summary Create Position
// @Description Create a position in the current tenant.
// @Tags Position Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body PositionRequest true "Position payload"
// @Success 201 {object} positionEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/positions [post]
func (h *PositionHandler) Create(c *gin.Context) {
	var req PositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	p, err := h.service.Create(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "CREATE_POSITION_FAILED", err.Error())
		return
	}
	response.Created(c, ToPositionResponse(p, nil))
}

// GetByID gets position detail by ID.
// @Summary Get Position
// @Description Get position detail by position ID.
// @Tags Position Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Position ID"
// @Success 200 {object} positionEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Router /system/positions/{id} [get]
func (h *PositionHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "POSITION_NOT_FOUND", "Position not found")
		return
	}
	response.Success(c, resp)
}

// List lists positions.
// @Summary List Positions
// @Description Get paginated position list.
// @Tags Position Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param search query string false "Search keyword matched against position name or code"
// @Param status query string false "Position status filter" Enums(active,inactive)
// @Param department_id query string false "Department ID filter"
// @Param level query string false "Position level filter"
// @Success 200 {object} positionListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/positions [get]
func (h *PositionHandler) List(c *gin.Context) {
	var req PositionListRequest
	_ = c.ShouldBindQuery(&req)
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	resp, err := h.service.List(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "LIST_POSITIONS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// Update updates a position.
// @Summary Update Position
// @Description Update position information.
// @Tags Position Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Position ID"
// @Param request body PositionRequest true "Position payload"
// @Success 200 {object} positionEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/positions/{id} [put]
func (h *PositionHandler) Update(c *gin.Context) {
	var req PositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	p, err := h.service.Update(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		response.InternalError(c, "UPDATE_POSITION_FAILED", err.Error())
		return
	}
	response.Success(c, ToPositionResponse(p, nil))
}

// Delete deletes a position.
// @Summary Delete Position
// @Description Delete a position by ID.
// @Tags Position Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Position ID"
// @Success 200 {object} positionMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/positions/{id} [delete]
func (h *PositionHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_POSITION_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchDelete deletes multiple positions in one request.
// @Summary Batch Delete Positions
// @Description Delete multiple positions and refresh affected user authorization snapshots.
// @Tags Position Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body PositionBatchDeleteRequest true "Position IDs"
// @Success 200 {object} positionMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/positions/batch-delete [post]
func (h *PositionHandler) BatchDelete(c *gin.Context) {
	var req PositionBatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchDelete(c.Request.Context(), req.PositionIDs); err != nil {
		response.InternalError(c, "BATCH_DELETE_POSITION_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchUpdateStatus updates the status of multiple positions.
// @Summary Batch Update Position Status
// @Description Enable or disable multiple positions and refresh affected users.
// @Tags Position Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body PositionStatusRequest true "Position status payload"
// @Success 200 {object} positionMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/positions/status [patch]
func (h *PositionHandler) BatchUpdateStatus(c *gin.Context) {
	var req PositionStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchUpdateStatus(c.Request.Context(), &req); err != nil {
		response.InternalError(c, "BATCH_UPDATE_POSITION_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

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

func (h *PositionHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "POSITION_NOT_FOUND", "Position not found")
		return
	}
	response.Success(c, resp)
}

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

func (h *PositionHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_POSITION_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

func (h *PositionHandler) RegisterRoutes(group *gin.RouterGroup) {
	pos := group.Group("/positions")
	{
		pos.GET("", h.List)
		pos.POST("", h.Create)
		pos.GET("/:id", h.GetByID)
		pos.PUT("/:id", h.Update)
		pos.DELETE("/:id", h.Delete)
	}
}

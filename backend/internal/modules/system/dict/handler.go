package dict

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type DictHandler struct {
	service DictService
}

func NewDictHandler(service DictService) *DictHandler {
	return &DictHandler{service: service}
}

func (h *DictHandler) CreateType(c *gin.Context) {
	var req DictTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	dt, err := h.service.CreateType(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "CREATE_TYPE_FAILED", err.Error())
		return
	}
	response.Created(c, ToDictTypeResponse(dt))
}

func (h *DictHandler) GetTypeByID(c *gin.Context) {
	resp, err := h.service.GetTypeByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "DICT_TYPE_NOT_FOUND", "Dict type not found")
		return
	}
	response.Success(c, resp)
}

func (h *DictHandler) ListTypes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "100"))
	search := c.Query("search")

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 100
	}

	resp, err := h.service.ListTypes(c.Request.Context(), page, pageSize, search)
	if err != nil {
		response.InternalError(c, "LIST_TYPES_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

func (h *DictHandler) UpdateType(c *gin.Context) {
	var req DictTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	dt, err := h.service.UpdateType(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		response.InternalError(c, "UPDATE_TYPE_FAILED", err.Error())
		return
	}
	response.Success(c, ToDictTypeResponse(dt))
}

func (h *DictHandler) DeleteType(c *gin.Context) {
	if err := h.service.DeleteType(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_TYPE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

func (h *DictHandler) CreateData(c *gin.Context) {
	var req DictDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	dd, err := h.service.CreateData(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "CREATE_DATA_FAILED", err.Error())
		return
	}
	response.Created(c, ToDictDataResponse(dd))
}

func (h *DictHandler) ListData(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "100"))
	typeID := c.Query("type_id")
	search := c.Query("search")

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 100
	}

	resp, err := h.service.ListData(c.Request.Context(), page, pageSize, typeID, search)
	if err != nil {
		response.InternalError(c, "LIST_DATA_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

func (h *DictHandler) GetDataByID(c *gin.Context) {
	resp, err := h.service.GetDataByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "DICT_DATA_NOT_FOUND", "Dict data not found")
		return
	}
	response.Success(c, resp)
}

func (h *DictHandler) UpdateData(c *gin.Context) {
	var req DictDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	dd, err := h.service.UpdateData(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		response.InternalError(c, "UPDATE_DATA_FAILED", err.Error())
		return
	}
	response.Success(c, ToDictDataResponse(dd))
}

func (h *DictHandler) DeleteData(c *gin.Context) {
	if err := h.service.DeleteData(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_DATA_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

func (h *DictHandler) RegisterRoutes(group *gin.RouterGroup) {
	dict := group.Group("/dict")
	{
		dict.GET("/types", h.ListTypes)
		dict.POST("/types", h.CreateType)
		dict.GET("/types/:id", h.GetTypeByID)
		dict.PUT("/types/:id", h.UpdateType)
		dict.DELETE("/types/:id", h.DeleteType)

		dict.GET("/data", h.ListData)
		dict.POST("/data", h.CreateData)
		dict.GET("/data/:id", h.GetDataByID)
		dict.PUT("/data/:id", h.UpdateData)
		dict.DELETE("/data/:id", h.DeleteData)
	}
}

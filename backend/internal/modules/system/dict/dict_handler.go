package dict

import (
	"errors"
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

// CreateType creates a dictionary type.
// @Summary Create Dict Type
// @Description Create a dictionary type.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body DictTypeRequest true "Dictionary type payload"
// @Success 201 {object} dictTypeEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/dict/types [post]
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

// GetTypeByID gets a dictionary type.
// @Summary Get Dict Type
// @Description Get a dictionary type by ID.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Dictionary Type ID"
// @Success 200 {object} dictTypeEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Router /system/dict/types/{id} [get]
func (h *DictHandler) GetTypeByID(c *gin.Context) {
	resp, err := h.service.GetTypeByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		h.writeError(c, err, "GET_TYPE_FAILED")
		return
	}
	response.Success(c, resp)
}

// ListTypes lists dictionary types.
// @Summary List Dict Types
// @Description Get dictionary type list.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(100) minimum(1)
// @Param search query string false "Search keyword matched against dictionary type name or code"
// @Success 200 {object} dictTypeListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/dict/types [get]
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
		h.writeError(c, err, "LIST_TYPES_FAILED")
		return
	}
	response.Success(c, resp)
}

// UpdateType updates a dictionary type.
// @Summary Update Dict Type
// @Description Update a dictionary type by ID.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Dictionary Type ID"
// @Param request body DictTypeRequest true "Dictionary type payload"
// @Success 200 {object} dictTypeEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/dict/types/{id} [put]
func (h *DictHandler) UpdateType(c *gin.Context) {
	var req DictTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	dt, err := h.service.UpdateType(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		h.writeError(c, err, "UPDATE_TYPE_FAILED")
		return
	}
	response.Success(c, ToDictTypeResponse(dt))
}

// DeleteType deletes a dictionary type.
// @Summary Delete Dict Type
// @Description Delete a dictionary type by ID.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Dictionary Type ID"
// @Success 200 {object} dictMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/dict/types/{id} [delete]
func (h *DictHandler) DeleteType(c *gin.Context) {
	if err := h.service.DeleteType(c.Request.Context(), c.Param("id")); err != nil {
		h.writeError(c, err, "DELETE_TYPE_FAILED")
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// CreateData creates dictionary data.
// @Summary Create Dict Data
// @Description Create a dictionary data item.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body DictDataRequest true "Dictionary data payload"
// @Success 201 {object} dictDataEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/dict/data [post]
func (h *DictHandler) CreateData(c *gin.Context) {
	var req DictDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	dd, err := h.service.CreateData(c.Request.Context(), &req)
	if err != nil {
		h.writeError(c, err, "CREATE_DATA_FAILED")
		return
	}
	response.Created(c, ToDictDataResponse(dd))
}

// ListData lists dictionary data.
// @Summary List Dict Data
// @Description Get dictionary data list.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(100) minimum(1)
// @Param type_id query string false "Dictionary type ID filter"
// @Param search query string false "Search keyword matched against dictionary label or value"
// @Success 200 {object} dictDataListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/dict/data [get]
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
		h.writeError(c, err, "LIST_DATA_FAILED")
		return
	}
	response.Success(c, resp)
}

// GetDataByID gets dictionary data.
// @Summary Get Dict Data
// @Description Get a dictionary data item by ID.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Dictionary Data ID"
// @Success 200 {object} dictDataEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Router /system/dict/data/{id} [get]
func (h *DictHandler) GetDataByID(c *gin.Context) {
	resp, err := h.service.GetDataByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		h.writeError(c, err, "GET_DATA_FAILED")
		return
	}
	response.Success(c, resp)
}

// UpdateData updates dictionary data.
// @Summary Update Dict Data
// @Description Update a dictionary data item by ID.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Dictionary Data ID"
// @Param request body DictDataRequest true "Dictionary data payload"
// @Success 200 {object} dictDataEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/dict/data/{id} [put]
func (h *DictHandler) UpdateData(c *gin.Context) {
	var req DictDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	dd, err := h.service.UpdateData(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		h.writeError(c, err, "UPDATE_DATA_FAILED")
		return
	}
	response.Success(c, ToDictDataResponse(dd))
}

// DeleteData deletes dictionary data.
// @Summary Delete Dict Data
// @Description Delete a dictionary data item by ID.
// @Tags Dictionary Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Dictionary Data ID"
// @Success 200 {object} dictMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/dict/data/{id} [delete]
func (h *DictHandler) DeleteData(c *gin.Context) {
	if err := h.service.DeleteData(c.Request.Context(), c.Param("id")); err != nil {
		h.writeError(c, err, "DELETE_DATA_FAILED")
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

func (h *DictHandler) writeError(c *gin.Context, err error, internalCode string) {
	switch {
	case errors.Is(err, ErrDictTypeNotFound):
		response.NotFound(c, "DICT_TYPE_NOT_FOUND", "Dict type not found")
	case errors.Is(err, ErrDictDataNotFound):
		response.NotFound(c, "DICT_DATA_NOT_FOUND", "Dict data not found")
	case errors.Is(err, ErrDictTypeInUse):
		response.Conflict(c, "DICT_TYPE_IN_USE", "Dict type is in use")
	default:
		response.InternalError(c, internalCode, err.Error())
	}
}

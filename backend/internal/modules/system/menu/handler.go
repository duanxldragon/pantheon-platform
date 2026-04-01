package menu

import (
	"github.com/gin-gonic/gin"
	"strconv"

	"pantheon-platform/backend/internal/shared/response"
)

type MenuHandler struct {
	service MenuService
}

func NewMenuHandler(service MenuService) *MenuHandler {
	return &MenuHandler{service: service}
}

// Create creates a menu.
// @Summary Create Menu
// @Description Create a menu item in the current tenant.
// @Tags Menu Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body MenuRequest true "Menu payload"
// @Success 201 {object} menuEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/menus [post]
func (h *MenuHandler) Create(c *gin.Context) {
	var req MenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	m, err := h.service.Create(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "CREATE_MENU_FAILED", err.Error())
		return
	}
	response.Created(c, ToMenuResponse(m, nil))
}

// GetByID gets menu detail by ID.
// @Summary Get Menu
// @Description Get menu detail by menu ID.
// @Tags Menu Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Menu ID"
// @Success 200 {object} menuEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Router /system/menus/{id} [get]
func (h *MenuHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "MENU_NOT_FOUND", "Menu not found")
		return
	}
	response.Success(c, resp)
}

// List lists menus.
// @Summary List Menus
// @Description Get paginated menu list.
// @Tags Menu Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(1000) minimum(1)
// @Param search query string false "Search keyword matched against menu name, code, or path"
// @Success 200 {object} menuListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/menus [get]
func (h *MenuHandler) List(c *gin.Context) {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "1000"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 1000
	}

	resp, err := h.service.List(c.Request.Context(), page, pageSize, search)
	if err != nil {
		response.InternalError(c, "LIST_MENUS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// GetTree gets the menu tree.
// @Summary Get Menu Tree
// @Description Get hierarchical menu tree for the current tenant.
// @Tags Menu Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} menuTreeEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/menus/tree [get]
func (h *MenuHandler) GetTree(c *gin.Context) {
	var req MenuTreeRequest
	_ = c.ShouldBindQuery(&req)
	resp, err := h.service.GetTree(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "GET_TREE_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// Update updates a menu.
// @Summary Update Menu
// @Description Update menu information.
// @Tags Menu Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Menu ID"
// @Param request body MenuRequest true "Menu payload"
// @Success 200 {object} menuEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/menus/{id} [put]
func (h *MenuHandler) Update(c *gin.Context) {
	var req MenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	m, err := h.service.Update(c.Request.Context(), c.Param("id"), &req)
	if err != nil {
		response.InternalError(c, "UPDATE_MENU_FAILED", err.Error())
		return
	}
	response.Success(c, ToMenuResponse(m, nil))
}

// Delete deletes a menu.
// @Summary Delete Menu
// @Description Delete a menu by ID.
// @Tags Menu Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Menu ID"
// @Success 200 {object} menuMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/menus/{id} [delete]
func (h *MenuHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_MENU_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchDelete deletes multiple menus in one request.
// @Summary Batch Delete Menus
// @Description Delete multiple menus from leaf to root after validating that no unselected child menus remain.
// @Tags Menu Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body MenuBatchDeleteRequest true "Menu IDs"
// @Success 200 {object} menuMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/menus/batch-delete [post]
func (h *MenuHandler) BatchDelete(c *gin.Context) {
	var req MenuBatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchDelete(c.Request.Context(), req.MenuIDs); err != nil {
		response.InternalError(c, "BATCH_DELETE_MENU_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// BatchUpdateStatus updates the status of multiple menus.
// @Summary Batch Update Menu Status
// @Description Enable or disable multiple menus and refresh affected role menu snapshots.
// @Tags Menu Management
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body MenuStatusRequest true "Menu status payload"
// @Success 200 {object} menuMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/menus/status [patch]
func (h *MenuHandler) BatchUpdateStatus(c *gin.Context) {
	var req MenuStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}
	if err := h.service.BatchUpdateStatus(c.Request.Context(), &req); err != nil {
		response.InternalError(c, "BATCH_UPDATE_MENU_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

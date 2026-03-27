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

func (h *MenuHandler) GetByID(c *gin.Context) {
	resp, err := h.service.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.NotFound(c, "MENU_NOT_FOUND", "Menu not found")
		return
	}
	response.Success(c, resp)
}

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

func (h *MenuHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "DELETE_MENU_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

func (h *MenuHandler) RegisterRoutes(group *gin.RouterGroup) {
	menus := group.Group("/menus")
	{
		menus.GET("", h.List)
		menus.GET("/tree", h.GetTree)
		menus.POST("", h.Create)
		menus.GET("/:id", h.GetByID)
		menus.PUT("/:id", h.Update)
		menus.DELETE("/:id", h.Delete)
	}
}

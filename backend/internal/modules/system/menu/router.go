package menu

import "github.com/gin-gonic/gin"

// RegisterRoutes registers menu routes.
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

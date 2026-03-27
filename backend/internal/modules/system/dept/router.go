package dept

import "github.com/gin-gonic/gin"

// RegisterRoutes registers department routes.
func (h *DepartmentHandler) RegisterRoutes(group *gin.RouterGroup) {
	depts := group.Group("/depts")
	{
		depts.GET("", h.List)
		depts.POST("", h.Create)
		depts.GET("/tree", h.GetTree)
		depts.GET("/:id", h.GetByID)
		depts.PUT("/:id", h.Update)
		depts.DELETE("/:id", h.Delete)
	}
}

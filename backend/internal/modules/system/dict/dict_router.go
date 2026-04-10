package dict

import "github.com/gin-gonic/gin"

// RegisterRoutes registers dictionary routes.
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

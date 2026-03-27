package i18n

import (
	"github.com/gin-gonic/gin"
)

// RegisterI18nRoutes registers i18n management routes.
func RegisterI18nRoutes(router *gin.RouterGroup, handler *TranslationHandler) {
	i18n := router.Group("/i18n")
	{
		// Translation CRUD.
		i18n.POST("/translations", handler.CreateTranslation)
		i18n.PUT("/translations/:id", handler.UpdateTranslation)
		i18n.DELETE("/translations/:id", handler.DeleteTranslation)
		i18n.GET("/translations", handler.ListTranslations)
		i18n.GET("/translations/:id", handler.GetTranslation)

		// Module and key discovery.
		i18n.GET("/modules", handler.GetModules)
		i18n.GET("/keys", handler.GetKeys)

		// Import and export.
		i18n.POST("/translations/import", handler.ImportTranslations)
		i18n.GET("/translations/export", handler.ExportTranslations)

		// Supported languages.
		i18n.GET("/languages", handler.GetSupportedLanguages)
	}
}

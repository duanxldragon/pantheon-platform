package notification

import (
	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/middleware"
)

type Router struct {
	handler *NotificationHandler
}

func NewRouter(handler *NotificationHandler) *Router {
	return &Router{handler: handler}
}

func (r *Router) RegisterRoutes(api *gin.RouterGroup, authMiddleware gin.HandlerFunc, tenantMiddleware gin.HandlerFunc) {
	// All notification APIs require auth; tenant middleware is optional depending on deployment.
	guard := []gin.HandlerFunc{authMiddleware}
	if tenantMiddleware != nil {
		guard = append(guard, tenantMiddleware)
	}
	if middleware.GlobalAuthService != nil {
		guard = append(guard, middleware.Authz(middleware.GlobalAuthService))
	}

	notifications := api.Group("/notifications")
	notifications.Use(guard...)
	{
		notifications.POST("", r.handler.CreateNotification)
		notifications.GET("", r.handler.ListNotifications)
		notifications.GET("/stats", r.handler.GetStats)
		notifications.GET("/:id", r.handler.GetNotification)
		notifications.PUT("/:id", r.handler.UpdateNotification)
		notifications.DELETE("/:id", r.handler.DeleteNotification)

		// Send
		notifications.POST("/send", r.handler.SendNotification)
		notifications.POST("/send/template", r.handler.SendFromTemplate)

		// Inbox
		inbox := notifications.Group("/inbox")
		{
			inbox.GET("", r.handler.ListInbox)
			inbox.GET("/unread-count", r.handler.GetUnreadCount)
			inbox.GET("/:id", r.handler.GetInbox)
			inbox.DELETE("/:id", r.handler.DeleteInbox)
			inbox.POST("/mark-read", r.handler.MarkAsRead)
			inbox.POST("/mark-all-read", r.handler.MarkAllAsRead)
		}

		// Templates
		templates := notifications.Group("/templates")
		{
			templates.POST("", r.handler.CreateTemplate)
			templates.GET("", r.handler.ListTemplates)
			templates.GET("/:id", r.handler.GetTemplate)
			templates.PUT("/:id", r.handler.UpdateTemplate)
			templates.DELETE("/:id", r.handler.DeleteTemplate)
		}

		// Jobs
		jobs := notifications.Group("/jobs")
		{
			jobs.POST("/process", r.handler.ProcessJobs)
		}
	}
}

package auth

import "github.com/gin-gonic/gin"

// AuthRouter registers auth module routes.
type AuthRouter struct {
	handler *AuthHandler
}

// NewAuthRouter creates a new auth router.
func NewAuthRouter(handler *AuthHandler) *AuthRouter {
	return &AuthRouter{handler: handler}
}

// RegisterRoutes registers auth routes.
func (r *AuthRouter) RegisterRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc) {
	r.handler.RegisterRoutes(router.Group("/api/v1"), authMiddleware)
}

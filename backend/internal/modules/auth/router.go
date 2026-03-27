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
	api := router.Group("/api/v1")

	auth := api.Group("/auth")
	{
		auth.GET("/config", r.handler.GetPublicConfig)
		auth.POST("/login", r.handler.Login)
		auth.POST("/2fa/login", r.handler.VerifyLogin2FA)
		auth.POST("/refresh", r.handler.RefreshToken)
		auth.POST("/unlock", r.handler.UnlockAccount)
		auth.GET("/attempts", r.handler.GetLoginAttempts)
		auth.POST("/validate-password", r.handler.ValidatePassword)
	}

	protectedAuth := api.Group("/auth")
	protectedAuth.Use(authMiddleware)
	{
		protectedAuth.GET("/current", r.handler.GetCurrentUser)
		protectedAuth.POST("/logout", r.handler.Logout)
	}

	twoFactor := protectedAuth.Group("/2fa")
	{
		twoFactor.GET("/status", r.handler.GetTwoFactorAuthStatus)
		twoFactor.POST("/enable", r.handler.EnableTwoFactorAuth)
		twoFactor.POST("/verify", r.handler.VerifyAndEnable2FA)
		twoFactor.POST("/disable", r.handler.DisableTwoFactorAuth)
		twoFactor.POST("/backup-codes", r.handler.GenerateNewBackupCodes)
		twoFactor.POST("/verify-code", r.handler.Verify2FACode)
	}

	sessions := protectedAuth.Group("/sessions")
	{
		sessions.GET("", r.handler.ListSessions)
		sessions.DELETE("/:jti", r.handler.KickSession)
	}

	apiKeys := protectedAuth.Group("/api-keys")
	{
		apiKeys.GET("", r.handler.ListApiKeys)
		apiKeys.POST("", r.handler.CreateApiKey)
		apiKeys.PUT("/:id", r.handler.UpdateApiKey)
		apiKeys.DELETE("/:id", r.handler.DeleteApiKey)
	}
}

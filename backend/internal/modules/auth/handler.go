package auth

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pantheon-platform/backend/internal/shared/response"
)

// AuthErrorResponse documents auth error responses.
type AuthErrorResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// AuthHandler handles auth module HTTP requests.
type AuthHandler struct {
	authService AuthService
}

// NewAuthHandler creates a new auth handler.
func NewAuthHandler(authService AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Login logs in a user and returns access and refresh tokens
// @Summary User Login
// @Description Authenticate user with credentials and return JWT tokens
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} AuthErrorResponse
// @Failure 401 {object} AuthErrorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	ctx := c.Request.Context()
	ctx = context.WithValue(ctx, "client_ip", c.ClientIP())
	ctx = context.WithValue(ctx, "user_agent", c.Request.UserAgent())

	resp, err := h.authService.Login(ctx, &req)
	if err != nil {
		response.Unauthorized(c, "INVALID_CREDENTIALS", ErrorToTranslationKey(err))
		return
	}
	response.Success(c, resp)
}

// RefreshToken refreshes an access token using a valid refresh token
// @Summary Refresh Access Token
// @Description Get a new access token using a refresh token
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body RefreshTokenRequest true "Refresh token"
// @Success 200 {object} RefreshTokenResponse
// @Failure 401 {object} AuthErrorResponse
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	resp, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		response.Unauthorized(c, "REFRESH_FAILED", "auth.error.invalid_token")
		return
	}
	response.Success(c, resp)
}

// GetCurrentUser returns the profile of the currently authenticated user
// @Summary Get Current User
// @Description Get current user information from token context
// @Tags User
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} CurrentUserResponse
// @Failure 401 {object} AuthErrorResponse
// @Router /auth/current [get]
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.unauthorized")
		return
	}

	currentUser, err := h.authService.GetCurrentUser(
		c.Request.Context(),
		userID,
		c.GetString("username"),
		c.GetString("tenant_id"),
	)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "USER_NOT_FOUND", "User not found")
			return
		}
		response.InternalError(c, "GET_CURRENT_USER_FAILED", err.Error())
		return
	}

	response.Success(c, currentUser)
}

// GetLoginAttempts returns the login-attempt summary for an account.
func (h *AuthHandler) GetLoginAttempts(c *gin.Context) {
	username := c.Query("username")
	tenantCode := c.Query("tenant_code")

	if username == "" {
		response.BadRequest(c, "INVALID_REQUEST", "Username is required")
		return
	}

	summary, err := h.authService.GetLoginAttemptsSummary(c.Request.Context(), username, tenantCode)
	if err != nil {
		response.InternalError(c, "GET_LOGIN_ATTEMPTS_FAILED", err.Error())
		return
	}

	response.Success(c, summary)
}

// ValidatePassword checks password strength against the default policy.
func (h *AuthHandler) ValidatePassword(c *gin.Context) {
	var req ValidatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}

	result := ValidatePassword(req.Password, req.Username, req.Email, DefaultPasswordPolicy())
	resp := &ValidatePasswordResponse{
		Valid:    result.Valid,
		Strength: result.Strength,
		Score:    result.Score,
		Errors:   result.Errors,
		Requirements: map[string]bool{
			"min_length":    len(req.Password) >= 8,
			"has_uppercase": containsUppercase(req.Password),
			"has_lowercase": containsLowercase(req.Password),
			"has_digit":     containsDigit(req.Password),
			"has_special":   containsSpecial(req.Password),
			"not_common":    !isCommonPassword(req.Password),
		},
	}

	response.Success(c, resp)
}

// Logout invalidates the current user session
// @Summary User Logout
// @Description Invalidate the session token
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	userID, _ := c.Get("user_id")
	jti, _ := c.Get("jti")

	if userIDStr, ok := userID.(string); ok {
		if jtiStr, ok := jti.(string); ok {
			ctx := c.Request.Context()

			// If user belongs to a tenant, try to attach tenant DB context so that
			// logout log updates hit the correct tenant database.
			if tenantID := c.GetString("tenant_id"); tenantID != "" && h.authService != nil {
				if tenantDB := h.authService.GetTenantDB(tenantID); tenantDB != nil {
					ctx = context.WithValue(ctx, "tenant_db", tenantDB)
					ctx = context.WithValue(ctx, "tenant_id", tenantID)
				}
			}

			_ = h.authService.Logout(ctx, userIDStr, jtiStr)
		}
	}

	response.Success(c, gin.H{
		"message": "Logged out successfully",
	})
}

// UnlockAccount clears the lock state for an account.
func (h *AuthHandler) UnlockAccount(c *gin.Context) {
	var req UnlockAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	if err := h.authService.UnlockAccount(c.Request.Context(), req.Username, req.TenantCode); err != nil {
		response.InternalError(c, "UNLOCK_FAILED", err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "Account unlocked successfully",
	})
}

// GetPublicConfig returns the public authentication configuration.
func (h *AuthHandler) GetPublicConfig(c *gin.Context) {
	config := h.authService.GetPublicConfig()
	response.Success(c, config)
}

// CreateApiKey creates a new API key for the current user.
func (h *AuthHandler) CreateApiKey(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.unauthorized")
		return
	}

	var req CreateApiKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}

	result, err := h.authService.CreateApiKey(c.Request.Context(), userID, req.Name, req.Permissions)
	if err != nil {
		response.InternalError(c, "CREATE_API_KEY_FAILED", err.Error())
		return
	}

	response.Created(c, result)
}

// ListApiKeys returns API keys for the current user.
func (h *AuthHandler) ListApiKeys(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.unauthorized")
		return
	}

	result, err := h.authService.ListApiKeys(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "LIST_API_KEYS_FAILED", err.Error())
		return
	}

	response.Success(c, result)
}

// DeleteApiKey deletes one API key for the current user.
func (h *AuthHandler) DeleteApiKey(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.unauthorized")
		return
	}

	keyID := c.Param("id")
	if keyID == "" {
		response.BadRequest(c, "INVALID_REQUEST", "API key ID is required")
		return
	}

	if err := h.authService.DeleteApiKey(c.Request.Context(), userID, keyID); err != nil {
		response.InternalError(c, "DELETE_API_KEY_FAILED", err.Error())
		return
	}

	response.Success(c, gin.H{"message": "API key deleted successfully"})
}

// UpdateApiKey updates one API key for the current user.
func (h *AuthHandler) UpdateApiKey(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.unauthorized")
		return
	}

	keyID := c.Param("id")
	if keyID == "" {
		response.BadRequest(c, "INVALID_REQUEST", "API key ID is required")
		return
	}

	var req UpdateApiKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}

	if err := h.authService.UpdateApiKey(c.Request.Context(), userID, keyID, req.Name, req.Permissions); err != nil {
		response.InternalError(c, "UPDATE_API_KEY_FAILED", err.Error())
		return
	}

	response.Success(c, gin.H{"message": "API key updated successfully"})
}

// ======================== Two-Factor Authentication Handlers ========================

// GetTwoFactorAuthStatus returns the current 2FA status.
func (h *AuthHandler) GetTwoFactorAuthStatus(c *gin.Context) {
	userID := c.GetString("user_id")
	tenantID := c.GetString("tenant_id")

	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.user_not_authenticated")
		return
	}

	status, err := h.authService.GetTwoFactorAuthStatus(c.Request.Context(), userID, tenantID)
	if err != nil {
		response.InternalError(c, "GET_2FA_STATUS_FAILED", err.Error())
		return
	}

	response.Success(c, status)
}

// EnableTwoFactorAuth starts 2FA setup for the current user.
func (h *AuthHandler) EnableTwoFactorAuth(c *gin.Context) {
	userID := c.GetString("user_id")
	tenantID := c.GetString("tenant_id")

	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.user_not_authenticated")
		return
	}

	result, err := h.authService.EnableTwoFactorAuth(c.Request.Context(), userID, tenantID)
	if err != nil {
		response.InternalError(c, "ENABLE_2FA_FAILED", err.Error())
		return
	}

	response.Success(c, result)
}

// VerifyAndEnable2FA verifies the setup code and enables 2FA.
func (h *AuthHandler) VerifyAndEnable2FA(c *gin.Context) {
	var req Enable2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	userID := c.GetString("user_id")
	tenantID := c.GetString("tenant_id")

	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.user_not_authenticated")
		return
	}

	if err := h.authService.VerifyAndEnable2FA(c.Request.Context(), userID, tenantID, req.Code); err != nil {
		response.BadRequest(c, "INVALID_2FA_CODE", ErrorToTranslationKey(err))
		return
	}

	response.Success(c, gin.H{"message": "auth.message.2fa_enabled"})
}

// DisableTwoFactorAuth disables 2FA for the current user.
func (h *AuthHandler) DisableTwoFactorAuth(c *gin.Context) {
	var req Disable2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	userID := c.GetString("user_id")
	tenantID := c.GetString("tenant_id")

	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.user_not_authenticated")
		return
	}

	if err := h.authService.DisableTwoFactorAuth(c.Request.Context(), userID, tenantID, req.Password); err != nil {
		response.BadRequest(c, "DISABLE_2FA_FAILED", ErrorToTranslationKey(err))
		return
	}

	response.Success(c, gin.H{"message": "auth.message.2fa_disabled"})
}

// GenerateNewBackupCodes regenerates backup codes for the current user.
func (h *AuthHandler) GenerateNewBackupCodes(c *gin.Context) {
	var req GenerateBackupCodesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	userID := c.GetString("user_id")
	tenantID := c.GetString("tenant_id")

	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.user_not_authenticated")
		return
	}

	result, err := h.authService.GenerateNewBackupCodes(c.Request.Context(), userID, tenantID, req.Count)
	if err != nil {
		response.InternalError(c, "GENERATE_BACKUP_CODES_FAILED", err.Error())
		return
	}

	response.Success(c, result)
}

// Verify2FACode validates a 2FA code for the current user.
func (h *AuthHandler) Verify2FACode(c *gin.Context) {
	var req Verify2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	userID := c.GetString("user_id")
	tenantID := c.GetString("tenant_id")

	if userID == "" {
		response.Unauthorized(c, "UNAUTHORIZED", "auth.error.user_not_authenticated")
		return
	}

	result, err := h.authService.Verify2FACode(c.Request.Context(), userID, tenantID, req.Code)
	if err != nil {
		response.InternalError(c, "VERIFY_2FA_CODE_FAILED", err.Error())
		return
	}

	response.Success(c, result)
}

// VerifyLogin2FA completes login after password validation and 2FA verification.
func (h *AuthHandler) VerifyLogin2FA(c *gin.Context) {
	var req Login2FAVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	ctx := c.Request.Context()
	ctx = context.WithValue(ctx, "client_ip", c.ClientIP())
	ctx = context.WithValue(ctx, "user_agent", c.Request.UserAgent())

	resp, err := h.authService.VerifyLogin2FA(ctx, req.TempToken, req.Code, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		response.Unauthorized(c, "INVALID_2FA_CODE", ErrorToTranslationKey(err))
		return
	}

	response.Success(c, resp)
}

// ListSessions returns all active sessions for the current user.
func (h *AuthHandler) ListSessions(c *gin.Context) {
	userID, _ := c.Get("user_id")
	jti, _ := c.Get("jti")
	userIDStr, _ := userID.(string)
	jtiStr, _ := jti.(string)

	resp, err := h.authService.ListActiveSessions(c.Request.Context(), userIDStr, jtiStr)
	if err != nil {
		response.InternalError(c, "LIST_SESSIONS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

// KickSession invalidates a specific session (single device kick).
func (h *AuthHandler) KickSession(c *gin.Context) {
	userID, _ := c.Get("user_id")
	jti, _ := c.Get("jti")
	userIDStr, _ := userID.(string)
	currentJTI, _ := jti.(string)

	targetJTI := c.Param("jti")
	if targetJTI == "" {
		response.BadRequest(c, "INVALID_REQUEST", "auth.error.invalid_request_parameters")
		return
	}

	// Prevent kicking own current session
	if targetJTI == currentJTI {
		response.BadRequest(c, "CANNOT_KICK_SELF", "auth.error.cannot_kick_self")
		return
	}

	if err := h.authService.KickSession(c.Request.Context(), userIDStr, targetJTI); err != nil {
		response.InternalError(c, "KICK_SESSION_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Session kicked successfully"})
}

package setting

import (
	"strings"

	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type SettingHandler struct {
	svc SettingService
}

func NewSettingHandler(svc SettingService) *SettingHandler {
	return &SettingHandler{svc: svc}
}

// List lists system settings.
// @Summary List Settings
// @Description Get all system settings for the current tenant.
// @Tags System Settings
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} settingListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/settings [get]
func (h *SettingHandler) List(c *gin.Context) {
	items, err := h.svc.List(c.Request.Context())
	if err != nil {
		response.InternalError(c, "LIST_SETTINGS_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

// Update updates one system setting.
// @Summary Update Setting
// @Description Update one system setting by key.
// @Tags System Settings
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param key path string true "Setting Key"
// @Param request body UpdateSettingRequest true "Setting payload"
// @Success 200 {object} settingMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/settings/{key} [put]
func (h *SettingHandler) Update(c *gin.Context) {
	key := strings.TrimSpace(c.Param("key"))
	if key == "" {
		response.BadRequest(c, "INVALID_KEY", "Invalid setting key")
		return
	}

	var req UpdateSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}

	updatedBy := c.GetString("username")
	if updatedBy == "" {
		updatedBy = c.GetString("user_id")
	}

	if err := h.svc.Update(c.Request.Context(), key, req.Value, updatedBy); err != nil {
		response.InternalError(c, "UPDATE_SETTING_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

// UpdateBatch updates settings in batch.
// @Summary Batch Update Settings
// @Description Update multiple system settings in one request.
// @Tags System Settings
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body settingBatchUpdateRequest true "Batch setting payload"
// @Success 200 {object} settingBatchUpdateEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /system/settings/batch [post]
func (h *SettingHandler) UpdateBatch(c *gin.Context) {
	var req BatchUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
		return
	}

	updatedBy := c.GetString("username")
	if updatedBy == "" {
		updatedBy = c.GetString("user_id")
	}

	if err := h.svc.UpdateBatch(c.Request.Context(), req.Updates, updatedBy); err != nil {
		response.InternalError(c, "BATCH_UPDATE_SETTINGS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok", "count": len(req.Updates)})
}

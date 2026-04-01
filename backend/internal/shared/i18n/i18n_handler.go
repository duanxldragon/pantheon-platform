package i18n

import (
	"context"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"pantheon-platform/backend/internal/shared/response"
)

// TranslationHandler handles translation management HTTP requests.
type TranslationHandler struct {
	service         *TranslationService
	defaultTenantID string
}

// NewTranslationHandler creates a translation handler.
func NewTranslationHandler(service *TranslationService, defaultTenantID string) *TranslationHandler {
	return &TranslationHandler{service: service, defaultTenantID: defaultTenantID}
}

// CreateTranslationRequest defines the create-translation payload.
type CreateTranslationRequest struct {
	Module   string   `json:"module" binding:"required" example:"system"`
	Key      string   `json:"key" binding:"required" example:"user.create.success"`
	Language Language `json:"language" binding:"required" example:"zh"`
	Value    string   `json:"value" binding:"required" example:"User created successfully"`
	TenantID *string  `json:"tenant_id" example:"tenant-default"`
}

// UpdateTranslationRequest defines the update-translation payload.
type UpdateTranslationRequest struct {
	Value string `json:"value" binding:"required" example:"Updated translation value"`
}

// ListTranslationsRequest defines translation list filters.
type ListTranslationsRequest struct {
	Module   string  `form:"module" example:"system"`
	Language string  `form:"language" example:"en"`
	Page     int     `form:"page,default=1" example:"1"`
	PageSize int     `form:"page_size,default=20" example:"20"`
	TenantID *string `form:"tenant_id" example:"tenant-default"`
}

func normalizeTenantPointer(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	if trimmed == *value {
		return value
	}
	return &trimmed
}

func (h *TranslationHandler) tenantPtr(value string) *string {
	v := value
	return &v
}

func (h *TranslationHandler) currentTenantID(c *gin.Context) string {
	return c.GetString("tenant_id")
}

func (h *TranslationHandler) isPlatformTenant(tenantID string) bool {
	if tenantID == "" {
		return true
	}
	if h.defaultTenantID == "" {
		return false
	}
	return tenantID == h.defaultTenantID
}

func (h *TranslationHandler) canAccessTranslation(tenantID string, translation *Translation) bool {
	if h.isPlatformTenant(tenantID) {
		return true
	}
	if translation.TenantID == nil {
		return false
	}
	return *translation.TenantID == tenantID
}

// ImportTranslationsRequest defines the import payload.
type ImportTranslationsRequest struct {
	Translations []Translation `json:"translations" binding:"required"`
}

// ExportTranslationsRequest defines the export filters.
type ExportTranslationsRequest struct {
	Module   string  `form:"module" example:"system"`
	Language string  `form:"language" example:"en"`
	TenantID *string `form:"tenant_id" example:"tenant-default"`
}

// CreateTranslation creates a translation.
func (h *TranslationHandler) CreateTranslation(c *gin.Context) {
	var req CreateTranslationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	// Validate the requested language code.
	if !IsValidLanguage(req.Language) {
		response.BadRequest(c, "INVALID_LANGUAGE", "Invalid language code")
		return
	}

	req.TenantID = normalizeTenantPointer(req.TenantID)
	currentTenant := h.currentTenantID(c)
	if !h.isPlatformTenant(currentTenant) {
		req.TenantID = h.tenantPtr(currentTenant)
	}

	translation := &Translation{
		Module:   req.Module,
		Key:      req.Key,
		Language: req.Language,
		Value:    req.Value,
		TenantID: req.TenantID,
	}

	if err := h.service.CreateTranslation(c.Request.Context(), translation); err != nil {
		response.InternalError(c, "CREATE_FAILED", err.Error())
		return
	}

	response.Success(c, translation)
}

// UpdateTranslation updates a translation.
func (h *TranslationHandler) UpdateTranslation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.BadRequest(c, "INVALID_ID", "Invalid translation ID")
		return
	}

	var req UpdateTranslationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	translation, err := h.service.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		response.NotFound(c, "NOT_FOUND", "Translation not found")
		return
	}

	currentTenant := h.currentTenantID(c)
	if !h.canAccessTranslation(currentTenant, translation) {
		response.Forbidden(c, "FORBIDDEN", "You are not allowed to modify this translation")
		return
	}

	if err := h.service.UpdateTranslation(c.Request.Context(), uint(id), req.Value); err != nil {
		response.InternalError(c, "UPDATE_FAILED", err.Error())
		return
	}

	translation.Value = req.Value
	response.Success(c, translation)
}

// DeleteTranslation deletes a translation.
func (h *TranslationHandler) DeleteTranslation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.BadRequest(c, "INVALID_ID", "Invalid translation ID")
		return
	}

	translation, err := h.service.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		response.NotFound(c, "NOT_FOUND", "Translation not found")
		return
	}

	if !h.canAccessTranslation(h.currentTenantID(c), translation) {
		response.Forbidden(c, "FORBIDDEN", "You are not allowed to delete this translation")
		return
	}

	if err := h.service.DeleteTranslation(c.Request.Context(), uint(id)); err != nil {
		response.InternalError(c, "DELETE_FAILED", err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Translation deleted successfully"})
}

// GetTranslation fetches one translation by ID.
func (h *TranslationHandler) GetTranslation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.BadRequest(c, "INVALID_ID", "Invalid translation ID")
		return
	}

	translation, err := h.service.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		response.NotFound(c, "NOT_FOUND", "Translation not found")
		return
	}

	if !h.canAccessTranslation(h.currentTenantID(c), translation) {
		response.Forbidden(c, "FORBIDDEN", "You are not allowed to view this translation")
		return
	}

	response.Success(c, translation)
}

// ListTranslations lists translations.
func (h *TranslationHandler) ListTranslations(c *gin.Context) {
	var req ListTranslationsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	req.TenantID = normalizeTenantPointer(req.TenantID)
	includeGlobal := strings.EqualFold(c.DefaultQuery("include_global", "false"), "true")
	currentTenant := h.currentTenantID(c)

	var targetTenant *string
	if h.isPlatformTenant(currentTenant) {
		targetTenant = req.TenantID
	} else {
		targetTenant = h.tenantPtr(currentTenant)
		includeGlobal = true
	}

	translations, total, err := h.service.GetTranslations(
		c.Request.Context(),
		req.Module,
		req.Language,
		targetTenant,
		includeGlobal,
		req.Page,
		req.PageSize,
	)
	if err != nil {
		response.InternalError(c, "LIST_FAILED", err.Error())
		return
	}

	response.Success(c, gin.H{
		"items":     translations,
		"total":     total,
		"page":      req.Page,
		"page_size": req.PageSize,
	})
}

// GetModules returns available modules.
func (h *TranslationHandler) GetModules(c *gin.Context) {
	tenantParam := c.Query("tenant_id")
	var requestedTenant *string
	if tenantParam != "" {
		requestedTenant = &tenantParam
	}
	requestedTenant = normalizeTenantPointer(requestedTenant)
	includeGlobal := strings.EqualFold(c.DefaultQuery("include_global", "false"), "true")

	currentTenant := h.currentTenantID(c)
	if !h.isPlatformTenant(currentTenant) {
		requestedTenant = h.tenantPtr(currentTenant)
		includeGlobal = true
	}

	modules, err := h.service.GetModules(c.Request.Context(), requestedTenant, includeGlobal)
	if err != nil {
		response.InternalError(c, "GET_MODULES_FAILED", err.Error())
		return
	}

	response.Success(c, modules)
}

// GetKeys returns keys for a module.
func (h *TranslationHandler) GetKeys(c *gin.Context) {
	module := c.Query("module")
	if module == "" {
		response.BadRequest(c, "MISSING_MODULE", "Module parameter is required")
		return
	}

	tenantParam := c.Query("tenant_id")
	var requestedTenant *string
	if tenantParam != "" {
		requestedTenant = &tenantParam
	}
	requestedTenant = normalizeTenantPointer(requestedTenant)
	includeGlobal := strings.EqualFold(c.DefaultQuery("include_global", "false"), "true")

	currentTenant := h.currentTenantID(c)
	if !h.isPlatformTenant(currentTenant) {
		requestedTenant = h.tenantPtr(currentTenant)
		includeGlobal = true
	}

	keys, err := h.service.GetKeys(c.Request.Context(), module, requestedTenant, includeGlobal)
	if err != nil {
		response.InternalError(c, "GET_KEYS_FAILED", err.Error())
		return
	}

	response.Success(c, keys)
}

// ImportTranslations imports translations in batch.
func (h *TranslationHandler) ImportTranslations(c *gin.Context) {
	var req ImportTranslationsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	currentTenant := h.currentTenantID(c)
	isPlatform := h.isPlatformTenant(currentTenant)
	for i := range req.Translations {
		req.Translations[i].TenantID = normalizeTenantPointer(req.Translations[i].TenantID)
		if !isPlatform {
			req.Translations[i].TenantID = h.tenantPtr(currentTenant)
		}
	}

	if err := h.service.ImportTranslations(c.Request.Context(), req.Translations); err != nil {
		response.InternalError(c, "IMPORT_FAILED", err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "Translations imported successfully",
		"count":   len(req.Translations),
	})
}

// ExportTranslations exports translations.
func (h *TranslationHandler) ExportTranslations(c *gin.Context) {
	var req ExportTranslationsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	req.TenantID = normalizeTenantPointer(req.TenantID)
	includeGlobal := strings.EqualFold(c.DefaultQuery("include_global", "false"), "true")
	currentTenant := h.currentTenantID(c)
	var targetTenant *string
	if h.isPlatformTenant(currentTenant) {
		targetTenant = req.TenantID
	} else {
		targetTenant = h.tenantPtr(currentTenant)
		includeGlobal = true
	}

	translations, err := h.service.ExportTranslations(c.Request.Context(), req.Module, req.Language, targetTenant, includeGlobal)
	if err != nil {
		response.InternalError(c, "EXPORT_FAILED", err.Error())
		return
	}

	response.Success(c, translations)
}

// GetSupportedLanguages returns supported languages.
func (h *TranslationHandler) GetSupportedLanguages(c *gin.Context) {
	languages := GetSupportedLanguages()
	response.Success(c, languages)
}

// scopedTranslator avoids mutating a shared Translator instance per request (SetLanguage),
// by translating using a fixed request-scoped language.
type scopedTranslator struct {
	base     Translator
	language Language
}

var _ Translator = (*scopedTranslator)(nil)

func (t *scopedTranslator) Translate(ctx context.Context, key string, params ...interface{}) string {
	return t.base.TranslateWithLanguage(ctx, t.language, key, params...)
}

func (t *scopedTranslator) TranslateWithLanguage(ctx context.Context, language Language, key string, params ...interface{}) string {
	return t.base.TranslateWithLanguage(ctx, language, key, params...)
}

func (t *scopedTranslator) SetLanguage(language Language) { t.language = language }
func (t *scopedTranslator) GetLanguage() Language         { return t.language }

func (t *scopedTranslator) GetTranslations(ctx context.Context) (TranslationMap, error) {
	return t.base.GetTranslations(ctx)
}

func (t *scopedTranslator) LoadTranslations(ctx context.Context) error {
	return t.base.LoadTranslations(ctx)
}

// TranslationMiddleware resolves request language and injects a scoped translator.
func TranslationMiddleware(translator Translator) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read language preference from the request header.
		lang := c.GetHeader("Accept-Language")
		if lang == "" {
			lang = string(LanguageDefault)
		}

		// Parse the language code using a simplified strategy.
		// Production setups may require more complete language negotiation.
		var language Language
		switch {
		case len(lang) >= 2 && lang[:2] == "en":
			language = LanguageEN
		case len(lang) >= 2 && lang[:2] == "ja":
			language = LanguageJA
		case len(lang) >= 2 && lang[:2] == "ko":
			language = LanguageKO
		default:
			language = LanguageDefault
		}

		if translator != nil {
			c.Set("translator", &scopedTranslator{base: translator, language: language})
		}
		c.Set("language", language)
		c.Next()
	}
}

// GetTranslator returns the translator from Gin context.
func GetTranslator(c *gin.Context) Translator {
	if translator, exists := c.Get("translator"); exists {
		return translator.(Translator)
	}
	return nil
}

// Translate is a request-scoped translation helper.
func Translate(c *gin.Context, key string, params ...interface{}) string {
	if translator := GetTranslator(c); translator != nil {
		return translator.Translate(c.Request.Context(), key, params...)
	}
	return key
}

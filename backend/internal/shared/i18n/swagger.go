package i18n

import "pantheon-platform/backend/internal/shared/response"

type i18nMessageData struct {
	Message string `json:"message" example:"success"`
}
type i18nImportData struct {
	Message string `json:"message" example:"success"`
	Count   int    `json:"count" example:"2"`
}
type i18nTranslationListData struct {
	Items    []Translation `json:"items"`
	Total    int64         `json:"total" example:"2"`
	Page     int           `json:"page" example:"1"`
	PageSize int           `json:"page_size" example:"20"`
}
type i18nTranslationEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      *Translation   `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type i18nTranslationListEnvelope struct {
	Code      int                     `json:"code" example:"0"`
	Message   string                  `json:"message" example:"success"`
	Data      i18nTranslationListData `json:"data"`
	Meta      *response.Meta          `json:"meta,omitempty"`
	Timestamp string                  `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type i18nTranslationExportEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      []Translation  `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type i18nStringListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      []string       `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type i18nLanguageListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      []Language     `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type i18nImportEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      i18nImportData `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type i18nMessageEnvelope struct {
	Code      int             `json:"code" example:"0"`
	Message   string          `json:"message" example:"success"`
	Data      i18nMessageData `json:"data"`
	Meta      *response.Meta  `json:"meta,omitempty"`
	Timestamp string          `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

// CreateTranslationDoc godoc
// @Summary Create Translation
// @Description Create a translation entry.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body CreateTranslationRequest true "Translation payload"
// @Success 200 {object} i18nTranslationEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/translations [post]
func CreateTranslationDoc() {}

// UpdateTranslationDoc godoc
// @Summary Update Translation
// @Description Update a translation entry by ID.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Translation ID"
// @Param request body UpdateTranslationRequest true "Translation payload"
// @Success 200 {object} i18nTranslationEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 403 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/translations/{id} [put]
func UpdateTranslationDoc() {}

// DeleteTranslationDoc godoc
// @Summary Delete Translation
// @Description Delete a translation entry by ID.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Translation ID"
// @Success 200 {object} i18nMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 403 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/translations/{id} [delete]
func DeleteTranslationDoc() {}

// ListTranslationsDoc godoc
// @Summary List Translations
// @Description Get translation list.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param module query string false "Module filter"
// @Param language query string false "Language filter" Enums(zh,en,ja,ko)
// @Param tenant_id query string false "Tenant ID filter"
// @Param include_global query bool false "Whether to include platform-level translations" default(false)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Items per page" default(20) minimum(1)
// @Success 200 {object} i18nTranslationListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/translations [get]
func ListTranslationsDoc() {}

// GetTranslationDoc godoc
// @Summary Get Translation
// @Description Get translation detail by ID.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Translation ID"
// @Success 200 {object} i18nTranslationEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 403 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/translations/{id} [get]
func GetTranslationDoc() {}

// GetModulesDoc godoc
// @Summary List I18n Modules
// @Description Get translation modules.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param tenant_id query string false "Tenant ID filter"
// @Param include_global query bool false "Whether to include platform-level translations" default(false)
// @Success 200 {object} i18nStringListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/modules [get]
func GetModulesDoc() {}

// GetKeysDoc godoc
// @Summary List I18n Keys
// @Description Get translation keys for a module.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param module query string true "Module name, such as system or auth"
// @Param tenant_id query string false "Tenant ID filter"
// @Param include_global query bool false "Whether to include platform-level translations" default(false)
// @Success 200 {object} i18nStringListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/keys [get]
func GetKeysDoc() {}

// ImportTranslationsDoc godoc
// @Summary Import Translations
// @Description Import translation entries.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body ImportTranslationsRequest true "Import payload"
// @Success 200 {object} i18nImportEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/translations/import [post]
func ImportTranslationsDoc() {}

// ExportTranslationsDoc godoc
// @Summary Export Translations
// @Description Export translation entries.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param module query string false "Module filter"
// @Param language query string false "Language filter" Enums(zh,en,ja,ko)
// @Param tenant_id query string false "Tenant ID filter"
// @Param include_global query bool false "Whether to include platform-level translations" default(false)
// @Success 200 {object} i18nTranslationExportEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /i18n/translations/export [get]
func ExportTranslationsDoc() {}

// GetSupportedLanguagesDoc godoc
// @Summary List Supported Languages
// @Description Get supported translation languages.
// @Tags I18n
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} i18nLanguageListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Router /i18n/languages [get]
func GetSupportedLanguagesDoc() {}

package i18n

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strings"

	"gorm.io/gorm"
)

// Language identifies a supported translation language.
type Language string

const (
	LanguageZH      Language = "zh"
	LanguageEN      Language = "en"
	LanguageJA      Language = "ja"
	LanguageKO      Language = "ko"
	LanguageDefault Language = LanguageZH
)

// Translation stores one translated value.
type Translation struct {
	ID        uint     `gorm:"primaryKey"`
	Module    string   `gorm:"size:100;not null;index" json:"module"`
	Key       string   `gorm:"size:200;not null;index" json:"key"`
	Language  Language `gorm:"size:10;not null;index" json:"language"`
	Value     string   `gorm:"type:text;not null" json:"value"`
	TenantID  *string  `gorm:"size:36;index" json:"tenant_id"`
	CreatedAt int64    `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt int64    `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName returns the translation table name.
func (Translation) TableName() string {
	return "i18n_translations"
}

// TranslationMap stores translations grouped by language and key.
type TranslationMap map[Language]map[string]string

// Translator defines runtime translation behavior.
type Translator interface {
	Translate(ctx context.Context, key string, params ...interface{}) string
	TranslateWithLanguage(ctx context.Context, language Language, key string, params ...interface{}) string
	SetLanguage(language Language)
	GetLanguage() Language
	GetTranslations(ctx context.Context) (TranslationMap, error)
	LoadTranslations(ctx context.Context) error
}

// GormTranslator is the default Translator implementation backed by GORM.
type GormTranslator struct {
	db           *gorm.DB
	tenantID     *string
	language     Language
	translations TranslationMap
}

// NewGormTranslator creates a GORM-backed translator.
func NewGormTranslator(db *gorm.DB, tenantID *string) *GormTranslator {
	return &GormTranslator{
		db:           db,
		tenantID:     tenantID,
		language:     LanguageDefault,
		translations: make(TranslationMap),
	}
}

// SetLanguage updates the default runtime language.
func (t *GormTranslator) SetLanguage(language Language) {
	t.language = language
}

// GetLanguage returns the current runtime language.
func (t *GormTranslator) GetLanguage() Language {
	return t.language
}

// Translate translates a key using the current runtime language.
func (t *GormTranslator) Translate(ctx context.Context, key string, params ...interface{}) string {
	return t.TranslateWithLanguage(ctx, t.language, key, params...)
}

// TranslateWithLanguage translates a key using the provided language.
func (t *GormTranslator) TranslateWithLanguage(ctx context.Context, language Language, key string, params ...interface{}) string {
	if langMap, ok := t.translations[language]; ok {
		if value, ok := langMap[key]; ok {
			return t.formatMessage(value, params...)
		}
	}

	if language != LanguageDefault {
		if langMap, ok := t.translations[LanguageDefault]; ok {
			if value, ok := langMap[key]; ok {
				return t.formatMessage(value, params...)
			}
		}
	}

	return key
}

// GetTranslations loads all visible translations into a nested map.
func (t *GormTranslator) GetTranslations(ctx context.Context) (TranslationMap, error) {
	var translations []Translation

	query := t.db.WithContext(ctx).Model(&Translation{})
	if t.tenantID != nil {
		query = query.Where("tenant_id = ? OR tenant_id IS NULL", *t.tenantID)
	} else {
		query = query.Where("tenant_id IS NULL")
	}

	if err := query.Find(&translations).Error; err != nil {
		return nil, fmt.Errorf("failed to load translations: %w", err)
	}

	result := make(TranslationMap)
	for _, translation := range translations {
		if _, ok := result[translation.Language]; !ok {
			result[translation.Language] = make(map[string]string)
		}
		result[translation.Language][translation.Key] = translation.Value
	}

	return result, nil
}

// LoadTranslations refreshes the in-memory translation cache.
func (t *GormTranslator) LoadTranslations(ctx context.Context) error {
	translations, err := t.GetTranslations(ctx)
	if err != nil {
		return err
	}
	t.translations = translations
	return nil
}

// formatMessage formats translation templates using positional or named params.
func (t *GormTranslator) formatMessage(template string, params ...interface{}) string {
	if len(params) == 0 {
		return template
	}

	if strings.Contains(template, "{") {
		return t.formatNamedParams(template, params...)
	}

	return fmt.Sprintf(template, params...)
}

// formatNamedParams replaces `{name}` placeholders using a map argument.
func (t *GormTranslator) formatNamedParams(template string, params ...interface{}) string {
	result := template

	if len(params) == 1 {
		paramValue := reflect.ValueOf(params[0])
		if paramValue.Kind() == reflect.Map {
			for _, key := range paramValue.MapKeys() {
				k := fmt.Sprintf("%v", key.Interface())
				v := fmt.Sprintf("%v", paramValue.MapIndex(key).Interface())
				placeholder := "{" + k + "}"
				result = strings.ReplaceAll(result, placeholder, v)
			}
		}
	}

	return result
}

// TranslationService provides CRUD-style translation management.
type TranslationService struct {
	db *gorm.DB
}

// NewTranslationService creates a translation service.
func NewTranslationService(db *gorm.DB) *TranslationService {
	return &TranslationService{db: db}
}

// CreateTranslation creates a translation row.
func (s *TranslationService) CreateTranslation(ctx context.Context, translation *Translation) error {
	return s.db.WithContext(ctx).Create(translation).Error
}

// UpdateTranslation updates one translation value by ID.
func (s *TranslationService) UpdateTranslation(ctx context.Context, id uint, value string) error {
	return s.db.WithContext(ctx).
		Model(&Translation{}).
		Where("id = ?", id).
		Update("value", value).Error
}

// DeleteTranslation deletes a translation by ID.
func (s *TranslationService) DeleteTranslation(ctx context.Context, id uint) error {
	return s.db.WithContext(ctx).Delete(&Translation{}, id).Error
}

// GetTranslation fetches one translation with optional global fallback.
func (s *TranslationService) GetTranslation(ctx context.Context, module, key string, language Language, tenantID *string, includeGlobal bool) (*Translation, error) {
	query := s.db.WithContext(ctx).Where("module = ? AND key = ? AND language = ?", module, key, language)

	if tenantID == nil || !includeGlobal {
		query = applyTenantScope(query, tenantID, false)
		var translation Translation
		if err := query.First(&translation).Error; err != nil {
			return nil, err
		}
		return &translation, nil
	}

	var translation Translation
	if err := query.Where("tenant_id = ?", *tenantID).First(&translation).Error; err == nil {
		return &translation, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if err := s.db.WithContext(ctx).
		Where("module = ? AND key = ? AND language = ? AND tenant_id IS NULL", module, key, language).
		First(&translation).Error; err != nil {
		return nil, err
	}

	return &translation, nil
}

// GetTranslations lists translations with pagination and tenant scoping.
func (s *TranslationService) GetTranslations(ctx context.Context, module, language string, tenantID *string, includeGlobal bool, page, pageSize int) ([]Translation, int64, error) {
	var translations []Translation
	var total int64

	query := s.db.WithContext(ctx).Model(&Translation{})

	if module != "" {
		query = query.Where("module = ?", module)
	}
	if language != "" {
		query = query.Where("language = ?", language)
	}
	query = applyTenantScope(query, tenantID, includeGlobal)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&translations).Error; err != nil {
		return nil, 0, err
	}

	return translations, total, nil
}

// GetModules returns distinct translation modules.
func (s *TranslationService) GetModules(ctx context.Context, tenantID *string, includeGlobal bool) ([]string, error) {
	var modules []string

	query := s.db.WithContext(ctx).Model(&Translation{}).Select("DISTINCT module")
	query = applyTenantScope(query, tenantID, includeGlobal)

	if err := query.Scan(&modules).Error; err != nil {
		return nil, err
	}

	return modules, nil
}

// GetKeys returns distinct translation keys for one module.
func (s *TranslationService) GetKeys(ctx context.Context, module string, tenantID *string, includeGlobal bool) ([]string, error) {
	var keys []string

	query := s.db.WithContext(ctx).Model(&Translation{}).Select("DISTINCT key").Where("module = ?", module)
	query = applyTenantScope(query, tenantID, includeGlobal)

	if err := query.Scan(&keys).Error; err != nil {
		return nil, err
	}

	return keys, nil
}

// ImportTranslations upserts a batch of translations.
func (s *TranslationService) ImportTranslations(ctx context.Context, translations []Translation) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, translation := range translations {
			var existing Translation
			query := tx.Where("module = ? AND key = ? AND language = ?", translation.Module, translation.Key, translation.Language)
			if translation.TenantID == nil {
				query = query.Where("tenant_id IS NULL")
			} else {
				query = query.Where("tenant_id = ?", *translation.TenantID)
			}

			err := query.First(&existing).Error

			if err == gorm.ErrRecordNotFound {
				if err := tx.Create(&translation).Error; err != nil {
					return err
				}
			} else if err != nil {
				return err
			} else {
				translation.ID = existing.ID
				if err := tx.Save(&translation).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

// ExportTranslations exports translations using current filters and scope.
func (s *TranslationService) ExportTranslations(ctx context.Context, module, language string, tenantID *string, includeGlobal bool) ([]Translation, error) {
	var translations []Translation

	query := s.db.WithContext(ctx).Model(&Translation{})

	if module != "" {
		query = query.Where("module = ?", module)
	}
	if language != "" {
		query = query.Where("language = ?", language)
	}
	query = applyTenantScope(query, tenantID, includeGlobal)

	if err := query.Find(&translations).Error; err != nil {
		return nil, err
	}

	return translations, nil
}

// GetByID fetches one translation by primary key.
func (s *TranslationService) GetByID(ctx context.Context, id uint) (*Translation, error) {
	var translation Translation
	if err := s.db.WithContext(ctx).First(&translation, id).Error; err != nil {
		return nil, err
	}
	return &translation, nil
}

func applyTenantScope(query *gorm.DB, tenantID *string, includeGlobal bool) *gorm.DB {
	if tenantID == nil {
		return query.Where("tenant_id IS NULL")
	}
	if includeGlobal {
		return query.Where("(tenant_id = ? OR tenant_id IS NULL)", *tenantID)
	}
	return query.Where("tenant_id = ?", *tenantID)
}

// Value implements `driver.Valuer`.
func (l Language) Value() (driver.Value, error) {
	return string(l), nil
}

// Scan implements `sql.Scanner`.
func (l *Language) Scan(value interface{}) error {
	if value == nil {
		*l = LanguageDefault
		return nil
	}

	switch v := value.(type) {
	case []byte:
		*l = Language(v)
	case string:
		*l = Language(v)
	default:
		*l = Language(fmt.Sprintf("%v", v))
	}

	return nil
}

// MarshalJSON implements `json.Marshaler`.
func (l Language) MarshalJSON() ([]byte, error) {
	return json.Marshal(string(l))
}

// UnmarshalJSON implements `json.Unmarshaler`.
func (l *Language) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	*l = Language(s)
	return nil
}

// GetSupportedLanguages returns the currently supported languages.
func GetSupportedLanguages() []Language {
	return []Language{LanguageZH, LanguageEN, LanguageJA, LanguageKO}
}

// IsValidLanguage reports whether a language is supported.
func IsValidLanguage(language Language) bool {
	supported := GetSupportedLanguages()
	for _, lang := range supported {
		if lang == language {
			return true
		}
	}
	return false
}

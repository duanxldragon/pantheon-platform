package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Translator avoids a circular dependency with i18n services.
type Translator interface {
	Translate(ctx interface{}, key string, params ...interface{}) string
}

// getMessage returns the translated message when a translator is present.
func getMessage(c *gin.Context, message string) string {
	if translator, exists := c.Get("translator"); exists {
		if t, ok := translator.(interface {
			Translate(ctx interface{}, key string, params ...interface{}) string
		}); ok {
			return t.Translate(c.Request.Context(), message)
		}
	}
	return message
}

// Response is the shared API response envelope.
type Response struct {
	Code      int         `json:"code" example:"0"`
	Message   string      `json:"message" example:"success"`
	Data      interface{} `json:"data,omitempty"`
	Meta      *Meta       `json:"meta,omitempty"`
	Timestamp string      `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

// Meta contains response metadata.
type Meta struct {
	RequestID  string      `json:"request_id,omitempty" example:"20260330120000-AB12CD34"`
	Version    string      `json:"version,omitempty" example:"v1"`
	Pagination *Pagination `json:"pagination,omitempty"`
	Duration   int64       `json:"duration,omitempty" example:"35"`
}

// Pagination contains pagination metadata.
type Pagination struct {
	Page       int64 `json:"page" example:"1"`
	PageSize   int64 `json:"page_size" example:"20"`
	Total      int64 `json:"total" example:"128"`
	TotalPages int64 `json:"total_pages" example:"7"`
	HasNext    bool  `json:"has_next" example:"true"`
	HasPrev    bool  `json:"has_prev" example:"false"`
}

// ErrorDetail is the shared API error payload.
type ErrorDetail struct {
	Code      string       `json:"code" example:"INVALID_REQUEST"`
	Message   string       `json:"message" example:"Invalid request parameters"`
	Details   string       `json:"details,omitempty" example:"json: cannot unmarshal number into Go struct field"`
	Timestamp string       `json:"timestamp" example:"2026-03-30T12:00:00Z"`
	Path      string       `json:"path" example:"/api/v1/system/users"`
	RequestID string       `json:"request_id,omitempty" example:"20260330120000-AB12CD34"`
	Errors    []FieldError `json:"errors,omitempty"`
}

// FieldError describes a field-level validation error.
type FieldError struct {
	Field   string      `json:"field" example:"username"`
	Code    string      `json:"code" example:"required"`
	Message string      `json:"message" example:"username is required"`
	Value   interface{} `json:"value,omitempty"`
}

// DefaultOptions stores default response metadata.
type DefaultOptions struct {
	Meta      *Meta
	RequestID string
	Version   string
}

// getDefaultOptions builds the default response metadata.
func getDefaultOptions(c *gin.Context) DefaultOptions {
	requestID, exists := c.Get("request_id")
	if !exists {
		requestID = generateRequestID()
	}

	return DefaultOptions{
		RequestID: requestID.(string),
		Version:   "v1",
		Meta: &Meta{
			RequestID: requestID.(string),
			Version:   "v1",
		},
	}
}

// generateRequestID generates a request id.
func generateRequestID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString generates a random string with the given length.
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

// Success writes a successful response.
func Success(c *gin.Context, data interface{}) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusOK, Response{
		Code:      0,
		Message:   getMessage(c, "success"),
		Data:      data,
		Meta:      opts.Meta,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// SuccessWithMessage writes a successful response with a custom message.
func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusOK, Response{
		Code:      0,
		Message:   getMessage(c, message),
		Data:      data,
		Meta:      opts.Meta,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// Created writes a creation success response.
func Created(c *gin.Context, data interface{}) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusCreated, Response{
		Code:      0,
		Message:   getMessage(c, "created"),
		Data:      data,
		Meta:      opts.Meta,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// SuccessPage writes a paginated successful response.
func SuccessPage(c *gin.Context, items interface{}, total int64, page, pageSize int) {
	opts := getDefaultOptions(c)

	totalPages := int64(0)
	if pageSize > 0 {
		totalPages = (total + int64(pageSize) - 1) / int64(pageSize)
	}

	pagination := &Pagination{
		Page:       int64(page),
		PageSize:   int64(pageSize),
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < int(totalPages),
		HasPrev:    page > 1,
	}

	opts.Meta.Pagination = pagination

	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: getMessage(c, "success"),
		Data: gin.H{
			"items":      items,
			"pagination": pagination,
		},
		Meta:      opts.Meta,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// BadRequest writes a bad request response.
func BadRequest(c *gin.Context, code, message string, details ...string) {
	opts := getDefaultOptions(c)

	detail := ""
	if len(details) > 0 {
		detail = details[0]
	}

	c.JSON(http.StatusBadRequest, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Details:   detail,
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// BadRequestWithFields writes a bad request response with field errors.
func BadRequestWithFields(c *gin.Context, code, message string, errors []FieldError) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusBadRequest, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Errors:    errors,
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// Unauthorized writes an unauthorized response.
func Unauthorized(c *gin.Context, code, message string) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusUnauthorized, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// Forbidden writes a forbidden response.
func Forbidden(c *gin.Context, code, message string) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusForbidden, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// NotFound writes a not found response.
func NotFound(c *gin.Context, code, message string) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusNotFound, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// Conflict writes a conflict response.
func Conflict(c *gin.Context, code, message string) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusConflict, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// UnprocessableEntity writes a validation failure response.
func UnprocessableEntity(c *gin.Context, code, message string, errors []FieldError) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusUnprocessableEntity, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Errors:    errors,
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// TooManyRequests writes a rate limit response.
func TooManyRequests(c *gin.Context, code, message string) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusTooManyRequests, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// InternalError writes an internal server error response.
func InternalError(c *gin.Context, code, message string) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusInternalServerError, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// ServiceUnavailable writes a service unavailable response.
func ServiceUnavailable(c *gin.Context, code, message string) {
	opts := getDefaultOptions(c)

	c.JSON(http.StatusServiceUnavailable, ErrorDetail{
		Code:      code,
		Message:   getMessage(c, message),
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      c.Request.URL.Path,
		RequestID: opts.RequestID,
	})
}

// PageResponse remains for backward compatibility.
type PageResponse struct {
	Items      interface{} `json:"items"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int64       `json:"total_pages"`
}

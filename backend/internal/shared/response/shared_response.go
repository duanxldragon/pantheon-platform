package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Translator interface to avoid circular dependency
type Translator interface {
	Translate(ctx interface{}, key string, params ...interface{}) string
}

// getMessage returns the translated message if a translator is present in the context
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

// Response 统一响应结构
type Response struct {
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Meta      *Meta       `json:"meta,omitempty"`
	Timestamp string      `json:"timestamp"`
}

// Meta 元数据信息
type Meta struct {
	RequestID string `json:"request_id,omitempty"`
	Version   string `json:"version,omitempty"`
	// 分页信息
	Pagination *Pagination `json:"pagination,omitempty"`
	// 性能信息
	Duration int64 `json:"duration,omitempty"`
}

// Pagination 分页信息
type Pagination struct {
	Page       int64 `json:"page"`
	PageSize   int64 `json:"page_size"`
	Total      int64 `json:"total"`
	TotalPages int64 `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

// ErrorDetail 错误详情
type ErrorDetail struct {
	Code      string       `json:"code"`
	Message   string       `json:"message"`
	Details   string       `json:"details,omitempty"`
	Timestamp string       `json:"timestamp"`
	Path      string       `json:"path"`
	RequestID string       `json:"request_id,omitempty"`
	Errors    []FieldError `json:"errors,omitempty"`
}

// FieldError 字段验证错误
type FieldError struct {
	Field   string      `json:"field"`
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Value   interface{} `json:"value,omitempty"`
}

// DefaultOptions 默认选项
type DefaultOptions struct {
	Meta      *Meta
	RequestID string
	Version   string
}

// getDefaultOptions 获取默认选项
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

// generateRequestID 生成请求ID
func generateRequestID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString 生成随机字符串
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

// Success 成功响应
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

// SuccessWithMessage 带消息的成功响应
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

// Created 创建成功响应
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

// SuccessPage 分页成功响应
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

// BadRequest 错误请求响应
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

// BadRequestWithFields 带字段验证错误的请求错误
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

// Unauthorized 未授权响应
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

// Forbidden 禁止访问响应
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

// NotFound 未找到响应
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

// Conflict 冲突响应
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

// UnprocessableEntity 数据验证失败响应
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

// TooManyRequests 请求过于频繁响应
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

// InternalError 内部错误响应
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

// ServiceUnavailable 服务不可用响应
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

// Legacy PageResponse 保持向后兼容
type PageResponse struct {
	Items      interface{} `json:"items"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int64       `json:"total_pages"`
}

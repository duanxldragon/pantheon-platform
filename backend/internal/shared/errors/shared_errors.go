package errors

import (
	"fmt"
)

// AppError 应用错误
type AppError struct {
	Code    string
	Message string
	Err     error
}

// Error 实现 error 接口
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap 返回原始错误
func (e *AppError) Unwrap() error {
	return e.Err
}

// New 创建新的应用错误
func New(code, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
	}
}

// Wrap 包装错误
func Wrap(err error, code, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// ============ 通用错误代码 ============

const (
	// 成功相关
	ErrCodeSuccess = "SUCCESS"

	// 请求错误
	ErrCodeInvalidInput    = "INVALID_INPUT"
	ErrCodeBadRequest       = "BAD_REQUEST"
	ErrCodeValidationError  = "VALIDATION_ERROR"
	ErrCodeMissingRequired  = "MISSING_REQUIRED_FIELD"
	ErrCodeInvalidFormat    = "INVALID_FORMAT"

	// 认证错误
	ErrCodeUnauthorized = "UNAUTHORIZED"
	ErrCodeForbidden    = "FORBIDDEN"
	ErrCodeInvalidToken = "INVALID_TOKEN"
	ErrCodeTokenExpired = "TOKEN_EXPIRED"
	ErrCodeInvalidCredentials = "INVALID_CREDENTIALS"
	ErrCodeAccountLocked = "ACCOUNT_LOCKED"
	ErrCodeAccountDisabled = "ACCOUNT_DISABLED"

	// 资源错误
	ErrCodeNotFound = "NOT_FOUND"
	ErrCodeConflict = "CONFLICT"
	ErrCodeDuplicate = "DUPLICATE"
	ErrCodeResourceInUse = "RESOURCE_IN_USE"

	// 业务错误
	ErrCodeTenantNotFound        = "TENANT_NOT_FOUND"
	ErrCodeTenantCodeExists      = "TENANT_CODE_EXISTS"
	ErrCodeTenantInactive        = "TENANT_INACTIVE"
	ErrCodeTenantDBConfigured    = "TENANT_DB_CONFIGURED"
	ErrCodeDatabaseNotConfigured = "DATABASE_NOT_CONFIGURED"
	ErrCodeInvalidDBType         = "INVALID_DB_TYPE"
	ErrCodeInvalidDBConfig       = "INVALID_DB_CONFIG"
	ErrCodeDBConnectFailed       = "DB_CONNECT_FAILED"
	ErrCodeDBQueryFailed         = "DB_QUERY_FAILED"
	ErrCodeDBMigrationFailed     = "DB_MIGRATION_FAILED"

	// 数据库错误
	ErrCodeDBConnectFailedCommon = "DB_CONNECTION_ERROR"

	// 认证相关错误消息
	ErrMsgInvalidInput    = "common.invalid_input"
	ErrMsgBadRequest       = "common.bad_request"
	ErrMsgValidationError  = "common.validation_error"
	ErrMsgMissingRequired  = "common.missing_required"
	ErrMsgInvalidFormat    = "common.invalid_format"

	// 认证相关错误消息
	ErrMsgUnauthorized = "auth.unauthorized"
	ErrMsgForbidden    = "auth.forbidden"
	ErrMsgInvalidToken = "auth.token.invalid"
	ErrMsgTokenExpired = "auth.token.expired"
	ErrMsgInvalidCredentials = "auth.login.invalid_credentials"
	ErrMsgAccountLocked = "auth.account.locked"
	ErrMsgAccountDisabled = "auth.account.disabled"

	// 资源相关错误消息
	ErrMsgNotFound = "common.not_found"
	ErrMsgConflict = "common.conflict"
	ErrMsgDuplicate = "common.duplicate"
	ErrMsgResourceInUse = "common.resource_in_use"

	// 租户相关错误消息
	ErrMsgTenantNotFound        = "tenant.not_found"
	ErrMsgTenantCodeExists      = "tenant.code.exists"
	ErrMsgTenantInactive        = "tenant.inactive"
	ErrMsgTenantDBConfigured    = "tenant.db.configured"
	ErrMsgDatabaseNotConfigured = "tenant.db.not_configured"
	ErrMsgInvalidDBType         = "tenant.db.invalid_type"
	ErrMsgInvalidDBConfig       = "tenant.db.invalid_config"
	ErrMsgDBConnectFailed       = "tenant.db.connect_failed"
	ErrMsgDBQueryFailed         = "tenant.db.query_failed"
	ErrMsgDBMigrationFailed     = "tenant.db.migration_failed"

	// 数据库相关错误消息
	ErrMsgDBConnectFailedCommon = "tenant.db.connection_error"

	// 默认错误消息
	ErrMsgInternalError = "common.internal_error"
	ErrMsgServiceUnavailable = "common.service_unavailable"
	ErrMsgMethodNotAllowed = "common.method_not_allowed"
	ErrMsgRateLimitExceeded = "common.rate_limit_exceeded"
	ErrUnknownError = "common.unknown_error"
)

// ============ 租户相关错误 ============

// 预定义错误
var (
	// 通用错误
	ErrInvalidInput = New(ErrCodeInvalidInput, ErrMsgInvalidInput)
	ErrNotFound     = New(ErrCodeNotFound, ErrMsgNotFound)
	ErrUnauthorized = New(ErrCodeUnauthorized, ErrMsgUnauthorized)
	ErrForbidden    = New(ErrCodeForbidden, ErrMsgForbidden)
	ErrInternal     = New("INTERNAL_ERROR", ErrMsgInternalError)
	ErrDuplicate    = New(ErrCodeDuplicate, ErrMsgDuplicate)

	// 租户错误
	ErrTenantNotFound        = New(ErrCodeTenantNotFound, ErrMsgTenantNotFound)
	ErrTenantCodeExists      = New(ErrCodeTenantCodeExists, ErrMsgTenantCodeExists)
	ErrTenantInactive        = New(ErrCodeTenantInactive, ErrMsgTenantInactive)
	ErrTenantDBConfigured    = New(ErrCodeTenantDBConfigured, ErrMsgTenantDBConfigured)
	ErrDatabaseNotConfigured = New(ErrCodeDatabaseNotConfigured, ErrMsgDatabaseNotConfigured)

	// 数据库错误
	ErrDatabaseConnect = New(ErrCodeDBConnectFailedCommon, ErrMsgDBConnectFailedCommon)
	ErrInvalidDBType   = New(ErrCodeInvalidDBType, ErrMsgInvalidDBType)
	ErrInvalidDBConfig = New(ErrCodeInvalidDBConfig, ErrMsgInvalidDBConfig)

	// 认证错误
	ErrInvalidToken       = New(ErrCodeInvalidToken, ErrMsgInvalidToken)
	ErrTokenExpired       = New(ErrCodeTokenExpired, ErrMsgTokenExpired)
	ErrInvalidCredentials = New(ErrCodeInvalidCredentials, ErrMsgInvalidCredentials)
	ErrAccountLocked      = New(ErrCodeAccountLocked, ErrMsgAccountLocked)
	ErrAccountDisabled    = New(ErrCodeAccountDisabled, ErrMsgAccountDisabled)
)

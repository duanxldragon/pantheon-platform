package errors

import "fmt"

// AppError is the shared application error type.
type AppError struct {
	Code    string
	Message string
	Err     error
}

// Error implements the error interface.
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap returns the wrapped error.
func (e *AppError) Unwrap() error {
	return e.Err
}

// New creates a new application error.
func New(code, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
	}
}

// Wrap wraps an existing error with an application error.
func Wrap(err error, code, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

const (
	ErrCodeSuccess = "SUCCESS"

	ErrCodeInvalidInput    = "INVALID_INPUT"
	ErrCodeBadRequest      = "BAD_REQUEST"
	ErrCodeValidationError = "VALIDATION_ERROR"
	ErrCodeMissingRequired = "MISSING_REQUIRED_FIELD"
	ErrCodeInvalidFormat   = "INVALID_FORMAT"

	ErrCodeUnauthorized       = "UNAUTHORIZED"
	ErrCodeForbidden          = "FORBIDDEN"
	ErrCodeInvalidToken       = "INVALID_TOKEN"
	ErrCodeTokenExpired       = "TOKEN_EXPIRED"
	ErrCodeInvalidCredentials = "INVALID_CREDENTIALS"
	ErrCodeAccountLocked      = "ACCOUNT_LOCKED"
	ErrCodeAccountDisabled    = "ACCOUNT_DISABLED"

	ErrCodeNotFound      = "NOT_FOUND"
	ErrCodeConflict      = "CONFLICT"
	ErrCodeDuplicate     = "DUPLICATE"
	ErrCodeResourceInUse = "RESOURCE_IN_USE"

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
	ErrCodeDBConnectFailedCommon = "DB_CONNECTION_ERROR"

	ErrMsgInvalidInput    = "common.invalid_input"
	ErrMsgBadRequest      = "common.bad_request"
	ErrMsgValidationError = "common.validation_error"
	ErrMsgMissingRequired = "common.missing_required"
	ErrMsgInvalidFormat   = "common.invalid_format"

	ErrMsgUnauthorized       = "auth.unauthorized"
	ErrMsgForbidden          = "auth.forbidden"
	ErrMsgInvalidToken       = "auth.token.invalid"
	ErrMsgTokenExpired       = "auth.token.expired"
	ErrMsgInvalidCredentials = "auth.login.invalid_credentials"
	ErrMsgAccountLocked      = "auth.account.locked"
	ErrMsgAccountDisabled    = "auth.account.disabled"

	ErrMsgNotFound      = "common.not_found"
	ErrMsgConflict      = "common.conflict"
	ErrMsgDuplicate     = "common.duplicate"
	ErrMsgResourceInUse = "common.resource_in_use"

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
	ErrMsgDBConnectFailedCommon = "tenant.db.connection_error"

	ErrMsgInternalError      = "common.internal_error"
	ErrMsgServiceUnavailable = "common.service_unavailable"
	ErrMsgMethodNotAllowed   = "common.method_not_allowed"
	ErrMsgRateLimitExceeded  = "common.rate_limit_exceeded"
	ErrUnknownError          = "common.unknown_error"
)

var (
	ErrInvalidInput = New(ErrCodeInvalidInput, ErrMsgInvalidInput)
	ErrNotFound     = New(ErrCodeNotFound, ErrMsgNotFound)
	ErrUnauthorized = New(ErrCodeUnauthorized, ErrMsgUnauthorized)
	ErrForbidden    = New(ErrCodeForbidden, ErrMsgForbidden)
	ErrInternal     = New("INTERNAL_ERROR", ErrMsgInternalError)
	ErrDuplicate    = New(ErrCodeDuplicate, ErrMsgDuplicate)

	ErrTenantNotFound        = New(ErrCodeTenantNotFound, ErrMsgTenantNotFound)
	ErrTenantCodeExists      = New(ErrCodeTenantCodeExists, ErrMsgTenantCodeExists)
	ErrTenantInactive        = New(ErrCodeTenantInactive, ErrMsgTenantInactive)
	ErrTenantDBConfigured    = New(ErrCodeTenantDBConfigured, ErrMsgTenantDBConfigured)
	ErrDatabaseNotConfigured = New(ErrCodeDatabaseNotConfigured, ErrMsgDatabaseNotConfigured)

	ErrDatabaseConnect = New(ErrCodeDBConnectFailedCommon, ErrMsgDBConnectFailedCommon)
	ErrInvalidDBType   = New(ErrCodeInvalidDBType, ErrMsgInvalidDBType)
	ErrInvalidDBConfig = New(ErrCodeInvalidDBConfig, ErrMsgInvalidDBConfig)

	ErrInvalidToken       = New(ErrCodeInvalidToken, ErrMsgInvalidToken)
	ErrTokenExpired       = New(ErrCodeTokenExpired, ErrMsgTokenExpired)
	ErrInvalidCredentials = New(ErrCodeInvalidCredentials, ErrMsgInvalidCredentials)
	ErrAccountLocked      = New(ErrCodeAccountLocked, ErrMsgAccountLocked)
	ErrAccountDisabled    = New(ErrCodeAccountDisabled, ErrMsgAccountDisabled)
)

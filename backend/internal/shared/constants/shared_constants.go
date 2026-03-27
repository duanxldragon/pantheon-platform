package constants

// ============ Tenant ============

// TenantStatus represents tenant lifecycle state.
type TenantStatus string

const (
	TenantStatusPending  TenantStatus = "pending"
	TenantStatusActive   TenantStatus = "active"
	TenantStatusDisabled TenantStatus = "disabled"
)

// DatabaseType represents a supported database engine.
type DatabaseType string

const (
	DBTypeMySQL      DatabaseType = "mysql"
	DBTypePostgreSQL DatabaseType = "postgresql"
	DBTypeSQLite     DatabaseType = "sqlite"
	DBTypeMSSQL      DatabaseType = "mssql"
)

// SSLMode represents database SSL behavior.
type SSLMode string

const (
	SSLModeDisable SSLMode = "disable"
	SSLModeEnable  SSLMode = "enable"
)

// TenantQuotaType represents tenant quota dimensions.
type TenantQuotaType string

const (
	TenantQuotaUserCount   TenantQuotaType = "user_count"
	TenantQuotaStorageSize TenantQuotaType = "storage_size"
	TenantQuotaAPIRequests TenantQuotaType = "api_requests"
	TenantQuotaConcurrent  TenantQuotaType = "concurrent"
)

// TenantBackupType represents supported backup strategies.
type TenantBackupType string

const (
	TenantBackupTypeFull         TenantBackupType = "full"
	TenantBackupTypeIncremental  TenantBackupType = "incremental"
	TenantBackupTypeDifferential TenantBackupType = "differential"
)

// ============ User ============

// UserStatus represents user account state.
type UserStatus string

const (
	UserStatusActive   UserStatus = "active"
	UserStatusInactive UserStatus = "inactive"
	UserStatusLocked   UserStatus = "locked"
)

// UserRoleType represents built-in versus custom user role ownership.
type UserRoleType string

const (
	UserRoleTypeSystem UserRoleType = "system"
	UserRoleTypeCustom UserRoleType = "custom"
)

// ============ Role ============

// RoleType represents built-in versus custom role ownership.
type RoleType string

const (
	RoleTypeSystem RoleType = "system"
	RoleTypeCustom RoleType = "custom"
)

// ============ Data Scope ============

// DataScope represents row-level data scope strategies.
type DataScope string

const (
	DataScopeAll        DataScope = "all"
	DataScopeCustom     DataScope = "custom"
	DataScopeDept       DataScope = "dept"
	DataScopeDeptAndSub DataScope = "dept_and_sub"
	DataScopeSelf       DataScope = "self"
)

// ============ Field Permission ============

const (
	FieldPermissionRead  = "read"
	FieldPermissionWrite = "write"
	FieldPermissionHide  = "hide"
)

// ============ Setting ============

// SettingCategory groups system settings by domain.
type SettingCategory string

const (
	SettingCategorySystem       SettingCategory = "system"
	SettingCategorySecurity     SettingCategory = "security"
	SettingCategoryEmail        SettingCategory = "email"
	SettingCategoryNotification SettingCategory = "notification"
	SettingCategoryStorage      SettingCategory = "storage"
)

// SettingScope represents the owner scope of a setting.
type SettingScope string

const (
	SettingScopeGlobal SettingScope = "global"
	SettingScopeTenant SettingScope = "tenant"
	SettingScopeUser   SettingScope = "user"
)

// ============ Logging ============

// LogType represents log categories.
type LogType string

const (
	LogTypeOperation LogType = "operation"
	LogTypeLogin     LogType = "login"
	LogTypeError     LogType = "error"
	LogTypeAudit     LogType = "audit"
)

// LogLevel represents application log levels.
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

// ============ Authentication ============

// TokenType represents token purpose.
type TokenType string

const (
	TokenTypeAccess   TokenType = "access"
	TokenTypeRefresh  TokenType = "refresh"
	TokenTypeRecovery TokenType = "recovery"
)

// ============ Notification ============

// NotificationType represents notification delivery channels.
type NotificationType string

const (
	NotificationTypeInbox  NotificationType = "inbox"
	NotificationTypeEmail  NotificationType = "email"
	NotificationTypeSMS    NotificationType = "sms"
	NotificationTypePush   NotificationType = "push"
	NotificationTypeWechat NotificationType = "wechat"
)

// ============ Dictionary ============

// DictTypeCategory represents dictionary ownership categories.
type DictTypeCategory string

const (
	DictTypeCategorySystem DictTypeCategory = "system"
	DictTypeCategoryCustom DictTypeCategory = "custom"
)

// DictDataType represents dictionary item value types.
type DictDataType string

const (
	DictDataTypeString  DictDataType = "string"
	DictDataTypeNumber  DictDataType = "number"
	DictDataTypeBoolean DictDataType = "boolean"
	DictDataTypeDate    DictDataType = "date"
)

// ============ Common ============

const DefaultPageSize = 20
const MaxPageSize = 100
const MinPageSize = 1

const RefreshTokenExpiry = 168
const AccessTokenExpiry = 2
const LoginFailedLockTime = 30
const MaxLoginAttempts = 5
const PasswordMinLength = 6
const PasswordMaxLength = 128
const PasswordMinScore = 70
const PasswordHistoryLength = 5
const TokenBlacklistExpiry = 24
const SessionMaxAge = 30
const OperationLogRetention = 90
const LoginLogRetention = 30
const CacheTTLDefault = 300
const CacheTTLShort = 60
const CacheTTLLong = 3600
const DataEncryptKeyLength = 32
const DataEncryptIVLength = 16

// ============ Paths ============

const BackupDirectory = "backups"
const UploadDirectory = "uploads"

// ============ Redis Keys ============

const (
	AuthPrefix      = "auth:"
	AccessTokenKey  = "auth:access_token:"
	RefreshTokenKey = "auth:refresh_token:"

	CachePrefix     = "cache:"
	UserInfoCache   = "cache:user_info:"
	PermissionCache = "cache:permission:"
	RoleCache       = "cache:role:"
	MenuCache       = "cache:menu:"
	DictionaryCache = "cache:dictionary:"
	TenantCache     = "cache:tenant:"

	SessionPrefix = "session:"

	RateLimitPrefix = "rate_limit:"

	TokenBlacklistPrefix = "token:blacklist:"
)

// ============ HTTP Status ============

const HTTPStatusOK = 200
const HTTPStatusCreated = 201
const HTTPStatusBadRequest = 400
const HTTPStatusUnauthorized = 401
const HTTPStatusForbidden = 403
const HTTPStatusNotFound = 404
const HTTPStatusConflict = 409
const HTTPStatusInternalServerError = 500
const HTTPStatusServiceUnavailable = 503

// ============ HTTP Headers ============

const (
	HeaderContentType   = "Content-Type"
	HeaderContentLength = "Content-Length"
	HeaderAuthorization = "Authorization"
	HeaderXRequestID    = "X-Request-ID"
	HeaderXTraceID      = "X-Trace-ID"
	HeaderXTenantID     = "X-Tenant-ID"

	HeaderCacheControl = "Cache-Control"
	HeaderETag         = "ETag"

	HeaderContentSecurityPolicy   = "Content-Security-Policy"
	HeaderXFrameOptions           = "X-Frame-Options"
	HeaderXSSProtection           = "X-XSS-Protection"
	HeaderStrictTransportSecurity = "Strict-Transport-Security"
)

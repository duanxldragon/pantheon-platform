package config

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Config represents the application configuration
type Config struct {
	Environment  string `mapstructure:"environment"`
	Port         int    `mapstructure:"port"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`

	// Migration controls
	AutoMigrate bool `mapstructure:"auto_migrate"`
	MigrateOnly bool `mapstructure:"migrate_only"`

	// Master Database Configuration
	MasterDB DatabaseConfig `mapstructure:"master_db"`

	// Security
	JWTSecret     string `mapstructure:"jwt_secret"`
	JWTExpiresIn  int    `mapstructure:"jwt_expires_in"`
	RefreshExpiry int    `mapstructure:"refresh_expiry"`

	// Encryption
	EncryptionKey string `mapstructure:"encryption_key"`

	// CORS
	AllowedOrigins   []string `mapstructure:"allowed_origins"`
	AllowedMethods   []string `mapstructure:"allowed_methods"`
	AllowedHeaders   []string `mapstructure:"allowed_headers"`
	AllowCredentials bool     `mapstructure:"allow_credentials"`
	OptionsMaxAge    int      `mapstructure:"options_max_age"`

	// Tenant
	EnableMultiTenant   bool             `mapstructure:"enable_multi_tenant"`
	DefaultTenantID     string           `mapstructure:"default_tenant_id"`
	DefaultMaxOpenConns int              `mapstructure:"default_max_open_conns"`
	DefaultMaxIdleConns int              `mapstructure:"default_max_idle_conns"`
	DefaultMaxLifetime  int              `mapstructure:"default_max_lifetime"`
	Deployment          DeploymentConfig `mapstructure:"deployment"`

	// Tenant Database Pool Configuration
	TenantDB TenantDBConfig `mapstructure:"tenant_db"`

	// Monitor Configuration
	EnableMonitorSync bool           `mapstructure:"enable_monitor_sync"`
	MonitorDB         DatabaseConfig `mapstructure:"monitor_db"`

	// Redis Configuration
	Redis RedisConfig `mapstructure:"redis"`

	// Default Admin Account (for development/fallback)
	DefaultAdmin DefaultAdminConfig `mapstructure:"default_admin"`

	// Email Configuration
	Email EmailConfig `mapstructure:"email"`

	// SMS Configuration
	SMS SMSConfig `mapstructure:"sms"`

	// Security Configuration
	Security SecurityConfig `mapstructure:"security"`

	// Storage Configuration
	Storage StorageConfig `mapstructure:"storage"`
}

// SecurityConfig represents security-related configurations
type SecurityConfig struct {
	Enable2FA             bool `mapstructure:"enable_2fa"`
	MaxConcurrentSessions int  `mapstructure:"max_concurrent_sessions"` // 0 = unlimited
}

// DeploymentConfig controls how the platform exposes the tenant foundation.
type DeploymentConfig struct {
	Mode           string `mapstructure:"mode"`            // private / paas / saas
	TenantStrategy string `mapstructure:"tenant_strategy"` // single / dedicated / mixed
}

// StorageConfig represents storage configuration
type StorageConfig struct {
	Provider  string `mapstructure:"provider"`   // local, s3, oss, cos
	UploadDir string `mapstructure:"upload_dir"` // used for local provider
	BaseURL   string `mapstructure:"base_url"`   // used for generating public URLs

	// S3/OSS Configuration
	S3Bucket    string `mapstructure:"s3_bucket"`
	S3Region    string `mapstructure:"s3_region"`
	S3AccessKey string `mapstructure:"s3_access_key"`
	S3SecretKey string `mapstructure:"s3_secret_key"`
	S3Endpoint  string `mapstructure:"s3_endpoint"`
}

// DatabaseConfig represents a database configuration
type DatabaseConfig struct {
	Type            string `mapstructure:"type"` // mysql, postgresql, sqlite, mssql
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	Database        string `mapstructure:"database"`
	Username        string `mapstructure:"username"`
	Password        string `mapstructure:"password"`
	SSLMode         string `mapstructure:"ssl_mode"` // disable, require, verify-ca, verify-full
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`
	Timeout         int    `mapstructure:"timeout"`
	ReadTimeout     int    `mapstructure:"read_timeout"`
	WriteTimeout    int    `mapstructure:"write_timeout"`
	Heartbeat       int    `mapstructure:"heartbeat"`
}

// RedisConfig represents Redis configuration
type RedisConfig struct {
	Enabled             string `mapstructure:"enabled"`
	Host                string `mapstructure:"host"`
	Port                int    `mapstructure:"port"`
	Password            string `mapstructure:"password"`
	DB                  int    `mapstructure:"db"`
	PoolSize            int    `mapstructure:"pool_size"`
	MinIdleConns        int    `mapstructure:"min_idle_conns"`
	PoolTimeout         int    `mapstructure:"pool_timeout"`
	IdleTimeout         int    `mapstructure:"idle_timeout"`
	ConnectTimeout      int    `mapstructure:"connect_timeout"`
	HealthCheckInterval int    `mapstructure:"health_check_interval"`
}

// DefaultAdminConfig represents the default admin account configuration
type DefaultAdminConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	RealName string `mapstructure:"real_name"`
	Email    string `mapstructure:"email"`
}

// EmailConfig represents email configuration
type EmailConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	Provider string `mapstructure:"provider"` // smtp, sendgrid, aliyun
	From     string `mapstructure:"from"`
	FromName string `mapstructure:"from_name"`
	ReplyTo  string `mapstructure:"reply_to"`
	// SMTP Configuration
	SMTPHost     string `mapstructure:"smtp_host"`
	SMTPPort     int    `mapstructure:"smtp_port"`
	SMTPUsername string `mapstructure:"smtp_username"`
	SMTPPassword string `mapstructure:"smtp_password"`
	SMTPUseTLS   bool   `mapstructure:"smtp_use_tls"`
	// SendGrid Configuration
	SendGridAPIKey string `mapstructure:"sendgrid_api_key"`
	// Aliyun DirectMail Configuration
	AliyunAccessKeyID     string `mapstructure:"aliyun_access_key_id"`
	AliyunAccessKeySecret string `mapstructure:"aliyun_access_key_secret"`
	AliyunRegion          string `mapstructure:"aliyun_region"`
}

// SMSConfig represents SMS configuration
type SMSConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	Provider string `mapstructure:"provider"` // aliyun, tencent, twilio
	// Aliyun SMS Configuration
	AliyunAccessKeyID     string `mapstructure:"aliyun_access_key_id"`
	AliyunAccessKeySecret string `mapstructure:"aliyun_access_key_secret"`
	AliyunRegion          string `mapstructure:"aliyun_region"`
	AliyunSignName        string `mapstructure:"aliyun_sign_name"`
	// Tencent SMS Configuration
	TencentSecretID  string `mapstructure:"tencent_secret_id"`
	TencentSecretKey string `mapstructure:"tencent_secret_key"`
	TencentRegion    string `mapstructure:"tencent_region"`
	TencentAppID     string `mapstructure:"tencent_app_id"`
	TencentSignName  string `mapstructure:"tencent_sign_name"`
	// Twilio SMS Configuration
	TwilioAccountSID string `mapstructure:"twilio_account_sid"`
	TwilioAuthToken  string `mapstructure:"twilio_auth_token"`
	TwilioFromNumber string `mapstructure:"twilio_from_number"`
}

// TenantDBConfig represents tenant database pool configuration
type TenantDBConfig struct {
	DefaultPool  PoolConfig       `mapstructure:"default_pool"`
	LargeTenants []TenantOverride `mapstructure:"large_tenants"`
	SmallTenants []TenantOverride `mapstructure:"small_tenants"`
}

// PoolConfig represents connection pool configuration
type PoolConfig struct {
	MaxOpenConns    int `mapstructure:"max_open_conns"`
	MaxIdleConns    int `mapstructure:"max_idle_conns"`
	ConnMaxLifetime int `mapstructure:"conn_max_lifetime"`
}

// TenantOverride represents tenant-specific pool configuration override
type TenantOverride struct {
	TenantCode      string `mapstructure:"tenant_code"`
	TenantID        string `mapstructure:"tenant_id"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`
}

// DSN returns the data source name for the database connection
func (c DatabaseConfig) DSN() string {
	switch c.Type {
	case "mysql":
		timeout := c.Timeout
		if timeout <= 0 {
			timeout = 10
		}
		readTimeout := c.ReadTimeout
		if readTimeout <= 0 {
			readTimeout = 30
		}
		writeTimeout := c.WriteTimeout
		if writeTimeout <= 0 {
			writeTimeout = 30
		}
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=1&loc=Local&timeout=%ds&readTimeout=%ds&writeTimeout=%ds",
			c.Username, c.Password, c.Host, c.Port, c.Database, timeout, readTimeout, writeTimeout)
	case "postgresql":
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			c.Host, c.Port, c.Username, c.Password, c.Database, c.SSLMode)
	case "mssql":
		return fmt.Sprintf("sqlserver://%s:%s@%s:%d?database=%s",
			c.Username, c.Password, c.Host, c.Port, c.Database)
	case "sqlite":
		return c.Database
	default:
		return ""
	}
}

// Load loads configuration from file and environment variables
func Load() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("/etc/pantheon-platform")

	// Set defaults
	setDefaults()

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			// Config file was found but has error
			panic(fmt.Errorf("failed to read config file: %w", err))
		}
		// Config file not found, use defaults and env vars
	}

	normalizeConfigAliases()

	// Override with environment variables
	viper.SetEnvPrefix("PANTHEON")
	viper.AutomaticEnv()

	// Unmarshal config
	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		panic(fmt.Errorf("failed to unmarshal config: %w", err))
	}

	applyRuntimeSecurityDefaults(&cfg)

	// Debug: Print multi-tenant config
	log.Printf("Config loaded: EnableMultiTenant=%v, DefaultTenantID=%s", cfg.EnableMultiTenant, cfg.DefaultTenantID)

	// Validate config
	if err := validate(&cfg); err != nil {
		panic(fmt.Errorf("config validation failed: %w", err))
	}

	return &cfg
}

func setDefaults() {
	// Server defaults
	viper.SetDefault("environment", "development")
	viper.SetDefault("port", 8080)
	viper.SetDefault("read_timeout", 30)
	viper.SetDefault("write_timeout", 30)

	// Migration defaults
	viper.SetDefault("auto_migrate", true)
	viper.SetDefault("migrate_only", false)

	// Master database defaults
	viper.SetDefault("master_db.type", "mysql")
	viper.SetDefault("master_db.host", "localhost")
	viper.SetDefault("master_db.port", 3306)
	viper.SetDefault("master_db.database", "pantheon")
	viper.SetDefault("master_db.username", "root")
	viper.SetDefault("master_db.password", "")
	viper.SetDefault("master_db.ssl_mode", "disable")

	// Monitor defaults
	viper.SetDefault("enable_monitor_sync", false)
	viper.SetDefault("monitor_db.type", "mysql")
	viper.SetDefault("monitor_db.host", "localhost")
	viper.SetDefault("monitor_db.port", 3306)
	viper.SetDefault("monitor_db.database", "pantheon_monitor")
	viper.SetDefault("monitor_db.username", "root")
	viper.SetDefault("monitor_db.password", "")
	viper.SetDefault("monitor_db.ssl_mode", "disable")

	// Redis defaults
	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.password", "")
	viper.SetDefault("redis.db", 0)

	// Security defaults
	viper.SetDefault("jwt_secret", "")
	viper.SetDefault("jwt_expires_in", 7200)   // 2 hours
	viper.SetDefault("refresh_expiry", 604800) // 7 days
	viper.SetDefault("encryption_key", "")

	// Multi-tenant defaults
	viper.SetDefault("enable_multi_tenant", true)
	viper.SetDefault("default_tenant_id", "00000000-0000-0000-0000-000000000000")
	viper.SetDefault("deployment.mode", "saas")
	viper.SetDefault("deployment.tenant_strategy", "dedicated")

	// CORS defaults
	viper.SetDefault("allowed_origins", []string{"http://localhost:3000", "http://localhost:5173"})
	viper.SetDefault("allowed_methods", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	viper.SetDefault("allowed_headers", []string{"Origin", "Content-Type", "Authorization", "X-Tenant-ID", "X-Request-ID", "Accept-Language"})
	viper.SetDefault("allow_credentials", true)
	viper.SetDefault("options_max_age", 86400) // 24 hours

	// Tenant defaults
	viper.SetDefault("default_max_open_conns", 100)
	viper.SetDefault("default_max_idle_conns", 10)
	viper.SetDefault("default_max_lifetime", 3600) // 1 hour

	// Tenant database pool defaults
	viper.SetDefault("tenant_db.default_pool.max_open_conns", 50)
	viper.SetDefault("tenant_db.default_pool.max_idle_conns", 5)
	viper.SetDefault("tenant_db.default_pool.conn_max_lifetime", 3600)

	// Email defaults
	viper.SetDefault("email.enabled", false)
	viper.SetDefault("email.provider", "smtp")
	viper.SetDefault("email.from", "noreply@example.com")
	viper.SetDefault("email.from_name", "Pantheon Platform")
	viper.SetDefault("email.smtp_host", "smtp.example.com")
	viper.SetDefault("email.smtp_port", 587)
	viper.SetDefault("email.smtp_use_tls", true)

	// SMS defaults
	viper.SetDefault("sms.enabled", false)
	viper.SetDefault("sms.provider", "aliyun")
	viper.SetDefault("sms.aliyun_region", "cn-hangzhou")

	// Default admin defaults
	viper.SetDefault("default_admin.enabled", false)
	viper.SetDefault("default_admin.username", "admin")
	viper.SetDefault("default_admin.password", "")
	viper.SetDefault("default_admin.real_name", "System Admin")
	viper.SetDefault("default_admin.email", "admin@example.com")

	// Storage defaults
	viper.SetDefault("storage.provider", "local")
	viper.SetDefault("storage.upload_dir", "uploads")
	viper.SetDefault("storage.base_url", "/uploads")

	// Security defaults
	viper.SetDefault("security.enable_2fa", true)
	viper.SetDefault("security.max_concurrent_sessions", 0) // 0 = unlimited
}

func normalizeConfigAliases() {
	copyIfEmpty("port", "server.port")
	copyIfEmpty("read_timeout", "server.read_timeout")
	copyIfEmpty("write_timeout", "server.write_timeout")

	// Master DB aliases
	copyIfEmpty("master_db.type", "master_db.driver")
	copyIfEmpty("master_db.max_open_conns", "master_db.max_open_conns")
	copyIfEmpty("master_db.max_idle_conns", "master_db.max_idle_conns")
	copyIfEmpty("master_db.conn_max_lifetime", "master_db.conn_max_lifetime")

	copyIfEmpty("jwt_secret", "jwt.secret")
	copyIfEmpty("jwt_expires_in", "jwt.expires_in")
	copyIfEmpty("refresh_expiry", "jwt.refresh_expiry")
	copyIfEmpty("encryption_key", "multi_tenant.encryption_key")

	// Monitor DB aliases
	copyIfEmpty("monitor_db.type", "monitor_db.driver")
	copyIfEmpty("monitor_db.enable_sync", "monitor_db.enabled")

	copyIfEmpty("allowed_origins", "cors.allowed_origins")
	copyIfEmpty("allowed_methods", "cors.allowed_methods")
	copyIfEmpty("allowed_headers", "cors.allowed_headers")
	copyIfEmpty("allow_credentials", "cors.allow_credentials")
	copyIfEmpty("options_max_age", "cors.max_age")

	copyIfEmpty("email.smtp_host", "email.smtp.host")
	copyIfEmpty("email.smtp_port", "email.smtp.port")
	copyIfEmpty("email.smtp_username", "email.smtp.username")
	copyIfEmpty("email.smtp_password", "email.smtp.password")
	copyIfEmpty("email.smtp_use_tls", "email.smtp.use_tls")

	copyIfEmpty("security.enable_2fa", "security.enable_2fa")
	copyIfEmpty("security.max_concurrent_sessions", "security.max_concurrent_sessions")
}

func copyIfEmpty(targetKey, sourceKey string) {
	if !viper.IsSet(targetKey) && viper.IsSet(sourceKey) {
		viper.Set(targetKey, viper.Get(sourceKey))
	}
}

func validate(cfg *Config) error {
	if cfg.Port <= 0 || cfg.Port > 65535 {
		return fmt.Errorf("invalid port: %d", cfg.Port)
	}

	if strings.EqualFold(cfg.Environment, "production") && strings.TrimSpace(cfg.JWTSecret) == "" {
		return fmt.Errorf("jwt secret must be configured in production")
	}

	if len(cfg.EncryptionKey) != 32 {
		return fmt.Errorf("encryption key must be 32 bytes for AES-256-GCM")
	}

	if strings.EqualFold(cfg.Environment, "production") && cfg.DefaultAdmin.Enabled {
		return fmt.Errorf("default admin fallback must be disabled in production")
	}

	if cfg.Security.MaxConcurrentSessions < 0 {
		return fmt.Errorf("max_concurrent_sessions must be non-negative")
	}

	switch cfg.Deployment.Mode {
	case "", "private", "paas", "saas":
	default:
		return fmt.Errorf("deployment.mode must be one of private/paas/saas")
	}

	switch cfg.Deployment.TenantStrategy {
	case "", "single", "dedicated", "mixed":
	default:
		return fmt.Errorf("deployment.tenant_strategy must be one of single/dedicated/mixed")
	}

	return nil
}

func applyRuntimeSecurityDefaults(cfg *Config) {
	if cfg == nil {
		return
	}

	if strings.EqualFold(cfg.Environment, "production") {
		return
	}

	if strings.TrimSpace(cfg.JWTSecret) == "" {
		cfg.JWTSecret = generateRuntimeSecret(48)
		log.Printf("warning: jwt_secret is not configured; generated an ephemeral secret for %s", cfg.Environment)
	}

	if len(cfg.EncryptionKey) == 0 {
		cfg.EncryptionKey = generateRuntimeSecret(32)
		log.Printf("warning: encryption_key is not configured; generated an ephemeral key for %s", cfg.Environment)
	}
}

func generateRuntimeSecret(length int) string {
	if length <= 0 {
		return ""
	}

	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		panic(fmt.Errorf("failed to generate runtime secret: %w", err))
	}

	secret := base64.RawURLEncoding.EncodeToString(buf)
	if len(secret) < length {
		return secret
	}

	return secret[:length]
}

// GetTimeout returns the read and write timeouts as time.Duration
func (c *Config) GetTimeout() (readTimeout, writeTimeout time.Duration) {
	return time.Duration(c.ReadTimeout) * time.Second,
		time.Duration(c.WriteTimeout) * time.Second
}

func (c *Config) IsPrivateSingleTenantMode() bool {
	return c != nil && c.Deployment.Mode == "private" && c.Deployment.TenantStrategy == "single"
}

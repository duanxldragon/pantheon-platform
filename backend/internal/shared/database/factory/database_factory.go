package factory

import (
	"fmt"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// DialOption represents database connection options
type DialOption struct {
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int // seconds
	Silent          bool
}

// ConnectionTestResult represents the result of a connection test
type ConnectionTestResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Version string `json:"version,omitempty"`
	Latency int    `json:"latency,omitempty"`
	Error   string `json:"error,omitempty"`
}

// Dial creates a new database connection
func Dial(dbType, dsn string, options DialOption) (*gorm.DB, error) {
	if dsn == "" {
		return nil, fmt.Errorf("DSN cannot be empty")
	}

	var dialector gorm.Dialector
	switch dbType {
	case "mysql":
		dialector = mysql.Open(dsn)
	case "postgresql":
		dialector = postgres.Open(dsn)
	case "sqlite":
		dialector = sqlite.Open(dsn)
	case "mssql":
		dialector = sqlserver.Open(dsn)
	default:
		return nil, fmt.Errorf("unsupported database type: %s", dbType)
	}

	gormConfig := &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		SkipDefaultTransaction:                   true,
	}
	if options.Silent {
		gormConfig.Logger = gormlogger.Default.LogMode(gormlogger.Silent)
	}

	db, err := gorm.Open(dialector, gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get SQL DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(options.MaxOpenConns)
	sqlDB.SetMaxIdleConns(options.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Duration(options.ConnMaxLifetime) * time.Second)

	return db, nil
}

// Ping tests if a database connection is alive
func Ping(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

// Close closes the database connection
func Close(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetVersion returns the database version
func GetVersion(db *gorm.DB) (string, error) {
	var version string
	switch db.Dialector.Name() {
	case "mysql":
		db.Raw("SELECT VERSION()").Scan(&version)
	case "postgres":
		db.Raw("SELECT version()").Scan(&version)
	case "sqlite":
		db.Raw("SELECT sqlite_version()").Scan(&version)
	case "sqlserver":
		db.Raw("SELECT @@VERSION").Scan(&version)
	default:
		return "", fmt.Errorf("unsupported database: %s", db.Dialector.Name())
	}
	if version == "" {
		return "", fmt.Errorf("failed to get database version")
	}
	return version, nil
}

// TestConnection tests a database connection
func TestConnection(dbType, dsn string) (*ConnectionTestResult, error) {
	start := time.Now()

	db, err := Dial(dbType, dsn, DialOption{MaxOpenConns: 1})
	if err != nil {
		return &ConnectionTestResult{
			Success: false,
			Message: "Failed to establish connection",
			Error:   err.Error(),
		}, err
	}
	defer Close(db)

	if err := Ping(db); err != nil {
		return &ConnectionTestResult{
			Success: false,
			Message: "Connection test failed",
			Error:   err.Error(),
		}, err
	}

	version, _ := GetVersion(db)

	return &ConnectionTestResult{
		Success: true,
		Message: "Connection successful",
		Version: version,
		Latency: int(time.Since(start).Milliseconds()),
	}, nil
}

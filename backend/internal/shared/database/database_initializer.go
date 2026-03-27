package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"

	"pantheon-platform/backend/internal/config"
	"pantheon-platform/backend/internal/shared/database/factory"
)

// InitMasterDB initializes the master database connection
func InitMasterDB(cfg *config.Config) (*gorm.DB, error) {
	// 1. Try connecting directly
	db, err := factory.Dial(cfg.MasterDB.Type, cfg.MasterDB.DSN(), factory.DialOption{
		MaxOpenConns:    cfg.DefaultMaxOpenConns,
		MaxIdleConns:    cfg.DefaultMaxIdleConns,
		ConnMaxLifetime: cfg.DefaultMaxLifetime,
	})

	// 2. If connection fails, try creating the database
	if err != nil {
		log.Printf("Failed to connect to master database, attempting to create it: %v", err)
		if createErr := ensureMasterDatabaseExists(cfg); createErr != nil {
			return nil, fmt.Errorf("failed to create master database: %w", createErr)
		}

		// Try connecting again
		db, err = factory.Dial(cfg.MasterDB.Type, cfg.MasterDB.DSN(), factory.DialOption{
			MaxOpenConns:    cfg.DefaultMaxOpenConns,
			MaxIdleConns:    cfg.DefaultMaxIdleConns,
			ConnMaxLifetime: cfg.DefaultMaxLifetime,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to connect to master database after creation: %w", err)
		}
	}

	return db, nil
}

// InitMonitorDB initializes the monitor database connection
func InitMonitorDB(cfg *config.Config) (*gorm.DB, error) {
	if !cfg.EnableMonitorSync {
		return nil, nil
	}

	db, err := factory.Dial(cfg.MonitorDB.Type, cfg.MonitorDB.DSN(), factory.DialOption{
		MaxOpenConns:    cfg.DefaultMaxOpenConns,
		MaxIdleConns:    cfg.DefaultMaxIdleConns,
		ConnMaxLifetime: cfg.DefaultMaxLifetime,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to monitor database: %w", err)
	}

	return db, nil
}

// ensureMasterDatabaseExists ensures the master database exists
func ensureMasterDatabaseExists(cfg *config.Config) error {
	var dsn string
	var createSQL string

	switch cfg.MasterDB.Type {
	case "mysql":
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/mysql?charset=utf8mb4&parseTime=True&loc=Local",
			cfg.MasterDB.Username, cfg.MasterDB.Password, cfg.MasterDB.Host, cfg.MasterDB.Port)
		createSQL = fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", cfg.MasterDB.Database)
	case "postgresql":
		dsn = fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=postgres sslmode=%s",
			cfg.MasterDB.Host, cfg.MasterDB.Port, cfg.MasterDB.Username, cfg.MasterDB.Password, cfg.MasterDB.SSLMode)
		createSQL = fmt.Sprintf("CREATE DATABASE %s", cfg.MasterDB.Database)
	default:
		return nil
	}

	db, err := factory.Dial(cfg.MasterDB.Type, dsn, factory.DialOption{MaxOpenConns: 1})
	if err != nil {
		return err
	}
	defer factory.Close(db)

	if cfg.MasterDB.Type == "postgresql" {
		var exists bool
		db.Raw("SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ?)", cfg.MasterDB.Database).Scan(&exists)
		if !exists {
			return db.Exec(createSQL).Error
		}
		return nil
	}

	return db.Exec(createSQL).Error
}

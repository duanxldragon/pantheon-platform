package database

import (
	"context"
	"fmt"
	"log"
	"sort"
	"strings"
	"sync"
	"time"

	"pantheon-platform/backend/internal/config"
	"pantheon-platform/backend/internal/shared/database/crypto"
	"pantheon-platform/backend/internal/shared/database/factory"
	"pantheon-platform/backend/internal/shared/database/migration"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DBConfig represents tenant database configuration
type DBConfig struct {
	TenantID        uuid.UUID
	Type            string
	DSN             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int
}

// TenantConfigInfo represents tenant database configuration loaded by the tenant config DAO.
type TenantConfigInfo struct {
	TenantID        string
	Code            string
	DatabaseType    string
	Host            string
	Port            int
	Database        string
	Username        string
	Password        string
	FilePath        string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int
}

// TenantConfigLoader is an interface to load tenant database configurations
// This avoids circular dependency with tenant package
type TenantConfigLoader interface {
	GetAllTenantConfigs(ctx context.Context) ([]*TenantConfigInfo, error)
}

// tenantConnection wraps a tenant database connection with metadata
type tenantConnection struct {
	db       *gorm.DB
	config   *DBConfig
	lastUsed time.Time
	healthy  bool
}

// Manager handles connections to multiple tenant databases
type Manager struct {
	masterDB          *gorm.DB
	tenantConnections map[uuid.UUID]*tenantConnection
	migrators         map[string]TenantMigrator
	mu                sync.RWMutex
	cryptor           *crypto.Crypto
	healthCheckTicker *time.Ticker
	cleanupTicker     *time.Ticker
	reloadTicker      *time.Ticker
	ctx               context.Context
	cancel            context.CancelFunc
	poolManager       *PoolManager
	tenantLoader      TenantConfigLoader
}

// NewManager creates a new database manager
func NewManager(masterDB *gorm.DB, encryptionKey string, tenantDBConfig *config.TenantDBConfig) (*Manager, error) {
	cryptor, err := crypto.NewCrypto(encryptionKey)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithCancel(context.Background())

	m := &Manager{
		masterDB:          masterDB,
		tenantConnections: make(map[uuid.UUID]*tenantConnection),
		migrators:         make(map[string]TenantMigrator),
		cryptor:           cryptor,
		ctx:               ctx,
		cancel:            cancel,
		poolManager:       NewPoolManager(tenantDBConfig),
	}

	// Start health check ticker (every 30 seconds)
	m.healthCheckTicker = time.NewTicker(30 * time.Second)
	go m.healthCheckLoop()

	// Start cleanup ticker (every 5 minutes)
	m.cleanupTicker = time.NewTicker(5 * time.Minute)
	go m.cleanupLoop()

	return m, nil
}

// SetTenantLoader sets the tenant configuration loader
// This must be called after the Manager is created to avoid circular dependency
func (m *Manager) SetTenantLoader(loader TenantConfigLoader) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.tenantLoader = loader
	// Start reload ticker after loader is set
	m.reloadTicker = time.NewTicker(1 * time.Minute)
	go m.reloadTenantsLoop()
}

// RegisterTenantMigrator registers a migrator for a specific module
func (m *Manager) RegisterTenantMigrator(name string, migrator TenantMigrator) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.migrators[name] = migrator
}

func (m *Manager) GetTenantMigratorNames() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	names := make([]string, 0, len(m.migrators))
	for name := range m.migrators {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

// ConnectTenant establishes a connection to a tenant's database
func (m *Manager) ConnectTenant(ctx context.Context, config *DBConfig, password, tenantCode string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if already connected and healthy
	if conn, exists := m.tenantConnections[config.TenantID]; exists && conn.healthy {
		if conn.config != nil &&
			conn.config.Type == config.Type &&
			conn.config.DSN == config.DSN &&
			conn.config.MaxOpenConns == config.MaxOpenConns &&
			conn.config.MaxIdleConns == config.MaxIdleConns &&
			conn.config.ConnMaxLifetime == config.ConnMaxLifetime {
			conn.lastUsed = time.Now()
			return nil
		}

		factory.Close(conn.db)
		delete(m.tenantConnections, config.TenantID)
	}

	// Get pool configuration based on tenant size
	poolConfig := m.poolManager.GetPoolConfig(config.TenantID, tenantCode)

	// Connect to database
	db, err := factory.Dial(config.Type, config.DSN, factory.DialOption{
		MaxOpenConns:    poolConfig.MaxOpenConns,
		MaxIdleConns:    poolConfig.MaxIdleConns,
		ConnMaxLifetime: poolConfig.ConnMaxLifetime,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to tenant database: %w", err)
	}

	// Initialize migration record table
	if err := migration.AutoMigrate(db); err != nil {
		return fmt.Errorf("failed to create migration table: %w", err)
	}

	// Perform migrations with version tracking
	for name, migrator := range m.migrators {
		models := migrator.GetTenantModels()
		if len(models) > 0 {
			const migrationVersion = "v1"
			tenantIDStr := config.TenantID.String()

			// Check if already migrated
			migrated, err := migration.HasMigrated(db, tenantIDStr, name, migrationVersion)
			if err != nil {
				log.Printf("Warning: failed to check migration status for module %s: %v", name, err)
			} else if migrated {
				log.Printf("Module %s already migrated for tenant %s, skipping", name, config.TenantID)
				continue
			}

			// Execute migration
			if err := db.AutoMigrate(models...); err != nil {
				return fmt.Errorf("failed to migrate module %s for tenant %s: %w", name, config.TenantID, err)
			}

			// Record successful migration
			if err := migration.RecordMigration(db, tenantIDStr, name, migrationVersion); err != nil {
				log.Printf("Warning: failed to record migration for module %s: %v", name, err)
			} else {
				log.Printf("Successfully migrated module %s for tenant %s", name, config.TenantID)
			}
		}
	}

	// Store connection with metadata
	m.tenantConnections[config.TenantID] = &tenantConnection{
		db:       db,
		config:   config,
		lastUsed: time.Now(),
		healthy:  true,
	}

	log.Printf("Successfully connected to database for tenant %s (pool: max_open=%d, max_idle=%d)", config.TenantID, poolConfig.MaxOpenConns, poolConfig.MaxIdleConns)
	return nil
}

// GetTenantDB returns the database connection for a tenant
func (m *Manager) GetTenantDB(tenantID uuid.UUID) *gorm.DB {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if conn, exists := m.tenantConnections[tenantID]; exists {
		conn.lastUsed = time.Now() // Update last used time
		return conn.db
	}
	return nil
}

// RemoveDB removes a tenant database connection (deprecated: use RemoveTenant)
func (m *Manager) RemoveDB(tenantID uuid.UUID) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if conn, exists := m.tenantConnections[tenantID]; exists {
		factory.Close(conn.db)
		delete(m.tenantConnections, tenantID)
	}
}

// RemoveTenant removes a tenant database connection
func (m *Manager) RemoveTenant(tenantID uuid.UUID) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if conn, exists := m.tenantConnections[tenantID]; exists {
		factory.Close(conn.db)
		delete(m.tenantConnections, tenantID)
		log.Printf("Removed database connection for tenant %s", tenantID)
	}
}

// EncryptPassword encrypts a database password
func (m *Manager) EncryptPassword(password string) (string, error) {
	return m.cryptor.Encrypt(password)
}

// DecryptPassword decrypts a database password
func (m *Manager) DecryptPassword(encrypted string) (string, error) {
	return m.cryptor.Decrypt(encrypted)
}

// TestConnection tests a connection string
func (m *Manager) TestConnection(dbType, dsn, password string) (*factory.ConnectionTestResult, error) {
	return factory.TestConnection(dbType, dsn)
}

// CloseAll closes all connections
func (m *Manager) CloseAll() error {
	m.cancel() // Stop background tasks

	m.mu.Lock()
	defer m.mu.Unlock()

	for _, conn := range m.tenantConnections {
		factory.Close(conn.db)
	}
	m.tenantConnections = make(map[uuid.UUID]*tenantConnection)

	if m.masterDB != nil {
		return factory.Close(m.masterDB)
	}

	return nil
}

// healthCheckLoop performs periodic health checks on all connections
func (m *Manager) healthCheckLoop() {
	for {
		select {
		case <-m.healthCheckTicker.C:
			m.checkAllConnections()
		case <-m.ctx.Done():
			m.healthCheckTicker.Stop()
			return
		}
	}
}

// checkAllConnections checks health of all tenant connections
func (m *Manager) checkAllConnections() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for tenantID, conn := range m.tenantConnections {
		if err := factory.Ping(conn.db); err != nil {
			log.Printf("Health check failed for tenant %s: %v", tenantID, err)
			conn.healthy = false
		} else {
			conn.healthy = true
		}
	}
}

// cleanupLoop performs periodic cleanup of idle connections
func (m *Manager) cleanupLoop() {
	for {
		select {
		case <-m.cleanupTicker.C:
			m.cleanupIdleConnections()
		case <-m.ctx.Done():
			m.cleanupTicker.Stop()
			return
		}
	}
}

// cleanupIdleConnections removes connections idle for more than 1 hour
func (m *Manager) cleanupIdleConnections() {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	idleThreshold := time.Hour

	for tenantID, conn := range m.tenantConnections {
		if now.Sub(conn.lastUsed) > idleThreshold {
			log.Printf("Cleaning up idle connection for tenant %s", tenantID)
			factory.Close(conn.db)
			delete(m.tenantConnections, tenantID)
		}
	}
}

// reloadTenantsLoop performs periodic tenant database reloading
func (m *Manager) reloadTenantsLoop() {
	for {
		select {
		case <-m.reloadTicker.C:
			m.reloadTenants()
		case <-m.ctx.Done():
			if m.reloadTicker != nil {
				m.reloadTicker.Stop()
			}
			return
		}
	}
}

// reloadTenants reloads tenant database connections
func (m *Manager) reloadTenants() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Skip if loader is not set
	m.mu.RLock()
	if m.tenantLoader == nil {
		m.mu.RUnlock()
		return
	}
	m.mu.RUnlock()

	// Get all tenant database configurations
	configs, err := m.tenantLoader.GetAllTenantConfigs(ctx)
	if err != nil {
		log.Printf("Failed to load tenant configs for reload: %v", err)
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Build set of current tenant IDs
	currentTenants := make(map[uuid.UUID]bool)
	for _, c := range configs {
		tenantUUID, err := uuid.Parse(c.TenantID)
		if err != nil {
			log.Printf("Failed to parse tenant ID %s: %v", c.TenantID, err)
			continue
		}
		currentTenants[tenantUUID] = true
	}

	// 1. Remove connections for deleted/disabled tenants
	for tenantID := range m.tenantConnections {
		if !currentTenants[tenantID] {
			log.Printf("Removing connection for deleted/disabled tenant %s", tenantID)
			conn := m.tenantConnections[tenantID]
			factory.Close(conn.db)
			delete(m.tenantConnections, tenantID)
		}
	}

	// 2. Add new tenant connections asynchronously
	for _, c := range configs {
		tenantUUID, err := uuid.Parse(c.TenantID)
		if err != nil {
			log.Printf("Failed to parse tenant ID %s: %v", c.TenantID, err)
			continue
		}

		// Skip if already connected
		if _, exists := m.tenantConnections[tenantUUID]; exists {
			continue
		}

		// Connect asynchronously to avoid blocking
		go func(config *TenantConfigInfo) {
			password, err := m.resolveTenantConfigPassword(config)
			if err != nil {
				log.Printf("Skipping tenant %s during reload: %v", config.TenantID, err)
				return
			}

			configCopy := *config
			configCopy.Password = password

			dsn, err := m.buildTenantDSN(&configCopy)
			if err != nil {
				log.Printf("Failed to build DSN for tenant %s: %v", config.TenantID, err)
				return
			}

			tenantUUID, err := uuid.Parse(config.TenantID)
			if err != nil {
				log.Printf("Failed to parse tenant ID %s: %v", config.TenantID, err)
				return
			}

			dbConfig := &DBConfig{
				TenantID:        tenantUUID,
				Type:            configCopy.DatabaseType,
				DSN:             dsn,
				MaxOpenConns:    configCopy.MaxOpenConns,
				MaxIdleConns:    configCopy.MaxIdleConns,
				ConnMaxLifetime: configCopy.ConnMaxLifetime,
			}

			if err := m.ConnectTenant(context.Background(), dbConfig, password, configCopy.Code); err != nil {
				log.Printf("Failed to connect tenant %s during reload: %v", config.TenantID, err)
			} else {
				log.Printf("Successfully connected tenant %s during reload", config.TenantID)
			}
		}(c)
	}
}

func (m *Manager) resolveTenantConfigPassword(config *TenantConfigInfo) (string, error) {
	if config == nil {
		return "", fmt.Errorf("tenant config is nil")
	}

	switch config.DatabaseType {
	case "sqlite":
		return config.Password, nil
	}

	encryptedPassword := strings.TrimSpace(config.Password)
	if encryptedPassword == "" {
		return "", fmt.Errorf("database password is empty")
	}

	password, err := m.DecryptPassword(encryptedPassword)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt database password: %w", err)
	}

	return password, nil
}

// buildTenantDSN builds DSN from tenant config info
func (m *Manager) buildTenantDSN(c *TenantConfigInfo) (string, error) {
	switch c.DatabaseType {
	case "mysql":
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			c.Username, c.Password, c.Host, c.Port, c.Database), nil
	case "postgresql":
		sslMode := c.SSLMode
		if sslMode == "" {
			sslMode = "disable"
		}
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			c.Host, c.Port, c.Username, c.Password, c.Database, sslMode), nil
	case "sqlite":
		return c.FilePath, nil
	case "mssql":
		query := map[string]string{}
		if c.Database != "" {
			query["database"] = c.Database
		}
		if c.SSLMode == "" || c.SSLMode == "disable" {
			query["encrypt"] = "disable"
		} else {
			query["encrypt"] = "true"
		}
		return fmt.Sprintf("sqlserver://%s:%s@%s:%d?%s",
			c.Username, c.Password, c.Host, c.Port, "database="+c.Database+"&encrypt=disable"), nil
	default:
		return "", fmt.Errorf("unsupported database type: %s", c.DatabaseType)
	}
}

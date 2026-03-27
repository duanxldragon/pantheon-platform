package database

import (
	"regexp"
	"strings"

	"github.com/google/uuid"
	"pantheon-platform/backend/internal/config"
)

// PoolConfig represents connection pool configuration
type PoolConfig struct {
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int
}

// PoolManager manages tenant-specific pool configurations
type PoolManager struct {
	defaultConfig  *PoolConfig
	largeTenantMap map[string]*PoolConfig
	smallTenantMap map[string]*PoolConfig
}

// NewPoolManager creates a new pool manager from configuration
func NewPoolManager(cfg *config.TenantDBConfig) *PoolManager {
	if cfg == nil {
		// Return with sensible defaults if no config provided
		return &PoolManager{
			defaultConfig: &PoolConfig{
				MaxOpenConns:    50,
				MaxIdleConns:    5,
				ConnMaxLifetime: 3600,
			},
			largeTenantMap: make(map[string]*PoolConfig),
			smallTenantMap: make(map[string]*PoolConfig),
		}
	}

	pm := &PoolManager{
		defaultConfig: &PoolConfig{
			MaxOpenConns:    cfg.DefaultPool.MaxOpenConns,
			MaxIdleConns:    cfg.DefaultPool.MaxIdleConns,
			ConnMaxLifetime: cfg.DefaultPool.ConnMaxLifetime,
		},
		largeTenantMap: make(map[string]*PoolConfig),
		smallTenantMap: make(map[string]*PoolConfig),
	}

	// Initialize large tenant configurations
	for _, override := range cfg.LargeTenants {
		config := &PoolConfig{
			MaxOpenConns:    override.MaxOpenConns,
			MaxIdleConns:    override.MaxIdleConns,
			ConnMaxLifetime: override.ConnMaxLifetime,
		}
		if override.TenantCode != "" {
			pm.largeTenantMap[override.TenantCode] = config
		}
		if override.TenantID != "" {
			pm.largeTenantMap[override.TenantID] = config
		}
	}

	// Initialize small tenant configurations
	for _, override := range cfg.SmallTenants {
		config := &PoolConfig{
			MaxOpenConns:    override.MaxOpenConns,
			MaxIdleConns:    override.MaxIdleConns,
			ConnMaxLifetime: override.ConnMaxLifetime,
		}
		if override.TenantCode != "" {
			pm.smallTenantMap[override.TenantCode] = config
		}
		if override.TenantID != "" {
			pm.smallTenantMap[override.TenantID] = config
		}
	}

	return pm
}

// GetPoolConfig returns the pool configuration for a tenant
// Priority: exact TenantID match > wildcard TenantCode match > default
func (pm *PoolManager) GetPoolConfig(tenantID uuid.UUID, tenantCode string) *PoolConfig {
	tenantIDStr := tenantID.String()

	// Priority 1: Exact match by TenantID (large tenants)
	if config, ok := pm.largeTenantMap[tenantIDStr]; ok {
		return config
	}

	// Priority 2: Exact match by TenantID (small tenants)
	if config, ok := pm.smallTenantMap[tenantIDStr]; ok {
		return config
	}

	// Priority 3: Wildcard match by TenantCode (large tenants)
	for pattern, config := range pm.largeTenantMap {
		if strings.Contains(pattern, "*") {
			// Convert wildcard pattern to regex
			regexPattern := strings.ReplaceAll(pattern, "*", ".*")
			matched, err := regexp.MatchString(regexPattern, tenantCode)
			if err == nil && matched {
				return config
			}
		}
	}

	// Priority 4: Wildcard match by TenantCode (small tenants)
	for pattern, config := range pm.smallTenantMap {
		if strings.Contains(pattern, "*") {
			regexPattern := strings.ReplaceAll(pattern, "*", ".*")
			matched, err := regexp.MatchString(regexPattern, tenantCode)
			if err == nil && matched {
				return config
			}
		}
	}

	// Priority 5: Return default configuration
	return pm.defaultConfig
}

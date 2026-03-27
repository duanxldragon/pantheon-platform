package database

import "gorm.io/gorm"

// TenantMigrator exposes tenant-scoped models for auto-migration.
type TenantMigrator interface {
	// GetTenantModels returns models that should be migrated in tenant databases.
	GetTenantModels() []interface{}
}

// DefaultTenantMigrator provides the shared baseline tenant migration set.
type DefaultTenantMigrator struct{}

// GetTenantModels returns the default baseline models.
func (m *DefaultTenantMigrator) GetTenantModels() []interface{} {
	return []interface{}{}
}

// TenantMigrationManager coordinates tenant DB migrators from all modules.
type TenantMigrationManager struct {
	migrators map[string]TenantMigrator
}

// NewTenantMigrationManager creates a tenant migration manager.
func NewTenantMigrationManager() *TenantMigrationManager {
	return &TenantMigrationManager{
		migrators: make(map[string]TenantMigrator),
	}
}

// RegisterMigrator registers a module tenant migrator.
func (m *TenantMigrationManager) RegisterMigrator(moduleName string, migrator TenantMigrator) {
	m.migrators[moduleName] = migrator
}

// MigrateTenant runs baseline and module-specific tenant migrations.
func (m *TenantMigrationManager) MigrateTenant(db *gorm.DB) error {
	defaultMigrator := &DefaultTenantMigrator{}
	if err := db.AutoMigrate(defaultMigrator.GetTenantModels()...); err != nil {
		return err
	}

	for _, migrator := range m.migrators {
		models := migrator.GetTenantModels()
		if len(models) > 0 {
			if err := db.AutoMigrate(models...); err != nil {
				return err
			}
		}
	}

	return nil
}

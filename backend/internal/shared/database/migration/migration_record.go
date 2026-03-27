package migration

import (
	"time"

	"gorm.io/gorm"
)

// MigrationRecord tracks migration execution for each tenant
type MigrationRecord struct {
	ID          uint      `gorm:"primaryKey"`
	TenantID    string    `gorm:"index;size:36;not null"`
	Module      string    `gorm:"index;size:100;not null"`
	Version     string    `gorm:"index;size:50;not null"`
	Status      string    `gorm:"size:20;not null"` // success, failed, rolled_back
	StartedAt   time.Time `gorm:"not null"`
	CompletedAt *time.Time
	ErrorMsg    string `gorm:"type:text"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&MigrationRecord{})
}

// HasMigrated checks if a migration has been executed successfully for a tenant
func HasMigrated(db *gorm.DB, tenantID, module, version string) (bool, error) {
	var count int64
	err := db.Model(&MigrationRecord{}).
		Where("tenant_id = ? AND module = ? AND version = ? AND status = ?", tenantID, module, version, "success").
		Count(&count).Error
	return count > 0, err
}

// RecordMigration records a successful migration
func RecordMigration(db *gorm.DB, tenantID, module, version string) error {
	now := time.Now()
	record := &MigrationRecord{
		TenantID:    tenantID,
		Module:      module,
		Version:     version,
		Status:      "success",
		StartedAt:   now,
		CompletedAt: &now,
	}
	return db.Create(record).Error
}

// RecordMigrationFailure records a failed migration
func RecordMigrationFailure(db *gorm.DB, tenantID, module, version string, errorMsg string) error {
	now := time.Now()
	record := &MigrationRecord{
		TenantID:    tenantID,
		Module:      module,
		Version:     version,
		Status:      "failed",
		StartedAt:   now,
		CompletedAt: &now,
		ErrorMsg:    errorMsg,
	}
	return db.Create(record).Error
}

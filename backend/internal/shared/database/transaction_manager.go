package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TransactionManager defines shared transaction orchestration behavior.
type TransactionManager interface {
	Begin() (*gorm.DB, error)
	Commit(tx *gorm.DB) error
	Rollback(tx *gorm.DB) error
	Transaction(ctx context.Context, fn func(*gorm.DB) error) error
	AutoTransaction(ctx context.Context, fn func(*gorm.DB) error) error
}

// transactionManager is the default TransactionManager implementation.
type transactionManager struct {
	db        *gorm.DB
	dbManager *Manager
}

// NewTransactionManager creates a transaction manager.
func NewTransactionManager(db *gorm.DB, dbManager *Manager) TransactionManager {
	return &transactionManager{db: db, dbManager: dbManager}
}

// WithTenantContext injects a tenant ID into context.
func WithTenantContext(ctx context.Context, tenantID uuid.UUID) context.Context {
	return context.WithValue(ctx, "tenant_id", tenantID)
}

// GetTenantID reads the tenant ID from context.
func GetTenantID(ctx context.Context) (uuid.UUID, bool) {
	if tenantID, ok := ctx.Value("tenant_id").(uuid.UUID); ok {
		return tenantID, true
	}
	return uuid.Nil, false
}

// getDB resolves the correct database connection from context.
func (tm *transactionManager) getDB(ctx context.Context) *gorm.DB {
	if ctx == nil {
		return tm.db
	}

	if tenantID, ok := GetTenantID(ctx); ok {
		if tm.dbManager != nil {
			if tenantDB := tm.dbManager.GetTenantDB(tenantID); tenantDB != nil {
				return tenantDB.WithContext(ctx)
			}
		}
	}

	if tenantDB, ok := ctx.Value("tenant_db").(*gorm.DB); ok {
		return tenantDB.WithContext(ctx)
	}

	return tm.db.WithContext(ctx)
}

// Begin starts a transaction on the default database.
func (tm *transactionManager) Begin() (*gorm.DB, error) {
	tx := tm.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	return tx, nil
}

// Commit commits a transaction.
func (tm *transactionManager) Commit(tx *gorm.DB) error {
	return tx.Commit().Error
}

// Rollback rolls back a transaction.
func (tm *transactionManager) Rollback(tx *gorm.DB) error {
	return tx.Rollback().Error
}

// Transaction executes a callback in a transaction with tenant-aware DB selection.
func (tm *transactionManager) Transaction(ctx context.Context, fn func(*gorm.DB) error) error {
	tx := tm.getDB(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if tenantID, ok := GetTenantID(ctx); ok {
		tx.InstanceSet("tenant_id", tenantID.String())
	}

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("transaction error: %v, rollback error: %v", err, rbErr)
		}
		return err
	}

	return tx.Commit().Error
}

// AutoTransaction behaves like Transaction and is kept for compatibility.
func (tm *transactionManager) AutoTransaction(ctx context.Context, fn func(*gorm.DB) error) error {
	tx := tm.getDB(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if tenantID, ok := GetTenantID(ctx); ok {
		tx.InstanceSet("tenant_id", tenantID.String())
	}

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("transaction error: %v, rollback error: %v", err, rbErr)
		}
		return err
	}

	return tx.Commit().Error
}

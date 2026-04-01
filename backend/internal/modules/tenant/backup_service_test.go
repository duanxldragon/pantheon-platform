package tenant

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type stubTenantBackupDAO struct {
	getByTenantIDCalled bool
}

func (s *stubTenantBackupDAO) Create(context.Context, *TenantDatabaseConfig) error {
	return nil
}

func (s *stubTenantBackupDAO) GetByTenantID(context.Context, string) (*TenantDatabaseConfig, error) {
	s.getByTenantIDCalled = true
	return &TenantDatabaseConfig{}, nil
}

func (s *stubTenantBackupDAO) GetAll(context.Context) ([]*TenantDatabaseConfig, error) {
	return nil, nil
}

func (s *stubTenantBackupDAO) Update(context.Context, *TenantDatabaseConfig) error {
	return nil
}

func (s *stubTenantBackupDAO) Delete(context.Context, string) error {
	return nil
}

func (s *stubTenantBackupDAO) GetAllTenantConfigs(context.Context) ([]*database.TenantConfigInfo, error) {
	return nil, nil
}

func newBackupServiceTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&TenantBackup{}); err != nil {
		t.Fatalf("migrate tenant backup: %v", err)
	}
	return db
}

func TestDeleteBackupRejectsPathOutsideBackupDir(t *testing.T) {
	db := newBackupServiceTestDB(t)
	backupRoot := t.TempDir()
	outsideRoot := t.TempDir()
	outsideFile := filepath.Join(outsideRoot, "outside.sql")
	if err := os.WriteFile(outsideFile, []byte("backup"), 0600); err != nil {
		t.Fatalf("write outside backup file: %v", err)
	}

	service := NewBackupService(db, &stubTenantBackupDAO{}, backupRoot, nil)
	backup := &TenantBackup{
		ID:       uuid.New(),
		TenantID: uuid.NewString(),
		FileName: "outside.sql",
		FilePath: outsideFile,
		Status:   BackupStatusCompleted,
	}
	if err := db.Create(backup).Error; err != nil {
		t.Fatalf("create backup record: %v", err)
	}

	err := service.DeleteBackup(context.Background(), backup.ID.String())
	if err == nil {
		t.Fatal("expected path validation error")
	}
	if !strings.Contains(err.Error(), "outside backup directory") {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, statErr := os.Stat(outsideFile); statErr != nil {
		t.Fatalf("expected outside file to remain, got %v", statErr)
	}

	var count int64
	if err := db.Model(&TenantBackup{}).Where("id = ?", backup.ID.String()).Count(&count).Error; err != nil {
		t.Fatalf("count backup records: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected backup record to remain, got %d", count)
	}
}

func TestRestoreBackupRejectsPathOutsideBackupDir(t *testing.T) {
	db := newBackupServiceTestDB(t)
	backupRoot := t.TempDir()
	outsideRoot := t.TempDir()
	outsideFile := filepath.Join(outsideRoot, "outside.sql")
	if err := os.WriteFile(outsideFile, []byte("backup"), 0600); err != nil {
		t.Fatalf("write outside backup file: %v", err)
	}

	dao := &stubTenantBackupDAO{}
	service := NewBackupService(db, dao, backupRoot, nil)
	backup := &TenantBackup{
		ID:       uuid.New(),
		TenantID: uuid.NewString(),
		FileName: "outside.sql",
		FilePath: outsideFile,
		Status:   BackupStatusCompleted,
	}
	if err := db.Create(backup).Error; err != nil {
		t.Fatalf("create backup record: %v", err)
	}

	err := service.RestoreBackup(context.Background(), backup.ID.String())
	if err == nil {
		t.Fatal("expected path validation error")
	}
	if !strings.Contains(err.Error(), "outside backup directory") {
		t.Fatalf("unexpected error: %v", err)
	}
	if dao.getByTenantIDCalled {
		t.Fatal("expected restore to stop before loading tenant database config")
	}
}

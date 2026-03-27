package tenant

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BackupStatus represents the lifecycle status of a tenant backup.
type BackupStatus string

const (
	BackupStatusPending   BackupStatus = "pending"
	BackupStatusRunning   BackupStatus = "running"
	BackupStatusCompleted BackupStatus = "completed"
	BackupStatusFailed    BackupStatus = "failed"
)

// TenantBackup stores tenant backup metadata.
type TenantBackup struct {
	ID        uuid.UUID    `json:"id" gorm:"type:char(36);primaryKey"`
	TenantID  string       `json:"tenant_id" gorm:"type:char(36);notNull;index"`
	FileName  string       `json:"file_name" gorm:"size:255;notNull"`
	FilePath  string       `json:"file_path" gorm:"size:500;notNull"`
	FileSize  int64        `json:"file_size" gorm:"default:0"`
	Status    BackupStatus `json:"status" gorm:"size:20;notNull;default:'pending'"`
	Message   string       `json:"message" gorm:"type:text"`
	CreatedBy string       `json:"created_by" gorm:"size:100"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

// TableName returns the tenant backup table name.
func (TenantBackup) TableName() string {
	return "tenant_backups"
}

// BackupService defines tenant backup management capabilities.
type BackupService interface {
	CreateBackup(ctx context.Context, tenantID string, createdBy string) (*TenantBackup, error)
	ListBackups(ctx context.Context, tenantID string) ([]*TenantBackup, error)
	DeleteBackup(ctx context.Context, backupID string) error
	RestoreBackup(ctx context.Context, backupID string) error
}

type backupService struct {
	db                 *gorm.DB
	tenantDatabaseRepo TenantDatabaseRepository
	backupDir          string
	decryptPassword    func(string) (string, error)
}

// NewBackupService creates a backup service.
func NewBackupService(db *gorm.DB, tenantDatabaseRepo TenantDatabaseRepository, backupDir string, decryptPassword func(string) (string, error)) BackupService {
	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		_ = os.MkdirAll(backupDir, 0755)
	}
	return &backupService{
		db:                 db,
		tenantDatabaseRepo: tenantDatabaseRepo,
		backupDir:          backupDir,
		decryptPassword:    decryptPassword,
	}
}

// CreateBackup creates one backup record and starts the backup job.
func (s *backupService) CreateBackup(ctx context.Context, tenantID string, createdBy string) (*TenantBackup, error) {
	databaseConfig, err := s.tenantDatabaseRepo.GetByTenantID(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB config: %w", err)
	}

	fileName := fmt.Sprintf("backup_%s_%s.sql", tenantID, time.Now().Format("20060102_150405"))
	filePath := filepath.Join(s.backupDir, fileName)

	backup := &TenantBackup{
		ID:        uuid.New(),
		TenantID:  tenantID,
		FileName:  fileName,
		FilePath:  filePath,
		Status:    BackupStatusPending,
		CreatedBy: createdBy,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.WithContext(ctx).Create(backup).Error; err != nil {
		return nil, err
	}

	go s.runBackup(databaseConfig, backup)

	return backup, nil
}

func (s *backupService) runBackup(databaseConfig *TenantDatabaseConfig, backup *TenantBackup) {
	backup.Status = BackupStatusRunning
	s.db.Save(backup)

	var err error
	switch databaseConfig.DatabaseType {
	case DBTypeMySQL:
		err = s.dumpMySQL(databaseConfig, backup.FilePath)
	case DBTypePostgreSQL:
		err = s.dumpPostgres(databaseConfig, backup.FilePath)
	case DBTypeSQLite:
		err = s.dumpSQLite(databaseConfig, backup.FilePath)
	default:
		err = fmt.Errorf("unsupported database type for backup: %s", databaseConfig.DatabaseType)
	}

	if err != nil {
		backup.Status = BackupStatusFailed
		backup.Message = err.Error()
	} else {
		info, statErr := os.Stat(backup.FilePath)
		if statErr == nil {
			backup.FileSize = info.Size()
		}
		backup.Status = BackupStatusCompleted
	}

	backup.UpdatedAt = time.Now()
	s.db.Save(backup)
}

func (s *backupService) decryptPasswordValue(encrypted string) string {
	if s.decryptPassword == nil {
		return encrypted
	}
	decryptedPassword, err := s.decryptPassword(encrypted)
	if err != nil {
		return encrypted
	}
	return decryptedPassword
}

func (s *backupService) dumpMySQL(databaseConfig *TenantDatabaseConfig, outPath string) error {
	password := s.decryptPasswordValue(databaseConfig.PasswordEncrypted)
	port := strconv.Itoa(databaseConfig.Port)
	if databaseConfig.Port == 0 {
		port = "3306"
	}

	// #nosec G204 — args are from trusted DB configuration, not user input
	cmd := exec.Command("mysqldump",
		"-h", databaseConfig.Host,
		"-P", port,
		"-u", databaseConfig.Username,
		"--single-transaction",
		"--routines",
		"--triggers",
		databaseConfig.Database,
	)
	cmd.Env = append(os.Environ(), "MYSQL_PWD="+password)

	outFile, err := os.Create(outPath)
	if err != nil {
		return fmt.Errorf("failed to create backup file: %w", err)
	}
	defer outFile.Close()

	cmd.Stdout = outFile
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("mysqldump failed: %w", err)
	}
	return nil
}

func (s *backupService) dumpPostgres(databaseConfig *TenantDatabaseConfig, outPath string) error {
	password := s.decryptPasswordValue(databaseConfig.PasswordEncrypted)
	port := strconv.Itoa(databaseConfig.Port)
	if databaseConfig.Port == 0 {
		port = "5432"
	}

	// #nosec G204 — args are from trusted DB configuration, not user input
	cmd := exec.Command("pg_dump",
		"-h", databaseConfig.Host,
		"-p", port,
		"-U", databaseConfig.Username,
		"-d", databaseConfig.Database,
		"-F", "p", // plain SQL format
	)
	cmd.Env = append(os.Environ(), "PGPASSWORD="+password)

	outFile, err := os.Create(outPath)
	if err != nil {
		return fmt.Errorf("failed to create backup file: %w", err)
	}
	defer outFile.Close()

	cmd.Stdout = outFile
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("pg_dump failed: %w", err)
	}
	return nil
}

func (s *backupService) dumpSQLite(databaseConfig *TenantDatabaseConfig, outPath string) error {
	src := databaseConfig.FilePath
	if src == "" {
		return fmt.Errorf("sqlite file path not configured")
	}

	srcFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open sqlite file: %w", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(outPath)
	if err != nil {
		return fmt.Errorf("failed to create backup file: %w", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return fmt.Errorf("failed to copy sqlite file: %w", err)
	}
	return nil
}

// ListBackups returns all backups for a tenant.
func (s *backupService) ListBackups(ctx context.Context, tenantID string) ([]*TenantBackup, error) {
	var backups []*TenantBackup
	err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("created_at DESC").Find(&backups).Error
	return backups, err
}

// DeleteBackup removes one backup record and its file.
func (s *backupService) DeleteBackup(ctx context.Context, backupID string) error {
	var backup TenantBackup
	if err := s.db.WithContext(ctx).Where("id = ?", backupID).First(&backup).Error; err != nil {
		return err
	}

	_ = os.Remove(backup.FilePath)

	return s.db.WithContext(ctx).Delete(&backup).Error
}

// RestoreBackup restores a tenant database from one backup.
func (s *backupService) RestoreBackup(ctx context.Context, backupID string) error {
	var backup TenantBackup
	if err := s.db.WithContext(ctx).Where("id = ?", backupID).First(&backup).Error; err != nil {
		return err
	}

	if backup.Status != BackupStatusCompleted {
		return fmt.Errorf("backup is not completed")
	}

	if _, err := os.Stat(backup.FilePath); os.IsNotExist(err) {
		return fmt.Errorf("backup file not found: %s", backup.FilePath)
	}

	databaseConfig, err := s.tenantDatabaseRepo.GetByTenantID(ctx, backup.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB config: %w", err)
	}

	switch databaseConfig.DatabaseType {
	case DBTypeMySQL:
		return s.restoreMySQL(databaseConfig, backup.FilePath)
	case DBTypePostgreSQL:
		return s.restorePostgres(databaseConfig, backup.FilePath)
	case DBTypeSQLite:
		return s.restoreSQLite(databaseConfig, backup.FilePath)
	default:
		return fmt.Errorf("unsupported database type for restore: %s", databaseConfig.DatabaseType)
	}
}

func (s *backupService) restoreMySQL(databaseConfig *TenantDatabaseConfig, filePath string) error {
	password := s.decryptPasswordValue(databaseConfig.PasswordEncrypted)
	port := strconv.Itoa(databaseConfig.Port)
	if databaseConfig.Port == 0 {
		port = "3306"
	}

	inFile, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open backup file: %w", err)
	}
	defer inFile.Close()

	// #nosec G204 — args are from trusted DB configuration, not user input
	cmd := exec.Command("mysql",
		"-h", databaseConfig.Host,
		"-P", port,
		"-u", databaseConfig.Username,
		databaseConfig.Database,
	)
	cmd.Env = append(os.Environ(), "MYSQL_PWD="+password)
	cmd.Stdin = inFile

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("mysql restore failed: %w", err)
	}
	return nil
}

func (s *backupService) restorePostgres(databaseConfig *TenantDatabaseConfig, filePath string) error {
	password := s.decryptPasswordValue(databaseConfig.PasswordEncrypted)
	port := strconv.Itoa(databaseConfig.Port)
	if databaseConfig.Port == 0 {
		port = "5432"
	}

	inFile, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open backup file: %w", err)
	}
	defer inFile.Close()

	// #nosec G204 — args are from trusted DB configuration, not user input
	cmd := exec.Command("psql",
		"-h", databaseConfig.Host,
		"-p", port,
		"-U", databaseConfig.Username,
		"-d", databaseConfig.Database,
	)
	cmd.Env = append(os.Environ(), "PGPASSWORD="+password)
	cmd.Stdin = inFile

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("psql restore failed: %w", err)
	}
	return nil
}

func (s *backupService) restoreSQLite(databaseConfig *TenantDatabaseConfig, filePath string) error {
	dst := databaseConfig.FilePath
	if dst == "" {
		return fmt.Errorf("sqlite file path not configured")
	}

	srcFile, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open backup file: %w", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to open sqlite destination: %w", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return fmt.Errorf("failed to restore sqlite file: %w", err)
	}
	return nil
}

package tenant

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"pantheon-platform/backend/internal/shared/database"
)

var (
	ErrTenantNotFound   = errors.New("tenant not found")
	ErrTenantDBNotFound = errors.New("tenant database config not found")
)

// TenantRepository defines tenant persistence operations.
type TenantRepository interface {
	Create(ctx context.Context, tenant *Tenant) error
	GetByID(ctx context.Context, id string) (*Tenant, error)
	GetByCode(ctx context.Context, code string) (*Tenant, error)
	List(ctx context.Context, page, pageSize int) ([]*Tenant, int64, error)
	Update(ctx context.Context, tenant *Tenant) error
	Delete(ctx context.Context, id string) error
}

// TenantDatabaseRepository defines tenant database config persistence operations.
type TenantDatabaseRepository interface {
	Create(ctx context.Context, config *TenantDatabaseConfig) error
	GetByTenantID(ctx context.Context, tenantID string) (*TenantDatabaseConfig, error)
	GetAll(ctx context.Context) ([]*TenantDatabaseConfig, error)
	Update(ctx context.Context, config *TenantDatabaseConfig) error
	Delete(ctx context.Context, id string) error
	// GetAllTenantConfigs implements database.TenantConfigLoader for dynamic tenant loading
	GetAllTenantConfigs(ctx context.Context) ([]*database.TenantConfigInfo, error)
}

type tenantRepository struct {
	db *gorm.DB
}

// NewTenantRepository creates a tenant repository.
func NewTenantRepository(db *gorm.DB) TenantRepository {
	return &tenantRepository{db: db}
}

func (r *tenantRepository) Create(ctx context.Context, tenant *Tenant) error {
	return r.db.WithContext(ctx).Create(tenant).Error
}

func (r *tenantRepository) GetByID(ctx context.Context, id string) (*Tenant, error) {
	var tenantRecord Tenant
	err := r.db.WithContext(ctx).First(&tenantRecord, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTenantNotFound
		}
		return nil, err
	}
	return &tenantRecord, nil
}

func (r *tenantRepository) GetByCode(ctx context.Context, code string) (*Tenant, error) {
	var tenantRecord Tenant
	err := r.db.WithContext(ctx).First(&tenantRecord, "code = ?", code).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTenantNotFound
		}
		return nil, err
	}
	return &tenantRecord, nil
}

func (r *tenantRepository) List(ctx context.Context, page, pageSize int) ([]*Tenant, int64, error) {
	var tenantRecords []*Tenant
	var total int64
	r.db.WithContext(ctx).Model(&Tenant{}).Count(&total)
	err := r.db.WithContext(ctx).Offset((page - 1) * pageSize).Limit(pageSize).Find(&tenantRecords).Error
	return tenantRecords, total, err
}

func (r *tenantRepository) Update(ctx context.Context, tenant *Tenant) error {
	return r.db.WithContext(ctx).Save(tenant).Error
}

func (r *tenantRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&Tenant{}, "id = ?", id).Error
}

type tenantDatabaseRepository struct {
	db *gorm.DB
}

// NewTenantDatabaseRepository creates a tenant database repository.
func NewTenantDatabaseRepository(db *gorm.DB) TenantDatabaseRepository {
	return &tenantDatabaseRepository{db: db}
}

// GetAllTenantConfigs implements database.TenantConfigLoader interface
func (r *tenantDatabaseRepository) GetAllTenantConfigs(ctx context.Context) ([]*database.TenantConfigInfo, error) {
	// Query all tenant database configs using GORM
	type TenantDBWithCode struct {
		TenantDatabaseConfig
		Code string `gorm:"column:code"`
	}

	var dbConfigs []TenantDBWithCode
	err := r.db.WithContext(ctx).
		Table("tenant_database_configs").
		Select("tenant_database_configs.*, tenants.code").
		Joins("INNER JOIN tenants ON tenant_database_configs.tenant_id = tenants.id").
		Where("tenants.deleted_at IS NULL").
		Find(&dbConfigs).Error

	if err != nil {
		return nil, err
	}

	// Convert to TenantConfigInfo
	configs := make([]*database.TenantConfigInfo, 0, len(dbConfigs))
	for _, dbConfig := range dbConfigs {
		configs = append(configs, &database.TenantConfigInfo{
			TenantID:        dbConfig.TenantID,
			Code:            dbConfig.Code,
			DatabaseType:    string(dbConfig.DatabaseType),
			Host:            dbConfig.Host,
			Port:            dbConfig.Port,
			Database:        dbConfig.Database,
			Username:        dbConfig.Username,
			Password:        dbConfig.PasswordEncrypted, // Will be decrypted by manager
			FilePath:        dbConfig.FilePath,
			SSLMode:         string(dbConfig.SSLMode),
			MaxOpenConns:    dbConfig.MaxOpenConns,
			MaxIdleConns:    dbConfig.MaxIdleConns,
			ConnMaxLifetime: dbConfig.ConnMaxLifetime,
		})
	}

	return configs, nil
}

func (r *tenantDatabaseRepository) Create(ctx context.Context, config *TenantDatabaseConfig) error {
	return r.db.WithContext(ctx).Create(config).Error
}

func (r *tenantDatabaseRepository) GetByTenantID(ctx context.Context, tenantID string) (*TenantDatabaseConfig, error) {
	var c TenantDatabaseConfig
	err := r.db.WithContext(ctx).First(&c, "tenant_id = ?", tenantID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTenantDBNotFound
		}
		return nil, err
	}
	return &c, nil
}

func (r *tenantDatabaseRepository) GetAll(ctx context.Context) ([]*TenantDatabaseConfig, error) {
	var cs []*TenantDatabaseConfig
	err := r.db.WithContext(ctx).Find(&cs).Error
	return cs, err
}

func (r *tenantDatabaseRepository) Update(ctx context.Context, config *TenantDatabaseConfig) error {
	return r.db.WithContext(ctx).Save(config).Error
}

func (r *tenantDatabaseRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&TenantDatabaseConfig{}, "id = ?", id).Error
}

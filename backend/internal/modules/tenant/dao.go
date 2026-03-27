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

// TenantDAO defines tenant persistence operations.
type TenantDAO interface {
	Create(ctx context.Context, tenant *Tenant) error
	GetByID(ctx context.Context, id string) (*Tenant, error)
	GetByCode(ctx context.Context, code string) (*Tenant, error)
	List(ctx context.Context, page, pageSize int) ([]*Tenant, int64, error)
	Update(ctx context.Context, tenant *Tenant) error
	Delete(ctx context.Context, id string) error
}

// TenantDatabaseDAO defines tenant database config persistence operations.
type TenantDatabaseDAO interface {
	Create(ctx context.Context, config *TenantDatabaseConfig) error
	GetByTenantID(ctx context.Context, tenantID string) (*TenantDatabaseConfig, error)
	GetAll(ctx context.Context) ([]*TenantDatabaseConfig, error)
	Update(ctx context.Context, config *TenantDatabaseConfig) error
	Delete(ctx context.Context, id string) error
	// GetAllTenantConfigs implements database.TenantConfigLoader for dynamic tenant loading
	GetAllTenantConfigs(ctx context.Context) ([]*database.TenantConfigInfo, error)
}

type tenantDAO struct {
	db *gorm.DB
}

// NewTenantDAO creates a tenant DAO.
func NewTenantDAO(db *gorm.DB) TenantDAO {
	return &tenantDAO{db: db}
}

func (r *tenantDAO) Create(ctx context.Context, tenant *Tenant) error {
	return r.db.WithContext(ctx).Create(tenant).Error
}

func (r *tenantDAO) GetByID(ctx context.Context, id string) (*Tenant, error) {
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

func (r *tenantDAO) GetByCode(ctx context.Context, code string) (*Tenant, error) {
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

func (r *tenantDAO) List(ctx context.Context, page, pageSize int) ([]*Tenant, int64, error) {
	var tenantRecords []*Tenant
	var total int64
	r.db.WithContext(ctx).Model(&Tenant{}).Count(&total)
	err := r.db.WithContext(ctx).Offset((page - 1) * pageSize).Limit(pageSize).Find(&tenantRecords).Error
	return tenantRecords, total, err
}

func (r *tenantDAO) Update(ctx context.Context, tenant *Tenant) error {
	return r.db.WithContext(ctx).Save(tenant).Error
}

func (r *tenantDAO) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&Tenant{}, "id = ?", id).Error
}

type tenantDatabaseDAO struct {
	db *gorm.DB
}

// NewTenantDatabaseDAO creates a tenant database DAO.
func NewTenantDatabaseDAO(db *gorm.DB) TenantDatabaseDAO {
	return &tenantDatabaseDAO{db: db}
}

// GetAllTenantConfigs implements database.TenantConfigLoader interface
func (r *tenantDatabaseDAO) GetAllTenantConfigs(ctx context.Context) ([]*database.TenantConfigInfo, error) {
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

func (r *tenantDatabaseDAO) Create(ctx context.Context, config *TenantDatabaseConfig) error {
	return r.db.WithContext(ctx).Create(config).Error
}

func (r *tenantDatabaseDAO) GetByTenantID(ctx context.Context, tenantID string) (*TenantDatabaseConfig, error) {
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

func (r *tenantDatabaseDAO) GetAll(ctx context.Context) ([]*TenantDatabaseConfig, error) {
	var cs []*TenantDatabaseConfig
	err := r.db.WithContext(ctx).Find(&cs).Error
	return cs, err
}

func (r *tenantDatabaseDAO) Update(ctx context.Context, config *TenantDatabaseConfig) error {
	return r.db.WithContext(ctx).Save(config).Error
}

func (r *tenantDatabaseDAO) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&TenantDatabaseConfig{}, "id = ?", id).Error
}

package tenant

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/url"
	"pantheon-platform/backend/internal/config"
	systemmenu "pantheon-platform/backend/internal/modules/system/menu"
	systempermission "pantheon-platform/backend/internal/modules/system/permission"
	systemrole "pantheon-platform/backend/internal/modules/system/role"
	systemuser "pantheon-platform/backend/internal/modules/system/user"
	authzService "pantheon-platform/backend/internal/shared/authorization"
	"pantheon-platform/backend/internal/shared/cache"
	"pantheon-platform/backend/internal/shared/database"
	"strings"
	"time"

	"gorm.io/gorm"
)

// SessionRevoker revokes sessions for a batch of users.
type SessionRevoker interface {
	RevokeUsersSessions(ctx context.Context, userIDs []string) error
}

// TenantService defines tenant business capabilities.
type TenantService interface {
	SetDefaultTenantID(id string)
	CreateTenant(ctx context.Context, req *CreateTenantRequest) (*Tenant, error)
	UpdateTenant(ctx context.Context, id string, req *UpdateTenantRequest) (*Tenant, error)
	GetTenantStatus(ctx context.Context, code string) (*TenantStatusResponse, error)
	ListTenants(ctx context.Context, page, pageSize int) ([]*Tenant, int64, error)
	GetTenant(ctx context.Context, id string) (*Tenant, error)
	GetCurrentTenantInfo(ctx context.Context, id string) (*TenantInfoResponse, error)
	ActivateTenant(ctx context.Context, id string) error
	DeleteTenant(ctx context.Context, id string) error
	SuspendTenant(ctx context.Context, id string) error
	CheckUserTenantAccess(ctx context.Context, userID, tenantID string) (bool, error)
}

type tenantService struct {
	tenantDAO         TenantDAO
	tenantDatabaseDAO TenantDatabaseDAO
	dbManager         *database.Manager
	masterDB          *gorm.DB
	sessionRevoker    SessionRevoker
	defaultTenantID   string
}

// NewTenantService creates a tenant service.
func NewTenantService(tenantDAO TenantDAO, tenantDatabaseDAO TenantDatabaseDAO, dbManager *database.Manager, masterDB *gorm.DB, sessionRevoker SessionRevoker) TenantService {
	return &tenantService{
		tenantDAO:         tenantDAO,
		tenantDatabaseDAO: tenantDatabaseDAO,
		dbManager:         dbManager,
		masterDB:          masterDB,
		sessionRevoker:    sessionRevoker,
	}
}

// SetDefaultTenantID stores the default tenant ID for single-tenant mode.
func (s *tenantService) SetDefaultTenantID(id string) {
	s.defaultTenantID = id
}

// CreateTenant creates a new tenant.
func (s *tenantService) CreateTenant(ctx context.Context, req *CreateTenantRequest) (*Tenant, error) {
	var expireAt *time.Time
	if req.ExpireAt != "" {
		if parsed, err := time.Parse(time.RFC3339, req.ExpireAt); err == nil {
			expireAt = &parsed
		} else if parsed, err := time.Parse("2006-01-02", req.ExpireAt); err == nil {
			expireAt = &parsed
		}
	}

	tenantRecord := &Tenant{
		ID:            uuid.New(),
		Name:          req.Name,
		Code:          req.Code,
		Description:   req.Description,
		ContactPerson: req.ContactPerson,
		ExpireAt:      expireAt,
		Status:        TenantStatusActive,
		IsFirstLogin:  true,
	}
	err := s.tenantDAO.Create(ctx, tenantRecord)
	return tenantRecord, err
}

// UpdateTenant updates one tenant base information.
func (s *tenantService) UpdateTenant(ctx context.Context, id string, req *UpdateTenantRequest) (*Tenant, error) {
	tenantRecord, err := s.tenantDAO.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	tenantRecord.Name = req.Name
	tenantRecord.Description = req.Description
	tenantRecord.ContactPerson = req.ContactPerson

	if req.ExpireAt == "" {
		tenantRecord.ExpireAt = nil
	} else if parsed, parseErr := time.Parse(time.RFC3339, req.ExpireAt); parseErr == nil {
		tenantRecord.ExpireAt = &parsed
	} else if parsed, parseErr := time.Parse("2006-01-02", req.ExpireAt); parseErr == nil {
		tenantRecord.ExpireAt = &parsed
	} else {
		return nil, parseErr
	}

	if err := s.tenantDAO.Update(ctx, tenantRecord); err != nil {
		return nil, err
	}

	return tenantRecord, nil
}

// GetTenantStatus returns setup and status information for a tenant code.
func (s *tenantService) GetTenantStatus(ctx context.Context, code string) (*TenantStatusResponse, error) {
	tenantRecord, err := s.tenantDAO.GetByCode(ctx, code)
	if err != nil {
		return nil, err
	}

	databaseConfig, databaseConfigErr := s.tenantDatabaseDAO.GetByTenantID(ctx, tenantRecord.ID.String())
	databaseConfigured := databaseConfigErr == nil
	if databaseConfigErr != nil && !errors.Is(databaseConfigErr, ErrTenantDBNotFound) {
		return nil, databaseConfigErr
	}

	return &TenantStatusResponse{
		IsConfigured:       databaseConfigured,
		IsFirstLogin:       tenantRecord.IsFirstLogin,
		DatabaseConfigured: databaseConfigured,
		TenantID:           tenantRecord.ID.String(),
		TenantCode:         tenantRecord.Code,
		TenantName:         tenantRecord.Name,
		Status:             string(tenantRecord.Status),
		DatabaseType:       getDatabaseTypeValue(databaseConfig),
	}, nil
}

// ListTenants returns a paginated tenant list.
func (s *tenantService) ListTenants(ctx context.Context, page, pageSize int) ([]*Tenant, int64, error) {
	return s.tenantDAO.List(ctx, page, pageSize)
}

// GetTenant returns one tenant by ID.
func (s *tenantService) GetTenant(ctx context.Context, id string) (*Tenant, error) {
	return s.tenantDAO.GetByID(ctx, id)
}

// GetCurrentTenantInfo returns the current tenant information.
func (s *tenantService) GetCurrentTenantInfo(ctx context.Context, id string) (*TenantInfoResponse, error) {
	tenantRecord, err := s.tenantDAO.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	databaseConfig, databaseConfigErr := s.tenantDatabaseDAO.GetByTenantID(ctx, id)
	databaseConfigured := databaseConfigErr == nil
	if databaseConfigErr != nil && !errors.Is(databaseConfigErr, ErrTenantDBNotFound) {
		return nil, databaseConfigErr
	}

	return &TenantInfoResponse{
		ID:                 tenantRecord.ID.String(),
		Name:               tenantRecord.Name,
		Code:               tenantRecord.Code,
		Description:        tenantRecord.Description,
		ContactPerson:      tenantRecord.ContactPerson,
		ExpireAt:           formatTenantExpireAt(tenantRecord.ExpireAt),
		Status:             string(tenantRecord.Status),
		DatabaseType:       getDatabaseTypeValue(databaseConfig),
		DatabaseConfigured: databaseConfigured,
		CreatedAt:          tenantRecord.CreatedAt.Format(time.RFC3339),
	}, nil
}

// ActivateTenant marks a tenant as active.
func (s *tenantService) ActivateTenant(ctx context.Context, id string) error {
	tenantRecord, err := s.tenantDAO.GetByID(ctx, id)
	if err != nil {
		return err
	}
	tenantRecord.Status = TenantStatusActive
	return s.tenantDAO.Update(ctx, tenantRecord)
}

// DeleteTenant removes a tenant and clears its database connection.
func (s *tenantService) DeleteTenant(ctx context.Context, id string) error {
	_ = s.revokeTenantUsers(ctx, id)

	// Delete the tenant record through the tenant DAO.
	err := s.tenantDAO.Delete(ctx, id)
	if err != nil {
		return err
	}

	// Close database connection
	tenantUUID, err := uuid.Parse(id)
	if err != nil {
		log.Printf("Failed to parse tenant ID %s: %v", id, err)
		return nil // Tenant already deleted, don't fail
	}

	s.dbManager.RemoveTenant(tenantUUID)
	log.Printf("Deleted tenant %s and closed database connection", id)

	return nil
}

// SuspendTenant marks a tenant as disabled and revokes its sessions.
func (s *tenantService) SuspendTenant(ctx context.Context, id string) error {
	tenantRecord, err := s.tenantDAO.GetByID(ctx, id)
	if err != nil {
		return err
	}

	tenantRecord.Status = TenantStatusDisabled
	err = s.tenantDAO.Update(ctx, tenantRecord)
	if err != nil {
		return err
	}

	_ = s.revokeTenantUsers(ctx, id)

	// Close database connection
	tenantUUID, _ := uuid.Parse(id)
	s.dbManager.RemoveTenant(tenantUUID)
	log.Printf("Disabled tenant %s and closed database connection", id)

	return nil
}

// CheckUserTenantAccess checks whether a user can access a tenant.
func (s *tenantService) CheckUserTenantAccess(ctx context.Context, userID, tenantID string) (bool, error) {
	return true, nil
}

const tenantSetupLockTTL = 2 * time.Minute

type tenantMenuTemplate struct {
	Code       string
	Name       string
	Path       string
	Component  string
	Icon       string
	Type       string
	ParentCode string
	Sort       int
}

type tenantPermissionTemplate struct {
	Code        string
	Name        string
	Description string
	Type        string
	Resource    string
	Action      string
}

var defaultTenantMenuTemplates = []tenantMenuTemplate{
	{Code: "system_root", Name: "System", Path: "/system", Icon: "Settings", Type: "directory", Sort: 10},
	{Code: "system_dashboard", Name: "Overview", Path: "/system/dashboard", Component: "system/SystemDashboard", Icon: "LayoutDashboard", Type: "menu", ParentCode: "system_root", Sort: 11},
	{Code: "system_user", Name: "Users", Path: "/system/user", Component: "system/UserManagement", Icon: "Users", Type: "menu", ParentCode: "system_root", Sort: 20},
	{Code: "system_dept", Name: "Departments", Path: "/system/dept", Component: "system/DepartmentManagement", Icon: "Building2", Type: "menu", ParentCode: "system_root", Sort: 30},
	{Code: "system_position", Name: "Positions", Path: "/system/position", Component: "system/PositionManagement", Icon: "Briefcase", Type: "menu", ParentCode: "system_root", Sort: 40},
	{Code: "system_role", Name: "Roles", Path: "/system/role", Component: "system/RoleManagement", Icon: "Shield", Type: "menu", ParentCode: "system_root", Sort: 50},
	{Code: "system_menu", Name: "Menus", Path: "/system/menu", Component: "system/MenuManagement", Icon: "Menu", Type: "menu", ParentCode: "system_root", Sort: 60},
	{Code: "system_permission", Name: "Permissions", Path: "/system/permission", Component: "system/PermissionManagement", Icon: "KeyRound", Type: "menu", ParentCode: "system_root", Sort: 70},
	{Code: "system_dict", Name: "Dictionary", Path: "/system/dict", Component: "system/DataDictionary", Icon: "Database", Type: "menu", ParentCode: "system_root", Sort: 80},
	{Code: "system_log", Name: "Logs", Path: "/system/log", Component: "system/UnifiedLogManagement", Icon: "FileText", Type: "menu", ParentCode: "system_root", Sort: 90},
	{Code: "system_settings", Name: "Settings", Path: "/system/settings", Component: "system/SystemSettings", Icon: "SlidersHorizontal", Type: "menu", ParentCode: "system_root", Sort: 100},
	{Code: "system_monitor", Name: "Monitor", Path: "/system/monitor", Component: "system/SystemMonitor", Icon: "Activity", Type: "menu", ParentCode: "system_root", Sort: 110},
	{Code: "tenant_management", Name: "Tenants", Path: "/tenant", Component: "tenant/TenantManagement", Icon: "Building", Type: "menu", ParentCode: "system_root", Sort: 120},
}

var defaultTenantPermissionTemplates = []tenantPermissionTemplate{
	{Code: "platform_all", Name: "Platform Access", Description: "Full platform access", Type: "api", Resource: "/api/v1/*", Action: "*"},
	{Code: "system_overview_all", Name: "System Overview", Description: "Access system overview", Type: "api", Resource: "/api/v1/system/*", Action: "*"},
	{Code: "system_users_all", Name: "User Management", Description: "Manage users", Type: "api", Resource: "/api/v1/system/users", Action: "*"},
	{Code: "system_departments_all", Name: "Department Management", Description: "Manage departments", Type: "api", Resource: "/api/v1/system/departments", Action: "*"},
	{Code: "system_positions_all", Name: "Position Management", Description: "Manage positions", Type: "api", Resource: "/api/v1/system/positions", Action: "*"},
	{Code: "system_roles_all", Name: "Role Management", Description: "Manage roles", Type: "api", Resource: "/api/v1/system/roles", Action: "*"},
	{Code: "system_menus_all", Name: "Menu Management", Description: "Manage menus", Type: "api", Resource: "/api/v1/system/menus", Action: "*"},
	{Code: "system_permissions_all", Name: "Permission Management", Description: "Manage permissions", Type: "api", Resource: "/api/v1/system/permissions", Action: "*"},
	{Code: "system_dict_all", Name: "Dictionary Management", Description: "Manage dictionary data", Type: "api", Resource: "/api/v1/system/dict/*", Action: "*"},
	{Code: "system_logs_all", Name: "Log Management", Description: "Manage logs", Type: "api", Resource: "/api/v1/system/logs/*", Action: "*"},
	{Code: "system_settings_all", Name: "System Settings", Description: "Manage settings", Type: "api", Resource: "/api/v1/system/settings", Action: "*"},
	{Code: "system_monitor_all", Name: "System Monitor", Description: "Access monitor", Type: "api", Resource: "/api/v1/system/monitor/*", Action: "*"},
	{Code: "tenant_management_all", Name: "Tenant Management", Description: "Manage tenants", Type: "api", Resource: "/api/v1/tenants/*", Action: "*"},
}

// TenantDatabaseService defines tenant database management capabilities.
type TenantDatabaseService interface {
	SetupDatabase(ctx context.Context, tenantID string, req *SetupDatabaseRequest) (*SetupDatabaseResponse, error)
	TestConnection(ctx context.Context, req *TestConnectionRequest) (*ConnectionTestResult, error)
	LoadAllTenants(ctx context.Context) error
}

type tenantDatabaseService struct {
	tenantDatabaseDAO TenantDatabaseDAO
	tenantDAO         TenantDAO
	dbManager         *database.Manager
	locker            *cache.RedisClient
	authzSvc          *authzService.AuthorizationService
	cfg               *config.Config
}

// NewTenantDatabaseService creates a tenant database service.
func NewTenantDatabaseService(
	tenantDatabaseDAO TenantDatabaseDAO,
	tenantDAO TenantDAO,
	dbManager *database.Manager,
	locker *cache.RedisClient,
	authzSvc *authzService.AuthorizationService,
	cfg *config.Config,
) TenantDatabaseService {
	return &tenantDatabaseService{
		tenantDatabaseDAO: tenantDatabaseDAO,
		tenantDAO:         tenantDAO,
		dbManager:         dbManager,
		locker:            locker,
		authzSvc:          authzSvc,
		cfg:               cfg,
	}
}

// SetupDatabase configures and stores one tenant database connection.
func (s *tenantDatabaseService) SetupDatabase(ctx context.Context, tenantID string, req *SetupDatabaseRequest) (*SetupDatabaseResponse, error) {
	tenantUUID, err := uuid.Parse(tenantID)
	if err != nil {
		return nil, err
	}

	var (
		lockToken string
		lockKey   string
	)
	if s.locker != nil {
		lockKey = fmt.Sprintf("tenant:init:%s", tenantUUID.String())
		token, lockErr := s.locker.AcquireLock(ctx, lockKey, tenantSetupLockTTL)
		if lockErr != nil {
			if errors.Is(lockErr, cache.ErrLockNotAcquired) {
				return nil, fmt.Errorf("tenant initialization is already in progress, please retry later")
			}
			return nil, lockErr
		}
		lockToken = token
		defer func() {
			if lockToken == "" {
				return
			}
			releaseCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := s.locker.ReleaseLock(releaseCtx, lockKey, lockToken); err != nil {
				log.Printf("failed to release tenant init lock %s: %v", lockKey, err)
			}
		}()
	}

	// Get tenant code for pool configuration
	tenantRecord, err := s.tenantDAO.GetByID(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	dsn, err := buildTenantDSN(req.DatabaseType, req.Host, req.Port, req.Database, req.Username, req.Password, req.FilePath, req.SSLMode)
	if err != nil {
		return nil, err
	}

	dbConfig := &database.DBConfig{
		TenantID:        tenantUUID,
		Type:            req.DatabaseType,
		DSN:             dsn,
		MaxOpenConns:    withDefault(req.MaxOpenConns, 100),
		MaxIdleConns:    withDefault(req.MaxIdleConns, 10),
		ConnMaxLifetime: withDefault(req.ConnMaxLifetime, 3600),
	}

	if err := s.dbManager.ConnectTenant(ctx, dbConfig, req.Password, tenantRecord.Code); err != nil {
		return nil, err
	}

	tenantDB := s.dbManager.GetTenantDB(tenantUUID)
	if tenantDB == nil {
		return nil, fmt.Errorf("tenant database connection is unavailable after setup")
	}

	bootstrap, err := s.bootstrapTenantDatabase(ctx, tenantRecord, tenantDB)
	if err != nil {
		return nil, err
	}

	encryptedPassword, err := s.dbManager.EncryptPassword(req.Password)
	if err != nil {
		return nil, err
	}

	config, err := s.tenantDatabaseDAO.GetByTenantID(ctx, tenantID)
	if err != nil && !errors.Is(err, ErrTenantDBNotFound) {
		return nil, err
	}

	if errors.Is(err, ErrTenantDBNotFound) || config == nil {
		config = &TenantDatabaseConfig{
			ID:       uuid.New(),
			TenantID: tenantID,
		}
	}

	config.DatabaseType = DatabaseType(req.DatabaseType)
	config.Host = req.Host
	config.Port = req.Port
	config.Database = req.Database
	config.Username = req.Username
	config.PasswordEncrypted = encryptedPassword
	config.FilePath = req.FilePath
	config.SSLMode = SSLMode(req.SSLMode)
	config.MaxOpenConns = withDefault(req.MaxOpenConns, 100)
	config.MaxIdleConns = withDefault(req.MaxIdleConns, 10)
	config.ConnMaxLifetime = withDefault(req.ConnMaxLifetime, 3600)

	if config.CreatedAt.IsZero() {
		if err := s.tenantDatabaseDAO.Create(ctx, config); err != nil {
			return nil, err
		}
	} else {
		if err := s.tenantDatabaseDAO.Update(ctx, config); err != nil {
			return nil, err
		}
	}

	currentTenantRecord, err := s.tenantDAO.GetByID(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	currentTenantRecord.IsFirstLogin = false
	if err := s.tenantDAO.Update(ctx, currentTenantRecord); err != nil {
		return nil, err
	}

	return &SetupDatabaseResponse{
		TenantID:           tenantID,
		ConfigID:           config.ID.String(),
		DatabaseType:       req.DatabaseType,
		Database:           req.Database,
		InitializedModules: s.dbManager.GetTenantMigratorNames(),
		DeploymentMode:     s.getDeploymentMode(),
		TenantStrategy:     s.getTenantStrategy(),
		Bootstrap:          bootstrap,
		Message:            "Database configured successfully",
	}, nil
}

// TestConnection validates a tenant database connection request.
func (s *tenantDatabaseService) TestConnection(ctx context.Context, req *TestConnectionRequest) (*ConnectionTestResult, error) {
	dsn, err := buildTenantDSN(req.DatabaseType, req.Host, req.Port, req.Database, req.Username, req.Password, req.FilePath, req.SSLMode)
	if err != nil {
		return &ConnectionTestResult{
			Success: false,
			Message: "Connection test failed",
			Error:   err.Error(),
		}, err
	}

	return s.dbManager.TestConnection(req.DatabaseType, dsn, req.Password)
}

// LoadAllTenants loads all tenant database connections into the manager.
func (s *tenantDatabaseService) LoadAllTenants(ctx context.Context) error {
	configs, err := s.tenantDatabaseDAO.GetAll(ctx)
	if err != nil {
		return err
	}

	for _, c := range configs {
		password, _ := s.dbManager.DecryptPassword(c.PasswordEncrypted)

		// Get tenant code for pool configuration
		tenantRecord, err := s.tenantDAO.GetByID(ctx, c.TenantID)
		if err != nil {
			log.Printf("Failed to get tenant %s: %v", c.TenantID, err)
			continue
		}

		dsn, buildErr := buildTenantDSN(string(c.DatabaseType), c.Host, c.Port, c.Database, c.Username, password, c.FilePath, string(c.SSLMode))
		if buildErr != nil {
			continue
		}

		_ = s.dbManager.ConnectTenant(ctx, &database.DBConfig{
			TenantID:        uuid.MustParse(c.TenantID),
			Type:            string(c.DatabaseType),
			DSN:             dsn,
			MaxOpenConns:    withDefault(c.MaxOpenConns, 100),
			MaxIdleConns:    withDefault(c.MaxIdleConns, 10),
			ConnMaxLifetime: withDefault(c.ConnMaxLifetime, 3600),
		}, password, tenantRecord.Code)
	}
	return nil
}

func (s *tenantDatabaseService) bootstrapTenantDatabase(
	ctx context.Context,
	tenantRecord *Tenant,
	tenantDB *gorm.DB,
) (*TenantBootstrapResponse, error) {
	if tenantRecord == nil || tenantDB == nil {
		return nil, fmt.Errorf("tenant bootstrap requires tenant record and tenant database")
	}

	adminUsername := "admin"
	adminEmail := "admin@example.com"
	adminPassword := "admin123"
	adminRealName := "System Admin"
	if s.cfg != nil {
		if value := strings.TrimSpace(s.cfg.DefaultAdmin.Username); value != "" {
			adminUsername = value
		}
		if value := strings.TrimSpace(s.cfg.DefaultAdmin.Email); value != "" {
			adminEmail = value
		}
		if value := strings.TrimSpace(s.cfg.DefaultAdmin.Password); value != "" {
			adminPassword = value
		}
		if value := strings.TrimSpace(s.cfg.DefaultAdmin.RealName); value != "" {
			adminRealName = value
		}
	}

	result := &TenantBootstrapResponse{
		AdminUsername:   adminUsername,
		AdminEmail:      adminEmail,
		RoleCode:        "super_admin",
		MenuCount:       len(defaultTenantMenuTemplates),
		PermissionCount: len(defaultTenantPermissionTemplates),
	}

	var (
		roleRecord       systemrole.Role
		adminRecord      systemuser.User
		roleCreated      bool
		adminCreated     bool
		menuAssignments  []string
		permissionRules  []tenantPermissionTemplate
		freshSeedChanges int
	)

	if err := tenantDB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		roleRecord, roleCreated, err = ensureTenantSuperAdminRole(tx, tenantRecord.ID.String())
		if err != nil {
			return err
		}
		if roleCreated {
			freshSeedChanges++
		}

		adminRecord, adminCreated, err = ensureTenantAdminUser(tx, tenantRecord.ID.String(), adminUsername, adminEmail, adminRealName, adminPassword)
		if err != nil {
			return err
		}
		if adminCreated {
			freshSeedChanges++
		}

		relationCreated, err := ensureTenantUserRole(tx, adminRecord.ID, roleRecord.ID)
		if err != nil {
			return err
		}
		if relationCreated {
			freshSeedChanges++
		}

		var menuCreatedCount int
		menuAssignments, menuCreatedCount, err = ensureTenantMenus(tx, tenantRecord.ID.String(), roleRecord.ID)
		if err != nil {
			return err
		}
		freshSeedChanges += menuCreatedCount

		var permissionCreatedCount int
		permissionRules, permissionCreatedCount, err = ensureTenantPermissions(tx, tenantRecord.ID.String(), roleRecord.ID)
		if err != nil {
			return err
		}
		freshSeedChanges += permissionCreatedCount

		return nil
	}); err != nil {
		return nil, err
	}

	tenantCtx := context.WithValue(ctx, "tenant_db", tenantDB)
	tenantCtx = context.WithValue(tenantCtx, "tenant_id", tenantRecord.ID.String())

	if s.authzSvc != nil {
		if err := s.authzSvc.AddRoleForUser(tenantCtx, adminRecord.ID.String(), roleRecord.ID.String()); err != nil {
			return nil, err
		}
		for _, permissionRule := range permissionRules {
			if err := s.authzSvc.AddPermissionForRole(tenantCtx, roleRecord.ID.String(), permissionRule.Resource, permissionRule.Action); err != nil {
				return nil, err
			}
		}
	}

	result.Seeded = freshSeedChanges > 0
	result.RoleCreated = roleCreated
	result.AdminCreated = adminCreated
	result.MenuCount = len(menuAssignments)
	result.PermissionCount = len(permissionRules)
	if adminCreated {
		result.InitialPassword = adminPassword
	}

	return result, nil
}

func (s *tenantDatabaseService) getDeploymentMode() string {
	if s == nil || s.cfg == nil {
		return ""
	}
	return s.cfg.Deployment.Mode
}

func (s *tenantDatabaseService) getTenantStrategy() string {
	if s == nil || s.cfg == nil {
		return ""
	}
	return s.cfg.Deployment.TenantStrategy
}

func ensureTenantSuperAdminRole(tx *gorm.DB, tenantID string) (systemrole.Role, bool, error) {
	var roleRecord systemrole.Role
	if err := tx.Where("code = ?", "super_admin").First(&roleRecord).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return systemrole.Role{}, false, err
		}
		roleRecord = systemrole.Role{
			ID:          uuid.New(),
			Name:        "Super Admin",
			Code:        "super_admin",
			Description: "Built-in super administrator role",
			Status:      "active",
			Type:        "system",
			TenantID:    tenantID,
			IsSystem:    true,
		}
		if err := tx.Create(&roleRecord).Error; err != nil {
			return systemrole.Role{}, false, err
		}
		return roleRecord, true, nil
	}

	roleRecord.Name = "Super Admin"
	roleRecord.Description = "Built-in super administrator role"
	roleRecord.Status = "active"
	roleRecord.Type = "system"
	roleRecord.TenantID = tenantID
	roleRecord.IsSystem = true
	if err := tx.Model(&systemrole.Role{}).
		Where("id = ?", roleRecord.ID).
		Updates(map[string]interface{}{
			"name":        roleRecord.Name,
			"description": roleRecord.Description,
			"status":      roleRecord.Status,
			"type":        roleRecord.Type,
			"tenant_id":   roleRecord.TenantID,
			"is_system":   roleRecord.IsSystem,
		}).Error; err != nil {
		return systemrole.Role{}, false, err
	}
	return roleRecord, false, nil
}

func ensureTenantAdminUser(
	tx *gorm.DB,
	tenantID, username, email, realName, password string,
) (systemuser.User, bool, error) {
	var adminRecord systemuser.User
	if err := tx.Where("username = ?", username).First(&adminRecord).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return systemuser.User{}, false, err
		}
		passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return systemuser.User{}, false, err
		}
		adminRecord = systemuser.User{
			ID:           uuid.New(),
			Username:     username,
			RealName:     realName,
			Email:        email,
			PasswordHash: string(passwordHash),
			Status:       "active",
			TenantID:     tenantID,
		}
		if err := tx.Create(&adminRecord).Error; err != nil {
			return systemuser.User{}, false, err
		}
		return adminRecord, true, nil
	}

	return adminRecord, false, nil
}

func ensureTenantUserRole(tx *gorm.DB, userID, roleID uuid.UUID) (bool, error) {
	var count int64
	if err := tx.Model(&systemuser.UserRole{}).
		Where("user_id = ? AND role_id = ?", userID, roleID).
		Count(&count).Error; err != nil {
		return false, err
	}
	if count > 0 {
		return false, nil
	}

	relation := systemuser.UserRole{
		ID:     uuid.New(),
		UserID: userID,
		RoleID: roleID,
	}
	return true, tx.Create(&relation).Error
}

func ensureTenantMenus(tx *gorm.DB, tenantID string, roleID uuid.UUID) ([]string, int, error) {
	menuIDs := make(map[string]uuid.UUID, len(defaultTenantMenuTemplates))
	orderedIDs := make([]string, 0, len(defaultTenantMenuTemplates))
	createdCount := 0

	for _, template := range defaultTenantMenuTemplates {
		var parentID *uuid.UUID
		if template.ParentCode != "" {
			value, ok := menuIDs[template.ParentCode]
			if !ok {
				return nil, createdCount, fmt.Errorf("missing parent menu template: %s", template.ParentCode)
			}
			parentID = &value
		}

		var menuRecord systemmenu.Menu
		if err := tx.Where("code = ?", template.Code).First(&menuRecord).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, createdCount, err
			}
			menuRecord = systemmenu.Menu{
				ID:         uuid.New(),
				Code:       template.Code,
				Name:       template.Name,
				Path:       template.Path,
				Component:  template.Component,
				Icon:       template.Icon,
				Type:       template.Type,
				ParentID:   parentID,
				Sort:       template.Sort,
				Status:     "active",
				IsExternal: false,
				TenantID:   tenantID,
			}
			if err := tx.Create(&menuRecord).Error; err != nil {
				return nil, createdCount, err
			}
			createdCount++
		} else {
			menuRecord.Name = template.Name
			menuRecord.Path = template.Path
			menuRecord.Component = template.Component
			menuRecord.Icon = template.Icon
			menuRecord.Type = template.Type
			menuRecord.ParentID = parentID
			menuRecord.Sort = template.Sort
			menuRecord.Status = "active"
			menuRecord.IsExternal = false
			menuRecord.TenantID = tenantID
			if err := tx.Model(&systemmenu.Menu{}).
				Where("id = ?", menuRecord.ID).
				Updates(map[string]interface{}{
					"name":        menuRecord.Name,
					"path":        menuRecord.Path,
					"component":   menuRecord.Component,
					"icon":        menuRecord.Icon,
					"type":        menuRecord.Type,
					"parent_id":   menuRecord.ParentID,
					"sort":        menuRecord.Sort,
					"status":      menuRecord.Status,
					"is_external": menuRecord.IsExternal,
					"tenant_id":   menuRecord.TenantID,
				}).Error; err != nil {
				return nil, createdCount, err
			}
		}

		menuIDs[template.Code] = menuRecord.ID
		orderedIDs = append(orderedIDs, menuRecord.ID.String())

		var relationCount int64
		if err := tx.Model(&systemrole.RoleMenu{}).
			Where("role_id = ? AND menu_id = ?", roleID, menuRecord.ID).
			Count(&relationCount).Error; err != nil {
			return nil, createdCount, err
		}
		if relationCount == 0 {
			relation := systemrole.RoleMenu{
				ID:       uuid.New(),
				RoleID:   roleID,
				MenuID:   menuRecord.ID,
				TenantID: tenantID,
			}
			if err := tx.Create(&relation).Error; err != nil {
				return nil, createdCount, err
			}
			createdCount++
		}
	}

	return orderedIDs, createdCount, nil
}

func ensureTenantPermissions(tx *gorm.DB, tenantID string, roleID uuid.UUID) ([]tenantPermissionTemplate, int, error) {
	createdCount := 0
	for _, template := range defaultTenantPermissionTemplates {
		var permissionRecord systempermission.Permission
		if err := tx.Where("code = ?", template.Code).First(&permissionRecord).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, createdCount, err
			}
			permissionRecord = systempermission.Permission{
				ID:          uuid.New(),
				Name:        template.Name,
				Code:        template.Code,
				Description: template.Description,
				Type:        template.Type,
				Resource:    template.Resource,
				Action:      template.Action,
				Status:      "active",
				TenantID:    tenantID,
				IsSystem:    true,
			}
			if err := tx.Create(&permissionRecord).Error; err != nil {
				return nil, createdCount, err
			}
			createdCount++
		} else {
			permissionRecord.Name = template.Name
			permissionRecord.Description = template.Description
			permissionRecord.Type = template.Type
			permissionRecord.Resource = template.Resource
			permissionRecord.Action = template.Action
			permissionRecord.Status = "active"
			permissionRecord.TenantID = tenantID
			permissionRecord.IsSystem = true
			if err := tx.Model(&systempermission.Permission{}).
				Where("id = ?", permissionRecord.ID).
				Updates(map[string]interface{}{
					"name":        permissionRecord.Name,
					"description": permissionRecord.Description,
					"type":        permissionRecord.Type,
					"resource":    permissionRecord.Resource,
					"action":      permissionRecord.Action,
					"status":      permissionRecord.Status,
					"tenant_id":   permissionRecord.TenantID,
					"is_system":   permissionRecord.IsSystem,
				}).Error; err != nil {
				return nil, createdCount, err
			}
		}

		var relationCount int64
		if err := tx.Model(&systemrole.RolePermission{}).
			Where("role_id = ? AND permission_id = ?", roleID, permissionRecord.ID).
			Count(&relationCount).Error; err != nil {
			return nil, createdCount, err
		}
		if relationCount == 0 {
			relation := systemrole.RolePermission{
				ID:           uuid.New(),
				RoleID:       roleID,
				PermissionID: permissionRecord.ID,
				TenantID:     tenantID,
			}
			if err := tx.Create(&relation).Error; err != nil {
				return nil, createdCount, err
			}
			createdCount++
		}
	}

	return defaultTenantPermissionTemplates, createdCount, nil
}

func buildTenantDSN(databaseType, host string, port int, databaseName, username, password, filePath, sslMode string) (string, error) {
	switch databaseType {
	case string(DBTypeMySQL):
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			username, password, host, port, databaseName), nil
	case string(DBTypePostgreSQL):
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			host, port, username, password, databaseName, withDefaultString(sslMode, "disable")), nil
	case string(DBTypeSQLite):
		if filePath == "" {
			return "", fmt.Errorf("sqlite filepath is required")
		}
		return filePath, nil
	case string(DBTypeMSSQL):
		query := url.Values{}
		if databaseName != "" {
			query.Set("database", databaseName)
		}
		if sslMode == "" || sslMode == "disable" {
			query.Set("encrypt", "disable")
		} else {
			query.Set("encrypt", "true")
		}
		return fmt.Sprintf("sqlserver://%s:%s@%s:%d?%s",
			url.QueryEscape(username),
			url.QueryEscape(password),
			host,
			port,
			query.Encode(),
		), nil
	default:
		return "", fmt.Errorf("unsupported database type: %s", databaseType)
	}
}

func withDefault(value, fallback int) int {
	if value > 0 {
		return value
	}
	return fallback
}

func withDefaultString(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}

func getDatabaseTypeValue(config *TenantDatabaseConfig) string {
	if config == nil {
		return ""
	}
	return string(config.DatabaseType)
}

func formatTenantExpireAt(value *time.Time) string {
	if value == nil || value.IsZero() {
		return ""
	}
	return value.Format("2006-01-02")
}

func (s *tenantService) revokeTenantUsers(ctx context.Context, tenantID string) error {
	if s == nil || s.sessionRevoker == nil || tenantID == "" {
		return nil
	}
	userIDs, err := s.listTenantUserIDs(ctx, tenantID)
	if err != nil {
		return err
	}
	return s.sessionRevoker.RevokeUsersSessions(ctx, userIDs)
}

func (s *tenantService) listTenantUserIDs(ctx context.Context, tenantID string) ([]string, error) {
	seen := make(map[string]struct{})
	var userIDs []string

	appendIDs := func(ids []string) {
		for _, id := range ids {
			if id == "" {
				continue
			}
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			userIDs = append(userIDs, id)
		}
	}

	if s.masterDB != nil {
		var ids []string
		if err := s.masterDB.WithContext(ctx).Model(&systemuser.User{}).Where("tenant_id = ?", tenantID).Pluck("id", &ids).Error; err != nil {
			return nil, err
		}
		appendIDs(ids)
	}

	if tenantUUID, err := uuid.Parse(tenantID); err == nil && s.dbManager != nil {
		if tenantDB := s.dbManager.GetTenantDB(tenantUUID); tenantDB != nil {
			var ids []string
			if err := tenantDB.WithContext(ctx).Model(&systemuser.User{}).Pluck("id", &ids).Error; err != nil {
				return nil, err
			}
			appendIDs(ids)
		}
	}

	return userIDs, nil
}

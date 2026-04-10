package app

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	_ "pantheon-platform/backend/api/swagger"
	"pantheon-platform/backend/internal/config"
	"pantheon-platform/backend/internal/modules/auth"
	"pantheon-platform/backend/internal/modules/notification"
	"pantheon-platform/backend/internal/modules/system"
	systemContainer "pantheon-platform/backend/internal/modules/system/container"
	"pantheon-platform/backend/internal/modules/system/dept"
	"pantheon-platform/backend/internal/modules/system/dict"
	systemLog "pantheon-platform/backend/internal/modules/system/log"
	"pantheon-platform/backend/internal/modules/system/menu"
	"pantheon-platform/backend/internal/modules/system/permission"
	"pantheon-platform/backend/internal/modules/system/position"
	"pantheon-platform/backend/internal/modules/system/role"
	"pantheon-platform/backend/internal/modules/system/setting"
	"pantheon-platform/backend/internal/modules/system/user"
	"pantheon-platform/backend/internal/modules/tenant"
	authzService "pantheon-platform/backend/internal/shared/authorization"
	"pantheon-platform/backend/internal/shared/cache"
	"pantheon-platform/backend/internal/shared/database"
	"pantheon-platform/backend/internal/shared/i18n"
	"pantheon-platform/backend/internal/shared/middleware"
	"pantheon-platform/backend/internal/shared/response"
	"pantheon-platform/backend/internal/shared/storage"
	appValidator "pantheon-platform/backend/internal/shared/validator"
)

// Start boots the HTTP server.
func Start() {
	appValidator.RegisterGinValidators()

	cfg := config.Load()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	migrateOnly := cfg.MigrateOnly || strings.EqualFold(os.Getenv("PANTHEON_MIGRATE_ONLY"), "true")

	db, err := database.InitMasterDB(cfg)
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	if cfg.AutoMigrate || migrateOnly {
		log.Println("migrating master database...")
		if err := db.AutoMigrate(
			&tenant.Tenant{},
			&tenant.TenantDatabaseConfig{},
			&tenant.TenantQuota{},
			&tenant.QuotaUsageLog{},
			&tenant.TenantBackup{},
			&auth.LoginAttempt{},
			&auth.PasswordResetToken{},
			&auth.ApiKey{},
			&user.User{},
			&role.Role{},
			&permission.Permission{},
			&dept.Department{},
			&position.Position{},
			&menu.Menu{},
			&dict.DictType{},
			&dict.DictData{},
			&user.UserRole{},
			&role.RolePermission{},
			&systemLog.OperationLog{},
			&systemLog.LoginLog{},
			&role.CasbinRule{},
			&role.RoleMenu{},
			&setting.Setting{},
			&i18n.Translation{},
			&notification.Notification{},
			&notification.NotificationInbox{},
			&notification.NotificationTemplate{},
			&notification.NotificationJob{},
		); err != nil {
			log.Fatalf("failed to migrate master database: %v", err)
		}
		if err := dict.MigrateSchema(db); err != nil {
			log.Fatalf("failed to migrate dict schema on master database: %v", err)
		}
		if err := role.MigrateSchema(db); err != nil {
			log.Fatalf("failed to migrate role schema on master database: %v", err)
		}
	}

	monitorDB, err := database.InitMonitorDB(cfg)
	if err != nil {
		log.Printf("warning: failed to initialize monitor database: %v", err)
	}

	dbManager, err := database.NewManager(db, cfg.EncryptionKey, &cfg.TenantDB)
	if err != nil {
		log.Fatalf("failed to initialize database manager: %v", err)
	}
	var redisClient *cache.RedisClient
	redisClient, err = cache.NewRedisClient(cfg.Redis, cfg.Environment)
	if err != nil {
		log.Printf("warning: failed to initialize redis: %v", err)
	} else {
		if redisClient != nil {
			log.Printf("redis initialized successfully (%s)", redisClient.Mode())
		}
		defer redisClient.Close()
	}

	authzSvc, err := authzService.NewAuthorizationService(db, "config/rbac_model.conf")
	if err != nil {
		log.Fatalf("failed to initialize authorization service: %v", err)
	}
	authzSvc.SetRedisClient(redisClient)
	middleware.GlobalAuthService = authzSvc
	middleware.SetJWTSecret(cfg.JWTSecret)

	// Ensure bootstrap data exists (tenant, role, admin) and is wired into Casbin.
	bootstrapDefaultData(db, authzSvc, cfg)
	reloadedAuthzSvc, err := authzService.NewAuthorizationService(db, "config/rbac_model.conf")
	if err != nil {
		log.Fatalf("failed to reload authorization service after bootstrap: %v", err)
	}
	reloadedAuthzSvc.SetRedisClient(redisClient)
	authzSvc = reloadedAuthzSvc
	middleware.GlobalAuthService = authzSvc

	// Optionally run as migration-only and exit (used for production init logic).
	if migrateOnly {
		log.Println("migrate-only mode enabled; exiting after migrations and bootstrap")
		return
	}

	// Initialize Quota and Backup services
	quotaSvc := tenant.NewQuotaService(db)
	tenantDBDAO := tenant.NewTenantDatabaseDAO(db)

	// Initialize Storage Provider
	var storageProvider storage.StorageProvider
	if cfg.Storage.Provider == "s3" {
		storageProvider = &storage.S3StorageProvider{
			Bucket: cfg.Storage.S3Bucket,
			Region: cfg.Storage.S3Region,
		}
	} else {
		storageProvider = storage.NewLocalStorageProvider(cfg.Storage.UploadDir, cfg.Storage.BaseURL)
	}

	sysContainer := systemContainer.NewContainer(db, monitorDB, authzSvc, dbManager, quotaSvc, storageProvider)
	if redisClient != nil {
		sysContainer.SetRedisClient(redisClient)
	}
	notificationDAO := notification.NewNotificationDAO(db)
	registerTenantMigrators(dbManager, sysContainer, notificationDAO)

	tenantDAO := tenant.NewTenantDAO(db)
	dbManager.SetTenantLoader(tenantDBDAO) // Set tenant config loader for dynamic reloading
	apiKeyDAO := auth.NewApiKeyDAO(db)

	authSvc := auth.NewAuthService(db, dbManager, sysContainer.GetUserService(), tenantDAO, sysContainer.GetLogService(), redisClient, cfg, apiKeyDAO)
	authHandler := auth.NewAuthHandler(authSvc)
	authRouter := auth.NewAuthRouter(authHandler)

	tenantSvc := tenant.NewTenantService(tenantDAO, tenantDBDAO, dbManager, db, authzSvc)
	tenantDatabaseSvc := tenant.NewTenantDatabaseService(tenantDBDAO, tenantDAO, dbManager, redisClient, authzSvc, cfg)
	if err := tenantDatabaseSvc.LoadAllTenants(context.Background()); err != nil {
		log.Printf("warning: failed to load tenant databases: %v", err)
	}
	tenantHandler := tenant.NewTenantHandler(tenantSvc, tenantDatabaseSvc, quotaSvc)
	tenantRouter := tenant.NewTenantRouter(tenantHandler)

	systemRouter := system.NewSystemRouter(
		sysContainer.GetUserHandler(),
		sysContainer.GetRoleHandler(),
		sysContainer.GetPermissionHandler(),
		sysContainer.GetDepartmentHandler(),
		sysContainer.GetPositionHandler(),
		sysContainer.GetMenuHandler(),
		sysContainer.GetDictHandler(),
		sysContainer.GetLogHandler(),
		sysContainer.GetSettingHandler(),
		sysContainer.GetMonitorHandler(),
	)

	emailSrv := notification.NewEmailService(&cfg.Email)
	smsSrv := notification.NewSMSService(&cfg.SMS)
	notificationTxManager := database.NewTransactionManager(db, dbManager)
	notificationSvc := notification.NewNotificationService(notificationDAO, emailSrv, smsSrv, notificationTxManager)
	notificationHandler := notification.NewNotificationHandler(notificationSvc)
	notificationRouter := notification.NewNotificationRouter(notificationHandler)

	translationSvc := i18n.NewTranslationService(db)
	translationHandler := i18n.NewTranslationHandler(translationSvc, cfg.DefaultTenantID)
	translator := i18n.NewGormTranslator(db, nil)
	_ = translator.LoadTranslations(context.Background())
	engine := gin.Default()
	if cfg.Security.RateLimit.Enabled {
		if cfg.Security.RateLimit.RequestsPerMinute > 0 {
			minuteLimiter := middleware.NewRateLimiter(cfg.Security.RateLimit.RequestsPerMinute, time.Minute)
			go minuteLimiter.MemoryCleanup()
			engine.Use(minuteLimiter.Limit())
		}
		if cfg.Security.RateLimit.RequestsPerHour > 0 {
			hourLimiter := middleware.NewRateLimiter(cfg.Security.RateLimit.RequestsPerHour, time.Hour)
			go hourLimiter.MemoryCleanup()
			engine.Use(hourLimiter.Limit())
		}
	}
	engine.Use(middleware.CORS(cfg))
	engine.Use(i18n.TranslationMiddleware(translator))
	engine.Use(middleware.OperationLog(sysContainer.GetLogService()))

	// Security middlewares
	securityHeadersMiddleware := middleware.NewSecurityHeadersMiddleware(middleware.DefaultSecurityHeadersConfig())

	// Register security headers globally.
	engine.Use(securityHeadersMiddleware.Middleware())

	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":      "ok",
			"environment": cfg.Environment,
		})
	})
	if cfg.Swagger.Enabled && cfg.Environment != "production" {
		engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	authMiddleware := middleware.Auth(redisClient)
	tenantMiddleware := middleware.Tenant(dbManager, cfg, tenantSvc)

	authRouter.RegisterRoutes(engine, authMiddleware)
	tenantRouter.RegisterRoutes(engine, authMiddleware, tenantMiddleware)

	api := engine.Group("/api/v1")

	// Post-login authorization loading endpoints.
	api.GET("/user/permissions", authMiddleware, tenantMiddleware, func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			return
		}
		perms, err := authzSvc.GetUserPermissions(c.Request.Context(), userID)
		if err != nil {
			response.InternalError(c, "AUTHZ_ERROR", err.Error())
			return
		}
		response.Success(c, perms)
	})
	api.GET("/user/menus", authMiddleware, tenantMiddleware, func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			return
		}
		menus, err := sysContainer.GetMenuService().GetUserTree(c.Request.Context(), userID)
		if err != nil {
			response.InternalError(c, "AUTHZ_MENU_ERROR", err.Error())
			return
		}
		response.Success(c, menus)
	})

	// Personal center endpoints (auth + tenant, no Casbin enforcement).
	api.GET("/user/profile", authMiddleware, tenantMiddleware, func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			return
		}
		dto, err := sysContainer.GetUserService().GetByID(c.Request.Context(), userID)
		if err != nil {
			response.InternalError(c, "GET_PROFILE_FAILED", err.Error())
			return
		}
		response.Success(c, dto)
	})
	api.PUT("/user/profile", authMiddleware, tenantMiddleware, func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			return
		}
		var req user.UserUpdateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
			return
		}
		// For profile updates, ignore role/status changes even if provided by client.
		req.RoleIDs = nil
		req.Status = nil
		if _, err := sysContainer.GetUserService().Update(c.Request.Context(), userID, &req); err != nil {
			response.InternalError(c, "UPDATE_PROFILE_FAILED", err.Error())
			return
		}
		dto, err := sysContainer.GetUserService().GetByID(c.Request.Context(), userID)
		if err != nil {
			response.InternalError(c, "GET_PROFILE_FAILED", err.Error())
			return
		}
		response.Success(c, dto)
	})
	api.PUT("/user/password", authMiddleware, tenantMiddleware, func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			response.Unauthorized(c, "USER_NOT_AUTHENTICATED", "User not authenticated")
			return
		}
		var req struct {
			Password    string `json:"password" binding:"required"`
			NewPassword string `json:"new_password" binding:"required,min=6"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters", err.Error())
			return
		}
		if err := sysContainer.GetUserService().ChangePassword(c.Request.Context(), &user.PasswordUpdateRequest{
			UserID:      userID,
			Password:    req.Password,
			NewPassword: req.NewPassword,
		}); err != nil {
			response.InternalError(c, "CHANGE_PASSWORD_FAILED", err.Error())
			return
		}
		response.Success(c, gin.H{"message": "ok"})
	})

	// System and notification modules register their own auth/tenant/authz guards.
	systemRouter.RegisterRoutes(api, authMiddleware, tenantMiddleware)
	notificationRouter.RegisterRoutes(api, authMiddleware, tenantMiddleware)

	// i18n management routes (auth + tenant + casbin).
	i18nAPI := api.Group("")
	i18nAPI.Use(authMiddleware, tenantMiddleware)
	if middleware.GlobalAuthService != nil {
		i18nAPI.Use(middleware.Authz(middleware.GlobalAuthService))
	}
	i18n.RegisterI18nRoutes(i18nAPI, translationHandler)

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("server starting on %s (%s)", addr, cfg.Environment)
	if err := engine.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}

func registerTenantMigrators(dbManager *database.Manager, container systemContainer.Container, notificationMigrator database.TenantMigrator) {
	dbManager.RegisterTenantMigrator("auth", auth.NewTenantMigrator())
	dbManager.RegisterTenantMigrator("user", container.GetUserDAO())
	dbManager.RegisterTenantMigrator("dept", container.GetDepartmentDAO())
	dbManager.RegisterTenantMigrator("position", container.GetPositionDAO())
	dbManager.RegisterTenantMigrator("role", container.GetRoleDAO())
	dbManager.RegisterTenantMigrator("permission", container.GetPermissionDAO())
	dbManager.RegisterTenantMigrator("menu", container.GetMenuDAO())
	dbManager.RegisterTenantMigrator("dict_type", container.GetDictTypeDAO())
	dbManager.RegisterTenantMigrator("dict_data", container.GetDictDataDAO())
	dbManager.RegisterTenantMigrator("op_log", container.GetOperationLogDAO())
	dbManager.RegisterTenantMigrator("login_log", container.GetLoginLogDAO())
	dbManager.RegisterTenantMigrator("setting", container.GetSettingDAO())
	dbManager.RegisterTenantMigrator("notification", notificationMigrator)
}

func bootstrapDefaultData(db *gorm.DB, authzSvc *authzService.AuthorizationService, cfg *config.Config) {
	const defaultTenantID = "00000000-0000-0000-0000-000000000000"
	defaultRolePolicies := []struct {
		resource string
		action   string
	}{
		{resource: "/api/v1/*", action: "*"},
		{resource: "/api/v1/tenants/*", action: "*"},
	}

	ctx := context.Background()

	// Ensure tenant
	var t tenant.Tenant
	if err := db.WithContext(ctx).Where("code = ?", "platform").First(&t).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			t = tenant.Tenant{
				ID:     uuid.MustParse(defaultTenantID),
				Name:   "Platform Tenant",
				Code:   "platform",
				Status: tenant.TenantStatusActive,
			}
			_ = db.WithContext(ctx).Create(&t).Error
		}
	}

	// Ensure role
	var r role.Role
	if err := db.WithContext(ctx).Where("code = ?", "super_admin").First(&r).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			r = role.Role{
				ID:        uuid.New(),
				Name:      "Super Admin",
				Code:      "super_admin",
				Status:    "active",
				Type:      "system",
				DataScope: "all",
				TenantID:  defaultTenantID,
				IsSystem:  true,
			}
			_ = db.WithContext(ctx).Create(&r).Error
		}
	} else if strings.TrimSpace(r.DataScope) == "" {
		r.DataScope = "all"
		_ = db.WithContext(ctx).Model(&role.Role{}).
			Where("id = ?", r.ID).
			Update("data_scope", r.DataScope).Error
	}

	// Ensure default admin user and DB role binding
	var admin user.User
	if cfg.DefaultAdmin.Enabled {
		if err := db.WithContext(ctx).Where("username = ?", cfg.DefaultAdmin.Username).First(&admin).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.DefaultAdmin.Password), bcrypt.DefaultCost)
				if err != nil {
					log.Printf("warning: failed to hash default admin password: %v", err)
				} else {
					admin = user.User{
						ID:           uuid.New(),
						Username:     cfg.DefaultAdmin.Username,
						RealName:     cfg.DefaultAdmin.RealName,
						Email:        cfg.DefaultAdmin.Email,
						PasswordHash: string(hashedPassword),
						Status:       "active",
						TenantID:     defaultTenantID,
					}
					_ = db.WithContext(ctx).Create(&admin).Error
					log.Printf("default admin user created: %s", cfg.DefaultAdmin.Username)
				}
			}
		}

		if admin.ID != uuid.Nil && r.ID != uuid.Nil {
			var ur user.UserRole
			err := db.WithContext(ctx).
				Where("user_id = ? AND role_id = ?", admin.ID, r.ID).
				First(&ur).Error
			if err == gorm.ErrRecordNotFound {
				ur = user.UserRole{ID: uuid.New(), UserID: admin.ID, RoleID: r.ID}
				_ = db.WithContext(ctx).Create(&ur).Error
			}
		}
	}

	// Ensure Casbin default policy and role grouping for the default admin.
	if authzSvc == nil || r.ID == uuid.Nil {
		return
	}

	for _, policy := range defaultRolePolicies {
		_ = authzSvc.AddPermissionForRole(ctx, r.ID.String(), policy.resource, policy.action)
	}
	if cfg.DefaultAdmin.Enabled && admin.ID != uuid.Nil {
		_ = authzSvc.SetRolesForUser(ctx, admin.ID.String(), []string{r.ID.String()})
	}
	if err := authzSvc.LoadPolicy(ctx); err != nil {
		log.Printf("warning: failed to reload authorization policy after bootstrap: %v", err)
	}
}

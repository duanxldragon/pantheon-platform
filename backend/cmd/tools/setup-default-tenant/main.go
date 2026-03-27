package main

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	toolenv "pantheon-platform/backend/cmd/tools/internal/tool_env"
	"pantheon-platform/backend/internal/modules/tenant"
)

func main() {
	db, err := gorm.Open(mysql.Open(toolenv.MasterDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to master DB: %v", err)
	}

	var currentTenant tenant.Tenant
	err = db.Where("code = ?", "PLATFORM").First(&currentTenant).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			currentTenant = tenant.Tenant{ID: uuid.New(), Name: "Platform Admin Tenant", Code: "PLATFORM", Status: tenant.TenantStatusActive}
			db.Create(&currentTenant)
			fmt.Printf("✅ Created default tenant: %s (%s)\n", currentTenant.Name, currentTenant.ID)
		} else {
			log.Fatalf("❌ Error querying tenant: %v", err)
		}
	} else {
		fmt.Printf("ℹ️ Default tenant already exists: %s\n", currentTenant.ID)
	}

	var dbConfig tenant.TenantDatabaseConfig
	err = db.Where("tenant_id = ?", currentTenant.ID.String()).First(&dbConfig).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			dbConfig = tenant.TenantDatabaseConfig{
				ID:                uuid.New(),
				TenantID:          currentTenant.ID.String(),
				DatabaseType:      tenant.DBTypeMySQL,
				Host:              toolenv.MasterDBHost(),
				Port:              toolenv.MasterDBPort(),
				Database:          toolenv.MasterDBName(),
				Username:          toolenv.MasterDBUser(),
				PasswordEncrypted: toolenv.MasterDBPassword(),
			}
			db.Create(&dbConfig)
			fmt.Println("✅ Configured database for default tenant")
		}
	} else {
		fmt.Println("ℹ️ Database config already exists for default tenant")
	}

	res := db.Exec("UPDATE system_users SET tenant_id = ? WHERE username = 'admin'", currentTenant.ID.String())
	if res.Error != nil {
		fmt.Printf("⚠️ Failed to update admin user: %v\n", res.Error)
	} else {
		fmt.Println("✅ Updated admin user to default tenant")
	}

	fmt.Println("\n✨ Setup complete. Please restart the backend server.")
}

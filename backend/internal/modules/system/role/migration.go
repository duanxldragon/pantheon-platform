package role

import "gorm.io/gorm"

const roleMigrationVersion = "v2"

func MigrateSchema(db *gorm.DB) error {
	if db == nil {
		return nil
	}

	migrator := db.Migrator()
	legacyIndexes := []string{
		"idx_system_roles_name",
		"idx_system_roles_code",
	}

	for _, indexName := range legacyIndexes {
		if migrator.HasIndex(&Role{}, indexName) {
			if err := migrator.DropIndex(&Role{}, indexName); err != nil {
				return err
			}
		}
	}

	if !migrator.HasIndex(&Role{}, "uniq_role_tenant_name") {
		if err := migrator.CreateIndex(&Role{}, "uniq_role_tenant_name"); err != nil {
			return err
		}
	}
	if !migrator.HasIndex(&Role{}, "uniq_role_tenant_code") {
		if err := migrator.CreateIndex(&Role{}, "uniq_role_tenant_code"); err != nil {
			return err
		}
	}

	return nil
}

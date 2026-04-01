package dict

import "gorm.io/gorm"

const dictTypeMigrationVersion = "v2"

// MigrateSchema applies custom schema fixes that AutoMigrate does not handle for dictionary tables.
func MigrateSchema(db *gorm.DB) error {
	if db == nil {
		return nil
	}

	migrator := db.Migrator()
	legacyIndexes := []string{
		"idx_system_dict_types_name",
		"idx_system_dict_types_code",
	}

	for _, indexName := range legacyIndexes {
		if migrator.HasIndex(&DictType{}, indexName) {
			if err := migrator.DropIndex(&DictType{}, indexName); err != nil {
				return err
			}
		}
	}

	if !migrator.HasIndex(&DictType{}, "uniq_dict_type_tenant_name") {
		if err := migrator.CreateIndex(&DictType{}, "uniq_dict_type_tenant_name"); err != nil {
			return err
		}
	}
	if !migrator.HasIndex(&DictType{}, "uniq_dict_type_tenant_code") {
		if err := migrator.CreateIndex(&DictType{}, "uniq_dict_type_tenant_code"); err != nil {
			return err
		}
	}

	return nil
}

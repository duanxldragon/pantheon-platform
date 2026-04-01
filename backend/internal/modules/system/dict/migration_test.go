package dict

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

func TestMigrateSchemaDropsLegacyGlobalUniqueIndexes(t *testing.T) {
	db := newDictTestDB(t)

	if err := db.Exec("CREATE UNIQUE INDEX idx_system_dict_types_name ON system_dict_types(name)").Error; err != nil {
		t.Fatalf("create legacy name index: %v", err)
	}
	if err := db.Exec("CREATE UNIQUE INDEX idx_system_dict_types_code ON system_dict_types(code)").Error; err != nil {
		t.Fatalf("create legacy code index: %v", err)
	}

	first := DictType{
		ID:       uuid.New(),
		Name:     "Status",
		Code:     "status",
		Status:   "active",
		TenantID: "tenant-a",
	}
	if err := db.Create(&first).Error; err != nil {
		t.Fatalf("create first dict type: %v", err)
	}

	second := DictType{
		ID:       uuid.New(),
		Name:     "Status",
		Code:     "status",
		Status:   "active",
		TenantID: "tenant-b",
	}
	if err := db.Create(&second).Error; err == nil {
		t.Fatal("expected legacy global unique index to block duplicate name/code across tenants")
	}

	if err := MigrateSchema(db); err != nil {
		t.Fatalf("migrate schema: %v", err)
	}

	second.ID = uuid.New()
	if err := db.Create(&second).Error; err != nil {
		t.Fatalf("expected duplicate name/code in different tenant after migration, got %v", err)
	}
}

func TestCreateTypeAllowsSameNameAndCodeAcrossTenants(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	ctxA := withTenantID("tenant-a")
	ctxB := withTenantID("tenant-b")

	first, err := service.CreateType(ctxA, &DictTypeRequest{
		Name:   "Status",
		Code:   "status",
		Status: "active",
	})
	if err != nil {
		t.Fatalf("create tenant-a dict type: %v", err)
	}

	second, err := service.CreateType(ctxB, &DictTypeRequest{
		Name:   "Status",
		Code:   "status",
		Status: "active",
	})
	if err != nil {
		t.Fatalf("create tenant-b dict type: %v", err)
	}

	if first.TenantID == second.TenantID {
		t.Fatalf("expected different tenant ownership, got %s and %s", first.TenantID, second.TenantID)
	}
}

func withTenantID(tenantID string) context.Context {
	return context.WithValue(context.Background(), "tenant_id", tenantID)
}

func TestMigrateSchemaKeepsCompositeIndexesPresent(t *testing.T) {
	db := newDictTestDB(t)
	if err := MigrateSchema(db); err != nil {
		t.Fatalf("migrate schema: %v", err)
	}

	if !db.Migrator().HasIndex(&DictType{}, "uniq_dict_type_tenant_name") {
		t.Fatal("expected tenant name unique index to exist")
	}
	if !db.Migrator().HasIndex(&DictType{}, "uniq_dict_type_tenant_code") {
		t.Fatal("expected tenant code unique index to exist")
	}

	if db.Migrator().HasIndex(&DictType{}, "idx_system_dict_types_name") {
		t.Fatal("expected legacy global name index to be absent")
	}
	if db.Migrator().HasIndex(&DictType{}, "idx_system_dict_types_code") {
		t.Fatal("expected legacy global code index to be absent")
	}
}

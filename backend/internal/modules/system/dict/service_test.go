package dict

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func newDictTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	typeDAO := NewDictTypeDAO(db)
	dataDAO := NewDictDataDAO(db)
	if err := db.AutoMigrate(typeDAO.GetTenantModels()...); err != nil {
		t.Fatalf("migrate dict type models: %v", err)
	}
	if err := db.AutoMigrate(dataDAO.GetTenantModels()...); err != nil {
		t.Fatalf("migrate dict data models: %v", err)
	}
	return db
}

func TestCreateDataRejectsTypeFromOtherTenant(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	dictType := DictType{
		ID:       uuid.New(),
		Name:     "Status",
		Code:     "status_other_tenant",
		Status:   "active",
		TenantID: "tenant-b",
	}
	if err := db.Create(&dictType).Error; err != nil {
		t.Fatalf("create dict type: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.CreateData(ctx, &DictDataRequest{
		TypeID: dictType.ID.String(),
		Label:  "Enabled",
		Value:  "enabled",
		Status: "active",
	})
	if err == nil {
		t.Fatal("expected cross-tenant type rejection")
	}
	if !errors.Is(err, ErrDictTypeNotFound) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestUpdateDataRejectsTypeFromOtherTenant(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	tenantType := DictType{
		ID:       uuid.New(),
		Name:     "Status",
		Code:     "status_tenant_a",
		Status:   "active",
		TenantID: "tenant-a",
	}
	otherType := DictType{
		ID:       uuid.New(),
		Name:     "StatusOther",
		Code:     "status_tenant_b",
		Status:   "active",
		TenantID: "tenant-b",
	}
	if err := db.Create(&tenantType).Error; err != nil {
		t.Fatalf("create tenant type: %v", err)
	}
	if err := db.Create(&otherType).Error; err != nil {
		t.Fatalf("create other type: %v", err)
	}

	record := DictData{
		ID:       uuid.New(),
		TypeID:   tenantType.ID,
		Label:    "Enabled",
		Value:    "enabled",
		Status:   "active",
		TenantID: "tenant-a",
	}
	if err := db.Create(&record).Error; err != nil {
		t.Fatalf("create dict data: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.UpdateData(ctx, record.ID.String(), &DictDataRequest{
		TypeID: otherType.ID.String(),
		Label:  "Disabled",
		Value:  "disabled",
		Status: "inactive",
	})
	if err == nil {
		t.Fatal("expected cross-tenant type rejection")
	}
	if !errors.Is(err, ErrDictTypeNotFound) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGetTypeByIDRejectsOtherTenant(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	dictType := DictType{
		ID:       uuid.New(),
		Name:     "Status",
		Code:     "status_shared_read_type",
		Status:   "active",
		TenantID: "tenant-b",
	}
	if err := db.Create(&dictType).Error; err != nil {
		t.Fatalf("create dict type: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.GetTypeByID(ctx, dictType.ID.String())
	if err == nil {
		t.Fatal("expected cross-tenant type read rejection")
	}
	if !errors.Is(err, ErrDictTypeNotFound) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGetDataByIDRejectsOtherTenant(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	dictType := DictType{
		ID:       uuid.New(),
		Name:     "Status",
		Code:     "status_shared_read_data",
		Status:   "active",
		TenantID: "tenant-b",
	}
	if err := db.Create(&dictType).Error; err != nil {
		t.Fatalf("create dict type: %v", err)
	}

	record := DictData{
		ID:       uuid.New(),
		TypeID:   dictType.ID,
		Label:    "Enabled",
		Value:    "enabled",
		Status:   "active",
		TenantID: "tenant-b",
	}
	if err := db.Create(&record).Error; err != nil {
		t.Fatalf("create dict data: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.GetDataByID(ctx, record.ID.String())
	if err == nil {
		t.Fatal("expected cross-tenant data read rejection")
	}
	if !errors.Is(err, ErrDictDataNotFound) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestListTypesFiltersCurrentTenant(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	records := []DictType{
		{
			ID:       uuid.New(),
			Name:     "StatusA",
			Code:     "status_list_tenant_a",
			Status:   "active",
			TenantID: "tenant-a",
		},
		{
			ID:       uuid.New(),
			Name:     "StatusB",
			Code:     "status_list_tenant_b",
			Status:   "active",
			TenantID: "tenant-b",
		},
	}
	if err := db.Create(&records).Error; err != nil {
		t.Fatalf("create dict types: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	resp, err := service.ListTypes(ctx, 1, 20, "")
	if err != nil {
		t.Fatalf("list types: %v", err)
	}

	items, ok := resp.Items.([]*DictTypeResponse)
	if !ok {
		t.Fatalf("unexpected items type: %T", resp.Items)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 type, got %d", len(items))
	}
	if items[0].Code != "status_list_tenant_a" {
		t.Fatalf("unexpected type code: %s", items[0].Code)
	}
}

func TestListDataRejectsTypeFromOtherTenant(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	dictType := DictType{
		ID:       uuid.New(),
		Name:     "Status",
		Code:     "status_list_other_tenant",
		Status:   "active",
		TenantID: "tenant-b",
	}
	if err := db.Create(&dictType).Error; err != nil {
		t.Fatalf("create dict type: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.ListData(ctx, 1, 20, dictType.ID.String(), "")
	if err == nil {
		t.Fatal("expected cross-tenant type filter rejection")
	}
	if !errors.Is(err, ErrDictTypeNotFound) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestListDataFiltersCurrentTenant(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	types := []DictType{
		{
			ID:       uuid.New(),
			Name:     "StatusA",
			Code:     "status_data_tenant_a",
			Status:   "active",
			TenantID: "tenant-a",
		},
		{
			ID:       uuid.New(),
			Name:     "StatusB",
			Code:     "status_data_tenant_b",
			Status:   "active",
			TenantID: "tenant-b",
		},
	}
	if err := db.Create(&types).Error; err != nil {
		t.Fatalf("create dict types: %v", err)
	}

	records := []DictData{
		{
			ID:       uuid.New(),
			TypeID:   types[0].ID,
			Label:    "EnabledA",
			Value:    "enabled-a",
			Status:   "active",
			TenantID: "tenant-a",
		},
		{
			ID:       uuid.New(),
			TypeID:   types[1].ID,
			Label:    "EnabledB",
			Value:    "enabled-b",
			Status:   "active",
			TenantID: "tenant-b",
		},
	}
	if err := db.Create(&records).Error; err != nil {
		t.Fatalf("create dict data: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	resp, err := service.ListData(ctx, 1, 20, "", "")
	if err != nil {
		t.Fatalf("list data: %v", err)
	}

	items, ok := resp.Items.([]*DictDataResponse)
	if !ok {
		t.Fatalf("unexpected items type: %T", resp.Items)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].Value != "enabled-a" {
		t.Fatalf("unexpected data value: %s", items[0].Value)
	}
}

func TestGetDataByTypeCodeRejectsOtherTenant(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	dictType := DictType{
		ID:       uuid.New(),
		Name:     "Status",
		Code:     "status_by_code_other_tenant",
		Status:   "active",
		TenantID: "tenant-b",
	}
	if err := db.Create(&dictType).Error; err != nil {
		t.Fatalf("create dict type: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.GetDataByTypeCode(ctx, dictType.Code)
	if err == nil {
		t.Fatal("expected cross-tenant type code rejection")
	}
	if !errors.Is(err, ErrDictTypeNotFound) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGetDataByTypeCodeReturnsNotFoundForMissingType(t *testing.T) {
	db := newDictTestDB(t)
	service := &dictService{
		typeDAO: NewDictTypeDAO(db),
		dataDAO: NewDictDataDAO(db),
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	_, err := service.GetDataByTypeCode(ctx, "missing_type_code")
	if err == nil {
		t.Fatal("expected missing type error")
	}
	if !strings.Contains(err.Error(), "not found") {
		t.Fatalf("unexpected error: %v", err)
	}
}

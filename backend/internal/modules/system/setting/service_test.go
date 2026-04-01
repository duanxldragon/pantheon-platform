package setting

import (
	"context"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

type failingSettingDAO struct {
	SettingDAO
	upsertCalls int
	failAt      int
}

func (d *failingSettingDAO) Upsert(ctx context.Context, s *Setting) error {
	d.upsertCalls++
	if d.failAt > 0 && d.upsertCalls == d.failAt {
		return gorm.ErrInvalidTransaction
	}
	return d.SettingDAO.Upsert(ctx, s)
}

func newSettingTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	dao := NewSettingDAO(db)
	if err := db.AutoMigrate(dao.GetTenantModels()...); err != nil {
		t.Fatalf("migrate settings: %v", err)
	}
	return db
}

func TestUpdateBatchRollsBackOnUpsertFailure(t *testing.T) {
	db := newSettingTestDB(t)
	baseDAO := NewSettingDAO(db)
	service := &settingService{
		dao:       &failingSettingDAO{SettingDAO: baseDAO, failAt: 2},
		txManager: database.NewTransactionManager(db, nil),
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.UpdateBatch(ctx, map[string]string{
		"site_name":  "Pantheon",
		"site_title": "Platform",
	}, "tester")
	if err == nil {
		t.Fatal("expected batch update failure")
	}

	var count int64
	if err := db.Model(&Setting{}).Where("tenant_id = ?", "tenant-a").Count(&count).Error; err != nil {
		t.Fatalf("count settings: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected rollback to keep settings empty, got %d", count)
	}
}

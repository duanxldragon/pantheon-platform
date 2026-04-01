package user

import (
	"context"
	"errors"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

func newUserTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	dao := NewUserDAO(db)
	if err := db.AutoMigrate(dao.GetTenantModels()...); err != nil {
		t.Fatalf("migrate user models: %v", err)
	}

	return db
}

func TestBatchDeleteRejectsOutOfScopeUsers(t *testing.T) {
	db := newUserTestDB(t)
	dao := NewUserDAO(db)
	service := &userService{
		userDAO:   dao,
		txManager: database.NewTransactionManager(db, nil),
	}

	tenantUserID := uuid.New()
	otherTenantUserID := uuid.New()

	if err := db.Create(&User{
		ID:           tenantUserID,
		Username:     "tenant-user",
		RealName:     "Tenant User",
		Email:        "tenant-user@example.com",
		PasswordHash: "hash",
		Status:       "active",
		TenantID:     "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create tenant user: %v", err)
	}
	if err := db.Create(&User{
		ID:           otherTenantUserID,
		Username:     "other-user",
		RealName:     "Other User",
		Email:        "other-user@example.com",
		PasswordHash: "hash",
		Status:       "active",
		TenantID:     "tenant-b",
	}).Error; err != nil {
		t.Fatalf("create other tenant user: %v", err)
	}
	if err := db.Create(&UserRole{
		ID:     uuid.New(),
		UserID: tenantUserID,
		RoleID: uuid.New(),
	}).Error; err != nil {
		t.Fatalf("create user role: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchDelete(ctx, []string{tenantUserID.String(), otherTenantUserID.String()})
	if !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("expected ErrUserNotFound, got %v", err)
	}

	var tenantUser User
	if err := db.Where("id = ?", tenantUserID.String()).First(&tenantUser).Error; err != nil {
		t.Fatalf("expected tenant user to remain undeleted: %v", err)
	}
	if tenantUser.DeletedAt.Valid {
		t.Fatal("expected tenant user to remain active after failed batch delete")
	}

	var roleCount int64
	if err := db.Model(&UserRole{}).Where("user_id = ?", tenantUserID.String()).Count(&roleCount).Error; err != nil {
		t.Fatalf("count user roles: %v", err)
	}
	if roleCount != 1 {
		t.Fatalf("expected user roles to remain intact, got %d", roleCount)
	}
}

func TestBatchUpdateStatusRejectsOutOfScopeUsers(t *testing.T) {
	db := newUserTestDB(t)
	dao := NewUserDAO(db)
	service := &userService{
		userDAO:   dao,
		txManager: database.NewTransactionManager(db, nil),
	}

	tenantUserID := uuid.New()
	otherTenantUserID := uuid.New()

	if err := db.Create(&User{
		ID:           tenantUserID,
		Username:     "tenant-user",
		RealName:     "Tenant User",
		Email:        "tenant-status@example.com",
		PasswordHash: "hash",
		Status:       "active",
		TenantID:     "tenant-a",
	}).Error; err != nil {
		t.Fatalf("create tenant user: %v", err)
	}
	if err := db.Create(&User{
		ID:           otherTenantUserID,
		Username:     "other-user",
		RealName:     "Other User",
		Email:        "other-status@example.com",
		PasswordHash: "hash",
		Status:       "active",
		TenantID:     "tenant-b",
	}).Error; err != nil {
		t.Fatalf("create other tenant user: %v", err)
	}

	ctx := context.WithValue(context.Background(), "tenant_id", "tenant-a")
	err := service.BatchUpdateStatus(ctx, &UserStatusRequest{
		UserIDs: []string{tenantUserID.String(), otherTenantUserID.String()},
		Status:  "inactive",
	})
	if !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("expected ErrUserNotFound, got %v", err)
	}

	var tenantUser User
	if err := db.Where("id = ?", tenantUserID.String()).First(&tenantUser).Error; err != nil {
		t.Fatalf("reload tenant user: %v", err)
	}
	if tenantUser.Status != "active" {
		t.Fatalf("expected tenant user status to remain active, got %s", tenantUser.Status)
	}
}

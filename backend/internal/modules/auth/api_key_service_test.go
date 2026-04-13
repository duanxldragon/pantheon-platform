package auth

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/cache"
)

func newAPIKeyTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+uuid.NewString()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&ApiKey{}); err != nil {
		t.Fatalf("migrate api keys: %v", err)
	}

	return db
}

func newAPIKeyTestService(t *testing.T) *authService {
	t.Helper()

	db := newAPIKeyTestDB(t)
	return &authService{
		masterDB:    db,
		apiKeyDAO:   NewApiKeyDAO(db),
		redisClient: cache.NewInMemoryRedisClient(),
	}
}

func TestNormalizeAPIKeyPermissions(t *testing.T) {
	normalized := normalizeAPIKeyPermissions(" read,write,read, admin ,,write ")
	if normalized != "read,write,admin" {
		t.Fatalf("expected normalized permissions, got %q", normalized)
	}
}

func TestCreateApiKeyAssignsDefaultExpiryAndNormalizedPermissions(t *testing.T) {
	service := newAPIKeyTestService(t)
	ctx := context.Background()
	before := time.Now().UTC()

	resp, err := service.CreateApiKey(ctx, "user-1", "CI key", " read,write,read , admin ", []string{" 10.0.0.10 ", "10.0.0.10", "192.168.1.0/24"}, 0, "")
	if err != nil {
		t.Fatalf("create api key: %v", err)
	}

	var stored ApiKey
	if err := service.masterDB.WithContext(ctx).First(&stored, "id = ?", resp.ID).Error; err != nil {
		t.Fatalf("load stored api key: %v", err)
	}

	if stored.Permissions != "read,write,admin" {
		t.Fatalf("expected normalized permissions, got %q", stored.Permissions)
	}
	if stored.AllowedIPs != "10.0.0.10,192.168.1.0/24" {
		t.Fatalf("expected normalized allowed ips, got %q", stored.AllowedIPs)
	}
	if stored.RateLimit != defaultAPIKeyRateLimit {
		t.Fatalf("expected default rate limit %d, got %d", defaultAPIKeyRateLimit, stored.RateLimit)
	}
	if stored.ExpiresAt == nil {
		t.Fatal("expected default expiry to be assigned")
	}

	minExpected := before.Add((90 * 24 * time.Hour) - time.Minute)
	maxExpected := before.Add((90 * 24 * time.Hour) + time.Minute)
	if stored.ExpiresAt.Before(minExpected) || stored.ExpiresAt.After(maxExpected) {
		t.Fatalf("expected expiry near 90 days, got %s", stored.ExpiresAt.UTC().Format(time.RFC3339))
	}

	if resp.ExpiresAt == "" {
		t.Fatal("expected response to expose expiresAt")
	}
	if resp.Permissions != "read,write,admin" {
		t.Fatalf("expected response permissions to be normalized, got %q", resp.Permissions)
	}
	if len(resp.AllowedIPs) != 2 {
		t.Fatalf("expected response allowed ips, got %#v", resp.AllowedIPs)
	}
	if resp.RateLimit != defaultAPIKeyRateLimit {
		t.Fatalf("expected response rate limit %d, got %d", defaultAPIKeyRateLimit, resp.RateLimit)
	}
}

func TestValidateApiKeyRejectsExpiredKey(t *testing.T) {
	service := newAPIKeyTestService(t)
	ctx := context.Background()

	resp, err := service.CreateApiKey(ctx, "user-1", "Expired key", "read", nil, 0, time.Now().Add(-time.Hour).UTC().Format(time.RFC3339))
	if err != nil {
		t.Fatalf("create expired api key: %v", err)
	}

	authResult, err := service.ValidateApiKey(ctx, resp.Key)
	if !errors.Is(err, ErrAPIKeyExpired) {
		t.Fatalf("expected ErrAPIKeyExpired, got authResult=%#v err=%v", authResult, err)
	}
}

func TestValidateApiKeyRejectsClientOutsideAllowlist(t *testing.T) {
	service := newAPIKeyTestService(t)
	ctx := context.WithValue(context.Background(), "client_ip", "10.0.0.20")

	resp, err := service.CreateApiKey(ctx, "user-1", "IP locked key", "read", []string{"10.0.0.10", "192.168.1.0/24"}, 0, "")
	if err != nil {
		t.Fatalf("create api key: %v", err)
	}

	authResult, err := service.ValidateApiKey(ctx, resp.Key)
	if !errors.Is(err, ErrAPIKeyIPNotAllowed) {
		t.Fatalf("expected ErrAPIKeyIPNotAllowed, got authResult=%#v err=%v", authResult, err)
	}
}

func TestValidateApiKeyEnforcesRateLimit(t *testing.T) {
	service := newAPIKeyTestService(t)
	ctx := context.WithValue(context.Background(), "client_ip", "10.0.0.10")

	resp, err := service.CreateApiKey(ctx, "user-1", "Limited key", "read", []string{"10.0.0.10"}, 1, "")
	if err != nil {
		t.Fatalf("create api key: %v", err)
	}

	if _, err := service.ValidateApiKey(ctx, resp.Key); err != nil {
		t.Fatalf("first validate should pass: %v", err)
	}

	authResult, err := service.ValidateApiKey(ctx, resp.Key)
	if !errors.Is(err, ErrAPIKeyRateLimited) {
		t.Fatalf("expected ErrAPIKeyRateLimited, got authResult=%#v err=%v", authResult, err)
	}
}

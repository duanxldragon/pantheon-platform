package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadBindsSensitiveEnvOverrides(t *testing.T) {
	tempDir := t.TempDir()
	configContent := `environment: development
master_db:
  password: file-master-password
redis:
  password: file-redis-password
email:
  smtp:
    password: file-smtp-password
default_admin:
  enabled: false
encryption_key: ""
`

	if err := os.WriteFile(filepath.Join(tempDir, "config.yaml"), []byte(configContent), 0o600); err != nil {
		t.Fatalf("write config: %v", err)
	}

	t.Setenv("PANTHEON_MASTER_DB_PASSWORD", "env-master-password")
	t.Setenv("PANTHEON_REDIS_PASSWORD", "env-redis-password")
	t.Setenv("PANTHEON_EMAIL_SMTP_PASSWORD", "env-smtp-password")

	originalWD, err := os.Getwd()
	if err != nil {
		t.Fatalf("get working directory: %v", err)
	}

	if err := os.Chdir(tempDir); err != nil {
		t.Fatalf("change working directory: %v", err)
	}
	defer func() {
		if chdirErr := os.Chdir(originalWD); chdirErr != nil {
			t.Fatalf("restore working directory: %v", chdirErr)
		}
	}()

	cfg := Load()

	if cfg.MasterDB.Password != "env-master-password" {
		t.Fatalf("expected master db password from env, got %q", cfg.MasterDB.Password)
	}

	if cfg.Redis.Password != "env-redis-password" {
		t.Fatalf("expected redis password from env, got %q", cfg.Redis.Password)
	}

	if cfg.Email.SMTPPassword != "env-smtp-password" {
		t.Fatalf("expected email smtp password from env, got %q", cfg.Email.SMTPPassword)
	}
}

func TestValidateRejectsEnabledDefaultAdminWithoutPassword(t *testing.T) {
	cfg := &Config{
		Port:          8080,
		EncryptionKey: "12345678901234567890123456789012",
		DefaultAdmin: DefaultAdminConfig{
			Enabled:  true,
			Username: "admin",
		},
	}

	err := validate(cfg)
	if err == nil || !strings.Contains(err.Error(), "default admin password") {
		t.Fatalf("expected default admin password validation error, got %v", err)
	}
}

func TestValidateRejectsWeakEnabledDefaultAdminPassword(t *testing.T) {
	cfg := &Config{
		Port:          8080,
		EncryptionKey: "12345678901234567890123456789012",
		DefaultAdmin: DefaultAdminConfig{
			Enabled:  true,
			Username: "admin",
			Password: "short-pass",
		},
	}

	err := validate(cfg)
	if err == nil || !strings.Contains(err.Error(), "at least 12 characters") {
		t.Fatalf("expected weak default admin password validation error, got %v", err)
	}
}

func TestLoadSupportsLegacyMultiTenantAliasKeys(t *testing.T) {
	tempDir := t.TempDir()
	configContent := `environment: development
multi_tenant:
  enabled: false
  default_tenant_id: legacy-tenant
encryption_key: "12345678901234567890123456789012"
default_admin:
  enabled: false
`

	if err := os.WriteFile(filepath.Join(tempDir, "config.yaml"), []byte(configContent), 0o600); err != nil {
		t.Fatalf("write config: %v", err)
	}

	originalWD, err := os.Getwd()
	if err != nil {
		t.Fatalf("get working directory: %v", err)
	}

	if err := os.Chdir(tempDir); err != nil {
		t.Fatalf("change working directory: %v", err)
	}
	defer func() {
		if chdirErr := os.Chdir(originalWD); chdirErr != nil {
			t.Fatalf("restore working directory: %v", chdirErr)
		}
	}()

	cfg := Load()

	if cfg.EnableMultiTenant {
		t.Fatalf("expected legacy multi_tenant.enabled=false to disable multi-tenant mode")
	}

	if cfg.DefaultTenantID != "legacy-tenant" {
		t.Fatalf("expected default tenant id from legacy alias, got %q", cfg.DefaultTenantID)
	}
}

func TestLoadDisablesRateLimitByDefaultOutsideProduction(t *testing.T) {
	tempDir := t.TempDir()
	configContent := `environment: development
encryption_key: "12345678901234567890123456789012"
default_admin:
  enabled: false
`

	if err := os.WriteFile(filepath.Join(tempDir, "config.yaml"), []byte(configContent), 0o600); err != nil {
		t.Fatalf("write config: %v", err)
	}

	originalWD, err := os.Getwd()
	if err != nil {
		t.Fatalf("get working directory: %v", err)
	}

	if err := os.Chdir(tempDir); err != nil {
		t.Fatalf("change working directory: %v", err)
	}
	defer func() {
		if chdirErr := os.Chdir(originalWD); chdirErr != nil {
			t.Fatalf("restore working directory: %v", chdirErr)
		}
	}()

	cfg := Load()
	if cfg.Security.RateLimit.Enabled {
		t.Fatalf("expected rate limit to default to disabled outside production when not explicitly configured")
	}
}

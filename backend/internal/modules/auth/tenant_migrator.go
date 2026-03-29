package auth

import "pantheon-platform/backend/internal/shared/database"

type tenantMigrator struct{}

func NewTenantMigrator() database.TenantMigrator {
	return &tenantMigrator{}
}

func (m *tenantMigrator) GetTenantModels() []interface{} {
	return []interface{}{
		&LoginAttempt{},
		&PasswordResetToken{},
		&TwoFactorAuth{},
	}
}

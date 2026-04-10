package auth

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LoginAttempt represents a login attempt record for tracking failed login attempts
type LoginAttempt struct {
	ID        uuid.UUID `json:"id" gorm:"size:36;primaryKey"`
	Email     string    `json:"email" gorm:"size:100;notNull;index"`
	IP        string    `json:"ip" gorm:"size:50;notNull"`
	UserAgent string    `json:"user_agent" gorm:"size:255"`
	Success   bool      `json:"success" gorm:"notNull;default:false"`
	AttemptAt time.Time `json:"attempt_at" gorm:"autoCreateTime"`
	TenantID  *string   `json:"tenant_id,omitempty" gorm:"size:36;index"`
}

// TableName returns the table name for LoginAttempt
func (LoginAttempt) TableName() string {
	return "auth_login_attempts"
}

// LoginAttemptSummary represents a summary of login attempts for a user
type LoginAttemptSummary struct {
	Email       string     `json:"email"`
	FailedCount int        `json:"failed_count"`
	LastAttempt time.Time  `json:"last_attempt"`
	LockedUntil *time.Time `json:"locked_until,omitempty"`
}

// PasswordResetToken represents a password reset token in the database.
type PasswordResetToken struct {
	ID        uuid.UUID  `json:"id" gorm:"size:36;primaryKey"`
	Email     string     `json:"email" gorm:"size:100;notNull;index"`
	Token     string     `json:"token" gorm:"size:100;notNull;uniqueIndex;uniqueIndex:idx_user_token,uniqueIndex:idx_user_token_expires_at"`
	ExpiresAt time.Time  `json:"expires_at" gorm:"notNull;index"`
	UserID    *uuid.UUID `json:"user_id,omitempty" gorm:"size:36;index"`
	Used      bool       `json:"used" gorm:"notNull;default:false"`
	CreatedAt time.Time  `json:"created_at" gorm:"autoCreateTime"`
}

// TableName returns the table name for PasswordResetToken.
func (PasswordResetToken) TableName() string {
	return "auth_password_reset_tokens"
}

// ApiKey represents an API key in the database.
type ApiKey struct {
	ID          uuid.UUID  `json:"id" gorm:"size:36;primaryKey"`
	UserID      string     `json:"user_id" gorm:"size:36;notNull;index"`
	Name        string     `json:"name" gorm:"size:100;notNull"`
	Key         string     `json:"key" gorm:"size:100;notNull;index"`
	Permissions string     `json:"permissions" gorm:"type:varchar(255);notNull;default:'read,write'"`
	LastUsed    *time.Time `json:"last_used,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// TableName returns the table name for ApiKey.
func (ApiKey) TableName() string {
	return "auth_api_keys"
}

// TwoFactorAuth stores two-factor authentication settings.
type TwoFactorAuth struct {
	ID          uint   `gorm:"primaryKey"`
	UserID      string `gorm:"size:36;not null;index" json:"user_id"`
	TenantID    string `gorm:"size:36;not null;index" json:"tenant_id"`
	Secret      string `gorm:"type:text;not null" json:"secret"`
	Enabled     bool   `gorm:"default:false;not null" json:"enabled"`
	BackupCodes string `gorm:"type:text" json:"backup_codes"`
	CreatedAt   int64  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   int64  `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName returns the table name for TwoFactorAuth.
func (TwoFactorAuth) TableName() string {
	return "auth_two_factor_auth"
}

// BeforeCreate hook to set UUID before creating
func (la *LoginAttempt) BeforeCreate(tx *gorm.DB) error {
	if la.ID == uuid.Nil {
		la.ID = uuid.New()
	}
	return nil
}

package tenant

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

// QuotaService defines tenant quota management capabilities.
type QuotaService interface {
	CheckQuota(ctx context.Context, tenantID string, quotaType QuotaType) error
	IncreaseUsage(ctx context.Context, tenantID string, quotaType QuotaType, amount int64, operator string) error
	DecreaseUsage(ctx context.Context, tenantID string, quotaType QuotaType, amount int64, operator string) error
	GetQuotaInfo(ctx context.Context, tenantID string, quotaType QuotaType) (*TenantQuota, error)
	ListQuotas(ctx context.Context, tenantID string) ([]*TenantQuota, error)
	SetQuota(ctx context.Context, tenantID string, quotaType QuotaType, maxValue int64, unit string) error
}

type quotaService struct {
	db *gorm.DB // Master DB since quotas are stored in the master DB
}

// NewQuotaService creates a quota service.
func NewQuotaService(db *gorm.DB) QuotaService {
	return &quotaService{db: db}
}

func (s *quotaService) CheckQuota(ctx context.Context, tenantID string, quotaType QuotaType) error {
	var quota TenantQuota
	err := s.db.WithContext(ctx).Where("tenant_id = ? AND quota_type = ?", tenantID, quotaType).First(&quota).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil // No quota defined means unlimited for now, or you could return error
		}
		return err
	}

	if quota.CurrentValue >= quota.MaxValue {
		return fmt.Errorf("quota exceeded for %s: %d/%d", quotaType, quota.CurrentValue, quota.MaxValue)
	}

	return nil
}

func (s *quotaService) IncreaseUsage(ctx context.Context, tenantID string, quotaType QuotaType, amount int64, operator string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var quota TenantQuota
		err := tx.Where("tenant_id = ? AND quota_type = ?", tenantID, quotaType).First(&quota).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// Initialize quota if not exists
				quota = TenantQuota{
					ID:           uuid.New(),
					TenantID:     tenantID,
					QuotaType:    quotaType,
					MaxValue:     100, // Default limit
					CurrentValue: 0,
					CreatedAt:    time.Now(),
					UpdatedAt:    time.Now(),
				}
				if err := tx.Create(&quota).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		oldValue := quota.CurrentValue
		quota.CurrentValue += amount
		quota.UpdatedAt = time.Now()

		if err := tx.Save(&quota).Error; err != nil {
			return err
		}

		// Log usage
		log := QuotaUsageLog{
			ID:          uuid.New(),
			TenantID:    tenantID,
			QuotaType:   quotaType,
			Action:      "increase",
			ChangeValue: amount,
			OldValue:    oldValue,
			NewValue:    quota.CurrentValue,
			Operator:    operator,
			CreatedAt:   time.Now(),
		}

		return tx.Create(&log).Error
	})
}

func (s *quotaService) DecreaseUsage(ctx context.Context, tenantID string, quotaType QuotaType, amount int64, operator string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var quota TenantQuota
		err := tx.Where("tenant_id = ? AND quota_type = ?", tenantID, quotaType).First(&quota).Error
		if err != nil {
			return err
		}

		oldValue := quota.CurrentValue
		quota.CurrentValue -= amount
		if quota.CurrentValue < 0 {
			quota.CurrentValue = 0
		}
		quota.UpdatedAt = time.Now()

		if err := tx.Save(&quota).Error; err != nil {
			return err
		}

		// Log usage
		log := QuotaUsageLog{
			ID:          uuid.New(),
			TenantID:    tenantID,
			QuotaType:   quotaType,
			Action:      "decrease",
			ChangeValue: -amount,
			OldValue:    oldValue,
			NewValue:    quota.CurrentValue,
			Operator:    operator,
			CreatedAt:   time.Now(),
		}

		return tx.Create(&log).Error
	})
}

func (s *quotaService) GetQuotaInfo(ctx context.Context, tenantID string, quotaType QuotaType) (*TenantQuota, error) {
	var quota TenantQuota
	err := s.db.WithContext(ctx).Where("tenant_id = ? AND quota_type = ?", tenantID, quotaType).First(&quota).Error
	return &quota, err
}

func (s *quotaService) ListQuotas(ctx context.Context, tenantID string) ([]*TenantQuota, error) {
	var quotas []*TenantQuota
	err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("quota_type asc").Find(&quotas).Error
	return quotas, err
}

func (s *quotaService) SetQuota(ctx context.Context, tenantID string, quotaType QuotaType, maxValue int64, unit string) error {
	var quota TenantQuota
	err := s.db.WithContext(ctx).Where("tenant_id = ? AND quota_type = ?", tenantID, quotaType).First(&quota).Error
	if err == gorm.ErrRecordNotFound {
		quota = TenantQuota{
			ID:           uuid.New(),
			TenantID:     tenantID,
			QuotaType:    quotaType,
			MaxValue:     maxValue,
			CurrentValue: 0,
			Unit:         unit,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		return s.db.WithContext(ctx).Create(&quota).Error
	}
	if err != nil {
		return err
	}

	quota.MaxValue = maxValue
	if unit != "" {
		quota.Unit = unit
	}
	quota.UpdatedAt = time.Now()
	return s.db.WithContext(ctx).Save(&quota).Error
}

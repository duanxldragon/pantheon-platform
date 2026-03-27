package setting

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// SettingService defines the system setting service contract.
type SettingService interface {
	List(ctx context.Context) ([]*SettingResponse, error)
	Update(ctx context.Context, key string, value string, updatedBy string) error
	UpdateBatch(ctx context.Context, updates map[string]string, updatedBy string) error
}

// settingService implements the system setting service.
type settingService struct {
	repo SettingRepository
}

func NewSettingService(repo SettingRepository) SettingService {
	return &settingService{repo: repo}
}

func (s *settingService) List(ctx context.Context) ([]*SettingResponse, error) {
	tenantID := getTenantID(ctx)
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000000"
	}
	items, err := s.repo.ListByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	out := make([]*SettingResponse, 0, len(items))
	for _, it := range items {
		out = append(out, toResponse(&it))
	}
	return out, nil
}

func (s *settingService) Update(ctx context.Context, key string, value string, updatedBy string) error {
	tenantID := getTenantID(ctx)
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000000"
	}

	now := time.Now()
	entry := &Setting{
		ID:        uuid.New(),
		TenantID:  tenantID,
		Key:       key,
		Value:     value,
		Editable:  true,
		UpdatedBy: updatedBy,
		UpdatedAt: now,
	}

	return s.repo.Upsert(ctx, entry)
}

func (s *settingService) UpdateBatch(ctx context.Context, updates map[string]string, updatedBy string) error {
	tenantID := getTenantID(ctx)
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000000"
	}

	now := time.Now()
	for key, value := range updates {
		entry := &Setting{
			ID:        uuid.New(),
			TenantID:  tenantID,
			Key:       key,
			Value:     value,
			Editable:  true,
			UpdatedBy: updatedBy,
			UpdatedAt: now,
		}

		if err := s.repo.Upsert(ctx, entry); err != nil {
			return err
		}
	}

	return nil
}

func toResponse(s *Setting) *SettingResponse {
	resp := &SettingResponse{
		ID:          s.ID.String(),
		Category:    s.Category,
		Key:         s.Key,
		Value:       s.Value,
		Label:       s.Label,
		Type:        s.Type,
		Description: s.Description,
		Editable:    s.Editable,
		UpdatedBy:   s.UpdatedBy,
	}

	if !s.UpdatedAt.IsZero() {
		resp.UpdatedAt = s.UpdatedAt.Format(time.RFC3339)
	}

	return resp
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

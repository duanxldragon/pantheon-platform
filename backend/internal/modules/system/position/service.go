package position

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"pantheon-platform/backend/internal/shared/audit"
	"pantheon-platform/backend/internal/shared/database"
)

// ========== Dependency Contracts ==========

type DeptValidator interface {
	GetDeptName(ctx context.Context, id string) (string, error)
	CheckDeptExists(ctx context.Context, id string) (bool, error)
}

type UserDirectory interface {
	ListUserIDsByPositionID(ctx context.Context, positionID string) ([]string, error)
}

type AuthorizationProvider interface {
	BumpUsersAuthVersion(ctx context.Context, userIDs []string) error
}

// ========== Service Interface ==========

type PositionService interface {
	Create(ctx context.Context, req *PositionRequest) (*Position, error)
	GetByID(ctx context.Context, id string) (*PositionResponse, error)
	Update(ctx context.Context, id string, req *PositionRequest) (*Position, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, req *PositionListRequest) (*PageResponse, error)
}

// ========== Service Implementation ==========

type positionService struct {
	dao           PositionDAO
	deptValidator DeptValidator
	userDirectory UserDirectory
	authProvider  AuthorizationProvider
	txManager     database.TransactionManager
}

// NewPositionService creates a position service instance.
func NewPositionService(
	dao PositionDAO,
	deptValidator DeptValidator,
	userDirectory UserDirectory,
	authProvider AuthorizationProvider,
	txManager database.TransactionManager,
) PositionService {
	return &positionService{
		dao:           dao,
		deptValidator: deptValidator,
		userDirectory: userDirectory,
		authProvider:  authProvider,
		txManager:     txManager,
	}
}

func (s *positionService) Create(ctx context.Context, req *PositionRequest) (*Position, error) {
	deptID, err := s.resolveDepartmentID(ctx, req.DepartmentID)
	if err != nil {
		return nil, err
	}

	level := 0
	if req.Level != nil {
		level = *req.Level
	}
	sort := 0
	if req.Sort != nil {
		sort = *req.Sort
	}

	pos := &Position{
		ID:               uuid.New(),
		Name:             req.Name,
		Code:             req.Code,
		Category:         req.Category,
		Description:      req.Description,
		DepartmentID:     deptID,
		Level:            level,
		Sort:             sort,
		Status:           req.Status,
		Responsibilities: req.Responsibilities,
		Requirements:     req.Requirements,
		TenantID:         getTenantID(ctx),
	}

	err = s.dao.Create(ctx, *pos)
	if err == nil {
		setPositionAuditFields(ctx, audit.OperationFields{
			Module:       "system/positions",
			Resource:     "position",
			ResourceID:   pos.ID.String(),
			ResourceName: pos.Name,
			Summary:      buildPositionAuditSummary("create", pos.Name, pos.Status, 0),
			Detail: buildPositionAuditDetail(pos.ID.String(), pos.Name, map[string]string{
				"code":   pos.Code,
				"status": pos.Status,
			}),
		})
	}
	return pos, err
}

func (s *positionService) GetByID(ctx context.Context, id string) (*PositionResponse, error) {
	pos, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	var deptName string
	if pos.DepartmentID != nil {
		deptName, _ = s.deptValidator.GetDeptName(ctx, pos.DepartmentID.String())
	}

	return ToPositionResponse(&pos, &deptName), nil
}

func (s *positionService) Update(ctx context.Context, id string, req *PositionRequest) (*Position, error) {
	pos, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	previousStatus := pos.Status

	pos.Name = req.Name
	pos.Code = req.Code
	pos.Category = req.Category
	pos.Description = req.Description
	pos.Status = req.Status
	if req.Level != nil {
		pos.Level = *req.Level
	}
	if req.Sort != nil {
		pos.Sort = *req.Sort
	}
	pos.Responsibilities = req.Responsibilities
	pos.Requirements = req.Requirements

	if req.DepartmentID != nil {
		deptID, err := s.resolveDepartmentID(ctx, req.DepartmentID)
		if err != nil {
			return nil, err
		}
		pos.DepartmentID = deptID
	}

	// Ensure the position belongs to the current tenant.
	tenantID := getTenantID(ctx)
	if pos.TenantID != tenantID {
		return nil, fmt.Errorf("position not found in current tenant")
	}

	err = s.dao.Update(ctx, pos)
	if err != nil {
		return nil, err
	}
	affectedUsers := s.bumpPositionUsers(ctx, id)
	attrs := map[string]string{
		"code":   pos.Code,
		"status": pos.Status,
	}
	if previousStatus != pos.Status {
		attrs["previous_status"] = previousStatus
	}
	if affectedUsers > 0 {
		attrs["affected_users"] = fmt.Sprintf("%d", affectedUsers)
		attrs["refresh_strategy"] = "bump_auth_version"
	}
	setPositionAuditFields(ctx, audit.OperationFields{
		Module:       "system/positions",
		Resource:     "position",
		ResourceID:   pos.ID.String(),
		ResourceName: pos.Name,
		Summary:      buildPositionAuditSummary("update", pos.Name, pos.Status, affectedUsers),
		Detail:       buildPositionAuditDetail(pos.ID.String(), pos.Name, attrs),
	})
	return &pos, nil
}

func (s *positionService) Delete(ctx context.Context, id string) error {
	// Load the position before validating tenant ownership.
	pos, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Ensure the position belongs to the current tenant.
	tenantID := getTenantID(ctx)
	if pos.TenantID != tenantID {
		return fmt.Errorf("position not found in current tenant")
	}

	userIDs, _ := s.userDirectory.ListUserIDsByPositionID(ctx, id)
	if err := s.dao.Delete(ctx, id); err != nil {
		return err
	}
	userIDs = uniquePositionUserIDs(userIDs)
	s.bumpUsers(ctx, userIDs)
	setPositionAuditFields(ctx, audit.OperationFields{
		Module:       "system/positions",
		Resource:     "position",
		ResourceID:   pos.ID.String(),
		ResourceName: pos.Name,
		Summary:      buildPositionAuditSummary("delete", pos.Name, pos.Status, len(userIDs)),
		Detail: buildPositionAuditDetail(pos.ID.String(), pos.Name, map[string]string{
			"code":             pos.Code,
			"status":           pos.Status,
			"action":           "delete",
			"affected_users":   fmt.Sprintf("%d", len(userIDs)),
			"refresh_strategy": "bump_auth_version",
		}),
	})
	return nil
}

func (s *positionService) List(ctx context.Context, req *PositionListRequest) (*PageResponse, error) {
	filters := make(map[string]interface{})
	poss, total, err := s.dao.List(ctx, req.Page, req.PageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*PositionResponse, len(poss))
	for i, p := range poss {
		items[i] = ToPositionResponse(&p, nil)
	}

	return &PageResponse{
		Items: items,
		Pagination: Pagination{
			Page:     int64(req.Page),
			PageSize: int64(req.PageSize),
			Total:    total,
		},
	}, nil
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func (s *positionService) bumpPositionUsers(ctx context.Context, positionID string) int {
	if s == nil || s.userDirectory == nil || positionID == "" {
		return 0
	}
	userIDs, err := s.userDirectory.ListUserIDsByPositionID(ctx, positionID)
	if err != nil {
		return 0
	}
	userIDs = uniquePositionUserIDs(userIDs)
	s.bumpUsers(ctx, userIDs)
	return len(userIDs)
}

func (s *positionService) bumpUsers(ctx context.Context, userIDs []string) {
	if s == nil || s.authProvider == nil || len(userIDs) == 0 {
		return
	}
	_ = s.authProvider.BumpUsersAuthVersion(ctx, userIDs)
}

func (s *positionService) resolveDepartmentID(ctx context.Context, departmentID *string) (*uuid.UUID, error) {
	if departmentID == nil {
		return nil, nil
	}

	value := strings.TrimSpace(*departmentID)
	if value == "" {
		return nil, nil
	}

	if s != nil && s.deptValidator != nil {
		exists, err := s.deptValidator.CheckDeptExists(ctx, value)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, fmt.Errorf("department not found or inactive")
		}
	}

	uid, err := uuid.Parse(value)
	if err != nil {
		return nil, fmt.Errorf("invalid department id")
	}

	return &uid, nil
}

func setPositionAuditFields(ctx context.Context, fields audit.OperationFields) {
	if collector := audit.FromContext(ctx); collector != nil {
		collector.Set(fields)
	}
}

func buildPositionAuditSummary(action, positionName, status string, affectedUsers int) string {
	switch action {
	case "create":
		return fmt.Sprintf("\u521b\u5efa\u5c97\u4f4d\u300c%s\u300d", positionName)
	case "delete":
		if affectedUsers > 0 {
			return fmt.Sprintf("\u5220\u9664\u5c97\u4f4d\u300c%s\u300d\uff0c\u5f71\u54cd %d \u4e2a\u7528\u6237\u5e76\u5237\u65b0\u6743\u9650", positionName, affectedUsers)
		}
		return fmt.Sprintf("\u5220\u9664\u5c97\u4f4d\u300c%s\u300d", positionName)
	default:
		if affectedUsers > 0 {
			return fmt.Sprintf("\u66f4\u65b0\u5c97\u4f4d\u300c%s\u300d\uff0c\u5f71\u54cd %d \u4e2a\u7528\u6237\u5e76\u5237\u65b0\u6743\u9650", positionName, affectedUsers)
		}
		if status == "inactive" {
			return fmt.Sprintf("\u66f4\u65b0\u5c97\u4f4d\u300c%s\u300d\u4e3a\u505c\u7528", positionName)
		}
		return fmt.Sprintf("\u66f4\u65b0\u5c97\u4f4d\u300c%s\u300d", positionName)
	}
}

func buildPositionAuditDetail(positionID, positionName string, attrs map[string]string) string {
	parts := []string{
		"\u5c97\u4f4dID=" + positionID,
		"\u5c97\u4f4d\u540d\u79f0=" + positionName,
	}
	for _, key := range []string{"code", "status", "previous_status", "affected_users", "refresh_strategy", "action"} {
		if value := strings.TrimSpace(attrs[key]); value != "" {
			parts = append(parts, key+"="+value)
		}
	}
	return strings.Join(parts, "\uff1b")
}

func uniquePositionUserIDs(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

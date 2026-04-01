package dept

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"pantheon-platform/backend/internal/shared/audit"
	"pantheon-platform/backend/internal/shared/database"
)

// ========== Dependency Contracts ==========

type UserValidator interface {
	GetUserName(ctx context.Context, id string) (string, error)
	CheckUserExists(ctx context.Context, id string) (bool, error)
	HasUsersInDept(ctx context.Context, deptID string) (bool, error)
	ListUserIDsByDepartmentIDs(ctx context.Context, departmentIDs []string) ([]string, error)
}

type AuthorizationProvider interface {
	BumpUsersAuthVersion(ctx context.Context, userIDs []string) error
}

// ========== Service Interface ==========

type DepartmentService interface {
	Create(ctx context.Context, req *DepartmentRequest) (*Department, error)
	GetByID(ctx context.Context, id string) (*DepartmentResponse, error)
	Update(ctx context.Context, id string, req *DepartmentRequest) (*Department, error)
	Delete(ctx context.Context, id string) error
	BatchDelete(ctx context.Context, ids []string) error
	BatchUpdateStatus(ctx context.Context, req *DepartmentStatusRequest) error
	List(ctx context.Context, req *DepartmentListRequest) (*PageResponse, error)
	GetTree(ctx context.Context, req *DepartmentTreeRequest) ([]*DepartmentResponse, error)
}

// ========== Service Implementation ==========

type departmentService struct {
	dao           DepartmentDAO
	userValidator UserValidator
	authProvider  AuthorizationProvider
	txManager     database.TransactionManager
}

// NewDepartmentService creates a department service instance.
func NewDepartmentService(
	dao DepartmentDAO,
	userValidator UserValidator,
	authProvider AuthorizationProvider,
	txManager database.TransactionManager,
) DepartmentService {
	return &departmentService{
		dao:           dao,
		userValidator: userValidator,
		authProvider:  authProvider,
		txManager:     txManager,
	}
}

func (s *departmentService) Create(ctx context.Context, req *DepartmentRequest) (*Department, error) {
	parentID, level, err := s.resolveParent(ctx, "", req.ParentID)
	if err != nil {
		return nil, err
	}

	leaderID, err := s.resolveLeader(ctx, req.LeaderID)
	if err != nil {
		return nil, err
	}

	sort := 0
	if req.Sort != nil {
		sort = *req.Sort
	}

	dept := &Department{
		ID:          uuid.New(),
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		ParentID:    parentID,
		LeaderID:    leaderID,
		Phone:       req.Phone,
		Email:       req.Email,
		Level:       level,
		Sort:        sort,
		Status:      req.Status,
		TenantID:    getTenantID(ctx),
	}

	err = s.dao.Create(ctx, *dept)
	if err == nil {
		setDepartmentAuditFields(ctx, audit.OperationFields{
			Module:       "system/depts",
			Resource:     "department",
			ResourceID:   dept.ID.String(),
			ResourceName: dept.Name,
			Summary:      buildDepartmentAuditSummary("create", dept.Name, dept.Status, 0),
			Detail: buildDepartmentAuditDetail(dept.ID.String(), dept.Name, map[string]string{
				"code":   dept.Code,
				"status": dept.Status,
			}),
		})
	}
	return dept, err
}

func (s *departmentService) GetByID(ctx context.Context, id string) (*DepartmentResponse, error) {
	dept, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	var parentName, leaderName string
	if dept.ParentID != nil {
		p, _ := s.dao.GetByID(ctx, dept.ParentID.String())
		parentName = p.Name
	}
	if dept.LeaderID != nil {
		leaderName, _ = s.userValidator.GetUserName(ctx, dept.LeaderID.String())
	}

	return ToDepartmentResponse(&dept, &parentName, &leaderName), nil
}

func (s *departmentService) Update(ctx context.Context, id string, req *DepartmentRequest) (*Department, error) {
	dept, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	previousStatus := dept.Status

	if tenantID := getTenantID(ctx); tenantID != "" && dept.TenantID != tenantID {
		return nil, fmt.Errorf("department not found in current tenant")
	}

	dept.Name = req.Name
	dept.Code = req.Code
	dept.Description = req.Description
	dept.Phone = req.Phone
	dept.Email = req.Email
	dept.Status = req.Status
	if req.Sort != nil {
		dept.Sort = *req.Sort
	}

	if req.ParentID != nil {
		parentID, level, err := s.resolveParent(ctx, id, req.ParentID)
		if err != nil {
			return nil, err
		}
		dept.ParentID = parentID
		dept.Level = level
	}

	if req.LeaderID != nil {
		leaderID, err := s.resolveLeader(ctx, req.LeaderID)
		if err != nil {
			return nil, err
		}
		dept.LeaderID = leaderID
	}

	err = s.dao.Update(ctx, dept)
	if err != nil {
		return nil, err
	}
	affectedUsers := s.bumpDepartmentUsers(ctx, id)
	attrs := map[string]string{
		"code":   dept.Code,
		"status": dept.Status,
	}
	if previousStatus != dept.Status {
		attrs["previous_status"] = previousStatus
	}
	if affectedUsers > 0 {
		attrs["affected_users"] = fmt.Sprintf("%d", affectedUsers)
		attrs["refresh_strategy"] = "bump_auth_version"
	}
	setDepartmentAuditFields(ctx, audit.OperationFields{
		Module:       "system/depts",
		Resource:     "department",
		ResourceID:   dept.ID.String(),
		ResourceName: dept.Name,
		Summary:      buildDepartmentAuditSummary("update", dept.Name, dept.Status, affectedUsers),
		Detail:       buildDepartmentAuditDetail(dept.ID.String(), dept.Name, attrs),
	})
	return &dept, nil
}

func (s *departmentService) Delete(ctx context.Context, id string) error {
	dept, err := s.dao.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if tenantID := getTenantID(ctx); tenantID != "" && dept.TenantID != tenantID {
		return fmt.Errorf("department not found in current tenant")
	}
	if has, _ := s.dao.HasChildren(ctx, id); has {
		return fmt.Errorf("department has children")
	}
	if has, _ := s.userValidator.HasUsersInDept(ctx, id); has {
		return fmt.Errorf("department has users")
	}
	if err := s.dao.Delete(ctx, id); err != nil {
		return err
	}
	setDepartmentAuditFields(ctx, audit.OperationFields{
		Module:       "system/depts",
		Resource:     "department",
		ResourceID:   dept.ID.String(),
		ResourceName: dept.Name,
		Summary:      buildDepartmentAuditSummary("delete", dept.Name, dept.Status, 0),
		Detail: buildDepartmentAuditDetail(dept.ID.String(), dept.Name, map[string]string{
			"code":   dept.Code,
			"status": dept.Status,
			"action": "delete",
		}),
	})
	return nil
}

func (s *departmentService) BatchDelete(ctx context.Context, ids []string) error {
	tenantID := getTenantID(ctx)
	departments := make([]Department, 0, len(ids))
	seen := make(map[string]struct{}, len(ids))

	for _, id := range ids {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}

		dept, err := s.dao.GetByID(ctx, id)
		if err != nil {
			return err
		}
		if tenantID != "" && dept.TenantID != tenantID {
			return fmt.Errorf("department not found in current tenant")
		}
		if has, _ := s.dao.HasChildren(ctx, id); has {
			return fmt.Errorf("department %q has children", dept.Name)
		}
		if has, _ := s.userValidator.HasUsersInDept(ctx, id); has {
			return fmt.Errorf("department %q has users", dept.Name)
		}
		departments = append(departments, dept)
	}

	if err := s.txManager.Transaction(ctx, func(tx *gorm.DB) error {
		txCtx := context.WithValue(ctx, "tx_db", tx)
		for _, dept := range departments {
			if err := s.dao.Delete(txCtx, dept.ID.String()); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return err
	}

	names := make([]string, 0, len(departments))
	for _, dept := range departments {
		names = append(names, dept.Name)
	}
	setDepartmentAuditFields(ctx, audit.OperationFields{
		Module:   "system/depts",
		Resource: "department_batch_delete",
		Summary:  fmt.Sprintf("Batch deleted %d departments", len(departments)),
		Detail:   "departments=" + strings.Join(names, ","),
	})
	return nil
}

func (s *departmentService) BatchUpdateStatus(ctx context.Context, req *DepartmentStatusRequest) error {
	tenantID := getTenantID(ctx)
	departments := make([]Department, 0, len(req.DepartmentIDs))
	seen := make(map[string]struct{}, len(req.DepartmentIDs))
	affectedUsers := make(map[string]struct{})

	for _, id := range req.DepartmentIDs {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}

		dept, err := s.dao.GetByID(ctx, id)
		if err != nil {
			return err
		}
		if tenantID != "" && dept.TenantID != tenantID {
			return fmt.Errorf("department not found in current tenant")
		}
		if dept.Status == req.Status {
			continue
		}
		departments = append(departments, dept)
	}

	if err := s.txManager.Transaction(ctx, func(tx *gorm.DB) error {
		txCtx := context.WithValue(ctx, "tx_db", tx)
		for _, dept := range departments {
			if err := s.dao.UpdateStatus(txCtx, dept.ID.String(), req.Status); err != nil {
				return err
			}
			deptIDs, err := s.collectDepartmentIDs(txCtx, dept.ID.String())
			if err != nil {
				return err
			}
			userIDs, err := s.userValidator.ListUserIDsByDepartmentIDs(txCtx, deptIDs)
			if err != nil {
				return err
			}
			for _, userID := range userIDs {
				if userID != "" {
					affectedUsers[userID] = struct{}{}
				}
			}
		}
		return nil
	}); err != nil {
		return err
	}

	if s.authProvider != nil && len(affectedUsers) > 0 {
		userIDs := make([]string, 0, len(affectedUsers))
		for userID := range affectedUsers {
			userIDs = append(userIDs, userID)
		}
		_ = s.authProvider.BumpUsersAuthVersion(ctx, userIDs)
	}

	names := make([]string, 0, len(departments))
	for _, dept := range departments {
		names = append(names, dept.Name)
	}
	setDepartmentAuditFields(ctx, audit.OperationFields{
		Module:   "system/depts",
		Resource: "department_status_batch",
		Summary:  fmt.Sprintf("Batch updated %d departments to %s", len(departments), req.Status),
		Detail:   "departments=" + strings.Join(names, ",") + ";status=" + req.Status + fmt.Sprintf(";affected_users=%d", len(affectedUsers)),
	})
	return nil
}

func (s *departmentService) List(ctx context.Context, req *DepartmentListRequest) (*PageResponse, error) {
	filters := make(map[string]interface{})
	depts, total, err := s.dao.List(ctx, req.Page, req.PageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*DepartmentResponse, len(depts))
	for i, d := range depts {
		items[i] = ToDepartmentResponse(&d, nil, nil)
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

func (s *departmentService) GetTree(ctx context.Context, req *DepartmentTreeRequest) ([]*DepartmentResponse, error) {
	depts, err := s.dao.GetTree(ctx)
	if err != nil {
		return nil, err
	}
	return buildDeptTree(depts, ""), nil
}

func buildDeptTree(depts []*Department, parentID string) []*DepartmentResponse {
	var tree []*DepartmentResponse
	for _, d := range depts {
		pid := ""
		if d.ParentID != nil {
			pid = d.ParentID.String()
		}
		if pid == parentID {
			resp := ToDepartmentResponse(d, nil, nil)
			children := buildDeptTree(depts, d.ID.String())
			for _, child := range children {
				resp.Children = append(resp.Children, *child)
			}
			tree = append(tree, resp)
		}
	}
	return tree
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func (s *departmentService) resolveParent(ctx context.Context, deptID string, parentID *string) (*uuid.UUID, int, error) {
	if parentID == nil {
		return nil, 1, nil
	}

	parentValue := strings.TrimSpace(*parentID)
	if parentValue == "" {
		return nil, 1, nil
	}

	if deptID != "" && parentValue == deptID {
		return nil, 0, fmt.Errorf("department parent cannot be itself")
	}

	parent, err := s.dao.GetByID(ctx, parentValue)
	if err != nil {
		return nil, 0, fmt.Errorf("parent department not found")
	}
	if parent.Status != "active" {
		return nil, 0, fmt.Errorf("parent department is inactive")
	}

	if deptID != "" {
		circular, err := s.dao.CheckCircularReference(ctx, deptID, parentValue)
		if err != nil {
			return nil, 0, err
		}
		if circular {
			return nil, 0, fmt.Errorf("department parent creates a circular reference")
		}
	}

	parentUUID, err := uuid.Parse(parentValue)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid parent department id")
	}

	return &parentUUID, parent.Level + 1, nil
}

func (s *departmentService) resolveLeader(ctx context.Context, leaderID *string) (*uuid.UUID, error) {
	if leaderID == nil {
		return nil, nil
	}

	leaderValue := strings.TrimSpace(*leaderID)
	if leaderValue == "" {
		return nil, nil
	}

	exists, err := s.userValidator.CheckUserExists(ctx, leaderValue)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("department leader not found")
	}

	leaderUUID, err := uuid.Parse(leaderValue)
	if err != nil {
		return nil, fmt.Errorf("invalid department leader id")
	}

	return &leaderUUID, nil
}

func (s *departmentService) bumpDepartmentUsers(ctx context.Context, deptID string) int {
	if s == nil || s.authProvider == nil || s.userValidator == nil || deptID == "" {
		return 0
	}
	deptIDs, err := s.collectDepartmentIDs(ctx, deptID)
	if err != nil {
		return 0
	}
	userIDs, err := s.userValidator.ListUserIDsByDepartmentIDs(ctx, deptIDs)
	if err != nil {
		return 0
	}
	userIDs = uniqueDepartmentUserIDs(userIDs)
	_ = s.authProvider.BumpUsersAuthVersion(ctx, userIDs)
	return len(userIDs)
}

func (s *departmentService) collectDepartmentIDs(ctx context.Context, deptID string) ([]string, error) {
	seen := make(map[string]struct{})
	var result []string
	var walk func(string) error
	walk = func(currentID string) error {
		if currentID == "" {
			return nil
		}
		if _, ok := seen[currentID]; ok {
			return nil
		}
		seen[currentID] = struct{}{}
		result = append(result, currentID)
		children, err := s.dao.GetChildren(ctx, currentID)
		if err != nil {
			return err
		}
		for _, child := range children {
			if err := walk(child.ID.String()); err != nil {
				return err
			}
		}
		return nil
	}
	if err := walk(deptID); err != nil {
		return nil, err
	}
	return result, nil
}

func setDepartmentAuditFields(ctx context.Context, fields audit.OperationFields) {
	if collector := audit.FromContext(ctx); collector != nil {
		collector.Set(fields)
	}
}

func buildDepartmentAuditSummary(action, departmentName, status string, affectedUsers int) string {
	switch action {
	case "create":
		return fmt.Sprintf("\u521b\u5efa\u90e8\u95e8\u300c%s\u300d", departmentName)
	case "delete":
		return fmt.Sprintf("\u5220\u9664\u90e8\u95e8\u300c%s\u300d", departmentName)
	default:
		if affectedUsers > 0 {
			return fmt.Sprintf("\u66f4\u65b0\u90e8\u95e8\u300c%s\u300d\uff0c\u5f71\u54cd %d \u4e2a\u7528\u6237\u5e76\u5237\u65b0\u6743\u9650", departmentName, affectedUsers)
		}
		if status == "inactive" {
			return fmt.Sprintf("\u66f4\u65b0\u90e8\u95e8\u300c%s\u300d\u4e3a\u505c\u7528", departmentName)
		}
		return fmt.Sprintf("\u66f4\u65b0\u90e8\u95e8\u300c%s\u300d", departmentName)
	}
}

func buildDepartmentAuditDetail(departmentID, departmentName string, attrs map[string]string) string {
	parts := []string{
		"\u90e8\u95e8ID=" + departmentID,
		"\u90e8\u95e8\u540d\u79f0=" + departmentName,
	}
	for _, key := range []string{"code", "status", "previous_status", "affected_users", "refresh_strategy", "action"} {
		if value := strings.TrimSpace(attrs[key]); value != "" {
			parts = append(parts, key+"="+value)
		}
	}
	return strings.Join(parts, "\uff1b")
}

func uniqueDepartmentUserIDs(values []string) []string {
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

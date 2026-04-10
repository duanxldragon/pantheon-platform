package dict

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"pantheon-platform/backend/internal/shared/database"
)

var (
	ErrDictTypeNotFound = errors.New("dict type not found")
	ErrDictDataNotFound = errors.New("dict data not found")
	ErrDictTypeInUse    = errors.New("dict type is in use")
)

type DictService interface {
	CreateType(ctx context.Context, req *DictTypeRequest) (*DictType, error)
	GetTypeByID(ctx context.Context, id string) (*DictTypeResponse, error)
	UpdateType(ctx context.Context, id string, req *DictTypeRequest) (*DictType, error)
	DeleteType(ctx context.Context, id string) error
	ListTypes(ctx context.Context, page, pageSize int, search string) (*PageResponse, error)

	CreateData(ctx context.Context, req *DictDataRequest) (*DictData, error)
	GetDataByID(ctx context.Context, id string) (*DictDataResponse, error)
	UpdateData(ctx context.Context, id string, req *DictDataRequest) (*DictData, error)
	DeleteData(ctx context.Context, id string) error
	ListData(ctx context.Context, page, pageSize int, typeID, search string) (*PageResponse, error)
	GetDataByTypeCode(ctx context.Context, typeCode string) ([]*DictData, error)
}

type dictService struct {
	typeDAO   DictTypeDAO
	dataDAO   DictDataDAO
	txManager database.TransactionManager
}

func NewDictService(
	typeDAO DictTypeDAO,
	dataDAO DictDataDAO,
	txManager database.TransactionManager,
) DictService {
	return &dictService{
		typeDAO:   typeDAO,
		dataDAO:   dataDAO,
		txManager: txManager,
	}
}

func (s *dictService) CreateData(ctx context.Context, req *DictDataRequest) (*DictData, error) {
	dictType, err := s.requireTypeInTenant(ctx, req.TypeID)
	if err != nil {
		return nil, err
	}

	typeID, err := uuid.Parse(req.TypeID)
	if err != nil {
		return nil, err
	}

	record := &DictData{
		ID:          uuid.New(),
		TypeID:      typeID,
		Label:       req.Label,
		Value:       req.Value,
		Description: req.Description,
		Sort:        0,
		Status:      req.Status,
		TenantID:    dictType.TenantID,
	}
	err = s.dataDAO.Create(ctx, *record)
	return record, err
}

func (s *dictService) UpdateData(ctx context.Context, id string, req *DictDataRequest) (*DictData, error) {
	record, err := s.requireDataInTenant(ctx, id)
	if err != nil {
		return nil, err
	}

	dictType, err := s.requireTypeInTenant(ctx, req.TypeID)
	if err != nil {
		return nil, err
	}

	typeID, err := uuid.Parse(req.TypeID)
	if err != nil {
		return nil, err
	}

	record.TypeID = typeID
	record.Label = req.Label
	record.Value = req.Value
	record.Description = req.Description
	record.Status = req.Status

	if dictType.TenantID != record.TenantID {
		return nil, fmt.Errorf("dict type not found in current tenant")
	}

	err = s.dataDAO.Update(ctx, *record)
	return record, err
}

func (s *dictService) CreateType(ctx context.Context, req *DictTypeRequest) (*DictType, error) {
	record := &DictType{
		ID:          uuid.New(),
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Status:      req.Status,
		TenantID:    getTenantID(ctx),
	}
	err := s.typeDAO.Create(ctx, *record)
	return record, err
}

func (s *dictService) GetTypeByID(ctx context.Context, id string) (*DictTypeResponse, error) {
	record, err := s.requireTypeInTenant(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToDictTypeResponse(record), nil
}

func (s *dictService) GetDataByID(ctx context.Context, id string) (*DictDataResponse, error) {
	record, err := s.requireDataInTenant(ctx, id)
	if err != nil {
		return nil, err
	}

	return ToDictDataResponse(record), nil
}

func (s *dictService) UpdateType(ctx context.Context, id string, req *DictTypeRequest) (*DictType, error) {
	record, err := s.requireTypeInTenant(ctx, id)
	if err != nil {
		return nil, err
	}
	record.Name = req.Name
	record.Code = req.Code
	record.Description = req.Description
	record.Status = req.Status

	err = s.typeDAO.Update(ctx, *record)
	return record, err
}

func (s *dictService) DeleteType(ctx context.Context, id string) error {
	_, err := s.requireTypeInTenant(ctx, id)
	if err != nil {
		return err
	}

	if inUse, _ := s.typeDAO.IsInUse(ctx, id); inUse {
		return ErrDictTypeInUse
	}

	return s.typeDAO.Delete(ctx, id)
}

func (s *dictService) ListTypes(ctx context.Context, page, pageSize int, search string) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if tenantID := getTenantID(ctx); tenantID != "" {
		filters["tenant_id"] = tenantID
	}
	if search != "" {
		filters["name LIKE ?"] = "%" + search + "%"
	}

	records, total, err := s.typeDAO.List(ctx, page, pageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*DictTypeResponse, len(records))
	for i, record := range records {
		items[i] = ToDictTypeResponse(&record)
	}

	return &PageResponse{
		Items:      items,
		Pagination: Pagination{Page: int64(page), PageSize: int64(pageSize), Total: total},
	}, nil
}

func (s *dictService) DeleteData(ctx context.Context, id string) error {
	_, err := s.requireDataInTenant(ctx, id)
	if err != nil {
		return err
	}
	return s.dataDAO.Delete(ctx, id)
}

func (s *dictService) ListData(ctx context.Context, page, pageSize int, typeID, search string) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if tenantID := getTenantID(ctx); tenantID != "" {
		filters["tenant_id"] = tenantID
	}
	if typeID != "" {
		if _, err := s.requireTypeInTenant(ctx, typeID); err != nil {
			return nil, err
		}
		filters["type_id"] = typeID
	}
	if search != "" {
		filters["label LIKE ?"] = "%" + search + "%"
	}

	records, total, err := s.dataDAO.List(ctx, page, pageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*DictDataResponse, len(records))
	for i, record := range records {
		items[i] = ToDictDataResponse(&record)
	}

	return &PageResponse{
		Items:      items,
		Pagination: Pagination{Page: int64(page), PageSize: int64(pageSize), Total: total},
	}, nil
}

func (s *dictService) GetDataByTypeCode(ctx context.Context, typeCode string) ([]*DictData, error) {
	record, err := s.requireTypeByCodeInTenant(ctx, typeCode)
	if err != nil {
		return nil, err
	}
	data, _, err := s.dataDAO.GetByTypeID(ctx, record.ID.String(), 1, 1000)
	return data, err
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

func (s *dictService) requireTypeInTenant(ctx context.Context, id string) (*DictType, error) {
	record, err := s.typeDAO.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("%w", ErrDictTypeNotFound)
	}
	tenantID := getTenantID(ctx)
	if tenantID != "" && record.TenantID != tenantID {
		return nil, fmt.Errorf("%w", ErrDictTypeNotFound)
	}
	return &record, nil
}

func (s *dictService) requireTypeByCodeInTenant(ctx context.Context, code string) (*DictType, error) {
	record, err := s.typeDAO.GetByCode(ctx, code)
	if err != nil {
		return nil, err
	}
	if record == nil {
		return nil, fmt.Errorf("%w", ErrDictTypeNotFound)
	}
	tenantID := getTenantID(ctx)
	if tenantID != "" && record.TenantID != tenantID {
		return nil, fmt.Errorf("%w", ErrDictTypeNotFound)
	}
	return record, nil
}

func (s *dictService) requireDataInTenant(ctx context.Context, id string) (*DictData, error) {
	record, err := s.dataDAO.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("%w", ErrDictDataNotFound)
	}
	tenantID := getTenantID(ctx)
	if tenantID != "" && record.TenantID != tenantID {
		return nil, fmt.Errorf("%w", ErrDictDataNotFound)
	}
	return &record, nil
}

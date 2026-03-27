package dict

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"pantheon-platform/backend/internal/shared/database"
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
		TenantID:    getTenantID(ctx),
	}
	err = s.dataDAO.Create(ctx, *record)
	return record, err
}

func (s *dictService) UpdateData(ctx context.Context, id string, req *DictDataRequest) (*DictData, error) {
	record, err := s.dataDAO.GetByID(ctx, id)
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

	tenantID := getTenantID(ctx)
	if record.TenantID != tenantID {
		return nil, fmt.Errorf("dict data not found in current tenant")
	}

	err = s.dataDAO.Update(ctx, record)
	return &record, err
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
	record, err := s.typeDAO.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToDictTypeResponse(&record), nil
}

func (s *dictService) GetDataByID(ctx context.Context, id string) (*DictDataResponse, error) {
	record, err := s.dataDAO.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return ToDictDataResponse(&record), nil
}

func (s *dictService) UpdateType(ctx context.Context, id string, req *DictTypeRequest) (*DictType, error) {
	record, err := s.typeDAO.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	record.Name = req.Name
	record.Code = req.Code
	record.Description = req.Description
	record.Status = req.Status

	tenantID := getTenantID(ctx)
	if record.TenantID != tenantID {
		return nil, fmt.Errorf("dict type not found in current tenant")
	}

	err = s.typeDAO.Update(ctx, record)
	return &record, err
}

func (s *dictService) DeleteType(ctx context.Context, id string) error {
	record, err := s.typeDAO.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if inUse, _ := s.typeDAO.IsInUse(ctx, id); inUse {
		return fmt.Errorf("dict type is in use")
	}

	tenantID := getTenantID(ctx)
	if record.TenantID != tenantID {
		return fmt.Errorf("dict type not found in current tenant")
	}

	return s.typeDAO.Delete(ctx, id)
}

func (s *dictService) ListTypes(ctx context.Context, page, pageSize int, search string) (*PageResponse, error) {
	filters := make(map[string]interface{})
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
	record, err := s.dataDAO.GetByID(ctx, id)
	if err != nil {
		return err
	}

	tenantID := getTenantID(ctx)
	if record.TenantID != tenantID {
		return fmt.Errorf("dict data not found in current tenant")
	}

	return s.dataDAO.Delete(ctx, id)
}

func (s *dictService) ListData(ctx context.Context, page, pageSize int, typeID, search string) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if typeID != "" {
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
	record, err := s.typeDAO.GetByCode(ctx, typeCode)
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

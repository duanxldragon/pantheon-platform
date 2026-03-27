package dict

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"pantheon-platform/backend/internal/shared/database"
)

// ========== 服务接口 ==========

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

// ========== 服务实现 ==========

type dictService struct {
	typeRepo  DictTypeRepository
	dataRepo  DictDataRepository
	txManager database.TransactionManager
}

func NewDictService(
	typeRepo DictTypeRepository,
	dataRepo DictDataRepository,
	txManager database.TransactionManager,
) DictService {
	return &dictService{
		typeRepo:  typeRepo,
		dataRepo:  dataRepo,
		txManager: txManager,
	}
}

func (s *dictService) CreateData(ctx context.Context, req *DictDataRequest) (*DictData, error) {
	typeID, err := uuid.Parse(req.TypeID)
	if err != nil {
		return nil, err
	}

	dd := &DictData{
		ID:          uuid.New(),
		TypeID:      typeID,
		Label:       req.Label,
		Value:       req.Value,
		Description: req.Description,
		Sort:        0,
		Status:      req.Status,
		TenantID:    getTenantID(ctx),
	}
	err = s.dataRepo.Create(ctx, *dd)
	return dd, err
}

func (s *dictService) UpdateData(ctx context.Context, id string, req *DictDataRequest) (*DictData, error) {
	dd, err := s.dataRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	typeID, err := uuid.Parse(req.TypeID)
	if err != nil {
		return nil, err
	}

	dd.TypeID = typeID
	dd.Label = req.Label
	dd.Value = req.Value
	dd.Description = req.Description
	dd.Status = req.Status

	// 验证字典数据属于当前租户
	tenantID := getTenantID(ctx)
	if dd.TenantID != tenantID {
		return nil, fmt.Errorf("dict data not found in current tenant")
	}

	err = s.dataRepo.Update(ctx, dd)
	return &dd, err
}


func (s *dictService) CreateType(ctx context.Context, req *DictTypeRequest) (*DictType, error) {
	dt := &DictType{
		ID:          uuid.New(),
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Status:      req.Status,
		TenantID:    getTenantID(ctx),
	}
	err := s.typeRepo.Create(ctx, *dt)
	return dt, err
}

func (s *dictService) GetTypeByID(ctx context.Context, id string) (*DictTypeResponse, error) {
	dt, err := s.typeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToDictTypeResponse(&dt), nil
}

func (s *dictService) GetDataByID(ctx context.Context, id string) (*DictDataResponse, error) {
	dd, err := s.dataRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return ToDictDataResponse(&dd), nil
}

func (s *dictService) UpdateType(ctx context.Context, id string, req *DictTypeRequest) (*DictType, error) {
	dt, err := s.typeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	dt.Name = req.Name
	dt.Code = req.Code
	dt.Description = req.Description
	dt.Status = req.Status

	// 验证字典类型属于当前租户
	tenantID := getTenantID(ctx)
	if dt.TenantID != tenantID {
		return nil, fmt.Errorf("dict type not found in current tenant")
	}

	err = s.typeRepo.Update(ctx, dt)
	return &dt, err
}

func (s *dictService) DeleteType(ctx context.Context, id string) error {
	// 获取字典类型以验证租户所有权
	dt, err := s.typeRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// 验证字典类型是否在使用中
	if inUse, _ := s.typeRepo.IsInUse(ctx, id); inUse {
		return fmt.Errorf("dict type is in use")
	}

	// 验证字典类型属于当前租户
	tenantID := getTenantID(ctx)
	if dt.TenantID != tenantID {
		return fmt.Errorf("dict type not found in current tenant")
	}

	return s.typeRepo.Delete(ctx, id)
}

func (s *dictService) ListTypes(ctx context.Context, page, pageSize int, search string) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if search != "" {
		filters["name LIKE ?"] = "%" + search + "%"
	}

	dts, total, err := s.typeRepo.List(ctx, page, pageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*DictTypeResponse, len(dts))
	for i, dt := range dts {
		items[i] = ToDictTypeResponse(&dt)
	}

	return &PageResponse{
		Items:      items,
		Pagination: Pagination{Page: int64(page), PageSize: int64(pageSize), Total: total},
	}, nil
}

func (s *dictService) DeleteData(ctx context.Context, id string) error {
	// 获取字典数据以验证租户所有权
	dd, err := s.dataRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// 验证字典数据属于当前租户
	tenantID := getTenantID(ctx)
	if dd.TenantID != tenantID {
		return fmt.Errorf("dict data not found in current tenant")
	}

	return s.dataRepo.Delete(ctx, id)
}

func (s *dictService) ListData(ctx context.Context, page, pageSize int, typeID, search string) (*PageResponse, error) {
	filters := make(map[string]interface{})
	if typeID != "" {
		filters["type_id"] = typeID
	}
	if search != "" {
		filters["label LIKE ?"] = "%" + search + "%"
	}

	dds, total, err := s.dataRepo.List(ctx, page, pageSize, filters)
	if err != nil {
		return nil, err
	}

	items := make([]*DictDataResponse, len(dds))
	for i, v := range dds {
		items[i] = ToDictDataResponse(&v)
	}

	return &PageResponse{
		Items:      items,
		Pagination: Pagination{Page: int64(page), PageSize: int64(pageSize), Total: total},
	}, nil
}

func (s *dictService) GetDataByTypeCode(ctx context.Context, typeCode string) ([]*DictData, error) {
	dt, err := s.typeRepo.GetByCode(ctx, typeCode)
	if err != nil {
		return nil, err
	}
	data, _, err := s.dataRepo.GetByTypeID(ctx, dt.ID.String(), 1, 1000)
	return data, err
}

func getTenantID(ctx context.Context) string {
	if tid, ok := ctx.Value("tenant_id").(string); ok {
		return tid
	}
	return ""
}

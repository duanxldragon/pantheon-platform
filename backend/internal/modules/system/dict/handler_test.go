package dict

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

type stubDictService struct {
	createTypeFn        func(context.Context, *DictTypeRequest) (*DictType, error)
	getTypeByIDFn       func(context.Context, string) (*DictTypeResponse, error)
	updateTypeFn        func(context.Context, string, *DictTypeRequest) (*DictType, error)
	deleteTypeFn        func(context.Context, string) error
	listTypesFn         func(context.Context, int, int, string) (*PageResponse, error)
	createDataFn        func(context.Context, *DictDataRequest) (*DictData, error)
	getDataByIDFn       func(context.Context, string) (*DictDataResponse, error)
	updateDataFn        func(context.Context, string, *DictDataRequest) (*DictData, error)
	deleteDataFn        func(context.Context, string) error
	listDataFn          func(context.Context, int, int, string, string) (*PageResponse, error)
	getDataByTypeCodeFn func(context.Context, string) ([]*DictData, error)
}

func (s *stubDictService) CreateType(ctx context.Context, req *DictTypeRequest) (*DictType, error) {
	if s.createTypeFn != nil {
		return s.createTypeFn(ctx, req)
	}
	return nil, nil
}

func (s *stubDictService) GetTypeByID(ctx context.Context, id string) (*DictTypeResponse, error) {
	if s.getTypeByIDFn != nil {
		return s.getTypeByIDFn(ctx, id)
	}
	return nil, nil
}

func (s *stubDictService) UpdateType(ctx context.Context, id string, req *DictTypeRequest) (*DictType, error) {
	if s.updateTypeFn != nil {
		return s.updateTypeFn(ctx, id, req)
	}
	return nil, nil
}

func (s *stubDictService) DeleteType(ctx context.Context, id string) error {
	if s.deleteTypeFn != nil {
		return s.deleteTypeFn(ctx, id)
	}
	return nil
}

func (s *stubDictService) ListTypes(ctx context.Context, page, pageSize int, search string) (*PageResponse, error) {
	if s.listTypesFn != nil {
		return s.listTypesFn(ctx, page, pageSize, search)
	}
	return nil, nil
}

func (s *stubDictService) CreateData(ctx context.Context, req *DictDataRequest) (*DictData, error) {
	if s.createDataFn != nil {
		return s.createDataFn(ctx, req)
	}
	return nil, nil
}

func (s *stubDictService) GetDataByID(ctx context.Context, id string) (*DictDataResponse, error) {
	if s.getDataByIDFn != nil {
		return s.getDataByIDFn(ctx, id)
	}
	return nil, nil
}

func (s *stubDictService) UpdateData(ctx context.Context, id string, req *DictDataRequest) (*DictData, error) {
	if s.updateDataFn != nil {
		return s.updateDataFn(ctx, id, req)
	}
	return nil, nil
}

func (s *stubDictService) DeleteData(ctx context.Context, id string) error {
	if s.deleteDataFn != nil {
		return s.deleteDataFn(ctx, id)
	}
	return nil
}

func (s *stubDictService) ListData(ctx context.Context, page, pageSize int, typeID, search string) (*PageResponse, error) {
	if s.listDataFn != nil {
		return s.listDataFn(ctx, page, pageSize, typeID, search)
	}
	return nil, nil
}

func (s *stubDictService) GetDataByTypeCode(ctx context.Context, typeCode string) ([]*DictData, error) {
	if s.getDataByTypeCodeFn != nil {
		return s.getDataByTypeCodeFn(ctx, typeCode)
	}
	return nil, nil
}

func TestDeleteTypeReturnsConflictWhenTypeIsInUse(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewDictHandler(&stubDictService{
		deleteTypeFn: func(context.Context, string) error {
			return ErrDictTypeInUse
		},
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/dict/types/type-1", nil)
	ctx.Params = gin.Params{{Key: "id", Value: "type-1"}}

	handler.DeleteType(ctx)

	if recorder.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", recorder.Code)
	}
}

func TestUpdateTypeReturnsNotFoundWhenTypeIsOutOfScope(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewDictHandler(&stubDictService{
		updateTypeFn: func(context.Context, string, *DictTypeRequest) (*DictType, error) {
			return nil, ErrDictTypeNotFound
		},
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPut, "/dict/types/type-1", strings.NewReader(`{"name":"Status","code":"status","status":"active"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req
	ctx.Params = gin.Params{{Key: "id", Value: "type-1"}}

	handler.UpdateType(ctx)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}
}

func TestCreateDataReturnsNotFoundWhenTypeIsOutOfScope(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewDictHandler(&stubDictService{
		createDataFn: func(context.Context, *DictDataRequest) (*DictData, error) {
			return nil, ErrDictTypeNotFound
		},
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/dict/data", strings.NewReader(`{"type_id":"type-1","label":"Enabled","value":"enabled","status":"active"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	handler.CreateData(ctx)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}
}

func TestDeleteDataReturnsNotFoundWhenDataIsOutOfScope(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewDictHandler(&stubDictService{
		deleteDataFn: func(context.Context, string) error {
			return ErrDictDataNotFound
		},
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/dict/data/data-1", nil)
	ctx.Params = gin.Params{{Key: "id", Value: "data-1"}}

	handler.DeleteData(ctx)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}
}

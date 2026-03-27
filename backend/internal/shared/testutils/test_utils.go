package testutils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRequest represents a test HTTP request.
type TestRequest struct {
	Method      string
	Path        string
	Body        interface{}
	Headers     map[string]string
	QueryParams map[string]string
}

// TestResponse represents a captured HTTP response.
type TestResponse struct {
	StatusCode int
	Body       []byte
	Headers    http.Header
}

// JSONResponse matches the common API response envelope used by this project.
type JSONResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Meta    interface{} `json:"meta,omitempty"`
}

func MakeRequest(handler http.Handler, req TestRequest) (*TestResponse, error) {
	w := httptest.NewRecorder()

	var bodyReader io.Reader
	if req.Body != nil {
		body, err := json.Marshal(req.Body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewReader(body)
	}

	httpReq := httptest.NewRequest(req.Method, req.Path, bodyReader)

	if len(req.QueryParams) > 0 {
		query := make([]string, 0, len(req.QueryParams))
		for k, v := range req.QueryParams {
			query = append(query, fmt.Sprintf("%s=%s", k, v))
		}
		httpReq.URL.RawQuery = strings.Join(query, "&")
	}

	if req.Body != nil {
		httpReq.Header.Set("Content-Type", "application/json")
	}
	for k, v := range req.Headers {
		httpReq.Header.Set(k, v)
	}

	handler.ServeHTTP(w, httpReq)

	return &TestResponse{
		StatusCode: w.Code,
		Body:       w.Body.Bytes(),
		Headers:    w.Header(),
	}, nil
}

func AssertSuccess(t *testing.T, resp *TestResponse) {
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	var jsonResp JSONResponse
	require.NoError(t, json.Unmarshal(resp.Body, &jsonResp))
	assert.Equal(t, 0, jsonResp.Code)
	assert.Equal(t, "success", jsonResp.Message)
}

func AssertError(t *testing.T, resp *TestResponse, expectedHTTPStatus int, expectedCode string) {
	assert.Equal(t, expectedHTTPStatus, resp.StatusCode)
	var jsonResp map[string]interface{}
	require.NoError(t, json.Unmarshal(resp.Body, &jsonResp))
	if code, ok := jsonResp["code"].(string); ok {
		assert.Equal(t, expectedCode, code)
	}
}

func AssertContentType(t *testing.T, resp *TestResponse, expected string) {
	ct := resp.Headers.Get("Content-Type")
	if ct == "" {
		t.Fatalf("missing Content-Type header")
	}
	assert.Contains(t, ct, expected)
}

// AssertJSONContains verifies that a json response contains a value at the given dot-separated key path.
// This is a shallow helper and does not support arrays.
func AssertJSONContains(t *testing.T, resp *TestResponse, keyPath string, expectedValue interface{}) {
	var jsonResp map[string]interface{}
	require.NoError(t, json.Unmarshal(resp.Body, &jsonResp))

	keys := strings.Split(keyPath, ".")
	var current interface{} = jsonResp
	for _, k := range keys {
		obj, ok := current.(map[string]interface{})
		if !ok {
			t.Fatalf("key path %s not found", keyPath)
		}
		next, exists := obj[k]
		if !exists {
			t.Fatalf("key path %s not found", keyPath)
		}
		current = next
	}
	assert.Equal(t, expectedValue, current)
}

// UserTestData is a helper model for test input.
type UserTestData struct {
	ID           string `json:"id"`
	Username     string `json:"username"`
	RealName     string `json:"real_name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Status       string `json:"status"`
	DepartmentID string `json:"department_id"`
	PositionID   string `json:"position_id"`
}

func GenerateValidUser() UserTestData {
	return UserTestData{
		ID:           "123",
		Username:     "testuser",
		RealName:     "Test User",
		Email:        "test@example.com",
		Phone:        "13800138000",
		Status:       "active",
		DepartmentID: "",
		PositionID:   "",
	}
}


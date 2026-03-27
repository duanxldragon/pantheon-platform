package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	systemlog "pantheon-platform/backend/internal/modules/system/log"
	"pantheon-platform/backend/internal/shared/audit"
)

type operationAuditMeta struct {
	Module       string
	Resource     string
	ResourceID   string
	ResourceName string
	Summary      string
	Detail       string
}

// OperationLog persists operation logs to DB (best-effort).
// It relies on tenant middleware to have injected tenant_id/tenant_db into request context.
func OperationLog(logSvc systemlog.LogService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if logSvc == nil {
			c.Next()
			return
		}

		path := c.Request.URL.Path
		if path == "/health" || path == "/ping" || strings.HasPrefix(path, "/swagger/") {
			c.Next()
			return
		}
		if strings.HasPrefix(path, "/api/v1/auth/") {
			c.Next()
			return
		}

		method := strings.ToUpper(c.Request.Method)
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			c.Next()
			return
		}

		start := time.Now()
		ctxWithAudit, _ := audit.WithOperationContext(c.Request.Context())
		c.Request = c.Request.WithContext(ctxWithAudit)

		var requestBody []byte
		var requestPayload interface{}
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
			if len(requestBody) > 0 {
				_ = json.Unmarshal(requestBody, &requestPayload)
			}
		}

		rw := &responseBodyWriter{
			ResponseWriter: c.Writer,
			body:           &bytes.Buffer{},
		}
		c.Writer = rw

		c.Next()

		userID := c.GetString("user_id")
		username := c.GetString("username")
		if userID == "" && username == "" {
			return
		}

		status := c.Writer.Status()
		latency := time.Since(start)

		var responsePayload interface{}
		if rw.body.Len() > 0 {
			_ = json.Unmarshal(rw.body.Bytes(), &responsePayload)
		}

		reqText := stringifyAuditBody(requestBody, requestPayload)
		respText := stringifyAuditBody(rw.body.Bytes(), responsePayload)

		meta := buildOperationAuditMeta(path, method, c.Param("id"), requestPayload, responsePayload)
		meta = mergeOperationAuditMeta(meta, audit.FromContext(c.Request.Context()))
		errorMessage := extractOperationErrorMessage(status, c.Errors.String(), responsePayload)

		entry := &systemlog.OperationLog{
			ID:            uuid.New(),
			UserID:        userID,
			Username:      username,
			Module:        meta.Module,
			Resource:      meta.Resource,
			ResourceID:    meta.ResourceID,
			ResourceName:  meta.ResourceName,
			Action:        method,
			Summary:       meta.Summary,
			Detail:        meta.Detail,
			Path:          path,
			Method:        method,
			IP:            c.ClientIP(),
			Status:        status,
			Request:       reqText,
			Response:      respText,
			ErrorMessage:  errorMessage,
			ExecutionTime: latency.Milliseconds(),
			CreatedAt:     time.Now(),
		}

		_ = logSvc.CreateOperationLog(c.Request.Context(), entry)
	}
}

func mergeOperationAuditMeta(base operationAuditMeta, collector *audit.OperationContext) operationAuditMeta {
	if collector == nil {
		return base
	}

	fields := collector.Fields()
	if fields.Module != "" {
		base.Module = fields.Module
	}
	if fields.Resource != "" {
		base.Resource = fields.Resource
	}
	if fields.ResourceID != "" {
		base.ResourceID = fields.ResourceID
	}
	if fields.ResourceName != "" {
		base.ResourceName = fields.ResourceName
	}
	if fields.Summary != "" {
		base.Summary = fields.Summary
	}
	if fields.Detail != "" {
		base.Detail = fields.Detail
	}

	return base
}

func stringifyAuditBody(raw []byte, payload interface{}) string {
	if len(raw) == 0 {
		return ""
	}
	if payload == nil {
		return limitString(string(raw), 4096)
	}
	maskedBytes, err := json.Marshal(maskSensitiveFields(payload))
	if err != nil {
		return limitString(string(raw), 4096)
	}
	return limitString(string(maskedBytes), 4096)
}

func buildOperationAuditMeta(path, method, routeID string, requestPayload, responsePayload interface{}) operationAuditMeta {
	segments := pathSegments(path)
	module := moduleFromSegments(segments)
	resource := resourceFromSegments(segments)
	responseData := unwrapResponseData(responsePayload)

	resourceID := firstNonEmpty(
		strings.TrimSpace(routeID),
		extractString(requestPayload, "id"),
		extractString(responseData, "id"),
		extractPathID(path),
	)
	resourceName := firstNonEmpty(
		extractPrimaryName(requestPayload),
		extractPrimaryName(responseData),
	)

	summary := buildOperationSummary(resource, method, segments, resourceName, resourceID, requestPayload)
	detail := buildOperationDetail(resource, segments, resourceID, resourceName, requestPayload)

	return operationAuditMeta{
		Module:       module,
		Resource:     resource,
		ResourceID:   resourceID,
		ResourceName: resourceName,
		Summary:      summary,
		Detail:       detail,
	}
}

func moduleFromSegments(segments []string) string {
	if len(segments) == 0 {
		return "unknown"
	}
	if len(segments) == 1 {
		return segments[0]
	}
	return segments[0] + "/" + segments[1]
}

func resourceFromSegments(segments []string) string {
	if len(segments) < 2 {
		return "unknown"
	}

	if segments[0] != "system" {
		if len(segments) >= 2 {
			return strings.Join(segments[:2], "_")
		}
		return segments[0]
	}

	switch segments[1] {
	case "users":
		if hasSegment(segments, "batch-delete") {
			return "user_batch_delete"
		}
		if hasSegment(segments, "status") {
			return "user_status"
		}
		if hasSegment(segments, "password") {
			return "user_password"
		}
		if hasSegment(segments, "upload") {
			return "user_avatar"
		}
		return "user"
	case "depts":
		return "department"
	case "positions":
		return "position"
	case "roles":
		if hasSegment(segments, "permissions") {
			return "role_permission"
		}
		if hasSegment(segments, "menus") {
			return "role_menu"
		}
		return "role"
	case "permissions":
		return "permission"
	case "menus":
		return "menu"
	case "dict":
		return "dictionary"
	case "logs":
		if hasSegment(segments, "operation") {
			return "operation_log"
		}
		if hasSegment(segments, "login") {
			return "login_log"
		}
		return "log"
	case "settings":
		return "setting"
	case "monitor":
		return "monitor"
	default:
		return segments[1]
	}
}

func buildOperationSummary(resource, method string, segments []string, resourceName, resourceID string, requestPayload interface{}) string {
	target := targetText(resourceName, resourceID)

	switch resource {
	case "role_permission":
		count := len(extractStringList(requestPayload, "permission_ids"))
		return fmt.Sprintf("为角色%s分配 %d 项权限", target, count)
	case "role_menu":
		count := len(extractStringList(requestPayload, "menu_ids"))
		return fmt.Sprintf("为角色%s分配 %d 个菜单", target, count)
	case "user_batch_delete":
		count := len(extractStringList(requestPayload, "user_ids"))
		return fmt.Sprintf("批量删除 %d 个用户", count)
	case "user_status":
		count := len(extractStringList(requestPayload, "user_ids"))
		statusText := userStatusText(extractString(requestPayload, "status"))
		return fmt.Sprintf("批量将 %d 个用户设置为%s", count, statusText)
	case "user_password":
		return fmt.Sprintf("重置用户%s密码", target)
	case "operation_log":
		return "清理操作日志"
	case "login_log":
		return "清理登录日志"
	}

	verb := methodVerb(method)
	label := resourceLabel(resource)
	if target == "" {
		return fmt.Sprintf("%s%s", verb, label)
	}
	return fmt.Sprintf("%s%s%s", verb, label, target)
}

func buildOperationDetail(resource string, segments []string, resourceID, resourceName string, requestPayload interface{}) string {
	details := make([]string, 0, 6)

	if resourceID != "" {
		details = append(details, "资源ID="+resourceID)
	}
	if resourceName != "" {
		details = append(details, "资源名称="+resourceName)
	}

	switch resource {
	case "role_permission":
		details = append(details, fmt.Sprintf("权限数量=%d", len(extractStringList(requestPayload, "permission_ids"))))
	case "role_menu":
		details = append(details, fmt.Sprintf("菜单数量=%d", len(extractStringList(requestPayload, "menu_ids"))))
	case "user_batch_delete":
		details = append(details, fmt.Sprintf("用户数量=%d", len(extractStringList(requestPayload, "user_ids"))))
	case "user_status":
		details = append(details, fmt.Sprintf("用户数量=%d", len(extractStringList(requestPayload, "user_ids"))))
		if status := extractString(requestPayload, "status"); status != "" {
			details = append(details, "目标状态="+status)
		}
	case "user":
		if username := extractString(requestPayload, "username"); username != "" {
			details = append(details, "用户名="+username)
		}
		if realName := extractString(requestPayload, "real_name"); realName != "" {
			details = append(details, "姓名="+realName)
		}
	case "role", "permission", "menu", "department", "position":
		if code := extractString(requestPayload, "code"); code != "" {
			details = append(details, "编码="+code)
		}
		if status := extractString(requestPayload, "status"); status != "" {
			details = append(details, "状态="+status)
		}
	case "setting":
		if key := extractString(requestPayload, "key"); key != "" {
			details = append(details, "配置Key="+key)
		}
	}

	if len(details) == 0 && len(segments) > 0 {
		details = append(details, "资源路径="+strings.Join(segments, "/"))
	}

	return strings.Join(details, "；")
}

func extractOperationErrorMessage(status int, ginErrors string, responsePayload interface{}) string {
	if strings.TrimSpace(ginErrors) != "" {
		return limitString(strings.TrimSpace(ginErrors), 1024)
	}
	if status < 400 {
		return ""
	}

	candidates := []string{
		extractString(responsePayload, "message"),
		extractString(responsePayload, "details"),
		extractString(responsePayload, "error"),
		extractString(unwrapResponseData(responsePayload), "message"),
	}
	for _, candidate := range candidates {
		if strings.TrimSpace(candidate) != "" {
			return limitString(strings.TrimSpace(candidate), 1024)
		}
	}

	if payloadMap, ok := responsePayload.(map[string]interface{}); ok {
		if errorsVal, exists := payloadMap["errors"]; exists {
			if encoded, err := json.Marshal(errorsVal); err == nil {
				return limitString(string(encoded), 1024)
			}
		}
	}

	return ""
}

func methodVerb(method string) string {
	switch strings.ToUpper(method) {
	case "POST":
		return "创建"
	case "PUT", "PATCH":
		return "更新"
	case "DELETE":
		return "删除"
	default:
		return "执行"
	}
}

func resourceLabel(resource string) string {
	switch resource {
	case "user":
		return "用户"
	case "user_status":
		return "用户状态"
	case "user_password":
		return "用户密码"
	case "user_avatar":
		return "用户头像"
	case "user_batch_delete":
		return "用户"
	case "department":
		return "部门"
	case "position":
		return "岗位"
	case "role":
		return "角色"
	case "role_permission":
		return "角色权限"
	case "role_menu":
		return "角色菜单"
	case "permission":
		return "权限"
	case "menu":
		return "菜单"
	case "dictionary":
		return "字典"
	case "operation_log":
		return "操作日志"
	case "login_log":
		return "登录日志"
	case "setting":
		return "系统设置"
	case "monitor":
		return "系统监控"
	default:
		return "资源"
	}
}

func targetText(resourceName, resourceID string) string {
	if resourceName != "" {
		return "「" + resourceName + "」"
	}
	if resourceID != "" {
		return "（ID: " + resourceID + "）"
	}
	return ""
}

func userStatusText(status string) string {
	switch status {
	case "active":
		return "启用"
	case "inactive":
		return "停用"
	case "locked":
		return "锁定"
	default:
		if status == "" {
			return "目标状态"
		}
		return status
	}
}

func extractPrimaryName(payload interface{}) string {
	keys := []string{"name", "username", "real_name", "title", "code", "key"}
	for _, key := range keys {
		if value := extractString(payload, key); value != "" {
			return value
		}
	}
	return ""
}

func extractString(payload interface{}, key string) string {
	value, ok := extractValue(payload, key)
	if !ok || value == nil {
		return ""
	}
	switch v := value.(type) {
	case string:
		return strings.TrimSpace(v)
	case float64:
		if v == float64(int64(v)) {
			return strconv.FormatInt(int64(v), 10)
		}
		return strconv.FormatFloat(v, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(v)
	default:
		return strings.TrimSpace(fmt.Sprintf("%v", v))
	}
}

func extractStringList(payload interface{}, key string) []string {
	value, ok := extractValue(payload, key)
	if !ok || value == nil {
		return nil
	}

	switch list := value.(type) {
	case []string:
		return list
	case []interface{}:
		result := make([]string, 0, len(list))
		for _, item := range list {
			switch v := item.(type) {
			case string:
				if strings.TrimSpace(v) != "" {
					result = append(result, strings.TrimSpace(v))
				}
			case float64:
				result = append(result, strconv.FormatFloat(v, 'f', -1, 64))
			}
		}
		return result
	default:
		return nil
	}
}

func extractValue(payload interface{}, key string) (interface{}, bool) {
	if payload == nil {
		return nil, false
	}
	if payloadMap, ok := payload.(map[string]interface{}); ok {
		value, exists := payloadMap[key]
		if exists {
			return value, true
		}
	}
	return nil, false
}

func unwrapResponseData(payload interface{}) interface{} {
	if payloadMap, ok := payload.(map[string]interface{}); ok {
		if data, exists := payloadMap["data"]; exists {
			return data
		}
	}
	return payload
}

func pathSegments(path string) []string {
	trimmed := strings.Trim(path, "/")
	if !strings.HasPrefix(trimmed, "api/v1/") {
		if trimmed == "" {
			return nil
		}
		return strings.Split(trimmed, "/")
	}

	raw := strings.Split(strings.TrimPrefix(trimmed, "api/v1/"), "/")
	segments := make([]string, 0, len(raw))
	for _, segment := range raw {
		if segment == "" || isIDSegment(segment) {
			continue
		}
		segments = append(segments, segment)
	}
	return segments
}

func extractPathID(path string) string {
	trimmed := strings.Trim(strings.TrimPrefix(path, "/api/v1/"), "/")
	if trimmed == "" {
		return ""
	}
	for _, segment := range strings.Split(trimmed, "/") {
		if isIDSegment(segment) {
			return segment
		}
	}
	return ""
}

func isIDSegment(segment string) bool {
	if segment == "" {
		return false
	}
	if _, err := uuid.Parse(segment); err == nil {
		return true
	}
	_, err := strconv.ParseInt(segment, 10, 64)
	return err == nil
}

func hasSegment(segments []string, target string) bool {
	for _, segment := range segments {
		if segment == target {
			return true
		}
	}
	return false
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func limitString(s string, max int) string {
	if max <= 0 || len(s) <= max {
		return s
	}
	return s[:max]
}

package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// EnhancedLogger logs structured request metadata and masked payloads.
func EnhancedLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		if path == "/health" || path == "/ping" {
			c.Next()
			return
		}

		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		responseWriter := &responseBodyWriter{
			ResponseWriter: c.Writer,
			body:           &bytes.Buffer{},
		}
		c.Writer = responseWriter

		c.Next()

		latency := time.Since(start)
		clientIP := c.ClientIP()
		statusCode := c.Writer.Status()

		log.Printf(
			`{"request_id":"%s","timestamp":"%s","method":"%s","path":"%s","query":"%s","status":%d,"latency":"%s","client_ip":"%s","user_agent":"%s","size":%d}`,
			requestID,
			time.Now().Format(time.RFC3339),
			c.Request.Method,
			path,
			raw,
			statusCode,
			latency.String(),
			clientIP,
			c.Request.UserAgent(),
			c.Writer.Size(),
		)

		if len(requestBody) > 0 && !strings.Contains(path, "auth") {
			var reqBody interface{}
			if err := json.Unmarshal(requestBody, &reqBody); err == nil {
				maskedBody := maskSensitiveFields(reqBody)
				if maskedBodyBytes, err := json.Marshal(maskedBody); err == nil {
					log.Printf(
						`{"request_id":"%s","type":"request_body","data":%s}`,
						requestID,
						string(maskedBodyBytes),
					)
				}
			}
		}

		if len(c.Errors) > 0 {
			log.Printf(
				`{"request_id":"%s","type":"errors","data":"%s"}`,
				requestID,
				c.Errors.String(),
			)
		}
	}
}

// responseBodyWriter captures response payloads while delegating writes.
type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (r *responseBodyWriter) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

// maskSensitiveFields recursively masks sensitive keys in JSON-like data.
func maskSensitiveFields(data interface{}) interface{} {
	sensitiveFields := []string{
		"password",
		"token",
		"secret",
		"key",
		"authorization",
	}

	switch value := data.(type) {
	case map[string]interface{}:
		result := make(map[string]interface{})
		for key, item := range value {
			if isSensitiveField(key, sensitiveFields) {
				result[key] = "***"
			} else {
				result[key] = maskSensitiveFields(item)
			}
		}
		return result
	case []interface{}:
		result := make([]interface{}, len(value))
		for index, item := range value {
			result[index] = maskSensitiveFields(item)
		}
		return result
	default:
		return value
	}
}

// isSensitiveField reports whether a key should be masked.
func isSensitiveField(field string, sensitiveFields []string) bool {
	fieldLower := strings.ToLower(field)
	for _, sensitive := range sensitiveFields {
		if strings.Contains(fieldLower, strings.ToLower(sensitive)) {
			return true
		}
	}
	return false
}

package log

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

type LogHandler struct {
	service LogService
}

func NewLogHandler(service LogService) *LogHandler {
	return &LogHandler{service: service}
}

// parseLogFilter builds a log filter from query parameters.
func parseLogFilter(c *gin.Context) *LogFilter {
	f := &LogFilter{
		Username: c.Query("username"),
		Module:   c.Query("module"),
		Action:   c.Query("action"),
		Status:   c.Query("status"),
	}

	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			f.StartDate = &t
		}
	}
	if s := c.Query("end_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			// Include the end of the selected day.
			end := t.Add(24*time.Hour - time.Nanosecond)
			f.EndDate = &end
		}
	}

	return f
}

func (h *LogHandler) ListOperationLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 500 {
		pageSize = 20
	}

	filter := parseLogFilter(c)
	resp, err := h.service.ListOperationLogs(c.Request.Context(), page, pageSize, filter)
	if err != nil {
		response.InternalError(c, "LIST_OPERATION_LOGS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

func (h *LogHandler) ClearOperationLogs(c *gin.Context) {
	filter := parseLogFilter(c)
	if err := h.service.ClearOperationLogs(c.Request.Context(), filter.StartDate, filter.EndDate); err != nil {
		response.InternalError(c, "CLEAR_OPERATION_LOGS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

func (h *LogHandler) ClearLoginLogs(c *gin.Context) {
	filter := parseLogFilter(c)
	if err := h.service.ClearLoginLogs(c.Request.Context(), filter.StartDate, filter.EndDate); err != nil {
		response.InternalError(c, "CLEAR_LOGIN_LOGS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "ok"})
}

func (h *LogHandler) ListLoginLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 500 {
		pageSize = 20
	}

	filter := parseLogFilter(c)
	resp, err := h.service.ListLoginLogs(c.Request.Context(), page, pageSize, filter)
	if err != nil {
		response.InternalError(c, "LIST_LOGIN_LOGS_FAILED", err.Error())
		return
	}
	response.Success(c, resp)
}

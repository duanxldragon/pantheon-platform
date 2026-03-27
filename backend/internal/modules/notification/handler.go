package notification

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"pantheon-platform/backend/internal/shared/middleware"
	"pantheon-platform/backend/internal/shared/response"
)

type NotificationHandler struct {
	svc NotificationService
}

func NewNotificationHandler(svc NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) CreateNotification(c *gin.Context) {
	var req NotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	n := &Notification{
		TenantID:    c.GetString("tenant_id"),
		Title:       req.Title,
		Content:     req.Content,
		Channel:     NotificationChannel(req.Channel),
		Priority:    NotificationPriority(req.Priority),
		ReceiverIDs: req.ReceiverIDs,
		ExtraData:   req.ExtraData,
		Status:      StatusDraft,
	}

	if senderID, ok := middleware.GetUserID(c); ok {
		if parsed, err := uuidFromString(senderID); err == nil && parsed != nil {
			n.SenderID = parsed
		}
	}

	if req.TemplateID != "" {
		if parsed, err := uuidFromString(req.TemplateID); err == nil && parsed != nil {
			n.TemplateID = parsed
		}
	}

	if req.ExpireAt != "" {
		if t, err := time.Parse(time.RFC3339, req.ExpireAt); err == nil {
			n.ExpireAt = &t
		}
	}

	if err := h.svc.CreateNotification(c.Request.Context(), n); err != nil {
		response.InternalError(c, "CREATE_FAILED", err.Error())
		return
	}
	response.Success(c, ToNotificationResponse(n))
}

func (h *NotificationHandler) GetNotification(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "INVALID_ID", "Notification ID is required")
		return
	}
	n, err := h.svc.GetNotification(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "NOT_FOUND", "Notification not found")
		return
	}
	response.Success(c, ToNotificationResponse(n))
}

func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	var req NotificationListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}
	items, total, err := h.svc.ListNotifications(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "LIST_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{
		"items":     ToNotificationResponses(items),
		"total":     total,
		"page":      req.Page,
		"page_size": req.PageSize,
	})
}

func (h *NotificationHandler) UpdateNotification(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "INVALID_ID", "Notification ID is required")
		return
	}
	var req NotificationUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	update := &Notification{
		Title:     req.Title,
		Content:   req.Content,
		ExtraData: "",
	}
	if req.Priority != "" {
		update.Priority = NotificationPriority(req.Priority)
	}
	if req.ExpireAt != "" {
		if t, err := time.Parse(time.RFC3339, req.ExpireAt); err == nil {
			update.ExpireAt = &t
		}
	}

	if err := h.svc.UpdateNotification(c.Request.Context(), id, update); err != nil {
		response.InternalError(c, "UPDATE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Notification updated successfully"})
}

func (h *NotificationHandler) DeleteNotification(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "INVALID_ID", "Notification ID is required")
		return
	}
	if err := h.svc.DeleteNotification(c.Request.Context(), id); err != nil {
		response.InternalError(c, "DELETE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Notification deleted successfully"})
}

func (h *NotificationHandler) ListInbox(c *gin.Context) {
	receiverID := c.GetString("user_id")
	if receiverID == "" {
		response.BadRequest(c, "MISSING_USER_ID", "User ID is required")
		return
	}
	var req InboxListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}
	items, total, err := h.svc.ListInbox(c.Request.Context(), receiverID, &req)
	if err != nil {
		response.InternalError(c, "LIST_INBOX_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{
		"items":     ToInboxResponses(items),
		"total":     total,
		"page":      req.Page,
		"page_size": req.PageSize,
	})
}

func (h *NotificationHandler) GetInbox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "INVALID_ID", "Inbox ID is required")
		return
	}
	inbox, err := h.svc.GetInbox(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "NOT_FOUND", "Inbox record not found")
		return
	}
	response.Success(c, ToInboxResponse(inbox, inbox.NotificationRef))
}

func (h *NotificationHandler) DeleteInbox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "INVALID_ID", "Inbox ID is required")
		return
	}
	if err := h.svc.DeleteInbox(c.Request.Context(), id); err != nil {
		response.InternalError(c, "DELETE_INBOX_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Inbox deleted successfully"})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	receiverID := c.GetString("user_id")
	if receiverID == "" {
		response.BadRequest(c, "MISSING_USER_ID", "User ID is required")
		return
	}
	var req MarkAsReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}
	if len(req.IDs) == 0 {
		response.BadRequest(c, "INVALID_IDS", "IDs array is required and should not be empty")
		return
	}
	if err := h.svc.MarkAsRead(c.Request.Context(), receiverID, req.IDs); err != nil {
		response.InternalError(c, "MARK_READ_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Marked as read successfully", "count": len(req.IDs)})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	receiverID := c.GetString("user_id")
	if receiverID == "" {
		response.BadRequest(c, "MISSING_USER_ID", "User ID is required")
		return
	}
	if err := h.svc.MarkAllAsRead(c.Request.Context(), receiverID); err != nil {
		response.InternalError(c, "MARK_ALL_READ_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Marked all as read successfully"})
}

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	receiverID := c.GetString("user_id")
	if receiverID == "" {
		response.BadRequest(c, "MISSING_USER_ID", "User ID is required")
		return
	}
	count, err := h.svc.GetUnreadCount(c.Request.Context(), receiverID)
	if err != nil {
		response.InternalError(c, "GET_UNREAD_COUNT_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"count": count})
}

func (h *NotificationHandler) GetStats(c *gin.Context) {
	receiverID := c.GetString("user_id")
	if receiverID == "" {
		response.BadRequest(c, "MISSING_USER_ID", "User ID is required")
		return
	}
	stats, err := h.svc.GetStats(c.Request.Context(), receiverID)
	if err != nil {
		response.InternalError(c, "GET_STATS_FAILED", err.Error())
		return
	}
	response.Success(c, ToNotificationStatsResponse(stats))
}

func (h *NotificationHandler) CreateTemplate(c *gin.Context) {
	var req TemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}

	t := &NotificationTemplate{
		TenantID:    c.GetString("tenant_id"),
		Name:        req.Name,
		Code:        req.Code,
		Channel:     NotificationChannel(req.Channel),
		Subject:     req.Subject,
		Content:     req.Content,
		Description: req.Description,
		IsActive:    req.IsActive == nil || *req.IsActive,
		Variables:   req.Variables,
	}
	if err := h.svc.CreateTemplate(c.Request.Context(), t); err != nil {
		response.InternalError(c, "CREATE_TEMPLATE_FAILED", err.Error())
		return
	}
	response.Success(c, ToTemplateResponse(t))
}

func (h *NotificationHandler) GetTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "INVALID_ID", "Template ID is required")
		return
	}
	t, err := h.svc.GetTemplate(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "NOT_FOUND", "Template not found")
		return
	}
	response.Success(c, ToTemplateResponse(t))
}

func (h *NotificationHandler) ListTemplates(c *gin.Context) {
	var req TemplateListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}
	items, total, err := h.svc.ListTemplates(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "LIST_TEMPLATES_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{
		"items":     ToTemplateResponses(items),
		"total":     total,
		"page":      req.Page,
		"page_size": req.PageSize,
	})
}

func (h *NotificationHandler) UpdateTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "INVALID_ID", "Template ID is required")
		return
	}
	var req TemplateUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}
	update := &NotificationTemplate{
		Name:        req.Name,
		Subject:     req.Subject,
		Content:     req.Content,
		Description: req.Description,
		Variables:   req.Variables,
	}
	if req.IsActive != nil {
		update.IsActive = *req.IsActive
	}
	if err := h.svc.UpdateTemplate(c.Request.Context(), id, update); err != nil {
		response.InternalError(c, "UPDATE_TEMPLATE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Template updated successfully"})
}

func (h *NotificationHandler) DeleteTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "INVALID_ID", "Template ID is required")
		return
	}
	if err := h.svc.DeleteTemplate(c.Request.Context(), id); err != nil {
		response.InternalError(c, "DELETE_TEMPLATE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Template deleted successfully"})
}

func (h *NotificationHandler) SendFromTemplate(c *gin.Context) {
	var req SendNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}
	n, err := h.svc.SendFromTemplate(c.Request.Context(), &req)
	if err != nil {
		response.BadRequest(c, "SEND_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{
		"message":      "Notification sent successfully",
		"notification": ToNotificationResponse(n),
	})
}

// SendNotification sends an existing notification by ID.
// Request body: { "id": "<uuid>" }
func (h *NotificationHandler) SendNotification(c *gin.Context) {
	var body struct {
		ID string `json:"id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}
	n, err := h.svc.GetNotification(c.Request.Context(), body.ID)
	if err != nil {
		response.NotFound(c, "NOT_FOUND", "Notification not found")
		return
	}
	if err := h.svc.Send(c.Request.Context(), n); err != nil {
		response.InternalError(c, "SEND_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Notification sent successfully"})
}

func (h *NotificationHandler) ProcessJobs(c *gin.Context) {
	var req ProcessJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request parameters")
		return
	}
	limit := req.Limit
	if limit == 0 {
		limit = 10
	}
	jobs, err := h.svc.ProcessPendingJobs(c.Request.Context(), limit)
	if err != nil {
		response.InternalError(c, "PROCESS_QUEUE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{
		"count": len(jobs),
		"jobs":  ToNotificationJobResponses(jobs),
	})
}
func uuidFromString(s string) (*uuid.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

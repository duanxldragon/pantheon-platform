package notification

import "pantheon-platform/backend/internal/shared/response"

type notificationListData struct {
	Items    []*NotificationResponse `json:"items"`
	Total    int64                   `json:"total" example:"2"`
	Page     int                     `json:"page" example:"1"`
	PageSize int                     `json:"page_size" example:"20"`
}
type inboxListData struct {
	Items    []*InboxResponse `json:"items"`
	Total    int64            `json:"total" example:"2"`
	Page     int              `json:"page" example:"1"`
	PageSize int              `json:"page_size" example:"20"`
}
type templateListData struct {
	Items    []*TemplateResponse `json:"items"`
	Total    int64               `json:"total" example:"2"`
	Page     int                 `json:"page" example:"1"`
	PageSize int                 `json:"page_size" example:"20"`
}
type notificationMessageData struct {
	Message string `json:"message" example:"success"`
}
type notificationMarkReadData struct {
	Message string `json:"message" example:"success"`
	Count   int    `json:"count" example:"2"`
}
type notificationCountData struct {
	Count int64 `json:"count" example:"2"`
}
type notificationSendResultData struct {
	Message      string                `json:"message" example:"success"`
	Notification *NotificationResponse `json:"notification,omitempty"`
}
type notificationProcessJobsData struct {
	Count int                        `json:"count" example:"2"`
	Jobs  []*NotificationJobResponse `json:"jobs"`
}
type notificationEnvelope struct {
	Code      int                   `json:"code" example:"0"`
	Message   string                `json:"message" example:"success"`
	Data      *NotificationResponse `json:"data"`
	Meta      *response.Meta        `json:"meta,omitempty"`
	Timestamp string                `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type notificationListEnvelope struct {
	Code      int                  `json:"code" example:"0"`
	Message   string               `json:"message" example:"success"`
	Data      notificationListData `json:"data"`
	Meta      *response.Meta       `json:"meta,omitempty"`
	Timestamp string               `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type inboxEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      *InboxResponse `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type inboxListEnvelope struct {
	Code      int            `json:"code" example:"0"`
	Message   string         `json:"message" example:"success"`
	Data      inboxListData  `json:"data"`
	Meta      *response.Meta `json:"meta,omitempty"`
	Timestamp string         `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type templateEnvelope struct {
	Code      int               `json:"code" example:"0"`
	Message   string            `json:"message" example:"success"`
	Data      *TemplateResponse `json:"data"`
	Meta      *response.Meta    `json:"meta,omitempty"`
	Timestamp string            `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type templateListEnvelope struct {
	Code      int              `json:"code" example:"0"`
	Message   string           `json:"message" example:"success"`
	Data      templateListData `json:"data"`
	Meta      *response.Meta   `json:"meta,omitempty"`
	Timestamp string           `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type notificationStatsEnvelope struct {
	Code      int                        `json:"code" example:"0"`
	Message   string                     `json:"message" example:"success"`
	Data      *NotificationStatsResponse `json:"data"`
	Meta      *response.Meta             `json:"meta,omitempty"`
	Timestamp string                     `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type notificationCountEnvelope struct {
	Code      int                   `json:"code" example:"0"`
	Message   string                `json:"message" example:"success"`
	Data      notificationCountData `json:"data"`
	Meta      *response.Meta        `json:"meta,omitempty"`
	Timestamp string                `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type notificationMessageEnvelope struct {
	Code      int                     `json:"code" example:"0"`
	Message   string                  `json:"message" example:"success"`
	Data      notificationMessageData `json:"data"`
	Meta      *response.Meta          `json:"meta,omitempty"`
	Timestamp string                  `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type notificationMarkReadEnvelope struct {
	Code      int                      `json:"code" example:"0"`
	Message   string                   `json:"message" example:"success"`
	Data      notificationMarkReadData `json:"data"`
	Meta      *response.Meta           `json:"meta,omitempty"`
	Timestamp string                   `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type notificationSendResultEnvelope struct {
	Code      int                        `json:"code" example:"0"`
	Message   string                     `json:"message" example:"success"`
	Data      notificationSendResultData `json:"data"`
	Meta      *response.Meta             `json:"meta,omitempty"`
	Timestamp string                     `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}
type notificationProcessJobsEnvelope struct {
	Code      int                         `json:"code" example:"0"`
	Message   string                      `json:"message" example:"success"`
	Data      notificationProcessJobsData `json:"data"`
	Meta      *response.Meta              `json:"meta,omitempty"`
	Timestamp string                      `json:"timestamp" example:"2026-03-30T12:00:00Z"`
}

// CreateNotificationDoc godoc
// @Summary Create Notification
// @Description Create a notification record.
// @Tags Notification
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body NotificationRequest true "Notification payload"
// @Success 200 {object} notificationEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications [post]
func CreateNotificationDoc() {}

// ListNotificationsDoc godoc
// @Summary List Notifications
// @Description Get notification list.
// @Tags Notification
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param tenantId query string false "Tenant ID filter"
// @Param channel query string false "Notification channel filter" Enums(system,email,sms,inbox)
// @Param status query string false "Notification status filter" Enums(draft,queued,processing,sent,failed)
// @Param priority query string false "Notification priority filter" Enums(low,medium,high,urgent)
// @Param keyword query string false "Keyword matched against title or content"
// @Param page query int false "Page number" default(1) minimum(1)
// @Param pageSize query int false "Items per page" default(20) minimum(1)
// @Param orderBy query string false "Sort field, such as created_at or sent_at"
// @Param orderDesc query bool false "Whether to sort descending" default(false)
// @Success 200 {object} notificationListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications [get]
func ListNotificationsDoc() {}

// GetNotificationDoc godoc
// @Summary Get Notification
// @Description Get notification detail by ID.
// @Tags Notification
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Notification ID"
// @Success 200 {object} notificationEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/{id} [get]
func GetNotificationDoc() {}

// UpdateNotificationDoc godoc
// @Summary Update Notification
// @Description Update notification by ID.
// @Tags Notification
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Notification ID"
// @Param request body NotificationUpdateRequest true "Notification payload"
// @Success 200 {object} notificationMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/{id} [put]
func UpdateNotificationDoc() {}

// DeleteNotificationDoc godoc
// @Summary Delete Notification
// @Description Delete notification by ID.
// @Tags Notification
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Notification ID"
// @Success 200 {object} notificationMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/{id} [delete]
func DeleteNotificationDoc() {}

// SendNotificationDoc godoc
// @Summary Send Notification
// @Description Send a notification immediately.
// @Tags Notification
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body SendExistingNotificationRequest true "Existing notification send payload"
// @Success 200 {object} notificationMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/send [post]
func SendNotificationDoc() {}

// SendFromTemplateDoc godoc
// @Summary Send Notification From Template
// @Description Send notification using a template.
// @Tags Notification
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body SendNotificationRequest true "Template send payload"
// @Success 200 {object} notificationSendResultEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/send/template [post]
func SendFromTemplateDoc() {}

// ListInboxDoc godoc
// @Summary List Inbox
// @Description Get inbox notifications for current user.
// @Tags Notification Inbox
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1) minimum(1)
// @Param pageSize query int false "Items per page" default(20) minimum(1)
// @Param isRead query bool false "Inbox read-state filter"
// @Success 200 {object} inboxListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/inbox [get]
func ListInboxDoc() {}

// GetUnreadCountDoc godoc
// @Summary Get Unread Inbox Count
// @Description Get unread notification count for current user.
// @Tags Notification Inbox
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} notificationCountEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/inbox/unread-count [get]
func GetUnreadCountDoc() {}

// GetInboxDoc godoc
// @Summary Get Inbox Item
// @Description Get inbox notification detail by ID.
// @Tags Notification Inbox
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Inbox ID"
// @Success 200 {object} inboxEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/inbox/{id} [get]
func GetInboxDoc() {}

// DeleteInboxDoc godoc
// @Summary Delete Inbox Item
// @Description Delete inbox notification by ID.
// @Tags Notification Inbox
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Inbox ID"
// @Success 200 {object} notificationMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/inbox/{id} [delete]
func DeleteInboxDoc() {}

// MarkAsReadDoc godoc
// @Summary Mark Inbox As Read
// @Description Mark one or more inbox notifications as read.
// @Tags Notification Inbox
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body MarkAsReadRequest true "Mark-as-read payload"
// @Success 200 {object} notificationMarkReadEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/inbox/mark-read [post]
func MarkAsReadDoc() {}

// MarkAllAsReadDoc godoc
// @Summary Mark All Inbox As Read
// @Description Mark all inbox notifications as read for current user.
// @Tags Notification Inbox
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} notificationMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/inbox/mark-all-read [post]
func MarkAllAsReadDoc() {}

// GetStatsDoc godoc
// @Summary Get Notification Stats
// @Description Get notification statistics.
// @Tags Notification
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} notificationStatsEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/stats [get]
func GetStatsDoc() {}

// CreateTemplateDoc godoc
// @Summary Create Notification Template
// @Description Create a notification template.
// @Tags Notification Template
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body TemplateRequest true "Template payload"
// @Success 200 {object} templateEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/templates [post]
func CreateTemplateDoc() {}

// ListTemplatesDoc godoc
// @Summary List Notification Templates
// @Description Get notification template list.
// @Tags Notification Template
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param tenantId query string false "Tenant ID filter"
// @Param channel query string false "Template channel filter" Enums(system,email,sms,inbox)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param pageSize query int false "Items per page" default(20) minimum(1)
// @Success 200 {object} templateListEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/templates [get]
func ListTemplatesDoc() {}

// GetTemplateDoc godoc
// @Summary Get Notification Template
// @Description Get notification template by ID.
// @Tags Notification Template
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Template ID"
// @Success 200 {object} templateEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 404 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/templates/{id} [get]
func GetTemplateDoc() {}

// UpdateTemplateDoc godoc
// @Summary Update Notification Template
// @Description Update notification template by ID.
// @Tags Notification Template
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Template ID"
// @Param request body TemplateUpdateRequest true "Template payload"
// @Success 200 {object} notificationMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/templates/{id} [put]
func UpdateTemplateDoc() {}

// DeleteTemplateDoc godoc
// @Summary Delete Notification Template
// @Description Delete notification template by ID.
// @Tags Notification Template
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Template ID"
// @Success 200 {object} notificationMessageEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/templates/{id} [delete]
func DeleteTemplateDoc() {}

// ProcessJobsDoc godoc
// @Summary Process Notification Jobs
// @Description Trigger processing of queued notification jobs.
// @Tags Notification Jobs
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body ProcessJobRequest true "Job processing payload"
// @Success 200 {object} notificationProcessJobsEnvelope
// @Failure 401 {object} response.ErrorDetail
// @Failure 400 {object} response.ErrorDetail
// @Failure 500 {object} response.ErrorDetail
// @Router /notifications/jobs/process [post]
func ProcessJobsDoc() {}

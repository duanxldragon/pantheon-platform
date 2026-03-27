package notification

import (
	"time"

	"github.com/google/uuid"
)

func ToNotificationResponse(n *Notification) *NotificationResponse {
	if n == nil {
		return nil
	}
	return &NotificationResponse{
		ID:         n.ID.String(),
		TenantID:   n.TenantID,
		Title:      n.Title,
		Content:    n.Content,
		Channel:    string(n.Channel),
		Status:     string(n.Status),
		Priority:   string(n.Priority),
		SenderID:   uuidPtrToString(n.SenderID),
		SentAt:     timePtrToString(n.SentAt),
		FailReason: n.FailReason,
		TemplateID: uuidPtrToString(n.TemplateID),
		ExtraData:  n.ExtraData,
		CreatedAt:  n.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  n.UpdatedAt.Format(time.RFC3339),
	}
}

func ToNotificationResponses(items []*Notification) []*NotificationResponse {
	out := make([]*NotificationResponse, 0, len(items))
	for _, it := range items {
		out = append(out, ToNotificationResponse(it))
	}
	return out
}

func ToInboxResponse(inbox *NotificationInbox, notification *Notification) *InboxResponse {
	if inbox == nil {
		return nil
	}
	return &InboxResponse{
		ID:             inbox.ID.String(),
		NotificationID: inbox.NotificationID.String(),
		ReceiverID:     inbox.ReceiverID.String(),
		IsRead:         inbox.IsRead,
		ReadAt:         timePtrToString(inbox.ReadAt),
		IsDeleted:      inbox.IsDeleted,
		CreatedAt:      inbox.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      inbox.UpdatedAt.Format(time.RFC3339),
		Notification:   ToNotificationResponse(notification),
	}
}

func ToInboxResponses(items []*NotificationInbox) []*InboxResponse {
	out := make([]*InboxResponse, 0, len(items))
	for _, it := range items {
		out = append(out, ToInboxResponse(it, it.NotificationRef))
	}
	return out
}

func ToTemplateResponse(t *NotificationTemplate) *TemplateResponse {
	if t == nil {
		return nil
	}
	return &TemplateResponse{
		ID:          t.ID.String(),
		TenantID:    t.TenantID,
		Name:        t.Name,
		Code:        t.Code,
		Channel:     string(t.Channel),
		Subject:     t.Subject,
		Content:     t.Content,
		Description: t.Description,
		IsActive:    t.IsActive,
		Variables:   t.Variables,
		CreatedAt:   t.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   t.UpdatedAt.Format(time.RFC3339),
	}
}

func ToTemplateResponses(items []*NotificationTemplate) []*TemplateResponse {
	out := make([]*TemplateResponse, 0, len(items))
	for _, it := range items {
		out = append(out, ToTemplateResponse(it))
	}
	return out
}

func ToNotificationStatsResponse(stats *NotificationStats) *NotificationStatsResponse {
	if stats == nil {
		return nil
	}
	return &NotificationStatsResponse{
		Total:     stats.Total,
		Unread:    stats.Unread,
		Read:      stats.Read,
		SentToday: stats.SentToday,
		SentWeek:  stats.SentWeek,
	}
}

func uuidPtrToString(id *uuid.UUID) string {
	if id == nil || *id == uuid.Nil {
		return ""
	}
	return id.String()
}

func timePtrToString(t *time.Time) string {
	if t == nil || t.IsZero() {
		return ""
	}
	return t.Format(time.RFC3339)
}

func ToNotificationJobResponse(job *NotificationJob) *NotificationJobResponse {
	if job == nil {
		return nil
	}
	return &NotificationJobResponse{
		ID:             job.ID.String(),
		NotificationID: job.NotificationID.String(),
		Status:         string(job.Status),
		Attempts:       job.Attempts,
		MaxAttempts:    job.MaxAttempts,
		LastError:      job.LastError,
		NextRetryAt:    timePtrToString(job.NextRetryAt),
		LastAttemptAt:  timePtrToString(job.LastAttemptAt),
		UpdatedAt:      job.UpdatedAt.Format(time.RFC3339),
	}
}

func ToNotificationJobResponses(jobs []*NotificationJob) []*NotificationJobResponse {
	out := make([]*NotificationJobResponse, 0, len(jobs))
	for _, job := range jobs {
		out = append(out, ToNotificationJobResponse(job))
	}
	return out
}

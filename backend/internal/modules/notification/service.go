package notification

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	defaultSendMaxAttempts = 3
	defaultRetryDelay      = 30 * time.Second
)

type NotificationService interface {
	CreateNotification(ctx context.Context, n *Notification) error
	GetNotification(ctx context.Context, id string) (*Notification, error)
	ListNotifications(ctx context.Context, req *NotificationListRequest) ([]*Notification, int64, error)
	UpdateNotification(ctx context.Context, id string, n *Notification) error
	DeleteNotification(ctx context.Context, id string) error

	ListInbox(ctx context.Context, receiverID string, req *InboxListRequest) ([]*NotificationInbox, int64, error)
	GetInbox(ctx context.Context, id string) (*NotificationInbox, error)
	DeleteInbox(ctx context.Context, id string) error
	MarkAsRead(ctx context.Context, receiverID string, ids []string) error
	MarkAllAsRead(ctx context.Context, receiverID string) error
	GetUnreadCount(ctx context.Context, receiverID string) (int64, error)

	CreateTemplate(ctx context.Context, t *NotificationTemplate) error
	GetTemplate(ctx context.Context, id string) (*NotificationTemplate, error)
	ListTemplates(ctx context.Context, req *TemplateListRequest) ([]*NotificationTemplate, int64, error)
	UpdateTemplate(ctx context.Context, id string, t *NotificationTemplate) error
	DeleteTemplate(ctx context.Context, id string) error

	GetStats(ctx context.Context, receiverID string) (*NotificationStats, error)
	SendFromTemplate(ctx context.Context, req *SendNotificationRequest) (*Notification, error)
	Send(ctx context.Context, n *Notification) error

	ProcessPendingJobs(ctx context.Context, limit int) ([]*NotificationJob, error)
}

type notificationService struct {
	dao              NotificationDAO
	emailSrv         EmailService
	smsSrv           SMSService
	maxSendAttempts  int
	retryBaseBackoff time.Duration
}

func NewNotificationService(dao NotificationDAO, emailSrv EmailService, smsSrv SMSService) NotificationService {
	return &notificationService{
		dao:              dao,
		emailSrv:         emailSrv,
		smsSrv:           smsSrv,
		maxSendAttempts:  defaultSendMaxAttempts,
		retryBaseBackoff: defaultRetryDelay,
	}
}

func (s *notificationService) CreateNotification(ctx context.Context, n *Notification) error {
	if n.Status == "" {
		n.Status = StatusDraft
	}
	if n.Priority == "" {
		n.Priority = PriorityMedium
	}
	if n.Channel == "" {
		n.Channel = ChannelSystem
	}
	if err := s.dao.Create(ctx, n); err != nil {
		return err
	}

	receiverIDs := parseReceiverIDs(n.ReceiverIDs)
	if len(receiverIDs) == 0 {
		return nil
	}

	tenantID := tenantIDFromCtx(ctx)
	for _, rid := range receiverIDs {
		uid, err := uuid.Parse(rid)
		if err != nil {
			// For email and SMS channels, receiver IDs may not be UUIDs, so inbox rows are skipped.
			continue
		}
		inbox := &NotificationInbox{
			TenantID:       tenantID,
			NotificationID: n.ID,
			ReceiverID:     uid,
			IsRead:         false,
			IsDeleted:      false,
		}
		_ = s.dao.CreateInbox(ctx, inbox)
	}
	return nil
}

func (s *notificationService) GetNotification(ctx context.Context, id string) (*Notification, error) {
	return s.dao.GetByID(ctx, id)
}

func (s *notificationService) ListNotifications(ctx context.Context, req *NotificationListRequest) ([]*Notification, int64, error) {
	return s.dao.List(ctx, req)
}

func (s *notificationService) UpdateNotification(ctx context.Context, id string, n *Notification) error {
	return s.dao.Update(ctx, id, n)
}

func (s *notificationService) DeleteNotification(ctx context.Context, id string) error {
	return s.dao.Delete(ctx, id)
}

func (s *notificationService) ListInbox(ctx context.Context, receiverID string, req *InboxListRequest) ([]*NotificationInbox, int64, error) {
	return s.dao.ListInbox(ctx, receiverID, req)
}

func (s *notificationService) GetInbox(ctx context.Context, id string) (*NotificationInbox, error) {
	return s.dao.GetInbox(ctx, id)
}

func (s *notificationService) DeleteInbox(ctx context.Context, id string) error {
	return s.dao.DeleteInbox(ctx, id)
}

func (s *notificationService) MarkAsRead(ctx context.Context, receiverID string, ids []string) error {
	return s.dao.MarkAsRead(ctx, receiverID, ids)
}

func (s *notificationService) MarkAllAsRead(ctx context.Context, receiverID string) error {
	return s.dao.MarkAllAsRead(ctx, receiverID)
}

func (s *notificationService) GetUnreadCount(ctx context.Context, receiverID string) (int64, error) {
	return s.dao.GetUnreadCount(ctx, receiverID)
}

func (s *notificationService) CreateTemplate(ctx context.Context, t *NotificationTemplate) error {
	if t.IsActive == false {
		t.IsActive = true
	}
	return s.dao.CreateTemplate(ctx, t)
}

func (s *notificationService) GetTemplate(ctx context.Context, id string) (*NotificationTemplate, error) {
	return s.dao.GetTemplateByID(ctx, id)
}

func (s *notificationService) ListTemplates(ctx context.Context, req *TemplateListRequest) ([]*NotificationTemplate, int64, error) {
	return s.dao.ListTemplates(ctx, req)
}

func (s *notificationService) UpdateTemplate(ctx context.Context, id string, t *NotificationTemplate) error {
	return s.dao.UpdateTemplate(ctx, id, t)
}

func (s *notificationService) DeleteTemplate(ctx context.Context, id string) error {
	return s.dao.DeleteTemplate(ctx, id)
}

func (s *notificationService) GetStats(ctx context.Context, receiverID string) (*NotificationStats, error) {
	return s.dao.GetStats(ctx, receiverID)
}

func (s *notificationService) SendFromTemplate(ctx context.Context, req *SendNotificationRequest) (*Notification, error) {
	tmpl, err := s.dao.GetTemplateByID(ctx, req.TemplateID)
	if err != nil {
		return nil, err
	}
	if !tmpl.IsActive {
		return nil, fmt.Errorf("template is inactive")
	}

	var vars map[string]interface{}
	if strings.TrimSpace(req.ExtraData) != "" {
		if err := json.Unmarshal([]byte(req.ExtraData), &vars); err != nil {
			return nil, fmt.Errorf("invalid extraData JSON: %w", err)
		}
	}

	title, err := RenderGoTemplate(tmpl.Subject, vars)
	if err != nil {
		return nil, err
	}
	content, err := RenderGoTemplate(tmpl.Content, vars)
	if err != nil {
		return nil, err
	}

	ch := NotificationChannel(req.Channel)
	priority := NotificationPriority(req.Priority)
	if priority == "" {
		priority = PriorityMedium
	}

	n := &Notification{
		TenantID:    tenantIDFromCtx(ctx),
		Title:       title,
		Content:     content,
		Channel:     ch,
		Priority:    priority,
		ReceiverIDs: req.ReceiverIDs,
		Status:      StatusDraft,
		ExtraData:   req.ExtraData,
	}

	if id, err := uuid.Parse(req.TemplateID); err == nil {
		n.TemplateID = &id
	}

	if err := s.CreateNotification(ctx, n); err != nil {
		return nil, err
	}
	if err := s.Send(ctx, n); err != nil {
		return n, err
	}
	return n, nil
}

func (s *notificationService) Send(ctx context.Context, n *Notification) error {
	if s.maxSendAttempts <= 0 {
		s.maxSendAttempts = defaultSendMaxAttempts
	}
	if err := s.dao.UpdateNotificationFields(ctx, n.ID.String(), map[string]interface{}{
		"status":      StatusQueued,
		"fail_reason": "",
	}); err != nil {
		return err
	}
	job, err := s.dao.EnqueueJob(ctx, n, s.maxSendAttempts, 0)
	if err != nil {
		return err
	}
	_, err = s.processJob(ctx, job)
	return err
}

func (s *notificationService) ProcessPendingJobs(ctx context.Context, limit int) ([]*NotificationJob, error) {
	jobs, err := s.dao.FetchDueJobs(ctx, limit)
	if err != nil {
		return nil, err
	}

	results := make([]*NotificationJob, 0, len(jobs))
	for _, job := range jobs {
		updated, procErr := s.processJob(ctx, job)
		if procErr != nil {
			// Continue processing the remaining jobs; callers can inspect each job status.
		}
		results = append(results, updated)
	}

	return results, nil
}

func parseReceiverIDs(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	seen := map[string]struct{}{}
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if _, ok := seen[p]; ok {
			continue
		}
		seen[p] = struct{}{}
		out = append(out, p)
	}
	return out
}

func (s *notificationService) processJob(ctx context.Context, job *NotificationJob) (*NotificationJob, error) {
	if job == nil {
		return nil, fmt.Errorf("job is nil")
	}
	ok, err := s.dao.MarkJobProcessing(ctx, job.ID)
	if err != nil {
		return job, err
	}
	if !ok {
		return job, nil
	}
	now := time.Now()
	job.Status = JobProcessing
	job.LastAttemptAt = &now

	notif, err := s.dao.GetByID(ctx, job.NotificationID.String())
	if err != nil {
		job.Attempts++
		job.Status = JobFailed
		job.LastError = err.Error()
		_ = s.dao.MarkJobFailed(ctx, job.ID, job.Attempts, err.Error())
		return job, err
	}

	_ = s.dao.UpdateNotificationFields(ctx, notif.ID.String(), map[string]interface{}{
		"status":      StatusProcessing,
		"fail_reason": "",
	})

	dispatchErr := s.dispatchNotification(ctx, notif)
	if dispatchErr != nil {
		job.Attempts++
		job.LastError = dispatchErr.Error()
		if job.Attempts >= job.MaxAttempts {
			job.Status = JobFailed
			_ = s.dao.MarkJobFailed(ctx, job.ID, job.Attempts, dispatchErr.Error())
			_ = s.dao.UpdateNotificationFields(ctx, notif.ID.String(), map[string]interface{}{
				"status":      StatusFailed,
				"fail_reason": dispatchErr.Error(),
			})
			return job, dispatchErr
		}
		if s.retryBaseBackoff <= 0 {
			s.retryBaseBackoff = defaultRetryDelay
		}
		// Exponential backoff: base * 2^(attempts-1)
		backoffMultiplier := int64(1) << (uint(job.Attempts) - 1)
		delay := s.retryBaseBackoff * time.Duration(backoffMultiplier)
		next := time.Now().Add(delay)

		job.Status = JobPending
		job.NextRetryAt = &next
		_ = s.dao.RescheduleJob(ctx, job.ID, job.Attempts, next, dispatchErr.Error())
		_ = s.dao.UpdateNotificationFields(ctx, notif.ID.String(), map[string]interface{}{
			"status":      StatusQueued,
			"fail_reason": dispatchErr.Error(),
		})
		return job, dispatchErr
	}

	job.Status = JobSucceeded
	job.LastError = ""
	job.NextRetryAt = nil
	_ = s.dao.MarkJobSucceeded(ctx, job.ID)

	sentAt := time.Now()
	_ = s.dao.UpdateNotificationFields(ctx, notif.ID.String(), map[string]interface{}{
		"status":      StatusSent,
		"sent_at":     sentAt,
		"fail_reason": "",
	})
	return job, nil
}

func (s *notificationService) dispatchNotification(ctx context.Context, n *Notification) error {
	switch n.Channel {
	case ChannelEmail:
		if s.emailSrv == nil {
			return fmt.Errorf("email service not configured")
		}
		toList := parseReceiverIDs(n.ReceiverIDs)
		for _, to := range toList {
			req := &EmailRequest{
				To:      to,
				Subject: n.Title,
				Content: n.Content,
			}
			if err := s.emailSrv.Send(ctx, req); err != nil {
				return err
			}
		}
		return nil

	case ChannelSMS:
		if s.smsSrv == nil {
			return fmt.Errorf("sms service not configured")
		}
		phones := parseReceiverIDs(n.ReceiverIDs)
		for _, phone := range phones {
			req := &SMSRequest{
				PhoneNumber: phone,
				Content:     n.Content,
			}
			if err := s.smsSrv.Send(ctx, req); err != nil {
				return err
			}
		}
		return nil

	case ChannelSystem, ChannelInbox:
		return nil

	default:
		return fmt.Errorf("unsupported channel: %s", n.Channel)
	}
}

package notification

import (
	"time"

	"github.com/google/uuid"

	systemModel "pantheon-platform/backend/internal/modules/system/model"
)

type NotificationChannel string

const (
	ChannelSystem NotificationChannel = "system"
	ChannelEmail  NotificationChannel = "email"
	ChannelSMS    NotificationChannel = "sms"
	ChannelInbox  NotificationChannel = "inbox"
)

type NotificationStatus string

const (
	StatusDraft      NotificationStatus = "draft"
	StatusQueued     NotificationStatus = "queued"
	StatusProcessing NotificationStatus = "processing"
	StatusSent       NotificationStatus = "sent"
	StatusFailed     NotificationStatus = "failed"
)

type NotificationPriority string

const (
	PriorityLow    NotificationPriority = "low"
	PriorityMedium NotificationPriority = "medium"
	PriorityHigh   NotificationPriority = "high"
	PriorityUrgent NotificationPriority = "urgent"
)

type Notification struct {
	systemModel.BaseModel
	TenantID    string               `json:"tenantId" gorm:"type:char(36);index"`
	Title       string               `json:"title" gorm:"size:200;not null"`
	Content     string               `json:"content" gorm:"type:text;not null"`
	Channel     NotificationChannel  `json:"channel" gorm:"size:20;not null;index"`
	Status      NotificationStatus   `json:"status" gorm:"size:20;not null;index;default:'draft'"`
	Priority    NotificationPriority `json:"priority" gorm:"size:20;not null;index;default:'medium'"`
	SenderID    *uuid.UUID           `json:"senderId,omitempty" gorm:"type:char(36);index"`
	ReceiverIDs string               `json:"receiverIds,omitempty" gorm:"type:text"`
	TemplateID  *uuid.UUID           `json:"templateId,omitempty" gorm:"type:char(36);index"`
	ExtraData   string               `json:"extraData,omitempty" gorm:"type:json"`
	FailReason  string               `json:"failReason,omitempty" gorm:"size:500"`
	SentAt      *time.Time           `json:"sentAt,omitempty" gorm:"index"`
	ExpireAt    *time.Time           `json:"expireAt,omitempty" gorm:"index"`
}

type NotificationInbox struct {
	systemModel.BaseModel
	TenantID        string        `json:"tenantId" gorm:"type:char(36);index"`
	NotificationID  uuid.UUID     `json:"notificationId" gorm:"type:char(36);index;not null"`
	ReceiverID      uuid.UUID     `json:"receiverId" gorm:"type:char(36);index;not null"`
	IsRead          bool          `json:"isRead" gorm:"not null;default:false;index"`
	ReadAt          *time.Time    `json:"readAt,omitempty"`
	IsDeleted       bool          `json:"isDeleted" gorm:"not null;default:false;index"`
	NotificationRef *Notification `gorm:"foreignKey:NotificationID;references:ID"`
}

type NotificationTemplate struct {
	systemModel.BaseModel
	TenantID    string              `json:"tenantId" gorm:"type:char(36);index"`
	Name        string              `json:"name" gorm:"size:100;not null"`
	Code        string              `json:"code" gorm:"size:100;not null;index"`
	Channel     NotificationChannel `json:"channel" gorm:"size:20;not null;index"`
	Subject     string              `json:"subject" gorm:"size:200"`
	Content     string              `json:"content" gorm:"type:text;not null"`
	Description string              `json:"description,omitempty" gorm:"type:text"`
	IsActive    bool                `json:"isActive" gorm:"not null;default:true;index"`
	Variables   string              `json:"variables,omitempty" gorm:"type:text"`
}

type NotificationStats struct {
	Total     int64 `json:"total"`
	Unread    int64 `json:"unread"`
	Read      int64 `json:"read"`
	SentToday int64 `json:"sentToday"`
	SentWeek  int64 `json:"sentWeek"`
}

func (Notification) TableName() string {
	return "notifications"
}

func (NotificationInbox) TableName() string {
	return "notification_inbox"
}

func (NotificationTemplate) TableName() string {
	return "notification_templates"
}

type NotificationJobStatus string

const (
	JobPending    NotificationJobStatus = "pending"
	JobProcessing NotificationJobStatus = "processing"
	JobSucceeded  NotificationJobStatus = "succeeded"
	JobFailed     NotificationJobStatus = "failed"
)

// NotificationJob stores queue state and retry metadata for notification delivery.
type NotificationJob struct {
	systemModel.BaseModel
	TenantID       string                `json:"tenantId" gorm:"type:char(36);index"`
	NotificationID uuid.UUID             `json:"notificationId" gorm:"type:char(36);not null;index"`
	Status         NotificationJobStatus `json:"status" gorm:"size:20;not null;index"`
	Attempts       int                   `json:"attempts" gorm:"not null;default:0"`
	MaxAttempts    int                   `json:"maxAttempts" gorm:"not null;default:3"`
	LastError      string                `json:"lastError" gorm:"type:text"`
	NextRetryAt    *time.Time            `json:"nextRetryAt" gorm:"index"`
	LastAttemptAt  *time.Time            `json:"lastAttemptAt" gorm:"index"`
}

func (NotificationJob) TableName() string {
	return "notification_jobs"
}

package notification

type NotificationRequest struct {
	Title       string `json:"title" binding:"required"`
	Content     string `json:"content" binding:"required"`
	Channel     string `json:"channel" binding:"required,oneof=system email sms inbox"`
	Priority    string `json:"priority" binding:"required,oneof=low medium high urgent"`
	ReceiverIDs string `json:"receiverIds"` // comma-separated; meaning depends on channel
	TemplateID  string `json:"templateId"`
	ExtraData   string `json:"extraData"` // JSON string (optional)
	ExpireAt    string `json:"expireAt"`  // RFC3339 or empty
}

type NotificationUpdateRequest struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	Priority string `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
	ExpireAt string `json:"expireAt"`
}

type NotificationListRequest struct {
	TenantID  string `form:"tenantId"`
	Channel   string `form:"channel"`
	Status    string `form:"status"`
	Priority  string `form:"priority"`
	Keyword   string `form:"keyword"`
	Page      int    `form:"page,default=1"`
	PageSize  int    `form:"pageSize,default=20"`
	OrderBy   string `form:"orderBy"`   // created_at, sent_at, etc
	OrderDesc bool   `form:"orderDesc"` // default false
}

type InboxListRequest struct {
	Page     int   `form:"page,default=1"`
	PageSize int   `form:"pageSize,default=20"`
	IsRead   *bool `form:"isRead"`
}

type NotificationResponse struct {
	ID         string `json:"id"`
	TenantID   string `json:"tenantId"`
	Title      string `json:"title"`
	Content    string `json:"content"`
	Channel    string `json:"channel"`
	Status     string `json:"status"`
	Priority   string `json:"priority"`
	SenderID   string `json:"senderId,omitempty"`
	SentAt     string `json:"sentAt,omitempty"`
	FailReason string `json:"failReason,omitempty"`
	TemplateID string `json:"templateId,omitempty"`
	ExtraData  string `json:"extraData,omitempty"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

type InboxResponse struct {
	ID             string                `json:"id"`
	NotificationID string                `json:"notificationId"`
	ReceiverID     string                `json:"receiverId"`
	IsRead         bool                  `json:"isRead"`
	ReadAt         string                `json:"readAt,omitempty"`
	IsDeleted      bool                  `json:"isDeleted"`
	CreatedAt      string                `json:"createdAt"`
	UpdatedAt      string                `json:"updatedAt"`
	Notification   *NotificationResponse `json:"notification,omitempty"`
}

type TemplateRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Channel     string `json:"channel" binding:"required,oneof=system email sms inbox"`
	Subject     string `json:"subject"` // email/system/inbox typically uses subject
	Content     string `json:"content" binding:"required"`
	Description string `json:"description"`
	IsActive    *bool  `json:"isActive"`
	Variables   string `json:"variables"`
}

type TemplateUpdateRequest struct {
	Name        string `json:"name"`
	Subject     string `json:"subject"`
	Content     string `json:"content"`
	Description string `json:"description"`
	IsActive    *bool  `json:"isActive"`
	Variables   string `json:"variables"`
}

type TemplateListRequest struct {
	TenantID string `form:"tenantId"`
	Channel  string `form:"channel"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=20"`
}

type TemplateResponse struct {
	ID          string `json:"id"`
	TenantID    string `json:"tenantId"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Channel     string `json:"channel"`
	Subject     string `json:"subject"`
	Content     string `json:"content"`
	Description string `json:"description,omitempty"`
	IsActive    bool   `json:"isActive"`
	Variables   string `json:"variables,omitempty"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type NotificationStatsResponse struct {
	Total     int64 `json:"total"`
	Unread    int64 `json:"unread"`
	Read      int64 `json:"read"`
	SentToday int64 `json:"sentToday"`
	SentWeek  int64 `json:"sentWeek"`
}

type MarkAsReadRequest struct {
	IDs []string `json:"ids" binding:"required"`
}

// SendNotificationRequest sends a notification based on a saved template.
// Variables should be provided in ExtraData as a JSON object string.
type SendNotificationRequest struct {
	TemplateID  string `json:"templateId" binding:"required"`
	ReceiverIDs string `json:"receiverIds" binding:"required"`
	Channel     string `json:"channel" binding:"required,oneof=system email sms inbox"`
	ExtraData   string `json:"extraData"` // JSON object string (optional)
	Priority    string `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
}

type ProcessJobRequest struct {
	Limit int `json:"limit" binding:"omitempty,min=1,max=50"`
}

type NotificationJobResponse struct {
	ID             string `json:"id"`
	NotificationID string `json:"notificationId"`
	Status         string `json:"status"`
	Attempts       int    `json:"attempts"`
	MaxAttempts    int    `json:"maxAttempts"`
	LastError      string `json:"lastError,omitempty"`
	NextRetryAt    string `json:"nextRetryAt,omitempty"`
	LastAttemptAt  string `json:"lastAttemptAt,omitempty"`
	UpdatedAt      string `json:"updatedAt"`
}

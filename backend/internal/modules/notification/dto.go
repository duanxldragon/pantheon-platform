package notification

type NotificationRequest struct {
	Title       string `json:"title" binding:"required" example:"Maintenance Notice"`
	Content     string `json:"content" binding:"required" example:"The system will undergo maintenance at 23:00."`
	Channel     string `json:"channel" binding:"required,oneof=system email sms inbox" example:"inbox"`
	Priority    string `json:"priority" binding:"required,oneof=low medium high urgent" example:"high"`
	ReceiverIDs string `json:"receiverIds" example:"user-1,user-2"` // comma-separated; meaning depends on channel
	TemplateID  string `json:"templateId" example:"template-maintenance"`
	ExtraData   string `json:"extraData" example:"{\"link\":\"/maintenance\"}"` // JSON string (optional)
	ExpireAt    string `json:"expireAt" example:"2026-03-31T23:00:00Z"`         // RFC3339 or empty
}

type NotificationUpdateRequest struct {
	Title    string `json:"title" example:"Maintenance Notice"`
	Content  string `json:"content" example:"Maintenance has been postponed to 23:30."`
	Priority string `json:"priority" binding:"omitempty,oneof=low medium high urgent" example:"urgent"`
	ExpireAt string `json:"expireAt" example:"2026-03-31T23:30:00Z"`
}

type NotificationListRequest struct {
	TenantID  string `form:"tenantId" example:"tenant-default"`
	Channel   string `form:"channel" example:"inbox"`
	Status    string `form:"status" example:"sent"`
	Priority  string `form:"priority" example:"high"`
	Keyword   string `form:"keyword" example:"maintenance"`
	Page      int    `form:"page,default=1" example:"1"`
	PageSize  int    `form:"pageSize,default=20" example:"20"`
	OrderBy   string `form:"orderBy" binding:"omitempty,oneof=created_at updated_at sent_at expire_at priority status title" example:"created_at"`
	OrderDesc bool   `form:"orderDesc" example:"false"` // default false
}

type InboxListRequest struct {
	Page     int   `form:"page,default=1" example:"1"`
	PageSize int   `form:"pageSize,default=20" example:"20"`
	IsRead   *bool `form:"isRead" example:"false"`
}

type NotificationResponse struct {
	ID         string `json:"id" example:"notification-1"`
	TenantID   string `json:"tenantId" example:"tenant-default"`
	Title      string `json:"title" example:"Maintenance Notice"`
	Content    string `json:"content" example:"The system will undergo maintenance at 23:00."`
	Channel    string `json:"channel" example:"inbox"`
	Status     string `json:"status" example:"sent"`
	Priority   string `json:"priority" example:"high"`
	SenderID   string `json:"senderId,omitempty" example:"user-admin"`
	SentAt     string `json:"sentAt,omitempty" example:"2026-03-30T12:00:00Z"`
	FailReason string `json:"failReason,omitempty" example:"smtp timeout"`
	TemplateID string `json:"templateId,omitempty" example:"template-maintenance"`
	ExtraData  string `json:"extraData,omitempty" example:"{\"link\":\"/maintenance\"}"`
	CreatedAt  string `json:"createdAt" example:"2026-03-30T11:55:00Z"`
	UpdatedAt  string `json:"updatedAt" example:"2026-03-30T12:00:00Z"`
}

type InboxResponse struct {
	ID             string                `json:"id" example:"inbox-1"`
	NotificationID string                `json:"notificationId" example:"notification-1"`
	ReceiverID     string                `json:"receiverId" example:"user-1"`
	IsRead         bool                  `json:"isRead" example:"false"`
	ReadAt         string                `json:"readAt,omitempty" example:"2026-03-30T12:05:00Z"`
	IsDeleted      bool                  `json:"isDeleted" example:"false"`
	CreatedAt      string                `json:"createdAt" example:"2026-03-30T12:00:00Z"`
	UpdatedAt      string                `json:"updatedAt" example:"2026-03-30T12:05:00Z"`
	Notification   *NotificationResponse `json:"notification,omitempty"`
}

type TemplateRequest struct {
	Name        string `json:"name" binding:"required" example:"Maintenance Notice"`
	Code        string `json:"code" binding:"required" example:"maintenance_notice"`
	Channel     string `json:"channel" binding:"required,oneof=system email sms inbox" example:"inbox"`
	Subject     string `json:"subject" example:"Maintenance Notice"` // email/system/inbox typically uses subject
	Content     string `json:"content" binding:"required" example:"The system will undergo maintenance at 23:00."`
	Description string `json:"description" example:"Template for planned maintenance alerts"`
	IsActive    *bool  `json:"isActive" example:"true"`
	Variables   string `json:"variables" example:"[\"start_time\",\"link\"]"`
}

type TemplateUpdateRequest struct {
	Name        string `json:"name" example:"Maintenance Notice"`
	Subject     string `json:"subject" example:"Maintenance Notice"`
	Content     string `json:"content" example:"The system will undergo maintenance at 23:30."`
	Description string `json:"description" example:"Template for planned maintenance alerts"`
	IsActive    *bool  `json:"isActive" example:"true"`
	Variables   string `json:"variables" example:"[\"start_time\",\"link\"]"`
}

type TemplateListRequest struct {
	TenantID string `form:"tenantId" example:"tenant-default"`
	Channel  string `form:"channel" example:"inbox"`
	Page     int    `form:"page,default=1" example:"1"`
	PageSize int    `form:"pageSize,default=20" example:"20"`
}

type TemplateResponse struct {
	ID          string `json:"id" example:"template-maintenance"`
	TenantID    string `json:"tenantId" example:"tenant-default"`
	Name        string `json:"name" example:"Maintenance Notice"`
	Code        string `json:"code" example:"maintenance_notice"`
	Channel     string `json:"channel" example:"inbox"`
	Subject     string `json:"subject" example:"Maintenance Notice"`
	Content     string `json:"content" example:"The system will undergo maintenance at 23:00."`
	Description string `json:"description,omitempty" example:"Template for planned maintenance alerts"`
	IsActive    bool   `json:"isActive" example:"true"`
	Variables   string `json:"variables,omitempty" example:"[\"start_time\",\"link\"]"`
	CreatedAt   string `json:"createdAt" example:"2026-03-30T11:50:00Z"`
	UpdatedAt   string `json:"updatedAt" example:"2026-03-30T12:00:00Z"`
}

type NotificationStatsResponse struct {
	Total     int64 `json:"total" example:"128"`
	Unread    int64 `json:"unread" example:"12"`
	Read      int64 `json:"read" example:"116"`
	SentToday int64 `json:"sentToday" example:"24"`
	SentWeek  int64 `json:"sentWeek" example:"88"`
}

type MarkAsReadRequest struct {
	IDs []string `json:"ids" binding:"required" example:"notification-1,notification-2"`
}

type SendExistingNotificationRequest struct {
	ID string `json:"id" binding:"required" example:"notification-1"`
}

// SendNotificationRequest sends a notification based on a saved template.
// Variables should be provided in ExtraData as a JSON object string.
type SendNotificationRequest struct {
	TemplateID  string `json:"templateId" binding:"required" example:"maintenance_notice"`
	ReceiverIDs string `json:"receiverIds" binding:"required" example:"user-1,user-2"`
	Channel     string `json:"channel" binding:"required,oneof=system email sms inbox" example:"inbox"`
	ExtraData   string `json:"extraData" example:"{\"link\":\"/maintenance\"}"` // JSON object string (optional)
	Priority    string `json:"priority" binding:"omitempty,oneof=low medium high urgent" example:"high"`
}

type ProcessJobRequest struct {
	Limit int `json:"limit" binding:"omitempty,min=1,max=50" example:"20"`
}

type NotificationJobResponse struct {
	ID             string `json:"id" example:"job-1"`
	NotificationID string `json:"notificationId" example:"notification-1"`
	Status         string `json:"status" example:"succeeded"`
	Attempts       int    `json:"attempts" example:"1"`
	MaxAttempts    int    `json:"maxAttempts" example:"3"`
	LastError      string `json:"lastError,omitempty" example:"smtp timeout"`
	NextRetryAt    string `json:"nextRetryAt,omitempty" example:"2026-03-30T12:10:00Z"`
	LastAttemptAt  string `json:"lastAttemptAt,omitempty" example:"2026-03-30T12:00:30Z"`
	UpdatedAt      string `json:"updatedAt" example:"2026-03-30T12:01:00Z"`
}

package log

import "time"

// LogFilter 日志查询过滤条件
type LogFilter struct {
	UserID    string
	Username  string
	Module    string
	Action    string
	Status    string
	StartDate *time.Time
	EndDate   *time.Time
}

// OperationLogResponse 操作日志响应 DTO
type OperationLogResponse struct {
	ID            string    `json:"id" example:"oplog-1"`
	Username      string    `json:"username" example:"admin"`
	Module        string    `json:"module" example:"system.user"`
	Resource      string    `json:"resource" example:"user"`
	ResourceID    string    `json:"resource_id,omitempty" example:"user-1"`
	ResourceName  string    `json:"resource_name,omitempty" example:"Zhang San"`
	Action        string    `json:"action" example:"create"`
	Summary       string    `json:"summary,omitempty" example:"Create user"`
	Detail        string    `json:"detail,omitempty" example:"Created user zhangsan"`
	Path          string    `json:"path" example:"/api/v1/system/users"`
	Method        string    `json:"method" example:"POST"`
	IP            string    `json:"ip" example:"127.0.0.1"`
	Location      string    `json:"location" example:"Local"`
	Status        int       `json:"status" example:"200"`
	Request       string    `json:"request,omitempty" example:"{\"username\":\"zhangsan\"}"`
	Response      string    `json:"response,omitempty" example:"{\"message\":\"ok\"}"`
	ErrorMessage  string    `json:"error_message,omitempty" example:"permission denied"`
	ExecutionTime int64     `json:"execution_time" example:"35"`
	CreatedAt     time.Time `json:"created_at" example:"2026-03-30T12:00:00Z"`
}

// LoginLogResponse 登录日志响应 DTO
type LoginLogResponse struct {
	ID       string     `json:"id" example:"loginlog-1"`
	Username string     `json:"username" example:"admin"`
	IP       string     `json:"ip" example:"127.0.0.1"`
	Location string     `json:"location" example:"Local"`
	Browser  string     `json:"browser" example:"Chrome"`
	OS       string     `json:"os" example:"Windows"`
	Status   string     `json:"status" example:"success"`
	Message  string     `json:"message" example:"Login succeeded"`
	LoginAt  time.Time  `json:"login_at" example:"2026-03-30T12:00:00Z"`
	LogoutAt *time.Time `json:"logout_at,omitempty" example:"2026-03-30T18:00:00Z"`
}

// ToOperationLogResponse 转换模型为 DTO
func ToOperationLogResponse(l *OperationLog) *OperationLogResponse {
	return &OperationLogResponse{
		ID:            l.ID.String(),
		Username:      l.Username,
		Module:        l.Module,
		Resource:      l.Resource,
		ResourceID:    l.ResourceID,
		ResourceName:  l.ResourceName,
		Action:        l.Action,
		Summary:       l.Summary,
		Detail:        l.Detail,
		Path:          l.Path,
		Method:        l.Method,
		IP:            l.IP,
		Location:      l.Location,
		Status:        l.Status,
		Request:       l.Request,
		Response:      l.Response,
		ErrorMessage:  l.ErrorMessage,
		ExecutionTime: l.ExecutionTime,
		CreatedAt:     l.CreatedAt,
	}
}

// ToLoginLogResponse 转换模型为 DTO
func ToLoginLogResponse(l *LoginLog) *LoginLogResponse {
	return &LoginLogResponse{
		ID:       l.ID.String(),
		Username: l.Username,
		IP:       l.IP,
		Location: l.Location,
		Browser:  l.Browser,
		OS:       l.OS,
		Status:   l.Status,
		Message:  l.Message,
		LoginAt:  l.LoginAt,
		LogoutAt: l.LogoutAt,
	}
}

type PageResponse struct {
	Items      interface{} `json:"items"`
	Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
	Page     int64 `json:"page"`
	PageSize int64 `json:"page_size"`
	Total    int64 `json:"total"`
}

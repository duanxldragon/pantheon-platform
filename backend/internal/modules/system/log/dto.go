package log

import "time"

// LogFilter 日志查询过滤条件
type LogFilter struct {
	Username  string
	Module    string
	Action    string
	Status    string
	StartDate *time.Time
	EndDate   *time.Time
}

// OperationLogResponse 操作日志响应 DTO
type OperationLogResponse struct {
	ID            string    `json:"id"`
	Username      string    `json:"username"`
	Module        string    `json:"module"`
	Resource      string    `json:"resource"`
	ResourceID    string    `json:"resource_id,omitempty"`
	ResourceName  string    `json:"resource_name,omitempty"`
	Action        string    `json:"action"`
	Summary       string    `json:"summary,omitempty"`
	Detail        string    `json:"detail,omitempty"`
	Path          string    `json:"path"`
	Method        string    `json:"method"`
	IP            string    `json:"ip"`
	Location      string    `json:"location"`
	Status        int       `json:"status"`
	Request       string    `json:"request,omitempty"`
	Response      string    `json:"response,omitempty"`
	ErrorMessage  string    `json:"error_message,omitempty"`
	ExecutionTime int64     `json:"execution_time"`
	CreatedAt     time.Time `json:"created_at"`
}

// LoginLogResponse 登录日志响应 DTO
type LoginLogResponse struct {
	ID       string     `json:"id"`
	Username string     `json:"username"`
	IP       string     `json:"ip"`
	Location string     `json:"location"`
	Browser  string     `json:"browser"`
	OS       string     `json:"os"`
	Status   string     `json:"status"`
	Message  string     `json:"message"`
	LoginAt  time.Time  `json:"login_at"`
	LogoutAt *time.Time `json:"logout_at,omitempty"`
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

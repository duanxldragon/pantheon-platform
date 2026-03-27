package notification

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/smtp"
	"net/url"
	"sort"
	"strings"
	"time"

	"pantheon-platform/backend/internal/config"
)

type EmailService interface {
	Send(ctx context.Context, req *EmailRequest) error
	SendBatch(ctx context.Context, reqs []*EmailRequest) error
}

type EmailRequest struct {
	To      string   `json:"to"`
	Cc      []string `json:"cc"`
	Bcc     []string `json:"bcc"`
	Subject string   `json:"subject"`
	Content string   `json:"content"` // HTML
	Text    string   `json:"text"`    // optional plain text
}

type EmailResult struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	MessageID string `json:"messageId,omitempty"`
}

type emailService struct {
	cfg     *config.EmailConfig
	manager *EmailProviderManager
}

func NewEmailService(cfg *config.EmailConfig) EmailService {
	return &emailService{
		cfg:     cfg,
		manager: NewEmailProviderManager(cfg),
	}
}

func (s *emailService) Send(ctx context.Context, req *EmailRequest) error {
	if s.cfg == nil || !s.cfg.Enabled {
		return fmt.Errorf("email service is disabled")
	}
	if err := validateEmailRequest(req); err != nil {
		return err
	}
	provider := s.manager.GetProvider(s.cfg.Provider)
	if provider == nil {
		return fmt.Errorf("unsupported email provider: %s", s.cfg.Provider)
	}
	res, err := provider.Send(ctx, req)
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("email send failed: %s", res.Message)
	}
	return nil
}

func (s *emailService) SendBatch(ctx context.Context, reqs []*EmailRequest) error {
	if s.cfg == nil || !s.cfg.Enabled {
		return fmt.Errorf("email service is disabled")
	}
	if len(reqs) == 0 {
		return nil
	}
	if len(reqs) > 100 {
		return fmt.Errorf("batch send limit exceeded, maximum 100 emails per batch")
	}
	for i, req := range reqs {
		if err := s.Send(ctx, req); err != nil {
			return fmt.Errorf("send email at index %d: %w", i, err)
		}
		if i < len(reqs)-1 {
			time.Sleep(100 * time.Millisecond)
		}
	}
	return nil
}

func validateEmailRequest(req *EmailRequest) error {
	if req == nil {
		return fmt.Errorf("email request is nil")
	}
	if strings.TrimSpace(req.To) == "" {
		return fmt.Errorf("recipient email is required")
	}
	if strings.TrimSpace(req.Subject) == "" {
		return fmt.Errorf("email subject is required")
	}
	if strings.TrimSpace(req.Content) == "" && strings.TrimSpace(req.Text) == "" {
		return fmt.Errorf("email content is required (content or text)")
	}
	return nil
}

type EmailProviderManager struct {
	cfg       *config.EmailConfig
	providers map[string]EmailProvider
}

func NewEmailProviderManager(cfg *config.EmailConfig) *EmailProviderManager {
	m := &EmailProviderManager{
		cfg:       cfg,
		providers: map[string]EmailProvider{},
	}
	m.RegisterProvider("smtp", NewSMTPProvider(cfg))
	m.RegisterProvider("sendgrid", NewSendGridProvider(cfg))
	m.RegisterProvider("aliyun", NewAliyunEmailProvider(cfg))
	return m
}

func (m *EmailProviderManager) RegisterProvider(name string, provider EmailProvider) {
	m.providers[name] = provider
}

func (m *EmailProviderManager) GetProvider(name string) EmailProvider {
	return m.providers[name]
}

type EmailProvider interface {
	Send(ctx context.Context, req *EmailRequest) (*EmailResult, error)
}

type SMTPProvider struct {
	cfg *config.EmailConfig
}

func NewSMTPProvider(cfg *config.EmailConfig) EmailProvider {
	return &SMTPProvider{cfg: cfg}
}

func (p *SMTPProvider) Send(ctx context.Context, req *EmailRequest) (*EmailResult, error) {
	if p.cfg == nil {
		return nil, fmt.Errorf("smtp config is nil")
	}
	if strings.TrimSpace(p.cfg.SMTPHost) == "" || p.cfg.SMTPPort == 0 {
		return nil, fmt.Errorf("smtp host or port not configured")
	}

	from := p.cfg.From
	if strings.TrimSpace(from) == "" {
		return nil, fmt.Errorf("smtp from not configured")
	}

	addr := fmt.Sprintf("%s:%d", p.cfg.SMTPHost, p.cfg.SMTPPort)
	auth := smtp.PlainAuth("", p.cfg.SMTPUsername, p.cfg.SMTPPassword, p.cfg.SMTPHost)

	to := []string{req.To}
	to = append(to, req.Cc...)
	to = append(to, req.Bcc...)

	var msg strings.Builder
	msg.WriteString(fmt.Sprintf("From: %s\r\n", from))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", req.To))
	if len(req.Cc) > 0 {
		msg.WriteString(fmt.Sprintf("Cc: %s\r\n", strings.Join(req.Cc, ",")))
	}
	if p.cfg.ReplyTo != "" {
		msg.WriteString(fmt.Sprintf("Reply-To: %s\r\n", p.cfg.ReplyTo))
	}
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", req.Subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	msg.WriteString("\r\n")
	if req.Content != "" {
		msg.WriteString(req.Content)
	} else {
		// fallback
		msg.WriteString("<pre>")
		msg.WriteString(req.Text)
		msg.WriteString("</pre>")
	}

	if err := smtp.SendMail(addr, auth, p.cfg.From, to, []byte(msg.String())); err != nil {
		return nil, err
	}

	return &EmailResult{
		Success: true,
		Message: "email sent successfully via smtp",
	}, nil
}

type stubEmailProvider struct {
	name string
}

func NewStubEmailProvider(name string) EmailProvider {
	return &stubEmailProvider{name: name}
}

func (p *stubEmailProvider) Send(ctx context.Context, req *EmailRequest) (*EmailResult, error) {
	// Stub provider: explicitly return error to indicate configuration is required.
	return nil, fmt.Errorf("email provider '%s' is a stub and not configured. Please configure a real email provider (smtp, sendgrid, or aliyun) in the configuration", p.name)
}

// ========== SendGrid Provider ==========

type SendGridProvider struct {
	cfg *config.EmailConfig
}

type SendGridEmail struct {
	From    string            `json:"from"`
	Subject string            `json:"subject"`
	Content []SendGridContent `json:"content"`
}

type SendGridContent struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

func NewSendGridProvider(cfg *config.EmailConfig) EmailProvider {
	return &SendGridProvider{cfg: cfg}
}

func (p *SendGridProvider) Send(ctx context.Context, req *EmailRequest) (*EmailResult, error) {
	if p.cfg == nil || p.cfg.SendGridAPIKey == "" {
		return nil, fmt.Errorf("sendgrid api key not configured")
	}

	// 构建HTML内容
	emailBody := req.Content
	if emailBody == "" {
		emailBody = fmt.Sprintf("<pre>%s</pre>", req.Text)
	}

	email := SendGridEmail{
		From:    p.cfg.From,
		Subject: req.Subject,
		Content: []SendGridContent{
			{
				Type:  "text/html",
				Value: emailBody,
			},
		},
	}

	// 转换为JSON
	jsonData, err := json.Marshal(email)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal email request: %w", err)
	}

	// 创建HTTP请求
	httpReq, err := http.NewRequestWithContext(
		ctx,
		"POST",
		"https://api.sendgrid.com/v3/mail/send",
		bytes.NewReader(jsonData),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// 设置请求头
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.cfg.SendGridAPIKey))
	httpReq.Header.Set("Content-Type", "application/json")

	// 发送请求
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// 检查响应状态码
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("sendgrid api error: status %d, response: %s", resp.StatusCode, string(body))
	}

	// 解析响应获取Message-ID
	var sendGridResp struct {
		Headers struct {
			XMessageID []string `json:"X-Message-Id"`
		}
	}

	if err := json.Unmarshal(body, &sendGridResp); err == nil {
		if len(sendGridResp.Headers.XMessageID) > 0 {
			messageID := sendGridResp.Headers.XMessageID[0]
			return &EmailResult{
				Success:   true,
				Message:   "email sent successfully via sendgrid",
				MessageID: messageID,
			}, nil
		}
	}

	return &EmailResult{
		Success:   true,
		Message:   "email sent successfully via sendgrid",
		MessageID: fmt.Sprintf("sg_%d", time.Now().Unix()),
	}, nil
}

// ========== Aliyun Email Provider ==========

type AliyunEmailProvider struct {
	cfg *config.EmailConfig
}

func NewAliyunEmailProvider(cfg *config.EmailConfig) EmailProvider {
	return &AliyunEmailProvider{cfg: cfg}
}

func (p *AliyunEmailProvider) Send(ctx context.Context, req *EmailRequest) (*EmailResult, error) {
	if p.cfg == nil || p.cfg.AliyunAccessKeyID == "" || p.cfg.AliyunAccessKeySecret == "" {
		return nil, fmt.Errorf("aliyun email config not complete")
	}

	toAddress := req.To

	body := req.Content
	if body == "" {
		body = req.Text
	}

	params := map[string]string{
		"Action":           "SingleSendMail",
		"AccountName":      p.cfg.From,
		"AddressType":      "1",
		"Format":           "JSON",
		"Version":          "2015-11-23",
		"AccessKeyId":      p.cfg.AliyunAccessKeyID,
		"SignatureMethod":  "HMAC-SHA1",
		"SignatureVersion": "1.0",
		"SignatureNonce":   fmt.Sprintf("%d", time.Now().UnixNano()),
		"Timestamp":        time.Now().UTC().Format("2006-01-02T15:04:05Z"),
		"ReplyToAddress":   "false",
		"ToAddress":        toAddress,
		"Subject":          req.Subject,
		"HtmlBody":         body,
	}
	if p.cfg.FromName != "" {
		params["FromAlias"] = p.cfg.FromName
	}

	// Build sorted query string for signing
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	queryParts := make([]string, 0, len(keys))
	for _, k := range keys {
		queryParts = append(queryParts, url.QueryEscape(k)+"="+url.QueryEscape(params[k]))
	}
	canonicalQuery := strings.Join(queryParts, "&")

	// StringToSign: POST&%2F&{encoded canonical query}
	stringToSign := "POST&%2F&" + url.QueryEscape(canonicalQuery)

	// HMAC-SHA1 with secret key appended by "&"
	mac := hmac.New(sha1.New, []byte(p.cfg.AliyunAccessKeySecret+"&"))
	mac.Write([]byte(stringToSign))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	params["Signature"] = signature

	// Build final form body
	formParts := make([]string, 0, len(params))
	for k, v := range params {
		formParts = append(formParts, url.QueryEscape(k)+"="+url.QueryEscape(v))
	}
	formBody := strings.Join(formParts, "&")

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://dm.aliyuncs.com", strings.NewReader(formBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create aliyun email request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send aliyun email: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read aliyun email response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("aliyun email api error: status %d, response: %s", resp.StatusCode, string(respBody))
	}

	var aliyunResp struct {
		EnvId     string `json:"EnvId"`
		RequestId string `json:"RequestId"`
		Code      string `json:"Code"`
		Message   string `json:"Message"`
	}
	if err := json.Unmarshal(respBody, &aliyunResp); err != nil {
		return nil, fmt.Errorf("failed to parse aliyun email response: %w", err)
	}

	if aliyunResp.Code != "" && aliyunResp.Code != "200" {
		return nil, fmt.Errorf("aliyun email failed: %s - %s", aliyunResp.Code, aliyunResp.Message)
	}

	return &EmailResult{
		Success:   true,
		Message:   "email sent successfully via aliyun",
		MessageID: aliyunResp.RequestId,
	}, nil
}

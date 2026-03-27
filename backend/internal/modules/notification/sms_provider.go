package notification

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"pantheon-platform/backend/internal/config"
)

type SMSService interface {
	Send(ctx context.Context, req *SMSRequest) error
	SendBatch(ctx context.Context, reqs []*SMSRequest) error
}

type SMSRequest struct {
	PhoneNumber string            `json:"phoneNumber"`
	Template    string            `json:"template,omitempty"`
	Params      map[string]string `json:"params,omitempty"`
	Content     string            `json:"content,omitempty"`
}

type SMSResult struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	MessageID string `json:"messageId,omitempty"`
	BizID     string `json:"bizId,omitempty"`
}

type smsService struct {
	cfg     *config.SMSConfig
	manager *SMSProviderManager
}

func NewSMSService(cfg *config.SMSConfig) SMSService {
	return &smsService{
		cfg:     cfg,
		manager: NewSMSProviderManager(cfg),
	}
}

func (s *smsService) Send(ctx context.Context, req *SMSRequest) error {
	if s.cfg == nil || !s.cfg.Enabled {
		return fmt.Errorf("sms service is disabled")
	}
	if err := validateSMSRequest(req); err != nil {
		return err
	}
	provider := s.manager.GetProvider(s.cfg.Provider)
	if provider == nil {
		return fmt.Errorf("unsupported sms provider: %s", s.cfg.Provider)
	}
	res, err := provider.Send(ctx, req)
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("sms send failed: %s", res.Message)
	}
	return nil
}

func (s *smsService) SendBatch(ctx context.Context, reqs []*SMSRequest) error {
	if s.cfg == nil || !s.cfg.Enabled {
		return fmt.Errorf("sms service is disabled")
	}
	if len(reqs) == 0 {
		return nil
	}
	if len(reqs) > 100 {
		return fmt.Errorf("batch send limit exceeded, maximum 100 sms per batch")
	}
	for i, req := range reqs {
		if err := s.Send(ctx, req); err != nil {
			return fmt.Errorf("send sms at index %d: %w", i, err)
		}
		if i < len(reqs)-1 {
			time.Sleep(100 * time.Millisecond)
		}
	}
	return nil
}

func validateSMSRequest(req *SMSRequest) error {
	if req == nil {
		return fmt.Errorf("sms request is nil")
	}
	if strings.TrimSpace(req.PhoneNumber) == "" {
		return fmt.Errorf("phone number is required")
	}
	if strings.TrimSpace(req.Content) == "" && strings.TrimSpace(req.Template) == "" {
		return fmt.Errorf("either content or template is required")
	}
	return nil
}

type SMSProviderManager struct {
	cfg       *config.SMSConfig
	providers map[string]SMSProvider
}

func NewSMSProviderManager(cfg *config.SMSConfig) *SMSProviderManager {
	m := &SMSProviderManager{
		cfg:       cfg,
		providers: map[string]SMSProvider{},
	}
	m.RegisterProvider("aliyun", NewAliyunSMSProvider(cfg))
	m.RegisterProvider("tencent", NewTencentSMSProvider(cfg))
	m.RegisterProvider("twilio", NewTwilioSMSProvider(cfg))
	return m
}

func (m *SMSProviderManager) RegisterProvider(name string, provider SMSProvider) {
	m.providers[name] = provider
}

func (m *SMSProviderManager) GetProvider(name string) SMSProvider {
	return m.providers[name]
}

type SMSProvider interface {
	Send(ctx context.Context, req *SMSRequest) (*SMSResult, error)
}

type stubSMSProvider struct {
	name string
}

func NewStubSMSProvider(name string) SMSProvider {
	return &stubSMSProvider{name: name}
}

func (p *stubSMSProvider) Send(ctx context.Context, req *SMSRequest) (*SMSResult, error) {
	// Stub provider: explicitly return error to indicate configuration is required.
	return nil, fmt.Errorf("sms provider '%s' is a stub and not configured. Please configure a real sms provider (aliyun, tencent, or twilio) in the configuration", p.name)
}

// ========== Aliyun SMS Provider ==========

type AliyunSMSProvider struct {
	cfg *config.SMSConfig
}

func NewAliyunSMSProvider(cfg *config.SMSConfig) SMSProvider {
	return &AliyunSMSProvider{cfg: cfg}
}

func (p *AliyunSMSProvider) Send(ctx context.Context, req *SMSRequest) (*SMSResult, error) {
	if p.cfg == nil || p.cfg.AliyunAccessKeyID == "" || p.cfg.AliyunAccessKeySecret == "" {
		return nil, fmt.Errorf("aliyun sms config not complete")
	}

	// 构建阿里云短信API请求
	type AliyunSMSRequest struct {
		PhoneNumbers  string `json:"PhoneNumbers"`
		SignName      string `json:"SignName"`
		TemplateCode  string `json:"TemplateCode"`
		TemplateParam string `json:"TemplateParam,omitempty"`
	}

	// 构建TemplateParam JSON
	templateParamJSON := ""
	if len(req.Params) > 0 {
		if jsonData, err := json.Marshal(req.Params); err == nil {
			templateParamJSON = string(jsonData)
		}
	}

	aliyunReq := AliyunSMSRequest{
		PhoneNumbers:  req.PhoneNumber,
		SignName:      p.cfg.AliyunSignName,
		TemplateCode:  req.Template,
		TemplateParam: templateParamJSON,
	}

	// 转换为JSON
	jsonData, err := json.Marshal(aliyunReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal sms request: %w", err)
	}

	// 构建API请求URL和参数
	apiURL := fmt.Sprintf("https://dysmsapi.aliyuncs.com/v2018-03-01/phone/number/sms/sendSms?AccessKeyId=%s&AccessKeySecret=%s&PhoneNumbers=%s&SignName=%s&TemplateCode=%s&TemplateParam=%s",
		url.QueryEscape(p.cfg.AliyunAccessKeyID),
		url.QueryEscape(p.cfg.AliyunAccessKeySecret),
		url.QueryEscape(req.PhoneNumber),
		url.QueryEscape(p.cfg.AliyunSignName),
		url.QueryEscape(req.Template),
		url.QueryEscape(templateParamJSON))

	// 创建HTTP请求
	httpReq, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewReader(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// 设置请求头
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	// 发送请求
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send sms: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// 检查响应状态码
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("aliyun sms api error: status %d, response: %s", resp.StatusCode, string(body))
	}

	// 解析阿里云API响应
	var aliyunResp struct {
		Code      string `json:"Code"`
		Message   string `json:"Message"`
		BizID     string `json:"BizId"`
		RequestId string `json:"RequestId"`
	}

	if err := json.Unmarshal(body, &aliyunResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if aliyunResp.Code != "OK" {
		return nil, fmt.Errorf("aliyun sms failed: %s - %s", aliyunResp.Code, aliyunResp.Message)
	}

	return &SMSResult{
		Success:   true,
		Message:   "sms sent successfully via aliyun",
		MessageID: aliyunResp.RequestId,
		BizID:     aliyunResp.BizID,
	}, nil
}

// ========== Tencent SMS Provider ==========

type TencentSMSProvider struct {
	cfg *config.SMSConfig
}

func NewTencentSMSProvider(cfg *config.SMSConfig) SMSProvider {
	return &TencentSMSProvider{cfg: cfg}
}

func (p *TencentSMSProvider) Send(ctx context.Context, req *SMSRequest) (*SMSResult, error) {
	if p.cfg == nil || p.cfg.TencentSecretID == "" || p.cfg.TencentSecretKey == "" {
		return nil, fmt.Errorf("tencent sms config not complete")
	}

	region := p.cfg.TencentRegion
	if region == "" {
		region = "ap-guangzhou"
	}

	// Build request payload
	templateParams := []string{}
	for _, v := range req.Params {
		templateParams = append(templateParams, v)
	}

	payload := map[string]interface{}{
		"PhoneNumberSet":   []string{req.PhoneNumber},
		"SmsSdkAppId":      p.cfg.TencentAppID,
		"SignName":         p.cfg.TencentSignName,
		"TemplateId":       req.Template,
		"TemplateParamSet": templateParams,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal tencent sms request: %w", err)
	}

	// TC3-HMAC-SHA256 signing
	now := time.Now().UTC()
	timestamp := fmt.Sprintf("%d", now.Unix())
	date := now.Format("2006-01-02")
	service := "sms"
	host := "sms.tencentcloudapi.com"
	algorithm := "TC3-HMAC-SHA256"
	action := "SendSms"
	version := "2021-01-11"

	// Step 1: canonical request
	hashedPayload := sha256Hex(payloadBytes)
	canonicalRequest := strings.Join([]string{
		"POST",
		"/",
		"",
		"content-type:application/json\nhost:" + host + "\n",
		"content-type;host",
		hashedPayload,
	}, "\n")

	// Step 2: string to sign
	credentialScope := date + "/" + service + "/tc3_request"
	stringToSign := strings.Join([]string{
		algorithm,
		timestamp,
		credentialScope,
		sha256Hex([]byte(canonicalRequest)),
	}, "\n")

	// Step 3: derive signing key
	secretDate := hmacSHA256([]byte("TC3"+p.cfg.TencentSecretKey), date)
	secretService := hmacSHA256(secretDate, service)
	secretSigning := hmacSHA256(secretService, "tc3_request")
	signature := hex.EncodeToString(hmacSHA256(secretSigning, stringToSign))

	// Step 4: authorization header
	authorization := fmt.Sprintf("%s Credential=%s/%s, SignedHeaders=content-type;host, Signature=%s",
		algorithm, p.cfg.TencentSecretID, credentialScope, signature)

	apiURL := "https://" + host
	httpReq, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create tencent request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Host", host)
	httpReq.Header.Set("X-TC-Action", action)
	httpReq.Header.Set("X-TC-Version", version)
	httpReq.Header.Set("X-TC-Timestamp", timestamp)
	httpReq.Header.Set("X-TC-Region", region)
	httpReq.Header.Set("Authorization", authorization)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send tencent sms: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read tencent response: %w", err)
	}

	var tencentResp struct {
		Response struct {
			SendStatusSet []struct {
				SerialNo    string `json:"SerialNo"`
				PhoneNumber string `json:"PhoneNumber"`
				Fee         int    `json:"Fee"`
				Code        string `json:"Code"`
				Message     string `json:"Message"`
			} `json:"SendStatusSet"`
			Error *struct {
				Code    string `json:"Code"`
				Message string `json:"Message"`
			} `json:"Error"`
			RequestId string `json:"RequestId"`
		} `json:"Response"`
	}
	if err := json.Unmarshal(respBody, &tencentResp); err != nil {
		return nil, fmt.Errorf("failed to parse tencent response: %w", err)
	}

	if tencentResp.Response.Error != nil {
		return nil, fmt.Errorf("tencent sms api error: %s - %s",
			tencentResp.Response.Error.Code, tencentResp.Response.Error.Message)
	}

	if len(tencentResp.Response.SendStatusSet) > 0 {
		status := tencentResp.Response.SendStatusSet[0]
		if status.Code != "Ok" {
			return nil, fmt.Errorf("tencent sms failed: %s - %s", status.Code, status.Message)
		}
		return &SMSResult{
			Success:   true,
			Message:   "sms sent successfully via tencent",
			MessageID: tencentResp.Response.RequestId,
			BizID:     status.SerialNo,
		}, nil
	}

	return &SMSResult{
		Success:   true,
		Message:   "sms sent successfully via tencent",
		MessageID: tencentResp.Response.RequestId,
	}, nil
}

func sha256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

func hmacSHA256(key []byte, data string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(data))
	return mac.Sum(nil)
}

// ========== Twilio SMS Provider ==========

type TwilioSMSProvider struct {
	cfg *config.SMSConfig
}

func NewTwilioSMSProvider(cfg *config.SMSConfig) SMSProvider {
	return &TwilioSMSProvider{cfg: cfg}
}

func (p *TwilioSMSProvider) Send(ctx context.Context, req *SMSRequest) (*SMSResult, error) {
	if p.cfg == nil || p.cfg.TwilioAccountSID == "" || p.cfg.TwilioAuthToken == "" {
		return nil, fmt.Errorf("twilio sms config not complete")
	}

	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", p.cfg.TwilioAccountSID)

	body := url.Values{}
	body.Set("From", p.cfg.TwilioFromNumber)
	body.Set("To", req.PhoneNumber)
	if req.Content != "" {
		body.Set("Body", req.Content)
	} else {
		body.Set("Body", req.Template)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", apiURL, strings.NewReader(body.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create twilio request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	httpReq.SetBasicAuth(p.cfg.TwilioAccountSID, p.cfg.TwilioAuthToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send twilio sms: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read twilio response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("twilio api error: status %d, response: %s", resp.StatusCode, string(respBody))
	}

	var twilioResp struct {
		SID    string `json:"sid"`
		Status string `json:"status"`
	}
	if err := json.Unmarshal(respBody, &twilioResp); err != nil {
		return nil, fmt.Errorf("failed to parse twilio response: %w", err)
	}

	return &SMSResult{
		Success:   true,
		Message:   "sms sent successfully via twilio",
		MessageID: twilioResp.SID,
		BizID:     twilioResp.Status,
	}, nil
}

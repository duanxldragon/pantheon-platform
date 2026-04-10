package alerting

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"strings"
	"time"
)

// EmailNotifier sends alerts via email
type EmailNotifier struct {
	smtpHost     string
	smtpPort     int
	username     string
	password     string
	fromAddress  string
	fromName     string
	toAddresses  []string
	useTLS       bool
}

// EmailConfig represents email notification configuration
type EmailConfig struct {
	SMTPHost    string   `json:"smtp_host"`
	SMTPPort    int      `json:"smtp_port"`
	Username    string   `json:"username"`
	Password    string   `json:"password"`
	FromAddress string   `json:"from_address"`
	FromName    string   `json:"from_name"`
	ToAddresses []string `json:"to_addresses"`
	UseTLS      bool     `json:"use_tls"`
}

func NewEmailNotifier(config *EmailConfig) *EmailNotifier {
	return &EmailNotifier{
		smtpHost:    config.SMTPHost,
		smtpPort:    config.SMTPPort,
		username:    config.Username,
		password:    config.Password,
		fromAddress: config.FromAddress,
		fromName:    config.FromName,
		toAddresses: config.ToAddresses,
		useTLS:      config.UseTLS,
	}
}

func (n *EmailNotifier) Type() string {
	return "email"
}

func (n *EmailNotifier) Send(ctx context.Context, alert *Alert) error {
	if len(n.toAddresses) == 0 {
		return fmt.Errorf("no recipient addresses configured")
	}

	// Compose email
	subject := fmt.Sprintf("[%s] %s", strings.ToUpper(string(alert.Severity)), alert.Title)
	body := n.formatEmailBody(alert)

	// Send email
	return n.sendEmail(subject, body)
}

func (n *EmailNotifier) formatEmailBody(alert *Alert) string {
	var buf bytes.Buffer

	buf.WriteString(fmt.Sprintf("Alert: %s\n", alert.Title))
	buf.WriteString(fmt.Sprintf("Severity: %s\n", alert.Severity))
	buf.WriteString(fmt.Sprintf("Status: %s\n", alert.Status))
	buf.WriteString(fmt.Sprintf("Source: %s\n", alert.Source))
	buf.WriteString(fmt.Sprintf("Time: %s\n", alert.Timestamp.Format(time.RFC3339)))

	if alert.Description != "" {
		buf.WriteString(fmt.Sprintf("\nDescription:\n%s\n", alert.Description))
	}

	if len(alert.Annotations) > 0 {
		buf.WriteString("\nDetails:\n")
		for key, value := range alert.Annotations {
			buf.WriteString(fmt.Sprintf("  %s: %v\n", key, value))
		}
	}

	return buf.String()
}

func (n *EmailNotifier) sendEmail(subject, body string) error {
	// Compose message
	msg := fmt.Sprintf("From: %s <%s>\n", n.fromName, n.fromAddress)
	msg += fmt.Sprintf("To: %s\n", strings.Join(n.toAddresses, ", "))
	msg += fmt.Sprintf("Subject: %s\n", subject)
	msg += "\n" + body

	// Send SMTP
	auth := smtp.PlainAuth("", n.username, n.password, n.smtpHost)
	addr := fmt.Sprintf("%s:%d", n.smtpHost, n.smtpPort)

	err := smtp.SendMail(addr, auth, n.fromAddress, n.toAddresses, []byte(msg))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("Alerting: Email sent to %d recipients", len(n.toAddresses))
	return nil
}

// SlackNotifier sends alerts to Slack
type SlackNotifier struct {
	webhookURL string
	channel    string
	username   string
	iconEmoji  string
}

// SlackConfig represents Slack notification configuration
type SlackConfig struct {
	WebhookURL string `json:"webhook_url"`
	Channel    string `json:"channel"`
	Username   string `json:"username"`
	IconEmoji  string `json:"icon_emoji"`
}

func NewSlackNotifier(config *SlackConfig) *SlackNotifier {
	return &SlackNotifier{
		webhookURL: config.WebhookURL,
		channel:    config.Channel,
		username:   config.Username,
		iconEmoji:  config.IconEmoji,
	}
}

func (n *SlackNotifier) Type() string {
	return "slack"
}

func (n *SlackNotifier) Send(ctx context.Context, alert *Alert) error {
	message := n.formatSlackMessage(alert)
	return n.sendToSlack(message)
}

func (n *SlackNotifier) formatSlackMessage(alert *Alert) map[string]interface{} {
	// Color based on severity
	color := n.getSeverityColor(alert.Severity)

	// Build attachment fields
	fields := []map[string]interface{}{
		{
			"title": "Severity",
			"value": string(alert.Severity),
			"short": true,
		},
		{
			"title": "Status",
			"value": string(alert.Status),
			"short": true,
		},
		{
			"title": "Source",
			"value": alert.Source,
			"short": true,
		},
		{
			"title": "Time",
			"value": alert.Timestamp.Format(time.RFC3339),
			"short": true,
		},
	}

	// Add annotations as fields
	for key, value := range alert.Annotations {
		fields = append(fields, map[string]interface{}{
			"title": key,
			"value": fmt.Sprintf("%v", value),
			"short": true,
		})
	}

	attachment := map[string]interface{}{
		"color":      color,
		"title":      alert.Title,
		"text":       alert.Description,
		"fields":     fields,
		"footer":     "Pantheon Platform Alerting",
		"ts":         alert.Timestamp.Unix(),
		"footer_icon": "https://platform.pantheon.com/icon.png",
	}

	if alert.Count > 1 {
		attachment["footer"] = fmt.Sprintf("Occurrence count: %d", alert.Count)
	}

	message := map[string]interface{}{
		"channel":    n.channel,
		"username":   n.username,
		"icon_emoji": n.iconEmoji,
		"attachments": []map[string]interface{}{attachment},
	}

	return message
}

func (n *SlackNotifier) sendToSlack(message map[string]interface{}) error {
	jsonData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal slack message: %w", err)
	}

	req, err := http.NewRequest("POST", n.webhookURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send slack message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("slack webhook returned status %d", resp.StatusCode)
	}

	log.Printf("Alerting: Slack message sent to channel %s", n.channel)
	return nil
}

func (n *SlackNotifier) getSeverityColor(severity AlertSeverity) string {
	switch severity {
	case SeverityCritical:
		return "#FF0000" // Red
	case SeverityError:
		return "#FF6600" // Orange
	case SeverityWarning:
		return "#FFCC00" // Yellow
	case SeverityInfo:
		return "#36A64F" // Green
	default:
		return "#808080" // Gray
	}
}

// WebhookNotifier sends alerts via HTTP webhooks
type WebhookNotifier struct {
	endpoint string
	headers  map[string]string
	timeout  time.Duration
}

// WebhookConfig represents webhook notification configuration
type WebhookConfig struct {
	Endpoint string            `json:"endpoint"`
	Headers  map[string]string `json:"headers"`
	Timeout  int               `json:"timeout"` // in seconds
}

func NewWebhookNotifier(config *WebhookConfig) *WebhookNotifier {
	timeout := time.Duration(config.Timeout) * time.Second
	if timeout == 0 {
		timeout = 10 * time.Second
	}

	return &WebhookNotifier{
		endpoint: config.Endpoint,
		headers:  config.Headers,
		timeout:  timeout,
	}
}

func (n *WebhookNotifier) Type() string {
	return "webhook"
}

func (n *WebhookNotifier) Send(ctx context.Context, alert *Alert) error {
	// Create payload
	payload := map[string]interface{}{
		"alert_id":    alert.ID,
		"title":       alert.Title,
		"description": alert.Description,
		"severity":    string(alert.Severity),
		"status":      string(alert.Status),
		"source":      alert.Source,
		"timestamp":   alert.Timestamp.Format(time.RFC3339),
		"labels":      alert.Labels,
		"annotations": alert.Annotations,
		"fingerprint": alert.Fingerprint,
		"count":       alert.Count,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal webhook payload: %w", err)
	}

	// Create request
	req, err := http.NewRequest("POST", n.endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	for key, value := range n.headers {
		req.Header.Set(key, value)
	}

	// Send request
	client := &http.Client{Timeout: n.timeout}
	resp, err := client.Do(req.WithContext(ctx))
	if err != nil {
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook returned status %d", resp.StatusCode)
	}

	log.Printf("Alerting: Webhook sent to %s", n.endpoint)
	return nil
}

// LogNotifier logs alerts to standard output
type LogNotifier struct {
	minSeverity AlertSeverity
}

func NewLogNotifier(minSeverity AlertSeverity) *LogNotifier {
	return &LogNotifier{
		minSeverity: minSeverity,
	}
}

func (n *LogNotifier) Type() string {
	return "log"
}

func (n *LogNotifier) Send(ctx context.Context, alert *Alert) error {
	if !n.shouldLog(alert.Severity) {
		return nil
	}

	logMsg := fmt.Sprintf("[ALERT] %s [%s] %s - %s",
		alert.ID, alert.Severity, alert.Title, alert.Description)

	if alert.Count > 1 {
		logMsg += fmt.Sprintf(" (count: %d)", alert.Count)
	}

	switch alert.Severity {
	case SeverityCritical:
		log.Printf("CRITICAL: %s", logMsg)
	case SeverityError:
		log.Printf("ERROR: %s", logMsg)
	case SeverityWarning:
		log.Printf("WARNING: %s", logMsg)
	case SeverityInfo:
		log.Printf("INFO: %s", logMsg)
	default:
		log.Printf("%s", logMsg)
	}

	return nil
}

func (n *LogNotifier) shouldLog(severity AlertSeverity) bool {
	severityOrder := map[AlertSeverity]int{
		SeverityInfo:     0,
		SeverityWarning:  1,
		SeverityError:    2,
		SeverityCritical: 3,
	}

	return severityOrder[severity] >= severityOrder[n.minSeverity]
}

// MultiNotifier sends alerts via multiple notifiers
type MultiNotifier struct {
	notifiers []Notifier
}

func NewMultiNotifier(notifiers ...Notifier) *MultiNotifier {
	return &MultiNotifier{
		notifiers: notifiers,
	}
}

func (n *MultiNotifier) Type() string {
	return "multi"
}

func (n *MultiNotifier) Send(ctx context.Context, alert *Alert) error {
	var lastErr error

	for _, notifier := range n.notifiers {
		if err := notifier.Send(ctx, alert); err != nil {
			log.Printf("Alerting: MultiNotifier failed for %s: %v", notifier.Type(), err)
			lastErr = err
		}
	}

	return lastErr
}

// MockNotifier for testing purposes
type MockNotifier struct {
	sentAlerts []*Alert
}

func NewMockNotifier() *MockNotifier {
	return &MockNotifier{
		sentAlerts: make([]*Alert, 0),
	}
}

func (n *MockNotifier) Type() string {
	return "mock"
}

func (n *MockNotifier) Send(ctx context.Context, alert *Alert) error {
	n.sentAlerts = append(n.sentAlerts, alert)
	return nil
}

func (n *MockNotifier) GetSentAlerts() []*Alert {
	return n.sentAlerts
}

func (n *MockNotifier) Clear() {
	n.sentAlerts = make([]*Alert, 0)
}

// FilterNotifier filters alerts before sending to underlying notifier
type FilterNotifier struct {
	notifier  Notifier
	shouldSend func(*Alert) bool
}

func NewFilterNotifier(notifier Notifier, shouldSend func(*Alert) bool) *FilterNotifier {
	return &FilterNotifier{
		notifier:   notifier,
		shouldSend: shouldSend,
	}
}

func (n *FilterNotifier) Type() string {
	return "filter"
}

func (n *FilterNotifier) Send(ctx context.Context, alert *Alert) error {
	if n.shouldSend(alert) {
		return n.notifier.Send(ctx, alert)
	}
	return nil
}
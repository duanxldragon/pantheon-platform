package alerting

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// AlertSeverity represents the severity level of an alert
type AlertSeverity string

const (
	SeverityInfo     AlertSeverity = "info"
	SeverityWarning  AlertSeverity = "warning"
	SeverityError    AlertSeverity = "error"
	SeverityCritical AlertSeverity = "critical"
)

// AlertStatus represents the current status of an alert
type AlertStatus string

const (
	StatusActive   AlertStatus = "active"
	StatusAcked    AlertStatus = "acknowledged"
	StatusResolved AlertStatus = "resolved"
	StatusSilenced AlertStatus = "silenced"
)

// Alert represents a system alert
type Alert struct {
	ID            string                 `json:"id"`
	Title         string                 `json:"title"`
	Description   string                 `json:"description"`
	Severity      AlertSeverity          `json:"severity"`
	Status        AlertStatus            `json:"status"`
	Source        string                 `json:"source"`
	Timestamp     time.Time              `json:"timestamp"`
	Updated       time.Time              `json:"updated"`
	AcknowledgedBy string                `json:"acknowledged_by,omitempty"`
	AcknowledgedAt time.Time             `json:"acknowledged_at,omitempty"`
	ResolvedAt    time.Time              `json:"resolved_at,omitempty"`
	Labels        map[string]string      `json:"labels"`
	Annotations   map[string]interface{} `json:"annotations"`
	Fingerprint   string                 `json:"fingerprint"` // For deduplication
	Count         int                    `json:"count"`        // Occurrence count
}

// AlertRule defines when an alert should be triggered
type AlertRule struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Enabled     bool              `json:"enabled"`
	Severity    AlertSeverity     `json:"severity"`
	Source      string            `json:"source"`
	Conditions  []RuleCondition   `json:"conditions"`
	Actions     []AlertAction     `json:"actions"`
	Labels      map[string]string `json:"labels"`
	Cooldown    time.Duration     `json:"cooldown"`     // Minimum time between alerts
	GroupBy     []string          `json:"group_by"`     // Fields to group by
	Throttle    time.Duration     `json:"throttle"`     // Throttle notifications
}

// RuleCondition defines a condition for triggering an alert
type RuleCondition struct {
	Metric    string      `json:"metric"`
	Operator  string      `json:"operator"`  // >, <, =, !=, >=, <=
	Threshold interface{} `json:"threshold"`
	Duration  time.Duration `json:"duration"` // How long condition must be true
}

// AlertAction defines what action to take when an alert triggers
type AlertAction struct {
	Type     string                 `json:"type"`     // email, slack, sms, webhook
	Enabled  bool                   `json:"enabled"`
	Config   map[string]interface{} `json:"config"`
}

// AlertManager manages alert rules and notifications
type AlertManager struct {
	rules       map[string]*AlertRule
	activeAlerts map[string]*Alert
	alertHistory map[string][]*Alert
	mu          sync.RWMutex
	ctx         context.Context
	cancel      context.CancelFunc
	notifiers   map[string]Notifier
}

// Notifier sends alerts to external systems
type Notifier interface {
	Send(ctx context.Context, alert *Alert) error
	Type() string
}

// NewAlertManager creates a new alert manager
func NewAlertManager() *AlertManager {
	ctx, cancel := context.WithCancel(context.Background())

	manager := &AlertManager{
		rules:        make(map[string]*AlertRule),
		activeAlerts: make(map[string]*Alert),
		alertHistory: make(map[string][]*Alert),
		ctx:          ctx,
		cancel:       cancel,
		notifiers:    make(map[string]Notifier),
	}

	// Start background processing
	go manager.processAlerts()

	log.Printf("Alerting: Alert Manager initialized")

	return manager
}

// RegisterRule registers a new alert rule
func (m *AlertManager) RegisterRule(rule *AlertRule) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if rule == nil {
		return fmt.Errorf("rule cannot be nil")
	}

	m.rules[rule.ID] = rule
	log.Printf("Alerting: Registered rule %s (enabled=%v)", rule.Name, rule.Enabled)

	return nil
}

// UnregisterRule removes an alert rule
func (m *AlertManager) UnregisterRule(ruleID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.rules, ruleID)
	log.Printf("Alerting: Unregistered rule %s", ruleID)
}

// RegisterNotifier registers a notification channel
func (m *AlertManager) RegisterNotifier(notifier Notifier) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.notifiers[notifier.Type()] = notifier
	log.Printf("Alerting: Registered notifier: %s", notifier.Type())
}

// EvaluateRules evaluates all enabled rules against provided metrics
func (m *AlertManager) EvaluateRules(metrics map[string]interface{}) []*Alert {
	m.mu.RLock()
	defer m.mu.RUnlock()

	triggeredAlerts := make([]*Alert, 0)

	for _, rule := range m.rules {
		if !rule.Enabled {
			continue
		}

		if m.evaluateRule(rule, metrics) {
			alert := m.createAlert(rule, metrics)
			triggeredAlerts = append(triggeredAlerts, alert)
		}
	}

	return triggeredAlerts
}

// TriggerAlert manually triggers an alert
func (m *AlertManager) TriggerAlert(alert *Alert) error {
	if alert == nil {
		return fmt.Errorf("alert cannot be nil")
	}

	// Generate fingerprint for deduplication
	alert.Fingerprint = generateFingerprint(alert)
	alert.Timestamp = time.Now()
	alert.Updated = alert.Timestamp

	m.mu.Lock()

	// Check for existing similar alerts
	if existingAlert, exists := m.activeAlerts[alert.Fingerprint]; exists {
		// Update existing alert
		existingAlert.Count++
		existingAlert.Updated = alert.Timestamp
		alert = existingAlert
		log.Printf("Alerting: Updated existing alert %s (count=%d)", alert.ID, alert.Count)
	} else {
		// Create new alert
		alert.ID = generateAlertID()
		alert.Count = 1
		alert.Status = StatusActive
		m.activeAlerts[alert.Fingerprint] = alert

		// Add to history
		if m.alertHistory[alert.Source] == nil {
			m.alertHistory[alert.Source] = make([]*Alert, 0)
		}
		m.alertHistory[alert.Source] = append(m.alertHistory[alert.Source], alert)

		log.Printf("Alerting: New alert %s - %s [%s]", alert.ID, alert.Title, alert.Severity)
	}

	m.mu.Unlock()

	// Send notifications asynchronously
	go m.sendNotifications(alert)

	return nil
}

// AcknowledgeAlert acknowledges an active alert
func (m *AlertManager) AcknowledgeAlert(alertID, acknowledgedBy string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	alert := m.findAlertByID(alertID)
	if alert == nil {
		return fmt.Errorf("alert not found")
	}

	alert.Status = StatusAcked
	alert.AcknowledgedBy = acknowledgedBy
	alert.AcknowledgedAt = time.Now()
	alert.Updated = time.Now()

	log.Printf("Alerting: Alert %s acknowledged by %s", alertID, acknowledgedBy)

	return nil
}

// ResolveAlert marks an alert as resolved
func (m *AlertManager) ResolveAlert(alertID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	alert := m.findAlertByID(alertID)
	if alert == nil {
		return fmt.Errorf("alert not found")
	}

	alert.Status = StatusResolved
	alert.ResolvedAt = time.Now()
	alert.Updated = time.Now()

	// Remove from active alerts
	delete(m.activeAlerts, alert.Fingerprint)

	log.Printf("Alerting: Alert %s resolved", alertID)

	return nil
}

// GetActiveAlerts returns all currently active alerts
func (m *AlertManager) GetActiveAlerts() []*Alert {
	m.mu.RLock()
	defer m.mu.RUnlock()

	alerts := make([]*Alert, 0, len(m.activeAlerts))
	for _, alert := range m.activeAlerts {
		alerts = append(alerts, alert)
	}

	return alerts
}

// GetAlertHistory returns historical alerts for a source
func (m *AlertManager) GetAlertHistory(source string, limit int) []*Alert {
	m.mu.RLock()
	defer m.mu.RUnlock()

	history := m.alertHistory[source]
	if history == nil {
		return []*Alert{}
	}

	if limit > 0 && len(history) > limit {
		return history[len(history)-limit:]
	}

	return history
}

// GetStats returns alert statistics
func (m *AlertManager) GetStats() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	totalActive := len(m.activeAlerts)
	severityCount := make(map[AlertSeverity]int)
	sourceCount := make(map[string]int)

	for _, alert := range m.activeAlerts {
		severityCount[alert.Severity]++
		sourceCount[alert.Source]++
	}

	totalHistory := 0
	for _, history := range m.alertHistory {
		totalHistory += len(history)
	}

	return map[string]interface{}{
		"total_active":     totalActive,
		"total_history":    totalHistory,
		"severity_breakdown": severityCount,
		"source_breakdown":  sourceCount,
		"enabled_rules":     len(m.rules),
	}
}

// Internal methods

func (m *AlertManager) evaluateRule(rule *AlertRule, metrics map[string]interface{}) bool {
	for _, condition := range rule.Conditions {
		if !m.evaluateCondition(condition, metrics) {
			return false
		}
	}
	return true
}

func (m *AlertManager) evaluateCondition(condition RuleCondition, metrics map[string]interface{}) bool {
	metricValue, exists := metrics[condition.Metric]
	if !exists {
		return false
	}

	// Simple numeric comparison (extend as needed)
	switch condition.Operator {
	case ">":
		return compareNumbers(metricValue, condition.Threshold) > 0
	case "<":
		return compareNumbers(metricValue, condition.Threshold) < 0
	case ">=":
		return compareNumbers(metricValue, condition.Threshold) >= 0
	case "<=":
		return compareNumbers(metricValue, condition.Threshold) <= 0
	case "=":
		return metricValue == condition.Threshold
	case "!=":
		return metricValue != condition.Threshold
	default:
		return false
	}
}

func (m *AlertManager) createAlert(rule *AlertRule, metrics map[string]interface{}) *Alert {
	return &Alert{
		Title:       rule.Name,
		Description: rule.Description,
		Severity:    rule.Severity,
		Source:      rule.Source,
		Status:      StatusActive,
		Labels:      rule.Labels,
		Annotations: metrics,
	}
}

func (m *AlertManager) sendNotifications(alert *Alert) {
	for _, action := range m.getActionsForAlert(alert) {
		if !action.Enabled {
			continue
		}

		notifier, exists := m.notifiers[action.Type]
		if !exists {
			log.Printf("Alerting: No notifier found for type %s", action.Type)
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := notifier.Send(ctx, alert); err != nil {
			log.Printf("Alerting: Failed to send notification via %s: %v", action.Type, err)
		} else {
			log.Printf("Alerting: Sent notification for alert %s via %s", alert.ID, action.Type)
		}
	}
}

func (m *AlertManager) getActionsForAlert(alert *Alert) []AlertAction {
	actions := make([]AlertAction, 0)

	for _, rule := range m.rules {
		if rule.Source == alert.Source {
			actions = append(actions, rule.Actions...)
		}
	}

	return actions
}

func (m *AlertManager) findAlertByID(alertID string) *Alert {
	for _, alert := range m.activeAlerts {
		if alert.ID == alertID {
			return alert
		}
	}
	return nil
}

func (m *AlertManager) processAlerts() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return

		case <-ticker.C:
			m.cleanupOldAlerts()
		}
	}
}

func (m *AlertManager) cleanupOldAlerts() {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Clean up history older than 7 days
	cutoff := time.Now().AddDate(0, 0, -7)

	for source, history := range m.alertHistory {
		filtered := make([]*Alert, 0)
		for _, alert := range history {
			if alert.Timestamp.After(cutoff) {
				filtered = append(filtered, alert)
			}
		}
		m.alertHistory[source] = filtered
	}
}

// Shutdown gracefully shuts down the alert manager
func (m *AlertManager) Shutdown() {
	log.Printf("Alerting: Shutting down alert manager")
	m.cancel()
}

// Helper functions

func generateFingerprint(alert *Alert) string {
	// Simple fingerprint based on source and title
	return fmt.Sprintf("%s:%s", alert.Source, alert.Title)
}

func generateAlertID() string {
	return fmt.Sprintf("alert-%d", time.Now().UnixNano())
}

func compareNumbers(a, b interface{}) int {
	var aFloat, bFloat float64

	switch v := a.(type) {
	case int:
		aFloat = float64(v)
	case int64:
		aFloat = float64(v)
	case float64:
		aFloat = v
	case float32:
		aFloat = float64(v)
	default:
		return 0
	}

	switch v := b.(type) {
	case int:
		bFloat = float64(v)
	case int64:
		bFloat = float64(v)
	case float64:
		bFloat = v
	case float32:
		bFloat = float64(v)
	default:
		return 0
	}

	if aFloat < bFloat {
		return -1
	} else if aFloat > bFloat {
		return 1
	}
	return 0
}

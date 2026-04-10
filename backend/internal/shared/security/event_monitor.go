package security

import (
	"context"
	"fmt"
	"log"
	"time"
)

// SecurityEventType represents different types of security events
type SecurityEventType string

const (
	// Authentication events
	EventAuthLoginSuccess    SecurityEventType = "auth.login.success"
	EventAuthLoginFailure    SecurityEventType = "auth.login.failure"
	EventAuthLogout          SecurityEventType = "auth.logout"
	EventAuthPasswordChange  SecurityEventType = "auth.password.change"
	EventAuthPasswordReset   SecurityEventType = "auth.password.reset"
	EventAuthAccountLocked   SecurityEventType = "auth.account.locked"
	EventAuthAccountUnlocked SecurityEventType = "auth.account.unlocked"

	// Session events
	EventSessionCreated    SecurityEventType = "session.created"
	EventSessionDestroyed  SecurityEventType = "session.destroyed"
	EventSessionTimeout    SecurityEventType = "session.timeout"
	EventSessionSuspicious SecurityEventType = "session.suspicious"

	// Authorization events
	EventAuthzPermissionDenied SecurityEventType = "authz.permission.denied"
	EventAuthzRoleChanged      SecurityEventType = "authz.role.changed"

	// Data events
	EventDataExport          SecurityEventType = "data.export"
	EventDataBulkDelete      SecurityEventType = "data.bulk_delete"
	EventDataSensitiveAccess SecurityEventType = "data.sensitive.access"

	// System events
	EventSystemConfigChanged SecurityEventType = "system.config.changed"
	EventSystemSecurityAlert SecurityEventType = "system.security.alert"
)

// SecuritySeverity represents the severity level of security events
type SecuritySeverity string

const (
	SeverityLow      SecuritySeverity = "low"
	SeverityMedium   SecuritySeverity = "medium"
	SeverityHigh     SecuritySeverity = "high"
	SeverityCritical SecuritySeverity = "critical"
)

// SecurityEvent represents a security-related event
type SecurityEvent struct {
	ID        string                 `json:"id"`
	Type      SecurityEventType      `json:"type"`
	Severity  SecuritySeverity       `json:"severity"`
	Timestamp time.Time              `json:"timestamp"`
	UserID    string                 `json:"user_id,omitempty"`
	Username  string                 `json:"username,omitempty"`
	TenantID  string                 `json:"tenant_id,omitempty"`
	IPAddress string                 `json:"ip_address,omitempty"`
	UserAgent string                 `json:"user_agent,omitempty"`
	Resource  string                 `json:"resource,omitempty"`
	Action    string                 `json:"action,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
	Metadata  map[string]string      `json:"metadata,omitempty"`
}

// SecurityEventHandler handles security events
type SecurityEventHandler interface {
	HandleEvent(ctx context.Context, event *SecurityEvent) error
}

// SecurityEventMonitor monitors and processes security events
type SecurityEventMonitor struct {
	handlers []SecurityEventHandler
	mu       chan *SecurityEvent
	buffer   []*SecurityEvent
	ctx      context.Context
	cancel   context.CancelFunc
}

// NewSecurityEventMonitor creates a new security event monitor
func NewSecurityEventMonitor(bufferSize int) *SecurityEventMonitor {
	ctx, cancel := context.WithCancel(context.Background())

	monitor := &SecurityEventMonitor{
		handlers: make([]SecurityEventHandler, 0),
		mu:       make(chan *SecurityEvent, bufferSize),
		buffer:   make([]*SecurityEvent, 0, bufferSize),
		ctx:      ctx,
		cancel:   cancel,
	}

	// Start event processing loop
	go monitor.processEvents()

	return monitor
}

// RegisterHandler registers a new event handler
func (m *SecurityEventMonitor) RegisterHandler(handler SecurityEventHandler) {
	m.handlers = append(m.handlers, handler)
	log.Printf("Security: Registered event handler: %T", handler)
}

// RecordEvent records a security event
func (m *SecurityEventMonitor) RecordEvent(event *SecurityEvent) error {
	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}

	// Set timestamp if not provided
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Set default severity if not provided
	if event.Severity == "" {
		event.Severity = SeverityMedium
	}

	// Determine severity based on event type if needed
	if event.Severity == "" {
		event.Severity = determineSeverity(event.Type)
	}

	select {
	case m.mu <- event:
		return nil
	default:
		// Buffer full, log warning but don't block
		log.Printf("Security: Event buffer full, dropping event: %s", event.Type)
		return fmt.Errorf("event buffer full")
	}
}

// processEvents processes events from the buffer
func (m *SecurityEventMonitor) processEvents() {
	for {
		select {
		case <-m.ctx.Done():
			// Flush remaining events before shutdown
			m.flush()
			return

		case event := <-m.mu:
			m.handleEvent(event)
		}
	}
}

// handleEvent handles a single event
func (m *SecurityEventMonitor) handleEvent(event *SecurityEvent) {
	// Add to buffer for potential recovery
	m.buffer = append(m.buffer, event)
	if len(m.buffer) > cap(m.buffer) {
		m.buffer = m.buffer[1:] // Remove oldest
	}

	// Process through all registered handlers
	for _, handler := range m.handlers {
		if err := handler.HandleEvent(m.ctx, event); err != nil {
			log.Printf("Security: Handler %T failed for event %s: %v", handler, event.Type, err)
		}
	}

	// Log critical events immediately
	if event.Severity == SeverityCritical {
		log.Printf("Security: CRITICAL EVENT - Type: %s, User: %s, IP: %s, Details: %+v",
			event.Type, event.Username, event.IPAddress, event.Details)
	}
}

// flush flushes remaining events in the buffer
func (m *SecurityEventMonitor) flush() {
	log.Printf("Security: Flushing %d remaining events", len(m.buffer))
	for _, event := range m.buffer {
		m.handleEvent(event)
	}
	m.buffer = m.buffer[:0]
}

// Shutdown gracefully shuts down the monitor
func (m *SecurityEventMonitor) Shutdown() {
	log.Printf("Security: Shutting down event monitor")
	m.cancel()
}

// LoggingEventHandler logs security events to standard output
type LoggingEventHandler struct{}

func (h *LoggingEventHandler) HandleEvent(ctx context.Context, event *SecurityEvent) error {
	log.Printf("Security: [%s] %s - User: %s, IP: %s, Severity: %s",
		event.Type, event.Timestamp.Format(time.RFC3339),
		event.Username, event.IPAddress, event.Severity)
	return nil
}

// DatabaseEventHandler persists security events to database
type DatabaseEventHandler struct {
	// Database connection would be injected here
	enabled bool
}

func (h *DatabaseEventHandler) HandleEvent(ctx context.Context, event *SecurityEvent) error {
	if !h.enabled {
		return nil
	}
	// Implementation would store events in database
	// This is a placeholder for the actual implementation
	return nil
}

// AlertEventHandler triggers alerts for high-severity events
type AlertEventHandler struct {
	alertThreshold SecuritySeverity
}

func (h *AlertEventHandler) HandleEvent(ctx context.Context, event *SecurityEvent) error {
	// Only trigger alerts for events above threshold
	if !isSeverityHigherOrEqual(event.Severity, h.alertThreshold) {
		return nil
	}

	// Send alerts to configured channels
	alertMsg := fmt.Sprintf("SECURITY ALERT: %s - User: %s, IP: %s, Severity: %s",
		event.Type, event.Username, event.IPAddress, event.Severity)

	log.Printf("Security: ALERT - %s", alertMsg)

	// Implementation would send actual alerts to configured channels
	return nil
}

// determineSeverity determines the default severity for an event type
func determineSeverity(eventType SecurityEventType) SecuritySeverity {
	switch eventType {
	case EventAuthLoginFailure, EventAuthPasswordChange, EventAuthPasswordReset:
		return SeverityLow

	case EventAuthLoginSuccess, EventAuthLogout, EventSessionCreated, EventSessionDestroyed:
		return SeverityLow

	case EventAuthAccountLocked, EventSessionSuspicious, EventAuthzPermissionDenied:
		return SeverityMedium

	case EventAuthAccountUnlocked, EventSessionTimeout, EventDataExport:
		return SeverityMedium

	case EventDataBulkDelete, EventDataSensitiveAccess, EventSystemConfigChanged:
		return SeverityHigh

	case EventSystemSecurityAlert:
		return SeverityCritical

	default:
		return SeverityMedium
	}
}

// isSeverityHigherOrEqual checks if severity1 is higher or equal to severity2
func isSeverityHigherOrEqual(severity1, severity2 SecuritySeverity) bool {
	severityOrder := map[SecuritySeverity]int{
		SeverityLow:      0,
		SeverityMedium:   1,
		SeverityHigh:     2,
		SeverityCritical: 3,
	}

	return severityOrder[severity1] >= severityOrder[severity2]
}

// Helper functions to create common security events

// NewLoginSuccessEvent creates a successful login event
func NewLoginSuccessEvent(userID, username, tenantID, ipAddress, userAgent string) *SecurityEvent {
	return &SecurityEvent{
		Type:      EventAuthLoginSuccess,
		Severity:  SeverityLow,
		Timestamp: time.Now(),
		UserID:    userID,
		Username:  username,
		TenantID:  tenantID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"login_method": "password",
		},
	}
}

// NewLoginFailureEvent creates a failed login event
func NewLoginFailureEvent(username, tenantID, ipAddress, userAgent, reason string) *SecurityEvent {
	return &SecurityEvent{
		Type:      EventAuthLoginFailure,
		Severity:  SeverityMedium,
		Timestamp: time.Now(),
		Username:  username,
		TenantID:  tenantID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"failure_reason": reason,
		},
	}
}

// NewAccountLockedEvent creates an account locked event
func NewAccountLockedEvent(userID, username, tenantID, ipAddress, reason string) *SecurityEvent {
	return &SecurityEvent{
		Type:      EventAuthAccountLocked,
		Severity:  SeverityMedium,
		Timestamp: time.Now(),
		UserID:    userID,
		Username:  username,
		TenantID:  tenantID,
		IPAddress: ipAddress,
		Details: map[string]interface{}{
			"lock_reason": reason,
		},
	}
}

// NewSuspiciousSessionEvent creates a suspicious session event
func NewSuspiciousSessionEvent(userID, username, ipAddress, userAgent, reason string) *SecurityEvent {
	return &SecurityEvent{
		Type:      EventSessionSuspicious,
		Severity:  SeverityHigh,
		Timestamp: time.Now(),
		UserID:    userID,
		Username:  username,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"suspicion_reason": reason,
		},
	}
}

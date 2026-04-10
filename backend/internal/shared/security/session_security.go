package security

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// SessionSecurityConfig defines session security policies
type SessionSecurityConfig struct {
	MaxConcurrentSessions  int           // Maximum concurrent sessions per user (0 = unlimited)
	SessionTimeout         time.Duration // Session timeout duration
	AbsoluteTimeout        time.Duration // Absolute session timeout (regardless of activity)
	IdleTimeout            time.Duration // Idle timeout for sessions
	DetectSuspicious       bool          // Enable suspicious activity detection
	TrackDeviceFingerprint bool          // Track device fingerprints
}

// DefaultSessionSecurityConfig returns default session security configuration
func DefaultSessionSecurityConfig() *SessionSecurityConfig {
	return &SessionSecurityConfig{
		MaxConcurrentSessions:  0, // Unlimited by default
		SessionTimeout:         24 * time.Hour,
		AbsoluteTimeout:        7 * 24 * time.Hour, // 7 days absolute
		IdleTimeout:            2 * time.Hour,      // 2 hours idle
		DetectSuspicious:       true,
		TrackDeviceFingerprint: true,
	}
}

// SessionInfo contains information about a user session
type SessionInfo struct {
	SessionID    string
	UserID       string
	Username     string
	TenantID     string
	IPAddress    string
	UserAgent    string
	DeviceID     string // Device fingerprint
	LoginTime    time.Time
	LastActivity time.Time
	IsCurrent    bool
	Location     string // Geo location (if available)
	DeviceType   string // Mobile, Desktop, etc.
	Browser      string // Chrome, Firefox, etc.
}

// SessionSecurityManager manages session security policies
type SessionSecurityManager struct {
	config       *SessionSecurityConfig
	sessions     map[string]*SessionInfo // sessionID -> SessionInfo
	userSessions map[string][]string     // userID -> []sessionID
	mu           sync.RWMutex
	ctx          context.Context
	cancel       context.CancelFunc
}

// NewSessionSecurityManager creates a new session security manager
func NewSessionSecurityManager(config *SessionSecurityConfig) *SessionSecurityManager {
	if config == nil {
		config = DefaultSessionSecurityConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	manager := &SessionSecurityManager{
		config:       config,
		sessions:     make(map[string]*SessionInfo),
		userSessions: make(map[string][]string),
		ctx:          ctx,
		cancel:       cancel,
	}

	// Start background cleanup goroutine
	go manager.cleanupExpiredSessions()

	log.Printf("Security: Session Security Manager initialized with max_sessions=%d, timeout=%v",
		config.MaxConcurrentSessions, config.SessionTimeout)

	return manager
}

// RegisterSession registers a new session
func (m *SessionSecurityManager) RegisterSession(session *SessionInfo) error {
	if session == nil {
		return fmt.Errorf("session cannot be nil")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Check concurrent session limit
	if m.config.MaxConcurrentSessions > 0 {
		userSessionCount := len(m.userSessions[session.UserID])
		if userSessionCount >= m.config.MaxConcurrentSessions {
			// Remove oldest session
			oldestSessionID := m.findOldestSession(session.UserID)
			if oldestSessionID != "" {
				if err := m.removeSessionLocked(oldestSessionID); err == nil {
					log.Printf("Security: Removed oldest session for user %s due to concurrent limit", session.Username)
				}
			}
		}
	}

	// Store session
	m.sessions[session.SessionID] = session
	m.userSessions[session.UserID] = append(m.userSessions[session.UserID], session.SessionID)

	log.Printf("Security: Registered session %s for user %s from %s", session.SessionID, session.Username, session.IPAddress)

	return nil
}

// UpdateActivity updates the last activity time for a session
func (m *SessionSecurityManager) UpdateActivity(sessionID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if session, exists := m.sessions[sessionID]; exists {
		session.LastActivity = time.Now()
	}
}

// ValidateSession validates if a session is still valid
func (m *SessionSecurityManager) ValidateSession(sessionID string) (*SessionValidationResult, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := &SessionValidationResult{
		Valid: true,
	}

	session, exists := m.sessions[sessionID]
	if !exists {
		result.Valid = false
		result.Reason = "session_not_found"
		return result, nil
	}

	now := time.Now()

	// Check absolute timeout
	if m.config.AbsoluteTimeout > 0 {
		age := now.Sub(session.LoginTime)
		if age > m.config.AbsoluteTimeout {
			result.Valid = false
			result.Reason = "absolute_timeout"
			return result, nil
		}
	}

	// Check idle timeout
	if m.config.IdleTimeout > 0 {
		idleTime := now.Sub(session.LastActivity)
		if idleTime > m.config.IdleTimeout {
			result.Valid = false
			result.Reason = "idle_timeout"
			return result, nil
		}
	}

	// Check session timeout
	if m.config.SessionTimeout > 0 {
		age := now.Sub(session.LoginTime)
		if age > m.config.SessionTimeout {
			result.Valid = false
			result.Reason = "session_timeout"
			return result, nil
		}
	}

	return result, nil
}

// RevokeSession revokes a specific session
func (m *SessionSecurityManager) RevokeSession(sessionID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	return m.removeSessionLocked(sessionID)
}

// RevokeAllUserSessions revokes all sessions for a user
func (m *SessionSecurityManager) RevokeAllUserSessions(userID string) int {
	m.mu.Lock()
	defer m.mu.Unlock()

	sessionIDs := m.userSessions[userID]
	count := 0

	for _, sessionID := range sessionIDs {
		if m.removeSessionLocked(sessionID) == nil {
			count++
		}
	}

	log.Printf("Security: Revoked %d sessions for user %s", count, userID)
	return count
}

// GetUserSessions returns all active sessions for a user
func (m *SessionSecurityManager) GetUserSessions(userID string) []*SessionInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()

	sessionIDs := m.userSessions[userID]
	sessions := make([]*SessionInfo, 0, len(sessionIDs))

	for _, sessionID := range sessionIDs {
		if session, exists := m.sessions[sessionID]; exists {
			sessions = append(sessions, session)
		}
	}

	return sessions
}

// DetectSuspiciousActivity checks for suspicious login patterns
func (m *SessionSecurityManager) DetectSuspiciousActivity(session *SessionInfo) ([]SecurityAlert, error) {
	alerts := make([]SecurityAlert, 0)

	if !m.config.DetectSuspicious {
		return alerts, nil
	}

	m.mu.RLock()
	defer m.mu.RUnlock()

	userSessions := m.userSessions[session.UserID]

	// Check for simultaneous logins from different locations
	for _, sessionID := range userSessions {
		existingSession, exists := m.sessions[sessionID]
		if !exists || existingSession.SessionID == session.SessionID {
			continue
		}

		// Check for different IP addresses within short time
		timeDiff := session.LoginTime.Sub(existingSession.LoginTime)
		if timeDiff < 5*time.Minute && existingSession.IPAddress != session.IPAddress {
			alerts = append(alerts, SecurityAlert{
				Type:      "simultaneous_login",
				Severity:  "high",
				Message:   "Simultaneous login from different IP addresses",
				SessionID: session.SessionID,
				UserID:    session.UserID,
				Details: map[string]interface{}{
					"new_ip":      session.IPAddress,
					"existing_ip": existingSession.IPAddress,
					"time_diff":   timeDiff.Minutes(),
				},
			})
		}

		// Check for different user agents
		if existingSession.UserAgent != session.UserAgent && timeDiff < 1*time.Hour {
			alerts = append(alerts, SecurityAlert{
				Type:      "device_change",
				Severity:  "medium",
				Message:   "Login from different device/browser",
				SessionID: session.SessionID,
				UserID:    session.UserID,
				Details: map[string]interface{}{
					"new_ua":      session.UserAgent,
					"existing_ua": existingSession.UserAgent,
					"time_diff":   timeDiff.Minutes(),
				},
			})
		}

		// Check for unusual login time (e.g., 2 AM - 6 AM)
		hour := session.LoginTime.Hour()
		if hour >= 2 && hour <= 6 {
			alerts = append(alerts, SecurityAlert{
				Type:      "unusual_time",
				Severity:  "low",
				Message:   "Login during unusual hours",
				SessionID: session.SessionID,
				UserID:    session.UserID,
				Details: map[string]interface{}{
					"login_hour": hour,
				},
			})
		}
	}

	return alerts, nil
}

// SessionValidationResult contains session validation results
type SessionValidationResult struct {
	Valid  bool
	Reason string
}

// SecurityAlert represents a security alert
type SecurityAlert struct {
	Type      string                 `json:"type"`
	Severity  string                 `json:"severity"`
	Message   string                 `json:"message"`
	SessionID string                 `json:"session_id"`
	UserID    string                 `json:"user_id"`
	Timestamp time.Time              `json:"timestamp"`
	Details   map[string]interface{} `json:"details"`
}

// Internal methods

func (m *SessionSecurityManager) removeSessionLocked(sessionID string) error {
	session, exists := m.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session not found")
	}

	// Remove from sessions map
	delete(m.sessions, sessionID)

	// Remove from user sessions
	userSessionIDs := m.userSessions[session.UserID]
	newSessionIDs := make([]string, 0, len(userSessionIDs)-1)
	for _, sid := range userSessionIDs {
		if sid != sessionID {
			newSessionIDs = append(newSessionIDs, sid)
		}
	}
	m.userSessions[session.UserID] = newSessionIDs

	log.Printf("Security: Removed session %s for user %s", sessionID, session.Username)

	return nil
}

func (m *SessionSecurityManager) findOldestSession(userID string) string {
	sessionIDs := m.userSessions[userID]
	if len(sessionIDs) == 0 {
		return ""
	}

	oldestSessionID := sessionIDs[0]
	oldestTime := time.Now()

	for _, sessionID := range sessionIDs {
		if session, exists := m.sessions[sessionID]; exists {
			if session.LoginTime.Before(oldestTime) {
				oldestTime = session.LoginTime
				oldestSessionID = sessionID
			}
		}
	}

	return oldestSessionID
}

func (m *SessionSecurityManager) cleanupExpiredSessions() {
	ticker := time.NewTicker(5 * time.Minute) // Run every 5 minutes
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return

		case <-ticker.C:
			m.cleanup()
		}
	}
}

func (m *SessionSecurityManager) cleanup() {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	expiredSessions := make([]string, 0)

	for sessionID, session := range m.sessions {
		// Check absolute timeout
		if m.config.AbsoluteTimeout > 0 {
			age := now.Sub(session.LoginTime)
			if age > m.config.AbsoluteTimeout {
				expiredSessions = append(expiredSessions, sessionID)
				continue
			}
		}

		// Check idle timeout
		if m.config.IdleTimeout > 0 {
			idleTime := now.Sub(session.LastActivity)
			if idleTime > m.config.IdleTimeout {
				expiredSessions = append(expiredSessions, sessionID)
				continue
			}
		}
	}

	// Remove expired sessions
	for _, sessionID := range expiredSessions {
		if err := m.removeSessionLocked(sessionID); err == nil {
			log.Printf("Security: Cleaned up expired session %s", sessionID)
		}
	}

	if len(expiredSessions) > 0 {
		log.Printf("Security: Cleaned up %d expired sessions", len(expiredSessions))
	}
}

// Shutdown gracefully shuts down the manager
func (m *SessionSecurityManager) Shutdown() {
	log.Printf("Security: Shutting down session security manager")
	m.cancel()
}

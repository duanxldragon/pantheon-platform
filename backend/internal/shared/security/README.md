# Enterprise Security Features

This directory contains enterprise-grade security enhancements for the Pantheon Platform.

## Components

### 1. Password Validator (`password_validator.go`)

Enterprise-grade password validation with configurable policies.

**Features:**
- Configurable password policies (length, character requirements)
- Password strength assessment (Weak/Medium/Strong)
- Common password detection
- User info exclusion (username, email parts)
- Pattern detection (repeating characters, sequential patterns)

**Usage:**
```go
import "pantheon-platform/backend/internal/shared/security"

// Use default policy
result := security.ValidatePassword(password, security.DefaultPasswordPolicy())

// Use stricter admin policy
adminResult := security.ValidatePassword(adminPassword, security.AdminPasswordPolicy())

// Validate with user context
userResult := security.ValidatePasswordWithUserInfo(password, username, email, policy)

if !result.Valid {
    fmt.Println("Password validation failed:", result.Errors)
}
```

**Policy Configuration:**
```go
policy := &security.PasswordPolicy{
    MinLength:           12,
    RequireUppercase:    true,
    RequireLowercase:    true,
    RequireNumbers:      true,
    RequireSpecialChars: true,
    ForbidCommonWords:   true,
    ForbidUserInfo:      true,
}
```

### 2. JWT Key Manager (`jwt_key_manager.go`)

JWT key management with rotation support for enhanced security.

**Features:**
- Automatic key rotation (configurable interval)
- Graceful key rotation with previous key support
- Key strength validation
- Rotation status monitoring
- Multi-version key support

**Usage:**
```go
import "pantheon-platform/backend/internal/shared/security"

// Initialize with environment
manager := security.InitializeWithEnvironment(initialJWTSecret)

// Check if rotation is needed
if manager.ShouldRotate() {
    keyInfo, err := manager.RotateKey()
    if err != nil {
        log.Printf("Key rotation failed: %v", err)
    }
}

// Get current key for signing
currentKey := manager.GetCurrentKey()

// Validate keys during token verification
isValid := manager.ValidateKey(keyFromToken)

// Get rotation status
status := manager.GetRotationStatus()
```

**Configuration:**
- Default rotation interval: 30 days (production), 7 days (development)
- Retains last 3 keys for graceful rotation
- Automatic cleanup of old keys

### 3. Security Event Monitor (`event_monitor.go`)

Comprehensive security event monitoring and alerting system.

**Features:**
- Multiple event types (auth, session, authorization, data, system)
- Severity levels (Low, Medium, High, Critical)
- Multiple handler support (logging, database, alerts)
- Asynchronous event processing
- Event buffering for reliability

**Event Types:**
- Authentication: login success/failure, logout, password change/reset, account lock/unlock
- Session: created, destroyed, timeout, suspicious activity
- Authorization: permission denied, role changes
- Data: export, bulk delete, sensitive access
- System: config changes, security alerts

**Usage:**
```go
import "pantheon-platform/backend/internal/shared/security"

// Create monitor with buffer size
monitor := security.NewSecurityEventMonitor(1000)

// Register handlers
monitor.RegisterHandler(&security.LoggingEventHandler{})
monitor.RegisterHandler(&security.AlertEventHandler{
    AlertThreshold: security.SeverityHigh,
    AlertChannels:  []string{"email", "slack"},
})

// Record events
event := security.NewLoginSuccessEvent(userID, username, tenantID, ip, userAgent)
monitor.RecordEvent(event)

// Record suspicious activity
suspiciousEvent := security.NewSuspiciousSessionEvent(userID, username, ip, ua, "geographically impossible login")
monitor.RecordEvent(suspiciousEvent)
```

### 4. Session Security Manager (`session_security.go`)

Advanced session management with security policies.

**Features:**
- Concurrent session limiting
- Multiple timeout types (absolute, idle, session)
- Suspicious activity detection
- Device fingerprinting support
- Automatic session cleanup
- Geographic anomaly detection

**Security Policies:**
```go
config := &security.SessionSecurityConfig{
    MaxConcurrentSessions:  5,                 // Max 5 concurrent sessions
    SessionTimeout:         24 * time.Hour,    // 24-hour session timeout
    AbsoluteTimeout:        7 * 24 * time.Hour, // 7-day absolute timeout
    IdleTimeout:            2 * time.Hour,      // 2-hour idle timeout
    DetectSuspicious:       true,              // Enable suspicious detection
    TrackDeviceFingerprint: true,              // Track devices
}
```

**Usage:**
```go
import "pantheon-platform/backend/internal/shared/security"

// Create manager
manager := security.NewSessionSecurityManager(config)

// Register new session
session := &security.SessionInfo{
    SessionID:  sessionID,
    UserID:     userID,
    Username:   username,
    TenantID:   tenantID,
    IPAddress:  clientIP,
    UserAgent:  userAgent,
    DeviceID:   deviceFingerprint,
    LoginTime:  time.Now(),
    LastActivity: time.Now(),
}
err := manager.RegisterSession(session)

// Validate session
validation, err := manager.ValidateSession(sessionID)
if !validation.Valid {
    log.Printf("Session invalid: %s", validation.Reason)
}

// Detect suspicious activity
alerts, err := manager.DetectSuspiciousActivity(session)
if len(alerts) > 0 {
    for _, alert := range alerts {
        log.Printf("Security Alert: %s - %s", alert.Type, alert.Message)
    }
}

// Get user sessions
sessions := manager.GetUserSessions(userID)
```

## Integration Examples

### Complete Security Setup

```go
package main

import (
    "pantheon-platform/backend/internal/shared/security"
)

func setupSecuritySystem(jwtSecret string) {
    // 1. Initialize JWT key manager
    keyManager := security.InitializeWithEnvironment(jwtSecret)
    
    // 2. Create security event monitor
    eventMonitor := security.NewSecurityEventMonitor(1000)
    eventMonitor.RegisterHandler(&security.LoggingEventHandler{})
    eventMonitor.RegisterHandler(&security.AlertEventHandler{
        AlertThreshold: security.SeverityHigh,
    })
    
    // 3. Create session security manager
    sessionConfig := security.DefaultSessionSecurityConfig()
    sessionManager := security.NewSessionSecurityManager(sessionConfig)
    
    // 4. Setup password policies
    defaultPolicy := security.DefaultPasswordPolicy()
    adminPolicy := security.AdminPasswordPolicy()
    
    // Use components in authentication flow...
}
```

### Authentication Flow with Security

```go
func (s *authService) LoginWithSecurity(ctx context.Context, req *LoginRequest) (*LoginResponse, error) {
    // 1. Validate password strength
    validationResult := security.ValidatePasswordWithUserInfo(
        req.Password, 
        req.Username, 
        "", // email
        security.DefaultPasswordPolicy(),
    )
    
    if !validationResult.Valid && validationResult.Strength < security.PasswordMedium {
        // Log weak password attempt
        event := security.NewLoginFailureEvent(req.Username, "", clientIP, userAgent, "weak_password")
        s.eventMonitor.RecordEvent(event)
    }
    
    // 2. Perform authentication...
    
    // 3. Register session
    session := &security.SessionInfo{
        SessionID:    sessionID,
        UserID:       userID,
        Username:     username,
        IPAddress:    clientIP,
        UserAgent:    userAgent,
        LoginTime:    time.Now(),
        LastActivity: time.Now(),
    }
    s.sessionManager.RegisterSession(session)
    
    // 4. Check for suspicious activity
    alerts, _ := s.sessionManager.DetectSuspiciousActivity(session)
    if len(alerts) > 0 {
        for _, alert := range alerts {
            s.eventMonitor.RecordEvent(&security.SecurityEvent{
                Type:     security.EventSystemSecurityAlert,
                Severity: security.SeverityHigh,
                Details:  map[string]interface{}{"alert": alert},
            })
        }
    }
    
    // 5. Record successful login
    loginEvent := security.NewLoginSuccessEvent(userID, username, tenantID, clientIP, userAgent)
    s.eventMonitor.RecordEvent(loginEvent)
    
    return response, nil
}
```

## Security Best Practices

1. **Password Policy**: Use AdminPasswordPolicy for administrator accounts
2. **Key Rotation**: Enable automatic JWT key rotation (30-day intervals)
3. **Session Management**: Implement both idle and absolute timeouts
4. **Event Monitoring**: Log all security events for audit trails
5. **Suspicious Detection**: Enable automatic suspicious activity detection
6. **Multi-factor Authentication**: Combine with 2FA for enhanced security

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=<your_secure_jwt_secret_32_chars>
JWT_KEY_ROTATION_ENABLED=true
JWT_KEY_ROTATION_INTERVAL_DAYS=30

# Session Security
MAX_CONCURRENT_SESSIONS=5
SESSION_TIMEOUT_HOURS=24
IDLE_TIMEOUT_HOURS=2
ABSOLUTE_TIMEOUT_DAYS=7

# Password Policy
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true
```

## Monitoring and Alerts

### Key Metrics to Monitor

- Failed login attempts per user
- Account lockouts
- Suspicious session activities
- Password change frequency
- Session timeout occurrences
- JWT key rotation status

### Alert Thresholds

- **Low**: Informational events (successful logins, normal operations)
- **Medium**: Potential issues (failed logins, unusual times)
- **High**: Security concerns (suspicious activity, permission denied)
- **Critical**: Immediate action required (account compromise, system breach)

## Testing

```go
func TestPasswordValidation() {
    policy := security.DefaultPasswordPolicy()
    
    // Test weak password
    result := security.ValidatePassword("password", policy)
    assert.False(t, result.Valid)
    
    // Test strong password
    strongPassword := "SecureP@ssw0rd!2026"
    result = security.ValidatePassword(strongPassword, policy)
    assert.True(t, result.Valid)
    assert.Equal(t, security.PasswordStrong, result.Strength)
}

func TestKeyRotation() {
    manager := security.NewJWTKeyManager("initial-key", 24*time.Hour)
    
    initialVersion := manager.GetCurrentKeyVersion()
    keyInfo, err := manager.RotateKey()
    assert.NoError(t, err)
    assert.Greater(t, keyInfo.Version, initialVersion)
}
```

## Compliance Support

These security features support compliance with:
- **SOC 2**: Security monitoring, session management, access controls
- **GDPR**: Data access logging, user consent tracking
- **HIPAA**: Audit trails, session security, access controls
- **PCI DSS**: Password policies, session management, logging

## Future Enhancements

- Advanced biometric authentication
- Geographic login restrictions
- Behavioral analytics
- Machine learning threat detection
- Blockchain-based audit logs
- Zero-trust architecture support

## Support and Maintenance

- Regular security updates
- Compliance rule updates
- Performance optimization
- Integration with external security tools
- Custom policy development
# Intelligent Alerting System

Enterprise-grade alerting system with rule engine, aggregation, deduplication, and multi-channel notifications.

## Features

- **Rule Engine**: Configurable alert rules with complex conditions
- **Alert Deduplication**: Automatic grouping of similar alerts
- **Multi-channel Notifications**: Email, Slack, webhooks, and more
- **Alert Lifecycle**: Active, Acknowledged, Resolved, Silenced states
- **Severity Levels**: Info, Warning, Error, Critical
- **Smart Throttling**: Prevent alert fatigue with cooldown periods
- **Rich Metadata**: Labels and annotations for context
- **Historical Tracking**: Complete alert history and statistics

## Architecture

### Core Components

1. **AlertManager**: Central alert management system
2. **Notifiers**: Pluggable notification channels
3. **Alert Rules**: Predefined and custom alert conditions
4. **Alert Lifecycle**: State management for alerts

### Alert Flow

```
Metrics/Events → Rule Evaluation → Alert Creation → Deduplication → Notification → Management
```

## Quick Start

### Basic Setup

```go
import "pantheon-platform/backend/internal/modules/ops/alerting"

// Create alert manager
manager := alerting.NewAlertManager()

// Register notifiers
emailNotifier := alerting.NewEmailNotifier(&alerting.EmailConfig{
    SMTPHost:    "smtp.example.com",
    SMTPPort:    587,
    Username:    "alerts@example.com",
    Password:    "password",
    FromAddress: "alerts@example.com",
    ToAddresses: []string{"ops@example.com"},
    UseTLS:      true,
})

slackNotifier := alerting.NewSlackNotifier(&alerting.SlackConfig{
    WebhookURL: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    Channel:    "#alerts",
    Username:   "Pantheon Alerts",
    IconEmoji:  ":warning:",
})

manager.RegisterNotifier(emailNotifier)
manager.RegisterNotifier(slackNotifier)

// Enable predefined rules
alerting.EnableAllRules(manager)
```

### Manual Alert Triggering

```go
// Create and trigger an alert
alert := &alerting.Alert{
    Title:       "Database Connection Pool Exhausted",
    Description: "Connection pool usage at 95%",
    Severity:    alerting.SeverityCritical,
    Source:      "database",
    Labels: map[string]string{
        "database": "production",
        "region":   "us-east-1",
    },
    Annotations: map[string]interface{}{
        "usage_percent":      95.0,
        "total_connections":  100,
        "active_connections": 95,
    },
}

err := manager.TriggerAlert(alert)
```

### Rule-Based Alerting

```go
// Evaluate metrics against rules
metrics := map[string]interface{}{
    "cpu_usage_percent":        85.0,
    "memory_usage_percent":     92.0,
    "db_connection_pool_usage": 88.0,
}

triggeredAlerts := manager.EvaluateRules(metrics)
for _, alert := range triggeredAlerts {
    manager.TriggerAlert(alert)
}
```

## Alert Rules

### Rule Structure

```go
rule := &alerting.AlertRule{
    ID:          "high-cpu-usage",
    Name:        "High CPU Usage",
    Description: "CPU usage exceeds 80% for 5 minutes",
    Enabled:     true,
    Severity:    alerting.SeverityWarning,
    Source:      "system",
    Conditions: []alerting.RuleCondition{
        {
            Metric:    "cpu_usage_percent",
            Operator:  ">",
            Threshold: 80.0,
            Duration:  5 * time.Minute,
        },
    },
    Actions: []alerting.AlertAction{
        {Type: "email", Enabled: true},
        {Type: "slack", Enabled: true},
    },
    Labels: map[string]string{
        "category": "performance",
        "resource": "cpu",
    },
    Cooldown: 15 * time.Minute,
}
```

### Predefined Rules

The system includes 15+ predefined rules covering:

- **System Performance**: CPU, memory, disk usage
- **Database**: Connection pool, slow queries
- **Authentication**: Failed logins, account lockouts
- **Application**: Error rates, response times
- **Tenant**: Resource limits, unusual activity
- **Security**: Suspicious IPs, data exfiltration

```go
// Enable all predefined rules
alerting.EnableAllRules(manager)

// Enable specific categories
alerting.EnableRulesByCategory(manager, "security")
alerting.EnableRulesByCategory(manager, "performance")

// Enable by severity
alerting.EnableRulesBySeverity(manager, alerting.SeverityError)
```

## Notification Channels

### Email Notifications

```go
emailConfig := &alerting.EmailConfig{
    SMTPHost:    "smtp.gmail.com",
    SMTPPort:    587,
    Username:    "alerts@gmail.com",
    Password:    "app-password",
    FromAddress: "alerts@company.com",
    FromName:    "Pantheon Alerts",
    ToAddresses: []string{"ops@company.com", "devops@company.com"},
    UseTLS:      true,
}

emailNotifier := alerting.NewEmailNotifier(emailConfig)
manager.RegisterNotifier(emailNotifier)
```

### Slack Notifications

```go
slackConfig := &alerting.SlackConfig{
    WebhookURL: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    Channel:    "#alerts",
    Username:   "Pantheon Alerting",
    IconEmoji:  ":rotating_light:",
}

slackNotifier := alerting.NewSlackNotifier(slackConfig)
manager.RegisterNotifier(slackNotifier)
```

### Webhook Notifications

```go
webhookConfig := &alerting.WebhookConfig{
    Endpoint: "https://your-webhook-endpoint.com/alerts",
    Headers: map[string]string{
        "Authorization": "Bearer your-token",
        "X-Custom-Header": "value",
    },
    Timeout: 30,
}

webhookNotifier := alerting.NewWebhookNotifier(webhookConfig)
manager.RegisterNotifier(webhookNotifier)
```

### Log Notifications (for testing)

```go
logNotifier := alerting.NewLogNotifier(alerting.SeverityInfo)
manager.RegisterNotifier(logNotifier)
```

## Alert Management

### Alert Lifecycle

```go
// Acknowledge an alert
err := manager.AcknowledgeAlert(alertID, "john.doe")

// Resolve an alert
err := manager.ResolveAlert(alertID)

// Get active alerts
activeAlerts := manager.GetActiveAlerts()

// Get alert history
history := manager.GetAlertHistory("database", 100)

// Get statistics
stats := manager.GetStats()
```

### Alert States

- **Active**: Alert is currently firing
- **Acknowledged**: Alert has been acknowledged but not resolved
- **Resolved**: Alert condition has been resolved
- **Silenced**: Alert is temporarily suppressed

## Advanced Features

### Alert Deduplication

```go
// Similar alerts are automatically grouped
alert1 := &alerting.Alert{
    Title:    "High CPU Usage",
    Source:   "system",
    Severity: alerting.SeverityWarning,
}

manager.TriggerAlert(alert1) // Creates new alert

// After 5 minutes, same alert fires again
manager.TriggerAlert(alert1) // Updates existing alert (count: 2)
```

### Alert Grouping

```go
rule := &alerting.AlertRule{
    GroupBy: []string{"service", "endpoint"},
    // Alerts will be grouped by these fields
}
```

### Alert Throttling

```go
rule := &alerting.AlertRule{
    Throttle: 5 * time.Minute,
    // Prevent alert fatigue by limiting notifications
}
```

### Multi-Notifier Support

```go
// Send to multiple channels
multiNotifier := alerting.NewMultiNotifier(
    emailNotifier,
    slackNotifier,
    webhookNotifier,
)

manager.RegisterNotifier(multiNotifier)
```

### Conditional Notifiers

```go
// Only send critical alerts via SMS
filterNotifier := alerting.NewFilterNotifier(
    smsNotifier,
    func(alert *alerting.Alert) bool {
        return alert.Severity == alerting.SeverityCritical
    },
)

manager.RegisterNotifier(filterNotifier)
```

## Monitoring and Metrics

### Alert Statistics

```go
stats := manager.GetStats()
// Returns:
// {
//   "total_active": 15,
//   "total_history": 1250,
//   "severity_breakdown": {
//     "critical": 2,
//     "error": 5,
//     "warning": 8,
//     "info": 0
//   },
//   "source_breakdown": {
//     "database": 5,
//     "system": 3,
//     "application": 7
//   },
//   "enabled_rules": 15
// }
```

### Active Alerts Monitoring

```go
activeAlerts := manager.GetActiveAlerts()
for _, alert := range activeAlerts {
    fmt.Printf("[%s] %s - %s\n",
        alert.Severity,
        alert.Title,
        alert.Status)
}
```

## Configuration

### Environment Variables

```bash
# Email Configuration
ALERT_EMAIL_SMTP_HOST=smtp.example.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USERNAME=alerts@example.com
ALERT_EMAIL_PASSWORD=secure_password
ALERT_EMAIL_FROM=alerts@example.com
ALERT_EMAIL_TO=ops@example.com,devops@example.com

# Slack Configuration
ALERT_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ALERT_SLACK_CHANNEL=#alerts
ALERT_SLACK_USERNAME=Pantheon Alerts

# Webhook Configuration
ALERT_WEBHOOK_ENDPOINT=https://your-webhook.com/alerts
ALERT_WEBHOOK_TOKEN=your-auth-token

# Alert Behavior
ALERT_COOLDOWN_MINUTES=15
ALERT_THROTTLE_MINUTES=5
ALERT_HISTORY_RETENTION_DAYS=7
```

## Best Practices

### 1. Alert Design

```go
// Good: Specific, actionable
{
    Title: "Database Connection Pool Exhausted",
    Description: "95% connection pool usage. Immediate action required.",
    Severity: SeverityCritical,
}

// Bad: Vague, not actionable
{
    Title: "Database Issue",
    Description: "Something is wrong with the database",
    Severity: SeverityWarning,
}
```

### 2. Severity Guidelines

- **Critical**: Immediate action required (service down, security breach)
- **Error**: Action required soon (degraded performance, resource exhaustion)
- **Warning**: Monitor closely (elevated resource usage, unusual patterns)
- **Info**: Informational (normal operations, scheduled events)

### 3. Throttling Strategy

```go
// Critical: No throttling
if severity == SeverityCritical {
    Cooldown: 0
}

// Error: Moderate throttling
if severity == SeverityError {
    Cooldown: 5 * time.Minute
}

// Warning: Aggressive throttling
if severity == SeverityWarning {
    Cooldown: 15 * time.Minute
}
```

### 4. Alert Fatigue Prevention

```go
// Use grouping to reduce noise
GroupBy: []string{"service", "error_type"}

// Use throttling to limit notifications
Throttle: 10 * time.Minute

// Use cooldown to prevent repeated alerts
Cooldown: 30 * time.Minute
```

## Integration Examples

### Complete Production Setup

```go
func setupProductionAlerting() *alerting.AlertManager {
    manager := alerting.NewAlertManager()

    // Register all notifiers
    manager.RegisterNotifier(setupEmailNotifier())
    manager.RegisterNotifier(setupSlackNotifier())
    manager.RegisterNotifier(setupWebhookNotifier())
    manager.RegisterNotifier(setupPagerDutyNotifier())

    // Enable all predefined rules
    alerting.EnableAllRules(manager)

    // Add custom rules
    manager.RegisterRule(createCustomRule())

    return manager
}

func setupEmailNotifier() alerting.Notifier {
    return alerting.NewEmailNotifier(&alerting.EmailConfig{
        SMTPHost:    os.Getenv("ALERT_EMAIL_SMTP_HOST"),
        SMTPPort:    587,
        Username:    os.Getenv("ALERT_EMAIL_USERNAME"),
        Password:    os.Getenv("ALERT_EMAIL_PASSWORD"),
        FromAddress: os.Getenv("ALERT_EMAIL_FROM"),
        ToAddresses: strings.Split(os.Getenv("ALERT_EMAIL_TO"), ","),
        UseTLS:      true,
    })
}
```

### Monitoring Integration

```go
func monitorSystemMetrics(manager *alerting.AlertManager) {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()

    for range ticker.C {
        metrics := collectSystemMetrics()
        alerts := manager.EvaluateRules(metrics)

        for _, alert := range alerts {
            manager.TriggerAlert(alert)
        }
    }
}

func collectSystemMetrics() map[string]interface{} {
    return map[string]interface{}{
        "cpu_usage_percent":        getCPUUsage(),
        "memory_usage_percent":     getMemoryUsage(),
        "disk_usage_percent":       getDiskUsage(),
        "db_connection_pool_usage": getDBPoolUsage(),
    }
}
```

## Testing

### Unit Testing

```go
func TestAlertTriggering(t *testing.T) {
    manager := alerting.NewAlertManager()
    mockNotifier := alerting.NewMockNotifier()
    manager.RegisterNotifier(mockNotifier)

    alert := &alerting.Alert{
        Title:    "Test Alert",
        Severity: alerting.SeverityInfo,
        Source:   "test",
    }

    manager.TriggerAlert(alert)

    sentAlerts := mockNotifier.GetSentAlerts()
    assert.Equal(t, 1, len(sentAlerts))
    assert.Equal(t, "Test Alert", sentAlerts[0].Title)
}
```

### Integration Testing

```go
func TestRuleEvaluation(t *testing.T) {
    manager := alerting.NewAlertManager()

    rule := &alerting.AlertRule{
        ID:       "test-rule",
        Name:     "Test Rule",
        Enabled:  true,
        Severity: alerting.SeverityWarning,
        Source:   "test",
        Conditions: []alerting.RuleCondition{
            {
                Metric:    "test_metric",
                Operator:  ">",
                Threshold: 50,
            },
        },
    }

    manager.RegisterRule(rule)

    metrics := map[string]interface{}{
        "test_metric": 75.0,
    }

    alerts := manager.EvaluateRules(metrics)
    assert.Equal(t, 1, len(alerts))
}
```

## Troubleshooting

### Common Issues

**1. Alerts not firing**
- Check rule evaluation logic
- Verify metric names match
- Ensure rules are enabled

**2. Too many alerts**
- Increase cooldown periods
- Add alert grouping
- Implement throttling

**3. Notifications not sending**
- Verify notifier configuration
- Check authentication credentials
- Test webhook endpoints

**4. Alert deduplication not working**
- Ensure fingerprints are consistent
- Check label consistency
- Verify alert similarity logic

## Performance Considerations

- **Alert Buffer Size**: Default 1000 alerts
- **Evaluation Frequency**: Don't evaluate more frequently than needed
- **Notification Timeout**: 30 seconds default
- **History Retention**: 7 days default

## Future Enhancements

- Alert escalation policies
- Scheduled silencing (maintenance windows)
- Alert correlation and dependency analysis
- Machine learning for anomaly detection
- Custom alert routing based on tenant
- Alert dashboards and visualization
- Integration with incident management systems
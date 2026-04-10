package alerting

import (
	"log"
	"time"
)

// PredefinedAlertRules provides common alert rule templates
var PredefinedAlertRules = []*AlertRule{
	// System Performance Rules
	{
		ID:          "cpu-high-usage",
		Name:        "High CPU Usage",
		Description: "CPU usage exceeds threshold for extended period",
		Enabled:     true,
		Severity:    SeverityWarning,
		Source:      "system",
		Conditions: []RuleCondition{
			{
				Metric:    "cpu_usage_percent",
				Operator:  ">",
				Threshold: 80.0,
				Duration:  5 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "log",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "performance",
			"resource": "cpu",
		},
		Cooldown: 15 * time.Minute,
	},

	{
		ID:          "memory-high-usage",
		Name:        "High Memory Usage",
		Description: "Memory usage exceeds threshold",
		Enabled:     true,
		Severity:    SeverityWarning,
		Source:      "system",
		Conditions: []RuleCondition{
			{
				Metric:    "memory_usage_percent",
				Operator:  ">",
				Threshold: 85.0,
				Duration:  5 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "log",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "performance",
			"resource": "memory",
		},
		Cooldown: 15 * time.Minute,
	},

	{
		ID:          "disk-space-low",
		Name:        "Low Disk Space",
		Description: "Disk space is running low",
		Enabled:     true,
		Severity:    SeverityError,
		Source:      "system",
		Conditions: []RuleCondition{
			{
				Metric:    "disk_usage_percent",
				Operator:  ">",
				Threshold: 90.0,
				Duration:  1 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "email",
				Enabled: true,
			},
			{
				Type:    "slack",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "storage",
			"resource": "disk",
		},
		Cooldown: 1 * time.Hour,
	},

	// Database Rules
	{
		ID:          "db-connection-pool-exhausted",
		Name:        "Database Connection Pool Exhausted",
		Description: "Database connection pool usage is critically high",
		Enabled:     true,
		Severity:    SeverityCritical,
		Source:      "database",
		Conditions: []RuleCondition{
			{
				Metric:    "db_connection_pool_usage_percent",
				Operator:  ">",
				Threshold: 90.0,
				Duration:  2 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "slack",
				Enabled: true,
			},
			{
				Type:    "email",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "database",
			"resource": "connections",
		},
		Cooldown: 10 * time.Minute,
	},

	{
		ID:          "db-slow-query",
		Name:        "Database Slow Query Detected",
		Description: "Database query execution time exceeds threshold",
		Enabled:     true,
		Severity:    SeverityWarning,
		Source:      "database",
		Conditions: []RuleCondition{
			{
				Metric:    "db_query_duration_seconds",
				Operator:  ">",
				Threshold: 5.0,
				Duration:  1 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "log",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "database",
			"resource": "performance",
		},
		GroupBy:  []string{"query_hash", "database"},
		Throttle: 5 * time.Minute,
	},

	// Authentication & Security Rules
	{
		ID:          "auth-multiple-failed-logins",
		Name:        "Multiple Failed Login Attempts",
		Description: "User has multiple failed login attempts",
		Enabled:     true,
		Severity:    SeverityWarning,
		Source:      "auth",
		Conditions: []RuleCondition{
			{
				Metric:    "auth_failed_login_count",
				Operator:  ">=",
				Threshold: 5,
				Duration:  5 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "slack",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "security",
			"type":     "authentication",
		},
		GroupBy: []string{"username", "ip_address"},
	},

	{
		ID:          "auth-account-lockout",
		Name:        "Account Locked Out",
		Description: "User account has been locked due to security policy",
		Enabled:     true,
		Severity:    SeverityError,
		Source:      "auth",
		Conditions: []RuleCondition{
			{
				Metric:    "auth_account_locked",
				Operator:  "=",
				Threshold: true,
				Duration:  1 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "email",
				Enabled: true,
			},
			{
				Type:    "slack",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "security",
			"type":     "authentication",
		},
		GroupBy: []string{"username"},
	},

	// Application Rules
	{
		ID:          "app-high-error-rate",
		Name:        "High Application Error Rate",
		Description: "Application error rate exceeds threshold",
		Enabled:     true,
		Severity:    SeverityError,
		Source:      "application",
		Conditions: []RuleCondition{
			{
				Metric:    "app_error_rate_percent",
				Operator:  ">",
				Threshold: 5.0,
				Duration:  5 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "slack",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "application",
			"type":     "errors",
		},
		GroupBy:  []string{"service", "endpoint"},
		Cooldown: 10 * time.Minute,
	},

	{
		ID:          "app-high-response-time",
		Name:        "High Response Time",
		Description: "Application response time is degraded",
		Enabled:     true,
		Severity:    SeverityWarning,
		Source:      "application",
		Conditions: []RuleCondition{
			{
				Metric:    "app_response_time_p95_seconds",
				Operator:  ">",
				Threshold: 2.0,
				Duration:  5 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "log",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "performance",
			"type":     "latency",
		},
		GroupBy: []string{"service", "endpoint"},
	},

	// Tenant-specific Rules
	{
		ID:          "tenant-resource-limit-near",
		Name:        "Tenant Resource Limit Approaching",
		Description: "Tenant is approaching resource usage limits",
		Enabled:     true,
		Severity:    SeverityWarning,
		Source:      "tenant",
		Conditions: []RuleCondition{
			{
				Metric:    "tenant_resource_usage_percent",
				Operator:  ">",
				Threshold: 80.0,
				Duration:  5 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "email",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "tenant",
			"type":     "resources",
		},
		GroupBy: []string{"tenant_id"},
	},

	{
		ID:          "tenant-unusual-activity",
		Name:        "Unusual Tenant Activity Detected",
		Description: "Tenant shows unusual activity patterns",
		Enabled:     true,
		Severity:    SeverityInfo,
		Source:      "tenant",
		Conditions: []RuleCondition{
			{
				Metric:    "tenant_request_rate_anomaly_score",
				Operator:  ">",
				Threshold: 0.8,
				Duration:  1 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "log",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "tenant",
			"type":     "anomaly",
		},
		GroupBy: []string{"tenant_id"},
	},

	// Security Rules
	{
		ID:          "security-suspicious-ip",
		Name:        "Suspicious IP Address Detected",
		Description: "Requests from known malicious IP address",
		Enabled:     true,
		Severity:    SeverityCritical,
		Source:      "security",
		Conditions: []RuleCondition{
			{
				Metric:    "security_ip_reputation_score",
				Operator:  "<",
				Threshold: 30,
				Duration:  1 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "slack",
				Enabled: true,
			},
			{
				Type:    "email",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "security",
			"type":     "threat",
		},
		GroupBy: []string{"ip_address"},
	},

	{
		ID:          "security-data-exfiltration-attempt",
		Name:        "Potential Data Exfiltration Attempt",
		Description: "Unusual data export activity detected",
		Enabled:     true,
		Severity:    SeverityCritical,
		Source:      "security",
		Conditions: []RuleCondition{
			{
				Metric:    "data_export_volume_mb",
				Operator:  ">",
				Threshold: 1000.0,
				Duration:  10 * time.Minute,
			},
		},
		Actions: []AlertAction{
			{
				Type:    "slack",
				Enabled: true,
			},
			{
				Type:    "email",
				Enabled: true,
			},
		},
		Labels: map[string]string{
			"category": "security",
			"type":     "data_loss",
		},
		GroupBy: []string{"user_id", "tenant_id"},
	},
}

// GetRulesByCategory returns rules grouped by category
func GetRulesByCategory(category string) []*AlertRule {
	rules := make([]*AlertRule, 0)

	for _, rule := range PredefinedAlertRules {
		if ruleCategory, exists := rule.Labels["category"]; exists && ruleCategory == category {
			rules = append(rules, rule)
		}
	}

	return rules
}

// GetRulesBySource returns rules grouped by source
func GetRulesBySource(source string) []*AlertRule {
	rules := make([]*AlertRule, 0)

	for _, rule := range PredefinedAlertRules {
		if rule.Source == source {
			rules = append(rules, rule)
		}
	}

	return rules
}

// GetRulesBySeverity returns rules grouped by severity
func GetRulesBySeverity(severity AlertSeverity) []*AlertRule {
	rules := make([]*AlertRule, 0)

	for _, rule := range PredefinedAlertRules {
		if rule.Severity == severity {
			rules = append(rules, rule)
		}
	}

	return rules
}

// EnableAllRules enables all predefined rules
func EnableAllRules(manager *AlertManager) {
	for _, rule := range PredefinedAlertRules {
		if err := manager.RegisterRule(rule); err != nil {
			log.Printf("Alerting: failed to register rule %s: %v", rule.ID, err)
		}
	}
}

// EnableRulesByCategory enables rules for a specific category
func EnableRulesByCategory(manager *AlertManager, category string) {
	rules := GetRulesByCategory(category)
	for _, rule := range rules {
		if err := manager.RegisterRule(rule); err != nil {
			log.Printf("Alerting: failed to register rule %s: %v", rule.ID, err)
		}
	}
}

// EnableRulesBySeverity enables rules at or above a severity level
func EnableRulesBySeverity(manager *AlertManager, minSeverity AlertSeverity) {
	severityOrder := map[AlertSeverity]int{
		SeverityInfo:     0,
		SeverityWarning:  1,
		SeverityError:    2,
		SeverityCritical: 3,
	}

	for _, rule := range PredefinedAlertRules {
		if severityOrder[rule.Severity] >= severityOrder[minSeverity] {
			if err := manager.RegisterRule(rule); err != nil {
				log.Printf("Alerting: failed to register rule %s: %v", rule.ID, err)
			}
		}
	}
}

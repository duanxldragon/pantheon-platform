# Tenant Monitoring System

Enterprise-grade monitoring system for multi-tenant environments with real-time health assessment, resource tracking, and intelligent alerting.

## Features

- **Comprehensive Metrics Collection**
  - Performance metrics (response time, error rate, throughput)
  - Resource utilization (CPU, memory, disk, database)
  - Usage patterns (requests, users, storage)
  - Custom metrics support

- **Health Assessment**
  - Multi-dimensional health scoring (0-100)
  - Configurable health evaluators
  - Historical trend analysis
  - Dependency tracking

- **Intelligent Alerting**
  - Configurable alert thresholds
  - Warning and critical levels
  - Cooldown periods to prevent alert fatigue
  - Tenant-specific alerting

- **Historical Analysis**
  - Configurable data retention
  - Trend analysis and forecasting
  - Performance baselines
  - Capacity planning support

## Quick Start

### Basic Setup

```go
import "pantheon-platform/backend/internal/modules/tenant/monitor"

// Create tenant monitor with 5-minute collection interval and 7-day retention
monitor := monitor.NewTenantMonitor(5*time.Minute, 7*24*time.Hour)

// Register metric collectors
monitor.RegisterCollector(NewDatabaseCollector(dbProvider))
monitor.RegisterCollector(NewApplicationCollector(requestTracker))
monitor.RegisterCollector(NewResourceCollector(resourceProvider))
monitor.RegisterCollector(NewUsageCollector(usageProvider))
monitor.RegisterCollector(NewCacheCollector(cacheProvider))

// Register health evaluators
monitor.RegisterEvaluator(NewPerformanceHealthEvaluator())
monitor.RegisterEvaluator(NewResourceHealthEvaluator())
monitor.RegisterEvaluator(NewUsageHealthEvaluator())
monitor.RegisterEvaluator(NewTrendHealthEvaluator())

// Add tenants to monitoring
monitor.AddTenant("tenant-1-id", "ACME", "ACME Corporation")
monitor.AddTenant("tenant-2-id", "GLOBEX", "Globex Corporation")

// Set alert thresholds
monitor.SetAlertThreshold("cpu_usage", 75.0, 90.0, 15*time.Minute)
monitor.SetAlertThreshold("error_rate", 1.0, 5.0, 10*time.Minute)
monitor.SetAlertThreshold("p95_response_time", 1000.0, 2000.0, 10*time.Minute)

// Start monitoring
monitor.Start()
```

### Monitoring Operations

```go
// Get current metrics for a tenant
metrics, err := monitor.GetTenantMetrics("tenant-1-id")
fmt.Printf("Tenant Health: %s (%.1f/100)\n", metrics.Health.Status, metrics.Health.Score)
fmt.Printf("Response Time: %.2fms\n", metrics.Performance.P95ResponseTime)
fmt.Printf("Error Rate: %.2f%%\n", metrics.Performance.ErrorRate)
fmt.Printf("CPU Usage: %.2f%%\n", metrics.Resources.CPUUsage)

// Get health status
health, err := monitor.GetTenantHealth("tenant-1-id")
fmt.Printf("Health Status: %s\n", health.Status)

// Get historical trends (last 24 hours)
trends, err := monitor.GetTenantTrends("tenant-1-id", 24*time.Hour)
for _, point := range trends {
    fmt.Printf("%s: Score=%.1f\n", point.Timestamp.Format(time.RFC3339), point.Metrics["health_score"])
}

// Get system overview
overview := monitor.GetSystemOverview()
fmt.Printf("Total Tenants: %d\n", overview["total_tenants"])
fmt.Printf("Healthy Tenants: %d\n", overview["healthy_tenants"])
```

## Metrics Collection

### Performance Metrics

```go
type PerformanceMetrics struct {
    AverageResponseTime      float64  // Average response time (ms)
    P95ResponseTime          float64  // 95th percentile response time (ms)
    P99ResponseTime          float64  // 99th percentile response time (ms)
    RequestsPerSecond        float64  // Current request rate
    ErrorRate                float64  // Error rate percentage
    DatabaseQueryTime        float64  // Average database query time (ms)
    CacheHitRate             float64  // Cache hit rate percentage
    ExternalAPILatency       float64  // External API latency (ms)
    ConcurrentUsers          int64    // Number of concurrent users
    ActiveSessions           int64    // Number of active sessions
}
```

### Resource Metrics

```go
type ResourceMetrics struct {
    CPUUsage                float64  // CPU usage percentage
    MemoryUsage             float64  // Memory usage percentage
    DiskUsage               float64  // Disk usage percentage
    DatabaseConnections     int64    // Active database connections
    DatabaseConnectionPool  float64  // Connection pool usage percentage
    NetworkInBytes          int64    // Network input bytes
    NetworkOutBytes         int64    // Network output bytes
    StorageUsed             int64    // Storage used (bytes)
    StorageQuota            int64    // Storage quota (bytes)
    BandwidthUsage          float64  // Bandwidth usage percentage
}
```

### Usage Metrics

```go
type UsageMetrics struct {
    TotalRequests          int64  // Total requests
    SuccessfulRequests     int64  // Successful requests
    FailedRequests         int64  // Failed requests
    ActiveUsers            int64  // Active users
    NewUsers               int64  // New users
    DataStored             int64   // Data stored (bytes)
    DataTransferred        int64   // Data transferred (bytes)
    APIcalls               int64  // API calls
    BatchOperations        int64  // Batch operations
    Exports                int64  // Export operations
    Imports                int64  // Import operations
}
```

## Health Assessment

### Health Scores

- **Excellent (90-100)**: Optimal performance, all metrics within normal ranges
- **Good (75-89)**: Performing well, minor deviations acceptable
- **Fair (60-74)**: Some performance concerns, monitoring required
- **Poor (40-59)**: Significant issues, attention needed
- **Critical (0-39)**: Critical issues, immediate action required

### Health Evaluators

#### Performance Health Evaluator

Evaluates tenant health based on application performance metrics:

```go
evaluator := NewPerformanceHealthEvaluator()
health, err := evaluator.Evaluate(ctx, tenantMetrics)

// Weights:
// - Response time: 30%
// - Error rate: 40%
// - Throughput: 20%
// - Concurrency: 10%
```

#### Resource Health Evaluator

Evaluates tenant health based on resource utilization:

```go
evaluator := NewResourceHealthEvaluator()
health, err := evaluator.Evaluate(ctx, tenantMetrics)

// Weights:
// - CPU: 30%
// - Memory: 30%
// - Disk: 20%
// - Database: 20%
```

#### Trend Health Evaluator

Analyzes historical trends to identify degrading performance:

```go
evaluator := NewTrendHealthEvaluator()
health, err := evaluator.Evaluate(ctx, tenantMetrics)

// Detects:
// - Increasing response times
// - Rising error rates
// - Resource usage trends
// - Performance degradation
```

#### Composite Health Evaluator

Combines multiple evaluators with weighted scoring:

```go
composite := NewCompositeHealthEvaluator()
composite.AddEvaluator(NewPerformanceHealthEvaluator(), 0.4)
composite.AddEvaluator(NewResourceHealthEvaluator(), 0.3)
composite.AddEvaluator(NewUsageHealthEvaluator(), 0.2)
composite.AddEvaluator(NewTrendHealthEvaluator(), 0.1)

monitor.RegisterEvaluator(composite)
```

## Alert Configuration

### Setting Alert Thresholds

```go
// CPU usage alerts
monitor.SetAlertThreshold("cpu_usage", 75.0, 90.0, 15*time.Minute)
// Warning at 75%, Critical at 90%, 15-minute cooldown

// Error rate alerts
monitor.SetAlertThreshold("error_rate", 1.0, 5.0, 10*time.Minute)
// Warning at 1%, Critical at 5%, 10-minute cooldown

// Response time alerts
monitor.SetAlertThreshold("p95_response_time", 1000.0, 2000.0, 10*time.Minute)
// Warning at 1000ms, Critical at 2000ms, 10-minute cooldown

// Database connection pool alerts
monitor.SetAlertThreshold("db_pool_usage", 75.0, 90.0, 5*time.Minute)
// Warning at 75%, Critical at 90%, 5-minute cooldown
```

### Custom Alert Handlers

Integrate with the intelligent alerting system:

```go
// Create alert manager
alertManager := alerting.NewAlertManager()

// Register alert action
alertManager.RegisterNotifier(alerting.NewSlackNotifier(&alerting.SlackConfig{
    WebhookURL: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    Channel:    "#tenant-alerts",
    Username:   "Tenant Monitor",
}))

// Tenant monitor will trigger alerts through alerting system
```

## Advanced Usage

### Custom Metric Collectors

```go
// Custom collector for business-specific metrics
type BusinessMetricsCollector struct {
    analyticsProvider AnalyticsProvider
}

func (c *BusinessMetricsCollector) Name() string {
    return "business_metrics"
}

func (c *BusinessMetricsCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
    revenue, err := c.analyticsProvider.GetDailyRevenue(ctx, tenantID)
    if err != nil {
        return nil, err
    }

    conversions, err := c.analyticsProvider.GetConversions(ctx, tenantID)
    if err != nil {
        return nil, err
    }

    return map[string]interface{}{
        "business_revenue":    revenue,
        "business_conversions": conversions,
        "business_metrics": map[string]interface{}{
            "daily_active_users": analytics.GetDailyActiveUsers(ctx, tenantID),
            "conversion_rate":    analytics.GetConversionRate(ctx, tenantID),
        },
    }, nil
}

// Register custom collector
monitor.RegisterCollector(&BusinessMetricsCollector{analyticsProvider: provider})
```

### Custom Health Evaluators

```go
// Custom evaluator for business health
type BusinessHealthEvaluator struct{}

func (e *BusinessHealthEvaluator) Name() string {
    return "business_health"
}

func (e *BusinessHealthEvaluator) Evaluate(ctx context.Context, metrics *TenantMetrics) (*HealthMetrics, error) {
    score := 100.0

    // Evaluate revenue trends
    if revenue, ok := metrics.CustomMetrics["business_revenue"].(float64); ok {
        if revenue < 1000.0 {
            score -= 20 // Low revenue impact
        }
    }

    // Evaluate conversion rates
    if conversionRate, ok := metrics.CustomMetrics["conversion_rate"].(float64); ok {
        if conversionRate < 2.0 {
            score -= 15 // Low conversion rate impact
        }
    }

    return &HealthMetrics{
        Status: determineHealthStatus(score),
        Score:  score,
        DependentServices: make(map[string]bool),
    }, nil
}

// Register custom evaluator
monitor.RegisterEvaluator(&BusinessHealthEvaluator{})
```

## Monitoring Best Practices

### 1. Collection Interval

```go
// High-priority tenants: 1-2 minutes
highPriorityMonitor := NewTenantMonitor(2*time.Minute, 7*24*time.Hour)

// Normal tenants: 5 minutes
normalMonitor := NewTenantMonitor(5*time.Minute, 7*24*time.Hour)

// Low-priority tenants: 10-15 minutes
lowPriorityMonitor := NewTenantMonitor(15*time.Minute, 7*24*time.Hour)
```

### 2. Data Retention

```go
// Production: 30 days
productionMonitor := NewTenantMonitor(5*time.Minute, 30*24*time.Hour)

// Development: 7 days
devMonitor := NewTenantMonitor(5*time.Minute, 7*24*time.Hour)

// Testing: 1 day
testMonitor := NewTenantMonitor(1*time.Minute, 24*time.Hour)
```

### 3. Alert Threshold Guidelines

```go
// Performance alerts
monitor.SetAlertThreshold("p95_response_time", 500.0, 1500.0, 10*time.Minute)
monitor.SetAlertThreshold("error_rate", 0.5, 2.0, 10*time.Minute)

// Resource alerts
monitor.SetAlertThreshold("cpu_usage", 70.0, 85.0, 15*time.Minute)
monitor.SetAlertThreshold("memory_usage", 75.0, 90.0, 15*time.Minute)
monitor.SetAlertThreshold("disk_usage", 80.0, 90.0, 30*time.Minute)

// Database alerts
monitor.SetAlertThreshold("db_pool_usage", 70.0, 85.0, 5*time.Minute)
monitor.SetAlertThreshold("db_query_time", 200.0, 500.0, 10*time.Minute)
```

### 4. Health Score Optimization

```go
// Configure evaluator weights based on business priorities
composite := NewCompositeHealthEvaluator()

// For performance-critical applications
composite.AddEvaluator(NewPerformanceHealthEvaluator(), 0.6)
composite.AddEvaluator(NewResourceHealthEvaluator(), 0.3)
composite.AddEvaluator(NewUsageHealthEvaluator(), 0.1)

// For resource-constrained environments
composite.AddEvaluator(NewPerformanceHealthEvaluator(), 0.3)
composite.AddEvaluator(NewResourceHealthEvaluator(), 0.6)
composite.AddEvaluator(NewUsageHealthEvaluator(), 0.1)
```

## Integration Examples

### Complete Production Setup

```go
func setupProductionMonitoring() *TenantMonitor {
    // Create monitor
    monitor := NewTenantMonitor(5*time.Minute, 30*24*time.Hour)

    // Register collectors
    monitor.RegisterCollector(NewDatabaseCollector(dbProvider))
    monitor.RegisterCollector(NewApplicationCollector(appTracker))
    monitor.RegisterCollector(NewResourceCollector(resourceProvider))
    monitor.RegisterCollector(NewUsageCollector(usageProvider))
    monitor.RegisterCollector(NewCacheCollector(cacheProvider))

    // Register evaluators
    composite := NewCompositeHealthEvaluator()
    composite.AddEvaluator(NewPerformanceHealthEvaluator(), 0.4)
    composite.AddEvaluator(NewResourceHealthEvaluator(), 0.3)
    composite.AddEvaluator(NewUsageHealthEvaluator(), 0.2)
    composite.AddEvaluator(NewTrendHealthEvaluator(), 0.1)
    monitor.RegisterEvaluator(composite)

    // Configure alerts
    configureAlertThresholds(monitor)

    // Add all production tenants
    addProductionTenants(monitor)

    // Start monitoring
    monitor.Start()

    return monitor
}

func configureAlertThresholds(monitor *TenantMonitor) {
    // Performance thresholds
    monitor.SetAlertThreshold("p95_response_time", 500.0, 1500.0, 10*time.Minute)
    monitor.SetAlertThreshold("error_rate", 0.5, 2.0, 10*time.Minute)
    monitor.SetAlertThreshold("requests_per_second", 10.0, 1.0, 15*time.Minute)

    // Resource thresholds
    monitor.SetAlertThreshold("cpu_usage", 70.0, 85.0, 15*time.Minute)
    monitor.SetAlertThreshold("memory_usage", 75.0, 90.0, 15*time.Minute)
    monitor.SetAlertThreshold("disk_usage", 80.0, 90.0, 30*time.Minute)
    monitor.SetAlertThreshold("db_pool_usage", 70.0, 85.0, 5*time.Minute)
}

func addProductionTenants(monitor *TenantMonitor) {
    tenants := []struct{
        ID, Code, Name string
    }{
        {"tenant-1", "ACME", "ACME Corporation"},
        {"tenant-2", "GLOBEX", "Globex Corporation"},
        {"tenant-3", "SOYLENT", "Soylent Corporation"},
    }

    for _, tenant := range tenants {
        monitor.AddTenant(tenant.ID, tenant.Code, tenant.Name)
    }
}
```

## Performance Considerations

### Scalability

- **Memory Usage**: Approximately 1-2MB per tenant with 7-day retention
- **CPU Usage**: Minimal for collection, moderate for trend analysis
- **Network**: Depends on number of collectors and data volume

### Optimization Tips

```go
// Use mock collectors for development/testing
monitor.RegisterCollector(NewMockDatabaseCollector())
monitor.RegisterCollector(NewMockApplicationCollector())
monitor.RegisterCollector(NewMockResourceCollector())

// Adjust collection interval based on priority
if tenant.IsHighPriority() {
    monitor.SetCollectionInterval(2 * time.Minute)
} else {
    monitor.SetCollectionInterval(10 * time.Minute)
}

// Implement lazy loading for historical data
func GetLazyTrends(monitor *TenantMonitor, tenantID string, duration time.Duration) <-chan *HistoricalMetricPoint {
    result := make(chan *HistoricalMetricPoint)
    go func() {
        defer close(result)
        trends, _ := monitor.GetTenantTrends(tenantID, duration)
        for _, point := range trends {
            result <- point
        }
    }()
    return result
}
```

## Troubleshooting

### Common Issues

**1. Missing Metrics**
- Ensure collectors are properly registered
- Check provider connectivity
- Verify tenant IDs are correct

**2. Inaccurate Health Scores**
- Review evaluator weights
- Check historical data quality
- Verify trend analysis configuration

**3. Alert Fatigue**
- Increase cooldown periods
- Adjust alert thresholds
- Implement alert grouping

**4. High Memory Usage**
- Reduce retention period
- Implement data archiving
- Optimize historical data storage

## Monitoring Dashboard Integration

```go
// API endpoints for monitoring dashboard
func (h *MonitoringHandler) GetTenantHealth(c *gin.Context) {
    tenantID := c.Param("tenant_id")

    health, err := h.monitor.GetTenantHealth(tenantID)
    if err != nil {
        c.JSON(404, gin.H{"error": "Tenant not found"})
        return
    }

    c.JSON(200, gin.H{
        "status": health.Status,
        "score":  health.Score,
        "uptime": health.Uptime,
        "dependent_services": health.DependentServices,
    })
}

func (h *MonitoringHandler) GetTenantMetrics(c *gin.Context) {
    tenantID := c.Param("tenant_id")
    duration := c.DefaultQuery("duration", "24h")

    parsedDuration, _ := time.ParseDuration(duration)

    metrics, err := h.monitor.GetTenantMetrics(tenantID)
    if err != nil {
        c.JSON(404, gin.H{"error": "Tenant not found"})
        return
    }

    trends, _ := h.monitor.GetTenantTrends(tenantID, parsedDuration)

    c.JSON(200, gin.H{
        "current": metrics,
        "trends":  trends,
    })
}

func (h *MonitoringHandler) GetSystemOverview(c *gin.Context) {
    overview := h.monitor.GetSystemOverview()
    c.JSON(200, overview)
}
```

## Future Enhancements

- Anomaly detection using machine learning
- Predictive health scoring
- Automated remediation recommendations
- Advanced capacity planning tools
- Cross-tenant correlation analysis
- Real-time streaming metrics
- Custom dashboards and visualization
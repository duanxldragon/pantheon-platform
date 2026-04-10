package monitor

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// TenantMonitor provides comprehensive monitoring for multi-tenant environments
type TenantMonitor struct {
	mu                 sync.RWMutex
	tenants            map[string]*TenantMetrics
	collectors         []MetricCollector
	evaluators         []HealthEvaluator
	alertThresholds    map[string]AlertThreshold
	ctx                context.Context
	cancel             context.CancelFunc
	collectionInterval time.Duration
	retentionPeriod    time.Duration
}

// TenantMetrics contains all metrics for a specific tenant
type TenantMetrics struct {
	TenantID        string
	TenantCode      string
	TenantName      string
	StartTime       time.Time
	LastUpdated     time.Time
	Performance     *PerformanceMetrics
	Resources       *ResourceMetrics
	Usage           *UsageMetrics
	Health          *HealthMetrics
	CustomMetrics   map[string]interface{}
	HistoricalData  []*HistoricalMetricPoint
}

// PerformanceMetrics tracks performance indicators
type PerformanceMetrics struct {
	AverageResponseTime      float64       // milliseconds
	P95ResponseTime          float64       // milliseconds
	P99ResponseTime          float64       // milliseconds
	RequestsPerSecond        float64
	ErrorRate                float64       // percentage
	DatabaseQueryTime        float64       // milliseconds
	CacheHitRate             float64       // percentage
	ExternalAPILatency       float64       // milliseconds
	ConcurrentUsers          int64
	ActiveSessions           int64
}

// ResourceMetrics tracks resource utilization
type ResourceMetrics struct {
	CPUUsage                float64 // percentage
	MemoryUsage             float64 // percentage
	DiskUsage               float64 // percentage
	DatabaseConnections     int64
	DatabaseConnectionPool  float64 // percentage
	NetworkInBytes          int64
	NetworkOutBytes         int64
	StorageUsed             int64   // bytes
	StorageQuota            int64   // bytes
	BandwidthUsage          float64 // percentage
}

// UsageMetrics tracks tenant usage patterns
type UsageMetrics struct {
	TotalRequests          int64
	SuccessfulRequests     int64
	FailedRequests         int64
	ActiveUsers            int64
	NewUsers               int64
	DataStored             int64   // bytes
	DataTransferred         int64   // bytes
	APIcalls               int64
	BatchOperations        int64
	Exports                int64
	Imports                int64
}

// HealthMetrics tracks tenant health status
type HealthMetrics struct {
	Status                 HealthStatus
	Score                  float64 // 0-100
	Uptime                 float64 // percentage
	LastIncident           time.Time
	IncidentsLast24h       int
	IncidentsLast7d        int
	DependentServices      map[string]bool
	ConfigurationDrift     bool
	BackupStatus           string
	ReplicationLag         time.Duration
}

// HealthStatus represents tenant health status
type HealthStatus string

const (
	HealthStatusExcellent HealthStatus = "excellent"
	HealthStatusGood      HealthStatus = "good"
	HealthStatusFair      HealthStatus = "fair"
	HealthStatusPoor      HealthStatus = "poor"
	HealthStatusCritical  HealthStatus = "critical"
)

// HistoricalMetricPoint represents a metric data point over time
type HistoricalMetricPoint struct {
	Timestamp time.Time
	Metrics   map[string]interface{}
}

// MetricCollector collects metrics from various sources
type MetricCollector interface {
	Collect(ctx context.Context, tenantID string) (map[string]interface{}, error)
	Name() string
}

// HealthEvaluator evaluates tenant health
type HealthEvaluator interface {
	Evaluate(ctx context.Context, metrics *TenantMetrics) (*HealthMetrics, error)
	Name() string
}

// AlertThreshold defines alerting thresholds for tenant metrics
type AlertThreshold struct {
	Metric          string
	WarningLevel    float64
	CriticalLevel   float64
	Cooldown        time.Duration
	LastAlert       time.Time
}

// NewTenantMonitor creates a new tenant monitoring system
func NewTenantMonitor(collectionInterval, retentionPeriod time.Duration) *TenantMonitor {
	ctx, cancel := context.WithCancel(context.Background())

	return &TenantMonitor{
		tenants:            make(map[string]*TenantMetrics),
		collectors:         make([]MetricCollector, 0),
		evaluators:         make([]HealthEvaluator, 0),
		alertThresholds:    make(map[string]AlertThreshold),
		ctx:                ctx,
		cancel:             cancel,
		collectionInterval: collectionInterval,
		retentionPeriod:    retentionPeriod,
	}
}

// RegisterCollector registers a new metric collector
func (m *TenantMonitor) RegisterCollector(collector MetricCollector) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.collectors = append(m.collectors, collector)
	log.Printf("TenantMonitor: Registered collector %s", collector.Name())
}

// RegisterEvaluator registers a new health evaluator
func (m *TenantMonitor) RegisterEvaluator(evaluator HealthEvaluator) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.evaluators = append(m.evaluators, evaluator)
	log.Printf("TenantMonitor: Registered evaluator %s", evaluator.Name())
}

// SetAlertThreshold sets an alert threshold for a metric
func (m *TenantMonitor) SetAlertThreshold(metric string, warning, critical float64, cooldown time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.alertThresholds[metric] = AlertThreshold{
		Metric:        metric,
		WarningLevel:  warning,
		CriticalLevel: critical,
		Cooldown:      cooldown,
		LastAlert:     time.Time{},
	}
}

// AddTenant adds a tenant to monitoring
func (m *TenantMonitor) AddTenant(tenantID, tenantCode, tenantName string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	m.tenants[tenantID] = &TenantMetrics{
		TenantID:       tenantID,
		TenantCode:     tenantCode,
		TenantName:     tenantName,
		StartTime:      now,
		LastUpdated:    now,
		Performance:    &PerformanceMetrics{},
		Resources:      &ResourceMetrics{},
		Usage:          &UsageMetrics{},
		Health:         &HealthMetrics{Status: HealthStatusGood, Score: 100},
		CustomMetrics:  make(map[string]interface{}),
		HistoricalData: make([]*HistoricalMetricPoint, 0),
	}

	log.Printf("TenantMonitor: Added tenant %s (%s) to monitoring", tenantCode, tenantName)
}

// RemoveTenant removes a tenant from monitoring
func (m *TenantMonitor) RemoveTenant(tenantID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.tenants, tenantID)
	log.Printf("TenantMonitor: Removed tenant %s from monitoring", tenantID)
}

// CollectMetrics collects metrics for all monitored tenants
func (m *TenantMonitor) CollectMetrics() error {
	m.mu.RLock()
	tenantIDs := make([]string, 0, len(m.tenants))
	for id := range m.tenants {
		tenantIDs = append(tenantIDs, id)
	}
	m.mu.RUnlock()

	for _, tenantID := range tenantIDs {
		if err := m.collectTenantMetrics(tenantID); err != nil {
			log.Printf("TenantMonitor: Failed to collect metrics for tenant %s: %v", tenantID, err)
		}
	}

	return nil
}

// collectTenantMetrics collects metrics for a specific tenant
func (m *TenantMonitor) collectTenantMetrics(tenantID string) error {
	m.mu.Lock()
	tenant, exists := m.tenants[tenantID]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("tenant not found")
	}
	m.mu.Unlock()

	ctx, cancel := context.WithTimeout(m.ctx, 30*time.Second)
	defer cancel()

	// Collect metrics from all registered collectors
	for _, collector := range m.collectors {
		metrics, err := collector.Collect(ctx, tenantID)
		if err != nil {
			log.Printf("TenantMonitor: Collector %s failed for tenant %s: %v", collector.Name(), tenantID, err)
			continue
		}

		m.updateTenantMetrics(tenant, metrics)
	}

	// Evaluate health
	if err := m.evaluateTenantHealth(tenant); err != nil {
		log.Printf("TenantMonitor: Health evaluation failed for tenant %s: %v", tenantID, err)
	}

	// Check alert thresholds
	m.checkAlertThresholds(tenant)

	// Store historical data
	m.storeHistoricalData(tenant)

	// Update timestamp
	m.mu.Lock()
	tenant.LastUpdated = time.Now()
	m.mu.Unlock()

	return nil
}

// updateTenantMetrics updates tenant metrics with collected data
func (m *TenantMonitor) updateTenantMetrics(tenant *TenantMetrics, metrics map[string]interface{}) {
	// Update performance metrics
	if perf, ok := metrics["performance"].(map[string]interface{}); ok {
		if avgResponseTime, ok := perf["avg_response_time"].(float64); ok {
			tenant.Performance.AverageResponseTime = avgResponseTime
		}
		if p95ResponseTime, ok := perf["p95_response_time"].(float64); ok {
			tenant.Performance.P95ResponseTime = p95ResponseTime
		}
		if requestsPerSecond, ok := perf["requests_per_second"].(float64); ok {
			tenant.Performance.RequestsPerSecond = requestsPerSecond
		}
		if errorRate, ok := perf["error_rate"].(float64); ok {
			tenant.Performance.ErrorRate = errorRate
		}
		if concurrentUsers, ok := perf["concurrent_users"].(int64); ok {
			tenant.Performance.ConcurrentUsers = concurrentUsers
		}
	}

	// Update resource metrics
	if res, ok := metrics["resources"].(map[string]interface{}); ok {
		if cpuUsage, ok := res["cpu_usage"].(float64); ok {
			tenant.Resources.CPUUsage = cpuUsage
		}
		if memoryUsage, ok := res["memory_usage"].(float64); ok {
			tenant.Resources.MemoryUsage = memoryUsage
		}
		if diskUsage, ok := res["disk_usage"].(float64); ok {
			tenant.Resources.DiskUsage = diskUsage
		}
		if dbConnections, ok := res["db_connections"].(int64); ok {
			tenant.Resources.DatabaseConnections = dbConnections
		}
		if dbPoolUsage, ok := res["db_pool_usage"].(float64); ok {
			tenant.Resources.DatabaseConnectionPool = dbPoolUsage
		}
	}

	// Update usage metrics
	if usage, ok := metrics["usage"].(map[string]interface{}); ok {
		if totalRequests, ok := usage["total_requests"].(int64); ok {
			tenant.Usage.TotalRequests = totalRequests
		}
		if successfulRequests, ok := usage["successful_requests"].(int64); ok {
			tenant.Usage.SuccessfulRequests = successfulRequests
		}
		if failedRequests, ok := usage["failed_requests"].(int64); ok {
			tenant.Usage.FailedRequests = failedRequests
		}
		if activeUsers, ok := usage["active_users"].(int64); ok {
			tenant.Usage.ActiveUsers = activeUsers
		}
	}

	// Store custom metrics
	for key, value := range metrics {
		if _, exists := tenant.CustomMetrics[key]; !exists {
			tenant.CustomMetrics[key] = value
		}
	}
}

// evaluateTenantHealth evaluates tenant health
func (m *TenantMonitor) evaluateTenantHealth(tenant *TenantMetrics) error {
	ctx, cancel := context.WithTimeout(m.ctx, 10*time.Second)
	defer cancel()

	// Run all evaluators and aggregate results
	var totalScore float64
	var evaluatorCount int

	for _, evaluator := range m.evaluators {
		health, err := evaluator.Evaluate(ctx, tenant)
		if err != nil {
			log.Printf("TenantMonitor: Evaluator %s failed: %v", evaluator.Name(), err)
			continue
		}

		totalScore += health.Score
		evaluatorCount++
	}

	if evaluatorCount > 0 {
		tenant.Health.Score = totalScore / float64(evaluatorCount)
		tenant.Health.Status = determineHealthStatus(tenant.Health.Score)
	} else {
		// Fallback to simple evaluation
		tenant.Health.Score = m.calculateSimpleHealthScore(tenant)
		tenant.Health.Status = determineHealthStatus(tenant.Health.Score)
	}

	return nil
}

// calculateSimpleHealthScore provides a basic health score calculation
func (m *TenantMonitor) calculateSimpleHealthScore(tenant *TenantMetrics) float64 {
	score := 100.0

	// Performance penalties
	if tenant.Performance.ErrorRate > 5 {
		score -= 20
	} else if tenant.Performance.ErrorRate > 1 {
		score -= 10
	}

	if tenant.Performance.P95ResponseTime > 2000 {
		score -= 15
	} else if tenant.Performance.P95ResponseTime > 1000 {
		score -= 5
	}

	// Resource penalties
	if tenant.Resources.CPUUsage > 90 {
		score -= 20
	} else if tenant.Resources.CPUUsage > 75 {
		score -= 10
	}

	if tenant.Resources.MemoryUsage > 90 {
		score -= 15
	} else if tenant.Resources.MemoryUsage > 80 {
		score -= 5
	}

	if tenant.Resources.DatabaseConnectionPool > 90 {
		score -= 15
	} else if tenant.Resources.DatabaseConnectionPool > 75 {
		score -= 5
	}

	// Ensure score doesn't go negative
	if score < 0 {
		score = 0
	}

	return score
}

// checkAlertThresholds checks if any metrics exceed alert thresholds
func (m *TenantMonitor) checkAlertThresholds(tenant *TenantMetrics) {
	metrics := map[string]float64{
		"cpu_usage":           tenant.Resources.CPUUsage,
		"memory_usage":        tenant.Resources.MemoryUsage,
		"disk_usage":          tenant.Resources.DiskUsage,
		"error_rate":          tenant.Performance.ErrorRate,
		"p95_response_time":   tenant.Performance.P95ResponseTime,
		"db_pool_usage":       tenant.Resources.DatabaseConnectionPool,
	}

	for metric, value := range metrics {
		threshold, exists := m.alertThresholds[metric]
		if !exists {
			continue
		}

		// Check cooldown
		if time.Since(threshold.LastAlert) < threshold.Cooldown {
			continue
		}

		severity := ""
		if value >= threshold.CriticalLevel {
			severity = "CRITICAL"
		} else if value >= threshold.WarningLevel {
			severity = "WARNING"
		}

		if severity != "" {
			m.triggerAlert(tenant, metric, value, severity)
			threshold.LastAlert = time.Now()
			m.alertThresholds[metric] = threshold
		}
	}
}

// triggerAlert triggers a tenant alert
func (m *TenantMonitor) triggerAlert(tenant *TenantMetrics, metric string, value float64, severity string) {
	log.Printf("TenantMonitor: ALERT [%s] Tenant %s (%s) - %s = %.2f",
		severity, tenant.TenantCode, tenant.TenantName, metric, value)

	// In a real implementation, this would integrate with the alerting system
	// For now, we just log the alert
}

// storeHistoricalData stores metric data point for historical analysis
func (m *TenantMonitor) storeHistoricalData(tenant *TenantMetrics) {
	point := &HistoricalMetricPoint{
		Timestamp: time.Now(),
		Metrics: map[string]interface{}{
			"performance": tenant.Performance,
			"resources":   tenant.Resources,
			"usage":       tenant.Usage,
			"health_score": tenant.Health.Score,
		},
	}

	tenant.HistoricalData = append(tenant.HistoricalData, point)

	// Clean up old data based on retention period
	cutoff := time.Now().Add(-m.retentionPeriod)
	filtered := make([]*HistoricalMetricPoint, 0)
	for _, p := range tenant.HistoricalData {
		if p.Timestamp.After(cutoff) {
			filtered = append(filtered, p)
		}
	}
	tenant.HistoricalData = filtered
}

// GetTenantMetrics returns current metrics for a tenant
func (m *TenantMonitor) GetTenantMetrics(tenantID string) (*TenantMetrics, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	tenant, exists := m.tenants[tenantID]
	if !exists {
		return nil, fmt.Errorf("tenant not found")
	}

	return tenant, nil
}

// GetAllTenantMetrics returns metrics for all tenants
func (m *TenantMonitor) GetAllTenantMetrics() map[string]*TenantMetrics {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make(map[string]*TenantMetrics, len(m.tenants))
	for id, tenant := range m.tenants {
		result[id] = tenant
	}

	return result
}

// GetTenantHealth returns health status for a tenant
func (m *TenantMonitor) GetTenantHealth(tenantID string) (*HealthMetrics, error) {
	metrics, err := m.GetTenantMetrics(tenantID)
	if err != nil {
		return nil, err
	}

	return metrics.Health, nil
}

// GetTenantTrends returns historical trends for a tenant
func (m *TenantMonitor) GetTenantTrends(tenantID string, duration time.Duration) ([]*HistoricalMetricPoint, error) {
	metrics, err := m.GetTenantMetrics(tenantID)
	if err != nil {
		return nil, err
	}

	cutoff := time.Now().Add(-duration)
	trends := make([]*HistoricalMetricPoint, 0)

	for _, point := range metrics.HistoricalData {
		if point.Timestamp.After(cutoff) {
			trends = append(trends, point)
		}
	}

	return trends, nil
}

// Start starts the tenant monitoring system
func (m *TenantMonitor) Start() {
	log.Printf("TenantMonitor: Starting tenant monitoring with %d minute interval",
		int(m.collectionInterval.Minutes()))

	ticker := time.NewTicker(m.collectionInterval)
	go func() {
		for {
			select {
			case <-m.ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				if err := m.CollectMetrics(); err != nil {
					log.Printf("TenantMonitor: Metrics collection failed: %v", err)
				}
			}
		}
	}()
}

// Stop stops the tenant monitoring system
func (m *TenantMonitor) Stop() {
	log.Printf("TenantMonitor: Stopping tenant monitoring")
	m.cancel()
}

// GetSystemOverview returns system-wide monitoring overview
func (m *TenantMonitor) GetSystemOverview() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	totalTenants := len(m.tenants)
	healthyTenants := 0
	warningTenants := 0
	criticalTenants := 0

	for _, tenant := range m.tenants {
		switch tenant.Health.Status {
		case HealthStatusExcellent, HealthStatusGood:
			healthyTenants++
		case HealthStatusFair, HealthStatusPoor:
			warningTenants++
		case HealthStatusCritical:
			criticalTenants++
		}
	}

	return map[string]interface{}{
		"total_tenants":      totalTenants,
		"healthy_tenants":    healthyTenants,
		"warning_tenants":    warningTenants,
		"critical_tenants":   criticalTenants,
		"monitored_metrics":  len(m.collectors),
		"health_evaluators":  len(m.evaluators),
		"alert_thresholds":   len(m.alertThresholds),
		"collection_interval": m.collectionInterval.String(),
	}
}

// determineHealthStatus converts health score to status
func determineHealthStatus(score float64) HealthStatus {
	switch {
	case score >= 90:
		return HealthStatusExcellent
	case score >= 75:
		return HealthStatusGood
	case score >= 60:
		return HealthStatusFair
	case score >= 40:
		return HealthStatusPoor
	default:
		return HealthStatusCritical
	}
}
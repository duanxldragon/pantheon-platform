package monitor

import (
	"context"
	"fmt"
	"log"
	"math"
)

// PerformanceHealthEvaluator evaluates tenant health based on performance metrics
type PerformanceHealthEvaluator struct {
	weights map[string]float64
}

func NewPerformanceHealthEvaluator() *PerformanceHealthEvaluator {
	return &PerformanceHealthEvaluator{
		weights: map[string]float64{
			"response_time": 0.3,
			"error_rate":    0.4,
			"throughput":    0.2,
			"concurrency":   0.1,
		},
	}
}

func (e *PerformanceHealthEvaluator) Name() string {
	return "performance_health"
}

func (e *PerformanceHealthEvaluator) Evaluate(ctx context.Context, metrics *TenantMetrics) (*HealthMetrics, error) {
	score := 100.0
	issues := make([]string, 0)

	// Evaluate response time
	responseTimeScore := e.evaluateResponseTime(metrics.Performance.P95ResponseTime)
	score -= (1 - responseTimeScore) * e.weights["response_time"] * 100

	if responseTimeScore < 0.6 {
		issues = append(issues, fmt.Sprintf("High response time: %.2fms", metrics.Performance.P95ResponseTime))
	}

	// Evaluate error rate
	errorRateScore := e.evaluateErrorRate(metrics.Performance.ErrorRate)
	score -= (1 - errorRateScore) * e.weights["error_rate"] * 100

	if errorRateScore < 0.7 {
		issues = append(issues, fmt.Sprintf("High error rate: %.2f%%", metrics.Performance.ErrorRate))
	}

	// Evaluate throughput
	throughputScore := e.evaluateThroughput(metrics.Performance.RequestsPerSecond)
	score -= (1 - throughputScore) * e.weights["throughput"] * 100

	// Evaluate concurrency
	concurrencyScore := e.evaluateConcurrency(metrics.Performance.ConcurrentUsers)
	score -= (1 - concurrencyScore) * e.weights["concurrency"] * 100

	// Ensure score is within bounds
	score = math.Max(0, math.Min(100, score))
	logHealthIssues(e.Name(), issues)

	return &HealthMetrics{
		Status:            determineHealthStatus(score),
		Score:             score,
		DependentServices: make(map[string]bool),
	}, nil
}

func (e *PerformanceHealthEvaluator) evaluateResponseTime(p95ResponseTime float64) float64 {
	// Excellent: < 200ms
	// Good: 200-500ms
	// Fair: 500-1000ms
	// Poor: 1000-2000ms
	// Critical: > 2000ms

	switch {
	case p95ResponseTime < 200:
		return 1.0
	case p95ResponseTime < 500:
		return 0.9
	case p95ResponseTime < 1000:
		return 0.7
	case p95ResponseTime < 2000:
		return 0.4
	default:
		return 0.1
	}
}

func (e *PerformanceHealthEvaluator) evaluateErrorRate(errorRate float64) float64 {
	// Excellent: < 0.1%
	// Good: 0.1-1%
	// Fair: 1-5%
	// Poor: 5-10%
	// Critical: > 10%

	switch {
	case errorRate < 0.1:
		return 1.0
	case errorRate < 1:
		return 0.9
	case errorRate < 5:
		return 0.7
	case errorRate < 10:
		return 0.3
	default:
		return 0.1
	}
}

func (e *PerformanceHealthEvaluator) evaluateThroughput(requestsPerSecond float64) float64 {
	// This is contextual - for now, assume any throughput is good
	// In reality, you'd compare against expected/baseline values
	if requestsPerSecond > 0 {
		return 1.0
	}
	return 0.5
}

func (e *PerformanceHealthEvaluator) evaluateConcurrency(concurrentUsers int64) float64 {
	// Assume reasonable concurrency levels
	// In reality, this would be compared against capacity
	if concurrentUsers > 0 && concurrentUsers < 1000 {
		return 1.0
	}
	if concurrentUsers >= 1000 && concurrentUsers < 5000 {
		return 0.8
	}
	if concurrentUsers >= 5000 {
		return 0.6
	}
	return 1.0 // No users is fine for health assessment
}

// ResourceHealthEvaluator evaluates tenant health based on resource utilization
type ResourceHealthEvaluator struct {
	weights map[string]float64
}

func NewResourceHealthEvaluator() *ResourceHealthEvaluator {
	return &ResourceHealthEvaluator{
		weights: map[string]float64{
			"cpu":      0.3,
			"memory":   0.3,
			"disk":     0.2,
			"database": 0.2,
		},
	}
}

func (e *ResourceHealthEvaluator) Name() string {
	return "resource_health"
}

func (e *ResourceHealthEvaluator) Evaluate(ctx context.Context, metrics *TenantMetrics) (*HealthMetrics, error) {
	score := 100.0
	issues := make([]string, 0)

	// Evaluate CPU usage
	cpuScore := e.evaluateCPUUsage(metrics.Resources.CPUUsage)
	score -= (1 - cpuScore) * e.weights["cpu"] * 100

	if cpuScore < 0.6 {
		issues = append(issues, fmt.Sprintf("High CPU usage: %.2f%%", metrics.Resources.CPUUsage))
	}

	// Evaluate memory usage
	memoryScore := e.evaluateMemoryUsage(metrics.Resources.MemoryUsage)
	score -= (1 - memoryScore) * e.weights["memory"] * 100

	if memoryScore < 0.6 {
		issues = append(issues, fmt.Sprintf("High memory usage: %.2f%%", metrics.Resources.MemoryUsage))
	}

	// Evaluate disk usage
	diskScore := e.evaluateDiskUsage(metrics.Resources.DiskUsage)
	score -= (1 - diskScore) * e.weights["disk"] * 100

	if diskScore < 0.7 {
		issues = append(issues, fmt.Sprintf("High disk usage: %.2f%%", metrics.Resources.DiskUsage))
	}

	// Evaluate database connection pool
	dbScore := e.evaluateDatabasePool(metrics.Resources.DatabaseConnectionPool)
	score -= (1 - dbScore) * e.weights["database"] * 100

	if dbScore < 0.6 {
		issues = append(issues, fmt.Sprintf("High database pool usage: %.2f%%", metrics.Resources.DatabaseConnectionPool))
	}

	// Ensure score is within bounds
	score = math.Max(0, math.Min(100, score))
	logHealthIssues(e.Name(), issues)

	return &HealthMetrics{
		Status: determineHealthStatus(score),
		Score:  score,
		DependentServices: map[string]bool{
			"database": dbScore > 0.5,
			"storage":  diskScore > 0.5,
		},
	}, nil
}

func (e *ResourceHealthEvaluator) evaluateCPUUsage(cpuUsage float64) float64 {
	// Excellent: < 50%
	// Good: 50-70%
	// Fair: 70-85%
	// Poor: 85-95%
	// Critical: > 95%

	switch {
	case cpuUsage < 50:
		return 1.0
	case cpuUsage < 70:
		return 0.9
	case cpuUsage < 85:
		return 0.7
	case cpuUsage < 95:
		return 0.4
	default:
		return 0.1
	}
}

func (e *ResourceHealthEvaluator) evaluateMemoryUsage(memoryUsage float64) float64 {
	// Excellent: < 60%
	// Good: 60-80%
	// Fair: 80-90%
	// Poor: 90-95%
	// Critical: > 95%

	switch {
	case memoryUsage < 60:
		return 1.0
	case memoryUsage < 80:
		return 0.9
	case memoryUsage < 90:
		return 0.7
	case memoryUsage < 95:
		return 0.4
	default:
		return 0.1
	}
}

func (e *ResourceHealthEvaluator) evaluateDiskUsage(diskUsage float64) float64 {
	// Excellent: < 70%
	// Good: 70-85%
	// Fair: 85-90%
	// Poor: 90-95%
	// Critical: > 95%

	switch {
	case diskUsage < 70:
		return 1.0
	case diskUsage < 85:
		return 0.9
	case diskUsage < 90:
		return 0.7
	case diskUsage < 95:
		return 0.4
	default:
		return 0.1
	}
}

func (e *ResourceHealthEvaluator) evaluateDatabasePool(poolUsage float64) float64 {
	// Excellent: < 50%
	// Good: 50-75%
	// Fair: 75-85%
	// Poor: 85-95%
	// Critical: > 95%

	switch {
	case poolUsage < 50:
		return 1.0
	case poolUsage < 75:
		return 0.9
	case poolUsage < 85:
		return 0.7
	case poolUsage < 95:
		return 0.4
	default:
		return 0.1
	}
}

// UsageHealthEvaluator evaluates tenant health based on usage patterns
type UsageHealthEvaluator struct{}

func NewUsageHealthEvaluator() *UsageHealthEvaluator {
	return &UsageHealthEvaluator{}
}

func (e *UsageHealthEvaluator) Name() string {
	return "usage_health"
}

func (e *UsageHealthEvaluator) Evaluate(ctx context.Context, metrics *TenantMetrics) (*HealthMetrics, error) {
	score := 100.0

	// Evaluate error rate from usage
	if metrics.Usage.TotalRequests > 0 {
		errorRate := float64(metrics.Usage.FailedRequests) / float64(metrics.Usage.TotalRequests) * 100
		errorRateScore := 1.0 - (errorRate / 100) // Simple linear scoring
		score -= (1 - errorRateScore) * 30        // Error rate impacts health significantly
	}

	// Evaluate user activity (more active users is generally good)
	if metrics.Usage.ActiveUsers > 0 {
		userActivityScore := math.Min(1.0, float64(metrics.Usage.ActiveUsers)/100.0)
		score += userActivityScore * 10 // Bonus for good user activity
	}

	// Ensure score is within bounds
	score = math.Max(0, math.Min(100, score))

	return &HealthMetrics{
		Status:            determineHealthStatus(score),
		Score:             score,
		DependentServices: make(map[string]bool),
	}, nil
}

// TrendHealthEvaluator evaluates tenant health based on historical trends
type TrendHealthEvaluator struct{}

func NewTrendHealthEvaluator() *TrendHealthEvaluator {
	return &TrendHealthEvaluator{}
}

func (e *TrendHealthEvaluator) Name() string {
	return "trend_health"
}

func (e *TrendHealthEvaluator) Evaluate(ctx context.Context, metrics *TenantMetrics) (*HealthMetrics, error) {
	if len(metrics.HistoricalData) < 2 {
		// Not enough data for trend analysis
		return &HealthMetrics{
			Status:            HealthStatusGood,
			Score:             75.0, // Neutral score
			DependentServices: make(map[string]bool),
		}, nil
	}

	score := 100.0
	issues := make([]string, 0)

	// Analyze trends from recent historical data
	recentData := metrics.HistoricalData
	if len(recentData) > 10 {
		recentData = recentData[len(recentData)-10:] // Last 10 data points
	}

	// Calculate trends
	responseTimeTrend := e.calculateTrend(recentData, "p95_response_time")
	errorRateTrend := e.calculateTrend(recentData, "error_rate")
	cpuUsageTrend := e.calculateTrend(recentData, "cpu_usage")

	// Evaluate trends
	if responseTimeTrend > 0.2 { // Response time increasing significantly
		score -= 15
		issues = append(issues, "Response time degrading")
	} else if responseTimeTrend < -0.1 { // Response time improving
		score += 5
	}

	if errorRateTrend > 0.1 { // Error rate increasing
		score -= 20
		issues = append(issues, "Error rate increasing")
	} else if errorRateTrend < -0.05 { // Error rate improving
		score += 10
	}

	if cpuUsageTrend > 0.15 { // CPU usage increasing significantly
		score -= 10
		issues = append(issues, "CPU usage trending up")
	}

	// Ensure score is within bounds
	score = math.Max(0, math.Min(100, score))
	logHealthIssues(e.Name(), issues)

	return &HealthMetrics{
		Status:            determineHealthStatus(score),
		Score:             score,
		DependentServices: make(map[string]bool),
	}, nil
}

func logHealthIssues(evaluatorName string, issues []string) {
	for _, issue := range issues {
		log.Printf("TenantMonitor: %s issue: %s", evaluatorName, issue)
	}
}

// calculateTrend calculates the trend of a metric over time
// Returns positive for increasing trend, negative for decreasing
func (e *TrendHealthEvaluator) calculateTrend(data []*HistoricalMetricPoint, metricKey string) float64 {
	if len(data) < 2 {
		return 0
	}

	// Simple linear regression to determine trend
	n := float64(len(data))
	sumX := 0.0
	sumY := 0.0
	sumXY := 0.0
	sumX2 := 0.0

	for i, point := range data {
		x := float64(i)
		y := e.extractMetricValue(point, metricKey)

		sumX += x
		sumY += y
		sumXY += x * y
		sumX2 += x * x
	}

	// Calculate slope (trend)
	slope := (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX)

	// Normalize slope by average value to get relative change
	avgY := sumY / n
	if avgY != 0 {
		return slope / avgY
	}

	return slope
}

// extractMetricValue extracts a metric value from a historical data point
func (e *TrendHealthEvaluator) extractMetricValue(point *HistoricalMetricPoint, metricKey string) float64 {
	metrics := point.Metrics

	// Try to extract from performance metrics
	if perf, ok := metrics["performance"].(map[string]interface{}); ok {
		if val, ok := perf[metricKey].(float64); ok {
			return val
		}
	}

	// Try to extract from resources
	if res, ok := metrics["resources"].(map[string]interface{}); ok {
		if val, ok := res[metricKey].(float64); ok {
			return val
		}
	}

	// Try direct access
	if val, ok := metrics[metricKey].(float64); ok {
		return val
	}

	return 0
}

// CompositeHealthEvaluator combines multiple evaluators with weighted scoring
type CompositeHealthEvaluator struct {
	evaluators []HealthEvaluator
	weights    map[string]float64
}

func NewCompositeHealthEvaluator() *CompositeHealthEvaluator {
	return &CompositeHealthEvaluator{
		evaluators: make([]HealthEvaluator, 0),
		weights:    make(map[string]float64),
	}
}

func (e *CompositeHealthEvaluator) AddEvaluator(evaluator HealthEvaluator, weight float64) {
	e.evaluators = append(e.evaluators, evaluator)
	e.weights[evaluator.Name()] = weight
}

func (e *CompositeHealthEvaluator) Name() string {
	return "composite_health"
}

func (e *CompositeHealthEvaluator) Evaluate(ctx context.Context, metrics *TenantMetrics) (*HealthMetrics, error) {
	if len(e.evaluators) == 0 {
		return &HealthMetrics{
			Status:            HealthStatusGood,
			Score:             75.0,
			DependentServices: make(map[string]bool),
		}, nil
	}

	var weightedScore float64
	var totalWeight float64
	dependentServices := make(map[string]bool)

	for _, evaluator := range e.evaluators {
		health, err := evaluator.Evaluate(ctx, metrics)
		if err != nil {
			continue // Skip evaluators that fail
		}

		weight := e.weights[evaluator.Name()]
		weightedScore += health.Score * weight
		totalWeight += weight

		// Merge dependent services
		for service, status := range health.DependentServices {
			dependentServices[service] = status
		}
	}

	// Calculate final score
	finalScore := 75.0 // Default score
	if totalWeight > 0 {
		finalScore = weightedScore / totalWeight
	}

	return &HealthMetrics{
		Status:            determineHealthStatus(finalScore),
		Score:             finalScore,
		DependentServices: dependentServices,
	}, nil
}

// Mock implementations for testing

// MockHealthEvaluator provides a mock health evaluator for testing
type MockHealthEvaluator struct {
	score  float64
	status HealthStatus
}

func NewMockHealthEvaluator(score float64, status HealthStatus) *MockHealthEvaluator {
	return &MockHealthEvaluator{
		score:  score,
		status: status,
	}
}

func (e *MockHealthEvaluator) Name() string {
	return "mock_health"
}

func (e *MockHealthEvaluator) Evaluate(ctx context.Context, metrics *TenantMetrics) (*HealthMetrics, error) {
	return &HealthMetrics{
		Status: e.status,
		Score:  e.score,
		Uptime: 99.9,
		DependentServices: map[string]bool{
			"database": true,
			"cache":    true,
			"storage":  true,
		},
	}, nil
}

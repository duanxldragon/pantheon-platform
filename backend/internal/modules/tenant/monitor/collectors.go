package monitor

import (
	"context"
	"time"
)

// DatabaseCollector collects database performance metrics
type DatabaseCollector struct {
	dbProvider DatabaseMetricsProvider
}

// DatabaseMetricsProvider provides database metrics
type DatabaseMetricsProvider interface {
	GetQueryStats(ctx context.Context, tenantID string) (*QueryStats, error)
	GetConnectionStats(ctx context.Context, tenantID string) (*ConnectionStats, error)
}

// QueryStats contains database query statistics
type QueryStats struct {
	AverageQueryTime float64
	P95QueryTime     float64
	P99QueryTime     float64
	QueriesPerSecond float64
	SlowQueries      int64
	FailedQueries    int64
}

// ConnectionStats contains database connection statistics
type ConnectionStats struct {
	ActiveConnections int64
	IdleConnections   int64
	PoolSize          int64
	MaxConnections    int64
	WaitingClients    int64
}

func NewDatabaseCollector(provider DatabaseMetricsProvider) *DatabaseCollector {
	return &DatabaseCollector{
		dbProvider: provider,
	}
}

func (c *DatabaseCollector) Name() string {
	return "database"
}

func (c *DatabaseCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	metrics := make(map[string]interface{})

	// Collect query stats
	queryStats, err := c.dbProvider.GetQueryStats(ctx, tenantID)
	if err == nil {
		metrics["performance"] = map[string]interface{}{
			"db_query_time":      queryStats.AverageQueryTime,
			"db_p95_query_time":  queryStats.P95QueryTime,
			"db_queries_per_sec": queryStats.QueriesPerSecond,
			"db_slow_queries":    queryStats.SlowQueries,
		}
	}

	// Collect connection stats
	connStats, err := c.dbProvider.GetConnectionStats(ctx, tenantID)
	if err == nil {
		poolUsage := 0.0
		if connStats.MaxConnections > 0 {
			poolUsage = float64(connStats.ActiveConnections) / float64(connStats.MaxConnections) * 100
		}

		metrics["resources"] = map[string]interface{}{
			"db_connections":     connStats.ActiveConnections,
			"db_pool_usage":      poolUsage,
			"db_waiting_clients": connStats.WaitingClients,
		}
	}

	return metrics, nil
}

// ApplicationCollector collects application-level metrics
type ApplicationCollector struct {
	requestTracker RequestTracker
}

// RequestTracker tracks application requests
type RequestTracker interface {
	GetRequestStats(ctx context.Context, tenantID string, duration time.Duration) (*RequestStats, error)
}

// RequestStats contains request statistics
type RequestStats struct {
	TotalRequests      int64
	SuccessfulRequests int64
	FailedRequests     int64
	AverageResponse    float64
	P95Response        float64
	P99Response        float64
	RequestsPerSecond  float64
	ErrorRate          float64
	ActiveUsers        int64
	ActiveSessions     int64
}

func NewApplicationCollector(tracker RequestTracker) *ApplicationCollector {
	return &ApplicationCollector{
		requestTracker: tracker,
	}
}

func (c *ApplicationCollector) Name() string {
	return "application"
}

func (c *ApplicationCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	stats, err := c.requestTracker.GetRequestStats(ctx, tenantID, 5*time.Minute)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"performance": map[string]interface{}{
			"avg_response_time":   stats.AverageResponse,
			"p95_response_time":   stats.P95Response,
			"p99_response_time":   stats.P99Response,
			"requests_per_second": stats.RequestsPerSecond,
			"error_rate":          stats.ErrorRate,
			"concurrent_users":    stats.ActiveUsers,
			"active_sessions":     stats.ActiveSessions,
		},
		"usage": map[string]interface{}{
			"total_requests":      stats.TotalRequests,
			"successful_requests": stats.SuccessfulRequests,
			"failed_requests":     stats.FailedRequests,
			"active_users":        stats.ActiveUsers,
		},
	}, nil
}

// ResourceCollector collects system resource metrics
type ResourceCollector struct {
	resourceProvider ResourceMetricsProvider
}

// ResourceMetricsProvider provides resource metrics
type ResourceMetricsProvider interface {
	GetCPUUsage(ctx context.Context, tenantID string) (float64, error)
	GetMemoryUsage(ctx context.Context, tenantID string) (float64, error)
	GetDiskUsage(ctx context.Context, tenantID string) (float64, error)
	GetNetworkStats(ctx context.Context, tenantID string) (*NetworkStats, error)
	GetStorageStats(ctx context.Context, tenantID string) (*StorageStats, error)
}

// NetworkStats contains network statistics
type NetworkStats struct {
	BytesIn    int64
	BytesOut   int64
	PacketsIn  int64
	PacketsOut int64
}

// StorageStats contains storage statistics
type StorageStats struct {
	UsedBytes  int64
	TotalBytes int64
	FilesCount int64
}

func NewResourceCollector(provider ResourceMetricsProvider) *ResourceCollector {
	return &ResourceCollector{
		resourceProvider: provider,
	}
}

func (c *ResourceCollector) Name() string {
	return "resource"
}

func (c *ResourceCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	metrics := make(map[string]interface{})

	// Collect CPU usage
	if cpuUsage, err := c.resourceProvider.GetCPUUsage(ctx, tenantID); err == nil {
		metrics["cpu_usage"] = cpuUsage
	}

	// Collect memory usage
	if memUsage, err := c.resourceProvider.GetMemoryUsage(ctx, tenantID); err == nil {
		metrics["memory_usage"] = memUsage
	}

	// Collect disk usage
	if diskUsage, err := c.resourceProvider.GetDiskUsage(ctx, tenantID); err == nil {
		metrics["disk_usage"] = diskUsage
	}

	// Collect network stats
	if netStats, err := c.resourceProvider.GetNetworkStats(ctx, tenantID); err == nil {
		metrics["network_in"] = netStats.BytesIn
		metrics["network_out"] = netStats.BytesOut
	}

	// Collect storage stats
	if storageStats, err := c.resourceProvider.GetStorageStats(ctx, tenantID); err == nil {
		storageUsagePercent := 0.0
		if storageStats.TotalBytes > 0 {
			storageUsagePercent = float64(storageStats.UsedBytes) / float64(storageStats.TotalBytes) * 100
		}

		metrics["resources"] = map[string]interface{}{
			"storage_used":  storageStats.UsedBytes,
			"storage_quota": storageStats.TotalBytes,
			"storage_usage": storageUsagePercent,
			"storage_files": storageStats.FilesCount,
		}
	}

	return metrics, nil
}

// UsageCollector collects tenant usage statistics
type UsageCollector struct {
	usageProvider UsageMetricsProvider
}

// UsageMetricsProvider provides usage metrics
type UsageMetricsProvider interface {
	GetUserStats(ctx context.Context, tenantID string) (*UserStats, error)
	GetAPIStats(ctx context.Context, tenantID string) (*APIStats, error)
	GetDataTransferStats(ctx context.Context, tenantID string) (*DataTransferStats, error)
}

// UserStats contains user statistics
type UserStats struct {
	TotalUsers    int64
	ActiveUsers   int64
	NewUsers      int64
	LoggedInUsers int64
}

// APIStats contains API usage statistics
type APIStats struct {
	TotalCalls      int64
	SuccessfulCalls int64
	FailedCalls     int64
	BatchOperations int64
	Exports         int64
	Imports         int64
}

// DataTransferStats contains data transfer statistics
type DataTransferStats struct {
	DataStored      int64
	DataRetrieved   int64
	DataTransferred int64
}

func NewUsageCollector(provider UsageMetricsProvider) *UsageCollector {
	return &UsageCollector{
		usageProvider: provider,
	}
}

func (c *UsageCollector) Name() string {
	return "usage"
}

func (c *UsageCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	metrics := make(map[string]interface{})

	// Collect user stats
	userStats, err := c.usageProvider.GetUserStats(ctx, tenantID)
	if err == nil {
		metrics["total_users"] = userStats.TotalUsers
		metrics["active_users"] = userStats.ActiveUsers
		metrics["new_users"] = userStats.NewUsers
	}

	// Collect API stats
	apiStats, err := c.usageProvider.GetAPIStats(ctx, tenantID)
	if err == nil {
		metrics["api_calls"] = apiStats.TotalCalls
		metrics["batch_operations"] = apiStats.BatchOperations
		metrics["exports"] = apiStats.Exports
		metrics["imports"] = apiStats.Imports
	}

	// Collect data transfer stats
	transferStats, err := c.usageProvider.GetDataTransferStats(ctx, tenantID)
	if err == nil {
		metrics["usage"] = map[string]interface{}{
			"data_stored":      transferStats.DataStored,
			"data_retrieved":   transferStats.DataRetrieved,
			"data_transferred": transferStats.DataTransferred,
		}
	}

	return metrics, nil
}

// CacheCollector collects cache performance metrics
type CacheCollector struct {
	cacheProvider CacheMetricsProvider
}

// CacheMetricsProvider provides cache metrics
type CacheMetricsProvider interface {
	GetCacheStats(ctx context.Context, tenantID string) (*CacheStats, error)
}

// CacheStats contains cache statistics
type CacheStats struct {
	HitRate     float64
	MissRate    float64
	Hits        int64
	Misses      int64
	KeyCount    int64
	MemoryUsage int64
	Evictions   int64
}

func NewCacheCollector(provider CacheMetricsProvider) *CacheCollector {
	return &CacheCollector{
		cacheProvider: provider,
	}
}

func (c *CacheCollector) Name() string {
	return "cache"
}

func (c *CacheCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	stats, err := c.cacheProvider.GetCacheStats(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"performance": map[string]interface{}{
			"cache_hit_rate":  stats.HitRate,
			"cache_miss_rate": stats.MissRate,
			"cache_hits":      stats.Hits,
			"cache_misses":    stats.Misses,
			"cache_evictions": stats.Evictions,
		},
		"resources": map[string]interface{}{
			"cache_keys":   stats.KeyCount,
			"cache_memory": stats.MemoryUsage,
		},
	}, nil
}

// Mock implementations for testing

// MockDatabaseCollector provides a mock database collector for testing
type MockDatabaseCollector struct {
}

func NewMockDatabaseCollector() *MockDatabaseCollector {
	return &MockDatabaseCollector{}
}

func (c *MockDatabaseCollector) Name() string {
	return "mock_database"
}

func (c *MockDatabaseCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"performance": map[string]interface{}{
			"db_query_time":      50.0,
			"db_p95_query_time":  120.0,
			"db_queries_per_sec": 100.0,
			"db_slow_queries":    2,
		},
		"resources": map[string]interface{}{
			"db_connections":     15,
			"db_pool_usage":      30.0,
			"db_waiting_clients": 0,
		},
	}, nil
}

// MockApplicationCollector provides a mock application collector for testing
type MockApplicationCollector struct {
}

func NewMockApplicationCollector() *MockApplicationCollector {
	return &MockApplicationCollector{}
}

func (c *MockApplicationCollector) Name() string {
	return "mock_application"
}

func (c *MockApplicationCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"performance": map[string]interface{}{
			"avg_response_time":   150.0,
			"p95_response_time":   450.0,
			"p99_response_time":   800.0,
			"requests_per_second": 50.0,
			"error_rate":          0.5,
			"concurrent_users":    25,
			"active_sessions":     18,
		},
		"usage": map[string]interface{}{
			"total_requests":      5000,
			"successful_requests": 4975,
			"failed_requests":     25,
			"active_users":        25,
		},
	}, nil
}

// MockResourceCollector provides a mock resource collector for testing
type MockResourceCollector struct {
}

func NewMockResourceCollector() *MockResourceCollector {
	return &MockResourceCollector{}
}

func (c *MockResourceCollector) Name() string {
	return "mock_resource"
}

func (c *MockResourceCollector) Collect(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"cpu_usage":    45.0,
		"memory_usage": 68.0,
		"disk_usage":   72.0,
		"network_in":   int64(1024 * 1024 * 100), // 100MB
		"network_out":  int64(1024 * 1024 * 250), // 250MB
		"resources": map[string]interface{}{
			"storage_used":  int64(1024 * 1024 * 1024 * 50),  // 50GB
			"storage_quota": int64(1024 * 1024 * 1024 * 100), // 100GB
			"storage_usage": 50.0,
			"storage_files": 12500,
		},
	}, nil
}

package monitor

import (
	"context"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/net"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/cache"
)

var (
	processStartTime = time.Now()
	lastNetStats     []net.IOCountersStat
	lastNetTime      time.Time
	netMu            sync.Mutex
)

// ServiceStatus represents the health of a backend service.
type ServiceStatus struct {
	Name      string        `json:"name" example:"master_db"`
	OK        bool          `json:"ok" example:"true"`
	LatencyMS int64         `json:"latency_ms" example:"12"`
	Error     string        `json:"error,omitempty" example:""`
	Pool      *DBPoolStatus `json:"pool,omitempty"`
}

// DBPoolStatus represents database connection pool statistics.
type DBPoolStatus struct {
	MaxOpenConns int   `json:"max_open_conns" example:"100"`
	OpenConns    int   `json:"open_conns" example:"8"`
	InUse        int   `json:"in_use" example:"3"`
	Idle         int   `json:"idle" example:"5"`
	WaitCount    int64 `json:"wait_count" example:"0"`
	WaitDuration int64 `json:"wait_duration_ms" example:"0"`
}

// RedisStatus represents Redis health information.
type RedisStatus struct {
	OK        bool   `json:"ok"`
	LatencyMS int64  `json:"latency_ms"`
	Error     string `json:"error,omitempty"`
}

// OnlineUserStatus represents count of currently online users.
type OnlineUserStatus struct {
	Count int `json:"count" example:"18"`
}

// MemoryStats represents Go runtime memory statistics.
type MemoryStats struct {
	Alloc      uint64 `json:"alloc" example:"10485760"`
	TotalAlloc uint64 `json:"total_alloc" example:"52428800"`
	Sys        uint64 `json:"sys" example:"33554432"`
	HeapAlloc  uint64 `json:"heap_alloc" example:"8388608"`
	HeapSys    uint64 `json:"heap_sys" example:"16777216"`
	NumGC      uint32 `json:"num_gc" example:"12"`
}

// DiskStatus represents disk usage and I/O.
type DiskStatus struct {
	Path        string  `json:"path"`
	Total       uint64  `json:"total"`
	Free        uint64  `json:"free"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"used_percent"`
}

// NetworkStatus represents network throughput.
type NetworkStatus struct {
	BytesSent   uint64  `json:"bytes_sent"`
	BytesRecv   uint64  `json:"bytes_recv"`
	SentRateBps float64 `json:"sent_rate_bps"` // Bytes per second
	RecvRateBps float64 `json:"recv_rate_bps"` // Bytes per second
}

// OverviewResponse is the response for the monitor overview endpoint.
type OverviewResponse struct {
	Timestamp   string            `json:"timestamp" example:"2026-03-30T12:00:00Z"`
	UptimeSec   int64             `json:"uptime_sec" example:"86400"`
	GoVersion   string            `json:"go_version" example:"go1.23.0"`
	NumCPU      int               `json:"num_cpu" example:"8"`
	Goroutines  int               `json:"goroutines" example:"42"`
	Memory      MemoryStats       `json:"memory"`
	Disk        []DiskStatus      `json:"disk,omitempty"`
	Network     *NetworkStatus    `json:"network,omitempty"`
	Services    []ServiceStatus   `json:"services"`
	Redis       *RedisStatus      `json:"redis,omitempty"`
	Online      *OnlineUserStatus `json:"online,omitempty"`
	TenantID    string            `json:"tenant_id,omitempty" example:"tenant-default"`
	HasTenantDB bool              `json:"has_tenant_db" example:"true"`
}

// Service defines the monitor service interface.
type MonitorService interface {
	Overview(ctx context.Context) (*OverviewResponse, error)
	OnlineUsers(ctx context.Context) (*OnlineUserStatus, error)
}

type monitorService struct {
	masterDB    *gorm.DB
	monitorDB   *gorm.DB
	redisClient *cache.RedisClient
}

// NewMonitorService creates a new monitor service. redisClient may be nil.
func NewMonitorService(masterDB *gorm.DB, monitorDB *gorm.DB, redisClient *cache.RedisClient) MonitorService {
	return &monitorService{
		masterDB:    masterDB,
		monitorDB:   monitorDB,
		redisClient: redisClient,
	}
}

func (s *monitorService) Overview(ctx context.Context) (*OverviewResponse, error) {
	var ms runtime.MemStats
	runtime.ReadMemStats(&ms)

	tenantID, _ := ctx.Value("tenant_id").(string)
	tenantDB, _ := ctx.Value("tenant_db").(*gorm.DB)

	statuses := make([]ServiceStatus, 0, 4)
	statuses = append(statuses, pingDB(ctx, "master_db", s.masterDB))
	if tenantDB != nil {
		statuses = append(statuses, pingDB(ctx, "tenant_db", tenantDB))
	}
	if s.monitorDB != nil {
		statuses = append(statuses, pingDB(ctx, "monitor_db", s.monitorDB))
	}

	// Redis health check
	var redisStatus *RedisStatus
	if s.redisClient != nil {
		redisStatus = pingRedis(ctx, s.redisClient)
	}

	// Online users count
	online := s.countOnlineSessions(ctx)

	// Disk status
	disks := s.getDiskStatus()

	// Network status
	network := s.getNetworkStatus()

	return &OverviewResponse{
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
		UptimeSec:  int64(time.Since(processStartTime).Seconds()),
		GoVersion:  runtime.Version(),
		NumCPU:     runtime.NumCPU(),
		Goroutines: runtime.NumGoroutine(),
		Memory: MemoryStats{
			Alloc:      ms.Alloc,
			TotalAlloc: ms.TotalAlloc,
			Sys:        ms.Sys,
			HeapAlloc:  ms.HeapAlloc,
			HeapSys:    ms.HeapSys,
			NumGC:      ms.NumGC,
		},
		Disk:        disks,
		Network:     network,
		Services:    statuses,
		Redis:       redisStatus,
		Online:      online,
		TenantID:    tenantID,
		HasTenantDB: tenantDB != nil,
	}, nil
}

func (s *monitorService) getDiskStatus() []DiskStatus {
	parts, err := disk.Partitions(false)
	if err != nil {
		return nil
	}

	var stats []DiskStatus
	for _, p := range parts {
		if !isInterestingPartition(p.Mountpoint) {
			continue
		}
		usage, err := disk.Usage(p.Mountpoint)
		if err != nil {
			continue
		}
		stats = append(stats, DiskStatus{
			Path:        p.Mountpoint,
			Total:       usage.Total,
			Free:        usage.Free,
			Used:        usage.Used,
			UsedPercent: usage.UsedPercent,
		})
	}
	return stats
}

func isInterestingPartition(mountpoint string) bool {
	return mountpoint == "/" || mountpoint == "C:" || strings.Contains(mountpoint, "/data") || strings.Contains(mountpoint, "/app")
}

func (s *monitorService) getNetworkStatus() *NetworkStatus {
	netMu.Lock()
	defer netMu.Unlock()

	current, err := net.IOCounters(false)
	if err != nil || len(current) == 0 {
		return nil
	}

	now := time.Now()
	stat := &NetworkStatus{
		BytesSent: current[0].BytesSent,
		BytesRecv: current[0].BytesRecv,
	}

	if !lastNetTime.IsZero() && len(lastNetStats) > 0 {
		duration := now.Sub(lastNetTime).Seconds()
		if duration > 0 {
			stat.SentRateBps = float64(current[0].BytesSent-lastNetStats[0].BytesSent) / duration
			stat.RecvRateBps = float64(current[0].BytesRecv-lastNetStats[0].BytesRecv) / duration
		}
	}

	lastNetStats = current
	lastNetTime = now

	return stat
}

func (s *monitorService) OnlineUsers(ctx context.Context) (*OnlineUserStatus, error) {
	if s.redisClient == nil {
		return &OnlineUserStatus{Count: 0}, nil
	}

	count := s.countOnlineSessions(ctx)
	if count == nil {
		return &OnlineUserStatus{Count: 0}, nil
	}
	return count, nil
}

func (s *monitorService) countOnlineSessions(ctx context.Context) *OnlineUserStatus {
	if s.redisClient == nil {
		return &OnlineUserStatus{Count: 0}
	}

	var keys []string
	var cursor uint64
	for {
		batch, next, err := s.redisClient.Scan(ctx, cursor, "auth:session:*", 100)
		if err != nil {
			return &OnlineUserStatus{Count: 0}
		}
		keys = append(keys, batch...)
		cursor = next
		if cursor == 0 {
			break
		}
	}

	// Count unique user IDs from keys: auth:session:{userID}:{jti}
	userSet := make(map[string]struct{})
	for _, key := range keys {
		parts := strings.Split(key, ":")
		if len(parts) >= 3 {
			userSet[parts[2]] = struct{}{}
		}
	}
	return &OnlineUserStatus{Count: len(userSet)}
}

func pingDB(ctx context.Context, name string, db *gorm.DB) ServiceStatus {
	if db == nil {
		return ServiceStatus{Name: name, OK: false, Error: "db is nil"}
	}
	sqlDB, err := db.DB()
	if err != nil {
		return ServiceStatus{Name: name, OK: false, Error: err.Error()}
	}
	start := time.Now()
	err = sqlDB.PingContext(ctx)
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return ServiceStatus{Name: name, OK: false, LatencyMS: latency, Error: err.Error()}
	}

	// Collect pool stats
	stats := sqlDB.Stats()
	pool := &DBPoolStatus{
		MaxOpenConns: stats.MaxOpenConnections,
		OpenConns:    stats.OpenConnections,
		InUse:        stats.InUse,
		Idle:         stats.Idle,
		WaitCount:    stats.WaitCount,
		WaitDuration: stats.WaitDuration.Milliseconds(),
	}

	return ServiceStatus{Name: name, OK: true, LatencyMS: latency, Pool: pool}
}

func pingRedis(ctx context.Context, rc *cache.RedisClient) *RedisStatus {
	start := time.Now()
	err := rc.Ping(ctx)
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return &RedisStatus{OK: false, LatencyMS: latency, Error: err.Error()}
	}
	return &RedisStatus{OK: true, LatencyMS: latency}
}

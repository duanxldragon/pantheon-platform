# 性能测试计划

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **测试类型**: 性能测试 (Performance Testing)
- **测试工具**: K6, JMeter, Go pprof
- **测试环境**: Staging

## 🎯 测试目标

### 总体目标
验证系统在各种负载条件下的性能表现，确保系统能够满足预期的性能需求并具备良好的扩展性。

### 具体目标
- **响应时间目标**: P95 < 500ms, P99 < 1000ms
- **吞吐量目标**: 支持1000并发用户，5000 TPS
- **资源利用率**: CPU < 70%, 内存 < 80%, 数据库连接 < 80%
- **稳定性目标**: 99.9%可用性
- **扩展性目标**: 水平扩展后性能线性增长

## 🎯 性能指标定义

### 关键性能指标 (KPI)

#### 1. 响应时间 (Response Time)
```yaml
API响应时间:
  - P50 (中位数): < 200ms
  - P95 (95分位): < 500ms
  - P99 (99分位): < 1000ms

页面加载时间:
  - 首次内容绘制 (FCP): < 1.5s
  - 最大内容绘制 (LCP): < 2.5s
  - 首次输入延迟 (FID): < 100ms
  - 累积布局偏移 (CLS): < 0.1
```

#### 2. 吞吐量 (Throughput)
```yaml
请求处理能力:
  - 正常负载: 1000 TPS
  - 峰值负载: 5000 TPS
  - 极限负载: 10000 TPS

并发用户数:
  - 标准并发: 500用户
  - 高并发: 1000用户
  - 极限并发: 2000用户
```

#### 3. 资源利用率 (Resource Utilization)
```yaml
服务器资源:
  - CPU使用率: < 70%
  - 内存使用率: < 80%
  - 磁盘I/O: < 80%
  - 网络带宽: < 70%

数据库资源:
  - 连接池使用: < 80%
  - 慢查询率: < 1%
  - 锁等待率: < 5%

缓存资源:
  - 缓存命中率: > 90%
  - 内存使用: < 80%
```

#### 4. 可靠性指标 (Reliability)
```yaml
系统可用性:
  - 正常运行时间: > 99.9%
  - 错误率: < 0.1%
  - 故障恢复时间: < 5分钟

数据一致性:
  - 数据同步延迟: < 1秒
  - 事务成功率: > 99.99%
```

## 🛠️ 测试环境与工具

### 测试环境配置
```yaml
硬件配置:
  应用服务器:
    - CPU: 8核
    - 内存: 16GB
    - 磁盘: SSD 100GB
    - 网络: 1Gbps
    
  数据库服务器:
    - CPU: 16核
    - 内存: 32GB
    - 磁盘: SSD 500GB
    - 网络: 10Gbps
    
  缓存服务器:
    - CPU: 4核
    - 内存: 8GB
    - 磁盘: SSD 50GB

软件环境:
  操作系统: Ubuntu 22.04 LTS
  Go版本: 1.21
  数据库: MySQL 8.0
  缓存: Redis 7.0
  负载均衡: Nginx 1.24
```

### 测试工具栈

#### K6 - 负载测试
```javascript
// k6.config.js
export const options = {
  scenarios: {
    normal_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
      gracefulStop: '30s',
    },
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 1000 },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      stages: [
        { duration: '5m', target: 1000 },
        { duration: '5m', target: 5000 },
        { duration: '5m', target: 10000 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};
```

#### JMeter - 复杂场景测试
```xml
<!-- jmeter-test-plan.jmx -->
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan>
      <stringProp name="TestPlan.comments">Pantheon Platform Performance Test</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
    </TestPlan>
  </hashTree>
</jmeterTestPlan>
```

## 🧪 性能测试场景

### 1. 基准性能测试 (Baseline Performance Test)

#### 目的
建立系统性能基准，为后续测试提供参考数据。

#### 测试场景
```javascript
// tests/performance/baseline-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 10 },   // 预热
    { duration: '10m', target: 100 }, // 正常负载
    { duration: '5m', target: 0 },    // 冷却
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // 1. 登录接口
  let loginPayload = JSON.stringify({
    username: 'testuser',
    password: 'Test@123',
  });
  
  let loginParams = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  let loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, loginParams);
  
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'has access token': (r) => JSON.parse(r.body).data.access_token !== undefined,
  });
  
  let accessToken = JSON.parse(loginRes.body).data.access_token;
  
  // 2. 获取当前用户信息
  let authHeaders = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  let userRes = http.get(`${BASE_URL}/api/v1/auth/current`, authHeaders);
  
  check(userRes, {
    'user info status is 200': (r) => r.status === 200,
    'user info response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  // 3. 获取用户列表
  let usersRes = http.get(`${BASE_URL}/api/v1/system/users?page=1&page_size=20`, authHeaders);
  
  check(usersRes, {
    'users list status is 200': (r) => r.status === 200,
    'users list response time < 500ms': (r) => r.timings.duration < 500,
    'users list has data': (r) => JSON.parse(r.body).data.items.length > 0,
  });
  
  sleep(1); // 模拟用户思考时间
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'baseline-performance.json': JSON.stringify(data),
  };
}
```

### 2. 负载测试 (Load Test)

#### 目的
验证系统在预期负载下的性能表现。

#### 测试场景
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  scenarios: {
    concurrent_users: {
      executor: 'constant-vus',
      vus: 500,
      duration: '30m',
      gracefulStop: '2m',
    },
  },
  thresholds: {
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.02'],
    errors: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
let accessToken = '';

export function setup() {
  // 设置阶段：登录获取token
  let loginPayload = JSON.stringify({
    username: 'testuser',
    password: 'Test@123',
  });
  
  let loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return { token: JSON.parse(loginRes.body).data.access_token };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  group('用户管理操作', () => {
    // 获取用户列表
    let listRes = http.get(`${BASE_URL}/api/v1/system/users?page=1&page_size=20`, {
      headers: headers,
    });
    
    let checkList = check(listRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!checkList);
    
    // 搜索用户
    let searchRes = http.get(`${BASE_URL}/api/v1/system/users?keyword=test`, {
      headers: headers,
    });
    
    let checkSearch = check(searchRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!checkSearch);
  });

  group('系统监控操作', () => {
    // 获取系统概览
    let overviewRes = http.get(`${BASE_URL}/api/v1/system/overview`, {
      headers: headers,
    });
    
    let checkOverview = check(overviewRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(!checkOverview);
    
    // 获取租户监控数据
    let tenantRes = http.get(`${BASE_URL}/api/v1/tenants/monitoring`, {
      headers: headers,
    });
    
    let checkTenant = check(tenantRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
    
    errorRate.add(!checkTenant);
  });

  sleep(Math.random() * 3 + 1); // 随机思考时间 1-4秒
}
```

### 3. 压力测试 (Stress Test)

#### 目的
确定系统的极限性能和故障点。

#### 测试场景
```javascript
// tests/performance/stress-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 },    // 预热
    { duration: '5m', target: 500 },    // 正常负载
    { duration: '5m', target: 1000 },   // 高负载
    { duration: '5m', target: 2000 },   // 极限负载
    { duration: '5m', target: 5000 },   // 超极限负载
    { duration: '5m', target: 0 },      // 恢复
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 放宽阈值
    http_req_failed: ['rate<0.05'],    // 允许更高错误率
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // 测试核心API接口
  let responses = http.batch([
    ['GET', `${BASE_URL}/api/v1/system/users`, null, { headers: { 'Authorization': 'Bearer token' } }],
    ['GET', `${BASE_URL}/api/v1/system/roles`, null, { headers: { 'Authorization': 'Bearer token' } }],
    ['GET', `${BASE_URL}/api/v1/system/overview`, null, { headers: { 'Authorization': 'Bearer token' } }],
  ]);
  
  responses.forEach((res) => {
    check(res, {
      'status is 200 or 429/503': (r) => r.status === 200 || r.status === 429 || r.status === 503,
    });
  });
}
```

### 4. 峰值测试 (Spike Test)

#### 目的
验证系统在突然增加的流量下的表现。

#### 测试场景
```javascript
// tests/performance/spike-test.js
export let options = {
  stages: [
    { duration: '2m', target: 100 },    // 正常负载
    { duration: '1m', target: 2000 },   // 突然增加到20倍
    { duration: '3m', target: 2000 },   // 维持高负载
    { duration: '1m', target: 100 },    // 突然降低
    { duration: '3m', target: 100 },    // 恢复正常
  ],
};
```

### 5. 耐久测试 (Endurance Test)

#### 目的
验证系统在长时间运行下的稳定性。

#### 测试场景
```javascript
// tests/performance/endurance-test.js
export let options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '12h', target: 500 },  // 持续12小时
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

## 📊 性能监控指标

### 应用层监控

#### Go pprof性能分析
```go
// cmd/server/main.go
import (
    _ "net/http/pprof"
    "runtime"
)

func main() {
    // 启动pprof HTTP服务器
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()
    
    // 设置性能监控
    runtime.SetMutexProfileFraction(1)
    runtime.SetBlockProfileRate(1)
}
```

#### 自定义性能指标
```go
// internal/metrics/performance.go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    HttpRequestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint", "status"},
    )
    
    DbQueryDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "db_query_duration_seconds",
            Help:    "Database query duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"operation", "table"},
    )
    
    CacheHitRate = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "cache_hit_rate",
            Help: "Cache hit rate percentage",
        },
        []string{"cache_type"},
    )
)
```

### 数据库性能监控

#### 慢查询监控
```sql
-- 启用慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- 分析慢查询
SELECT 
    query_time,
    lock_time,
    rows_sent,
    rows_examined,
    sql_text
FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 100;
```

#### 连接池监控
```sql
-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Threads_running';

-- 查看连接详情
SHOW PROCESSLIST;

-- 查看锁等待
SELECT * FROM information_schema.innodb_locks;
SELECT * FROM information_schema.innodb_lock_waits;
```

### 缓存性能监控

#### Redis监控
```bash
# 连接信息
redis-cli INFO clients

# 内存使用
redis-cli INFO memory

# 命令统计
redis-cli INFO commandstats

# 慢查询
redis-cli SLOWLOG GET 10

# 命中率
redis-cli INFO stats | grep keyspace
```

## 🔧 性能优化建议

### 应用层优化

#### 1. 数据库查询优化
```go
// 使用预编译语句
stmt, err := db.PrepareContext(ctx, `
    SELECT id, username, real_name, email 
    FROM users 
    WHERE tenant_id = ? AND status = ?
    LIMIT ?
`)

// 使用批量查询
users := make([]*User, 0, 100)
err := db.
    Where("tenant_id = ?", tenantID).
    FindInBatches(&users, 100, nil).Error

// 使用索引提示
db.
    Table("users").
    Where("tenant_id = ?", tenantID).
    Hint("idx_users_tenant_status"). // 使用索引提示
    Find(&users)
```

#### 2. 缓存优化
```go
// 多级缓存
type CacheManager struct {
    localCache  *cache.Cache      // 本地缓存
    redisClient *redis.Client     // Redis缓存
}

func (c *CacheManager) Get(key string) (interface{}, error) {
    // 先查本地缓存
    if val, found := c.localCache.Get(key); found {
        return val, nil
    }
    
    // 再查Redis
    val, err := c.redisClient.Get(ctx, key).Result()
    if err == nil {
        c.localCache.Set(key, val, cache.DefaultExpiration)
        return val, nil
    }
    
    return nil, err
}
```

#### 3. 并发优化
```go
// 使用worker pool
type WorkerPool struct {
    tasks chan Task
    wg    sync.WaitGroup
}

func NewWorkerPool(size int) *WorkerPool {
    pool := &WorkerPool{
        tasks: make(chan Task, size*2),
    }
    
    for i := 0; i < size; i++ {
        pool.wg.Add(1)
        go pool.worker()
    }
    
    return pool
}

func (p *WorkerPool) worker() {
    defer p.wg.Done()
    for task := range p.tasks {
        task.Execute()
    }
}
```

### 数据库层优化

#### 1. 索引优化
```sql
-- 分析查询执行计划
EXPLAIN SELECT * FROM users 
WHERE tenant_id = 'xxx' AND status = 'active';

-- 创建合适的索引
CREATE INDEX idx_users_tenant_status 
ON users(tenant_id, status);

-- 覆盖索引优化
CREATE INDEX idx_users_tenant_status_cover 
ON users(tenant_id, status, username, real_name);
```

#### 2. 分区优化
```sql
-- 按时间分区操作日志
ALTER TABLE operation_logs 
PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p202601 VALUES LESS THAN (UNIX_TIMESTAMP('2026-02-01')),
    PARTITION p202602 VALUES LESS THAN (UNIX_TIMESTAMP('2026-03-01')),
    PARTITION p202603 VALUES LESS THAN (UNIX_TIMESTAMP('2026-04-01'))
);
```

#### 3. 查询优化
```sql
-- 避免SELECT *
SELECT id, username, real_name FROM users;

-- 使用LIMIT限制结果
SELECT * FROM users WHERE status = 'active' LIMIT 100;

-- 避免在WHERE中使用函数
-- 不好：WHERE DATE(created_at) = '2026-04-07'
-- 好：WHERE created_at >= '2026-04-07' AND created_at < '2026-04-08'
```

## 📈 性能测试报告

### 报告模板
```markdown
# 性能测试报告

## 测试概览
- **测试日期**: 2026-04-07
- **测试环境**: Staging
- **测试工具**: K6, JMeter
- **测试持续时间**: 4小时

## 测试结果摘要
- **总体结果**: 通过
- **平均响应时间**: 245ms
- **P95响应时间**: 485ms
- **P99响应时间**: 892ms
- **吞吐量**: 1234 TPS
- **错误率**: 0.012%

## 详细指标

### API响应时间
| 接口 | P50 | P95 | P99 | 通过率 |
|------|-----|-----|-----|--------|
| POST /auth/login | 180ms | 420ms | 780ms | 99.8% |
| GET /auth/current | 120ms | 280ms | 450ms | 99.9% |
| GET /users | 250ms | 520ms | 920ms | 99.7% |

### 资源使用情况
- **CPU使用率**: 平均45%, 峰值68%
- **内存使用率**: 平均62%, 峰值78%
- **数据库连接**: 平均35/50, 峰值48/50
- **缓存命中率**: 94.5%

## 性能瓶颈分析
1. **用户列表查询**: P99响应时间偏高，建议添加复合索引
2. **系统概览统计**: 数据库聚合查询较慢，建议增加缓存
3. **租户监控数据**: 多次数据库查询，建议优化为单次查询

## 优化建议
1. 添加数据库索引：idx_users_tenant_status
2. 实现统计数据缓存，TTL设置为5分钟
3. 优化租户监控查询，使用JOIN替代多次查询

## 下一步计划
1. 实施优化建议
2. 回归性能测试
3. 建立持续性能监控
```

## ✅ 性能测试执行流程

### 1. 测试准备
```bash
# 1. 检查测试环境
npm run test:perf:check-env

# 2. 准备测试数据
npm run test:perf:prepare-data

# 3. 预热系统
npm run test:perf:warmup
```

### 2. 执行测试
```bash
# 基准测试
k6 run tests/performance/baseline-test.js

# 负载测试
k6 run tests/performance/load-test.js

# 压力测试
k6 run tests/performance/stress-test.js

# 峰值测试
k6 run tests/performance/spike-test.js

# 耐久测试
k6 run tests/performance/endurance-test.js
```

### 3. 结果分析
```bash
# 生成性能报告
npm run test:perf:report

# 分析瓶颈
npm run test:perf:analyze

# 对比历史数据
npm run test:perf:compare
```

## 🔄 CI/CD集成

### 性能测试流水线
```yaml
# .github/workflows/performance-test.yml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Test Environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          
      - name: Run Performance Tests
        run: |
          k6 run tests/performance/baseline-test.js
          k6 run tests/performance/load-test.js
          
      - name: Generate Report
        run: |
          npm run test:perf:report
          
      - name: Compare with Baseline
        run: |
          npm run test:perf:compare
          
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: test-results/performance/
```

## 🎯 性能基线与阈值

### 性能基线
```yaml
version: "1.0"
baseline:
  api_response_time:
    p50: 180ms
    p95: 420ms
    p99: 780ms
  
  throughput:
    normal: 1000 TPS
    peak: 5000 TPS
  
  resource_usage:
    cpu: 45%
    memory: 60%
    db_connections: 35/50
  
  cache_performance:
    hit_rate: 94%
```

### 性能阈值
```yaml
thresholds:
  critical:
    api_response_time_p99: 1500ms
    error_rate: 5%
    resource_cpu: 90%
    
  warning:
    api_response_time_p99: 1000ms
    error_rate: 1%
    resource_cpu: 70%
    
  normal:
    api_response_time_p99: 800ms
    error_rate: 0.1%
    resource_cpu: 50%
```

---

**测试负责人**: 性能测试组  
**测试周期**: 每周执行  
**审查周期**: 每月回顾更新基线
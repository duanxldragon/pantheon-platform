# Pantheon Platform 运维手册

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **适用对象**: 运维团队、DevOps工程师
- **文档类型**: 运维操作手册

## 🎯 运维概述

### 系统架构
- **应用架构**: 前后端分离，容器化部署
- **部署架构**: Kubernetes + Docker
- **数据库**: MySQL主从复制
- **缓存**: Redis哨兵模式
- **监控**: Prometheus + Grafana

### 运维职责
- **系统监控**: 24/7系统健康监控
- **故障处理**: 快速响应和故障恢复
- **性能优化**: 持续性能调优
- **安全防护**: 安全威胁检测和防护
- **备份恢复**: 数据备份和灾难恢复

## 🚀 部署运维

### 应用部署

#### 容器化部署
```bash
# 1. 构建应用镜像
docker build -t pantheon-platform:v1.0 .

# 2. 推送镜像到镜像仓库
docker tag pantheon-platform:v1.0 registry.example.com/pantheon-platform:v1.0
docker push registry.example.com/pantheon-platform:v1.0

# 3. 部署到Kubernetes
kubectl apply -f k8s/deployment.yaml

# 4. 验证部署
kubectl get pods -n pantheon
kubectl rollout status deployment/pantheon-backend -n pantheon
```

#### 滚动更新策略
```yaml
# 滚动更新配置
replicas: 3
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
    minReadySeconds: 30
    timeoutSeconds: 600
```

### 数据库部署

#### MySQL主从配置
```bash
# 主库配置
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
sync_binlog = 1

# 从库配置
[mysqld]
server-id = 2
relay-log = mysql-relay-bin
read-only = 1

# 启动复制
CHANGE MASTER TO
  MASTER_HOST='master.example.com',
  MASTER_USER='replicator',
  MASTER_PASSWORD='password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=154;
```

#### 数据库备份
```bash
#!/bin/bash
# 每日备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mysql"
DB_NAME="pantheon_master"

# 全量备份
mysqldump -u root -p${MYSQL_ROOT_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  ${DB_NAME} > ${BACKUP_DIR}/${DB_NAME}_${DATE}.sql

# 压缩备份
gzip ${BACKUP_DIR}/${DB_NAME}_${DATE}.sql

# 清理30天前的备份
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete
```

### Redis集群部署

#### 哨兵模式配置
```bash
# Redis哨兵配置
port 26379
sentinel monitor master-1 127.0.0.1:6379 2
sentinel down-after-milliseconds master-1 30000
sentinel failover-timeout master-1 180000
sentinel parallel-syncs master-1 1
sentinel auth-pass ${REDIS_PASSWORD}
```

## 📊 监控运维

### 系统监控

#### Prometheus配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'pantheon-backend'
    kubernetes_sd_configs:
      - role: pod
        namespace: pantheon
        app: pantheon-backend
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: app

  - job_name: 'mysql-exporter'
    static_configs:
      - targets: ['mysql-exporter:9104']
```

#### Grafana仪表板
```json
{
  "dashboard": {
    "title": "Pantheon Platform Overview",
    "panels": [
      {
        "title": "系统健康状态",
        "targets": [
          {
            "expr": "up{job=\"pantheon-backend\"}",
            "legendFormat": "{{app}}"
          }
        ]
      },
      {
        "title": "API响应时间",
        "targets": [
          {
            "expr": "http_request_duration_seconds{job=\"pantheon-backend\"}",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "错误率",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"pantheon-backend\",status!=\"2xx\"}[5m])",
            "legendFormat": "{{job}}"
          }
        ]
      }
    ]
  }
}
```

### 日志收集

#### ELK Stack配置
```yaml
# Filebeat配置
filebeat.inputs:
  - type: container
    paths:
      - '/var/lib/docker/containers/*/*.log'

processors:
  - add_kubernetes_metadata:
      host: ${NODE_NAME}
      match_indices:
        - pod.uid
        - pod.name
        - namespace
        - pod.labels

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  indices:
    - index: "pantheon-logs-%{+yyyy.MM.dd}"
```

### 告警配置

#### 告警规则
```yaml
# alert_rules.yml
groups:
  - name: pantheon_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{job="pantheon-backend",status!~"2xx"}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "API错误率过高"
          description: "5分钟内错误率超过5%"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket{job="pantheon-backend"}) > 1
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "API响应时间过长"
          description: "95分位响应时间超过1秒"

      - alert: DatabaseConnectionPoolExhausted
        expr: mysql_global_status_threads_connected / mysql_global_variables_max_connections > 0.9
        for: 5m
        labels:
          severity: critical
          team: database
        annotations:
          summary: "数据库连接池耗尽"
          description: "连接池使用率超过90%"
```

## 🔧 故障处理

### 常见故障场景

#### 1. 应用服务异常

**现象**:
- API响应超时
- 错误率突然升高
- 服务实例频繁重启

**处理步骤**:
```bash
# 1. 检查应用状态
kubectl get pods -n pantheon
kubectl logs -f deployment/pantheon-backend -n pantheon --tail=100

# 2. 检查资源使用
kubectl top pods -n pantheon
kubectl exec -it <pod-name> -n pantheon -- top

# 3. 重启应用
kubectl rollout restart deployment/pantheon-backend -n pantheon

# 4. 如需要，扩展实例
kubectl scale deployment/pantheon-backend --replicas=5 -n pantheon
```

#### 2. 数据库故障

**现象**:
- 数据库连接失败
- 查询响应超时
- 主从同步延迟

**处理步骤**:
```bash
# 1. 检查MySQL状态
systemctl status mysql

# 2. 检查数据库连接
mysql -h localhost -u root -p

# 3. 检查慢查询
mysql> SHOW PROCESSLIST;
mysql> SHOW FULL PROCESSLIST;

# 4. 检查主从状态
mysql> SHOW SLAVE STATUS\G

# 5. 重启MySQL（如需要）
systemctl restart mysql

# 6. 从库提升为主库（紧急情况）
mysql> STOP SLAVE;
mysql> RESET SLAVE ALL;
mysql> SET GLOBAL read_only = OFF;
```

#### 3. Redis故障

**现象**:
- 缓存操作失败
- 会话管理异常
- 响应时间变慢

**处理步骤**:
```bash
# 1. 检查Redis状态
redis-cli ping

# 2. 检查内存使用
redis-cli INFO memory

# 3. 检查连接数
redis-cli CLIENT LIST

# 4. 检查慢查询
redis-cli SLOWLOG GET 10

# 5. 重启Redis
systemctl restart redis

# 6. 如果哨兵模式，切换主节点
redis-cli -p 26379 SENTINEL failover master-1
```

### 故障恢复流程

#### 故障响应流程图
```
┌─────────────┐
│ 故障检测     │
└──────┬──────┘
       ↓
┌─────────────┐
│ 告警通知     │
└──────┬──────┘
       ↓
┌─────────────┐
│ 故障确认     │
└──────┬──────┘
       ↓
┌─────────────────────────────┐
│    根据故障类型处理          │
│  ├─ 应用故障: 重启/扩展      │
│  ├─ 数据库故障: 切换/恢复     │
│  ├─ 网络故障: 路由切换/修复    │
│  └─ 存储故障: 降级/扩展        │
└─────────────────────────────┘
       ↓
┌─────────────┐
│ 验证恢复     │
└──────┬──────┘
       ↓
┌─────────────┐
│ 故障总结     │
└─────────────┘
```

## 🔐 安全运维

### 安全监控

#### 入侵检测
```bash
# 检测异常登录
tail -f /var/log/auth.log | grep "Failed password"

# 检测异常访问
tail -f /var/log/nginx/access.log | grep "404"

# 检测异常流量
iftop -i eth0
```

#### 安全扫描
```bash
# 漏洞扫描
nmap -sV -p 1-65535 target_host

# SSL证书检查
openssl s_client -connect target_host:443

# 安全头检查
curl -I https://target_host
```

### 权限管理

#### 运维权限分配
```yaml
权限角色:
  DevOps工程师:
    - 部署应用
    - 配置监控
    - 处理故障
    - 管理数据库

  运维工程师:
    - 监控系统状态
    - 处理告警
    - 执行备份
    - 日志分析

  安全工程师:
    - 安全审计
    - 漏洞修复
    - 权限管理
    - 安全策略
```

## 📈 性能优化

### 应用性能优化

#### 性能分析
```bash
# 1. Go pprof性能分析
curl http://localhost:6060/debug/pprof/heap > heap.prof
go tool pprof -http=:8080 heap.prof

# 2. 数据库性能分析
mysql> EXPLAIN SELECT * FROM users WHERE status = 'active';

# 3. Redis性能分析
redis-cli --latency-history
```

#### 性能调优
```yaml
应用层优化:
  - 启用连接池复用
  - 使用缓存减少数据库查询
  - 异步处理耗时操作
  - 启用HTTP/2

数据库层优化:
  - 添加合适索引
  - 优化慢查询
  - 使用读写分离
  - 数据库分区

缓存层优化:
  - 合理设置缓存过期时间
  - 使用缓存预热
  - 监控缓存命中率
  - 使用本地缓存+分布式缓存
```

## 💾 数据备份与恢复

### 备份策略

#### 数据备份
```bash
#!/bin/bash
# 完整备份脚本

DATE=$(date +%Y%m%d)
BACKUP_BASE="/backup"
MYSQL_BACKUP_DIR="${BACKUP_BASE}/mysql"
REDIS_BACKUP_DIR="${BACKUP_BASE}/redis"
RETENTION_DAYS=30

# MySQL备份
echo "开始MySQL备份..."
mysqldump -u root -p${MYSQL_ROOT_PASSWORD} \
  --all-databases \
  --single-transaction \
  --master-data=2 \
  --flush-logs \
  > ${MYSQL_BACKUP_DIR}/full_backup_${DATE}.sql

# 压缩备份
gzip ${MYSQL_BACKUP_DIR}/full_backup_${DATE}.sql

# Redis备份
echo "开始Redis备份..."
redis-cli --rdb ${REDIS_BACKUP_DIR}/redis_${DATE}.rdb

# 清理旧备份
find ${BACKUP_BASE} -type f -mtime +${RETENTION_DAYS} -delete

echo "备份完成"
```

### 灾难恢复

#### 数据恢复流程
```bash
# 1. MySQL数据恢复
gunzip < full_backup_20260407.sql | mysql -u root -p

# 2. 增量备份恢复
mysqlbinlog mysql-bin.000001 | mysql -u root -p

# 3. Redis数据恢复
redis-cli --rdb /backup/redis/redis_20260407.rdb

# 4. 应用数据恢复
kubectl rollout undo deployment/pantheon-backend -n pantheon
```

## 📱 运维工具

### 自动化运维脚本

#### 系统健康检查脚本
```bash
#!/bin/bash
# 系统健康检查脚本

echo "=== Pantheon Platform 健康检查 ==="

# 检查应用服务
echo "检查应用服务..."
kubectl get pods -n pantheon | grep pantheon

# 检查数据库
echo "检查数据库..."
mysql -h localhost -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1"

# 检查Redis
echo "检查Redis..."
redis-cli ping

# 检查磁盘空间
echo "检查磁盘空间..."
df -h

# 检查内存使用
echo "检查内存使用..."
free -h

echo "健康检查完成"
```

## 🚨 应急预案

### 紧急故障响应

#### 响应时间目标
- **P0级故障** (系统不可用): 15分钟内响应
- **P1级故障** (功能严重受损): 30分钟内响应
- **P2级故障** (部分功能异常): 2小时内响应

#### 应急联系人
```yaml
团队联系:
  DevOps负责人: devops@example.com
  运维负责人: ops@example.com
  技术负责人: tech@example.com
  
外部支持:
  数据库专家: dba@example.com
  安全专家: security@example.com
  云服务商: cloud-support@example.com
```

### 降级策略

#### 服务降级
```yaml
降级策略:
  轻负载降级:
    关闭非核心功能
    限制并发用户数
    启用缓存模式
    
  数据库降级:
    只读模式运行
    使用缓存数据
    限制查询范围
    
  功能降级:
    暂停分析报表
    限制数据导出
    关闭实时监控
```

## 📊 运维报告

### 日报模板
```markdown
# 运维日报 - 2026-04-07

## 系统状态
- 应用状态: 正常
- 数据库状态: 正常
- 缓存状态: 正常

## 关键指标
- API调用量: 234,567次
- 平均响应时间: 245ms
- 错误率: 0.015%
- 并发用户: 1,234人

## 故障处理
- 故障次数: 2次
- 故障类型: 网络抖动, 缓存超时
- 处理时间: 均在15分钟内解决

## 备份状态
- 数据库备份: 成功
- Redis备份: 成功
- 备份保留时间: 30天

## 明日计划
- 性能优化分析
- 容量规划评估
- 安全巡检
```

---

**维护团队**: 运维组  
**更新频率**: 每周  
**紧急联系**: ops@pantheon.com
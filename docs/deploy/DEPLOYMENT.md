# Pantheon Platform 部署指南

> 支持 Docker Compose、Kubernetes 及云原生环境部署。

---

## 🚀 部署方案对比

| 部署方式 | 适用场景 | 复杂度 | 扩展性 | 运维成本 |
|:--- | :--- | :--- | :--- | :--- |
| **Docker Compose** | 开发/测试/小型生产 | 低 | 低 | 低 |
| **Kubernetes** | 中大型生产环境 | 高 | 高 | 中 |
| **云原生 (EKS/ACK)** | 企业级大规模应用 | 高 | 极高 | 低 (托管) |

---

## 🔑 环境变量清单

所有配置均可通过 `PANTHEON_` 前缀的环境变量覆盖 `config.yaml` 中的同名字段（`.` 替换为 `_`）。

### 必填（生产环境）

| 环境变量 | 说明 | 要求 |
|:--- | :--- | :--- |
| `PANTHEON_JWT_SECRET` | JWT 签名密钥 | 非空，建议 48+ 字符随机字符串 |
| `PANTHEON_ENCRYPTION_KEY` | 租户 DSN AES-256 加密密钥 | **必须恰好 32 字节** |
| `PANTHEON_MASTER_DB_PASSWORD` | 主库密码 | 非空 |

### 数据库

| 环境变量 | 默认值 | 说明 |
|:--- | :--- | :--- |
| `PANTHEON_MASTER_DB_TYPE` | `mysql` | 主库类型：`mysql` / `postgresql` / `sqlite` / `mssql` |
| `PANTHEON_MASTER_DB_HOST` | `localhost` | 主库地址 |
| `PANTHEON_MASTER_DB_PORT` | `3306` | 主库端口 |
| `PANTHEON_MASTER_DB_DATABASE` | `pantheon` | 主库名 |
| `PANTHEON_MASTER_DB_USERNAME` | `root` | 主库用户名 |
| `PANTHEON_MASTER_DB_PASSWORD` | — | 主库密码（必填） |
| `PANTHEON_MASTER_DB_SSL_MODE` | `disable` | SSL 模式 |

### Redis

| 环境变量 | 默认值 | 说明 |
|:--- | :--- | :--- |
| `PANTHEON_REDIS_HOST` | `localhost` | Redis 地址 |
| `PANTHEON_REDIS_PORT` | `6379` | Redis 端口 |
| `PANTHEON_REDIS_PASSWORD` | — | Redis 密码（无密码时留空） |
| `PANTHEON_REDIS_DB` | `0` | Redis 数据库编号 |

### 认证与安全

| 环境变量 | 默认值 | 说明 |
|:--- | :--- | :--- |
| `PANTHEON_JWT_SECRET` | — | JWT 密钥（生产必填） |
| `PANTHEON_JWT_EXPIRES_IN` | `7200` | Access Token 有效期（秒，默认 2 小时） |
| `PANTHEON_REFRESH_EXPIRY` | `604800` | Refresh Token 有效期（秒，默认 7 天） |
| `PANTHEON_ENCRYPTION_KEY` | — | 32 字节 AES 密钥（生产必填） |
| `PANTHEON_SECURITY_ENABLE_2FA` | `true` | 是否启用全局 2FA |
| `PANTHEON_SECURITY_MAX_CONCURRENT_SESSIONS` | `0` | 最大并发会话数（0 = 不限制） |

### 默认管理员（仅开发环境）

| 环境变量 | 默认值 | 说明 |
|:--- | :--- | :--- |
| `PANTHEON_DEFAULT_ADMIN_ENABLED` | `false` | **生产环境必须为 false** |
| `PANTHEON_DEFAULT_ADMIN_USERNAME` | `admin` | 默认管理员用户名 |
| `PANTHEON_DEFAULT_ADMIN_PASSWORD` | — | 默认管理员密码（至少 12 位） |
| `PANTHEON_DEFAULT_ADMIN_EMAIL` | `admin@example.com` | 默认管理员邮箱 |

### 多租户与部署模式

| 环境变量 | 默认值 | 说明 |
|:--- | :--- | :--- |
| `PANTHEON_ENABLE_MULTI_TENANT` | `true` | 是否启用多租户 |
| `PANTHEON_DEFAULT_TENANT_ID` | `00000000-0000-0000-0000-000000000000` | 默认平台租户 ID |
| `PANTHEON_DEPLOYMENT_MODE` | `saas` | 部署模式：`private` / `paas` / `saas` |
| `PANTHEON_DEPLOYMENT_TENANT_STRATEGY` | `dedicated` | 租户策略：`single` / `dedicated` / `mixed` |

### 存储

| 环境变量 | 默认值 | 说明 |
|:--- | :--- | :--- |
| `PANTHEON_STORAGE_PROVIDER` | `local` | 存储提供商：`local` / `s3` |
| `PANTHEON_STORAGE_UPLOAD_DIR` | `uploads` | 本地存储目录 |
| `PANTHEON_STORAGE_BASE_URL` | `/uploads` | 本地存储访问 URL 前缀 |
| `PANTHEON_STORAGE_S3_BUCKET` | — | S3 Bucket 名称 |
| `PANTHEON_STORAGE_S3_REGION` | — | S3 Region |
| `PANTHEON_STORAGE_S3_ACCESS_KEY` | — | S3 Access Key |
| `PANTHEON_STORAGE_S3_SECRET_KEY` | — | S3 Secret Key |

### 邮件（可选）

| 环境变量 | 默认值 | 说明 |
|:--- | :--- | :--- |
| `PANTHEON_EMAIL_ENABLED` | `false` | 是否启用邮件服务 |
| `PANTHEON_EMAIL_PROVIDER` | `smtp` | 邮件提供商：`smtp` / `sendgrid` / `aliyun` |
| `PANTHEON_EMAIL_FROM` | `noreply@example.com` | 发件人地址 |
| `PANTHEON_EMAIL_SMTP_HOST` | `smtp.example.com` | SMTP 主机 |
| `PANTHEON_EMAIL_SMTP_PORT` | `587` | SMTP 端口 |
| `PANTHEON_EMAIL_SMTP_USERNAME` | — | SMTP 用户名 |
| `PANTHEON_EMAIL_SMTP_PASSWORD` | — | SMTP 密码 |
| `PANTHEON_EMAIL_SENDGRID_API_KEY` | — | SendGrid API Key |

### 短信（可选）

| 环境变量 | 默认值 | 说明 |
|:--- | :--- | :--- |
| `PANTHEON_SMS_ENABLED` | `false` | 是否启用短信服务 |
| `PANTHEON_SMS_PROVIDER` | `aliyun` | 短信提供商：`aliyun` / `tencent` / `twilio` |
| `PANTHEON_SMS_ALIYUN_ACCESS_KEY_ID` | — | 阿里云 Access Key ID |
| `PANTHEON_SMS_ALIYUN_ACCESS_KEY_SECRET` | — | 阿里云 Access Key Secret |

---

## 🐳 Docker Compose 部署 (推荐小型环境)

适用于快速验证和中轻量级生产场景。

### 1. 快速启动
```bash
# 1. 配置环境
cp docker-compose.example.yml docker-compose.yml
# 修改 docker-compose.yml 中的数据库密码与 JWT 密钥

# 2. 启动所有服务
docker-compose up -d

# 3. 初始化主库数据 (仅首次)
docker-compose exec backend ./pantheon-server --migrate-only
```

### 2. 服务组件
- **backend**: 监听 8080 端口。
- **frontend**: 基于 Nginx，监听 80 端口。
- **mysql**: 主数据库。
- **redis**: 用于会话与翻译缓存。

---

## ☸️ Kubernetes 部署

适用于需要高可用、自动扩缩容的生产环境。

### 1. 前置要求
- Kubernetes 1.25+
- 已安装 Ingress Controller (如 NGINX Ingress)
- 已配置持久化存储 (StorageClass)

### 2. 部署步骤
1. **创建命名空间与密钥**：
   ```bash
   kubectl create namespace pantheon
   # 创建数据库、JWT 及租户加密密钥
   kubectl create secret generic pantheon-secrets \
     --from-literal=PANTHEON_MASTER_DB_PASSWORD=your_db_pass \
     --from-literal=PANTHEON_JWT_SECRET=your_jwt_key_48chars \
     --from-literal=PANTHEON_ENCRYPTION_KEY=your_32byte_key__ \
     -n pantheon
   ```
2. **应用配置文件**：
   按顺序应用 `k8s/` 目录下的清单文件：
   - MySQL (StatefulSet)
   - Redis (Deployment)
   - Backend & Frontend (Deployment + Service)
   - Ingress (路由配置)

> **注意**：`k8s/` 目录与 Helm Chart 尚未在仓库中提供，需要根据实际环境自行编写。

---

## 📊 监控与运维

### 1. 健康检查
- 接口地址：`GET /health`
- 返回内容：包含数据库与 Redis 的连通性状态。

### 2. 日志查看
- **Docker**: `docker-compose logs -f backend`
- **K8s**: `kubectl logs -l app=pantheon-backend -n pantheon`

### 3. 数据备份
建议针对 Master DB 开启每日定时快照。租户库的备份可根据 `tenant_id` 进行独立导出。

---

*Pantheon Platform Deployment Guide - Last Updated: 2026-04-04*


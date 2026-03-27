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
     --from-literal=mysql-root-password=your_pass \
     --from-literal=jwt-secret=your_jwt_key \
     -n pantheon
   ```
2. **应用配置文件**：
   按顺序应用 `k8s/` 目录下的清单文件：
   - MySQL (StatefulSet)
   - Redis (Deployment)
   - Backend & Frontend (Deployment + Service)
   - Ingress (路由配置)

### 3. 使用 Helm 部署 (推荐)
```bash
helm repo add pantheon https://charts.pantheon-platform.com
helm install pantheon pantheon/pantheon-platform -n pantheon --values values.yaml
```

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

*Pantheon Platform Deployment Guide - Last Updated: 2026-03-23*

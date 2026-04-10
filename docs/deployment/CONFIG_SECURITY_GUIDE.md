# 配置文件安全化指南

## 📋 概述

本文档说明如何安全地配置 Pantheon Platform，确保敏感信息不被泄露到版本控制系统中。

## 🚨 安全风险

### 常见安全问题
1. **明文密码**: 配置文件中包含明文数据库密码、API密钥等
2. **版本控制泄露**: 敏感配置被提交到 Git 仓库
3. **环境混淆**: 开发环境配置用于生产环境
4. **密钥轮换**: 缺乏密钥定期更新机制

## ✅ 安全配置实践

### 1. 环境变量优先

**配置层次**（优先级从高到低）:
```
环境变量 > 配置文件 > 默认值
```

**使用环境变量**:
```bash
# 设置环境变量
export PANTHEON_JWT_SECRET="your-secret-key"
export PANTHEON_MASTER_DB_PASSWORD="db-password"

# 应用会自动读取环境变量
./pantheon-server
```

### 2. 配置文件分离

**文件结构**:
```
backend/
├── config.yaml          # 实际配置（不提交到Git）
├── config.example.yaml  # 配置示例（提交到Git）
└── .env.example         # 环境变量示例（提交到Git）
```

**.gitignore 配置**:
```gitignore
# 配置文件
backend/config.yaml
backend/config.yaml.backup
backend/.env

# 但保留示例文件
!backend/config.example.yaml
!backend/.env.example
```

### 3. 敏感信息加密

**生产环境密钥生成**:
```bash
# 生成 JWT 密钥 (32字节)
openssl rand -base64 32

# 生成加密密钥 (32字节)
openssl rand -base64 32 | head -c 32

# 生成数据库密码
openssl rand -base64 16
```

### 4. 环境特定配置

**开发环境** (.env.development):
```bash
ENVIRONMENT=development
SERVER_MODE=debug
LOG_LEVEL=debug
DEFAULT_ADMIN_ENABLED=true
SECURITY_RATE_LIMIT_ENABLED=false
```

**生产环境** (.env.production):
```bash
ENVIRONMENT=production
SERVER_MODE=release
LOG_LEVEL=warn
DEFAULT_ADMIN_ENABLED=false
SECURITY_RATE_LIMIT_ENABLED=true
```

## 🔧 配置迁移指南

### 从不安全配置迁移

**步骤 1: 备份现有配置**
```bash
cp backend/config.yaml backend/config.yaml.backup
```

**步骤 2: 创建环境变量文件**
```bash
# 复制示例文件
cp backend/.env.example backend/.env

# 编辑敏感信息
vim backend/.env
```

**步骤 3: 更新配置文件**
```yaml
# config.yaml - 移除敏感信息
master_db:
  type: mysql
  host: localhost
  port: 3306
  database: pantheon_master
  username: root
  # password: 从环境变量 PANTHEON_MASTER_DB_PASSWORD 读取

jwt:
  # secret: 从环境变量 PANTHEON_JWT_SECRET 读取
  expires_in: 7200
```

**步骤 4: 验证配置**
```bash
# 加载环境变量
source backend/.env

# 测试配置
./pantheon-server --validate-config
```

## 🏢 生产环境配置

### 密钥管理服务

**AWS Secrets Manager**:
```bash
# 存储密钥
aws secretsmanager create-secret \
  --name /pantheon/production/jwt-secret \
  --secret-string "your-jwt-secret"

# 读取密钥
aws secretsmanager get-secret-value \
  --secret-id /pantheon/production/jwt-secret
```

**HashiCorp Vault**:
```bash
# 存储密钥
vault kv put secret/pantheon/jwt \
  secret="your-jwt-secret"

# 读取密钥
vault kv get secret/pantheon/jwt
```

### Docker 部署

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    image: pantheon-platform:latest
    environment:
      - PANTHEON_JWT_SECRET=${JWT_SECRET}
      - PANTHEON_MASTER_DB_PASSWORD=${DB_PASSWORD}
      - PANTHEON_REDIS_PASSWORD=${REDIS_PASSWORD}
    env_file:
      - .env.production
```

**Kubernetes Secrets**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: pantheon-secrets
type: Opaque
stringData:
  jwt-secret: your-jwt-secret
  db-password: your-db-password
  redis-password: your-redis-password
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: PANTHEON_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: pantheon-secrets
              key: jwt-secret
```

## 🔍 配置验证

### 安全检查清单

**配置文件检查**:
- [ ] 无明文密码
- [ ] 无硬编码密钥
- [ ] 无开发环境配置
- [ ] 正确的文件权限

**环境变量检查**:
- [ ] 所有敏感信息使用环境变量
- [ ] 环境变量文件在 .gitignore 中
- [ ] 生产环境使用强密钥
- [ ] 密钥定期轮换

**部署前检查**:
```bash
# 检查配置文件权限
chmod 600 backend/config.yaml
chmod 600 backend/.env

# 验证配置不包含敏感信息
grep -i "password\|secret\|key" backend/config.yaml | grep -v "^#\|environment:"

# 检查 .gitignore
git check-ignore -v backend/config.yaml backend/.env
```

## 🚨 应急响应

### 密钥泄露处理

**立即行动**:
1. **停止服务**: 防止进一步损害
2. **轮换密钥**: 立即更换所有泄露的密钥
3. **审查日志**: 检查异常访问
4. **通知用户**: 如果涉及用户数据

**密钥轮换流程**:
```bash
# 1. 生成新密钥
NEW_JWT_SECRET=$(openssl rand -base64 32)

# 2. 更新环境变量
export PANTHEON_JWT_SECRET="$NEW_JWT_SECRET"

# 3. 重启服务
systemctl restart pantheon-platform

# 4. 验证服务正常
curl -f https://your-platform.com/health || echo "Service check failed"
```

## 📚 最佳实践

### 开发环境
- ✅ 使用默认弱密钥（仅供开发）
- ✅ 启用详细日志
- ✅ 禁用速率限制
- ✅ 启用默认管理员

### 生产环境
- ✅ 使用强随机密钥
- ✅ 限制日志详细程度
- ✅ 启用所有安全特性
- ✅ 禁用默认管理员
- ✅ 使用密钥管理服务
- ✅ 定期审计访问日志
- ✅ 实施密钥轮换策略

### 配置管理
1. **版本控制**: 只提交配置示例
2. **环境分离**: 不同环境使用不同配置
3. **变更管理**: 配置变更需要审核
4. **监控告警**: 配置错误触发告警
5. **备份恢复**: 定期备份配置文件

## 🔧 工具支持

### 配置生成工具

**生成安全配置**:
```bash
# 使用提供的脚本
./scripts/generate-config.sh --environment production
```

**验证配置安全性**:
```bash
# 运行安全检查
./scripts/check-config-security.sh
```

## 📖 相关文档

- [部署指南](deployment/DEPLOYMENT_GUIDE.md)
- [运维手册](operations/OPERATIONS_MANUAL.md)
- [安全架构](design/SECURITY_DESIGN.md)

---

**维护团队**: DevOps组  
**最后更新**: 2026-04-07  
**审核周期**: 每季度
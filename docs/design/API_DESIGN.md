# Pantheon Platform API设计文档

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **API版本**: v1
- **协议**: HTTPS + JSON

## 🎯 API设计原则

### RESTful设计原则

1. **资源导向**: URL表示资源，HTTP方法表示操作
2. **统一接口**: 一致的API设计和命名规范
3. **无状态**: 每个请求包含所有必要信息
4. **分层系统**: 支持代理、网关等中间层
5. **可缓存**: 支持HTTP缓存机制

### API版本管理
```
/api/v1/ - 当前稳定版本
/api/v2/ - 新版本 (Beta)
/api/latest/ - 最新版本
```

## 🔐 认证授权API

### 用户登录

**请求**:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Secure@123",
  "tenant_code": "acme"
}
```

**响应**:
```json
{
  "code": "success",
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 7200,
    "user": {
      "id": "user-123",
      "username": "admin",
      "real_name": "系统管理员",
      "email": "admin@example.com",
      "avatar": "https://cdn.example.com/avatar.jpg",
      "roles": ["admin", "user"],
      "permissions": ["user:read", "user:write"],
      "tenant_id": "tenant-123",
      "tenant_code": "acme"
    }
  }
}
```

### 刷新令牌

**请求**:
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**:
```json
{
  "code": "success",
  "message": "令牌刷新成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 7200
  }
}
```

### 获取当前用户信息

**请求**:
```http
GET /api/v1/auth/current
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "code": "success",
  "message": "获取用户信息成功",
  "data": {
    "id": "user-123",
    "username": "admin",
    "real_name": "系统管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "status": "active",
    "tenant_id": "tenant-123",
    "tenant_code": "acme",
    "department_id": "dept-123",
    "position_id": "pos-123",
    "role_ids": ["role-admin", "role-user"],
    "role_names": ["系统管理员", "普通用户"],
    "last_login_at": "2026-04-07T10:30:00Z",
    "last_login_ip": "192.168.1.100"
  }
}
```

## 👥 用户管理API

### 获取用户列表

**请求**:
```http
GET /api/v1/system/users?page=1&page_size=20&status=active&department=dept-123
Authorization: Bearer {access_token}
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页数量，默认20，最大100 |
| status | string | 否 | 用户状态：active/inactive/locked |
| department | string | 否 | 部门ID |
| keyword | string | 否 | 搜索关键词（用户名、姓名、邮箱） |
| sort_by | string | 否 | 排序字段：created_at/username/last_login_at |
| sort_order | string | 否 | 排序方向：asc/desc |

**响应**:
```json
{
  "code": "success",
  "message": "获取用户列表成功",
  "data": {
    "items": [
      {
        "id": "user-123",
        "username": "john.doe",
        "real_name": "约翰·多伊",
        "email": "john@example.com",
        "phone": "13800138000",
        "avatar": "https://cdn.example.com/avatar.jpg",
        "status": "active",
        "department_id": "dept-123",
        "department_name": "技术部",
        "position_id": "pos-123",
        "position_name": "工程师",
        "roles": ["role-user"],
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-04-07T10:30:00Z",
        "last_login_at": "2026-04-07T09:15:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "page_size": 20,
    "total_pages": 8
  }
}
```

### 创建用户

**请求**:
```http
POST /api/v1/system/users
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "username": "jane.doe",
  "password": "Secure@123",
  "real_name": "简·多伊",
  "email": "jane@example.com",
  "phone": "13900139000",
  "department_id": "dept-123",
  "position_id": "pos-123",
  "role_ids": ["role-user"],
  "status": "active"
}
```

**验证规则**:
```json
{
  "username": {
    "required": true,
    "pattern": "^[a-zA-Z0-9_]{4,20}$",
    "unique": "users.username"
  },
  "password": {
    "required": true,
    "minLength": 12,
    "complexity": "upper,lower,digit,special"
  },
  "email": {
    "required": true,
    "format": "email",
    "unique": "users.email"
  },
  "real_name": {
    "required": true,
    "maxLength": 50
  }
}
```

**响应**:
```json
{
  "code": "success",
  "message": "用户创建成功",
  "data": {
    "id": "user-456",
    "username": "jane.doe",
    "real_name": "简·多伊",
    "email": "jane@example.com",
    "status": "active",
    "created_at": "2026-04-07T10:30:00Z"
  }
}
```

### 更新用户

**请求**:
```http
PUT /api/v1/system/users/{user_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "real_name": "简·多伊更新",
  "email": "jane.updated@example.com",
  "phone": "13900139001",
  "department_id": "dept-456",
  "position_id": "pos-456",
  "status": "active"
}
```

**响应**:
```json
{
  "code": "success",
  "message": "用户更新成功",
  "data": {
    "id": "user-456",
    "username": "jane.doe",
    "real_name": "简·多伊更新",
    "email": "jane.updated@example.com",
    "updated_at": "2026-04-07T10:35:00Z"
  }
}
```

### 批量操作用户状态

**请求**:
```http
PATCH /api/v1/system/users/status
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "user_ids": ["user-123", "user-456", "user-789"],
  "action": "activate",
  "reason": "部门调整，重新激活"
}
```

**操作类型**:
- `activate`: 激活用户
- `deactivate`: 停用用户
- `lock`: 锁定用户
- `unlock`: 解锁用户

**响应**:
```json
{
  "code": "success",
  "message": "批量操作完成",
  "data": {
    "total": 3,
    "succeeded": 3,
    "failed": 0,
    "details": [
      {
        "user_id": "user-123",
        "status": "succeeded"
      },
      {
        "user_id": "user-456",
        "status": "succeeded"
      },
      {
        "user_id": "user-789",
        "status": "succeeded"
      }
    ]
  }
}
```

### 其他系统模块的批量接口

除了用户管理外，系统管理模块还提供了以下批量接口：

#### 角色管理批量接口

**批量删除角色**:
```http
POST /api/v1/system/roles/batch-delete
Content-Type: application/json

{
  "ids": ["role-123", "role-456"]
}
```

**批量操作角色状态**:
```http
PATCH /api/v1/system/roles/status
Content-Type: application/json

{
  "ids": ["role-123", "role-456"],
  "action": "activate"  // 或 "deactivate"
}
```

#### 部门管理批量接口

**批量删除部门**:
```http
POST /api/v1/system/depts/batch-delete
Content-Type: application/json

{
  "ids": ["dept-123", "dept-456"]
}
```

**批量操作部门状态**:
```http
PATCH /api/v1/system/depts/status
Content-Type: application/json

{
  "ids": ["dept-123", "dept-456"],
  "action": "activate"  // 或 "deactivate"
}
```

#### 岗位管理批量接口

**批量删除岗位**:
```http
POST /api/v1/system/positions/batch-delete
Content-Type: application/json

{
  "ids": ["pos-123", "pos-456"]
}
```

**批量操作岗位状态**:
```http
PATCH /api/v1/system/positions/status
Content-Type: application/json

{
  "ids": ["pos-123", "pos-456"],
  "action": "activate"  // 或 "deactivate"
}
```

#### 权限管理批量接口

**批量删除权限**:
```http
POST /api/v1/system/permissions/batch-delete
Content-Type: application/json

{
  "ids": ["perm-123", "perm-456"]
}
```

**批量操作权限状态**:
```http
PATCH /api/v1/system/permissions/status
Content-Type: application/json

{
  "ids": ["perm-123", "perm-456"],
  "action": "activate"  // 或 "deactivate"
}
```

#### 菜单管理批量接口

**批量删除菜单**:
```http
POST /api/v1/system/menus/batch-delete
Content-Type: application/json

{
  "ids": ["menu-123", "menu-456"]
}
```

**批量操作菜单状态**:
```http
PATCH /api/v1/system/menus/status
Content-Type: application/json

{
  "ids": ["menu-123", "menu-456"],
  "action": "activate"  // 或 "deactivate"
}
```

#### 批量接口通用特性

所有系统管理模块的批量接口都具有以下特性：

1. **原子性**: 批量操作是原子操作，要么全部成功，要么全部失败
2. **租户隔离**: 批量操作受租户上下文限制，只能操作当前租户的数据
3. **权限同步**: 批量操作会触发权限刷新，确保授权状态同步
4. **审计日志**: 批量操作会记录聚合的审计日志
5. **数量限制**: 单次批量操作最多支持100条记录
6. **状态操作**: 支持批量激活和停用操作

## 🔐 角色权限API

### 获取角色列表

**请求**:
```http
GET /api/v1/system/roles?page=1&page_size=20
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "code": "success",
  "message": "获取角色列表成功",
  "data": {
    "items": [
      {
        "id": "role-admin",
        "name": "系统管理员",
        "code": "admin",
        "description": "拥有系统所有权限",
        "is_system": true,
        "user_count": 5,
        "permissions_count": 156,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-04-07T10:30:00Z"
      }
    ],
    "total": 12,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

### 创建角色

**请求**:
```http
POST /api/v1/system/roles
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "数据录入员",
  "code": "data_entry",
  "description": "负责数据录入和基础编辑",
  "is_system": false,
  "status": "active"
}
```

**响应**:
```json
{
  "code": "success",
  "message": "角色创建成功",
  "data": {
    "id": "role-data-entry",
    "name": "数据录入员",
    "code": "data_entry",
    "created_at": "2026-04-07T10:40:00Z"
  }
}
```

### 分配角色权限

**请求**:
```http
PUT /api/v1/system/roles/{role_id}/permissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "menu_ids": ["menu-user-list", "menu-user-create"],
  "permission_ids": ["user:read", "user:create", "user:update"]
}
```

**响应**:
```json
{
  "code": "success",
  "message": "权限分配成功",
  "data": {
    "role_id": "role-data-entry",
    "assigned_menus": 2,
    "assigned_permissions": 3,
    "updated_at": "2026-04-07T10:45:00Z"
  }
}
```

## 🏢 租户管理API

### 获取租户列表

**请求**:
```http
GET /api/v1/tenants?page=1&page_size=20&status=active
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "code": "success",
  "message": "获取租户列表成功",
  "data": {
    "items": [
      {
        "id": "tenant-123",
        "code": "acme",
        "name": "ACME公司",
        "status": "active",
        "contact_name": "张三",
        "contact_email": "zhangsan@acme.com",
        "contact_phone": "13800138000",
        "user_count": 45,
        "storage_used_gb": 23.5,
        "storage_quota_gb": 50.0,
        "health_status": "good",
        "health_score": 92.5,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-04-07T10:30:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

### 创建租户

**请求**:
```http
POST /api/v1/tenants
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "code": "globex",
  "name": "Globex公司",
  "contact_name": "李四",
  "contact_email": "lisi@globex.com",
  "contact_phone": "13900139000",
  "database_config": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "database_name": "pantheon_tenant_globex",
    "username": "globex_user",
    "password": "encrypted_password"
  },
  "resource_quota": {
    "max_users": 100,
    "max_storage_gb": 50,
    "max_api_calls_per_minute": 1000
  }
}
```

**响应**:
```json
{
  "code": "success",
  "message": "租户创建成功",
  "data": {
    "id": "tenant-456",
    "code": "globex",
    "name": "Globex公司",
    "admin_username": "admin",
    "admin_password": "TempPassword@123",
    "database_created": true,
    "created_at": "2026-04-07T11:00:00Z"
  }
}
```

### 获取租户监控数据

**请求**:
```http
GET /api/v1/tenants/{tenant_id}/monitoring?duration=24h
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "code": "success",
  "message": "获取租户监控数据成功",
  "data": {
    "tenant_id": "tenant-123",
    "tenant_code": "acme",
    "health_status": "good",
    "health_score": 92.5,
    "metrics": {
      "performance": {
        "avg_response_time": 256.5,
        "p95_response_time": 485.2,
        "p99_response_time": 892.1,
        "requests_per_second": 45.2,
        "error_rate": 0.02
      },
      "resources": {
        "cpu_usage": 45.2,
        "memory_usage": 68.5,
        "disk_usage": 72.1,
        "database_connections": 25,
        "database_pool_usage": 50.0
      },
      "usage": {
        "total_users": 45,
        "active_users": 23,
        "total_requests": 125000,
        "storage_used_gb": 23.5,
        "storage_quota_gb": 50.0
      }
    },
    "alerts": [
      {
        "id": "alert-123",
        "severity": "warning",
        "title": "存储使用率较高",
        "message": "存储使用率已达到72.1%，建议关注",
        "created_at": "2026-04-07T10:00:00Z"
      }
    ],
    "trends": {
      "response_time_trend": "increasing",
      "error_rate_trend": "stable",
      "user_growth_trend": "increasing"
    }
  }
}
```

## 📊 系统监控API

### 系统概览

**请求**:
```http
GET /api/v1/system/monitor/overview
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "code": "success",
  "message": "获取系统概览成功",
  "data": {
    "system_health": "good",
    "total_tenants": 15,
    "healthy_tenants": 14,
    "warning_tenants": 1,
    "critical_tenants": 0,
    "total_users": 1234,
    "active_users": 567,
    "metrics": {
      "cpu_usage": 52.3,
      "memory_usage": 68.5,
      "disk_usage": 45.2,
      "network_in": "125.5 MB/s",
      "network_out": "89.3 MB/s",
      "api_requests_per_second": 234.5,
      "avg_response_time": 185.6,
      "error_rate": 0.015
    },
    "alerts": [
      {
        "id": "alert-456",
        "severity": "warning",
        "title": "租户ACME存储空间不足",
        "message": "存储使用率90%，建议升级套餐",
        "tenant_code": "acme",
        "created_at": "2026-04-07T10:30:00Z"
      }
    ]
  }
}
```

### 性能指标

**请求**:
```http
GET /api/v1/system/monitor/performance?duration=1h&interval=5m
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "code": "success",
  "message": "获取性能指标成功",
  "data": {
    "duration": "1h",
    "interval": "5m",
    "metrics": {
      "response_time": [
        {"timestamp": "2026-04-07T09:00:00Z", "avg": 175.2, "p95": 420.5, "p99": 890.1},
        {"timestamp": "2026-04-07T09:05:00Z", "avg": 180.5, "p95": 435.2, "p99": 910.5}
      ],
      "throughput": [
        {"timestamp": "2026-04-07T09:00:00Z", "requests_per_second": 220.5},
        {"timestamp": "2026-04-07T09:05:00Z", "requests_per_second": 235.8}
      ],
      "error_rate": [
        {"timestamp": "2026-04-07T09:00:00Z", "rate": 0.012},
        {"timestamp": "2026-04-07T09:05:00Z", "rate": 0.018}
      ]
    }
  }
}
```

## 🚨 错误处理

### 标准错误响应

```json
{
  "code": "error",
  "message": "请求失败",
  "error_code": "VALIDATION_ERROR",
  "error_details": {
    "field": "username",
    "issue": "用户名已存在"
  },
  "request_id": "req-123456",
  "timestamp": "2026-04-07T10:30:00Z"
}
```

### 错误代码定义

| HTTP状态码 | 错误代码 | 说明 |
|-----------|---------|------|
| 400 | VALIDATION_ERROR | 请求参数验证失败 |
| 401 | UNAUTHORIZED | 未授权访问 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 429 | RATE_LIMIT_EXCEEDED | 请求频率超限 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |
| 503 | SERVICE_UNAVAILABLE | 服务暂时不可用 |

## 🌐 多语言支持

### 请求语言设置

**请求头**:
```http
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
```

**响应**:
```json
{
  "code": "success",
  "message": "登录成功",  // 根据Accept-Language返回
  "data": {...}
}
```

## 📝 开发规范

### API设计最佳实践

1. **URL设计**:
   - 使用名词复数：`/api/v1/users` 而非 `/api/v1/user`
   - 层级结构：`/api/v1/tenants/{id}/users`
   - 避免深层嵌套：最多3层

2. **HTTP方法使用**:
   - `GET`: 获取资源
   - `POST`: 创建资源
   - `PUT`: 更新整个资源
   - `PATCH`: 部分更新资源
   - `DELETE`: 删除资源

3. **状态码使用**:
   - `200`: 成功
   - `201`: 创建成功
   - `204`: 删除成功
   - `400`: 请求错误
   - `401`: 未授权
   - `403`: 禁止访问
   - `404`: 资源不存在
   - `500`: 服务器错误

4. **分页参数**:
   - `page`: 页码（从1开始）
   - `page_size`: 每页数量（默认20，最大100）
   - `sort_by`: 排序字段
   - `sort_order`: 排序方向（asc/desc）

5. **过滤和搜索**:
   - 使用查询参数进行过滤
   - 支持模糊搜索
   - 支持多条件组合

### API安全

#### 认证机制
- 所有业务API需要JWT认证
- 敏感操作需要二次验证
- 支持API Key认证

#### 权限检查
```go
// 伪代码示例
func (h *UserHandler) GetUsers(c *gin.Context) {
    // 1. 验证JWT令牌
    user := auth.GetCurrentUser(c)
    
    // 2. 检查权限
    if !auth.HasPermission(user, "user:read") {
        c.JSON(403, gin.H{"code": "FORBIDDEN"})
        return
    }
    
    // 3. 业务逻辑
    users := userService.GetUsers(c.Request.Context())
    
    // 4. 返回结果
    c.JSON(200, gin.H{"code": "success", "data": users})
}
```

---

**API版本**: v1.0  
**最后更新**: 2026-04-07  
**维护团队**: API设计组
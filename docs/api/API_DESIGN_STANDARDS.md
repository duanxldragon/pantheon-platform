# API设计规范文档

## 文档说明

本文档定义了Pantheon Platform的API设计规范，旨在确保API的一致性、可维护性和易用性。

**版本：** v1.0
**生效日期：** 2026-04-06
**适用范围：** 所有后端API设计和前端API调用

---

## 1. 基本原则

### 1.1 RESTful设计
- 遵循REST架构风格
- 使用HTTP动词表示操作类型
- URL表示资源，使用名词复数
- 保持无状态设计

### 1.2 版本管理
- 所有API都必须包含版本号
- 当前版本：`/api/v1/`
- 向后兼容性保证

### 1.3 统一响应格式
- 成功响应使用统一格式
- 错误响应使用统一格式
- 支持国际化错误信息

---

## 2. URL设计规范

### 2.1 基本格式

```
https://{domain}/api/v1/{module}/{resource}/{id}/{sub-resource}
```

**示例：**
```http
GET /api/v1/system/users                    # 用户列表
GET /api/v1/system/users/{id}               # 用户详情
GET /api/v1/system/users/{id}/roles         # 用户角色
POST /api/v1/system/users                   # 创建用户
PUT /api/v1/system/users/{id}               # 更新用户
DELETE /api/v1/system/users/{id}            # 删除用户
```

### 2.2 命名规范

**模块命名：**
- 使用小写字母
- 使用单数形式
- 示例：`system`、`auth`、`tenant`

**资源命名：**
- 使用小写字母和连字符
- 使用复数形式
- 示例：`users`、`user-roles`、`operation-logs`

### 2.3 查询参数规范

**分页参数：**
```http
GET /api/v1/system/users?pageNumber=1&pageSize=20
```

**排序参数：**
```http
GET /api/v1/system/users?sortField=createdAt&sortOrder=desc
```

**过滤参数：**
```http
GET /api/v1/system/users?status=active&departmentId=xxx
```

**搜索参数：**
```http
GET /api/v1/system/users?search=john
```

### 2.4 复杂查询规范

**多条件过滤：**
```http
GET /api/v1/system/users?filters[status]=active&filters[departmentId]=xxx
```

**日期范围：**
```http
GET /api/v1/system/users?createdAt[from]=2026-01-01&createdAt[to]=2026-12-31
```

---

## 3. HTTP方法使用规范

### 3.1 标准方法

| 方法 | 用途 | 幂等性 | 安全性 |
|------|------|--------|--------|
| GET | 查询资源 | ✅ | ✅ |
| POST | 创建资源 | ❌ | ❌ |
| PUT | 完整更新资源 | ✅ | ❌ |
| PATCH | 部分更新资源 | ❌ | ❌ |
| DELETE | 删除资源 | ✅ | ❌ |

### 3.2 使用示例

**GET - 查询资源：**
```http
GET /api/v1/system/users/{id}
响应：200 OK
```

**POST - 创建资源：**
```http
POST /api/v1/system/users
请求体：{ "username": "john", "email": "john@example.com" }
响应：201 Created
Location: /api/v1/system/users/{new-id}
```

**PUT - 完整更新：**
```http
PUT /api/v1/system/users/{id}
请求体：{ "username": "john", "email": "newemail@example.com", ... }
响应：200 OK
```

**PATCH - 部分更新：**
```http
PATCH /api/v1/system/users/{id}
请求体：{ "email": "newemail@example.com" }
响应：200 OK
```

**DELETE - 删除资源：**
```http
DELETE /api/v1/system/users/{id}
响应：204 No Content
```

---

## 4. 请求体规范

### 4.1 Content-Type

**JSON格式：**
```http
Content-Type: application/json
```

**表单格式：**
```http
Content-Type: application/x-www-form-urlencoded
```

**文件上传：**
```http
Content-Type: multipart/form-data
```

### 4.2 请求体命名规范

**使用驼峰命名：**
```json
{
  "username": "john",
  "email": "john@example.com",
  "realName": "John Doe",
  "departmentId": "xxx"
}
```

**时间格式：**
```json
{
  "createdAt": "2026-04-06T10:00:00Z",
  "updatedAt": "2026-04-06T10:00:00Z"
}
```

**布尔值：**
```json
{
  "enabled": true,
  "verified": false
}
```

---

## 5. 响应格式规范

### 5.1 成功响应格式

**单个资源响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "xxx",
    "username": "john",
    "email": "john@example.com"
  },
  "timestamp": "2026-04-06T10:00:00Z"
}
```

**列表资源响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "xxx",
        "username": "john"
      },
      {
        "id": "yyy",
        "username": "jane"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2026-04-06T10:00:00Z"
}
```

**创建资源响应：**
```json
{
  "code": 201,
  "message": "created",
  "data": {
    "id": "new-id",
    "username": "john"
  },
  "timestamp": "2026-04-06T10:00:00Z"
}
```

**删除操作响应：**
```json
{
  "code": 204,
  "message": "deleted",
  "data": null,
  "timestamp": "2026-04-06T10:00:00Z"
}
```

### 5.2 错误响应格式

**标准错误响应：**
```json
{
  "code": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "timestamp": "2026-04-06T10:00:00Z"
}
```

**认证错误响应：**
```json
{
  "code": 401,
  "message": "Unauthorized",
  "errors": [
    {
      "field": null,
      "message": "Invalid username or password"
    }
  ],
  "timestamp": "2026-04-06T10:00:00Z"
}
```

**权限错误响应：**
```json
{
  "code": 403,
  "message": "Forbidden",
  "errors": [
    {
      "field": null,
      "message": "You don't have permission to access this resource"
    }
  ],
  "timestamp": "2026-04-06T10:00:00Z"
}
```

**资源不存在响应：**
```json
{
  "code": 404,
  "message": "Not Found",
  "errors": [
    {
      "field": null,
      "message": "User not found"
    }
  ],
  "timestamp": "2026-04-06T10:00:00Z"
}
```

**服务器错误响应：**
```json
{
  "code": 500,
  "message": "Internal Server Error",
  "errors": [
    {
      "field": null,
      "message": "An unexpected error occurred"
    }
  ],
  "timestamp": "2026-04-06T10:00:00Z"
}
```

---

## 6. HTTP状态码规范

### 6.1 成功响应

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | GET、PUT、PATCH成功 |
| 201 | Created | POST创建成功 |
| 204 | No Content | DELETE成功 |

### 6.2 客户端错误

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 400 | Bad Request | 请求参数验证失败 |
| 401 | Unauthorized | 未认证或认证失败 |
| 403 | Forbidden | 已认证但权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如重复创建） |
| 422 | Unprocessable Entity | 语义错误 |
| 429 | Too Many Requests | 请求频率限制 |

### 6.3 服务器错误

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务不可用 |

---

## 7. 批量操作规范

### 7.1 批量查询

**使用ID列表：**
```http
POST /api/v1/system/users/batch-get
Content-Type: application/json

{
  "ids": ["id1", "id2", "id3"]
}
```

**响应：**
```json
{
  "code": 200,
  "data": {
    "items": [...],
    "notFound": ["id4"]
  }
}
```

### 7.2 批量创建

**统一批量创建端点：**
```http
POST /api/v1/system/users/batch
Content-Type: application/json

{
  "operation": "create",
  "items": [
    { "username": "user1", "email": "user1@example.com" },
    { "username": "user2", "email": "user2@example.com" }
  ]
}
```

**响应：**
```json
{
  "code": 200,
  "data": {
    "success": 2,
    "failed": 0,
    "errors": [],
    "created": ["id1", "id2"]
  }
}
```

### 7.3 批量更新

**统一批量更新端点：**
```http
POST /api/v1/system/users/batch
Content-Type: application/json

{
  "operation": "update",
  "items": [
    { "id": "id1", "email": "newemail1@example.com" },
    { "id": "id2", "email": "newemail2@example.com" }
  ]
}
```

### 7.4 批量删除

**统一批量删除端点：**
```http
POST /api/v1/system/users/batch
Content-Type: application/json

{
  "operation": "delete",
  "items": ["id1", "id2", "id3"]
}
```

**限制批量操作数量：**
```go
const MAX_BATCH_SIZE = 100

if len(items) > MAX_BATCH_SIZE {
    return error("批量操作最多支持100条")
}
```

---

## 8. 分页规范

### 8.1 分页参数

**请求参数：**
```http
GET /api/v1/system/users?page=1&page_size=20
```

**支持的参数格式：**
```typescript
// 推荐格式 (蛇形命名)
interface PaginationParamsSnakeCase {
  page: number;       // 当前页码，从1开始
  page_size: number;  // 每页数量，默认20，最大100
}

// 兼容格式 (驼峰命名)
interface PaginationParamsCamelCase {
  pageNumber: number;  // 当前页码，从1开始
  pageSize: number;    // 每页数量，默认20，最大100
}
```

**说明：**
- 推荐使用 `page` / `page_size` 格式 (蛇形命名)
- 同时支持 `pageNumber` / `pageSize` 格式 (驼峰命名) 以保持向后兼容
- 两种格式在功能上完全等价，服务器会自动识别并处理

### 8.2 分页响应

**响应格式：**
```json
{
  "code": 200,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  }
}
```

**分页元数据定义：**
```typescript
interface PaginationMeta {
  currentPage: number;  // 当前页码
  pageSize: number;     // 每页数量
  totalItems: number;   // 总记录数
  totalPages: number;   // 总页数
}
```

### 8.3 游标分页（可选）

**适用于大数据量场景：**
```http
GET /api/v1/system/logs?cursor=xxx&limit=50
```

**响应：**
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "nextCursor": "next-cursor-token",
      "hasMore": true
    }
  }
}
```

---

## 9. 排序规范

### 9.1 排序参数

**单字段排序：**
```http
GET /api/v1/system/users?sortField=createdAt&sortOrder=desc
```

**多字段排序：**
```http
GET /api/v1/system/users?sort=createdAt:desc,username:asc
```

### 9.2 排序字段限制

**允许排序的字段：**
```go
allowedSortFields := map[string]bool{
    "createdAt": true,
    "updatedAt": true,
    "username":  true,
    "email":     true,
}

if !allowedSortFields[sortField] {
    return error("不允许按此字段排序")
}
```

---

## 10. 过滤和搜索规范

### 10.1 精确过滤

**单字段过滤：**
```http
GET /api/v1/system/users?status=active
```

**多字段过滤：**
```http
GET /api/v1/system/users?status=active&departmentId=xxx&roleId=yyy
```

### 10.2 范围过滤

**日期范围：**
```http
GET /api/v1/system/users?createdAt[from]=2026-01-01&createdAt[to]=2026-12-31
```

**数值范围：**
```http
GET /api/v1/system/users?age[min]=18&age[max]=65
```

### 10.3 模糊搜索

**全字段搜索：**
```http
GET /api/v1/system/users?search=john
```

**指定字段搜索：**
```http
GET /api/v1/system/users?username=john&email=john
```

### 10.4 高级过滤

**操作符支持：**
```http
GET /api/v1/system/users?filters[status][eq]=active
GET /api/v1/system/users?filters[age][gte]=18&filters[age][lte]=65
GET /api/v1/system/users?filters[username][like]=john
GET /api/v1/system/users?filters[roleId][in]=role1,role2,role3
```

**支持的操作符：**
- `eq`：等于
- `ne`：不等于
- `gt`：大于
- `gte`：大于等于
- `lt`：小于
- `lte`：小于等于
- `like`：模糊匹配
- `in`：包含
- `nin`：不包含

---

## 11. 权限和认证规范

### 11.1 认证头

**JWT认证：**
```http
Authorization: Bearer {access_token}
```

**API Key认证：**
```http
Authorization: ApiKey {api_key}
```

### 11.2 权限检查

**权限不足响应：**
```json
{
  "code": 403,
  "message": "Forbidden",
  "errors": [
    {
      "field": null,
      "message": "You don't have permission to access this resource"
    }
  ]
}
```

### 11.3 租户上下文

**租户识别头：**
```http
X-Tenant-ID: {tenant_id}
```

---

## 12. 速率限制规范

### 12.1 速率限制头

**响应头包含速率限制信息：**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1617235200
```

### 12.2 超出限制响应

```json
{
  "code": 429,
  "message": "Too Many Requests",
  "errors": [
    {
      "field": null,
      "message": "Rate limit exceeded. Please try again later."
    }
  ],
  "retryAfter": 60
}
```

---

## 13. 国际化规范

### 13.1 语言设置

**请求头设置语言：**
```http
Accept-Language: zh-CN
```

**查询参数设置语言：**
```http
GET /api/v1/system/users?lang=zh-CN
```

### 13.2 国际化响应

**响应支持多语言：**
```json
{
  "code": 404,
  "message": "用户不存在",
  "messageEn": "User not found"
}
```

---

## 14. 错误码规范

### 14.1 业务错误码

**格式：`{MODULE}_{ERROR_CODE}`**

```go
const (
    // 用户相关错误码
    ERR_USER_NOT_FOUND        = "USER_001"  // 用户不存在
    ERR_USER_DUPLICATE        = "USER_002"  // 用户已存在
    ERR_USER_DISABLED         = "USER_003"  // 用户已禁用
    ERR_USER_LOCKED           = "USER_004"  // 用户已锁定
    
    // 认证相关错误码
    ERR_AUTH_INVALID_CREDENTIALS = "AUTH_001" // 无效的凭据
    ERR_AUTH_TOKEN_EXPIRED       = "AUTH_002" // 令牌已过期
    ERR_AUTH_INVALID_TOKEN       = "AUTH_003" // 无效的令牌
    
    // 权限相关错误码
    ERR_PERMISSION_DENIED = "PERM_001" // 权限不足
    
    // 参数验证错误码
    ERR_VALIDATION_FAILED = "VAL_001" // 参数验证失败
)
```

### 14.2 错误信息国际化

**错误信息支持多语言：**
```go
type ErrorResponse struct {
    Code      string              `json:"code"`
    Message   string              `json:"message"`
    MessageEn string              `json:"messageEn,omitempty"`
    Errors    []ValidationError   `json:"errors,omitempty"`
    Timestamp string              `json:"timestamp"`
}

func (e *ErrorResponse) WithLocalization(lang string) *ErrorResponse {
    if lang == "en" && e.MessageEn != "" {
        e.Message = e.MessageEn
    }
    return e
}
```

---

## 15. API版本管理

### 15.1 版本策略

**URL版本控制：**
```http
/api/v1/system/users
/api/v2/system/users
```

### 15.2 版本废弃

**废弃通知：**
```http
X-API-Deprecated: true
X-API-Sunset: 2027-01-01
X-API-Alternative: /api/v2/system/users
```

---

## 16. 文档规范

### 16.1 API文档

**使用Swagger/OpenAPI规范：**
```yaml
openapi: 3.0.0
info:
  title: Pantheon Platform API
  version: 1.0.0
  description: 企业级多租户后台管理平台API
```

### 16.2 接口注释

**Go代码注释：**
```go
// UserList godoc
// @Summary 获取用户列表
// @Description 获取用户列表，支持分页、排序、过滤
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param pageNumber query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(20)
// @Param status query string false "用户状态"
// @Success 200 {object} response.Response{data=object{items=[]model.User,pagination=response.PaginationMeta}}
// @Router /system/users [get]
func (h *UserHandler) ListUsers(c *gin.Context) {
    // 实现...
}
```

---

## 17. 实施检查清单

### 17.1 API设计检查

- [ ] URL使用名词复数形式
- [ ] HTTP方法使用正确
- [ ] 请求参数使用驼峰命名
- [ ] 响应格式统一
- [ ] 包含适当的错误处理
- [ ] 支持国际化
- [ ] 包含API文档
- [ ] 实现速率限制
- [ ] 包含权限检查
- [ ] 支持版本控制

### 17.2 前端调用检查

- [ ] 使用统一的API客户端
- [ ] 正确处理错误响应
- [ ] 实现请求重试机制
- [ ] 处理加载状态
- [ ] 实现请求取消
- [ ] 缓存策略合理

---

## 18. 迁移指南

### 18.1 现有API迁移

**步骤1：识别不规范的API**
- 检查URL命名
- 检查参数命名
- 检查响应格式

**步骤2：制定迁移计划**
- 设置废弃时间
- 提供替代API
- 更新文档

**步骤3：实施迁移**
- 修改后端实现
- 更新前端调用
- 更新API文档

### 18.2 兼容性处理

**多版本共存：**
```go
// v1 API
router.GET("/api/v1/system/users", func(c *gin.Context) {
    // 旧版本实现
})

// v2 API
router.GET("/api/v2/system/users", func(c *gin.Context) {
    // 新版本实现
})
```

---

**文档维护：**
- 定期review和更新规范
- 收集开发反馈
- 保持与最新最佳实践同步
- 提供规范使用培训
# 认证与安全设计

## 1. 模块定位

`auth/` 是整个平台的统一认证与会话安全底座，负责回答三类问题：

- 谁可以登录；
- 登录后如何维持安全会话；
- 何时需要刷新权限，何时必须强制失效。

它不是权限模型本身，也不直接承担租户初始化和系统管理业务，但它决定：

- 登录态如何建立；
- 会话如何续签；
- 2FA 如何接入；
- 登录后何时开始权限初始化；
- 系统管理与租户状态变更如何影响在线会话。

### 1.1 本文负责什么

本文只说明认证模块的业务边界、认证闭环、安全模型与协同关系。

### 1.2 本文不重复什么

- 软刷新 / 强制失效规则矩阵：见 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 系统管理对象关系：见 `docs/system/SYSTEM_MANAGEMENT.md`
- 租户初始化与生命周期：见 `docs/tenant/TENANT_INITIALIZATION.md`
- 具体代码入口：见 `backend/docs/auth/AUTH_BACKEND.md` 与 `frontend/docs/auth/AUTH_FRONTEND.md`

---

## 2. 认证模块负责的能力边界

认证模块负责以下能力：

- 登录与退出；
- JWT Access Token / Refresh Token；
- Redis 会话态；
- 登录失败统计与锁定；
- 可配置二次认证（2FA / TOTP / 备份码）；
- API Key 认证；
- 登录日志与认证审计；
- 与租户上下文、角色权限初始化、会话失效策略的协同。

认证模块不直接负责以下能力：

- 用户、角色、权限、菜单的业务维护；
- 租户创建、租户数据库初始化；
- 业务模块自身的页面与数据逻辑；
- 系统设置、日志查询、组织结构维护。

边界上要保持清楚：

- `auth/` 决定“怎么安全地进系统”；
- `system/` 决定“进系统后能看什么、能做什么”；
- `tenant/` 决定“当前用户在哪个租户上下文内运行”。

---

## 3. 登录闭环

## 3.1 标准登录流程

标准登录闭环如下：

1. 前端提交用户名、密码、租户信息；
2. 后端校验账号存在性、账号状态、密码正确性；
3. 后端校验租户状态与租户登录上下文；
4. 如用户启用了 2FA，返回 `require_2fa + temp_token`；
5. 前端提交 OTP 或备份码；
6. 后端签发 `access_token + refresh_token`；
7. 前端刷新当前用户、权限、菜单与系统基础数据；
8. 前端根据权限与菜单动态渲染页面与按钮；
9. 用户进入正式业务界面。

### 3.2 登录不是终点，而是初始化起点

认证模块的登录成功并不等于“系统已准备完毕”。

登录成功之后，平台还要继续完成：

- 当前用户识别；
- 当前租户识别；
- 角色与权限加载；
- 菜单与页面挂载；
- 系统管理基础数据初始化。

因此登录模块与系统管理、租户模块天然是串联关系，而不是割裂关系。

### 3.3 多部署模式下的登录差异

- **private / single**：可以自动回落到默认租户，登录页不一定强制输入租户编码；
- **paas / mixed**：可能同时存在平台级能力与租户级能力，登录后必须明确运行上下文；
- **saas / dedicated**：用户、菜单、权限、租户数据都依赖具体租户，租户上下文是登录链路的一部分。

---

## 4. 认证对象与状态模型

认证模块主要围绕以下对象运转：

- 用户账号；
- 登录凭证；
- Access Token；
- Refresh Token；
- Redis 会话态；
- 2FA 临时校验态；
- API Key；
- 登录审计记录。

### 4.1 用户账号状态

用户至少要具备以下认证相关状态：

- 是否启用；
- 是否锁定；
- 是否要求 2FA；
- 是否允许 API Key；
- 最近登录时间、IP、设备；
- 所属租户与当前租户上下文。

### 4.2 会话状态

会话不是只靠 JWT 自身维持，还需要 Redis 侧的会话态配合。

这样做的目的有两个：

- 支持权限变化后的在线刷新；
- 支持安全事件发生后的立即失效。

---

## 5. 令牌与会话模型

当前采用“双令牌 + Redis 会话态”的组合模型：

- **Access Token**：短期有效，用于日常接口访问；
- **Refresh Token**：较长有效期，用于续签 Access Token；
- **Redis Session**：记录 Access Token / Refresh Token 是否仍然有效；
- **Revoked Timestamp**：记录用户从某时刻起必须全部失效；
- **Auth Version**：记录用户当前授权版本。

### 5.1 为什么不是只用 JWT

如果只用 JWT：

- 无法优雅支持权限实时刷新；
- 无法在用户停用、改密、租户停用后立即让旧会话失效；
- 无法方便地实现单会话踢下线、refresh rotation 等控制。

### 5.2 这套模型解决什么问题

这套模型同时满足两类诉求：

- **授权变化**：尽量无感刷新，不打断正常用户；
- **安全变化**：立即强制失效，不允许旧会话继续使用。

更具体的策略矩阵、Redis Key 规范和前后端协同流程，统一见 `docs/auth/AUTH_SESSION_STRATEGY.md`。

---

## 6. 二次认证（2FA）

2FA 是认证模块中的增强安全能力，不是独立系统。

### 6.1 支持形态

当前推荐支持：

- TOTP 动态口令；
- 备份码；
- 登录过程中的临时待验证态。

### 6.2 启用原则

2FA 应该是可配置的，而不是只能全局强开或完全关闭。

建议分三层控制：

- 平台级：是否启用 2FA 能力；
- 角色/策略级：是否要求高权限账号必须启用；
- 用户级：用户是否已绑定并实际生效。

### 6.3 关键业务规则

- 用户绑定 2FA 后，登录需要先完成密码验证，再进入二次验证；
- 备份码必须一次性消费；
- 2FA 开启、关闭、重置备份码都应有审计记录；
- 高权限角色建议默认要求 2FA；
- 个人中心中的 2FA 设置属于认证模块能力在系统管理中的落点。

---

## 7. API Key 能力

API Key 面向系统集成、自动化任务或服务间访问，不应替代普通用户登录。

### 7.1 适用场景

- 内部自动化调用；
- 集成平台接入；
- 非交互式任务。

### 7.2 设计要求

- API Key 要有明确归属用户或归属应用；
- 要支持启用、禁用、轮换、删除；
- 高风险 API Key 操作应审计；
- 建议与权限系统联动，而不是绕过授权体系。

### 7.2.1 当前已落地的最小安全控制

当前实现已经具备以下控制：

- API Key 只在创建时返回一次明文；
- 后端只存储哈希，不存储明文；
- 支持到期时间控制，默认生命周期为 90 天；
- 支持按 Key 维度配置来源 IP allowlist；
- 支持按 Key 维度配置每分钟速率限制；
- 支持把 `permissions` 作为运行时 scope 使用，当前兼容 `read` / `write` 与 `路径:方法` 两类格式；
- 记录最近使用时间，便于审计和排障。

### 7.3 权限边界（重要）

API Key 认证后的权限边界与其归属用户一致：

- **不是独立权限体**：API Key 通过后，后端注入与 JWT 认证相同的 `user_id` 到请求上下文
- **受 Casbin 鉴权约束**：API Key 请求同样经过路径级权限校验，不绕过授权体系
- **受 data scope 约束**：数据范围过滤与用户直接登录时完全相同
- **产生操作日志**：API Key 请求会被操作日志中间件记录，`operator` 为归属用户
- **不受 2FA 要求约束**：API Key 是独立认证渠道，绕过 2FA 验证步骤；高安全场景下需要在业务层额外评估

### 7.4 API Key 格式

```
sk_<selector>_<uuid>
```

- 前缀 `sk_` 标识 API Key
- `selector` 为 12 位随机字符串，用于数据库快速定位候选行（避免全表扫描）
- 明文 Key 只在**创建时返回一次**，后端仅存储 bcrypt 哈希
- 后续列表展示只显示 `********************` 占位

### 7.5 API Key 存储与查询

API Key 在以下数据库中查找（按优先级）：

1. 主库（`master_db`）
2. 当前请求的租户库（若存在）

这允许租户级 API Key 与平台级 API Key 共存。

---

## 8. 安全控制

认证模块除了“发 token”，还要承担基础安全治理。

### 8.1 登录失败与锁定

至少应具备：

- 登录失败次数统计；
- 短时间爆破保护；
- 锁定窗口；
- 锁定后的提示与审计。

### 8.2 密码与身份安全

至少要考虑：

- 密码修改；
- 管理员重置密码；
- 修改后旧会话失效；
- 个人中心改密与后台重置的差异化审计。

### 8.3 审计留痕

以下行为建议统一纳入登录审计或安全审计：

- 登录成功；
- 登录失败；
- 登出；
- 账户锁定；
- 改密；
- 2FA 开启/关闭/重置；
- API Key 创建/删除/轮换。

---

## 9. 与系统管理模块的协作

认证模块与系统管理模块并不是简单的上下游，而是强耦合协作关系。

### 9.1 系统管理如何影响认证

以下系统管理动作会影响认证结果或在线会话：

- 用户状态变化；
- 用户密码变化；
- 用户角色变化；
- 角色权限变化；
- 角色菜单变化；
- 菜单实体变化；
- 部门、岗位变化导致上下文或数据范围变化。

### 9.2 个人中心如何落在系统里

个人中心属于系统管理对“当前登录用户”的服务入口，但其中很多能力本质来自认证模块，例如：

- 修改密码；
- 2FA 绑定与关闭；
- API Key 管理；
- 登录历史查看；
- 会话管理。

这部分业务归属要在文档上统一，不要在前后端和平台文档中重复定义。

---

## 10. 与多租户体系的协作

认证本身是平台级能力，但认证结果必须落到租户上下文中。

### 10.1 租户上下文的重要性

登录成功后，不只是“这个用户是谁”，还要明确：

- 这个用户属于哪个租户；
- 当前正在访问哪个租户；
- 当前租户是否已经初始化；
- 当前租户是否还能继续使用。

### 10.2 与部署模式的协同

- 私有化单租户：可以自动绑定默认租户；
- PaaS：可以存在平台级与租户级并存的访问模式；
- SaaS：几乎所有权限、菜单、系统数据都依赖租户上下文。

租户初始化与状态流转统一见 `docs/tenant/TENANT_INITIALIZATION.md`。

---

## 11. 推荐阅读路径

- 先读 `docs/auth/AUTH_SECURITY.md`
- 再读 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 再读 `docs/system/SYSTEM_MANAGEMENT.md`
- 再读 `docs/tenant/TENANT_INITIALIZATION.md`
- 最后进入 `backend/docs/auth/AUTH_BACKEND.md` 与 `frontend/docs/auth/AUTH_FRONTEND.md`

---

## 12. 安全加固建议

基于系统安全评估，以下是针对认证模块的具体安全加固建议：

### 12.1 高危问题修复 (P0)

#### 12.1.1 JWT密钥管理改进

**当前问题：**
- JWT Secret使用全局变量存储，存在并发风险
- 缺少密钥轮换机制
- 密钥生成和存储不够安全

**加固方案：**

```go
// 1. 实现密钥管理器
// internal/shared/security/jwt_key_manager.go
package security

import (
    "crypto/rand"
    "sync"
    "time"
)

type JWTKeyManager struct {
    currentKey        []byte
    previousKeys      [][]byte
    keyVersion        int
    rotationInterval  time.Duration
    lastRotation      time.Time
    mu               sync.RWMutex
}

func NewJWTKeyManager(rotationInterval time.Duration) *JWTKeyManager {
    return &JWTKeyManager{
        currentKey:        generateSecureKey(),
        keyVersion:        1,
        rotationInterval:  rotationInterval,
        lastRotation:      time.Now(),
    }
}

func generateSecureKey() []byte {
    key := make([]byte, 64) // 512-bit key
    if _, err := rand.Read(key); err != nil {
        panic("failed to generate JWT key")
    }
    return key
}

func (km *JWTKeyManager) GetCurrentKey() []byte {
    km.mu.RLock()
    defer km.mu.RUnlock()
    return km.currentKey
}

func (km *JWTKeyManager) GetCurrentVersion() int {
    km.mu.RLock()
    defer km.mu.RUnlock()
    return km.keyVersion
}

func (km *JWTKeyManager) RotateKey() error {
    km.mu.Lock()
    defer km.mu.Unlock()
    
    // Store current key in previous keys
    km.previousKeys = append(km.previousKeys, km.currentKey)
    
    // Generate new key
    km.currentKey = generateSecureKey()
    km.keyVersion++
    km.lastRotation = time.Now()
    
    // Keep only last 5 keys
    if len(km.previousKeys) > 5 {
        km.previousKeys = km.previousKeys[1:]
    }
    
    return nil
}

// 2. 在JWT中包含密钥版本
type JWTClaims struct {
    UserID    string `json:"user_id"`
    TenantID  string `json:"tenant_id"`
    KeyVersion int   `json:"key_version"` // 新增密钥版本
    // 其他字段...
}

// 3. 支持多版本密钥验证
func (km *JWTKeyManager) ValidateToken(tokenString string) (*JWTClaims, error) {
    claims := &JWTClaims{}
    
    // 解析token获取密钥版本
    parser := jwt.Parser{ValidMethods: []string{jwt.SigningMethodHS256.Name}}
    token, err := parser.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
        // 根据密钥版本选择对应的密钥
        if claims.KeyVersion == km.GetCurrentVersion() {
            return km.GetCurrentKey(), nil
        }
        // 查找历史密钥
        return km.GetKeyByVersion(claims.KeyVersion), nil
    })
    
    if err != nil || !token.Valid {
        return nil, errors.New("invalid token")
    }
    
    return claims, nil
}

// 4. 定时轮换任务
func StartKeyRotation(manager *JWTKeyManager) {
    ticker := time.NewTicker(manager.rotationInterval)
    go func() {
        for range ticker.C {
            if err := manager.RotateKey(); err != nil {
                log.Printf("Key rotation failed: %v", err)
            } else {
                log.Printf("JWT key rotated successfully, version: %d", 
                    manager.GetCurrentVersion())
            }
        }
    }()
}
```

**配置建议：**
```yaml
# config/config.yaml
jwt:
  expires_in: 7200                    # 2小时
  key_rotation_interval: 168h         # 7天轮换一次
  key_versions_to_keep: 5             # 保留5个历史版本
```

#### 12.1.2 生产环境默认管理员风险

**当前问题：**
- 开发环境默认管理员配置可能在生产环境误启用
- 明文密码存储在配置文件中
- 缺少生产环境保护机制

**加固方案：**

```go
// 1. 完全移除生产环境的fallback admin
// internal/modules/auth/auth_service.go
func (s *authService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error) {
    // 生产环境完全禁用默认管理员
    if s.config.Environment == "production" {
        goto normalLogin
    }
    
    // 只有非生产环境才检查默认管理员
    if s.config.Environment == "development" || s.config.Environment == "test" {
        if s.config.DefaultAdmin.Enabled {
            if req.Username == s.config.DefaultAdmin.Username &&
               req.Password == s.config.DefaultAdmin.Password {
                return s.fallbackAdminLogin(ctx)
            }
        }
    }
    
normalLogin:
    // 正常登录逻辑...
}

// 2. 添加环境检查中间件
// internal/shared/middleware/environment.go
func EnvironmentCheck(config *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        if config.Environment == "production" {
            // 生产环境额外检查
            if config.DefaultAdmin.Enabled {
                // 发送告警
                sendSecurityAlert("Default admin is enabled in production!")
                
                // 自动禁用
                config.DefaultAdmin.Enabled = false
                
                // 记录安全事件
                logSecurityEvent("production_default_admin_enabled")
            }
        }
        c.Next()
    }
}

// 3. 配置验证
// internal/config/app_config.go
func (c *Config) Validate() error {
    if c.Environment == "production" {
        if c.DefaultAdmin.Enabled {
            return errors.New("default admin must not be enabled in production")
        }
        if c.JWT.ExpiresIn > 7200 {
            return errors.New("JWT expiration too long for production")
        }
        if len(c.EncryptionKey) < 32 {
            return errors.New("encryption key too short")
        }
        if !c.JWT.KeyRotationEnabled {
            return errors.New("JWT key rotation must be enabled in production")
        }
    }
    return nil
}

// 4. 启动时验证
// cmd/server/main.go
func main() {
    config := config.Load()
    
    // 验证配置
    if err := config.Validate(); err != nil {
        log.Fatal("Configuration validation failed:", err)
    }
    
    // 启动服务...
}
```

#### 12.1.3 API Key 权限控制增强

**当前状态：**

- 已接入统一鉴权入口，可用 `Bearer` 与 `X-API-Key` 两种方式访问受保护接口；
- 已具备到期时间、来源 IP allowlist、每分钟速率限制、最近使用时间更新；
- 仍然沿用“归属用户权限边界”，还没有做独立 scope 模型。

**下一步建议：**

- 如果要支持更细粒度集成权限，再补“API Key 独立 scope -> 路由 / 动作矩阵 -> 拒绝策略”；
- 把 API Key 正式 E2E 与 CI 门禁接上，避免安全链路回归；
- 将高风险 API Key 事件（创建、删除、来源 IP 拒绝、速率限制命中）进一步收敛到统一审计视图。

### 12.2 中危问题修复 (P1)

#### 12.2.1 会话并发控制

**当前问题：**
- 缺少最大并发会话数强制限制
- 缺少会话清理机制

**加固方案：**

```go
// 1. 会话管理器
// internal/shared/security/session_manager.go
type SessionManager struct {
    redis      *redis.Client
    maxSessions int
}

func (sm *SessionManager) CreateSession(ctx context.Context, userID string, session *Session) error {
    // 检查当前会话数
    currentSessions, err := sm.GetUserSessions(ctx, userID)
    if err != nil {
        return err
    }
    
    if len(currentSessions) >= sm.maxSessions {
        // 删除最旧的会话
        oldestSession := findOldestSession(currentSessions)
        sm.RevokeSession(ctx, userID, oldestSession.JTI)
    }
    
    // 创建新会话
    return sm.saveSession(ctx, userID, session)
}

func (sm *SessionManager) GetUserSessions(ctx context.Context, userID string) ([]*Session, error) {
    pattern := fmt.Sprintf("auth:session:%s:*", userID)
    keys, err := sm.redis.Keys(ctx, pattern).Result()
    if err != nil {
        return nil, err
    }
    
    sessions := make([]*Session, 0, len(keys))
    for _, key := range keys {
        var session Session
        if err := sm.redis.Get(ctx, key).Scan(&session); err == nil {
            sessions = append(sessions, &session)
        }
    }
    
    return sessions, nil
}

// 2. 会话清理任务
func (sm *SessionManager) StartCleanupTask() {
    ticker := time.NewTicker(1 * time.Hour)
    go func() {
        for range ticker.C {
            sm.cleanupExpiredSessions()
        }
    }()
}

func (sm *SessionManager) cleanupExpiredSessions() error {
    ctx := context.Background()
    
    // 清理过期的Access Token会话
    iter := sm.redis.Scan(ctx, 0, "auth:session:*", 100).Iterator()
    for iter.Next(ctx) {
        key := iter.Val()
        
        var session Session
        if err := sm.redis.Get(ctx, key).Scan(&session); err != nil {
            // 会话不存在或已过期，删除
            sm.redis.Del(ctx, key)
            continue
        }
        
        if session.ExpiresAt.Before(time.Now()) {
            sm.redis.Del(ctx, key)
        }
    }
    
    return nil
}
```

#### 12.2.2 备份码加密存储

**当前问题：**
- 备份码明文序列化存储，可能泄露使用信息

**加固方案：**

```go
// 1. 备份码加密存储
// internal/modules/auth/two_factor_service.go
type EncryptedBackupCodes struct {
    EncryptedData string    `json:"encrypted_data"`
    Nonce         string    `json:"nonce"`
    CreatedAt     time.Time `json:"created_at"`
}

func (s *twoFactorService) GenerateBackupCodes(ctx context.Context, userID string) ([]string, error) {
    // 生成10个备份码
    codes := make([]string, 10)
    for i := range codes {
        codes[i] = generateBackupCode()
    }
    
    // 加密存储
    encrypted, err := s.encryptBackupCodes(codes)
    if err != nil {
        return nil, err
    }
    
    // 保存到数据库
    return codes, s.twoFactorDAO.SaveBackupCodes(ctx, userID, encrypted)
}

func (s *twoFactorService) encryptBackupCodes(codes []string) (*EncryptedBackupCodes, error) {
    // 转换为JSON
    data, err := json.Marshal(codes)
    if err != nil {
        return nil, err
    }
    
    // 使用AES-GCM加密
    key := s.getEncryptionKey()
    nonce := make([]byte, 12)
    if _, err := rand.Read(nonce); err != nil {
        return nil, err
    }
    
    ciphertext, err := aesgcm.Encrypt(data, key, nonce)
    if err != nil {
        return nil, err
    }
    
    return &EncryptedBackupCodes{
        EncryptedData: base64.StdEncoding.EncodeToString(ciphertext),
        Nonce:         base64.StdEncoding.EncodeToString(nonce),
        CreatedAt:     time.Now(),
    }, nil
}

func (s *twoFactorService) decryptBackupCodes(encrypted *EncryptedBackupCodes) ([]string, error) {
    // 解密
    ciphertext, _ := base64.StdEncoding.DecodeString(encrypted.EncryptedData)
    nonce, _ := base64.StdEncoding.DecodeString(encrypted.Nonce)
    
    key := s.getEncryptionKey()
    plaintext, err := aesgcm.Decrypt(ciphertext, key, nonce)
    if err != nil {
        return nil, err
    }
    
    // 解析JSON
    var codes []string
    if err := json.Unmarshal(plaintext, &codes); err != nil {
        return nil, err
    }
    
    return codes, nil
}
```

### 12.3 安全监控和审计

#### 12.3.1 安全事件监控

**加固方案：**

```go
// 1. 安全事件定义
// internal/shared/security/event.go
type SecurityEvent struct {
    ID          string                 `json:"id"`
    EventType   string                 `json:"event_type"`   // login_failed, brute_force, etc.
    UserID      string                 `json:"user_id,omitempty"`
    IP          string                 `json:"ip"`
    UserAgent   string                 `json:"user_agent"`
    Severity    string                 `json:"severity"`     // low, medium, high, critical
    Metadata    map[string]interface{} `json:"metadata"`
    Timestamp   time.Time              `json:"timestamp"`
}

// 2. 安全监控服务
// internal/shared/security/monitor.go
type SecurityMonitor struct {
    eventChan   chan SecurityEvent
    alertSvc    AlertService
    storage     EventStorage
}

func (sm *SecurityMonitor) Start() {
    go sm.processEvents()
}

func (sm *SecurityMonitor) processEvents() {
    for event := range sm.eventChan {
        // 存储事件
        sm.storage.Save(event)
        
        // 根据严重级别发送告警
        switch event.Severity {
        case "critical", "high":
            sm.alertSvc.SendImmediateAlert(event)
        case "medium":
            sm.alertSvc.SendAggregatedAlert(event)
        }
        
        // 触发相应措施
        sm.triggerResponse(event)
    }
}

func (sm *SecurityMonitor) triggerResponse(event SecurityEvent) {
    switch event.EventType {
    case "brute_force_detected":
        // 自动封禁IP
        sm.banIP(event.IP, 24*time.Hour)
        
    case "suspicious_location":
        // 要求额外验证
        sm.requireAdditionalVerification(event.UserID)
        
    case "api_key_abuse":
        // 撤销API Key
        sm.revokeAPIKey(event.Metadata["api_key_id"].(string))
    }
}

// 3. 威胁检测规则
// internal/shared/security/detector.go
type ThreatDetector struct {
    monitor *SecurityMonitor
}

func (td *ThreatDetector) DetectBruteForce(userID string, IP string) {
    // 检查最近15分钟的失败次数
    recentFailures := td.countRecentFailures(userID, IP, 15*time.Minute)
    
    if recentFailures >= 5 {
        td.monitor.RecordEvent(SecurityEvent{
            EventType: "brute_force_detected",
            UserID:    userID,
            IP:        IP,
            Severity:  "high",
            Metadata: map[string]interface{}{
                "failures": recentFailures,
            },
        })
    }
}

func (td *ThreatDetector) DetectImpossibleTravel(userID string, currentIP string) {
    // 获取用户最近的登录位置
    lastLogin := td.getLastLoginLocation(userID)
    
    // 计算距离和时间差
    distance := calculateDistance(lastLogin.IP, currentIP)
    timeDiff := time.Since(lastLogin.Time)
    
    // 如果距离很远但时间很短，判定为不可能的旅行
    if distance > 1000 && timeDiff < 1*time.Hour {
        td.monitor.RecordEvent(SecurityEvent{
            EventType: "impossible_travel",
            UserID:    userID,
            IP:        currentIP,
            Severity:  "high",
            Metadata: map[string]interface{}{
                "distance_km":  distance,
                "time_hours":   timeDiff.Hours(),
            },
        })
    }
}
```

### 12.4 配置安全检查清单

**生产环境部署前检查：**

```yaml
# 安全配置检查清单
security_checklist:
  production:
    # 认证配置
    - item: "默认管理员必须禁用"
      config: "default_admin.enabled == false"
      severity: "critical"
      
    - item: "JWT密钥轮换必须启用"
      config: "jwt.key_rotation_enabled == true"
      severity: "critical"
      
    - item: "JWT过期时间不超过2小时"
      config: "jwt.expires_in <= 7200"
      severity: "high"
      
    - item: "加密密钥长度至少32字节"
      config: "len(encryption_key) >= 32"
      severity: "critical"
      
    # 会话配置
    - item: "最大并发会话数限制"
      config: "security.max_concurrent_sessions > 0"
      severity: "medium"
      
    - item: "会话超时配置合理"
      config: "session.timeout > 0 && session.timeout <= 24h"
      severity: "medium"
      
    # 2FA配置
    - item: "管理员账户强制启用2FA"
      config: "security.force_2fa_for_admin == true"
      severity: "high"
      
    # API Key配置
    - item: "API Key速率限制启用"
      config: "api_key.rate_limit_enabled == true"
      severity: "medium"
      
    # 监控配置
    - item: "安全监控启用"
      config: "security.monitoring_enabled == true"
      severity: "high"
      
    - item: "安全告警配置"
      config: "security.alerts_enabled == true"
      severity: "medium"
```

---

## 13. 文档边界说明

本文档只描述认证安全的设计边界、核心风险控制点和跨模块协作方式，不维护阶段性整改清单或临时实施路线图。

认证、会话、2FA、API Key 或安全审计链路发生架构级变化时，应同步更新本文档；局部接口、页面交互或测试用例变化，应优先落到对应专题文档或代码实现中。

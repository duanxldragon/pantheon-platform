# 集成测试计划

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **测试类型**: 集成测试
- **测试环境**: Staging

## 🎯 测试目标

### 总体目标
验证系统各模块之间的集成是否正常工作，确保接口兼容性和数据一致性。

### 具体目标
- API接口集成测试通过率 ≥ 95%
- 数据库集成测试通过率 = 100%
- 第三方服务集成测试通过率 ≥ 90%
- 模块间数据一致性验证通过率 = 100%

## 🔧 测试环境

### 环境配置
```yaml
测试环境: Staging
数据库: MySQL 8.0 (测试数据)
缓存: Redis 7.0 (独立实例)
消息队列: Redis Streams
外部服务: Mock服务
测试数据: 生成测试数据集
```

### 环境准备
```bash
# 1. 启动测试数据库
docker-compose -f docker-compose.test.yml up -d mysql redis

# 2. 运行数据库迁移
cd backend
go run cmd/migrate/main.go

# 3. 生成测试数据
go test ./tests/integration/... -generate-test-data

# 4. 启动测试应用
go run cmd/server/main.go --config=config/test.yaml
```

## 🧪 测试场景

### 1. 认证模块集成测试

#### 1.1 用户注册到登录流程
```gherkin
Feature: 用户注册到登录集成测试

Scenario: 新用户注册并登录
  Given 系统正常运行
  And 用户访问注册接口
  When 提交注册信息：
    | username | testuser |
    | password | Secure@123 |
    | email | test@example.com |
    | real_name | 测试用户 |
  Then 注册应该成功
  And 创建用户记录到数据库
  And 发送欢迎邮件
  When 用户使用注册的凭据登录
  Then 登录应该成功
  And 返回有效的JWT令牌
  And 令牌包含正确的用户信息

Scenario: 注册后立即登录
  Given 用户刚完成注册
  And 用户状态为active
  When 用户立即尝试登录
  Then 登录应该成功
  And 返回用户完整信息
  And 包含分配的默认角色
```

#### 1.2 多因素认证集成
```gherkin
Feature: MFA集成测试

Scenario: 启用MFA后的登录流程
  Given 用户已启用MFA
  And 用户在登录页面
  When 用户输入正确的用户名和密码
  Then 应该跳转到MFA验证页面
  And 要求输入验证码
  When 用户输入正确的验证码
  Then 登录应该成功
  And JWT令牌包含MFA验证标识

Scenario: MFA验证码错误
  Given 用户在MFA验证页面
  When 用户输入错误的验证码
  Then 应该拒绝验证
  And 允许重新输入
  And 最多允许3次尝试
  And 超过3次后要求重新登录
```

#### 1.3 会话管理集成
```gherkin
Feature: 会话管理集成测试

Scenario: 登录后会话创建
  Given 用户成功登录系统
  When 系统创建用户会话
  Then 会话应该存储到Redis
  And 会话包含：
    | user_id | 用户ID |
    | username | 用户名 |
    | tenant_id | 租户ID |
    | login_time | 登录时间 |
    | last_activity | 最后活动时间 |
  And 会话过期时间设置为2小时

Scenario: 会话验证中间件
  Given 用户已登录
  And 有有效的会话
  When 用户访问受保护的API
  Then 中间件应该验证会话
  And 从会话中提取用户信息
  And 将用户信息注入到请求上下文
  And 允许API调用继续执行

Scenario: 会话过期处理
  Given 用户登录已超过2小时
  When 用户访问需要认证的API
  Then 中间件应该检测到会话过期
  And 返回401未授权错误
  And 错误信息: "session_expired"
```

### 2. 租户管理集成测试

#### 2.1 租户创建到数据库集成
```gherkin
Feature: 租户创建集成测试

Scenario: 租户创建流程
  Given 管理员在主数据库
  When 创建新租户 "acme"
  Then 系统应该在主数据库创建租户记录
  And 系统应该创建租户专用数据库
  And 数据库名称格式: "pantheon_tenant_{tenant_id}"
  And 为租户数据库初始化表结构
  And 创建租户默认管理员用户
  And 数据库连接信息加密存储

Scenario: 租户数据库隔离验证
  Given 租户A和租户B已创建
  And 租户A的用户ID为 "user-a"
  And 租户B的用户ID为 "user-b"
  When 租户A的用户登录并查询用户表
  Then 只能看到租户A的用户
  And 不能看到租户B的用户
  When 租户B的用户登录并查询用户表
  Then 只能看到租户B的用户
  And 两个租户的数据完全隔离
```

#### 2.2 租户数据库连接池集成
```gherkin
Feature: 数据库连接池集成测试

Scenario: 租户数据库连接池管理
  Given 租户有配置的数据库连接池
  And 最大连接数为50
  When 应用程序需要访问租户数据库
  Then 应该从连接池获取连接
  And 连接使用后归还到连接池
  And 连接池状态正确维护

Scenario: 多租户并发访问
  Given 有10个不同的租户
  And 每个租户有20个并发用户
  When 所有用户同时访问系统
  Then 每个租户应该使用独立的数据库连接
  And 租户间的数据库连接互不干扰
  And 总连接数不超过各租户连接池总和
  And 系统保持稳定运行
```

#### 2.3 租户监控集成
```gherkin
Feature: 租户监控集成测试

Scenario: 租户健康状态计算
  Given 租户 "acme" 有以下指标：
    | CPU使用率 | 45% |
    | 内存使用率 | 68% |
    | 错误率 | 0.02% |
    | 响应时间 | 256ms |
  When 系统计算租户健康分数
  Then 健康分数应该在85-95之间
  And 健康状态为"良好"
  And 分数计算考虑所有因素

Scenario: 租户资源使用监控
  Given 租户有资源配额：
    | 最大用户数 | 100 |
    | 存储空间 | 50GB |
    | API调用频率 | 1000/分钟 |
  And 当前使用情况：
    | 用户数 | 85 |
    | 存储使用 | 45GB |
    | API调用 | 950/分钟 |
  When 系统监控资源使用
  Then 所有资源使用率应该 < 90%
  And 不应该触发告警
  And 资源使用数据应该实时更新到监控仪表板
```

### 3. 权限管理集成测试

#### 3.1 RBAC权限集成
```gherkin
Feature: RBAC权限集成测试

Scenario: 角色权限验证
  Given 用户被分配 "普通用户" 角色
  And "普通用户" 角色有以下权限：
    | user:read | ✓ |
    | user:update_own | ✓ |
    | user:delete | ✗ |
  When 用户尝试查看用户列表
  Then API调用应该成功
  When 用户尝试更新自己的信息
  Then API调用应该成功
  When 用户尝试删除用户
  Then API调用应该返回403错误
  And 错误信息: "权限不足"

Scenario: 权限动态变更
  Given 用户当前有 "编辑" 权限
  And 管理员撤销了 "编辑" 权限
  When 用户尝试编辑操作
  Then API应该返回403错误
  And 错误信息: "权限不足"
  And 权限变更应该立即生效
  And 不需要重新登录
```

#### 3.2 菜单权限集成
```gherkin
Feature: 菜单权限集成测试

Scenario: 前端菜单权限验证
  Given 用户登录系统
  And 用户有以下菜单权限：
    | 系统概览 | ✓ |
    | 用户管理 | ✓ |
    | 系统设置 | ✗ |
  When 前端加载菜单
  Then 应该显示 "系统概览" 和 "用户管理"
  And 不应该显示 "系统设置"
  And 无权限的菜单应该在渲染时过滤掉
  And 不发送到客户端
```

### 4. 系统管理集成测试

#### 4.1 用户管理集成
```gherkin
Feature: 用户管理集成测试

Scenario: 用户CRUD完整流程
  Given 管理员在用户管理页面
  When 创建新用户 "testuser"
  Then 用户应该创建成功
  When 查询用户列表
  Then 应该包含新创建的用户
  When 更新用户信息
  Then 用户信息应该更新成功
  When 删除该用户
  Then 用户应该被标记为已删除
  And 用户状态变为 "deleted"
  And 数据在数据库中软删除

Scenario: 批量操作集成
  Given 管理员选择多个用户
  | user_1, user_2, user_3 |
  When 执行批量停用操作
  Then 所有选中的用户应该被停用
  And 操作应该记录到操作日志
  And 返回操作结果统计
  | 总数 | 成功 | 失败 |
  | 3 | 3 | 0 |
```

#### 4.2 系统监控集成
```gherkin
Feature: 系统监控集成测试

Scenario: 监控数据收集
  Given 系统正在运行
  When 监控组件收集性能数据
  Then 应该收集以下指标：
    - API响应时间
    - 错误率
    - CPU使用率
    - 内存使用率
    - 数据库连接数
  And 数据应该每分钟更新一次
  And 数据应该存储到时序数据库

Scenario: 告警系统集成
  Given 系统配置了告警规则：
    | CPU使用率 > 80% | 触发告警 |
  When CPU使用率达到85%
  Then 应该触发告警
  And 告警系统应该：
    - 评估告警级别
    - 发送通知到配置的渠道
    - 记录告警到历史
  And 告警通知应该在1分钟内发送
```

### 5. 数据一致性测试

#### 5.1 跨模块数据一致性
```gherkin
Feature: 数据一致性集成测试

Scenario: 用户角色分配一致性
  Given 用户被分配角色
  When 查询用户的角色列表
  Then 应该返回所有分配的角色
  And 角色信息应该完整准确
  When 查询角色下的用户列表
  Then 应该包含该用户
  And 用户-角色关系应该双向一致

Scenario: 删除操作的数据一致性
  Given 用户有多个角色分配
  When 用户被删除
  Then 所有相关的角色分配应该被删除
  And 用户相关的操作日志应该保留
  And 其他模块的引用应该处理外键约束
```

## 🧪 测试数据管理

### 测试数据准备
```go
// 测试数据生成器
type TestDataGenerator struct {
    db *gorm.DB
}

func (g *TestDataGenerator) GenerateTenant(name string) (*Tenant, error) {
    tenant := &Tenant{
        ID:   uuid.New().String(),
        Code: strings.ToLower(strings.ReplaceAll(name, " ", "_")),
        Name: name,
        Status: "active",
    }
    
    if err := g.db.Create(tenant).Error; err != nil {
        return nil, err
    }
    
    return tenant, nil
}

func (g *TestDataGenerator) GenerateUsers(count int, tenantID string) ([]*User, error) {
    users := make([]*User, count)
    
    for i := 0; i < count; i++ {
        users[i] = &User{
            ID:       uuid.New().String(),
            TenantID: tenantID,
            Username: fmt.Sprintf("testuser_%d", i),
            PasswordHash: hashPassword("Password@123"),
            RealName: fmt.Sprintf("测试用户%d", i),
            Email:    fmt.Sprintf("testuser_%d@example.com", i),
            Status:   "active",
        }
    }
    
    if err := g.db.Create(&users).Error; err != nil {
        return nil, err
    }
    
    return users, nil
}
```

### 数据清理
```go
// 测试数据清理器
type TestDataCleaner struct {
    db *gorm.DB
}

func (c *TestDataCleaner) CleanTestData() error {
    // 清理测试数据（在生产环境禁用）
    if os.Getenv("ENVIRONMENT") == "production" {
        return errors.New("cannot clean data in production")
    }
    
    // 清理测试租户
    c.db.Where("code LIKE ?", "test-%").Delete(&Tenant{})
    
    // 清理测试用户
    c.db.Where("username LIKE ?", "test%").Delete(&User{})
    
    return nil
}
```

## 🔍 集成测试执行

### 测试执行流程
```bash
# 1. 准备测试环境
make test-env-up

# 2. 运行集成测试
make test-integration

# 3. 生成测试报告
make test-report-integration

# 4. 清理测试环境
make test-env-down
```

### 持续集成
```yaml
GitHub Actions集成:
  trigger: pull_request, push to main
  steps:
    - 启动测试环境
    - 运行数据库迁移
    - 执行集成测试
    - 生成测试报告
    - 清理测试环境
```

## 📊 成功标准

### 通过标准
- 所有核心集成场景测试通过
- 集成测试通过率 ≥ 95%
- 无阻塞性Bug
- 测试覆盖率 ≥ 80%

### 性能标准
- 集成测试执行时间 < 30分钟
- 测试环境准备时间 < 10分钟
- 测试数据清理时间 < 5分钟

---

**测试负责人**: 集成测试组  
**测试周期**: 每次代码提交后  
**维护周期**: 每周回顾更新
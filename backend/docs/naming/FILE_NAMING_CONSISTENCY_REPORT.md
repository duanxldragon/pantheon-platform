# 文件命名规范建议

## 📋 当前问题分析

### 1. Go文件命名不一致

#### 问题示例
```bash
# 通用文件 (每个模块都有，但容易冲突)
internal/modules/auth/dao.go
internal/modules/system/dao.go

# 特定文件 (模块前缀，但风格不统一)
internal/modules/auth/two_factor_service.go
internal/modules/system/user_validation.go
internal/modules/auth/api_key_middleware.go
```

### 2. 命名冲突风险
```bash
# 如果在同一目录，可能会产生歧义
dao.go           # 哪个DAO？
service.go       # 哪个Service？
handler.go       # 哪个Handler？
```

## ✅ 统一命名规范建议

### 方案A: 模块前缀规范 (🏆 推荐)

```yaml
规范: <module>_<type>.go
适用: 大型项目，多模块复杂系统

示例:
  internal/modules/auth/
  ├── auth_dao.go           (认证数据访问)
  ├── auth_service.go        (认证业务逻辑)
  ├── auth_handler.go       (认证HTTP处理)
  ├── auth_model.go         (认证数据模型)
  ├── auth_dto.go           (认证数据传输对象)
  ├── auth_router.go        (认证路由配置)
  └── auth_api_key_middleware.go  (API密钥中间件)

  internal/modules/system/user/
  ├── user_service.go        (用户业务逻辑)
  ├── user_dao.go           (用户数据访问)
  └── user_validation.go    (用户验证逻辑)
```

### 方案B: 功能分层规范

```yaml
规范: <layer>.go
适用: 小型项目，简单模块

示例:
  internal/modules/auth/
  ├── dao.go                (明确在auth模块内)
  ├── service.go            (明确在auth模块内)
  ├── handler.go            (明确在auth模块内)
  └── model.go              (明确在auth模块内)
```

### 方案C: 混合规范

```yaml
通用文件使用通用名:
  ├── dao.go               (模块内的主要DAO)
  ├── service.go           (模块内的主要Service)
  └── handler.go           (模块内的主要Handler)

特殊功能使用前缀:
  ├── two_factor_service.go  (特定功能)
  ├── api_key_middleware.go  (特定功能)
  └── user_validation.go     (特定功能)
```

## 🔧 推荐实施方案

### 实施步骤

#### 1. 统一模块文件命名

```yaml
重命名规则:
  dao.go → auth_dao.go, user_dao.go, tenant_dao.go
  service.go → auth_service.go, user_service.go, tenant_service.go
  handler.go → auth_handler.go, user_handler.go, tenant_handler.go
  model.go → auth_model.go, user_model.go, tenant_model.go
  dto.go → auth_dto.go, user_dto.go, tenant_dto.go
```

#### 2. 特殊功能文件命名

```yaml
复合词处理:
  two_factor_service.go → auth_two_factor_service.go
  user_validation.go → system_user_validation.go
  api_key_middleware.go → auth_api_key_middleware.go

或者保持但确保唯一性:
  two_factor_service.go  (如果auth模块只有一个)
  user_validation.go     (如果user模块只有一个)
```

#### 3. 测试文件命名

```yaml
现有: service_test.go, handler_test.go
建议: 保持不变，但确保与源文件对应

源文件: auth_service.go
测试文件: auth_service_test.go
```

## 📊 兼容性考虑

### GORM Model/Table命名

#### 当前命名模式
```go
// Model命名
type User struct {}              // → 表名: users (默认推断)
type BizOrder struct {}          // → 表名: biz_orders

// TableName方法
func (User) TableName() string {
    return "system_users"      // 明确指定表名
}
```

#### 推荐统一规范

```yaml
Model定义:
  - 简洁命名: type User {} → 表名: users
  - 明确前缀: type BizOrder {} → 表名: biz_orders
  - TableName方法: 总是提供，便于重构

前缀规范:
  sys_*   (系统模块表)
  biz_*   (业务模块表)
  ntf_*   (通知模块表)
  wf_*    (工作流模块表)
  file_*  (文件模块表)
```

## ⚠️ 命名冲突解决方案

### 使用包级别命名空间

```go
// internal/modules/auth/dao.go
package auth

type DAO struct { // 在auth包内，所以是auth.DAO
    db *gorm.DB
}

// 使用时
authDAO := auth.DAO{}
userDAO := user.DAO{}
```

### 使用文件命名空间

```go
// internal/modules/auth/auth_dao.go
package auth

type AuthDAO struct { // 结构体名称也区分
    db *gorm.DB
}

// internal/modules/system/user/user_dao.go
package user

type UserDAO struct {
    db *gorm.DB
}
```

---

## 🎯 实施优先级

### P0 - 立即修复
- [ ] 统一重复文件名的命名规则
- [ ] 制定新的文件命名约定

### P1 - 逐步优化
- [ ] 重命名特殊功能文件以遵循统一规范
- [ ] 更新相关import引用

### P2 - 长期维护
- [ ] 在代码审查中检查命名规范
- [ ] 定期review文件命名一致性

---

**维护团队**: 架构组  
**实施建议**: 🏆 **采用方案A - 模块前缀规范**  
**兼容性影响**: 需要大量重命名和import更新
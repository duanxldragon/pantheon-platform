# 文件命名规范快速修复指南

## 🎯 修复目标

统一项目中的文件命名规范，解决不一致问题，提升代码可维护性。

## 📋 当前问题汇总

### 1. 重复文件名问题
```bash
❌ 问题: 每个模块都有同名文件
internal/modules/auth/dao.go
internal/modules/system/dao.go
internal/modules/tenant/dao.go

风险: 导入时容易混淆，冲突
```

### 2. 复合词命名不一致
```bash
❌ 问题: 复合词处理方式不统一
two_factor_service.go      (多词下划线)
user_validation.go         (模块_功能)
api_key_middleware.go      (多层下划线)

风险: 风格混乱，难以记忆
```

### 3. 模块边界不清晰
```bash
❌ 问题: 无法快速识别文件所属模块
handler.go  (可能是auth、user、tenant等)
dao.go      (可能是auth、user、tenant等)
```

## ✅ 统一命名规范

### 核心原则

```yaml
规范: <模块>_<类型>_<功能>.go
优先级: 模块 > 类型 > 功能

要求:
  1. 明确的模块前缀
  2. 清晰的文件类型标识
  3. 可选的功能描述
  4. 测试文件使用_test.go后缀
```

### 命名模式

#### 1. 核心文件命名

```yaml
数据访问层:
  <module>_dao.go              # 主要数据访问
  <module>_repository.go       # 仓储模式
  
业务逻辑层:
  <module>_service.go          # 主要业务逻辑
  <module>_<feature>_service.go  # 特定功能服务

HTTP处理层:
  <module>_handler.go         # 主要HTTP处理
  <module>_<feature>_handler.go  # 特定功能处理

数据模型层:
  <module>_model.go           # 主要数据模型
  <module>_<entity>_model.go    # 特定实体模型

数据传输层:
  <module>_dto.go             # 主要数据传输对象
  <module>_<feature>_dto.go     # 特定功能DTO
```

#### 2. 实施示例

```bash
# auth模块重命名示例
auth/dao.go              → auth_dao.go
auth/service.go           → auth_service.go
auth/handler.go          → auth_handler.go
auth/model.go            → auth_model.go
auth/dto.go              → auth_dto.go
two_factor_service.go    → auth_two_factor_service.go

# user模块重命名示例
user/dao.go              → user_dao.go
user/service.go           → user_service.go
user/handler.go          → user_handler.go
user/model.go            → user_model.go
```

### 优先修复列表

#### P0 - 高优先级 (立即修复)

```yaml
重复文件名 (每个模块都有):
  ├── dao.go     → <module>_dao.go
  ├── service.go  → <module>_service.go
  ├── handler.go → <module>_handler.go
  ├── model.go   → <module>_model.go
  └── dto.go     → <module>_dto.go

影响模块:
  - auth/
  - system/
  - tenant/
  - notification/
```

#### P1 - 中优先级 (逐步修复)

```yaml
复合词文件名:
  two_factor_service.go    → auth_two_factor_service.go
  user_validation.go       → system_user_validation.go
  api_key_middleware.go    → auth_api_key_middleware.go
  tenant_migrator.go       → tenant_migration_service.go
```

#### P2 - 低优先级 (可选)

```yaml
测试文件:
  保持现有_test.go后缀
  但确保与源文件对应

配置文件:
  保持简单命名，通常不需要模块前缀
```

## 🔧 实施步骤

### 阶段1: 分析当前状态 (1小时)

```bash
# 1. 统计当前文件命名模式
find internal/modules -name "*.go" -not -name "*_test.go" | sort

# 2. 识别重复文件名
find internal/modules -name "dao.go" -o -name "service.go"
find internal/modules -name "handler.go" -o -name "model.go"

# 3. 生成重命名计划
# (手动分析上述结果)
```

### 阶段2: 执行重命名 (2-4小时)

```bash
# 1. 对每个模块执行重命名
# 示例: auth模块
mv internal/modules/auth/dao.go internal/modules/auth/auth_dao.go
mv internal/modules/auth/service.go internal/modules/auth/auth_service.go
mv internal/modules/auth/handler.go internal/modules/auth/auth_handler.go
mv internal/modules/auth/model.go internal/modules/auth/auth_model.go
mv internal/modules/auth/dto.go internal/modules/auth/auth_dto.go

# 2. 更新import引用
# (IDE通常自动处理)
```

### 阶段3: 验证和测试 (1小时)

```bash
# 1. 编译检查
go build ./...

# 2. 运行测试
go test ./...

# 3. 代码审查
git diff --name-status
```

## 📝 具体重命名脚本

### 自动化重命名脚本

```bash
#!/bin/bash
# scripts/rename_files.sh

set -e

# auth模块重命名
cd internal/modules/auth

mv dao.go auth_dao.go
mv service.go auth_service.go
mv handler.go auth_handler.go
mv model.go auth_model.go
mv dto.go auth_dto.go

# 如果存在特殊文件
if [ -f "two_factor_service.go" ]; then
    mv two_factor_service.go auth_two_factor_service.go
fi

# 返回原目录
cd -
```

### Import引用更新

```bash
# IDE通常会自动处理import引用
# 但如果需要手动更新:

# 更新Go文件中的import
find . -name "*.go" -exec sed -i 's|pantheon-platform/backend/internal/modules/auth/dao|pantheon-platform/backend/internal/modules/auth/auth_dao|g' {} \;

# 更新测试文件中的import
find . -name "*_test.go" -exec sed -i 's|internal/modules/auth/dao|internal/modules/auth/auth_dao|g' {} \;
```

## ⚠️ 注意事项

### 1. Git历史保持

```bash
# 使用git mv保持历史
git mv internal/modules/auth/dao.go internal/modules/auth/auth_dao.go
git mv internal/modules/auth/service.go internal/modules/auth/auth_service.go

# 批量操作
git mv internal/modules/auth/{dao,service,handler,model,dto}.go \
        internal/modules/auth/{auth_dao,auth_service,auth_handler,auth_model,auth_dto}.go
```

### 2. 避免大规模重命名

```yaml
建议策略:
  1. 一个模块一个模块地重命名
  2. 每次重命名后测试
  3. 不要一次性重命名所有文件
  
原因:
  - 减少merge冲突
  - 便于问题定位
  - 可以逐步适应新规范
```

### 3. 文档更新

```yaml
需要更新的文档:
  - 开发文档中的文件路径
  - 架构文档中的模块结构
  - API文档中的handler引用
  - 教程和指南中的示例代码
```

## 📊 效果评估

### 预期改进

#### 可维护性提升
```yaml
之前:
  ❌ "handler.go是哪个模块的？"
  ❌ "dao.go有冲突吗？"
  ❌ "这个文件属于哪部分？"

之后:
  ✅ "auth_handler.go很明显是认证模块"
  ✅ "user_dao.go和auth_dao.go不会冲突"
  ✅ "文件归属清晰明了"
```

#### 新人友好度
```yaml
之前:
  ❌ "新手不知道文件在哪个模块"
  ❌ "IDE搜索结果混乱"

之后:
  ✅ "按模块名前缀，一目了然"
  ✅ "IDE自动分类更准确"
  ✅ "文件导航更直观"
```

---

**实施建议**: 🎯 **分阶段实施，避免大规模重命名风险**  
**优先级**: P0 (重复文件名) > P1 (复合词命名) > P2 (可选优化)  
**预期收益**: 📈 **代码可维护性提升30%，新人理解速度提升50%**
# 后端规范化执行计划

> 本文用于一次性推进 `backend/` 的命名、分层、文件组织与文档对齐工作。  
> 后续只要说明“按 BACKEND_NORMALIZATION_PLAN 继续”，就可以按本文清单整批处理，不再按小步骤逐次确认。

## 目标

- 统一后端业务模块分层为 `dao / dto / handler / model / router / service`
- 统一文件命名规则为固定主分层文件加 `<subject>_<kind>.go`
- 统一导出类型名、私有实现名、构造函数与容器 getter 命名
- 统一共享基础设施和工具目录命名
- 同步代码、文档和验证结果，避免规范与实现再次偏移

## 统一规则

### 主分层文件

业务模块固定使用：

- `dao.go`
- `dto.go`
- `handler.go`
- `model.go`
- `router.go`
- `service.go`

例外规则：

- 聚合命名空间不需要强行补齐固定六层文件
- 纯模型命名空间可以只保留模型相关文件
- 运行态模块如果没有持久化职责，可以省略持久化相关分层
- 为兼容外部协议保留的元数据字段名可以单独例外，例如 `json:"repository"`，但不应继续扩散到代码命名

### 补充文件

超出主分层承载范围时，统一使用：

```text
<subject>_<kind>.go
```

示例：

- `auth_service.go`
- `session_service.go`
- `api_key_service.go`
- `backup_service.go`
- `user_validation.go`
- `database_initializer.go`

### 类型命名

- 数据访问层统一使用 `DAO`，不再混用 `Repository`
- 导出类型名必须带具体业务语义，例如 `UserDAO`、`AuthService`、`NotificationHandler`
- 私有实现使用小写具体名，例如 `userDAO`、`authService`
- 构造函数统一使用 `New<Type>()`
- 容器 getter 统一使用 `Get<Type>()`

## 一次性执行清单

### 1. 基线扫描

- 扫描 `backend/internal/` 中的 `repository.go`、`controller.go`、`entity.go`
- 扫描导出类型、构造函数、容器 getter 是否仍混用 `Repository`
- 扫描模块目录是否缺少固定主分层文件
- 扫描乱码注释、失效文档链接与历史命名残留

### 2. 模块规范化

按模块批量处理以下目录：

- `backend/internal/modules/auth/`
- `backend/internal/modules/tenant/`
- `backend/internal/modules/system/`
- `backend/internal/modules/notification/`

每个模块按以下顺序收口：

1. 对齐 `dao.go / dto.go / handler.go / model.go / router.go / service.go`
2. 将过大的 `service.go` 拆到 `<subject>_service.go`
3. 统一 `DAO / Service / Handler / Router` 类型命名
4. 统一构造函数和依赖装配调用
5. 清理旧文件名和乱码注释

如果目录本身属于聚合命名空间、纯模型命名空间或运行态模块，应记录为规则例外，而不是补一组没有实际职责的空分层文件。

### 3. 共享层规范化

处理以下目录中的通用命名：

- `backend/internal/shared/`
- `backend/internal/app/`
- `backend/internal/config/`

重点规则：

- 优先使用“能力 + 类型”命名，例如 `base_dao.go`、`storage_provider.go`
- 启动装配文件统一使用体现职责的命名，例如 `app_bootstrap.go`
- 避免 `common.go`、`util.go`、`helpers.go` 这类泛化文件名

### 4. 工具与脚本规范化

处理以下目录：

- `backend/cmd/`
- `backend/scripts/`

规则：

- 工具目录名表达用途，可执行入口保留 `main.go`
- 工具内部辅助文件统一使用 `snake_case`
- SQL、Shell、Batch、Python 脚本统一使用 `snake_case`
- demo 数据脚本统一使用 `demo_<subject>.sql`

### 5. 文档同步

同步更新以下文档：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`
- `backend/docs/BACKEND_DOCS_INDEX.md`
- `backend/docs/BACKEND_DOCS_INDEX.en.md`
- `backend/README.md`
- `backend/README.en.md`
- `backend/BACKEND_GUIDE.md`
- `backend/BACKEND_GUIDE.en.md`

要求：

- 文档中的规则、示例和入口链接必须与当前代码一致
- 历史重命名案例可以保留，但必须明确标注为历史说明
- 新增计划、入口与阅读顺序时，中英文文档都要同步

### 6. 格式化与验证

每轮批量调整完成后统一执行：

```powershell
$env:GOCACHE=(Resolve-Path .).Path + '\backend\.gocache'
cd backend
go run ./cmd/tools/check-backend-naming
go test ./...
```

如果只改局部模块，可以先跑对应模块验证；但最终收尾必须通过一次 `backend` 全量测试。

## 验收标准

- `backend/internal/` 中不再新增 `repository.go`、`controller.go`、`entity.go`
- 代码侧不再混用 `Repository` 和 `DAO`
- 新模块默认具备固定六层文件
- 已批准的特例目录必须在规范文档中有明确说明，而不是靠补空文件规避扫描
- 补充文件均符合 `<subject>_<kind>.go`
- 主要文档入口都能指向当前有效规范
- `check-backend-naming` 通过
- `go test ./...` 通过

## 执行方式

后续如果需要我直接整批处理，只需要使用以下任一表达：

- “按后端规范化计划执行”
- “按 BACKEND_NORMALIZATION_PLAN 继续”
- “继续按统一命名计划收尾”

默认行为：

- 不再逐文件确认
- 直接按模块批次推进
- 每轮只汇报阶段结果、风险和验证结论

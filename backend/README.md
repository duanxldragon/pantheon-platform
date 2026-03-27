# 后端目录入口

> 这是 `backend/` 目录的快速入口文档。  
> 如果你刚进入后端目录，先从这里开始，再按下面的阅读顺序进入更细的文档。

## 目录作用

`backend/` 主要包含：

- `cmd/`：服务入口和开发辅助工具
- `internal/`：业务模块与共享基础设施
- `docs/`：人工维护的后端实现文档
- `api/swagger/`：生成产物
- `scripts/`：初始化脚本和演示脚本

## 推荐阅读顺序

1. `backend/README.md`
2. `backend/BACKEND_GUIDE.md`
3. `backend/docs/BACKEND_DOCS_INDEX.md`
4. `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
5. `backend/docs/BACKEND_NORMALIZATION_PLAN.md`
6. 再按模块进入：
   - `backend/docs/auth/AUTH_BACKEND.md`
   - `backend/docs/tenant/TENANT_BACKEND.md`
   - `backend/docs/system/SYSTEM_BACKEND.md`
7. 需要工具链时再看 `backend/cmd/tools/README.md`
8. 需要接口生成产物时再看 `backend/api/swagger/`

## 当前统一规则

后端当前统一遵循以下约定：

- 主分层文件固定为 `dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`
- 补充文件统一使用 `<subject>_<kind>.go`
- 命令入口继续保留 `main.go`
- 共享基础设施优先使用“能力 + 类型”的命名方式

唯一命名基线文档：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

批量执行计划文档：

- `backend/docs/BACKEND_NORMALIZATION_PLAN.md`

## 快速定位

如果你要看：

- 启动链路、装配关系、基础设施：`backend/BACKEND_GUIDE.md`
- 模块实现细节：`backend/docs/`
- 文件命名和目录组织规则：`backend/docs/BACKEND_NAMING_CONVENTIONS.md`
- 一次性规范化执行方式：`backend/docs/BACKEND_NORMALIZATION_PLAN.md`
- 工具结构和用法：`backend/cmd/tools/README.md`

## 备注

- `backend/BACKEND_GUIDE.md` 已经包含本轮后端规范化改造总结
- 新增后端文件前，先对照命名规范再落代码
- 大批量重命名或提交前，建议先运行 `go run ./cmd/tools/check-backend-naming`

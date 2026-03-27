# 后端文档索引

> `backend/docs/` 保存人工维护的后端实现文档。  
> 它主要回答后端如何组织、请求和启动链路如何流转，以及各模块之间如何协作。

## 入口文档

- [项目入口](../../README.md)
- [后端目录入口](../README.md)
- [平台文档索引](../../docs/DOCS_INDEX.md)
- [后端实现总览](../BACKEND_GUIDE.md)
- [后端命名规范](BACKEND_NAMING_CONVENTIONS.md)
- [后端规范化执行计划](BACKEND_NORMALIZATION_PLAN.md)
- [英文后端文档索引](BACKEND_DOCS_INDEX.en.md)

说明：

- `backend/BACKEND_GUIDE.md` 已包含本次后端规范化改造总结
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md` 是当前唯一命名与文件组织基线
- `backend/docs/BACKEND_NORMALIZATION_PLAN.md` 是后续批量规范化的执行清单

## 专题文档

- [系统模块后端实现](system/SYSTEM_BACKEND.md)
- [认证模块后端实现](auth/AUTH_BACKEND.md)
- [租户模块后端实现](tenant/TENANT_BACKEND.md)
- [英文系统模块实现](system/SYSTEM_BACKEND.en.md)
- [英文认证模块实现](auth/AUTH_BACKEND.en.md)
- [英文租户模块实现](tenant/TENANT_BACKEND.en.md)

## 工具和生成产物

- [开发辅助工具](../cmd/tools/README.md)
- `backend/api/swagger/`

## 推荐阅读顺序

1. 先读 `README.md`
2. 再读 `backend/README.md`
3. 再读 `docs/DOCS_INDEX.md`
4. 读 `backend/BACKEND_GUIDE.md` 了解后端工程结构和启动链路
5. 读 `backend/docs/BACKEND_NAMING_CONVENTIONS.md` 了解命名和文件组织规则
6. 读 `backend/docs/BACKEND_NORMALIZATION_PLAN.md` 了解批量执行方式
7. 再进入 `system/`、`auth/`、`tenant/` 下的专题文档
8. 需要工具链时看 `backend/cmd/tools/README.md`
9. 需要生成接口产物时看 `backend/api/swagger/`

## 文档边界

- `backend/BACKEND_GUIDE.md`：后端工程总览、启动链路、分层职责、约束与实践
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`：后端命名和文件组织基线
- `backend/docs/BACKEND_NORMALIZATION_PLAN.md`：批量规范化执行计划
- `backend/docs/`：各业务模块专题实现说明
- `backend/cmd/tools/README.md`：开发辅助工具说明
- `backend/api/swagger/`：生成的接口文档产物

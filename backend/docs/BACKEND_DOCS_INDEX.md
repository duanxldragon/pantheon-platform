# 后端文档索引

> `backend/docs/` 保存人工维护的后端实现文档，重点说明工程结构、模块协作、约束边界和上线执行方式。

## 入口文档

- [项目入口](../../README.md)
- [后端目录入口](../README.md)
- [平台文档索引](../../docs/DOCS_INDEX.md)
- [后端实现总览](../BACKEND_GUIDE.md)
- [后端命名规范](BACKEND_NAMING_CONVENTIONS.md)
- [英文后端文档索引](BACKEND_DOCS_INDEX.en.md)
- `backend/docs/archive/`

说明：

- `backend/BACKEND_GUIDE.md` 负责后端工程总览与分层约束。
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md` 负责命名与目录组织基线。
- 历史规范化计划、发布说明和阶段性文档已归档到 `backend/docs/archive/`。

## 专题文档

- [系统模块后端实现](system/SYSTEM_BACKEND.md)
- [认证模块后端实现](auth/AUTH_BACKEND.md)
- [租户模块后端实现](tenant/TENANT_BACKEND.md)
- [英文系统模块实现](system/SYSTEM_BACKEND.en.md)
- [英文认证模块实现](auth/AUTH_BACKEND.en.md)
- [英文租户模块实现](tenant/TENANT_BACKEND.en.md)

## 工具与生成产物

- [开发辅助工具](../cmd/tools/README.md)
- `backend/api/swagger/`

## 推荐阅读顺序

1. 先读 `README.md`
2. 再读 `backend/README.md`
3. 再读 `docs/DOCS_INDEX.md`
4. 再读 `backend/BACKEND_GUIDE.md`
5. 再读 `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
6. 再进入 `system/`、`auth/`、`tenant/` 专题文档
7. 需要历史执行背景时查看 `backend/docs/archive/`
8. 需要工具链时读 `backend/cmd/tools/README.md`
9. 需要生成接口产物时查看 `backend/api/swagger/`

## 文档边界

- `backend/BACKEND_GUIDE.md`：后端工程总览、启动链路、分层职责、约束与实践
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`：后端命名与文件组织基线
- `backend/docs/`：业务专题实现说明
- `backend/docs/archive/`：归档的规范化、发布和阶段性文档
- `backend/cmd/tools/README.md`：开发辅助工具说明
- `backend/api/swagger/`：生成的接口文档产物

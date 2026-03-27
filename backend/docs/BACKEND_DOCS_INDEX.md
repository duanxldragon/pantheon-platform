# 后端文档中心

> `backend/docs/` 只承载人工维护的后端专题实现文档。  
> 这里回答“后端代码怎么落、链路怎么跑、模块怎么协作”，不重复平台级业务规则。

## 入口文档

- [项目入口](../../README.md)
- [平台文档中心](../../docs/DOCS_INDEX.md)
- [后端实现总览](../BACKEND_GUIDE.md)
- [后端命名规范](BACKEND_NAMING_CONVENTIONS.md)
- [Backend Docs Index (English)](BACKEND_DOCS_INDEX.en.md)
- [Backend Naming Conventions (English)](BACKEND_NAMING_CONVENTIONS.en.md)

其中：

- `backend/BACKEND_GUIDE.md` 已包含本次后端规范化改造总结；
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md` 是后端文件命名与组织规则的唯一基准文档。

## 后端专题

- [系统管理后端实现](system/SYSTEM_BACKEND.md)
- [认证后端实现](auth/AUTH_BACKEND.md)
- [租户后端实现](tenant/TENANT_BACKEND.md)

## 开发与产物

- [开发辅助工具](../cmd/tools/README.md)
- `backend/api/swagger/`

## 推荐阅读顺序

1. 先读 `README.md`
2. 再读 `docs/DOCS_INDEX.md`
3. 再读 `backend/BACKEND_GUIDE.md` 了解后端工程结构与启动链路
4. 再读 `backend/docs/BACKEND_NAMING_CONVENTIONS.md` 了解统一命名规则
5. 按专题进入 `system/`、`auth/`、`tenant/`
6. 需要工具链时再看 `backend/cmd/tools/README.md`
7. 需要接口产物时再看 `backend/api/swagger/`

## 文档边界

- `backend/BACKEND_GUIDE.md`：后端工程总览
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`：后端命名与文件组织规范
- `backend/docs/`：后端专题实现细节
- `backend/cmd/tools/README.md`：开发辅助工具说明
- `backend/api/swagger/`：Swagger 生成产物

# 前端文档中心

> `frontend/docs/` 只承载人工维护的前端专题实现文档。  
> 这里回答“前端状态如何流转、界面如何挂载、交互如何承接”，不重复平台级业务规则。

## 入口文档

- [项目入口](../../README.md)
- [平台文档中心](../../docs/DOCS_INDEX.md)
- [前端实现总览](../FRONTEND_GUIDE.md)

## 前端专题

- [系统管理前端实现](system/SYSTEM_FRONTEND.md)
- [认证前端实现](auth/AUTH_FRONTEND.md)
- [租户前端实现](tenant/TENANT_FRONTEND.md)

## 推荐阅读顺序

1. 先读 `README.md`
2. 再读 `docs/DOCS_INDEX.md`
3. 再读 `frontend/FRONTEND_GUIDE.md` 了解前端工程结构与应用启动链路
4. 按专题进入 `system/`、`auth/`、`tenant/`
5. 需要看页面壳层、状态流转和动态挂载时，再结合源码阅读

## 文档边界

- `frontend/FRONTEND_GUIDE.md`：前端工程总览
- `frontend/docs/`：前端专题实现细节
- 模块源码：实际页面、状态管理与组件实现

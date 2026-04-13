# 后端代码规范

> 本文定义 `backend/` 的实现规范。  
> 它回答“后端代码应如何分层、如何处理租户与鉴权、哪些基础设施必须统一使用”。  
> 命名基线见 `BACKEND_NAMING_CONVENTIONS.md`，工程总览见 `../BACKEND_GUIDE.md`。

## 1. 作用范围

适用于：

- `backend/internal/modules/`
- `backend/internal/shared/`
- `backend/internal/app/`
- `backend/internal/config/`
- `backend/cmd/`

## 2. 总原则

- 先判断平台级还是租户级数据；
- 修根因，不做表面补丁；
- 避免在入口和 handler 堆业务逻辑；
- 认证、授权、租户、审计要一起考虑。

## 3. 分层职责

- `handler`：请求绑定、权限入口、响应输出；
- `service`：业务规则、事务边界、跨对象协作；
- `dao`：数据库读写；
- `model`：持久化模型；
- `dto`：请求响应结构；
- `router`：路由注册。

禁止混用：

- handler 写业务编排；
- dao 写跨模块流程；
- main/app 里堆模块业务逻辑。

## 4. 多租户边界

- 租户级数据必须依赖租户上下文；
- 不能只信前端传参判断租户；
- 租户 schema 变更要检查迁移器；
- 涉及租户停用、删除、初始化时，联动数据库管理与会话撤销。

## 5. 认证与授权边界

- 保持 `JWT + Refresh Token + Redis + revoked/version` 模型；
- 角色、权限、菜单变更要考虑在线用户刷新；
- 安全事件必须支持强制失效；
- API Key 也受统一鉴权边界约束；
- 不新增第二套权限判断体系。

## 6. 事务、错误与响应

- 写操作默认明确事务边界；
- 批量操作先做整体验证，再执行事务；
- 使用统一错误和响应工具；
- 高风险动作保留审计上下文；
- 失败路径要能区分业务错误和系统错误。

## 7. 共享基础设施使用规则

统一复用：

- 数据库：`internal/shared/database/`
- 缓存：`internal/shared/cache/`
- 鉴权：`internal/shared/authorization/`
- 中间件：`internal/shared/middleware/`
- I18n：`internal/shared/i18n/`
- Response / Errors / Validator / Audit

不要为单模块私造平行基础设施。

## 8. 路由与接口

- 路由注册集中在 `router`；
- 新接口遵守 `docs/api/API_DESIGN_STANDARDS.md`；
- 不手改 Swagger 生成产物；
- 需要新增接口时，同时考虑权限码、前端消费和测试。

## 9. 数据与迁移

- 模型变更先判断主库还是租户库；
- 变更租户库时同步检查迁移注册；
- 默认数据和初始化逻辑保持幂等；
- 工具链与初始化脚本变更要同步文档。

## 10. 测试要求

后端改动至少执行与范围相称的验证：

- `make naming`
- `make test`
- 必要时 `make verify`
- 涉及 schema 时 `make migrate-only`

优先补：

- service 白盒；
- middleware / authorization / tenant 边界；
- 批量操作与回滚；
- 租户隔离与越权拒绝。

## 11. 禁止事项

- 绕过租户上下文直接查租户数据；
- 在前端权限之外不做后端兜底；
- 在 handler 里放大事务和跨模块编排；
- 手工修改生成文件；
- 把临时排障逻辑留在正式主链路。

## 12. 提交前自查

- 是否影响 auth / tenant / system / notification 主链路；
- 是否涉及迁移、默认数据、Redis 或 Casbin；
- 是否补了相称测试；
- 是否需要更新实现文档或平台文档。

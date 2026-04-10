# 数据库命名规划

> 本文定义 Pantheon Platform 在平台主库、租户库、监控库和业务扩展库上的统一命名策略。  
> 目标不是穷举所有数据库实现细节，而是给平台演进提供稳定、可扩展、可落地的命名基线。

## 1. 文档定位

本文回答以下问题：

- 平台主库应该怎么命名；
- 租户数据库应该怎么命名；
- 业务数据库是否需要独立命名；
- 表前缀、模块前缀、租户编码生成规则应如何统一。

本文不重复：

- 租户初始化流程：见 `TENANT_INITIALIZATION.md`
- 后端数据库接线与连接池实现：见 `backend/docs/tenant/TENANT_BACKEND.md`
- 后端代码命名规范：见 `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

---

## 2. 设计原则

数据库命名默认遵循以下原则：

- 全小写；
- 单词使用下划线连接；
- 结构固定，优先表达“平台 / 租户 / 域”层次；
- 命名优先稳定，不随短期业务变化频繁修改；
- 环境信息优先放在实例、配置、部署层，而不是强耦合进库名；
- 业务模块优先进入租户库，不轻易拆成第二套独立业务库。

---

## 3. 数据库分层命名

当前推荐把数据库分成四类：

### 3.1 平台主库

推荐名称：

`pantheon_master`

用途：

- 租户主档；
- 租户数据库配置；
- 平台级配额；
- 平台级认证与治理元数据；
- 平台默认租户相关的主数据。

说明：

- 主库名称应固定；
- 不建议使用过于泛化的名字，例如 `pantheon`、`main_db`、`platform_db`；
- 主库是平台唯一的“全局真相源”，名称应一眼可识别。

### 3.2 监控库

推荐名称：

`pantheon_monitor`

用途：

- 监控快照；
- 性能指标历史数据；
- 可选的运维统计与审计辅助数据。

说明：

- 监控库建议和主库分离；
- 若部署规模较小，也可以暂时关闭监控库，但命名基线仍保持这一形式。

### 3.3 租户运行库

推荐格式：

`pantheon_tenant_<tenant_code>`

示例：

- `pantheon_tenant_acme`
- `pantheon_tenant_demo`
- `pantheon_tenant_platform`

用途：

- 当前租户的系统管理数据；
- 当前租户的认证侧业务数据；
- 当前租户的通知、日志、设置、字典等支撑数据；
- 当前租户的后续业务模块数据。

说明：

- 这是默认、优先、长期推荐的租户库命名方式；
- 不建议直接用随机 UUID 作为库名主体；
- `tenant_code` 应是面向运维和业务都可识别的稳定编码。

### 3.4 业务扩展库

默认策略：

**不单独建库，优先并入租户运行库。**

只有在以下场景才建议拆分业务扩展库：

- 单个业务域数据量明显过大；
- 合规要求独立存储；
- 生命周期与租户主业务库不同；
- 读写压力或备份策略必须单独隔离。

若确需拆分，推荐格式：

`pantheon_tenant_<tenant_code>_<domain>`

示例：

- `pantheon_tenant_acme_order`
- `pantheon_tenant_acme_billing`
- `pantheon_tenant_acme_warehouse`

---

## 4. 为什么业务库默认不独立

Pantheon Platform 当前更适合采用：

`平台主库 + 每租户一个运行库 + 少量可选扩展库`

而不是：

`平台主库 + 每租户多个业务库`

默认不独立拆业务库的原因：

- 初始化链路更简单；
- 租户迁移器更容易统一管理；
- 权限、菜单、日志、设置与业务数据协作成本更低；
- 运维、备份、恢复、排障更直接；
- 更符合“平台底座先收敛、业务模块再扩展”的演进方式。

因此默认建议是：

- `system`、`auth`、`notification` 进入租户库；
- 后续业务模块也优先进入租户库；
- 只有明确达到物理拆分条件时，才创建独立业务扩展库。

---

## 5. 租户编码规则

租户数据库命名高度依赖 `tenant_code`，因此编码本身必须稳定。

推荐规则：

- 全小写；
- 使用字母、数字、下划线；
- 长度控制在 `3-32` 个字符；
- 不以数字开头；
- 不使用中文、空格、短横线；
- 一旦对外生效，尽量不再修改。

推荐生成来源：

- 企业简称；
- 产品租户代号；
- 平台审批时生成的短编码。

推荐示例：

- `acme`
- `globex`
- `demo`
- `platform`
- `northwind`

不推荐示例：

- `tenant001`
- `客户A`
- `Acme-Prod`
- `acme final`
- `4test`

如果展示名称需要更友好，应把“租户显示名”和 `tenant_code` 分离，而不是把展示名直接拿来做数据库名。

---

## 6. 推荐生成规则

为了让 `tenant_code` 和数据库名稳定可预测，推荐采用以下生成规则：

### 6.1 `tenant_code` 生成

输入：

- 租户显示名或企业简称

处理步骤：

1. 转为小写；
2. 去掉首尾空白；
3. 把空格、短横线等分隔符统一转为下划线；
4. 去掉非字母、数字、下划线字符；
5. 如果以下划线开头，去掉前导下划线；
6. 如果首字符为数字，则补前缀，例如 `t_`；
7. 超过长度上限时截断到 32 字符内。

示例：

- `Acme` -> `acme`
- `Acme China` -> `acme_china`
- `Northwind-Prod` -> `northwind_prod`
- `4Paradigm` -> `t_4paradigm`

### 6.2 推荐数据库名生成

生成规则：

`pantheon_tenant_<tenant_code>`

示例：

- `acme` -> `pantheon_tenant_acme`
- `acme_china` -> `pantheon_tenant_acme_china`
- `t_4paradigm` -> `pantheon_tenant_t_4paradigm`

### 6.3 前端交互建议

租户创建或初始化向导建议采用以下行为：

- 用户输入租户显示名后，自动生成建议 `tenant_code`
- 用户输入或修改 `tenant_code` 后，自动显示推荐数据库名
- 后端在创建租户时再次归一化并校验 `tenant_code`
- 默认允许人工覆盖数据库名
- 一旦租户创建完成，`tenant_code` 默认不再允许随意修改

这样可以兼顾：

- 平台规则统一；
- 运维可预测；
- 用户在特殊场景下保留可控性。

---

## 7. 表命名规划

默认建议采用“模块前缀 + 复数资源名”的方式，不把租户编码放进表名。

推荐前缀：

- `system_`：系统管理租户表
- `auth_`：认证与会话租户表
- `tenant_`：平台主库中的租户主数据
- `notification_`：通知租户表
- `biz_<domain>_`：业务模块
- `casbin_rule`：Casbin 规则表保留约定单表名

示例：

- `system_users`
- `system_roles`
- `system_role_menus`
- `system_permissions`
- `system_settings`
- `system_dict_types`
- `auth_api_keys`
- `auth_login_attempts`
- `notification_messages`
- `biz_order_orders`

说明：

- 同一租户的数据隔离由“数据库级隔离”承担，不靠表名拼租户；
- 平台主库中的租户相关表可以使用 `tenant_` 前缀；
- 业务模块要优先使用稳定域前缀，不要直接用零散表名。

---

## 8. GORM 与模型命名建议

模型命名建议：

- Go 结构体保持业务语义化，如 `User`、`Role`、`ApiKey`、`Notification`
- 表名通过统一命名策略落到稳定下划线格式

推荐做法：

- 平台公共模型遵循统一表名前缀；
- 对需要特殊表名的模型，显式声明 `TableName()`

示例方向：

- `User` -> `system_users`
- `Role` -> `system_roles`
- `ApiKey` -> `auth_api_keys`
- `Notification` -> `notification_messages`

不建议：

- 完全依赖默认复数推断而不校验最终表名；
- 同一模块里混用多套前缀；
- 在表名里混入环境、租户编码或部署信息。

---

## 9. 环境命名建议

环境信息优先放在：

- 数据库实例名；
- 部署配置；
- K8s/容器环境变量；
- 连接串或 Secret；
- 监控标签。

不建议默认把环境拼进库名。

优先写法：

- 生产实例中的 `pantheon_master`
- 测试实例中的 `pantheon_master`

只有在必须共享同一数据库实例、且无法通过实例或账号区分时，才可退一步使用：

- `pantheon_master_prod`
- `pantheon_master_test`
- `pantheon_tenant_acme_prod`

即便如此，也应把环境后缀放在最后。

---

## 10. 禁止项

不建议使用以下命名方式：

- `db1`
- `pantheon`
- `tenant001`
- `business_db`
- `acme_prod_final`
- 中文、空格、大小写混用命名

也不建议：

- 按开发人员习惯临时起库名；
- 用 UUID 直接作为库名主体；
- 让不同租户沿用不同命名规则。

---

## 11. 推荐落地方案

如果当前平台要立即确定统一命名基线，推荐直接采用：

- 平台主库：`pantheon_master`
- 监控库：`pantheon_monitor`
- 租户库：`pantheon_tenant_<tenant_code>`
- 业务扩展库：`pantheon_tenant_<tenant_code>_<domain>`
- 平台主库表前缀：`tenant_`
- 租户库内系统表前缀：`system_` / `auth_` / `notification_`
- Casbin 规则表：`casbin_rule`
- 业务表前缀：`biz_<domain>_`

这是当前最平衡的方案：

- 可读；
- 可维护；
- 适合多租户平台演进；
- 也能为将来物理拆库留出空间。

---

## 12. 与租户初始化的关系

数据库命名规划不是独立话题，它直接影响：

- 租户开通时默认数据库建议值；
- 租户初始化向导的输入约束；
- 租户迁移器的接入约定；
- 运维脚本、备份、恢复、监控的识别方式。

因此后续若调整命名基线，应同步检查：

- `TENANT_INITIALIZATION.md`
- `backend/docs/tenant/TENANT_BACKEND.md`
- 配置默认值与部署说明；
- 租户初始化前端向导中的文案和示例。

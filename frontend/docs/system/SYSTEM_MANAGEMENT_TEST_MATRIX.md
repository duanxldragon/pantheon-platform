# 系统管理模块功能测试矩阵

## 定位

本文件用于记录系统管理模块当前已经完成的功能性验证范围，方便后续回归、补测与交接。

- 平台级业务边界：看 `../../../docs/system/SYSTEM_MANAGEMENT.md`
- 前端实现入口：看 `./SYSTEM_FRONTEND.md`
- 实际自动化脚本：看 `../../tests/official/system-management-functional.spec.ts`

---

## 1. 当前验证方式

当前系统管理模块采用两层验证：

- 前端功能回归：`Playwright`
- 后端模块回归：`go test`

本轮实际执行过的命令：

- `cd frontend && cmd /c npm run test:e2e:system`
- `cd frontend && cmd /c npm run build`
- `cd backend && $env:GOCACHE=(Resolve-Path .gocache); go test ./internal/modules/system/...`

---

## 2. 前端功能覆盖

### 2.1 已通过的功能链路

| 模块 | 已验证能力 | 主要接口/行为 |
| :--- | :--- | :--- |
| 租户初始化 | 数据库向导、连接校验、完成初始化、返回列表 | `POST /api/v1/tenants/{id}/setup` |
| 部门管理 | 新增、编辑、页面删除 | `POST /api/v1/system/depts`、`PUT /api/v1/system/depts/{id}`、删除操作 |
| 角色管理 | 新增、编辑、页面删除、批量状态、菜单配置 | `POST /api/v1/system/roles`、`PUT /api/v1/system/roles/{id}`、`PATCH /api/v1/system/roles/status`、`POST /api/v1/system/roles/{id}/menus` |
| 岗位管理 | 新增、编辑、页面删除 | `POST /api/v1/system/positions`、`PUT /api/v1/system/positions/{id}`、删除操作 |
| 用户管理 | 新增、编辑、删除、权限详情、分配角色、重置密码、批量状态 | `POST /api/v1/system/users`、`PUT /api/v1/system/users/{id}`、`GET /api/v1/system/users/{id}/permissions`、`PATCH /api/v1/system/users/{id}/password`、`PATCH /api/v1/system/users/status` |
| 菜单管理 | 新增、编辑、状态切换、删除 | 菜单创建/更新、`PATCH /api/v1/system/menus/status`、删除操作 |
| 权限管理 | 新增、编辑、状态切换、删除 | `POST /api/v1/system/permissions`、`PUT /api/v1/system/permissions/{id}` |
| 数据字典 | 字典类型新增/编辑/删除、字典项新增/编辑/状态切换/删除 | `dict/types`、`dict/data` 相关接口 |
| 系统设置 | 页面查询、字段修改、单项保存、导出、批量导入 | `PUT /api/v1/system/settings/{key}`、`POST /api/v1/system/settings/batch` |
| 统一日志 | 查询、导出、切换操作日志、清空操作日志 | `GET /api/v1/system/logs/login`、`GET /api/v1/system/logs/operation`、`DELETE /api/v1/system/logs/operation` |
| 系统监控 | 页面查询、刷新、导出快照 | `GET /api/v1/system/monitor/overview` |

### 2.2 当前 Playwright 用例边界

当前自动化脚本聚焦“系统管理主流程是否可用”，不覆盖所有组合分支。

重点覆盖：

- 页面是否能从侧边栏进入
- 表单是否能正常提交
- 关键写接口是否返回成功
- 写入结果是否能在页面重新查询到
- 删除、状态切换、导出、刷新等核心动作是否可用

当前未重点覆盖：

- 每个筛选项的全部组合
- 异常态文案与细粒度错误提示
- 超大数据量下的分页边界
- 多语言下所有页面的逐项视觉校验
- 权限缺失场景下每个按钮的完整矩阵

### 2.3 端点 → 页面 → 覆盖对照

下表基于当前前端 `system/api` 调用层与 `tests/official/system-management-functional.spec.ts` 整理。

| 端点 | 前端页面/入口 | 当前状态 |
| :--- | :--- | :--- |
| `GET /api/v1/system/depts/tree` | 部门管理页初始化 | 前端已接入，Playwright 间接覆盖 |
| `POST /api/v1/system/depts` | 部门管理新增 | Playwright 已覆盖 |
| `PUT /api/v1/system/depts/{id}` | 部门管理编辑 | Playwright 已覆盖 |
| `DELETE /api/v1/system/depts/{id}` | 部门管理单条删除 | Playwright 已覆盖 |
| `POST /api/v1/system/depts/batch-delete` | 部门管理批量删除 | 前端已接入，当前未覆盖 |
| `PATCH /api/v1/system/depts/status` | 部门管理批量状态变更 | 前端已接入，当前未覆盖 |
| `GET /api/v1/system/roles` | 角色管理列表 | 前端已接入，Playwright 间接覆盖 |
| `GET /api/v1/system/roles/{id}` | 角色详情/编辑态 | 前端已接入，当前未单独覆盖 |
| `POST /api/v1/system/roles` | 角色新增 | Playwright 已覆盖 |
| `PUT /api/v1/system/roles/{id}` | 角色编辑 | Playwright 已覆盖 |
| `DELETE /api/v1/system/roles/{id}` | 角色删除 | Playwright 已覆盖 |
| `POST /api/v1/system/roles/batch-delete` | 角色批量删除 | 前端已接入，当前未覆盖 |
| `PATCH /api/v1/system/roles/status` | 角色批量状态变更 | Playwright 已覆盖 |
| `POST /api/v1/system/roles/{id}/permissions` | 角色权限配置弹窗 | 前端已接入，当前未覆盖 |
| `POST /api/v1/system/roles/{id}/menus` | 角色菜单配置弹窗 | Playwright 已覆盖 |
| `GET /api/v1/system/positions` | 岗位管理列表 | 前端已接入，Playwright 间接覆盖 |
| `POST /api/v1/system/positions` | 岗位新增 | Playwright 已覆盖 |
| `PUT /api/v1/system/positions/{id}` | 岗位编辑 | Playwright 已覆盖 |
| `DELETE /api/v1/system/positions/{id}` | 岗位删除 | Playwright 已覆盖 |
| `POST /api/v1/system/positions/batch-delete` | 岗位批量删除 | 前端已接入，当前未覆盖 |
| `PATCH /api/v1/system/positions/status` | 岗位批量状态变更 | 前端已接入，当前未覆盖 |
| `GET /api/v1/system/users` | 用户管理列表 | 前端已接入，Playwright 间接覆盖 |
| `POST /api/v1/system/users` | 用户新增 | Playwright 已覆盖 |
| `PUT /api/v1/system/users/{id}` | 用户编辑 | Playwright 已覆盖 |
| `DELETE /api/v1/system/users/{id}` | 用户删除 | Playwright 已覆盖 |
| `PATCH /api/v1/system/users/status` | 用户批量状态变更 | Playwright 已覆盖 |
| `POST /api/v1/system/users/batch-delete` | 用户批量删除 | 前端已接入，当前未覆盖 |
| `PATCH /api/v1/system/users/{id}/password` | 用户重置密码 | Playwright 已覆盖 |
| `GET /api/v1/system/users/{id}/permissions` | 用户权限面板 | Playwright 已覆盖 |
| `POST /api/v1/system/users/upload` | 用户头像上传 | 后端已提供，系统管理主回归未覆盖 |
| `GET /api/v1/system/menus` | 菜单列表 | 前端已接入，Playwright 间接覆盖 |
| `GET /api/v1/system/menus/tree` | 菜单树 | 前端已接入，Playwright 间接覆盖 |
| `POST /api/v1/system/menus` | 菜单新增 | Playwright 已覆盖 |
| `PUT /api/v1/system/menus/{id}` | 菜单编辑 | Playwright 已覆盖 |
| `DELETE /api/v1/system/menus/{id}` | 菜单删除 | Playwright 已覆盖 |
| `POST /api/v1/system/menus/batch-delete` | 菜单批量删除 | 前端已接入，当前未覆盖 |
| `PATCH /api/v1/system/menus/status` | 菜单状态变更 | Playwright 已覆盖 |
| `GET /api/v1/system/permissions` | 权限管理列表 | 前端已接入，Playwright 间接覆盖 |
| `GET /api/v1/system/permissions/{id}` | 权限详情 | 前端已接入，当前未单独覆盖 |
| `POST /api/v1/system/permissions` | 权限新增 | Playwright 已覆盖 |
| `PUT /api/v1/system/permissions/{id}` | 权限编辑/状态切换 | Playwright 已覆盖 |
| `DELETE /api/v1/system/permissions/{id}` | 权限删除 | Playwright 已覆盖 |
| `POST /api/v1/system/permissions/batch-delete` | 权限批量删除 | 前端已接入，当前未覆盖 |
| `PATCH /api/v1/system/permissions/status` | 权限批量状态变更 | 前端已接入，当前未覆盖 |
| `GET /api/v1/system/dict/types` | 字典类型列表 | 前端已接入，Playwright 间接覆盖 |
| `POST /api/v1/system/dict/types` | 字典类型新增 | Playwright 已覆盖 |
| `PUT /api/v1/system/dict/types/{id}` | 字典类型编辑 | Playwright 已覆盖 |
| `DELETE /api/v1/system/dict/types/{id}` | 字典类型删除 | Playwright 已覆盖 |
| `GET /api/v1/system/dict/data` | 字典项列表 | 前端已接入，Playwright 间接覆盖 |
| `POST /api/v1/system/dict/data` | 字典项新增 | Playwright 已覆盖 |
| `PUT /api/v1/system/dict/data/{id}` | 字典项编辑/状态切换 | Playwright 已覆盖 |
| `DELETE /api/v1/system/dict/data/{id}` | 字典项删除 | Playwright 已覆盖 |
| `GET /api/v1/system/settings` | 系统设置页初始化 | 前端已接入，Playwright 间接覆盖 |
| `PUT /api/v1/system/settings/{key}` | 系统设置单项保存 | Playwright 已覆盖 |
| `POST /api/v1/system/settings/batch` | 系统设置批量保存 | Playwright 已覆盖 |
| `GET /api/v1/system/logs/login` | 统一日志页登录日志 | Playwright 已覆盖查询/导出 |
| `DELETE /api/v1/system/logs/login` | 登录日志清理 | 前端已接入，当前未覆盖 |
| `GET /api/v1/system/logs/operation` | 统一日志页操作日志 | Playwright 已覆盖查询 |
| `DELETE /api/v1/system/logs/operation` | 操作日志清理 | Playwright 已覆盖 |
| `GET /api/v1/system/monitor/overview` | 系统监控主页 | Playwright 已覆盖 |
| `GET /api/v1/system/monitor/online-users` | 系统监控在线用户 | 前端 API 已提供，当前页面未直接调用，未覆盖 |

---

## 3. 后端模块覆盖

### 3.1 已通过的 `go test` 包

- `./internal/modules/system/dept`
- `./internal/modules/system/menu`
- `./internal/modules/system/permission`
- `./internal/modules/system/position`
- `./internal/modules/system/role`
- `./internal/modules/system/user`

### 3.2 已完成编译回归的包

以下包当前没有独立单测文件，但已随 `go test ./internal/modules/system/...` 完成编译级验证：

- `./internal/modules/system/dict`
- `./internal/modules/system/log`
- `./internal/modules/system/monitor`
- `./internal/modules/system/setting`

---

## 4. 本轮修复后纳入回归的真实问题

本轮功能测试不是只改脚本，也修复了测试中暴露出的真实问题：

- 菜单树行渲染中 `node.id` 可能不是字符串，已改为显式 `String(node.id)`
- 菜单单条状态切换改为走批量状态接口，避免因载荷不完整导致失败
- 权限编码校验放宽为支持 `system:user:view` 这类带冒号编码
- 日志页勾选操作改为命中可见控件，回归用例更贴合真实交互

---

## 5. 后续补测建议

如果后续继续补系统管理测试，建议按下面顺序扩展：

1. 用户管理补“批量删除、导入导出、头像上传”
2. 角色管理补“权限配置、批量删除、详情接口”
3. 菜单管理补“树结构父子关系、目录/菜单/按钮三类节点”
4. 权限管理补“分类筛选、模块筛选、批量操作”
5. 日志管理补“登录日志清理、状态筛选、时间范围筛选”
6. 系统设置补“更多分组字段、导入失败与非法文件场景”

---

## 6. 当前结论

截至本轮回归，系统管理模块的核心主流程已经完成一轮可执行、可复跑的自动化验证，适合作为后续继续补测的基线。

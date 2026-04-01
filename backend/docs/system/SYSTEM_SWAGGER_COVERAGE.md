# 系统管理模块 Swagger 覆盖矩阵

## 定位

本文用于说明系统管理模块当前 Swagger 注解的覆盖范围、组织方式和查看入口。

- 平台级业务边界：见 `../../../docs/system/SYSTEM_MANAGEMENT.md`
- 系统模块后端实现入口：见 `./SYSTEM_BACKEND.md`
- 生成产物目录：见 `../../api/swagger/`
- 前端页面与自动化覆盖：见 `../../../frontend/docs/system/SYSTEM_MANAGEMENT_TEST_MATRIX.md`

本文不替代 Swagger 生成结果，只回答三件事：

- 哪些系统端点已经进入 Swagger
- 注解写在什么位置
- 后续新增端点时应补哪些地方

---

## 1. 当前组织方式

系统管理模块当前 Swagger 信息分成两层维护：

- `handler.go`：维护端点级注解，如 `@Summary`、`@Param`、`@Success`、`@Router`
- `swagger.go`：维护复用的响应包裹类型和文档专用结构

当前系统模块的 `@Router` 注解统一写成 `/system/...` 形式，最终通过全局 BasePath 组合成实际前缀：

- Swagger 注解路径：`/system/...`
- 实际访问前缀：`/api/v1/system/...`

---

## 2. 当前覆盖范围

截至本轮整理，系统管理模块已覆盖以下子模块：

- `dept`
- `dict`
- `log`
- `menu`
- `monitor`
- `permission`
- `position`
- `role`
- `setting`
- `user`

---

## 3. 端点矩阵

### 3.1 部门管理

| 方法 | 路径 |
| :--- | :--- |
| `POST` | `/api/v1/system/depts` |
| `GET` | `/api/v1/system/depts/{id}` |
| `GET` | `/api/v1/system/depts` |
| `GET` | `/api/v1/system/depts/tree` |
| `PUT` | `/api/v1/system/depts/{id}` |
| `DELETE` | `/api/v1/system/depts/{id}` |
| `POST` | `/api/v1/system/depts/batch-delete` |
| `PATCH` | `/api/v1/system/depts/status` |

### 3.2 数据字典

| 方法 | 路径 |
| :--- | :--- |
| `POST` | `/api/v1/system/dict/types` |
| `GET` | `/api/v1/system/dict/types/{id}` |
| `GET` | `/api/v1/system/dict/types` |
| `PUT` | `/api/v1/system/dict/types/{id}` |
| `DELETE` | `/api/v1/system/dict/types/{id}` |
| `POST` | `/api/v1/system/dict/data` |
| `GET` | `/api/v1/system/dict/data` |
| `GET` | `/api/v1/system/dict/data/{id}` |
| `PUT` | `/api/v1/system/dict/data/{id}` |
| `DELETE` | `/api/v1/system/dict/data/{id}` |

### 3.3 日志管理

| 方法 | 路径 |
| :--- | :--- |
| `GET` | `/api/v1/system/logs/operation` |
| `DELETE` | `/api/v1/system/logs/operation` |
| `GET` | `/api/v1/system/logs/login` |
| `DELETE` | `/api/v1/system/logs/login` |

### 3.4 菜单管理

| 方法 | 路径 |
| :--- | :--- |
| `POST` | `/api/v1/system/menus` |
| `GET` | `/api/v1/system/menus/{id}` |
| `GET` | `/api/v1/system/menus` |
| `GET` | `/api/v1/system/menus/tree` |
| `PUT` | `/api/v1/system/menus/{id}` |
| `DELETE` | `/api/v1/system/menus/{id}` |
| `POST` | `/api/v1/system/menus/batch-delete` |
| `PATCH` | `/api/v1/system/menus/status` |

### 3.5 系统监控

| 方法 | 路径 |
| :--- | :--- |
| `GET` | `/api/v1/system/monitor/overview` |
| `GET` | `/api/v1/system/monitor/online-users` |

### 3.6 权限管理

| 方法 | 路径 |
| :--- | :--- |
| `POST` | `/api/v1/system/permissions` |
| `GET` | `/api/v1/system/permissions/{id}` |
| `GET` | `/api/v1/system/permissions` |
| `PUT` | `/api/v1/system/permissions/{id}` |
| `DELETE` | `/api/v1/system/permissions/{id}` |
| `POST` | `/api/v1/system/permissions/batch-delete` |
| `PATCH` | `/api/v1/system/permissions/status` |

### 3.7 岗位管理

| 方法 | 路径 |
| :--- | :--- |
| `POST` | `/api/v1/system/positions` |
| `GET` | `/api/v1/system/positions/{id}` |
| `GET` | `/api/v1/system/positions` |
| `PUT` | `/api/v1/system/positions/{id}` |
| `DELETE` | `/api/v1/system/positions/{id}` |
| `POST` | `/api/v1/system/positions/batch-delete` |
| `PATCH` | `/api/v1/system/positions/status` |

### 3.8 角色管理

| 方法 | 路径 |
| :--- | :--- |
| `POST` | `/api/v1/system/roles` |
| `GET` | `/api/v1/system/roles/{id}` |
| `GET` | `/api/v1/system/roles` |
| `PUT` | `/api/v1/system/roles/{id}` |
| `DELETE` | `/api/v1/system/roles/{id}` |
| `POST` | `/api/v1/system/roles/batch-delete` |
| `PATCH` | `/api/v1/system/roles/status` |
| `POST` | `/api/v1/system/roles/{id}/permissions` |
| `POST` | `/api/v1/system/roles/{id}/menus` |

### 3.9 系统设置

| 方法 | 路径 |
| :--- | :--- |
| `GET` | `/api/v1/system/settings` |
| `PUT` | `/api/v1/system/settings/{key}` |
| `POST` | `/api/v1/system/settings/batch` |

### 3.10 用户管理

| 方法 | 路径 |
| :--- | :--- |
| `POST` | `/api/v1/system/users` |
| `GET` | `/api/v1/system/users/{id}` |
| `PUT` | `/api/v1/system/users/{id}` |
| `DELETE` | `/api/v1/system/users/{id}` |
| `GET` | `/api/v1/system/users` |
| `PATCH` | `/api/v1/system/users/status` |
| `POST` | `/api/v1/system/users/batch-delete` |
| `PATCH` | `/api/v1/system/users/{id}/password` |
| `GET` | `/api/v1/system/users/{id}/permissions` |
| `POST` | `/api/v1/system/users/upload` |

---

## 4. 注解落点

如果要继续补系统管理 Swagger，优先看这两类文件：

- `backend/internal/modules/system/<module>/handler.go`
- `backend/internal/modules/system/<module>/swagger.go`

建议遵循下面的分工：

- 新增端点：优先补 `handler.go` 中的接口注解
- 新增复用响应结构：补 `swagger.go`
- 改请求/响应 DTO：同步检查 `dto.go` 中的字段注释、`example` 和 `binding`
- 改路由：同步校对 `router.go` 和 `@Router`

---

## 5. 维护约束

后续新增或修改系统端点时，至少同步检查四处：

1. `router.go` 中的实际注册路径
2. `handler.go` 中的 `@Router`、`@Param`、`@Success`
3. `swagger.go` 中是否已有合适的响应包裹结构
4. `backend/api/swagger/` 是否已重新生成

如果只改生成产物、不改注解源头，后续很容易再次漂移。

---

## 6. 当前结论

当前系统管理模块的核心端点已经全部进入 Swagger 注解链路。  
后续工作的重点不再是“有没有”，而是“保持路由、DTO、注解和生成产物持续一致”。

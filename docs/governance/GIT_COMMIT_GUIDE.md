# Git 提交规范

> 这份文档写给项目成员，也写给进入仓库工作的 Codex。  
> 目标很简单：让提交历史可读、可追踪、可回滚。

## 1. 基本原则

- 一次提交只做一件主题明确的事
- 提交信息要能直接说明“改了什么”
- 优先写动词开头的简短摘要，不写流水账
- 配置、迁移、文档等与代码强相关的改动，尽量同次提交

## 2. 推荐格式

统一使用：

```text
type(scope): summary
```

示例：

```text
feat(auth): add session revoke endpoint
fix(system): refresh menu permissions after role update
docs(readme): improve repository homepage overview
```

## 3. 常用 type

- `feat`：新增功能
- `fix`：修复缺陷
- `refactor`：重构，不改变外部行为
- `docs`：文档更新
- `test`：测试补充或调整
- `chore`：构建、脚本、依赖、仓库治理类改动

## 4. 常用 scope

优先使用模块名、目录名或改动边界清晰的范围：

- `auth`
- `tenant`
- `system`
- `backend`
- `frontend`
- `docs`
- `agent`
- `repo`
- `readme`

不要使用太空泛的 scope，比如：

- `update`
- `misc`
- `temp`

## 5. 可直接套用的示例

### 功能类

```text
feat(auth): add api key revoke endpoint
feat(system): support menu tree lazy loading
feat(tenant): add tenant database connectivity check
```

### 修复类

```text
fix(auth): handle expired refresh token correctly
fix(system): refresh permission cache after role change
fix(frontend): preserve active tab after menu reload
```

### 重构类

```text
refactor(backend): split tenant db manager responsibilities
refactor(frontend): simplify auth store initialization flow
refactor(system): extract shared menu validation logic
```

### 文档类

```text
docs(readme): improve quick start instructions
docs(agent): tighten codex behavior rules
docs(backend): clarify module layering and naming rules
```

### 测试类

```text
test(auth): cover two factor login fallback flow
test(system): add role service permission update tests
test(frontend): add session management view coverage
```

### 仓库治理类

```text
chore(repo): initialize pantheon platform repository
chore(repo): checkpoint current local changes
chore(frontend): update lint and type check scripts
```

## 6. 不推荐的提交信息

以下写法不建议使用：

```text
update code
fix bug
修改一下
提交
final
wip
temp
```

问题在于：

- 看不出改动范围
- 看不出改动类型
- 后续回看历史很难定位

## 7. 提交前检查

提交前至少确认：

- 改动范围和提交主题一致
- 工作区没有无关文件混入
- 该跑的最小验证已经跑过
- 提交信息可以让其他人一眼看懂

## 8. 推荐工作流

```bash
git status
git add -A
git commit -m "type(scope): summary"
git push
```

如果改动较大，建议先按主题拆成多次提交，而不是全部堆到一个提交里。

## 9. 对 Codex 的额外要求

- 不要生成模糊提交信息
- 不要把无关改动顺手混进同一提交
- 如果只是做“本地检查点”，要明确写成 `chore(repo): checkpoint ...`
- 如果用户明确要求“一次性提交全部改动”，可以提交，但要在结果里说明这是打包提交

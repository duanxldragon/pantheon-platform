# 数据库命名优化建议

## 🎯 优化目标

将过长的数据库名称 `pantheon_tenant_{tenant_id}` 优化为更简洁的格式，提升可操作性和可维护性。

## 📊 当前命名分析

### 现有命名
```
pantheon_tenant_default    (21字符)
pantheon_tenant_acme       (21字符)  
pantheon_tenant_globex     (21字符)
```

### 问题分析
- ❌ **名称过长**: 21字符超过建议的16字符限制
- ❌ **操作不便**: 命令行操作、日志查看困难
- ❌ **显示问题**: 某些数据库管理工具显示不完整
- ❌ **路径风险**: 可能超过文件系统路径长度限制

## ✅ 推荐方案

### 方案A: PT前缀 (🏆 推荐)

```yaml
新命名格式: pt_{tenant_id}
实际示例:   pt_default, pt_acme, pt_globex
长度范围:   7-12字符
```

**优势**:
- ✅ **简洁明了**: 长度减少50%+
- ✅ **保持语义**: pt = Pantheon缩写，易于识别
- ✅ **操作友好**: 便于命令行操作和日志查看
- ✅ **扩展性好**: 支持任意长度的tenant_id

**示例对比**:
```bash
# 旧命名
mysql> USE pantheon_tenant_globex;
Query OK, 0 rows affected (0.01 sec)

# 新命名  
mysql> USE pt_globex;
Query OK, 0 rows affected (0.01 sec)
```

### 方案B: 极简P前缀

```yaml
新命名格式: p_{tenant_id}
实际示例:   p_default, p_acme, p_globex  
长度范围:   6-10字符
```

**优势**:
- ✅ **最简洁**: 长度减少最多
- ✅ **高频操作**: 适合频繁操作场景

**劣势**:
- ⚠️ **语义较弱**: p前缀可能不够直观
- ⚠️ **冲突风险**: 与其他系统可能产生混淆

### 方案C: 纯租户标识

```yaml
新命名格式: {tenant_code}
实际示例:   default, acme, globex
长度范围:   4-12字符
```

**优势**:
- ✅ **最直观**: 直接使用租户代码
- ✅ **最简短**: 无额外前缀

**劣势**:
- ⚠️ **语义不清**: 无法识别是租户数据库
- ⚠️ **冲突风险**: 可能与系统数据库混淆

## 🔧 实施指南

### 1. 代码更新

#### 更新DTO示例
```go
// backend/internal/modules/tenant/dto.go

// 旧示例
Database string `json:"database" example:"pantheon_tenant_default"`

// 新示例 (方案A)
Database string `json:"database" example:"pt_default"`
```

#### 更新前端占位符
```typescript
// frontend/src/modules/tenant/components/TenantSetupWizard/components/ConnectionConfigStep.tsx

// 旧占位符
placeholder="pantheon_tenant_db"

// 新占位符 (方案A)
placeholder="pt_default"
```

### 2. 文档更新

#### 更新设计文档
```yaml
# docs/design/DATABASE_DESIGN.md

# 旧命名
pantheon_tenant_{tenant_id}

# 新命名 (方案A)
pt_{tenant_id}
```

#### 更新API文档
```yaml
# docs/design/API_DESIGN.md

# 旧示例
"database_name": "pantheon_tenant_globex"

# 新示例 (方案A)  
"database_name": "pt_globex"
```

### 3. 配置更新

#### 更新环境变量示例
```bash
# backend/.env.example

# 旧示例命名
PANTHEON_DEFAULT_DB_NAME=pantheon_tenant_default

# 新示例 (方案A)
PANTHEON_DEFAULT_DB_NAME=pt_default
```

#### 更新配置示例文件
```yaml
# backend/config.example.yaml

# 旧命名
database: pantheon_tenant_{tenant_id}

# 新命名 (方案A)
database: pt_{tenant_id}
```

### 4. 迁移脚本 (可选)

如果需要重命名现有数据库：
```sql
-- 重命名数据库脚本
-- ⚠️ 谨慎操作，建议先备份

RENAME DATABASE pantheon_tenant_default TO pt_default;
RENAME DATABASE pantheon_tenant_acme TO pt_acme;
```

## 📋 命名规范建议

### 标准格式
```
pt_{tenant_code}
```

### 规则说明
- **pt**: 固定前缀，代表Pantheon Platform
- **tenant_code**: 租户代码，建议3-12字符
- **字符限制**: 仅允许小写字母、数字、下划线
- **长度限制**: 总长度建议不超过16字符

### 命名示例
```yaml
标准租户:
  - pt_default   (平台默认租户)
  - pt_acme      (ACME公司)
  - pt_globex     (Globex企业)

编码租户:
  - pt_t001      (租户编号001)
  - pt_client_a  (客户A)
  
环境租户:
  - pt_dev       (开发环境)
  - pt_staging   (测试环境)
  - pt_prod      (生产环境)
```

## ⚠️ 注意事项

### 兼容性考虑
1. **现有租户**: 旧租户保持现有命名
2. **新租户**: 使用新命名规范
3. **API兼容**: 保持API向后兼容
4. **文档更新**: 同步更新所有相关文档

### 实施步骤
1. ✅ **第一阶段**: 更新文档和示例
2. ✅ **第二阶段**: 更新前端占位符和提示
3. ✅ **第三阶段**: 新租户使用新命名
4. ⚠️ **第四阶段** (可选): 迁移现有租户

## 📊 效果对比

### 长度优化
```
旧命名: pantheon_tenant_globex (21字符)
新命名: pt_globex               (9字符)
优化率: 57% 更短
```

### 操作便利性
```bash
# 旧命名 (输入繁琐)
mysql> USE pantheon_tenant_globex;
SHOW TABLES FROM pantheon_tenant_globex;

# 新命名 (输入便捷)
mysql> USE pt_globex;
SHOW TABLES FROM pt_globex;
```

### 可读性提升
```
日志文件:
旧: pantheon_tenant_globex.log
新: pt_globex.log

错误信息:
旧: "Connection failed to pantheon_tenant_globex"
新: "Connection failed to pt_globex"
```

---

**推荐方案**: 🏆 **方案A - PT前缀**  
**实施优先级**: 📈 **中等** (建议在新租户中实施)  
**兼容性影响**: ✅ **低** (仅影响新租户创建)
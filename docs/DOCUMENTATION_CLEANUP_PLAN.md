# 文档清理计划

## 执行时间：2026-04-06
## 目标：清理中间性、检查性、todo性质的文档

---

## 📋 文档分类分析

### ✅ 应保留的核心文档 (设计文档)

**平台级设计文档：**
- `docs/DOCS_INDEX.md` - 文档索引
- `docs/auth/AUTH_SECURITY.md` - 认证安全设计
- `docs/auth/AUTH_SESSION_STRATEGY.md` - 会话策略设计
- `docs/system/SYSTEM_MANAGEMENT.md` - 系统管理设计
- `docs/tenant/TENANT_INITIALIZATION.md` - 租户初始化设计
- `docs/frontend/FRONTEND_ARCHITECTURE.md` - 前端架构设计
- `docs/api/API_DESIGN_STANDARDS.md` - API设计规范
- `docs/SYSTEM_IMPROVEMENT_RECOMMENDATIONS.md` - 系统改进建议
- `docs/QUICK_FIXES.md` - 快速修复指南

**后端实现文档：**
- `backend/BACKEND_GUIDE.md` - 后端工程总览
- `backend/docs/BACKEND_DOCS_INDEX.md` - 后端文档索引
- `backend/docs/auth/AUTH_BACKEND.md` - 认证后端实现
- `backend/docs/system/SYSTEM_BACKEND.md` - 系统管理后端实现
- `backend/docs/tenant/TENANT_BACKEND.md` - 租户后端实现

**前端实现文档：**
- `frontend/docs/auth/AUTH_FRONTEND.md` - 认证前端实现
- `frontend/docs/system/SYSTEM_FRONTEND.md` - 系统管理前端实现

**治理规范文档：**
- `docs/governance/DOCUMENTATION_CONVENTIONS.md` - 文档规范
- `docs/governance/ENCODING_AND_LINE_ENDINGS.md` - 编码规范
- `docs/governance/I18N_KEY_CONVENTIONS.md` - 国际化key规范
- `docs/governance/GIT_COMMIT_GUIDE.md` - Git提交规范
- `docs/governance/TEAM_MODE_GUIDE.md` - 团队协作指南

**AI代理指导文档：**
- `AGENTS.md` - 主代理规则
- `backend/AGENTS.md` - 后端代理规则
- `frontend/AGENTS.md` - 前端代理规则
- `docs/AGENTS.md` - 文档代理规则
- `backend/docs/AGENTS.md` - 后端文档代理规则

### 🗑️ 应删除的中间性文档

**执行计划类文档：**
- `backend/docs/BACKEND_NORMALIZATION_PLAN.md` - 后端规范化执行计划（已完成）
- `backend/docs/BACKEND_NORMALIZATION_PLAN.en.md` - 英文版（已完成）

**检查清单类文档：**
- `docs/governance/SYSTEM_CHECKLIST.md` - 系统功能检查清单（2026-03-24审计，已过时）
- `backend/docs/system/SYSTEM_SWAGGER_COVERAGE.md` - Swagger覆盖检查文档

**特定发布文档：**
- `backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md` - 特定发布迁移文档（2026-04-01发布，已过时）

**临时/重复文档：**
- `backend/AGENTS.md` - 与根目录AGENTS.md重复
- `docs/AGENTS.md` - 与根目录AGENTS.md重复
- `backend/docs/AGENTS.md` - 与根目录AGENTS.md重复

### 📁 应移动到archive的文档

**历史审计文档：**
- `docs/governance/SYSTEM_CHECKLIST.md` → `docs/archive/SYSTEM_CHECKLIST_2026-03-24.md`

**历史发布文档：**
- `backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md` → `docs/archive/BACKEND_RELEASE_2026-04-01.md`

---

## 🔧 清理操作

### 1. 删除重复的AGENTS.md文件

```bash
# 删除重复的AGENTS.md文件
rm backend/AGENTS.md
rm docs/AGENTS.md  
rm backend/docs/AGENTS.md
rm frontend/AGENTS.md
rm frontend/docs/AGENTS.md

# 只保留根目录的AGENTS.md作为主规则文件
```

### 2. 创建archive目录并移动历史文档

```bash
# 创建archive目录
mkdir -p docs/archive
mkdir -p backend/docs/archive

# 移动历史文档
mv docs/governance/SYSTEM_CHECKLIST.md docs/archive/SYSTEM_CHECKLIST_2026-03-24.md
mv backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md docs/archive/BACKEND_RELEASE_2026-04-01.md
mv backend/docs/system/SYSTEM_SWAGGER_COVERAGE.md backend/docs/archive/
```

### 3. 删除已完成的执行计划

```bash
# 删除已完成的规范化执行计划
rm backend/docs/BACKEND_NORMALIZATION_PLAN.md
rm backend/docs/BACKEND_NORMALIZATION_PLAN.en.md
```

### 4. 创建README说明archive目录

```bash
# 创建archive目录说明
cat > docs/archive/README.md << 'EOF'
# Archive Directory

This directory contains historical documents and checklists that are kept for reference purposes but are no longer actively maintained.

## Contents

- `SYSTEM_CHECKLIST_2026-03-24.md` - Historical system audit checklist
- `BACKEND_RELEASE_2026-04-01.md` - Historical release migration guide

## Note

Documents in this directory are kept for historical reference only. They may not reflect the current state of the system.
EOF
```

---

## 📊 清理后的文档结构

### 核心文档 (保留)

```
pantheon-platform/
├── AGENTS.md (主代理规则)
├── README.md
├── docs/
│   ├── DOCS_INDEX.md
│   ├── auth/
│   │   ├── AUTH_SECURITY.md
│   │   └── AUTH_SESSION_STRATEGY.md
│   ├── system/
│   │   ├── SYSTEM_MANAGEMENT.md
│   │   └── UI_DESIGN.md
│   ├── tenant/
│   │   └── TENANT_INITIALIZATION.md
│   ├── frontend/
│   │   └── FRONTEND_ARCHITECTURE.md
│   ├── api/
│   │   └── API_DESIGN_STANDARDS.md
│   ├── governance/
│   │   ├── DOCUMENTATION_CONVENTIONS.md
│   │   ├── ENCODING_AND_LINE_ENDINGS.md
│   │   ├── I18N_KEY_CONVENTIONS.md
│   │   ├── GIT_COMMIT_GUIDE.md
│   │   └── TEAM_MODE_GUIDE.md
│   ├── notification/
│   ├── deploy/
│   ├── SYSTEM_IMPROVEMENT_RECOMMENDATIONS.md
│   ├── QUICK_FIXES.md
│   ├── PERFORMANCE_GUIDE.md
│   └── archive/ (新建)
│       ├── SYSTEM_CHECKLIST_2026-03-24.md
│       └── BACKEND_RELEASE_2026-04-01.md
├── backend/
│   ├── BACKEND_GUIDE.md
│   ├── README.md
│   └── docs/
│       ├── BACKEND_DOCS_INDEX.md
│       ├── BACKEND_NAMING_CONVENTIONS.md
│       ├── auth/
│       │   └── AUTH_BACKEND.md
│       ├── system/
│       │   └── SYSTEM_BACKEND.md
│       ├── tenant/
│       │   └── TENANT_BACKEND.md
│       └── archive/ (新建)
│           └── SYSTEM_SWAGGER_COVERAGE.md
└── frontend/
    └── docs/
        ├── auth/
        │   └── AUTH_FRONTEND.md
        └── system/
            └── SYSTEM_FRONTEND.md
```

---

## ⚠️ 清理原则

1. **保留设计文档** - 所有业务设计、架构设计文档都保留
2. **保留指导文档** - AGENTS.md等指导性文档保留
3. **清理执行计划** - 已完成的执行计划删除
4. **归档历史文档** - 有历史价值的检查清单、发布文档归档
5. **删除重复文档** - 删除重复的AGENTS.md文件

---

## 🎯 预期结果

清理后的文档结构将：
- **更加清晰** - 只保留有效的设计和指导文档
- **更易维护** - 减少重复和过时文档
- **更专业** - 历史文档妥善归档
- **更规范** - 统一的文档组织结构

---

**执行建议：** 在执行清理前，建议先备份当前文档状态，确保不会丢失重要信息。
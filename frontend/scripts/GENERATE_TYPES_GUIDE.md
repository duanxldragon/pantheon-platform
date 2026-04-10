# API Types 自动生成指南

## 概述

本指南说明如何从后端 OpenAPI/Swagger 规范自动生成前端的 TypeScript 类型定义。

---

## 方法 1: 从运行的后端服务器生成（推荐）

### 前提条件
- 后端服务器正在运行（http://localhost:8080）
- 已安装 `openapi-typescript`

### 步骤

1. **生成类型定义**:
```bash
cd frontend
npx openapi-typescript http://localhost:8080/swagger/doc.json -o src/api/types.ts
```

2. **使用生成的类型**:
```typescript
import { components } from './api/types';

// 使用类型
type User = components['schemas']['UserResponse'];
type LoginRequest = components['schemas']['LoginRequest'];
```

### 简化的使用方式

在 `src/api/index.ts` 中创建便捷导出：

```typescript
// src/api/index.ts
export * as ApiTypes from './types';

// 使用
import { ApiTypes } from '@/api';
const user: ApiTypes.components['schemas']['UserResponse'];
```

---

## 方法 2: 使用本地 Swagger 文件

### 步骤

1. **确保后端 Swagger 已生成**:
```bash
cd backend
make swagger
```

2. **复制生成的 swagger 文件**:
```bash
# 复制到前端可访问的位置
cp backend/api/swagger/doc.json frontend/public/swagger.json
```

3. **生成类型**:
```bash
cd frontend
npx openapi-typescript ./public/swagger.json -o src/api/types.ts
```

---

## 方法 3: 手动维护类型定义（当前方案）

鉴于后端 Swagger 生成存在一些问题，当前使用手动维护的类型定义。

### 类型定义位置

```
frontend/src/modules/
├── auth/types/index.ts         # Auth 模块类型
├── system/types/index.ts        # System 模块类型
└── tenant/types/index.ts        # Tenant 模块类型
```

### 类型定义模板

#### 基础实体类型

```typescript
// frontend/src/modules/system/types/user.ts
export interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'locked';
  departmentId?: string;
  departmentName?: string;
  positionId?: string;
  positionName?: string;
  roleIds: string[];
  roleNames: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export interface UserFormData {
  username: string;
  realName: string;
  email: string;
  phone: string;
  password?: string;
  departmentId?: string;
  positionId?: string;
  roleIds?: string[];
  status?: 'active' | 'inactive';
}
```

#### API 响应类型

```typescript
// frontend/src/api/types.ts
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResult<T = unknown> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}
```

---

## 自动化脚本

### 创建生成脚本

**文件**: `frontend/scripts/generate-types.sh`

```bash
#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================"
echo -e "  API Types Generator"
echo -e "======================================${NC}"

# 检查后端服务器是否运行
echo -e "${YELLOW}检查后端服务器...${NC}"
if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}✓ 后端服务器运行中${NC}"
else
    echo -e "${RED}✗ 后端服务器未运行${NC}"
    echo -e "${YELLOW}请先启动后端服务器:${NC}"
    echo -e "  cd backend && make run"
    exit 1
fi

# 生成类型定义
echo -e "${YELLOW}生成类型定义...${NC}"
cd frontend
npx openapi-typescript http://localhost:8080/swagger/doc.json -o src/api/types.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 类型定义生成成功${NC}"
    echo -e "${GREEN}  文件位置: frontend/src/api/types.ts${NC}"
else
    echo -e "${RED}✗ 类型定义生成失败${NC}"
    exit 1
fi

echo -e "${GREEN}======================================"
echo -e "  完成！"
echo -e "======================================${NC}"
```

### 添加到 package.json

**文件**: `frontend/package.json`

```json
{
  "scripts": {
    "generate:types": "bash scripts/generate-types.sh",
    "generate:types:local": "npx openapi-typescript ./public/swagger.json -o src/api/types.ts",
    "prebuild": "npm run generate:types || echo 'Warning: Type generation failed, using existing types'"
  }
}
```

---

## CI/CD 集成

### GitHub Actions 示例

**文件**: `.github/workflows/generate-types.yml`

```yaml
name: Generate API Types

on:
  push:
    paths:
      - 'backend/internal/modules/**/*_dto.go'
      - 'backend/internal/app/swagger.go'
  workflow_dispatch:

jobs:
  generate-types:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.24'
      
      - name: Generate Swagger
        run: |
          cd backend
          go mod download
          make swagger
      
      - name: Start backend server
        run: |
          cd backend
          go run cmd/server &
          sleep 10
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci --legacy-peer-deps
      
      - name: Generate API types
        run: |
          cd frontend
          npx openapi-typescript http://localhost:8080/swagger/doc.json -o src/api/types.ts
      
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add frontend/src/api/types.ts
          git commit -m "chore: auto-generate API types from backend"
          git push
```

---

## 最佳实践

### 1. 类型命名规范

- 后端 DTO: `XxxRequest` / `XxxResponse`
- 前端类型: 直接使用实体名称，如 `User`, `Role`
- 表单数据: `XxxFormData`

### 2. 可选字段处理

```typescript
// 后端: *string (指针类型)
// 前端: string | undefined

interface User {
  departmentId: string | null;  // 后端的 *string
  positionId?: string;          // 可选字段
}
```

### 3. 枚举类型

```typescript
// 后端: string with binding:"oneof=active inactive"
// 前端: 联合类型

type UserStatus = 'active' | 'inactive' | 'locked';
type RoleType = 'system' | 'custom';
```

### 4. 分页响应

```typescript
interface PageResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// 使用
const result = await userApi.listUsers();
// result.items: User[]
// result.pagination.total: number
```

---

## 故障排查

### 问题 1: Swagger 生成失败

**错误**: `missing ',' in argument list`

**解决方案**:
1. 检查后端代码语法错误
2. 修复所有 Go 语法错误
3. 重新运行 `make swagger`

### 问题 2: 类型定义与 API 不匹配

**原因**: 后端 DTO 已更新，但前端类型未同步

**解决方案**:
1. 运行 `npm run generate:types` 重新生成
2. 或手动更新类型定义
3. 确保 API 响应结构与类型定义一致

### 问题 3: openapi-typescript 安装失败

**解决方案**:
```bash
npm install --save-dev openapi-typescript --legacy-peer-deps
```

---

## 维护清单

- [ ] 定期更新类型定义（后端 DTO 变更后）
- [ ] 验证类型定义与实际 API 一致性
- [ ] 运行 `npm run type-check` 确保无类型错误
- [ ] 在 CI/CD 中自动生成类型

---

**最后更新**: 2026-04-10  
**维护者**: Backend & Frontend Teams

# Frontend Scripts

本目录包含前端项目的自动化脚本。

---

## 可用脚本

### 1. generate-types.js (推荐 - 跨平台)

**用途**: 从后端 OpenAPI/Swagger 规范自动生成前端 TypeScript 类型定义

**使用方法**:

```bash
# Windows / macOS / Linux 通用
cd frontend
npm run generate:types

# 或从本地 swagger 文件生成
npm run generate:types:local
```

**优点**:
- ✅ 跨平台兼容
- ✅ 不依赖 bash
- ✅ 使用 Node.js，已在项目依赖中

**前提条件**:
- 后端服务器正在运行（http://localhost:8080）
- 或已复制 swagger 文件到 `frontend/public/swagger.json`

**输出文件**:
- `frontend/src/api/types.ts` - 自动生成的类型定义

### 2. generate-types.ps1 (Windows PowerShell)

**用途**: Windows PowerShell 专用的类型生成脚本

**使用方法**:

```powershell
cd frontend\scripts
.\generate-types.ps1
```

**优点**:
- ✅ 原生 Windows 支持
- ✅ 彩色输出
- ✅ 详细的错误提示

### 3. generate-types.sh (Linux/macOS bash)

**用途**: Linux/macOS bash 专用的类型生成脚本

**使用方法**:

```bash
cd frontend
bash scripts/generate-types.sh
```

---

## 开发工作流（Windows）

### 日常开发

1. **修改后端 DTO**:
   ```powershell
   # 修改 backend/internal/modules/*/xxx_dto.go
   ```

2. **重新生成类型**:
   ```powershell
   cd frontend
   npm run generate:types
   ```

3. **验证类型**:
   ```powershell
   npm run type-check
   ```

### 首次设置

1. **安装依赖**:
   ```powershell
   cd frontend
   npm ci --legacy-peer-deps
   ```

2. **启动后端**:
   ```powershell
   cd backend
   go run cmd/server\main.go
   # 或使用 Git Bash
   make run
   ```

3. **生成类型**:
   ```powershell
   cd frontend
   npm run generate:types
   ```

---

## 开发工作流（Git Bash / WSL）

### 日常开发

1. **修改后端 DTO**:
   ```bash
   # 修改 backend/internal/modules/*/xxx_dto.go
   ```

2. **重新生成类型**:
   ```bash
   cd frontend
   npm run generate:types
   ```

3. **验证类型**:
   ```bash
   npm run type-check
   ```

### 首次设置

1. **安装依赖**:
   ```bash
   cd frontend
   npm ci --legacy-peer-deps
   ```

2. **启动后端**:
   ```bash
   cd backend
   make run
   ```

3. **生成类型**:
   ```bash
   cd frontend
   npm run generate:types
   ```

---

## 脚本对比

| 特性 | generate-types.js | generate-types.ps1 | generate-types.sh |
|-----|------------------|-------------------|-----------------|
| **跨平台** | ✅ 是 | ❌ 仅 Windows | ❌ 仅 Linux/macOS |
| **依赖** | Node.js | PowerShell | Bash |
| **CI/CD** | ✅ 推荐 | ⚠️ 需要 PowerShell | ⚠️ 需要 Bash |
| **颜色输出** | ✅ 支持 | ✅ 支持 | ✅ 支持 |

---

## 详细使用指南

请参阅：[API 类型生成详细指南](./GENERATE_TYPES_GUIDE.md)

---

## 故障排查

### 问题: 后端服务器未运行

**错误信息**:
```
✗ 后端服务器未运行
```

**解决方案**:

**Windows (PowerShell)**:
```powershell
cd backend
go run cmd/server\main.go
```

**Windows (Git Bash)**:
```bash
cd backend
make run
```

**问题: 找不到 swagger.json**

**解决方案**:

**Windows PowerShell**:
```powershell
# 1. 生成 swagger 文档（需要先修复代码错误）
cd backend
# 注意：当前 swagger 生成有错误，需要先修复

# 2. 复制到前端（如果有 swagger 文件）
copy backend\api\swagger\doc.json frontend\public\swagger.json

# 3. 重新生成类型
cd frontend
npm run generate:types:local
```

**Windows Git Bash**:
```bash
# 1. 生成 swagger 文档
cd backend
make swagger

# 2. 复制到前端
cp backend/api/swagger/doc.json frontend/public/swagger.json

# 3. 重新生成类型
cd frontend
npm run generate:types:local
```

### 问题: 类型生成失败

**检查项**:
1. 后端服务器是否正常运行
2. swagger/doc.json 是否可访问
3. 网络连接是否正常
4. openapi-typescript 是否已安装

---

## CI/CD 集成

自动化流程已配置在：
- `.github/workflows/generate-types.yml`

**触发条件**:
- 推送到 main 分支
- 修改 `backend/internal/modules/**/*_dto.go`
- 修改 `backend/internal/app/swagger.go`
- 手动触发 workflow_dispatch

**自动化流程**:
1. 检出代码
2. 安装依赖
3. 生成 swagger 文档
4. 启动后端服务器
5. 生成前端类型定义
6. 运行类型检查
7. 自动提交生成的类型

---

## 最佳实践

### 1. 定期更新类型定义

- 后端 DTO 变更后立即更新
- 每次拉取后端代码后运行类型生成
- 在 CI/CD 中自动生成

### 2. 使用跨平台脚本

**推荐使用 `generate-types.js`**，因为：
- ✅ 在所有平台上都能运行
- ✅ 不需要额外的 shell
- ✅ 易于在 CI/CD 中使用

### 3. 类型命名规范

生成的类型使用后端的 DTO 名称：
- `UserRequest` → `components['schemas']['UserRequest']`
- `UserResponse` → `components['schemas']['UserResponse']`

### 4. 创建便捷导出

为了简化使用，可以在 `src/api/types.ts` 中创建类型别名：

```typescript
// src/api/types.ts
import { components } from './generated/types';

// 类型别名
export type User = components['schemas']['UserResponse'];
export type Role = components['schemas']['RoleResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];

// 或直接导出 components
export { components };
```

使用时：
```typescript
import { User } from '@/api/types';
// 或
import { components } from '@/api/types';
type User = components['schemas']['UserResponse'];
```

---

## 相关文档

- [API 类型生成详细指南](./GENERATE_TYPES_GUIDE.md)
- [后端开发指南](../../backend/BACKEND_GUIDE.md)
- [前端开发指南](../../frontend/FRONTEND_GUIDE.md)

---

**维护者**: Frontend Team  
**最后更新**: 2026-04-10

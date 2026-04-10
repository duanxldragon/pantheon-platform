# 开发者指南

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **适用对象**: 全栈开发人员
- **技术栈**: React 19 + Go 1.21 + MySQL 8.0

## 🎯 开发概述

### 项目架构
Pantheon Platform 是一个多租户企业级管理系统，采用前后端分离架构：

```
┌─────────────────────────────────────────────────┐
│              Frontend (React 19)                │
│  TypeScript + Vite + Zustand + React Router    │
└─────────────────────────────────────────────────┘
                      │ HTTP/REST API
                      ↓
┌─────────────────────────────────────────────────┐
│               Backend (Go 1.21)                 │
│        Gin + GORM + JWT + Validator            │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ↓                           ↓
┌──────────────┐          ┌──────────────┐
│  MySQL 8.0   │          │  Redis 7.0   │
│  (数据存储)  │          │   (缓存)     │
└──────────────┘          └──────────────┘
```

### 开发环境要求

**前端开发**:
```yaml
Node.js: >= 18.0.0
npm: >= 9.0.0
浏览器: Chrome/Edge最新版 (开发调试)
IDE: VS Code / WebStorm
```

**后端开发**:
```yaml
Go: >= 1.21
MySQL: >= 8.0
Redis: >= 7.0
IDE: VS Code / GoLand
```

## 🚀 快速开始

### 1. 克隆项目
```bash
# 克隆仓库
git clone https://github.com/your-org/pantheon-platform.git
cd pantheon-platform
```

### 2. 数据库设置

**安装MySQL**:
```bash
# macOS
brew install mysql
brew services start mysql

# Ubuntu
sudo apt update
sudo apt install mysql-server

# Windows
# 下载并安装MySQL Installer
```

**创建数据库**:
```sql
-- 创建主数据库
CREATE DATABASE pantheon_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'pantheon'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON pantheon_master.* TO 'pantheon'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 安装Redis

**macOS**:
```bash
brew install redis
brew services start redis
```

**Ubuntu**:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**Windows**:
```bash
# 使用WSL或Docker
docker run -d -p 6379:6379 redis:7.0-alpine
```

### 4. 后端设置

```bash
cd backend

# 安装依赖
go mod download

# 复制配置文件
cp config/config.example.yaml config/config.yaml

# 编辑配置文件，修改数据库连接等
vim config/config.yaml

# 运行数据库迁移
go run cmd/migrate/main.go

# 启动开发服务器
go run cmd/server/main.go
```

**配置文件示例** (`config/config.yaml`):
```yaml
server:
  port: 8080
  mode: debug # debug, release

database:
  host: localhost
  port: 3306
  username: pantheon
  password: your_password
  database: pantheon_master
  max_open_conns: 50
  max_idle_conns: 10

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

jwt:
  secret: your_jwt_secret_key
  access_token_duration: 7200    # 2 hours
  refresh_token_duration: 604800 # 7 days
```

### 5. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量（如果需要）
vim .env

# 启动开发服务器
npm run dev
```

**环境变量示例** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_APP_NAME=Pantheon Platform
```

### 6. 访问应用

- **前端**: http://localhost:5173
- **后端API**: http://localhost:8080
- **Swagger文档**: http://localhost:8080/swagger/index.html

**默认账户**:
```
用户名: admin
密码: Admin@123
```

## 📁 项目结构

### 前端结构
```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── main.tsx           # 应用入口
│   ├── App.tsx            # 根组件
│   ├── vite-env.d.ts      # Vite类型声明
│   │
│   ├── shared/            # 共享模块
│   │   ├── components/    # 通用组件
│   │   ├── utils/         # 工具函数
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── types/         # TypeScript类型
│   │   └── constants/     # 常量定义
│   │
│   ├── modules/           # 功能模块
│   │   ├── auth/          # 认证模块
│   │   ├── system/        # 系统管理
│   │   ├── tenant/        # 租户管理
│   │   └── notification/  # 通知管理
│   │
│   └── styles/            # 全局样式
│       ├── globals.css
│       └── variables.css
│
├── tests/                 # 测试文件
│   ├── unit/              # 单元测试
│   ├── e2e/               # E2E测试
│   └── fixtures/          # 测试数据
│
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript配置
├── vite.config.mjs        # Vite配置
└── .env.example           # 环境变量示例
```

### 后端结构
```
backend/
├── cmd/                   # 应用入口
│   ├── server/            # 主服务器
│   │   └── main.go
│   └── migrate/           # 数据库迁移
│       └── main.go
│
├── internal/              # 内部应用代码
│   ├── config/            # 配置管理
│   ├── middleware/        # 中间件
│   │   ├── auth.go        # 认证中间件
│   │   ├── cors.go        # CORS中间件
│   │   └── logger.go      # 日志中间件
│   │
│   ├── modules/           # 业务模块
│   │   ├── auth/          # 认证模块
│   │   ├── user/          # 用户管理
│   │   ├── role/          # 角色管理
│   │   ├── tenant/        # 租户管理
│   │   └── notification/  # 通知管理
│   │
│   ├── shared/            # 共享代码
│   │   ├── database/      # 数据库连接
│   │   ├── cache/         # 缓存管理
│   │   ├── logger/        # 日志工具
│   │   ├── validator/     # 数据验证
│   │   └── response/      # 响应封装
│   │
│   └── models/            # 数据模型
│       ├── user.go
│       ├── role.go
│       └── tenant.go
│
├── pkg/                   # 可被外部使用的库
│   └── api/               # API定义
│
├── configs/               # 配置文件
│   └── config.yaml
│
├── go.mod                 # Go模块定义
└── go.sum                 # 依赖版本锁定
```

## 💻 开发工作流

### Git工作流

#### 分支策略
```yaml
main:
  description: 主分支，始终保持稳定可发布状态
  protection: 
    - require pull request
    - require status checks

develop:
  description: 开发分支，集成最新功能
  merge_to: main via PR

feature/xxx:
  description: 功能分支，从develop分出
  merge_to: develop via PR

bugfix/xxx:
  description: 缺陷修复分支
  merge_to: develop via PR

hotfix/xxx:
  description: 紧急修复分支，从main分出
  merge_to: main & develop via PR
```

#### 提交规范
```bash
# 提交格式
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```bash
# 新功能
git commit -m "feat(auth): add JWT refresh token support"

# Bug修复
git commit -m "fix(user): resolve pagination bug in user list"

# 文档
git commit -m "docs(readme): update setup instructions"

# 重构
git commit -m "refactor(api): simplify response wrapper"
```

### 开发流程

#### 1. 创建功能分支
```bash
# 更新develop分支
git checkout develop
git pull origin develop

# 创建功能分支
git checkout -b feature/user-management
```

#### 2. 开发功能

**前端开发**:
```typescript
// 1. 创建模块目录
mkdir -p src/modules/user-management
cd src/modules/user-management

// 2. 创建文件
// - index.tsx        # 主页面
// - api.ts          # API调用
// - types.ts        # 类型定义
// - hooks.ts        # 自定义Hooks
// - components/     # 子组件

// 3. 实现功能
```

**后端开发**:
```go
// 1. 创建模块目录
mkdir -p internal/modules/user
cd internal/modules/user

// 2. 创建文件
// - handler.go      # HTTP处理器
// - service.go      # 业务逻辑
// - repository.go   # 数据访问
// - model.go        # 数据模型
// - router.go       # 路由定义

// 3. 实现功能
```

#### 3. 编写测试
```bash
# 前端测试
npm run test:unit        # 单元测试
npm run test:e2e         # E2E测试

# 后端测试
cd backend
go test ./...            # 运行所有测试
go test -v ./internal/modules/user  # 运行模块测试
go test -cover ./...     # 测试覆盖率
```

#### 4. 代码审查
```bash
# 提交代码
git add .
git commit -m "feat(user): add user CRUD operations"

# 推送到远程
git push origin feature/user-management

# 创建Pull Request
# 在GitHub上创建PR，请求合并到develop
```

#### 5. 合并代码
- 代码审查通过后合并到develop
- 定期从develop发布到main

## 🧩 开发规范

### 前端开发规范

#### 1. TypeScript规范

**类型定义**:
```typescript
// ✅ Good: 明确定义类型
interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  status: 'active' | 'inactive' | 'locked';
  createdAt: Date;
}

const getUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// ❌ Bad: 使用any类型
const getUser = async (id: string): Promise<any> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};
```

**组件Props**:
```typescript
// ✅ Good: 明确Props类型
interface UserListProps {
  users: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading = false,
  onEdit,
  onDelete,
}) => {
  // 组件实现
};

// ❌ Bad: 没有类型定义
export const UserList = ({ users, loading, onEdit, onDelete }: any) => {
  // 组件实现
};
```

#### 2. React最佳实践

**组件结构**:
```typescript
// ✅ Good: 清晰的组件结构
export const UserForm: React.FC<UserFormProps> = ({ onSubmit, user }) => {
  // 1. Hooks声明
  const [formData, setFormData] = useState<UserFormData>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // 2. 副作用
  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);
  
  // 3. 事件处理
  const handleChange = (field: string) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };
  
  // 4. 渲染
  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
};
```

**状态管理**:
```typescript
// ✅ Good: 使用Zustand进行状态管理
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: async (credentials) => {
    const response = await authApi.login(credentials);
    set({ 
      user: response.data.user, 
      token: response.data.access_token 
    });
  },
  logout: () => {
    set({ user: null, token: null });
  },
}));

// 组件中使用
export const LoginForm: React.FC = () => {
  const { login } = useAuthStore();
  
  const handleSubmit = async (data: LoginFormData) => {
    await login(data);
  };
  
  return <Form onSubmit={handleSubmit} />;
};
```

#### 3. API调用规范

**API客户端封装**:
```typescript
// ✅ Good: 统一的API调用
import { api } from '@/shared/utils/apiClient';

export const userApi = {
  // 获取用户列表
  list: (params: UserQueryParams) =>
    api.get<UserListResponse>('/system/users', { params }),
  
  // 获取用户详情
  get: (id: string) =>
    api.get<User>(`/system/users/${id}`),
  
  // 创建用户
  create: (data: UserCreateRequest) =>
    api.post<User>('/system/users', data),
  
  // 更新用户
  update: (id: string, data: UserUpdateRequest) =>
    api.put<User>(`/system/users/${id}`, data),
  
  // 删除用户
  delete: (id: string) =>
    api.delete(`/system/users/${id}`),
};
```

**错误处理**:
```typescript
// ✅ Good: 统一的错误处理
const handleSubmit = async () => {
  try {
    setLoading(true);
    await userApi.create(formData);
    toast.success('用户创建成功');
    router.push('/system/users');
  } catch (error) {
    if (error instanceof ValidationError) {
      setErrors(error.fields);
    } else if (error instanceof ApiError) {
      toast.error(error.message);
    } else {
      toast.error('未知错误');
    }
  } finally {
    setLoading(false);
  }
};
```

### 后端开发规范

#### 1. Go代码规范

**项目结构**:
```go
// ✅ Good: 清晰的包结构
// internal/modules/user/handler.go
package user

import (
    "github.com/gin-gonic/gin"
    "pantheon-platform/internal/shared/response"
)

type Handler struct {
    service *Service
}

func NewHandler(service *Service) *Handler {
    return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
    r.GET("/users", h.ListUsers)
    r.GET("/users/:id", h.GetUser)
    r.POST("/users", h.CreateUser)
    r.PUT("/users/:id", h.UpdateUser)
    r.DELETE("/users/:id", h.DeleteUser)
}
```

**错误处理**:
```go
// ✅ Good: 统一的错误处理
package response

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

type ErrorResponse struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}

func Error(c *gin.Context, statusCode int, code string, message string, details any) {
    c.JSON(statusCode, gin.H{
        "success": false,
        "error": ErrorResponse{
            Code:    code,
            Message: message,
            Details: details,
        },
    })
}

// 使用示例
func (h *Handler) CreateUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", err)
        return
    }
    
    user, err := h.service.CreateUser(c.Request.Context(), &req)
    if err != nil {
        if errors.Is(err, ErrUserExists) {
            Error(c, http.StatusConflict, "USER_EXISTS", "用户已存在", nil)
            return
        }
        Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "服务器错误", nil)
        return
    }
    
    Success(c, user)
}
```

#### 2. 数据库操作规范

**Repository模式**:
```go
// ✅ Good: Repository模式
package user

import (
    "context"
    "gorm.io/gorm"
)

type Repository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, filter *UserFilter) ([]*User, int64, error)
}

type repository struct {
    db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
    return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

func (r *repository) GetByID(ctx context.Context, id string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).
        Where("id = ? AND deleted_at IS NULL", id).
        First(&user).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}
```

#### 3. 业务逻辑规范

**Service层**:
```go
// ✅ Good: Service层封装业务逻辑
package user

import (
    "context"
    "errors"
)

type Service struct {
    repo    Repository
    cache   Cache
    logger  Logger
}

func NewService(repo Repository, cache Cache, logger Logger) *Service {
    return &Service{
        repo:   repo,
        cache:  cache,
        logger: logger,
    }
}

func (s *Service) CreateUser(ctx context.Context, req *CreateUserRequest) (*User, error) {
    // 1. 参数验证
    if err := s.validateCreateRequest(req); err != nil {
        return nil, err
    }
    
    // 2. 业务规则检查
    exists, err := s.repo.ExistsByUsername(ctx, req.Username)
    if err != nil {
        s.logger.Error("failed to check user existence", "error", err)
        return nil, ErrInternal
    }
    if exists {
        return nil, ErrUserExists
    }
    
    // 3. 密码加密
    passwordHash, err := s.hashPassword(req.Password)
    if err != nil {
        return nil, err
    }
    
    // 4. 创建用户
    user := &User{
        Username:     req.Username,
        PasswordHash: passwordHash,
        RealName:     req.RealName,
        Email:        req.Email,
        Status:       "active",
    }
    
    if err := s.repo.Create(ctx, user); err != nil {
        s.logger.Error("failed to create user", "error", err)
        return nil, ErrInternal
    }
    
    // 5. 清除缓存
    s.cache.Delete(ctx, "user:list")
    
    return user, nil
}
```

## 🧪 测试规范

### 前端测试

#### 单元测试 (Vitest)
```typescript
// userApi.test.ts
import { describe, it, expect, vi } from 'vitest';
import { userApi } from './api';

describe('User API', () => {
  it('should fetch user list', async () => {
    // Mock response
    const mockUsers = [
      { id: '1', username: 'user1', realName: 'User 1' },
      { id: '2', username: 'user2', realName: 'User 2' },
    ];
    
    vi.mock('@/shared/utils/apiClient', () => ({
      api: {
        get: vi.fn().mockResolvedValue({ data: { items: mockUsers } }),
      },
    }));
    
    const result = await userApi.list({ page: 1, pageSize: 20 });
    
    expect(result.data.items).toEqual(mockUsers);
    expect(result.data.items).toHaveLength(2);
  });
});
```

#### E2E测试 (Playwright)
```typescript
// login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'Test@123');
    await page.click('[data-testid="loginButton"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="currentUser"]')).toBeVisible();
  });
});
```

### 后端测试

#### 单元测试
```go
// user_service_test.go
package user

import (
    "context"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

type MockRepository struct {
    mock.Mock
}

func (m *MockRepository) Create(ctx context.Context, user *User) error {
    args := m.Called(ctx, user)
    return args.Error(0)
}

func TestService_CreateUser(t *testing.T) {
    // 设置mock
    mockRepo := new(MockRepository)
    mockCache := new(MockCache)
    service := NewService(mockRepo, mockCache, nil)
    
    mockRepo.On("ExistsByUsername", mock.Anything, "testuser").Return(false, nil)
    mockRepo.On("Create", mock.Anything, mock.Anything).Return(nil)
    
    // 执行测试
    req := &CreateUserRequest{
        Username: "testuser",
        Password: "Password@123",
        RealName: "Test User",
        Email:    "test@example.com",
    }
    
    user, err := service.CreateUser(context.Background(), req)
    
    // 断言
    assert.NoError(t, err)
    assert.NotNil(t, user)
    assert.Equal(t, "testuser", user.Username)
    mockRepo.AssertExpectations(t)
}
```

## 📚 代码审查清单

### 前端代码审查

**功能**:
- [ ] 功能实现符合需求
- [ ] 边界情况处理完善
- [ ] 错误处理正确

**代码质量**:
- [ ] TypeScript类型定义完整
- [ ] 没有使用`any`类型
- [ ] 组件结构清晰
- [ ] Hook使用正确
- [ ] 没有代码重复

**性能**:
- [ ] 避免不必要的重渲染
- [ ] 使用了合适的缓存
- [ ] 大数据列表使用了虚拟化

**测试**:
- [ ] 有单元测试覆盖
- [ ] 测试用例充分
- [ ] 测试通过

### 后端代码审查

**功能**:
- [ ] API实现符合规范
- [ ] 错误处理完善
- [ ] 参数验证完整

**代码质量**:
- [ ] 代码结构清晰
- [ ] 遵循Go最佳实践
- [ ] 错误处理符合规范
- [ ] 日志记录充分

**安全性**:
- [ ] 输入验证
- [ ] SQL注入防护
- [ ] 权限验证

**测试**:
- [ ] 单元测试覆盖
- [ ] 测试充分
- [ ] 测试通过

## 🚢 部署流程

### 前端部署
```bash
# 1. 构建生产版本
npm run build

# 2. 部署到服务器
scp -r dist/* user@server:/var/www/html/

# 3. 配置Nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
    }
}
```

### 后端部署
```bash
# 1. 构建应用
go build -o pantheon-platform cmd/server/main.go

# 2. 创建systemd服务
sudo vim /etc/systemd/system/pantheon.service

# pantheon.service
[Unit]
Description=Pantheon Platform Backend
After=network.target mysql.service

[Service]
Type=simple
User=pantheon
WorkingDirectory=/opt/pantheon-platform
ExecStart=/opt/pantheon-platform/pantheon-platform
Restart=always

[Install]
WantedBy=multi-user.target

# 3. 启动服务
sudo systemctl start pantheon
sudo systemctl enable pantheon
```

---

**维护团队**: 开发组  
**更新频率**: 随项目更新  
**联系方式**: dev@pantheon.com
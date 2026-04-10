# 安全测试计划

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **测试类型**: 安全测试 (Security Testing)
- **测试环境**: Staging / 安全测试专用环境
- **测试工具**: OWASP ZAP, Burp Suite, Custom Scripts

## 🎯 测试目标

### 总体目标
识别系统安全漏洞，验证安全控制措施的有效性，确保系统符合安全合规要求。

### 具体目标
- **OWASP Top 10 漏洞覆盖率**: 100%
- **关键漏洞修复率**: 100%
- **安全测试自动化率**: ≥ 80%
- **安全扫描频率**: 每周至少1次
- **渗透测试覆盖率**: ≥ 90%

## 🔒 安全测试范围

### 1. 应用安全测试

#### 1.1 认证与授权测试

##### 测试目标
验证身份认证和授权机制的安全性。

##### 测试场景

**测试1: 弱密码检测**
```bash
# 测试脚本
#!/bin/bash
# scripts/security/test-weak-passwords.sh

WEAK_PASSWORDS=(
    "123456"
    "password"
    "12345678"
    "qwerty"
    "abc123"
    "monkey"
    "master"
    "dragon"
    "letmein"
    "login"
)

API_URL="http://localhost:8080/api/v1/auth/login"

for password in "${WEAK_PASSWORDS[@]}"; do
    echo "Testing weak password: $password"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"testuser\",\"password\":\"$password\"}")
    
    # 检查是否被拒绝
    if echo "$response" | grep -q "密码强度不足"; then
        echo "✓ Weak password rejected: $password"
    else
        echo "✗ SECURITY ISSUE: Weak password accepted: $password"
    fi
done
```

**测试2: 账户锁定机制**
```bash
# scripts/security/test-account-lockout.sh

#!/bin/bash
# 测试账户在多次失败登录后被锁定

USERNAME="testuser"
WRONG_PASSWORD="wrongpassword"
MAX_ATTEMPTS=5
API_URL="http://localhost:8080/api/v1/auth/login"

echo "Testing account lockout after $MAX_ATTEMPTS failed attempts..."

for i in $(seq 1 $((MAX_ATTEMPTS + 2))); do
    echo "Attempt $i:"
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$USERNAME\",\"password\":\"$WRONG_PASSWORD\"}")
    
    echo "Response: $response"
    
    if echo "$response" | grep -q "账户已被锁定"; then
        echo "✓ Account locked after $i attempts"
        break
    fi
    
    sleep 1
done

# 验证锁定后无法登录
if echo "$response" | grep -q "账户已被锁定"; then
    # 使用正确密码尝试登录
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$USERNAME\",\"password\":\"CorrectPassword123\"}")
    
    if echo "$response" | grep -q "账户已被锁定"; then
        echo "✓ Locked account cannot login"
    else
        echo "✗ SECURITY ISSUE: Locked account can still login"
    fi
fi
```

**测试3: 会话固定攻击**
```typescript
// tests/security/session-fixation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('会话固定攻击防护', () => {
  test('应该在登录后重新生成会话令牌', async ({ page, context }) => {
    // 1. 访问登录页面，获取初始会话Cookie
    await page.goto('/login');
    const initialCookies = await context.cookies();
    const sessionId = initialCookies.find(c => c.name === 'session_id')?.value;
    
    expect(sessionId).toBeDefined();
    
    // 2. 登录系统
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'Test@123');
    await page.click('[data-testid="loginButton"]');
    
    // 3. 登录后获取新的会话Cookie
    const newCookies = await context.cookies();
    const newSessionId = newCookies.find(c => c.name === 'session_id')?.value;
    
    // 4. 验证会话ID已变更
    expect(newSessionId).toBeDefined();
    expect(newSessionId).not.toBe(sessionId);
    
    console.log('✓ Session ID changed after login (prevents session fixation)');
  });
});
```

**测试4: 权限提升测试**
```typescript
// tests/security/privilege-escalation.spec.ts
test.describe('权限提升攻击防护', () => {
  test('普通用户不能通过修改请求提升权限', async ({ request }) => {
    // 1. 普通用户登录
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        username: 'normaluser',
        password: 'Normal@123'
      }
    });
    
    const { data: { access_token } } = await loginResponse.json();
    const headers = {
      'Authorization': `Bearer ${access_token}`
    };
    
    // 2. 尝试访问管理员接口
    const adminResponse = await request.get('/api/v1/system/admin/settings', {
      headers: headers
    });
    
    // 3. 验证访问被拒绝
    expect(adminResponse.status()).toBe(403);
    
    const errorData = await adminResponse.json();
    expect(errorData.message).toContain('权限不足');
    
    // 4. 尝试修改请求参数提升权限
    const elevateResponse = await request.patch('/api/v1/auth/permissions', {
      headers: headers,
      data: {
        role: 'admin'
      }
    });
    
    // 5. 验证权限提升失败
    expect([403, 404]).toContain(elevateResponse.status());
    
    console.log('✓ Privilege escalation attempt blocked');
  });
});
```

#### 1.2 输入验证测试

**测试5: SQL注入测试**
```typescript
// tests/security/sql-injection.spec.ts
const SQL_INJECTION_PAYLOADS = [
    "admin' OR '1'='1",
    "admin' UNION SELECT NULL,NULL,NULL--",
    "admin'; DROP TABLE users;--",
    "1' AND 1=1--",
    "admin' OR '1'='1'--",
    "'; EXEC xp_cmdshell('dir');--",
    "' OR 1=1#",
    "admin'/*comment*/OR/*comment*/'1'='1",
];

test.describe('SQL注入防护', () => {
  test.each(SQL_INJECTION_PAYLOADs)('应该阻止SQL注入: %s', async (payload, { request }) => {
    // 测试登录接口
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        username: payload,
        password: 'anypassword'
      }
    });
    
    // 验证登录失败
    expect(loginResponse.status()).not.toBe(200);
    
    // 验证错误消息不包含SQL错误
    const errorData = await loginResponse.json();
    expect(JSON.stringify(errorData)).not.toMatch(/SQL|syntax|mysql|database/i);
    
    console.log(`✓ SQL injection blocked: ${payload}`);
  });
});
```

**测试6: XSS攻击测试**
```typescript
// tests/security/xss.spec.ts
const XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(XSS)">',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '\'><script>alert(String.fromCharCode(88,83,83))</script>',
];

test.describe('XSS攻击防护', () => {
  test.each(XSS_PAYLOADS)('应该正确转义XSS负载: %s', async (payload, { page }) => {
    // 1. 登录系统
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'Test@123');
    await page.click('[data-testid="loginButton"]');
    
    // 2. 导航到用户管理
    await page.goto('/system/users');
    await page.click('[data-testid="createUserButton"]');
    
    // 3. 输入XSS负载到真实姓名字段
    await page.fill('[data-testid="realName"]', payload);
    await page.fill('[data-testid="username"]', 'xssuser');
    await page.fill('[data-testid="email"]', 'xss@example.com');
    await page.click('[data-testid="submitButton"]');
    
    // 4. 返回用户列表
    await page.goto('/system/users');
    
    // 5. 检查页面HTML源码
    const content = await page.content();
    
    // 6. 验证XSS负载被转义
    expect(content).not.toContain('<script>');
    expect(content).not.toContain('javascript:');
    expect(content).toContain('&lt;script&gt;');
    
    console.log(`✓ XSS payload properly escaped: ${payload}`);
  });
});
```

**测试7: CSRF攻击测试**
```typescript
// tests/security/csrf.spec.ts
test.describe('CSRF攻击防护', () => {
  test('应该验证CSRF令牌', async ({ page, request, context }) => {
    // 1. 用户登录
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'Test@123');
    await page.click('[data-testid="loginButton"]');
    
    // 2. 获取CSRF令牌
    const csrfToken = await page.evaluate(() => {
      return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    });
    
    expect(csrfToken).toBeDefined();
    
    // 3. 尝试不携带CSRF令牌的请求
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session_id');
    
    const maliciousRequest = await request.post('/api/v1/system/users', {
      headers: {
        'Cookie': `session_id=${sessionCookie?.value}`,
        'Content-Type': 'application/json',
      },
      data: {
        username: 'malicioususer',
        real_name: 'Malicious User',
        email: 'malicious@example.com'
      }
    });
    
    // 4. 验证请求被拒绝
    expect(maliciousRequest.status()).toBe(403);
    
    const errorData = await maliciousRequest.json();
    expect(errorData.message).toContain('CSRF');
    
    console.log('✓ CSRF protection working');
  });
});
```

#### 1.3 敏感数据处理测试

**测试8: 敏感数据暴露测试**
```bash
# scripts/security/test-sensitive-data-exposure.sh

#!/bin/bash
# 检查API响应中是否暴露敏感信息

API_URL="http://localhost:8080"
ENDPOINTS=(
    "/api/v1/auth/login"
    "/api/v1/system/users"
    "/api/v1/system/roles"
)

SENSITIVE_PATTERNS=(
    "password"
    "secret"
    "api_key"
    "access_token"
    "private_key"
    "token"
)

echo "Testing for sensitive data exposure in API responses..."

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testing endpoint: $endpoint"
    
    response=$(curl -s -X POST "$API_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser","password":"Test@123"}')
    
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if echo "$response" | grep -iq "\"$pattern\""; then
            # 检查是否是字段名
            if echo "$response" | grep -q "\"$pattern\":"; then
                # 检查值是否被过滤或哈希
                value=$(echo "$response" | jq -r ".$pattern // empty")
                if [ -n "$value" ] && [ "$value" != "null" ] && [ "$value" != "***" ]; then
                    echo "✗ SECURITY ISSUE: Sensitive data exposed: $pattern"
                fi
            fi
        fi
    done
done

echo "✓ Sensitive data exposure test completed"
```

**测试9: 不安全的直接对象引用 (IDOR)**
```typescript
// tests/security/idor.spec.ts
test.describe('不安全的直接对象引用防护', () => {
  test('用户不能访问其他用户的数据', async ({ request }) => {
    // 1. 用户A登录
    const userALogin = await request.post('/api/v1/auth/login', {
      data: {
        username: 'usera',
        password: 'UserA@123'
      }
    });
    
    const userAToken = (await userALogin.json()).data.access_token;
    const userAHeaders = {
      'Authorization': `Bearer ${userAToken}`
    };
    
    // 2. 获取用户A的信息
    const userAResponse = await request.get('/api/v1/auth/current', {
      headers: userAHeaders
    });
    
    const userAData = await userAResponse.json();
    const userAId = userAData.data.id;
    
    // 3. 尝试修改用户ID访问用户B的数据
    // 假设用户B的ID是userAId的邻居
    const userBId = `${parseInt(userAId) + 1}`;
    
    const userBResponse = await request.get(`/api/v1/system/users/${userBId}`, {
      headers: userAHeaders
    });
    
    // 4. 验证访问被拒绝
    expect([403, 404]).toContain(userBResponse.status());
    
    console.log('✓ IDOR prevented: User A cannot access User B data');
  });
});
```

### 2. 网络安全测试

#### 2.1 HTTPS/TLS测试

**测试10: SSL/TLS配置测试**
```bash
# scripts/security/test-ssl-config.sh

#!/bin/bash
# 使用testssl.sh测试SSL/TLS配置

DOMAIN="localhost:8080"

echo "Running SSL/TLS configuration tests..."

# 安装testssl.sh（如果未安装）
if ! command -v testssl.sh &> /dev/null; then
    echo "Installing testssl.sh..."
    git clone --depth 1 https://github.com/drwetter/testssl.sh.git
    cd testssl.sh
fi

# 运行SSL测试
./testssl.sh --quiet --color 0 $DOMAIN > ssl-test-results.txt

# 分析结果
echo "SSL/TLS Test Results:"
echo "====================="

# 检查是否支持弱加密套件
if grep -q "weak cipher" ssl-test-results.txt; then
    echo "✗ SECURITY ISSUE: Weak cipher suites detected"
else
    echo "✓ No weak cipher suites"
fi

# 检查是否支持TLS 1.2+
if grep -q "TLS 1.2" ssl-test-results.txt || grep -q "TLS 1.3" ssl-test-results.txt; then
    echo "✓ TLS 1.2 or higher supported"
else
    echo "✗ SECURITY ISSUE: TLS 1.2 or higher not supported"
fi

# 检查证书有效性
if grep -q "certificate valid" ssl-test-results.txt; then
    echo "✓ Certificate is valid"
else
    echo "✗ SECURITY ISSUE: Certificate issue detected"
fi
```

#### 2.2 API安全测试

**测试11: API速率限制测试**
```typescript
// tests/security/rate-limiting.spec.ts
test.describe('API速率限制', () => {
  test('应该在超过请求限制时返回429', async ({ request }) => {
    // 1. 登录获取令牌
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        username: 'testuser',
        password: 'Test@123'
      }
    });
    
    const { data: { access_token } } = await loginResponse.json();
    const headers = {
      'Authorization': `Bearer ${access_token}`
    };
    
    // 2. 快速发送多个请求（假设限制是100/分钟）
    const requests = [];
    const rateLimit = 105; // 稍微超过限制
    
    for (let i = 0; i < rateLimit; i++) {
      requests.push(
        request.get('/api/v1/system/users', { headers })
      );
    }
    
    // 3. 并发执行所有请求
    const responses = await Promise.all(requests);
    
    // 4. 统计429响应数量
    const rateLimitedCount = responses.filter(r => r.status() === 429).length;
    
    // 5. 验证速率限制生效
    expect(rateLimitedCount).toBeGreaterThan(0);
    
    console.log(`✓ Rate limiting triggered: ${rateLimitedCount} requests blocked with 429`);
  });
});
```

### 3. 数据安全测试

#### 3.1 数据加密测试

**测试12: 密码存储加密测试**
```bash
# scripts/security/test-password-encryption.sh

#!/bin/bash
# 验证密码是否正确加密存储

DB_HOST="localhost"
DB_USER="root"
DB_PASS="password"
DB_NAME="pantheon_test"

echo "Testing password encryption in database..."

# 查询用户表中的密码哈希
password_hashes=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -N -e \
    "SELECT password_hash FROM users LIMIT 5;")

# 验证密码哈希格式
while IFS= read -r hash; do
    # 检查是否是bcrypt格式 ($2a$, $2b$, etc.)
    if echo "$hash" | grep -q '^\$2[aby]\$'; then
        echo "✓ Password stored with bcrypt"
    # 检查是否是argon2格式
    elif echo "$hash" | grep -q '^\$argon2'; then
        echo "✓ Password stored with argon2"
    # 检查是否是SHA-256格式（不推荐）
    elif echo "$hash" | grep -q '^[a-f0-9]\{64\}$'; then
        echo "⚠ WARNING: Password stored with SHA-256 (consider upgrading)"
    # 明文密码（严重安全风险）
    elif [ ${#hash} -lt 20 ]; then
        echo "✗ CRITICAL: Password appears to be in plaintext!"
    else
        echo "? Unknown password hash format"
    fi
done <<< "$password_hashes"
```

**测试13: 敏感字段加密测试**
```bash
# scripts/security/test-sensitive-field-encryption.sh

#!/bin/bash
# 检查数据库中的敏感字段是否加密

DB_HOST="localhost"
DB_USER="root"
DB_PASS="password"
DB_NAME="pantheon_test"

echo "Testing sensitive field encryption..."

# 检查租户数据库密码是否加密
db_passwords=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -N -e \
    "SELECT db_password_encrypted FROM tenants WHERE db_password_encrypted IS NOT NULL LIMIT 5;")

encrypted_count=0
total_count=0

while IFS= read -r encrypted_password; do
    ((total_count++))
    
    # 检查是否是加密格式（例如，base64编码或特定前缀）
    if echo "$encrypted_password" | grep -q 'U2FsdGVkX1\|encrypted:'; then
        ((encrypted_count++))
    fi
done <<< "$db_passwords"

if [ $encrypted_count -eq $total_count ]; then
    echo "✓ All sensitive database passwords are encrypted ($encrypted_count/$total_count)"
else
    echo "✗ SECURITY ISSUE: Some database passwords are not encrypted ($encrypted_count/$total_count encrypted)"
fi
```

### 4. 业务逻辑安全测试

#### 4.1 业务流程绕过测试

**测试14: 支付/购买流程绕过（如果有）**
```typescript
// tests/security/workflow-bypass.spec.ts
test.describe('业务流程绕过防护', () => {
  test('应该防止跳过必要的审批流程', async ({ request }) => {
    // 1. 管理员登录
    const adminLogin = await request.post('/api/v1/auth/login', {
      data: {
        username: 'admin',
        password: 'Admin@123'
      }
    });
    
    const adminToken = (await adminLogin.json()).data.access_token;
    const adminHeaders = {
      'Authorization': `Bearer ${adminToken}`
    };
    
    // 2. 尝试直接创建租户而不经过审批
    const createTenantResponse = await request.post('/api/v1/tenants', {
      headers: adminHeaders,
      data: {
        name: 'Bypass Tenant',
        code: 'bypass-tenant',
        auto_approve: true  // 尝试绕过审批
      }
    });
    
    // 3. 验证审批流程不能被绕过
    if (createTenantResponse.status() === 201) {
      // 如果创建成功，检查状态是否为pending_approval
      const tenantData = await createTenantResponse.json();
      if (tenantData.data.status === 'pending_approval') {
        console.log('✓ Approval workflow enforced (tenant created but requires approval)');
      } else {
        console.log('✗ SECURITY ISSUE: Approval workflow bypassed');
      }
    } else {
      console.log('✓ Approval workflow enforced (direct creation blocked)');
    }
  });
});
```

### 5. 依赖安全测试

**测试15: 依赖漏洞扫描**
```bash
# scripts/security/test-dependency-vulnerabilities.sh

#!/bin/bash
# 扫描项目依赖中的已知漏洞

echo "Scanning for dependency vulnerabilities..."

# 前端依赖扫描 (npm audit)
echo "=== Frontend Dependencies ==="
cd frontend
npm audit --audit-level=moderate --json > ../frontend-audit-report.json 2>&1

vulnerabilities=$(jq '.metadata.vulnerabilities' ../frontend-audit-report.json)
echo "Frontend vulnerabilities found:"
echo "$vulnerabilities"

# 后端依赖扫描 (go version)
echo "=== Backend Dependencies ==="
cd ../backend

# 使用govulncheck扫描Go依赖
if command -v govulncheck &> /dev/null; then
    go install golang.org/x/vuln/cmd/govulncheck@latest
    govulncheck ./... > ../backend-vuln-report.txt 2>&1
    
    if grep -q "Vulnerabilities found" ../backend-vuln-report.txt; then
        echo "✗ SECURITY ISSUE: Go dependencies have vulnerabilities"
        cat ../backend-vuln-report.txt
    else
        echo "✓ No Go dependency vulnerabilities found"
    fi
else
    echo "govulncheck not installed, skipping Go vulnerability scan"
fi

echo "Dependency vulnerability scan completed"
```

## 🔍 自动化安全测试

### 集成到CI/CD

```yaml
# .github/workflows/security-scan.yml
name: Security Scanning

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 3 * * *'  # 每天凌晨3点

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Run npm audit
        run: |
          cd frontend
          npm audit --audit-level=moderate
          
      - name: Run Snyk security scan
        uses: snyk/actions/golang@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
          
      - name: Run OWASP ZAP scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'http://localhost:8080'
          
      - name: Run security tests
        run: |
          cd frontend
          npm run test:security
          
      - name: Upload security reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: |
            frontend-audit-report.json
            backend-vuln-report.txt
            zap-report.html
```

## 📊 安全测试报告

### 报告模板
```markdown
# 安全测试报告

## 测试概览
- **测试日期**: 2026-04-07
- **测试人员**: 安全测试组
- **测试环境**: Staging
- **测试工具**: OWASP ZAP, Burp Suite, Custom Scripts

## 执行摘要

### 风险等级分布
- 🔴 严重 (Critical): 0个
- 🟠 高危 (High): 2个
- 🟡 中危 (Medium): 5个
- 🔵 低危 (Low): 8个

### 测试覆盖率
- OWASP Top 10: 100%
- 业务逻辑安全: 85%
- 依赖安全: 90%

## 发现的漏洞

### 高危漏洞

#### 1. 存储型XSS
- **位置**: 用户管理 -> 真实姓名字段
- **风险等级**: 🔴 高危
- **描述**: 攻击者可以在用户真实姓名字段注入XSS负载，影响所有查看该用户列表的管理员
- **CVSS评分**: 8.1
- **修复建议**: 对所有用户输入进行HTML转义，使用CSP头部
- **状态**: ✅ 已修复

#### 2. IDOR漏洞
- **位置**: `/api/v1/system/users/:id`
- **风险等级**: 🟠 高危
- **描述**: 用户可以通过修改ID访问其他用户的详细信息
- **CVSS评分**: 7.5
- **修复建议**: 在用户查询接口增加租户隔离和权限验证
- **状态**: 🔄 修复中

### 中危漏洞

#### 3. 缺少速率限制
- **位置**: `/api/v1/auth/login`
- **风险等级**: 🟡 中危
- **描述**: 登录接口没有实施速率限制，可能遭受暴力破解攻击
- **CVSS评分**: 6.5
- **修复建议**: 实施每IP每分钟5次登录尝试的限制
- **状态**: 📋 待修复

## 合规性检查

### OWASP Top 10 2021
- A01:2021 – 访问控制失效 ✅
- A02:2021 – 加密失效 ✅
- A03:2021 – 注入 ✅
- A04:2021 – 不安全设计 ⚠️
- A05:2021 – 安全配置错误 ✅
- A06:2021 – 易受攻击和过时的组件 ⚠️
- A07:2021 – 身份识别和身份验证失败 ✅
- A08:2021 – 软件和数据完整性失效 ✅
- A09:2021 – 安全日志和监控失效 ⚠️
- A10:2021 – 服务端请求伪造 (SSRF) ✅

### 修复优先级
1. **立即修复**: 0个严重 + 2个高危 = 2个
2. **本周修复**: 5个中危
3. **下个迭代**: 8个低危

## 下一步计划
1. 修复高危和中危漏洞
2. 实施自动化安全扫描
3. 加强安全代码审查流程
4. 定期进行渗透测试
```

## 🎯 安全测试最佳实践

### 1. 左移安全测试
```typescript
// 在开发阶段编写安全单元测试
describe('安全相关单元测试', () => {
  test('密码哈希函数应该使用bcrypt', () => {
    const password = 'testpassword';
    const hash = hashPassword(password);
    
    // 验证使用的是bcrypt
    expect(hash).toMatch(/^\$2[aby]\$/);
  });
  
  test('输入验证函数应该阻止SQL注入', () => {
    const maliciousInput = "admin' OR '1'='1";
    const sanitized = sanitizeInput(maliciousInput);
    
    expect(sanitized).not.toContain("'");
  });
});
```

### 2. 安全代码审查清单
```markdown
## 安全审查清单

### 认证与授权
- [ ] 所有API端点都有适当的认证要求
- [ ] 敏感操作需要二次验证
- [ ] 会话管理使用安全的令牌
- [ ] 密码符合复杂度要求

### 输入验证
- [ ] 所有用户输入都经过验证
- [ ] SQL查询使用参数化语句
- [ ] 输出被正确转义
- [ ] 文件上传进行类型和大小验证

### 数据保护
- [ ] 敏感数据在传输中加密
- [ ] 密码使用强哈希算法
- [ ] 数据库连接使用TLS
- [ ] 日志不包含敏感信息

### 错误处理
- [ ] 错误消息不暴露系统信息
- [ ] 异常被正确捕获和处理
- [ ] 错误日志记录详细但不敏感
```

---

**测试负责人**: 安全测试组  
**测试周期**: 每周  
**紧急响应**: 发现严重漏洞立即处理
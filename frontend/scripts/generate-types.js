/**
 * API Types Generator (Cross-platform)
 * 从运行中的后端服务器自动生成前端 TypeScript 类型定义
 */

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

// 颜色定义
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkBackendServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8080/health', (res) => {
      if (res.statusCode === 200) {
        log(colors.green, '✓ 后端服务器运行中');
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => {
      log(colors.red, '✗ 后端服务器未运行');
      log(colors.yellow, '请先启动后端服务器:');
      log(colors.blue, '  cd backend && make run');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// snake_case → camelCase 转换
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// 递归转换对象中的所有键
function convertKeysToCamelCase(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }

  const converted = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      converted[camelKey] = convertKeysToCamelCase(obj[key]);
    }
  }
  return converted;
}

async function convertSwaggerToOpenAPI(swaggerPath, openapiPath) {
  log(colors.blue, '转换 Swagger 2.0 → OpenAPI 3.0...');

  try {
    // 使用 swagger2openapi 转换
    const swagger2openapi = require('swagger2openapi');
    const swaggerSpec = require('fs').readFileSync(swaggerPath, 'utf8');
    const swaggerObj = JSON.parse(swaggerSpec);

    await new Promise((resolve, reject) => {
      swagger2openapi.convertObj(swaggerObj, { patch: true, warnOnly: true }, (err, options) => {
        if (err) {
          reject(err);
        } else {
          // 转换所有字段名为 camelCase
          const camelCaseOpenAPI = convertKeysToCamelCase(options.openapi);
          require('fs').writeFileSync(openapiPath, JSON.stringify(camelCaseOpenAPI, null, 2));
          resolve();
        }
      });
    });

    log(colors.green, '✓ 转换成功 (已转换字段名为 camelCase)');
    return true;
  } catch (error) {
    log(colors.red, '✗ 转换失败');
    log(colors.yellow, error.message);
    return false;
  }
}

async function generateTypes(backendRunning) {
  const frontendDir = path.join(__dirname, '..');
  process.chdir(frontendDir);

  log(colors.yellow, '生成 TypeScript 类型定义...');

  // 检查是否安装了 openapi-typescript
  let openapiInstalled = false;
  try {
    execSync('npm list openapi-typescript', { stdio: 'pipe' });
    openapiInstalled = true;
  } catch (e) {
    // 未安装
  }

  if (openapiInstalled) {
    log(colors.green, '✓ openapi-typescript 已安装');
  } else {
    log(colors.yellow, '安装 openapi-typescript...');
    try {
      execSync('npm install --save-dev openapi-typescript --legacy-peer-deps', {
        stdio: 'inherit',
      });
      log(colors.green, '✓ openapi-typescript 安装成功');
    } catch (error) {
      log(colors.red, '✗ openapi-typescript 安装失败');
      return false;
    }
  }

  let swaggerPath, openapiPath;
  if (backendRunning) {
    log(colors.blue, '从 http://localhost:8080/swagger/doc.json 下载...');
    swaggerPath = path.join(frontendDir, 'temp-swagger.json');
    openapiPath = path.join(frontendDir, 'temp-openapi.json');

    // 下载 Swagger 文档
    try {
      const https = require('https');
      const http = require('http');
      const url = new URL('http://localhost:8080/swagger/doc.json');

      await new Promise((resolve, reject) => {
        const protocol = url.protocol === 'https:' ? https : http;
        const req = protocol.get(url.href, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            require('fs').writeFileSync(swaggerPath, data);
            resolve();
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      log(colors.green, '✓ 下载成功');
    } catch (error) {
      log(colors.red, '✗ 下载失败');
      return false;
    }
  } else {
    swaggerPath = path.join(frontendDir, 'public/swagger.json');
    openapiPath = path.join(frontendDir, 'temp-openapi.json');

    if (!require('fs').existsSync(swaggerPath)) {
      log(colors.red, '✗ 找不到 swagger.json 文件');
      log(colors.yellow, '请先复制 swagger 文件:');
      log(colors.blue, '  copy backend\\api\\swagger\\doc.json frontend\\public\\swagger.json');
      return false;
    }
  }

  // 转换 Swagger 2.0 → OpenAPI 3.0
  const converted = await convertSwaggerToOpenAPI(swaggerPath, openapiPath);
  if (!converted) {
    return false;
  }

  // 生成类型定义
  log(colors.blue, '生成 TypeScript 类型定义...');
  try {
    execSync(`npx openapi-typescript ${openapiPath} -o src/api/types.ts`, { stdio: 'inherit' });
    log(colors.green, '✓ 类型定义生成成功');

    // 清理临时文件
    if (backendRunning) {
      try {
        require('fs').unlinkSync(swaggerPath);
        require('fs').unlinkSync(openapiPath);
      } catch (e) {
        // 忽略清理错误
      }
    }

    return true;
  } catch (error) {
    log(colors.red, '✗ 类型定义生成失败');
    return false;
  }
}

async function runTypeCheck() {
  log(colors.yellow, '运行类型检查...');
  try {
    execSync('npm run type-check', { stdio: 'inherit' });
    log(colors.green, '✓ 类型检查通过');
  } catch (error) {
    log(colors.yellow, '⚠ 类型检查发现问题，请查看上方输出');
  }
}

async function main() {
  log(colors.blue, '======================================');
  log(colors.blue, '  API Types Generator');
  log(colors.blue, '  Pantheon Platform');
  log(colors.blue, '======================================');
  console.log('');

  // 1. 检查后端服务器
  log(colors.yellow, '1. 检查后端服务器状态...');
  const backendRunning = await checkBackendServer();
  console.log('');

  // 2. 生成类型定义
  const generated = await generateTypes(backendRunning);
  console.log('');

  // 3. 类型检查
  if (generated) {
    await runTypeCheck();
    console.log('');

    log(colors.green, '======================================');
    log(colors.green, '  ✓ 生成完成！');
    log(colors.green, '======================================');
    log(colors.blue, '生成的文件:');
    log(colors.blue, '  frontend/src/api/types.ts');
    console.log('');
    log(colors.blue, '使用方法:');
    log(colors.blue, "  import { components } from '@/api/types';");
    log(colors.blue, "  type User = components['schemas']['UserResponse'];");
    console.log('');
  } else {
    log(colors.red, '======================================');
    log(colors.red, '  ✗ 生成失败');
    log(colors.red, '======================================');
    log(colors.yellow, '请检查错误信息并重试');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('错误:', error);
  process.exit(1);
});

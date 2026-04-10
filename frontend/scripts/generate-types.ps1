# API Types Generator for Windows
# 从运行中的后端服务器自动生成前端 TypeScript 类型定义

# 颜色设置
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$NC = "`e[0m"

Write-Host "$Blue======================================" -NoNewline
Write-Host "  API Types Generator" -ForegroundColor Cyan
Write-Host "  Pantheon Platform" -ForegroundColor Cyan
Write-Host "======================================$NC"
Write-Host ""

# 获取脚本目录
$ScriptDir = $PSScriptRoot
$FrontendDir = Split-Path $ScriptDir

# 1. 检查后端服务器状态
Write-Host "$Yellow`1. 检查后端服务器状态...$NC"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  $Green✓ 后端服务器运行中$NC"
        $BackendRunning = $true
    }
} catch {
    Write-Host "  $Red✗ 后端服务器未运行$NC"
    Write-Host "  $Yellow请先启动后端服务器:$NC"
    Write-Host "  $Bluecd backend && make run$NC"
    Write-Host ""

    $response = Read-Host "是否继续使用本地 swagger 文件？(y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "$Red已取消$NC"
        exit 1
    }
    $BackendRunning = $false
}
Write-Host ""

# 2. 生成类型定义
Write-Host "$Yellow`2. 生成 TypeScript 类型定义...$NC"

Set-Location $FrontendDir

if ($BackendRunning) {
    # 从运行中的服务器生成
    Write-Host "  从 http://localhost:8080/swagger/doc.json 生成..."

    # 检查是否安装了 openapi-typescript
    $openapiInstalled = npm list openapi-typescript 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $Green✓ openapi-typescript 已安装$NC"
    } else {
        Write-Host "  $Yellow安装 openapi-typescript...$NC"
        npm install --save-dev openapi-typescript --legacy-peer-deps
    }

    npx openapi-typescript http://localhost:8080/swagger/doc.json -o src/api/types.ts

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $Green✓ 类型定义生成成功$NC"
        $Generated = $true
    } else {
        Write-Host "  $Red✗ 类型定义生成失败$NC"
        $Generated = $false
    }
} else {
    # 从本地文件生成
    $SwaggerPath = "public/swagger.json"
    if (Test-Path $SwaggerPath) {
        Write-Host "  从本地 $SwaggerPath 生成..."

        # 检查是否安装了 openapi-typescript
        $openapiInstalled = npm list openapi-typescript 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $Green✓ openapi-typescript 已安装$NC"
        } else {
            Write-Host "  $Yellow安装 openapi-typescript...$NC"
            npm install --save-dev openapi-typescript --legacy-peer-deps
        }

        npx openapi-typescript ./public/swagger.json -o src/api/types.ts

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $Green✓ 类型定义生成成功$NC"
            $Generated = $true
        } else {
            Write-Host "  $Red✗ 类型定义生成失败$NC"
            $Generated = $false
        }
    } else {
        Write-Host "  $Red✗ 找不到 swagger.json 文件$NC"
        Write-Host "  $Yellow请先复制 swagger 文件:$NC"
        Write-Host "  $Bluecopy backend/api/swagger/doc.json frontend\public\swagger.json$NC"
        $Generated = $false
    }
}
Write-Host ""

# 3. 类型检查
if ($Generated) {
    Write-Host "$Yellow`3. 运行类型检查...$NC"
    npm run type-check

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $Green✓ 类型检查通过$NC"
    } else {
        Write-Host "  $Yellow⚠ 类型检查发现问题，请查看上方输出$NC"
    }
    Write-Host ""
}

# 4. 输出结果
if ($Generated) {
    Write-Host "$Green======================================"
    Write-Host "  ✓ 生成完成！"
    Write-Host "======================================$NC"
    Write-Host "$Blue生成的文件:$NC"
    Write-Host "  $FrontendDir\src\api\types.ts"
    Write-Host ""
    Write-Host "$Blue使用方法:$NC"
    Write-Host "  import { components } from '@/api/types';"
    Write-Host "  type User = components['schemas']['UserResponse'];"
    Write-Host ""
} else {
    Write-Host "$Red======================================"
    Write-Host "  ✗ 生成失败"
    Write-Host "======================================$NC"
    Write-Host "$Yellow请检查错误信息并重试$NC"
    exit 1
}

@echo off
REM ========================================
REM Pantheon Platform - Demo Data Initialization Script (Windows)
REM ========================================
REM 说明：一键初始化所有演示数据
REM 使用方法：init_demo_data.bat [mysql_host] [mysql_user] [mysql_password]
REM ========================================

setlocal enabledelayedexpansion

REM 配置
set MYSQL_HOST=%1
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

set MYSQL_USER=%2
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set MYSQL_PASSWORD=%3

set MASTER_DB=pantheon_master
set SCRIPT_DIR=%~dp0

echo ========================================
echo Pantheon Platform Demo Data 初始化
echo ========================================
echo MySQL Host: %MYSQL_HOST%
echo MySQL User: %MYSQL_USER%
echo Master Database: %MASTER_DB%
echo Script Directory: %SCRIPT_DIR%
echo ========================================

REM 构建 MySQL 命令
set MYSQL_CMD=mysql -h %MYSQL_HOST% -u %MYSQL_USER%
if not "%MYSQL_PASSWORD%"=="" (
    set MYSQL_CMD=%MYSQL_CMD% -p%MYSQL_PASSWORD%
)

REM 检查 MySQL 连接
echo [INFO] 检查 MySQL 连接...
%MYSQL_CMD% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 无法连接到 MySQL 服务器
    echo 请检查：
    echo   1. MySQL 服务是否启动
    echo   2. 主机地址、用户名、密码是否正确
    exit /b 1
)
echo [SUCCESS] MySQL 连接正常

REM 检查主数据库
echo [INFO] 检查主数据库 %MASTER_DB%...
%MYSQL_CMD% -e "USE %MASTER_DB%;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 主数据库 %MASTER_DB% 不存在，跳过租户数据初始化
    exit /b 0
)
echo [SUCCESS] 主数据库 %MASTER_DB% 存在

REM 初始化主数据库租户数据
echo ========================================
echo 初始化主数据库租户数据
echo ========================================

set TENANT_FILE=%SCRIPT_DIR%01_demo_tenants.sql
echo [INFO] 执行: 租户数据
if exist "%TENANT_FILE%" (
    %MYSQL_CMD% %MASTER_DB% < "%TENANT_FILE%"
    if errorlevel 1 (
        echo [ERROR] 租户数据初始化失败
        exit /b 1
    )
    echo [SUCCESS] 租户数据初始化完成
) else (
    echo [ERROR] 文件不存在: %TENANT_FILE%
    exit /b 1
)

REM 初始化 Enterprise 租户数据
echo ========================================
echo 初始化 Enterprise 租户数据
echo ========================================
echo 租户ID: 00000000-0000-0000-0000-000000000010
echo 数据库: pantheon_enterprise
echo ========================================

%MYSQL_CMD% -e "USE pantheon_enterprise;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 数据库 pantheon_enterprise 不存在，跳过 Enterprise 租户
) else (
    REM 部门数据
    echo [INFO] 执行: 部门数据
    %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%02_demo_departments.sql" | findstr /C:"{tenant_id}" /C:"tenant_id" > nul
    if errorlevel 1 (
        REM 使用 PowerShell 替换占位符（如果 PowerShell 可用）
        where powershell >nul 2>&1
        if not errorlevel 1 (
            powershell -Command "(Get-Content '%SCRIPT_DIR%02_demo_departments.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000010' | Set-Content '%SCRIPT_DIR%02_demo_departments.tmp.sql'"
            %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%02_demo_departments.tmp.sql"
            del "%SCRIPT_DIR%02_demo_departments.tmp.sql"
        ) else (
            echo [WARNING] PowerShell 不可用，跳过占位符替换。请手动替换 {tenant_id}
        )
    )

    REM 角色数据
    echo [INFO] 执行: 角色数据
    where powershell >nul 2>&1
    if not errorlevel 1 (
        powershell -Command "(Get-Content '%SCRIPT_DIR%03_demo_roles.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000010' | Set-Content '%SCRIPT_DIR%03_demo_roles.tmp.sql'"
        %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%03_demo_roles.tmp.sql"
        del "%SCRIPT_DIR%03_demo_roles.tmp.sql"
    ) else (
        echo [WARNING] PowerShell 不可用，跳过占位符替换。请手动替换 {tenant_id}
    )

    REM 用户数据
    echo [INFO] 执行: 用户数据
    where powershell >nul 2>&1
    if not errorlevel 1 (
        powershell -Command "(Get-Content '%SCRIPT_DIR%04_demo_users.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000010' | Set-Content '%SCRIPT_DIR%04_demo_users.tmp.sql'"
        %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%04_demo_users.tmp.sql"
        del "%SCRIPT_DIR%04_demo_users.tmp.sql"
    ) else (
        echo [WARNING] PowerShell 不可用，跳过占位符替换。请手动替换 {tenant_id}
    )

    REM 菜单和权限数据
    echo [INFO] 执行: 菜单和权限数据
    where powershell >nul 2>&1
    if not errorlevel 1 (
        powershell -Command "(Get-Content '%SCRIPT_DIR%05_demo_menus_permissions.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000010' | Set-Content '%SCRIPT_DIR%05_demo_menus_permissions.tmp.sql'"
        %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%05_demo_menus_permissions.tmp.sql"
        del "%SCRIPT_DIR%05_demo_menus_permissions.tmp.sql"
    ) else (
        echo [WARNING] PowerShell 不可用，跳过占位符替换。请手动替换 {tenant_id}
    )

    echo [SUCCESS] Enterprise 租户数据初始化完成
)

REM 初始化 Dev 租户数据
echo ========================================
echo 初始化 Dev 租户数据
echo ========================================
echo 租户ID: 00000000-0000-0000-0000-000000000020
echo 数据库: pantheon_dev
echo ========================================

%MYSQL_CMD% -e "USE pantheon_dev;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 数据库 pantheon_dev 不存在，跳过 Dev 租户
) else (
    where powershell >nul 2>&1
    if not errorlevel 1 (
        REM 部门数据
        powershell -Command "(Get-Content '%SCRIPT_DIR%02_demo_departments.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000020' | Set-Content '%SCRIPT_DIR%02_demo_departments_dev.tmp.sql'"
        %MYSQL_CMD% pantheon_dev < "%SCRIPT_DIR%02_demo_departments_dev.tmp.sql"
        del "%SCRIPT_DIR%02_demo_departments_dev.tmp.sql"

        REM 角色数据
        powershell -Command "(Get-Content '%SCRIPT_DIR%03_demo_roles.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000020' | Set-Content '%SCRIPT_DIR%03_demo_roles_dev.tmp.sql'"
        %MYSQL_CMD% pantheon_dev < "%SCRIPT_DIR%03_demo_roles_dev.tmp.sql"
        del "%SCRIPT_DIR%03_demo_roles_dev.tmp.sql"

        REM 用户数据
        powershell -Command "(Get-Content '%SCRIPT_DIR%04_demo_users.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000020' | Set-Content '%SCRIPT_DIR%04_demo_users_dev.tmp.sql'"
        %MYSQL_CMD% pantheon_dev < "%SCRIPT_DIR%04_demo_users_dev.tmp.sql"
        del "%SCRIPT_DIR%04_demo_users_dev.tmp.sql"

        echo [SUCCESS] Dev 租户数据初始化完成
    ) else (
        echo [WARNING] PowerShell 不可用，跳过占位符替换。请手动替换 {tenant_id}
    )
)

REM 初始化 Demo 租户数据
echo ========================================
echo 初始化 Demo 租户数据
echo ========================================
echo 租户ID: 00000000-0000-0000-0000-000000000030
echo 数据库: pantheon_demo
echo ========================================

%MYSQL_CMD% -e "USE pantheon_demo;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 数据库 pantheon_demo 不存在，跳过 Demo 租户
) else (
    where powershell >nul 2>&1
    if not errorlevel 1 (
        REM 部门数据
        powershell -Command "(Get-Content '%SCRIPT_DIR%02_demo_departments.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000030' | Set-Content '%SCRIPT_DIR%02_demo_departments_demo.tmp.sql'"
        %MYSQL_CMD% pantheon_demo < "%SCRIPT_DIR%02_demo_departments_demo.tmp.sql"
        del "%SCRIPT_DIR%02_demo_departments_demo.tmp.sql"

        REM 角色数据
        powershell -Command "(Get-Content '%SCRIPT_DIR%03_demo_roles.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000030' | Set-Content '%SCRIPT_DIR%03_demo_roles_demo.tmp.sql'"
        %MYSQL_CMD% pantheon_demo < "%SCRIPT_DIR%03_demo_roles_demo.tmp.sql"
        del "%SCRIPT_DIR%03_demo_roles_demo.tmp.sql"

        REM 用户数据
        powershell -Command "(Get-Content '%SCRIPT_DIR%04_demo_users.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000030' | Set-Content '%SCRIPT_DIR%04_demo_users_demo.tmp.sql'"
        %MYSQL_CMD% pantheon_demo < "%SCRIPT_DIR%04_demo_users_demo.tmp.sql"
        del "%SCRIPT_DIR%04_demo_users_demo.tmp.sql"

        echo [SUCCESS] Demo 租户数据初始化完成
    ) else (
        echo [WARNING] PowerShell 不可用，跳过占位符替换。请手动替换 {tenant_id}
    )
)

REM 清理临时文件
echo [INFO] 清理临时文件...
del "%SCRIPT_DIR%*.tmp.sql" 2>nul

REM 验证数据
echo ========================================
echo 验证数据
echo ========================================

for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM %MASTER_DB%.tenants WHERE code IN (''enterprise'', ''dev'', ''demo'', ''suspended'', ''pending'');" 2^>nul') do set TENANT_COUNT=%%i
echo [INFO] 演示租户数量: %TENANT_COUNT%

set ENTERPRISE_USER_COUNT=0
%MYSQL_CMD% -e "USE pantheon_enterprise;" >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM pantheon_enterprise.system_users;" 2^>nul') do set ENTERPRISE_USER_COUNT=%%i
    echo [INFO] Enterprise 租户用户数量: %ENTERPRISE_USER_COUNT%
)

set DEV_USER_COUNT=0
%MYSQL_CMD% -e "USE pantheon_dev;" >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM pantheon_dev.system_users;" 2^>nul') do set DEV_USER_COUNT=%%i
    echo [INFO] Dev 租户用户数量: %DEV_USER_COUNT%
)

set DEMO_USER_COUNT=0
%MYSQL_CMD% -e "USE pantheon_demo;" >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM pantheon_demo.system_users;" 2^>nul') do set DEMO_USER_COUNT=%%i
    echo [INFO] Demo 租户用户数量: %DEMO_USER_COUNT%
)

set MENU_COUNT=0
%MYSQL_CMD% -e "USE pantheon_enterprise;" >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM pantheon_enterprise.system_menus;" 2^>nul') do set MENU_COUNT=%%i
    echo [INFO] Enterprise 租户菜单数量: %MENU_COUNT%
)

echo [SUCCESS] 数据验证完成

echo ========================================
echo [SUCCESS] 演示数据初始化完成！
echo ========================================
echo 默认登录账户：
echo   Enterprise: zhangsan / admin123 (研发总监)
echo   Dev: dev_user / admin123 (开发人员)
echo   Demo: demo_user / admin123 (演示用户)
echo ========================================

endlocal

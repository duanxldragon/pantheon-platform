@echo off
REM ========================================
REM Pantheon Platform - Demo Data Initialization Script (Windows)
REM ========================================
REM Usage:
REM   init_demo_data.bat [mysql_host] [mysql_user] [mysql_password] [demo_user_password]
REM ========================================

setlocal enabledelayedexpansion

set MYSQL_HOST=%1
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

set MYSQL_USER=%2
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set MYSQL_PASSWORD=%3
set DEMO_USER_PASSWORD=%4
if "%DEMO_USER_PASSWORD%"=="" set DEMO_USER_PASSWORD=%PANTHEON_DEMO_USER_PASSWORD%
set MASTER_DB=pantheon_master
set SCRIPT_DIR=%~dp0

echo ========================================
echo Pantheon Platform Demo Data Initialization
echo ========================================
echo MySQL Host: %MYSQL_HOST%
echo MySQL User: %MYSQL_USER%
echo Master Database: %MASTER_DB%
echo Script Directory: %SCRIPT_DIR%
echo ========================================

if "%DEMO_USER_PASSWORD%"=="" (
    echo [ERROR] A demo user password is required. Pass it as the 4th argument or set PANTHEON_DEMO_USER_PASSWORD.
    exit /b 1
)

where go >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Go is required to generate the demo password hash.
    exit /b 1
)

echo [INFO] Generating bcrypt hash for demo users...
for /f "delims=" %%i in ('pushd "%SCRIPT_DIR%..\.." ^>nul ^& go run ./cmd/tools/hash-password "%DEMO_USER_PASSWORD%" ^& popd ^>nul') do set DEMO_PASSWORD_HASH=%%i
if not defined DEMO_PASSWORD_HASH (
    echo [ERROR] Failed to generate the demo password hash.
    exit /b 1
)
echo [SUCCESS] Demo password hash generated.

set MYSQL_CMD=mysql -h %MYSQL_HOST% -u %MYSQL_USER%
if not "%MYSQL_PASSWORD%"=="" (
    set MYSQL_CMD=%MYSQL_CMD% -p%MYSQL_PASSWORD%
)

echo [INFO] Checking MySQL connection...
%MYSQL_CMD% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Unable to connect to MySQL.
    echo [ERROR] Please verify the MySQL service, host, username, and password.
    exit /b 1
)
echo [SUCCESS] MySQL connection is healthy.

echo [INFO] Checking master database %MASTER_DB%...
%MYSQL_CMD% -e "USE %MASTER_DB%;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Master database %MASTER_DB% does not exist. Demo initialization will be skipped.
    exit /b 0
)
echo [SUCCESS] Master database %MASTER_DB% is available.

echo ========================================
echo Initializing master tenant data
echo ========================================

set TENANT_FILE=%SCRIPT_DIR%demo_tenants.sql
if exist "%TENANT_FILE%" (
    echo [INFO] Running: tenant seed data
    %MYSQL_CMD% %MASTER_DB% < "%TENANT_FILE%"
    if errorlevel 1 (
        echo [ERROR] Master tenant data initialization failed.
        exit /b 1
    )
    echo [SUCCESS] Master tenant data initialized.
) else (
    echo [ERROR] File does not exist: %TENANT_FILE%
    exit /b 1
)

echo ========================================
echo Initializing enterprise tenant data
echo ========================================
echo Tenant ID: 00000000-0000-0000-0000-000000000010
echo Database: pantheon_enterprise
echo ========================================

%MYSQL_CMD% -e "USE pantheon_enterprise;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Database pantheon_enterprise does not exist. Skipping enterprise tenant.
) else (
    where powershell >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] PowerShell is not available. Placeholder replacement was skipped.
    ) else (
        echo [INFO] Running: department seed data
        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_departments.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000010' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_departments.enterprise.tmp.sql'"
        %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%demo_departments.enterprise.tmp.sql"
        del "%SCRIPT_DIR%demo_departments.enterprise.tmp.sql"

        echo [INFO] Running: role seed data
        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_roles.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000010' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_roles.enterprise.tmp.sql'"
        %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%demo_roles.enterprise.tmp.sql"
        del "%SCRIPT_DIR%demo_roles.enterprise.tmp.sql"

        echo [INFO] Running: user seed data
        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_users.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000010' -replace '{demo_password_hash}', '%DEMO_PASSWORD_HASH%' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_users.enterprise.tmp.sql'"
        %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%demo_users.enterprise.tmp.sql"
        del "%SCRIPT_DIR%demo_users.enterprise.tmp.sql"

        echo [INFO] Running: menu and permission seed data
        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_menus_permissions.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000010' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_menus_permissions.enterprise.tmp.sql'"
        %MYSQL_CMD% pantheon_enterprise < "%SCRIPT_DIR%demo_menus_permissions.enterprise.tmp.sql"
        del "%SCRIPT_DIR%demo_menus_permissions.enterprise.tmp.sql"

        echo [SUCCESS] Enterprise tenant initialization completed.
    )
)

echo ========================================
echo Initializing dev tenant data
echo ========================================
echo Tenant ID: 00000000-0000-0000-0000-000000000020
echo Database: pantheon_dev
echo ========================================

%MYSQL_CMD% -e "USE pantheon_dev;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Database pantheon_dev does not exist. Skipping dev tenant.
) else (
    where powershell >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] PowerShell is not available. Placeholder replacement was skipped.
    ) else (
        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_departments.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000020' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_departments.dev.tmp.sql'"
        %MYSQL_CMD% pantheon_dev < "%SCRIPT_DIR%demo_departments.dev.tmp.sql"
        del "%SCRIPT_DIR%demo_departments.dev.tmp.sql"

        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_roles.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000020' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_roles.dev.tmp.sql'"
        %MYSQL_CMD% pantheon_dev < "%SCRIPT_DIR%demo_roles.dev.tmp.sql"
        del "%SCRIPT_DIR%demo_roles.dev.tmp.sql"

        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_users.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000020' -replace '{demo_password_hash}', '%DEMO_PASSWORD_HASH%' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_users.dev.tmp.sql'"
        %MYSQL_CMD% pantheon_dev < "%SCRIPT_DIR%demo_users.dev.tmp.sql"
        del "%SCRIPT_DIR%demo_users.dev.tmp.sql"

        echo [SUCCESS] Dev tenant initialization completed.
    )
)

echo ========================================
echo Initializing demo tenant data
echo ========================================
echo Tenant ID: 00000000-0000-0000-0000-000000000030
echo Database: pantheon_demo
echo ========================================

%MYSQL_CMD% -e "USE pantheon_demo;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Database pantheon_demo does not exist. Skipping demo tenant.
) else (
    where powershell >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] PowerShell is not available. Placeholder replacement was skipped.
    ) else (
        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_departments.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000030' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_departments.demo.tmp.sql'"
        %MYSQL_CMD% pantheon_demo < "%SCRIPT_DIR%demo_departments.demo.tmp.sql"
        del "%SCRIPT_DIR%demo_departments.demo.tmp.sql"

        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_roles.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000030' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_roles.demo.tmp.sql'"
        %MYSQL_CMD% pantheon_demo < "%SCRIPT_DIR%demo_roles.demo.tmp.sql"
        del "%SCRIPT_DIR%demo_roles.demo.tmp.sql"

        powershell -Command "(Get-Content '%SCRIPT_DIR%demo_users.sql') -replace '{tenant_id}', '00000000-0000-0000-0000-000000000030' -replace '{demo_password_hash}', '%DEMO_PASSWORD_HASH%' | Set-Content -Encoding utf8 '%SCRIPT_DIR%demo_users.demo.tmp.sql'"
        %MYSQL_CMD% pantheon_demo < "%SCRIPT_DIR%demo_users.demo.tmp.sql"
        del "%SCRIPT_DIR%demo_users.demo.tmp.sql"

        echo [SUCCESS] Demo tenant initialization completed.
    )
)

echo [INFO] Cleaning temporary files...
del "%SCRIPT_DIR%*.tmp.sql" 2>nul

echo ========================================
echo Verifying demo data
echo ========================================

for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM %MASTER_DB%.tenants WHERE code IN (''enterprise'', ''dev'', ''demo'', ''suspended'', ''pending'');" 2^>nul') do set TENANT_COUNT=%%i
echo [INFO] Demo tenant count: %TENANT_COUNT%

set ENTERPRISE_USER_COUNT=0
%MYSQL_CMD% -e "USE pantheon_enterprise;" >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM pantheon_enterprise.system_users;" 2^>nul') do set ENTERPRISE_USER_COUNT=%%i
    echo [INFO] Enterprise user count: %ENTERPRISE_USER_COUNT%
)

set DEV_USER_COUNT=0
%MYSQL_CMD% -e "USE pantheon_dev;" >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM pantheon_dev.system_users;" 2^>nul') do set DEV_USER_COUNT=%%i
    echo [INFO] Dev user count: %DEV_USER_COUNT%
)

set DEMO_USER_COUNT=0
%MYSQL_CMD% -e "USE pantheon_demo;" >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM pantheon_demo.system_users;" 2^>nul') do set DEMO_USER_COUNT=%%i
    echo [INFO] Demo user count: %DEMO_USER_COUNT%
)

set MENU_COUNT=0
%MYSQL_CMD% -e "USE pantheon_enterprise;" >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('%MYSQL_CMD% -N -e "SELECT COUNT(*) FROM pantheon_enterprise.system_menus;" 2^>nul') do set MENU_COUNT=%%i
    echo [INFO] Enterprise menu count: %MENU_COUNT%
)

echo [SUCCESS] Demo data verification completed.
echo ========================================
echo [SUCCESS] Demo data initialization completed.
echo ========================================
echo Demo accounts initialized:
echo   Enterprise: zhangsan
echo   Dev: dev_user
echo   Demo: demo_user
echo The demo user password was supplied at runtime and is not printed.
echo ========================================

endlocal

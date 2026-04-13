$ErrorActionPreference = "Stop"

function Get-RequiredCommandPath {
  param([string]$CommandName)
  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Missing required command: $CommandName"
  }
  return $command.Source
}

function Read-BackendConfigValue {
  param(
    [string[]]$Lines,
    [string]$Section,
    [string]$Key
  )

  $inSection = $false
  foreach ($line in $Lines) {
    if ($line -match '^[A-Za-z0-9_]+:\s*$') {
      $inSection = $line.Trim().TrimEnd(':') -eq $Section
      continue
    }

    if (-not $inSection) {
      continue
    }

    if ($line -match "^\s+${Key}:\s*(.+?)\s*$") {
      return $Matches[1].Trim().Trim('"')
    }
  }

  return $null
}

function Invoke-MysqlStatement {
  param(
    [string]$MysqlBin,
    [string]$MysqlHost,
    [int]$Port,
    [string]$User,
    [string]$Password,
    [string]$Statement
  )

  $previousMysqlPwd = $env:MYSQL_PWD
  $env:MYSQL_PWD = $Password
  try {
    & $MysqlBin "-h" $MysqlHost "-P" "$Port" "-u" $User "-N" "-B" "-e" $Statement 2>$null
    if ($LASTEXITCODE -ne 0) {
      throw "mysql exited with code $LASTEXITCODE while running statement: $Statement"
    }
  } finally {
    if ($null -eq $previousMysqlPwd) {
      Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    } else {
      $env:MYSQL_PWD = $previousMysqlPwd
    }
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$tmpDir = Join-Path $repoRoot ".tmp-dev"
$configPath = Join-Path $backendDir "config.yaml"

if (-not (Test-Path $configPath)) {
  throw "backend config not found: $configPath"
}

New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

$configLines = Get-Content $configPath
$mysqlBin = if ($env:MYSQL_BIN) { $env:MYSQL_BIN } else { Get-RequiredCommandPath "mysql" }
$goBin = Get-RequiredCommandPath "go"
$nodeBin = Get-RequiredCommandPath "node"
$npmBin = Get-RequiredCommandPath "npm"
$npxBin = Get-RequiredCommandPath "npx"

$mysqlHost = if ($env:E2E_MYSQL_HOST) { $env:E2E_MYSQL_HOST } else { Read-BackendConfigValue -Lines $configLines -Section "master_db" -Key "host" }
$mysqlPortValue = if ($env:E2E_MYSQL_PORT) { $env:E2E_MYSQL_PORT } else { Read-BackendConfigValue -Lines $configLines -Section "master_db" -Key "port" }
$mysqlPort = [int]$mysqlPortValue
$mysqlUser = if ($env:E2E_MYSQL_USER) { $env:E2E_MYSQL_USER } else { Read-BackendConfigValue -Lines $configLines -Section "master_db" -Key "username" }
$mysqlPassword = if ($env:E2E_MYSQL_PASSWORD) { $env:E2E_MYSQL_PASSWORD } else { Read-BackendConfigValue -Lines $configLines -Section "master_db" -Key "password" }
$adminUsername = if ($env:E2E_ADMIN_USERNAME) { $env:E2E_ADMIN_USERNAME } else { Read-BackendConfigValue -Lines $configLines -Section "default_admin" -Key "username" }
$adminPassword = if ($env:E2E_ADMIN_PASSWORD) { $env:E2E_ADMIN_PASSWORD } else { Read-BackendConfigValue -Lines $configLines -Section "default_admin" -Key "password" }
$masterDatabase = Read-BackendConfigValue -Lines $configLines -Section "master_db" -Key "database"
$monitorDatabase = Read-BackendConfigValue -Lines $configLines -Section "monitor_db" -Key "database"

if ([string]::IsNullOrWhiteSpace($mysqlHost) -or [string]::IsNullOrWhiteSpace($mysqlUser) -or [string]::IsNullOrWhiteSpace($mysqlPassword)) {
  throw "MySQL connection info is incomplete. Set E2E_MYSQL_* env vars or backend/config.yaml."
}

if ([string]::IsNullOrWhiteSpace($adminUsername) -or [string]::IsNullOrWhiteSpace($adminPassword)) {
  throw "Admin credentials are incomplete. Set E2E_ADMIN_* env vars or backend/config.yaml."
}

$backendPortValue = if ($env:E2E_BACKEND_PORT) { $env:E2E_BACKEND_PORT } else { "18080" }
$backendPort = [int]$backendPortValue
$backendOrigin = "http://127.0.0.1:$backendPort"
$frontendPort = if ($env:PLAYWRIGHT_PORT) { [int]$env:PLAYWRIGHT_PORT } else { 4173 }
$backendStdout = Join-Path $tmpDir "backend-full-smoke.out.log"
$backendStderr = Join-Path $tmpDir "backend-full-smoke.err.log"

Write-Output "========================================="
Write-Output "Pantheon Full Smoke Test"
Write-Output "========================================="

Write-Output "Resolving Pantheon databases..."
$dbQuery = "SHOW DATABASES LIKE 'pantheon\_%';"
$databases = @(Invoke-MysqlStatement -MysqlBin $mysqlBin -MysqlHost $mysqlHost -Port $mysqlPort -User $mysqlUser -Password $mysqlPassword -Statement $dbQuery)
$databases = $databases | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

if ($databases.Count -eq 0) {
  $databases = @($masterDatabase)
  if ($monitorDatabase) {
    $databases += $monitorDatabase
  }
}

$databases | ForEach-Object { Write-Output "Resetting database: $_" }

foreach ($database in $databases) {
  Invoke-MysqlStatement -MysqlBin $mysqlBin -MysqlHost $mysqlHost -Port $mysqlPort -User $mysqlUser -Password $mysqlPassword -Statement "DROP DATABASE IF EXISTS $database;"
}

Invoke-MysqlStatement -MysqlBin $mysqlBin -MysqlHost $mysqlHost -Port $mysqlPort -User $mysqlUser -Password $mysqlPassword -Statement "CREATE DATABASE IF NOT EXISTS $masterDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if (-not [string]::IsNullOrWhiteSpace($monitorDatabase)) {
  Invoke-MysqlStatement -MysqlBin $mysqlBin -MysqlHost $mysqlHost -Port $mysqlPort -User $mysqlUser -Password $mysqlPassword -Statement "CREATE DATABASE IF NOT EXISTS $monitorDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
}

Write-Output "Starting backend on $backendOrigin ..."
$backendJob = Start-Job -ScriptBlock {
  param($BackendDir, $BackendPort, $AdminUsername, $AdminPassword)
  $env:PANTHEON_SERVER_PORT = "$BackendPort"
  $env:PANTHEON_DEFAULT_ADMIN_ENABLED = "true"
  $env:PANTHEON_DEFAULT_ADMIN_USERNAME = $AdminUsername
  $env:PANTHEON_DEFAULT_ADMIN_PASSWORD = $AdminPassword
  Set-Location $BackendDir
  go run ./cmd/server
} -ArgumentList $backendDir, $backendPort, $adminUsername, $adminPassword

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 90; $attempt++) {
    Start-Sleep -Seconds 2
    try {
      $health = & curl.exe -s "$backendOrigin/health"
      if ($LASTEXITCODE -eq 0 -and $health) {
        $ready = $true
        break
      }
    } catch {
      if ((Get-Job -Id $backendJob.Id).State -in @('Completed', 'Failed', 'Stopped')) {
        break
      }
    }
  }

  if (-not $ready) {
    $jobOutput = Receive-Job -Id $backendJob.Id -Keep -ErrorAction SilentlyContinue | Out-String
    throw "Backend failed to become healthy. Job output:`n$jobOutput"
  }

  Write-Output "Backend is healthy."
  Write-Output "Running Playwright smoke test..."

  Push-Location $frontendDir
  try {
    $env:BACKEND_ORIGIN = $backendOrigin
    $env:E2E_ADMIN_USERNAME = $adminUsername
    $env:E2E_ADMIN_PASSWORD = $adminPassword
    $env:E2E_MYSQL_HOST = $mysqlHost
    $env:E2E_MYSQL_PORT = "$mysqlPort"
    $env:E2E_MYSQL_USER = $mysqlUser
    $env:E2E_MYSQL_PASSWORD = $mysqlPassword
    $env:MYSQL_BIN = $mysqlBin
    $env:CI = "1"
    $env:PLAYWRIGHT_PORT = "$frontendPort"
    $env:PORT = "$frontendPort"

    $frontendPids = @()
    try {
      $frontendPids = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction Stop |
        Select-Object -ExpandProperty OwningProcess -Unique
    } catch {
      $frontendPids = @()
    }

    foreach ($frontendListenerPid in $frontendPids) {
      if ($frontendListenerPid -and $frontendListenerPid -ne $PID) {
        Write-Output "Stopping existing frontend server on port $frontendPort (PID: $frontendListenerPid)"
        Stop-Process -Id $frontendListenerPid -Force -ErrorAction SilentlyContinue
      }
    }

    & $npmBin run test:e2e:system
  } finally {
    Pop-Location
  }
} finally {
  if ($backendJob) {
    Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue | Out-Null
    Receive-Job -Id $backendJob.Id -ErrorAction SilentlyContinue | Set-Content -Path $backendStdout
    Remove-Job -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
  }
}

Write-Output "Smoke test finished."

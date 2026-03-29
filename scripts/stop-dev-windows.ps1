param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot ".tmp-dev"
$backendPidFile = Join-Path $runtimeDir "backend.pid"
$frontendPidFile = Join-Path $runtimeDir "frontend.pid"

function Stop-DevProcess {
    param(
        [string]$Name,
        [string]$PidFile
    )

    if (-not (Test-Path $PidFile)) {
        Write-Host "[skip] $Name pid file not found"
        return
    }

    $pidValue = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1).ToString().Trim()
    if (-not $pidValue) {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        Write-Host "[skip] $Name pid file is empty"
        return
    }

    $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id ([int]$pidValue) -Force
        Write-Host "[stopped] $Name pid=$pidValue"
    } else {
        Write-Host "[skip] $Name pid=$pidValue already exited"
    }

    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "[cleaned] $Name pid file"
}

if (-not $FrontendOnly) {
    Stop-DevProcess -Name "backend" -PidFile $backendPidFile
}

if (-not $BackendOnly) {
    Stop-DevProcess -Name "frontend" -PidFile $frontendPidFile
}

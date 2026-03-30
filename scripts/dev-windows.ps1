param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$NoNewWindow
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot ".tmp-dev"
$backendPidFile = Join-Path $runtimeDir "backend.pid"
$frontendPidFile = Join-Path $runtimeDir "frontend.pid"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

function Save-Pid {
    param(
        [string]$Path,
        [int]$ProcessId
    )
    Set-Content -Path $Path -Value $ProcessId -Encoding ASCII
}

function Start-DevProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$PidFile
    )

    $psArgs = @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $Command
    )

    if ($NoNewWindow) {
        $process = Start-Process -FilePath "powershell.exe" `
            -ArgumentList $psArgs `
            -WorkingDirectory $WorkingDirectory `
            -PassThru `
            -ErrorAction Stop `
            -NoNewWindow
    } else {
        $process = Start-Process -FilePath "powershell.exe" `
            -ArgumentList $psArgs `
            -WorkingDirectory $WorkingDirectory `
            -PassThru `
            -WindowStyle Normal `
            -ErrorAction Stop
    }

    Save-Pid -Path $PidFile -ProcessId $process.Id
    Start-Sleep -Milliseconds 800

    if ($process.HasExited) {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        Write-Warning "$Name exited immediately, please check the opened terminal output."
        return
    }

    Write-Host "[started] $Name pid=$($process.Id)"
}

if (-not $FrontendOnly) {
    $backendDir = Join-Path $repoRoot "backend"
    $backendCache = Join-Path $backendDir ".gocache"
    $backendCommand = @(
        '$Host.UI.RawUI.WindowTitle = "Pantheon Backend"',
        '$env:GOCACHE = "' + $backendCache + '"',
        'Set-Location "' + $backendDir + '"',
        'go run ./cmd/server'
    ) -join "; "

    Start-DevProcess `
        -Name "backend" `
        -WorkingDirectory $backendDir `
        -Command $backendCommand `
        -PidFile $backendPidFile
}

if (-not $BackendOnly) {
    $frontendDir = Join-Path $repoRoot "frontend"
    $frontendCommand = @(
        '$Host.UI.RawUI.WindowTitle = "Pantheon Frontend"',
        'Set-Location "' + $frontendDir + '"',
        'cmd /c npm run dev'
    ) -join "; "

    Start-DevProcess `
        -Name "frontend" `
        -WorkingDirectory $frontendDir `
        -Command $frontendCommand `
        -PidFile $frontendPidFile
}

Write-Host ""
Write-Host "Pantheon dev launcher ready."
Write-Host "- Backend:  http://localhost:8080"
Write-Host "- Frontend: http://localhost:3000 (or Vite fallback port)"
Write-Host "- Stop:     powershell -ExecutionPolicy Bypass -File .\scripts\stop-dev-windows.ps1"

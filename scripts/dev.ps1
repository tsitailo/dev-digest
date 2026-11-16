<#
.SYNOPSIS
DevDigest local bootstrap -- bring the whole stack up from zero.

.DESCRIPTION
  .\scripts\dev.ps1              # full: docker -> migrate -> seed -> server + client
  .\scripts\dev.ps1 -NoSeed      # skip the demo seed
  .\scripts\dev.ps1 -NoClient    # run only Postgres + API (no Next.js)
  .\scripts\dev.ps1 -DbOnly      # just Postgres + migrate + seed, then exit

Idempotent: re-running installs only what's missing, migrations and seed
both upsert. Ctrl-C stops the dev servers and leaves Postgres running.
#>

[CmdletBinding()]
param(
    [Alias('no-seed')]
    [switch]$NoSeed,

    [Alias('no-client')]
    [switch]$NoClient,

    [Alias('db-only')]
    [switch]$DbOnly,

    [Alias('h')]
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

$ROOT = Split-Path -Parent $PSScriptRoot
Set-Location $ROOT

if ($Help) {
    $helpLines = @(
        "DevDigest local bootstrap -- bring the whole stack up from zero.",
        "",
        "  .\scripts\dev.ps1              # full: docker -> migrate -> seed -> server + client",
        "  .\scripts\dev.ps1 -NoSeed      # skip the demo seed",
        "  .\scripts\dev.ps1 -NoClient    # run only Postgres + API (no Next.js)",
        "  .\scripts\dev.ps1 -DbOnly      # just Postgres + migrate + seed, then exit",
        "",
        "Idempotent: re-running installs only what's missing, migrations and seed",
        "both upsert. Ctrl-C stops the dev servers and leaves Postgres running."
    )
    $helpLines | ForEach-Object { Write-Host $_ }
    exit 0
}

function Write-Log {
    param([string]$Message)
    Write-Host "> $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "! $Message" -ForegroundColor Yellow
}

# --- environment PATH discovery -----------------------------------------------
# Ensure PNPM and Node are in PATH if installed in PNPM_HOME or standard local appdata
$potentialPaths = @()
if ($env:PNPM_HOME) {
    $potentialPaths += $env:PNPM_HOME
    $potentialPaths += (Join-Path $env:PNPM_HOME 'bin')
}
if ($env:LOCALAPPDATA) {
    $potentialPaths += (Join-Path $env:LOCALAPPDATA 'pnpm')
    $potentialPaths += (Join-Path $env:LOCALAPPDATA 'pnpm\bin')
}

$pathList = $env:PATH -split ';'
foreach ($p in $potentialPaths) {
    if ($p -and (Test-Path $p) -and ($pathList -notcontains $p)) {
        $env:PATH = "$p;$env:PATH"
        $pathList = $env:PATH -split ';'
    }
}

# --- prerequisites -----------------------------------------------------------
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker not found"
    exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm not found (npm i -g pnpm)"
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "node not found"
    exit 1
}

# --- env files ---------------------------------------------------------------
foreach ($dir in @('server', 'client')) {
    $envPath = Join-Path $dir '.env'
    $envExamplePath = Join-Path $dir '.env.example'
    if (-not (Test-Path $envPath) -and (Test-Path $envExamplePath)) {
        Copy-Item -Path $envExamplePath -Destination $envPath
        Write-Warn "created $dir/.env from .env.example -- add your API keys (OPENAI/ANTHROPIC/GITHUB_TOKEN) in server/.env"
    }
}

# --- Postgres ----------------------------------------------------------------
# The container name is fixed (container_name: devdigest-postgres), so if one is
# already running (possibly under another compose project) we reuse it instead
# of failing on a name conflict. If it exists but is stopped, start it; else
# create it via compose.
$CONTAINER = "devdigest-postgres"
$state = "missing"

try {
    $inspectStatus = docker inspect -f '{{.State.Status}}' $CONTAINER 2>$null
    if ($LASTEXITCODE -eq 0 -and $inspectStatus) {
        $state = $inspectStatus.Trim()
    }
} catch {
    $state = "missing"
}

if ($state -eq 'running') {
    Write-Log "Postgres container already running -- reusing it"
} elseif ($state -eq 'exited' -or $state -eq 'created') {
    Write-Log "starting existing Postgres container"
    docker start $CONTAINER | Out-Null
} else {
    Write-Log "starting Postgres (docker compose up -d)"
    docker compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error "failed to start Postgres via docker compose"
        exit 1
    }
}

Write-Log "waiting for Postgres to be healthy"
$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
    $health = docker inspect -f '{{.State.Health.Status}}' $CONTAINER 2>$null
    if ($LASTEXITCODE -eq 0 -and ($health.Trim() -eq 'healthy')) {
        $healthy = $true
        break
    }
    Start-Sleep -Seconds 1
}

if (-not $healthy) {
    Write-Error "Postgres did not become healthy in time"
    exit 1
}
Write-Log "Postgres healthy"

# --- install deps (only if missing) ------------------------------------------
function Install-IfNeeded {
    param([string]$Dir)
    if (-not (Test-Path (Join-Path $Dir "node_modules"))) {
        Write-Log "installing deps in $Dir"
        Push-Location $Dir
        try {
            pnpm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "pnpm install failed in $Dir"
                exit 1
            }
        } finally {
            Pop-Location
        }
    }
}

Install-IfNeeded "server"

if (-not $DbOnly -and -not $NoClient) {
    Install-IfNeeded "client"
}

# reviewer-core's RAW source is imported by the API at runtime (tsconfig alias);
# without its deps the API crashes at boot with ERR_MODULE_NOT_FOUND. It uses npm.
if (-not (Test-Path "reviewer-core\node_modules")) {
    Write-Log "installing deps in reviewer-core"
    Push-Location "reviewer-core"
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Error "npm ci failed in reviewer-core"
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# --- migrate + seed ----------------------------------------------------------
Write-Log "applying migrations"
Push-Location "server"
try {
    pnpm db:migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Error "pnpm db:migrate failed"
        exit 1
    }
} finally {
    Pop-Location
}

if (-not $NoSeed) {
    Write-Log "seeding demo data"
    Push-Location "server"
    try {
        pnpm db:seed
        if ($LASTEXITCODE -ne 0) {
            Write-Error "pnpm db:seed failed"
            exit 1
        }
    } finally {
        Pop-Location
    }
}

if ($DbOnly) {
    Write-Log "DB ready. Postgres is running; server/client not started (--db-only)."
    exit 0
}

# --- dev servers -------------------------------------------------------------
$serverProcess = $null

function Stop-DevProcess {
    param($proc)
    if ($proc -and -not $proc.HasExited) {
        try {
            taskkill /PID $proc.Id /T /F 2>$null | Out-Null
        } catch {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            } catch {}
        }
    }
}

try {
    Write-Log "starting API on :3001 (server)"
    $serverDir = Join-Path $ROOT "server"
    $serverProcess = Start-Process -FilePath "pnpm" -ArgumentList "dev" -WorkingDirectory $serverDir -PassThru -NoNewWindow

    if (-not $NoClient) {
        Write-Log "starting web on :3000 (client) -- Ctrl-C to stop both"
        Push-Location (Join-Path $ROOT "client")
        try {
            pnpm dev
        } finally {
            Pop-Location
        }
    } else {
        Write-Log "API running (PID $($serverProcess.Id)) -- Ctrl-C to stop"
        $serverProcess.WaitForExit()
    }
} finally {
    Write-Log "shutting down dev servers (Postgres stays up; stop it with: docker compose down)"
    Stop-DevProcess $serverProcess
}

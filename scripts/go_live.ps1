# "Start Solarda": starts Docker Desktop if needed, runs the app container and opens http://localhost:3000.
#   powershell -ExecutionPolicy Bypass -File scripts/go_live.ps1            # local only (presenting on this PC)
#   powershell -ExecutionPolicy Bypass -File scripts/go_live.ps1 -Public    # also expose via ngrok (domain in .ngrok-domain)
# Reads the gitignored .env (GEMINI_API_KEY etc.). The public URL exposes the WHOLE app; keep real secrets out of it.
param([switch]$Public, [string]$Domain)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Docker-Up { $ErrorActionPreference = 'Continue'; docker info 2>&1 | Out-Null; return ($LASTEXITCODE -eq 0) }
if (-not (Docker-Up)) {
    Write-Host 'Starting Docker Desktop (can take 1-2 minutes)...'
    $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dd) { Start-Process $dd } else { throw 'Docker Desktop is not installed.' }
    for ($i = 0; $i -lt 90 -and -not (Docker-Up); $i++) { Start-Sleep 3 }
    if (-not (Docker-Up)) { throw 'Docker did not start. Open Docker Desktop, wait for "Engine running", then run this again.' }
}

$ErrorActionPreference = 'Continue'
docker rm -f solarda-demo 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'
if (-not (docker image ls -q solarda)) { Write-Host 'Building image (first time, ~10 min)...'; docker build -t solarda . }
$envArgs = @(); if (Test-Path .env) { $envArgs = @('--env-file', '.env') }
docker run -d --name solarda-demo -p 3000:7860 @envArgs solarda | Out-Null

Write-Host 'Waiting for the app...'
$up = $false
for ($i = 0; $i -lt 60 -and -not $up; $i++) {
    try { $up = (Invoke-WebRequest http://localhost:3000/agents/health -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { Start-Sleep 2 }
}
if (-not $up) { throw 'App did not answer on http://localhost:3000 (check: docker logs solarda-demo)' }
Start-Process http://localhost:3000
Write-Host 'Solarda is running: http://localhost:3000  (Stop Solarda shortcut to shut down)' -ForegroundColor Green

if ($Public) {
    if (-not $Domain) { $Domain = $env:NGROK_DOMAIN }
    if (-not $Domain -and (Test-Path .ngrok-domain)) { $Domain = (Get-Content .ngrok-domain -Raw).Trim() }
    if (-not $Domain) { throw 'No domain. Pass -Domain, set NGROK_DOMAIN, or put it in .ngrok-domain' }
    $Domain = $Domain -replace '^https?://', ''
    Write-Host "Public URL: https://$Domain"
    ngrok http --url=$Domain --request-header-add "ngrok-skip-browser-warning:1" 3000
} else {
    Read-Host 'Press Enter to close this window (the app keeps running)'
}

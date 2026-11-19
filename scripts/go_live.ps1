# Laptop-as-server: starts the Docker container and exposes it on your ngrok static domain.
#   powershell -ExecutionPolicy Bypass -File scripts/go_live.ps1 [-Domain name.ngrok-free.app]
# Domain comes from -Domain, $env:NGROK_DOMAIN, or the gitignored file .ngrok-domain. Auth token: run `ngrok config add-authtoken <token>` once yourself.
# The public URL exposes the WHOLE app; keep real secrets out of the container's data.
param([string]$Domain)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not $Domain) { $Domain = $env:NGROK_DOMAIN }
if (-not $Domain -and (Test-Path .ngrok-domain)) { $Domain = (Get-Content .ngrok-domain -Raw).Trim() }
if (-not $Domain) { throw 'No domain. Pass -Domain, set NGROK_DOMAIN, or put it in .ngrok-domain' }
$Domain = $Domain -replace '^https?://', ''
$ErrorActionPreference = 'Continue'
docker rm -f solarda-demo 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'
if (-not (docker image ls -q solarda)) { docker build -t solarda . }
$envArgs = @(); if (Test-Path .env) { $envArgs = @('--env-file', '.env') }
docker run -d --name solarda-demo -p 3000:7860 @envArgs solarda | Out-Null
$up = $false
for ($i = 0; $i -lt 60 -and -not $up; $i++) {
    try { $up = (Invoke-WebRequest http://localhost:3000/agents/health -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { Start-Sleep 2 }
}
if (-not $up) { throw 'App did not answer on http://localhost:3000' }
Write-Host "Public URL: https://$Domain"
ngrok http --url=$Domain --request-header-add "ngrok-skip-browser-warning:1" 3000

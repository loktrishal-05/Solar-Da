# One-command demo: builds the image if missing, (re)starts the container, opens the app.
#   powershell -ExecutionPolicy Bypass -File scripts/demo.ps1          # start (fresh state every time)
#   powershell -ExecutionPolicy Bypass -File scripts/demo.ps1 -Stop    # stop
# Needs Docker Desktop running. Reads the gitignored .env (GEMINI_API_KEY etc.) if present. Works with Wi-Fi off
# except the chat, live weather and mandi prices, which need internet.
param([switch]$Stop)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$ErrorActionPreference = 'Continue'   # docker rm errors when there is nothing to remove
docker rm -f solarda-demo 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'
if ($Stop) { Write-Host 'Stopped.'; return }
if (-not (docker image ls -q solarda)) { docker build -t solarda . }
$envArgs = @(); if (Test-Path .env) { $envArgs = @('--env-file', '.env') }
docker run -d --name solarda-demo -p 3000:7860 @envArgs solarda | Out-Null
for ($i = 0; $i -lt 60; $i++) {
    try { if ((Invoke-WebRequest http://localhost:3000/agents/health -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { break } } catch { Start-Sleep 2 }
}
Write-Host 'Solarda is up: http://localhost:3000 -> Agent Console'
Start-Process http://localhost:3000

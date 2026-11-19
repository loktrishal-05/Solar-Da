# Stops ngrok and the Solarda container started by go_live.ps1 / demo.ps1.
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
$ErrorActionPreference = 'Continue'
docker rm -f solarda-demo 2>&1 | Out-Null
Write-Host 'Stopped.'

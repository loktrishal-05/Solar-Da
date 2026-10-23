# Stop every process started by scripts/start_all.ps1.
Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -match 'dist[\\/]server\.js' -or $_.CommandLine -match 'uvicorn app\.main:app --port (8000|8100|8200)' -or $_.CommandLine -match 'vite --port 3000'
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host "stopped $($_.ProcessId)" }

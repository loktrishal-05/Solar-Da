# Start the whole Solarda stack offline (no network needed after setup):
#   API :3001 (TypeScript, safety engine) | agents :8000 (LangGraph) | twin :8100 (AquaCrop) | vision :8200 (ONNX)
#   web :3000 (Vite)  ->  open http://localhost:3000 and click "Agent Console".
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File scripts/start_all.ps1
# First-time setup: npm install; npm run build; create the three venvs (see README "Agent layer").
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root 'data\runtime\logs'
New-Item -ItemType Directory -Force $logs | Out-Null

function Start-Svc($name, $dir, $exe, $argList) {
    $p = Start-Process -FilePath $exe -ArgumentList $argList -WorkingDirectory (Join-Path $root $dir) -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logs "$name.log") -RedirectStandardError (Join-Path $logs "$name.err.log")
    Write-Host ("{0,-7} pid {1}" -f $name, $p.Id)
}

# Keys live in the gitignored .env at the repo root (copy .env.example); every service inherits them.
$envFile = Join-Path $root '.env'
if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
        if ($line -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$') { Set-Item "env:$($Matches[1])" $Matches[2] }
    }
}
$env:PORT = '3001'
Start-Svc 'api' 'weiqou\api' 'node' @('dist/server.js')
Start-Svc 'twin' 'services\twin' (Join-Path $root 'services\twin\.venv\Scripts\python.exe') @('-m', 'uvicorn', 'app.main:app', '--port', '8100')
Start-Svc 'vision' 'services\vision' (Join-Path $root 'services\vision\.venv\Scripts\python.exe') @('-m', 'uvicorn', 'app.main:app', '--port', '8200')
Start-Svc 'agents' 'services\agents' (Join-Path $root 'services\agents\.venv\Scripts\python.exe') @('-m', 'uvicorn', 'app.main:app', '--port', '8000')
Start-Svc 'web' 'weiqou\web' 'cmd.exe' @('/c', 'npx', 'vite', '--port', '3000')

Start-Sleep -Seconds 8
foreach ($u in 'http://127.0.0.1:3001/api/health', 'http://127.0.0.1:8000/health', 'http://127.0.0.1:8100/health', 'http://127.0.0.1:8200/health') {
    try { $r = Invoke-RestMethod $u -TimeoutSec 5; Write-Host "OK   $u" } catch { Write-Host "DOWN $u (see $logs)" }
}
Write-Host "Open http://localhost:3000 -> Agent Console. Stop everything with scripts/stop_all.ps1"

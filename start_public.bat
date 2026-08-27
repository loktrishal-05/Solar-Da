@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

REM Try to find cloudflared. Winget installs to C:\Program Files (x86)\cloudflared
REM which may not be on the current session's PATH.
set "CLOUDFLARED="
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" set "CLOUDFLARED=C:\Program Files (x86)\cloudflared\cloudflared.exe"
if "%CLOUDFLARED%"=="" (
    where cloudflared >nul 2>nul
    if not errorlevel 1 set "CLOUDFLARED=cloudflared"
)
if "%CLOUDFLARED%"=="" (
    echo [ERROR] cloudflared not found. Install it via:
    echo         winget install --id Cloudflare.cloudflared
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  TerraSub and Solar-Da v3 - Public HTTPS Tunnel
echo ============================================================
echo  Starts Vite dev server + Cloudflare Quick Tunnel.
echo  No signup required. HTTPS for camera support.
echo ============================================================
echo.
echo  cloudflared: %CLOUDFLARED%
%CLOUDFLARED% --version
echo.

REM ---- Step 1: Make sure model files are in place ----
if not exist "weiqou\web\public\models\plant-disease\model.json" (
    echo [1/3] Downloading model from Hugging Face...
    if exist "scripts\download_tfjs_model.ps1" (
        powershell -ExecutionPolicy Bypass -File scripts\download_tfjs_model.ps1
    ) else (
        echo [ERROR] scripts\download_tfjs_model.ps1 not found.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Model files already present.
)

REM ---- Step 2: Make sure npm deps are installed ----
if not exist "node_modules" (
    echo.
    echo [2/3] Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [2/3] npm dependencies already installed.
)

REM ---- Step 3: Start dev server + tunnel ----
echo.
echo [3/3] Starting Vite dev server + Cloudflare tunnel...
echo.
echo ============================================================
echo  Two windows will open:
echo   1) Vite dev server (this window - leave it open)
echo   2) Cloudflare tunnel (new window - shows the public URL)
echo ============================================================
echo.

REM Open a NEW PowerShell window that runs the cloudflared tunnel
start "Cloudflare Tunnel" powershell -ExecutionPolicy Bypass -NoProfile -Command "Write-Host 'Cloudflare Quick Tunnel starting...' -ForegroundColor Cyan; Write-Host 'Public URL will be printed below.' -ForegroundColor Yellow; & '%CLOUDFLARED%' tunnel --url http://127.0.0.1:3000 --no-autoupdate"

REM Now start the dev server in this window (blocks until Ctrl+C)
cd weiqou\web
call npm run dev

endlocal


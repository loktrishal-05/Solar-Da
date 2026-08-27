@echo off
REM ============================================================
REM TerraSub and Solar-Da v3 - Setup and Test
REM ============================================================
REM Downloads the pre-converted MobileNet-PlantVillage model
REM from Hugging Face, installs npm dependencies, and starts
REM the Vite dev server.
REM
REM Requires: Node.js 18+ and PowerShell (built into Windows)
REM ============================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo  TerraSub and Solar-Da v3 - Plant Disease Model Setup
echo ============================================================
echo.

REM ---- Step 1: Check Node ----
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo [1/3] Node.js found:
node -v

REM ---- Step 2: Download pre-converted TF.js model from Hugging Face ----
echo.
echo [2/3] Downloading MobileNet-PlantVillage TF.js model from Hugging Face
echo        (~13 MB, 6 files, no Python required)...
echo.
if exist "weiqou\web\public\models\plant-disease\model.json" (
    echo        Model already exists at weiqou\web\public\models\plant-disease\
    echo        Skipping download. Delete that folder to re-download.
) else (
    powershell -ExecutionPolicy Bypass -File scripts\download_tfjs_model.ps1
    if errorlevel 1 (
        echo.
        echo [ERROR] Model download failed. Check your internet connection.
    )
)

REM ---- Step 3: Install npm deps and start dev server ----
echo.
echo [3/3] Installing npm dependencies...
echo.
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

cd weiqou\web
echo.
echo ============================================================
echo  Starting Vite dev server at http://localhost:3000
echo  Open the URL in Chrome/Edge/Firefox (camera needs HTTPS or localhost)
echo  Press Ctrl+C to stop.
echo ============================================================
echo.
call npm run dev

endlocal

@echo off
setlocal
cd /d "%~dp0"

echo.
echo ============================================================
echo  TerraSub and Solar-Da v3 - Dev Server (Skip Setup)
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] node_modules missing. Running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

if not exist "weiqou\web\public\models\plant-disease\model.json" (
    echo.
    echo [WARNING] TF.js model not found at weiqou\web\public\models\plant-disease\
    echo          The app will start but the disease detector will say "Model failed to load".
    echo          Run setup_and_test.bat to download and convert the model.
    echo.
)

cd weiqou\web
echo Starting Vite dev server at http://localhost:5173
echo Open the URL in Chrome/Edge/Firefox. Press Ctrl+C to stop.
echo.
call npm run dev

endlocal

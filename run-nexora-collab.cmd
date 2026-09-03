@echo off
setlocal

:: Starts your backend + AI service and exposes them via Cloudflare Tunnel so a teammate can run
:: ONLY the frontend on their own machine, pointed at your backend/database — you stay the single
:: source of truth for the data, they don't need Java, MySQL, or Python installed at all.
::
:: Unlike run-nexora-demo.cmd, this does NOT touch frontend/.env or backend CORS config on your
:: machine — your teammate's frontend runs on their own http://localhost:5173, which your backend
:: already trusts by default, so nothing here needs editing or reverting.
::
:: Requires: everything run-nexora.cmd requires, plus `cloudflared` on your PATH
:: (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
:: The tunnel URLs are random and different every time you run this — share the fresh ones with
:: your teammate each session (see docs/FRIEND_SETUP.md for what they do with them).

echo ============================================
echo   Nexora - Team Collaboration Mode
echo ============================================
echo.
echo This starts your backend + AI service and exposes them (only them, not your
echo database port directly) so a teammate can run the frontend on their own
echo machine against your live data.
echo.
pause

where cloudflared >nul 2>&1
if errorlevel 1 (
    echo.
    echo ****************************************************************
    echo   cloudflared isn't on your PATH. Install it from:
    echo   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo ****************************************************************
    pause
    exit /b 1
)

set "MVN_CMD=mvn"
if exist "%~dp0.tools\apache-maven-3.9.9\bin\mvn.cmd" set "MVN_CMD=%~dp0.tools\apache-maven-3.9.9\bin\mvn.cmd"

net start | findstr /i "MySQL" >nul
if errorlevel 1 (
    echo MySQL is not running — attempting to start it...
    net start MySQL80 >nul 2>&1
    net start | findstr /i "MySQL" >nul
    if errorlevel 1 (
        echo.
        echo   MySQL is NOT running and could not be started automatically.
        echo   Start it manually (services.msc -^> MySQL80), then press any key.
        echo.
        pause
    )
)

echo.
echo Freeing ports 8081/8000 in case they're already in use ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8081
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8000

echo.
echo Starting backend (Spring Boot, http://localhost:8081) ...
start "Nexora Backend" cmd /k "cd /d "%~dp0backend" && "%MVN_CMD%" spring-boot:run"

echo Starting AI service (FastAPI, http://localhost:8000) ...
start "Nexora AI Service" cmd /k "cd /d "%~dp0ai-service" && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo Waiting ~20s for both to come up before tunnelling them...
timeout /t 20 /nobreak >nul

echo Starting the backend's Cloudflare Tunnel ...
start "Nexora Tunnel - Backend" cmd /k "cloudflared tunnel --url http://localhost:8081"

echo Starting the AI service's Cloudflare Tunnel ...
start "Nexora Tunnel - AI Service" cmd /k "cloudflared tunnel --url http://localhost:8000"

echo.
echo ============================================
echo   Look at the two "Nexora Tunnel - ..." windows that just opened.
echo   Each prints a line like: https://some-random-words.trycloudflare.com
echo   Copy each URL and paste it below.
echo ============================================
set /p BACKEND_TUNNEL_URL="Backend tunnel URL: "
set /p AI_TUNNEL_URL="AI service tunnel URL: "

echo.
echo ============================================
echo   Send your teammate these three lines to paste into frontend\.env
echo   on THEIR machine (see docs/FRIEND_SETUP.md for the full steps):
echo.
echo   VITE_API_BASE_URL=%BACKEND_TUNNEL_URL%/api
echo   VITE_AI_SERVICE_URL=%AI_TUNNEL_URL%
echo   VITE_USE_MOCK_AI=false
echo   VITE_USE_MOCK_FORECAST=false
echo.
echo   These URLs change every time you run this script — resend them each
echo   session.
echo ============================================
echo.
echo Leave this window and the four it opened running for as long as you're
echo collaborating. Press any key here when you're done to shut everything down.
pause

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8081
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8000
taskkill /FI "WINDOWTITLE eq Nexora Tunnel*" /T /F >nul 2>&1
taskkill /IM cloudflared.exe /T /F >nul 2>&1

echo.
echo Stopped. Your teammate's frontend will stop working until you run this again.
pause

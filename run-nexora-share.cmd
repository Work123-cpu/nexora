@echo off
setlocal

:: Starts Nexora AND exposes ALL of it - backend, AI service, and frontend - via Cloudflare
:: Tunnel, with real AI features enabled (not mocked), so a friend can open one link and use
:: the full app, including chat and demand forecasting, from their own browser with zero
:: install. Your laptop stays the single database - everyone shares the same live data.
::
:: Unlike run-nexora-demo.cmd (AI mocked) and run-nexora-collab.cmd (friend runs their own
:: frontend), this tunnels all three services and wires real AI mode through, so it needs
:: three tunnel windows and touches three config files (frontend/.env, backend's CORS list,
:: and ai-service's CORS list) - all reverted automatically when you're done.
::
:: Requires: everything run-nexora.cmd requires, plus `cloudflared` on your PATH
:: (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
:: The tunnel URLs are random and different every time you run this - share the fresh link
:: with your friends each session.

echo ============================================
echo   Nexora - Full Share Mode (real AI, all features)
echo ============================================
echo.
echo This exposes your local Nexora - backend, AI service, and frontend - to the
echo public internet via temporary Cloudflare Tunnels, until you close the tunnel
echo windows. Anyone with the link can reach your real local database and use
echo every feature, including AI chat and forecasting. Only use this when you
echo mean to share it.
echo.
echo If Nexora is already running, this script will stop and restart it - that's
echo expected, it needs a fresh start so the tunnel config actually takes effect.
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
    echo MySQL is not running - attempting to start it...
    net start MySQL80 >nul 2>&1
    net start | findstr /i "MySQL" >nul
    if errorlevel 1 (
        echo.
        echo   MySQL is NOT running and could not be started automatically.
        echo   Start it manually via services.msc -^> MySQL80, then press any key.
        echo.
        pause
    )
)

echo.
echo Freeing ports 8081/8000/5173 in case Nexora is already running...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8081
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8000
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 5173

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
echo   Look at the two new "Nexora Tunnel - ..." windows.
echo   Each prints a line like: https://some-random-words.trycloudflare.com
echo   Copy each URL and paste it below.
echo ============================================
set /p BACKEND_TUNNEL_URL="Backend tunnel URL: "
set /p AI_TUNNEL_URL="AI service tunnel URL: "

echo.
echo Starting frontend (Vite, http://localhost:5173) ...
start "Nexora Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Waiting ~8s for the frontend to come up before tunnelling it...
timeout /t 8 /nobreak >nul

echo Starting the frontend's Cloudflare Tunnel ...
start "Nexora Tunnel - Frontend" cmd /k "cloudflared tunnel --url http://localhost:5173"

echo.
echo ============================================
echo   Look at the "Nexora Tunnel - Frontend" window that just opened.
echo   Copy its https://....trycloudflare.com URL and paste it below -
echo   this is the link you'll share.
echo ============================================
set /p FRONTEND_TUNNEL_URL="Frontend tunnel URL: "

echo.
echo Wiring the tunnel URLs into the app's config, real AI mode on ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\share-tunnel-apply.ps1" -BackendUrl "%BACKEND_TUNNEL_URL%" -AiUrl "%AI_TUNNEL_URL%" -FrontendUrl "%FRONTEND_TUNNEL_URL%"

echo.
echo Restarting backend, AI service, and frontend so the new config takes effect...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8081
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8000
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 5173
start "Nexora Backend" cmd /k "cd /d "%~dp0backend" && "%MVN_CMD%" spring-boot:run"
start "Nexora AI Service" cmd /k "cd /d "%~dp0ai-service" && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"
start "Nexora Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo   Share this link:
echo.
echo   %FRONTEND_TUNNEL_URL%
echo.
echo   Give everything ~20s to finish restarting before it's usable. Every
echo   feature works for your friends, including AI chat and forecasting -
echo   they're all talking to your laptop as the shared server.
echo ============================================
echo.
echo When you're done: close every "Nexora ..." and "Nexora Tunnel - ..."
echo window, then press any key here to revert the config back to normal
echo local use.
pause

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8081
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8000
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 5173
taskkill /FI "WINDOWTITLE eq Nexora Tunnel*" /T /F >nul 2>&1
taskkill /IM cloudflared.exe /T /F >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\share-tunnel-revert.ps1"

echo.
echo Reverted - Nexora and its tunnels are fully stopped, and the config is back
echo to normal local-only settings. Run run-nexora.cmd next time for regular
echo local development.
pause

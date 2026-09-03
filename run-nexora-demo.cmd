@echo off
setlocal

:: Starts Nexora AND exposes it via temporary public Cloudflare Tunnel URLs, so you can share
:: a working link with someone who isn't on your network (a friend, a phone off wifi, etc.).
:: This is a separate, opt-in script from run-nexora.cmd on purpose - your normal local runs
:: never touch the public internet unless you specifically run this file.
::
:: Requires: everything run-nexora.cmd requires, plus `cloudflared` on your PATH
:: (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
:: No Cloudflare account needed - this uses free, anonymous "quick tunnels".
::
:: The tunnel URLs are random and different every time you run this, so this script walks you
:: through two copy/paste steps instead of guessing them. Everything it edits is reverted back
:: to localhost automatically (scripts\demo-tunnel-apply.ps1 / demo-tunnel-revert.ps1) before
:: this window closes.

echo ============================================
echo Nexora - Demo Mode (public tunnel)
echo ============================================
echo.
echo This exposes your local Nexora to the public internet via a temporary
echo Cloudflare Tunnel, until you close the tunnel windows. Anyone with the
echo link can reach your real local database. Only use this for a live demo.
echo.
echo If Nexora is already running (e.g. you started it with run-nexora.cmd),
echo this script will stop and restart it - that's expected, it needs a fresh
echo backend/frontend so the tunnel config actually takes effect.
echo.
pause

where cloudflared >nul 2>&1
if errorlevel 1 (
 echo.
 echo ****************************************************************
 echo cloudflared isn't on your PATH. Install it from:
 echo https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
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
 echo MySQL is NOT running and could not be started automatically.
 echo Start it manually via services.msc -^> MySQL80, then press any key.
 echo.
 pause
 )
)

echo.
echo Freeing ports 8081/5173 in case Nexora is already running from another window
echo (window-title matching can't see it if that window is a Windows Terminal tab) ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8081
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 5173

echo.
echo Starting backend (Spring Boot, http://localhost:8081) ...
start "Nexora Backend" cmd /k "cd /d "%~dp0backend" && "%MVN_CMD%" spring-boot:run"

echo Waiting ~15s for the backend to come up before tunnelling it...
timeout /t 15 /nobreak >nul

echo Starting the backend's Cloudflare Tunnel ...
start "Nexora Tunnel - Backend" cmd /k "cloudflared tunnel --url http://localhost:8081"

echo.
echo ============================================
echo Look at the "Nexora Tunnel - Backend" window that just opened.
echo Wait for a line like:
echo https://some-random-words.trycloudflare.com
echo Copy that URL and paste it below, then press Enter.
echo ============================================
set /p BACKEND_TUNNEL_URL="Backend tunnel URL: "

echo.
echo Starting frontend (Vite, http://localhost:5173) ...
start "Nexora Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Waiting ~8s for the frontend to come up before tunnelling it...
timeout /t 8 /nobreak >nul

echo Starting the frontend's Cloudflare Tunnel ...
start "Nexora Tunnel - Frontend" cmd /k "cloudflared tunnel --url http://localhost:5173"

echo.
echo ============================================
echo Look at the "Nexora Tunnel - Frontend" window that just opened.
echo Copy its https://....trycloudflare.com URL and paste it below - 
echo this is the link you'll share.
echo ============================================
set /p FRONTEND_TUNNEL_URL="Frontend tunnel URL: "

echo.
echo Wiring the tunnel URLs into the app's config ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\demo-tunnel-apply.ps1" -BackendUrl "%BACKEND_TUNNEL_URL%" -FrontendUrl "%FRONTEND_TUNNEL_URL%"

echo.
echo Restarting the backend (new CORS setting) and frontend (new API URL)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8081
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 5173
start "Nexora Backend" cmd /k "cd /d "%~dp0backend" && "%MVN_CMD%" spring-boot:run"
start "Nexora Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo Share this link:
echo.
echo %FRONTEND_TUNNEL_URL%
echo.
echo Give the backend ~15s to finish restarting before it's usable.
echo AI features (chat, BOM suggestions, forecast) run in mock mode for
echo this demo - the ai-service isn't tunneled.
echo ============================================
echo.
echo When you're done: close every "Nexora ..." and "Nexora Tunnel - ..."
echo window, then press any key here to revert the config back to normal
echo local use (localhost URLs, tunnel origin removed from CORS).
pause

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 8081
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 5173
taskkill /FI "WINDOWTITLE eq Nexora Tunnel*" /T /F >nul 2>&1
taskkill /IM cloudflared.exe /T /F >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\demo-tunnel-revert.ps1"

echo.
echo Reverted - Nexora and its tunnels are fully stopped, and the config is back to
echo normal local-only settings. Run run-nexora.cmd next time for regular local development.
pause

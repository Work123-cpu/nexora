@echo off
setlocal

:: Starts Nexora straight from source (backend, AI service, frontend) — no build/install
:: step, so any code changes are picked up the next time you run this file.
:: Assumes Maven, Node, and Python are already on your PATH, and ai-service\.venv already
:: has its dependencies installed (pip install -r requirements.txt).

echo ============================================
echo   Starting Nexora
echo ============================================
echo.

:: Maven often isn't on a fresh machine's PATH — fall back to the copy this project bundles.
set "MVN_CMD=mvn"
if exist "%~dp0.tools\apache-maven-3.9.9\bin\mvn.cmd" set "MVN_CMD=%~dp0.tools\apache-maven-3.9.9\bin\mvn.cmd"

net start | findstr /i "MySQL" >nul
if errorlevel 1 (
    echo MySQL is not running — attempting to start it...
    net start MySQL80 >nul 2>&1
    net start | findstr /i "MySQL" >nul
    if errorlevel 1 (
        echo.
        echo ****************************************************************
        echo   MySQL is NOT running, and could not be started automatically
        echo   ^(this usually needs an administrator account^).
        echo   The backend WILL fail to start without it.
        echo.
        echo   Fix: press Win+R, type services.msc, Enter, find "MySQL80",
        echo        right-click it, click Start, then come back here and
        echo        press any key to continue.
        echo ****************************************************************
        echo.
        pause
    ) else (
        echo [OK] MySQL started.
        echo.
    )
) else (
    echo [OK] MySQL is already running.
    echo.
)

echo Starting backend      ^(Spring Boot, http://localhost:8081^) ...
start "Nexora Backend" cmd /k "cd /d "%~dp0backend" && "%MVN_CMD%" spring-boot:run"

echo Starting AI service   ^(FastAPI, http://localhost:8000^) ...
start "Nexora AI Service" cmd /k "cd /d "%~dp0ai-service" && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo Starting frontend     ^(Vite, http://localhost:5173^) ...
start "Nexora Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo All three are starting in their own windows. Waiting 20 seconds for them
echo to come up before opening your browser...
timeout /t 20 /nobreak >nul

start "" http://localhost:5173

echo.
echo Done — Nexora should now be open in your browser.
echo Close the three "Nexora ..." windows to stop everything.
echo This window can be closed at any time.
echo.
pause

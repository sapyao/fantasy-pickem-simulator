@echo off
echo Fantasy Pick'em Simulator - Launcher
echo ----------------------------------------

REM Start the backend server
start cmd /k "cd %~dp0\backend && python api.py"

REM Wait a moment for the backend to initialize
timeout /t 3 /nobreak > nul

REM Open the frontend in the default browser
echo Opening frontend in your default browser...
start "" "file://%~dp0frontend/index.html"

echo ----------------------------------------
echo Backend server is running in a separate window.
echo You can close this window.
echo To stop the backend server, close its command window.
pause
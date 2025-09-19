@echo off
echo Fantasy Pick'em Simulator - Backend Launcher
echo ----------------------------------------

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.6 or higher
    pause
    exit /b 1
)

echo Starting backend server...
echo Server logs will appear below this line
echo ----------------------------------------
cd "%~dp0"
python api.py
pause
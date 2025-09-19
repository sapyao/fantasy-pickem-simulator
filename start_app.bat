@echo off
echo Fantasy Pick'em Simulator - Full App Launcher
echo ----------------------------------------

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.6 or higher
    pause
    exit /b 1
)

REM Check for required Python libraries
echo Checking required Python libraries...
python -c "import pandas" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing required library: pandas
    pip install pandas
)

python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing required library: flask
    pip install flask
)

python -c "import flask_cors" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing required library: flask-cors
    pip install flask-cors
)

REM Start backend in a new window
echo Starting backend server...
start "Fantasy Pick'em Backend" cmd /c "cd "%~dp0backend" && python api.py"

REM Wait for backend to start
echo Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak >nul

REM Open frontend in default browser
echo Opening frontend in your default browser...
start "" "http://localhost:5000/index.html"

echo.
echo Fantasy Pick'em is now running!
echo Backend: http://localhost:5000
echo.
echo To stop the application, close this window and the backend server window.
echo ----------------------------------------
pause
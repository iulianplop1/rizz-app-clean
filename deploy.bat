@echo off
echo 🚀 Starting Rizz deployment...

REM Check if ngrok is installed
if exist ngrok.exe (
    echo Using local ngrok.exe
    set NGROK_CMD=ngrok.exe
) else (
    ngrok version >nul 2>&1
    if %errorlevel% neq 0 (
        echo Installing ngrok...
        winget install ngrok.ngrok
        if %errorlevel% neq 0 (
            echo Failed to install ngrok. Please install it manually from https://ngrok.com/
            pause
            exit /b 1
        )
    )
    set NGROK_CMD=ngrok
)

REM Build frontend
echo Building React frontend...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)
npm run build
if %errorlevel% neq 0 (
    echo Failed to build frontend
    pause
    exit /b 1
)
cd ..

REM Start backend
echo Starting Flask backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
start "Backend Server" cmd /k "python app.py"
cd ..

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start ngrok
echo Starting ngrok tunnel...
start "ngrok Tunnel" cmd /k "%NGROK_CMD% http 5000"

echo.
echo 🎉 Deployment complete!
echo Your app should now be accessible via the ngrok URL shown above.
echo Share this URL with your friends to let them try your app!
echo.
pause 
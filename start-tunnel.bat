@echo off
echo ================================================
echo   Kalendarz Apartamentow - LocalTunnel Setup
echo ================================================
echo.

echo [1/4] Starting Backend...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 5

echo [2/4] Starting Frontend...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 5

echo [3/4] Creating Backend Tunnel...
start "Backend Tunnel" cmd /k "lt --port 3000 --subdomain Kazalnica-api"
timeout /t 3

echo [4/4] Creating Frontend Tunnel...
start "Frontend Tunnel" cmd /k "lt --port 5173 --subdomain Kazalnica-app"

echo.
echo ================================================
echo   All services started!
echo ================================================
echo.
echo IMPORTANT: 
echo 1. Check the tunnel windows for your URLs
echo 2. Copy the BACKEND URL (port 3000)
echo 3. Update API_URL in frontend
echo.
echo Backend tunnel: https://Kazalnica-api.loca.lt
echo Frontend tunnel: https://Kazalnica-app.loca.lt
echo.
echo Note: If subdomain is taken, LocalTunnel will assign random one
echo ================================================
pause

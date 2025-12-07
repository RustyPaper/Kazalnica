@echo off
color 0B
cls

echo Starting Backend...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 5

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5

echo Creating Backend Tunnel...
start "Backend Tunnel" cmd /k "cloudflared tunnel --url http://localhost:3000"
timeout /t 10

echo Creating Frontend Tunnel...
start "Frontend Tunnel" cmd /k "cloudflared tunnel --url http://localhost:5173"

timeout /t 5
cls
echo.
echo ============================================================
echo KROKI:
echo.
echo 1. Sprawdz okno "Backend Tunnel"
echo 2. Skopiuj URL (np. https://abc-123.trycloudflare.com)
echo 3. Edytuj frontend/.env:
echo    VITE_API_URL=SKOPIOWANY_URL/api
echo 4. Zrestartuj Frontend (Ctrl+C, npm run dev)
echo 5. Sprawdz okno "Frontend Tunnel" - to URL dla uzytkownikow
echo ============================================================
pause

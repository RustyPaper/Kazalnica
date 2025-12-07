@echo off
color 0B
echo ╔════════════════════════════════════════════════════════╗
echo ║   Kalendarz Apartamentow - Cloudflare Named Tunnel     ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1/3] Uruchamianie Backend...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 5

echo [2/3] Uruchamianie Frontend...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 5

echo [3/3] Uruchamianie Cloudflare Tunnel...
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --config config.yml run calendar-app"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Aplikacja uruchomiona!                                ║
echo ╠════════════════════════════════════════════════════════╣
echo ║  Frontend: https://app.kazalnica.duckdns.org           ║
echo ║  Backend:  https://api.kazalnica.duckdns.org           ║
echo ╚════════════════════════════════════════════════════════╝
echo.
pause

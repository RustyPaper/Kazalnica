@echo off
color 0B
title Kalendarz Apartamentow - Production
cls

echo ╔════════════════════════════════════════════════════════╗
echo ║   Kalendarz Apartamentow - Production Mode             ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1/3] Uruchamianie Backend...
start "Backend Server" cmd /k "title Backend Server && color 02 && cd backend && npm run dev"
timeout /t 5

echo [2/3] Uruchamianie Frontend...
start "Frontend Server" cmd /k "title Frontend Server && color 03 && cd frontend && npm run dev"
timeout /t 5

echo [3/3] Uruchamianie Cloudflare Tunnel...
start "Cloudflare Tunnel" cmd /k "title Cloudflare Tunnel && color 01 && cloudflared tunnel --config config.yml run calendar-app"

echo.
echo Czekam na uruchomienie wszystkich serwisow...
timeout /t 10

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  ✅ Aplikacja uruchomiona!                             ║
echo ╠════════════════════════════════════════════════════════╣
echo ║                                                        ║
echo ║  🌐 Frontend (dla uzytkownikow):                       ║
echo ║     https://app-kazalnica.trycloudflare.com            ║
echo ║                                                        ║
echo ║  🔧 Backend API:                                       ║
echo ║     https://api-kazalnica.trycloudflare.com            ║
echo ║                                                        ║
echo ║  📊 Status:                                            ║
echo ║     Sprawdz okno "Cloudflare Tunnel"                   ║
echo ║     Powinno pokazac: Connection registered             ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 💡 Udostepnij link uzytkownikom:
echo    https://app-kazalnica.trycloudflare.com
echo.
echo 🔑 Domyslne logowanie:
echo    Login: admin
echo    Haslo: admin123
echo.
pause

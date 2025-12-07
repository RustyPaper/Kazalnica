@echo off
color 0B
echo ╔════════════════════════════════════════════════════════╗
echo ║   Kalendarz Apartamentow - Cloudflare Tunnel           ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1/4] Uruchamianie Backend...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 5

echo [2/4] Uruchamianie Frontend...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 5

echo [3/4] Tworzenie tunelu Backend...
echo.
echo UWAGA: Skopiuj URL ktory pojawi sie w oknie "Backend Tunnel"!
echo Bedzie wyglądał tak: https://xyz-abc-123.trycloudflare.com
echo.
timeout /t 3
start "Backend Tunnel" cmd /k "cloudflared tunnel --url http://localhost:3000"
timeout /t 8

echo [4/4] Tworzenie tunelu Frontend...
start "Frontend Tunnel" cmd /k "cloudflared tunnel --url http://localhost:5173"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  INSTRUKCJA:                                           ║
echo ║                                                        ║
echo ║  1. Sprawdź okno "Backend Tunnel"                      ║
echo ║  2. Skopiuj URL (np. https://abc.trycloudflare.com)    ║
echo ║  3. Uruchom: update-api-url.bat [URL]                  ║
echo ║  4. Sprawdź okno "Frontend Tunnel" dla URL aplikacji   ║
echo ║  5. Udostępnij frontend URL użytkownikom               ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Okna z tunelami otwarte - sprawdź je teraz!
echo.
pause

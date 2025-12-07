@echo off
color 0A
echo ╔════════════════════════════════════════════════════════╗
echo ║     Kalendarz Apartamentow - Serveo Tunnel             ║
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
echo.
timeout /t 2
start "Backend Tunnel" cmd /k "ssh -R 80:localhost:3000 serveo.net"
timeout /t 5

echo [4/4] Tworzenie tunelu Frontend...
start "Frontend Tunnel" cmd /k "ssh -R 80:localhost:5173 serveo.net"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  KROK 1: Sprawdz okno "Backend Tunnel"                 ║
echo ║  KROK 2: Skopiuj URL (np. https://abc123.serveo.net)   ║
echo ║  KROK 3: Uruchom: update-api-url.bat [URL]             ║
echo ║  KROK 4: Zrestartuj frontend                           ║
echo ╚════════════════════════════════════════════════════════╝
echo.
pause

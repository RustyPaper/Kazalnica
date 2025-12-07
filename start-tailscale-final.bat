@echo off
color 0B
cls

echo ╔════════════════════════════════════════════════════════╗
echo ║   Kalendarz Apartamentow - Tailscale Setup             ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1/6] Resetowanie konfiguracji Tailscale...
tailscale serve reset
timeout /t 2

echo [2/6] Uruchamianie Backend...
start "Backend" cmd /k "title Backend && cd backend && npm run dev"
timeout /t 6

echo [3/6] Uruchamianie Frontend...
start "Frontend" cmd /k "title Frontend && cd frontend && npm run dev"
timeout /t 6

echo [4/6] Konfiguracja Tailscale Serve dla Frontend (/)...
tailscale serve --bg --https 443 http://localhost:5173
timeout /t 2

echo [5/6] Konfiguracja Tailscale Serve dla Backend (/api)...
tailscale serve --bg --https 443 --set-path /api http://localhost:3000
timeout /t 2

echo [6/6] Wlaczanie Funnel...
tailscale funnel 443

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Status konfiguracji:                                  ║
echo ╚════════════════════════════════════════════════════════╝
tailscale serve status

timeout /t 3
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  ✅ Aplikacja uruchomiona!                             ║
echo ╠════════════════════════════════════════════════════════╣
echo ║                                                        ║
echo ║  🌐 URL: https://gamming.tail4ba063.ts.net             ║
echo ║                                                        ║
echo ║  🔑 Login: admin / admin123                            ║
echo ║                                                        ║
echo ║  ⚠️  WAZNE:                                            ║
echo ║  Sprawdz czy frontend/.env ma:                         ║
echo ║  VITE_API_URL=https://gamming.tail4ba063.ts.net/api    ║
echo ║                                                        ║
echo ║  Jesli nie - zaktualizuj i zrestartuj Frontend!        ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
pause

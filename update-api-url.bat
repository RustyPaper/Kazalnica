@echo off
if "%1"=="" (
    color 0C
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║  BŁĄD: Brak URL!                                       ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo Użycie: update-api-url.bat [BACKEND_URL]
    echo.
    echo Przykład:
    echo   update-api-url.bat https://abc-def-123.trycloudflare.com
    echo.
    pause
    exit /b
)

set BACKEND_URL=%1

color 0A
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Aktualizacja API URL                                  ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Nowy URL: %BACKEND_URL%/api
echo.

(
echo VITE_API_URL=%BACKEND_URL%/api
) > frontend\.env

echo ✓ Zaktualizowano frontend/.env
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  NASTĘPNE KROKI:                                       ║
echo ║                                                        ║
echo ║  1. Przejdź do okna "Frontend Server"                  ║
echo ║  2. Naciśnij Ctrl+C aby zatrzymać                      ║
echo ║  3. Uruchom ponownie: npm run dev                      ║
echo ║  4. Sprawdź Frontend Tunnel dla URL aplikacji          ║
echo ╚════════════════════════════════════════════════════════╝
echo.
pause

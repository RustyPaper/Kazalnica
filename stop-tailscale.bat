@echo off
color 0C
echo Zatrzymywanie...

REM Zatrzymaj serwisy
taskkill /FI "WindowTitle eq Backend*" /F 2>nul
taskkill /FI "WindowTitle eq Frontend*" /F 2>nul
taskkill /FI "WindowTitle eq Tailscale Funnel*" /F 2>nul

REM Wyłącz Tailscale Serve
tailscale serve reset

echo.
echo ✅ Zatrzymano!
timeout /t 2

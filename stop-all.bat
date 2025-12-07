@echo off
echo Zatrzymywanie wszystkich serwisow...
taskkill /FI "WindowTitle eq Backend Server*" /F
taskkill /FI "WindowTitle eq Frontend Server*" /F
taskkill /FI "WindowTitle eq Backend Tunnel*" /F
taskkill /FI "WindowTitle eq Frontend Tunnel*" /F
taskkill /IM cloudflared.exe /F 2>nul
echo.
echo Wszystkie serwisy zatrzymane!
pause

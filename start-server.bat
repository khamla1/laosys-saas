@echo off
echo ==========================================
echo    Starting Multi-Tenant SaaS Server
echo ==========================================
echo.
echo 1. Starting Next.js Database and Server...
start "Next.js Server" cmd /k "npm run build && npm run start"

echo 2. Waiting 15 seconds for server to build and boot...
timeout /t 15 /nobreak >nul

echo 3. Starting Cloudflare Production Tunnel (https://app.laosys.site)...
start "Cloudflare Tunnel" cmd /k ".\cloudflared.exe tunnel --url http://127.0.0.1:8443 run 88694469-4fd6-47c0-a45c-61a1d110a243"

echo.
echo All services have been launched in new windows!
echo Keep the new windows open while you are using the system.
echo.
pause

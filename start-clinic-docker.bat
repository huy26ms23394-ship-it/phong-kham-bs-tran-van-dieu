@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title PHONG KHAM BS. TRAN VAN DIEU - DOCKER ENGINE (WSL2 / LOCAL)
cd /d "%~dp0"

echo ========================================================================
echo   PHONG KHAM NOI TONG QUAT BS. TRAN VAN DIEU - DOCKER ENGINE LAUNCHER
echo   Du lieu luu 100%% tren o cung may tinh ca nhan: server_data\clinic.sqlite
echo ========================================================================
echo.

:: Tu dong lay IP mang LAN (Wi-Fi / Ethernet) cua may Windows de hien thi ma QR chuan
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '172.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; Write-Output $ip"`) do set "HOST_LAN_IP=%%I"

if defined HOST_LAN_IP (
  echo [LAN] Phat hien dia chi mang noi bo: %HOST_LAN_IP%
)

:: Kiem tra Docker native tren Windows/Mac/Linux hoac Docker Engine trong WSL2 Debian
where docker >nul 2>nul
if %errorlevel%==0 (
  echo [1/3] Dang khoi tao Docker Container...
  docker compose up -d --build
  goto :OPEN_APP
)

:: Neu khong co lenh docker native, su dung Docker Engine ben trong WSL2 Debian
echo [1/3] Dang kiem tra va bat Docker Engine trong WSL2 (Debian)...
wsl -d Debian -u root -e sh -c "docker info >/dev/null 2>&1 || systemctl start docker >/dev/null 2>&1 || (nohup dockerd >/var/log/dockerd.log 2>&1 & sleep 4)"

:: Chuyen duong dan Windows sang duong dan WSL
for /f "usebackq delims=" %%P in (`wsl -d Debian wslpath -a "%cd%"`) do set "WSL_DIR=%%P"

echo [2/3] Dang dong goi va khoi chay Container tu: !WSL_DIR!
wsl -d Debian -u root -e sh -c "cd '!WSL_DIR!' && HOST_LAN_IP='%HOST_LAN_IP%' docker compose up -d --build"

:OPEN_APP
echo.
echo [3/3] Dang mo trinh duyet tai http://localhost:3000 ...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"
echo.
echo Hoan tat! Container 'phong-kham-bs-dieu' dang chay ngam.
echo De xem nhat ky: wsl -d Debian -u root docker logs -f phong-kham-bs-dieu
pause

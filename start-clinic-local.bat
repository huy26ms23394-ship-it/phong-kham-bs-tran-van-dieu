@echo off
chcp 65001 >nul
title PHONG KHAM BS. TRAN VAN DIEU - LOCAL SERVER (SQLITE + CLOUDFLARE TUNNEL)
cd /d "%~dp0"

echo ========================================================================
echo   PHONG KHAM NOI TONG QUAT BS. TRAN VAN DIEU - KHOI DONG LOCAL
echo   Du lieu luu 100%% tren may tinh ca nhan: server_data\clinic.sqlite
echo ========================================================================
echo.

if not exist "node_modules" (
  echo [1/2] Dang cai dat thu vien lan dau...
  call npm install
)

echo [2/2] Dang mo trinh duyet tai http://localhost:3000 ...
start "" "http://localhost:3000"

call npm run dev
pause

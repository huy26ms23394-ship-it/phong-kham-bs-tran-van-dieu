#!/bin/bash
cd "$(dirname "$0")"

echo "========================================================================"
echo "  PHÒNG KHÁM NỘI TỔNG QUÁT BS. TRẦN VĂN DIỆU - KHỞI ĐỘNG LOCAL"
echo "  Dữ liệu lưu 100% trên máy tính cá nhân: server_data/clinic.sqlite"
echo "========================================================================"
echo ""

if [ ! -d "node_modules" ]; then
  echo "[1/2] Đang cài đặt thư viện lần đầu..."
  npm install
fi

echo "[2/2] Đang mở trình duyệt tại http://localhost:3000 ..."
(sleep 2 && open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null) &

npm run dev

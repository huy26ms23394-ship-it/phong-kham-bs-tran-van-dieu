---
name: local-first-cloudflare-tunnel
description: >-
  Transforms any Node.js/TypeScript web application into a Local-First Architecture
  with high-speed local SQLite (better-sqlite3 in WAL mode), LAN Wi-Fi discovery
  with QR code sharing, and a 1-click on-demand Cloudflare Tunnel (cloudflared)
  switch with automatic Windows/macOS binary verification and self-healing against
  spawn EFTYPE/ENOENT errors. Use this skill when the user wants to run an app
  100% locally on their PC while occasionally opening remote Internet access via
  Cloudflare Tunnel.
---

# Local-First Architecture & On-Demand Cloudflare Tunnel Skill (Blueprint)

Tài liệu & Skill chuẩn hóa của **Antigravity** giúp chuyển đổi bất kỳ dự án Web App (Node.js / Express / React / Vite / Next.js) nào sang kiến trúc **100% Local-First trên máy tính cá nhân** kết hợp **Công tắc Bật/Tắt Cloudflare Tunnel 1-Click** (đã tích hợp sẵn cơ chế chống lỗi `spawn EFTYPE` và `spawn ENOENT` trên Windows).

---

## 1. Kiến trúc tổng thể (4 Lớp)

1. **Local SQLite WAL Engine (`better-sqlite3`)**:
   - Lưu toàn bộ cơ sở dữ liệu vào `server_data/<app>.sqlite` trên ổ cứng máy tính cá nhân.
   - Bật `PRAGMA journal_mode = WAL;` giúp đọc/ghi tốc độ `0.1ms` và an toàn dữ liệu khi mất điện đột ngột.
2. **Self-Healing Cloudflare Tunnel Service (`tunnelService.ts`)**:
   - Tự động ưu tiên bản `cloudflared.exe` chính thức của Windows (`Winget`) tại `C:\Program Files (x86)\cloudflared\cloudflared.exe` hoặc `C:\Program Files\cloudflared\cloudflared.exe`.
   - Kiểm tra tính toàn vẹn của file `.exe` (`size > 10MB` và chạy thử `--version`) trước khi gọi `spawn()`. Nếu file trong `node_modules` bị tải dở dang (gây lỗi `spawn EFTYPE`), hệ thống tự động xóa file hỏng và tải lại bản chuẩn.
3. **API Điều khiển & Quét Mạng LAN (`0.0.0.0`)**:
   - Tự động quét IP Wi-Fi/Ethernet nội bộ (`192.168.x.x`) để điện thoại/iPad cùng mạng truy cập trực tiếp không cần Internet.
   - Cung cấp 3 endpoint: `GET /api/system/network-status`, `POST /api/system/tunnel/start`, `POST /api/system/tunnel/stop`.
4. **Giao diện Công tắc 1-Click & Mã QR (`RemoteAccessModal.tsx`)**:
   - Nút trạng thái trên thanh Header/Navbar + Hộp thoại bật/tắt kết nối từ xa kèm mã QR cho cả mạng LAN lẫn Internet (`https://*.trycloudflare.com`).

---

## 2. Các bước thực thi tự động cho Agent

### Bước 1: Cài đặt thư viện & Công cụ nền tảng

```bash
npm install better-sqlite3 cloudflared
npm install -D @types/better-sqlite3 tsx
```

Trên máy Windows (chạy 1 lần duy nhất nếu chưa cài):
```powershell
winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
```

### Bước 2: Tạo `api/tunnelService.ts` (Có cơ chế chống lỗi `spawn EFTYPE`)

Sử dụng mã nguồn chuẩn trong file [SKILL.md toàn cục](file:///C:/Users/admin/.gemini/config/skills/local-first-cloudflare-tunnel/SKILL.md) hoặc tham khảo trực tiếp bản mẫu tại [`api/tunnelService.ts`](file:///c:/Users/admin/antigravity/Phong_Kham/api/tunnelService.ts).

### Bước 3: Tích hợp API vào Express (`server.ts`)

```typescript
import { tunnelService } from './api/tunnelService.js';

app.get('/api/system/network-status', (_req, res) => {
  res.json(tunnelService.getStatus());
});

app.post('/api/system/tunnel/start', async (_req, res) => {
  const result = await tunnelService.startTunnel(Number(PORT));
  res.json({ ...result, network: tunnelService.getStatus() });
});

app.post('/api/system/tunnel/stop', (_req, res) => {
  const result = tunnelService.stopTunnel();
  res.json({ ...result, network: tunnelService.getStatus() });
});
```

### Bước 4: Kiểm thử (Verification)

Chạy lệnh kiểm tra tự động lấy link `https://*.trycloudflare.com` rồi ngắt kết nối:

```bash
npx tsx -e "import { tunnelService } from './api/tunnelService.js'; (async () => { const res = await tunnelService.startTunnel(3000); console.log('TEST RESULT:', JSON.stringify(res)); tunnelService.stopTunnel(); })();"
```

---

## 3. Đóng gói bằng Docker Engine (Chuyển sang máy khác chuẩn "Cắm là chạy")

Để đóng gói ứng dụng vào container (bao gồm sẵn Node.js 22 + `better-sqlite3` + `cloudflared` Linux), sử dụng bộ 3 file:
- `Dockerfile`: Cài đặt `python3`, `make`, `g++`, tải `/usr/local/bin/cloudflared`, build production và khai báo `VOLUME ["/app/server_data"]`.
- `docker-compose.yml`: Ánh xạ cổng `3000:3000`, gắn volume `./server_data:/app/server_data` để dữ liệu SQLite luôn nằm trên ổ cứng thật, và truyền biến `HOST_LAN_IP` để mã QR LAN hiển thị đúng IP Wi-Fi của máy chủ.
- `.dockerignore`: Bỏ qua `node_modules`, `dist`, `server_data`, `.git`, `.env`.

### Chạy trên máy Windows không cài Docker Desktop (Docker Engine thuần qua WSL2):
1. Cài WSL2 Debian (`wsl --install -d Debian`) và cài `docker-ce` + `docker-compose-plugin` bên trong Debian (mặc định Debian 12/13 dùng `iptables-nft` và `systemd=true` hoạt động ổn định).
2. Dùng file [`start-clinic-docker.bat`](file:///c:/Users/admin/antigravity/Phong_Kham/start-clinic-docker.bat) để tự động nhận IP LAN (`HOST_LAN_IP`), khởi động Docker Engine và chạy container `docker compose up -d --build`.

### Mang sang máy tính khác:
1. Copy thư mục dự án (kèm thư mục `server_data/`) sang máy mới có Docker Engine / Docker Desktop.
2. Chạy 1 lệnh duy nhất:
   ```bash
   docker compose up -d --build
   ```
   *(Nếu muốn mang offline hoàn toàn qua USB: `docker save -o app.tar phong-kham-bs-dieu:latest`, sang máy mới chạy `docker load -i app.tar` rồi `docker compose up -d`).*


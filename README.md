# 🏥 Hệ Thống Quản Lý Phòng Khám Nội Tổng Quát — BS. Trần Văn Diệu

Ứng dụng quản lý phòng khám, kê toa điện tử, tra cứu 3.076+ biệt dược chuẩn Việt Nam và Trợ lý AI Dược Lâm Sàng — vận hành theo kiến trúc **100% Local-First** (dữ liệu nằm hoàn toàn trên máy tính cá nhân của Bác sĩ với **SQLite WAL 0.1ms**) kết hợp **Docker Engine** và công tắc **Cloudflare Tunnel (1-Click)** để mở truy cập Internet từ xa khi cần.

---

## ✨ Tính năng nổi bật

- **Lưu trữ Local-First SQLite (`better-sqlite3` + WAL Mode)**: Đọc/ghi dữ liệu trên ổ cứng (`server_data/clinic.sqlite`) với RAM Cache + ETag `304`, phản hồi `0.01ms` và chống mất dữ liệu khi mất điện.
- **Kho Dược Phẩm 3.076+ Biệt Dược Việt Nam**: Tìm kiếm tiếng Việt không dấu `0ms` (có bộ nhớ đệm chỉ mục), phân trang thông minh (`useSmartPagination`), kiểm tra tương tác thuốc 5 tầng & cảnh báo dị ứng.
- **Mạng LAN Wi-Fi Nội Bộ & Cloudflare Tunnel 1-Click**: Tự động quét IP Wi-Fi nội bộ tạo mã QR cho điện thoại/iPad cùng phòng khám; tích hợp sẵn công tắc bật/tắt `cloudflared` ngay trên giao diện Navbar.
- **Đóng gói chuẩn Docker Engine**: Tự động gộp Node.js 22 + Vite Production + `better-sqlite3` + `cloudflared` Linux vào 1 container duy nhất (`phong-kham-bs-dieu`).
- **Bảo mật Zero-Trust**: Xác thực JWT, Master Admin & Whitelist nhân viên, chống Brute-Force, Audit Log theo Nghị định 333/2026/NĐ-CP.

---

## 🔑 Thông tin đăng nhập mặc định (Master Admin)

- **Tài khoản**: `admin` hoặc `bstranvandieu` hoặc `tranminhhuy3031998@gmail.com`
- **Mật khẩu mặc định**: `DieuClinic@2026!` *(nên đổi ngay sau khi đăng nhập qua nút "Đổi MK Admin")*

---

## 🚀 Cách sử dụng hàng ngày & Khi chuyển sang máy khác (Cách A)

### Trên máy hiện tại:
* Container đang chạy sẵn tại **[http://localhost:3000](http://localhost:3000)** (hoặc **[http://192.168.0.6:3000](http://192.168.0.6:3000)** trên điện thoại/iPad cùng Wi-Fi).
* Các lần sau khi bật máy hoặc sau khi sửa code, chỉ cần bấm đúp **`start-clinic-docker.bat`**.

*(Hoặc nếu muốn chạy trực tiếp bằng Node.js mà không qua Docker, bấm đúp **`start-clinic-local.bat`** hoặc chạy `npm run local:start`.)*

### Khi mang sang máy tính khác:
1. Copy thư mục dự án (bao gồm thư mục **`server_data/`** chứa dữ liệu bệnh nhân & thuốc) sang máy mới đã có **Docker Engine / Docker Desktop**.
2. Chạy 1 lệnh duy nhất:
   ```bash
   docker compose up -d --build
   ```

*(Hoặc nếu mang **offline hoàn toàn qua USB không cần mạng**: trên máy cũ chạy `docker save -o phong-kham.tar phong-kham-bs-dieu:latest`, sang máy mới chép file `phong-kham.tar` kèm thư mục dự án & `server_data/` rồi chạy `docker load -i phong-kham.tar` và `docker compose up -d`.)*

---

## 🛠️ Lệnh quản trị nhanh Docker & NPM

```bash
# Khởi động / cập nhật container sau khi sửa code
npm run docker:up        # (tương đương: docker compose up -d --build)

# Xem nhật ký hoạt động của server & SQLite
npm run docker:logs      # (tương đương: docker compose logs -f)

# Tạm dừng container (dữ liệu trong server_data/ vẫn nguyên vẹn)
npm run docker:down      # (tương đương: docker compose down)
```

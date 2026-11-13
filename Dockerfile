# =========================================================================
# PHÒNG KHÁM BS. TRẦN VĂN DIỆU - LOCAL-FIRST DOCKER IMAGE (SQLITE + CLOUDFLARED)
# =========================================================================
FROM node:22-bookworm-slim

WORKDIR /app

# Cài đặt công cụ build native cho better-sqlite3 + tải cloudflared chính thức cho Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    curl \
    ca-certificates \
  && ARCH=$(dpkg --print-architecture) \
  && if [ "$ARCH" = "arm64" ]; then CF_ARCH="arm64"; else CF_ARCH="amd64"; fi \
  && curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" -o /usr/local/bin/cloudflared \
  && chmod +x /usr/local/bin/cloudflared \
  && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy mã nguồn và build giao diện Vite Production
COPY . .
RUN npm run build \
  && mkdir -p /app/server_data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Thư mục lưu trữ dữ liệu SQLite (WAL) bên ngoài container
VOLUME ["/app/server_data"]

CMD ["npx", "tsx", "server.ts", "--prod"]

import { app } from './api/app.js';
import { tunnelService } from './api/tunnelService.js';
import { dbService } from './api/databaseService.js';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startLocalServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProdFlag = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
  const autoStartTunnel = process.argv.includes('--tunnel') || process.env.AUTO_START_TUNNEL === 'true';

  tunnelService.setPort(PORT);

  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.resolve(distDir, 'index.html');

  // Nếu chạy chế độ Production (--prod) và đã có thư mục build /dist thì phục vụ trực tiếp siêu tốc
  if (isProdFlag && fs.existsSync(distIndex)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(distIndex);
    });
  } else {
    // Chế độ Development hoặc chạy trực tiếp với Vite Middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: true,
        watch: {
          ignored: [
            '**/server_data/**',
            '**/server_data/*',
            '**/server_data/**/*',
            '**/*.sqlite*',
            '**/*.json',
            '**/dist/**',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', async () => {
    const { primaryIp, lanUrls } = tunnelService.getLanAddresses(PORT);
    const sqliteDiag = dbService.getSqliteDiagnostics();

    console.log(`\n========================================================================`);
    console.log(`🏥 PHÒNG KHÁM BS. TRẦN VĂN DIỆU - LOCAL-FIRST ARCHITECTURE READY`);
    console.log(`   • Máy tính này (Local):   http://localhost:${PORT}`);
    console.log(`   • Điện thoại/iPad (LAN):  ${lanUrls[0] || `http://${primaryIp}:${PORT}`}`);
    console.log(`   • Cơ sở dữ liệu SQLite:   server_data/clinic.sqlite (WAL 0.1ms)`);
    console.log(`   • Kho dược phẩm nội bộ:   ${sqliteDiag.drugsCount.toLocaleString('vi-VN')} biệt dược`);
    console.log(`========================================================================\n`);

    if (autoStartTunnel) {
      console.log(`⏳ Đang tự động bật kết nối từ xa Cloudflare Tunnel...`);
      const res = await tunnelService.startTunnel(PORT);
      if (res.success && res.publicUrl) {
        console.log(`✅ [CLOUDFLARE TUNNEL SẴN SÀNG]: ${res.publicUrl}\n`);
      } else if (res.error) {
        console.warn(`⚠️ [Cloudflare Tunnel]: ${res.error}\n`);
      }
    }
  });
}

startLocalServer();

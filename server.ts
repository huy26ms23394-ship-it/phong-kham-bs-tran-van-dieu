import { app } from './api/app.js';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startLocalServer() {
  const PORT = Number(process.env.PORT) || 3001;

  // Mount Vite middlewares in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: true,
        watch: {
          ignored: [
            '**/server_data/**',
            '**/server_data/*',
            '**/server_data/**/*',
            '**/*.json',
            '**/dist/**',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=============================================================`);
    console.log(`🏥 PHÒNG KHÁM BS. TRẦN VĂN DIỆU - LOCAL SERVER READY`);
    console.log(`   • URL: http://localhost:${PORT}`);
    console.log(`   • Serverless mode available via /api/* on Vercel`);
    console.log(`=============================================================\n`);
  });
}

startLocalServer();

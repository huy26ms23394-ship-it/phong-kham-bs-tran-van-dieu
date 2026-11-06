import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    server: {
      host: true,
      port: 3001,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR === 'true' ? false : { port: 24679 },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Luôn bỏ qua thư mục server_data và file JSON runtime để tránh kích hoạt full reload trang
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: [
                '**/server_data/**',
                '**/server_data/*',
                '**/server_data/**/*',
                '**/*.json',
                '**/dist/**',
              ],
            },
    },
    preview: {
      host: true,
      port: 3001,
    },
  };
});

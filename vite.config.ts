import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'NabungPintar',
        short_name: 'NabungPintar',
        description: 'Aplikasi pencatat keuangan dan tabungan cerdas keluarga Indonesia',
        theme_color: '#0B1120',
        background_color: '#0B1120',
        display: 'standalone',
        start_url: '/',
        icons: [
          {\n            src: 'pwa-192x192.png',\n            sizes: '192x192',\n            type: 'image/png'\n          },\n          {\n            src: 'pwa-512x512.png',\n            sizes: '512x512',\n            type: 'image/png'\n          },\n          {\n            src: 'pwa-512x512.png',\n            sizes: '512x512',\n            type: 'image/png',\n            purpose: 'any maskable'\n          }\n        ]
      }
    })
  ]
});

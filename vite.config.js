import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const baseUrl = process.env.NODE_ENV === 'production' ? '/be-pung-app/' : '/'

export default defineConfig({
  base: baseUrl,
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['favicon.ico', 'pwa-icon.svg'],
      manifest: {
        name: 'PersonalApp — Dashboard & Produktivitas',
        short_name: 'PersonalApp',
        description: 'Dashboard Manajemen Pribadi, Finansial, dan Kebiasaan Harian',
        theme_color: '#4a6b53',
        background_color: '#f7faf7',
        display: 'standalone',
        orientation: 'portrait',
        scope: baseUrl,
        start_url: baseUrl,
        icons: [
          {
            src: `${baseUrl}pwa-icon.svg`,
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: `${baseUrl}index.html`,
        navigateFallbackDenylist: [/^\/api/, /^\/broadcasting/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      '9knv83ss-5173.asse.devtunnels.ms',
      '9knv83ss-8000.asse.devtunnels.ms',
      '.asse.devtunnels.ms',
      '.devtunnels.ms',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/broadcasting': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

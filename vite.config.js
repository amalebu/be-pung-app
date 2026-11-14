import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true' || process.env.VITE_BASE_PATH === '/be-pung-app/'
const baseUrl = isGitHubPages ? '/be-pung-app/' : '/'

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
      includeAssets: [
        'favicon.ico',
        'pwa-icon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-192x192.png',
        'pwa-maskable-512x512.png',
      ],
      manifest: {
        id: baseUrl,
        name: 'PersonalApp — Dashboard & Produktivitas',
        short_name: 'PersonalApp',
        description: 'Dashboard Manajemen Pribadi, Finansial, dan Kebiasaan Harian',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: baseUrl,
        start_url: baseUrl,
        categories: ['productivity', 'finance', 'lifestyle'],
        icons: [
          {
            src: `${baseUrl}pwa-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${baseUrl}pwa-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${baseUrl}pwa-maskable-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${baseUrl}pwa-maskable-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${baseUrl}pwa-icon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
  optimizeDeps: {
    include: ['@iconoir/vue'],
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

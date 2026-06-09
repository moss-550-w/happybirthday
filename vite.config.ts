import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
// HTTPS_SPIKE=1 时启用自签名证书，供真机（iOS 摄像头强制 HTTPS）局域网调试。
const useHttps = process.env.HTTPS_SPIKE === '1';

export default defineConfig({
  // 相对路径基址：兼容 GitHub Pages 项目页（/<repo>/）且无需写死仓库名。
  // 若改用自定义域名或根路径部署，可改为 '/'。
  base: './',
  plugins: [
    react(),
    ...(useHttps ? [basicSsl()] : []),
    VitePWA({
      registerType: 'prompt', // 新版本提示用户刷新，避免 AR 体验中途自动重载
      injectRegister: null, // 注册由 useServiceWorker hook 手动接管
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'AR 生日祝福贺卡',
        short_name: 'AR贺卡',
        description: '扫码识别卡片，触发 3D 蛋糕与生日祝福',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 壳 precache：html/css/小图标/小 chunk；
        // 排除重资源（mindar/three 引擎 chunk），交由运行时 CacheFirst。
        globPatterns: ['**/*.{html,css,js,svg,png,ico,webmanifest}'],
        globIgnores: ['**/mindar-image.prod-*.js', '**/CakeModel-*.js'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // AR 引擎重 chunk（mindar 含 tfjs、CakeModel 含 three）：首次用后离线可用
            urlPattern: ({ url }) =>
              url.pathname.includes('/assets/') && url.pathname.endsWith('.js'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ar-engine-js',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.glb'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cake-models',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.mind'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ar-targets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 个性化配置：优先联网（编辑后及时生效），离线回退缓存
            urlPattern: ({ url }) => /config\/.*\.json$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'config',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false }, // 开发时禁用 SW，避免干扰 HMR；用 preview 验证
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 真机调试需局域网访问；iOS 摄像头要求 HTTPS，
    // 届时可启用 @vitejs/plugin-basic-ssl（M1 真机验证时引入）。
    host: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    // 分包（SPIKE-M1 P1）：依赖动态边界自动切分——
    //   - ARCanvas/FallbackScene 经 React.lazy → three/R3F 进 async chunk
    //   - mind-ar 经 arHelper 的 import() → tfjs 进 async chunk
    // 首屏 entry 仅含 React 壳；不手动 manualChunks，避免 vite 预载辅助
    // 函数被并入 vendor chunk 而令其被 eager 预载。
    chunkSizeWarningLimit: 1800,
  },
});

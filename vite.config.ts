import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
// HTTPS_SPIKE=1 时启用自签名证书，供真机（iOS 摄像头强制 HTTPS）局域网调试。
const useHttps = process.env.HTTPS_SPIKE === '1';

export default defineConfig({
  // 相对路径基址：兼容 GitHub Pages 项目页（/<repo>/）且无需写死仓库名。
  // 若改用自定义域名或根路径部署，可改为 '/'。
  base: './',
  plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
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
  },
});

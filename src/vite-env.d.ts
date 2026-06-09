/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** 生产资源 CDN 前缀（见 .env.production） */
  readonly VITE_ASSET_CDN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

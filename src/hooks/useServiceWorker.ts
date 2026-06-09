import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface SWState {
  /** 有新版本可用，等待用户确认刷新 */
  needRefresh: boolean;
  /** 已缓存就绪，可离线使用 */
  offlineReady: boolean;
  /** 应用新版本并重载 */
  update: () => void;
}

/**
 * Service Worker 注册与更新管理。
 * registerType='prompt'：发现新版本不自动重载，
 * 交由 UI 提示用户，避免 AR 体验中途被打断。
 */
export function useServiceWorker(): SWState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
    // updateSW(true) 会激活新 SW 并重载
    setUpdateFn(() => () => void updateSW(true));
  }, []);

  return {
    needRefresh,
    offlineReady,
    update: () => updateFn?.(),
  };
}

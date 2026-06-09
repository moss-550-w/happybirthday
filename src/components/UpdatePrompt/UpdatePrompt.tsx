import { useState } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import styles from './UpdatePrompt.module.css';

/**
 * SW 状态提示：新版本可用 → 刷新；离线就绪 → 短暂提示。
 */
export default function UpdatePrompt() {
  const { needRefresh, offlineReady, update } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (needRefresh) {
    return (
      <div className={styles.bar}>
        <span>发现新版本</span>
        <button className={styles.primary} onClick={update}>
          刷新
        </button>
        <button className={styles.ghost} onClick={() => setDismissed(true)}>
          稍后
        </button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className={styles.bar}>
        <span>✅ 已可离线使用</span>
        <button className={styles.ghost} onClick={() => setDismissed(true)}>
          知道了
        </button>
      </div>
    );
  }

  return null;
}

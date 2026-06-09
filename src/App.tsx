import { useConfig } from '@/components/ConfigManager/useConfig';
import styles from './App.module.css';

/**
 * 应用根组件（M0 占位）。
 * 后续里程碑将在此挂载手势激活覆盖层、ARScene 与降级模式。
 */
export default function App() {
  const config = useConfig();

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>🎂 AR 生日贺卡</h1>
      <p className={styles.greeting}>
        {config.message}，{config.name}
      </p>
      <p className={styles.hint}>工程骨架已就绪（M0）。AR 体验将在后续里程碑接入。</p>
    </main>
  );
}

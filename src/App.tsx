import { ARProvider } from '@/components/ARScene/ARContext';
import ARScene from '@/components/ARScene/ARScene';
import { useConfig } from '@/components/ConfigManager/useConfig';
import styles from './App.module.css';

/**
 * 应用根组件：AR 贺卡主流程。
 * 首屏仅 React 壳 + 手势覆盖层（three/mind-ar 经 P1 懒加载）。
 */
export default function App() {
  const config = useConfig();

  return (
    <ARProvider>
      <ARScene />
      {/* 祝福语浮层（M4 接入页内编辑） */}
      <div className={styles.greeting}>
        <span className={styles.message}>{config.message}</span>
        <span className={styles.name}>致 {config.name}</span>
      </div>
    </ARProvider>
  );
}

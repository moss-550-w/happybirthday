import { ConfigProvider } from '@/components/ConfigManager/ConfigContext';
import GreetingEditor from '@/components/ConfigManager/GreetingEditor';
import { ARProvider } from '@/components/ARScene/ARContext';
import ARScene from '@/components/ARScene/ARScene';

/**
 * 应用根组件：AR 贺卡主流程。
 * 首屏仅 React 壳 + 手势覆盖层（three/mind-ar 经 P1 懒加载）。
 */
export default function App() {
  return (
    <ConfigProvider>
      <ARProvider>
        <ARScene />
        <GreetingEditor />
      </ARProvider>
    </ConfigProvider>
  );
}

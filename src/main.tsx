import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// M1 Spike：临时入口指向集成验证页；M2 起恢复为 './App'。
import App from './spike/SpikeApp';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('根节点 #root 未找到');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

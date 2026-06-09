import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
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

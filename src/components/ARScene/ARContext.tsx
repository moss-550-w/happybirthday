import { createContext, useContext, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { arReducer } from './arMachine';
import { initialARState } from './arTypes';
import type { ARAction, ARState, AnchorData, AnchorRef } from './arTypes';

interface ARContextValue {
  state: ARState;
  dispatch: React.Dispatch<ARAction>;
  /** 锚点矩阵共享引用（每帧读写，不触发渲染） */
  anchorRef: AnchorRef;
}

const ARContext = createContext<ARContextValue | null>(null);

export function ARProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(arReducer, initialARState);
  const anchorRef = useRef<AnchorData>({ worldMatrix: null, postMatrix: null });

  return (
    <ARContext.Provider value={{ state, dispatch, anchorRef }}>
      {children}
    </ARContext.Provider>
  );
}

export function useAR(): ARContextValue {
  const ctx = useContext(ARContext);
  if (!ctx) throw new Error('useAR 必须在 ARProvider 内使用');
  return ctx;
}

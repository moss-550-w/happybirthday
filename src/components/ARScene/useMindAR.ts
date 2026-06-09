import { useEffect, useRef, useState } from 'react';
import { startARSession, ARError } from '@/utils/arHelper';
import type { ARSession } from '@/utils/arHelper';
import type { AnchorRef, ARError as ARErrorState, CameraParams } from './arTypes';

interface UseMindARArgs {
  /** 为 true 时启动追踪（对应 phase==='initializing'） */
  active: boolean;
  targetSrc: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  anchorRef: AnchorRef;
  onReady: (cameraParams: CameraParams) => void;
  onFound: () => void;
  onLost: () => void;
  onFail: (error: ARErrorState) => void;
}

/**
 * 把 arHelper 会话接入 React 生命周期与状态机 dispatch。
 * 负责：启动、取消（卸载/依赖变更）、摄像头释放。
 */
export function useMindAR({
  active,
  targetSrc,
  videoRef,
  containerRef,
  anchorRef,
  onReady,
  onFound,
  onLost,
  onFail,
}: UseMindARArgs): void {
  const sessionRef = useRef<ARSession | null>(null);
  // 回调存 ref，避免因 props 变化重启会话
  const cbRef = useRef({ onReady, onFound, onLost, onFail });
  cbRef.current = { onReady, onFound, onLost, onFail };
  const [, force] = useState(0);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) {
      // ref 尚未挂载，触发一次重渲染以重试
      force((n) => n + 1);
      return;
    }

    const ac = new AbortController();
    let disposed = false;
    const anchor = anchorRef.current; // 稳定对象，cleanup 中安全引用

    startARSession({
      targetSrc,
      video,
      container,
      signal: ac.signal,
      callbacks: {
        onMatrix: (m) => {
          anchor.worldMatrix = m;
        },
        onFound: () => cbRef.current.onFound(),
        onLost: () => cbRef.current.onLost(),
      },
    })
      .then((session) => {
        if (disposed) {
          session.stop();
          return;
        }
        sessionRef.current = session;
        anchor.postMatrix = session.postMatrix;
        cbRef.current.onReady(session.cameraParams);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || disposed) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const kind = err instanceof ARError ? err.kind : 'unknown';
        const message = err instanceof Error ? err.message : String(err);
        cbRef.current.onFail({ kind, message });
      });

    return () => {
      disposed = true;
      ac.abort();
      sessionRef.current?.stop();
      sessionRef.current = null;
      anchor.worldMatrix = null;
      anchor.postMatrix = null;
    };
  }, [active, targetSrc, videoRef, containerRef, anchorRef]);
}

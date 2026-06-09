import { useEffect, useRef, useState } from 'react';

interface UsePerfArgs {
  /** 是否运行监控（仅 AR 体验进行中开启） */
  enabled: boolean;
  /** 已降级则停止触发（避免重复 dispatch） */
  degraded: boolean;
  /** 触发降级回调 */
  onDegrade: () => void;
  /** 降级帧率阈值，默认 25fps */
  fpsThreshold?: number;
  /** 连续低帧帧数，默认 30 */
  consecutiveFrames?: number;
}

/**
 * requestAnimationFrame 采样帧率。
 * 连续 `consecutiveFrames` 帧低于 `fpsThreshold` → onDegrade。
 * fps 每 ~500ms 节流更新一次，避免每帧重渲染。
 */
export function usePerformanceMonitor({
  enabled,
  degraded,
  onDegrade,
  fpsThreshold = 25,
  consecutiveFrames = 30,
}: UsePerfArgs): { fps: number } {
  const [fps, setFps] = useState(60);
  const onDegradeRef = useRef(onDegrade);
  onDegradeRef.current = onDegrade;

  useEffect(() => {
    if (!enabled) return;

    const frameBudget = 1000 / fpsThreshold; // 低于此帧时长视为掉帧
    let rafId = 0;
    let last = performance.now();
    let lowStreak = 0;
    let acc = 0;
    let accCount = 0;
    let accStart = last;
    let stopped = false;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      // 连续掉帧计数（仅未降级时累计）
      if (!degraded) {
        if (dt > frameBudget) {
          lowStreak += 1;
          if (lowStreak >= consecutiveFrames) {
            stopped = true;
            onDegradeRef.current();
          }
        } else {
          lowStreak = 0;
        }
      }

      // 节流 fps 显示
      acc += dt;
      accCount += 1;
      if (now - accStart >= 500) {
        setFps(Math.round(1000 / (acc / accCount)));
        acc = 0;
        accCount = 0;
        accStart = now;
      }

      if (!stopped) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, degraded, fpsThreshold, consecutiveFrames]);

  return { fps };
}

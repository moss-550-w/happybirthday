/**
 * 帧率监控与自动降级（占位）。
 * TODO(M3): requestAnimationFrame 采样帧率，连续 30 帧 < 25fps 触发降级
 *           （关粒子/阴影/半透明），提供恢复按钮。
 */
export interface PerformanceState {
  fps: number;
  degraded: boolean;
}

export function usePerformanceMonitor(): PerformanceState {
  return { fps: 60, degraded: false };
}

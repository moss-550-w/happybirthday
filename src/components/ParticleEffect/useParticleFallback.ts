import { useMemo } from 'react';
import { isLowEndDevice } from '@/utils/performance';

/**
 * 粒子启用判定：低端设备直接禁用；运行时降级时也禁用。
 * lowEnd 一次性评估（设备能力不变），degraded 由帧率监控驱动。
 */
export function useParticleFallback(degraded: boolean): { enabled: boolean } {
  const lowEnd = useMemo(() => isLowEndDevice(), []);
  return { enabled: !lowEnd && !degraded };
}

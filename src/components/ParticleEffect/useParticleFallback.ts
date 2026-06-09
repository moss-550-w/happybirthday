/**
 * 粒子降级判定（占位）。
 * TODO(M3): 结合 getGPUInfo 与帧率监测，低端设备完全禁用粒子。
 */
export function useParticleFallback(): { enabled: boolean } {
  return { enabled: true };
}

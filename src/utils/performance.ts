export interface GPUInfo {
  vendor: string;
  renderer: string;
}

/** 是否支持 WebGL（不支持则 3D 渲染不可用）。 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

/** 读取 GPU 信息（WEBGL_debug_renderer_info）；失败返回 null。 */
export function getGPUInfo(): GPUInfo | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;
    const vendor = String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? '');
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '');
    return { vendor, renderer };
  } catch {
    return null;
  }
}

/** deviceMemory 为非标准 API，单独声明（不与 lib.dom 的 Navigator 冲突）。 */
interface NavigatorMemory {
  deviceMemory?: number;
}

/**
 * 低端设备启发式判定（用于直接禁用粒子）。
 * 命中任一：内存 ≤ 2GB、逻辑核 ≤ 4、GPU 命中已知低端关键字。
 * 仅作初始保守判断，运行时仍以帧率监控为准。
 */
export function isLowEndDevice(): boolean {
  const mem = (navigator as Navigator & NavigatorMemory).deviceMemory;
  if (typeof mem === 'number' && mem <= 2) return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return true;
  }
  const gpu = getGPUInfo();
  if (gpu) {
    const r = gpu.renderer.toLowerCase();
    // 常见低端/省电 GPU 关键字
    const lowEndHints = ['mali-4', 'mali-t', 'adreno 3', 'adreno 4', 'powervr'];
    if (lowEndHints.some((h) => r.includes(h))) return true;
  }
  return false;
}

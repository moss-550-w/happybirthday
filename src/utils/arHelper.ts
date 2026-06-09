import type { CameraParams } from '@/components/ARScene/arTypes';
import { isWebGLSupported } from './performance';

export class ARError extends Error {
  kind: 'unsupported' | 'permission' | 'init' | 'unknown';
  constructor(kind: ARError['kind'], message: string) {
    super(message);
    this.name = 'ARError';
    this.kind = kind;
  }
}

export interface ARSessionCallbacks {
  /** 每帧矩阵更新；worldMatrix 为 null 表示丢失 */
  onMatrix: (worldMatrix: number[] | null) => void;
  /** 识别到目标 */
  onFound: () => void;
  /** 丢失目标 */
  onLost: () => void;
}

export interface ARSessionConfig {
  targetSrc: string;
  video: HTMLVideoElement;
  container: HTMLElement;
  /** 取消信号：组件卸载 / 超时时触发，安全中止启动流程 */
  signal: AbortSignal;
  callbacks: ARSessionCallbacks;
}

export interface ARSession {
  cameraParams: CameraParams;
  /** 目标后置修正矩阵，调用方写入 anchorRef.current.postMatrix */
  postMatrix: number[];
  stop: () => void;
}

/**
 * postMatrix：还原 MindARThree._startAR 的目标修正（居中 + 均匀缩放）。
 * dims=[w,h] 归一化（w 通常为 1）。列主序 4x4。
 */
function buildPostMatrix(width: number, height: number): number[] {
  const px = width / 2;
  const py = width / 2 + (height - width) / 2;
  const s = width;
  // prettier-ignore
  return [
    s, 0, 0, 0,
    0, s, 0, 0,
    0, 0, s, 0,
    px, py, 0, 1,
  ];
}

/** 由投影矩阵 + 尺寸推导 PerspectiveCamera 参数（移植 MindARThree.resize）。 */
function computeCameraParams(
  proj: number[],
  inputWidth: number,
  inputHeight: number,
  containerW: number,
  containerH: number,
): CameraParams {
  const p = containerW / containerH;
  const c = inputWidth / inputHeight;

  let h: number;
  if (c > p) {
    h = containerH;
  } else {
    h = (containerW / inputWidth) * inputHeight;
  }
  const g = containerH / h;

  const fov = (2 * Math.atan((1 / proj[5]) * g) * 180) / Math.PI;
  const near = proj[14] / (proj[10] - 1);
  const far = proj[14] / (proj[10] + 1);
  const aspect = containerW / containerH;

  return { fov, near, far, aspect };
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
}

/**
 * 启动一次 AR 会话（方案①：底层 Controller + 外部渲染）。
 * mind-ar 经 dynamic import 懒加载（P1），点击激活后才下载 tfjs。
 */
export async function startARSession(
  config: ARSessionConfig,
): Promise<ARSession> {
  const { targetSrc, video, container, signal, callbacks } = config;

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new ARError('unsupported', '当前浏览器不支持摄像头');
  }
  if (!isWebGLSupported()) {
    throw new ARError('unsupported', '当前浏览器不支持 WebGL');
  }

  // 懒加载 mind-ar（含 tfjs），首屏不下载
  let Controller: typeof import('mind-ar/dist/mindar-image.prod.js').Controller;
  try {
    const mod = await import('mind-ar/dist/mindar-image.prod.js');
    Controller = mod.Controller;
  } catch (err) {
    throw new ARError('init', `AR 引擎加载失败: ${String(err)}`);
  }
  throwIfAborted(signal);

  // 摄像头
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'environment' },
    });
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new ARError('permission', '摄像头权限被拒绝');
    }
    throw new ARError('unknown', `摄像头打开失败: ${String(err)}`);
  }
  if (signal.aborted) {
    stream.getTracks().forEach((t) => t.stop());
    throw new DOMException('aborted', 'AbortError');
  }

  video.srcObject = stream;
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      void video.play();
      resolve();
    };
  });
  throwIfAborted(signal);

  const inputWidth = video.videoWidth;
  const inputHeight = video.videoHeight;

  let foundState = false;
  const controller = new Controller({
    inputWidth,
    inputHeight,
    maxTrack: 1,
    onUpdate: (data) => {
      if (data.type !== 'updateMatrix') return;
      callbacks.onMatrix(data.worldMatrix);
      const now = data.worldMatrix !== null;
      if (now !== foundState) {
        foundState = now;
        if (now) callbacks.onFound();
        else callbacks.onLost();
      }
    },
  });

  let postMatrix: number[];
  try {
    const { dimensions } = await controller.addImageTargets(targetSrc);
    const [w, h] = dimensions[0];
    postMatrix = buildPostMatrix(w, h);
  } catch (err) {
    stream.getTracks().forEach((t) => t.stop());
    throw new ARError('init', `标记图加载失败: ${String(err)}`);
  }
  throwIfAborted(signal);

  const proj = controller.getProjectionMatrix();
  const cameraParams = computeCameraParams(
    proj,
    inputWidth,
    inputHeight,
    container.clientWidth,
    container.clientHeight,
  );

  await controller.dummyRun(video);
  throwIfAborted(signal);
  controller.processVideo(video);

  const stop = () => {
    try {
      controller.stopProcessVideo();
    } catch {
      /* 忽略 */
    }
    stream.getTracks().forEach((t) => t.stop());
    if (video.srcObject) video.srcObject = null;
  };

  return { cameraParams, postMatrix, stop };
}

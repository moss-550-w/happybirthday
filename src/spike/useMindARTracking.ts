import { useEffect, useRef, useState } from 'react';
import { Controller } from 'mind-ar/dist/mindar-image.prod.js';

export type TrackingStatus =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'tracking'
  | 'error';

export interface CameraParams {
  fov: number;
  near: number;
  far: number;
  aspect: number;
}

/**
 * 锚点矩阵共享引用：onUpdate 每帧写入，R3F useFrame 每帧读取。
 * 走 ref 而非 state，避免每帧触发 React 重渲染（性能关键）。
 */
export interface AnchorRef {
  /** 列主序 16 元素 worldMatrix；丢失追踪为 null */
  worldMatrix: number[] | null;
  /** 目标后置修正矩阵（居中 + 尺度），addImageTargets 后计算一次 */
  postMatrix: number[] | null;
}

interface UseMindARArgs {
  targetSrc: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  /** 用户手势触发后置 true，满足摄像头/自动播放策略 */
  active: boolean;
}

interface UseMindARResult {
  status: TrackingStatus;
  found: boolean;
  errorMsg: string | null;
  anchorRef: React.RefObject<AnchorRef>;
  cameraParams: CameraParams | null;
}

/**
 * postMatrix：还原 MindARThree._startAR 中的目标修正。
 * dims=[w,h]（归一化，w 通常为 1）。position 居中，scale=(w,w,w)。
 */
function buildPostMatrix(width: number, height: number): number[] {
  // 列主序 4x4：仅平移 + 均匀缩放
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

/**
 * 由投影矩阵 + 容器/视频尺寸推导 PerspectiveCamera 参数。
 * 忠实移植 MindARThree.resize() 的 cover-fit 推导。
 */
function computeCameraParams(
  proj: number[],
  inputWidth: number,
  inputHeight: number,
  containerW: number,
  containerH: number,
): CameraParams {
  const p = containerW / containerH;
  const c = inputWidth / inputHeight;

  // d：源码中 video.width===inputWidth，cover 场景下恒为 1，这里保留推导以防尺寸差异
  const d = c > p ? 1 : 1;

  let h: number;
  if (c > p) {
    h = containerH * d;
  } else {
    h = ((containerW / inputWidth) * inputHeight) * d;
  }
  const g = containerH / h;

  const fov = (2 * Math.atan((1 / proj[5]) * g) * 180) / Math.PI;
  const near = proj[14] / (proj[10] - 1);
  const far = proj[14] / (proj[10] + 1);
  const aspect = containerW / containerH;

  return { fov, near, far, aspect };
}

export function useMindARTracking({
  targetSrc,
  videoRef,
  containerRef,
  active,
}: UseMindARArgs): UseMindARResult {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [found, setFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraParams, setCameraParams] = useState<CameraParams | null>(null);

  const anchorRef = useRef<AnchorRef>({ worldMatrix: null, postMatrix: null });
  const controllerRef = useRef<Controller | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    async function start() {
      try {
        setStatus('starting');

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('当前浏览器不支持摄像头');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video!.srcObject = stream;
        await new Promise<void>((resolve) => {
          video!.onloadedmetadata = () => {
            void video!.play();
            resolve();
          };
        });
        if (cancelled) return;

        const inputWidth = video!.videoWidth;
        const inputHeight = video!.videoHeight;

        const controller = new Controller({
          inputWidth,
          inputHeight,
          maxTrack: 1,
          onUpdate: (data) => {
            if (data.type !== 'updateMatrix') return;
            anchorRef.current.worldMatrix = data.worldMatrix;
            setFound((prev) => {
              const now = data.worldMatrix !== null;
              return prev === now ? prev : now;
            });
          },
        });
        controllerRef.current = controller;

        const { dimensions } = await controller.addImageTargets(targetSrc);
        if (cancelled) return;
        const [w, h] = dimensions[0];
        anchorRef.current.postMatrix = buildPostMatrix(w, h);

        const proj = controller.getProjectionMatrix();
        setCameraParams(
          computeCameraParams(
            proj,
            inputWidth,
            inputHeight,
            container!.clientWidth,
            container!.clientHeight,
          ),
        );

        setStatus('scanning');
        await controller.dummyRun(video!);
        if (cancelled) return;
        controller.processVideo(video!);
        setStatus('tracking');
      } catch (err) {
        if (cancelled) return;
        console.error('[MindAR] 启动失败', err);
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    }

    void start();

    return () => {
      cancelled = true;
      try {
        controllerRef.current?.stopProcessVideo();
      } catch {
        /* 忽略停止异常 */
      }
      controllerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (video) video.srcObject = null;
    };
  }, [active, targetSrc, videoRef, containerRef]);

  return { status, found, errorMsg, anchorRef, cameraParams };
}

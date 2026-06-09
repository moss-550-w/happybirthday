import type { MutableRefObject } from 'react';

/** AR 会话阶段 */
export type ARPhase =
  | 'idle' // 初始，等待用户手势
  | 'initializing' // 加载 mind-ar、请求摄像头、预热
  | 'scanning' // 追踪运行中，未识别到目标
  | 'tracking' // 已识别并跟随
  | 'fallback' // 纯 3D 降级（无 AR）
  | 'error'; // 不可恢复错误

/** 错误分类，决定降级 UI */
export type ARErrorKind =
  | 'unsupported' // 无 mediaDevices / WebGL
  | 'permission' // 摄像头权限被拒
  | 'init' // mind-ar 初始化 / .mind 加载失败
  | 'unknown';

export interface ARError {
  kind: ARErrorKind;
  message: string;
}

export interface CameraParams {
  fov: number;
  near: number;
  far: number;
  aspect: number;
}

/**
 * 锚点共享引用：arHelper.onUpdate 每帧写入，R3F useFrame 每帧读取。
 * 走 ref 而非 state，避免每帧 React 重渲染。
 */
export interface AnchorData {
  /** 列主序 16 元素 worldMatrix；丢失追踪为 null */
  worldMatrix: number[] | null;
  /** 目标后置修正矩阵（居中 + 尺度） */
  postMatrix: number[] | null;
}

export type AnchorRef = MutableRefObject<AnchorData>;

export interface ARState {
  phase: ARPhase;
  /** 是否曾经识别成功（控制音乐/粒子首次触发） */
  everFound: boolean;
  /** 性能降级：关闭粒子/半透明特效 */
  degraded: boolean;
  error: ARError | null;
  cameraParams: CameraParams | null;
}

export type ARAction =
  | { type: 'ACTIVATE' } // 用户手势
  | { type: 'READY'; cameraParams: CameraParams } // 追踪管线就绪
  | { type: 'TARGET_FOUND' }
  | { type: 'TARGET_LOST' }
  | { type: 'FALLBACK' } // 进入纯 3D 模式
  | { type: 'FAIL'; error: ARError }
  | { type: 'DEGRADE' } // 性能降级
  | { type: 'RESTORE' } // 恢复高质量
  | { type: 'RESET' };

export const initialARState: ARState = {
  phase: 'idle',
  everFound: false,
  degraded: false,
  error: null,
  cameraParams: null,
};

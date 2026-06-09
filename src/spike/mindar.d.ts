// 最小类型声明：mind-ar 1.2.5 未随包发布 d.ts。
// 仅声明方案①（底层 Controller）实际使用的成员；签名依据 dist 源码逆向。
declare module 'mind-ar/dist/mindar-image.prod.js' {
  export interface ControllerUpdate {
    type: 'updateMatrix' | string;
    targetIndex: number;
    /** three.js 列主序 16 元素世界矩阵；丢失追踪时为 null */
    worldMatrix: number[] | null;
  }

  export interface ControllerOptions {
    inputWidth: number;
    inputHeight: number;
    maxTrack?: number;
    filterMinCF?: number | null;
    filterBeta?: number | null;
    warmupTolerance?: number | null;
    missTolerance?: number | null;
    onUpdate?: (data: ControllerUpdate) => void;
  }

  export class Controller {
    constructor(options: ControllerOptions);
    inputWidth: number;
    inputHeight: number;
    /** 列主序投影矩阵（16 元素） */
    getProjectionMatrix(): number[];
    /** 加载 .mind 目标，返回各目标的 [width, height] 归一化尺寸 */
    addImageTargets(
      url: string,
    ): Promise<{ dimensions: [number, number][] }>;
    /** 预热 TF/GPU 管线 */
    dummyRun(video: HTMLVideoElement): Promise<void>;
    processVideo(video: HTMLVideoElement): void;
    stopProcessVideo(): void;
  }

  export class Compiler {
    compileImageTargets(
      images: HTMLImageElement[],
      progress: (percent: number) => void,
    ): Promise<unknown>;
    exportData(): Promise<ArrayBuffer>;
  }

  export class UI {
    constructor(options: { uiLoading?: string; uiScanning?: string; uiError?: string });
  }
}

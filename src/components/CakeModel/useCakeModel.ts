import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three-stdlib';
import type { Group, Object3D } from 'three';
import { Mesh } from 'three';
import { withTimeout } from '@/utils/resourceLoader';

export type CakeLoadStatus = 'loading' | 'loaded' | 'error';

interface UseCakeModelResult {
  status: CakeLoadStatus;
  scene: Group | null;
}

const LOAD_TIMEOUT_MS = 5000;

/** 释放 GLTF 场景的 geometry/material（Claude.md 内存规范）。 */
function disposeScene(root: Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.geometry?.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    }
  });
}

/**
 * 加载 GLB 蛋糕模型，带 5s 超时。
 * src 为空 → 直接 error（调用方回退程序化蛋糕）。
 * 超时 / 加载失败 → error，并触发容错清单「GLB 超时占位」。
 * 卸载时释放资源。
 */
export function useCakeModel(src: string | undefined): UseCakeModelResult {
  const [status, setStatus] = useState<CakeLoadStatus>(
    src ? 'loading' : 'error',
  );
  const [scene, setScene] = useState<Group | null>(null);

  useEffect(() => {
    if (!src) {
      setStatus('error');
      setScene(null);
      return;
    }

    let disposed = false;
    let loaded: Group | null = null;
    setStatus('loading');

    const loader = new GLTFLoader();
    withTimeout(loader.loadAsync(src), LOAD_TIMEOUT_MS, 'GLB 模型')
      .then((gltf) => {
        if (disposed) {
          disposeScene(gltf.scene);
          return;
        }
        loaded = gltf.scene;
        setScene(gltf.scene);
        setStatus('loaded');
      })
      .catch((err: unknown) => {
        if (disposed) return;
        console.warn('[cake] GLB 加载失败，回退程序化蛋糕:', err);
        setStatus('error');
        setScene(null);
      });

    return () => {
      disposed = true;
      if (loaded) disposeScene(loaded);
    };
  }, [src]);

  return { status, scene };
}

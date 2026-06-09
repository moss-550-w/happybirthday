import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { assetUrl } from '@/utils/resourceLoader';
import { useCakeModel } from './useCakeModel';
import ProceduralCake from './ProceduralCake';

interface CakeModelProps {
  floatAmplitude?: number;
  floatSpeed?: number;
}

// GLB 资产路径；文件不存在时 useCakeModel 回退程序化蛋糕。
const CAKE_GLB = assetUrl('models/cake.glb');

/**
 * 蛋糕模型容器：上下浮动（不旋转，避免眩晕）。
 * 优先加载 GLB；加载中 / 超时 / 失败 → 程序化蛋糕兜底。
 * 缩放 0.4（相对卡片宽度，见 design.md）由 GLB 自身或下方统一控制。
 */
export default function CakeModel({
  floatAmplitude = 0.06,
  floatSpeed = 1.6,
}: CakeModelProps) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  const { status, scene } = useCakeModel(CAKE_GLB);

  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) {
      ref.current.position.y = Math.sin(t.current * floatSpeed) * floatAmplitude;
    }
  });

  return (
    <group ref={ref}>
      {status === 'loaded' && scene ? (
        <primitive object={scene} scale={0.4} />
      ) : (
        <ProceduralCake />
      )}
    </group>
  );
}

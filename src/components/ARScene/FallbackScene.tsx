import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CakeModel from '@/components/CakeModel/CakeModel';

/**
 * 纯 3D 降级模式：无 AR 追踪，OrbitControls 手动旋转观看。
 * 用于无摄像头 / 权限拒绝 / MindAR 初始化失败的回退。
 */
export default function FallbackScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      camera={{ position: [0, 0.4, 1.6], fov: 45 }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[1, 2, 1]} intensity={1.4} />
      <CakeModel />
      <OrbitControls
        enablePan={false}
        minDistance={0.8}
        maxDistance={3}
        target={[0, 0.2, 0]}
      />
    </Canvas>
  );
}

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface CakeModelProps {
  /** 浮动幅度（相对单位） */
  floatAmplitude?: number;
  /** 浮动频率 */
  floatSpeed?: number;
}

/**
 * 程序化蛋糕（M2 默认）：底座 + 奶油层 + 蜡烛 + 火苗。
 * 上下浮动、不旋转（避免眩晕，见 design.md）。
 *
 * GLB 替换说明：资产（< 600KB，≤ 15k 面）到位后，
 * 改用 useGLTF(assetUrl('models/cake.glb'))，并在卸载时
 * gltf.scene.traverse 释放 geometry/material（Claude.md 规范）。
 * 程序化几何体由 R3F 声明式管理，卸载自动释放，无需手动 dispose。
 */
export default function CakeModel({
  floatAmplitude = 0.06,
  floatSpeed = 1.6,
}: CakeModelProps) {
  const ref = useRef<Group>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) {
      ref.current.position.y = Math.sin(t.current * floatSpeed) * floatAmplitude;
    }
  });

  return (
    <group ref={ref}>
      {/* 底座蛋糕体 */}
      <mesh position={[0, 0, 0]} castShadow={false}>
        <cylinderGeometry args={[0.4, 0.42, 0.32, 32]} />
        <meshStandardMaterial color="#8d5524" roughness={0.8} />
      </mesh>
      {/* 奶油层 */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.41, 0.41, 0.1, 32]} />
        <meshStandardMaterial color="#fff0f5" roughness={0.5} />
      </mesh>
      {/* 顶部草莓奶油 */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.42, 0.4, 0.06, 32]} />
        <meshStandardMaterial color="#ff8fab" roughness={0.5} />
      </mesh>
      {/* 蜡烛 */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 12]} />
        <meshStandardMaterial color="#ffd166" />
      </mesh>
      {/* 火苗 */}
      <Flame />
    </group>
  );
}

function Flame() {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) {
      const s = 1 + Math.sin(t.current * 12) * 0.15;
      ref.current.scale.set(1, s, 1);
    }
  });
  return (
    <group ref={ref} position={[0, 0.56, 0]}>
      <mesh>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial
          color="#ffb703"
          emissive="#ff6b00"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

/**
 * 程序化蛋糕：底座 + 奶油层 + 蜡烛 + 火苗。
 * 用作 GLB 缺失 / 加载中 / 超时失败时的回退（容错清单）。
 */
export default function ProceduralCake() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.42, 0.32, 32]} />
        <meshStandardMaterial color="#8d5524" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.41, 0.41, 0.1, 32]} />
        <meshStandardMaterial color="#fff0f5" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.42, 0.4, 0.06, 32]} />
        <meshStandardMaterial color="#ff8fab" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 12]} />
        <meshStandardMaterial color="#ffd166" />
      </mesh>
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

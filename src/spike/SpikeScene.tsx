import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, Matrix4, PerspectiveCamera } from 'three';
import type { AnchorRef, CameraParams } from './useMindARTracking';

const ZERO_MATRIX = new Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1);

/**
 * 锚点组：每帧从 anchorRef 读取 MindAR 矩阵并应用。
 * matrixAutoUpdate=false → 直接覆盖 matrix，符合 Claude.md 规范。
 */
function Anchor({ anchorRef }: { anchorRef: React.RefObject<AnchorRef> }) {
  const groupRef = useRef<Group>(null);
  const tmp = useRef(new Matrix4());
  const post = useRef(new Matrix4());

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !anchorRef.current) return;
    const { worldMatrix, postMatrix } = anchorRef.current;

    if (worldMatrix === null || postMatrix === null) {
      group.visible = false;
      group.matrix.copy(ZERO_MATRIX);
      return;
    }
    group.visible = true;
    tmp.current.fromArray(worldMatrix);
    post.current.fromArray(postMatrix);
    tmp.current.multiply(post.current);
    group.matrix.copy(tmp.current);
  });

  return (
    <group ref={groupRef} matrixAutoUpdate={false}>
      {/* Spike 占位蛋糕：圆柱 + 浮动球，M2 换 GLB */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.4, 24]} />
        <meshStandardMaterial color="#ff6b9d" />
      </mesh>
      <FloatingBall />
    </group>
  );
}

function FloatingBall() {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) ref.current.position.y = 0.5 + Math.sin(t.current * 2) * 0.1;
  });
  return (
    <group ref={ref} position={[0, 0.5, 0]}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffd166" />
      </mesh>
    </group>
  );
}

/** 用 MindAR 推导的参数同步 PerspectiveCamera */
function CameraSync({ params }: { params: CameraParams }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  camera.fov = params.fov;
  camera.near = params.near;
  camera.far = params.far;
  camera.aspect = params.aspect;
  camera.updateProjectionMatrix();
  return null;
}

export default function SpikeScene({
  anchorRef,
  cameraParams,
}: {
  anchorRef: React.RefObject<AnchorRef>;
  cameraParams: CameraParams | null;
}) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      camera={{ position: [0, 0, 0], fov: 45 }}
    >
      {cameraParams && <CameraSync params={cameraParams} />}
      <ambientLight intensity={1.2} />
      <directionalLight position={[1, 1, 1]} intensity={1.5} />
      <Anchor anchorRef={anchorRef} />
    </Canvas>
  );
}

import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, Matrix4, PerspectiveCamera } from 'three';
import CakeModel from '@/components/CakeModel/CakeModel';
import type { AnchorRef, CameraParams } from './arTypes';

const ZERO = new Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1);

/** 锚点组：每帧从 anchorRef 读 MindAR 矩阵并应用（matrixAutoUpdate=false）。 */
function Anchor({ anchorRef }: { anchorRef: AnchorRef }) {
  const groupRef = useRef<Group>(null);
  const world = useRef(new Matrix4());
  const post = useRef(new Matrix4());

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { worldMatrix, postMatrix } = anchorRef.current;
    if (worldMatrix === null || postMatrix === null) {
      group.visible = false;
      group.matrix.copy(ZERO);
      return;
    }
    group.visible = true;
    world.current.fromArray(worldMatrix);
    post.current.fromArray(postMatrix);
    world.current.multiply(post.current);
    group.matrix.copy(world.current);
  });

  return (
    <group ref={groupRef} matrixAutoUpdate={false}>
      <CakeModel />
    </group>
  );
}

/** 用 MindAR 推导参数同步 PerspectiveCamera。 */
function CameraSync({ params }: { params: CameraParams }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  camera.fov = params.fov;
  camera.near = params.near;
  camera.far = params.far;
  camera.aspect = params.aspect;
  camera.updateProjectionMatrix();
  return null;
}

export default function ARCanvas({
  anchorRef,
  cameraParams,
}: {
  anchorRef: AnchorRef;
  cameraParams: CameraParams | null;
}) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]} // 像素比上限 2（design.md 性能清单）
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      camera={{ position: [0, 0, 0], fov: 45 }}
    >
      {cameraParams && <CameraSync params={cameraParams} />}
      {/* 移动端禁用阴影；环境光 + 方向光 */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[1, 2, 1]} intensity={1.4} />
      <Anchor anchorRef={anchorRef} />
    </Canvas>
  );
}

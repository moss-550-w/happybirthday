import styles from './ARScene.module.css';

/**
 * AR 追踪 + 3D 场景容器（占位）。
 * TODO(M2): MindAR 初始化、摄像头权限、targetFound/targetLost 状态机、
 *           矩阵以 matrixAutoUpdate=false 应用到模型组。
 */
export default function ARScene() {
  return <div className={styles.scene} aria-hidden />;
}

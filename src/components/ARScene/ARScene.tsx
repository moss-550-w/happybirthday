import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useAR } from './ARContext';
import { useMindAR } from './useMindAR';
import Canvas2DParticles from '@/components/ParticleEffect/Canvas2DParticles';
import { useParticleFallback } from '@/components/ParticleEffect/useParticleFallback';
import { useAudio } from '@/components/AudioController/useAudio';
import MuteButton from '@/components/AudioController/MuteButton';
import { usePerformanceMonitor } from '@/components/PerformanceMonitor/usePerformanceMonitor';
import { useConfigContext } from '@/components/ConfigManager/ConfigContext';
import { assetUrl } from '@/utils/resourceLoader';
import styles from './ARScene.module.css';

// 延迟加载 three/R3F（P1）：首屏不下载，点击激活后才拉取
const ARCanvas = lazy(() => import('./ARCanvas'));
const FallbackScene = lazy(() => import('./FallbackScene'));

const TARGET_SRC = assetUrl('targets/card.mind');
const SAMPLE_IMG = assetUrl('targets/card.png');
const SCAN_TIMEOUT_MS = 30_000;

export default function ARScene() {
  const { state, dispatch, anchorRef } = useAR();
  const { phase, error, degraded } = state;
  const { config } = useConfigContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanTimedOut, setScanTimedOut] = useState(false);

  const arActive =
    phase === 'initializing' || phase === 'scanning' || phase === 'tracking';
  const isTracking = phase === 'tracking';

  const audio = useAudio(config.music);
  const { enabled: particlesEnabled } = useParticleFallback(degraded);

  useMindAR({
    active: arActive,
    targetSrc: TARGET_SRC,
    videoRef,
    containerRef,
    anchorRef,
    onReady: (cameraParams) => dispatch({ type: 'READY', cameraParams }),
    onFound: () => dispatch({ type: 'TARGET_FOUND' }),
    onLost: () => dispatch({ type: 'TARGET_LOST' }),
    onFail: (err) => dispatch({ type: 'FAIL', error: err }),
  });

  // 帧率监控（仅 AR 进行中）
  usePerformanceMonitor({
    enabled: arActive,
    degraded,
    onDegrade: () => dispatch({ type: 'DEGRADE' }),
  });

  // 识别成功 → 播放音乐；丢失 → 暂停
  useEffect(() => {
    if (isTracking) audio.play();
    else audio.pause();
  }, [isTracking, audio]);

  // 30s 未识别提示
  useEffect(() => {
    if (phase === 'tracking') {
      setScanTimedOut(false);
      return;
    }
    if (phase !== 'scanning' || state.everFound) return;
    const id = setTimeout(() => setScanTimedOut(true), SCAN_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [phase, state.everFound]);

  const handleActivate = () => {
    audio.unlock(); // 手势内解锁音频（iOS）
    dispatch({ type: 'ACTIVATE' });
  };

  return (
    <div ref={containerRef} className={styles.scene}>
      {arActive && (
        <video ref={videoRef} className={styles.video} playsInline muted />
      )}

      {arActive && (
        <Suspense fallback={null}>
          <ARCanvas anchorRef={anchorRef} cameraParams={state.cameraParams} />
        </Suspense>
      )}

      {/* 烟花粒子：识别成功后播放，低端/降级时禁用 */}
      {arActive && (
        <Canvas2DParticles playing={isTracking} enabled={particlesEnabled} />
      )}

      {phase === 'fallback' && (
        <Suspense fallback={<Spinner />}>
          <FallbackScene />
          <div className={styles.hud}>纯 3D 模式 · 拖动旋转</div>
        </Suspense>
      )}

      {/* 静音按钮：仅音频就绪时显示 */}
      {arActive && audio.ready && (
        <MuteButton muted={audio.muted} onToggle={audio.toggleMute} />
      )}

      {/* 降级提示 + 恢复按钮 */}
      {arActive && degraded && (
        <div className={styles.hud}>
          已切换为流畅模式
          <button
            className={styles.inlineBtn}
            onClick={() => dispatch({ type: 'RESTORE' })}
          >
            恢复高质量
          </button>
        </div>
      )}

      {/* ---- 覆盖层 ---- */}
      {phase === 'idle' && (
        <button
          className={`${styles.overlay} ${styles.gesture}`}
          onClick={handleActivate}
        >
          <span className={styles.gestureIcon}>🎂</span>
          <span className={styles.gestureTitle}>点击开始 AR 体验</span>
          <span className={styles.gestureHint}>对准生日贺卡卡片</span>
        </button>
      )}

      {phase === 'initializing' && (
        <div className={styles.overlay}>
          <Spinner />
          <span>正在启动 AR…</span>
        </div>
      )}

      {phase === 'scanning' && !scanTimedOut && (
        <div className={styles.hud}>🔍 将卡片对准取景框</div>
      )}

      {phase === 'scanning' && scanTimedOut && (
        <div className={`${styles.overlay} ${styles.dimmed}`}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>未检测到卡片</div>
            <div className={styles.cardText}>
              请确保卡片完整出现在画面中，光线充足、避免反光。
            </div>
            <img className={styles.sample} src={SAMPLE_IMG} alt="标记图样例" />
            <button
              className={styles.button}
              onClick={() => setScanTimedOut(false)}
            >
              继续扫描
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && error && (
        <div className={`${styles.overlay} ${styles.dimmed}`}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>{errorTitle(error.kind)}</div>
            <div className={styles.cardText}>{errorHint(error.kind)}</div>
            <button
              className={styles.button}
              onClick={() => dispatch({ type: 'FALLBACK' })}
            >
              纯 3D 观看
            </button>
            {error.kind === 'permission' && (
              <button
                className={styles.button}
                onClick={() => dispatch({ type: 'RESET' })}
              >
                重新授权
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <div className={styles.spinner} />;
}

function errorTitle(kind: string): string {
  switch (kind) {
    case 'permission':
      return '摄像头权限被拒绝';
    case 'unsupported':
      return '当前浏览器不支持摄像头';
    default:
      return 'AR 启动失败';
  }
}

function errorHint(kind: string): string {
  switch (kind) {
    case 'permission':
      return '请在浏览器设置中允许摄像头权限后重试，或选择纯 3D 观看。';
    case 'unsupported':
      return '你的浏览器不支持摄像头追踪，可使用纯 3D 模式观看蛋糕。';
    default:
      return 'AR 初始化失败，祝福不减。可使用纯 3D 模式继续观看。';
  }
}

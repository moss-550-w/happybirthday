import { useRef, useState } from 'react';
import { useMindARTracking } from './useMindARTracking';
import SpikeScene from './SpikeScene';

const TARGET_SRC = `${import.meta.env.BASE_URL}targets/card.mind`;

/**
 * M1 Spike 验证页：MindAR 底层 Controller（纯追踪）+ R3F（纯渲染）。
 * 验证目标：R1 集成可行性、真机帧率、targetFound/Lost、摄像头释放。
 */
export default function SpikeApp() {
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { status, found, errorMsg, anchorRef, cameraParams } =
    useMindARTracking({
      targetSrc: TARGET_SRC,
      videoRef,
      containerRef,
      active,
    });

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#000' }}
    >
      {/* 摄像头背景层 */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />

      {/* R3F 渲染层 */}
      {active && (
        <SpikeScene anchorRef={anchorRef} cameraParams={cameraParams} />
      )}

      {/* 状态 HUD */}
      {active && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 13,
            fontFamily: 'monospace',
          }}
        >
          <div>status: {status}</div>
          <div>target: {found ? '✅ FOUND' : '🔍 scanning'}</div>
          {errorMsg && <div style={{ color: '#ff6b6b' }}>err: {errorMsg}</div>}
        </div>
      )}

      {/* 手势激活覆盖层 */}
      {!active && (
        <button
          onClick={() => setActive(true)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            border: 'none',
            background: 'rgba(26,26,46,0.95)',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 48 }}>🎂</span>
          <span>点击开始 AR 体验</span>
          <span style={{ fontSize: 13, opacity: 0.7 }}>
            (M1 Spike · 对准 card.png 卡片)
          </span>
        </button>
      )}
    </div>
  );
}

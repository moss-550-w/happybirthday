import { useEffect, useRef } from 'react';

interface Props {
  /** 是否处于识别状态（tracking） */
  playing: boolean;
  /** 设备/降级判定后是否允许粒子 */
  enabled: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 50;
const FIREWORK_MS = 4000; // 识别后烟花时长
const COLORS = ['#ff6b9d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585'];
const GRAVITY = 0.04;

/**
 * 轻量 Canvas 2D 粒子（design.md / Claude.md）：
 * - 实心圆，无透明度混合（不使用 globalAlpha）
 * - 识别成功后前 4s 播放烟花，之后转静态光晕
 * - 总粒子数 ≤ 50；enabled=false 时完全不绘制
 */
export default function Canvas2DParticles({ playing, enabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!playing || !enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const start = performance.now();
    let lastBurst = 0;
    let rafId = 0;

    const spawnBurst = (cx: number, cy: number) => {
      const count = Math.min(20, MAX_PARTICLES - particles.length);
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = 1.5 + Math.random() * 2.5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          r: 2 + Math.random() * 2,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          life: 60 + Math.random() * 30,
          maxLife: 90,
        });
      }
    };

    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const elapsed = now - start;

      if (elapsed < FIREWORK_MS) {
        // 烟花阶段：周期性在上半屏随机位置爆发
        if (now - lastBurst > 700) {
          lastBurst = now;
          spawnBurst(w * (0.3 + Math.random() * 0.4), h * (0.25 + Math.random() * 0.2));
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += GRAVITY;
          p.life -= 1;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          // 实心圆，无 alpha
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 静态光晕阶段：上方中心柔和脉冲点
        const cx = w / 2;
        const cy = h * 0.32;
        const pulse = 1 + Math.sin(now / 400) * 0.25;
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = COLORS[i];
          ctx.beginPath();
          const ang = (Math.PI * 2 * i) / 5 + now / 1500;
          ctx.arc(cx + Math.cos(ang) * 26, cy + Math.sin(ang) * 26, 3 * pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    };
  }, [playing, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  );
}

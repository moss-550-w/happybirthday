import { useCallback, useEffect, useRef, useState } from 'react';

const MUTE_KEY = 'ar-bday-muted';
const VOLUME = 0.3; // 背景音乐音量（design.md：降至 30%）

function readMutePref(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export interface AudioControls {
  /** 音频是否成功加载（失败则隐藏静音按钮） */
  ready: boolean;
  muted: boolean;
  /** 用户手势中调用：创建并解锁音频（iOS 自动播放策略） */
  unlock: () => void;
  /** 识别成功后调用：开始播放（静音或未就绪则静默） */
  play: () => void;
  /** 暂停 */
  pause: () => void;
  toggleMute: () => void;
}

/**
 * 背景音乐控制。src 为空或加载失败时静默降级（容错清单）。
 */
export function useAudio(src: string | undefined): AudioControls {
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(readMutePref);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  // 卸载释放
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const unlock = useCallback(() => {
    if (!src || unlockedRef.current) return;
    unlockedRef.current = true;

    const audio = new Audio();
    audio.loop = true;
    audio.volume = VOLUME;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('canplaythrough', () => setReady(true), { once: true });
    audio.addEventListener('error', () => {
      console.warn('[audio] 背景音乐加载失败，静默降级');
      setReady(false);
    });
    audio.src = src;
    audioRef.current = audio;

    // iOS 解锁：手势内 play→pause
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {
        /* 静默：未就绪或被拦截，play() 时再试 */
      });
  }, [src]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !ready || muted) return;
    audio.play().catch(() => {
      /* 静默降级，不阻塞 AR */
    });
  }, [ready, muted]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      } catch {
        /* 忽略持久化失败 */
      }
      const audio = audioRef.current;
      if (audio) {
        audio.muted = next;
        if (!next && ready) {
          audio.play().catch(() => {
            /* 静默 */
          });
        }
      }
      return next;
    });
  }, [ready]);

  return { ready, muted, unlock, play, pause, toggleMute };
}

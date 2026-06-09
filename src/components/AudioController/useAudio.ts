import { useCallback, useEffect, useRef, useState } from 'react';
import { createBirthdayTune, type BirthdayTune } from './birthdayTune';

const MUTE_KEY = 'ar-bday-muted';
const VOLUME = 0.3; // 背景音量（design.md：降至 30%）

function readMutePref(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export interface AudioControls {
  /** 音频是否就绪（失败则隐藏静音按钮） */
  ready: boolean;
  muted: boolean;
  /** 用户手势中调用：解锁音频（iOS 自动播放策略） */
  unlock: () => void;
  /** 识别成功后调用：开始播放（静音或未就绪则静默） */
  play: () => void;
  /** 暂停 */
  pause: () => void;
  toggleMute: () => void;
}

/**
 * 背景音频控制，双模式：
 *   - 有 music URL → 播放 mp3
 *   - 无 music URL → Web Audio 合成「祝你生日快乐」旋律（零文件，循环）
 * 加载/合成失败均静默降级（容错清单）。
 */
export function useAudio(src: string | undefined): AudioControls {
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(readMutePref);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tuneRef = useRef<BirthdayTune | null>(null);
  const unlockedRef = useRef(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // 卸载释放
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      tuneRef.current?.dispose();
      tuneRef.current = null;
    };
  }, []);

  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;

    if (src) {
      // mp3 模式
      const audio = new Audio();
      audio.loop = true;
      audio.volume = VOLUME;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.addEventListener('canplaythrough', () => setReady(true), {
        once: true,
      });
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
          /* 静默，play() 时再试 */
        });
    } else {
      // 合成「祝你生日快乐」模式
      const tune = createBirthdayTune(VOLUME);
      if (tune) {
        tuneRef.current = tune;
        // 手势内 resume 解锁 AudioContext
        void tune.resume();
        tune.setMuted(mutedRef.current);
        setReady(true);
      } else {
        console.warn('[audio] 浏览器不支持 Web Audio，静默降级');
        setReady(false);
      }
    }
  }, [src]);

  const play = useCallback(() => {
    if (!ready || mutedRef.current) return;
    if (tuneRef.current) {
      tuneRef.current.start();
      return;
    }
    audioRef.current?.play().catch(() => {
      /* 静默降级，不阻塞 AR */
    });
  }, [ready]);

  const pause = useCallback(() => {
    tuneRef.current?.stop();
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
      if (tuneRef.current) {
        tuneRef.current.setMuted(next);
      } else if (audioRef.current) {
        audioRef.current.muted = next;
        if (!next && ready) {
          audioRef.current.play().catch(() => {
            /* 静默 */
          });
        }
      }
      return next;
    });
  }, [ready]);

  return { ready, muted, unlock, play, pause, toggleMute };
}

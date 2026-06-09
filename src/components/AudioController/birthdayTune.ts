// Web Audio 程序化合成「祝你生日快乐」。
// 旋律为公有领域，零文件 / 零依赖 / 零网络，不增首屏体积。

/** 音名 → 频率（十二平均律，A4=440）。 */
const NOTE: Record<string, number> = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

/** 一拍秒数（约 110 BPM 的轻快感）。 */
const BEAT = 0.42;

/** [音名, 拍数]；'rest' 为休止。Happy Birthday 经典 C 大调编排。 */
const MELODY: Array<[string, number]> = [
  // Happy birthday to you
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  // Happy birthday to you
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  // Happy birthday dear ...
  ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  // Happy birthday to you
  ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2],
  ['rest', 1],
];

export interface BirthdayTune {
  /** 在用户手势中调用以解锁/恢复 AudioContext */
  resume: () => Promise<void>;
  start: () => void;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  dispose: () => void;
}

type AudioCtor = typeof AudioContext;

/** 创建生日歌合成器；浏览器不支持 Web Audio 时返回 null。 */
export function createBirthdayTune(volume = 0.3): BirthdayTune | null {
  const Ctor: AudioCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor })
      .webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  let playing = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const liveOsc = new Set<OscillatorNode>();

  const totalBeats = MELODY.reduce((s, [, b]) => s + b, 0);
  const loopSeconds = totalBeats * BEAT;

  const scheduleLoop = () => {
    const t0 = ctx.currentTime + 0.05;
    let cursor = t0;
    for (const [name, beats] of MELODY) {
      const dur = beats * BEAT;
      if (name !== 'rest') {
        const freq = NOTE[name];
        if (freq) playNote(freq, cursor, dur * 0.9);
      }
      cursor += dur;
    }
    // 循环：本轮结束前重新调度
    timer = setTimeout(() => {
      if (playing) scheduleLoop();
    }, loopSeconds * 1000);
  };

  const playNote = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    // ADSR 包络：快起音 + 自然衰减，避免爆音
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(1, start + 0.02);
    gain.gain.linearRampToValueAtTime(0.7, start + dur * 0.5);
    gain.gain.linearRampToValueAtTime(0, start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
    liveOsc.add(osc);
    osc.onended = () => liveOsc.delete(osc);
  };

  const stopAllOsc = () => {
    liveOsc.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* 已停止 */
      }
    });
    liveOsc.clear();
  };

  return {
    resume: async () => {
      if (ctx.state === 'suspended') await ctx.resume();
    },
    start: () => {
      if (playing) return;
      playing = true;
      void ctx.resume();
      scheduleLoop();
    },
    stop: () => {
      playing = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      stopAllOsc();
    },
    setMuted: (muted: boolean) => {
      master.gain.value = muted ? 0 : volume;
    },
    dispose: () => {
      playing = false;
      if (timer) clearTimeout(timer);
      stopAllOsc();
      void ctx.close();
    },
  };
}

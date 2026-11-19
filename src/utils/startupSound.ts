let sharedAudioCtx: AudioContext | null = null;
let lastStartupPlayedAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return sharedAudioCtx;
}

/**
 * Plays a modern, crisp 3D crystalline LENKYX startup chime (inspired by the Edge-3D logo).
 * Returns true if the audio context is running and the sound actually started.
 */
export async function playLenkyxStartupSound(force = false): Promise<boolean> {
  const nowMs = Date.now();
  if (!force && nowMs - lastStartupPlayedAt < 1200) return false;

  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  if (ctx.state !== 'running') return false;
  lastStartupPlayedAt = nowMs;

  const t0 = ctx.currentTime + 0.02;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.28, t0 + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9);
  master.connect(ctx.destination);

  // Warm deep sub-bass bloom (E2 -> E3)
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(82.41, t0);
  sub.frequency.exponentialRampToValueAtTime(164.81, t0 + 0.35);
  subGain.gain.setValueAtTime(0.0001, t0);
  subGain.gain.exponentialRampToValueAtTime(0.45, t0 + 0.06);
  subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(t0);
  sub.stop(t0 + 1.6);

  // Futuristic luminous arpeggio: E4 -> B4 -> E5 -> G#5 -> B5
  const notes = [
    { freq: 329.63, delay: 0.0, dur: 1.35, type: 'triangle' as OscillatorType, amp: 0.25 },
    { freq: 493.88, delay: 0.08, dur: 1.3, type: 'triangle' as OscillatorType, amp: 0.22 },
    { freq: 659.25, delay: 0.16, dur: 1.35, type: 'sine' as OscillatorType, amp: 0.24 },
    { freq: 830.61, delay: 0.25, dur: 1.4, type: 'sine' as OscillatorType, amp: 0.2 },
    { freq: 987.77, delay: 0.34, dur: 1.5, type: 'sine' as OscillatorType, amp: 0.18 },
  ];

  for (const n of notes) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = n.type;
    osc.frequency.setValueAtTime(n.freq, t0 + n.delay);
    g.gain.setValueAtTime(0.0001, t0 + n.delay);
    g.gain.exponentialRampToValueAtTime(n.amp, t0 + n.delay + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.delay + n.dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0 + n.delay);
    osc.stop(t0 + n.delay + n.dur + 0.05);
  }

  return true;
}

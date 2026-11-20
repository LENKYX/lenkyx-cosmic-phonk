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
 * Plays an authentic Brazilian Favela Baile / Funk 808 + Tamborzão + Moto Corte + VIP Chime
 * when entering the app.
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
  master.gain.exponentialRampToValueAtTime(0.48, t0 + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.35);
  master.connect(ctx.destination);

  // 1. Sub-Grave 808 Favela Pancadão (Tum... Tum-Tum... Tum!)
  const kickTimes = [0.0, 0.34, 0.56, 0.92, 1.24];
  for (const kt of kickTimes) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, t0 + kt);
    osc.frequency.exponentialRampToValueAtTime(42, t0 + kt + 0.16);
    g.gain.setValueAtTime(0.0001, t0 + kt);
    g.gain.exponentialRampToValueAtTime(0.75, t0 + kt + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + kt + 0.28);
    osc.connect(g);
    g.connect(master);
    osc.start(t0 + kt);
    osc.stop(t0 + kt + 0.3);
  }

  // 2. Tamborzão / Estalo de Baile (Percussão Funk Carioca/Paulista)
  const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.14), ctx.sampleRate);
  const chan = noiseBuffer.getChannelData(0);
  for (let i = 0; i < chan.length; i++) {
    chan[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.032));
  }
  const slapTimes = [0.22, 0.45, 0.78, 1.08, 1.38];
  for (const st of slapTimes) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1850;
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, t0 + st);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + st + 0.13);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t0 + st);
  }

  // 3. Corte de Giro Estilizado + Acorde VIP Ouro 24K
  const rev = ctx.createOscillator();
  const revGain = ctx.createGain();
  rev.type = 'sawtooth';
  rev.frequency.setValueAtTime(95, t0 + 0.05);
  rev.frequency.exponentialRampToValueAtTime(340, t0 + 0.28);
  rev.frequency.exponentialRampToValueAtTime(160, t0 + 0.48);
  const revFilter = ctx.createBiquadFilter();
  revFilter.type = 'lowpass';
  revFilter.frequency.value = 950;
  revGain.gain.setValueAtTime(0.0001, t0 + 0.05);
  revGain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.18);
  revGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
  rev.connect(revFilter);
  revFilter.connect(revGain);
  revGain.connect(master);
  rev.start(t0 + 0.05);
  rev.stop(t0 + 0.58);

  const notes = [
    { freq: 329.63, delay: 0.12, dur: 1.4, type: 'triangle' as OscillatorType, amp: 0.2 },
    { freq: 493.88, delay: 0.24, dur: 1.35, type: 'triangle' as OscillatorType, amp: 0.18 },
    { freq: 659.25, delay: 0.36, dur: 1.45, type: 'sine' as OscillatorType, amp: 0.22 },
    { freq: 987.77, delay: 0.48, dur: 1.55, type: 'sine' as OscillatorType, amp: 0.17 },
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

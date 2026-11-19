// Realistic Big Bang Explosion & Cosmic Emergence Synthesizer for LENKYX 3D Logo Intro

export interface GalaxyIntroSoundController {
  unlock: () => Promise<boolean>;
  isMutedOrLocked: () => boolean;
  stop: () => void;
}

function createBigBangReverb(ctx: AudioContext, durationSec = 4.8, decay = 2.4): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function playBigBangExplosion(ctx: AudioContext, master: GainNode, reverb: ConvolverNode, boomAt: number): void {
  // 1. Massive Sub-Bass Detonation Impact (chest-thumping Big Bang shockwave)
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(160, boomAt);
  sub.frequency.exponentialRampToValueAtTime(34, boomAt + 0.35);
  sub.frequency.exponentialRampToValueAtTime(24, boomAt + 4.2);
  subGain.gain.setValueAtTime(0.0001, boomAt);
  subGain.gain.linearRampToValueAtTime(1.0, boomAt + 0.015);
  subGain.gain.exponentialRampToValueAtTime(0.0008, boomAt + 4.4);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(boomAt);
  sub.stop(boomAt + 4.5);

  // 2. Low-Mid Punch Cannon
  const punch = ctx.createOscillator();
  const punchGain = ctx.createGain();
  punch.type = 'triangle';
  punch.frequency.setValueAtTime(240, boomAt);
  punch.frequency.exponentialRampToValueAtTime(42, boomAt + 0.28);
  punchGain.gain.setValueAtTime(0.0001, boomAt);
  punchGain.gain.linearRampToValueAtTime(0.85, boomAt + 0.008);
  punchGain.gain.exponentialRampToValueAtTime(0.001, boomAt + 0.9);
  punch.connect(punchGain);
  punchGain.connect(master);
  punchGain.connect(reverb);
  punch.start(boomAt);
  punch.stop(boomAt + 0.95);

  // 3. Broadband Realistic Plasma Explosion Roar (filtered pink-like noise burst sweeping down)
  const noiseLen = Math.floor(ctx.sampleRate * 4.5);
  const noiseBuf = ctx.createBuffer(2, noiseLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const out = noiseBuf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < noiseLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      out[i] = (b0 + b1 + b2 + white * 0.35) * 0.65;
    }
  }
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  const nFilter = ctx.createBiquadFilter();
  nFilter.type = 'lowpass';
  nFilter.Q.setValueAtTime(1.2, boomAt);
  nFilter.frequency.setValueAtTime(7500, boomAt);
  nFilter.frequency.exponentialRampToValueAtTime(320, boomAt + 1.8);
  nFilter.frequency.exponentialRampToValueAtTime(95, boomAt + 4.3);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.0001, boomAt);
  nGain.gain.linearRampToValueAtTime(0.95, boomAt + 0.02);
  nGain.gain.exponentialRampToValueAtTime(0.0008, boomAt + 4.4);
  noiseSrc.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(master);
  nGain.connect(reverb);
  noiseSrc.start(boomAt);
  noiseSrc.stop(boomAt + 4.5);

  // 4. Stellar Emergence Shimmer (as the 3D LX Logo forms inside the Big Bang light)
  const chord = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33];
  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = idx < 2 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, boomAt + 0.45);
    g.gain.setValueAtTime(0.0001, boomAt + 0.45);
    g.gain.linearRampToValueAtTime(0.09, boomAt + 1.25);
    g.gain.exponentialRampToValueAtTime(0.0005, boomAt + 5.6);
    osc.connect(g);
    g.connect(reverb);
    g.connect(master);
    osc.start(boomAt + 0.45);
    osc.stop(boomAt + 5.7);
  });
}

export function startGalaxyIntroSound(mode: 'netflix15' | 'fast'): GalaxyIntroSoundController {
  const AudioCtx =
    typeof window !== 'undefined'
      ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;

  if (!AudioCtx) {
    return {
      unlock: async () => false,
      isMutedOrLocked: () => true,
      stop: () => {},
    };
  }

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let scheduled = false;
  let stopped = false;
  const startWallMs = performance.now();

  const ensureContextAndSchedule = () => {
    if (stopped || scheduled) return;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') return;

    scheduled = true;
    const now = ctx.currentTime;
    const elapsedSec = (performance.now() - startWallMs) / 1000;

    master = ctx.createGain();
    master.gain.setValueAtTime(0.9, now);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-10, now);
    comp.knee.setValueAtTime(14, now);
    comp.ratio.setValueAtTime(5, now);
    master.connect(comp);
    comp.connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = createBigBangReverb(ctx, 4.8, 2.3);
    const revGain = ctx.createGain();
    revGain.gain.setValueAtTime(0.5, now);
    reverb.connect(revGain);
    revGain.connect(master);

    if (mode === 'fast') {
      playBigBangExplosion(ctx, master, reverb, now + 0.04);
      return;
    }

    // Phase 1: Singularity Gravitational Charge-Up (0s -> 1.35s)
    const chargeEnd = Math.max(0.15, 1.35 - elapsedSec);
    if (elapsedSec < 1.35) {
      const chargeOsc = ctx.createOscillator();
      const chargeGain = ctx.createGain();
      chargeOsc.type = 'sawtooth';
      chargeOsc.frequency.setValueAtTime(42, now);
      chargeOsc.frequency.exponentialRampToValueAtTime(220, now + chargeEnd);
      const cf = ctx.createBiquadFilter();
      cf.type = 'lowpass';
      cf.frequency.setValueAtTime(180, now);
      cf.frequency.exponentialRampToValueAtTime(1600, now + chargeEnd);
      chargeGain.gain.setValueAtTime(0.01, now);
      chargeGain.gain.linearRampToValueAtTime(0.32, now + chargeEnd);
      chargeGain.gain.exponentialRampToValueAtTime(0.001, now + chargeEnd + 0.08);
      chargeOsc.connect(cf);
      cf.connect(chargeGain);
      chargeGain.connect(master);
      chargeOsc.start(now);
      chargeOsc.stop(now + chargeEnd + 0.1);
    }

    // Phase 2: BIG BANG DETONATION at 1.35s!
    const boomAt = Math.max(0.04, 1.35 - elapsedSec);
    playBigBangExplosion(ctx, master, reverb, now + boomAt);
  };

  try {
    ctx = new AudioCtx();
    if (ctx.state === 'running') {
      ensureContextAndSchedule();
    } else {
      void ctx
        .resume()
        .then(() => ensureContextAndSchedule())
        .catch(() => {});
    }
  } catch {
    // ignore
  }

  return {
    unlock: async () => {
      if (stopped) return false;
      try {
        if (!ctx) ctx = new AudioCtx();
        if (ctx.state === 'suspended') await ctx.resume();
        ensureContextAndSchedule();
        return ctx.state === 'running';
      } catch {
        return false;
      }
    },
    isMutedOrLocked: () => !ctx || ctx.state !== 'running',
    stop: () => {
      stopped = true;
      try {
        if (master && ctx) {
          master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
        }
        window.setTimeout(() => {
          void ctx?.close().catch(() => {});
          ctx = null;
        }, 180);
      } catch {
        // ignore
      }
    },
  };
}

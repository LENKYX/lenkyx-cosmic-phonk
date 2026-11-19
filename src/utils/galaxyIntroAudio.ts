// Studio-Grade Web Audio Synthesizer for LENKYX Galaxy Cinema Intro ("TA-DUM" Impact)
// Synchronized with the 15-second Netflix-style Galaxy Opening & Cinema Preroll.

export interface GalaxyIntroSoundController {
  unlock: () => Promise<boolean>;
  isMutedOrLocked: () => boolean;
  stop: () => void;
}

function createGalaxyReverbImpulse(ctx: AudioContext, durationSec = 4.2, decay = 2.6): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const env = Math.pow(1 - i / length, decay);
      data[i] = (Math.random() * 2 - 1) * env;
    }
  }
  return impulse;
}

function playTadumImpact(
  ctx: AudioContext,
  master: GainNode,
  reverb: ConvolverNode,
  startAt: number
): void {
  // === HIT 1: "TA-" (tight low-mid cinema drum + metallic shimmer) ===
  const hit1Osc = ctx.createOscillator();
  const hit1Gain = ctx.createGain();
  hit1Osc.type = 'triangle';
  hit1Osc.frequency.setValueAtTime(145, startAt);
  hit1Osc.frequency.exponentialRampToValueAtTime(52, startAt + 0.19);
  hit1Gain.gain.setValueAtTime(0.0001, startAt);
  hit1Gain.gain.linearRampToValueAtTime(0.75, startAt + 0.012);
  hit1Gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.34);
  hit1Osc.connect(hit1Gain);
  hit1Gain.connect(master);
  hit1Gain.connect(reverb);
  hit1Osc.start(startAt);
  hit1Osc.stop(startAt + 0.36);

  // Hit 1 woody/percussive snap
  const hit1Click = ctx.createOscillator();
  const hit1ClickGain = ctx.createGain();
  hit1Click.type = 'sine';
  hit1Click.frequency.setValueAtTime(320, startAt);
  hit1Click.frequency.exponentialRampToValueAtTime(88, startAt + 0.09);
  hit1ClickGain.gain.setValueAtTime(0.45, startAt);
  hit1ClickGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.14);
  hit1Click.connect(hit1ClickGain);
  hit1ClickGain.connect(master);
  hit1Click.start(startAt);
  hit1Click.stop(startAt + 0.16);

  // === HIT 2: "-DUMMM!" (~0.31s later: massive sub-bass drop + galaxy cinema chord bloom) ===
  const hit2Time = startAt + 0.31;

  // Sub-bass body
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(110, hit2Time);
  subOsc.frequency.exponentialRampToValueAtTime(36.71, hit2Time + 0.22); // D1 deep sub
  subOsc.frequency.exponentialRampToValueAtTime(32.5, hit2Time + 3.2);
  subGain.gain.setValueAtTime(0.0001, hit2Time);
  subGain.gain.linearRampToValueAtTime(0.95, hit2Time + 0.018);
  subGain.gain.exponentialRampToValueAtTime(0.001, hit2Time + 3.6);
  subOsc.connect(subGain);
  subGain.connect(master);
  subOsc.start(hit2Time);
  subOsc.stop(hit2Time + 3.7);

  // Punchy low-mid kettle impact
  const punchOsc = ctx.createOscillator();
  const punchGain = ctx.createGain();
  punchOsc.type = 'triangle';
  punchOsc.frequency.setValueAtTime(165, hit2Time);
  punchOsc.frequency.exponentialRampToValueAtTime(48, hit2Time + 0.28);
  punchGain.gain.setValueAtTime(0.0001, hit2Time);
  punchGain.gain.linearRampToValueAtTime(0.7, hit2Time + 0.012);
  punchGain.gain.exponentialRampToValueAtTime(0.001, hit2Time + 0.85);
  punchOsc.connect(punchGain);
  punchGain.connect(master);
  punchGain.connect(reverb);
  punchOsc.start(hit2Time);
  punchOsc.stop(hit2Time + 0.9);

  // Lush Galaxy Cinema Chord Bloom (D2, A2, D3, F#3, A3, E4)
  const chordFreqs = [73.42, 110.0, 146.83, 185.0, 220.0, 329.63];
  chordFreqs.forEach((freq, idx) => {
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    oscA.type = idx < 2 ? 'sawtooth' : 'triangle';
    oscB.type = 'sine';
    oscA.frequency.setValueAtTime(freq, hit2Time);
    oscB.frequency.setValueAtTime(freq * 1.0035, hit2Time); // warm stereo chorus detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, hit2Time);
    filter.frequency.exponentialRampToValueAtTime(2800, hit2Time + 0.55);
    filter.frequency.exponentialRampToValueAtTime(680, hit2Time + 4.4);

    const amp = idx < 2 ? 0.16 : 0.11;
    g.gain.setValueAtTime(0.0001, hit2Time);
    g.gain.linearRampToValueAtTime(amp, hit2Time + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0008, hit2Time + 4.8);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(g);
    g.connect(master);
    g.connect(reverb);

    oscA.start(hit2Time);
    oscB.start(hit2Time);
    oscA.stop(hit2Time + 4.9);
    oscB.stop(hit2Time + 4.9);
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
    if (!ctx) {
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') {
      return;
    }

    scheduled = true;
    const now = ctx.currentTime;
    const elapsedSec = (performance.now() - startWallMs) / 1000;

    master = ctx.createGain();
    master.gain.setValueAtTime(0.85, now);

    // Subtle soft compressor so the "TA-DUM" impact hits punchy without clipping
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-12, now);
    comp.knee.setValueAtTime(16, now);
    comp.ratio.setValueAtTime(5, now);
    master.connect(comp);
    comp.connect(ctx.destination);

    // Galactic Cathedral Reverb
    const reverb = ctx.createConvolver();
    reverb.buffer = createGalaxyReverbImpulse(ctx, 4.4, 2.5);
    const revGain = ctx.createGain();
    revGain.gain.setValueAtTime(0.45, now);
    reverb.connect(revGain);
    revGain.connect(master);

    if (mode === 'fast') {
      playTadumImpact(ctx, master, reverb, now + 0.05);
      return;
    }

    // === 15-SECOND GALAXY OPENING SCORE ===
    // 1. Deep Space Sub-Atmosphere (0s -> 7.2s)
    const drone = ctx.createOscillator();
    const drone2 = ctx.createOscillator();
    const droneFilter = ctx.createBiquadFilter();
    const droneGain = ctx.createGain();
    drone.type = 'sawtooth';
    drone2.type = 'sine';
    drone.frequency.setValueAtTime(36.71, now); // D1
    drone2.frequency.setValueAtTime(55.0, now); // A1
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(140, now);
    droneFilter.frequency.exponentialRampToValueAtTime(520, now + Math.max(0.2, 6.8 - elapsedSec));
    droneGain.gain.setValueAtTime(0.0001, now);
    droneGain.gain.linearRampToValueAtTime(0.18, now + 0.8);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.5, 7.6 - elapsedSec));
    drone.connect(droneFilter);
    drone2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(master);
    drone.start(now);
    drone2.start(now);
    drone.stop(now + Math.max(0.6, 7.8 - elapsedSec));
    drone2.stop(now + Math.max(0.6, 7.8 - elapsedSec));

    // 2. Crystalline Mirror Shard Chimes as the 12 pieces float & assemble (2.0s -> 6.8s)
    const shardNotes = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51, 1479.98];
    for (let i = 0; i < 10; i++) {
      const targetOffset = 2.1 + i * 0.45 - elapsedSec;
      if (targetOffset < 0) continue;
      const chimeTime = now + targetOffset;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(shardNotes[i % shardNotes.length], chimeTime);
      g.gain.setValueAtTime(0.0001, chimeTime);
      g.gain.linearRampToValueAtTime(0.085, chimeTime + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, chimeTime + 0.65);
      osc.connect(g);
      g.connect(reverb);
      osc.start(chimeTime);
      osc.stop(chimeTime + 0.7);
    }

    // 3. Cosmic Rising Whoosh right before the Impact (5.4s -> 7.0s)
    const whooshDelay = Math.max(0, 5.3 - elapsedSec);
    const whooshEnd = Math.max(whooshDelay + 0.3, 6.98 - elapsedSec);
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2.0), ctx.sampleRate);
    const chData = noiseBuf.getChannelData(0);
    for (let i = 0; i < chData.length; i++) chData[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.Q.setValueAtTime(2.5, now + whooshDelay);
    nFilter.frequency.setValueAtTime(160, now + whooshDelay);
    nFilter.frequency.exponentialRampToValueAtTime(2400, now + whooshEnd);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now + whooshDelay);
    nGain.gain.linearRampToValueAtTime(0.22, now + whooshEnd - 0.05);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + whooshEnd + 0.15);
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(reverb);
    noise.start(now + whooshDelay);
    noise.stop(now + whooshEnd + 0.2);

    // 4. THE SIGNATURE "TA-DUMMM" IMPACT at 6.95s (when logo locks in & light ribbons burst!)
    const impactAt = Math.max(0.05, 6.95 - elapsedSec);
    playTadumImpact(ctx, master, reverb, now + impactAt);

    // 5. Shimmering Title Reveal Pad ("LENKYX" appears at 9.2s -> 14.5s)
    const titleAt = Math.max(impactAt + 0.9, 9.2 - elapsedSec);
    if (elapsedSec < 13.5) {
      [293.66, 440.0, 587.33, 739.99].forEach((freq) => {
        if (!ctx || !master) return;
        const pad = ctx.createOscillator();
        const padGain = ctx.createGain();
        pad.type = 'sine';
        pad.frequency.setValueAtTime(freq, now + titleAt);
        padGain.gain.setValueAtTime(0.0001, now + titleAt);
        padGain.gain.linearRampToValueAtTime(0.06, now + titleAt + 1.1);
        padGain.gain.exponentialRampToValueAtTime(0.0005, now + Math.max(titleAt + 2.5, 14.6 - elapsedSec));
        pad.connect(padGain);
        padGain.connect(reverb);
        padGain.connect(master);
        pad.start(now + titleAt);
        pad.stop(now + Math.max(titleAt + 2.6, 14.8 - elapsedSec));
      });
    }
  };

  // Try immediate autoplay right away
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

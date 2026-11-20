/**
 * SOM DE ABERTURA MORRO GOLD — "PANCADAO VIP"
 *
 * Toca o beat novo (WAV gerado por scripts/generate_startup_beat.py):
 * 808 sub-grave pesado, estalo de baile, tamborzao, chima, sopro de metais e build final.
 * Se o arquivo nao estiver disponivel (offline / cache velho), cai num sintetizador
 * Web Audio pesado para o app nunca ficar mudo.
 */

const BEAT_URL = '/audio/morro-gold-beat-vip.wav?v=81';
const BEAT_TARGET_VOLUME = 0.92;

let sharedAudioCtx: AudioContext | null = null;
let beatEl: HTMLAudioElement | null = null;
let lastStartupPlayedAt = 0;
let fadeTimer: number | null = null;
let startupStopTimer: number | null = null;
const STARTUP_MAX_MS = 5000;

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

function getBeatElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!beatEl) {
    try {
      beatEl = new Audio();
      beatEl.preload = 'auto';
      beatEl.src = BEAT_URL;
      beatEl.loop = false;
      beatEl.volume = 0.0001;
    } catch {
      return null;
    }
  }
  return beatEl;
}

function rampVolume(el: HTMLAudioElement, target: number, ms: number) {
  if (fadeTimer !== null) {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }
  const start = el.volume;
  const steps = Math.max(1, Math.round(ms / 40));
  let step = 0;
  fadeTimer = window.setInterval(() => {
    step += 1;
    const ratio = Math.min(1, step / steps);
    el.volume = Math.max(0.0001, start + (target - start) * ratio);
    if (ratio >= 1 && fadeTimer !== null) {
      window.clearInterval(fadeTimer);
      fadeTimer = null;
    }
  }, Math.max(16, ms / steps));
}

/**
 * Toca o beat de abertura. Retorna true quando o audio realmente comecou.
 */
export async function playLenkyxStartupSound(force = false): Promise<boolean> {
  const nowMs = Date.now();
  if (!force && nowMs - lastStartupPlayedAt < 2500) return false;

  const el = getBeatElement();
  if (el) {
    try {
      el.pause();
      el.currentTime = 0;
      el.volume = 0.0001;
      await el.play();
      lastStartupPlayedAt = nowMs;
      rampVolume(el, BEAT_TARGET_VOLUME, 320);
      if (startupStopTimer !== null) window.clearTimeout(startupStopTimer);
      startupStopTimer = window.setTimeout(() => {
        el.pause();
        el.currentTime = 0;
        startupStopTimer = null;
      }, STARTUP_MAX_MS);
      return true;
    } catch {
      // Autoplay bloqueado pelo navegador: tenta o sintetizador (so funciona com gesto do usuario)
    }
  }

  return playHeavyFallbackBeat();
}

/** true quando o beat de abertura esta tocando neste momento. */
export function isStartupBeatPlaying(): boolean {
  return !!beatEl && !beatEl.paused && !beatEl.ended;
}

/** Encerra o beat de abertura com fade curto (usado ao sair da intro). */
export function stopLenkyxStartupSound(fadeMs = 420): void {
  const el = beatEl;
  if (!el) return;
  try {
    el.pause();
    el.currentTime = 0;
  } catch {
    /* ignore */
  }
  if (fadeTimer !== null) {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

/** Sintetizador reserva: pancadao 808 pesado em loop curto (offline / cache antigo). */
async function playHeavyFallbackBeat(): Promise<boolean> {
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
  lastStartupPlayedAt = Date.now();

  const t0 = ctx.currentTime + 0.02;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.55, t0 + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.9);
  master.connect(ctx.destination);

  const beat = 60 / 138;
  const step = beat / 4;

  // 808 sub-grave pesado
  const kicks = [0, 6, 10, 12, 16, 22, 26, 28];
  for (const s of kicks) {
    const kt = t0 + s * step;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, kt);
    osc.frequency.exponentialRampToValueAtTime(41, kt + 0.13);
    g.gain.setValueAtTime(0.0001, kt);
    g.gain.exponentialRampToValueAtTime(0.9, kt + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, kt + 0.3);
    osc.connect(g);
    g.connect(master);
    osc.start(kt);
    osc.stop(kt + 0.32);
  }

  // Estalo / clap de baile
  const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
  const chan = noiseBuffer.getChannelData(0);
  for (let i = 0; i < chan.length; i++) chan[i] = Math.random() * 2 - 1;
  for (const s of [4, 12, 20, 28]) {
    const st = t0 + s * step;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(0.5, st + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, st + 0.16);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(st);
    src.stop(st + 0.3);
  }

  // Sub 808 sustentado (F1) + sopro de metais no fim
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(87.31, t0);
  sub.frequency.exponentialRampToValueAtTime(43.65, t0 + 0.12);
  subGain.gain.setValueAtTime(0.0001, t0);
  subGain.gain.exponentialRampToValueAtTime(0.75, t0 + 0.02);
  subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(t0);
  sub.stop(t0 + 1.4);

  const notes = [174.61, 207.65, 261.63];
  notes.forEach((f, i) => {
    const nt = t0 + 0.5 + i * 0.06;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700, nt);
    lp.frequency.linearRampToValueAtTime(3600, nt + 0.12);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, nt);
    g.gain.setValueAtTime(0.0001, nt);
    g.gain.exponentialRampToValueAtTime(0.16, nt + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, nt + 1.1);
    osc.connect(lp);
    lp.connect(g);
    g.connect(master);
    osc.start(nt);
    osc.stop(nt + 1.2);
  });

  return true;
}

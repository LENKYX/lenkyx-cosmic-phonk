// Studio Audio Mastering Engine: Optional Max Volume Booster + Anti-Clipping Limiter + 3-Band EQ + Live FFT Analyser

export interface AudioSoundProfile {
  turboEnabled: boolean;
  boostPercent: number; // 100 = normal, up to 220 = +7dB clean studio boost
  bassDb: number; // -6 to +10
  midDb: number; // -6 to +8
  trebleDb: number; // -6 to +8
  presetName: 'normal' | 'max' | 'bass' | 'vocal' | 'custom';
}

const STORAGE_SOUND_PROFILE = 'lenkyx_sound_profile_v1';

export const DEFAULT_SOUND_PROFILE: AudioSoundProfile = {
  turboEnabled: false,
  boostPercent: 100,
  bassDb: 0,
  midDb: 0,
  trebleDb: 0,
  presetName: 'normal',
};

export function loadSoundProfile(): AudioSoundProfile {
  try {
    const raw = localStorage.getItem(STORAGE_SOUND_PROFILE);
    if (!raw) return DEFAULT_SOUND_PROFILE;
    return { ...DEFAULT_SOUND_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SOUND_PROFILE;
  }
}

export function saveSoundProfile(p: AudioSoundProfile): void {
  try {
    localStorage.setItem(STORAGE_SOUND_PROFILE, JSON.stringify(p));
  } catch {
    // ignore
  }
}

class LenkyxAudioEngine {
  private ctx: AudioContext | null = null;
  private connectedEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private freqBuf: Uint8Array<ArrayBuffer> | null = null;
  private lastProfile: AudioSoundProfile = loadSoundProfile();
  private canUseWebAudioForCurrentSrc = false;

  public attachAudioElement(el: HTMLAudioElement | null): void {
    if (!el) return;
    const src = el.currentSrc || el.src || '';
    const sameOriginOrBlob =
      !src ||
      src.startsWith('blob:') ||
      src.startsWith('data:') ||
      src.startsWith(window.location.origin) ||
      src.startsWith('/');

    this.canUseWebAudioForCurrentSrc = sameOriginOrBlob;
    if (!sameOriginOrBlob) {
      // Cross-origin external streams without CORS cannot pass through MediaElementAudioSourceNode silently
      return;
    }

    if (this.connectedEl === el && this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      this.applyProfile(this.lastProfile);
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(el);

      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 110;

      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1200;
      mid.Q.value = 1.0;

      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 6500;

      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      // Studio anti-clipping compressor/limiter so high volume stays clean and crisp!
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -3.0;
      limiter.knee.value = 6.0;
      limiter.ratio.value = 12.0;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.12;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;

      source.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(gain);
      gain.connect(limiter);
      limiter.connect(analyser);
      analyser.connect(ctx.destination);

      this.ctx = ctx;
      this.connectedEl = el;
      this.sourceNode = source;
      this.bassFilter = bass;
      this.midFilter = mid;
      this.trebleFilter = treble;
      this.gainNode = gain;
      this.limiterNode = limiter;
      this.analyserNode = analyser;
      this.freqBuf = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));

      this.applyProfile(this.lastProfile);
    } catch {
      // Safe fallback to native HTMLAudioElement playback
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  public applyProfile(profile: AudioSoundProfile): void {
    this.lastProfile = profile;
    saveSoundProfile(profile);
    if (!this.ctx || !this.gainNode || !this.bassFilter || !this.midFilter || !this.trebleFilter) return;

    const now = this.ctx.currentTime;
    const effectiveBoost = profile.turboEnabled ? Math.max(100, Math.min(240, profile.boostPercent)) : 100;
    this.gainNode.gain.setTargetAtTime(effectiveBoost / 100, now, 0.04);
    this.bassFilter.gain.setTargetAtTime(profile.bassDb, now, 0.04);
    this.midFilter.gain.setTargetAtTime(profile.midDb, now, 0.04);
    this.trebleFilter.gain.setTargetAtTime(profile.trebleDb, now, 0.04);
  }

  public isLiveFftAvailable(): boolean {
    return Boolean(this.analyserNode && this.freqBuf && this.canUseWebAudioForCurrentSrc);
  }

  public sampleBands(): { bass: number; mid: number; treble: number; spectrum: Uint8Array | null } {
    if (!this.analyserNode || !this.freqBuf || !this.canUseWebAudioForCurrentSrc) {
      return { bass: 0, mid: 0, treble: 0, spectrum: null };
    }
    this.analyserNode.getByteFrequencyData(this.freqBuf);
    const len = this.freqBuf.length;
    let b = 0;
    let m = 0;
    let t = 0;
    const bEnd = Math.max(1, Math.floor(len * 0.18));
    const mEnd = Math.max(bEnd + 1, Math.floor(len * 0.55));
    for (let i = 0; i < len; i++) {
      const v = this.freqBuf[i] / 255;
      if (i < bEnd) b += v;
      else if (i < mEnd) m += v;
      else t += v;
    }
    return {
      bass: b / bEnd,
      mid: m / Math.max(1, mEnd - bEnd),
      treble: t / Math.max(1, len - mEnd),
      spectrum: this.freqBuf,
    };
  }
}

export const lenkyxAudioEngine = new LenkyxAudioEngine();

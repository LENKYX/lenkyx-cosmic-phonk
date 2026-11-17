export type DeckId = 'A' | 'B';
export type DjFxType = 'cowbell' | '808drop' | 'airhorn' | 'riser' | 'laser' | 'brake' | 'impact' | 'snareroll';

interface DeckNodes {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  lowEQ: BiquadFilterNode;
  midEQ: BiquadFilterNode;
  highEQ: BiquadFilterNode;
  sweepFilter: BiquadFilterNode;
  echoSend: GainNode;
  echoDelay: DelayNode;
  echoFeedback: GainNode;
  deckGain: GainNode;
  deckAnalyser: AnalyserNode;
  crossfadeGain: GainNode;
  eqValues: { low: number; mid: number; high: number };
  eqKills: { low: boolean; mid: boolean; high: boolean };
}

class CosmicDJEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private decks: Record<DeckId, DeckNodes | null> = { A: null, B: null };
  private crossfaderValue = 0; // -1 (full A) to +1 (full B)
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private levelBuf = new Uint8Array(64);
  private autoFadeTimer: number | null = null;

  ensureInit() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.94;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -9;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.76;

    this.streamDest = this.ctx.createMediaStreamDestination();

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.analyser.connect(this.streamDest);

    this.decks.A = this.createDeckNodes();
    this.decks.B = this.createDeckNodes();
    this.setCrossfader(this.crossfaderValue);
  }

  private createDeckNodes(): DeckNodes {
    if (!this.ctx || !this.masterGain) throw new Error('AudioContext not ready');
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.preload = 'auto';

    const source = this.ctx.createMediaElementSource(audio);

    const lowEQ = this.ctx.createBiquadFilter();
    lowEQ.type = 'lowshelf';
    lowEQ.frequency.value = 135;

    const midEQ = this.ctx.createBiquadFilter();
    midEQ.type = 'peaking';
    midEQ.frequency.value = 1100;
    midEQ.Q.value = 1.0;

    const highEQ = this.ctx.createBiquadFilter();
    highEQ.type = 'highshelf';
    highEQ.frequency.value = 4200;

    const sweepFilter = this.ctx.createBiquadFilter();
    sweepFilter.type = 'allpass';
    sweepFilter.frequency.value = 1000;

    const deckGain = this.ctx.createGain();
    deckGain.gain.value = 0.88;

    const deckAnalyser = this.ctx.createAnalyser();
    deckAnalyser.fftSize = 128;
    deckAnalyser.smoothingTimeConstant = 0.72;

    const crossfadeGain = this.ctx.createGain();
    crossfadeGain.gain.value = 1.0;

    // Beat-synced Echo FX loop
    const echoSend = this.ctx.createGain();
    echoSend.gain.value = 0;
    const echoDelay = this.ctx.createDelay(2.0);
    echoDelay.delayTime.value = 0.34;
    const echoFeedback = this.ctx.createGain();
    echoFeedback.gain.value = 0.42;
    const echoFilter = this.ctx.createBiquadFilter();
    echoFilter.type = 'bandpass';
    echoFilter.frequency.value = 1600;
    echoFilter.Q.value = 0.7;

    source.connect(lowEQ);
    lowEQ.connect(midEQ);
    midEQ.connect(highEQ);
    highEQ.connect(sweepFilter);
    sweepFilter.connect(deckGain);
    deckGain.connect(deckAnalyser);
    deckAnalyser.connect(crossfadeGain);
    crossfadeGain.connect(this.masterGain);

    // Echo wet routing
    deckGain.connect(echoSend);
    echoSend.connect(echoDelay);
    echoDelay.connect(echoFilter);
    echoFilter.connect(crossfadeGain);
    echoFilter.connect(echoFeedback);
    echoFeedback.connect(echoDelay);

    return {
      audio,
      source,
      lowEQ,
      midEQ,
      highEQ,
      sweepFilter,
      echoSend,
      echoDelay,
      echoFeedback,
      deckGain,
      deckAnalyser,
      crossfadeGain,
      eqValues: { low: 0, mid: 0, high: 0 },
      eqKills: { low: false, mid: false, high: false },
    };
  }

  getDeckAudio(id: DeckId): HTMLAudioElement {
    this.ensureInit();
    return this.decks[id]!.audio;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getDeckLevel(id: DeckId): number {
    const deck = this.decks[id];
    if (!deck || deck.audio.paused) return 0;
    deck.deckAnalyser.getByteTimeDomainData(this.levelBuf);
    let peak = 0;
    for (let i = 0; i < this.levelBuf.length; i++) {
      const v = Math.abs(this.levelBuf[i] - 128) / 128;
      if (v > peak) peak = v;
    }
    return Math.min(1, peak * 1.45);
  }

  getMasterLevel(): number {
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.levelBuf);
    let peak = 0;
    for (let i = 0; i < this.levelBuf.length; i++) {
      const v = Math.abs(this.levelBuf[i] - 128) / 128;
      if (v > peak) peak = v;
    }
    return Math.min(1, peak * 1.4);
  }

  loadTrack(id: DeckId, url: string) {
    this.ensureInit();
    const audio = this.decks[id]!.audio;
    const wasPlaying = !audio.paused;
    audio.src = url;
    audio.load();
    if (wasPlaying) {
      void audio.play().catch(() => {});
    }
  }

  async togglePlay(id: DeckId): Promise<boolean> {
    this.ensureInit();
    const audio = this.decks[id]!.audio;
    if (audio.paused) {
      await audio.play();
      return true;
    } else {
      audio.pause();
      return false;
    }
  }

  pauseDeck(id: DeckId) {
    const deck = this.decks[id];
    if (deck) deck.audio.pause();
  }

  seek(id: DeckId, time: number) {
    const deck = this.decks[id];
    if (!deck || !Number.isFinite(deck.audio.duration)) return;
    deck.audio.currentTime = Math.max(0, Math.min(deck.audio.duration, time));
  }

  nudge(id: DeckId, deltaSeconds: number) {
    const deck = this.decks[id];
    if (!deck || !Number.isFinite(deck.audio.duration)) return;
    deck.audio.currentTime = Math.max(0, Math.min(deck.audio.duration, deck.audio.currentTime + deltaSeconds));
  }

  setPlaybackRate(id: DeckId, rate: number) {
    this.ensureInit();
    const clamped = Math.max(0.75, Math.min(1.25, rate));
    this.decks[id]!.audio.playbackRate = clamped;
  }

  setDeckVolume(id: DeckId, vol: number) {
    this.ensureInit();
    this.decks[id]!.deckGain.gain.setTargetAtTime(Math.max(0, Math.min(1.2, vol)), this.ctx!.currentTime, 0.015);
  }

  setMasterVolume(vol: number) {
    this.ensureInit();
    this.masterGain!.gain.setTargetAtTime(Math.max(0, Math.min(1.2, vol)), this.ctx!.currentTime, 0.015);
  }

  private applyEqBand(id: DeckId, band: 'low' | 'mid' | 'high') {
    const deck = this.decks[id];
    if (!deck || !this.ctx) return;
    const db = deck.eqKills[band] ? -38 : deck.eqValues[band];
    const node = band === 'low' ? deck.lowEQ : band === 'mid' ? deck.midEQ : deck.highEQ;
    node.gain.setTargetAtTime(db, this.ctx.currentTime, 0.015);
  }

  setEQ(id: DeckId, band: 'low' | 'mid' | 'high', db: number) {
    this.ensureInit();
    const deck = this.decks[id]!;
    deck.eqValues[band] = db;
    this.applyEqBand(id, band);
  }

  setEQKill(id: DeckId, band: 'low' | 'mid' | 'high', killed: boolean) {
    this.ensureInit();
    const deck = this.decks[id]!;
    deck.eqKills[band] = killed;
    this.applyEqBand(id, band);
  }

  // Color FX Filter: -1 = deep lowpass, 0 = bypass, +1 = sharp highpass
  setFilter(id: DeckId, val: number) {
    this.ensureInit();
    const f = this.decks[id]!.sweepFilter;
    const now = this.ctx!.currentTime;
    if (Math.abs(val) < 0.05) {
      f.type = 'allpass';
      f.Q.setTargetAtTime(0.7, now, 0.02);
    } else if (val < 0) {
      f.type = 'lowpass';
      const freq = 220 * Math.pow(75, 1 + val);
      f.frequency.setTargetAtTime(freq, now, 0.02);
      f.Q.setTargetAtTime(3.2, now, 0.02);
    } else {
      f.type = 'highpass';
      const freq = 90 * Math.pow(52, val);
      f.frequency.setTargetAtTime(freq, now, 0.02);
      f.Q.setTargetAtTime(3.2, now, 0.02);
    }
  }

  // Beat-synced Echo FX (0..1)
  setEcho(id: DeckId, amount: number, bpm = 132) {
    this.ensureInit();
    const deck = this.decks[id]!;
    const now = this.ctx!.currentTime;
    const beatSec = 60 / Math.max(80, Math.min(180, bpm));
    deck.echoDelay.delayTime.setTargetAtTime(beatSec * 0.75, now, 0.03);
    deck.echoSend.gain.setTargetAtTime(Math.max(0, Math.min(0.85, amount * 0.8)), now, 0.02);
    deck.echoFeedback.gain.setTargetAtTime(0.32 + amount * 0.35, now, 0.02);
  }

  // Equal-power crossfader: -1 (Deck A) -> 0 (Both) -> +1 (Deck B)
  setCrossfader(val: number) {
    this.crossfaderValue = Math.max(-1, Math.min(1, val));
    if (!this.ctx || !this.decks.A || !this.decks.B) return;
    const x = (this.crossfaderValue + 1) / 2;
    const gainA = Math.cos(x * Math.PI * 0.5);
    const gainB = Math.cos((1 - x) * Math.PI * 0.5);
    const now = this.ctx.currentTime;
    this.decks.A.crossfadeGain.gain.setTargetAtTime(gainA, now, 0.012);
    this.decks.B.crossfadeGain.gain.setTargetAtTime(gainB, now, 0.012);
  }

  autoCrossfade(target: DeckId, onStep: (val: number) => void, durationMs = 3800) {
    if (this.autoFadeTimer !== null) {
      window.clearInterval(this.autoFadeTimer);
      this.autoFadeTimer = null;
    }
    const startVal = this.crossfaderValue;
    const endVal = target === 'A' ? -1 : 1;
    const startTs = performance.now();
    this.autoFadeTimer = window.setInterval(() => {
      const pct = Math.min(1, (performance.now() - startTs) / durationMs);
      const eased = pct < 0.5 ? 2 * pct * pct : 1 - Math.pow(-2 * pct + 2, 2) / 2;
      const cur = startVal + (endVal - startVal) * eased;
      this.setCrossfader(cur);
      onStep(cur);
      if (pct >= 1 && this.autoFadeTimer !== null) {
        window.clearInterval(this.autoFadeTimer);
        this.autoFadeTimer = null;
      }
    }, 30);
  }

  // 8-Pad Pro Club FX Sampler
  triggerFX(type: DjFxType) {
    this.ensureInit();
    const ctx = this.ctx!;
    const out = this.masterGain!;
    const now = ctx.currentTime;

    if (type === 'cowbell') {
      [560, 845].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const bp = ctx.createBiquadFilter();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        bp.type = 'bandpass';
        bp.frequency.value = 760;
        bp.Q.value = 2.5;
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(bp);
        bp.connect(g);
        g.connect(out);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } else if (type === '808drop') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.72);
      g.gain.setValueAtTime(0.92, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.82);
      osc.connect(g);
      g.connect(out);
      osc.start(now);
      osc.stop(now + 0.85);
    } else if (type === 'airhorn') {
      [440, 554, 659].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f * 0.94, now);
        osc.frequency.linearRampToValueAtTime(f * 1.03, now + 0.08);
        osc.frequency.setValueAtTime(f, now + 0.14);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.2 - idx * 0.03, now + 0.03);
        g.gain.setValueAtTime(0.18 - idx * 0.03, now + 0.45);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
        osc.connect(g);
        g.connect(out);
        osc.start(now);
        osc.stop(now + 0.75);
      });
    } else if (type === 'riser') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 1.35);
      g.gain.setValueAtTime(0.02, now);
      g.gain.linearRampToValueAtTime(0.32, now + 1.25);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc.connect(g);
      g.connect(out);
      osc.start(now);
      osc.stop(now + 1.42);
    } else if (type === 'laser') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1850, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.34);
      g.gain.setValueAtTime(0.38, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.connect(g);
      g.connect(out);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (type === 'brake') {
      (['A', 'B'] as DeckId[]).forEach((id) => {
        const d = this.decks[id];
        if (d && !d.audio.paused) {
          const origRate = d.audio.playbackRate;
          let step = 0;
          const timer = window.setInterval(() => {
            step++;
            d.audio.playbackRate = Math.max(0.25, origRate * (1 - step * 0.14));
            if (step >= 6) {
              window.clearInterval(timer);
              d.audio.pause();
              d.audio.playbackRate = origRate;
            }
          }, 55);
        }
      });
    } else if (type === 'impact') {
      // Sub boom + white noise burst
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.9);
      og.gain.setValueAtTime(0.95, now);
      og.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      osc.connect(og);
      og.connect(out);
      osc.start(now);
      osc.stop(now + 1.0);

      const bufLen = Math.floor(ctx.sampleRate * 0.5);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.28));
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.42, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      noise.connect(ng);
      ng.connect(out);
      noise.start(now);
    } else if (type === 'snareroll') {
      // 8-hit accelerating trap/funk snare roll
      const times = [0, 0.14, 0.28, 0.4, 0.5, 0.58, 0.65, 0.71];
      times.forEach((tOff, i) => {
        const len = Math.floor(ctx.sampleRate * 0.09);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.exp(-k / (len * 0.35));
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1100 + i * 180;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.2 + i * 0.04, now + tOff);
        g.gain.exponentialRampToValueAtTime(0.001, now + tOff + 0.09);
        src.connect(hp);
        hp.connect(g);
        g.connect(out);
        src.start(now + tOff);
      });
    }
  }

  startRecording(): boolean {
    this.ensureInit();
    if (!this.streamDest) return false;
    this.recordedChunks = [];
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    this.recorder = new MediaRecorder(this.streamDest.stream, { mimeType: mime });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.recorder.start(250);
    return true;
  }

  stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      this.recorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        resolve(blob);
      };
      this.recorder.stop();
    });
  }
}

export const djEngine = new CosmicDJEngine();

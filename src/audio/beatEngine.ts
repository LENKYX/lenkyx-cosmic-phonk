export interface BeatPattern {
  kick: boolean[];
  snare: boolean[];
  hat: boolean[];
  bass808: boolean[];
  cowbell: number[]; // 0 = off, >0 = semitone offset in minor phonk scale
  synth: boolean[];
}

export const BEAT_PRESETS: Record<string, { name: string; bpm: number; pattern: BeatPattern }> = {
  lostSpaceship: {
    name: '🚀 Lost Spaceship (132 BPM)',
    bpm: 132,
    pattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, true, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, false, true, false, true, false, true, false, true, false, true, true, true, false, true, true],
      bass808: [true, false, false, true, false, false, false, false, true, false, false, true, false, false, false, false],
      cowbell: [1, 0, 4, 8, 0, 11, 8, 0, 4, 0, 8, 6, 4, 0, 1, 0],
      synth:   [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    },
  },
  cosmicDriver: {
    name: '🚗 Cosmic Driver (138 BPM)',
    bpm: 138,
    pattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, true],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, true, true, false, true, true, true, false, true, true, true, false, true, true, true, true],
      bass808: [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
      cowbell: [1, 1, 8, 0, 11, 8, 6, 0, 4, 6, 8, 0, 13, 11, 8, 4],
      synth:   [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
    },
  },
  cyberFunk: {
    name: '💙 Cyber Funk Melody (130 BPM)',
    bpm: 130,
    pattern: {
      kick:    [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, false, true, false, true, false, true, true, true, false, true, false, true, false, true, false],
      bass808: [true, false, false, true, false, false, true, false, true, false, false, false, false, false, true, false],
      cowbell: [1, 0, 8, 11, 13, 0, 11, 8, 4, 0, 8, 11, 8, 0, 6, 4],
      synth:   [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    },
  },
  finalOrbit: {
    name: '🛰️ Final Orbit Finale (134 BPM)',
    bpm: 134,
    pattern: {
      kick:    [true, false, false, false, true, false, true, false, true, false, false, false, true, false, true, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
      hat:     [true, false, true, true, true, false, true, false, true, false, true, true, true, true, true, false],
      bass808: [true, false, false, true, false, false, false, false, true, false, true, false, false, false, true, false],
      cowbell: [1, 0, 8, 13, 16, 0, 13, 11, 8, 0, 11, 13, 16, 13, 11, 8],
      synth:   [true, false, false, false, false, false, false, false, true, false, false, false, true, false, false, false],
    },
  },
};

function midiToHz(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

class BeatMakerEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private timerId: number | null = null;
  private step = 0;
  private bpm = 132;
  private rootMidi = 41; // F2
  private pattern: BeatPattern = BEAT_PRESETS.lostSpaceship.pattern;
  private onStep: ((step: number) => void) | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.82;
      this.streamDest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.streamDest);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  updateConfig(pattern: BeatPattern, bpm: number, rootMidi = 41) {
    this.pattern = pattern;
    this.bpm = bpm;
    this.rootMidi = rootMidi;
  }

  start(onStep: (s: number) => void) {
    this.init();
    this.stop();
    this.onStep = onStep;
    this.step = 0;
    const tick = () => {
      this.playStep(this.step);
      this.onStep?.(this.step);
      this.step = (this.step + 1) % 16;
      const stepMs = (60 / this.bpm / 4) * 1000;
      this.timerId = window.setTimeout(tick, stepMs);
    };
    tick();
  }

  stop() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  startRecording() {
    this.init();
    if (!this.streamDest) return;
    this.chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    this.recorder = new MediaRecorder(this.streamDest.stream, { mimeType });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(200);
  }

  stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      this.recorder.onstop = () => {
        resolve(new Blob(this.chunks, { type: this.recorder?.mimeType || 'audio/webm' }));
        this.chunks = [];
      };
      this.recorder.stop();
    });
  }

  private playStep(s: number) {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const out = this.masterGain;
    const now = ctx.currentTime;

    // Kick
    if (this.pattern.kick[s]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(155, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.23);
    }

    // 808 Sub Bass
    if (this.pattern.bass808[s]) {
      const osc = ctx.createOscillator();
      const shaper = ctx.createWaveShaper();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const note = s >= 8 ? this.rootMidi - 2 : this.rootMidi;
      osc.frequency.setValueAtTime(midiToHz(note), now);
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = Math.tanh(x * 3.5);
      }
      shaper.curve = curve;
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.connect(shaper);
      shaper.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.36);
    }

    // Drift Phonk Cowbell
    const cb = this.pattern.cowbell[s];
    if (cb > 0) {
      const baseFreq = midiToHz(this.rootMidi + 24 + (cb - 1));
      [baseFreq, baseFreq * 1.498].forEach((freq) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        filter.type = 'bandpass';
        filter.frequency.value = freq * 1.1;
        filter.Q.value = 1.6;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(out);
        osc.start(now);
        osc.stop(now + 0.19);
      });
    }

    // Snare
    if (this.pattern.snare[s]) {
      const bufferSize = ctx.sampleRate * 0.14;
      const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      noise.connect(hp);
      hp.connect(gain);
      gain.connect(out);
      noise.start(now);
    }

    // Hi-Hat
    if (this.pattern.hat[s]) {
      const bufferSize = ctx.sampleRate * 0.045;
      const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 6500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      noise.connect(hp);
      hp.connect(gain);
      gain.connect(out);
      noise.start(now);
    }

    // Futuristic Synth Chord Stab
    if (this.pattern.synth[s]) {
      [0, 3, 7, 10].forEach((iv) => {
        const osc = ctx.createOscillator();
        const lp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(midiToHz(this.rootMidi + 12 + iv), now);
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(2400, now);
        lp.frequency.exponentialRampToValueAtTime(600, now + 0.45);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(lp);
        lp.connect(gain);
        gain.connect(out);
        osc.start(now);
        osc.stop(now + 0.52);
      });
    }
  }
}

export const beatEngine = new BeatMakerEngine();

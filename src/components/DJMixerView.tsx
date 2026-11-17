import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Circle,
  Square,
  Download,
  Save,
  Disc3,
  Zap,
  Sparkles,
  Repeat,
  ArrowLeftRight,
  Sliders,
} from 'lucide-react';
import { AudioVersion, Track } from '../types';
import { DeckId, djEngine, DjFxType } from '../audio/djEngine';
import { authFetch } from '../utils/api';
import { downloadBlobReliable } from '../utils/androidBridge';

interface Props {
  tracks: Track[];
  isCreator: boolean;
  initialDeckA?: Track | null;
  initialDeckB?: Track | null;
  onPauseCatalogPlayer: () => void;
  onMixSaved: (track: Track) => void;
  onToast: (msg: string) => void;
}

interface DeckUIState {
  trackId: string;
  version: AudioVersion;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  rate: number;
  low: number;
  mid: number;
  high: number;
  killLow: boolean;
  killMid: boolean;
  killHigh: boolean;
  filter: number;
  echo: number;
  cues: (number | null)[];
  loopBeats: number | null;
  loopStart: number;
  loopEnd: number;
}

const CUE_COLORS = [
  'bg-pink-500 border-pink-300 text-white',
  'bg-cyan-400 border-cyan-200 text-black',
  'bg-amber-400 border-amber-200 text-black',
  'bg-emerald-400 border-emerald-200 text-black',
];
const CUE_HEX = ['#ec4899', '#22d3ee', '#fbbf24', '#34d399'];

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function makeDeckWaveform(seedStr: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const bars: number[] = [];
  for (let i = 0; i < 240; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const base = ((h >>> 0) % 1000) / 1000;
    const envelope = Math.sin((i / 240) * Math.PI) * 0.45 + 0.55;
    const beatPulse = i % 4 === 0 ? 1.0 : 0.72;
    bars.push(Math.min(1, Math.max(0.14, base * envelope * beatPulse)));
  }
  return bars;
}

function createInitialDeck(trackId: string): DeckUIState {
  return {
    trackId,
    version: 'v1',
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.9,
    rate: 1.0,
    low: 0,
    mid: 0,
    high: 0,
    killLow: false,
    killMid: false,
    killHigh: false,
    filter: 0,
    echo: 0,
    cues: [null, null, null, null],
    loopBeats: null,
    loopStart: 0,
    loopEnd: 0,
  };
}

export const DJMixerView: React.FC<Props> = ({
  tracks,
  isCreator,
  initialDeckA,
  initialDeckB,
  onPauseCatalogPlayer,
  onMixSaved,
  onToast,
}) => {
  const [deckA, setDeckA] = useState<DeckUIState>(() => createInitialDeck(initialDeckA?.id || tracks[0]?.id || ''));
  const [deckB, setDeckB] = useState<DeckUIState>(() =>
    createInitialDeck(initialDeckB?.id || tracks[1]?.id || tracks[0]?.id || '')
  );
  const [crossfader, setCrossfader] = useState(0);
  const [masterVol, setMasterVol] = useState(0.94);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [mixTitle, setMixTitle] = useState('LENKYX Live Cosmic DJ Set');
  const [savingMix, setSavingMix] = useState(false);

  // Refs for 60fps canvas rendering
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vuARef = useRef<HTMLDivElement | null>(null);
  const vuMRef = useRef<HTMLDivElement | null>(null);
  const vuBRef = useRef<HTMLDivElement | null>(null);
  const deckARef = useRef(deckA);
  const deckBRef = useRef(deckB);
  deckARef.current = deckA;
  deckBRef.current = deckB;

  const trackA = tracks.find((t) => t.id === deckA.trackId) || tracks[0];
  const trackB = tracks.find((t) => t.id === deckB.trackId) || tracks[1] || tracks[0];
  const waveA = useRef<number[]>(makeDeckWaveform(trackA?.id || 'A'));
  const waveB = useRef<number[]>(makeDeckWaveform(trackB?.id || 'B'));

  useEffect(() => {
    waveA.current = makeDeckWaveform((trackA?.id || 'A') + deckA.version);
  }, [trackA?.id, deckA.version]);

  useEffect(() => {
    waveB.current = makeDeckWaveform((trackB?.id || 'B') + deckB.version);
  }, [trackB?.id, deckB.version]);

  // Sync external track loads from Catalog / World Explore / Playlists
  useEffect(() => {
    if (initialDeckA?.id) {
      setDeckA((d) => ({ ...d, trackId: initialDeckA.id, version: 'v1', cues: [null, null, null, null], loopBeats: null }));
    }
  }, [initialDeckA?.id]);

  useEffect(() => {
    if (initialDeckB?.id) {
      setDeckB((d) => ({ ...d, trackId: initialDeckB.id, version: 'v1', cues: [null, null, null, null], loopBeats: null }));
    }
  }, [initialDeckB?.id]);

  // Load audio when track or version changes
  useEffect(() => {
    if (!trackA) return;
    const url = deckA.version === 'v2' && trackA.audioUrlV2 ? trackA.audioUrlV2 : trackA.audioUrl;
    djEngine.loadTrack('A', url);
  }, [trackA?.id, trackA?.audioUrl, trackA?.audioUrlV2, deckA.version]);

  useEffect(() => {
    if (!trackB) return;
    const url = deckB.version === 'v2' && trackB.audioUrlV2 ? trackB.audioUrlV2 : trackB.audioUrl;
    djEngine.loadTrack('B', url);
  }, [trackB?.id, trackB?.audioUrl, trackB?.audioUrlV2, deckB.version]);

  // 60fps loop: time sync + auto-loop monitor + Serato dual scrolling waveform + LED VU meters!
  useEffect(() => {
    let raf = 0;
    let lastUiSync = 0;

    const tick = (now: number) => {
      const aEl = djEngine.getDeckAudio('A');
      const bEl = djEngine.getDeckAudio('B');

      // Precise Auto-Loop enforcement
      const stA = deckARef.current;
      if (stA.loopBeats && !aEl.paused && aEl.currentTime >= stA.loopEnd) {
        aEl.currentTime = stA.loopStart;
      }
      const stB = deckBRef.current;
      if (stB.loopBeats && !bEl.paused && bEl.currentTime >= stB.loopEnd) {
        bEl.currentTime = stB.loopStart;
      }

      // Throttled React state update (~12fps for time labels)
      if (now - lastUiSync > 85) {
        lastUiSync = now;
        setDeckA((d) => ({
          ...d,
          playing: !aEl.paused,
          currentTime: aEl.currentTime || 0,
          duration: Number.isFinite(aEl.duration) ? aEl.duration : d.duration,
        }));
        setDeckB((d) => ({
          ...d,
          playing: !bEl.paused,
          currentTime: bEl.currentTime || 0,
          duration: Number.isFinite(bEl.duration) ? bEl.duration : d.duration,
        }));
      }

      // Real-time LED VU meters
      const lvlA = djEngine.getDeckLevel('A');
      const lvlM = djEngine.getMasterLevel();
      const lvlB = djEngine.getDeckLevel('B');
      if (vuARef.current) vuARef.current.style.height = `${Math.round(lvlA * 100)}%`;
      if (vuMRef.current) vuMRef.current.style.height = `${Math.round(lvlM * 100)}%`;
      if (vuBRef.current) vuBRef.current.style.height = `${Math.round(lvlB * 100)}%`;

      // Dual Serato / Rekordbox Scrolling Waveforms
      const canvas = waveCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#070412';
          ctx.fillRect(0, 0, w, h);

          // Center divider
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(0, h / 2, w, 1);

          const drawWaveLane = (
            bars: number[],
            curTime: number,
            dur: number,
            topY: number,
            laneH: number,
            colorMain: string,
            colorDim: string,
            cues: (number | null)[],
            loopActive: boolean,
            loopStart: number,
            loopEnd: number
          ) => {
            const safeDur = dur > 1 ? dur : 180;
            const progress = Math.min(1, Math.max(0, curTime / safeDur));
            const midY = topY + laneH / 2;
            const barW = w / bars.length;

            // Loop region highlight
            if (loopActive && loopEnd > loopStart) {
              const lx1 = (loopStart / safeDur) * w;
              const lx2 = (loopEnd / safeDur) * w;
              ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
              ctx.fillRect(lx1, topY, Math.max(4, lx2 - lx1), laneH);
              ctx.strokeStyle = '#34d399';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(lx1, topY + 1, Math.max(4, lx2 - lx1), laneH - 2);
            }

            // Bars
            for (let i = 0; i < bars.length; i++) {
              const x = i * barW;
              const isPast = i / bars.length <= progress;
              const bh = bars[i] * (laneH * 0.44);
              ctx.fillStyle = isPast ? colorMain : colorDim;
              ctx.fillRect(x, midY - bh, Math.max(1.5, barW - 1), bh * 2);
            }

            // Hot Cue Pins
            cues.forEach((cTime, idx) => {
              if (cTime === null) return;
              const cx = (cTime / safeDur) * w;
              ctx.fillStyle = CUE_HEX[idx];
              ctx.fillRect(cx - 1, topY, 2, laneH);
              ctx.fillRect(cx - 1, topY, 10, 10);
            });

            // Playhead cursor
            const px = progress * w;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px - 1, topY, 2, laneH);
          };

          drawWaveLane(
            waveA.current,
            aEl.currentTime || 0,
            aEl.duration || 180,
            0,
            h / 2 - 1,
            '#ff2ea6',
            'rgba(236, 72, 153, 0.30)',
            stA.cues,
            Boolean(stA.loopBeats),
            stA.loopStart,
            stA.loopEnd
          );

          drawWaveLane(
            waveB.current,
            bEl.currentTime || 0,
            bEl.duration || 180,
            h / 2 + 1,
            h / 2 - 1,
            '#38bdf8',
            'rgba(56, 189, 248, 0.30)',
            stB.cues,
            Boolean(stB.loopBeats),
            stB.loopStart,
            stB.loopEnd
          );
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    const t = window.setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [isRecording]);

  const updateDeck = (id: DeckId, updater: (prev: DeckUIState) => DeckUIState) => {
    if (id === 'A') setDeckA(updater);
    else setDeckB(updater);
  };

  const handleTogglePlay = async (id: DeckId) => {
    onPauseCatalogPlayer();
    const playing = await djEngine.togglePlay(id);
    updateDeck(id, (d) => ({ ...d, playing }));
  };

  const handleSyncBpm = (target: DeckId) => {
    const srcTrack = target === 'A' ? trackB : trackA;
    const dstTrack = target === 'A' ? trackA : trackB;
    const srcState = target === 'A' ? deckB : deckA;
    if (!srcTrack || !dstTrack) return;
    const targetBpm = srcTrack.bpm * srcState.rate;
    const newRate = Math.max(0.84, Math.min(1.16, targetBpm / dstTrack.bpm));
    djEngine.setPlaybackRate(target, newRate);
    updateDeck(target, (d) => ({ ...d, rate: Number(newRate.toFixed(3)) }));
    onToast(`⚡ Deck ${target} sincronizado em ${targetBpm.toFixed(1)} BPM!`);
  };

  const handleHotCue = (id: DeckId, slot: number, clearOnly = false) => {
    const state = id === 'A' ? deckA : deckB;
    if (clearOnly) {
      updateDeck(id, (d) => {
        const next = [...d.cues];
        next[slot] = null;
        return { ...d, cues: next };
      });
      return;
    }
    const existing = state.cues[slot];
    if (existing === null) {
      const cur = djEngine.getDeckAudio(id).currentTime || 0;
      updateDeck(id, (d) => {
        const next = [...d.cues];
        next[slot] = cur;
        return { ...d, cues: next };
      });
      onToast(`Hot Cue ${slot + 1} marcado em ${fmtTime(cur)} no Deck ${id}!`);
    } else {
      djEngine.seek(id, existing);
      if (!state.playing) {
        void handleTogglePlay(id);
      }
    }
  };

  const handleToggleLoop = (id: DeckId, beats: number) => {
    const state = id === 'A' ? deckA : deckB;
    const tr = id === 'A' ? trackA : trackB;
    if (!tr) return;
    if (state.loopBeats === beats) {
      updateDeck(id, (d) => ({ ...d, loopBeats: null }));
      return;
    }
    const effBpm = tr.bpm * state.rate;
    const loopDur = (60 / effBpm) * beats;
    const start = djEngine.getDeckAudio(id).currentTime || 0;
    updateDeck(id, (d) => ({ ...d, loopBeats: beats, loopStart: start, loopEnd: start + loopDur }));
    onToast(`🔁 Loop ${beats} beat(s) ativo no Deck ${id}`);
  };

  const handleWaveClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const isTop = e.clientY - rect.top < rect.height / 2;
    const id: DeckId = isTop ? 'A' : 'B';
    const dur = djEngine.getDeckAudio(id).duration || 0;
    if (dur > 0) djEngine.seek(id, xPct * dur);
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      setRecordedBlob(null);
      setRecordedUrl('');
      setRecSeconds(0);
      if (djEngine.startRecording()) {
        setIsRecording(true);
        onToast('🔴 Gravando seu DJ Set ao vivo! Solte os decks e efeitos.');
      }
    } else {
      const blob = await djEngine.stopRecording();
      setIsRecording(false);
      if (blob) {
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        onToast('✅ DJ Set gravado com sucesso!');
      }
    }
  };

  const handleSaveMixToCatalog = async () => {
    if (!recordedBlob) return;
    setSavingMix(true);
    try {
      const fd = new FormData();
      fd.append('title', mixTitle.trim() || 'LENKYX DJ Mix');
      fd.append('emoji', '🎛️');
      fd.append('album', 'LENKYX DJ Sets');
      fd.append('bpm', String(Math.round((trackA?.bpm || 132) * deckA.rate)));
      fd.append('audio', recordedBlob, `lenkyx-dj-set-${Date.now()}.webm`);
      const res = await authFetch('/api/tracks', { method: 'POST', body: fd });
      if (res.status === 401) {
        onToast('Entre como Criador para publicar seu DJ Set no catálogo oficial.');
        return;
      }
      if (!res.ok) throw new Error();
      const saved: Track = await res.json();
      onMixSaved(saved);
      onToast(`🎛️ DJ Set "${saved.title}" publicado no catálogo!`);
    } catch {
      onToast('Erro ao salvar DJ Set.');
    } finally {
      setSavingMix(false);
    }
  };

  const renderDeck = (id: DeckId, state: DeckUIState, tr: Track | undefined) => {
    const isA = id === 'A';
    const effBpm = ((tr?.bpm || 132) * state.rate).toFixed(1);
    const accentBorder = isA ? 'border-pink-500/35' : 'border-cyan-400/35';
    const accentText = isA ? 'text-pink-400' : 'text-cyan-300';
    const accentBadge = isA ? 'bg-pink-500 text-white' : 'bg-cyan-400 text-black';

    return (
      <div className={`rounded-2xl bg-[#0c071b]/95 border ${accentBorder} p-3 space-y-2.5 shadow-xl`}>
        {/* Top Deck Strip: Track Select + V1/V2 + BPM */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md font-display text-[11px] font-black shrink-0 ${accentBadge}`}>
            DECK {id}
          </span>
          <select
            value={state.trackId}
            onChange={(e) =>
              updateDeck(id, (d) => ({
                ...d,
                trackId: e.target.value,
                version: 'v1',
                cues: [null, null, null, null],
                loopBeats: null,
              }))
            }
            className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-black/70 border border-white/15 text-xs font-bold text-white focus:outline-none"
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0e0720]">
                {t.source === 'world_full' || t.source === 'world_preview' ? '🌍 ' : ''}
                {t.emoji} {t.title} ({t.bpm} BPM)
              </option>
            ))}
          </select>
          {tr?.audioUrlV2 && (
            <div className="inline-flex rounded-md overflow-hidden border border-white/20 shrink-0">
              <button
                onClick={() => updateDeck(id, (d) => ({ ...d, version: 'v1' }))}
                className={`px-1.5 py-0.5 text-[10px] font-black ${
                  state.version === 'v1' ? 'bg-pink-500 text-white' : 'bg-black/60 text-purple-200'
                }`}
              >
                V1
              </button>
              <button
                onClick={() => updateDeck(id, (d) => ({ ...d, version: 'v2' }))}
                className={`px-1.5 py-0.5 text-[10px] font-black ${
                  state.version === 'v2' ? 'bg-cyan-400 text-black' : 'bg-black/60 text-purple-200'
                }`}
              >
                V2
              </button>
            </div>
          )}
        </div>

        {/* Jog Wheel + Transport + Pitch */}
        <div className="grid grid-cols-12 gap-2.5 items-center">
          {/* Pro Vinyl Jog Platter */}
          <div className="col-span-5 flex flex-col items-center gap-1.5">
            <button
              onClick={() => void handleTogglePlay(id)}
              className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[3px] ${
                isA ? 'border-pink-500' : 'border-cyan-400'
              } bg-[#06030f] shadow-[inset_0_0_18px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden group`}
              title="Tocar / Pausar Jog"
            >
              {/* Vinyl metallic grooves */}
              <div
                className={`absolute inset-1 rounded-full border border-white/15 ${state.playing ? 'spin-slow' : ''}`}
                style={{
                  background:
                    'repeating-radial-gradient(circle, rgba(255,255,255,0.06) 0px, rgba(0,0,0,0.6) 2px, rgba(255,255,255,0.04) 4px)',
                }}
              />
              {tr && (
                <img
                  src={tr.coverUrl}
                  alt={tr.title}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-black shadow-lg z-10 ${
                    state.playing ? 'spin-slow' : ''
                  }`}
                />
              )}
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 z-20 flex items-center justify-center">
                {state.playing ? (
                  <Pause className="w-6 h-6 text-white drop-shadow opacity-80" />
                ) : (
                  <Play className="w-6 h-6 text-white fill-white drop-shadow ml-0.5" />
                )}
              </div>
            </button>
            <div className="text-[11px] font-mono text-purple-200 flex items-center gap-1.5">
              <span className={`font-black ${accentText}`}>{effBpm} BPM</span>
              <span className="opacity-60">· {fmtTime(state.currentTime)}</span>
            </div>
          </div>

          {/* Transport + SYNC + Pitch + Nudge */}
          <div className="col-span-7 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => void handleTogglePlay(id)}
                className={`py-2 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1 shadow transition ${
                  state.playing
                    ? 'bg-emerald-400 text-black'
                    : isA
                    ? 'bg-pink-600 hover:bg-pink-500 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                }`}
              >
                {state.playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {state.playing ? 'PAUSE' : 'PLAY'}
              </button>
              <button
                onClick={() => {
                  djEngine.seek(id, state.cues[0] ?? 0);
                  onToast(`Deck ${id} voltou para CUE`);
                }}
                className="py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> CUE
              </button>
              <button
                onClick={() => handleSyncBpm(id)}
                className="py-2 rounded-lg bg-purple-500/25 hover:bg-purple-500/45 border border-purple-400/50 text-purple-100 font-black text-xs flex items-center justify-center gap-1"
                title="Sincronizar BPM automaticamente com o outro Deck"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-300" /> SYNC
              </button>
            </div>

            {/* Pitch Tempo Fader + Beat Nudge */}
            <div className="rounded-lg bg-black/50 border border-white/10 p-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-purple-200">
                <span>TEMPO ({state.rate >= 1 ? '+' : ''}{((state.rate - 1) * 100).toFixed(1)}%)</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => djEngine.nudge(id, -0.15)}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-bold"
                    title="Atrasar batida"
                  >
                    -BEND
                  </button>
                  <button
                    onClick={() => {
                      djEngine.setPlaybackRate(id, 1);
                      updateDeck(id, (d) => ({ ...d, rate: 1 }));
                    }}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-bold"
                  >
                    0%
                  </button>
                  <button
                    onClick={() => djEngine.nudge(id, 0.15)}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-bold"
                    title="Adiantar batida"
                  >
                    +BEND
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0.84}
                max={1.16}
                step={0.005}
                value={state.rate}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  djEngine.setPlaybackRate(id, r);
                  updateDeck(id, (d) => ({ ...d, rate: r }));
                }}
                className="dj-slider h-1.5 w-full"
              />
            </div>

            {/* Auto-Loop Pads */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-purple-300 mr-0.5 flex items-center gap-0.5">
                <Repeat className="w-3 h-3" /> LOOP
              </span>
              {[0.5, 1, 2, 4, 8].map((b) => (
                <button
                  key={b}
                  onClick={() => handleToggleLoop(id, b)}
                  className={`flex-1 py-1 rounded text-[10px] font-black transition ${
                    state.loopBeats === b
                      ? 'bg-emerald-400 text-black shadow'
                      : 'bg-white/8 hover:bg-white/15 text-purple-200'
                  }`}
                >
                  {b === 0.5 ? '½' : b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Color-Coded Performance Hot Cues */}
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((slot) => {
            const set = state.cues[slot] !== null;
            return (
              <div key={slot} className="relative">
                <button
                  onClick={() => handleHotCue(id, slot, false)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleHotCue(id, slot, true);
                  }}
                  className={`w-full py-1.5 rounded-lg border text-[10px] font-black transition ${
                    set
                      ? `${CUE_COLORS[slot]} shadow`
                      : 'bg-white/5 hover:bg-white/12 border-white/15 text-purple-300'
                  }`}
                  title={set ? `Pular para ${fmtTime(state.cues[slot]!)} (botão direito limpa)` : `Marcar Hot Cue ${slot + 1}`}
                >
                  HOT {slot + 1} {set ? `· ${fmtTime(state.cues[slot]!)}` : ''}
                </button>
                {set && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHotCue(id, slot, true);
                    }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-black text-white text-[9px] flex items-center justify-center border border-white/30"
                    title="Limpar Cue"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Filter + Echo FX */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] font-mono text-purple-200">
              <span>COLOR FILTER</span>
              <span className={accentText}>
                {Math.abs(state.filter) < 0.05 ? 'OFF' : state.filter < 0 ? 'LPF' : 'HPF'}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={state.filter}
              onChange={(e) => {
                const v = Number(e.target.value);
                djEngine.setFilter(id, v);
                updateDeck(id, (d) => ({ ...d, filter: v }));
              }}
              className="dj-slider h-1.5 w-full"
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] font-mono text-purple-200">
              <span>ECHO FX</span>
              <span className="text-emerald-300">{Math.round(state.echo * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.echo}
              onChange={(e) => {
                const v = Number(e.target.value);
                djEngine.setEcho(id, v, (tr?.bpm || 132) * state.rate);
                updateDeck(id, (d) => ({ ...d, echo: v }));
              }}
              className="dj-slider h-1.5 w-full"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderEqStrip = (id: DeckId, state: DeckUIState) => {
    const bands: { key: 'high' | 'mid' | 'low'; killKey: 'killHigh' | 'killMid' | 'killLow'; label: string }[] = [
      { key: 'high', killKey: 'killHigh', label: 'HI' },
      { key: 'mid', killKey: 'killMid', label: 'MID' },
      { key: 'low', killKey: 'killLow', label: 'LOW' },
    ];
    return (
      <div className="space-y-1.5">
        <div className={`text-[10px] font-black text-center ${id === 'A' ? 'text-pink-400' : 'text-cyan-300'}`}>
          EQ {id}
        </div>
        {bands.map((b) => {
          const val = state[b.key];
          const killed = state[b.killKey];
          return (
            <div key={b.key} className="space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-mono text-purple-300">{b.label}</span>
                <button
                  onClick={() => {
                    const next = !killed;
                    djEngine.setEQKill(id, b.key, next);
                    updateDeck(id, (d) => ({ ...d, [b.killKey]: next }));
                  }}
                  className={`px-1.5 py-0.2 rounded text-[8px] font-black transition ${
                    killed ? 'bg-red-500 text-white' : 'bg-white/10 text-purple-300 hover:bg-white/20'
                  }`}
                  title={`Kill ${b.label}`}
                >
                  KILL
                </button>
              </div>
              <input
                type="range"
                min={-18}
                max={12}
                step={1}
                value={val}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  djEngine.setEQ(id, b.key, v);
                  updateDeck(id, (d) => ({ ...d, [b.key]: v }));
                }}
                className="dj-slider h-1.5 w-full"
              />
            </div>
          );
        })}

        {/* Channel Volume */}
        <div className="pt-1 border-t border-white/10">
          <div className="flex justify-between text-[9px] font-mono text-purple-200">
            <span>VOL {id}</span>
            <span>{Math.round(state.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1.1}
            step={0.02}
            value={state.volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              djEngine.setDeckVolume(id, v);
              updateDeck(id, (d) => ({ ...d, volume: v }));
            }}
            className="dj-slider h-1.5 w-full"
          />
        </div>
      </div>
    );
  };

  const fxPads: { id: DjFxType; label: string; color: string }[] = [
    { id: 'cowbell', label: '🔔 COWBELL', color: 'from-pink-600/35 to-pink-500/20 border-pink-400/45 text-pink-100' },
    { id: '808drop', label: '💥 808 DROP', color: 'from-purple-600/35 to-purple-500/20 border-purple-400/45 text-purple-100' },
    { id: 'airhorn', label: '📯 AIRHORN', color: 'from-amber-500/35 to-orange-500/20 border-amber-400/45 text-amber-100' },
    { id: 'riser', label: '🚀 RISER', color: 'from-cyan-500/35 to-blue-500/20 border-cyan-400/45 text-cyan-100' },
    { id: 'laser', label: '⚡ LASER', color: 'from-fuchsia-500/35 to-pink-500/20 border-fuchsia-400/45 text-fuchsia-100' },
    { id: 'brake', label: '🛑 VINYL BRAKE', color: 'from-red-600/35 to-rose-500/20 border-red-400/45 text-red-100' },
    { id: 'impact', label: '🌌 SUB BOOM', color: 'from-indigo-600/35 to-violet-500/20 border-indigo-400/45 text-indigo-100' },
    { id: 'snareroll', label: '🥁 SNARE ROLL', color: 'from-emerald-500/35 to-teal-500/20 border-emerald-400/45 text-emerald-100' },
  ];

  return (
    <div className="space-y-3 pb-24 md:pb-8">
      {/* Compact Pro Club Top Bar */}
      <div className="rounded-2xl bg-[#0e0821] border border-purple-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center shadow">
            <Disc3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2">
              LENKYX <span className="neon-text">PRO DJ CONSOLE</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-400/15 border border-cyan-400/35 text-[9px] text-cyan-300 font-mono">
                CDJ-PRO v2
              </span>
            </h1>
            <p className="text-[11px] text-purple-300/75 hidden sm:block">
              Dual Waveforms · BPM Sync · 4 Hot Cues · Auto-Loop · 3-Band EQ Kill · Echo & Filter FX · Live Recorder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10">
            <Sliders className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[10px] font-mono text-purple-200">MASTER</span>
            <input
              type="range"
              min={0}
              max={1.1}
              step={0.02}
              value={masterVol}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMasterVol(v);
                djEngine.setMasterVolume(v);
              }}
              className="dj-slider h-1.5 w-20"
            />
          </div>
          <button
            onClick={() => void handleToggleRecord()}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow transition ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-red-500/20 hover:bg-red-500/35 border border-red-400/45 text-red-200'
            }`}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-white" /> : <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500" />}
            {isRecording ? `REC ${fmtTime(recSeconds)}` : 'GRAVAR SET'}
          </button>
        </div>
      </div>

      {/* Serato / Rekordbox Dual Stacked Waveform Display (clickable to seek!) */}
      <div className="rounded-2xl bg-[#070412] border border-purple-500/35 overflow-hidden p-2 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono px-1">
          <span className="text-pink-400 font-bold truncate">
            A: {trackA?.title || 'Deck A'} {deckA.version === 'v2' ? '(V2)' : ''}
          </span>
          <span className="text-purple-300/70 hidden sm:inline">CLIQUE NA ONDA PARA PULAR NA MÚSICA</span>
          <span className="text-cyan-300 font-bold truncate">
            B: {trackB?.title || 'Deck B'} {deckB.version === 'v2' ? '(V2)' : ''}
          </span>
        </div>
        <canvas
          ref={waveCanvasRef}
          width={1100}
          height={92}
          onClick={handleWaveClick}
          className="w-full h-[84px] sm:h-[94px] rounded-xl cursor-pointer block"
        />
      </div>

      {/* MAIN 3-COLUMN CLUB CONSOLE: DECK A | PRO MIXER + VU METERS | DECK B */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-5">{renderDeck('A', deckA, trackA)}</div>

        {/* Center Mixer + Stereo LED VU Meters + Crossfader */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0e0822] border border-purple-500/30 p-3 flex flex-col justify-between gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {renderEqStrip('A', deckA)}
            {renderEqStrip('B', deckB)}
          </div>

          {/* Live 3-Channel LED VU Meters */}
          <div className="flex items-end justify-center gap-3 h-16 px-2 py-1.5 rounded-xl bg-black/65 border border-white/10">
            {[
              { label: 'A', ref: vuARef },
              { label: 'M', ref: vuMRef },
              { label: 'B', ref: vuBRef },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-1 h-full">
                <div className="w-3 flex-1 rounded-full bg-white/10 overflow-hidden flex items-end">
                  <div
                    ref={m.ref}
                    className="w-full rounded-full transition-all duration-75"
                    style={{
                      height: '0%',
                      background: 'linear-gradient(to top, #22c55e 0%, #eab308 65%, #ef4444 100%)',
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono text-purple-300">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Crossfader + Auto-Transition */}
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-[9px] font-black">
              <span className="text-pink-400">DECK A</span>
              <span className="text-purple-300">XFADER</span>
              <span className="text-cyan-300">DECK B</span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.02}
              value={crossfader}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCrossfader(v);
                djEngine.setCrossfader(v);
              }}
              className="dj-slider h-2 w-full"
            />
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => djEngine.autoCrossfade('A', (v) => setCrossfader(v))}
                className="py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/35 text-[9px] font-extrabold text-pink-200 flex items-center justify-center gap-0.5"
                title="Transição automática suave para Deck A"
              >
                <ArrowLeftRight className="w-3 h-3" /> AUTO → A
              </button>
              <button
                onClick={() => djEngine.autoCrossfade('B', (v) => setCrossfader(v))}
                className="py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/35 text-[9px] font-extrabold text-cyan-200 flex items-center justify-center gap-0.5"
                title="Transição automática suave para Deck B"
              >
                <ArrowLeftRight className="w-3 h-3" /> AUTO → B
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">{renderDeck('B', deckB, trackB)}</div>
      </div>

      {/* 8-Pad Club Performance Sampler */}
      <div className="rounded-2xl bg-[#0d071e] border border-purple-500/25 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Performance Pads — Efeitos Ao Vivo
          </span>
          <span className="text-[10px] text-purple-300/65">Toque durante o mix ou gravação</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {fxPads.map((pad) => (
            <button
              key={pad.id}
              onClick={() => djEngine.triggerFX(pad.id)}
              className={`py-2.5 px-2 rounded-xl bg-gradient-to-br ${pad.color} border text-[10px] font-extrabold tracking-wide active:scale-95 hover:brightness-125 transition shadow`}
            >
              {pad.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recorded Mix Panel */}
      {recordedBlob && recordedUrl && (
        <div className="rounded-2xl bg-emerald-950/35 border border-emerald-400/45 p-3.5 flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="flex-1 w-full space-y-1.5">
            <div className="text-xs font-extrabold text-emerald-300">
              ✅ DJ Set gravado ({fmtTime(recSeconds)}) — ouça ou baixe!
            </div>
            <audio src={recordedUrl} controls className="w-full h-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => void downloadBlobReliable(recordedBlob, `${mixTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webm`)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-cyan-300" /> Baixar Mix
            </button>
            {isCreator && (
              <>
                <input
                  type="text"
                  value={mixTitle}
                  onChange={(e) => setMixTitle(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white w-44"
                />
                <button
                  onClick={() => void handleSaveMixToCatalog()}
                  disabled={savingMix}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {savingMix ? 'Salvando...' : 'Publicar'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

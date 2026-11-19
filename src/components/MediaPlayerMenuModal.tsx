import React, { useEffect, useRef, useState } from 'react';
import {
  Bluetooth,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  BatteryCharging,
  Smartphone,
  PictureInPicture2,
  AudioWaveform,
  Repeat,
  Gauge,
  ShieldOff,
  DownloadCloud,
  Download,
  Loader2,
  CheckCircle2,
  Timer,
  Disc3,
  ListMusic,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Track } from '../types';
import { BassBoostLevel } from './MiniPlayer';
import { BluetoothConnectModal } from './GlobalVoiceCallModal';

interface Props {
  open: boolean;
  onClose: () => void;
  track: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isCurrentTrackOffline: boolean;
  isDownloadingOffline?: boolean;
  downloadPct?: number;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  bassBoostLevel: BassBoostLevel;
  playbackSpeed: number;
  loopTrack: boolean;
  backgroundMode: boolean;
  pipOpen: boolean;
  sleepMinutesLeft: number | null;
  onSelectTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onSetBassBoostLevel: (lvl: BassBoostLevel) => void;
  onCycleSpeed: () => void;
  onToggleLoop: () => void;
  onToggleBackgroundMode: () => void;
  onTogglePip: () => void;
  onSetSleepMinutes: (minutes: number | null) => void;
  onToggleOffline: (track: Track) => void;
  onDownloadFile?: (track: Track) => void;
  onEmergencyStop: () => void;
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const MediaPlayerMenuModal: React.FC<Props> = ({
  open,
  onClose,
  track,
  queue,
  isPlaying,
  isCurrentTrackOffline,
  isDownloadingOffline = false,
  downloadPct = 0,
  currentTime,
  duration,
  volume,
  muted,
  bassBoostLevel,
  playbackSpeed,
  loopTrack,
  backgroundMode,
  pipOpen,
  sleepMinutesLeft,
  onSelectTrack,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolume,
  onToggleMute,
  onSetBassBoostLevel,
  onCycleSpeed,
  onToggleLoop,
  onToggleBackgroundMode,
  onTogglePip,
  onSetSleepMinutes,
  onToggleOffline,
  onDownloadFile,
  onEmergencyStop,
}) => {
  const eqCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [btModalOpen, setBtModalOpen] = useState(false);

  useEffect(() => {
    if (!open || !eqCanvasRef.current) return;
    const canvas = eqCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    let last = 0;
    const bars = 28;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 45) return;
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      phase += isPlaying ? 0.24 : 0.03;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const boost = bassBoostLevel > 0 && i < 10 ? 1 + bassBoostLevel * 0.14 : 1;
        const amp = isPlaying
          ? (Math.sin(phase + i * 0.5) * 0.5 + 0.5) * 0.72 + (Math.cos(phase * 1.4 - i * 0.35) * 0.5 + 0.5) * 0.28
          : 0.14;
        const bh = Math.max(3, Math.min(1, amp * boost) * h);
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(0.55, '#a855f7');
        grad.addColorStop(1, '#22d3ee');
        ctx.fillStyle = grad;
        ctx.fillRect(i * bw + 1, h - bh, Math.max(2, bw - 2), bh);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open, isPlaying, bassBoostLevel]);

  if (!open) return null;

  const pct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const upcoming = queue.slice(0, 10);

  return (
    <div className="fixed inset-0 z-[92] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[94dvh] sm:rounded-3xl rounded-t-3xl bg-gradient-to-b from-[#130829] via-[#090418] to-[#05020e] border border-cyan-400/35 shadow-[0_0_80px_rgba(236,72,153,0.35)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-pink-500/15 via-purple-600/15 to-cyan-500/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/covers/icon-192.png" alt="LENKYX" className="w-9 h-9 object-contain lenkyx-logo-3d shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-1.5">
                <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
                LENKYX MEDIA PLAYER · 2º PLANO
              </div>
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                Som Contínuo com Celular Fechado
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition shrink-0"
            title="Fechar Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* HERO NOW PLAYING CARD */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/12 p-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center gap-4">
              {/* Spinning Cosmic Cover */}
              <div className="relative shrink-0">
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-1 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_32px_rgba(236,72,153,0.45)] ${
                    isPlaying ? 'animate-pulse' : ''
                  }`}
                >
                  <img
                    src={track?.coverUrl || '/covers/icon-512.png'}
                    alt={track?.title || 'LENKYX'}
                    className="w-full h-full rounded-[13px] object-cover bg-[#070312]"
                  />
                </div>
                {isPlaying && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap">
                    ● TOCANDO
                  </span>
                )}
              </div>

              {/* Track Info & Equalizer */}
              <div className="flex-1 min-w-0 w-full text-center sm:text-left space-y-2">
                <div>
                  <div className="text-base sm:text-lg font-black text-white truncate">
                    {track ? `${track.emoji || '🎵'} ${track.title}` : 'Escolha ou dê Play na sua música'}
                  </div>
                  <div className="text-xs text-cyan-200/80 font-semibold truncate">
                    {track?.artist || 'LENKYX Cosmic Phonk'} · {track?.genre || 'Universo Livre'}
                  </div>
                </div>

                <canvas ref={eqCanvasRef} width={320} height={34} className="w-full h-8 rounded-lg" />

                {/* Interactive Seek Bar */}
                <div className="space-y-1">
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
                      onSeek(ratio * (duration || 1));
                    }}
                    className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden cursor-pointer"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 transition-all duration-150"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-300">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Transport Row */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onToggleLoop}
                className={`p-2.5 rounded-xl border transition ${
                  loopTrack
                    ? 'bg-pink-500/30 border-pink-400 text-pink-100'
                    : 'bg-white/10 border-white/10 text-slate-300 hover:text-white'
                }`}
                title="Repetir música"
              >
                <Repeat className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onPrev}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  title="Anterior"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 text-white flex items-center justify-center shadow-[0_0_28px_rgba(236,72,153,0.6)] hover:scale-105 active:scale-95 transition"
                  title={isPlaying ? 'Pausar' : 'Tocar'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  title="Próxima"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={onCycleSpeed}
                className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-black text-cyan-200 flex items-center gap-1"
                title="Velocidade"
              >
                <Gauge className="w-3.5 h-3.5" /> {playbackSpeed}x
              </button>
            </div>

            {/* Volume + Offline Quick Bar */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleMute}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 shrink-0"
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={muted ? 0 : volume}
                onChange={(e) => onVolume(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 h-1.5 cursor-pointer"
              />
              {track && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isDownloadingOffline}
                    onClick={() => onToggleOffline(track)}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 shrink-0 transition ${
                      isDownloadingOffline
                        ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100'
                        : isCurrentTrackOffline
                          ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200'
                          : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                    }`}
                  >
                    {isDownloadingOffline ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                    ) : isCurrentTrackOffline ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <DownloadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isDownloadingOffline
                        ? `${downloadPct > 0 ? `${downloadPct}%` : 'Baixando...'}`
                        : isCurrentTrackOffline
                          ? 'Salva'
                          : 'Offline'}
                    </span>
                  </button>
                  {onDownloadFile && (
                    <button
                      type="button"
                      onClick={() => onDownloadFile(track)}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-100 text-[11px] font-black flex items-center gap-1 shrink-0 transition"
                      title="Baixar arquivo MP3 no aparelho"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setBtModalOpen(true)}
                    className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/35 border border-blue-400/40 text-blue-200 shrink-0 transition"
                    title="Bluetooth"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CELULAR FECHADO / TELA BLOQUEADA BACKGROUND PANEL */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-purple-500/15 border border-emerald-400/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  2º Plano · Celular Fechado
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${backgroundMode ? 'bg-emerald-400 text-black' : 'bg-white/15 text-slate-300'}`}>
                    {backgroundMode ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleBackgroundMode}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 ${
                  backgroundMode
                    ? 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.45)]'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                <BatteryCharging className="w-4 h-4" />
                {backgroundMode ? '2º Plano ON' : 'Ativar'}
              </button>
            </div>

            {/* Extra Mobile Actions: Floating PiP + Sleep Timer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onTogglePip}
                className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition ${
                  pipOpen
                    ? 'bg-cyan-400/25 border-cyan-300 text-cyan-100'
                    : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                }`}
              >
                <PictureInPicture2 className="w-4 h-4 text-cyan-300" />
                {pipOpen ? 'Player Flutuante Ativo' : 'Abrir Mini-Player Flutuante'}
              </button>

              <div className="rounded-xl bg-white/[0.06] border border-white/12 px-2.5 py-1.5 flex items-center justify-between gap-1.5">
                <span className="text-[11px] font-bold text-purple-200 flex items-center gap-1 shrink-0">
                  <Timer className="w-3.5 h-3.5 text-pink-300" />
                  {sleepMinutesLeft ? `${sleepMinutesLeft}m` : 'Dormir'}
                </span>
                <div className="flex items-center gap-1">
                  {[null, 15, 30, 60].map((m) => (
                    <button
                      key={String(m)}
                      type="button"
                      onClick={() => onSetSleepMinutes(m)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition ${
                        (m === null && sleepMinutesLeft === null) ||
                        (m !== null && sleepMinutesLeft !== null && Math.abs(sleepMinutesLeft - m) <= 1)
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {m === null ? 'Off' : `${m}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4-STAGE COSMIC BASS BOOST */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/12 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-pink-300">
              <span className="flex items-center gap-1.5">
                <AudioWaveform className="w-3.5 h-3.5" /> Graves & Subwoofer Cósmico
              </span>
              <span className="text-cyan-300">
                {bassBoostLevel === 3 ? 'Subwoofer +14dB' : bassBoostLevel === 2 ? 'Pesado +9dB' : bassBoostLevel === 1 ? 'Suave +4dB' : 'Normal'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { lvl: 0 as BassBoostLevel, label: 'Normal', sub: '0 dB' },
                  { lvl: 1 as BassBoostLevel, label: 'Suave', sub: '+4 dB' },
                  { lvl: 2 as BassBoostLevel, label: 'Pesado', sub: '+9 dB' },
                  { lvl: 3 as BassBoostLevel, label: 'Subwoofer', sub: '+14 dB' },
                ]
              ).map((preset) => (
                <button
                  key={preset.lvl}
                  type="button"
                  onClick={() => onSetBassBoostLevel(preset.lvl)}
                  className={`py-2 px-1.5 rounded-xl border text-center transition ${
                    bassBoostLevel === preset.lvl
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-pink-300 text-white shadow-[0_0_16px_rgba(236,72,153,0.45)]'
                      : 'bg-white/[0.06] hover:bg-white/15 border-white/10 text-slate-200'
                  }`}
                >
                  <div className="text-[11px] font-black">{preset.label}</div>
                  <div className="text-[9px] opacity-75 font-mono">{preset.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* UPCOMING QUEUE */}
          {upcoming.length > 0 && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5 text-cyan-300" /> Fila de Reprodução ({upcoming.length})
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {upcoming.map((item) => {
                  const active = track?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTrack(item)}
                      className={`w-full p-2 rounded-xl flex items-center gap-2.5 text-left transition border ${
                        active
                          ? 'bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border-cyan-400/50'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-transparent'
                      }`}
                    >
                      <img
                        src={item.coverUrl || '/covers/icon-192.png'}
                        alt={item.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {item.emoji} {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{item.artist}</div>
                      </div>
                      {active ? (
                        <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 animate-pulse" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <BluetoothConnectModal
        open={btModalOpen}
        onClose={() => setBtModalOpen(false)}
        onToast={() => {}}
      />
    </div>
  );
};

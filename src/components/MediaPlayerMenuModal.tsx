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
  DownloadCloud,
  Download,
  Loader2,
  CheckCircle2,
  Timer,
  Disc3,
  ListMusic,
  Sparkles,
  Flame,
  Sliders,
  Headphones,
  Mic,
  Moon,
  Zap,
  Trash2,
  Camera,
} from 'lucide-react';
import { Track } from '../types';
import { BassBoostLevel } from './MiniPlayer';
import { BluetoothConnectModal } from './GlobalVoiceCallModal';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';

export type AudioEffectId = 'normal' | 'baile3d' | 'studio' | 'grave_pancadao' | 'noite_chill';

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
  audioEffect: AudioEffectId;
  loudMode: boolean;
  playbackSpeed: number;
  loopTrack: boolean;
  backgroundMode: boolean;
  pipOpen: boolean;
  sleepMinutesLeft: number | null;
  onSelectTrack: (track: Track) => void;
  onRemoveFromQueue?: (trackId: string) => void;
  onClearQueue?: () => void;
  onUpdateTrackCover?: (trackId: string, coverUrl: string) => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onSetBassBoostLevel: (lvl: BassBoostLevel) => void;
  onSetAudioEffect: (eff: AudioEffectId) => void;
  onToggleLoudMode: () => void;
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

const EFFECT_PRESETS: {
  id: AudioEffectId;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  { id: 'normal', label: 'Normal', desc: 'Som Puro', icon: <Sliders className="w-3.5 h-3.5" /> },
  { id: 'baile3d', label: '3D Baile', desc: 'Espacial + Eco', icon: <Headphones className="w-3.5 h-3.5" /> },
  { id: 'studio', label: 'Estúdio HD', desc: 'Voz Nítida', icon: <Mic className="w-3.5 h-3.5" /> },
  { id: 'grave_pancadao', label: 'Pancadão', desc: 'Grave + Pressão', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'noite_chill', label: 'Noite VIP', desc: 'Suave & Limpo', icon: <Moon className="w-3.5 h-3.5" /> },
];

type MenuTab = 'player' | 'effects' | 'queue';

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
  audioEffect,
  loudMode,
  playbackSpeed,
  loopTrack,
  backgroundMode,
  pipOpen,
  sleepMinutesLeft,
  onSelectTrack,
  onRemoveFromQueue,
  onClearQueue,
  onUpdateTrackCover,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolume,
  onToggleMute,
  onSetBassBoostLevel,
  onSetAudioEffect,
  onToggleLoudMode,
  onCycleSpeed,
  onToggleLoop,
  onToggleBackgroundMode,
  onTogglePip,
  onSetSleepMinutes,
  onToggleOffline,
  onDownloadFile,
}) => {
  const eqCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [btModalOpen, setBtModalOpen] = useState(false);
  const [tab, setTab] = useState<MenuTab>('player');

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
      if (now - last < 42) return;
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      phase += isPlaying ? (loudMode ? 0.3 : 0.22) : 0.03;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const boost =
          (bassBoostLevel > 0 && i < 10 ? 1 + bassBoostLevel * 0.14 : 1) *
          (loudMode ? 1.18 : 1) *
          (audioEffect === 'baile3d' ? 1.08 : 1);
        const amp = isPlaying
          ? (Math.sin(phase + i * 0.45) * 0.5 + 0.5) * 0.72 + (Math.cos(phase * 1.4 - i * 0.32) * 0.5 + 0.5) * 0.28
          : 0.14;
        const bh = Math.max(3, Math.min(1, amp * boost) * h);
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#d4af37');
        grad.addColorStop(0.55, '#f5c84c');
        grad.addColorStop(1, '#22d3ee');
        ctx.fillStyle = grad;
        ctx.fillRect(i * bw + 1, h - bh, Math.max(2, bw - 2), bh);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open, isPlaying, bassBoostLevel, loudMode, audioEffect]);

  if (!open) return null;

  const pct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const upcoming = queue.slice(0, 30);

  const handlePickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !track || !onUpdateTrackCover) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateTrackCover(track.id, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[92] bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl max-h-[92dvh] sm:rounded-3xl rounded-t-3xl bg-gradient-to-b from-[#0e101c] via-[#070810] to-[#04050a] border border-amber-400/35 shadow-[0_24px_90px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden">
        {/* CLEAN MORRO GOLD HEADER */}
        <div className="px-4 py-3 border-b border-amber-400/20 bg-black/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <LenkyxEdgeLogo size="xs" className="shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-1.5">
                <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
                MORRO GOLD PLAYER
              </div>
              <h2 className="text-sm font-black text-white truncate">
                {track ? track.title : 'Player & Efeitos'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-500/80 text-white text-xs font-black flex items-center gap-1 shrink-0 transition"
            title="Fechar Menu"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>

        {/* SIMPLE 3-TAB BAR */}
        <div className="px-4 pt-3 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setTab('player')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
              tab === 'player'
                ? 'lux-btn-gold'
                : 'bg-white/[0.06] hover:bg-white/12 text-slate-200'
            }`}
          >
            🎧 Player
          </button>
          <button
            type="button"
            onClick={() => setTab('effects')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
              tab === 'effects'
                ? 'lux-btn-gold'
                : 'bg-white/[0.06] hover:bg-white/12 text-slate-200'
            }`}
          >
            🎛️ Efeitos
          </button>
          <button
            type="button"
            onClick={() => setTab('queue')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
              tab === 'queue'
                ? 'lux-btn-gold'
                : 'bg-white/[0.06] hover:bg-white/12 text-slate-200'
            }`}
          >
            📋 Fila ({upcoming.length})
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'player' && (
            <>
              {/* NOW PLAYING SIMPLE CARD */}
              <div className="rounded-3xl bg-white/[0.04] border border-amber-400/20 p-4 space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={track?.coverUrl || '/covers/morro-gold-emblema-grosso.png?v=74'}
                      alt={track?.title || 'Player'}
                      className="w-20 h-20 rounded-2xl object-cover bg-[#070810] border border-amber-400/40"
                    />
                    {track && onUpdateTrackCover && (
                      <>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePickPhoto}
                        />
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="mt-1 w-full py-1 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-black text-[10px] font-black text-amber-200 flex items-center justify-center gap-1 transition"
                          title="Colocar sua foto como capa"
                        >
                          <Camera className="w-3 h-3" /> Foto
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-base font-black text-white truncate">
                      {track ? track.title : 'Escolha uma música'}
                    </div>
                    <div className="text-xs text-amber-200/85 font-semibold truncate">
                      {track?.artist || 'MORRO GOLD'}
                    </div>
                    <canvas ref={eqCanvasRef} width={280} height={28} className="w-full h-7 rounded-lg" />
                  </div>
                </div>

                {/* Progress */}
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
                      className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 transition-all duration-150"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-300">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </div>

                {/* Primary Controls */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onToggleLoop}
                    className={`p-2.5 rounded-full border transition ${
                      loopTrack ? 'lux-btn-gold' : 'lux-btn-obsidian text-slate-300'
                    }`}
                    title="Repetir"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={onPrev} className="p-3 rounded-full lux-btn-obsidian text-white">
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={onTogglePlay}
                      className="w-14 h-14 rounded-full lux-btn-gold flex items-center justify-center shadow-[0_0_25px_rgba(245,200,76,0.5)] hover:scale-105 active:scale-95 transition"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-black text-black" />
                      ) : (
                        <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                      )}
                    </button>
                    <button type="button" onClick={onNext} className="p-3 rounded-full lux-btn-obsidian text-white">
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onCycleSpeed}
                    className="px-3 py-2 rounded-full lux-btn-obsidian text-[11px] font-black text-amber-200 flex items-center gap-1"
                  >
                    <Gauge className="w-3.5 h-3.5" /> {playbackSpeed}x
                  </button>
                </div>

                {/* Volume + Som Alto */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
                  <button type="button" onClick={onToggleMute} className="p-1.5 rounded-full lux-btn-obsidian text-slate-200 shrink-0">
                    {muted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-300" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-300" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={muted ? 0 : volume}
                    onChange={(e) => onVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-400 h-1.5 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={onToggleLoudMode}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1 shrink-0 transition ${
                      loudMode
                        ? 'bg-gradient-to-r from-orange-400 to-amber-300 text-black'
                        : 'lux-btn-obsidian text-amber-200'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{loudMode ? 'Som Alto ON' : 'Som Alto'}</span>
                  </button>
                </div>
              </div>

              {/* QUICK CLEAN TOOLS */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onToggleBackgroundMode}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    backgroundMode
                      ? 'bg-emerald-400 text-black border-emerald-300'
                      : 'lux-btn-obsidian text-white'
                  }`}
                >
                  <BatteryCharging className="w-4 h-4" />
                  <span>{backgroundMode ? 'Tela Bloqueada ON' : 'Ativar 2º Plano'}</span>
                </button>

                <button
                  type="button"
                  onClick={onTogglePip}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    pipOpen ? 'bg-cyan-400 text-black border-cyan-300' : 'lux-btn-obsidian text-white'
                  }`}
                >
                  <PictureInPicture2 className="w-4 h-4" />
                  <span>{pipOpen ? 'Flutuante Ativo' : 'Minimizar Flutuante'}</span>
                </button>

                {track && (
                  <button
                    type="button"
                    disabled={isDownloadingOffline}
                    onClick={() => onToggleOffline(track)}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      isCurrentTrackOffline ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200' : 'lux-btn-obsidian text-white'
                    }`}
                  >
                    {isDownloadingOffline ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentTrackOffline ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <DownloadCloud className="w-4 h-4" />
                    )}
                    <span>{isDownloadingOffline ? `${downloadPct}%` : isCurrentTrackOffline ? 'Salva Offline' : 'Salvar Offline'}</span>
                  </button>
                )}

                {track && onDownloadFile && (
                  <button
                    type="button"
                    onClick={() => onDownloadFile(track)}
                    className="py-2.5 px-3 rounded-2xl lux-btn-obsidian text-cyan-200 text-xs font-black flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar MP3</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setBtModalOpen(true)}
                  className="py-2.5 px-3 rounded-2xl lux-btn-obsidian text-blue-200 text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>Bluetooth</span>
                </button>

                <div className="rounded-2xl bg-white/[0.05] border border-white/12 px-3 py-2 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1 shrink-0">
                    <Timer className="w-3.5 h-3.5" />
                    {sleepMinutesLeft ? `${sleepMinutesLeft}m` : 'Dormir'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[null, 15, 30, 60].map((m) => (
                      <button
                        key={String(m)}
                        type="button"
                        onClick={() => onSetSleepMinutes(m)}
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-black transition ${
                          (m === null && sleepMinutesLeft === null) ||
                          (m !== null && sleepMinutesLeft !== null && Math.abs(sleepMinutesLeft - m) <= 1)
                            ? 'bg-amber-400 text-black'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {m === null ? 'Off' : `${m}m`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'effects' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white/[0.03] border border-amber-400/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Efeitos ao Vivo
                  </span>
                  <span className="text-cyan-300">
                    {EFFECT_PRESETS.find((e) => e.id === audioEffect)?.label || 'Normal'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EFFECT_PRESETS.map((ef) => {
                    const active = audioEffect === ef.id;
                    return (
                      <button
                        key={ef.id}
                        type="button"
                        onClick={() => onSetAudioEffect(ef.id)}
                        className={`py-2.5 px-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-0.5 ${
                          active ? 'lux-btn-gold' : 'lux-btn-obsidian text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1 text-xs font-black">
                          {ef.icon}
                          <span>{ef.label}</span>
                        </span>
                        <span className={`text-[10px] ${active ? 'text-black/80 font-bold' : 'text-slate-400'}`}>
                          {ef.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl bg-white/[0.03] border border-white/12 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <AudioWaveform className="w-3.5 h-3.5" /> Graves & Subwoofer
                  </span>
                  <span className="text-amber-300">
                    {bassBoostLevel === 3 ? '+14 dB' : bassBoostLevel === 2 ? '+9 dB' : bassBoostLevel === 1 ? '+4 dB' : 'Normal'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { lvl: 0 as BassBoostLevel, label: 'Normal', sub: '0 dB' },
                    { lvl: 1 as BassBoostLevel, label: 'Suave', sub: '+4 dB' },
                    { lvl: 2 as BassBoostLevel, label: 'Pesado', sub: '+9 dB' },
                    { lvl: 3 as BassBoostLevel, label: 'Subwoofer', sub: '+14 dB' },
                  ].map((preset) => (
                    <button
                      key={preset.lvl}
                      type="button"
                      onClick={() => onSetBassBoostLevel(preset.lvl)}
                      className={`py-2.5 px-1.5 rounded-2xl border text-center transition ${
                        bassBoostLevel === preset.lvl ? 'lux-btn-gold' : 'lux-btn-obsidian text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-black">{preset.label}</div>
                      <div className="text-[9px] opacity-75 font-mono">{preset.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-100">
                  <Smartphone className="w-4 h-4 text-emerald-300" />
                  <span>Som Alto sem distorcer</span>
                </div>
                <button
                  type="button"
                  onClick={onToggleLoudMode}
                  className={`px-3 py-1.5 rounded-full text-xs font-black ${
                    loudMode ? 'bg-amber-400 text-black' : 'bg-white/10 text-white'
                  }`}
                >
                  {loudMode ? 'Ativado' : 'Ativar'}
                </button>
              </div>
            </div>
          )}

          {tab === 'queue' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                  <ListMusic className="w-4 h-4 text-cyan-300" /> Fila Atual ({upcoming.length})
                </div>
                {onClearQueue && upcoming.length > 1 && (
                  <button
                    type="button"
                    onClick={onClearQueue}
                    className="px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/35 text-[11px] font-black text-rose-200 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar Outras
                  </button>
                )}
              </div>

              {upcoming.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Nenhuma outra música na fila no momento.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                  {upcoming.map((item) => {
                    const active = track?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-2 rounded-2xl flex items-center gap-2.5 transition border ${
                          active
                            ? 'bg-gradient-to-r from-amber-500/20 to-cyan-500/15 border-amber-400/50'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] border-transparent'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectTrack(item)}
                          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                        >
                          <img
                            src={item.coverUrl || '/covers/morro-gold-emblema-grosso.png?v=74'}
                            alt={item.title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">{item.title}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.artist}</div>
                          </div>
                        </button>
                        {onRemoveFromQueue && !active && (
                          <button
                            type="button"
                            onClick={() => onRemoveFromQueue(item.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/35 text-slate-300 hover:text-white transition shrink-0"
                            title="Remover da fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  MessageCircle,
  FileText,
  Heart,
  ChevronUp,
  ChevronDown,
  DownloadCloud,
  CheckCircle2,
  Loader2,
  WifiOff,
  Film,
  X,
  AudioWaveform,
  Repeat,
  BatteryCharging,
  Disc3,
  Maximize2,
  Minimize2,
  ArrowLeft,
} from 'lucide-react';
import { AudioVersion, Track } from '../types';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';

export type BassBoostLevel = 0 | 1 | 2 | 3;

interface Props {
  track: Track | null;
  activeVersion: AudioVersion;
  isPlaying: boolean;
  isPlayingFromOffline: boolean;
  isCurrentTrackOffline: boolean;
  isDownloadingOffline: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  bassBoostLevel?: BassBoostLevel;
  playbackSpeed?: number;
  loopTrack?: boolean;
  backgroundMode?: boolean;
  onToggleBackgroundMode?: () => void;
  onEmergencyStop?: () => void;
  onCycleBassBoost?: () => void;
  onSetBassBoostLevel?: (level: BassBoostLevel) => void;
  onCycleSpeed?: () => void;
  onToggleLoop?: () => void;
  onOpenPix?: () => void;
  onTogglePlay: () => void;
  onSelectVersion: (ver: AudioVersion) => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onShare: (track: Track) => void;
  onOpenLyrics: (track: Track) => void;
  onLike: (track: Track) => void;
  onToggleOffline: (track: Track) => void;
  onWatchClip?: () => void;
  onOpenMediaMenu?: () => void;
  onOpenVisualizer?: () => void;
  onCommentTrack?: (track: Track) => void;
  onOpenLiveChat?: () => void;
  onCloseMenu?: () => void;
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Arrasta a janela flutuante minimizada para qualquer lugar da tela. */
function useFloatingDrag() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const offset = useRef<{ dx: number; dy: number; w: number; h: number } | null>(null);
  const onPointerDown = (e: any) => {
    if ((e.target as HTMLElement).closest('button, input, a, select, textarea, video, iframe')) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    offset.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height };
    setPos({ x: r.left, y: r.top });
    try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
  };
  const onPointerMove = (e: any) => {
    const o = offset.current;
    if (!o) return;
    const x = Math.min(Math.max(4, e.clientX - o.dx), Math.max(4, window.innerWidth - o.w - 4));
    const y = Math.min(Math.max(4, e.clientY - o.dy), Math.max(4, window.innerHeight - o.h - 4));
    setPos({ x, y });
  };
  const onPointerUp = (e: any) => {
    if (!offset.current) return;
    offset.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ }
  };
  const style = pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto', touchAction: 'none' as const } : {};
  return { style, dragHandlers: { onPointerDown, onPointerMove, onPointerUp } };
}

export const MiniPlayer: React.FC<Props> = ({
  track,
  isPlaying,
  isPlayingFromOffline,
  isCurrentTrackOffline,
  isDownloadingOffline,
  currentTime,
  duration,
  volume,
  muted,
  bassBoostLevel = 0,
  playbackSpeed = 1,
  loopTrack = false,
  backgroundMode = true,
  onToggleBackgroundMode,
  onEmergencyStop,
  onCycleBassBoost,
  onCycleSpeed,
  onToggleLoop,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolume,
  onToggleMute,
  onShare,
  onOpenLyrics,
  onLike,
  onToggleOffline,
  onWatchClip,
  onOpenMediaMenu,
  onOpenVisualizer,
  onCommentTrack,
  onOpenLiveChat,
  onCloseMenu,
}) => {
  const [expanded, setExpanded] = useState(false);
  const pillDrag = useFloatingDrag();
  const [minimizedPill, setMinimizedPill] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bigCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const drawBars = (canvas: HTMLCanvasElement | null, barCount: number) => {
      if (!canvas) return () => {};
      const ctx = canvas.getContext('2d');
      if (!ctx) return () => {};
      let raf = 0;
      let phase = 0;
      let lastTick = 0;
      const draw = (now: number) => {
        raf = requestAnimationFrame(draw);
        if (now - lastTick < 50) return;
        lastTick = now;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const gap = 3;
        const bw = (w - gap * (barCount - 1)) / barCount;
        for (let i = 0; i < barCount; i++) {
          const base = isPlaying
            ? 0.35 + 0.6 * Math.abs(Math.sin(phase + i * 0.42)) * Math.abs(Math.cos(phase * 0.55 + i * 0.23))
            : 0.14;
          const bh = Math.max(3, base * h);
          const x = i * (bw + gap);
          const y = h - bh;
          const grad = ctx.createLinearGradient(0, h, 0, 0);
          grad.addColorStop(0, '#ec4899');
          grad.addColorStop(0.55, '#a855f7');
          grad.addColorStop(1, '#38bdf8');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, bw, bh);
        }
        phase += isPlaying ? 0.16 : 0.03;
      };
      raf = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(raf);
    };

    const stopMini = drawBars(canvasRef.current, 10);
    const stopBig = expanded ? drawBars(bigCanvasRef.current, 28) : () => {};
    return () => {
      stopMini();
      stopBig();
    };
  }, [isPlaying, expanded]);

  if (!track) return null;

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bassLabel =
    bassBoostLevel === 3 ? 'Subwoofer' : bassBoostLevel === 2 ? 'Pesado' : bassBoostLevel === 1 ? 'Suave' : 'Graves';

  return (
    <>
      {/* CLEAN ILLUMINATED SPOTIFY × YOUTUBE MUSIC EXPANDED PLAYER */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#20134c]/98 via-[#120b2e]/98 to-[#0a061c]/99 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-xl w-full mx-auto flex flex-col justify-between flex-1 gap-5">
            {/* Simple Top Header: Minimizar, Ampliar/Fechar */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  setMinimizedPill(true);
                }}
                className="mg24k-btn"
                title="Minimizar para janela flutuante"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Minimizar</span>
              </button>

              <div className="flex items-center gap-2 min-w-0 justify-center">
                <LenkyxEdgeLogo size="xs" className="shrink-0" />
                <div className="text-center min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-widest text-amber-300 truncate">
                    {track.album || 'MORRO GOLD'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onOpenMediaMenu && (
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(false);
                      onOpenMediaMenu();
                    }}
                    className="mg24k-btn !w-9 !h-9 !min-w-[36px] !p-0 rounded-full"
                    title="Efeitos, Som Alto & 2º Plano"
                  >
                    <Disc3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    if (onEmergencyStop) onEmergencyStop();
                    else if (onCloseMenu) onCloseMenu();
                  }}
                  className="mg24k-btn mg24k-btn-gold"
                  title="Voltar (o som continua tocando)"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              </div>
            </div>

            {/* Artwork + Spectrum */}
            <div className="flex flex-col items-center gap-5 my-auto">
              <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border border-white/25 shadow-[0_24px_80px_rgba(56,189,248,0.28)]">
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                {isPlayingFromOffline && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> OFFLINE
                  </span>
                )}
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg sm:text-2xl font-black text-white truncate">
                      {track.emoji} {track.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-cyan-200/85 truncate">{track.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLike(track)}
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 transition"
                    title="Curtir"
                  >
                    <Heart
                      className={`w-5 h-5 ${track.favorite ? 'fill-pink-500 text-pink-500' : 'text-white'}`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenVisualizer}
                  className="w-full p-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 transition cursor-pointer"
                  title="Abrir Efeitos Visuais do Som (Vento, Água, Fogo, Terra)"
                >
                  <canvas ref={bigCanvasRef} width={360} height={28} className="w-full opacity-95 rounded-lg" />
                </button>

                {/* Interactive Seek Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="dj-slider h-1.5 w-full"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-purple-200/80">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </div>

                {/* Main Transport Controls */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onToggleLoop}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${
                      loopTrack
                        ? 'bg-cyan-400 text-black border-cyan-300'
                        : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                    }`}
                    title="Repetir"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={onPrev}
                      className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={onTogglePlay}
                      className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_36px_rgba(255,255,255,0.45)] hover:scale-105 active:scale-95 transition"
                    >
                      {isPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-0.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={onNext}
                      className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onCycleSpeed}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-black text-cyan-200 flex items-center justify-center transition"
                    title="Velocidade"
                  >
                    {playbackSpeed}x
                  </button>
                </div>
              </div>
            </div>

            {/* Clean 4-Button Utility Bar (Every Button Works!) */}
            <div className="grid grid-cols-4 gap-2 pb-1 mg24k-taskbar rounded-2xl px-2 py-2">
              {onCycleBassBoost && (
                <button
                  type="button"
                  onClick={onCycleBassBoost}
                  className={`py-2.5 px-2 rounded-2xl text-[11px] font-black flex flex-col items-center justify-center gap-1 border transition ${
                    bassBoostLevel > 0
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-pink-300 text-white'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                  }`}
                >
                  <AudioWaveform className="w-4 h-4" />
                  <span>{bassLabel}</span>
                </button>
              )}

              {track.youtubeVideoId && onWatchClip && (
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    onWatchClip();
                  }}
                  className="py-2.5 px-2 rounded-2xl bg-rose-500/30 hover:bg-rose-500/45 border border-rose-400/50 text-[11px] font-black text-white flex flex-col items-center justify-center gap-1 transition"
                >
                  <Film className="w-4 h-4" />
                  <span>Vídeo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onToggleOffline(track)}
                disabled={isDownloadingOffline}
                className={`py-2.5 px-2 rounded-2xl text-[11px] font-black flex flex-col items-center justify-center gap-1 border transition ${
                  isDownloadingOffline
                    ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100'
                    : isCurrentTrackOffline
                      ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                }`}
              >
                {isDownloadingOffline ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                ) : isCurrentTrackOffline ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <DownloadCloud className="w-4 h-4" />
                )}
                <span>{isDownloadingOffline ? 'Baixando...' : isCurrentTrackOffline ? 'Offline' : 'Baixar'}</span>
              </button>

              {onToggleBackgroundMode ? (
                <button
                  type="button"
                  onClick={onToggleBackgroundMode}
                  className={`py-2.5 px-2 rounded-2xl text-[11px] font-black flex flex-col items-center justify-center gap-1 border transition ${
                    backgroundMode
                      ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200'
                  }`}
                >
                  <BatteryCharging className="w-4 h-4" />
                  <span>2º Plano</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    onOpenLyrics(track);
                  }}
                  className="py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-black text-white flex flex-col items-center justify-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  <span>Letra</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onShare(track)}
                className="py-2.5 px-2 rounded-2xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/45 text-[11px] font-black text-cyan-100 flex flex-col items-center justify-center gap-1 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar</span>
              </button>

              {onCommentTrack && (
                <button
                  type="button"
                  onClick={() => onCommentTrack(track)}
                  className="py-2.5 px-2 rounded-2xl bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/45 text-[11px] font-black text-amber-100 flex flex-col items-center justify-center gap-1 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Comentar</span>
                </button>
              )}

              {onOpenLiveChat && (
                <button
                  type="button"
                  onClick={onOpenLiveChat}
                  className="py-2.5 px-2 rounded-2xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/50 text-[11px] font-black text-rose-100 flex flex-col items-center justify-center gap-1 transition"
                >
                  <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                  <span>Chat Live</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MINIMIZED FLOATING AUDIO PILL (Continues playing across the entire platform) */}
      {minimizedPill && !expanded && (
        <div
          {...pillDrag.dragHandlers}
          style={pillDrag.style}
          className="fixed bottom-16 md:bottom-4 right-3 z-40 flex items-center gap-2 rounded-full bg-[#161030]/95 backdrop-blur-2xl border border-amber-400/50 pl-1.5 pr-2 py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.75)] max-w-[290px] cursor-move select-none"
        >
          <button
            type="button"
            onClick={() => setMinimizedPill(false)}
            className="flex items-center gap-2 min-w-0 text-left"
            title="Restaurar barra"
          >
            <img
              src={track.coverUrl}
              alt={track.title}
              className={`w-9 h-9 rounded-full object-cover border border-amber-300/60 shrink-0 ${
                isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
              }`}
            />
            <div className="min-w-0">
              <div className="text-[11px] font-black text-white truncate max-w-[115px]">{track.title}</div>
              <div className="text-[9px] text-amber-200 truncate max-w-[115px]">{track.artist}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 transition"
            title={isPlaying ? 'Pausar' : 'Tocar'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setMinimizedPill(false);
              setExpanded(true);
            }}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-cyan-400/30 text-cyan-200 flex items-center justify-center shrink-0 transition"
            title="Aumentar Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setMinimizedPill(false);
              if (onEmergencyStop) onEmergencyStop();
              else if (onCloseMenu) onCloseMenu();
            }}
            className="w-8 h-8 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white flex items-center justify-center shrink-0 transition"
            title="Fechar Áudio"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CLEAN ILLUMINATED COMPACT BOTTOM PLAYER BAR */}
      {!minimizedPill && (
      <div className="fixed bottom-14 md:bottom-0 left-0 md:left-60 lg:left-64 right-0 z-40 bg-[#140e2d]/95 backdrop-blur-2xl border-t border-white/15 shadow-[0_-10px_35px_rgba(0,0,0,0.65)]">
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
            onSeek(ratio * (duration || 1));
          }}
          className="h-1.5 w-full bg-white/15 cursor-pointer"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 transition-all duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="px-2.5 sm:px-5 py-2 flex items-center justify-between gap-2 h-14">
          <div
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 md:flex-none md:w-64 cursor-pointer"
          >
            <div className="relative shrink-0">
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-10 h-10 rounded-xl object-cover border border-white/25"
              />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                <ChevronUp className="w-3 h-3" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-white truncate">
                {track.emoji} {track.title}
              </div>
              <div className="text-[11px] text-cyan-200/80 truncate">
                {track.artist} · {fmt(currentTime)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button onClick={onPrev} className="p-1.5 text-white/85 hover:text-white transition">
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
            </button>
            <button onClick={onNext} className="p-1.5 text-white/85 hover:text-white transition">
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 justify-end shrink-0">
            {onCommentTrack && (
              <button
                type="button"
                onClick={() => onCommentTrack(track)}
                className="p-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/30 border border-amber-400/35 text-amber-200 transition"
                title="Comentários nesta música"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenVisualizer}
              className="hidden sm:flex px-2 py-1.5 rounded-xl bg-white/10 hover:bg-cyan-500/25 border border-white/15 hover:border-cyan-400/50 transition cursor-pointer items-center"
              title="Abrir Efeitos Visuais do Som (Fogo, Água, Vento, Terra)"
            >
              <canvas ref={canvasRef} width={34} height={18} className="rounded opacity-95" />
            </button>
            {onOpenMediaMenu && (
              <button
                onClick={onOpenMediaMenu}
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-black text-cyan-200 flex items-center gap-1 transition"
                title="Efeitos, Som Alto & 2º Plano"
              >
                <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Efeitos</span>
              </button>
            )}
            <div className="hidden lg:flex items-center gap-1 w-24">
              <button onClick={onToggleMute} className="p-1 text-white/85 hover:text-cyan-300 shrink-0">
                {muted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={muted ? 0 : volume}
                onChange={(e) => onVolume(Number(e.target.value))}
                className="dj-slider h-1 w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setMinimizedPill(true)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
              title="Minimizar para o canto"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="p-1.5 rounded-full bg-cyan-500/25 hover:bg-cyan-400/40 text-cyan-200 transition"
              title="Aumentar Player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onEmergencyStop) onEmergencyStop();
                else if (onCloseMenu) onCloseMenu();
              }}
              className="p-1.5 rounded-full bg-rose-500/75 hover:bg-rose-500 text-white transition"
              title="Fechar Áudio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

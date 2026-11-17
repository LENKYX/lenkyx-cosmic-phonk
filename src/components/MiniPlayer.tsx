import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  MessageCircle,
  Disc3,
  FileText,
  Heart,
  ChevronUp,
  ChevronDown,
  DownloadCloud,
  CheckCircle2,
  Loader2,
  WifiOff,
  Film,
} from 'lucide-react';
import { AudioVersion, Track } from '../types';

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
  onTogglePlay: () => void;
  onSelectVersion: (ver: AudioVersion) => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolume: (v: number) => void;
  onShare: (track: Track) => void;
  onSendToDJ: (track: Track) => void;
  onOpenLyrics: (track: Track) => void;
  onLike: (track: Track) => void;
  onToggleOffline: (track: Track) => void;
  onWatchClip?: () => void;
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
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
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolume,
  onShare,
  onSendToDJ,
  onOpenLyrics,
  onLike,
  onToggleOffline,
  onWatchClip,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const drawLoop = (canvas: HTMLCanvasElement | null, bars: number) => {
      if (!canvas) return () => {};
      const ctx = canvas.getContext('2d');
      if (!ctx) return () => {};
      let raf = 0;
      let phase = 0;
      const draw = () => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const bw = w / bars;
        phase += isPlaying ? 0.16 : 0.02;
        for (let i = 0; i < bars; i++) {
          const amp = isPlaying
            ? (Math.sin(phase + i * 0.52) * 0.5 + 0.5) * 0.72 + (Math.cos(phase * 1.5 - i * 0.35) * 0.5 + 0.5) * 0.28
            : 0.14;
          const bh = Math.max(2, amp * h);
          const grad = ctx.createLinearGradient(0, h, 0, 0);
          grad.addColorStop(0, '#ec4899');
          grad.addColorStop(0.55, '#a855f7');
          grad.addColorStop(1, '#38bdf8');
          ctx.fillStyle = grad;
          ctx.fillRect(i * bw + 1, h - bh, Math.max(2, bw - 2), bh);
        }
        raf = requestAnimationFrame(draw);
      };
      draw();
      return () => cancelAnimationFrame(raf);
    };

    const stopMini = drawLoop(canvasRef.current, 20);
    const stopBig = expanded ? drawLoop(bigCanvasRef.current, 36) : () => {};
    return () => {
      stopMini();
      stopBig();
    };
  }, [isPlaying, expanded]);

  if (!track) return null;

  return (
    <>
      {/* FULL-SCREEN 3D FLOATING NOW-PLAYING MODAL */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-[#04010c]/95 backdrop-blur-2xl flex flex-col justify-between p-5 sm:p-8 overflow-y-auto">
          <div
            className="absolute inset-0 opacity-25 pointer-events-none blur-3xl scale-110"
            style={{
              backgroundImage: `url(${track.coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 max-w-md w-full mx-auto flex flex-col justify-between min-h-full gap-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Minimizar"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-300">
                  TOCANDO NO ESPAÇO
                </div>
                <div className="text-xs font-bold text-purple-200/80 truncate max-w-[200px]">{track.album}</div>
              </div>
              <button
                onClick={() => onShare(track)}
                className="p-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300"
                title="Compartilhar"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Floating 3D Cover + Equalizer */}
            <div className="flex flex-col items-center gap-4 my-auto">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 cosmic-float-slow">
                <div
                  className="absolute -inset-4 rounded-full border border-cyan-400/25 pointer-events-none"
                  style={{ transform: 'rotateX(70deg) rotateY(-12deg)' }}
                />
                <div className="w-full h-full rounded-3xl overflow-hidden border border-white/20 shadow-[0_24px_70px_rgba(236,72,153,0.42)]">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                  {isPlayingFromOffline && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 border border-emerald-400/50 text-[10px] font-extrabold text-emerald-300 flex items-center gap-1">
                      <WifiOff className="w-3 h-3" /> OFFLINE
                    </span>
                  )}
                </div>
              </div>

              <canvas ref={bigCanvasRef} width={300} height={34} className="w-full max-w-[300px] opacity-90" />

              <div className="w-full flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg sm:text-xl font-black text-white truncate">
                    {track.emoji} {track.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-200/80 truncate">
                    {track.artist} · {track.bpm} BPM
                  </p>
                </div>
                <button
                  onClick={() => onLike(track)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 shrink-0"
                >
                  <Heart
                    className={`w-5 h-5 ${track.favorite ? 'fill-pink-500 text-pink-500' : 'text-purple-200'}`}
                  />
                </button>
              </div>

              {/* Scrubber */}
              <div className="w-full space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="dj-slider h-1.5 w-full"
                />
                <div className="flex justify-between text-[11px] font-mono text-purple-300/80">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Big Controls */}
              <div className="flex items-center justify-center gap-6 py-1">
                <button onClick={onPrev} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
                  <SkipBack className="w-6 h-6" />
                </button>
                <button
                  onClick={onTogglePlay}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-purple-100 text-black flex items-center justify-center shadow-[0_0_32px_rgba(236,72,153,0.65)] hover:scale-105 active:scale-95 transition"
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-1" />}
                </button>
                <button onClick={onNext} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-3 gap-2 pb-2">
              <button
                onClick={() => onToggleOffline(track)}
                disabled={isDownloadingOffline}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition ${
                  isCurrentTrackOffline
                    ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200'
                    : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
              >
                {isDownloadingOffline ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrentTrackOffline ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <DownloadCloud className="w-4 h-4" />
                )}
                {isDownloadingOffline ? 'Baixando' : isCurrentTrackOffline ? 'Salva Offline' : 'Baixar Offline'}
              </button>
              <button
                onClick={() => {
                  setExpanded(false);
                  onOpenLyrics(track);
                }}
                className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Letra
              </button>
              <button
                onClick={() => {
                  setExpanded(false);
                  onSendToDJ(track);
                }}
                className="py-2.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/35 text-xs font-bold text-cyan-200 flex items-center justify-center gap-1.5"
              >
                <Disc3 className="w-4 h-4" /> Mesa DJ
              </button>
            </div>
            {track.youtubeVideoId && onWatchClip && (
              <button
                onClick={() => {
                  setExpanded(false);
                  onWatchClip();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition"
              >
                <Film className="w-4 h-4" /> ASSISTIR CLIPE OFICIAL COMPLETO
              </button>
            )}
          </div>
        </div>
      )}

      {/* FLOATING 3D SPACE GLASS MINI PLAYER DOCK */}
      <div className="fixed bottom-16 md:bottom-3 left-2 right-2 md:left-60 lg:left-64 md:right-4 z-40 rounded-2xl cosmic-card-3d px-3 sm:px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between gap-2.5 h-13">
          {/* Left: Track Info */}
          <div
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 md:flex-none md:w-64 cursor-pointer group"
            title="Abrir Player Espacial em Tela Cheia"
          >
            <div className="relative shrink-0">
              <img
                src={track.coverUrl}
                alt={track.title}
                className={`w-10 h-10 rounded-xl object-cover border border-white/20 ${
                  isPlaying ? 'shadow-[0_0_16px_rgba(236,72,153,0.6)]' : ''
                }`}
              />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/80 border border-white/20 flex items-center justify-center opacity-85 group-hover:opacity-100">
                <ChevronUp className="w-3 h-3 text-cyan-300" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span className="truncate">
                  {track.emoji} {track.title}
                </span>
                {isPlayingFromOffline && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/25 text-emerald-300 text-[9px] font-extrabold shrink-0">
                    OFFLINE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-purple-200/75 truncate">{track.artist}</div>
            </div>
          </div>

          {/* Center: Controls + Progress Bar */}
          <div className="flex flex-col items-center gap-1 flex-none sm:flex-1 max-w-md">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={onPrev} className="p-1 text-purple-200 hover:text-white transition" title="Anterior">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={onTogglePlay}
                className="w-8 h-8 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-[0_0_18px_rgba(255,255,255,0.45)] transition"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>
              <button onClick={onNext} className="p-1 text-purple-200 hover:text-white transition" title="Próxima">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-2 w-full">
              <span className="text-[10px] font-mono text-purple-300/75 w-8 text-right">{fmt(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="dj-slider h-1 flex-1"
              />
              <span className="text-[10px] font-mono text-purple-300/75 w-8">{fmt(duration)}</span>
            </div>
          </div>

          {/* Right: Quick Actions + Volume */}
          <div className="flex items-center gap-1 justify-end md:w-72">
            {track.youtubeVideoId && onWatchClip && (
              <button
                onClick={onWatchClip}
                className="px-2.5 py-1 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-rose-200 text-[10px] font-extrabold flex items-center gap-1 shrink-0 transition"
                title="Assistir Clipe Oficial Completo"
              >
                <Film className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clipe</span>
              </button>
            )}
            <button
              onClick={() => onToggleOffline(track)}
              disabled={isDownloadingOffline}
              className={`p-1.5 rounded-lg transition ${
                isCurrentTrackOffline ? 'text-emerald-400' : 'text-purple-200/80 hover:text-cyan-300'
              }`}
              title={isCurrentTrackOffline ? 'Salva Offline' : 'Baixar Offline'}
            >
              {isDownloadingOffline ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCurrentTrackOffline ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <DownloadCloud className="w-4 h-4" />
              )}
            </button>
            <div className="hidden md:flex items-center gap-1">
              <canvas ref={canvasRef} width={44} height={20} className="rounded opacity-85 mr-0.5" />
              <button
                onClick={() => onLike(track)}
                className={`p-1.5 rounded-lg transition ${
                  track.favorite ? 'text-pink-400' : 'text-purple-200/80 hover:text-pink-400'
                }`}
                title="Curtir"
              >
                <Heart className={`w-4 h-4 ${track.favorite ? 'fill-pink-500' : ''}`} />
              </button>
              <button
                onClick={() => onOpenLyrics(track)}
                className="p-1.5 rounded-lg text-purple-200/80 hover:text-white transition"
                title="Letra"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSendToDJ(track)}
                className="p-1.5 rounded-lg text-cyan-300 hover:bg-cyan-500/20 transition"
                title="Mixar na Mesa DJ"
              >
                <Disc3 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 pl-1 w-20">
                <Volume2 className="w-3.5 h-3.5 text-purple-200/75 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={volume}
                  onChange={(e) => onVolume(Number(e.target.value))}
                  className="dj-slider h-1 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

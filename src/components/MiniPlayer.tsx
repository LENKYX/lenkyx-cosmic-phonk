import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, MessageCircle, Disc3, FileText, Heart } from 'lucide-react';
import { AudioVersion, Track } from '../types';

interface Props {
  track: Track | null;
  activeVersion: AudioVersion;
  isPlaying: boolean;
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
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const MiniPlayer: React.FC<Props> = ({
  track,
  activeVersion,
  isPlaying,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onSelectVersion,
  onPrev,
  onNext,
  onSeek,
  onVolume,
  onShare,
  onSendToDJ,
  onOpenLyrics,
  onLike,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let phase = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = 20;
      const bw = w / bars;
      phase += isPlaying ? 0.16 : 0.02;
      for (let i = 0; i < bars; i++) {
        const amp = isPlaying
          ? (Math.sin(phase + i * 0.55) * 0.5 + 0.5) * 0.72 + (Math.cos(phase * 1.6 - i * 0.35) * 0.5 + 0.5) * 0.28
          : 0.14;
        const bh = Math.max(2, amp * h);
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = grad;
        ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  if (!track) return null;

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-[#0b0618]/96 backdrop-blur-xl border-t border-white/10 px-3 sm:px-4 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between gap-3 h-14">
        {/* Left: Compact Track Info (Spotify proportions) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 md:flex-none md:w-72">
          <img
            src={track.coverUrl}
            alt={track.title}
            className={`w-11 h-11 rounded-lg object-cover border border-white/15 shrink-0 ${
              isPlaying ? 'shadow-[0_0_12px_rgba(236,72,153,0.55)]' : ''
            }`}
          />
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white truncate">
              {track.emoji} {track.title}
            </div>
            <div className="text-[11px] text-purple-300/80 truncate flex items-center gap-1.5">
              <span className="truncate">{track.artist}</span>
              {track.audioUrlV2 && (
                <span className="inline-flex items-center rounded overflow-hidden border border-pink-400/40 bg-black/60 shrink-0">
                  <button
                    onClick={() => onSelectVersion('v1')}
                    className={`px-1.5 py-0.2 text-[9px] font-extrabold ${
                      activeVersion === 'v1' ? 'bg-pink-500 text-white' : 'text-purple-200'
                    }`}
                  >
                    V1
                  </button>
                  <button
                    onClick={() => onSelectVersion('v2')}
                    className={`px-1.5 py-0.2 text-[9px] font-extrabold ${
                      activeVersion === 'v2' ? 'bg-cyan-400 text-black' : 'text-purple-200'
                    }`}
                  >
                    V2
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Controls + Slim Progress Bar */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-lg">
          <div className="flex items-center gap-3">
            <button onClick={onPrev} className="p-1 text-purple-200 hover:text-white transition" title="Anterior">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow transition"
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

        {/* Right: Quick Icons + Volume */}
        <div className="hidden md:flex items-center gap-1.5 justify-end w-72">
          <canvas ref={canvasRef} width={54} height={22} className="rounded opacity-85 mr-1" />
          <button
            onClick={() => onLike(track)}
            className={`p-1.5 rounded-lg transition ${
              track.favorite ? 'text-pink-400' : 'text-purple-300 hover:text-pink-400'
            }`}
            title="Curtir"
          >
            <Heart className={`w-4 h-4 ${track.favorite ? 'fill-pink-500' : ''}`} />
          </button>
          <button
            onClick={() => onOpenLyrics(track)}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white transition"
            title="Letra & Prompt Suno"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSendToDJ(track)}
            className="p-1.5 rounded-lg text-cyan-300 hover:bg-cyan-500/15 transition"
            title="Carregar na Mesa de DJ"
          >
            <Disc3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onShare(track)}
            className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-500/15 transition"
            title="Compartilhar no WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 w-20 ml-1">
            <Volume2 className="w-3.5 h-3.5 text-purple-300 shrink-0" />
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
  );
};

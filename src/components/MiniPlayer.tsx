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
  QrCode,
  Repeat,
  Gauge,
  ShieldOff,
  BatteryCharging,
} from 'lucide-react';
import { AudioVersion, Track } from '../types';

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
  onCloseMenu?: () => void;
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
  muted,
  bassBoostLevel = 0,
  playbackSpeed = 1,
  loopTrack = false,
  backgroundMode = true,
  onToggleBackgroundMode,
  onEmergencyStop,
  onCycleBassBoost,
  onSetBassBoostLevel,
  onCycleSpeed,
  onToggleLoop,
  onOpenPix,
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
  onCloseMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [expanded, setExpanded] = useState(false);

  const bassLabel =
    bassBoostLevel === 3
      ? 'Subwoofer'
      : bassBoostLevel === 2
        ? 'Pesado'
        : bassBoostLevel === 1
          ? 'Suave'
          : 'Graves +';

  useEffect(() => {
    const drawLoop = (canvas: HTMLCanvasElement | null, bars: number) => {
      if (!canvas) return () => {};
      const ctx = canvas.getContext('2d');
      if (!ctx) return () => {};
      let raf = 0;
      let phase = 0;
      let lastDraw = 0;
      const draw = (now: number) => {
        raf = requestAnimationFrame(draw);
        if (now - lastDraw < 44) return;
        lastDraw = now;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const bw = w / bars;
        phase += isPlaying ? 0.22 : 0.03;
        for (let i = 0; i < bars; i++) {
          const boostMul = bassBoostLevel > 0 && i < bars * 0.35 ? 1 + bassBoostLevel * 0.14 : 1;
          const rawAmp = isPlaying
            ? (Math.sin(phase + i * 0.52) * 0.5 + 0.5) * 0.72 + (Math.cos(phase * 1.5 - i * 0.35) * 0.5 + 0.5) * 0.28
            : 0.14;
          const bh = Math.max(2, Math.min(1, rawAmp * boostMul) * h);
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
    };

    const stopMini = drawLoop(canvasRef.current, 16);
    const stopBig = expanded ? drawLoop(bigCanvasRef.current, 32) : () => {};
    return () => {
      stopMini();
      stopBig();
    };
  }, [isPlaying, expanded, bassBoostLevel]);

  if (!track) return null;

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {/* FUTURISTIC EXPANDED NOW-PLAYING AUDIO CORE (Responsive: Mobile, App, PC & Smart TV) */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-[#04010c]/97 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 overflow-y-auto">
          <div
            className="absolute inset-0 opacity-25 pointer-events-none blur-3xl scale-110"
            style={{
              backgroundImage: `url(${track.coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 max-w-2xl w-full mx-auto flex flex-col justify-between min-h-full gap-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setExpanded(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Minimizar"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div className="text-center min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                  LENKYX AUDIO CORE · HD
                </div>
                <div className="text-xs font-bold text-purple-200/80 truncate max-w-[240px]">{track.album}</div>
              </div>
              <div className="flex items-center gap-1.5">
                {onToggleBackgroundMode && (
                  <button
                    onClick={onToggleBackgroundMode}
                    className={`px-2.5 py-1.5 rounded-full border text-[10px] font-black flex items-center gap-1 transition ${
                      backgroundMode
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                        : 'bg-white/10 border-white/15 text-slate-300'
                    }`}
                    title="Continuar tocando com o celular bloqueado ou minimizado"
                  >
                    <BatteryCharging className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tela Apagada: {backgroundMode ? 'ON' : 'OFF'}</span>
                  </button>
                )}
                {onEmergencyStop && (
                  <button
                    onClick={() => {
                      setExpanded(false);
                      onEmergencyStop();
                    }}
                    className="px-2.5 py-1.5 rounded-full bg-rose-500/25 hover:bg-rose-500/45 border border-rose-400/50 text-rose-100 text-[10px] font-black flex items-center gap-1"
                    title="Botão de Segurança: Parar tudo e encerrar segundo plano"
                  >
                    <ShieldOff className="w-3.5 h-3.5" /> Parar
                  </button>
                )}
                {onOpenPix && (
                  <button
                    onClick={() => {
                      setExpanded(false);
                      onOpenPix();
                    }}
                    className="px-2.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[11px] font-black flex items-center gap-1"
                    title="Apoiar via PIX (QR Code)"
                  >
                    <QrCode className="w-3.5 h-3.5" /> PIX
                  </button>
                )}
                <button
                  onClick={() => onShare(track)}
                  className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200"
                  title="Compartilhar"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Artwork + Live Spectrum + Track Details */}
            <div className="flex flex-col md:flex-row items-center gap-6 my-auto">
              <div className="relative w-52 h-52 sm:w-64 sm:h-64 shrink-0">
                <div
                  className={`w-full h-full rounded-3xl overflow-hidden border transition ${
                    bassBoostLevel > 0
                      ? 'border-pink-400/70 shadow-[0_0_55px_rgba(236,72,153,0.45)]'
                      : 'border-white/20 shadow-[0_24px_70px_rgba(34,211,238,0.22)]'
                  }`}
                >
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                  {isPlayingFromOffline && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 border border-emerald-400/50 text-[10px] font-extrabold text-emerald-300 flex items-center gap-1">
                      <WifiOff className="w-3 h-3" /> OFFLINE
                    </span>
                  )}
                  {bassBoostLevel > 0 && (
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-pink-600/90 border border-pink-300/60 text-[10px] font-black text-white shadow">
                      🔊 {bassLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg sm:text-2xl font-black text-white truncate">
                      {track.emoji} {track.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-purple-200/80 truncate">{track.artist}</p>
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

                <canvas ref={bigCanvasRef} width={340} height={36} className="w-full opacity-95 rounded-lg" />

                {/* Progress Bar */}
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

                {/* Main Transport + Speed & Loop */}
                <div className="flex items-center justify-between gap-2 py-1">
                  {onToggleLoop ? (
                    <button
                      onClick={onToggleLoop}
                      className={`p-2.5 rounded-xl border text-xs font-black transition ${
                        loopTrack
                          ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200'
                          : 'bg-white/10 border-white/15 text-slate-300 hover:text-white'
                      }`}
                      title="Repetir música"
                    >
                      <Repeat className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-9" />
                  )}

                  <div className="flex items-center gap-4">
                    <button onClick={onPrev} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={onTogglePlay}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-white to-purple-100 text-black flex items-center justify-center shadow-[0_0_32px_rgba(236,72,153,0.65)] hover:scale-105 active:scale-95 transition"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
                    </button>
                    <button onClick={onNext} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  {onCycleSpeed ? (
                    <button
                      onClick={onCycleSpeed}
                      className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-black text-cyan-200 flex items-center gap-1"
                      title="Velocidade de reprodução"
                    >
                      <Gauge className="w-3.5 h-3.5" /> {playbackSpeed}x
                    </button>
                  ) : (
                    <div className="w-9" />
                  )}
                </div>
              </div>
            </div>

            {/* Technological 4-Stage Bass Boost EQ Dock */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/12 p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-pink-300">
                <span className="flex items-center gap-1.5">
                  <AudioWaveform className="w-3.5 h-3.5" /> MOTOR DE GRAVES & SUBWOOFER
                </span>
                <span className="text-cyan-300">{bassLabel}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { lvl: 0 as BassBoostLevel, label: 'Normal', sub: '0 dB' },
                    { lvl: 1 as BassBoostLevel, label: 'Suave', sub: '+4 dB' },
                    { lvl: 2 as BassBoostLevel, label: 'Pesado', sub: '+9 dB' },
                    { lvl: 3 as BassBoostLevel, label: 'Subwoofer', sub: '+14 dB' },
                  ]
                ).map((preset) => {
                  const active = bassBoostLevel === preset.lvl;
                  return (
                    <button
                      key={preset.lvl}
                      type="button"
                      onClick={() => (onSetBassBoostLevel ? onSetBassBoostLevel(preset.lvl) : onCycleBassBoost?.())}
                      className={`py-2 px-1.5 rounded-xl text-center border transition ${
                        active
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-pink-300 text-white shadow-[0_0_15px_rgba(236,72,153,0.45)]'
                          : 'bg-white/[0.06] hover:bg-white/15 border-white/10 text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-black leading-tight">{preset.label}</div>
                      <div className="text-[9px] opacity-75 font-mono">{preset.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="grid grid-cols-4 gap-2 pb-1">
              <button
                onClick={() => onToggleOffline(track)}
                disabled={isDownloadingOffline}
                className={`py-2.5 px-2 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1 border transition ${
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
                {isCurrentTrackOffline ? 'Offline' : 'Baixar'}
              </button>
              <button
                onClick={() => {
                  setExpanded(false);
                  onOpenLyrics(track);
                }}
                className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-white flex flex-col items-center justify-center gap-1"
              >
                <FileText className="w-4 h-4" /> Letra
              </button>
              <button
                onClick={() => onShare(track)}
                className="py-2.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/35 text-[11px] font-bold text-cyan-200 flex flex-col items-center justify-center gap-1"
              >
                <MessageCircle className="w-4 h-4" /> Enviar
              </button>
              {onOpenPix ? (
                <button
                  onClick={() => {
                    setExpanded(false);
                    onOpenPix();
                  }}
                  className="py-2.5 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-[11px] font-black text-emerald-200 flex flex-col items-center justify-center gap-1"
                >
                  <QrCode className="w-4 h-4" /> Apoiar PIX
                </button>
              ) : (
                <button
                  onClick={() => setExpanded(false)}
                  className="py-2.5 px-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold text-white flex flex-col items-center justify-center gap-1"
                >
                  <ChevronDown className="w-4 h-4" /> Fechar
                </button>
              )}
            </div>

            {track.youtubeVideoId && onWatchClip && (
              <button
                onClick={() => {
                  setExpanded(false);
                  onWatchClip();
                }}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Film className="w-4 h-4" /> Assistir Clipe em Tela Cheia
              </button>
            )}
          </div>
        </div>
      )}

      {/* FUTURISTIC COMPACT ON-DEMAND BOTTOM PLAYER BAR */}
      <div className="fixed bottom-14 md:bottom-0 left-0 md:left-60 lg:left-64 right-0 z-40 bg-[#0b0618]/96 backdrop-blur-2xl border-t border-cyan-400/20 shadow-[0_-10px_35px_rgba(0,0,0,0.85)]">
        {/* Top Edge Interactive Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
            onSeek(ratio * (duration || 1));
          }}
          className="h-1.5 w-full bg-white/10 cursor-pointer group relative"
          title="Toque para avançar ou voltar na música"
        >
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 transition-all duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="px-2.5 sm:px-5 py-2 flex items-center justify-between gap-2 h-14">
          {/* Left: Cover + Title + Artist (Tap to expand!) */}
          <div
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 min-w-0 flex-1 md:flex-none md:w-64 cursor-pointer group"
            title="Abrir Deck Tecnológico em Tela Cheia"
          >
            <div className="relative shrink-0">
              <img
                src={track.coverUrl}
                alt={track.title}
                className={`w-10 h-10 rounded-xl object-cover border border-white/20 ${
                  isPlaying ? 'shadow-[0_0_16px_rgba(236,72,153,0.65)]' : ''
                }`}
              />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/85 border border-cyan-400/50 flex items-center justify-center">
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
              <div className="text-[11px] text-purple-200/75 truncate">
                {track.artist} · <span className="font-mono text-[10px]">{fmt(currentTime)} / {fmt(duration)}</span>
              </div>
            </div>
          </div>

          {/* Center: Crisp Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button onClick={onPrev} className="p-1.5 text-purple-200 hover:text-white transition" title="Anterior">
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.45)] transition"
              title={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
            </button>
            <button onClick={onNext} className="p-1.5 text-purple-200 hover:text-white transition" title="Próxima">
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Right: Working Bass Boost (all menus), Media Menu, PIX QR, Clip, Offline & Volume */}
          <div className="flex items-center gap-1 justify-end md:w-auto">
            {onOpenMediaMenu && (
              <button
                onClick={onOpenMediaMenu}
                className={`px-2 py-1 rounded-xl border text-[10px] font-black flex items-center gap-1 shrink-0 transition ${
                  backgroundMode
                    ? 'bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 border-cyan-400/50 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-100'
                }`}
                title="Abrir Menu Media Player (2º Plano / Tela Fechada)"
              >
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden xs:inline">Player</span>
              </button>
            )}
            {onCycleBassBoost && (
              <button
                onClick={onCycleBassBoost}
                className={`px-2 py-1 rounded-xl border text-[10px] font-black flex items-center gap-1 shrink-0 transition ${
                  bassBoostLevel > 0
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-pink-300 text-white shadow-[0_0_14px_rgba(236,72,153,0.55)]'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-purple-100'
                }`}
                title="Motor de Graves (Normal / Suave / Pesado / Subwoofer)"
              >
                <AudioWaveform className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{bassLabel}</span>
              </button>
            )}
            {onOpenPix && (
              <button
                onClick={onOpenPix}
                className="hidden sm:flex px-2 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[10px] font-black items-center gap-1 shrink-0 transition"
                title="Apoiar via PIX (QR Code) & Ganhar Bonequinho"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">PIX</span>
              </button>
            )}
            {track.youtubeVideoId && onWatchClip && (
              <button
                onClick={onWatchClip}
                className="px-2 py-1 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-rose-200 text-[10px] font-extrabold flex items-center gap-1 shrink-0 transition"
                title="Assistir Clipe em Tela Cheia"
              >
                <Film className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clipe</span>
              </button>
            )}
            <button
              onClick={() => onToggleOffline(track)}
              disabled={isDownloadingOffline}
              className={`hidden sm:inline-flex p-1.5 rounded-lg transition ${
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
              <canvas ref={canvasRef} width={36} height={20} className="rounded opacity-85 mr-0.5" />
              <button
                onClick={() => onLike(track)}
                className={`p-1.5 rounded-lg transition ${
                  track.favorite ? 'text-pink-400' : 'text-purple-200/80 hover:text-pink-400'
                }`}
                title="Curtir"
              >
                <Heart className={`w-4 h-4 ${track.favorite ? 'fill-pink-500' : ''}`} />
              </button>
              <div className="flex items-center gap-1 pl-1 w-24">
                <button
                  onClick={onToggleMute}
                  className="p-1 text-purple-200/80 hover:text-cyan-300 shrink-0"
                  title={muted ? 'Ativar Som' : 'Silenciar'}
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
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
            </div>
            {onToggleBackgroundMode && (
              <button
                onClick={onToggleBackgroundMode}
                className={`hidden lg:flex px-2 py-1 rounded-xl border text-[10px] font-black items-center gap-1 shrink-0 transition ${
                  backgroundMode
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : 'bg-white/10 border-white/15 text-slate-300'
                }`}
                title="Continuar tocando com tela bloqueada ou minimizada (economiza bateria)"
              >
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>{backgroundMode ? '2º Plano ON' : '2º Plano OFF'}</span>
              </button>
            )}
            {onEmergencyStop && (
              <button
                onClick={onEmergencyStop}
                className="px-2 py-1 rounded-xl bg-rose-500/25 hover:bg-rose-500/45 border border-rose-400/50 text-rose-100 text-[10px] font-black flex items-center gap-1 shrink-0 transition"
                title="Botão de Segurança: Parar som, vídeo e segundo plano"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Parar Tudo</span>
              </button>
            )}
            {onCloseMenu && (
              <button
                onClick={onCloseMenu}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 text-white/85 hover:text-white transition shrink-0"
                title="Minimizar barra do player (música continua)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

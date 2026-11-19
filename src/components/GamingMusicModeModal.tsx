import React, { useState } from 'react';
import {
  Gamepad2,
  X,
  Smartphone,
  Monitor,
  Tv,
  PictureInPicture2,
  Zap,
  ShieldCheck,
  Volume2,
  Sparkles,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { Track } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  gamingModeEnabled: boolean;
  fpsBoostEnabled: boolean;
  pipOpen: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  onToggleGamingMode: (enabled: boolean) => void;
  onToggleFpsBoost: (enabled: boolean) => void;
  onLaunchFloatingPlayer: () => Promise<void>;
  onCloseFloatingPlayer: () => Promise<void>;
  onQuickPlayStart: () => void;
  onOpenTvCast: () => void;
}

export const GamingMusicModeModal: React.FC<Props> = ({
  open,
  onClose,
  gamingModeEnabled,
  fpsBoostEnabled,
  pipOpen,
  currentTrack,
  isPlaying,
  onToggleGamingMode,
  onToggleFpsBoost,
  onLaunchFloatingPlayer,
  onCloseFloatingPlayer,
  onQuickPlayStart,
  onOpenTvCast,
}) => {
  const [platformTab, setPlatformTab] = useState<'mobile' | 'pc' | 'console'>('mobile');
  const [pipBusy, setPipBusy] = useState(false);

  if (!open) return null;

  const handleActivateAllForMobileGame = async () => {
    setPipBusy(true);
    try {
      onToggleGamingMode(true);
      onToggleFpsBoost(true);
      if (!isPlaying) onQuickPlayStart();
      await onLaunchFloatingPlayer();
    } finally {
      setPipBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl cosmic-card-3d border border-cyan-400/40 bg-[#080316] shadow-[0_24px_80px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-950/75 via-fuchsia-950/45 to-cyan-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shrink-0">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" /> Música em Todos os Jogos
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                Modo Gamer · Celular, PC & Console
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Master Auto-Guard Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-purple-500/15 border border-emerald-400/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-black text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Proteção Automática Anti-Corte nos Jogos
                </div>
                <p className="text-[11px] text-slate-200/90 leading-relaxed">
                  Mantém suas músicas tocando sem parar mesmo ao abrir jogos no celular ou PC.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleGamingMode(!gamingModeEnabled)}
                className={`px-4 py-2 rounded-full text-xs font-black transition shadow shrink-0 ${
                  gamingModeEnabled
                    ? 'bg-emerald-400 text-black hover:brightness-110'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                }`}
              >
                {gamingModeEnabled ? '✓ Modo Jogos Ativo' : 'Ativar Modo Jogos'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Floating Player Over Games (PiP) */}
              <button
                type="button"
                disabled={pipBusy}
                onClick={() => {
                  if (pipOpen) void onCloseFloatingPlayer();
                  else void handleActivateAllForMobileGame();
                }}
                className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition shadow ${
                  pipOpen
                    ? 'bg-pink-500 text-white hover:bg-pink-400'
                    : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:brightness-110'
                }`}
              >
                <PictureInPicture2 className="w-4 h-4 shrink-0" />
                <span>
                  {pipBusy
                    ? 'Abrindo Player Flutuante...'
                    : pipOpen
                      ? 'Fechar Mini-Player Flutuante'
                      : 'Flutuar Sobre o Jogo (PiP)'}
                </span>
              </button>

              {/* Low-CPU FPS Boost */}
              <button
                type="button"
                onClick={() => onToggleFpsBoost(!fpsBoostEnabled)}
                className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition ${
                  fpsBoostEnabled
                    ? 'bg-amber-400/20 border-amber-300/60 text-amber-200'
                    : 'bg-white/[0.06] border-white/15 text-slate-200 hover:bg-white/15'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{fpsBoostEnabled ? '⚡ Boost de FPS Ativo (Sem Lag)' : 'Ativar Boost de FPS (Sem Lag)'}</span>
              </button>
            </div>
          </div>

          {/* Now Playing Mini Status */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentTrack?.coverUrl || '/covers/icon-512.png'}
                alt={currentTrack?.title || 'LENKYX'}
                className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/15"
              />
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-pink-300 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> {isPlaying ? 'Tocando Agora para o Jogo' : 'Pronto para Tocar no Jogo'}
                </div>
                <div className="text-xs font-black text-white truncate">
                  {currentTrack?.title || 'LENKYX Cosmic Phonk'}
                </div>
                <div className="text-[11px] text-purple-200/80 truncate">
                  {currentTrack?.artist || 'LENKYX'}
                </div>
              </div>
            </div>
            {!isPlaying && (
              <button
                type="button"
                onClick={onQuickPlayStart}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black text-xs font-black flex items-center gap-1.5 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> Tocar Som
              </button>
            )}
          </div>

          {/* Platform Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.05] border border-white/10">
            <button
              type="button"
              onClick={() => setPlatformTab('mobile')}
              className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                platformTab === 'mobile'
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-400 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Celular
            </button>
            <button
              type="button"
              onClick={() => setPlatformTab('pc')}
              className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                platformTab === 'pc'
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> PC Gamer
            </button>
            <button
              type="button"
              onClick={() => setPlatformTab('console')}
              className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                platformTab === 'console'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> Consoles & TV
            </button>
          </div>

          {/* Platform Specific Guide & Quick Actions */}
          {platformTab === 'mobile' && (
            <div className="rounded-2xl bg-white/[0.04] border border-pink-400/25 p-4 space-y-2.5 text-xs text-slate-200">
              <div className="font-black text-pink-300">
                📱 Para Jogos de Celular (Free Fire, PUBG, COD Mobile, Roblox, Minecraft, Brawl Stars, eFootball)
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-200/90">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dê play na sua música ou playlist aqui no LENKYX.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Ative o <strong>Modo Jogos + Boost de FPS</strong> para liberar 100% da memória do celular para o jogo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Minimize ou abra o <strong>Player Flutuante (PiP)</strong> e entre no seu jogo — o som continua em segundo plano e na barra de notificações do Android e iPhone!</span>
                </li>
              </ul>
            </div>
          )}

          {platformTab === 'pc' && (
            <div className="rounded-2xl bg-white/[0.04] border border-cyan-400/25 p-4 space-y-2.5 text-xs text-slate-200">
              <div className="font-black text-cyan-300">
                💻 Para Jogos no PC (GTA V / FiveM, Valorant, CS2, Fortnite, LoL, Minecraft, Steam & Epic)
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-200/90">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Clique em <strong>Flutuar Sobre o Jogo (PiP)</strong> para abrir o mini controle flutuante por cima da tela do jogo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Use as teclas multimídia do teclado (Play/Pause/Próxima) a qualquer hora sem precisar sair do jogo (sem Alt+Tab!).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Compatível com Discord, OBS, Steam Overlay e modo janela sem bordas.</span>
                </li>
              </ul>
            </div>
          )}

          {platformTab === 'console' && (
            <div className="rounded-2xl bg-white/[0.04] border border-purple-400/25 p-4 space-y-3 text-xs text-slate-200">
              <div className="font-black text-purple-300">
                🎮 Para Consoles & Cloud Gaming (PS5, PS4, Xbox, Nintendo Switch, GeForce NOW, Xbox Cloud)
              </div>
              <p className="text-[11px] text-slate-200/90 leading-relaxed">
                Abra o navegador do console ou Smart TV em <code className="text-cyan-300">/tv</code> ou conecte via QR Code para sincronizar suas playlists e tocar som com grave turbinado enquanto joga na nuvem ou na TV.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTvCast();
                }}
                className="px-4 py-2 rounded-full bg-purple-500/25 hover:bg-purple-500/40 border border-purple-400/45 text-xs font-black text-purple-100 flex items-center gap-1.5"
              >
                <Tv className="w-3.5 h-3.5" /> Conectar TV / Console por QR Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

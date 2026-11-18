import React, { useEffect, useState } from 'react';
import { Sparkles, FastForward, Music, Clapperboard, Film } from 'lucide-react';

const GTA_COSMIC_SLIDES = [
  {
    img: '/covers/album-official.jpg',
    title: 'LENKYX · MEU MUNDO',
    sub: 'Músicas Completas, Clipes Oficiais & Cinema em HD',
    tip: 'Sem cadastro, sem login — escolha seu perfil e curta no celular, PC ou TV.',
  },
  {
    img: '/covers/track-05.jpg',
    title: 'CINEMA & SÉRIES HD',
    sub: 'Filmes, Séries e Animes organizados para Celular, PC e TV',
    tip: 'Deslize os carrosséis tipo Netflix ou toque nos pôsteres para assistir em tela cheia.',
  },
  {
    img: '/covers/track-12.jpg',
    title: 'MÚSICAS & ARTISTAS DO MUNDO',
    sub: 'Pesquisa instantânea com Áudio, Clipes e Efeitos Visuais 3D',
    tip: 'A barra de mídia aparece somente quando você dá Play em uma música.',
  },
];

interface Props {
  open: boolean;
  mode?: 'splash' | 'stage' | 'discreet_corner';
  statusText?: string;
  progress?: number;
  onSkip?: () => void;
}

export const CosmicGtaLoader: React.FC<Props> = ({
  open,
  mode = 'splash',
  statusText = 'Preparando seu mundo & verificando atualizações...',
  progress,
  onSkip,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPct, setAutoPct] = useState(18);
  const [introPulse, setIntroPulse] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIntroPulse(false);
    const pulseT = window.setTimeout(() => setIntroPulse(true), 80);
    const t = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % GTA_COSMIC_SLIDES.length);
    }, 3400);
    const p = window.setInterval(() => {
      setAutoPct((v) => (v >= 97 ? 97 : v + Math.max(4, Math.round((100 - v) * 0.2))));
    }, 140);
    return () => {
      window.clearTimeout(pulseT);
      window.clearInterval(t);
      window.clearInterval(p);
    };
  }, [open]);

  if (!open) return null;

  const pct = typeof progress === 'number' ? Math.min(100, Math.max(0, Math.round(progress))) : autoPct;
  const current = GTA_COSMIC_SLIDES[slideIdx % GTA_COSMIC_SLIDES.length];

  // 1. Discreet Corner Floating Update Card
  if (mode === 'discreet_corner') {
    return (
      <div className="fixed bottom-6 right-3 sm:right-5 z-[9980] w-72 rounded-2xl overflow-hidden border border-cyan-400/40 bg-[#070214]/92 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] pointer-events-auto animate-fade-in">
        <div className="px-3.5 py-3 flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <div className="text-[10px] font-black text-pink-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> ATUALIZAÇÃO NA ENTRADA
            </div>
            <div className="text-xs font-black text-white truncate">{statusText}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[10px] font-bold text-white"
              >
                Ocultar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Stage Card (MoviesView catalog hydration)
  if (mode === 'stage') {
    return (
      <div className="relative rounded-[28px] overflow-hidden border border-white/15 bg-[#050110] min-h-[300px] sm:min-h-[360px] flex flex-col justify-between shadow-[0_24px_70px_rgba(0,0,0,0.8)]">
        <img
          key={current.img}
          src={current.img}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover opacity-50 gta-ken-burns"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04010c] via-[#04010c]/55 to-black/50" />
        <div className="relative z-10 p-5 flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full bg-black/70 border border-cyan-400/45 text-[10px] font-black uppercase tracking-widest text-cyan-200 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-pink-400" /> {current.title}
          </span>
        </div>
        <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-lg space-y-1">
            <div className="text-xs sm:text-sm font-black text-white">{current.sub}</div>
            <div className="text-[11px] text-purple-200/85 bg-black/55 border border-white/10 rounded-xl px-3 py-2 inline-block">
              ✦ {current.tip}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 shrink-0">
            <span className="w-5 h-5 rounded-full border-2 border-pink-500 border-t-cyan-300 animate-spin shrink-0" />
            <div className="min-w-[140px]">
              <div className="flex items-center justify-between text-[10px] font-black text-cyan-200">
                <span>{statusText}</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Cinematic Intro Screen (Netflix + Music Visual Entrance with Auto-Update Sync)
  return (
    <div className="fixed inset-0 z-[9999] bg-[#030009] text-white overflow-hidden select-none flex flex-col justify-between">
      {/* Sweeping Atmospheric Light Curtains */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(236,72,153,0.22), transparent 65%), radial-gradient(ellipse 65% 50% at 30% 60%, rgba(34,211,238,0.16), transparent 65%)',
        }}
      />
      {/* Vertical Cinema Light Ribbons */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-45">
        <div
          className={`w-[520px] h-[520px] rounded-full border border-pink-500/35 blur-[2px] transition-transform duration-1000 ${
            introPulse ? 'scale-125 opacity-70' : 'scale-50 opacity-10'
          }`}
        />
        <div
          className={`absolute w-[340px] h-[340px] rounded-full border-2 border-cyan-400/40 transition-transform duration-1000 delay-100 ${
            introPulse ? 'scale-110 opacity-80' : 'scale-50 opacity-10'
          }`}
        />
      </div>

      {/* Top Subtle Skip */}
      <div className="relative z-10 p-5 sm:p-8 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-black tracking-widest uppercase text-cyan-200">
          <Sparkles className="w-3 h-3 text-pink-400" /> Meu Mundo de Lazer
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-black text-white flex items-center gap-1.5 backdrop-blur-md transition"
          >
            <span>Entrar</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Iconic Emblem Animation */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center space-y-5">
        <div
          className={`relative transition-all duration-1000 ease-out ${
            introPulse ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4'
          }`}
        >
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-rose-600/45 via-pink-500/35 to-cyan-400/45 blur-3xl animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-br from-rose-500 via-pink-500 to-cyan-400 shadow-[0_0_60px_rgba(236,72,153,0.65)]">
            <img
              src="/covers/avatar.jpg"
              alt="LENKYX"
              className="w-full h-full rounded-[1.35rem] object-cover"
            />
          </div>
        </div>

        <div
          className={`space-y-2 transition-all duration-1000 delay-150 ${
            introPulse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-[0.22em] text-white drop-shadow-[0_6px_30px_rgba(236,72,153,0.5)]">
            LENKYX
          </h1>
          <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-black tracking-widest uppercase text-cyan-200/90">
            <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5 text-pink-400" /> Músicas</span>
            <span className="text-white/30">•</span>
            <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5 text-cyan-300" /> Clipes</span>
            <span className="text-white/30">•</span>
            <span className="flex items-center gap-1"><Clapperboard className="w-3.5 h-3.5 text-rose-400" /> Cinema</span>
          </div>
        </div>
      </div>

      {/* Bottom Auto-Update Sync Bar */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center gap-3">
        <div className="w-full max-w-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>{statusText}</span>
            <span className="font-mono text-cyan-300">{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              style={{ width: `${pct}%` }}
              className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-cyan-400 transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* === NETFLIX-STYLE PRE-ROLL VISUAL INTRO BEFORE CONTENT PLAYS === */
export const CinemaPrerollIntro: React.FC<{
  open: boolean;
  title?: string;
  subtitle?: string;
  onFinish: () => void;
}> = ({ open, title, subtitle = 'LENKYX ORIGINAL', onFinish }) => {
  const [phase, setPhase] = useState<'in' | 'zoom' | 'out'>('in');

  useEffect(() => {
    if (!open) return;
    setPhase('in');
    const t1 = window.setTimeout(() => setPhase('zoom'), 120);
    const t2 = window.setTimeout(() => setPhase('out'), 1550);
    const t3 = window.setTimeout(() => onFinish(), 1950);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [open, title, onFinish]);

  if (!open) return null;

  return (
    <div
      className={`absolute inset-0 z-30 bg-[#030008] flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-400 ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Sweeping vertical cinema light spectrum (original Netflix-inspired ribbon feel) */}
      <div
        className={`absolute inset-0 transition-transform duration-1000 ease-out ${
          phase === 'zoom' || phase === 'out' ? 'scale-125 opacity-90' : 'scale-90 opacity-40'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(225,29,72,0.38), transparent 65%), linear-gradient(90deg, transparent 15%, rgba(236,72,153,0.16) 35%, rgba(34,211,238,0.18) 50%, rgba(225,29,72,0.22) 65%, transparent 85%)',
        }}
      />

      {/* Light beam columns */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none opacity-60">
        <div
          className={`w-1.5 sm:w-2 h-[75%] rounded-full bg-gradient-to-b from-transparent via-rose-500 to-transparent blur-[1px] transition-all duration-1000 ${
            phase !== 'in' ? 'scale-y-125 opacity-90' : 'scale-y-50 opacity-20'
          }`}
        />
        <div
          className={`w-3 sm:w-4 h-[85%] rounded-full bg-gradient-to-b from-transparent via-pink-500 to-transparent blur-[2px] transition-all duration-1000 delay-75 ${
            phase !== 'in' ? 'scale-y-150 opacity-100' : 'scale-y-50 opacity-20'
          }`}
        />
        <div
          className={`w-1.5 sm:w-2 h-[75%] rounded-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent blur-[1px] transition-all duration-1000 delay-150 ${
            phase !== 'in' ? 'scale-y-125 opacity-90' : 'scale-y-50 opacity-20'
          }`}
        />
      </div>

      {/* Central Emblem + Wordmark Zoom */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-700 ease-out ${
          phase === 'in'
            ? 'scale-75 opacity-0'
            : phase === 'zoom'
              ? 'scale-100 opacity-100'
              : 'scale-125 opacity-0'
        }`}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-[2px] bg-gradient-to-br from-rose-500 via-pink-500 to-cyan-400 shadow-[0_0_55px_rgba(244,63,94,0.7)] mb-4">
          <img src="/covers/avatar.jpg" alt="LENKYX" className="w-full h-full rounded-[14px] object-cover" />
        </div>
        <div className="text-[10px] sm:text-xs font-black tracking-[0.38em] uppercase text-rose-400 mb-1">
          {subtitle}
        </div>
        <div className="font-display text-3xl sm:text-5xl font-black tracking-[0.26em] text-white drop-shadow-[0_6px_32px_rgba(244,63,94,0.6)]">
          LENKYX
        </div>
        {title && (
          <div className="mt-3 max-w-md text-xs sm:text-sm font-bold text-slate-200/90 line-clamp-1 px-4 py-1 rounded-full bg-black/50 border border-white/10">
            {title}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onFinish}
        className="absolute bottom-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-[11px] font-black text-white backdrop-blur-md transition"
      >
        Pular Intro →
      </button>
    </div>
  );
};

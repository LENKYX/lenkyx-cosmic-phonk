import React, { useEffect, useState } from 'react';
import { Sparkles, FastForward } from 'lucide-react';

const GTA_COSMIC_SLIDES = [
  {
    img: '/covers/album-official.jpg',
    title: 'LENKYX · COSMIC PHONK',
    sub: 'Áudio 48 kHz + Galáxia WebGL2 em tempo real',
    tip: 'Dica Espacial: Mova o mouse ou toque na Galáxia 3D para disparar supernovas!',
  },
  {
    img: '/covers/track-05.jpg',
    title: 'CINEMA & SÉRIES HD',
    sub: '300+ Filmes, 100+ Séries, 50+ Animes & TV ao Vivo',
    tip: 'Dica na TV: Use ◀ ▶ ou as setas do controle para navegar sem precisar arrastar!',
  },
  {
    img: '/covers/track-12.jpg',
    title: 'ESTÚDIO AO VIVO HD & IA',
    sub: 'Criaturinhas espaciais inteligentes & câmera corrigida',
    tip: 'Dica da Live: As criaturinhas espaciais dançam na batida e ficam nas bordas sem tampar você!',
  },
  {
    img: '/covers/track-16.jpg',
    title: 'MODO SMART TV INDEPENDENTE',
    sub: 'Passe para a TV com código curto de 3 dígitos e libere o celular',
    tip: 'Dica Smart TV: Acesse /tv no navegador da sua TV para conectar em segundos!',
  },
  {
    img: '/covers/track-09.jpg',
    title: 'VÍDEOS CURTOS DO MUNDO',
    sub: 'Arraste ⬅️➡️ por Phonk, Drift, Brasil, DJs e Espaço',
    tip: 'Dica Rápida: Você pode baixar suas faixas favoritas para ouvir 100% offline!',
  },
];

interface Props {
  open: boolean;
  mode?: 'splash' | 'stage' | 'discreet_corner';
  statusText?: string;
  progress?: number; // 0..100
  onSkip?: () => void;
}

export const CosmicGtaLoader: React.FC<Props> = ({
  open,
  mode = 'splash',
  statusText = 'Carregando atualização cósmica...',
  progress,
  onSkip,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPct, setAutoPct] = useState(14);

  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % GTA_COSMIC_SLIDES.length);
    }, 3400);
    const p = window.setInterval(() => {
      setAutoPct((v) => (v >= 96 ? 96 : v + Math.max(2, Math.round((98 - v) * 0.14))));
    }, 180);
    return () => {
      window.clearInterval(t);
      window.clearInterval(p);
    };
  }, [open]);

  if (!open) return null;

  const pct = typeof progress === 'number' ? Math.min(100, Math.max(0, Math.round(progress))) : autoPct;
  const current = GTA_COSMIC_SLIDES[slideIdx % GTA_COSMIC_SLIDES.length];

  // 1. Discreet Corner Floating Card (non-blocking during background updates / syncs)
  if (mode === 'discreet_corner') {
    return (
      <div className="fixed bottom-24 right-3 sm:right-5 z-[9980] w-72 rounded-2xl overflow-hidden border border-cyan-400/40 bg-[#070214]/90 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-fade-in">
        <div className="relative h-24 overflow-hidden bg-black">
          <img
            key={current.img}
            src={current.img}
            alt={current.title}
            className="w-full h-full object-cover opacity-80 gta-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070214] via-transparent to-black/35" />
          <div className="absolute top-2 left-2.5 px-2 py-0.5 rounded-full bg-black/70 border border-pink-400/40 text-[9px] font-black text-pink-300 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> LENKYX UPDATE
          </div>
          {onSkip && (
            <button
              onClick={onSkip}
              className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[9px] font-bold text-white"
            >
              Ocultar
            </button>
          )}
        </div>
        <div className="px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-black text-white truncate">{current.title}</div>
            <div className="text-[10px] text-cyan-300 truncate">{statusText}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-[10px] font-mono font-black text-white">{pct}%</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Stage Card (used inside MoviesView while hydrating 300+ movies, 100+ series, 50+ animes!)
  if (mode === 'stage') {
    return (
      <div className="relative rounded-[28px] overflow-hidden border border-white/15 bg-[#050110] min-h-[300px] sm:min-h-[360px] flex flex-col justify-between shadow-[0_24px_70px_rgba(0,0,0,0.8)]">
        {/* Moving Ken Burns Artwork */}
        <img
          key={current.img}
          src={current.img}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover opacity-55 gta-ken-burns"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04010c] via-[#04010c]/45 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#04010c]/85 via-transparent to-[#04010c]/60" />

        {/* Top Left Tag */}
        <div className="relative z-10 p-5 flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full bg-black/70 border border-cyan-400/45 text-[10px] font-black uppercase tracking-widest text-cyan-200 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-pink-400" /> {current.title}
          </span>
        </div>

        {/* Bottom GTA-5 Style Corner HUD */}
        <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-lg space-y-1">
            <div className="text-xs sm:text-sm font-black text-white">{current.sub}</div>
            <div className="text-[11px] text-purple-200/85 bg-black/55 border border-white/10 rounded-xl px-3 py-2 inline-block">
              💡 {current.tip}
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

  // 3. Fullscreen Discreet GTA-5 Style Cosmic Splash / Update Screen (auto-closes or Pular!)
  return (
    <div className="fixed inset-0 z-[9999] bg-[#03000a] text-white overflow-hidden select-none flex flex-col justify-between">
      <img
        key={current.img}
        src={current.img}
        alt={current.title}
        className="absolute inset-0 w-full h-full object-cover opacity-55 gta-ken-burns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#03000a] via-black/35 to-[#03000a]/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#03000a]/85 via-transparent to-[#03000a]/75" />

      {/* Top Subtle Brand + Skip */}
      <div className="relative z-10 p-5 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/covers/avatar.jpg"
            alt="LENKYX"
            className="w-10 h-10 rounded-full border border-pink-500/70 shadow-[0_0_24px_rgba(236,72,153,0.5)]"
          />
          <div>
            <div className="font-display text-sm sm:text-base font-black tracking-wider text-white">
              LENKYX <span className="neon-text">COSMIC PHONK</span>
            </div>
            <div className="text-[11px] text-cyan-300/85 font-semibold">{current.title}</div>
          </div>
        </div>

        {onSkip && (
          <button
            onClick={onSkip}
            className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-black text-white flex items-center gap-1.5 backdrop-blur-md transition"
          >
            <span>Entrar Agora</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Minimal Moving Art Showcase */}
      <div className="relative z-10 px-6 sm:px-10 max-w-2xl space-y-2">
        <h2 className="font-display text-2xl sm:text-4xl font-black text-white drop-shadow-[0_6px_25px_rgba(0,0,0,0.9)]">
          {current.title}
        </h2>
        <p className="text-xs sm:text-sm text-purple-100/90 font-semibold">{current.sub}</p>
      </div>

      {/* Bottom GTA-5 Style Left Tip + Right Discreet Corner Loader */}
      <div className="relative z-10 p-5 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="max-w-md rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2.5 text-xs text-purple-100/85">
          <span className="font-black text-cyan-300 mr-1.5">✦</span>
          {current.tip}
        </div>

        <div className="flex items-center gap-3 bg-black/75 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 min-w-[230px]">
          <span className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-pink-500 animate-spin shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="truncate max-w-[155px]">{statusText}</span>
              <span className="font-mono text-cyan-300 ml-2">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
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
};

import React, { useEffect, useState } from 'react';
import { Sparkles, FastForward, Music, Clapperboard, Film, Trophy, QrCode, HeartHandshake, Share2 } from 'lucide-react';

const INTRO_HIGHLIGHTS = [
  {
    img: '/covers/album-official.jpg',
    title: 'LENKYX · UNIVERSO LIVRE',
    sub: 'Som Pesado, Clipes em HD, Cinema & Arena Ao Vivo',
    tip: 'Sem cadastro, sem login e zero anúncios — som direto no celular, PC ou Smart TV.',
  },
  {
    img: '/covers/track-05.jpg',
    title: 'CINEMA & SÉRIES POR TEMPORADA',
    sub: 'Filmes, Séries organizadas em Temporadas & Animes em HD',
    tip: 'Escolha a temporada, dê o play e aproveite a tela cheia sem interrupções.',
  },
  {
    img: '/covers/track-12.jpg',
    title: 'ARENA AO VIVO · FUTEBOL & UFC',
    sub: 'Acompanhe Jogos ao Vivo, Cards do UFC e Lutas Exclusivas',
    tip: 'Grave turbinado no player, busca inteligente e playlists livres no navegador.',
  },
];

interface Props {
  open: boolean;
  mode?: 'splash' | 'stage' | 'discreet_corner';
  statusText?: string;
  progress?: number;
  dailyCollectedBrl?: number;
  dailyGoalBrl?: number;
  onlineCount?: number;
  onOpenPix?: () => void;
  onShareApp?: () => void;
  onSkip?: () => void;
}

export const CosmicGtaLoader: React.FC<Props> = ({
  open,
  mode = 'splash',
  statusText = 'Preparando o som, cinema & arena ao vivo...',
  progress,
  dailyCollectedBrl = 0,
  dailyGoalBrl = 50,
  onlineCount = 1,
  onOpenPix,
  onShareApp,
  onSkip,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPct, setAutoPct] = useState(20);
  const [introPulse, setIntroPulse] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIntroPulse(false);
    const pulseT = window.setTimeout(() => setIntroPulse(true), 60);
    const t = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % INTRO_HIGHLIGHTS.length);
    }, 3400);
    const p = window.setInterval(() => {
      setAutoPct((v) => (v >= 98 ? 98 : v + Math.max(3, Math.round((100 - v) * 0.16))));
    }, 150);
    return () => {
      window.clearTimeout(pulseT);
      window.clearInterval(t);
      window.clearInterval(p);
    };
  }, [open]);

  if (!open) return null;

  const pct = typeof progress === 'number' ? Math.min(100, Math.max(0, Math.round(progress))) : autoPct;
  const current = INTRO_HIGHLIGHTS[slideIdx % INTRO_HIGHLIGHTS.length];
  const pixPct = dailyGoalBrl > 0 ? Math.min(100, Math.round((dailyCollectedBrl / dailyGoalBrl) * 100)) : 0;

  if (mode === 'discreet_corner') {
    return (
      <div className="fixed bottom-6 right-3 sm:right-5 z-[9980] w-72 rounded-2xl overflow-hidden border border-cyan-400/40 bg-[#070214]/92 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] pointer-events-auto">
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

  if (mode === 'stage') {
    return (
      <div className="relative rounded-[28px] overflow-hidden border border-white/15 bg-[#050110] min-h-[290px] sm:min-h-[340px] flex flex-col justify-between shadow-[0_24px_70px_rgba(0,0,0,0.8)]">
        <img
          key={current.img}
          src={current.img}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover opacity-45 gta-ken-burns"
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
            <div className="text-[11px] text-slate-200/90 bg-black/55 border border-white/10 rounded-xl px-3 py-2 inline-block">
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

  // Entry Splash Screen — Gentle Moving Logo + Special Effects + Daily PIX Goal Appeal
  return (
    <div className="fixed inset-0 z-[9999] bg-[#030009] text-white overflow-y-auto select-none flex flex-col justify-between">
      {/* Radiant Special Effects Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background:
            'radial-gradient(ellipse 72% 58% at 50% 40%, rgba(236,72,153,0.26), transparent 65%), radial-gradient(ellipse 65% 50% at 25% 68%, rgba(34,211,238,0.18), transparent 65%), radial-gradient(ellipse 55% 45% at 78% 72%, rgba(168,85,247,0.18), transparent 65%)',
        }}
      />

      {/* Orbiting Luminous Halos */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="w-[460px] h-[460px] sm:w-[580px] sm:h-[580px] rounded-full border border-pink-400/25 lenkyx-aura-orbit"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(236,72,153,0.12), transparent 30%, rgba(34,211,238,0.16) 60%, transparent 90%)',
          }}
        />
        <div className="absolute w-[310px] h-[310px] sm:w-[390px] sm:h-[390px] rounded-full border border-cyan-400/30 animate-pulse" />
      </div>

      {/* Top Status + Skip */}
      <div className="relative z-10 p-4 sm:p-7 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/15 text-[11px] font-bold text-emerald-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{onlineCount} {onlineCount === 1 ? 'pessoa curtindo agora' : 'pessoas curtindo agora'}</span>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-black text-white flex items-center gap-1.5 backdrop-blur-md transition"
          >
            <span>Entrar no App</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Gentle Floating Emblem + Daily PIX Support Prompt */}
      <div className="relative z-10 flex flex-col items-center justify-center px-5 py-3 text-center space-y-4 my-auto">
        <div
          className={`relative transition-all duration-1000 ease-out ${
            introPulse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="lenkyx-logo-float relative">
            <div className="absolute -inset-7 rounded-full bg-gradient-to-tr from-rose-500/45 via-fuchsia-500/35 to-cyan-400/45 blur-3xl animate-pulse" />
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] p-[3px] bg-gradient-to-br from-rose-500 via-pink-500 to-cyan-400 shadow-[0_0_70px_rgba(236,72,153,0.65)]">
              <img
                src="/covers/avatar.jpg"
                alt="LENKYX"
                className="w-full h-full rounded-[1.85rem] object-cover"
              />
            </div>
          </div>
        </div>

        <div
          className={`space-y-2 transition-all duration-1000 delay-150 ${
            introPulse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="font-logo text-4xl sm:text-6xl font-black tracking-[0.22em] text-white drop-shadow-[0_6px_30px_rgba(236,72,153,0.55)]">
            LENKYX
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-cyan-200">
            <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5 text-pink-400" /> Som</span>
            <span className="text-white/30">•</span>
            <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5 text-cyan-300" /> Clipes</span>
            <span className="text-white/30">•</span>
            <span className="flex items-center gap-1"><Clapperboard className="w-3.5 h-3.5 text-rose-400" /> Cinema</span>
            <span className="text-white/30">•</span>
            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-300" /> Futebol & UFC</span>
          </div>
        </div>

        {/* Daily PIX Goal Appeal Card right on Intro */}
        <div className="w-full max-w-md rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-pink-400/35 p-4 space-y-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
            <span className="text-pink-200 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-pink-400" />
              Ajude a manter o LENKYX 100% Sem Anúncios!
            </span>
            <span className="font-mono text-cyan-300">
              R$ {dailyCollectedBrl.toFixed(0)} / R$ {dailyGoalBrl.toFixed(0)}
            </span>
          </div>
          <p className="text-[11px] text-slate-200/90 leading-relaxed text-left">
            Este espaço é gratuito e livre de propagandas. Qualquer valor via <strong>PIX</strong> ajuda a bater nossa{' '}
            <strong>meta diária</strong> para pagar servidores e trazer músicas, filmes, séries e lutas ao vivo todos os dias!
          </p>
          <div className="h-2 w-full rounded-full bg-black/50 overflow-hidden border border-white/10">
            <div
              style={{ width: `${pixPct}%` }}
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 transition-all duration-500"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {onOpenPix && (
              <button
                type="button"
                onClick={onOpenPix}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black text-xs font-black flex items-center gap-1.5 shadow hover:brightness-110 transition"
              >
                <QrCode className="w-3.5 h-3.5" /> Apoiar Meta Diária (PIX)
              </button>
            )}
            {onShareApp && (
              <button
                type="button"
                onClick={onShareApp}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-300" /> Indicar pra Galera
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sync Progress */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col items-center gap-2">
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

/* === CINEMA & ARENA PRE-ROLL VISUAL INTRO BEFORE CONTENT PLAYS === */
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
    const t2 = window.setTimeout(() => setPhase('out'), 1450);
    const t3 = window.setTimeout(() => onFinish(), 1850);
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
      <div
        className={`absolute inset-0 transition-transform duration-1000 ease-out ${
          phase === 'zoom' || phase === 'out' ? 'scale-125 opacity-90' : 'scale-90 opacity-40'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(225,29,72,0.38), transparent 65%), linear-gradient(90deg, transparent 15%, rgba(236,72,153,0.16) 35%, rgba(34,211,238,0.18) 50%, rgba(225,29,72,0.22) 65%, transparent 85%)',
        }}
      />

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
        <div className="font-logo text-3xl sm:text-5xl font-black tracking-[0.26em] text-white drop-shadow-[0_6px_32px_rgba(244,63,94,0.6)]">
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

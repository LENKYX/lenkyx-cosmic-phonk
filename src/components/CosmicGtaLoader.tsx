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

const MIRROR_SHARDS = [
  { clip: 'polygon(0% 0%, 50% 0%, 26% 24%)', tx: '-74px', ty: '-68px', tz: '80px', rx: '32deg', ry: '-42deg', rz: '-26deg', delay: 0 },
  { clip: 'polygon(50% 0%, 100% 0%, 74% 22%)', tx: '78px', ty: '-72px', tz: '65px', rx: '-28deg', ry: '44deg', rz: '24deg', delay: 40 },
  { clip: 'polygon(50% 0%, 74% 22%, 50% 50%, 26% 24%)', tx: '6px', ty: '-86px', tz: '110px', rx: '45deg', ry: '10deg', rz: '-14deg', delay: 80 },
  { clip: 'polygon(0% 0%, 26% 24%, 0% 50%)', tx: '-88px', ty: '-16px', tz: '55px', rx: '-22deg', ry: '-48deg', rz: '18deg', delay: 110 },
  { clip: 'polygon(0% 50%, 26% 24%, 50% 50%, 22% 76%)', tx: '-64px', ty: '14px', tz: '95px', rx: '18deg', ry: '-36deg', rz: '-18deg', delay: 145 },
  { clip: 'polygon(0% 50%, 22% 76%, 0% 100%)', tx: '-82px', ty: '68px', tz: '70px', rx: '-36deg', ry: '-34deg', rz: '28deg', delay: 180 },
  { clip: 'polygon(100% 0%, 100% 50%, 74% 22%)', tx: '92px', ty: '-22px', tz: '65px', rx: '26deg', ry: '48deg', rz: '-22deg', delay: 215 },
  { clip: 'polygon(74% 22%, 100% 50%, 78% 74%, 50% 50%)', tx: '66px', ty: '18px', tz: '105px', rx: '-24deg', ry: '38deg', rz: '16deg', delay: 250 },
  { clip: 'polygon(100% 50%, 100% 100%, 78% 74%)', tx: '84px', ty: '72px', tz: '60px', rx: '34deg', ry: '38deg', rz: '-30deg', delay: 285 },
  { clip: 'polygon(0% 100%, 22% 76%, 50% 100%)', tx: '-46px', ty: '88px', tz: '75px', rx: '-40deg', ry: '-22deg', rz: '20deg', delay: 320 },
  { clip: 'polygon(22% 76%, 50% 50%, 78% 74%, 50% 100%)', tx: '4px', ty: '92px', tz: '115px', rx: '-44deg', ry: '12deg', rz: '14deg', delay: 355 },
  { clip: 'polygon(78% 74%, 100% 100%, 50% 100%)', tx: '54px', ty: '84px', tz: '70px', rx: '36deg', ry: '26deg', rz: '-24deg', delay: 390 },
];

const ShatteredMirrorLogo: React.FC<{ sizeClass?: string }> = ({
  sizeClass = 'w-32 h-32 sm:w-36 sm:h-36',
}) => {
  const [mirrorPhase, setMirrorPhase] = useState<'shattered' | 'healing' | 'radiant'>('shattered');

  useEffect(() => {
    setMirrorPhase('shattered');
    const t1 = window.setTimeout(() => setMirrorPhase('healing'), 220);
    const t2 = window.setTimeout(() => setMirrorPhase('radiant'), 1580);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <div className="lenkyx-logo-float relative flex items-center justify-center" style={{ perspective: '900px' }}>
      {/* Realistic Iridescent Prism Aura */}
      <div
        className={`absolute -inset-9 rounded-full blur-3xl transition-all duration-1000 ${
          mirrorPhase === 'radiant'
            ? 'opacity-100 scale-110 bg-gradient-to-tr from-cyan-400/55 via-fuchsia-500/45 to-amber-300/45'
            : mirrorPhase === 'healing'
              ? 'opacity-80 scale-100 bg-gradient-to-tr from-cyan-400/40 via-purple-500/35 to-pink-500/40'
              : 'opacity-40 scale-90 bg-gradient-to-tr from-sky-400/25 via-white/20 to-pink-400/25'
        }`}
      />

      <div className={`relative ${sizeClass}`} style={{ transformStyle: 'preserve-3d' }}>
        {/* 12 Shattered Crystal Mirror Shards Regenerating Together */}
        {MIRROR_SHARDS.map((s, idx) => {
          const isAssembled = mirrorPhase !== 'shattered';
          return (
            <div
              key={idx}
              className="absolute inset-0 will-change-transform"
              style={{
                clipPath: s.clip,
                transform: isAssembled
                  ? 'translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)'
                  : `translate3d(${s.tx}, ${s.ty}, ${s.tz}) rotateX(${s.rx}) rotateY(${s.ry}) rotateZ(${s.rz}) scale(0.76)`,
                opacity: mirrorPhase === 'radiant' ? 0 : isAssembled ? 1 : 0.88,
                transition: `transform 980ms cubic-bezier(0.16, 1, 0.3, 1) ${s.delay}ms, opacity 420ms ease ${mirrorPhase === 'radiant' ? '0ms' : `${s.delay}ms`}`,
                filter:
                  mirrorPhase === 'healing'
                    ? 'drop-shadow(0 0 8px rgba(103, 232, 249, 0.85)) brightness(1.18)'
                    : 'drop-shadow(0 6px 14px rgba(255, 255, 255, 0.35)) contrast(1.12)',
              }}
            >
              <img
                src="/covers/icon-512.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain"
              />
            </div>
          );
        })}

        {/* Healing Luminous Crack Veins Overlay */}
        <svg
          viewBox="0 0 100 100"
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 ${
            mirrorPhase === 'healing' ? 'opacity-90' : 'opacity-0'
          }`}
        >
          <g stroke="url(#mirrorCrackGrad)" strokeWidth="0.9" fill="none" strokeLinecap="round">
            <path d="M50 0 L26 24 L0 50 M50 0 L74 22 L100 50 M26 24 L50 50 L74 22" />
            <path d="M0 50 L22 76 L50 100 M100 50 L78 74 L50 100 M22 76 L50 50 L78 74" />
            <path d="M0 0 L26 24 M100 0 L74 22 M0 100 L22 76 M100 100 L78 74" />
          </g>
          <defs>
            <linearGradient id="mirrorCrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Final Unified Radiant 3D Mirror Logo + Realistic Specular Reflection Sweep */}
        <div
          className={`relative w-full h-full rounded-[26%] overflow-hidden transition-all duration-500 ${
            mirrorPhase === 'radiant' ? 'opacity-100 scale-100 prism-glow-radiant' : 'opacity-0 scale-95'
          }`}
        >
          <img
            src="/covers/icon-512.png"
            alt="LENKYX Logo 3D"
            className="w-full h-full object-contain lenkyx-logo-3d"
          />
          <div
            className="absolute inset-y-0 w-1/2 pointer-events-none mirror-sheen-sweep"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 48%, rgba(103,232,249,0.45) 65%, transparent 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

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

      {/* Center Shattered-Mirror Self-Regenerating 3D Logo + Daily PIX Support Prompt */}
      <div className="relative z-10 flex flex-col items-center justify-center px-5 py-3 text-center space-y-4 my-auto">
        <div
          className={`relative transition-all duration-700 ease-out ${
            introPulse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <ShatteredMirrorLogo sizeClass="w-32 h-32 sm:w-36 sm:h-36" />
        </div>

        <div
          className={`space-y-2 transition-all duration-1000 delay-150 ${
            introPulse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="font-logo text-4xl sm:text-6xl font-black tracking-[0.22em] text-white drop-shadow-[0_6px_30px_rgba(236,72,153,0.55)]">
            LENKYX
          </h1>
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/45 text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-emerald-300">
            <span>✓ Oficial · 100% Seguro & Verificado</span>
            <span className="text-white/40">•</span>
            <span className="text-cyan-200">Android · iPhone · PC · TV</span>
          </div>
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
        <div className="mb-4">
          <ShatteredMirrorLogo sizeClass="w-24 h-24 sm:w-28 sm:h-28" />
        </div>
        <div className="text-[10px] sm:text-xs font-black tracking-[0.26em] uppercase text-emerald-300 mb-1">
          ✓ OFICIAL · 100% SEGURO & VERIFICADO · {subtitle}
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

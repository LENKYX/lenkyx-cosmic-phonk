import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, FastForward } from 'lucide-react';

const INTRO_HIGHLIGHTS = [
  {
    img: '/covers/icon-512.png',
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
  { clip: 'polygon(0% 0%, 50% 0%, 26% 24%)', tx: '-115px', ty: '-105px', tz: '140px', rx: '36deg', ry: '-46deg', rz: '-30deg', delayFast: 0, delaySlow: 0 },
  { clip: 'polygon(50% 0%, 100% 0%, 74% 22%)', tx: '120px', ty: '-110px', tz: '120px', rx: '-32deg', ry: '48deg', rz: '28deg', delayFast: 40, delaySlow: 240 },
  { clip: 'polygon(50% 0%, 74% 22%, 50% 50%, 26% 24%)', tx: '10px', ty: '-135px', tz: '170px', rx: '48deg', ry: '12deg', rz: '-16deg', delayFast: 80, delaySlow: 500 },
  { clip: 'polygon(0% 0%, 26% 24%, 0% 50%)', tx: '-140px', ty: '-24px', tz: '100px', rx: '-24deg', ry: '-52deg', rz: '20deg', delayFast: 110, delaySlow: 760 },
  { clip: 'polygon(0% 50%, 26% 24%, 50% 50%, 22% 76%)', tx: '-98px', ty: '20px', tz: '155px', rx: '20deg', ry: '-40deg', rz: '-22deg', delayFast: 145, delaySlow: 1020 },
  { clip: 'polygon(0% 50%, 22% 76%, 0% 100%)', tx: '-128px', ty: '105px', tz: '115px', rx: '-38deg', ry: '-36deg', rz: '32deg', delayFast: 180, delaySlow: 1280 },
  { clip: 'polygon(100% 0%, 100% 50%, 74% 22%)', tx: '142px', ty: '-32px', tz: '110px', rx: '28deg', ry: '52deg', rz: '-24deg', delayFast: 215, delaySlow: 1540 },
  { clip: 'polygon(74% 22%, 100% 50%, 78% 74%, 50% 50%)', tx: '104px', ty: '26px', tz: '165px', rx: '-26deg', ry: '42deg', rz: '18deg', delayFast: 250, delaySlow: 1800 },
  { clip: 'polygon(100% 50%, 100% 100%, 78% 74%)', tx: '130px', ty: '112px', tz: '105px', rx: '36deg', ry: '40deg', rz: '-34deg', delayFast: 285, delaySlow: 2060 },
  { clip: 'polygon(0% 100%, 22% 76%, 50% 100%)', tx: '-74px', ty: '136px', tz: '125px', rx: '-42deg', ry: '-26deg', rz: '24deg', delayFast: 320, delaySlow: 2320 },
  { clip: 'polygon(22% 76%, 50% 50%, 78% 74%, 50% 100%)', tx: '8px', ty: '142px', tz: '175px', rx: '-46deg', ry: '14deg', rz: '16deg', delayFast: 355, delaySlow: 2580 },
  { clip: 'polygon(78% 74%, 100% 100%, 50% 100%)', tx: '84px', ty: '130px', tz: '115px', rx: '38deg', ry: '28deg', rz: '-26deg', delayFast: 390, delaySlow: 2840 },
];

/* === 60FPS DEEP-SPACE GALAXY STARFIELD + SPIRAL NEBULA CANVAS === */
const GalaxyStarfieldCanvas: React.FC<{ warpBoost: boolean }> = ({ warpBoost }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const warpRef = useRef(warpBoost);
  warpRef.current = warpBoost;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const starPalette = ['#ffffff', '#a5f3fc', '#f0abfc', '#c4b5fd', '#7dd3fc', '#f9a8d4'];
    const stars = Array.from({ length: 220 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
      size: 0.7 + Math.random() * 1.9,
      color: starPalette[Math.floor(Math.random() * starPalette.length)],
      twinkle: Math.random() * Math.PI * 2,
    }));

    const shootingStars: { x: number; y: number; vx: number; vy: number; life: number; max: number }[] = [];
    let tick = 0;

    const render = () => {
      tick += 0.016;
      const cx = w * 0.5;
      const cy = h * 0.46;
      const speed = warpRef.current ? 0.014 : 0.0028;

      // Deep cosmos trail fade
      ctx.fillStyle = warpRef.current ? 'rgba(3, 0, 12, 0.28)' : 'rgba(3, 0, 12, 0.42)';
      ctx.fillRect(0, 0, w, h);

      // Subtle spiral galaxy arm dust
      for (let arm = 0; arm < 2; arm++) {
        for (let i = 0; i < 24; i++) {
          const angle = tick * 0.25 + arm * Math.PI + i * 0.28;
          const radius = 38 + i * Math.min(w, h) * 0.022;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius * 0.62;
          ctx.beginPath();
          ctx.arc(px, py, 14 + i * 1.6, 0, Math.PI * 2);
          ctx.fillStyle = arm === 0 ? 'rgba(139, 92, 246, 0.022)' : 'rgba(34, 211, 238, 0.018)';
          ctx.fill();
        }
      }

      // 3D Starfield projection
      for (const s of stars) {
        s.z -= speed;
        if (s.z <= 0.02) {
          s.x = (Math.random() - 0.5) * 2;
          s.y = (Math.random() - 0.5) * 2;
          s.z = 1;
        }
        const sx = cx + (s.x / s.z) * (w * 0.52);
        const sy = cy + (s.y / s.z) * (h * 0.52);
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

        const prevZ = Math.min(1, s.z + speed * (warpRef.current ? 3.5 : 1.8));
        const px = cx + (s.x / prevZ) * (w * 0.52);
        const py = cy + (s.y / prevZ) * (h * 0.52);
        const alpha = Math.min(1, (1 - s.z) * 1.2) * (0.65 + 0.35 * Math.sin(tick * 3 + s.twinkle));
        const r = Math.max(0.6, (1 - s.z) * s.size * 2.1);

        ctx.strokeStyle = s.color;
        ctx.globalAlpha = alpha * 0.7;
        ctx.lineWidth = r;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Occasional cosmic shooting star
      if (Math.random() < 0.022 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * w * 0.85,
          y: Math.random() * h * 0.45,
          vx: 8 + Math.random() * 8,
          vy: 3 + Math.random() * 4,
          life: 0,
          max: 28 + Math.random() * 18,
        });
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const st = shootingStars[i];
        st.x += st.vx;
        st.y += st.vy;
        st.life += 1;
        const a = 1 - st.life / st.max;
        const grad = ctx.createLinearGradient(st.x - st.vx * 5, st.y - st.vy * 5, st.x, st.y);
        grad.addColorStop(0, 'rgba(34,211,238,0)');
        grad.addColorStop(1, `rgba(255,255,255,${a * 0.9})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(st.x - st.vx * 5, st.y - st.vy * 5);
        ctx.lineTo(st.x, st.y);
        ctx.stroke();
        if (st.life >= st.max) shootingStars.splice(i, 1);
      }

      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" />;
};

/* === SHATTERED-MIRROR SELF-ASSEMBLING 3D LOGO === */
const ShatteredMirrorLogo: React.FC<{
  sizeClass?: string;
  durationMode?: 'fast' | 'netflix15';
}> = ({ sizeClass = 'w-44 h-44 sm:w-60 sm:h-60', durationMode = 'fast' }) => {
  const [mirrorPhase, setMirrorPhase] = useState<'shattered' | 'healing' | 'radiant'>('shattered');
  const [shockwave, setShockwave] = useState(false);

  useEffect(() => {
    setMirrorPhase('shattered');
    setShockwave(false);
    const tHeal = durationMode === 'netflix15' ? 2200 : 220;
    const tRadiant = durationMode === 'netflix15' ? 7100 : 1580;

    const t1 = window.setTimeout(() => setMirrorPhase('healing'), tHeal);
    const t2 = window.setTimeout(() => {
      setMirrorPhase('radiant');
      setShockwave(true);
    }, tRadiant);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [durationMode]);

  const glideDuration = durationMode === 'netflix15' ? 1950 : 980;
  const isSlow = durationMode === 'netflix15';

  return (
    <div className="lenkyx-logo-float relative flex items-center justify-center" style={{ perspective: '1100px' }}>
      {/* Galaxy Prism Aura */}
      <div
        className={`absolute -inset-14 rounded-full blur-3xl transition-all duration-1000 ${
          mirrorPhase === 'radiant'
            ? 'opacity-100 scale-125 bg-gradient-to-tr from-cyan-400/55 via-fuchsia-500/45 to-violet-500/50'
            : mirrorPhase === 'healing'
              ? 'opacity-80 scale-105 bg-gradient-to-tr from-cyan-400/35 via-purple-500/35 to-pink-500/40'
              : 'opacity-45 scale-90 bg-gradient-to-tr from-indigo-500/25 via-fuchsia-400/20 to-cyan-400/25'
        }`}
      />

      {/* Galaxy Shockwave Ring on Full Assembly */}
      {shockwave && (
        <div className="absolute inset-0 rounded-full border-2 border-cyan-300/80 shadow-[0_0_50px_rgba(34,211,238,0.85)] pointer-events-none galaxy-shockwave" />
      )}

      <div className={`relative ${sizeClass}`} style={{ transformStyle: 'preserve-3d' }}>
        {/* 12 Shattered Crystal Mirror Shards Assembling in 3D */}
        {MIRROR_SHARDS.map((s, idx) => {
          const isAssembled = mirrorPhase !== 'shattered';
          const delay = isSlow ? s.delaySlow : s.delayFast;
          return (
            <div
              key={idx}
              className="absolute inset-0 will-change-transform rounded-[24%] overflow-hidden"
              style={{
                clipPath: s.clip,
                transform: isAssembled
                  ? 'translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)'
                  : `translate3d(${s.tx}, ${s.ty}, ${s.tz}) rotateX(${s.rx}) rotateY(${s.ry}) rotateZ(${s.rz}) scale(0.72)`,
                opacity: mirrorPhase === 'radiant' ? 0 : isAssembled ? 1 : 0.9,
                transition: `transform ${glideDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 520ms ease ${mirrorPhase === 'radiant' ? '0ms' : `${delay}ms`}`,
                filter:
                  mirrorPhase === 'healing'
                    ? 'drop-shadow(0 0 12px rgba(103, 232, 249, 0.9)) brightness(1.2)'
                    : 'drop-shadow(0 10px 22px rgba(192, 132, 252, 0.5)) contrast(1.15)',
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

        {/* Healing Luminous Crack Veins Overlay (clipped to rounded emblem) */}
        <svg
          viewBox="0 0 100 100"
          className={`absolute inset-0 w-full h-full rounded-[24%] pointer-events-none transition-opacity duration-1000 ${
            mirrorPhase === 'healing' ? 'opacity-90' : 'opacity-0'
          }`}
        >
          <g stroke="url(#mirrorCrackGrad)" strokeWidth="0.85" fill="none" strokeLinecap="round">
            <path d="M50 6 L26 24 L6 50 M50 6 L74 22 L94 50 M26 24 L50 50 L74 22" />
            <path d="M6 50 L22 76 L50 94 M94 50 L78 74 L50 94 M22 76 L50 50 L78 74" />
            <path d="M12 12 L26 24 M88 12 L74 22 M12 88 L22 76 M88 88 L78 74" />
          </g>
          <defs>
            <linearGradient id="mirrorCrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Unified Radiant 3D Mirror Logo + Specular Reflection Sweep */}
        <div
          className={`relative w-full h-full rounded-[24%] overflow-hidden transition-all duration-700 ${
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
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 48%, rgba(103,232,249,0.5) 65%, transparent 100%)',
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
  onSkip,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPct, setAutoPct] = useState(20);

  // 15-Second Galaxy Netflix-Style Intro Phases
  const [showRibbons, setShowRibbons] = useState(false);
  const [showBrandTitle, setShowBrandTitle] = useState(false);
  const [warpOutro, setWarpOutro] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowRibbons(false);
    setShowBrandTitle(false);
    setWarpOutro(false);

    const tRibbon = window.setTimeout(() => setShowRibbons(true), 6900);
    const tTitle = window.setTimeout(() => setShowBrandTitle(true), 9200);
    const tWarp = window.setTimeout(() => setWarpOutro(true), 13700);

    const t = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % INTRO_HIGHLIGHTS.length);
    }, 3400);
    const p = window.setInterval(() => {
      setAutoPct((v) => (v >= 98 ? 98 : v + Math.max(3, Math.round((100 - v) * 0.16))));
    }, 150);

    return () => {
      window.clearTimeout(tRibbon);
      window.clearTimeout(tTitle);
      window.clearTimeout(tWarp);
      window.clearInterval(t);
      window.clearInterval(p);
    };
  }, [open]);

  if (!open) return null;

  const pct = typeof progress === 'number' ? Math.min(100, Math.max(0, Math.round(progress))) : autoPct;
  const current = INTRO_HIGHLIGHTS[slideIdx % INTRO_HIGHLIGHTS.length];

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

  // === PURE NETFLIX-STYLE 15-SECOND GALAXY LOGO OPENING ===
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#02000a] text-white overflow-hidden select-none flex flex-col items-center justify-center transition-all duration-[1100ms] ease-in ${
        warpOutro ? 'opacity-0 scale-125 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 60fps Deep-Space Starfield & Spiral Galaxy */}
      <GalaxyStarfieldCanvas warpBoost={warpOutro} />

      {/* Rotating Multi-Color Cosmic Nebula Core */}
      <div
        className="fixed left-1/2 top-[46%] w-[780px] h-[780px] sm:w-[1050px] sm:h-[1050px] rounded-full pointer-events-none blur-3xl opacity-75 galaxy-nebula-spin"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(168,85,247,0.28), rgba(34,211,238,0.16), rgba(236,72,153,0.28), rgba(59,130,246,0.14), rgba(168,85,247,0.28))',
        }}
      />

      {/* Orbital Gravitational Rings */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[340px] h-[340px] sm:w-[540px] sm:h-[540px] rounded-full border border-purple-400/20 lenkyx-aura-orbit"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 66%)',
          }}
        />
        <div className="absolute w-[250px] h-[250px] sm:w-[380px] sm:h-[380px] rounded-full border border-cyan-400/20" />
      </div>

      {/* Netflix-Style Vertical Cosmic Light Ribbons (appear as logo locks into place) */}
      <div
        className={`fixed inset-0 flex items-center justify-center gap-3 sm:gap-5 pointer-events-none transition-opacity duration-1000 ${
          showRibbons ? 'opacity-85' : 'opacity-0'
        }`}
      >
        <div className="w-2 sm:w-3 h-[78%] rounded-full bg-gradient-to-b from-transparent via-cyan-400/45 to-transparent blur-[2px] netflix-ribbon-glow" />
        <div className="w-5 sm:w-8 h-[92%] rounded-full bg-gradient-to-b from-transparent via-fuchsia-500/50 to-transparent blur-[4px] netflix-ribbon-glow" />
        <div className="w-2 sm:w-3 h-[78%] rounded-full bg-gradient-to-b from-transparent via-purple-400/45 to-transparent blur-[2px] netflix-ribbon-glow" />
      </div>

      {/* Whisper-quiet Netflix-style Skip Button */}
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30 px-3.5 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/20 border border-white/15 text-[11px] font-bold tracking-wider uppercase text-white/75 hover:text-white flex items-center gap-1.5 backdrop-blur-md transition"
        >
          <span>Pular Intro</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Center Stage: ONLY the Big Assembling Logo, then the App Name */}
      <div
        className={`relative z-20 flex flex-col items-center justify-center text-center px-6 transition-transform duration-[4500ms] ease-out ${
          showRibbons ? 'scale-105' : 'scale-95'
        }`}
      >
        <ShatteredMirrorLogo
          sizeClass="w-44 h-44 sm:w-64 sm:h-64"
          durationMode="netflix15"
        />

        {/* App Name Emerges AFTER Logo Pieces Finish Assembling */}
        <div className="mt-8 sm:mt-10 min-h-[72px] flex items-center justify-center">
          {showBrandTitle && (
            <h1
              className="font-logo text-4xl sm:text-7xl font-black uppercase bg-gradient-to-r from-cyan-200 via-white to-fuchsia-300 bg-clip-text text-transparent drop-shadow-[0_0_38px_rgba(236,72,153,0.75)] netflix-title-reveal"
            >
              LENKYX
            </h1>
          )}
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
          <ShatteredMirrorLogo sizeClass="w-24 h-24 sm:w-28 sm:h-28" durationMode="fast" />
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

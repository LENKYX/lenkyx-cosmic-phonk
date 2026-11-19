import React, { useEffect, useRef, useState } from 'react';
import { startGalaxyIntroSound } from '../utils/galaxyIntroAudio';

/* === 60FPS NASA / IMAX-GRADE REMASTERED BIG BANG EXPLOSION CANVAS === */
const BigBangExplosionCanvas: React.FC<{ phase: 'charge' | 'boom' | 'emerge' | 'out' }> = ({ phase }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      if (!canvas) return;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Deep background stars (subtle twinkling starfield before & after ignition)
    const bgStars = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 2.2,
    }));

    // Multi-depth 3D relativistic plasma ejecta & star-birth filaments
    const spectra = [
      [255, 255, 255],
      [186, 230, 253],
      [103, 232, 249],
      [253, 224, 71],
      [251, 146, 60],
      [244, 114, 182],
      [192, 132, 252],
    ];
    const ejecta = Array.from({ length: 520 }, (_, idx) => {
      const angle = Math.random() * Math.PI * 2;
      const depth = 0.25 + Math.random() * 1.65;
      const speed = (1.6 + Math.pow(Math.random(), 1.3) * 21) * depth;
      const rgb = spectra[idx % spectra.length];
      return {
        angle,
        spin: (Math.random() - 0.5) * 0.008,
        speed,
        dist: Math.random() * 10,
        depth,
        size: 0.8 + Math.random() * 2.6,
        rgb,
        decay: 0.968 + Math.random() * 0.022,
        isNebulaBlob: idx % 9 === 0,
      };
    });

    // Volumetric nebula cloud lobes expanding from the singularity
    const nebulaLobes = Array.from({ length: 18 }, (_, i) => ({
      angle: (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.35,
      dist: 0,
      speed: 1.8 + Math.random() * 3.8,
      radius: 45 + Math.random() * 90,
      rgb: spectra[(i + 2) % spectra.length],
      alpha: 0.14 + Math.random() * 0.14,
    }));

    let boomStartedAt = 0;
    let flashAlpha = 0;
    let shock1 = 0;
    let shock2 = 0;
    let shock3 = 0;
    let tick = 0;

    const render = () => {
      tick += 0.016;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxDim = Math.max(w, h);
      const p = phaseRef.current;

      // Deep space abyss with subtle trail persistence
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = p === 'boom' ? 'rgba(3, 1, 10, 0.22)' : 'rgba(3, 1, 10, 0.38)';
      ctx.fillRect(0, 0, w, h);

      // Subtle background starfield
      for (const st of bgStars) {
        const a = 0.18 + 0.35 * (0.5 + 0.5 * Math.sin(tick * st.speed + st.twinkle));
        ctx.fillStyle = `rgba(226, 232, 240, ${a})`;
        ctx.beginPath();
        ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'lighter';

      if (p === 'charge') {
        // Gravitational singularity + Einstein lensing ring pulling energy inward
        const collapse = Math.max(0.25, 1 - tick * 0.48);
        const coreR = (26 + Math.sin(tick * 28) * 5) * collapse + 8;

        const halo = ctx.createRadialGradient(cx, cy, 1, cx, cy, coreR * 6.5);
        halo.addColorStop(0, 'rgba(255, 255, 255, 1)');
        halo.addColorStop(0.14, 'rgba(186, 230, 253, 0.92)');
        halo.addColorStop(0.38, 'rgba(56, 189, 248, 0.45)');
        halo.addColorStop(0.7, 'rgba(192, 132, 252, 0.18)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Gravitational lensing ring
        ctx.strokeStyle = `rgba(125, 211, 252, ${0.55 + Math.sin(tick * 16) * 0.25})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 2.2, 0, Math.PI * 2);
        ctx.stroke();

        // Inward accretion streaks
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * Math.PI * 2 + tick * 2.1;
          const rOuter = (140 + (i % 3) * 40) * collapse;
          const rInner = coreR * 0.7;
          ctx.strokeStyle = 'rgba(165, 243, 252, 0.35)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * rOuter, cy + Math.sin(ang) * rOuter);
          ctx.lineTo(cx + Math.cos(ang + 0.18) * rInner, cy + Math.sin(ang + 0.18) * rInner);
          ctx.stroke();
        }
      } else {
        if (!boomStartedAt) {
          boomStartedAt = performance.now();
          flashAlpha = 1;
          shock1 = 10;
          shock2 = 5;
          shock3 = 2;
        }
        const elapsed = (performance.now() - boomStartedAt) / 1000;

        // Volumetric expanding plasma nebula lobes
        for (const lobe of nebulaLobes) {
          lobe.dist += lobe.speed;
          lobe.speed *= 0.985;
          lobe.radius += 0.75;
          const lx = cx + Math.cos(lobe.angle) * lobe.dist;
          const ly = cy + Math.sin(lobe.angle) * lobe.dist;
          const fade = Math.max(0.03, lobe.alpha * Math.max(0.25, 1 - elapsed / 6.5));
          const ng = ctx.createRadialGradient(lx, ly, 2, lx, ly, lobe.radius);
          ng.addColorStop(0, `rgba(${lobe.rgb[0]}, ${lobe.rgb[1]}, ${lobe.rgb[2]}, ${fade})`);
          ng.addColorStop(0.55, `rgba(${lobe.rgb[0]}, ${lobe.rgb[1]}, ${lobe.rgb[2]}, ${fade * 0.35})`);
          ng.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = ng;
          ctx.beginPath();
          ctx.arc(lx, ly, lobe.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Triple relativistic shockwaves (plasma shell + chromatic dispersion)
        shock1 += (maxDim * 0.95 - shock1) * 0.058 + 7.5;
        shock2 += (maxDim * 0.75 - shock2) * 0.044 + 5.2;
        shock3 += (maxDim * 0.55 - shock3) * 0.032 + 3.4;

        if (elapsed < 2.8) {
          const a1 = Math.max(0, 1 - elapsed / 2.6);
          const gRing = ctx.createRadialGradient(cx, cy, Math.max(1, shock1 - 24), cx, cy, shock1 + 24);
          gRing.addColorStop(0, 'rgba(0,0,0,0)');
          gRing.addColorStop(0.45, `rgba(103, 232, 249, ${a1 * 0.55})`);
          gRing.addColorStop(0.55, `rgba(255, 255, 255, ${a1 * 0.78})`);
          gRing.addColorStop(0.68, `rgba(244, 114, 182, ${a1 * 0.4})`);
          gRing.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gRing;
          ctx.beginPath();
          ctx.arc(cx, cy, shock1 + 24, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(251, 146, 60, ${a1 * 0.55})`;
          ctx.lineWidth = Math.max(1, 7 * a1);
          ctx.beginPath();
          ctx.arc(cx, cy, shock2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(192, 132, 252, ${a1 * 0.45})`;
          ctx.lineWidth = Math.max(1, 4 * a1);
          ctx.beginPath();
          ctx.arc(cx, cy, shock3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Anamorphic IMAX horizontal & vertical supernova flare
        const flareFade = Math.max(0.14, 1 - elapsed / 4.2);
        const flareW = maxDim * 0.78 * Math.min(1, elapsed * 2.2);
        const hFlare = ctx.createLinearGradient(cx - flareW, cy, cx + flareW, cy);
        hFlare.addColorStop(0, 'rgba(0,0,0,0)');
        hFlare.addColorStop(0.35, `rgba(56, 189, 248, ${flareFade * 0.25})`);
        hFlare.addColorStop(0.5, `rgba(255, 255, 255, ${flareFade * 0.72})`);
        hFlare.addColorStop(0.65, `rgba(244, 114, 182, ${flareFade * 0.25})`);
        hFlare.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hFlare;
        ctx.fillRect(cx - flareW, cy - 3.5, flareW * 2, 7);

        // 3D relativistic plasma ejecta & newborn stars
        for (const pt of ejecta) {
          pt.angle += pt.spin;
          pt.dist += pt.speed * pt.depth;
          pt.speed = Math.max(0.28, pt.speed * pt.decay);

          const x = cx + Math.cos(pt.angle) * pt.dist;
          const y = cy + Math.sin(pt.angle) * pt.dist;
          const tailLen = Math.min(48, pt.speed * 2.8);
          const px = cx + Math.cos(pt.angle) * Math.max(0, pt.dist - tailLen);
          const py = cy + Math.sin(pt.angle) * Math.max(0, pt.dist - tailLen);

          const alpha = Math.min(0.95, 0.25 + pt.speed / 11);
          ctx.strokeStyle = `rgba(${pt.rgb[0]}, ${pt.rgb[1]}, ${pt.rgb[2]}, ${alpha * 0.72})`;
          ctx.lineWidth = pt.size * 0.9;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();

          if (pt.isNebulaBlob) {
            const bg = ctx.createRadialGradient(x, y, 0.5, x, y, pt.size * 4.5);
            bg.addColorStop(0, `rgba(${pt.rgb[0]}, ${pt.rgb[1]}, ${pt.rgb[2]}, ${alpha * 0.55})`);
            bg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.arc(x, y, pt.size * 4.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, pt.size * 0.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Luminous Big Bang core glow behind the 3D Logo
        const coreGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.min(w, h) * 0.55);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        coreGrad.addColorStop(0.22, 'rgba(103, 232, 249, 0.28)');
        coreGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.16)');
        coreGrad.addColorStop(0.78, 'rgba(244, 114, 182, 0.08)');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.fillRect(0, 0, w, h);

        // Initial HDR Big Bang flash decay
        if (flashAlpha > 0.01) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgba(255, 253, 248, ${flashAlpha})`;
          ctx.fillRect(0, 0, w, h);
          flashAlpha *= 0.86;
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" />;
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

export const CosmicGtaLoader: React.FC<Props> = ({ open, mode = 'splash' }) => {
  const [phase, setPhase] = useState<'charge' | 'boom' | 'emerge' | 'out'>('charge');
  const soundCtrlRef = useRef<ReturnType<typeof startGalaxyIntroSound> | null>(null);

  useEffect(() => {
    if (!open || mode !== 'splash') return;
    setPhase('charge');

    const ctrl = startGalaxyIntroSound('netflix15');
    soundCtrlRef.current = ctrl;

    const handleUnlock = () => {
      void ctrl.unlock();
    };
    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock, { passive: true });

    const tBoom = window.setTimeout(() => setPhase('boom'), 1250);
    const tEmerge = window.setTimeout(() => setPhase('emerge'), 1950);
    const tOut = window.setTimeout(() => setPhase('out'), 7200);

    return () => {
      window.clearTimeout(tBoom);
      window.clearTimeout(tEmerge);
      window.clearTimeout(tOut);
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      ctrl.stop();
      soundCtrlRef.current = null;
    };
  }, [open, mode]);

  if (!open) return null;

  // === PURE REMASTERED BIG BANG + ONLY THE 3D LOGO (ZERO BUTTONS, ZERO CLUTTER) ===
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#03010a] text-white overflow-hidden select-none flex items-center justify-center transition-all duration-700 ${
        phase === 'out' ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <BigBangExplosionCanvas phase={phase} />

      {/* ONLY the 3D Logo emerging naturally from the Big Bang Core */}
      <div className="relative z-20 flex items-center justify-center pointer-events-none">
        <div
          className={`transition-all duration-[1600ms] ease-out ${
            phase === 'charge'
              ? 'scale-[0.04] opacity-0 blur-lg'
              : phase === 'boom'
                ? 'scale-110 opacity-95 brightness-150 drop-shadow-[0_0_110px_rgba(255,255,255,0.95)]'
                : 'scale-100 opacity-100 brightness-110 drop-shadow-[0_0_80px_rgba(56,189,248,0.85)]'
          }`}
        >
          <img
            src="/covers/icon-512.png?v=51"
            alt="LENKYX 3D"
            style={{
              WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 96%)',
              maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 96%)',
            }}
            className="w-52 h-52 sm:w-76 sm:h-76 object-contain lenkyx-logo-3d rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

/* === CINEMA PRE-ROLL (kept lightweight & non-intrusive) === */
export const CinemaPrerollIntro: React.FC<{
  open: boolean;
  title?: string;
  subtitle?: string;
  onFinish: () => void;
}> = ({ open, onFinish }) => {
  useEffect(() => {
    if (open) onFinish();
  }, [open, onFinish]);
  return null;
};

import React, { useEffect, useRef, useState } from 'react';
import { FastForward, Volume2, VolumeX } from 'lucide-react';
import { startGalaxyIntroSound } from '../utils/galaxyIntroAudio';

/* === 60FPS REALISTIC BIG BANG EXPLOSION + 3D SPACE PARTICLES CANVAS === */
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
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const palette = ['#ffffff', '#fef08a', '#67e8f9', '#f472b6', '#c084fc', '#38bdf8', '#fb923c'];
    const particles = Array.from({ length: 420 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 19;
      return {
        angle,
        speed,
        dist: Math.random() * 22,
        z: 0.4 + Math.random() * 1.4,
        size: 1.0 + Math.random() * 3.0,
        color: palette[Math.floor(Math.random() * palette.length)],
        decay: 0.965 + Math.random() * 0.025,
      };
    });

    let boomStartedAt = 0;
    let flashAlpha = 0;
    let ringRadius = 0;
    let ring2Radius = 0;
    let tick = 0;

    const render = () => {
      tick += 0.016;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const p = phaseRef.current;

      ctx.fillStyle = p === 'boom' ? 'rgba(6, 2, 18, 0.24)' : 'rgba(6, 2, 18, 0.36)';
      ctx.fillRect(0, 0, w, h);

      if (p === 'charge') {
        // Gravitational singularity pulsing & pulling light inward
        const pulse = 18 + Math.sin(tick * 24) * 6;
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, pulse * 5);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(103, 232, 249, 0.9)');
        grad.addColorStop(0.6, 'rgba(236, 72, 153, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, pulse * 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        if (!boomStartedAt) {
          boomStartedAt = performance.now();
          flashAlpha = 0.98;
          ringRadius = 8;
          ring2Radius = 4;
        }

        // Expanding relativistic plasma shockwave rings
        ringRadius += (Math.max(w, h) * 0.85 - ringRadius) * 0.065 + 7;
        ring2Radius += (Math.max(w, h) * 0.65 - ring2Radius) * 0.045 + 4;
        const elapsedBoom = (performance.now() - boomStartedAt) / 1000;

        if (elapsedBoom < 2.2) {
          const rAlpha = Math.max(0, 1 - elapsedBoom / 2.2);
          ctx.strokeStyle = `rgba(103, 232, 249, ${rAlpha * 0.85})`;
          ctx.lineWidth = Math.max(1.5, 14 * rAlpha);
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(244, 114, 182, ${rAlpha * 0.7})`;
          ctx.lineWidth = Math.max(1, 9 * rAlpha);
          ctx.beginPath();
          ctx.arc(cx, cy, ring2Radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 3D Explosion Debris & Cosmic Nebula Sparks
        for (const pt of particles) {
          pt.dist += pt.speed * pt.z;
          pt.speed = Math.max(0.35, pt.speed * pt.decay);
          const x = cx + Math.cos(pt.angle) * pt.dist;
          const y = cy + Math.sin(pt.angle) * pt.dist;
          const prevX = cx + Math.cos(pt.angle) * Math.max(0, pt.dist - pt.speed * 2.6);
          const prevY = cy + Math.sin(pt.angle) * Math.max(0, pt.dist - pt.speed * 2.6);

          ctx.strokeStyle = pt.color;
          ctx.globalAlpha = Math.min(1, 0.35 + pt.speed / 12);
          ctx.lineWidth = pt.size;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, pt.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Luminous Big Bang core glow behind the 3D Logo
        const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(w, h) * 0.52);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
        coreGrad.addColorStop(0.28, 'rgba(56, 189, 248, 0.25)');
        coreGrad.addColorStop(0.62, 'rgba(236, 72, 153, 0.16)');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.fillRect(0, 0, w, h);

        // Initial blinding Big Bang white flash decay
        if (flashAlpha > 0.01) {
          ctx.fillStyle = `rgba(255, 252, 245, ${flashAlpha})`;
          ctx.fillRect(0, 0, w, h);
          flashAlpha *= 0.87;
        }
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

export const CosmicGtaLoader: React.FC<Props> = ({ open, mode = 'splash', onSkip }) => {
  const [phase, setPhase] = useState<'charge' | 'boom' | 'emerge' | 'out'>('charge');
  const [soundLocked, setSoundLocked] = useState(false);
  const soundCtrlRef = useRef<ReturnType<typeof startGalaxyIntroSound> | null>(null);

  useEffect(() => {
    if (!open || mode !== 'splash') return;
    setPhase('charge');

    const ctrl = startGalaxyIntroSound('netflix15');
    soundCtrlRef.current = ctrl;
    const checkTimer = window.setTimeout(() => {
      setSoundLocked(ctrl.isMutedOrLocked());
    }, 220);

    const handleUnlock = () => {
      void ctrl.unlock().then((ok) => {
        if (ok) setSoundLocked(false);
      });
    };
    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock, { passive: true });

    const tBoom = window.setTimeout(() => setPhase('boom'), 1350);
    const tEmerge = window.setTimeout(() => setPhase('emerge'), 2050);
    const tOut = window.setTimeout(() => setPhase('out'), 7300);

    return () => {
      window.clearTimeout(checkTimer);
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

  // === PURE REALISTIC BIG BANG + ONLY THE 3D LOGO ===
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#060212] text-white overflow-hidden select-none flex items-center justify-center transition-all duration-700 ${
        phase === 'out' ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <BigBangExplosionCanvas phase={phase} />

      {/* Minimal Sound Unlock Pill */}
      <button
        type="button"
        onClick={() => {
          void soundCtrlRef.current?.unlock().then((ok) => {
            if (ok) setSoundLocked(false);
          });
        }}
        className={`fixed top-4 left-4 z-30 w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-md transition ${
          soundLocked
            ? 'bg-pink-500/35 border-pink-400 text-white animate-pulse'
            : 'bg-white/10 border-white/20 text-cyan-200 hover:bg-white/20'
        }`}
        title={soundLocked ? 'Ativar Som' : 'Som Ativo'}
      >
        {soundLocked ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Minimal Skip Button */}
      {onSkip && (
        <button
          type="button"
          onClick={() => {
            soundCtrlRef.current?.stop();
            onSkip();
          }}
          className="fixed top-4 right-4 z-30 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-xs font-black text-white flex items-center gap-1.5 backdrop-blur-md transition"
        >
          <span>Pular</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ONLY the 3D Logo emerging realistically from the Big Bang Explosion */}
      <div className="relative z-20 flex items-center justify-center pointer-events-none">
        <div
          className={`transition-all duration-[1600ms] ease-out ${
            phase === 'charge'
              ? 'scale-[0.06] opacity-0 blur-md'
              : phase === 'boom'
                ? 'scale-110 opacity-95 brightness-150 drop-shadow-[0_0_95px_rgba(255,255,255,0.95)]'
                : 'scale-100 opacity-100 brightness-110 drop-shadow-[0_0_70px_rgba(56,189,248,0.8)]'
          }`}
        >
          <img
            src="/covers/icon-512.png?v=44"
            alt="LENKYX 3D"
            className="w-48 h-48 sm:w-72 sm:h-72 object-contain lenkyx-logo-3d"
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

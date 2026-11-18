import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  hue: number;
}

export const CosmicSpaceBackdrop: React.FC<{ intense?: boolean; paused?: boolean }> = ({
  intense = false,
  paused: propPaused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (propPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let paused = propPaused || document.hidden || Boolean(document.fullscreenElement);

    const starCount = intense ? 220 : 150;
    const depth = 1000;
    const stars: Star[] = [];

    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let parallaxX = 0;
    let parallaxY = 0;

    const resetStar = (s: Star, randomZ = false) => {
      s.x = (Math.random() - 0.5) * width * 2.2;
      s.y = (Math.random() - 0.5) * height * 2.2;
      s.z = randomZ ? Math.random() * depth + 40 : depth;
      s.pz = s.z;
      const roll = Math.random();
      s.hue = roll < 0.2 ? 328 : roll < 0.42 ? 195 : roll < 0.6 ? 270 : 0;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stars.length === 0) {
        for (let i = 0; i < starCount; i++) {
          const s: Star = { x: 0, y: 0, z: 0, pz: 0, hue: 0 };
          resetStar(s, true);
          stars.push(s);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, width) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, height) - 0.5) * 2;
      targetParallaxX = nx * 24;
      targetParallaxY = ny * 24;
    };

    const onVisibility = () => {
      paused = propPaused || document.hidden || Boolean(document.fullscreenElement);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onVisibility);

    const speed = intense ? 2.4 : 1.35;

    const render = () => {
      if (!paused) {
        parallaxX += (targetParallaxX - parallaxX) * 0.05;
        parallaxY += (targetParallaxY - parallaxY) * 0.05;

        if (orbLayerRef.current) {
          orbLayerRef.current.style.transform = `translate3d(${-parallaxX * 0.7}px, ${-parallaxY * 0.7}px, 0)`;
        }

        ctx.clearRect(0, 0, width, height);
        const cx = width * 0.5 + parallaxX;
        const cy = height * 0.5 + parallaxY;

        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.pz = s.z;
          s.z -= speed;
          if (s.z <= 8) {
            resetStar(s, false);
            continue;
          }

          const k = 320 / s.z;
          const px = cx + s.x * k;
          const py = cy + s.y * k;

          if (px < -40 || px > width + 40 || py < -40 || py > height + 40) {
            resetStar(s, false);
            continue;
          }

          const pk = 320 / s.pz;
          const prevX = cx + s.x * pk;
          const prevY = cy + s.y * pk;

          const alpha = Math.min(1, (1 - s.z / depth) * 1.15);
          const radius = Math.max(0.6, (1 - s.z / depth) * (intense ? 2.8 : 2.2));

          ctx.strokeStyle =
            s.hue === 0
              ? `rgba(255,255,255,${alpha * 0.6})`
              : `hsla(${s.hue}, 92%, 72%, ${alpha * 0.7})`;
          ctx.lineWidth = radius * 0.85;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(px, py);
          ctx.stroke();

          ctx.fillStyle =
            s.hue === 0 ? `rgba(255,255,255,${alpha})` : `hsla(${s.hue}, 95%, 78%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onVisibility);
    };
  }, [intense, propPaused]);

  if (propPaused) {
    return <div className="fixed inset-0 pointer-events-none z-0 bg-[#04010c]" />;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#04010c]">
      {/* Deep Nebula Gradient Base */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 15% 15%, rgba(236,72,153,0.18), transparent 60%), radial-gradient(ellipse 75% 55% at 85% 22%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(ellipse 70% 60% at 50% 88%, rgba(139,92,246,0.22), transparent 65%)',
        }}
      />

      {/* 3D Floating Planets & Orbital Rings Layer (Parallax Responsive) */}
      <div ref={orbLayerRef} className="absolute inset-0 transition-transform duration-300 ease-out">
        {/* Floating Ringed Planet Top-Right */}
        <div className="cosmic-float-slow absolute -top-12 right-[6%] sm:right-[12%] w-48 h-48 sm:w-64 sm:h-64 opacity-55">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-500/35 via-purple-600/30 to-indigo-950/80 blur-[1px] shadow-[inset_-20px_-24px_45px_rgba(4,1,12,0.9),0_0_65px_rgba(236,72,153,0.28)]" />
          <div
            className="absolute inset-[-18%] rounded-full border border-cyan-300/35"
            style={{ transform: 'rotateX(72deg) rotateY(-18deg)' }}
          />
          <div
            className="absolute inset-[-28%] rounded-full border border-pink-400/20"
            style={{ transform: 'rotateX(72deg) rotateY(-18deg)' }}
          />
        </div>

        {/* Glowing Cyan Moon Bottom-Left */}
        <div className="cosmic-float-med absolute bottom-[12%] -left-16 sm:left-[4%] w-40 h-40 sm:w-56 sm:h-56 opacity-45">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400/35 via-blue-600/20 to-transparent blur-[2px] shadow-[inset_12px_-16px_38px_rgba(4,1,12,0.88),0_0_70px_rgba(56,189,248,0.26)]" />
        </div>

        {/* Distant Violet Nebula Halo */}
        <div className="cosmic-float-slow absolute top-[45%] left-[52%] -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-purple-600/10 blur-[110px]" />
      </div>

      {/* 3D Z-Depth Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

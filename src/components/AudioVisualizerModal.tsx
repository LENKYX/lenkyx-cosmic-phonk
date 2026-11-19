import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Flame,
  Droplets,
  Wind,
  Mountain,
  Sparkles,
  Shuffle,
} from 'lucide-react';
import { Track } from '../types';

export type VisualizerThemeId =
  | 'galaxy_spectrum'
  | 'galaxy_portal'
  | 'fire_solar'
  | 'fire_lava'
  | 'fire_embers'
  | 'water_ocean'
  | 'water_rain'
  | 'water_storm'
  | 'wind_aurora'
  | 'wind_tornado'
  | 'wind_petals'
  | 'earth_crystals'
  | 'earth_forest'
  | 'earth_dunes';

interface ThemeDef {
  id: VisualizerThemeId;
  label: string;
  element: 'galaxy' | 'fire' | 'water' | 'wind' | 'earth';
  accent: string;
}

const THEMES: ThemeDef[] = [
  { id: 'galaxy_spectrum', label: 'Galáxia Neon', element: 'galaxy', accent: '#38bdf8' },
  { id: 'galaxy_portal', label: 'Portal 3D', element: 'galaxy', accent: '#ec4899' },
  { id: 'fire_solar', label: 'Chama Solar', element: 'fire', accent: '#f97316' },
  { id: 'fire_lava', label: 'Lava Vulcânica', element: 'fire', accent: '#ef4444' },
  { id: 'fire_embers', label: 'Brasas Vivas', element: 'fire', accent: '#fb923c' },
  { id: 'water_ocean', label: 'Ondas Oceano', element: 'water', accent: '#06b6d4' },
  { id: 'water_rain', label: 'Chuva Neon', element: 'water', accent: '#3b82f6' },
  { id: 'water_storm', label: 'Tempestade', element: 'water', accent: '#60a5fa' },
  { id: 'wind_aurora', label: 'Aurora Boreal', element: 'wind', accent: '#34d399' },
  { id: 'wind_tornado', label: 'Vórtice Vento', element: 'wind', accent: '#a7f3d0' },
  { id: 'wind_petals', label: 'Brisa Cósmica', element: 'wind', accent: '#f472b6' },
  { id: 'earth_crystals', label: 'Cristais Terra', element: 'earth', accent: '#a855f7' },
  { id: 'earth_forest', label: 'Floresta Luz', element: 'earth', accent: '#4ade80' },
  { id: 'earth_dunes', label: 'Dunas Douradas', element: 'earth', accent: '#facc15' },
];

const ELEMENTS: { id: ThemeDef['element']; label: string; icon: React.ReactNode }[] = [
  { id: 'galaxy', label: 'Galáxia', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'fire', label: 'Fogo', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'water', label: 'Água', icon: <Droplets className="w-3.5 h-3.5" /> },
  { id: 'wind', label: 'Vento', icon: <Wind className="w-3.5 h-3.5" /> },
  { id: 'earth', label: 'Terra', icon: <Mountain className="w-3.5 h-3.5" /> },
];

interface Props {
  open: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  seed: number;
}

export const AudioVisualizerModal: React.FC<Props> = ({
  open,
  onClose,
  track,
  isPlaying,
  analyser,
  onTogglePlay,
  onPrev,
  onNext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [themeId, setThemeId] = useState<VisualizerThemeId>('wind_aurora');
  const [autoCycle, setAutoCycle] = useState(true);
  const [activeElement, setActiveElement] = useState<ThemeDef['element'] | 'all'>('all');

  const themeRef = useRef<VisualizerThemeId>(themeId);
  themeRef.current = themeId;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const analyserRef = useRef(analyser);
  analyserRef.current = analyser;
  const pointerRef = useRef<{ x: number; y: number; active: boolean; speed: number }>({
    x: 0.5,
    y: 0.5,
    active: false,
    speed: 0,
  });

  // Auto-cycle smoothly across themes & colors while music plays
  useEffect(() => {
    if (!open || !autoCycle || !isPlaying) return;
    const pool =
      activeElement === 'all' ? THEMES : THEMES.filter((t) => t.element === activeElement);
    if (pool.length <= 1) return;
    const timer = window.setInterval(() => {
      setThemeId((cur) => {
        const idx = pool.findIndex((t) => t.id === cur);
        return pool[(idx + 1) % pool.length].id;
      });
    }, 9000);
    return () => window.clearInterval(timer);
  }, [open, autoCycle, isPlaying, activeElement]);

  // Main Fullscreen 60fps Audio-Reactive & Interactive Canvas Engine
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    let hueShift = 0;
    const freqData = new Uint8Array(64);
    const particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spawn = (x: number, y: number, vx: number, vy: number, size: number, hue: number, maxLife = 80) => {
      if (particles.length > 260) particles.shift();
      particles.push({ x, y, vx, vy, size, life: 0, maxLife, hue, seed: Math.random() * 10 });
    };

    const render = () => {
      raf = requestAnimationFrame(render);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const playing = isPlayingRef.current;
      const mode = themeRef.current;

      // Sample real audio frequencies or dynamic beat envelope
      let bass = 0;
      let mid = 0;
      let treble = 0;
      const an = analyserRef.current;
      if (an && playing) {
        an.getByteFrequencyData(freqData);
        for (let i = 0; i < 8; i++) bass += freqData[i];
        for (let i = 8; i < 24; i++) mid += freqData[i];
        for (let i = 24; i < 48; i++) treble += freqData[i];
        bass /= 8 * 255;
        mid /= 16 * 255;
        treble /= 24 * 255;
      }

      // Fallback energetic beat synthesis if external stream (e.g. YouTube iframe) lacks CORS AudioContext access
      if (playing && bass < 0.03) {
        const beat = Math.pow(Math.abs(Math.sin(phase * 2.1)), 3);
        bass = 0.25 + beat * 0.65;
        mid = 0.2 + Math.abs(Math.sin(phase * 1.4 + 1)) * 0.5;
        treble = 0.15 + Math.abs(Math.cos(phase * 3.2)) * 0.45;
        for (let i = 0; i < 64; i++) {
          const wave = Math.abs(Math.sin(phase * 2.4 + i * 0.35)) * Math.abs(Math.cos(phase * 0.9 - i * 0.12));
          freqData[i] = Math.min(255, Math.floor((0.25 + wave * 0.75) * 240));
        }
      } else if (!playing) {
        bass *= 0.9;
        mid *= 0.9;
        treble *= 0.9;
      }

      phase += playing ? 0.035 + bass * 0.05 : 0.008;
      hueShift = (hueShift + (playing ? 0.5 + bass * 1.6 : 0.1)) % 360;

      // Motion-blur trail clear
      ctx.fillStyle = mode.startsWith('fire')
        ? 'rgba(14, 4, 2, 0.22)'
        : mode.startsWith('water')
          ? 'rgba(2, 10, 24, 0.2)'
          : mode.startsWith('wind')
            ? 'rgba(4, 14, 18, 0.2)'
            : mode.startsWith('earth')
              ? 'rgba(10, 8, 18, 0.22)'
              : 'rgba(6, 3, 18, 0.22)';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Pointer interactive bursts
      if (pointerRef.current.active) {
        const px = pointerRef.current.x * w;
        const py = pointerRef.current.y * h;
        const baseHue = mode.startsWith('fire')
          ? 18
          : mode.startsWith('water')
            ? 198
            : mode.startsWith('wind')
              ? 155
              : mode.startsWith('earth')
                ? 48
                : hueShift;
        for (let k = 0; k < 3; k++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 1.5 + Math.random() * 3.5 + bass * 4;
          spawn(px, py, Math.cos(ang) * spd, Math.sin(ang) * spd, 2.5 + bass * 5, baseHue + Math.random() * 40, 55);
        }
      }

      // === RENDER ELEMENT-SPECIFIC AUDIO-REACTIVE ART ===
      if (mode === 'fire_solar' || mode === 'fire_lava' || mode === 'fire_embers') {
        // Rising flame tongues + ember particles
        const count = mode === 'fire_embers' ? 4 : 3;
        for (let i = 0; i < count + Math.floor(bass * 6); i++) {
          const sx = mode === 'fire_solar' ? cx + (Math.random() - 0.5) * 180 : Math.random() * w;
          const sy = mode === 'fire_solar' ? cy + (Math.random() - 0.5) * 120 : h + 10;
          const hue = mode === 'fire_lava' ? (Math.random() * 25) : 10 + Math.random() * 35;
          spawn(
            sx,
            sy,
            (Math.random() - 0.5) * (1.8 + mid * 3),
            -(2.2 + Math.random() * 4 + bass * 7),
            3 + Math.random() * 6 + bass * 6,
            hue,
            70 + Math.random() * 40
          );
        }
        // Flame wave ribbons at bottom
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 24) {
            const idx = Math.floor((x / w) * 48) % 64;
            const amp = (freqData[idx] / 255) * (120 + layer * 45) * (0.6 + bass);
            const y = h - 40 - layer * 35 - amp - Math.sin(x * 0.015 + phase * (2 + layer)) * 25;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          const g = ctx.createLinearGradient(0, h - 260, 0, h);
          g.addColorStop(0, `hsla(${15 + layer * 14}, 100%, 58%, ${0.28 + bass * 0.25})`);
          g.addColorStop(1, 'hsla(0, 90%, 25%, 0.05)');
          ctx.fillStyle = g;
          ctx.fill();
        }
      } else if (mode === 'water_ocean' || mode === 'water_rain' || mode === 'water_storm') {
        if (mode === 'water_rain' || mode === 'water_storm') {
          for (let i = 0; i < 4 + Math.floor(treble * 8); i++) {
            spawn(
              Math.random() * w,
              -10,
              -1.5 - mid * 2,
              9 + Math.random() * 8 + bass * 8,
              1.6 + Math.random() * 2,
              195 + Math.random() * 30,
              65
            );
          }
          if (mode === 'water_storm' && bass > 0.72 && Math.random() > 0.72) {
            // Lightning bolt flash!
            ctx.save();
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            let lx = Math.random() * w;
            let ly = 0;
            ctx.moveTo(lx, ly);
            while (ly < h * 0.65) {
              lx += (Math.random() - 0.5) * 70;
              ly += 28 + Math.random() * 35;
              ctx.lineTo(lx, ly);
            }
            ctx.stroke();
            ctx.restore();
          }
        }
        // Flowing bioluminescent ocean waves
        for (let layer = 0; layer < 4; layer++) {
          ctx.beginPath();
          ctx.moveTo(0, h);
          const baseY = h * (0.48 + layer * 0.11);
          for (let x = 0; x <= w; x += 18) {
            const fIdx = Math.floor((x / w) * 40) % 64;
            const fBoost = (freqData[fIdx] / 255) * (65 + bass * 65);
            const y =
              baseY +
              Math.sin(x * 0.008 + phase * (1.5 + layer * 0.4) + layer) * (24 + mid * 45) -
              fBoost * 0.45;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          const wg = ctx.createLinearGradient(0, baseY - 60, 0, h);
          wg.addColorStop(0, `hsla(${188 + layer * 10 + (hueShift % 20)}, 92%, 58%, ${0.26 + bass * 0.2})`);
          wg.addColorStop(1, 'hsla(215, 85%, 18%, 0.08)');
          ctx.fillStyle = wg;
          ctx.fill();
        }
      } else if (mode === 'wind_aurora' || mode === 'wind_tornado' || mode === 'wind_petals') {
        if (mode === 'wind_aurora') {
          // Flowing northern lights curtains
          for (let c = 0; c < 4; c++) {
            ctx.beginPath();
            for (let x = 0; x <= w; x += 22) {
              const fIdx = Math.floor((x / w) * 50) % 64;
              const amp = (freqData[fIdx] / 255) * (95 + bass * 90);
              const y =
                h * (0.28 + c * 0.12) +
                Math.sin(x * 0.006 + phase * (1.2 + c * 0.3)) * 55 -
                amp * 0.6;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `hsla(${(145 + c * 35 + hueShift * 0.4) % 360}, 95%, 64%, ${0.35 + bass * 0.35})`;
            ctx.lineWidth = 14 + bass * 22;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        } else if (mode === 'wind_tornado') {
          for (let ring = 0; ring < 14; ring++) {
            const y = h * 0.15 + (ring / 14) * h * 0.72;
            const r = (35 + ring * 22) * (0.75 + bass * 0.6);
            ctx.beginPath();
            ctx.ellipse(
              cx + Math.sin(phase * 2 + ring * 0.5) * (35 + mid * 45),
              y,
              r,
              r * 0.25,
              Math.sin(phase + ring * 0.2) * 0.2,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `hsla(${(165 + ring * 10 + hueShift * 0.5) % 360}, 90%, 66%, ${0.35 + bass * 0.35})`;
            ctx.lineWidth = 2.5 + bass * 3;
            ctx.stroke();
          }
        } else {
          for (let i = 0; i < 3 + Math.floor(mid * 5); i++) {
            spawn(
              -10,
              Math.random() * h,
              3.5 + Math.random() * 4 + bass * 6,
              (Math.random() - 0.5) * 2.5,
              4 + Math.random() * 5,
              310 + Math.random() * 60,
              95
            );
          }
        }
      } else if (mode === 'earth_crystals' || mode === 'earth_forest' || mode === 'earth_dunes') {
        if (mode === 'earth_crystals') {
          // Geometric rotating crystal ring reacting to bass
          const shards = 24;
          for (let i = 0; i < shards; i++) {
            const ang = (i / shards) * Math.PI * 2 + phase * 0.35;
            const amp = (freqData[i % 48] / 255) * (110 + bass * 110);
            const r1 = 80 + bass * 40;
            const r2 = r1 + 35 + amp;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(ang - 0.08) * r1, cy + Math.sin(ang - 0.08) * r1);
            ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
            ctx.lineTo(cx + Math.cos(ang + 0.08) * r1, cy + Math.sin(ang + 0.08) * r1);
            ctx.closePath();
            ctx.fillStyle = `hsla(${(265 + i * 8 + hueShift * 0.3) % 360}, 88%, 64%, 0.55)`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else if (mode === 'earth_forest') {
          for (let i = 0; i < 2 + Math.floor(treble * 5); i++) {
            spawn(
              Math.random() * w,
              h - Math.random() * h * 0.5,
              (Math.random() - 0.5) * 1.4,
              -0.8 - Math.random() * 2 - bass * 2,
              3 + Math.random() * 5 + bass * 4,
              110 + Math.random() * 55,
              90
            );
          }
          // Glowing forest hills
          for (let l = 0; l < 3; l++) {
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let x = 0; x <= w; x += 28) {
              const f = (freqData[Math.floor((x / w) * 32)] / 255) * 55;
              const y = h * (0.62 + l * 0.1) - Math.sin(x * 0.005 + l * 2 + phase * 0.3) * 45 - f * bass;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fillStyle = `hsla(${135 + l * 15}, 75%, ${36 - l * 7}%, 0.38)`;
            ctx.fill();
          }
        } else {
          // Golden desert dunes undulating to bass
          for (let l = 0; l < 4; l++) {
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let x = 0; x <= w; x += 24) {
              const f = (freqData[Math.floor((x / w) * 40)] / 255) * 65 * (0.5 + bass);
              const y = h * (0.52 + l * 0.11) + Math.sin(x * 0.007 - phase * 0.7 + l) * 35 - f;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fillStyle = `hsla(${36 + l * 6}, 90%, ${55 - l * 9}%, 0.34)`;
            ctx.fill();
          }
        }
      } else {
        // Galaxy Spectrum / Portal 3D
        const bars = 48;
        const baseRadius = Math.min(w, h) * 0.17 + bass * 38;
        for (let i = 0; i < bars; i++) {
          const ang = (i / bars) * Math.PI * 2 + (mode === 'galaxy_portal' ? phase * 0.6 : 0);
          const mag = (freqData[i % 64] / 255) * (95 + bass * 130);
          const x1 = cx + Math.cos(ang) * baseRadius;
          const y1 = cy + Math.sin(ang) * baseRadius;
          const x2 = cx + Math.cos(ang) * (baseRadius + 16 + mag);
          const y2 = cy + Math.sin(ang) * (baseRadius + 16 + mag);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsla(${(hueShift + i * 6) % 360}, 95%, 64%, 0.9)`;
          ctx.lineWidth = Math.max(3, (w / 220) * (mode === 'galaxy_portal' ? 1.2 : 1));
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${(hueShift + 180) % 360}, 95%, 65%, ${0.35 + bass * 0.5})`;
        ctx.lineWidth = 3 + bass * 4;
        ctx.stroke();
      }

      // Update & draw all active particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(p.hue + hueShift * 0.25) % 360}, 95%, 64%, ${alpha * 0.88})`;
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  if (!open) return null;

  const visibleThemes =
    activeElement === 'all' ? THEMES : THEMES.filter((t) => t.element === activeElement);

  return createPortal(
    <div className="fixed inset-0 z-[9995] bg-[#04020e] flex flex-col justify-between overflow-hidden select-none">
      {/* Interactive Fullscreen Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={(e) => {
          pointerRef.current = {
            x: e.clientX / Math.max(1, window.innerWidth),
            y: e.clientY / Math.max(1, window.innerHeight),
            active: true,
            speed: 1,
          };
        }}
        onPointerDown={(e) => {
          pointerRef.current = {
            x: e.clientX / Math.max(1, window.innerWidth),
            y: e.clientY / Math.max(1, window.innerHeight),
            active: true,
            speed: 1.5,
          };
        }}
        onPointerUp={() => {
          pointerRef.current.active = false;
        }}
        onPointerLeave={() => {
          pointerRef.current.active = false;
        }}
        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
      />

      {/* Top Clean Controls */}
      <div className="relative z-10 p-3 sm:p-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {track && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 min-w-0">
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate max-w-[160px] sm:max-w-[260px]">
                  {track.title}
                </div>
                <div className="text-[10px] text-cyan-200/80 truncate">{track.artist}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAutoCycle((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border backdrop-blur-md transition ${
              autoCycle
                ? 'bg-emerald-400/25 border-emerald-400/60 text-emerald-200'
                : 'bg-black/45 border-white/15 text-slate-200'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{autoCycle ? 'Auto Cores: ON' : 'Auto Cores'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-black/55 hover:bg-rose-500/80 backdrop-blur-md border border-white/20 text-white transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Element & Playback Controls */}
      <div className="relative z-10 p-3 sm:p-5 space-y-2.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
        {/* Element Family Filter */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveElement('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
              activeElement === 'all'
                ? 'bg-white text-black'
                : 'bg-white/10 text-purple-100 hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          {ELEMENTS.map((el) => (
            <button
              key={el.id}
              type="button"
              onClick={() => {
                setActiveElement(el.id);
                const first = THEMES.find((t) => t.element === el.id);
                if (first) setThemeId(first.id);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1 transition ${
                activeElement === el.id
                  ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-black'
                  : 'bg-white/10 text-purple-100 hover:bg-white/20'
              }`}
            >
              {el.icon}
              <span>{el.label}</span>
            </button>
          ))}
        </div>

        {/* Specific Variation Chips */}
        <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1">
          {visibleThemes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setThemeId(t.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition shrink-0 ${
                themeId === t.id
                  ? 'bg-white/25 border-white text-white shadow'
                  : 'bg-black/45 border-white/15 text-purple-100/80 hover:bg-white/15'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Playback Transport */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            onClick={onPrev}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_28px_rgba(255,255,255,0.4)] hover:scale-105 transition"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

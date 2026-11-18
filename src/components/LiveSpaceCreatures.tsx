import React, { useEffect, useRef, useState } from 'react';

export type SpaceCreatureSpecies = 'astro' | 'phonkbot' | 'starpuff' | 'cosmiccat';

export interface ActiveCreature {
  id: string;
  species: SpaceCreatureSpecies;
  sender: string;
  x: number; // % 0..100
  y: number; // % 0..100
  vx: number;
  vy: number;
  moodText: string;
  moodUntil: number;
  bornAt: number;
  spinBoost: number;
}

const SPECIES_META: Record<
  SpaceCreatureSpecies,
  { emoji: string; name: string; glow: string; phrases: string[] }
> = {
  astro: {
    emoji: '🛸',
    name: 'Astro-Buddy IA',
    glow: 'drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]',
    phrases: ['Orbita ligada! 🚀', 'Adorando essa live!', 'Sinal cósmico 100%!', 'Manda o grave! 🔊'],
  },
  phonkbot: {
    emoji: '👾',
    name: 'Phonk-Bot IA',
    glow: 'drop-shadow-[0_0_12px_rgba(236,72,153,0.9)]',
    phrases: ['Bleep-bloop Phonk! ⚡', 'Batida pesada!', 'Modo Neon ativado!', 'Tô dançando aqui! 🕺'],
  },
  starpuff: {
    emoji: '🌟',
    name: 'Star-Puff IA',
    glow: 'drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]',
    phrases: ['Brilho estelar ✨', 'Você arrasa na live!', 'Energia positiva 💜', 'Supernova de likes!'],
  },
  cosmiccat: {
    emoji: '👽',
    name: 'Cosmic-Friend IA',
    glow: 'drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]',
    phrases: ['Oi da galáxia! 👋', 'Som de outro planeta!', 'Tamo junto na live!', 'Miau cósmico ✨'],
  },
};

interface Props {
  enabled: boolean;
  audioEnergy: number; // 0..1
  spawnQueue: { species: SpaceCreatureSpecies; sender: string; ts: number }[];
}

export const LiveSpaceCreatures: React.FC<Props> = ({ enabled, audioEnergy, spawnQueue }) => {
  const [creatures, setCreatures] = useState<ActiveCreature[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({ x: 50, y: 50, active: false });
  const energyRef = useRef(0);
  energyRef.current = audioEnergy;

  // Seed 2 friendly perimeter companions on mount when enabled
  useEffect(() => {
    if (!enabled) {
      setCreatures([]);
      return;
    }
    setCreatures((prev) => {
      if (prev.length > 0) return prev;
      const now = Date.now();
      return [
        {
          id: `ai-init-1`,
          species: 'astro',
          sender: 'IA LENKYX',
          x: 10,
          y: 22,
          vx: 0.08,
          vy: 0.06,
          moodText: 'Modo Companheiro IA ativo!',
          moodUntil: now + 3500,
          bornAt: now,
          spinBoost: 0,
        },
        {
          id: `ai-init-2`,
          species: 'phonkbot',
          sender: 'IA LENKYX',
          x: 88,
          y: 72,
          vx: -0.07,
          vy: -0.05,
          moodText: '',
          moodUntil: 0,
          bornAt: now,
          spinBoost: 0,
        },
      ];
    });
  }, [enabled]);

  // Process newly spawned creatures from viewer/host taps
  const lastSpawnTsRef = useRef(0);
  useEffect(() => {
    if (!enabled || spawnQueue.length === 0) return;
    const latest = spawnQueue[spawnQueue.length - 1];
    if (!latest || latest.ts <= lastSpawnTsRef.current) return;
    lastSpawnTsRef.current = latest.ts;

    const meta = SPECIES_META[latest.species] || SPECIES_META.astro;
    const onLeft = Math.random() > 0.5;
    const newC: ActiveCreature = {
      id: `ai-${latest.ts}-${Math.random().toString(36).slice(2, 6)}`,
      species: latest.species,
      sender: latest.sender || 'Fã',
      x: onLeft ? 8 + Math.random() * 14 : 78 + Math.random() * 14,
      y: 16 + Math.random() * 64,
      vx: (onLeft ? 1 : -1) * (0.06 + Math.random() * 0.08),
      vy: (Math.random() - 0.5) * 0.12,
      moodText: `${latest.sender}: ${meta.phrases[Math.floor(Math.random() * meta.phrases.length)]}`,
      moodUntil: Date.now() + 4200,
      bornAt: Date.now(),
      spinBoost: 1,
    };
    setCreatures((prev) => [...prev.slice(-7), newC]);
  }, [spawnQueue, enabled]);

  // Smooth 60 FPS perimeter AI steering loop (never blocks center face!)
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      const beatBoost = 1 + energyRef.current * 1.4;
      setCreatures((prev) =>
        prev
          .filter((c) => c.id.startsWith('ai-init-') || now - c.bornAt < 38000)
          .map((c) => {
            let { x, y, vx, vy, spinBoost } = c;
            // Gentle attraction toward pointer if user touches near the perimeter
            if (pointerRef.current.active) {
              const dx = pointerRef.current.x - x;
              const dy = pointerRef.current.y - y;
              const dist = Math.hypot(dx, dy);
              if (dist < 28 && dist > 2) {
                vx += (dx / dist) * 0.015;
                vy += (dy / dist) * 0.015;
              }
            }

            // Perimeter steering: keep center zone (26..74 x, 24..74 y) clear so host's face is NEVER blocked!
            if (x > 26 && x < 74 && y > 22 && y < 76) {
              vx += x < 50 ? -0.035 : 0.035;
              vy += y < 50 ? -0.02 : 0.02;
            }

            // Soft bounds
            if (x < 6) vx = Math.abs(vx) + 0.02;
            if (x > 94) vx = -Math.abs(vx) - 0.02;
            if (y < 14) vy = Math.abs(vy) + 0.02;
            if (y > 84) vy = -Math.abs(vy) - 0.02;

            // Clamp velocity
            const maxV = 0.24 * beatBoost;
            const speed = Math.hypot(vx, vy);
            if (speed > maxV) {
              vx = (vx / speed) * maxV;
              vy = (vy / speed) * maxV;
            }

            x += vx;
            y += vy;
            spinBoost = Math.max(0, spinBoost * 0.94);

            return { ...c, x, y, vx, vy, spinBoost };
          })
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  if (!enabled || creatures.length === 0) return null;

  const pokeCreature = (id: string, species: SpaceCreatureSpecies) => {
    const meta = SPECIES_META[species];
    const phrase = meta.phrases[Math.floor(Math.random() * meta.phrases.length)];
    setCreatures((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              spinBoost: 1.5,
              vx: -c.vx * 1.3,
              vy: (Math.random() - 0.5) * 0.28,
              moodText: phrase,
              moodUntil: Date.now() + 3600,
            }
          : c
      )
    );
  };

  const now = Date.now();

  return (
    <div
      ref={containerRef}
      onPointerMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        pointerRef.current = {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
          active: true,
        };
      }}
      onPointerLeave={() => {
        pointerRef.current.active = false;
      }}
      className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
    >
      {creatures.map((c) => {
        const meta = SPECIES_META[c.species];
        const showBubble = Boolean(c.moodText && now < c.moodUntil);
        const scale = 1 + audioEnergy * 0.25 + c.spinBoost * 0.25;
        return (
          <button
            key={c.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              pokeCreature(c.id, c.species);
            }}
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              transform: `translate(-50%, -50%) scale(${scale.toFixed(2)}) rotate(${(c.spinBoost * 25).toFixed(0)}deg)`,
            }}
            className="absolute pointer-events-auto group transition-transform duration-75 cursor-pointer select-none focus:outline-none"
            title={`${meta.name} — Toque para interagir!`}
          >
            {showBubble && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-black/75 border border-cyan-400/50 text-[9px] font-black text-cyan-200 shadow-lg">
                {c.moodText}
              </div>
            )}
            <span className={`text-2xl sm:text-3xl block ${meta.glow} opacity-90 hover:opacity-100`}>
              {meta.emoji}
            </span>
          </button>
        );
      })}
    </div>
  );
};

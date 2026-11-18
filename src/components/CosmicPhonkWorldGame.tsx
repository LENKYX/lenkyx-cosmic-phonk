import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Rocket,
  Shield,
  Trophy,
  Compass,
  PackageOpen,
  Crosshair,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Send,
  Users,
  Award,
  Zap,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';

interface GalaxyWeapon {
  id: string;
  name: string;
  rarity: string;
  costShards: number;
  damage: number;
  cooldownMs: number;
  color: string;
  description: string;
}

interface CollectorRelic {
  id: string;
  name: string;
  rarity: string;
  emoji: string;
  biome: string;
  value: number;
}

interface WorldQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardShards: number;
  rewardXp: number;
  rewardBadge: string;
}

interface ExplorerState {
  playerId: string;
  playerName: string;
  level: number;
  xp: number;
  shards: number;
  unlockedWeapons: string[];
  equippedWeapon: string;
  relics: { id: string; count: number; firstFoundAt: string }[];
  badges: string[];
  stats: {
    enemiesDefeated: number;
    chestsOpened: number;
    bossesDefeated: number;
    biomesVisited: string[];
  };
  claimedQuests: string[];
}

interface PeerExplorer {
  playerId: string;
  playerName: string;
  avatarColor: string;
  biomeId: string;
  x: number;
  y: number;
  weaponId: string;
  level: number;
}

interface DiscoveryItem {
  id: string;
  playerName: string;
  message: string;
  rarity: string;
  createdAt: string;
}

interface SectorChatItem {
  id: string;
  playerName: string;
  message: string;
  createdAt: string;
}

interface BiomeConfig {
  id: string;
  name: string;
  subtitle: string;
  bgTop: string;
  bgBottom: string;
  gridColor: string;
  accent: string;
  enemyName: string;
  bossName: string;
  nextBiomeId: string;
  nextBiomeName: string;
  prevBiomeId: string;
  prevBiomeName: string;
}

const BIOMES: Record<string, BiomeConfig> = {
  vale_neon: {
    id: 'vale_neon',
    name: 'Vale Neon de Éter',
    subtitle: 'Setor 01 · Cristais bioluminescentes e ruínas antigas',
    bgTop: '#041226',
    bgBottom: '#06283d',
    gridColor: 'rgba(34, 211, 238, 0.14)',
    accent: '#22d3ee',
    enemyName: 'Sentinela de Éter',
    bossName: 'Guardião Cristalino Alpha',
    nextBiomeId: 'deserto_plasma',
    nextBiomeName: 'Deserto de Plasma Solar',
    prevBiomeId: 'cidadela_lenkyx',
    prevBiomeName: 'Cidadela Orbital LENKYX',
  },
  deserto_plasma: {
    id: 'deserto_plasma',
    name: 'Deserto de Plasma Solar',
    subtitle: 'Setor 02 · Dunas ionizadas sob sóis gêmeos dourados',
    bgTop: '#1f0d05',
    bgBottom: '#3b1506',
    gridColor: 'rgba(251, 191, 36, 0.14)',
    accent: '#f59e0b',
    enemyName: 'Escorpião de Plasma',
    bossName: 'Colosso Solar Dourado',
    nextBiomeId: 'abismo_negro',
    nextBiomeName: 'Abismo do Buraco Negro',
    prevBiomeId: 'vale_neon',
    prevBiomeName: 'Vale Neon de Éter',
  },
  abismo_negro: {
    id: 'abismo_negro',
    name: 'Abismo do Buraco Negro',
    subtitle: 'Setor 03 · Horizonte de eventos e gravidade distorcida',
    bgTop: '#0b021a',
    bgBottom: '#1c0538',
    gridColor: 'rgba(236, 72, 153, 0.15)',
    accent: '#ec4899',
    enemyName: 'Espectro do Vazio',
    bossName: 'Titã do Buraco Negro',
    nextBiomeId: 'cidadela_lenkyx',
    nextBiomeName: 'Cidadela Orbital LENKYX',
    prevBiomeId: 'deserto_plasma',
    prevBiomeName: 'Deserto de Plasma Solar',
  },
  cidadela_lenkyx: {
    id: 'cidadela_lenkyx',
    name: 'Cidadela Orbital LENKYX',
    subtitle: 'Setor 04 · Metrópole espacial 3026 e Naves-Mãe',
    bgTop: '#09092b',
    bgBottom: '#1d0b3b',
    gridColor: 'rgba(168, 85, 247, 0.18)',
    accent: '#a855f7',
    enemyName: 'Drone Cibernético 3026',
    bossName: 'Nave-Mãe Phonk Suprema',
    nextBiomeId: 'vale_neon',
    nextBiomeName: 'Vale Neon de Éter',
    prevBiomeId: 'abismo_negro',
    prevBiomeName: 'Abismo do Buraco Negro',
  },
};

const RARITY_COLORS: Record<string, string> = {
  Inicial: 'text-cyan-300 border-cyan-400/40 bg-cyan-500/15',
  Comum: 'text-slate-200 border-slate-400/40 bg-slate-500/15',
  Raro: 'text-pink-300 border-pink-400/40 bg-pink-500/15',
  Épico: 'text-purple-300 border-purple-400/45 bg-purple-500/20',
  Lendário: 'text-amber-300 border-amber-400/50 bg-amber-500/20',
  Mítico: 'text-rose-300 border-rose-400/60 bg-rose-500/25',
};

interface Props {
  user: UserProfile | null;
  onToast: (msg: string) => void;
  onExit?: () => void;
}

function playSynthSfx(enabled: boolean, type: 'shoot' | 'hit' | 'chest' | 'portal' | 'level') {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = (playSynthSfx as unknown as { ctx?: AudioContext }).ctx || new AudioCtx();
    (playSynthSfx as unknown as { ctx?: AudioContext }).ctx = ctx;
    if (ctx.state === 'suspended') void ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'shoot') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.11);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'chest') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.07);
      osc.frequency.setValueAtTime(1046, now + 0.14);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.29);
    } else if (type === 'portal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.31);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  } catch {
    // ignore audio synth errors
  }
}

export const CosmicPhonkWorldGame: React.FC<Props> = ({ user, onToast, onExit }) => {
  const [playerId] = useState(() => {
    if (user?.id) return user.id;
    const saved = localStorage.getItem('lenkyx_arcade_explorer_id');
    if (saved) return saved;
    const gen = `exp-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('lenkyx_arcade_explorer_id', gen);
    return gen;
  });
  const playerName = user?.name || 'Explorador Galáctico';

  const [explorer, setExplorer] = useState<ExplorerState | null>(null);
  const [weapons, setWeapons] = useState<GalaxyWeapon[]>([]);
  const [relicCatalog, setRelicCatalog] = useState<CollectorRelic[]>([]);
  const [quests, setQuests] = useState<WorldQuest[]>([]);
  const [leaderboard, setLeaderboard] = useState<
    { playerId: string; playerName: string; level: number; xp: number; relicCount: number; weaponCount: number }[]
  >([]);
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);
  const [sectorChat, setSectorChat] = useState<SectorChatItem[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [currentBiomeId, setCurrentBiomeId] = useState<string>('vale_neon');
  const [panelTab, setPanelTab] = useState<'arsenal' | 'relics' | 'quests' | 'online'>('arsenal');
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [chatText, setChatText] = useState('');
  const [bossHud, setBossHud] = useState<{ name: string; hp: number; maxHp: number } | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string>('🌌 Bem-vindo ao Novo Mundo: Nova Aetheris!');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const peersRef = useRef<PeerExplorer[]>([]);
  const explorerRef = useRef<ExplorerState | null>(null);
  const weaponsRef = useRef<GalaxyWeapon[]>([]);
  const biomeRef = useRef<string>('vale_neon');
  const sfxRef = useRef(true);

  useEffect(() => {
    explorerRef.current = explorer;
  }, [explorer]);
  useEffect(() => {
    weaponsRef.current = weapons;
  }, [weapons]);
  useEffect(() => {
    biomeRef.current = currentBiomeId;
  }, [currentBiomeId]);
  useEffect(() => {
    sfxRef.current = sfxEnabled;
  }, [sfxEnabled]);

  // Game engine mutable state
  const gameRef = useRef({
    px: 450,
    py: 260,
    hp: 100,
    maxHp: 100,
    aimX: 600,
    aimY: 260,
    dashCooldown: 0,
    dashActiveUntil: 0,
    lastShotAt: 0,
    firing: false,
    keys: new Set<string>(),
    joyDir: { x: 0, y: 0 },
    bullets: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      damage: number;
      radius: number;
      pierce?: boolean;
      vortex?: boolean;
      life: number;
    }[],
    enemies: [] as {
      id: number;
      x: number;
      y: number;
      hp: number;
      maxHp: number;
      speed: number;
      radius: number;
      isBoss: boolean;
      name: string;
      color: string;
    }[],
    chests: [] as { id: number; x: number; y: number; rare: boolean }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }[],
    stars: Array.from({ length: 70 }, () => ({
      x: Math.random() * 900,
      y: Math.random() * 520,
      r: 0.8 + Math.random() * 1.8,
      tw: Math.random() * Math.PI * 2,
    })),
    nextEntityId: 1,
    pendingShards: 0,
    pendingXp: 0,
    pendingEnemies: 0,
    pendingChests: 0,
    pendingBosses: 0,
    biomeKills: 0,
  });

  const showBanner = useCallback((msg: string) => {
    setBannerMsg(msg);
  }, []);

  const loadWorldState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/arcade/world/state?playerId=${encodeURIComponent(playerId)}&playerName=${encodeURIComponent(playerName)}`
      );
      if (!res.ok) return;
      const json = await res.json();
      setExplorer(json.explorer);
      setWeapons(json.weapons || []);
      setRelicCatalog(json.relicCatalog || []);
      setQuests(json.quests || []);
      setLeaderboard(json.leaderboard || []);
      setDiscoveries(json.discoveries || []);
      setSectorChat(json.sectorChat || []);
    } catch {
      // offline fallback
    }
  }, [playerId, playerName]);

  useEffect(() => {
    void loadWorldState();
  }, [loadWorldState]);

  const flushProgress = useCallback(
    async (opts?: {
      biomeVisited?: string;
      rollRareDrop?: boolean;
      dropRarityBoost?: number;
      equipWeaponId?: string;
      unlockWeaponId?: string;
      claimQuestId?: string;
    }) => {
      const g = gameRef.current;
      const payload = {
        playerId,
        playerName,
        shardsDelta: g.pendingShards,
        xpDelta: g.pendingXp,
        enemiesDelta: g.pendingEnemies,
        chestsDelta: g.pendingChests,
        bossesDelta: g.pendingBosses,
        ...opts,
      };
      g.pendingShards = 0;
      g.pendingXp = 0;
      g.pendingEnemies = 0;
      g.pendingChests = 0;
      g.pendingBosses = 0;

      try {
        const res = await fetch('/api/arcade/world/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          if (json.error) onToast(json.error);
          return;
        }
        setExplorer(json.explorer);
        if (json.discoveries) setDiscoveries(json.discoveries);
        if (json.droppedRelic) {
          playSynthSfx(sfxRef.current, 'chest');
          showBanner(`🎁 Item Raro Encontrado: ${json.droppedRelic.emoji} ${json.droppedRelic.name} (${json.droppedRelic.rarity})!`);
          onToast(`🎁 Relíquia ${json.droppedRelic.rarity}: ${json.droppedRelic.emoji} ${json.droppedRelic.name}!`);
        }
      } catch {
        // ignore network hiccup
      }
    },
    [playerId, playerName, onToast, showBanner]
  );

  const spawnBiomeEntities = useCallback((biomeId: string) => {
    const g = gameRef.current;
    const biome = BIOMES[biomeId] || BIOMES.vale_neon;
    g.enemies = [];
    g.chests = [];
    g.bullets = [];
    g.biomeKills = 0;
    setBossHud(null);

    for (let i = 0; i < 6; i++) {
      g.enemies.push({
        id: g.nextEntityId++,
        x: 140 + Math.random() * 620,
        y: 80 + Math.random() * 360,
        hp: 55,
        maxHp: 55,
        speed: 0.75 + Math.random() * 0.65,
        radius: 16,
        isBoss: false,
        name: biome.enemyName,
        color: biome.accent,
      });
    }
    for (let i = 0; i < 2; i++) {
      g.chests.push({
        id: g.nextEntityId++,
        x: 160 + Math.random() * 580,
        y: 100 + Math.random() * 320,
        rare: i === 1,
      });
    }
  }, []);

  useEffect(() => {
    spawnBiomeEntities('vale_neon');
  }, [spawnBiomeEntities]);

  const warpToBiome = useCallback(
    (nextId: string) => {
      const target = BIOMES[nextId];
      if (!target) return;
      playSynthSfx(sfxRef.current, 'portal');
      setCurrentBiomeId(nextId);
      gameRef.current.px = 450;
      gameRef.current.py = 260;
      gameRef.current.hp = gameRef.current.maxHp;
      spawnBiomeEntities(nextId);
      showBanner(`🌀 Novo Setor Descoberto: ${target.name} — ${target.subtitle}`);
      void flushProgress({ biomeVisited: nextId });
    },
    [spawnBiomeEntities, showBanner, flushProgress]
  );

  const triggerInteract = useCallback(() => {
    const g = gameRef.current;
    const biome = BIOMES[biomeRef.current] || BIOMES.vale_neon;

    // 1. Check portals (Left portal at x=55,y=260 | Right portal at x=845,y=260)
    if (Math.hypot(g.px - 845, g.py - 260) < 58) {
      warpToBiome(biome.nextBiomeId);
      return;
    }
    if (Math.hypot(g.px - 55, g.py - 260) < 58) {
      warpToBiome(biome.prevBiomeId);
      return;
    }

    // 2. Check Cosmic Chests
    const chestIdx = g.chests.findIndex((c) => Math.hypot(g.px - c.x, g.py - c.y) < 55);
    if (chestIdx >= 0) {
      const chest = g.chests[chestIdx];
      g.chests.splice(chestIdx, 1);
      g.pendingChests += 1;
      g.pendingShards += chest.rare ? 45 : 22;
      g.pendingXp += chest.rare ? 70 : 35;
      for (let i = 0; i < 24; i++) {
        const ang = (Math.PI * 2 * i) / 24;
        g.particles.push({
          x: chest.x,
          y: chest.y,
          vx: Math.cos(ang) * (1.8 + Math.random() * 3),
          vy: Math.sin(ang) * (1.8 + Math.random() * 3),
          color: chest.rare ? '#fbbf24' : '#22d3ee',
          life: 36,
          size: 3.2,
        });
      }
      playSynthSfx(sfxRef.current, 'chest');
      void flushProgress({ rollRareDrop: true, dropRarityBoost: chest.rare ? 25 : 8 });
      return;
    }

    showBanner('💡 Aproxime-se de uma Cápsula Cósmica ou Portal Luminoso e aperte E!');
  }, [warpToBiome, flushProgress, showBanner]);

  const triggerDash = useCallback(() => {
    const g = gameRef.current;
    const now = Date.now();
    if (now < g.dashCooldown) return;
    g.dashActiveUntil = now + 220;
    g.dashCooldown = now + 1100;
    playSynthSfx(sfxRef.current, 'portal');
  }, []);

  // Sync online presence + progress flush every 2.5s
  useEffect(() => {
    const timer = setInterval(async () => {
      const g = gameRef.current;
      const exp = explorerRef.current;
      if (g.pendingShards !== 0 || g.pendingXp > 0 || g.pendingEnemies > 0 || g.pendingChests > 0 || g.pendingBosses > 0) {
        void flushProgress();
      }
      try {
        const res = await fetch('/api/arcade/world/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            playerName,
            avatarColor: user?.avatarColor || 'from-cyan-400 to-pink-500',
            biomeId: biomeRef.current,
            x: Math.round(g.px),
            y: Math.round(g.py),
            weaponId: exp?.equippedWeapon || 'solar_blaster',
            level: exp?.level || 1,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          peersRef.current = json.peers || [];
          setOnlineCount(json.onlineCount || 1);
          if (json.discoveries) setDiscoveries(json.discoveries);
          if (json.sectorChat) setSectorChat(json.sectorChat);
        }
      } catch {
        // ignore
      }
    }, 2600);
    return () => clearInterval(timer);
  }, [playerId, playerName, user?.avatarColor, flushProgress]);

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
      gameRef.current.keys.add(k);
      if (k === ' ') gameRef.current.firing = true;
      if (k === 'e') triggerInteract();
      if (k === 'shift') triggerDash();
      if (['1', '2', '3', '4', '5'].includes(k)) {
        const idx = Number(k) - 1;
        const w = weaponsRef.current[idx];
        if (w && explorerRef.current?.unlockedWeapons.includes(w.id)) {
          void flushProgress({ equipWeaponId: w.id });
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      gameRef.current.keys.delete(k);
      if (k === ' ') gameRef.current.firing = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerInteract, triggerDash, flushProgress]);

  // Main 60FPS Canvas Game Loop
  useEffect(() => {
    let raf = 0;
    const W = 900;
    const H = 520;

    const fireWeapon = () => {
      const g = gameRef.current;
      const now = Date.now();
      const exp = explorerRef.current;
      const weaponId = exp?.equippedWeapon || 'solar_blaster';
      const weapon = weaponsRef.current.find((w) => w.id === weaponId) || {
        id: 'solar_blaster',
        damage: 22,
        cooldownMs: 210,
        color: '#22d3ee',
      };
      if (now - g.lastShotAt < weapon.cooldownMs) return;
      g.lastShotAt = now;

      let angle = Math.atan2(g.aimY - g.py, g.aimX - g.px);
      if (Number.isNaN(angle)) angle = 0;
      // Auto-aim nearest enemy when firing with Space/mobile button without moving mouse
      if (!g.keys.has('mouse') && g.enemies.length > 0) {
        let nearest = g.enemies[0];
        let bestDist = Infinity;
        for (const en of g.enemies) {
          const d = Math.hypot(en.x - g.px, en.y - g.py);
          if (d < bestDist) {
            bestDist = d;
            nearest = en;
          }
        }
        if (bestDist < 420) angle = Math.atan2(nearest.y - g.py, nearest.x - g.px);
      }

      playSynthSfx(sfxRef.current, 'shoot');

      if (weapon.id === 'supernova_tri') {
        [-0.22, 0, 0.22].forEach((offset) => {
          const a = angle + offset;
          g.bullets.push({
            x: g.px,
            y: g.py,
            vx: Math.cos(a) * 9.5,
            vy: Math.sin(a) * 9.5,
            color: weapon.color,
            damage: weapon.damage,
            radius: 5,
            life: 65,
          });
        });
      } else if (weapon.id === 'phonk_sonic') {
        g.bullets.push({
          x: g.px,
          y: g.py,
          vx: Math.cos(angle) * 7.2,
          vy: Math.sin(angle) * 7.2,
          color: weapon.color,
          damage: weapon.damage,
          radius: 13,
          pierce: true,
          life: 52,
        });
      } else if (weapon.id === 'antimatter_rail') {
        g.bullets.push({
          x: g.px,
          y: g.py,
          vx: Math.cos(angle) * 14,
          vy: Math.sin(angle) * 14,
          color: weapon.color,
          damage: weapon.damage,
          radius: 6,
          pierce: true,
          life: 50,
        });
      } else if (weapon.id === 'blackhole_scepter') {
        g.bullets.push({
          x: g.px,
          y: g.py,
          vx: Math.cos(angle) * 5.2,
          vy: Math.sin(angle) * 5.2,
          color: weapon.color,
          damage: weapon.damage,
          radius: 16,
          pierce: true,
          vortex: true,
          life: 80,
        });
      } else {
        g.bullets.push({
          x: g.px,
          y: g.py,
          vx: Math.cos(angle) * 9,
          vy: Math.sin(angle) * 9,
          color: weapon.color,
          damage: weapon.damage,
          radius: 4.5,
          life: 65,
        });
      }
    };

    const tick = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const g = gameRef.current;
        const biome = BIOMES[biomeRef.current] || BIOMES.vale_neon;
        const now = Date.now();

        // 1. Movement
        let dx = g.joyDir.x;
        let dy = g.joyDir.y;
        if (g.keys.has('w') || g.keys.has('arrowup')) dy -= 1;
        if (g.keys.has('s') || g.keys.has('arrowdown')) dy += 1;
        if (g.keys.has('a') || g.keys.has('arrowleft')) dx -= 1;
        if (g.keys.has('d') || g.keys.has('arrowright')) dx += 1;
        const mag = Math.hypot(dx, dy);
        if (mag > 0) {
          const speed = now < g.dashActiveUntil ? 8.2 : 3.7;
          g.px = Math.max(28, Math.min(W - 28, g.px + (dx / mag) * speed));
          g.py = Math.max(32, Math.min(H - 32, g.py + (dy / mag) * speed));
        }

        if (g.firing) fireWeapon();

        // 2. Bullets & Hits
        for (let i = g.bullets.length - 1; i >= 0; i--) {
          const b = g.bullets[i];
          b.x += b.vx;
          b.y += b.vy;
          b.life -= 1;
          if (b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
            g.bullets.splice(i, 1);
            continue;
          }
          for (let j = g.enemies.length - 1; j >= 0; j--) {
            const en = g.enemies[j];
            if (b.vortex && Math.hypot(en.x - b.x, en.y - b.y) < 120) {
              en.x += (b.x - en.x) * 0.04;
              en.y += (b.y - en.y) * 0.04;
            }
            if (Math.hypot(en.x - b.x, en.y - b.y) < en.radius + b.radius) {
              en.hp -= b.damage;
              playSynthSfx(sfxRef.current, 'hit');
              for (let p = 0; p < 5; p++) {
                g.particles.push({
                  x: en.x,
                  y: en.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: b.color,
                  life: 16,
                  size: 2.5,
                });
              }
              if (!b.pierce) {
                g.bullets.splice(i, 1);
                break;
              }
            }
          }
        }

        // 3. Enemies AI & Death
        let activeBoss: { name: string; hp: number; maxHp: number } | null = null;
        for (let j = g.enemies.length - 1; j >= 0; j--) {
          const en = g.enemies[j];
          if (en.hp <= 0) {
            g.enemies.splice(j, 1);
            g.pendingEnemies += 1;
            g.biomeKills += 1;
            g.pendingShards += en.isBoss ? 140 : 14;
            g.pendingXp += en.isBoss ? 220 : 25;
            if (en.isBoss) {
              g.pendingBosses += 1;
              showBanner(`🏆 Chefão ${en.name} derrotado! Relíquia Rara liberada!`);
              void flushProgress({ rollRareDrop: true, dropRarityBoost: 35 });
            }
            for (let p = 0; p < (en.isBoss ? 30 : 12); p++) {
              g.particles.push({
                x: en.x,
                y: en.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: en.isBoss ? '#fbbf24' : en.color,
                life: 28,
                size: en.isBoss ? 4 : 2.8,
              });
            }
            continue;
          }

          if (en.isBoss) activeBoss = { name: en.name, hp: Math.max(0, Math.round(en.hp)), maxHp: en.maxHp };
          const d = Math.hypot(g.px - en.x, g.py - en.y);
          if (d > 1) {
            en.x += ((g.px - en.x) / d) * en.speed;
            en.y += ((g.py - en.y) / d) * en.speed;
          }
          if (d < en.radius + 14 && now > g.dashActiveUntil) {
            g.hp = Math.max(0, g.hp - (en.isBoss ? 0.35 : 0.18));
            if (g.hp <= 0) {
              g.hp = g.maxHp;
              g.px = 450;
              g.py = 260;
              showBanner('🛡️ Escudo Cósmico recarregado na base do setor!');
            }
          }
        }
        setBossHud(activeBoss);

        // Respawn wave or Spawn Sector Boss every 8 kills
        if (g.enemies.length < 4) {
          const shouldSpawnBoss = g.biomeKills >= 8 && !g.enemies.some((e) => e.isBoss);
          if (shouldSpawnBoss) {
            g.biomeKills = 0;
            g.enemies.push({
              id: g.nextEntityId++,
              x: 450,
              y: 90,
              hp: 460,
              maxHp: 460,
              speed: 1.15,
              radius: 30,
              isBoss: true,
              name: biome.bossName,
              color: '#f43f5e',
            });
            showBanner(`⚠️ ALERTA DE CHEFÃO: ${biome.bossName} apareceu neste setor!`);
          } else {
            const side = Math.random() > 0.5;
            g.enemies.push({
              id: g.nextEntityId++,
              x: side ? 120 + Math.random() * 660 : Math.random() > 0.5 ? 110 : W - 110,
              y: 60 + Math.random() * 400,
              hp: 60,
              maxHp: 60,
              speed: 0.8 + Math.random() * 0.75,
              radius: 16,
              isBoss: false,
              name: biome.enemyName,
              color: biome.accent,
            });
          }
        }

        // Respawn chest if empty
        if (g.chests.length === 0 && Math.random() < 0.015) {
          g.chests.push({
            id: g.nextEntityId++,
            x: 160 + Math.random() * 580,
            y: 90 + Math.random() * 340,
            rare: Math.random() > 0.65,
          });
        }

        // === RENDER ===
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, biome.bgTop);
        grad.addColorStop(1, biome.bgBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Animated Stars & Black Hole in Abismo Negro
        const t = now * 0.001;
        g.stars.forEach((st) => {
          const alpha = 0.35 + 0.55 * Math.abs(Math.sin(t + st.tw));
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx.fill();
        });

        if (biome.id === 'abismo_negro') {
          ctx.save();
          ctx.translate(W / 2, 130);
          ctx.rotate(t * 0.7);
          const bh = ctx.createRadialGradient(0, 0, 12, 0, 0, 82);
          bh.addColorStop(0, '#000000');
          bh.addColorStop(0.45, '#ec4899');
          bh.addColorStop(0.75, 'rgba(245,158,11,0.35)');
          bh.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = bh;
          ctx.beginPath();
          ctx.arc(0, 0, 82, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Sci-Fi Perspective Grid Floor
        ctx.strokeStyle = biome.gridColor;
        ctx.lineWidth = 1;
        for (let gx = 0; gx <= W; gx += 45) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, H);
          ctx.stroke();
        }
        for (let gy = 0; gy <= H; gy += 45) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
          ctx.stroke();
        }

        // Portals (Left & Right)
        [
          { x: 55, y: 260, label: `◀ ${biome.prevBiomeName.split(' ')[0]}`, color: '#38bdf8' },
          { x: 845, y: 260, label: `${biome.nextBiomeName.split(' ')[0]} ▶`, color: '#ec4899' },
        ].forEach((pt) => {
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(t * 1.4);
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 1.6);
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pt.label, pt.x, pt.y + 42);
        });

        // Cosmic Chests
        g.chests.forEach((c) => {
          ctx.save();
          ctx.fillStyle = c.rare ? '#fbbf24' : '#22d3ee';
          ctx.shadowBlur = 16;
          ctx.shadowColor = c.rare ? '#fbbf24' : '#22d3ee';
          ctx.fillRect(c.x - 13, c.y - 10, 26, 20);
          ctx.restore();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(c.rare ? '✨ Cápsula Rara (E)' : '📦 Cápsula (E)', c.x, c.y - 16);
        });

        // Online Co-op Peers in same biome
        peersRef.current
          .filter((p) => p.biomeId === biome.id)
          .forEach((p) => {
            ctx.save();
            ctx.fillStyle = '#34d399';
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#34d399';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#a7f3d0';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${p.playerName} Nv.${p.level}`, p.x, p.y - 20);
          });

        // Enemies & Bosses
        g.enemies.forEach((en) => {
          ctx.save();
          ctx.fillStyle = en.isBoss ? '#f43f5e' : en.color;
          ctx.shadowBlur = en.isBoss ? 24 : 12;
          ctx.shadowColor = en.color;
          ctx.beginPath();
          ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          // HP bar above enemy
          const bw = en.isBoss ? 64 : 30;
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.fillRect(en.x - bw / 2, en.y - en.radius - 10, bw, 4);
          ctx.fillStyle = en.isBoss ? '#fbbf24' : '#34d399';
          ctx.fillRect(en.x - bw / 2, en.y - en.radius - 10, bw * Math.max(0, en.hp / en.maxHp), 4);
        });

        // Bullets
        g.bullets.forEach((b) => {
          ctx.save();
          ctx.fillStyle = b.color;
          ctx.shadowBlur = 14;
          ctx.shadowColor = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Particles
        for (let p = g.particles.length - 1; p >= 0; p--) {
          const pt = g.particles[p];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life -= 1;
          if (pt.life <= 0) {
            g.particles.splice(p, 1);
            continue;
          }
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = Math.max(0, pt.life / 32);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Local Explorer (Player)
        const exp = explorerRef.current;
        const eqWeapon = weaponsRef.current.find((w) => w.id === exp?.equippedWeapon);
        const pColor = eqWeapon?.color || '#22d3ee';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = pColor;
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = pColor;
        ctx.beginPath();
        ctx.arc(g.px, g.py, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Player HP bar & Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${playerName} (Nv.${exp?.level || 1})`, g.px, g.py - 24);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(g.px - 22, g.py + 20, 44, 5);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(g.px - 22, g.py + 20, 44 * (g.hp / g.maxHp), 5);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerName, flushProgress, showBanner]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = chatText.trim();
    if (!clean) return;
    setChatText('');
    try {
      const res = await fetch('/api/arcade/world/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, message: clean }),
      });
      if (res.ok) {
        const json = await res.json();
        setSectorChat(json.sectorChat || []);
      }
    } catch {
      // ignore
    }
  };

  const currentBiome = BIOMES[currentBiomeId] || BIOMES.vale_neon;
  const activeWeapon = useMemo(
    () => weapons.find((w) => w.id === explorer?.equippedWeapon) || weapons[0],
    [weapons, explorer?.equippedWeapon]
  );

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`rounded-3xl bg-[#060214] border border-cyan-400/40 shadow-[0_0_60px_rgba(34,211,238,0.2)] overflow-hidden ${
        fullscreen ? 'p-4 flex flex-col justify-between min-h-screen' : 'p-3 sm:p-5 space-y-4'
      }`}
    >
      {/* Top Game HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2">
              COSMIC PHONK: NOVO MUNDO
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/45 text-emerald-300 text-[10px]">
                ● {onlineCount} Online
              </span>
            </div>
            <div className="text-[11px] text-cyan-200/80">
              {currentBiome.name} · Nível {explorer?.level || 1} ({explorer?.xp || 0} XP) · ✨{' '}
              <strong className="text-amber-300">{explorer?.shards || 0} Fragmentos</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSfxEnabled((v) => !v)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-200"
            title={sfxEnabled ? 'Desligar Efeitos Sonoros' : 'Ligar Efeitos Sonoros'}
          >
            {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            title="Tela Cheia"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1.5 rounded-xl bg-red-500/25 hover:bg-red-500/45 border border-red-400/40 text-red-100 text-xs font-black flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Sair
            </button>
          )}
        </div>
      </div>

      {/* Biome Quick Warp + Event Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {Object.values(BIOMES).map((b) => (
            <button
              key={b.id}
              onClick={() => warpToBiome(b.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition ${
                currentBiomeId === b.id
                  ? 'bg-cyan-400 text-black border-white'
                  : 'bg-white/[0.06] text-purple-200 border-white/10 hover:bg-white/15'
              }`}
            >
              🌀 {b.name}
            </button>
          ))}
        </div>
        <div className="text-[11px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/35 px-3 py-1 rounded-full">
          {bannerMsg}
        </div>
      </div>

      {/* Main Playable Canvas + Boss Bar */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-400/35 bg-black">
        {bossHud && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-[85%] max-w-md bg-black/80 border border-rose-400/60 rounded-xl px-3 py-1.5">
            <div className="flex justify-between text-[10px] font-black text-rose-300 mb-1">
              <span>⚠️ CHEFÃO: {bossHud.name}</span>
              <span>
                {bossHud.hp} / {bossHud.maxHp}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400"
                style={{ width: `${Math.min(100, (bossHud.hp / bossHud.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            gameRef.current.aimX = ((e.clientX - rect.left) / rect.width) * 900;
            gameRef.current.aimY = ((e.clientY - rect.top) / rect.height) * 520;
            gameRef.current.keys.add('mouse');
          }}
          onMouseDown={() => {
            gameRef.current.keys.add('mouse');
            gameRef.current.firing = true;
          }}
          onMouseUp={() => {
            gameRef.current.firing = false;
          }}
          onMouseLeave={() => {
            gameRef.current.firing = false;
            gameRef.current.keys.delete('mouse');
          }}
          className="w-full h-auto aspect-[900/520] block cursor-crosshair select-none touch-none"
        />

        {/* Quick Equipped Weapon Bar Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap gap-1 pointer-events-auto">
            {weapons.map((w, idx) => {
              const unlocked = explorer?.unlockedWeapons.includes(w.id);
              const eq = explorer?.equippedWeapon === w.id;
              return (
                <button
                  key={w.id}
                  disabled={!unlocked}
                  onClick={() => void flushProgress({ equipWeaponId: w.id })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black border backdrop-blur-md transition ${
                    eq
                      ? 'bg-white text-black border-cyan-300 shadow'
                      : unlocked
                        ? 'bg-black/70 text-white border-white/25 hover:bg-black/90'
                        : 'bg-black/45 text-white/35 border-white/10'
                  }`}
                >
                  [{idx + 1}] {w.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
          <div className="hidden sm:block px-2.5 py-1 rounded-lg bg-black/70 text-[10px] text-cyan-200 font-bold">
            WASD/Setas: Mover · Click/Espaço: Atirar · Shift: Dash · E: Portal/Cápsula
          </div>
        </div>
      </div>

      {/* Mobile / Touch Virtual Controls (Always handy on touch & tablet!) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-3">
        <div className="grid grid-cols-3 gap-1 w-32">
          <div />
          <button
            onPointerDown={() => (gameRef.current.joyDir.y = -1)}
            onPointerUp={() => (gameRef.current.joyDir.y = 0)}
            onPointerLeave={() => (gameRef.current.joyDir.y = 0)}
            className="h-9 rounded-lg bg-white/10 active:bg-cyan-400 active:text-black flex items-center justify-center"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div />
          <button
            onPointerDown={() => (gameRef.current.joyDir.x = -1)}
            onPointerUp={() => (gameRef.current.joyDir.x = 0)}
            onPointerLeave={() => (gameRef.current.joyDir.x = 0)}
            className="h-9 rounded-lg bg-white/10 active:bg-cyan-400 active:text-black flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onPointerDown={() => (gameRef.current.joyDir.y = 1)}
            onPointerUp={() => (gameRef.current.joyDir.y = 0)}
            onPointerLeave={() => (gameRef.current.joyDir.y = 0)}
            className="h-9 rounded-lg bg-white/10 active:bg-cyan-400 active:text-black flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onPointerDown={() => (gameRef.current.joyDir.x = 1)}
            onPointerUp={() => (gameRef.current.joyDir.x = 0)}
            onPointerLeave={() => (gameRef.current.joyDir.x = 0)}
            className="h-9 rounded-lg bg-white/10 active:bg-cyan-400 active:text-black flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onPointerDown={() => (gameRef.current.firing = true)}
            onPointerUp={() => (gameRef.current.firing = false)}
            onPointerLeave={() => (gameRef.current.firing = false)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-lg"
          >
            <Crosshair className="w-4 h-4" /> ATIRAR ({activeWeapon?.name.split(' ')[0] || 'Blaster'})
          </button>
          <button
            onClick={triggerDash}
            className="px-4 py-3 rounded-2xl bg-purple-500/30 border border-purple-400/50 text-purple-100 font-black text-xs flex items-center gap-1"
          >
            <Zap className="w-4 h-4" /> DASH
          </button>
          <button
            onClick={triggerInteract}
            className="px-4 py-3 rounded-2xl bg-amber-400 text-black font-black text-xs flex items-center gap-1"
          >
            <PackageOpen className="w-4 h-4" /> PORTAL / CÁPSULA (E)
          </button>
        </div>
      </div>

      {/* Bottom Tabs: Arsenal Galáctico | Cofre Colecionador | Missões Online | Jogadores & Chat */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'arsenal' as const, label: '🔫 Armas da Galáxia', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'relics' as const, label: `💎 Colecionáveis (${explorer?.relics.length || 0}/${relicCatalog.length})`, icon: <Award className="w-3.5 h-3.5" /> },
            { id: 'quests' as const, label: '🧭 Missões Online', icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'online' as const, label: `👥 Mundo Online & Chat (${onlineCount})`, icon: <Users className="w-3.5 h-3.5" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setPanelTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition ${
                panelTab === t.id
                  ? 'bg-cyan-400 text-black border-white'
                  : 'bg-white/[0.06] text-purple-200 border-white/10 hover:bg-white/10'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ARSENAL */}
        {panelTab === 'arsenal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {weapons.map((w) => {
              const unlocked = explorer?.unlockedWeapons.includes(w.id);
              const eq = explorer?.equippedWeapon === w.id;
              return (
                <div
                  key={w.id}
                  className={`rounded-2xl p-3 border space-y-2 flex flex-col justify-between ${
                    eq ? 'bg-cyan-500/15 border-cyan-400' : 'bg-white/[0.04] border-white/10'
                  }`}
                >
                  <div className="space-y-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border ${RARITY_COLORS[w.rarity] || ''}`}>
                      {w.rarity}
                    </span>
                    <div className="text-xs font-black text-white">{w.name}</div>
                    <p className="text-[10px] text-purple-200/75">{w.description}</p>
                    <div className="text-[10px] font-bold text-cyan-300">Dano: {w.damage}</div>
                  </div>
                  {unlocked ? (
                    <button
                      onClick={() => void flushProgress({ equipWeaponId: w.id })}
                      className={`w-full py-1.5 rounded-xl text-[11px] font-black ${
                        eq ? 'bg-cyan-400 text-black' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {eq ? '✓ Equipada' : 'Equipar'}
                    </button>
                  ) : (
                    <button
                      onClick={() => void flushProgress({ unlockWeaponId: w.id })}
                      className="w-full py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black"
                    >
                      Desbloquear ({w.costShards} ✨)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* RARE COLLECTOR RELICS */}
        {panelTab === 'relics' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {relicCatalog.map((r) => {
              const owned = explorer?.relics.find((item) => item.id === r.id);
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl p-3 border text-center space-y-1 ${
                    owned ? 'bg-white/[0.07] border-amber-400/45' : 'bg-black/40 border-white/10 opacity-55'
                  }`}
                >
                  <div className="text-2xl">{owned ? r.emoji : '❓'}</div>
                  <div className="text-xs font-black text-white">{owned ? r.name : 'Relíquia Desconhecida'}</div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border ${RARITY_COLORS[r.rarity] || ''}`}>
                    {r.rarity} · {r.biome}
                  </span>
                  <div className="text-[10px] text-amber-300 font-bold">
                    {owned ? `Na Coleção: x${owned.count}` : 'Abra Cápsulas ou Derrote Chefões'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ONLINE QUESTS */}
        {panelTab === 'quests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {quests.map((q) => {
              const claimed = explorer?.claimedQuests.includes(q.id);
              let prog = 0;
              if (q.id === 'q_discover_biomes') prog = explorer?.stats.biomesVisited.length || 1;
              if (q.id === 'q_defeat_enemies') prog = explorer?.stats.enemiesDefeated || 0;
              if (q.id === 'q_open_chests') prog = explorer?.stats.chestsOpened || 0;
              if (q.id === 'q_defeat_boss') prog = explorer?.stats.bossesDefeated || 0;
              const ready = !claimed && prog >= q.target;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl p-3.5 bg-white/[0.04] border border-white/12 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-cyan-300" /> {q.title}
                    </div>
                    <p className="text-[11px] text-purple-200/80">{q.description}</p>
                    <div className="text-[10px] font-bold text-amber-300">
                      Progresso: {Math.min(prog, q.target)}/{q.target} · Prêmio: +{q.rewardShards} ✨ +{q.rewardXp} XP + {q.rewardBadge}
                    </div>
                  </div>
                  <button
                    disabled={!ready}
                    onClick={() => void flushProgress({ claimQuestId: q.id })}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black shrink-0 ${
                      claimed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                        : ready
                          ? 'bg-amber-400 hover:bg-amber-300 text-black'
                          : 'bg-white/10 text-white/45'
                    }`}
                  >
                    {claimed ? '✓ Resgatada' : ready ? 'Resgatar!' : 'Em Curso'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ONLINE SHARED FEED, LEADERBOARD & SECTOR CHAT */}
        {panelTab === 'online' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Discoveries Feed */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 space-y-2">
              <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Descobertas Raras Globais
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px]">
                {discoveries.map((d) => (
                  <div key={d.id} className="p-2 rounded-xl bg-black/40 border border-white/5 text-purple-100">
                    <strong className="text-cyan-300">{d.playerName}</strong> {d.message}
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 space-y-2">
              <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Ranking de Exploradores
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto text-[11px]">
                {leaderboard.map((l, idx) => (
                  <div key={l.playerId} className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/35">
                    <span className="text-white font-bold truncate">
                      #{idx + 1} {l.playerName}
                    </span>
                    <span className="text-amber-300 font-black shrink-0">
                      Nv.{l.level} · {l.relicCount} 💎
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Sector Chat */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex flex-col justify-between space-y-2">
              <div className="text-xs font-black text-pink-300">💬 Chat Co-op do Mundo</div>
              <div className="space-y-1 max-h-28 overflow-y-auto text-[11px]">
                {sectorChat.map((c) => (
                  <div key={c.id} className="text-purple-100">
                    <strong className="text-emerald-300">{c.playerName}:</strong> {c.message}
                  </div>
                ))}
              </div>
              <form onSubmit={(e) => void handleSendChat(e)} className="flex gap-1.5">
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Chamar equipe ou contar achado..."
                  className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/15 text-[11px] text-white focus:outline-none"
                />
                <button type="submit" className="px-2.5 py-1.5 rounded-xl bg-cyan-400 text-black font-black">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Gamepad2,
  Rocket,
  Search,
  Play,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile } from '../types';
import { CosmicPhonkWorldGame } from './CosmicPhonkWorldGame';

interface ArcadeGameItem {
  id: string;
  identifier?: string;
  title: string;
  developer: string;
  year: string;
  genre: string;
  generation: string;
  platform: string;
  description?: string;
  thumbnailUrl: string;
  embedUrl: string;
  externalUrl: string;
  downloads: number;
  isFree: boolean;
  playableInline: boolean;
  source: string;
}

interface ArcadeCategory {
  id: string;
  title: string;
  subtitle: string;
  items: ArcadeGameItem[];
}

type BuiltInMiniGameId = 'invaders' | 'snake' | 'breaker' | 'drift';

interface Props {
  user: UserProfile | null;
  onToast: (msg: string) => void;
}

const BUILTIN_GAMES: {
  id: BuiltInMiniGameId;
  title: string;
  era: string;
  genre: string;
  emoji: string;
  gradient: string;
  desc: string;
}[] = [
  {
    id: 'invaders',
    title: 'Galaxy Invaders 1982',
    era: 'Fliperama Clássico',
    genre: 'Nave / Shoot’em Up',
    emoji: '👾',
    gradient: 'from-cyan-500/30 to-blue-700/40',
    desc: 'Destrua frotas alienígenas neon em 60 FPS direto na tela!',
  },
  {
    id: 'drift',
    title: 'Cyber Drift Neon 2080',
    era: 'Arcade Corrida',
    genre: 'Corrida Futurista',
    emoji: '🏎️',
    gradient: 'from-pink-500/30 to-purple-700/40',
    desc: 'Desvie dos obstáculos na rodovia cósmica em alta velocidade!',
  },
  {
    id: 'snake',
    title: 'Hyper Snake Phonk',
    era: 'Retrô Portátil',
    genre: 'Clássico / Reflexo',
    emoji: '🐍',
    gradient: 'from-emerald-500/30 to-teal-700/40',
    desc: 'Colete cristais energéticos e cresça sem bater nas bordas!',
  },
  {
    id: 'breaker',
    title: 'Cosmic Brick Breaker',
    era: 'Arcade 80s',
    genre: 'Quebra-Blocos',
    emoji: '🧱',
    gradient: 'from-amber-500/30 to-rose-700/40',
    desc: 'Rebata a esfera de plasma para pulverizar a barreira estelar!',
  },
];

// Built-in Instant Playable HTML5 Canvas Mini-Game Runner
const BuiltInRetroCabinet: React.FC<{
  gameId: BuiltInMiniGameId;
  onClose: () => void;
}> = ({ gameId, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'playing' | 'gameover'>('playing');
  const [runSeed, setRunSeed] = useState(1);
  const keysRef = useRef(new Set<string>());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
      keysRef.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    setScore(0);
    setStatus('playing');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const W = 640;
    const H = 380;
    let raf = 0;
    let alive = true;
    let localScore = 0;

    // Game states per title
    let playerX = W / 2;
    const bullets: { x: number; y: number }[] = [];
    let lastShot = 0;
    const enemies: { x: number; y: number; vx: number }[] = Array.from({ length: 14 }, (_, idx) => ({
      x: 70 + (idx % 7) * 75,
      y: 45 + Math.floor(idx / 7) * 42,
      vx: 1.4,
    }));

    const cars: { lane: number; y: number; color: string }[] = [];
    let roadOffset = 0;

    let ball = { x: W / 2, y: H - 60, vx: 3.4, vy: -3.6 };
    const bricks: { x: number; y: number; alive: boolean; color: string }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        bricks.push({
          x: 42 + c * 72,
          y: 38 + r * 28,
          alive: true,
          color: ['#22d3ee', '#ec4899', '#a855f7', '#fbbf24'][r],
        });
      }
    }

    const snake = [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 },
    ];
    let snakeDir = { x: 1, y: 0 };
    let food = { x: 20, y: 10 };
    let tickCount = 0;

    const loop = () => {
      if (!alive) return;
      tickCount++;
      const keys = keysRef.current;

      ctx.fillStyle = '#050111';
      ctx.fillRect(0, 0, W, H);

      if (gameId === 'invaders') {
        if (keys.has('a') || keys.has('arrowleft')) playerX = Math.max(24, playerX - 5);
        if (keys.has('d') || keys.has('arrowright')) playerX = Math.min(W - 24, playerX + 5);
        if ((keys.has(' ') || keys.has('arrowup') || keys.has('w')) && Date.now() - lastShot > 220) {
          lastShot = Date.now();
          bullets.push({ x: playerX, y: H - 40 });
        }

        // Player Ship
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(playerX, H - 44);
        ctx.lineTo(playerX - 16, H - 18);
        ctx.lineTo(playerX + 16, H - 18);
        ctx.closePath();
        ctx.fill();

        // Bullets
        ctx.fillStyle = '#fbbf24';
        for (let i = bullets.length - 1; i >= 0; i--) {
          bullets[i].y -= 7;
          ctx.fillRect(bullets[i].x - 2, bullets[i].y, 4, 10);
          if (bullets[i].y < 0) bullets.splice(i, 1);
        }

        // Enemies
        let edge = false;
        enemies.forEach((en) => {
          en.x += en.vx;
          if (en.x > W - 30 || en.x < 30) edge = true;
        });
        if (edge) {
          enemies.forEach((en) => {
            en.vx *= -1;
            en.y += 16;
          });
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
          const en = enemies[j];
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(en.x - 14, en.y - 10, 28, 20);
          if (en.y > H - 45) {
            alive = false;
            setStatus('gameover');
          }
          for (let i = bullets.length - 1; i >= 0; i--) {
            if (Math.abs(bullets[i].x - en.x) < 18 && Math.abs(bullets[i].y - en.y) < 14) {
              enemies.splice(j, 1);
              bullets.splice(i, 1);
              localScore += 50;
              setScore(localScore);
              break;
            }
          }
        }
        if (enemies.length === 0) {
          for (let idx = 0; idx < 14; idx++) {
            enemies.push({
              x: 70 + (idx % 7) * 75,
              y: 45 + Math.floor(idx / 7) * 42,
              vx: 1.8,
            });
          }
        }
      } else if (gameId === 'drift') {
        if (keys.has('a') || keys.has('arrowleft')) playerX = Math.max(150, playerX - 5.5);
        if (keys.has('d') || keys.has('arrowright')) playerX = Math.min(W - 150, playerX + 5.5);
        roadOffset = (roadOffset + 8) % 40;

        ctx.fillStyle = '#120826';
        ctx.fillRect(120, 0, W - 240, H);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.strokeRect(120, -4, W - 240, H + 8);
        ctx.strokeStyle = 'rgba(236,72,153,0.45)';
        for (let y = roadOffset - 40; y < H; y += 40) {
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(W / 2 - 3, y, 6, 20);
        }

        if (tickCount % 32 === 0) {
          cars.push({
            lane: 155 + Math.random() * (W - 310),
            y: -30,
            color: Math.random() > 0.5 ? '#fbbf24' : '#f43f5e',
          });
        }
        for (let i = cars.length - 1; i >= 0; i--) {
          cars[i].y += 5.2;
          ctx.fillStyle = cars[i].color;
          ctx.fillRect(cars[i].lane - 16, cars[i].y - 22, 32, 44);
          if (Math.abs(cars[i].lane - playerX) < 28 && Math.abs(cars[i].y - (H - 50)) < 36) {
            alive = false;
            setStatus('gameover');
          }
          if (cars[i].y > H + 40) {
            cars.splice(i, 1);
            localScore += 20;
            setScore(localScore);
          }
        }
        // Player Cyber Car
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(playerX - 16, H - 72, 32, 46);
      } else if (gameId === 'breaker') {
        if (keys.has('a') || keys.has('arrowleft')) playerX = Math.max(55, playerX - 6.5);
        if (keys.has('d') || keys.has('arrowright')) playerX = Math.min(W - 55, playerX + 6.5);

        ball.x += ball.vx;
        ball.y += ball.vy;
        if (ball.x < 10 || ball.x > W - 10) ball.vx *= -1;
        if (ball.y < 10) ball.vy *= -1;
        if (ball.y > H - 30 && Math.abs(ball.x - playerX) < 55 && ball.vy > 0) {
          ball.vy *= -1;
          ball.vx += (ball.x - playerX) * 0.05;
        }
        if (ball.y > H + 12) {
          alive = false;
          setStatus('gameover');
        }

        bricks.forEach((b) => {
          if (!b.alive) return;
          if (ball.x > b.x && ball.x < b.x + 62 && ball.y > b.y && ball.y < b.y + 18) {
            b.alive = false;
            ball.vy *= -1;
            localScore += 35;
            setScore(localScore);
          }
          if (b.alive) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, 62, 18);
          }
        });

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(playerX - 50, H - 24, 100, 12);
      } else if (gameId === 'snake') {
        if ((keys.has('w') || keys.has('arrowup')) && snakeDir.y === 0) snakeDir = { x: 0, y: -1 };
        if ((keys.has('s') || keys.has('arrowdown')) && snakeDir.y === 0) snakeDir = { x: 0, y: 1 };
        if ((keys.has('a') || keys.has('arrowleft')) && snakeDir.x === 0) snakeDir = { x: -1, y: 0 };
        if ((keys.has('d') || keys.has('arrowright')) && snakeDir.x === 0) snakeDir = { x: 1, y: 0 };

        if (tickCount % 6 === 0) {
          const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
          if (
            head.x < 0 ||
            head.x >= 32 ||
            head.y < 0 ||
            head.y >= 19 ||
            snake.some((s) => s.x === head.x && s.y === head.y)
          ) {
            alive = false;
            setStatus('gameover');
          } else {
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
              localScore += 30;
              setScore(localScore);
              food = { x: Math.floor(Math.random() * 30) + 1, y: Math.floor(Math.random() * 17) + 1 };
            } else {
              snake.pop();
            }
          }
        }
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(food.x * 20 + 2, food.y * 20 + 2, 16, 16);
        snake.forEach((s, idx) => {
          ctx.fillStyle = idx === 0 ? '#22d3ee' : '#34d399';
          ctx.fillRect(s.x * 20 + 1, s.y * 20 + 1, 18, 18);
        });
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [gameId, runSeed]);

  const info = BUILTIN_GAMES.find((g) => g.id === gameId)!;

  return (
    <div className="fixed inset-0 z-[9996] bg-black/92 backdrop-blur-xl flex items-center justify-center p-3">
      <div className="w-full max-w-3xl rounded-3xl bg-[#090418] border border-cyan-400/50 p-4 space-y-3 shadow-[0_0_60px_rgba(34,211,238,0.3)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{info.emoji}</span>
            <div>
              <div className="text-sm font-black text-white">{info.title}</div>
              <div className="text-[11px] text-cyan-300 font-bold">Pontos: {score} · 100% Grátis</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRunSeed((s) => s + 1)}
              className="px-3 py-1.5 rounded-xl bg-cyan-400 text-black text-xs font-black"
            >
              Reiniciar
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black">
          <canvas ref={canvasRef} width={640} height={380} className="w-full h-auto block" />
          {status === 'gameover' && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3">
              <div className="font-display text-2xl font-black text-pink-400">GAME OVER</div>
              <div className="text-sm text-white font-bold">Pontuação Final: {score}</div>
              <button
                onClick={() => setRunSeed((s) => s + 1)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-black text-xs"
              >
                Jogar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Touch Buttons for Mobile/TV */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onPointerDown={() => keysRef.current.add('arrowleft')}
              onPointerUp={() => keysRef.current.delete('arrowleft')}
              onPointerLeave={() => keysRef.current.delete('arrowleft')}
              className="px-4 py-2 rounded-xl bg-white/10 active:bg-cyan-400 active:text-black font-black text-xs"
            >
              ◀ Esq
            </button>
            <button
              onPointerDown={() => keysRef.current.add('arrowup')}
              onPointerUp={() => keysRef.current.delete('arrowup')}
              onPointerLeave={() => keysRef.current.delete('arrowup')}
              className="px-4 py-2 rounded-xl bg-white/10 active:bg-cyan-400 active:text-black font-black text-xs"
            >
              ▲ Cima
            </button>
            <button
              onPointerDown={() => keysRef.current.add('arrowdown')}
              onPointerUp={() => keysRef.current.delete('arrowdown')}
              onPointerLeave={() => keysRef.current.delete('arrowdown')}
              className="px-4 py-2 rounded-xl bg-white/10 active:bg-cyan-400 active:text-black font-black text-xs"
            >
              ▼ Baixo
            </button>
            <button
              onPointerDown={() => keysRef.current.add('arrowright')}
              onPointerUp={() => keysRef.current.delete('arrowright')}
              onPointerLeave={() => keysRef.current.delete('arrowright')}
              className="px-4 py-2 rounded-xl bg-white/10 active:bg-cyan-400 active:text-black font-black text-xs"
            >
              Dir ▶
            </button>
          </div>
          <button
            onPointerDown={() => keysRef.current.add(' ')}
            onPointerUp={() => keysRef.current.delete(' ')}
            onPointerLeave={() => keysRef.current.delete(' ')}
            className="px-5 py-2 rounded-xl bg-pink-500 active:bg-pink-400 text-white font-black text-xs"
          >
            AÇÃO / TIRO
          </button>
        </div>
      </div>
    </div>
  );
};

export const ArcadeView: React.FC<Props> = ({ user, onToast }) => {
  const [sectorMenuOpen, setSectorMenuOpen] = useState(false);
  const [cosmicGameOpen, setCosmicGameOpen] = useState(false);
  const [builtInGame, setBuiltInGame] = useState<BuiltInMiniGameId | null>(null);
  const [activeEmbedGame, setActiveEmbedGame] = useState<ArcadeGameItem | null>(null);
  const [embedFullscreen, setEmbedFullscreen] = useState(false);

  const [categories, setCategories] = useState<ArcadeCategory[]>([]);
  const [searchResults, setSearchResults] = useState<ArcadeGameItem[] | null>(null);
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState<'all' | 'arcade' | 'console' | 'dos' | 'modern'>('all');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/arcade/directory');
      if (!res.ok) throw new Error('Falha ao carregar Fliperama');
      const json = await res.json();
      setCategories(json.categories || []);
    } catch {
      onToast('Não foi possível carregar o catálogo externo agora; os jogos do universo LENKYX estão 100% prontos!');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  const handleSearch = async (e?: React.FormEvent, overrideGen?: typeof generation) => {
    if (e) e.preventDefault();
    const gen = overrideGen ?? generation;
    if (!query.trim() && gen === 'all') {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/arcade/search?q=${encodeURIComponent(query.trim())}&generation=${encodeURIComponent(gen)}`
      );
      if (!res.ok) throw new Error('Erro na busca');
      const json = await res.json();
      setSearchResults(json.items || []);
    } catch {
      onToast('Erro ao pesquisar jogos agora.');
    } finally {
      setSearching(false);
    }
  };

  if (cosmicGameOpen) {
    return (
      <div className="pb-10">
        <CosmicPhonkWorldGame user={user} onToast={onToast} onExit={() => setCosmicGameOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Sector Top Strip + Contextual Toggle Menu (Stays compact so images & games stay clean!) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-cyan-300" />
          <h1 className="font-display text-lg sm:text-xl font-black text-white">
            Fliperama Cósmico · Todos os Jogos Grátis
          </h1>
        </div>
        <button
          onClick={() => setSectorMenuOpen((v) => !v)}
          className="px-3.5 py-2 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/45 text-cyan-100 text-xs font-black flex items-center gap-1.5 transition"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {sectorMenuOpen ? 'Fechar Menu Jogos' : 'Buscar & Filtrar Gerações'}
        </button>
      </div>

      {/* Contextual Arcade Search & Era Filter Drawer (Opens ONLY when tapped!) */}
      {sectorMenuOpen && (
        <div className="rounded-3xl bg-[#0c0622]/95 border border-cyan-400/40 p-4 space-y-3 shadow-2xl">
          <form onSubmit={(e) => void handleSearch(e)} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar qualquer jogo (ex: OutRun, Defender, Doom, Prince of Persia, RPG, Corrida...)"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs sm:text-sm text-white placeholder-purple-300/60 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-xs font-black hover:brightness-110"
            >
              {searching ? 'Buscando...' : 'Buscar Grátis'}
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: '🌐 Todas as Gerações' },
                { id: 'arcade', label: '🕹️ Fliperamas (Arcade)' },
                { id: 'console', label: '📺 Consoles Retrô' },
                { id: 'dos', label: '💾 PC MS-DOS' },
                { id: 'modern', label: '🚀 Online & PC Moderno' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setGeneration(f.id);
                  void handleSearch(undefined, f.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                  generation === f.id
                    ? 'bg-cyan-400 text-black border-white'
                    : 'bg-white/[0.06] text-purple-200 border-white/10 hover:bg-white/15'
                }`}
              >
                {f.label}
              </button>
            ))}
            {searchResults !== null && (
              <button
                onClick={() => {
                  setQuery('');
                  setGeneration('all');
                  setSearchResults(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/20 border border-rose-400/40 text-rose-200"
              >
                Limpar Filtro
              </button>
            )}
          </div>
        </div>
      )}

      {/* === FLAGSHIP FEATURED GAME: COSMIC PHONK: NOVO MUNDO === */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-400/50 bg-gradient-to-br from-[#160638] via-[#091836] to-[#2c0927] p-5 sm:p-7 shadow-[0_0_55px_rgba(34,211,238,0.2)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-300/50 text-cyan-200 text-[11px] font-black">
              <Sparkles className="w-3.5 h-3.5" /> JOGO EXCLUSIVO DO UNIVERSO LENKYX · 100% GRÁTIS & ONLINE
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
              🚀 COSMIC PHONK: NOVO MUNDO (Nova Aetheris)
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/85">
              Entre em um novo planeta desconhecido com <strong>4 biomas exploráveis por portais</strong>,{' '}
              <strong>5 armas futuristas da galáxia</strong>, chefões mundiais, missões online,{' '}
              <strong>10 relíquias raras de colecionador</strong> e jogadores conectados juntos em tempo real!
            </p>
          </div>
          <button
            onClick={() => setCosmicGameOpen(true)}
            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(236,72,153,0.5)] shrink-0 transition"
          >
            <Rocket className="w-5 h-5" /> ENTRAR NO NOVO MUNDO
          </button>
        </div>
      </div>

      {/* === BUILT-IN INSTANT ARCADE CLASSICS (Zero Loading, Offline/APK Ready) === */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-black text-white">
            ⚡ Fliperama Instantâneo LENKYX (Toque e Jogue na Hora — 100% Grátis)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BUILTIN_GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setBuiltInGame(g.id)}
              className={`text-left rounded-2xl p-4 bg-gradient-to-br ${g.gradient} border border-white/15 hover:border-cyan-300/70 transition group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{g.emoji}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/50 text-[10px] font-black text-emerald-300">
                  GRÁTIS
                </span>
              </div>
              <div className="text-sm font-black text-white group-hover:text-cyan-200">{g.title}</div>
              <div className="text-[11px] text-cyan-200/80 font-bold mb-1">
                {g.era} · {g.genre}
              </div>
              <p className="text-[11px] text-white/75 line-clamp-2">{g.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* === SEARCH RESULTS OR ALL-GENERATIONS CATALOG === */}
      {searchResults !== null ? (
        <section className="space-y-3">
          <h3 className="text-sm sm:text-base font-black text-white">
            🔎 Resultados em Todas as Gerações ({searchResults.length})
          </h3>
          {searchResults.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.04] border border-white/10 text-center text-xs text-purple-200">
              Nenhum jogo encontrado com esse termo. Tente outro nome ou geração!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveEmbedGame(item)}
                  className="text-left rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-cyan-400/60 transition group flex flex-col"
                >
                  <div className="aspect-[4/3] bg-black/60 relative overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black">
                      GRÁTIS
                    </span>
                  </div>
                  <div className="p-2.5 space-y-0.5">
                    <div className="text-xs font-black text-white truncate">{item.title}</div>
                    <div className="text-[10px] text-cyan-300 truncate">{item.generation}</div>
                    <div className="text-[10px] text-purple-200/70 truncate">
                      {item.year} · {item.source}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : loading ? (
        <div className="py-12 text-center text-xs text-cyan-200 font-bold">
          Carregando milhares de jogos gratuitos de fliperamas, consoles, PC & navegador...
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <ArcadeCarouselRow key={cat.id} category={cat} onSelectGame={setActiveEmbedGame} />
          ))}
        </div>
      )}

      {/* === BUILT-IN RETRO CABINET MODAL === */}
      {builtInGame && <BuiltInRetroCabinet gameId={builtInGame} onClose={() => setBuiltInGame(null)} />}

      {/* === EXTERNAL / INTERNET ARCHIVE EMULATOR MODAL === */}
      {activeEmbedGame && (
        <div className="fixed inset-0 z-[9996] bg-black/94 backdrop-blur-xl flex flex-col">
          <div className="h-14 px-4 border-b border-white/10 bg-[#090418] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setActiveEmbedGame(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Voltar ao Fliperama"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-white truncate">{activeEmbedGame.title}</div>
                <div className="text-[10px] text-cyan-300 truncate">
                  {activeEmbedGame.generation} · {activeEmbedGame.year} · 100% Grátis ({activeEmbedGame.source})
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={activeEmbedGame.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-cyan-400 text-black text-xs font-black flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir Tela Cheia
              </a>
              <button
                onClick={() => setEmbedFullscreen((v) => !v)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white hidden sm:flex"
              >
                {embedFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveEmbedGame(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto">
            {activeEmbedGame.playableInline && activeEmbedGame.embedUrl ? (
              <div className={`w-full ${embedFullscreen ? 'h-full' : 'max-w-4xl aspect-[4/3]'} rounded-2xl overflow-hidden border border-cyan-400/40 bg-black`}>
                <iframe
                  src={activeEmbedGame.embedUrl}
                  title={activeEmbedGame.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="max-w-lg w-full rounded-3xl bg-[#0e0724] border border-cyan-400/40 p-6 text-center space-y-4">
                <img
                  src={activeEmbedGame.thumbnailUrl}
                  alt={activeEmbedGame.title}
                  className="w-full h-52 object-cover rounded-2xl border border-white/15"
                />
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">{activeEmbedGame.title}</h3>
                  <p className="text-xs text-cyan-300 font-bold">
                    {activeEmbedGame.genre} · {activeEmbedGame.platform} · 100% Gratuito
                  </p>
                  {activeEmbedGame.description && (
                    <p className="text-xs text-purple-200/85 pt-1">{activeEmbedGame.description}</p>
                  )}
                </div>
                <a
                  href={activeEmbedGame.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-black text-sm flex items-center justify-center gap-2"
                >
                  <MonitorPlay className="w-5 h-5" /> Jogar Gratuitamente no Site Oficial
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ArcadeCarouselRow: React.FC<{
  category: ArcadeCategory;
  onSelectGame: (g: ArcadeGameItem) => void;
}> = ({ category, onSelectGame }) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const scroll = (dir: -1 | 1) => {
    rowRef.current?.scrollBy({ left: dir * 560, behavior: 'smooth' });
  };

  if (!category.items || category.items.length === 0) return null;

  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm sm:text-base font-black text-white">{category.title}</h3>
        <p className="text-[11px] text-purple-200/70">{category.subtitle}</p>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Anterior"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-16 rounded-2xl bg-black/50 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div ref={rowRef} className="flex gap-3 overflow-x-auto pb-2 px-1 scroll-smooth">
          {category.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectGame(item)}
              className="w-40 sm:w-44 shrink-0 text-left rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-cyan-400/65 transition group"
            >
              <div className="aspect-[4/3] bg-black/60 relative overflow-hidden">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                  <span className="text-[10px] font-black text-cyan-300 flex items-center gap-1">
                    <Play className="w-3 h-3 fill-cyan-300" /> Jogar Grátis
                  </span>
                </div>
              </div>
              <div className="p-2.5 space-y-0.5">
                <div className="text-xs font-black text-white truncate">{item.title}</div>
                <div className="text-[10px] text-cyan-300 truncate">{item.genre}</div>
                <div className="text-[10px] text-purple-200/70 truncate">
                  {item.year} · {item.source}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Próximo"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-16 rounded-2xl bg-black/50 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

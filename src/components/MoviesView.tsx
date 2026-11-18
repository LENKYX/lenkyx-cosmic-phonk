import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Hls from 'hls.js';
import {
  Clapperboard,
  Play,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Sparkles,
  Film,
  SkipBack,
  SkipForward,
  Tv,
  Radio,
  AlertCircle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { LiveTvCategory, LiveTvChannel, MovieItem } from '../types';
import {
  fetchLiveTvDirectory,
  fetchMoviesDirectory,
  MovieCategory,
  searchLiveTvCatalog,
  searchMoviesCatalog,
} from '../utils/moviesApi';
import { isAndroidApk } from '../utils/androidBridge';
import { CosmicGtaLoader } from './CosmicGtaLoader';

interface Props {
  onPauseMusic: () => void;
  onMovieModalChange: (watching: boolean) => void;
  volume?: number;
  muted?: boolean;
  onVolume?: (v: number) => void;
  onToggleMute?: () => void;
  onOpenTvCast?: (media: {
    title: string;
    artist?: string;
    mode?: 'galaxy' | 'video' | 'shorts' | 'tv';
    youtubeVideoId?: string;
    streamUrl?: string;
    coverUrl?: string;
  }) => void;
}

type SectionMode = 'cinema' | 'livetv';
type CinemaFilter = 'all' | 'releases' | 'movie' | 'series' | 'anime' | 'archive' | 'dubbed' | 'uhd';

const QUICK_SEARCH_CHIPS: Array<{ label: string; query: string; mediaType: 'movie' | 'series' | 'anime' | 'trailer' }> = [
  { label: `🍿 Lançamentos ${new Date().getFullYear()}`, query: `lancamentos cinema ${new Date().getFullYear()} trailer oficial dublado 4k`, mediaType: 'trailer' },
  { label: '🌍 Internacionais Dublados 1080p', query: 'melhores filmes internacionais completos dublados portugues 1080p', mediaType: 'movie' },
  { label: '📺 Séries Dubladas (Temporadas)', query: 'serie internacional completa dublado portugues episodio hd', mediaType: 'series' },
  { label: '⛩️ Animes Dublados (Temporadas)', query: 'anime completo dublado portugues filme episodio full hd', mediaType: 'anime' },
  { label: '🔥 Ação Full HD', query: 'filme de acao internacional completo dublado 1080p', mediaType: 'movie' },
  { label: '🚀 Ficção Científica HD', query: 'filme completo ficcao cientifica espaco dublado full hd', mediaType: 'movie' },
  { label: '👻 Terror Dublado HD', query: 'filme completo terror suspense internacional dublado hd', mediaType: 'movie' },
  { label: '🏎️ Carros & Drift', query: 'filme de corrida carros drift acao completo dublado full hd', mediaType: 'movie' },
];

const COUNTRY_FILTERS = [
  { code: 'ALL', label: '🌍 Mundo Todo' },
  { code: 'BR', label: '🇧🇷 Brasil' },
  { code: 'US', label: '🇺🇸 EUA' },
  { code: 'GB', label: '🇬🇧 Reino Unido' },
  { code: 'ES', label: '🇪🇸 Espanha' },
  { code: 'FR', label: '🇫🇷 França' },
  { code: 'JP', label: '🇯🇵 Japão' },
  { code: 'KR', label: '🇰🇷 Coreia' },
];

// Reusable Netflix+ Carousel Row with Translucent Clickable Left/Right Arrows for TV Cursor & Mouse!
const NetflixScrollableRow: React.FC<{
  title: string;
  emoji: string;
  count: number;
  collapsed: boolean;
  expandedGrid: boolean;
  onToggleCollapse: () => void;
  onToggleGrid: () => void;
  children: React.ReactNode;
}> = ({ title, emoji, count, collapsed, expandedGrid, onToggleCollapse, onToggleGrid, children }) => {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scrollRow = (dir: -1 | 1) => {
    const el = rowRef.current;
    if (!el) return;
    const step = Math.max(320, Math.round(el.clientWidth * 0.78));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="space-y-2.5 group/row">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="font-display text-xs sm:text-sm md:text-base font-black text-white flex items-center gap-2">
          <span>{emoji}</span>
          <span>{title}</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-cyan-300">
            {count}
          </span>
        </h2>
        <div className="flex items-center gap-1.5">
          {!collapsed && (
            <>
              <button
                type="button"
                onClick={() => scrollRow(-1)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/10 transition hidden sm:inline-flex"
                title="Rolar para Esquerda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollRow(1)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/10 transition hidden sm:inline-flex"
                title="Rolar para Direita"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onToggleGrid}
            className={`px-2.5 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1 transition ${
              expandedGrid
                ? 'bg-red-600/85 border-red-400 text-white'
                : 'bg-white/[0.07] hover:bg-white/[0.16] border-white/10 text-cyan-200'
            }`}
            title="Alternar entre Carrossel Netflix e Grade Completa (TV)"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>{expandedGrid ? 'Carrossel' : 'Ver Tudo'}</span>
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-[10px] font-bold text-purple-200 flex items-center gap-1 transition"
          >
            {collapsed ? 'Mostrar' : 'Minimizar'}
            {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {!collapsed &&
        (expandedGrid ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {children}
          </div>
        ) : (
          <div className="relative">
            {/* Translucent Left Floating Arrow for TV / Mouse Cursor */}
            <button
              type="button"
              onClick={() => scrollRow(-1)}
              aria-label="Passar filmes para a esquerda"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-10 h-20 sm:w-12 sm:h-24 rounded-2xl bg-black/45 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-[0_0_24px_rgba(0,0,0,0.7)] transition opacity-85 hover:opacity-100 hover:scale-105 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            <div
              ref={rowRef}
              className="flex items-stretch gap-3 overflow-x-auto pb-2.5 px-2 scroll-smooth"
            >
              {children}
            </div>

            {/* Translucent Right Floating Arrow for TV / Mouse Cursor */}
            <button
              type="button"
              onClick={() => scrollRow(1)}
              aria-label="Passar filmes para a direita"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-10 h-20 sm:w-12 sm:h-24 rounded-2xl bg-black/45 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-[0_0_24px_rgba(0,0,0,0.7)] transition opacity-85 hover:opacity-100 hover:scale-105 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
        ))}
    </section>
  );
};

export const MoviesView: React.FC<Props> = ({
  onPauseMusic,
  onMovieModalChange,
  volume = 0.88,
  muted = false,
  onVolume,
  onToggleMute,
  onOpenTvCast,
}) => {
  const [sectionMode, setSectionMode] = useState<SectionMode>('cinema');

  // === CINEMA / SERIES / ANIMES STATE ===
  const [categories, setCategories] = useState<MovieCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('Atualizado agora');
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MovieItem[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<CinemaFilter>('all');
  const [globalTvGrid, setGlobalTvGrid] = useState(false);
  const [rowGridIds, setRowGridIds] = useState<Record<string, boolean>>({});
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeMovie, setActiveMovie] = useState<MovieItem | null>(null);
  const [movieQueue, setMovieQueue] = useState<MovieItem[]>([]);
  const [cinemaQuality, setCinemaQuality] = useState<'auto' | 'hd720' | 'hd1080' | 'hd2160'>('hd1080');
  const [expandedView, setExpandedView] = useState(false);

  // === LIVE TV GLOBAL STATE (also feeds 24h Movie & Series channels row!) ===
  const [tvCategories, setTvCategories] = useState<LiveTvCategory[]>([]);
  const [tvTotalAvailable, setTvTotalAvailable] = useState(0);
  const [tvLoading, setTvLoading] = useState(false);
  const [tvLoadedOnce, setTvLoadedOnce] = useState(false);
  const [tvSearchQ, setTvSearchQ] = useState('');
  const [tvCountry, setTvCountry] = useState('ALL');
  const [tvSearching, setTvSearching] = useState(false);
  const [tvSearchResults, setTvSearchResults] = useState<LiveTvChannel[] | null>(null);
  const [activeChannel, setActiveChannel] = useState<LiveTvChannel | null>(null);
  const [tvQueue, setTvQueue] = useState<LiveTvChannel[]>([]);
  const [tvStatusMsg, setTvStatusMsg] = useState<string>('');
  const [tvError, setTvError] = useState<string>('');
  const [tvLevels, setTvLevels] = useState<{ index: number; label: string }[]>([]);
  const [selectedTvLevel, setSelectedTvLevel] = useState<number>(-1);

  const playerBoxRef = useRef<HTMLDivElement | null>(null);
  const tvVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadCinemaCatalog = async (force = false, silent = false) => {
    if (!silent) setLoading(true);
    else setBackgroundRefreshing(true);
    try {
      const cats = await fetchMoviesDirectory(force);
      if (cats.length > 0) setCategories(cats);
      setLastUpdatedLabel(
        `Atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      );
    } finally {
      setLoading(false);
      setBackgroundRefreshing(false);
    }
  };

  useEffect(() => {
    void loadCinemaCatalog(false, false);
    // Also preload 24h Cinema & Series Live TV channels silently!
    void fetchLiveTvDirectory().then((res) => {
      setTvCategories(res.categories);
      setTvTotalAvailable(res.totalAvailable);
      setTvLoadedOnce(true);
    });

    // Auto-update releases & catalog every 25 minutes automatically!
    const autoTimer = window.setInterval(() => {
      void loadCinemaCatalog(true, true);
    }, 25 * 60 * 1000);
    return () => window.clearInterval(autoTimer);
  }, []);

  useEffect(() => {
    if (sectionMode === 'livetv' && !tvLoadedOnce) {
      setTvLoading(true);
      void fetchLiveTvDirectory().then((res) => {
        setTvCategories(res.categories);
        setTvTotalAvailable(res.totalAvailable);
        setTvLoadedOnce(true);
        setTvLoading(false);
      });
    }
  }, [sectionMode, tvLoadedOnce]);

  useEffect(() => {
    onMovieModalChange(Boolean(activeMovie || activeChannel));
    if (!activeMovie && !activeChannel) {
      setExpandedView(false);
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    }
    return () => onMovieModalChange(false);
  }, [activeMovie, activeChannel, onMovieModalChange]);

  // Smart TV D-Pad Arrow Key Navigation across Netflix cards!
  useEffect(() => {
    if (activeMovie || activeChannel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const cards = Array.from(
        containerRef.current?.querySelectorAll<HTMLButtonElement>('[data-tv-card="1"]') || []
      );
      if (cards.length === 0) return;
      const curIdx = cards.findIndex((c) => c === document.activeElement);
      if (curIdx === -1) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          cards[0].focus();
          cards[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
        return;
      }
      e.preventDefault();
      let nextIdx = curIdx;
      if (e.key === 'ArrowRight') nextIdx = Math.min(cards.length - 1, curIdx + 1);
      if (e.key === 'ArrowLeft') nextIdx = Math.max(0, curIdx - 1);
      if (e.key === 'ArrowDown') nextIdx = Math.min(cards.length - 1, curIdx + 4);
      if (e.key === 'ArrowUp') nextIdx = Math.max(0, curIdx - 4);
      cards[nextIdx].focus();
      cards[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMovie, activeChannel]);

  const toggleExpandPlayer = async () => {
    const next = !expandedView;
    setExpandedView(next);
    try {
      if (next && playerBoxRef.current?.requestFullscreen && !document.fullscreenElement) {
        await playerBoxRef.current.requestFullscreen();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Viewport-expanded fallback works seamlessly in APK WebViews!
    }
  };

  useEffect(() => {
    if (tvVideoRef.current) {
      tvVideoRef.current.volume = muted ? 0 : volume;
      tvVideoRef.current.muted = muted;
    }
  }, [volume, muted, activeChannel]);

  // === HLS LIVE TV PLAYER LIFECYCLE ===
  useEffect(() => {
    if (!activeChannel) return;
    const video = tvVideoRef.current;
    if (!video) return;

    setTvError('');
    setTvLevels([]);
    setSelectedTvLevel(-1);
    setTvStatusMsg('Conectando ao sinal ao vivo...');
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const startStream = (url: string, triedProxy: boolean) => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 20,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_ev, data) => {
          const lvls = (data?.levels || []).map((lvl, idx) => ({
            index: idx,
            label: lvl.height ? `${lvl.height}p` : `Nível ${idx + 1}`,
          }));
          setTvLevels(lvls);
          if (lvls.length > 1) {
            hls.currentLevel = lvls.length - 1;
            setSelectedTvLevel(lvls.length - 1);
          }
          setTvStatusMsg('AO VIVO · HD');
          video.volume = muted ? 0 : volume;
          video.muted = muted;
          void video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_ev, data) => {
          if (data.fatal) {
            if (!triedProxy && activeChannel.streamUrl.startsWith('https://')) {
              setTvStatusMsg('Tentando rota alternativa...');
              startStream(`/api/tv-proxy?url=${encodeURIComponent(activeChannel.streamUrl)}`, true);
            } else {
              setTvError('Este canal está temporariamente fora do ar. Clique em "Próximo Canal"!');
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener(
          'loadedmetadata',
          () => {
            setTvStatusMsg('AO VIVO · HD');
            void video.play().catch(() => {});
          },
          { once: true }
        );
      } else {
        setTvError('Seu navegador não suporta stream HLS ao vivo.');
      }
    };

    startStream(activeChannel.streamUrl, false);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel]);

  // Catalog Counts & Hero Pool
  const catalogStats = useMemo(() => {
    const ids = new Set<string>();
    let movies = 0;
    let series = 0;
    let animes = 0;
    let trailers = 0;
    for (const c of categories) {
      for (const m of c.movies || []) {
        if (ids.has(m.id)) continue;
        ids.add(m.id);
        if (m.isTrailer || m.mediaType === 'trailer') trailers++;
        else if (m.mediaType === 'anime') animes++;
        else if (m.mediaType === 'series') series++;
        else movies++;
      }
    }
    return { total: ids.size, movies, series, animes, trailers };
  }, [categories]);

  const heroItems = useMemo(() => {
    const picks: MovieItem[] = [];
    for (const c of categories.slice(0, 6)) {
      if (c.movies?.[0]) picks.push(c.movies[0]);
    }
    return picks;
  }, [categories]);

  const featuredMovie = heroItems[heroIdx % Math.max(1, heroItems.length)] || null;
  const featuredQueue = categories[0]?.movies || categories[1]?.movies || [];

  // Auto-rotate Netflix Hero Billboard gently every 9s
  useEffect(() => {
    if (heroItems.length < 2) return;
    const t = window.setInterval(() => {
      setHeroIdx((i) => (i + 1) % heroItems.length);
    }, 9000);
    return () => window.clearInterval(t);
  }, [heroItems.length]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRowGrid = (id: string) => {
    setRowGridIds((prev) => ({ ...prev, [id]: !(prev[id] ?? globalTvGrid) }));
  };

  const handleOpenMovie = (m: MovieItem, queueList: MovieItem[]) => {
    onPauseMusic();
    setActiveChannel(null);
    setMovieQueue(queueList.length ? queueList : [m]);
    setActiveMovie(m);
  };

  const handleOpenChannel = (ch: LiveTvChannel, queueList: LiveTvChannel[]) => {
    onPauseMusic();
    setActiveMovie(null);
    setTvQueue(queueList.length ? queueList : [ch]);
    setActiveChannel(ch);
  };

  const stepMovie = (dir: -1 | 1) => {
    if (!activeMovie || movieQueue.length < 2) return;
    const idx = movieQueue.findIndex((x) => x.id === activeMovie.id);
    const nextIdx = (idx + dir + movieQueue.length) % movieQueue.length;
    setActiveMovie(movieQueue[nextIdx]);
  };

  const stepChannel = (dir: -1 | 1) => {
    if (!activeChannel || tvQueue.length < 2) return;
    const idx = tvQueue.findIndex((x) => x.id === activeChannel.id);
    const nextIdx = (idx + dir + tvQueue.length) % tvQueue.length;
    setActiveChannel(tvQueue[nextIdx]);
  };

  const runSearch = async (rawQ: string, forcedType?: 'movie' | 'series' | 'anime' | 'trailer') => {
    const q = rawQ.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearchQ(rawQ);
    setSearching(true);
    try {
      const low = q.toLowerCase();
      const isTrailer = forcedType === 'trailer' || low.includes('trailer');
      const inferredType: 'movie' | 'series' | 'anime' | 'trailer' = isTrailer
        ? 'trailer'
        : forcedType || (low.includes('anime') ? 'anime' : low.includes('serie') || low.includes('série') ? 'series' : 'movie');

      let finalQ = q;
      if (!isTrailer) {
        if (!low.includes('dublado') && !low.includes('legendado')) finalQ = `${finalQ} dublado`;
        if (!low.includes('completo') && inferredType === 'movie') finalQ = `${finalQ} filme completo`;
        if (!low.includes('hd') && !low.includes('1080') && !low.includes('4k')) finalQ = `${finalQ} full hd`;
      }
      const items = await searchMoviesCatalog(finalQ, isTrailer, inferredType);
      setSearchResults(items);
    } finally {
      setSearching(false);
    }
  };

  const runTvSearch = async (rawQ: string, countryCode = tvCountry) => {
    setTvSearching(true);
    try {
      const res = await searchLiveTvCatalog(rawQ.trim(), countryCode);
      setTvSearchResults(res.channels);
      if (res.totalAvailable) setTvTotalAvailable(res.totalAvailable);
    } finally {
      setTvSearching(false);
    }
  };

  const matchesFilter = (m: MovieItem): boolean => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'releases') {
      return (
        m.isTrailer ||
        m.mediaType === 'trailer' ||
        (m.category || '').toLowerCase().includes('lançamento') ||
        m.title.includes(String(new Date().getFullYear()))
      );
    }
    if (activeFilter === 'movie') return (m.mediaType || 'movie') === 'movie' && !m.isTrailer;
    if (activeFilter === 'series') return m.mediaType === 'series';
    if (activeFilter === 'anime') return m.mediaType === 'anime';
    if (activeFilter === 'archive') return m.sourceLabel === 'Acervo Direto' || m.id.startsWith('arcmov-');
    if (activeFilter === 'dubbed') return Boolean(m.isDubbed);
    if (activeFilter === 'uhd') {
      const q = (m.qualityLabel || '').toLowerCase();
      return q.includes('4k') || q.includes('1080') || q.includes('full hd');
    }
    return true;
  };

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => ({ ...cat, movies: (cat.movies || []).filter(matchesFilter) }))
      .filter((cat) => cat.movies.length > 0);
  }, [categories, activeFilter]);

  const filteredSearchResults = useMemo(() => {
    if (searchResults === null) return null;
    return searchResults.filter(matchesFilter);
  }, [searchResults, activeFilter]);

  // 24/7 Cinema & Series Live Channels merged cleanly into Cinema tab too!
  const liveCinemaAndSeriesChannels = useMemo(() => {
    return tvCategories
      .filter((c) => c.id === 'tv-filmes' || c.id === 'tv-series-24h' || c.id === 'tv-animes')
      .flatMap((c) => c.channels || [])
      .slice(0, 48);
  }, [tvCategories]);

  const renderPosterCard = (m: MovieItem, idx: number, queueList: MovieItem[], compactGrid = false) => (
    <button
      key={m.id}
      type="button"
      data-tv-card="1"
      onClick={() => handleOpenMovie(m, queueList)}
      className={`group text-left rounded-2xl cosmic-card-3d overflow-hidden outline-none focus:ring-4 focus:ring-red-500 focus:scale-[1.05] focus:z-20 transition duration-200 ${
        compactGrid ? 'w-full' : 'w-52 sm:w-60 shrink-0'
      }`}
    >
      <div className="relative aspect-[16/10] bg-black">
        <img
          src={m.posterUrl}
          alt={m.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black shadow ${
            m.isTrailer
              ? 'bg-amber-400 text-black'
              : m.youtubePlaylistId
                ? 'bg-violet-500 text-white'
                : m.mediaType === 'anime'
                  ? 'bg-fuchsia-600/95 text-white'
                  : m.mediaType === 'series'
                    ? 'bg-cyan-500/95 text-black'
                    : m.sourceLabel === 'Acervo Direto'
                      ? 'bg-amber-500/95 text-black'
                      : 'bg-red-600/95 text-white'
          }`}
        >
          #{idx + 1} · {m.sourceLabel}
        </span>

        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {m.qualityLabel && (
            <span className="px-1.5 py-0.5 rounded bg-black/85 border border-cyan-400/40 text-[9px] font-black text-cyan-300">
              {m.qualityLabel.includes('4K')
                ? '4K'
                : m.qualityLabel.includes('1080')
                  ? '1080p'
                  : 'HD'}
            </span>
          )}
          {m.isDubbed && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/95 text-[8px] font-black text-black uppercase">
              Dublado
            </span>
          )}
        </div>

        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono text-white">
          {m.durationLabel}
        </span>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition">
          <span className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </span>
        </div>
      </div>
      <div className="p-3 space-y-0.5">
        <div className="text-xs font-extrabold text-white line-clamp-2 group-hover:text-red-300 group-focus:text-red-300 transition">
          {m.title}
        </div>
        <div className="text-[10px] text-purple-300/75 truncate">{m.subtitle}</div>
      </div>
    </button>
  );

  const renderChannelCard = (ch: LiveTvChannel, queueList: LiveTvChannel[], compactGrid = false) => (
    <button
      key={ch.id}
      type="button"
      data-tv-card="1"
      onClick={() => handleOpenChannel(ch, queueList)}
      className={`group text-left rounded-2xl cosmic-card-3d overflow-hidden p-3 flex flex-col justify-between gap-2.5 bg-gradient-to-br from-[#0e0722] to-[#070312] hover:border-cyan-400/50 outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-[1.05] focus:z-20 transition ${
        compactGrid ? 'w-full' : 'w-48 sm:w-56 shrink-0'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-14 h-10 rounded-xl bg-black/70 border border-white/10 flex items-center justify-center overflow-hidden p-1 shrink-0">
          {ch.logo ? (
            <img src={ch.logo} alt={ch.name} loading="lazy" className="max-w-full max-h-full object-contain" />
          ) : (
            <Tv className="w-5 h-5 text-cyan-300" />
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="px-1.5 py-0.5 rounded bg-red-600/90 text-[9px] font-black text-white flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> AO VIVO
          </span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/35 text-[9px] font-black text-cyan-300">
            {ch.country} · {ch.quality || 'HD'}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs font-black text-white line-clamp-1 group-hover:text-cyan-300 transition">
          {ch.name}
        </div>
        <div className="text-[10px] text-purple-300/75 truncate">
          {ch.network ? `${ch.network} · ` : ''}
          {(ch.categories || []).slice(0, 2).join(' · ') || 'TV Aberta'}
        </div>
      </div>
    </button>
  );

  // Fullscreen Cinema / Live TV Portal
  const cinemaModal =
    activeMovie &&
    createPortal(
      <div
        ref={playerBoxRef}
        className={`fixed inset-0 z-[9999] bg-black flex flex-col justify-center overflow-y-auto ${
          expandedView ? 'p-0' : 'p-2 sm:p-5'
        }`}
      >
        <div
          className={`w-full mx-auto my-auto overflow-hidden bg-[#06030d] flex flex-col ${
            expandedView
              ? 'h-full max-w-none rounded-none border-0'
              : 'max-w-6xl max-h-[94dvh] rounded-3xl border border-white/15 shadow-[0_0_90px_rgba(220,38,38,0.28)]'
          }`}
        >
          <div className="px-3 sm:px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#080414] shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Film className="w-4 h-4 text-red-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-white truncate">{activeMovie.title}</div>
                <div className="text-[10px] text-purple-300/80 truncate">
                  {activeMovie.subtitle} · {activeMovie.durationLabel} · {activeMovie.qualityLabel || 'HD'}
                  {activeMovie.isDubbed ? ' · Dublado PT-BR' : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {(activeMovie.youtubeVideoId || activeMovie.youtubePlaylistId) && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 border border-cyan-400/35">
                  <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
                  <select
                    value={cinemaQuality}
                    onChange={(e) => setCinemaQuality(e.target.value as typeof cinemaQuality)}
                    className="bg-transparent text-[11px] font-black text-cyan-200 focus:outline-none cursor-pointer"
                    title="Melhorar Resolução do Vídeo"
                  >
                    <option value="auto" className="bg-[#0b0618]">Auto</option>
                    <option value="hd720" className="bg-[#0b0618]">720p HD</option>
                    <option value="hd1080" className="bg-[#0b0618]">1080p Full HD</option>
                    <option value="hd2160" className="bg-[#0b0618]">4K Ultra HD</option>
                  </select>
                </div>
              )}

              {onVolume && onToggleMute && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/10 border border-white/10">
                  <button
                    onClick={onToggleMute}
                    className="text-cyan-300 hover:text-white"
                    title={muted ? 'Ativar Som' : 'Silenciar'}
                  >
                    {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={muted ? 0 : volume}
                    onChange={(e) => onVolume(Number(e.target.value))}
                    className="w-16 accent-cyan-400 cursor-pointer"
                  />
                </div>
              )}

              {onOpenTvCast && (
                <button
                  onClick={() =>
                    onOpenTvCast({
                      title: activeMovie.title,
                      artist: activeMovie.subtitle,
                      mode: 'video',
                      youtubeVideoId: activeMovie.youtubeVideoId,
                      streamUrl: activeMovie.videoStreamUrl,
                      coverUrl: activeMovie.posterUrl,
                    })
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-blue-500/25 hover:bg-blue-500/40 border border-cyan-400/45 text-cyan-100 text-[11px] font-black flex items-center gap-1"
                  title="Passar este filme/série para a Smart TV"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">TV</span>
                </button>
              )}

              <button
                onClick={() => void toggleExpandPlayer()}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/45 text-cyan-100 text-[11px] font-black flex items-center gap-1"
              >
                {expandedView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{expandedView ? 'Reduzir' : 'Ampliar'}</span>
              </button>

              {movieQueue.length > 1 && (
                <>
                  <button
                    onClick={() => stepMovie(-1)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    title="Anterior"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => stepMovie(1)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1"
                    title="Próximo da Sequência"
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {activeMovie.externalUrl && (
                <button
                  onClick={() => {
                    if (isAndroidApk() && window.AndroidBridge?.openExternalUrl) {
                      window.AndroidBridge.openExternalUrl(activeMovie.externalUrl!);
                    } else {
                      window.open(activeMovie.externalUrl!, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Fonte</span>
                </button>
              )}
              <button
                onClick={() => setActiveMovie(null)}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-red-600 text-white text-xs font-black flex items-center gap-1"
                title="Fechar Cinema"
              >
                <X className="w-4 h-4" /> Fechar
              </button>
            </div>
          </div>

          <div className={`w-full bg-black ${expandedView ? 'flex-1 min-h-0' : 'flex-1 min-h-[240px] aspect-video'}`}>
            <iframe
              key={`${activeMovie.id}-${cinemaQuality}`}
              src={
                activeMovie.youtubePlaylistId
                  ? `https://www.youtube.com/embed/videoseries?list=${activeMovie.youtubePlaylistId}&autoplay=1&rel=0&playsinline=1${cinemaQuality !== 'auto' ? `&vq=${cinemaQuality}` : ''}&hl=pt-BR&cc_lang_pref=pt`
                  : activeMovie.youtubeVideoId
                    ? `https://www.youtube.com/embed/${activeMovie.youtubeVideoId}?autoplay=1&rel=0&playsinline=1${cinemaQuality !== 'auto' ? `&vq=${cinemaQuality}` : ''}&hl=pt-BR&cc_lang_pref=pt`
                    : activeMovie.videoStreamUrl || ''
              }
              title={activeMovie.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {!expandedView && movieQueue.length > 1 && (
            <div className="p-3 border-t border-white/10 bg-[#080412] space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-red-300">
                  🎞️ Na Sequência ({movieQueue.length} títulos — toque para trocar)
                </div>
              </div>
              <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
                {movieQueue.map((item, idx) => {
                  const isCur = item.id === activeMovie.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveMovie(item)}
                      className={`w-44 shrink-0 text-left rounded-xl overflow-hidden border transition ${
                        isCur
                          ? 'border-red-500 bg-red-500/15'
                          : 'border-white/10 bg-white/[0.04] hover:bg-white/10'
                      }`}
                    >
                      <div className="relative aspect-video bg-black">
                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-bold text-white">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="p-1.5">
                        <div className="text-[10px] font-bold text-white line-clamp-1">{item.title}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );

  const liveTvModal =
    activeChannel &&
    createPortal(
      <div
        ref={playerBoxRef}
        className={`fixed inset-0 z-[9999] bg-black flex flex-col justify-center overflow-y-auto ${
          expandedView ? 'p-0' : 'p-2 sm:p-5'
        }`}
      >
        <div
          className={`w-full mx-auto my-auto overflow-hidden bg-[#05030d] flex flex-col ${
            expandedView
              ? 'h-full max-w-none rounded-none border-0'
              : 'max-w-6xl max-h-[94dvh] rounded-3xl border border-cyan-400/25 shadow-[0_0_90px_rgba(6,182,212,0.28)]'
          }`}
        >
          <div className="px-3 sm:px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#070414] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Radio className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-white truncate">
                  {activeChannel.name} · {activeChannel.country}
                </div>
                <div className="text-[10px] text-cyan-300/85 truncate">
                  {tvStatusMsg || `${activeChannel.quality || 'HD'} · Sinal Aberto Mundial`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {tvLevels.length > 1 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 border border-cyan-400/35">
                  <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
                  <select
                    value={selectedTvLevel}
                    onChange={(e) => {
                      const lvl = Number(e.target.value);
                      setSelectedTvLevel(lvl);
                      if (hlsRef.current) hlsRef.current.currentLevel = lvl;
                    }}
                    className="bg-transparent text-[11px] font-black text-cyan-200 focus:outline-none cursor-pointer"
                  >
                    <option value={-1} className="bg-[#0b0618]">Auto</option>
                    {tvLevels.map((l) => (
                      <option key={l.index} value={l.index} className="bg-[#0b0618]">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onVolume && onToggleMute && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/10 border border-white/10">
                  <button onClick={onToggleMute} className="text-cyan-300 hover:text-white">
                    {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={muted ? 0 : volume}
                    onChange={(e) => onVolume(Number(e.target.value))}
                    className="w-16 accent-cyan-400 cursor-pointer"
                  />
                </div>
              )}

              <button
                onClick={() => void toggleExpandPlayer()}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/45 text-cyan-100 text-[11px] font-black flex items-center gap-1"
              >
                {expandedView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{expandedView ? 'Reduzir' : 'Ampliar'}</span>
              </button>

              {tvQueue.length > 1 && (
                <>
                  <button
                    onClick={() => stepChannel(-1)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => stepChannel(1)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Próximo Canal</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveChannel(null)}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-red-600 text-white text-xs font-black flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Fechar
              </button>
            </div>
          </div>

          <div className={`relative w-full bg-black ${expandedView ? 'flex-1 min-h-0' : 'flex-1 min-h-[240px] aspect-video'}`}>
            <video ref={tvVideoRef} controls autoPlay playsInline className="w-full h-full object-contain bg-black" />
            {tvError && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center gap-3">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <p className="text-sm font-bold text-white max-w-md">{tvError}</p>
                {tvQueue.length > 1 && (
                  <button
                    onClick={() => stepChannel(1)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-black text-xs"
                  >
                    Ir para Próximo Canal ⏭️
                  </button>
                )}
              </div>
            )}
          </div>

          {!expandedView && tvQueue.length > 1 && (
            <div className="p-3 border-t border-white/10 bg-[#070412] space-y-2 shrink-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                📡 Mudar de Canal ({tvQueue.length} canais sintonizáveis)
              </div>
              <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
                {tvQueue.map((ch) => {
                  const isCur = ch.id === activeChannel.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannel(ch)}
                      className={`px-3 py-2 rounded-xl border shrink-0 text-left flex items-center gap-2 transition ${
                        isCur
                          ? 'border-cyan-400 bg-cyan-500/20 text-white'
                          : 'border-white/10 bg-white/[0.04] hover:bg-white/10 text-purple-200'
                      }`}
                    >
                      <span className="text-[10px] font-black text-cyan-300">{ch.country}</span>
                      <span className="text-xs font-bold whitespace-nowrap">{ch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={containerRef} className="space-y-4 pb-36 md:pb-28">
      {/* Discreet GTA-5 Style Corner Loader during Auto-Update */}
      <CosmicGtaLoader
        open={backgroundRefreshing}
        mode="discreet_corner"
        statusText="Atualizando lançamentos..."
        onSkip={() => setBackgroundRefreshing(false)}
      />

      {/* Top Mode Switcher + Live Counts + Auto-Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSectionMode('cinema')}
            className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border transition ${
              sectionMode === 'cinema'
                ? 'bg-gradient-to-r from-red-600 to-pink-600 border-red-400 text-white shadow-lg'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-purple-200'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            🎬 Netflix+ ({catalogStats.total > 0 ? `${catalogStats.movies} Filmes · ${catalogStats.series} Séries · ${catalogStats.animes} Animes` : '300+ Filmes, Séries & Animes'})
          </button>

          <button
            onClick={() => setSectionMode('livetv')}
            className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border transition ${
              sectionMode === 'livetv'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-600 border-cyan-300 text-black shadow-lg'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-cyan-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            📡 TV ao Vivo {tvTotalAvailable > 0 ? `(${tvTotalAvailable.toLocaleString('pt-BR')} Canais)` : '(Brasil & Mundo)'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGlobalTvGrid((v) => !v)}
            className={`px-3 py-2 rounded-xl text-[11px] font-black border flex items-center gap-1.5 transition ${
              globalTvGrid
                ? 'bg-red-600 border-red-400 text-white'
                : 'bg-white/[0.07] hover:bg-white/15 border-white/15 text-cyan-200'
            }`}
            title="Modo Grade TV: exibe tudo em grade sem precisar arrastar para o lado"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{globalTvGrid ? 'Modo Netflix ◀▶' : 'Grade TV Completa'}</span>
          </button>

          <button
            onClick={() => void loadCinemaCatalog(true, true)}
            disabled={backgroundRefreshing}
            className="px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/15 border border-white/15 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 transition"
            title="Buscar novos lançamentos de cinema automaticamente agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${backgroundRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lastUpdatedLabel}</span>
          </button>
        </div>
      </div>

      {sectionMode === 'cinema' ? (
        <>
          {/* Netflix+ Rotating Hero Billboard OR GTA-5 Style Loading Stage */}
          {loading ? (
            <CosmicGtaLoader
              open={true}
              mode="stage"
              statusText="Carregando 300+ Filmes, 100+ Séries & Lançamentos..."
            />
          ) : featuredMovie ? (
            <section className="relative rounded-[28px] overflow-hidden border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] min-h-[240px] sm:min-h-[290px] flex flex-col justify-end">
              <img
                key={featuredMovie.id}
                src={featuredMovie.posterUrl}
                alt={featuredMovie.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 gta-ken-burns"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04010c] via-[#04010c]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#04010c]/95 via-[#04010c]/55 to-transparent" />

              {/* Translucent Hero Billboard Left/Right Arrows */}
              {heroItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setHeroIdx((i) => (i - 1 + heroItems.length) % heroItems.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-16 rounded-2xl bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition"
                    title="Destaque Anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroIdx((i) => (i + 1) % heroItems.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-16 rounded-2xl bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition"
                    title="Próximo Destaque"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div className="relative z-10 p-5 sm:p-8 sm:pl-16 max-w-2xl space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-[10px] font-black uppercase tracking-wider text-white">
                    <Clapperboard className="w-3 h-3" /> TOP {(heroIdx % Math.max(1, heroItems.length)) + 1} · {featuredMovie.durationLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/25 border border-cyan-400/45 text-[10px] font-black text-cyan-200">
                    {featuredMovie.qualityLabel || 'Full HD 1080p'}
                  </span>
                  {featuredMovie.isDubbed && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-[10px] font-black text-black">
                      Dublado PT-BR
                    </span>
                  )}
                </div>
                <h1 className="font-display text-xl sm:text-3xl font-black text-white line-clamp-2 drop-shadow">
                  {featuredMovie.title}
                </h1>
                <p className="text-xs text-purple-100/85">
                  {featuredMovie.subtitle} · Use as setinhas transparentes ◀ ▶ ou as setas do controle da TV para navegar facilmente.
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={() => handleOpenMovie(featuredMovie, featuredQueue)}
                    className="px-6 py-2.5 rounded-full bg-white hover:bg-purple-100 text-black font-black text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-black" /> Assistir Agora
                  </button>
                  {onOpenTvCast && (
                    <button
                      onClick={() =>
                        onOpenTvCast({
                          title: featuredMovie.title,
                          artist: featuredMovie.subtitle,
                          mode: 'video',
                          youtubeVideoId: featuredMovie.youtubeVideoId,
                          streamUrl: featuredMovie.videoStreamUrl,
                          coverUrl: featuredMovie.posterUrl,
                        })
                      }
                      className="px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white font-black text-xs flex items-center gap-1.5 backdrop-blur-md transition"
                    >
                      <Tv className="w-4 h-4 text-cyan-300" /> Passar p/ TV
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {/* Search Movies, Series & Animes */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch(searchQ);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-red-300/80 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Buscar lançamentos 2026, filme dublado, série, anime ou saga..."
                className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 text-xs sm:text-sm text-white placeholder-purple-300/55 focus:outline-none focus:border-red-400"
              />
              {searchResults !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQ('');
                    setSearchResults(null);
                  }}
                  className="absolute right-20 p-1 text-purple-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={searching}
                className="absolute right-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white text-[11px] font-black"
              >
                {searching ? '...' : 'Buscar'}
              </button>
            </div>
          </form>

          {/* Filter Pills & Quick Discovery Chips */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all' as CinemaFilter, label: '🎬 Tudo' },
                { id: 'releases' as CinemaFilter, label: `🍿 Lançamentos ${new Date().getFullYear()}` },
                { id: 'movie' as CinemaFilter, label: '🌍 Filmes Completos' },
                { id: 'series' as CinemaFilter, label: '📺 Séries' },
                { id: 'anime' as CinemaFilter, label: '⛩️ Animes' },
                { id: 'archive' as CinemaFilter, label: '🏛️ Acervo Direto' },
                { id: 'dubbed' as CinemaFilter, label: '🎙️ Dublados' },
                { id: 'uhd' as CinemaFilter, label: '💎 1080p / 4K' },
              ].map((pill) => {
                const active = activeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setActiveFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border transition ${
                      active
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 border-red-400 text-white shadow'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-purple-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {QUICK_SEARCH_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => void runSearch(chip.query, chip.mediaType)}
                  className="px-2.5 py-1 rounded-xl bg-black/45 hover:bg-white/10 border border-white/10 text-[10px] font-semibold text-cyan-200 whitespace-nowrap transition"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {filteredSearchResults !== null && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-display text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-400" /> Resultados HD para "{searchQ}" ({filteredSearchResults.length})
                </h2>
              </div>
              {filteredSearchResults.length === 0 ? (
                <div className="py-10 text-center rounded-2xl cosmic-card-3d text-xs text-purple-300">
                  Nenhum título encontrado com esse filtro. Tente mudar o filtro acima ou buscar outro título.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredSearchResults.map((m, idx) => renderPosterCard(m, idx, filteredSearchResults, true))}
                </div>
              )}
            </div>
          )}

          {/* 24/7 Live Cinema, Series & Anime Channels Strip right inside Netflix+ */}
          {!loading && liveCinemaAndSeriesChannels.length > 0 && activeFilter === 'all' && (
            <NetflixScrollableRow
              title="Canais de Filmes, Séries & Animes 24h Ao Vivo (Pluto TV, Plex & Mundo)"
              emoji="📡"
              count={liveCinemaAndSeriesChannels.length}
              collapsed={Boolean(collapsedIds['cinema-24h-live'])}
              expandedGrid={rowGridIds['cinema-24h-live'] ?? globalTvGrid}
              onToggleCollapse={() => toggleCollapse('cinema-24h-live')}
              onToggleGrid={() => toggleRowGrid('cinema-24h-live')}
            >
              {liveCinemaAndSeriesChannels.map((ch) =>
                renderChannelCard(ch, liveCinemaAndSeriesChannels, rowGridIds['cinema-24h-live'] ?? globalTvGrid)
              )}
            </NetflixScrollableRow>
          )}

          {/* Netflix+ Movie, Series, Anime & Release Rows */}
          {!loading && (
            <div className="space-y-6">
              {filteredCategories.map((cat) => {
                const isGrid = rowGridIds[cat.id] ?? globalTvGrid;
                return (
                  <NetflixScrollableRow
                    key={cat.id}
                    title={cat.title}
                    emoji={cat.emoji}
                    count={cat.movies.length}
                    collapsed={Boolean(collapsedIds[cat.id])}
                    expandedGrid={isGrid}
                    onToggleCollapse={() => toggleCollapse(cat.id)}
                    onToggleGrid={() => toggleRowGrid(cat.id)}
                  >
                    {cat.movies.map((m, idx) => renderPosterCard(m, idx, cat.movies, isGrid))}
                  </NetflixScrollableRow>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* === LIVE TV MUNDIAL SECTION === */
        <div className="space-y-4">
          <section className="rounded-[28px] cosmic-card-3d p-5 sm:p-6 bg-gradient-to-br from-cyan-500/15 via-[#0b061d] to-blue-600/15 border border-cyan-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/90 text-[10px] font-black text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> TV ABERTA MUNDIAL · 24 HORAS
              </div>
              <h1 className="font-display text-lg sm:text-2xl font-black text-white">
                Canais de TV do Brasil & do Mundo ({tvTotalAvailable > 0 ? tvTotalAvailable.toLocaleString('pt-BR') : '7.000+'} Liberados)
              </h1>
              <p className="text-xs text-cyan-100/80">
                Use as setinhas transparentes ◀ ▶ ou o modo Grade TV para escolher canais facilmente na Smart TV.
              </p>
            </div>
          </section>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runTvSearch(tvSearchQ, tvCountry);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-cyan-300/80 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={tvSearchQ}
                onChange={(e) => setTvSearchQ(e.target.value)}
                placeholder="Buscar canal de TV, filmes 24h, anime, esporte, notícia ou país..."
                className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 text-xs sm:text-sm text-white placeholder-purple-300/55 focus:outline-none focus:border-cyan-400"
              />
              {tvSearchResults !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setTvSearchQ('');
                    setTvCountry('ALL');
                    setTvSearchResults(null);
                  }}
                  className="absolute right-20 p-1 text-purple-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={tvSearching}
                className="absolute right-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-black text-[11px] font-black"
              >
                {tvSearching ? '...' : 'Buscar'}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {COUNTRY_FILTERS.map((cf) => {
              const active = tvCountry === cf.code;
              return (
                <button
                  key={cf.code}
                  onClick={() => {
                    setTvCountry(cf.code);
                    if (cf.code === 'ALL' && !tvSearchQ.trim()) {
                      setTvSearchResults(null);
                    } else {
                      void runTvSearch(tvSearchQ, cf.code);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border transition ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 border-cyan-300 text-black'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-purple-200'
                  }`}
                >
                  {cf.label}
                </button>
              );
            })}
          </div>

          {tvSearchResults !== null && (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-black text-white flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-300" /> Canais Encontrados ({tvSearchResults.length})
              </h2>
              {tvSearchResults.length === 0 ? (
                <div className="py-10 text-center rounded-2xl cosmic-card-3d text-xs text-purple-300">
                  Nenhum canal encontrado para essa busca.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {tvSearchResults.map((ch) => renderChannelCard(ch, tvSearchResults, true))}
                </div>
              )}
            </div>
          )}

          {tvLoading ? (
            <CosmicGtaLoader
              open={true}
              mode="stage"
              statusText="Sintonizando 7.200+ canais de TV do Brasil e do mundo..."
            />
          ) : (
            <div className="space-y-6">
              {tvCategories.map((cat) => {
                if (!cat.channels || cat.channels.length === 0) return null;
                const isGrid = rowGridIds[cat.id] ?? globalTvGrid;
                return (
                  <NetflixScrollableRow
                    key={cat.id}
                    title={cat.title}
                    emoji={cat.emoji}
                    count={cat.channels.length}
                    collapsed={Boolean(collapsedIds[cat.id])}
                    expandedGrid={isGrid}
                    onToggleCollapse={() => toggleCollapse(cat.id)}
                    onToggleGrid={() => toggleRowGrid(cat.id)}
                  >
                    {cat.channels.map((ch) => renderChannelCard(ch, cat.channels, isGrid))}
                  </NetflixScrollableRow>
                );
              })}
            </div>
          )}
        </div>
      )}

      {cinemaModal}
      {liveTvModal}
    </div>
  );
};

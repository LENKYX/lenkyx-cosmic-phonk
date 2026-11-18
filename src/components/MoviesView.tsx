import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Clapperboard,
  Play,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Film,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  LayoutGrid,
  RefreshCw,
  Layers,
  Loader2,
  QrCode,
  ShieldOff,
  Crown,
} from 'lucide-react';
import { MovieItem, SeriesEpisodeItem, SeriesSeasonInfo } from '../types';
import {
  fetchMoviesDirectory,
  fetchSeriesSeasonsAndEpisodes,
  MovieCategory,
  searchMoviesCatalog,
} from '../utils/moviesApi';
import { fetchTop5Rankings, RankedMovieEntry, recordRankingHit } from '../utils/rankingsApi';
import { clearBackgroundMediaSession, syncBackgroundMediaSession } from '../utils/backgroundAudioGuard';
import { CosmicGtaLoader } from './CosmicGtaLoader';
import { PlayerQueueStrip } from './PlayerQueueStrip';

interface Props {
  onPauseMusic: () => void;
  onMovieModalChange: (watching: boolean) => void;
  volume?: number;
  muted?: boolean;
  onVolume?: (v: number) => void;
  onToggleMute?: () => void;
  onOpenPix?: () => void;
  onEmergencyStop?: () => void;
  initialMovie?: MovieItem | null;
  onConsumeInitialMovie?: () => void;
}

type CinemaFilter = 'all' | 'releases' | 'movie' | 'series' | 'anime' | 'archive' | 'dubbed' | 'uhd';

const QUICK_SEARCH_CHIPS: Array<{ label: string; query: string; mediaType: 'movie' | 'series' | 'anime' | 'trailer' }> = [
  { label: `🍿 Lançamentos ${new Date().getFullYear()}`, query: `lancamentos cinema ${new Date().getFullYear()} trailer oficial dublado 4k`, mediaType: 'trailer' },
  { label: '🌍 Internacionais Dublados 1080p', query: 'melhores filmes internacionais completos dublados portugues 1080p', mediaType: 'movie' },
  { label: '📺 Séries por Temporada', query: 'serie completa temporada 1 temporada 2 todos episodios dublado hd', mediaType: 'series' },
  { label: '⛩️ Animes Dublados', query: 'anime completo dublado portugues filme episodio full hd', mediaType: 'anime' },
  { label: '🚀 Ficção & Espaço 4K', query: 'filme ficcao cientifica espaco completo dublado hd', mediaType: 'movie' },
  { label: '💥 Ação & Drift', query: 'filme acao corrida drift completo dublado portugues 1080p', mediaType: 'movie' },
  { label: '🎨 Animação & Família', query: 'filme animacao aventura familia completo dublado portugues hd', mediaType: 'movie' },
];

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
  const dragState = useRef<{ down: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    down: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = rowRef.current;
    if (!el || e.button !== 0) return;
    dragState.current = {
      down: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = rowRef.current;
    if (!el || !dragState.current.down) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragState.current.startX;
    if (Math.abs(walk) > 6) {
      dragState.current.moved = true;
      el.scrollLeft = dragState.current.scrollLeft - walk * 1.15;
    }
  };

  const stopDrag = () => {
    dragState.current.down = false;
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2 tracking-tight">
          <span>{emoji}</span>
          <span>{title}</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-cyan-300">
            {count}
          </span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleGrid}
            className={`px-3 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1 transition ${
              expandedGrid
                ? 'bg-red-600/85 border-red-400 text-white'
                : 'bg-white/[0.07] hover:bg-white/[0.16] border-white/10 text-cyan-200'
            }`}
            title="Alternar entre Carrossel Netflix e Grade Completa"
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
            <div
              ref={rowRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              onClickCapture={onClickCapture}
              className="flex items-stretch gap-3 overflow-x-auto overscroll-x-contain snap-x snap-proximity pb-2.5 px-1 scroll-smooth cursor-grab active:cursor-grabbing select-none"
              style={{ scrollbarWidth: 'none' }}
            >
              {children}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#04010c]/75 to-transparent" />
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
  onOpenPix,
  onEmergencyStop,
  initialMovie = null,
  onConsumeInitialMovie,
}) => {
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
  const [topMovies, setTopMovies] = useState<RankedMovieEntry[]>([]);
  const [activeMovie, setActiveMovie] = useState<MovieItem | null>(null);
  const [movieQueue, setMovieQueue] = useState<MovieItem[]>([]);
  const [, setPrerollActive] = useState(false);
  const [cinemaQuality, setCinemaQuality] = useState<'auto' | 'large' | 'hd720' | 'hd1080' | 'hd2160'>('hd720');
  const [expandedView, setExpandedView] = useState(false);

  // Series Seasons & Episodes state
  const [seriesMetaTitle, setSeriesMetaTitle] = useState('');
  const [seriesSeasons, setSeriesSeasons] = useState<SeriesSeasonInfo[]>([]);
  const [selectedSeasonNum, setSelectedSeasonNum] = useState(1);
  const [seriesEpisodes, setSeriesEpisodes] = useState<SeriesEpisodeItem[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const playerBoxRef = useRef<HTMLDivElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroTouchStartX = useRef<number | null>(null);

  // Keep cinema audio/video active when minimizing or locking screen
  useEffect(() => {
    if (!activeMovie) return;
    syncBackgroundMediaSession(
      {
        title: activeMovie.title,
        artist: activeMovie.subtitle || 'LENKYX Cinema',
        album: 'LENKYX Cinema & Séries',
        artworkUrl: activeMovie.posterUrl,
        isPlaying: true,
      },
      {
        onPlay: () => void videoElRef.current?.play().catch(() => {}),
        onPause: () => videoElRef.current?.pause(),
        onPrev: () => stepMovie(-1),
        onNext: () => stepMovie(1),
        onStop: () => {
          setActiveMovie(null);
          onEmergencyStop?.();
        },
      }
    );
    const onVis = () => {
      if (document.visibilityState === 'hidden' && videoElRef.current && videoElRef.current.paused) {
        void videoElRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [activeMovie]);

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
    fetchTop5Rankings()
      .then((rk) => {
        if (rk.topMovies?.length) setTopMovies(rk.topMovies);
      })
      .catch(() => {});
    const autoTimer = window.setInterval(() => {
      void loadCinemaCatalog(true, true);
    }, 25 * 60 * 1000);
    return () => window.clearInterval(autoTimer);
  }, []);

  // Open movie passed from Search or Home directly with Netflix-style intro!
  useEffect(() => {
    if (!initialMovie) return;
    onPauseMusic();
    setMovieQueue([initialMovie]);
    setActiveMovie(initialMovie);
    setPrerollActive(true);
    onConsumeInitialMovie?.();
  }, [initialMovie, onPauseMusic, onConsumeInitialMovie]);

  useEffect(() => {
    onMovieModalChange(Boolean(activeMovie));
    if (!activeMovie) {
      setExpandedView(false);
      setPrerollActive(false);
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    }
    return () => onMovieModalChange(false);
  }, [activeMovie, onMovieModalChange]);

  // Smart TV D-Pad Arrow Key Navigation across Netflix cards!
  useEffect(() => {
    if (activeMovie) return;
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
  }, [activeMovie]);

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
      // Viewport-expanded fallback works seamlessly in Mobile & APK WebViews!
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

  const catalogStats = useMemo(() => {
    const ids = new Set<string>();
    let movies = 0;
    let series = 0;
    let animes = 0;
    let trailers = 0;
    for (const c of filteredCategories) {
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
  }, [filteredCategories]);

  const heroItems = useMemo(() => {
    const picks: MovieItem[] = [];
    for (const c of filteredCategories.slice(0, 6)) {
      if (c.movies?.[0]) picks.push(c.movies[0]);
    }
    return picks;
  }, [filteredCategories]);

  const featuredMovie = heroItems[heroIdx % Math.max(1, heroItems.length)] || null;
  const featuredQueue = filteredCategories[0]?.movies || filteredCategories[1]?.movies || [];

  // Auto-rotate Netflix Hero Billboard gently every 8s
  useEffect(() => {
    if (heroItems.length < 2) return;
    const t = window.setInterval(() => {
      setHeroIdx((i) => (i + 1) % heroItems.length);
    }, 8000);
    return () => window.clearInterval(t);
  }, [heroItems.length]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRowGrid = (id: string) => {
    setRowGridIds((prev) => ({ ...prev, [id]: !(prev[id] ?? globalTvGrid) }));
  };

  const loadSeasonForSeries = async (baseTitle: string, seasonNum: number, playlistId = '', mediaType = 'series') => {
    setLoadingEpisodes(true);
    setSelectedSeasonNum(seasonNum);
    try {
      const data = await fetchSeriesSeasonsAndEpisodes({
        title: baseTitle,
        season: seasonNum,
        playlistId,
        mediaType,
      });
      setSeriesMetaTitle(data.seriesTitle || baseTitle);
      setSeriesSeasons(data.seasons || [{ number: 1, name: 'Temporada 1', episodeCount: 0 }]);
      setSeriesEpisodes(data.episodes || []);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleOpenMovie = (m: MovieItem, queueList: MovieItem[]) => {
    onPauseMusic();
    setMovieQueue(queueList.length ? queueList : [m]);
    setActiveMovie(m);
    setPrerollActive(true);
    void recordRankingHit({
      kind: 'movie',
      id: m.id,
      title: m.title,
      subtitle: m.subtitle,
      posterUrl: m.posterUrl,
      youtubeVideoId: m.youtubeVideoId,
      youtubePlaylistId: m.youtubePlaylistId,
      mediaType: m.mediaType,
    }).then((rk) => {
      if (rk?.topMovies?.length) setTopMovies(rk.topMovies);
    });
    if (m.mediaType === 'series' || m.mediaType === 'anime') {
      setSeriesSeasons([]);
      setSeriesEpisodes([]);
      void loadSeasonForSeries(m.title, 1, m.youtubePlaylistId || '', m.mediaType);
    } else {
      setSeriesSeasons([]);
      setSeriesEpisodes([]);
    }
  };

  const stepMovie = (dir: -1 | 1) => {
    if (!activeMovie || movieQueue.length < 2) return;
    const idx = movieQueue.findIndex((x) => x.id === activeMovie.id);
    const nextIdx = (idx + dir + movieQueue.length) % movieQueue.length;
    setActiveMovie(movieQueue[nextIdx]);
    setPrerollActive(true);
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

  const renderPosterCard = (m: MovieItem, idx: number, queueList: MovieItem[], compactGrid = false) => (
    <button
      key={m.id}
      type="button"
      data-tv-card="1"
      onClick={() => handleOpenMovie(m, queueList)}
      className={`group text-left rounded-2xl cosmic-card-3d overflow-hidden snap-start outline-none focus:ring-4 focus:ring-rose-500 focus:scale-[1.03] focus:z-20 transition duration-200 ${
        compactGrid ? 'w-full' : 'w-44 sm:w-56 md:w-60 shrink-0'
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
              {m.qualityLabel.includes('4K') ? '4K' : m.qualityLabel.includes('1080') ? '1080p' : 'HD'}
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
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition">
          <span className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </span>
        </div>
      </div>
      <div className="p-2.5 sm:p-3 space-y-0.5">
        <div className="text-xs font-extrabold text-white line-clamp-2 group-hover:text-rose-300 group-focus:text-rose-300 transition">
          {m.title}
        </div>
        <div className="text-[10px] text-purple-300/75 truncate">{m.subtitle}</div>
      </div>
    </button>
  );

  // Mobile-Perfected Fullscreen Cinema Portal (with Netflix-style LENKYX Intro before playback!)
  const cinemaModal =
    activeMovie &&
    createPortal(
      <div
        ref={playerBoxRef}
        className={`fixed inset-0 z-[9999] bg-black flex flex-col justify-center overflow-hidden ${
          expandedView ? 'p-0' : 'p-0 sm:p-4'
        }`}
      >
        <div
          className={`w-full mx-auto overflow-hidden bg-[#05030d] flex flex-col relative ${
            expandedView
              ? 'h-[100dvh] max-w-none rounded-none border-0'
              : 'h-[100dvh] sm:h-auto sm:max-h-[94dvh] sm:max-w-6xl sm:rounded-3xl sm:border sm:border-white/15 shadow-[0_0_90px_rgba(220,38,38,0.3)]'
          }`}
        >
          {/* Compact Mobile-Friendly Header */}
          <div className="px-3 sm:px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#070414] shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Clapperboard className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-white truncate">{activeMovie.title}</div>
                <div className="text-[10px] text-purple-200/70 truncate">
                  {activeMovie.subtitle} · {activeMovie.qualityLabel || 'Full HD'}
                  {activeMovie.isDubbed ? ' · Dublado PT-BR' : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 border border-cyan-400/35">
                <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
                <select
                  value={cinemaQuality}
                  onChange={(e) => setCinemaQuality(e.target.value as typeof cinemaQuality)}
                  className="bg-transparent text-[11px] font-black text-cyan-200 focus:outline-none cursor-pointer"
                  title="Qualidade"
                >
                  <option value="hd720" className="bg-[#0b0618]">720p HD</option>
                  <option value="large" className="bg-[#0b0618]">480p Leve</option>
                  <option value="hd1080" className="bg-[#0b0618]">1080p FHD</option>
                  <option value="hd2160" className="bg-[#0b0618]">4K Ultra</option>
                  <option value="auto" className="bg-[#0b0618]">Auto</option>
                </select>
              </div>

              {onVolume && onToggleMute && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/10 border border-white/10">
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
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-100 text-[11px] font-black flex items-center gap-1"
              >
                {expandedView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{expandedView ? 'Reduzir' : 'Ampliar'}</span>
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
                    title="Próximo"
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {onOpenPix && (
                <button
                  onClick={onOpenPix}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[11px] font-black flex items-center gap-1"
                  title="Apoiar via PIX (QR Code)"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PIX</span>
                </button>
              )}

              {onEmergencyStop && (
                <button
                  onClick={() => {
                    setActiveMovie(null);
                    clearBackgroundMediaSession();
                    onEmergencyStop();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/45 border border-rose-400/50 text-rose-100 text-[11px] font-black flex items-center gap-1"
                  title="Botão de Segurança: Parar vídeo, áudio e segundo plano"
                >
                  <ShieldOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Parar Tudo</span>
                </button>
              )}

              <button
                onClick={() => setActiveMovie(null)}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-rose-600 text-white text-xs font-black flex items-center gap-1"
                title="Fechar Cinema"
              >
                <X className="w-4 h-4" /> Fechar
              </button>
            </div>
          </div>

          {/* Video Viewport — Immediate playback without intro */}
          <div className="relative w-full bg-black flex-1 min-h-[220px] sm:aspect-video flex items-center justify-center overflow-hidden">
            {activeMovie.videoStreamUrl && !activeMovie.youtubeVideoId && !activeMovie.youtubePlaylistId ? (
              <video
                ref={videoElRef}
                key={activeMovie.id}
                src={activeMovie.videoStreamUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
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
            )}
          </div>

          {/* Series Seasons & Episodes Selector OR Mobile & TV Next-in-Queue Strip */}
          {!expandedView && (activeMovie.mediaType === 'series' || activeMovie.mediaType === 'anime') && (
            loadingEpisodes ? (
              <div className="p-3 border-t border-white/10 bg-[#080412] flex items-center justify-center gap-2 text-xs text-cyan-200 font-bold shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando episódios da Temporada {selectedSeasonNum}...
              </div>
            ) : (
              <PlayerQueueStrip
                title={
                  <>
                    <Layers className="w-3.5 h-3.5 inline mr-1" />
                    {seriesMetaTitle || activeMovie.title} · T{selectedSeasonNum}
                  </>
                }
                accent="cyan"
                emptyText="Toque em outra temporada acima ou avance na lista."
                headerRight={
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[260px] sm:max-w-md" style={{ scrollbarWidth: 'none' }}>
                    {(seriesSeasons.length > 0
                      ? seriesSeasons
                      : [
                          { number: 1, name: 'Temporada 1', episodeCount: 0 },
                          { number: 2, name: 'Temporada 2', episodeCount: 0 },
                        ]
                    ).map((s) => (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() =>
                          void loadSeasonForSeries(
                            seriesMetaTitle || activeMovie.title,
                            s.number,
                            s.number === 1 ? activeMovie.youtubePlaylistId || '' : '',
                            activeMovie.mediaType || 'series'
                          )
                        }
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap border transition ${
                          selectedSeasonNum === s.number
                            ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-black border-transparent shadow'
                            : 'bg-white/[0.07] hover:bg-white/15 border-white/15 text-slate-200'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                }
                items={seriesEpisodes.map((ep) => ({
                  id: ep.id,
                  title: ep.title,
                  subtitle: ep.subtitle,
                  imageUrl: ep.posterUrl,
                  badge: `T${ep.seasonNumber} · Ep ${ep.episodeNumber}`,
                  badgeTone: 'accent',
                  durationLabel: ep.durationLabel,
                  active: Boolean(activeMovie.youtubeVideoId && activeMovie.youtubeVideoId === ep.youtubeVideoId),
                }))}
                onSelect={(id) => {
                  const ep = seriesEpisodes.find((x) => x.id === id);
                  if (!ep) return;
                  setActiveMovie({
                    id: ep.id,
                    title: ep.title,
                    subtitle: ep.subtitle,
                    category: `${seriesMetaTitle} · T${ep.seasonNumber}`,
                    durationLabel: ep.durationLabel,
                    posterUrl: ep.posterUrl,
                    youtubeVideoId: ep.youtubeVideoId,
                    sourceLabel: ep.sourceLabel || `T${ep.seasonNumber} E${ep.episodeNumber}`,
                    qualityLabel: ep.qualityLabel,
                    isDubbed: ep.isDubbed,
                    mediaType: ep.mediaType || activeMovie.mediaType,
                  });
                  setPrerollActive(false);
                }}
              />
            )
          )}

          {!expandedView && movieQueue.length > 1 && activeMovie.mediaType !== 'series' && activeMovie.mediaType !== 'anime' && (
            <PlayerQueueStrip
              title="🎞️ Na Sequência"
              accent="rose"
              items={movieQueue.map((item, idx) => ({
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                imageUrl: item.posterUrl,
                badge: `#${idx + 1}`,
                badgeTone: 'neutral',
                durationLabel: item.durationLabel,
                active: item.id === activeMovie.id,
              }))}
              onSelect={(id) => {
                const picked = movieQueue.find((x) => x.id === id);
                if (picked) {
                  setActiveMovie(picked);
                  setPrerollActive(true);
                }
              }}
            />
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={containerRef} className="space-y-6 pb-28 md:pb-24">
      {/* === CLEAN CINEMA HEADER === */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-black flex items-center gap-2 shadow-[0_0_24px_rgba(225,29,72,0.4)]">
            <Clapperboard className="w-4 h-4" />
            <span>Cinema, Séries por Temporada & Animes</span>
          </div>
          {!loading && catalogStats.total > 0 && (
            <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-bold text-slate-200">
              {catalogStats.total} títulos em HD/4K
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setGlobalTvGrid((v) => !v)}
            className={`px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5 transition ${
              globalTvGrid
                ? 'bg-rose-600 border-rose-400 text-white shadow'
                : 'bg-white/[0.07] hover:bg-white/15 border-white/15 text-purple-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{globalTvGrid ? 'Modo Carrossel' : 'Grade Completa'}</span>
          </button>

          <button
            onClick={() => void loadCinemaCatalog(true, true)}
            disabled={backgroundRefreshing}
            className="px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/15 border border-white/15 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 transition"
            title="Atualizar lançamentos agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${backgroundRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lastUpdatedLabel}</span>
          </button>
        </div>
      </div>

      {/* === NETFLIX HERO BILLBOARD (Zero Transparent Arrows — Touch Swipe + Smooth Dot Indicators!) === */}
      {loading ? (
        <CosmicGtaLoader
          open={true}
          mode="stage"
          statusText="Carregando Filmes, Séries, Animes & Lançamentos..."
        />
      ) : featuredMovie ? (
        <section
          onTouchStart={(e) => {
            heroTouchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (heroTouchStartX.current === null || heroItems.length < 2) return;
            const endX = e.changedTouches[0]?.clientX ?? heroTouchStartX.current;
            const diff = heroTouchStartX.current - endX;
            if (Math.abs(diff) > 45) {
              setHeroIdx((i) =>
                diff > 0 ? (i + 1) % heroItems.length : (i - 1 + heroItems.length) % heroItems.length
              );
            }
            heroTouchStartX.current = null;
          }}
          className="relative rounded-[28px] overflow-hidden border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] min-h-[250px] sm:min-h-[320px] flex flex-col justify-end"
        >
          <img
            key={featuredMovie.id}
            src={featuredMovie.posterUrl}
            alt={featuredMovie.title}
            className="absolute inset-0 w-full h-full object-cover opacity-65 gta-ken-burns transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#04010c] via-[#04010c]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#04010c]/95 via-[#04010c]/50 to-transparent" />

          <div className="relative z-10 p-5 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-[10px] font-black uppercase tracking-wider text-white">
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
              <p className="text-xs text-purple-100/85 line-clamp-2">{featuredMovie.subtitle}</p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={() => handleOpenMovie(featuredMovie, featuredQueue)}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-rose-50 text-black font-black text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" /> Assistir Agora
                </button>
              </div>
            </div>

            {/* Netflix-style interactive dot pills to switch Hero spotlight cleanly */}
            {heroItems.length > 1 && (
              <div className="flex items-center gap-1.5 self-start sm:self-end">
                {heroItems.map((h, i) => {
                  const active = i === heroIdx % heroItems.length;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHeroIdx(i)}
                      aria-label={`Destaque ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        active ? 'w-7 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : 'w-2 bg-white/35 hover:bg-white/65'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* === TOP 1 AO 5 FILMES & SÉRIES MAIS ASSISTIDOS & RECOMENDADOS === */}
      {!loading && (topMovies.length > 0 || heroItems.length > 0) && (
        <section className="rounded-3xl bg-gradient-to-br from-rose-500/10 via-[#0d061b] to-amber-500/10 border border-rose-400/25 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Top 1 ao 5 · Filmes & Séries Mais Assistidos e Recomendados</span>
              </h2>
              <p className="text-[11px] text-rose-100/75">
                Os 5 melhores filmes, séries e animes mais assistidos agora no LENKYX
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[10px] font-black">
              🍿 RECOMENDADOS HOJE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {(topMovies.length >= 5
              ? topMovies.slice(0, 5)
              : [
                  ...topMovies,
                  ...heroItems
                    .filter((h) => !topMovies.some((tm) => tm.id === h.id))
                    .slice(0, Math.max(0, 5 - topMovies.length))
                    .map((h, i) => ({
                      rank: topMovies.length + i + 1,
                      id: h.id,
                      title: h.title,
                      subtitle: h.subtitle,
                      posterUrl: h.posterUrl,
                      youtubeVideoId: h.youtubeVideoId,
                      youtubePlaylistId: h.youtubePlaylistId,
                      mediaType: h.mediaType,
                      count: 45 - i * 6,
                    })),
                ]
            )
              .slice(0, 5)
              .map((m, idx) => {
                const rank = idx + 1;
                const badgeCls =
                  rank === 1
                    ? 'from-amber-400 to-yellow-500 text-black'
                    : rank === 2
                    ? 'from-slate-200 to-slate-400 text-black'
                    : rank === 3
                    ? 'from-amber-600 to-orange-500 text-white'
                    : 'from-rose-500 to-pink-600 text-white';
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      handleOpenMovie(
                        {
                          id: m.id,
                          title: m.title,
                          subtitle: m.subtitle || 'Top Recomendado',
                          category: 'Recomendados',
                          durationLabel: 'HD',
                          sourceLabel: 'LENKYX Top 5',
                          posterUrl: m.posterUrl || '/covers/album-official.jpg',
                          youtubeVideoId: m.youtubeVideoId,
                          youtubePlaylistId: m.youtubePlaylistId,
                          mediaType: m.mediaType || 'movie',
                        },
                        featuredQueue
                      )
                    }
                    className="group relative rounded-2xl overflow-hidden bg-black/45 hover:bg-white/[0.08] border border-white/15 hover:border-amber-400/50 text-left transition flex flex-col"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                      <img
                        src={m.posterUrl || '/covers/album-official.jpg'}
                        alt={m.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                      <span
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r ${badgeCls} text-[10px] font-black shadow`}
                      >
                        TOP #{rank}
                      </span>
                      <span className="absolute bottom-1.5 right-2 text-[9px] font-mono font-bold text-emerald-300">
                        {m.count} views
                      </span>
                    </div>
                    <div className="p-2.5 min-w-0">
                      <div className="text-xs font-black text-white truncate group-hover:text-amber-300">
                        {m.title}
                      </div>
                      <div className="text-[10px] text-slate-300/75 truncate">
                        {m.subtitle || 'Cinema LENKYX'}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </section>
      )}

      {/* === NETFLIX CATEGORY FILTER PILLS === */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {(
          [
            { id: 'all', label: `✨ Tudo (${catalogStats.total})` },
            { id: 'releases', label: `🍿 Lançamentos ${new Date().getFullYear()}` },
            { id: 'movie', label: `🎬 Filmes (${catalogStats.movies})` },
            { id: 'series', label: `📺 Séries (${catalogStats.series})` },
            { id: 'anime', label: `⛩️ Animes (${catalogStats.animes})` },
            { id: 'dubbed', label: '🇧🇷 Dublados' },
            { id: 'uhd', label: '💎 4K & Full HD' },
          ] as { id: CinemaFilter; label: string }[]
        ).map((pill) => {
          const active = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border transition ${
                active
                  ? 'bg-gradient-to-r from-rose-600 to-pink-500 border-rose-400 text-white shadow'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-purple-100'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* === CINEMA SEARCH + QUICK CHIPS === */}
      <div className="space-y-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(searchQ);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-rose-300/80 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Buscar filme, série, anime ou gênero..."
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 text-xs sm:text-sm text-white placeholder-purple-300/55 focus:outline-none focus:border-rose-400"
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
              className="absolute right-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black"
            >
              {searching ? '...' : 'Buscar'}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {QUICK_SEARCH_CHIPS.map((c) => (
            <button
              key={c.label}
              onClick={() => void runSearch(c.query, c.mediaType)}
              className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-rose-600/35 border border-white/10 text-[11px] font-bold text-purple-100 whitespace-nowrap transition"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* === SEARCH RESULTS === */}
      {filteredSearchResults !== null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-black text-white flex items-center gap-1.5">
              <Film className="w-4 h-4 text-rose-400" /> Resultados ({filteredSearchResults.length})
            </h2>
            <button
              onClick={() => {
                setSearchQ('');
                setSearchResults(null);
              }}
              className="text-xs font-bold text-cyan-300 hover:underline"
            >
              Limpar Busca
            </button>
          </div>
          {filteredSearchResults.length === 0 ? (
            <div className="py-10 text-center rounded-2xl cosmic-card-3d text-xs text-purple-300">
              Nenhum título encontrado para esse filtro.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredSearchResults.map((m, idx) => renderPosterCard(m, idx, filteredSearchResults, true))}
            </div>
          )}
        </div>
      )}

      {/* === NETFLIX MOVIE, SERIES & ANIME ROWS === */}
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

      {cinemaModal}
    </div>
  );
};

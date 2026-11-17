import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Hls from 'hls.js';
import {
  Clapperboard,
  Play,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
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
  Sparkles as QualityIcon,
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

interface Props {
  onPauseMusic: () => void;
  onMovieModalChange: (watching: boolean) => void;
  volume?: number;
  muted?: boolean;
  onVolume?: (v: number) => void;
  onToggleMute?: () => void;
}

type SectionMode = 'cinema' | 'livetv';
type CinemaFilter = 'all' | 'movie' | 'series' | 'anime' | 'archive' | 'dubbed' | 'uhd';

const QUICK_SEARCH_CHIPS: Array<{ label: string; query: string; mediaType: 'movie' | 'series' | 'anime' }> = [
  { label: '🌍 Internacionais Dublados 1080p', query: 'melhores filmes internacionais completos dublados portugues 1080p', mediaType: 'movie' },
  { label: '📺 Séries Dubladas (Temporadas)', query: 'serie internacional completa dublado portugues episodio hd', mediaType: 'series' },
  { label: '⛩️ Animes Dublados (Temporadas)', query: 'anime completo dublado portugues filme episodio full hd', mediaType: 'anime' },
  { label: '🔥 Ação Full HD', query: 'filme de acao internacional completo dublado 1080p', mediaType: 'movie' },
  { label: '🚀 Ficção Científica HD', query: 'filme completo ficcao cientifica espaco dublado full hd', mediaType: 'movie' },
  { label: '👻 Terror Internacional Dublado', query: 'filme completo terror suspense internacional dublado hd', mediaType: 'movie' },
  { label: '🎞️ Sagas & Parte 2', query: 'filme completo parte 1 parte 2 saga sequencia dublado hd', mediaType: 'movie' },
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

export const MoviesView: React.FC<Props> = ({
  onPauseMusic,
  onMovieModalChange,
  volume = 0.88,
  muted = false,
  onVolume,
  onToggleMute,
}) => {
  const [sectionMode, setSectionMode] = useState<SectionMode>('cinema');

  // === CINEMA / SERIES / ANIMES STATE ===
  const [categories, setCategories] = useState<MovieCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MovieItem[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<CinemaFilter>('all');
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [activeMovie, setActiveMovie] = useState<MovieItem | null>(null);
  const [movieQueue, setMovieQueue] = useState<MovieItem[]>([]);
  const [cinemaQuality, setCinemaQuality] = useState<'auto' | 'hd720' | 'hd1080' | 'hd2160'>('hd1080');
  const [expandedView, setExpandedView] = useState(false);

  // === LIVE TV GLOBAL STATE ===
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

  useEffect(() => {
    let alive = true;
    void fetchMoviesDirectory().then((cats) => {
      if (!alive) return;
      setCategories(cats);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
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

  // Sync master volume to Live TV <video> element
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
          // Default to highest crisp quality or Auto
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
              setTvError('Este canal está temporariamente fora do ar. Clique em "Próximo Canal" para sintonizar outro.');
              setTvStatusMsg('');
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

  const featuredMovie = categories[0]?.movies?.[0] || categories[1]?.movies?.[0] || null;
  const featuredQueue = categories[0]?.movies || categories[1]?.movies || [];

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
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

  const runSearch = async (rawQ: string, forcedType?: 'movie' | 'series' | 'anime') => {
    const q = rawQ.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearchQ(rawQ);
    setSearching(true);
    try {
      const low = q.toLowerCase();
      const isTrailer = low.includes('trailer');
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
    if (activeFilter === 'movie') return (m.mediaType || 'movie') === 'movie';
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

  const renderPosterCard = (m: MovieItem, idx: number, queueList: MovieItem[], compactGrid = false) => (
    <button
      key={m.id}
      onClick={() => handleOpenMovie(m, queueList)}
      className={`group text-left rounded-2xl cosmic-card-3d overflow-hidden ${
        compactGrid ? '' : 'w-52 sm:w-60 shrink-0'
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
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <span className="w-11 h-11 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </span>
        </div>
      </div>
      <div className="p-3 space-y-0.5">
        <div className="text-xs font-extrabold text-white line-clamp-2">{m.title}</div>
        <div className="text-[10px] text-purple-300/75 truncate">{m.subtitle}</div>
      </div>
    </button>
  );

  const renderChannelCard = (ch: LiveTvChannel, queueList: LiveTvChannel[]) => (
    <button
      key={ch.id}
      onClick={() => handleOpenChannel(ch, queueList)}
      className="group w-48 sm:w-56 shrink-0 text-left rounded-2xl cosmic-card-3d overflow-hidden p-3 flex flex-col justify-between gap-2.5 bg-gradient-to-br from-[#0e0722] to-[#070312] hover:border-cyan-400/50 transition"
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

  // Fullscreen Cinema / Live TV Portal (rendered directly in document.body so Sidebar & MiniPlayer NEVER overlap!)
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
              : 'max-w-6xl rounded-3xl border border-white/15 shadow-[0_0_90px_rgba(220,38,38,0.28)]'
          }`}
        >
          <div className="px-3 sm:px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#080414]">
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
              {/* Resolution Quality Picker */}
              {(activeMovie.youtubeVideoId || activeMovie.youtubePlaylistId) && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 border border-cyan-400/35">
                  <QualityIcon className="w-3 h-3 text-cyan-300 shrink-0" />
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

              {/* Volume Control in Cinema */}
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

              {/* Expand / Fullscreen Button */}
              <button
                onClick={() => void toggleExpandPlayer()}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/45 text-cyan-100 text-[11px] font-black flex items-center gap-1"
                title={expandedView ? 'Reduzir Tela' : 'Ampliar para Tela Cheia'}
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

          <div className={`w-full bg-black ${expandedView ? 'flex-1 min-h-0' : 'aspect-video'}`}>
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
            <div className="p-3 border-t border-white/10 bg-[#080412] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-red-300">
                  🎞️ Na Sequência ({movieQueue.length} títulos — toque para trocar)
                </div>
                <div className="text-[10px] text-cyan-300/80 hidden sm:block">
                  Séries com selo "Temporada" avançam episódios automaticamente na sequência
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
                        {item.qualityLabel && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-bold text-cyan-300">
                            {item.qualityLabel.includes('4K')
                              ? '4K'
                              : item.qualityLabel.includes('1080')
                                ? '1080p'
                                : 'HD'}
                          </span>
                        )}
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
              : 'max-w-6xl rounded-3xl border border-cyan-400/25 shadow-[0_0_90px_rgba(6,182,212,0.28)]'
          }`}
        >
          <div className="px-3 sm:px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#070414]">
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
                  <QualityIcon className="w-3 h-3 text-cyan-300 shrink-0" />
                  <select
                    value={selectedTvLevel}
                    onChange={(e) => {
                      const lvl = Number(e.target.value);
                      setSelectedTvLevel(lvl);
                      if (hlsRef.current) hlsRef.current.currentLevel = lvl;
                    }}
                    className="bg-transparent text-[11px] font-black text-cyan-200 focus:outline-none cursor-pointer"
                    title="Qualidade do Sinal ao Vivo"
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

              <button
                onClick={() => void toggleExpandPlayer()}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/45 text-cyan-100 text-[11px] font-black flex items-center gap-1"
                title={expandedView ? 'Reduzir Tela' : 'Ampliar para Tela Cheia'}
              >
                {expandedView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{expandedView ? 'Reduzir' : 'Ampliar'}</span>
              </button>

              {tvQueue.length > 1 && (
                <>
                  <button
                    onClick={() => stepChannel(-1)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    title="Canal Anterior"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => stepChannel(1)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/25 hover:bg-cyan-500/40 text-cyan-100 text-[11px] font-bold flex items-center gap-1"
                    title="Próximo Canal"
                  >
                    <span>Próximo</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveChannel(null)}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-red-600 text-white text-xs font-black flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Fechar TV
              </button>
            </div>
          </div>

          <div className={`relative w-full bg-black flex items-center justify-center ${expandedView ? 'flex-1 min-h-0' : 'aspect-video'}`}>
            <video
              ref={tvVideoRef}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
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
            <div className="p-3 border-t border-white/10 bg-[#070412] space-y-2">
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
    <div className="space-y-4 pb-36 md:pb-28">
      {/* Top Mode Switcher: Cinema vs Live TV Mundial */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSectionMode('cinema')}
          className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border transition ${
            sectionMode === 'cinema'
              ? 'bg-gradient-to-r from-red-500 to-pink-600 border-red-400 text-white shadow-lg'
              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-purple-200'
          }`}
        >
          <Clapperboard className="w-4 h-4" />
          🎬 Filmes, Séries & Animes (HD/4K)
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
          📡 TV ao Vivo Mundial {tvTotalAvailable > 0 ? `(${tvTotalAvailable.toLocaleString('pt-BR')} Canais)` : '(Brasil & Mundo)'}
        </button>
      </div>

      {sectionMode === 'cinema' ? (
        <>
          {/* Featured Hero */}
          {featuredMovie ? (
            <section className="relative rounded-[28px] overflow-hidden border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.75)] min-h-[210px] sm:min-h-[250px] flex flex-col justify-end">
              <img
                src={featuredMovie.posterUrl}
                alt={featuredMovie.title}
                className="absolute inset-0 w-full h-full object-cover opacity-55 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04010c] via-[#04010c]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#04010c]/95 via-[#04010c]/55 to-transparent" />

              <div className="relative z-10 p-5 sm:p-7 max-w-2xl space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/90 text-[10px] font-black uppercase tracking-wider text-white">
                    <Clapperboard className="w-3 h-3" /> CINEMA LENKYX · {featuredMovie.durationLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-black text-cyan-200">
                    {featuredMovie.qualityLabel || 'Full HD 1080p'}
                  </span>
                  {featuredMovie.isDubbed && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-[10px] font-black text-black">
                      Dublado PT-BR
                    </span>
                  )}
                </div>
                <h1 className="font-display text-xl sm:text-3xl font-black text-white line-clamp-2">
                  {featuredMovie.title}
                </h1>
                <p className="text-xs text-purple-100/85">
                  {featuredMovie.subtitle} · Filmes internacionais dublados, séries com temporadas completas, animes e acervo direto em tela limpa.
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={() => handleOpenMovie(featuredMovie, featuredQueue)}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-purple-100 text-black font-black text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-black" /> Assistir em Tela Limpa
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[28px] cosmic-card-3d p-6 flex items-center gap-3">
              <Tv className="w-8 h-8 text-red-400 shrink-0" />
              <div>
                <h1 className="font-display text-xl font-black text-white">
                  LENKYX <span className="text-red-400">CINEMA · SÉRIES & ANIMES</span>
                </h1>
                <p className="text-xs text-purple-200/80">
                  Filmes internacionais dublados, séries completas, animes, acervo aberto e trailers na melhor qualidade HD/4K.
                </p>
              </div>
            </section>
          )}

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
                placeholder="Buscar filme internacional dublado, série, anime, saga ou trailer 4K..."
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
                  title="Limpar busca"
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
                { id: 'movie' as CinemaFilter, label: '🌍 Filmes Internacionais' },
                { id: 'series' as CinemaFilter, label: '📺 Séries' },
                { id: 'anime' as CinemaFilter, label: '⛩️ Animes' },
                { id: 'archive' as CinemaFilter, label: '🏛️ Acervo Direto (Sem YouTube)' },
                { id: 'dubbed' as CinemaFilter, label: '🎙️ Só Dublados' },
                { id: 'uhd' as CinemaFilter, label: '💎 1080p / 4K' },
              ].map((pill) => {
                const active = activeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setActiveFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border transition ${
                      active
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 border-red-400 text-white shadow'
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

          {/* Carousels */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-purple-300">
              <Loader2 className="w-7 h-7 animate-spin text-red-400" />
              <span className="text-xs font-semibold">Carregando filmes dublados, séries, animes e acervo direto...</span>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredCategories.map((cat) => {
                const collapsed = Boolean(collapsedIds[cat.id]);
                return (
                  <section key={cat.id} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="font-display text-xs sm:text-sm font-black text-white flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.title}</span>
                      </h2>
                      <button
                        onClick={() => toggleCollapse(cat.id)}
                        className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-[10px] font-bold text-purple-200 flex items-center gap-1 transition"
                      >
                        {collapsed ? 'Mostrar' : 'Minimizar'}
                        {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                      </button>
                    </div>

                    {!collapsed && (
                      <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
                        {cat.movies.map((m, idx) => renderPosterCard(m, idx, cat.movies, false))}
                      </div>
                    )}
                  </section>
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
                Sinais oficiais abertos em HD (Pluto TV, filmes 24h, animes, esportes, notícias, Brasil & NASA TV) direto no app.
              </p>
            </div>
          </section>

          {/* Search Live TV Channels & Filter by Country */}
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
                  title="Limpar busca"
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
                  Nenhum canal encontrado para essa busca. Tente outro nome ou selecione "Mundo Todo".
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {tvSearchResults.map((ch) => renderChannelCard(ch, tvSearchResults))}
                </div>
              )}
            </div>
          )}

          {tvLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-cyan-200">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              <span className="text-xs font-semibold">Sintonizando canais abertos do Brasil e do mundo...</span>
            </div>
          ) : (
            <div className="space-y-5">
              {tvCategories.map((cat) => {
                if (!cat.channels || cat.channels.length === 0) return null;
                const collapsed = Boolean(collapsedIds[cat.id]);
                return (
                  <section key={cat.id} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="font-display text-xs sm:text-sm font-black text-white flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.title}</span>
                      </h2>
                      <button
                        onClick={() => toggleCollapse(cat.id)}
                        className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-[10px] font-bold text-purple-200 flex items-center gap-1 transition"
                      >
                        {collapsed ? 'Mostrar' : 'Minimizar'}
                        {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                      </button>
                    </div>

                    {!collapsed && (
                      <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
                        {cat.channels.map((ch) => renderChannelCard(ch, cat.channels))}
                      </div>
                    )}
                  </section>
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

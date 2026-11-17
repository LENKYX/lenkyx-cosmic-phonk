import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { MovieItem } from '../types';
import { fetchMoviesDirectory, MovieCategory, searchMoviesCatalog } from '../utils/moviesApi';
import { isAndroidApk } from '../utils/androidBridge';

interface Props {
  onPauseMusic: () => void;
  onMovieModalChange: (watching: boolean) => void;
}

type CinemaFilter = 'all' | 'movie' | 'series' | 'anime' | 'dubbed' | 'uhd';

const QUICK_SEARCH_CHIPS: Array<{ label: string; query: string; mediaType: 'movie' | 'series' | 'anime' }> = [
  { label: '🌍 Internacionais Dublados 1080p', query: 'melhores filmes internacionais completos dublados portugues 1080p', mediaType: 'movie' },
  { label: '📺 Séries Dubladas HD', query: 'serie internacional completa dublado portugues episodio hd', mediaType: 'series' },
  { label: '⛩️ Animes Dublados HD', query: 'anime completo dublado portugues filme episodio full hd', mediaType: 'anime' },
  { label: '🔥 Ação Full HD', query: 'filme de acao internacional completo dublado 1080p', mediaType: 'movie' },
  { label: '🚀 Ficção Científica HD', query: 'filme completo ficcao cientifica espaco dublado full hd', mediaType: 'movie' },
  { label: '👻 Terror Internacional Dublado', query: 'filme completo terror suspense internacional dublado hd', mediaType: 'movie' },
  { label: '🎞️ Sagas & Parte 2', query: 'filme completo parte 1 parte 2 saga sequencia dublado hd', mediaType: 'movie' },
];

export const MoviesView: React.FC<Props> = ({ onPauseMusic, onMovieModalChange }) => {
  const [categories, setCategories] = useState<MovieCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MovieItem[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<CinemaFilter>('all');
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [activeMovie, setActiveMovie] = useState<MovieItem | null>(null);
  const [movieQueue, setMovieQueue] = useState<MovieItem[]>([]);

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
    onMovieModalChange(Boolean(activeMovie));
    return () => onMovieModalChange(false);
  }, [activeMovie, onMovieModalChange]);

  const featuredMovie = categories[0]?.movies?.[0] || categories[1]?.movies?.[0] || null;
  const featuredQueue = categories[0]?.movies || categories[1]?.movies || [];

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenMovie = (m: MovieItem, queueList: MovieItem[]) => {
    onPauseMusic();
    setMovieQueue(queueList.length ? queueList : [m]);
    setActiveMovie(m);
  };

  const stepMovie = (dir: -1 | 1) => {
    if (!activeMovie || movieQueue.length < 2) return;
    const idx = movieQueue.findIndex((x) => x.id === activeMovie.id);
    const nextIdx = (idx + dir + movieQueue.length) % movieQueue.length;
    setActiveMovie(movieQueue[nextIdx]);
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
        if (!low.includes('dublado') && !low.includes('legendado')) {
          finalQ = `${finalQ} dublado`;
        }
        if (!low.includes('completo') && inferredType === 'movie') {
          finalQ = `${finalQ} filme completo`;
        }
        if (!low.includes('hd') && !low.includes('1080') && !low.includes('4k')) {
          finalQ = `${finalQ} full hd`;
        }
      }
      const items = await searchMoviesCatalog(finalQ, isTrailer, inferredType);
      setSearchResults(items);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSearch(searchQ);
  };

  const matchesFilter = (m: MovieItem): boolean => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'movie') return (m.mediaType || 'movie') === 'movie';
    if (activeFilter === 'series') return m.mediaType === 'series';
    if (activeFilter === 'anime') return m.mediaType === 'anime';
    if (activeFilter === 'dubbed') return Boolean(m.isDubbed);
    if (activeFilter === 'uhd') {
      const q = (m.qualityLabel || '').toLowerCase();
      return q.includes('4k') || q.includes('1080') || q.includes('full hd');
    }
    return true;
  };

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        const filtered = (cat.movies || []).filter(matchesFilter);
        return { ...cat, movies: filtered };
      })
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
              : m.mediaType === 'anime'
                ? 'bg-fuchsia-600/95 text-white'
                : m.mediaType === 'series'
                  ? 'bg-cyan-500/95 text-black'
                  : 'bg-red-600/95 text-white'
          }`}
        >
          #{idx + 1} · {m.sourceLabel}
        </span>

        {/* Quality + Dubbed Badges */}
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

  return (
    <div className="space-y-4 pb-36 md:pb-28">
      {/* Netflix-Style Featured Hero */}
      {featuredMovie ? (
        <section className="relative rounded-[28px] overflow-hidden border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.75)] min-h-[220px] sm:min-h-[260px] flex flex-col justify-end">
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
              {featuredMovie.subtitle} · Filmes internacionais dublados, séries, animes, sagas e trailers em alta qualidade HD/4K.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => handleOpenMovie(featuredMovie, featuredQueue)}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-purple-100 text-black font-black text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" /> Assistir Agora
              </button>
              <span className="px-3 py-1.5 rounded-full bg-black/60 border border-white/15 text-[11px] text-cyan-200 font-semibold">
                Modo Cinema Escuro Automático
              </span>
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
              Filmes internacionais dublados, séries completas, animes, sagas e trailers na melhor qualidade HD/4K.
            </p>
          </div>
        </section>
      )}

      {/* Search Movies, Series & Animes Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
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
              onClick={() => runSearch(chip.query, chip.mediaType)}
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

      {/* Netflix Horizontal Minimizable Carousels with Posters, Dubbed Movies, Series & Animes */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-purple-300">
          <Loader2 className="w-7 h-7 animate-spin text-red-400" />
          <span className="text-xs font-semibold">Carregando filmes internacionais dublados, séries e animes em HD...</span>
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

      {/* DARK NETFLIX CINEMA MODAL PLAYER WITH SEQUENCE QUEUE */}
      {activeMovie && (
        <div className="fixed inset-0 z-50 bg-black/97 backdrop-blur-2xl flex flex-col justify-center p-2.5 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-5xl mx-auto my-auto rounded-3xl overflow-hidden bg-[#06030d] border border-white/15 shadow-[0_0_90px_rgba(220,38,38,0.28)]">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Film className="w-4 h-4 text-red-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-white truncate">{activeMovie.title}</div>
                  <div className="text-[10px] text-purple-300/80 truncate">
                    {activeMovie.subtitle} · {activeMovie.durationLabel} · {activeMovie.qualityLabel || 'HD'}
                    {activeMovie.isDubbed ? ' · Dublado PT-BR' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
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
                    <span className="hidden sm:inline">YouTube</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveMovie(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  title="Fechar Cinema"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-full aspect-video bg-black">
              <iframe
                key={activeMovie.id}
                src={
                  activeMovie.youtubeVideoId
                    ? `https://www.youtube.com/embed/${activeMovie.youtubeVideoId}?autoplay=1&rel=0&playsinline=1&vq=hd1080&hl=pt-BR&cc_lang_pref=pt`
                    : activeMovie.videoStreamUrl || ''
                }
                title={activeMovie.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Horizontal Sequence Strip ("Na Sequência") */}
            {movieQueue.length > 1 && (
              <div className="p-3 border-t border-white/10 bg-[#080412] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-red-300">
                    🎞️ Na Sequência ({movieQueue.length} títulos — toque para continuar)
                  </div>
                  <div className="text-[10px] text-cyan-300/80 hidden sm:block">
                    Dica: na engrenagem ⚙️ do player você também pode travar em 1080p / 4K
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
        </div>
      )}
    </div>
  );
};

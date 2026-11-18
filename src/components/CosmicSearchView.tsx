import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Sparkles,
  Globe2,
  Shield,
  ShieldCheck,
  Music2,
  Clapperboard,
  Film,
  Play,
  BookOpen,
  X,
  Trash2,
  Clock,
  ArrowUpRight,
  Delete,
  Space,
  Keyboard,
} from 'lucide-react';
import { Track, MovieItem } from '../types';
import { getWorldTrending, searchWorldMusic } from '../utils/worldMusic';
import { fetchMoviesDirectory } from '../utils/moviesApi';

interface WebResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

interface AiSummary {
  headline: string;
  answer: string;
  highlights: string[];
  imageUrl?: string;
  sourceUrl?: string;
}

interface ReaderPage {
  url: string;
  domain: string;
  title: string;
  paragraphs: { tag: string; text: string }[];
}

interface Props {
  initialQuery?: string;
  initialPrivate?: boolean;
  localTracks: Track[];
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onWatchClip?: (track: Track, queue?: Track[]) => void;
  onOpenMovie: (movie: MovieItem) => void;
  onNavigateTab: (tab: 'explore' | 'movies') => void;
  onToast: (msg: string) => void;
}

type SearchCategory = 'all' | 'music' | 'clips' | 'movies' | 'web';

const HISTORY_STORAGE_KEY = 'lenkyx_cosmic_search_history_v1';

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const QUICK_MEDIA_FILTERS: { label: string; query: string; cat?: SearchCategory }[] = [
  { label: '⚡ Phonk & Drift', query: 'phonk drift', cat: 'music' },
  { label: '🤠 Sertanejo', query: 'Henrique e Juliano sertanejo', cat: 'music' },
  { label: '🍿 Filmes Dublados', query: 'filme completo dublado hd', cat: 'movies' },
  { label: '📺 Séries HD', query: 'serie completa dublada', cat: 'movies' },
  { label: '⛩️ Animes', query: 'anime dublado filme', cat: 'movies' },
  { label: '🌎 Pop Global', query: 'The Weeknd Dua Lipa official', cat: 'clips' },
  { label: '🛸 Espaço & Synth', query: 'cosmic synthwave space', cat: 'music' },
];

export const CosmicSearchView: React.FC<Props> = ({
  initialQuery = '',
  initialPrivate = false,
  localTracks,
  onPlayTrack,
  onWatchClip,
  onOpenMovie,
  onNavigateTab,
  onToast,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<'ai' | 'web'>('ai');
  const [privateMode, setPrivateMode] = useState(initialPrivate);
  const [activeCat, setActiveCat] = useState<SearchCategory>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showKeyboardMobile, setShowKeyboardMobile] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [musicResults, setMusicResults] = useState<Track[]>([]);
  const [movieResults, setMovieResults] = useState<MovieItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Instant Discovery Recommendations (before first search, just like Smart TV Search!)
  const [recTracks, setRecTracks] = useState<Track[]>([]);
  const [recMovies, setRecMovies] = useState<MovieItem[]>([]);

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [readerOpen, setReaderOpen] = useState(false);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerPage, setReaderPage] = useState<ReaderPage | null>(null);
  const [readerError, setReaderError] = useState('');

  const suggestTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([getWorldTrending(), fetchMoviesDirectory(false)]).then(([trRes, mvRes]) => {
      if (cancelled) return;
      if (trRes.status === 'fulfilled') {
        const list = trRes.value.tracks || [];
        setRecTracks(list.length > 0 ? list.slice(0, 10) : localTracks.slice(0, 10));
      } else {
        setRecTracks(localTracks.slice(0, 10));
      }
      if (mvRes.status === 'fulfilled') {
        const flat = mvRes.value.flatMap((c) => c.movies || []).slice(0, 10);
        setRecMovies(flat);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [localTracks]);

  useEffect(() => {
    if (initialQuery.trim()) {
      setQuery(initialQuery);
      void executeSearch(initialQuery, searchMode, initialPrivate);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
    const trimmed = query.trim();
    suggestTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        }
      } catch {
        // ignore
      }
    }, 180);
    return () => {
      if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
    };
  }, [query]);

  const openSiteInReader = async (url: string) => {
    setReaderOpen(true);
    setReaderLoading(true);
    setReaderPage(null);
    setReaderError('');
    try {
      const r = await fetch(`/api/web-reader?url=${encodeURIComponent(url)}`);
      const data = await r.json();
      if (data.ok && data.page) {
        setReaderPage(data.page);
      } else {
        setReaderError(data.error || 'Não foi possível carregar o resumo desta página.');
      }
    } catch {
      setReaderError('Não foi possível carregar o leitor interno agora.');
    } finally {
      setReaderLoading(false);
    }
  };

  const executeSearch = async (
    rawTerm: string,
    mode: 'ai' | 'web' = searchMode,
    isPriv: boolean = privateMode,
    forcedCat?: SearchCategory
  ) => {
    const clean = rawTerm.trim();
    if (!clean) return;

    if (/^(https?:\/\/)?[a-z0-9-]+(\.[a-z]{2,})(\/.*)?$/i.test(clean) && !clean.includes(' ')) {
      const normalized = clean.startsWith('http') ? clean : `https://${clean}`;
      void openSiteInReader(normalized);
      return;
    }

    if (forcedCat) setActiveCat(forcedCat);
    setShowSuggest(false);
    setLoading(true);
    setHasSearched(true);

    if (!isPriv) {
      setHistory((prev) => {
        const next = [clean, ...prev.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
        try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }

    try {
      const localMatches = localTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(clean.toLowerCase()) ||
          t.artist.toLowerCase().includes(clean.toLowerCase()) ||
          (t.genre || '').toLowerCase().includes(clean.toLowerCase())
      );

      const [webRes, worldMus, moviesRes] = await Promise.allSettled([
        fetch(
          `/api/web-search?q=${encodeURIComponent(clean)}&mode=${mode}&private=${isPriv ? '1' : '0'}`
        ).then((r) => (r.ok ? r.json() : null)),
        searchWorldMusic(clean, { includeArchiveSpace: true }),
        fetch(`/api/movies-search?q=${encodeURIComponent(clean)}`).then((r) => (r.ok ? r.json() : null)),
      ]);

      let webPlayableTracks: Track[] = [];
      if (webRes.status === 'fulfilled' && webRes.value) {
        setAiSummary(webRes.value.aiSummary || null);
        setWebResults(Array.isArray(webRes.value.webResults) ? webRes.value.webResults : []);
        if (Array.isArray(webRes.value.playableMedia)) {
          webPlayableTracks = webRes.value.playableMedia;
        }
      } else {
        setAiSummary(null);
        setWebResults([]);
      }

      const worldList = worldMus.status === 'fulfilled' ? worldMus.value.tracks || [] : [];
      const mergedMusic: Track[] = [...localMatches];
      for (const item of [...webPlayableTracks, ...worldList]) {
        const dup = mergedMusic.some(
          (m) =>
            m.id === item.id ||
            (m.youtubeVideoId && item.youtubeVideoId && m.youtubeVideoId === item.youtubeVideoId)
        );
        if (!dup) mergedMusic.push(item);
      }
      setMusicResults(mergedMusic.slice(0, 18));

      if (moviesRes.status === 'fulfilled' && moviesRes.value) {
        setMovieResults((moviesRes.value.items || moviesRes.value.movies || []).slice(0, 12));
      } else {
        setMovieResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVirtualKey = (char: string) => {
    setQuery((prev) => prev + char.toLowerCase());
    setShowSuggest(true);
  };

  const handleBackspace = () => {
    setQuery((prev) => prev.slice(0, -1));
  };

  const togglePrivateMode = () => {
    const next = !privateMode;
    setPrivateMode(next);
    onToast(next ? '🕵️ Modo Privado ativado: zero histórico salvo!' : '🌐 Modo Normal reativado.');
  };

  const clearPrivateSession = () => {
    setQuery('');
    setAiSummary(null);
    setWebResults([]);
    setMusicResults([]);
    setMovieResults([]);
    setHasSearched(false);
    onToast('🧹 Busca limpa!');
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
    onToast('Histórico apagado.');
  };

  const clipResults = musicResults.filter((t) => Boolean(t.youtubeVideoId));

  const categories: { id: SearchCategory; label: string; count?: number }[] = [
    { id: 'all', label: '✨ Tudo' },
    { id: 'music', label: '🎵 Músicas', count: musicResults.length },
    { id: 'clips', label: '🎬 Clipes', count: clipResults.length },
    { id: 'movies', label: '🍿 Cinema & Séries', count: movieResults.length },
    { id: 'web', label: '🌐 Web & IA', count: webResults.length },
  ];

  const displayedMusic = hasSearched ? musicResults : recTracks.length > 0 ? recTracks : localTracks.slice(0, 8);
  const displayedMovies = hasSearched ? movieResults : recMovies;

  return (
    <div className="space-y-5 pb-32 md:pb-24">
      {/* === SMART TV / PC / MOBILE TWO-COLUMN SEARCH CONSOLE === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Search Input + On-Screen TV/Touch Keyboard + Quick Mood Filters */}
        <section
          className={`lg:col-span-5 rounded-3xl p-4 sm:p-5 border space-y-4 ${
            privateMode
              ? 'bg-[#090814]/95 border-purple-400/45 shadow-2xl'
              : 'cosmic-card-3d'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 flex items-center gap-1.5">
                {privateMode ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-300" /> MODO PRIVADO
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" /> BUSCA INTELIGENTE
                  </>
                )}
              </div>
              <h1 className="font-display text-lg font-black text-white mt-0.5">
                Músicas, Clipes & Cinema
              </h1>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchMode((m) => (m === 'ai' ? 'web' : 'ai'))}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1 border transition ${
                  searchMode === 'ai'
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-black border-transparent'
                    : 'bg-white/[0.07] border-white/15 text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" /> {searchMode === 'ai' ? 'IA' : 'Web'}
              </button>
              <button
                type="button"
                onClick={togglePrivateMode}
                className={`p-2 rounded-full border transition ${
                  privateMode
                    ? 'bg-purple-600/40 border-purple-400 text-purple-100'
                    : 'bg-white/[0.07] border-white/15 text-slate-300 hover:bg-white/15'
                }`}
                title="Modo Privado"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearPrivateSession}
                  className="p-2 rounded-full bg-white/[0.07] hover:bg-rose-500/25 border border-white/15 text-slate-300 hover:text-white transition"
                  title="Limpar busca"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Bar + Autocomplete */}
          <div className="relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeSearch(query);
              }}
              className="flex items-center gap-2 rounded-2xl bg-black/60 border border-cyan-400/40 focus-within:border-cyan-300 px-3 py-2 shadow-inner"
            >
              <Search className="w-4 h-4 text-cyan-300 shrink-0" />
              <input
                type="text"
                value={query}
                onFocus={() => setShowSuggest(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggest(true);
                }}
                placeholder="Digite música, artista, filme ou série..."
                className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-xs font-black disabled:opacity-45 shrink-0"
              >
                {loading ? '...' : 'Ir'}
              </button>
            </form>

            {showSuggest && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-[#090616]/98 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.07] text-[10px] font-bold text-slate-400">
                  <span>Sugestões</span>
                  <button type="button" onClick={() => setShowSuggest(false)} className="text-cyan-300">
                    Fechar
                  </button>
                </div>
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQuery(s);
                      void executeSearch(s);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-100 hover:bg-white/[0.08] flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Search className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{s}</span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Toggle for On-Screen TV/Touch Keyboard */}
          <div className="flex lg:hidden items-center justify-between">
            <button
              type="button"
              onClick={() => setShowKeyboardMobile((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/15 text-[11px] font-bold text-cyan-200 flex items-center gap-1.5"
            >
              <Keyboard className="w-3.5 h-3.5" />
              {showKeyboardMobile ? 'Ocultar Teclado TV' : 'Abrir Teclado na Tela'}
            </button>
          </div>

          {/* TV / Touch On-Screen Virtual Keyboard (Always visible on lg+, toggleable on mobile) */}
          <div className={`${showKeyboardMobile ? 'block' : 'hidden'} lg:block space-y-1.5 pt-1`}>
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-10 gap-1">
                {row.map((keyChar) => (
                  <button
                    key={keyChar}
                    type="button"
                    onClick={() => handleVirtualKey(keyChar)}
                    className="h-9 rounded-lg bg-white/[0.07] hover:bg-cyan-400/25 focus:bg-white focus:text-black border border-white/10 text-xs font-black text-white flex items-center justify-center transition active:scale-95"
                  >
                    {keyChar}
                  </button>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-12 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setQuery((p) => `${p} `)}
                className="col-span-5 h-9 rounded-lg bg-white/[0.08] hover:bg-white/20 border border-white/10 text-[11px] font-bold text-white flex items-center justify-center gap-1"
              >
                <Space className="w-3.5 h-3.5" /> Espaço
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="col-span-3 h-9 rounded-lg bg-white/[0.08] hover:bg-rose-500/30 border border-white/10 text-[11px] font-bold text-white flex items-center justify-center gap-1"
              >
                <Delete className="w-3.5 h-3.5" /> Apagar
              </button>
              <button
                type="button"
                onClick={() => void executeSearch(query)}
                disabled={!query.trim()}
                className="col-span-4 h-9 rounded-lg bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-xs font-black disabled:opacity-40"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Quick Genre / Mood Chips */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Explorar Rápido
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_MEDIA_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => {
                    setQuery(f.query);
                    void executeSearch(f.query, searchMode, privateMode, f.cat);
                  }}
                  className="px-2.5 py-1.5 rounded-full bg-white/[0.07] hover:bg-cyan-400/20 border border-white/10 text-[11px] font-bold text-slate-100 transition"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent History */}
          {!privateMode && history.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recentes:
              </span>
              {history.slice(0, 5).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setQuery(h);
                    void executeSearch(h);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/15 border border-white/10 text-[10px] text-slate-200"
                >
                  {h}
                </button>
              ))}
              <button type="button" onClick={clearHistory} className="text-[10px] text-rose-300/80 hover:text-rose-200">
                Limpar
              </button>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Playable Recommendations & Live Results (Music, Clips, Cinema, Web) */}
        <section className="lg:col-span-7 space-y-5 min-w-0">
          {/* Category Filter Tabs */}
          {hasSearched && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap border transition ${
                    activeCat === c.id
                      ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-black border-transparent shadow'
                      : 'bg-white/[0.06] hover:bg-white/15 border-white/10 text-slate-200'
                  }`}
                >
                  {c.label}
                  {typeof c.count === 'number' && c.count > 0 ? ` (${c.count})` : ''}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="py-16 rounded-3xl cosmic-card-3d text-center space-y-3">
              <div className="w-9 h-9 mx-auto rounded-full border-3 border-cyan-400 border-t-pink-500 animate-spin" />
              <div className="text-xs font-bold text-cyan-200">Buscando músicas, clipes e cinema...</div>
            </div>
          )}

          {/* AI Summary Card */}
          {!loading && hasSearched && searchMode === 'ai' && aiSummary && (activeCat === 'all' || activeCat === 'web') && (
            <div className="rounded-3xl p-4 bg-gradient-to-br from-cyan-950/45 via-[#0b071c] to-purple-950/45 border border-cyan-400/35 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/40 text-[10px] font-black text-cyan-200">
                <Sparkles className="w-3 h-3" /> RESUMO IA
              </div>
              <div className="flex gap-3 items-start">
                {aiSummary.imageUrl && (
                  <img src={aiSummary.imageUrl} alt={aiSummary.headline} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                )}
                <div className="min-w-0 space-y-1">
                  <h2 className="font-display text-sm sm:text-base font-black text-white">{aiSummary.headline}</h2>
                  <p className="text-xs text-slate-200/90 leading-relaxed">{aiSummary.answer}</p>
                </div>
              </div>
            </div>
          )}

          {/* 1. Music & Audio Results */}
          {!loading && (activeCat === 'all' || activeCat === 'music') && displayedMusic.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-black text-white flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-pink-400" />
                  <span>{hasSearched ? `Músicas Encontradas (${displayedMusic.length})` : 'Recomendações Musicais'}</span>
                </h2>
                <button
                  onClick={() => onNavigateTab('explore')}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Artistas & Mundo →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {displayedMusic.slice(0, activeCat === 'music' ? 14 : 6).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onPlayTrack(t, displayedMusic)}
                    className="p-2.5 rounded-2xl cosmic-card-3d flex items-center gap-3 text-left hover:bg-white/[0.08] transition group"
                  >
                    <img
                      src={t.coverUrl || '/covers/album-official.jpg'}
                      alt={t.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate group-hover:text-cyan-300">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-300/80 truncate">{t.artist}</div>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-cyan-400/20 group-hover:bg-cyan-400 text-cyan-200 group-hover:text-black flex items-center justify-center shrink-0 transition">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Official Clips (Plays in LENKYX Clip Theater) */}
          {!loading && onWatchClip && (activeCat === 'all' || activeCat === 'clips') && clipResults.length > 0 && hasSearched && (
            <div className="space-y-2.5">
              <h2 className="font-display text-sm font-black text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-400" /> Clipes Oficiais ({clipResults.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {clipResults.slice(0, 6).map((t) => (
                  <button
                    key={`clip-${t.id}`}
                    onClick={() => onWatchClip(t, clipResults)}
                    className="rounded-2xl overflow-hidden cosmic-card-3d text-left group"
                  >
                    <div className="relative aspect-video bg-black">
                      <img
                        src={t.coverUrl || '/covers/album-official.jpg'}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-[9px] font-black text-white">
                        CLIPE
                      </span>
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-black text-white line-clamp-1">{t.title}</div>
                      <div className="text-[10px] text-slate-300/75 truncate">{t.artist}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Cinema, Series & Animes (Launches directly in LENKYX Cinema with Netflix-style intro!) */}
          {!loading && (activeCat === 'all' || activeCat === 'movies') && displayedMovies.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-black text-white flex items-center gap-2">
                  <Clapperboard className="w-4 h-4 text-rose-400" />
                  <span>{hasSearched ? `Cinema & Séries (${displayedMovies.length})` : 'Cinema & Séries em Destaque'}</span>
                </h2>
                <button
                  onClick={() => onNavigateTab('movies')}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Abrir Cinema →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {displayedMovies.slice(0, 6).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onOpenMovie(m)}
                    className="rounded-2xl overflow-hidden cosmic-card-3d text-left group"
                  >
                    <div className="relative aspect-[16/10] bg-black">
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white">
                        {m.durationLabel}
                      </span>
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-black text-white line-clamp-1">{m.title}</div>
                      <div className="text-[10px] text-slate-300/75 truncate">{m.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Safe Web Results (Opens inside LENKYX Reader, zero external competitor leaks) */}
          {!loading && hasSearched && (activeCat === 'all' || activeCat === 'web') && webResults.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="font-display text-sm font-black text-white flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-cyan-400" /> Sites & Artigos ({webResults.length})
              </h2>
              <div className="space-y-2">
                {webResults.map((r, i) => (
                  <div
                    key={`${r.url}-${i}`}
                    onClick={() => void openSiteInReader(r.url)}
                    className="p-3 rounded-2xl cosmic-card-3d flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.06] transition"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-[10px] font-bold text-emerald-300 truncate">{r.domain}</div>
                      <div className="text-xs font-black text-white line-clamp-1">{r.title}</div>
                      {r.snippet && <p className="text-[11px] text-slate-300/80 line-clamp-2">{r.snippet}</p>}
                    </div>
                    <span className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 text-[10px] font-black shrink-0 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Ler
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* === SAFE IN-APP WEB SITE READER MODAL === */}
      {readerOpen && (
        <div className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-xl p-3 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-3xl max-h-[88dvh] rounded-3xl glass-panel flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-emerald-300 truncate">
                  {readerPage?.domain || 'Leitor LENKYX'}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {readerPage?.title || 'Carregando...'}
                </div>
              </div>
              <button
                onClick={() => setReaderOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3">
              {readerLoading && (
                <div className="py-12 text-center text-xs font-bold text-cyan-300">
                  🌐 Carregando leitura limpa da página...
                </div>
              )}
              {readerError && <p className="text-xs text-amber-200 text-center py-8">{readerError}</p>}
              {readerPage?.paragraphs.map((p, idx) => (
                <p
                  key={idx}
                  className={
                    p.tag.startsWith('h')
                      ? 'font-display text-sm sm:text-base font-black text-cyan-200 pt-2'
                      : 'text-xs sm:text-sm text-slate-200 leading-relaxed'
                  }
                >
                  {p.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

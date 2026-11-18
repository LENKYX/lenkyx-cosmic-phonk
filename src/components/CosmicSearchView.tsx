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
  Gamepad2,
  Play,
  ExternalLink,
  BookOpen,
  X,
  Trash2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Track, MovieItem } from '../types';
import { searchWorldMusic } from '../utils/worldMusic';
import { fetchWorldShorts, CommunityShortItem } from '../utils/communityApi';

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
  onNavigateTab: (tab: 'explore' | 'movies' | 'video' | 'arcade') => void;
  onToast: (msg: string) => void;
}

type SearchCategory = 'all' | 'web' | 'music' | 'videos' | 'movies' | 'games';

const HISTORY_STORAGE_KEY = 'lenkyx_cosmic_search_history_v1';

export const CosmicSearchView: React.FC<Props> = ({
  initialQuery = '',
  initialPrivate = false,
  localTracks,
  onPlayTrack,
  onNavigateTab,
  onToast,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<'ai' | 'web'>('ai');
  const [privateMode, setPrivateMode] = useState(initialPrivate);
  const [activeCat, setActiveCat] = useState<SearchCategory>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [musicResults, setMusicResults] = useState<Track[]>([]);
  const [videoResults, setVideoResults] = useState<CommunityShortItem[]>([]);
  const [movieResults, setMovieResults] = useState<MovieItem[]>([]);
  const [gameResults, setGameResults] = useState<{ id: string; title: string; genre: string; posterUrl: string }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

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
    if (initialQuery.trim()) {
      setQuery(initialQuery);
      void executeSearch(initialQuery, searchMode, initialPrivate);
    }
  }, [initialQuery]);

  // Live Google-style autocomplete suggestions as user types
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

  const executeSearch = async (
    rawTerm: string,
    mode: 'ai' | 'web' = searchMode,
    isPriv: boolean = privateMode
  ) => {
    const clean = rawTerm.trim();
    if (!clean) return;

    // Direct URL shortcut (e.g. "nasa.gov" or "https://...")
    if (/^(https?:\/\/)?[a-z0-9-]+(\.[a-z]{2,})(\/.*)?$/i.test(clean) && !clean.includes(' ')) {
      const normalized = clean.startsWith('http') ? clean : `https://${clean}`;
      void openSiteInReader(normalized);
      return;
    }

    setShowSuggest(false);
    setLoading(true);
    setHasSearched(true);

    if (!isPriv) {
      setHistory((prev) => {
        const next = [clean, ...prev.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 12);
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

      const [webRes, worldMus, shortsRes, moviesRes, gamesRes] = await Promise.allSettled([
        fetch(
          `/api/web-search?q=${encodeURIComponent(clean)}&mode=${mode}&private=${isPriv ? '1' : '0'}`
        ).then((r) => (r.ok ? r.json() : null)),
        searchWorldMusic(clean, { includeArchiveSpace: true }),
        fetchWorldShorts('all', clean),
        fetch(`/api/movies-search?q=${encodeURIComponent(clean)}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/arcade/search?q=${encodeURIComponent(clean)}`).then((r) => (r.ok ? r.json() : null)),
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
      setMusicResults(mergedMusic.slice(0, 16));

      setVideoResults(shortsRes.status === 'fulfilled' ? (shortsRes.value || []).slice(0, 12) : []);

      if (moviesRes.status === 'fulfilled' && moviesRes.value) {
        setMovieResults((moviesRes.value.items || moviesRes.value.movies || []).slice(0, 10));
      } else {
        setMovieResults([]);
      }

      if (gamesRes.status === 'fulfilled' && gamesRes.value) {
        setGameResults((gamesRes.value.items || []).slice(0, 10));
      } else {
        setGameResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

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
        setReaderError(data.error || 'Este site exige abertura direta no navegador.');
      }
    } catch {
      setReaderError('Não foi possível extrair o conteúdo no leitor interno.');
    } finally {
      setReaderLoading(false);
    }
  };

  const togglePrivateMode = () => {
    const next = !privateMode;
    setPrivateMode(next);
    if (next) {
      onToast('🕵️ Modo Privado ativado: nenhuma pesquisa será salva!');
    } else {
      onToast('🌐 Modo Normal reativado.');
    }
  };

  const clearPrivateSession = () => {
    setQuery('');
    setAiSummary(null);
    setWebResults([]);
    setMusicResults([]);
    setVideoResults([]);
    setMovieResults([]);
    setGameResults([]);
    setHasSearched(false);
    onToast('🧹 Sessão limpa!');
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
    onToast('Histórico de pesquisas apagado.');
  };

  const categories: { id: SearchCategory; label: string; count?: number }[] = [
    { id: 'all', label: '✨ Tudo & IA' },
    { id: 'web', label: '🌐 Internet / Sites', count: webResults.length },
    { id: 'music', label: '🎵 Músicas', count: musicResults.length },
    { id: 'videos', label: '🎥 Vídeos & Reels', count: videoResults.length },
    { id: 'movies', label: '🎬 Cinema & TV', count: movieResults.length },
    { id: 'games', label: '🕹️ Jogos', count: gameResults.length },
  ];

  return (
    <div className="space-y-5 pb-36 md:pb-28">
      {/* === ARCHITECTURAL GOOGLE + AI SEARCH HERO === */}
      <section
        className={`rounded-3xl p-4 sm:p-6 border transition-all ${
          privateMode
            ? 'bg-gradient-to-br from-[#0b0a14] via-[#07070e] to-[#040408] border-purple-400/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
            : 'cosmic-card-3d'
        }`}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 flex items-center gap-1.5">
                {privateMode ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-300" /> NAVEGAÇÃO PRIVADA ATIVA
                  </>
                ) : (
                  <>
                    <Globe2 className="w-3.5 h-3.5" /> SETOR DE PESQUISA · MEU MUNDO LENKYX
                  </>
                )}
              </div>
              <h1 className="font-display text-lg sm:text-2xl font-black text-white mt-0.5">
                Pesquise na <span className="neon-text">Internet, IA, Músicas & Vídeos</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchMode('ai')}
                className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border transition ${
                  searchMode === 'ai'
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-black border-transparent shadow'
                    : 'bg-white/[0.06] border-white/15 text-slate-200 hover:bg-white/15'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Modo IA
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('web')}
                className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border transition ${
                  searchMode === 'web'
                    ? 'bg-white text-black border-transparent shadow'
                    : 'bg-white/[0.06] border-white/15 text-slate-200 hover:bg-white/15'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" /> Web Direta
              </button>
              <button
                type="button"
                onClick={togglePrivateMode}
                className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border transition ${
                  privateMode
                    ? 'bg-purple-600/35 border-purple-400 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                    : 'bg-white/[0.06] border-white/15 text-slate-300 hover:bg-white/15'
                }`}
                title="Navegar e pesquisar sem salvar histórico"
              >
                <Shield className="w-3.5 h-3.5" />
                {privateMode ? 'Privado: ON' : 'Modo Privado'}
              </button>
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearPrivateSession}
                  className="p-2 rounded-full bg-white/[0.06] hover:bg-rose-500/25 border border-white/10 text-slate-300 hover:text-white transition"
                  title="Limpar resultados desta sessão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Adaptive Full-Width Google + AI Search Bar (Always Readable on Mobile, PC & TV) */}
          <div className="relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeSearch(query);
              }}
              className={`flex items-center gap-2 rounded-2xl border px-3 sm:px-4 py-2 sm:py-2.5 transition ${
                privateMode
                  ? 'bg-black/75 border-purple-400/50 focus-within:border-purple-300'
                  : 'bg-black/55 border-cyan-400/40 focus-within:border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.14)]'
              }`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 shrink-0" />
              <input
                type="text"
                value={query}
                onFocus={() => setShowSuggest(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggest(true);
                }}
                placeholder={
                  privateMode
                    ? 'Pesquisa privada: digite qualquer site, pergunta, música ou vídeo...'
                    : 'Pesquise qualquer coisa na internet, pergunte à IA ou digite um site (ex: nasa.gov)...'
                }
                className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setShowSuggest(true);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
                  title="Limpar texto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-xs sm:text-sm font-black hover:brightness-110 disabled:opacity-45 shrink-0 transition"
              >
                {loading ? 'Buscando...' : 'Pesquisar'}
              </button>
            </form>

            {/* Instant Autocomplete Suggestions Dropdown */}
            {showSuggest && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-[#090616]/98 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-white/[0.07] text-[10px] font-bold text-slate-400">
                  <span>Sugestões Inteligentes</span>
                  <button
                    type="button"
                    onClick={() => setShowSuggest(false)}
                    className="text-cyan-300 hover:underline"
                  >
                    Fechar
                  </button>
                </div>
                {suggestions.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQuery(s);
                      void executeSearch(s);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs sm:text-sm text-slate-100 hover:bg-white/[0.08] flex items-center justify-between gap-2 transition"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{s}</span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent History Pills (hidden in Private Mode) */}
          {!privateMode && history.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Clock className="w-3 h-3" /> Recentes:
              </span>
              {history.slice(0, 6).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setQuery(h);
                    void executeSearch(h);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 text-[11px] text-slate-200 transition"
                >
                  {h}
                </button>
              ))}
              <button
                type="button"
                onClick={clearHistory}
                className="text-[10px] text-rose-300/80 hover:text-rose-200 ml-1"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Category Filter Bar */}
      {hasSearched && (
        <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1">
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

      {/* === MODO IA SYNTHESIS CARD === */}
      {hasSearched && searchMode === 'ai' && aiSummary && (activeCat === 'all' || activeCat === 'web') && (
        <section className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-cyan-950/45 via-[#0b071c] to-purple-950/45 border border-cyan-400/35 shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/40 text-[10px] font-black text-cyan-200">
              <Sparkles className="w-3.5 h-3.5" /> RESUMO MODO IA
            </div>
            {privateMode && (
              <span className="text-[10px] font-bold text-purple-300">Sem histórico salvo</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {aiSummary.imageUrl && (
              <img
                src={aiSummary.imageUrl}
                alt={aiSummary.headline}
                className="w-24 h-24 rounded-2xl object-cover border border-white/15 shrink-0"
              />
            )}
            <div className="space-y-2 min-w-0 flex-1">
              <h2 className="font-display text-base sm:text-lg font-black text-white">
                {aiSummary.headline}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
                {aiSummary.answer}
              </p>
              {aiSummary.highlights.length > 0 && (
                <div className="space-y-1 pt-1">
                  {aiSummary.highlights.map((hl, i) => (
                    <div key={i} className="text-[11px] text-cyan-100/80 line-clamp-2">
                      {hl}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* === ORGANIZED RESULTS SECTIONS === */}
      {hasSearched && !loading && (
        <div className="space-y-6">
          {/* 1. Music Results (Plays directly inside LENKYX!) */}
          {(activeCat === 'all' || activeCat === 'music') && musicResults.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-white flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-pink-400" /> Músicas Organizadas ({musicResults.length})
                </h3>
                <button
                  onClick={() => onNavigateTab('explore')}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Abrir Explorar Músicas →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {musicResults.slice(0, activeCat === 'music' ? 14 : 6).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onPlayTrack(t, musicResults)}
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
            </section>
          )}

          {/* 2. Web / Internet Results */}
          {(activeCat === 'all' || activeCat === 'web') && webResults.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="font-display text-sm font-black text-white flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-cyan-400" /> Sites & Resultados da Internet ({webResults.length})
              </h3>
              <div className="space-y-2.5">
                {webResults.map((r, i) => (
                  <div
                    key={`${r.url}-${i}`}
                    onClick={() => void openSiteInReader(r.url)}
                    className="p-3.5 rounded-2xl cosmic-card-3d flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.06] transition"
                  >
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="text-[11px] font-bold text-emerald-300 truncate">{r.domain}</div>
                      <div className="text-sm font-black text-white line-clamp-1">{r.title}</div>
                      {r.snippet && (
                        <p className="text-xs text-slate-300/85 line-clamp-2 leading-relaxed">{r.snippet}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void openSiteInReader(r.url);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/25 to-pink-500/25 hover:from-cyan-500/40 hover:to-pink-500/40 border border-cyan-400/45 text-cyan-100 text-xs font-black flex items-center gap-1.5 transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Abrir no LENKYX
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Videos / Cinema / Games Quick Organized Sections */}
          {(activeCat === 'all' || activeCat === 'videos') && videoResults.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-pink-400" /> Vídeos & Reels ({videoResults.length})
                </h3>
                <button
                  onClick={() => onNavigateTab('video')}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Assistir 1 por 1 no Setor Reels →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {videoResults.slice(0, 6).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => onNavigateTab('video')}
                    className="rounded-2xl overflow-hidden cosmic-card-3d text-left group"
                  >
                    <div className="aspect-[9/14] bg-black relative">
                      <img
                        src={v.poster_url || '/covers/album-official.jpg'}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    <div className="p-2 text-[11px] font-bold text-white line-clamp-2">{v.title}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {(activeCat === 'all' || activeCat === 'movies') && movieResults.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-white flex items-center gap-2">
                  <Clapperboard className="w-4 h-4 text-amber-300" /> Cinema, Séries & TV ({movieResults.length})
                </h3>
                <button
                  onClick={() => onNavigateTab('movies')}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Abrir Cinema →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {movieResults.slice(0, 5).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onNavigateTab('movies')}
                    className="rounded-2xl overflow-hidden cosmic-card-3d text-left"
                  >
                    <div className="aspect-[2/3] bg-black">
                      <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 text-[11px] font-bold text-white line-clamp-1">{m.title}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {(activeCat === 'all' || activeCat === 'games') && gameResults.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-white flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-emerald-300" /> Jogos Grátis ({gameResults.length})
                </h3>
                <button
                  onClick={() => onNavigateTab('arcade')}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Abrir Fliperama →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {gameResults.slice(0, 5).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onNavigateTab('arcade')}
                    className="rounded-2xl overflow-hidden cosmic-card-3d text-left"
                  >
                    <div className="aspect-video bg-black">
                      <img src={g.posterUrl} alt={g.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 text-[11px] font-bold text-white line-clamp-1">{g.title}</div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* === SAFE IN-APP WEB SITE READER MODAL === */}
      {readerOpen && (
        <div className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-xl p-3 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-3xl max-h-[88dvh] rounded-3xl glass-panel flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-emerald-300 truncate">
                  {readerPage?.domain || 'Leitor Seguro LENKYX'}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {readerPage?.title || 'Carregando conteúdo...'}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {readerPage?.url && (
                  <a
                    href={readerPage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 text-xs font-black flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir Site
                  </a>
                )}
                <button
                  onClick={() => setReaderOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3">
              {readerLoading && (
                <div className="py-12 text-center text-xs font-bold text-cyan-300">
                  🌐 Carregando leitura limpa da página...
                </div>
              )}
              {readerError && (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-amber-200">{readerError}</p>
                </div>
              )}
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

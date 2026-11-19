import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Play,
  Search,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  LayoutGrid,
  Radio,
  QrCode,
  ShieldOff,
} from 'lucide-react';
import { MmaScoreItem, SoccerScoreItem, SportStreamItem } from '../types';
import {
  fetchSportsDirectory,
  searchSportsCatalog,
  SportsCategory,
} from '../utils/moviesApi';
import { clearBackgroundMediaSession, syncBackgroundMediaSession } from '../utils/backgroundAudioGuard';
import { CosmicGtaLoader } from './CosmicGtaLoader';
import { PlayerQueueStrip } from './PlayerQueueStrip';
import { claimMediaFocus, registerMediaStopper } from '../utils/mediaCoordinator';

interface Props {
  onPauseMusic: () => void;
  onSportsModalChange: (watching: boolean) => void;
  volume?: number;
  muted?: boolean;
  onVolume?: (v: number) => void;
  onToggleMute?: () => void;
  onOpenPix?: () => void;
  onEmergencyStop?: () => void;
}

type SportFilter = 'all' | 'soccer' | 'mma';

const QUICK_ARENA_CHIPS: { label: string; query: string; sport: SportFilter; live: boolean }[] = [
  { label: '🔴 Jogos Ao Vivo', query: 'futebol ao vivo jogo com imagens hoje', sport: 'soccer', live: true },
  { label: '🥊 UFC & MMA Ao Vivo', query: 'UFC MMA luta ao vivo octogono', sport: 'mma', live: true },
  { label: '🇧🇷 Brasileirão', query: 'brasileirao serie a jogo completo melhores momentos', sport: 'soccer', live: false },
  { label: '⭐ Champions League', query: 'champions league jogo completo melhores momentos', sport: 'soccer', live: false },
  { label: '🏆 Libertadores', query: 'copa libertadores jogo completo melhores momentos', sport: 'soccer', live: false },
  { label: '🇧🇷 Alex Poatan', query: 'Alex Pereira Poatan UFC luta completa nocaute', sport: 'mma', live: false },
  { label: '🦁 Charles do Bronx', query: 'Charles Oliveira do Bronx UFC luta completa', sport: 'mma', live: false },
  { label: '🔥 Nocautes Brutais', query: 'UFC MMA melhores nocautes lutas completas', sport: 'mma', live: false },
];

export const SportsArenaView: React.FC<Props> = ({
  onPauseMusic,
  onSportsModalChange,
  volume = 0.88,
  muted = false,
  onVolume,
  onToggleMute,
  onOpenPix,
  onEmergencyStop,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soccerScores, setSoccerScores] = useState<SoccerScoreItem[]>([]);
  const [mmaScores, setMmaScores] = useState<MmaScoreItem[]>([]);
  const [categories, setCategories] = useState<SportsCategory[]>([]);
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SportStreamItem[] | null>(null);
  const [gridByCat, setGridByCat] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState('Ao Vivo');

  const [activeStream, setActiveStream] = useState<SportStreamItem | null>(null);
  const [streamQueue, setStreamQueue] = useState<SportStreamItem[]>([]);
  const [, setPrerollActive] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [quality, setQuality] = useState<'auto' | 'hd720' | 'hd1080' | 'large'>('hd720');

  const playerRef = useRef<HTMLDivElement | null>(null);

  const loadDirectory = async (force = false, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await fetchSportsDirectory(force);
      setSoccerScores(data.scoreboard?.soccer || []);
      setMmaScores(data.scoreboard?.mma || []);
      setCategories(data.categories || []);
      setLastUpdated(
        `Atualizado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDirectory(false, false);
    const timer = window.setInterval(() => {
      void loadDirectory(true, true);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    onSportsModalChange(Boolean(activeStream));
    if (!activeStream) {
      setExpandedView(false);
      setPrerollActive(false);
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    }
    return () => onSportsModalChange(false);
  }, [activeStream, onSportsModalChange]);

  useEffect(() => {
    if (!activeStream) return;
    syncBackgroundMediaSession(
      {
        title: activeStream.title,
        artist: activeStream.subtitle || 'LENKYX Arena Ao Vivo',
        album: 'Futebol & UFC Ao Vivo',
        artworkUrl: activeStream.posterUrl,
        isPlaying: true,
      },
      {
        onPrev: () => stepStream(-1),
        onNext: () => stepStream(1),
        onStop: () => {
          setActiveStream(null);
          onEmergencyStop?.();
        },
      }
    );
  }, [activeStream]);

  const filteredCategories = useMemo(() => {
    if (sportFilter === 'all') return categories;
    return categories.filter((c) => c.sport === sportFilter);
  }, [categories, sportFilter]);

  useEffect(() => {
    return registerMediaStopper('sports', () => setActiveStream(null));
  }, []);

  const openStream = (item: SportStreamItem, queue: SportStreamItem[]) => {
    claimMediaFocus('sports');
    onPauseMusic();
    setStreamQueue(queue.length ? queue : [item]);
    setActiveStream(item);
    setPrerollActive(true);
  };

  const stepStream = (dir: -1 | 1) => {
    if (!activeStream || streamQueue.length < 2) return;
    const idx = streamQueue.findIndex((x) => x.id === activeStream.id);
    const next = streamQueue[(idx + dir + streamQueue.length) % streamQueue.length];
    setActiveStream(next);
    setPrerollActive(true);
  };

  const runSearch = async (rawQ: string, sport: SportFilter = sportFilter, liveOnly = false) => {
    const clean = rawQ.trim();
    if (!clean) {
      setSearchResults(null);
      return;
    }
    setSearchQ(rawQ);
    setSearching(true);
    try {
      const items = await searchSportsCatalog(clean, sport, liveOnly);
      setSearchResults(items);
      if (items.length > 0 && liveOnly) {
        // Optional auto-ready queue
      }
    } finally {
      setSearching(false);
    }
  };

  const toggleExpand = async () => {
    const next = !expandedView;
    setExpandedView(next);
    try {
      if (next && playerRef.current?.requestFullscreen && !document.fullscreenElement) {
        await playerRef.current.requestFullscreen();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // mobile fallback
    }
  };

  const renderStreamCard = (item: SportStreamItem, queue: SportStreamItem[], compactGrid = false) => (
    <button
      key={item.id}
      type="button"
      onClick={() => openStream(item, queue)}
      className={`group text-left rounded-2xl cosmic-card-3d overflow-hidden snap-start transition ${
        compactGrid ? 'w-full' : 'w-52 sm:w-64 shrink-0'
      }`}
    >
      <div className="relative aspect-video bg-black">
        <img
          src={item.posterUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow ${
            item.isLive
              ? 'bg-red-600 text-white'
              : item.sport === 'mma'
                ? 'bg-amber-400 text-black'
                : 'bg-emerald-400 text-black'
          }`}
        >
          {item.isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
          {item.sourceLabel}
        </span>
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-mono text-white">
          {item.durationLabel}
        </span>
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <span className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </span>
        </div>
      </div>
      <div className="p-2.5 space-y-0.5">
        <div className="text-xs font-extrabold text-white line-clamp-2 group-hover:text-emerald-300 transition">
          {item.title}
        </div>
        <div className="text-[10px] text-slate-300/75 truncate">{item.subtitle}</div>
      </div>
    </button>
  );

  const arenaModal =
    activeStream &&
    createPortal(
      <div
        ref={playerRef}
        className={`fixed inset-0 z-[9999] bg-black flex flex-col justify-center overflow-hidden ${
          expandedView ? 'p-0' : 'p-0 sm:p-4'
        }`}
      >
        <div
          className={`w-full mx-auto overflow-hidden bg-[#05030d] flex flex-col relative ${
            expandedView
              ? 'h-[100dvh] max-w-none rounded-none border-0'
              : 'h-[100dvh] sm:h-auto sm:max-h-[94dvh] sm:max-w-6xl sm:rounded-3xl sm:border sm:border-emerald-400/25 shadow-[0_0_90px_rgba(16,185,129,0.28)]'
          }`}
        >
          {/* Arena Player Top Bar */}
          <div className="px-3 sm:px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#070815] shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 flex items-center gap-1 ${
                  activeStream.isLive ? 'bg-red-600 text-white' : 'bg-emerald-400 text-black'
                }`}
              >
                {activeStream.isLive ? 'AO VIVO' : activeStream.sport === 'mma' ? 'UFC / MMA' : 'FUTEBOL'}
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-white truncate">{activeStream.title}</div>
                <div className="text-[10px] text-emerald-300/80 truncate">{activeStream.subtitle}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 border border-cyan-400/35">
                <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as typeof quality)}
                  className="bg-transparent text-[11px] font-black text-cyan-200 focus:outline-none cursor-pointer"
                >
                  <option value="hd720" className="bg-[#0b0618]">720p HD</option>
                  <option value="hd1080" className="bg-[#0b0618]">1080p FHD</option>
                  <option value="large" className="bg-[#0b0618]">480p Leve</option>
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
                    className="w-16 accent-emerald-400 cursor-pointer"
                  />
                </div>
              )}

              <button
                onClick={() => void toggleExpand()}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-100 text-[11px] font-black flex items-center gap-1"
              >
                {expandedView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{expandedView ? 'Reduzir' : 'Tela Cheia'}</span>
              </button>

              {streamQueue.length > 1 && (
                <>
                  <button
                    onClick={() => stepStream(-1)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => stepStream(1)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1"
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

              <button
                onClick={() => setActiveStream(null)}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-rose-600 text-white text-xs font-black flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Fechar
              </button>
            </div>
          </div>

          <div className="relative w-full bg-black flex-1 min-h-[220px] sm:aspect-video flex items-center justify-center overflow-hidden">
            {activeStream.youtubeVideoId && (
              <iframe
                key={`${activeStream.id}-${quality}`}
                src={`https://www.youtube.com/embed/${activeStream.youtubeVideoId}?autoplay=1&rel=0&playsinline=1${
                  quality !== 'auto' ? `&vq=${quality}` : ''
                }&hl=pt-BR`}
                title={activeStream.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
          </div>

          {!expandedView && streamQueue.length > 1 && (
            <PlayerQueueStrip
              title="⚡ Outros Jogos & Lutas na Fila"
              accent="emerald"
              items={streamQueue.map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                imageUrl: item.posterUrl,
                badge: item.isLive ? 'AO VIVO' : item.sport === 'mma' ? 'UFC/MMA' : 'FUTEBOL',
                badgeTone: item.isLive ? 'live' : 'neutral',
                durationLabel: item.durationLabel,
                active: item.id === activeStream.id,
              }))}
              onSelect={(id) => {
                const picked = streamQueue.find((x) => x.id === id);
                if (picked) {
                  setActiveStream(picked);
                  setPrerollActive(false);
                }
              }}
            />
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div className="space-y-6 pb-28 md:pb-24">
      {/* Arena Header */}
      <div className="rounded-[28px] cosmic-card-3d p-5 sm:p-6 bg-gradient-to-br from-emerald-950/50 via-[#090518] to-rose-950/45 border border-emerald-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/25 border border-red-400/45 text-[10px] font-black uppercase tracking-widest text-red-200">
            <Radio className="w-3 h-3 text-red-400 animate-pulse" /> Transmissões & Placares em Tempo Real
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-300" />
            <span>Arena Ao Vivo · Futebol, UFC & MMA</span>
          </h1>
          <p className="text-xs text-slate-200/85">
            Placares reais do Brasileirão, Libertadores, Champions e UFC + lutas e jogos completos sem anúncios.
          </p>
        </div>

        <button
          onClick={() => void loadDirectory(true, true)}
          disabled={refreshing}
          className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-black text-emerald-300 flex items-center gap-2 self-start sm:self-auto transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{lastUpdated}</span>
        </button>
      </div>

      {/* Sport Filter Tabs + Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: '🔥 Tudo Ao Vivo' },
                { id: 'soccer', label: '⚽ Futebol Ao Vivo' },
                { id: 'mma', label: '🥊 UFC & MMA Ao Vivo' },
              ] as { id: SportFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSportFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-black border transition ${
                  sportFilter === tab.id
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black border-transparent shadow'
                    : 'bg-white/[0.06] hover:bg-white/15 border-white/10 text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(searchQ, sportFilter, false);
          }}
          className="relative flex items-center"
        >
          <Search className="w-4 h-4 text-emerald-300 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Buscar time, campeonato, lutador do UFC ou luta..."
            className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
          />
          {searchResults !== null && (
            <button
              type="button"
              onClick={() => {
                setSearchQ('');
                setSearchResults(null);
              }}
              className="absolute right-20 p-1 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={searching}
            className="absolute right-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-[11px] font-black"
          >
            {searching ? '...' : 'Buscar'}
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {QUICK_ARENA_CHIPS.map((c) => (
            <button
              key={c.label}
              onClick={() => void runSearch(c.query, c.sport, c.live)}
              className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-emerald-500/25 border border-white/10 text-[11px] font-bold text-slate-100 whitespace-nowrap transition"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <CosmicGtaLoader
          open={true}
          mode="stage"
          statusText="Conectando placares de Futebol, Octógono UFC & Transmissões Ao Vivo..."
        />
      )}

      {/* Search Results */}
      {searchResults !== null && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-black text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-400" /> Resultados da Arena ({searchResults.length})
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
          {searchResults.length === 0 ? (
            <div className="py-10 text-center rounded-2xl cosmic-card-3d text-xs text-slate-300">
              Nenhuma transmissão encontrada para esse termo. Tente outro time ou lutador.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {searchResults.map((item) => renderStreamCard(item, searchResults, true))}
            </div>
          )}
        </section>
      )}

      {/* Live Scoreboards (UFC & Soccer) */}
      {!loading && (sportFilter === 'all' || sportFilter === 'mma') && mmaScores.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span>🥊</span>
            <span>Card Oficial UFC & MMA</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mmaScores.map((ev) => (
              <div
                key={ev.id}
                onClick={() => void runSearch(ev.searchQuery, 'mma', ev.isLive)}
                className="p-4 rounded-2xl cosmic-card-3d border border-amber-400/25 cursor-pointer hover:border-amber-300/60 space-y-2.5 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {ev.league}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                      ev.isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-white/10 text-slate-200'
                    }`}
                  >
                    {ev.statusText}
                  </span>
                </div>
                <div className="text-sm font-black text-white">{ev.title}</div>
                {ev.bouts && ev.bouts.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/10">
                    {ev.bouts.slice(0, 3).map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-[11px] text-slate-200/90">
                        <span className="truncate font-semibold">{b.fighters}</span>
                        <span className="text-[10px] text-cyan-300 shrink-0 ml-2">
                          {b.winner ? `🏆 ${b.winner}` : b.weightClass}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[11px] font-black text-emerald-300 flex items-center gap-1 pt-0.5">
                  <Play className="w-3.5 h-3.5 fill-current" /> Toque para ver lutas & transmissão deste card
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && (sportFilter === 'all' || sportFilter === 'soccer') && soccerScores.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span>⚽</span>
            <span>Placares & Jogos do Dia</span>
          </h2>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {soccerScores.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => void runSearch(m.searchQuery, 'soccer', m.isLive)}
                className="w-64 shrink-0 text-left p-3.5 rounded-2xl cosmic-card-3d border border-emerald-400/20 hover:border-emerald-400/55 space-y-2 transition"
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                  <span className="text-emerald-300 truncate">
                    {m.badge} {m.league}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                      m.isLive ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {m.statusText}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-white">
                    <span className="flex items-center gap-1.5 truncate">
                      {m.homeLogo && <img src={m.homeLogo} alt={m.homeName} className="w-4 h-4 object-contain" />}
                      <span className="truncate">{m.homeName}</span>
                    </span>
                    <span className="font-mono text-sm text-cyan-300">{m.homeScore}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-black text-white">
                    <span className="flex items-center gap-1.5 truncate">
                      {m.awayLogo && <img src={m.awayLogo} alt={m.awayName} className="w-4 h-4 object-contain" />}
                      <span className="truncate">{m.awayName}</span>
                    </span>
                    <span className="font-mono text-sm text-cyan-300">{m.awayScore}</span>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-cyan-300/90 pt-0.5 flex items-center gap-1">
                  <Play className="w-3 h-3 fill-current" /> Assistir transmissão / melhores momentos
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Video & Live Stream Rows */}
      {!loading &&
        filteredCategories.map((cat) => {
          const isGrid = Boolean(gridByCat[cat.id]);
          if (!cat.items || cat.items.length === 0) return null;
          return (
            <section key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <h2 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span>{cat.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-emerald-300">
                    {cat.items.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setGridByCat((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                  className={`px-3 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1 transition ${
                    isGrid
                      ? 'bg-emerald-500 text-black border-emerald-300'
                      : 'bg-white/[0.07] hover:bg-white/15 border-white/10 text-cyan-200'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>{isGrid ? 'Carrossel' : 'Ver Tudo'}</span>
                </button>
              </div>

              {isGrid ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cat.items.map((item) => renderStreamCard(item, cat.items, true))}
                </div>
              ) : (
                <div
                  className="flex items-stretch gap-3 overflow-x-auto overscroll-x-contain snap-x snap-proximity pb-2.5 px-1"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {cat.items.map((item) => renderStreamCard(item, cat.items, false))}
                </div>
              )}
            </section>
          );
        })}

      {arenaModal}
    </div>
  );
};

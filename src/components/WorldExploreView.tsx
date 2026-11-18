import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  ListPlus,
  Loader2,
  Flame,
  ExternalLink,
  Music2,
  Sparkles,
  ListMusic,
  UserCheck,
  Film,
  Video,
  RefreshCw,
  ArrowLeft,
  Tv,
  Disc3,
} from 'lucide-react';
import {
  Track,
  UserPlaylist,
  WorldArtistDirectoryItem,
  WorldArtistProfile,
  WorldCuratedPlaylist,
} from '../types';
import {
  FALLBACK_CURATED_PLAYLISTS,
  getWorldDirectory,
  getWorldNewReleases,
  getWorldTrending,
  searchWorldMusic,
} from '../utils/worldMusic';
import { getSmartDiscoveryQueries, recordPlayTaste, recordSearchTaste } from '../utils/tasteProfile';
import { CosmicScrollRow } from './CosmicScrollRow';
import { CosmicGtaLoader } from './CosmicGtaLoader';

interface Props {
  initialQuery?: string;
  searchNonce?: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: UserPlaylist[];
  onPlayTrack: (track: Track, queue: Track[], queueLabel?: string) => void;
  onWatchClip?: (track: Track, queue: Track[]) => void;
  onSendToVideo: (track: Track) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onOpenTvCast?: (media: {
    title: string;
    artist?: string;
    mode?: 'galaxy' | 'video' | 'shorts' | 'tv';
    youtubeVideoId?: string;
    audioUrl?: string;
    coverUrl?: string;
  }) => void;
}

const GENRE_CHIPS = [
  { label: '🔥 Em Alta', q: '', space: false },
  { label: '🚀 Lançamentos IA', q: `lancamentos musicas novas brasil global ${new Date().getFullYear()}`, space: false },
  { label: '🌎 Internacionais', q: 'The Weeknd Taylor Swift Bruno Mars Dua Lipa Billie Eilish official', space: false },
  { label: '🎬 Clipes HD', q: 'Henrique e Juliano The Weeknd Queen Michael Jackson clipe oficial', space: false },
  { label: '🤠 Sertanejo', q: 'Henrique e Juliano Marilia Mendonca Gusttavo Lima Ana Castela', space: false },
  { label: '⚡ Phonk', q: 'brazilian phonk Kordhell DVRST', space: false },
  { label: '🛸 Espaço & E.T.', q: 'espaco galaxia NASA voyager cosmic synthwave', space: true },
];

const ARTIST_REGION_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'br', label: '🇧🇷 Brasil' },
  { id: 'global', label: '🌍 Globais' },
  { id: 'sertanejo', label: '🤠 Sertanejo' },
  { id: 'urban', label: '🎤 Rap/Trap/Phonk' },
];

function fmtDur(sec?: number): string {
  if (!sec || sec <= 0) return '3:30';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const WorldExploreView: React.FC<Props> = ({
  initialQuery = '',
  searchNonce = 0,
  currentTrack,
  isPlaying,
  playlists,
  onPlayTrack,
  onWatchClip,
  onSendToVideo,
  onAddToPlaylist,
  onOpenTvCast,
}) => {
  const [results, setResults] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [artistProfile, setArtistProfile] = useState<WorldArtistProfile | null>(null);
  const [famousArtists, setFamousArtists] = useState<WorldArtistDirectoryItem[]>([]);
  const [curatedPlaylists, setCuratedPlaylists] = useState<WorldCuratedPlaylist[]>(FALLBACK_CURATED_PLAYLISTS);
  const [smartPicks, setSmartPicks] = useState<{ label: string; query: string }[]>(() => getSmartDiscoveryQueries());
  const [artistRegion, setArtistRegion] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [refreshingReleases, setRefreshingReleases] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('IA Ativa');
  const [activeLabel, setActiveLabel] = useState('🔥 Em Alta');
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);

  const runSearch = async (term: string, label?: string, includeArchiveSpace = false) => {
    setLoading(true);
    setActiveLabel(label || (term ? `Busca: "${term}"` : '🔥 Em Alta'));
    if (term.trim()) {
      recordSearchTaste(term);
      setSmartPicks(getSmartDiscoveryQueries());
    }
    try {
      const payload = term.trim()
        ? await searchWorldMusic(term, { includeArchiveSpace })
        : await getWorldTrending();
      setResults(payload.tracks || []);
      setArtistProfile(payload.artistProfile || null);
      if (payload.playlists?.length) setCuratedPlaylists(payload.playlists);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshNewReleasesAI = async (force = false) => {
    setRefreshingReleases(true);
    try {
      const rel = await getWorldNewReleases(force);
      if (rel.tracks?.length) setNewReleases(rel.tracks);
      setLastUpdatedLabel(
        `IA · ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      );
    } finally {
      setRefreshingReleases(false);
    }
  };

  useEffect(() => {
    getWorldDirectory(false)
      .then((dir) => {
        if (dir.artists?.length) setFamousArtists(dir.artists);
        if (dir.playlists?.length) setCuratedPlaylists(dir.playlists);
        if (dir.newReleases?.length) setNewReleases(dir.newReleases);
        setLastUpdatedLabel(
          `IA · ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        );
      })
      .catch(() => {});

    // Auto-refresh new music releases by AI every 25 minutes automatically!
    const autoTimer = window.setInterval(() => {
      void refreshNewReleasesAI(true);
    }, 25 * 60 * 1000);
    return () => window.clearInterval(autoTimer);
  }, []);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      void runSearch(initialQuery);
    } else {
      void runSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, searchNonce]);

  const filteredArtists = useMemo(() => {
    if (artistRegion === 'all') return famousArtists;
    return famousArtists.filter((a) => {
      const low = `${a.genre} ${a.era}`.toLowerCase();
      if (artistRegion === 'br') return low.includes('brasil') || low.includes('sertanejo') || low.includes('nacional');
      if (artistRegion === 'global') return low.includes('global') || low.includes('lenda') || low.includes('anos');
      if (artistRegion === 'sertanejo') return low.includes('sertanejo') || low.includes('agronejo');
      if (artistRegion === 'urban') return low.includes('phonk') || low.includes('rap') || low.includes('trap') || low.includes('funk') || low.includes('hip-hop');
      return true;
    });
  }, [famousArtists, artistRegion]);

  const clipTracks = useMemo(
    () => results.filter((t) => Boolean(t.youtubeVideoId)).slice(0, 20),
    [results]
  );

  const handlePlayRow = (track: Track, customQueue?: Track[]) => {
    recordPlayTaste(track.artist, track.genre, track.title);
    setSmartPicks(getSmartDiscoveryQueries());
    onPlayTrack(track, customQueue || results, activeLabel);
  };

  return (
    <div className="space-y-5 pb-36 md:pb-28">
      <CosmicGtaLoader
        open={refreshingReleases}
        mode="discreet_corner"
        statusText="IA buscando músicas novas..."
        onSkip={() => setRefreshingReleases(false)}
      />

      {/* SPOTIFY / YOUTUBE MUSIC GENRE CHIPS + AUTO-REFRESH AI */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {GENRE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => void runSearch(chip.q, chip.label, chip.space)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                activeLabel === chip.label
                  ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 text-black shadow font-black'
                  : 'bg-white/[0.07] hover:bg-white/15 text-purple-100 border border-white/10'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void refreshNewReleasesAI(true)}
            disabled={refreshingReleases}
            className="px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/15 border border-white/15 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 transition"
            title="Atualizar lançamentos musicais automaticamente com IA agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingReleases ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lastUpdatedLabel}</span>
          </button>

          {results.length > 0 && (
            <button
              onClick={() => handlePlayRow(results[0])}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black flex items-center gap-1.5 shadow hover:brightness-110 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Tocar Sequência
            </button>
          )}
        </div>
      </div>

      {/* AI Continuous Discovery Chips */}
      {smartPicks.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1 shrink-0 pr-1">
            <Sparkles className="w-3 h-3 text-pink-400" /> IA Para Você:
          </span>
          {smartPicks.map((p) => (
            <button
              key={p.query}
              onClick={() => void runSearch(p.query, `✨ ${p.label}`)}
              className="px-3 py-1 rounded-full bg-purple-500/20 hover:bg-pink-500/30 border border-purple-400/30 text-[11px] font-bold text-purple-100 whitespace-nowrap transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* SPOTIFY / YOUTUBE MUSIC OFFICIAL ARTIST HERO BANNER (when an artist is selected!) */}
      {artistProfile && (
        <section className="relative rounded-[28px] overflow-hidden border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
          <img
            src={artistProfile.photoUrl || '/covers/album-official.jpg'}
            alt={artistProfile.name}
            className="absolute inset-0 w-full h-full object-cover opacity-35 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05020f] via-[#070316]/75 to-transparent" />

          <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full p-[3px] bg-gradient-to-br from-emerald-400 via-cyan-400 to-pink-500 shrink-0 shadow-[0_0_35px_rgba(34,211,238,0.45)]">
              <img
                src={artistProfile.photoUrl || '/covers/album-official.jpg'}
                alt={artistProfile.name}
                className="w-full h-full object-cover rounded-full bg-black"
              />
              <span className="absolute bottom-0 right-0 px-2.5 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-black flex items-center gap-0.5 shadow-lg">
                <UserCheck className="w-3 h-3" /> VERIFICADO
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {artistProfile.genre && (
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500/25 border border-pink-400/40 text-pink-200 text-[10px] font-extrabold">
                    {artistProfile.genre}
                  </span>
                )}
                {artistProfile.era && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-[10px] font-extrabold">
                    {artistProfile.era}
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight truncate">
                {artistProfile.name}
              </h1>
              {artistProfile.bio && (
                <p className="text-xs text-purple-100/85 line-clamp-2 max-w-2xl leading-relaxed">
                  {artistProfile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {results.length > 0 && (
                  <button
                    onClick={() => handlePlayRow(results[0])}
                    className="px-5 py-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center gap-1.5 shadow-lg transition active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" /> Tocar Mix do Artista
                  </button>
                )}
                {clipTracks[0] && onWatchClip && (
                  <button
                    onClick={() => onWatchClip(clipTracks[0], clipTracks)}
                    className="px-4 py-2 rounded-full bg-rose-600/85 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 transition"
                  >
                    <Film className="w-3.5 h-3.5" /> Assistir Clipes
                  </button>
                )}
                <button
                  onClick={() => void runSearch('', '🔥 Em Alta')}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Todos os Artistas
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === SECTION 1: ARTISTAS EM ALTA — SPOTIFY / YOUTUBE MUSIC STYLE WITH TRANSLUCENT ◀▶ ARROWS === */}
      {famousArtists.length > 0 && (
        <CosmicScrollRow
          title={
            <>
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Artistas em Alta — Estilo Spotify & YouTube Music</span>
            </>
          }
          subtitle="Clique em um artista para abrir o perfil oficial, músicas completas e novos lançamentos"
          count={filteredArtists.length}
          collapsible
          rightActions={
            <div className="hidden md:flex items-center gap-1">
              {ARTIST_REGION_FILTERS.map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setArtistRegion(rf.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                    artistRegion === rf.id
                      ? 'bg-emerald-400 text-black font-black'
                      : 'bg-white/[0.06] hover:bg-white/15 text-purple-200'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          }
        >
          {filteredArtists.map((art) => (
            <button
              key={art.name}
              onClick={() => void runSearch(art.name, `🎤 ${art.name}`)}
              className="group w-32 sm:w-36 shrink-0 rounded-2xl cosmic-card-3d p-3 flex flex-col items-center text-center gap-2 hover:bg-white/[0.09] transition"
            >
              <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-emerald-400 via-cyan-400 to-pink-500 group-hover:scale-105 transition shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                <img
                  src={art.photoUrl || '/covers/album-official.jpg'}
                  alt={art.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover rounded-full bg-black"
                />
                <span className="opacity-0 group-hover:opacity-100 absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-lg transition">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </span>
              </div>
              <div className="min-w-0 w-full">
                <div className="text-xs font-black text-white truncate group-hover:text-emerald-300 transition">
                  {art.name}
                </div>
                <div className="text-[10px] text-cyan-300/85 truncate">{art.genre}</div>
              </div>
            </button>
          ))}
        </CosmicScrollRow>
      )}

      {/* === SECTION 2: NOVOS LANÇAMENTOS AUTO-ATUALIZÁVEIS POR IA (◀▶ ARROWS) === */}
      {newReleases.length > 0 && (
        <CosmicScrollRow
          title={
            <>
              <Disc3 className="w-4 h-4 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Lançamentos Novos {new Date().getFullYear()} · Atualizado por IA</span>
            </>
          }
          subtitle="Músicas novas assim que os artistas lançam, atualizadas automaticamente em tempo real"
          count={newReleases.length}
          collapsible
        >
          {newReleases.map((t) => {
            const active = currentTrack?.id === t.id;
            return (
              <div
                key={t.id}
                className={`group w-40 sm:w-44 shrink-0 rounded-2xl cosmic-card-3d p-2.5 flex flex-col gap-2 transition ${
                  active ? 'border-emerald-400 bg-emerald-500/15' : 'hover:bg-white/[0.08]'
                }`}
              >
                <div
                  onClick={() => handlePlayRow(t, newReleases)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-black cursor-pointer"
                >
                  <img
                    src={t.coverUrl || '/covers/album-official.jpg'}
                    alt={t.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-400 text-black text-[9px] font-black shadow">
                    NOVO
                  </span>
                  <span className="opacity-90 group-hover:scale-110 absolute bottom-2 right-2 w-9 h-9 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-lg transition">
                    {active && isPlaying ? (
                      <Pause className="w-4 h-4 fill-black" />
                    ) : (
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    )}
                  </span>
                </div>
                <div className="min-w-0">
                  <div
                    onClick={() => handlePlayRow(t, newReleases)}
                    className="text-xs font-black text-white truncate cursor-pointer hover:text-emerald-300"
                  >
                    {t.title}
                  </div>
                  <div className="text-[10px] text-purple-200/75 truncate">{t.artist}</div>
                </div>
              </div>
            );
          })}
        </CosmicScrollRow>
      )}

      {/* === SECTION 3: PLAYLISTS POR ESTILO & GERAÇÃO (◀▶ ARROWS) === */}
      <CosmicScrollRow
        title={
          <>
            <ListMusic className="w-4 h-4 text-cyan-400" />
            <span>Playlists & Mixes por Estilo</span>
          </>
        }
        count={curatedPlaylists.length}
        collapsible
      >
        {curatedPlaylists.map((pl) => (
          <button
            key={pl.id}
            onClick={() =>
              void runSearch(pl.searchQuery, `${pl.emoji} ${pl.title}`, Boolean(pl.includeArchiveSpace))
            }
            className={`w-64 shrink-0 text-left rounded-2xl p-3.5 bg-gradient-to-br ${pl.gradient} cosmic-card-3d flex items-start gap-3 hover:scale-[1.02] transition`}
          >
            <div className="w-11 h-11 rounded-xl bg-black/45 border border-white/15 flex items-center justify-center text-xl shrink-0">
              {pl.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-200">{pl.era}</div>
              <div className="text-xs font-black text-white truncate">{pl.title}</div>
              <div className="text-[10px] text-purple-100/80 line-clamp-2 mt-0.5">{pl.subtitle}</div>
            </div>
          </button>
        ))}
      </CosmicScrollRow>

      {/* === SECTION 4: CLIPES OFICIAIS HD EM CARROSSEL (◀▶ ARROWS) === */}
      {clipTracks.length > 0 && onWatchClip && (
        <CosmicScrollRow
          title={
            <>
              <Film className="w-4 h-4 text-rose-400" />
              <span>Clipes Oficiais HD — {activeLabel}</span>
            </>
          }
          count={clipTracks.length}
          collapsible
        >
          {clipTracks.map((t) => (
            <div
              key={`clip-${t.id}`}
              onClick={() => onWatchClip(t, clipTracks)}
              className="group w-56 sm:w-64 shrink-0 rounded-2xl cosmic-card-3d overflow-hidden cursor-pointer hover:border-rose-400/50 transition"
            >
              <div className="relative aspect-video bg-black">
                <img
                  src={t.coverUrl || '/covers/album-official.jpg'}
                  alt={t.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600 text-[9px] font-black text-white">
                  CLIPE HD
                </span>
                <span className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/70 border border-white/30 text-white flex items-center justify-center group-hover:bg-rose-600 transition">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </span>
              </div>
              <div className="p-2.5">
                <div className="text-xs font-black text-white truncate">{t.title}</div>
                <div className="text-[10px] text-purple-200/75 truncate">{t.artist}</div>
              </div>
            </div>
          ))}
        </CosmicScrollRow>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-purple-200/80 px-1 pt-1">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Flame className="w-4 h-4 text-pink-400" />
          <span>{activeLabel}</span>
          {!loading && <span className="text-purple-300/70 font-normal">({results.length} faixas)</span>}
        </div>
      </div>

      {/* Track List (Spotify / YT Music Clean Rows) */}
      {loading ? (
        <div className="py-14 flex flex-col items-center justify-center gap-2 text-purple-300">
          <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
          <span className="text-xs font-semibold">IA buscando músicas, artistas e clipes completos...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-12 text-center rounded-2xl cosmic-card-3d text-purple-300 text-xs space-y-2">
          <Music2 className="w-8 h-8 mx-auto opacity-60" />
          <div>Nenhuma faixa encontrada agora. Toque em um artista famoso acima!</div>
        </div>
      ) : (
        <div className="rounded-3xl cosmic-card-3d divide-y divide-white/[0.06] overflow-visible">
          {results.map((t, idx) => {
            const active = currentTrack?.id === t.id;
            return (
              <div
                key={t.id}
                className={`group flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.06] transition ${
                  active ? 'bg-emerald-500/15' : ''
                }`}
              >
                <button
                  onClick={() => handlePlayRow(t)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
                >
                  {active && isPlaying ? (
                    <Pause className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <>
                      <span className="text-xs text-purple-300/70 group-hover:hidden">{idx + 1}</span>
                      <Play className="w-4 h-4 text-white hidden group-hover:block fill-current" />
                    </>
                  )}
                </button>

                <img
                  src={t.coverUrl || '/covers/album-official.jpg'}
                  alt={t.title}
                  loading="lazy"
                  decoding="async"
                  onClick={() => handlePlayRow(t)}
                  className="w-11 h-11 rounded-xl object-cover shrink-0 cursor-pointer border border-white/10"
                />

                <div onClick={() => handlePlayRow(t)} className="min-w-0 flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-bold truncate ${active ? 'text-emerald-400' : 'text-white'}`}>
                      {t.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold shrink-0">
                      {t.sourceLabel || 'Completa'}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-200/70 truncate">
                    {t.artist} {t.genre ? `· ${t.genre}` : ''}
                  </div>
                </div>

                <div className="hidden sm:block text-xs text-purple-300/75 font-mono w-14 text-right">
                  {fmtDur(t.durationSec)}
                </div>

                <div className="flex items-center gap-1 relative">
                  {t.youtubeVideoId && onWatchClip && (
                    <button
                      onClick={() => onWatchClip(t, results)}
                      className="px-2 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-rose-200 text-[10px] font-extrabold flex items-center gap-1"
                      title="Assistir Clipe Oficial"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clipe</span>
                    </button>
                  )}

                  {onOpenTvCast && (
                    <button
                      onClick={() =>
                        onOpenTvCast({
                          title: t.title,
                          artist: t.artist,
                          mode: t.youtubeVideoId ? 'video' : 'galaxy',
                          youtubeVideoId: t.youtubeVideoId,
                          audioUrl: t.audioUrl,
                          coverUrl: t.coverUrl,
                        })
                      }
                      className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/35 border border-cyan-400/35 text-cyan-200"
                      title="Passar música/clipe para Smart TV"
                    >
                      <Tv className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onSendToVideo(t)}
                    className="px-2 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/35 text-pink-200 text-[10px] font-bold flex items-center gap-1"
                    title="Criar Vídeo para TikTok/Reels/YouTube"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Vídeo</span>
                  </button>

                  <button
                    onClick={() => setPickerTrackId(pickerTrackId === t.id ? null : t.id)}
                    className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-purple-100"
                    title="Salvar na Playlist"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>

                  {t.externalUrl && (
                    <a
                      href={t.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-purple-300"
                      title="Abrir fonte oficial"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {pickerTrackId === t.id && (
                    <div className="absolute right-0 top-9 z-30 w-52 rounded-xl bg-[#13092b] border border-purple-400/40 shadow-2xl p-1.5 space-y-1">
                      <div className="text-[10px] font-bold text-purple-300 px-2 py-1">Adicionar à playlist:</div>
                      {playlists.length === 0 ? (
                        <div className="text-[11px] text-purple-200/70 px-2 py-1">
                          Crie uma playlist na aba Minhas Playlists.
                        </div>
                      ) : (
                        playlists.map((pl) => (
                          <button
                            key={pl.id}
                            onClick={() => {
                              onAddToPlaylist(pl.id, t);
                              setPickerTrackId(null);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-xs text-white flex items-center gap-2 truncate"
                          >
                            <span>{pl.emoji}</span>
                            <span className="truncate">{pl.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

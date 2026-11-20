import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  ListPlus,
  Loader2,
  Flame,
  Music2,
  Sparkles,
  ListMusic,
  UserCheck,
  Film,
  ArrowLeft,
  Disc3,
  BadgeCheck,
  Crown,
  Bot,
  Bell,
  BellRing,
  Download,
} from 'lucide-react';
import { triggerDirectFileDownload } from '../utils/offlineCache';
import {
  fetchChannelSubscriptions,
  getClientSubscriberId,
  normalizeChannelKey,
  toggleChannelSubscribe,
} from '../utils/communityApi';
import {
  Track,
  UserPlaylist,
  WorldArtistDirectoryItem,
  WorldArtistProfile,
  WorldCuratedPlaylist,
} from '../types';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';
import {
  FALLBACK_CURATED_PLAYLISTS,
  getWorldDirectory,
  getWorldNewReleases,
  getWorldTrending,
  searchWorldMusic,
} from '../utils/worldMusic';
import {
  fetchSunoAiHub,
  fetchTop5Rankings,
  RankedArtistEntry,
  RankedVideoEntry,
  SunoAiArtist,
} from '../utils/rankingsApi';
import { getSmartDiscoveryQueries, recordPlayTaste, recordSearchTaste } from '../utils/tasteProfile';
import { recordSmartInteraction } from '../utils/smartEngine';
import { CosmicScrollRow } from './CosmicScrollRow';

interface Props {
  initialQuery?: string;
  searchNonce?: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: UserPlaylist[];
  onPlayTrack: (track: Track, queue: Track[], queueLabel?: string) => void;
  onWatchClip?: (track: Track, queue: Track[]) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
}

const GENRE_CHIPS = [
  { label: '🔥 Em Alta', q: '', space: false },
  { label: '🚀 Lançamentos', q: `lancamentos musicas novas brasil global ${new Date().getFullYear()}`, space: false },
  { label: '🌎 Internacionais', q: 'The Weeknd Taylor Swift Bruno Mars Dua Lipa Billie Eilish official', space: false },
  { label: '🎬 Clipes HD', q: 'Henrique e Juliano The Weeknd Queen Michael Jackson clipe oficial', space: false },
  { label: '🤠 Sertanejo', q: 'Henrique e Juliano Marilia Mendonca Gusttavo Lima Ana Castela', space: false },
  { label: '⚡ Phonk', q: 'brazilian phonk Kordhell DVRST', space: false },
  { label: '🛸 Espaço & Synth', q: 'espaco galaxia NASA voyager cosmic synthwave', space: true },
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

const ArtistPortrait: React.FC<{
  name: string;
  photoUrl?: string;
  className?: string;
}> = ({ name, photoUrl, className = 'w-full h-full object-cover object-top' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  const isLenkyx = name.trim().toLowerCase() === 'lenkyx';
  const resolvedUrl = isLenkyx
    ? '/covers/icon-edge-3d.png'
    : photoUrl && !photoUrl.includes('album-official.jpg')
    ? photoUrl
    : '';

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  if (!resolvedUrl || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#120b29] via-[#1c1338] to-[#0a1628] flex items-center justify-center font-display text-2xl font-black tracking-wider text-cyan-200 select-none">
        {initials || '★'}
      </div>
    );
  }

  if (isLenkyx) {
    return (
      <div className="w-full h-full bg-white relative flex items-center justify-center p-4 overflow-hidden">
        <div className="edge-3d-aurora opacity-60" aria-hidden="true" />
        <img
          src="/covers/icon-edge-3d.png"
          alt={name}
          loading="lazy"
          decoding="async"
          className="relative z-10 w-full h-full object-contain edge-3d-img-hue"
        />
        <span className="edge-3d-sheen z-20" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const WorldExploreView: React.FC<Props> = ({
  initialQuery = '',
  searchNonce = 0,
  currentTrack,
  isPlaying,
  playlists,
  onPlayTrack,
  onWatchClip,
  onAddToPlaylist,
}) => {
  const [results, setResults] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [artistProfile, setArtistProfile] = useState<WorldArtistProfile | null>(null);
  const [famousArtists, setFamousArtists] = useState<WorldArtistDirectoryItem[]>([]);
  const [curatedPlaylists, setCuratedPlaylists] = useState<WorldCuratedPlaylist[]>(FALLBACK_CURATED_PLAYLISTS);
  const [smartPicks, setSmartPicks] = useState<{ label: string; query: string }[]>(() => getSmartDiscoveryQueries());
  const [artistRegion, setArtistRegion] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [activeLabel, setActiveLabel] = useState('🔥 Em Alta');
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);
  const [topArtists, setTopArtists] = useState<RankedArtistEntry[]>([]);
  const [topVideos, setTopVideos] = useState<RankedVideoEntry[]>([]);
  const [sunoArtists, setSunoArtists] = useState<SunoAiArtist[]>([]);
  const [sunoTracks, setSunoTracks] = useState<Track[]>([]);
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  const [downloadingRowId, setDownloadingRowId] = useState<string | null>(null);
  const [downloadRowPct, setDownloadRowPct] = useState<number>(0);
  const resultsListRef = React.useRef<HTMLDivElement | null>(null);

  const handleDownloadWorldRow = async (t: Track) => {
    if (downloadingRowId) return;
    setDownloadingRowId(t.id);
    setDownloadRowPct(10);
    try {
      await triggerDirectFileDownload({
        title: t.title,
        artist: t.artist,
        directUrl: t.audioUrl || t.audioUrlV2 || undefined,
        kind: 'audio',
        onProgress: (pct) => setDownloadRowPct(pct),
      });
      setDownloadRowPct(100);
    } catch {
      // fallback silently
    } finally {
      window.setTimeout(() => {
        setDownloadingRowId(null);
        setDownloadRowPct(0);
      }, 1200);
    }
  };
  const subscriberId = useMemo(() => getClientSubscriberId(), []);

  useEffect(() => {
    void fetchChannelSubscriptions(subscriberId).then((res) => {
      setChannelCounts(res.counts || {});
      setSubscribedChannels(new Set(res.subscribed || []));
    });
  }, [subscriberId]);

  const handleToggleArtistSubscribe = async (artistName: string) => {
    const key = normalizeChannelKey(artistName);
    const res = await toggleChannelSubscribe({
      channelId: key,
      channelName: artistName,
      subscriberId,
    });
    if (res) {
      setChannelCounts((prev) => ({ ...prev, [res.channelId]: res.count }));
      setSubscribedChannels((prev) => {
        const next = new Set(prev);
        if (res.subscribed) next.add(res.channelId);
        else next.delete(res.channelId);
        return next;
      });
    }
  };

  const runSearch = async (
    term: string,
    label?: string,
    includeArchiveSpace = false,
    autoPlayFirst = false
  ) => {
    setLoading(true);
    setActiveLabel(label || (term ? `Artista: ${term}` : '🔥 Em Alta'));
    if (term.trim()) {
      recordSearchTaste(term);
      setSmartPicks(getSmartDiscoveryQueries());
    }
    try {
      const payload = term.trim()
        ? await searchWorldMusic(term, { includeArchiveSpace })
        : await getWorldTrending();
      const loadedTracks = payload.tracks || [];
      setResults(loadedTracks);
      setArtistProfile(payload.artistProfile || null);
      if (payload.playlists?.length) setCuratedPlaylists(payload.playlists);

      if (autoPlayFirst && loadedTracks.length > 0) {
        recordPlayTaste(loadedTracks[0].artist, loadedTracks[0].genre, loadedTracks[0].title);
        recordSmartInteraction({
          kind: 'play',
          artist: loadedTracks[0].artist,
          genre: loadedTracks[0].genre,
          title: loadedTracks[0].title,
        });
        onPlayTrack(loadedTracks[0], loadedTracks, label || term);
        window.setTimeout(() => {
          resultsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshNewReleasesAI = async (force = false) => {
    try {
      const rel = await getWorldNewReleases(force);
      if (rel.tracks?.length) setNewReleases(rel.tracks);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    getWorldDirectory(false)
      .then((dir) => {
        if (dir.artists?.length) setFamousArtists(dir.artists);
        if (dir.playlists?.length) setCuratedPlaylists(dir.playlists);
        if (dir.newReleases?.length) setNewReleases(dir.newReleases);
      })
      .catch(() => {});

    fetchTop5Rankings()
      .then((rk) => {
        if (rk.topArtists?.length) setTopArtists(rk.topArtists);
        if (rk.topVideos?.length) setTopVideos(rk.topVideos);
      })
      .catch(() => {});

    fetchSunoAiHub(false)
      .then((hub) => {
        if (hub.artists?.length) setSunoArtists(hub.artists);
        if (hub.tracks?.length) setSunoTracks(hub.tracks);
      })
      .catch(() => {});

    const autoTimer = window.setInterval(() => {
      void refreshNewReleasesAI(true);
    }, 25 * 60 * 1000);
    return () => window.clearInterval(autoTimer);
  }, []);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      void runSearch(initialQuery, `🎤 ${initialQuery}`, false, searchNonce > 0);
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
    recordSmartInteraction({
      kind: 'play',
      artist: track.artist,
      genre: track.genre,
      title: track.title,
    });
    setSmartPicks(getSmartDiscoveryQueries());
    onPlayTrack(track, customQueue || results, activeLabel);
  };

  return (
    <div className="space-y-6 pb-32 md:pb-24">
      {/* === EXPLORAR: MÚSICAS & VÍDEOS CLIPES DOS ARTISTAS === */}
      <section className="rounded-3xl cosmic-card-3d px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LenkyxEdgeLogo size="md" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-sm sm:text-base font-black text-white truncate flex items-center gap-2">
              <span>Explorar · Músicas & Vídeos Clipes dos Artistas</span>
            </h1>
            <p className="text-[11px] text-cyan-200/85 truncate">
              🇧🇷 Artistas do Brasil e do mundo · Clipes Oficiais HD, Lançamentos e Faixas Completas
            </p>
          </div>
        </div>
        {clipTracks[0] && onWatchClip && (
          <button
            type="button"
            onClick={() => onWatchClip(clipTracks[0], clipTracks)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-black text-xs font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition shrink-0"
          >
            <Film className="w-3.5 h-3.5" /> Assistir Clipes HD ({clipTracks.length})
          </button>
        )}
      </section>

      {/* === MODERN GENRE CHIPS + QUICK MIX CONTROLS === */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
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
          {results.length > 0 && (
            <button
              onClick={() => handlePlayRow(results[0])}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black flex items-center gap-1.5 shadow hover:brightness-110 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Play Automático
            </button>
          )}
        </div>
      </div>

      {/* Personalized Discovery Chips (Hidden when viewing a single Artist) */}
      {!artistProfile && smartPicks.filter((p) => !p.query.toLowerCase().includes('lenkyx') && !p.label.toLowerCase().includes('lenkyx')).length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1 shrink-0 pr-1">
            <Sparkles className="w-3 h-3 text-pink-400" /> Para Você:
          </span>
          {smartPicks
            .filter((p) => !p.query.toLowerCase().includes('lenkyx') && !p.label.toLowerCase().includes('lenkyx'))
            .map((p) => (
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

      {/* === MODERN GLASSMORPHIC ARTIST SPOTLIGHT HERO (when selected) === */}
      {artistProfile && (
        <section className="relative rounded-[30px] overflow-hidden border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)]">
          {artistProfile.photoUrl && (
            <img
              src={artistProfile.photoUrl}
              alt={artistProfile.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-md scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#04010c] via-[#070316]/75 to-transparent" />

          <div className="relative z-10 p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl p-[2px] bg-gradient-to-br from-emerald-400 via-cyan-400 to-pink-500 shrink-0 shadow-[0_0_40px_rgba(34,211,238,0.45)] overflow-hidden">
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-black">
                <ArtistPortrait name={artistProfile.name} photoUrl={artistProfile.photoUrl} />
              </div>
              <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-black flex items-center gap-0.5 shadow-lg">
                <BadgeCheck className="w-3 h-3" /> OFICIAL
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
                    className="px-5 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center gap-1.5 shadow-lg transition active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" /> Play Automático ({results.length} músicas)
                  </button>
                )}
                {clipTracks[0] && onWatchClip && (
                  <button
                    onClick={() => onWatchClip(clipTracks[0], clipTracks)}
                    className="px-4 py-2.5 rounded-full bg-rose-600/85 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 transition"
                  >
                    <Film className="w-3.5 h-3.5" /> Assistir Clipes
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleToggleArtistSubscribe(artistProfile.name)}
                  className={`px-4 py-2.5 rounded-full text-xs font-black flex items-center gap-1.5 transition ${
                    subscribedChannels.has(normalizeChannelKey(artistProfile.name))
                      ? 'bg-white/20 border border-white/25 text-white'
                      : 'bg-gradient-to-r from-red-600 to-pink-500 text-white shadow hover:brightness-110'
                  }`}
                >
                  {subscribedChannels.has(normalizeChannelKey(artistProfile.name)) ? (
                    <>
                      <BellRing className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Inscrito</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Inscrever-se</span>
                    </>
                  )}
                  {(channelCounts[normalizeChannelKey(artistProfile.name)] || 0) > 0 && (
                    <span className="opacity-85">
                      · {channelCounts[normalizeChannelKey(artistProfile.name)]}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => void runSearch('', '🔥 Em Alta')}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Todos os Artistas
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === TOP 1 AO 5 ARTISTAS MAIS ESCUTADOS (Hidden when viewing a single Artist — Zero Interference!) === */}
      {!artistProfile && topArtists.length > 0 && (
        <section className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-[#0d0720] to-cyan-500/10 border border-amber-400/25 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Top 1 ao 5 · Artistas Mais Escutados & Recomendados</span>
              </h2>
              <p className="text-[11px] text-amber-100/75">
                Classificação ao vivo dos artistas mais ouvidos pelos fãs no LENKYX
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-black">
              🔥 RECOMENDADOS DO SITE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {topArtists
              .filter((art) => !art.name.trim().toLowerCase().includes('lenkyx'))
              .slice(0, 5)
              .map((art, i) => {
              const displayRank = i + 1;
              const dirMatch = famousArtists.find(
                (f) => f.name.toLowerCase() === art.name.trim().toLowerCase()
              );
              const bestPhoto =
                (art.photoUrl && !art.photoUrl.includes('album-official.jpg') ? art.photoUrl : '') ||
                dirMatch?.photoUrl ||
                '';
              const medal =
                displayRank === 1
                  ? 'from-amber-300 via-amber-400 to-yellow-500 text-black shadow-[0_0_16px_rgba(251,191,36,0.7)]'
                  : displayRank === 2
                  ? 'from-slate-100 to-slate-400 text-black'
                  : displayRank === 3
                  ? 'from-amber-500 to-orange-500 text-white'
                  : 'from-cyan-400 to-purple-500 text-white';
              return (
                <button
                  key={art.name}
                  onClick={() => void runSearch(art.name, `🏆 #${displayRank} ${art.name}`, false, true)}
                  className={`group relative rounded-3xl overflow-hidden bg-[#0a0619] text-left transition duration-300 hover:-translate-y-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.65)] ${
                    displayRank === 1
                      ? 'border-2 border-amber-400/80 shadow-[0_0_34px_rgba(251,191,36,0.28)]'
                      : 'border border-white/15 hover:border-amber-400/60'
                  }`}
                >
                  <div className="relative aspect-[4/4.7] w-full overflow-hidden bg-black">
                    <ArtistPortrait
                      name={art.name}
                      photoUrl={bestPhoto}
                      className="w-full h-full object-cover object-top group-hover:scale-108 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05020f] via-[#05020f]/35 to-black/20" />
                    <span
                      className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r ${medal} text-[10px] font-black`}
                    >
                      TOP #{displayRank}
                    </span>
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-emerald-400/35 text-[10px] font-mono text-emerald-300 font-bold">
                      {art.count} plays
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 absolute bottom-14 right-3 w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.75)] transition">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-3 space-y-0.5">
                      <div className="text-sm sm:text-base font-black text-white truncate flex items-center gap-1 group-hover:text-amber-300 transition">
                        <span className="truncate">{art.name}</span>
                        <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      </div>
                      <div className="text-[11px] font-semibold text-amber-100/80 truncate">
                        {art.genre || dirMatch?.genre || 'Destaque'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {(topVideos.length > 0 || clipTracks.length > 0) && (
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="text-xs font-black text-cyan-200 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-pink-400" />
                <span>Top 1 ao 5 · Melhores Clipes & Vídeos Recomendados</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {(topVideos.length > 0
                  ? topVideos.slice(0, 5).map((v) => ({
                      id: v.id,
                      title: v.title,
                      artist: v.artist,
                      coverUrl:
                        (v.coverUrl && !v.coverUrl.includes('album-official.jpg') ? v.coverUrl : '') ||
                        (v.youtubeVideoId ? `https://i.ytimg.com/vi/${v.youtubeVideoId}/hqdefault.jpg` : '/covers/banner.jpg'),
                      youtubeVideoId: v.youtubeVideoId,
                      audioUrl: v.audioUrl,
                      durationSec: v.durationSec || 180,
                      rank: v.rank,
                      count: v.count,
                    }))
                  : clipTracks.slice(0, 5).map((t, idx) => ({
                      id: t.id,
                      title: t.title,
                      artist: t.artist,
                      coverUrl:
                        t.coverUrl ||
                        (t.youtubeVideoId ? `https://i.ytimg.com/vi/${t.youtubeVideoId}/hqdefault.jpg` : '/covers/banner.jpg'),
                      youtubeVideoId: t.youtubeVideoId,
                      audioUrl: t.audioUrl,
                      durationSec: t.durationSec || 180,
                      rank: idx + 1,
                      count: t.plays || 50 - idx * 7,
                    }))
                ).map((vid) => (
                  <button
                    key={vid.id}
                    onClick={() => {
                      const trackObj: Track = {
                        id: vid.id,
                        number: vid.rank,
                        title: vid.title,
                        emoji: '🎬',
                        artist: vid.artist || 'LENKYX',
                        album: `Top #${vid.rank} Recomendado`,
                        bpm: 130,
                        key: 'Am',
                        coverUrl: vid.coverUrl,
                        audioUrl: vid.audioUrl || '',
                        youtubeVideoId: vid.youtubeVideoId,
                        durationSec: vid.durationSec,
                        plays: vid.count,
                        likes: 0,
                        favorite: false,
                        releaseBatch: 1,
                        sunoPrompt: '',
                        lyrics: '',
                        createdAt: new Date().toISOString(),
                        status: { suno: false, cover: true, app: true, youtube: true, distrokid: false },
                        source: 'world_full',
                      };
                      handlePlayRow(trackObj, [trackObj, ...results]);
                    }}
                    className="group rounded-2xl overflow-hidden bg-black/50 hover:bg-pink-500/15 border border-white/12 hover:border-pink-400/60 text-left transition flex flex-col"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={vid.coverUrl}
                        alt={vid.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black shadow">
                        #{vid.rank}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center transition">
                        <span className="w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </span>
                      </span>
                    </div>
                    <div className="p-2 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate group-hover:text-pink-300">
                        {vid.title}
                      </div>
                      <div className="text-[9px] text-cyan-300/85 truncate">
                        {vid.artist} · {vid.count} views
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* === SUNO AI ARTISTS & TRACKS HUB (Hidden when viewing a single Artist) === */}
      {!artistProfile && sunoArtists.length > 0 && (
        <CosmicScrollRow
          title={
            <>
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Artistas de Música IA do Suno (Ao Vivo no App)</span>
            </>
          }
          subtitle="Criadores mundiais do Suno IA — toque em um artista ou faixa para ouvir direto com Graves+"
          count={sunoArtists.length}
          collapsible
        >
          {sunoArtists.map((art) => (
            <button
              key={art.id}
              onClick={() => {
                if (art.tracks.length > 0) {
                  handlePlayRow(art.tracks[0], [...art.tracks, ...sunoTracks]);
                }
              }}
              className="group w-40 sm:w-44 shrink-0 rounded-3xl overflow-hidden bg-gradient-to-b from-cyan-500/15 to-black/60 backdrop-blur-xl border border-cyan-400/25 hover:border-cyan-300/70 text-left snap-start transition duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3.6] w-full overflow-hidden bg-black">
                <ArtistPortrait
                  name={art.name}
                  photoUrl={art.avatarUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-cyan-400 text-black text-[9px] font-black">
                  🤖 SUNO IA
                </span>
                <span className="opacity-0 group-hover:opacity-100 absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg transition">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </span>
              </div>
              <div className="p-2.5 space-y-0.5">
                <div className="text-xs font-black text-white truncate group-hover:text-cyan-300">
                  {art.name}
                </div>
                <div className="text-[10px] text-cyan-200/80 truncate">
                  {art.tracks[0]?.title || art.genre}
                </div>
              </div>
            </button>
          ))}
        </CosmicScrollRow>
      )}

      {/* === SECTION 1: MODERN GLASSMORPHIC ARTIST CARDS SHOWCASE (Hidden when viewing a single Artist) === */}
      {!artistProfile && famousArtists.length > 0 && (
        <CosmicScrollRow
          title={
            <>
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Artistas em Destaque</span>
            </>
          }
          subtitle="Toque em um artista para abrir perfil, músicas completas e clipes"
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
              onClick={() => void runSearch(art.name, `🎤 ${art.name}`, false, true)}
              className="group w-44 sm:w-52 shrink-0 rounded-3xl overflow-hidden bg-gradient-to-b from-white/[0.10] to-black/60 backdrop-blur-xl border border-white/15 hover:border-cyan-400/65 text-left snap-start transition duration-300 hover:-translate-y-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.65)]"
            >
              <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-black">
                <ArtistPortrait
                  name={art.name}
                  photoUrl={art.photoUrl}
                  className="w-full h-full object-cover object-top group-hover:scale-108 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[9px] font-black text-cyan-200">
                  {art.era || 'Destaque'}
                </span>
                <span className="opacity-0 group-hover:opacity-100 absolute bottom-3 right-3 w-9 h-9 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.7)] transition">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </span>
              </div>
              <div className="p-3 space-y-0.5">
                <div className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1 group-hover:text-cyan-300 transition">
                  <span className="truncate">{art.name}</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="text-[10px] font-semibold text-slate-300/80 truncate">{art.genre}</div>
              </div>
            </button>
          ))}
        </CosmicScrollRow>
      )}

      {/* === SECTION 2: NOVOS LANÇAMENTOS (Hidden when viewing a single Artist) === */}
      {!artistProfile && newReleases.length > 0 && (
        <CosmicScrollRow
          title={
            <>
              <Disc3 className="w-4 h-4 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Lançamentos {new Date().getFullYear()}</span>
            </>
          }
          subtitle="Músicas novas atualizadas automaticamente"
          count={newReleases.length}
          collapsible
        >
          {newReleases.map((t) => {
            const active = currentTrack?.id === t.id;
            return (
              <div
                key={t.id}
                className={`group w-40 sm:w-44 shrink-0 rounded-2xl cosmic-card-3d p-2.5 flex flex-col gap-2 snap-start transition ${
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

      {/* === SECTION 3: PLAYLISTS (Artist-specific when artist selected!) === */}
      <CosmicScrollRow
        title={
          <>
            <ListMusic className="w-4 h-4 text-cyan-400" />
            <span>{artistProfile ? `Playlists de ${artistProfile.name}` : 'Mixes por Estilo'}</span>
          </>
        }
        count={curatedPlaylists.length}
        collapsible
      >
        {curatedPlaylists.map((pl) => (
          <button
            key={pl.id}
            onClick={() =>
              void runSearch(pl.searchQuery, `${pl.emoji} ${pl.title}`, Boolean(pl.includeArchiveSpace), Boolean(artistProfile))
            }
            className={`w-60 sm:w-64 shrink-0 text-left rounded-2xl p-3.5 bg-gradient-to-br ${pl.gradient} cosmic-card-3d flex items-start gap-3 snap-start hover:scale-[1.02] transition`}
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

      {/* === SECTION 4: CLIPES OFICIAIS HD === */}
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
              className="group w-52 sm:w-60 shrink-0 rounded-2xl cosmic-card-3d overflow-hidden snap-start cursor-pointer hover:border-rose-400/50 transition"
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
      <div ref={resultsListRef} className="flex items-center justify-between text-xs text-purple-200/80 px-1 pt-1">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Flame className="w-4 h-4 text-pink-400" />
          <span>{artistProfile ? `Todas as músicas de ${artistProfile.name}` : activeLabel}</span>
          {!loading && <span className="text-cyan-300 font-extrabold">({results.length} músicas)</span>}
        </div>
        {results.length > 0 && (
          <button
            type="button"
            onClick={() => handlePlayRow(results[0])}
            className="px-3 py-1 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-[11px] font-black flex items-center gap-1 transition"
          >
            <Play className="w-3 h-3 fill-black" /> Tocar Todas
          </button>
        )}
      </div>

      {/* Clean Modern Track List */}
      {loading ? (
        <div className="py-14 flex flex-col items-center justify-center gap-2 text-purple-300">
          <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
          <span className="text-xs font-semibold">Carregando músicas, artistas e clipes completos...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-12 text-center rounded-2xl cosmic-card-3d text-purple-300 text-xs space-y-2">
          <Music2 className="w-8 h-8 mx-auto opacity-60" />
          <div>Nenhuma faixa encontrada agora. Toque em um artista acima!</div>
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
                  <button
                    type="button"
                    disabled={downloadingRowId === t.id}
                    onClick={() => void handleDownloadWorldRow(t)}
                    className="px-2 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-100 text-[10px] font-extrabold flex items-center gap-1 transition"
                    title="Baixar música"
                  >
                    {downloadingRowId === t.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {downloadingRowId === t.id
                        ? downloadRowPct >= 100
                          ? 'Baixado!'
                          : `${downloadRowPct}%`
                        : 'Baixar'}
                    </span>
                  </button>
                  {t.youtubeVideoId && onWatchClip && (
                    <button
                      onClick={() => onWatchClip(t, results)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-rose-200 text-[10px] font-extrabold flex items-center gap-1"
                      title="Assistir Clipe"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clipe</span>
                    </button>
                  )}

                  <button
                    onClick={() => setPickerTrackId(pickerTrackId === t.id ? null : t.id)}
                    className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-purple-100"
                    title="Salvar na Playlist"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>

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

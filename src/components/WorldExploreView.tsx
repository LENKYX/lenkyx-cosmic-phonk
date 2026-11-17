import React, { useEffect, useState } from 'react';
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
  ChevronDown,
  ChevronUp,
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
  getWorldTrending,
  searchWorldMusic,
} from '../utils/worldMusic';
import { getSmartDiscoveryQueries, recordPlayTaste, recordSearchTaste } from '../utils/tasteProfile';

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
}

const GENRE_CHIPS = [
  { label: '🔥 Em Alta', q: '', space: false },
  { label: '🌎 Internacionais', q: 'The Weeknd Taylor Swift Bruno Mars Dua Lipa Billie Eilish official', space: false },
  { label: '🎬 Clipes HD', q: 'Henrique e Juliano The Weeknd Queen Michael Jackson clipe oficial', space: false },
  { label: '🤠 Sertanejo', q: 'Henrique e Juliano Marilia Mendonca Gusttavo Lima', space: false },
  { label: '⚡ Phonk', q: 'brazilian phonk Kordhell DVRST', space: false },
  { label: '🛸 Espaço & E.T.', q: 'espaco galaxia NASA voyager cosmic synthwave', space: true },
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
}) => {
  const [results, setResults] = useState<Track[]>([]);
  const [artistProfile, setArtistProfile] = useState<WorldArtistProfile | null>(null);
  const [famousArtists, setFamousArtists] = useState<WorldArtistDirectoryItem[]>([]);
  const [curatedPlaylists, setCuratedPlaylists] = useState<WorldCuratedPlaylist[]>(FALLBACK_CURATED_PLAYLISTS);
  const [smartPicks, setSmartPicks] = useState<{ label: string; query: string }[]>(() => getSmartDiscoveryQueries());
  const [loading, setLoading] = useState(false);
  const [activeLabel, setActiveLabel] = useState('🔥 Em Alta');
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);

  // Minimizable horizontal carousels
  const [artistsCollapsed, setArtistsCollapsed] = useState(false);
  const [playlistsCollapsed, setPlaylistsCollapsed] = useState(true);

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

  useEffect(() => {
    getWorldDirectory()
      .then((dir) => {
        if (dir.artists?.length) setFamousArtists(dir.artists);
        if (dir.playlists?.length) setCuratedPlaylists(dir.playlists);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      void runSearch(initialQuery);
    } else {
      void runSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, searchNonce]);

  const handlePlayRow = (track: Track) => {
    recordPlayTaste(track.artist, track.genre, track.title);
    setSmartPicks(getSmartDiscoveryQueries());
    onPlayTrack(track, results, activeLabel);
  };

  return (
    <div className="space-y-4 pb-36 md:pb-28">
      {/* Compact Genre & AI Smart Discovery Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {GENRE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => void runSearch(chip.q, chip.label, chip.space)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                activeLabel === chip.label
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow'
                  : 'bg-white/[0.07] hover:bg-white/15 text-purple-100 border border-white/10'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        {results.length > 0 && (
          <button
            onClick={() => handlePlayRow(results[0])}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black flex items-center gap-1.5 shrink-0 shadow hover:brightness-110 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Tocar Sequência
          </button>
        )}
      </div>

      {/* AI Continuous Discovery Chips (learns from your searches & plays) */}
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

      {/* Artist Official Spotlight Card (when searching an artist) */}
      {artistProfile && (
        <div className="rounded-3xl cosmic-card-3d p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-[2px] bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 shrink-0 shadow-[0_0_25px_rgba(236,72,153,0.4)]">
            <img
              src={artistProfile.photoUrl || '/covers/album-official.jpg'}
              alt={artistProfile.name}
              className="w-full h-full object-cover rounded-[14px]"
            />
            <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-black flex items-center gap-0.5 shadow">
              <UserCheck className="w-2.5 h-2.5" /> OFICIAL
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-display text-lg font-black text-white">{artistProfile.name}</h2>
              {artistProfile.genre && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/35 text-pink-200 text-[10px] font-extrabold">
                  {artistProfile.genre}
                </span>
              )}
              {artistProfile.era && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/35 text-cyan-200 text-[10px] font-extrabold">
                  {artistProfile.era}
                </span>
              )}
            </div>
            {artistProfile.bio && (
              <p className="text-xs text-purple-100/80 line-clamp-2 leading-relaxed">{artistProfile.bio}</p>
            )}
          </div>
        </div>
      )}

      {/* FAMOUS INTERNATIONAL & BRAZILIAN ARTISTS CAROUSEL (Minimizable!) */}
      {famousArtists.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-pink-400" /> ARTISTAS FAMOSOS — INTERNACIONAL & BRASIL ({famousArtists.length})
            </h2>
            <button
              onClick={() => setArtistsCollapsed((v) => !v)}
              className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.15] border border-white/10 text-[10px] font-bold text-purple-200 flex items-center gap-1 transition"
            >
              {artistsCollapsed ? 'Mostrar' : 'Minimizar'}
              {artistsCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>

          {!artistsCollapsed && (
            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2">
              {famousArtists.map((art) => (
                <button
                  key={art.name}
                  onClick={() => void runSearch(art.name, `🎤 ${art.name}`)}
                  className="group w-26 sm:w-30 shrink-0 rounded-2xl cosmic-card-3d p-2.5 flex flex-col items-center text-center gap-1.5"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 group-hover:scale-105 transition">
                    <img
                      src={art.photoUrl || '/covers/album-official.jpg'}
                      alt={art.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover rounded-full bg-black"
                    />
                  </div>
                  <div className="min-w-0 w-full">
                    <div className="text-[11px] font-extrabold text-white truncate">{art.name}</div>
                    <div className="text-[9px] text-cyan-300/85 truncate">{art.genre}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CURATED PLAYLISTS CAROUSEL (Minimizable!) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
            <ListMusic className="w-4 h-4 text-cyan-400" /> PLAYLISTS POR ESTILO & GERAÇÃO
          </h2>
          <button
            onClick={() => setPlaylistsCollapsed((v) => !v)}
            className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.15] border border-white/10 text-[10px] font-bold text-purple-200 flex items-center gap-1 transition"
          >
            {playlistsCollapsed ? 'Mostrar' : 'Minimizar'}
            {playlistsCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {!playlistsCollapsed && (
          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2">
            {curatedPlaylists.map((pl) => (
              <button
                key={pl.id}
                onClick={() =>
                  void runSearch(pl.searchQuery, `${pl.emoji} ${pl.title}`, Boolean(pl.includeArchiveSpace))
                }
                className={`w-64 shrink-0 text-left rounded-2xl p-3 bg-gradient-to-br ${pl.gradient} cosmic-card-3d flex items-start gap-2.5`}
              >
                <div className="w-10 h-10 rounded-xl bg-black/45 border border-white/15 flex items-center justify-center text-xl shrink-0">
                  {pl.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-200">{pl.era}</div>
                  <div className="text-xs font-black text-white truncate">{pl.title}</div>
                  <div className="text-[10px] text-purple-100/75 line-clamp-1 mt-0.5">{pl.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-purple-200/80 px-1 pt-1">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Flame className="w-4 h-4 text-pink-400" />
          <span>{activeLabel}</span>
          {!loading && <span className="text-purple-300/70 font-normal">({results.length} faixas)</span>}
        </div>
      </div>

      {/* Track List */}
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
                  active ? 'bg-pink-500/15' : ''
                }`}
              >
                <button
                  onClick={() => handlePlayRow(t)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
                >
                  {active && isPlaying ? (
                    <Pause className="w-4 h-4 text-pink-400" />
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
                    <span className={`text-xs sm:text-sm font-bold truncate ${active ? 'text-pink-400' : 'text-white'}`}>
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

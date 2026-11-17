import React, { useEffect, useState } from 'react';
import {
  Globe,
  Play,
  Pause,
  Disc3,
  ListPlus,
  Loader2,
  Flame,
  ExternalLink,
  Music2,
  Sparkles,
  Rocket,
  ListMusic,
  UserCheck,
  Film,
} from 'lucide-react';
import {
  Track,
  UserPlaylist,
  WorldAiInsight,
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

interface Props {
  initialQuery?: string;
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: UserPlaylist[];
  onPlayTrack: (track: Track, queue: Track[], queueLabel?: string) => void;
  onWatchClip?: (track: Track, queue: Track[]) => void;
  onSendToDJ: (track: Track, deck: 'A' | 'B') => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
}

const GENRE_CHIPS = [
  { label: '🔥 Em Alta (Brasil & Mundo)', q: '', space: false },
  { label: '🎬 Clipes Oficiais', q: 'Henrique e Juliano Marilia Mendonca Queen Michael Jackson clipe oficial', space: false },
  { label: '🤠 Sertanejo', q: 'Henrique e Juliano Marilia Mendonca sertanejo', space: false },
  { label: '🇧🇷 Funk & Pagode', q: 'funk brasil pagode hits completos', space: false },
  { label: '🕰️ Anos 70 & 80', q: 'anos 80 flashback Queen Michael Jackson', space: false },
  { label: '🎸 Anos 90 & 2000', q: 'anos 90 2000 rock pop hits', space: false },
  { label: '⚡ Phonk Mundial', q: 'brazilian phonk Kordhell', space: false },
  { label: '🛸 Espaço, Galáxia & E.T.', q: 'espaco galaxia NASA voyager alien music', space: true },
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
  currentTrack,
  isPlaying,
  playlists,
  onPlayTrack,
  onWatchClip,
  onSendToDJ,
  onAddToPlaylist,
}) => {
  const [results, setResults] = useState<Track[]>([]);
  const [aiInsight, setAiInsight] = useState<WorldAiInsight | null>(null);
  const [artistProfile, setArtistProfile] = useState<WorldArtistProfile | null>(null);
  const [famousArtists, setFamousArtists] = useState<WorldArtistDirectoryItem[]>([]);
  const [curatedPlaylists, setCuratedPlaylists] = useState<WorldCuratedPlaylist[]>(
    FALLBACK_CURATED_PLAYLISTS
  );
  const [loading, setLoading] = useState(false);
  const [activeLabel, setActiveLabel] = useState('🔥 Em Alta (Brasil & Mundo)');
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);

  const runSearch = async (term: string, label?: string, includeArchiveSpace = false) => {
    setLoading(true);
    setActiveLabel(label || (term ? `Busca: "${term}"` : '🔥 Em Alta (Brasil & Mundo)'));
    try {
      const payload = term.trim()
        ? await searchWorldMusic(term, { includeArchiveSpace })
        : await getWorldTrending();
      setResults(payload.tracks || []);
      setAiInsight(payload.aiInsight || null);
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
  }, [initialQuery]);

  const handlePlayAllSequence = () => {
    if (!results.length) return;
    onPlayTrack(results[0], results, activeLabel);
  };

  return (
    <div className="space-y-5 pb-28 md:pb-24">
      {/* Cosmic AI Header (clean — uses the single global search bar at top!) */}
      <div className="rounded-3xl bg-gradient-to-r from-[#190b38] via-[#120829] to-[#081d33] border border-cyan-400/25 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 p-[2px] shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <div className="w-full h-full rounded-[14px] bg-[#0a041a] flex items-center justify-center">
              <Globe className="w-6 h-6 text-cyan-300" />
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-0.5">
              <Sparkles className="w-3 h-3 text-pink-400" /> IA Musical · Brasil, Mundo, Gerações & Galáxia
            </div>
            <h1 className="font-display text-base sm:text-xl font-black text-white">
              SPOTIFY CÓSMICO <span className="neon-text">100% GRATUITO</span>
            </h1>
            <p className="text-xs text-purple-200/80">
              Use a lupa lá em cima para buscar qualquer artista (ex: <strong>Henrique & Juliano</strong>, <strong>Queen</strong> ou <strong>sons de E.T.</strong>) — versões completas!
            </p>
          </div>
        </div>
        {results.length > 0 && (
          <button
            onClick={handlePlayAllSequence}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black flex items-center justify-center gap-2 shrink-0 shadow-lg hover:brightness-110 transition"
          >
            <Play className="w-4 h-4 fill-current" /> Tocar Lista na Sequência
          </button>
        )}
      </div>

      {/* Quick Style & Era Chips */}
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

      {/* AI Concierge Insight + Official Artist Profile Photo Card */}
      {(aiInsight || artistProfile) && (
        <div className="rounded-3xl bg-white/[0.04] border border-purple-400/25 p-4 space-y-3">
          {artistProfile && (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-3 border-b border-white/10">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-[2px] bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 shrink-0 shadow-[0_0_25px_rgba(236,72,153,0.4)]">
                <img
                  src={artistProfile.photoUrl || '/covers/album-official.jpg'}
                  alt={artistProfile.name}
                  className="w-full h-full object-cover rounded-[14px]"
                />
                <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-black flex items-center gap-0.5 shadow">
                  <UserCheck className="w-2.5 h-2.5" /> OFICIAL
                </span>
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-display text-lg sm:text-xl font-black text-white">
                    {artistProfile.name}
                  </h2>
                  {artistProfile.genre && (
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/35 text-pink-200 text-[10px] font-extrabold">
                      {artistProfile.genre}
                    </span>
                  )}
                  {artistProfile.era && (
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/35 text-cyan-200 text-[10px] font-extrabold">
                      {artistProfile.era}
                    </span>
                  )}
                </div>
                {artistProfile.bio && (
                  <p className="text-xs text-purple-100/80 leading-relaxed line-clamp-3">
                    {artistProfile.bio}
                  </p>
                )}
              </div>
            </div>
          )}

          {aiInsight && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>{aiInsight.title}</span>
                </div>
                <p className="text-[11px] text-purple-200/80 leading-relaxed">{aiInsight.summary}</p>
              </div>
              <div className="flex flex-wrap gap-1 shrink-0">
                {aiInsight.tags.map((tg) => (
                  <span
                    key={tg}
                    className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-purple-100"
                  >
                    {tg}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Famous Artists with Real Photos (Brazil & World) */}
      {famousArtists.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-pink-400" /> ARTISTAS FAMOSOS — BRASIL & MUNDO
            </h2>
            <span className="text-[10px] text-purple-300/75">Toque na foto para abrir sucessos</span>
          </div>
          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2">
            {famousArtists.map((art) => (
              <button
                key={art.name}
                onClick={() => void runSearch(art.name, `🎤 ${art.name}`)}
                className="group w-28 sm:w-32 shrink-0 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-pink-400/50 p-2.5 flex flex-col items-center text-center gap-2 transition"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 group-hover:scale-105 transition">
                  <img
                    src={art.photoUrl || '/covers/album-official.jpg'}
                    alt={art.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover rounded-full bg-black"
                  />
                </div>
                <div className="min-w-0 w-full">
                  <div className="text-xs font-extrabold text-white truncate">{art.name}</div>
                  <div className="text-[10px] text-cyan-300/85 truncate">{art.genre}</div>
                  <div className="text-[9px] text-purple-300/65 truncate">{art.era}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Free Curated Playlists Across All Generations & Outer Space / ET */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
            <ListMusic className="w-4 h-4 text-cyan-400" /> PLAYLISTS GRATUITAS · TODAS AS GERAÇÕES & GALÁXIA
          </h2>
          <span className="text-[10px] text-purple-300/75">Toque para carregar faixas completas</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {curatedPlaylists.map((pl) => (
            <button
              key={pl.id}
              onClick={() =>
                void runSearch(pl.searchQuery, `${pl.emoji} ${pl.title}`, Boolean(pl.includeArchiveSpace))
              }
              className={`text-left rounded-2xl p-3.5 bg-gradient-to-br ${pl.gradient} border border-white/15 hover:border-cyan-400/60 hover:brightness-110 transition flex items-start gap-3`}
            >
              <div className="w-11 h-11 rounded-xl bg-black/45 border border-white/15 flex items-center justify-center text-2xl shrink-0">
                {pl.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">
                  {pl.era}
                </div>
                <div className="text-xs sm:text-sm font-black text-white truncate">{pl.title}</div>
                <div className="text-[11px] text-purple-100/75 line-clamp-2 leading-snug mt-0.5">
                  {pl.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-purple-200/80 px-1 pt-1">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Flame className="w-4 h-4 text-pink-400" />
          <span>{activeLabel}</span>
          {!loading && <span className="text-purple-300/70 font-normal">({results.length} faixas)</span>}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
            <Rocket className="w-3 h-3" /> 100% Músicas Completas · Segue na Sequência da Lista
          </span>
        </div>
      </div>

      {/* Track List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-purple-300">
          <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
          <span className="text-xs font-semibold">
            IA Musical buscando músicas, fotos de artistas e sinais da galáxia...
          </span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-14 text-center rounded-2xl bg-white/4 border border-white/10 text-purple-300 text-xs space-y-2">
          <Music2 className="w-8 h-8 mx-auto opacity-60" />
          <div>Nenhuma faixa encontrada agora. Escolha um artista famoso ou playlist acima!</div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 divide-y divide-white/[0.06] overflow-visible">
          {results.map((t, idx) => {
            const active = currentTrack?.id === t.id;
            const hasDirectAudio = Boolean(t.audioUrl && !t.youtubeVideoId);
            return (
              <div
                key={t.id}
                className={`group flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.06] transition ${
                  active ? 'bg-pink-500/10' : ''
                }`}
              >
                {/* Index / Play */}
                <button
                  onClick={() => onPlayTrack(t, results, activeLabel)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
                  title="Tocar versão completa na sequência"
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

                {/* Cover */}
                <img
                  src={t.coverUrl || '/covers/album-official.jpg'}
                  alt={t.title}
                  loading="lazy"
                  decoding="async"
                  onClick={() => onPlayTrack(t, results, activeLabel)}
                  className="w-11 h-11 rounded-lg object-cover shrink-0 cursor-pointer border border-white/10"
                />

                {/* Title & Artist */}
                <div
                  onClick={() => onPlayTrack(t, results, activeLabel)}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm font-bold truncate ${
                        active ? 'text-pink-400' : 'text-white'
                      }`}
                    >
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

                {/* Duration */}
                <div className="hidden sm:block text-xs text-purple-300/75 font-mono w-14 text-right">
                  {fmtDur(t.durationSec)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 relative">
                  {t.youtubeVideoId && onWatchClip && (
                    <button
                      onClick={() => onWatchClip(t, results)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-500/25 to-pink-500/25 hover:from-rose-500/40 hover:to-pink-500/40 border border-rose-400/40 text-rose-200 text-[10px] font-extrabold flex items-center gap-1"
                      title="Assistir Clipe Oficial Completo dentro do app"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Clipe</span>
                    </button>
                  )}

                  {hasDirectAudio && (
                    <button
                      onClick={() => onSendToDJ(t, 'A')}
                      className="px-2 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 text-[10px] font-bold flex items-center gap-1"
                      title="Mandar para o Deck A da Mesa de DJ"
                    >
                      <Disc3 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">DJ</span>
                    </button>
                  )}

                  <button
                    onClick={() => setPickerTrackId(pickerTrackId === t.id ? null : t.id)}
                    className="px-2 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-purple-100 text-[10px] font-bold flex items-center gap-1"
                    title="Salvar na Playlist"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Playlist</span>
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
                      <div className="text-[10px] font-bold text-purple-300 px-2 py-1">
                        Adicionar à playlist:
                      </div>
                      {playlists.length === 0 ? (
                        <div className="text-[11px] text-purple-200/70 px-2 py-1">
                          Crie uma playlist na aba Minhas Playlists primeiro.
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

import React, { useEffect, useState } from 'react';
import {
  Search,
  Globe,
  Play,
  Pause,
  Disc3,
  ListPlus,
  Loader2,
  Flame,
  ExternalLink,
  Music2,
} from 'lucide-react';
import { Track, UserPlaylist } from '../types';
import { getWorldTrending, searchWorldMusic } from '../utils/worldMusic';

interface Props {
  initialQuery?: string;
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: UserPlaylist[];
  onPlayTrack: (track: Track) => void;
  onSendToDJ: (track: Track, deck: 'A' | 'B') => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
}

const GENRE_CHIPS = [
  { label: '🔥 Em Alta no Mundo', q: '' },
  { label: '⚡ Brazilian Phonk', q: 'brazilian phonk' },
  { label: '🇧🇷 Funk Brasil', q: 'funk brasil' },
  { label: '🎧 EDM & House', q: 'electronic house' },
  { label: '🎤 Trap & Hip-Hop', q: 'trap hip hop' },
  { label: '🌟 Pop Mundial', q: 'pop hits' },
  { label: '🌙 Lo-Fi & Synthwave', q: 'synthwave lofi' },
  { label: '🎸 Rock', q: 'rock' },
];

function fmtDur(sec?: number): string {
  if (!sec || sec <= 0) return '0:30';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const WorldExploreView: React.FC<Props> = ({
  initialQuery = '',
  currentTrack,
  isPlaying,
  playlists,
  onPlayTrack,
  onSendToDJ,
  onAddToPlaylist,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeLabel, setActiveLabel] = useState('🔥 Em Alta no Mundo');
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);

  const runSearch = async (term: string, label?: string) => {
    setLoading(true);
    setActiveLabel(label || (term ? `Resultados para "${term}"` : '🔥 Em Alta no Mundo'));
    try {
      const list = term.trim() ? await searchWorldMusic(term) : await getWorldTrending();
      setResults(list);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
      void runSearch(initialQuery);
    } else {
      void runSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(query);
  };

  return (
    <div className="space-y-4 pb-28 md:pb-24">
      {/* Compact Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#170b33] via-[#120826] to-[#0a1929] border border-purple-500/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-black text-white">
              EXPLORAR MÚSICAS <span className="neon-text">DO MUNDO TODO</span>
            </h1>
            <p className="text-xs text-purple-200/75">
              Pesquise artistas, gêneros ou músicas — ouça aqui, salve nas suas playlists ou jogue na Mesa de DJ!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-96">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar artista, música ou estilo..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-purple-500/35 text-xs sm:text-sm text-white placeholder:text-purple-300/50 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-xs font-extrabold shrink-0 hover:brightness-110 transition"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Genre Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {GENRE_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => {
              setQuery(chip.q);
              void runSearch(chip.q, chip.label);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              activeLabel === chip.label
                ? 'bg-white text-black'
                : 'bg-white/8 hover:bg-white/15 text-purple-100 border border-white/10'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-purple-200/80 px-1">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Flame className="w-4 h-4 text-pink-400" />
          <span>{activeLabel}</span>
          {!loading && <span className="text-purple-300/70 font-normal">({results.length} faixas)</span>}
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 100% Músicas Completas (Sem amostras de 30s)
          </span>
        </div>
      </div>

      {/* Spotify-style Compact List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-purple-300">
          <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
          <span className="text-xs font-semibold">Buscando músicas pelo mundo todo...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-14 text-center rounded-2xl bg-white/4 border border-white/10 text-purple-300 text-xs space-y-2">
          <Music2 className="w-8 h-8 mx-auto opacity-60" />
          <div>Nenhuma faixa encontrada. Tente outro artista ou estilo!</div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 divide-y divide-white/[0.06] overflow-visible">
          {results.map((t, idx) => {
            const active = currentTrack?.id === t.id;
            const isFull = t.source === 'world_full';
            return (
              <div
                key={t.id}
                className={`group flex items-center gap-3 px-3 py-2 hover:bg-white/[0.06] transition ${
                  active ? 'bg-pink-500/12' : ''
                }`}
              >
                <span className="w-5 text-right text-[11px] font-mono text-purple-300/60 hidden sm:inline">
                  {idx + 1}
                </span>

                {/* Play Thumb */}
                <button
                  onClick={() => onPlayTrack(t)}
                  className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10"
                >
                  <img src={t.coverUrl} alt={t.title} loading="lazy" className="w-full h-full object-cover" />
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/45 transition ${
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {active && isPlaying ? (
                      <Pause className="w-5 h-5 text-pink-400 fill-pink-400" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </button>

                {/* Title & Artist */}
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlayTrack(t)}>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs sm:text-sm font-bold truncate ${active ? 'text-pink-400' : 'text-white'}`}>
                      {t.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 bg-emerald-500/20 text-emerald-300">
                      {isFull ? 'COMPLETA' : 'FULL'}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-300/75 truncate">
                    {t.artist} · <span className="opacity-75">{t.album}</span>
                  </div>
                </div>

                {/* Duration */}
                <span className="text-[11px] font-mono text-purple-300/70 hidden md:inline w-10 text-right">
                  {fmtDur(t.durationSec)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 relative shrink-0">
                  <button
                    onClick={() => setPickerTrackId(pickerTrackId === t.id ? null : t.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-pink-500/25 text-purple-200 hover:text-pink-200 transition"
                    title="Adicionar a uma Playlist"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSendToDJ(t, 'A')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/25 text-cyan-300 transition"
                    title="Carregar na Mesa de DJ"
                  >
                    <Disc3 className="w-4 h-4" />
                  </button>
                  {t.externalUrl && (
                    <a
                      href={t.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-purple-300 hidden sm:inline-flex"
                      title="Abrir original"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {pickerTrackId === t.id && (
                    <div className="absolute right-0 top-10 z-30 w-52 rounded-xl bg-[#120829] border border-purple-400/40 shadow-2xl p-2 space-y-1">
                      <div className="text-[10px] font-bold text-purple-300 px-2 py-1 uppercase">Salvar na Playlist:</div>
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => {
                            onAddToPlaylist(pl.id, t);
                            setPickerTrackId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-pink-500/25 text-xs text-white flex items-center gap-2"
                        >
                          <span>{pl.emoji}</span>
                          <span className="truncate">{pl.name}</span>
                        </button>
                      ))}
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

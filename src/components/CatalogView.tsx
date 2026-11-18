import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Video,
  Upload,
  Sparkles,
  FileText,
  X,
  Copy,
  Check,
  Plus,
  Headphones,
  ListPlus,
  LayoutGrid,
  List,
  Clock,
  Smartphone,
  DownloadCloud,
  CheckCircle2,
  Loader2,
  WifiOff,
  UserCheck,
} from 'lucide-react';
import { AppMode, AppSettings, AudioVersion, Track, UserPlaylist, WorldArtistDirectoryItem } from '../types';
import { copyTextReliable, isAndroidApk } from '../utils/androidBridge';
import { getWorldDirectory } from '../utils/worldMusic';
import { CosmicScrollRow } from './CosmicScrollRow';

interface Props {
  tracks: Track[];
  settings: AppSettings;
  mode: AppMode;
  searchQuery: string;
  playlists: UserPlaylist[];
  currentTrack: Track | null;
  activeVersion: AudioVersion;
  isPlaying: boolean;
  offlineTrackIds: Set<string>;
  downloadingIds: Set<string>;
  downloadingAll: boolean;
  onPlayTrack: (track: Track, version?: AudioVersion) => void;
  onLikeTrack: (track: Track) => void;
  onShareTrack: (track: Track | null) => void;
  onOpenPix?: () => void;
  onSendToVideo?: (track: Track) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onToggleOffline: (track: Track) => void;
  onDownloadAllOffline: () => void;
  onEditTrack: (track: Track) => void;
  onAddTrack: () => void;
  lyricsTrack: Track | null;
  onSetLyricsTrack: (track: Track | null) => void;
  onCommentTrack?: (track: Track) => void;
  onSearchWorld?: (query: string) => void;
  onToast: (msg: string) => void;
}

function fmtDur(sec?: number): string {
  if (!sec || sec <= 0) return '3:30';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const CatalogView: React.FC<Props> = ({
  tracks,
  settings,
  mode,
  searchQuery,
  playlists,
  currentTrack,
  isPlaying,
  offlineTrackIds,
  downloadingIds,
  downloadingAll,
  onPlayTrack,
  onLikeTrack,
  onShareTrack,
  onSendToVideo,
  onAddToPlaylist,
  onToggleOffline,
  onDownloadAllOffline,
  onEditTrack,
  onAddTrack,
  lyricsTrack,
  onSetLyricsTrack,
  onCommentTrack,
  onSearchWorld,
  onToast,
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);
  const [spotArtists, setSpotArtists] = useState<WorldArtistDirectoryItem[]>([]);

  useEffect(() => {
    getWorldDirectory(false)
      .then((d) => {
        if (d.artists?.length) setSpotArtists(d.artists);
      })
      .catch(() => {});
  }, []);

  const albums = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => set.add(t.album));
    return ['ALL', 'OFFLINE', 'FAV', ...Array.from(set)];
  }, [tracks]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tracks.filter((t) => {
      if (selectedAlbum === 'OFFLINE' && !offlineTrackIds.has(t.id)) return false;
      if (selectedAlbum === 'FAV' && !t.favorite) return false;
      if (selectedAlbum !== 'ALL' && selectedAlbum !== 'FAV' && selectedAlbum !== 'OFFLINE' && t.album !== selectedAlbum) {
        return false;
      }
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        String(t.bpm).includes(q) ||
        t.lyrics.toLowerCase().includes(q)
      );
    });
  }, [tracks, searchQuery, selectedAlbum, offlineTrackIds]);

  const totalPlays = useMemo(() => tracks.reduce((acc, t) => acc + (t.plays || 0), 0), [tracks]);
  const offlineCount = tracks.filter((t) => offlineTrackIds.has(t.id)).length;

  const handleCopyPrompt = async (txt: string) => {
    const ok = await copyTextReliable(txt);
    if (ok) {
      setCopiedPrompt(true);
      onToast('Prompt copiado!');
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  return (
    <div className="space-y-5 pb-36 md:pb-28 cosmic-scene">
      {/* FLOATING 3D SPACE HERO */}
      <section className="relative rounded-[28px] cosmic-card-3d overflow-hidden">
        <div className="relative min-h-[195px] sm:min-h-[220px] w-full flex flex-col justify-end">
          <img
            src="/covers/banner.jpg"
            alt="LENKYX Cosmic Phonk"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05020f]/95 via-[#070316]/65 to-transparent" />

          <div className="relative z-10 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <img
                  src="/covers/album-official.jpg"
                  alt="LENKYX Cosmic Phonk"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/25 shadow-[0_0_38px_rgba(236,72,153,0.5)] object-cover"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/35 text-[10px] font-extrabold text-pink-200">
                  <Sparkles className="w-2.5 h-2.5" /> ESPAÇO EXCLUSIVO LENKYX · {tracks.length} FAIXAS SEM ANÚNCIOS
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-black tracking-wide text-white truncate">
                  {settings.artistName} <span className="neon-text">{settings.brandSubtitle}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-purple-200/80">
                  <span className="inline-flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                    {totalPlays.toLocaleString('pt-BR')} plays
                  </span>
                  {offlineCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                      <WifiOff className="w-3 h-3" /> {offlineCount} offline
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Clean Essential Action Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => tracks[0] && onPlayTrack(tracks[0], 'v1')}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_26px_rgba(236,72,153,0.45)] transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Tocar Álbum
              </button>
              <button
                onClick={onDownloadAllOffline}
                disabled={downloadingAll}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                {downloadingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                ) : offlineCount >= tracks.length && tracks.length > 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <DownloadCloud className="w-3.5 h-3.5 text-cyan-300" />
                )}
                {downloadingAll
                  ? 'Baixando...'
                  : offlineCount >= tracks.length && tracks.length > 0
                  ? 'Todas Offline'
                  : 'Baixar Offline'}
              </button>
              {!isAndroidApk() && (
                <a
                  href={settings.apkDownloadUrl || '/download/apk'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_18px_rgba(52,211,153,0.35)] transition active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5" /> App Android
                </a>
              )}
              {mode === 'creator' && (
                <button
                  onClick={onAddTrack}
                  className="px-4 py-2.5 rounded-full bg-white text-black hover:bg-purple-100 font-extrabold text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Faixa
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SPOTIFY / YOUTUBE MUSIC ARTISTS ROW WITH TRANSLUCENT ◀▶ ARROWS */}
      {spotArtists.length > 0 && onSearchWorld && (
        <CosmicScrollRow
          title={
            <>
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Artistas Mundiais & Lançamentos IA</span>
            </>
          }
          count={spotArtists.length}
          collapsible
          gridToggleable={false}
        >
          {spotArtists.map((art) => (
            <button
              key={art.name}
              onClick={() => onSearchWorld(art.name)}
              className="group w-28 sm:w-32 shrink-0 rounded-2xl cosmic-card-3d p-2.5 flex flex-col items-center text-center gap-1.5 hover:bg-white/[0.09] transition"
            >
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-tr from-emerald-400 via-cyan-400 to-pink-500 group-hover:scale-105 transition">
                <img
                  src={art.photoUrl || '/covers/album-official.jpg'}
                  alt={art.name}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-full bg-black"
                />
                <span className="opacity-0 group-hover:opacity-100 absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow transition">
                  <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                </span>
              </div>
              <div className="min-w-0 w-full">
                <div className="text-[11px] font-black text-white truncate">{art.name}</div>
                <div className="text-[9px] text-cyan-300/85 truncate">{art.genre}</div>
              </div>
            </button>
          ))}
        </CosmicScrollRow>
      )}

      {/* FILTER PILLS + VIEW TOGGLE */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {albums.map((alb) => {
            const label =
              alb === 'ALL'
                ? `Todas (${tracks.length})`
                : alb === 'OFFLINE'
                ? `Offline (${offlineCount})`
                : alb === 'FAV'
                ? 'Curtidas'
                : alb;
            const active = selectedAlbum === alb;
            return (
              <button
                key={alb}
                onClick={() => setSelectedAlbum(alb)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  active
                    ? 'bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.35)]'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-purple-100 border border-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center rounded-xl bg-white/[0.06] border border-white/10 p-0.5 backdrop-blur-md">
          <button
            onClick={() => setViewLayout('list')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
              viewLayout === 'list' ? 'bg-pink-500 text-white' : 'text-purple-200 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Lista
          </button>
          <button
            onClick={() => setViewLayout('grid')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
              viewLayout === 'grid' ? 'bg-pink-500 text-white' : 'text-purple-200 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Capas
          </button>
        </div>
      </div>

      {/* TRACKLIST / GRID */}
      {filtered.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-3xl cosmic-card-3d space-y-2.5">
          <WifiOff className="w-8 h-8 mx-auto text-purple-300/70" />
          <div className="text-sm font-bold text-white">
            {selectedAlbum === 'OFFLINE'
              ? 'Nenhuma música salva offline ainda'
              : searchQuery.trim()
                ? `Nenhuma faixa LENKYX para "${searchQuery.trim()}"`
                : 'Nenhuma faixa encontrada'}
          </div>
          {searchQuery.trim() && onSearchWorld ? (
            <div className="space-y-2.5 pt-1">
              <p className="text-xs text-purple-200/75 max-w-md mx-auto">
                Quer ouvir esse artista ou música no catálogo mundial completo? Clique abaixo:
              </p>
              <button
                onClick={() => onSearchWorld(searchQuery.trim())}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white text-xs font-black shadow-lg hover:brightness-110 transition"
              >
                🌍 Buscar "{searchQuery.trim()}" em Artistas & Mundo
              </button>
            </div>
          ) : (
            <p className="text-xs text-purple-200/75 max-w-md mx-auto">
              {selectedAlbum === 'OFFLINE'
                ? 'Toque no ícone de download em qualquer faixa para ouvir mesmo sem internet.'
                : 'Tente limpar a busca ou escolher outro filtro.'}
            </p>
          )}
        </div>
      ) : viewLayout === 'list' ? (
        /* FLOATING 3D TRACK ROWS (Zero V2 clutter) */
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300/60">
            <div className="col-span-6 pl-2"># · Música</div>
            <div className="col-span-2">Álbum</div>
            <div className="col-span-1 text-right pr-2 flex items-center justify-end">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="col-span-3 text-right pr-1">Ações</div>
          </div>

          {filtered.map((track) => {
            const active = currentTrack?.id === track.id;
            const isOff = offlineTrackIds.has(track.id);
            const isDl = downloadingIds.has(track.id);
            return (
              <div
                key={track.id}
                className={`group grid grid-cols-12 gap-2 items-center px-3.5 py-2.5 rounded-2xl cosmic-card-3d ${
                  active ? 'border-pink-400/60 shadow-[0_0_26px_rgba(236,72,153,0.22)]' : ''
                }`}
              >
                {/* # + Cover + Title */}
                <div className="col-span-9 sm:col-span-7 md:col-span-6 flex items-center gap-3 min-w-0">
                  <span className="w-5 text-right text-[11px] font-mono text-purple-300/65 shrink-0 hidden sm:flex items-center justify-end">
                    {active && isPlaying ? (
                      <span className="inline-flex items-end gap-0.5 h-3.5">
                        <span className="w-0.5 h-full bg-pink-400 eq-bar-1" />
                        <span className="w-0.5 h-full bg-cyan-400 eq-bar-2" />
                        <span className="w-0.5 h-full bg-purple-400 eq-bar-3" />
                      </span>
                    ) : (
                      String(track.number).padStart(2, '0')
                    )}
                  </span>

                  <button
                    onClick={() => onPlayTrack(track, 'v1')}
                    className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-black border border-white/15"
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute inset-0 bg-black/50 flex items-center justify-center transition ${
                        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {active && isPlaying ? (
                        <Pause className="w-4 h-4 text-pink-400 fill-pink-400" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      )}
                    </div>
                  </button>

                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlayTrack(track, 'v1')}>
                    <div className={`text-xs sm:text-sm font-bold truncate ${active ? 'text-pink-400' : 'text-white'}`}>
                      {track.emoji} {track.title}
                    </div>
                    <div className="text-[11px] text-purple-200/70 truncate flex items-center gap-2">
                      <span>{track.artist}</span>
                      <span className="font-mono text-[10px] text-cyan-300/80">{track.bpm} BPM</span>
                      {isOff && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold">
                          OFFLINE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Quick Icons */}
                <div className="col-span-3 flex sm:hidden items-center justify-end gap-1">
                  <button
                    onClick={() => onToggleOffline(track)}
                    disabled={isDl}
                    className={`p-1.5 rounded-lg ${isOff ? 'text-emerald-400' : 'text-cyan-300'}`}
                  >
                    {isDl ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isOff ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <DownloadCloud className="w-4 h-4" />
                    )}
                  </button>
                  <button onClick={() => onLikeTrack(track)} className="p-1.5 rounded-lg">
                    <Heart
                      className={`w-4 h-4 ${track.favorite ? 'fill-pink-500 text-pink-500' : 'text-purple-200'}`}
                    />
                  </button>
                  {onCommentTrack && (
                    <button
                      onClick={() => onCommentTrack(track)}
                      className="p-1.5 rounded-lg text-cyan-300"
                      title="Comentar na faixa"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Album */}
                <div className="hidden md:block md:col-span-2 text-xs text-purple-200/75 truncate">{track.album}</div>

                {/* Duration */}
                <div className="hidden md:block md:col-span-1 text-right pr-2 text-[11px] font-mono text-purple-300/70">
                  {fmtDur(track.durationSec)}
                </div>

                {/* Desktop Clean Action Icons */}
                <div className="hidden sm:flex sm:col-span-5 md:col-span-3 items-center justify-end gap-0.5 relative">
                  <button
                    onClick={() => onToggleOffline(track)}
                    disabled={isDl}
                    className={`p-1.5 rounded-lg hover:bg-white/10 transition ${
                      isOff ? 'text-emerald-400' : 'text-purple-200 hover:text-cyan-300'
                    }`}
                    title={isOff ? 'Salva Offline' : 'Baixar Offline'}
                  >
                    {isDl ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isOff ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <DownloadCloud className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onLikeTrack(track)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition"
                    title="Curtir"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${track.favorite ? 'fill-pink-500 text-pink-500' : 'text-purple-200'}`}
                    />
                  </button>
                  {onCommentTrack && (
                    <button
                      onClick={() => onCommentTrack(track)}
                      className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 transition"
                      title="Comentar nesta música"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setPickerTrackId(pickerTrackId === track.id ? null : track.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition"
                    title="Adicionar à Playlist"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>
                  {onSendToVideo && (
                    <button
                      onClick={() => onSendToVideo(track)}
                      className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 transition"
                      title="Criar Vídeo"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onSetLyricsTrack(track)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 transition"
                    title="Letra"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onShareTrack(track)}
                    className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 transition"
                    title="Compartilhar"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  {mode === 'creator' && (
                    <button
                      onClick={() => onEditTrack(track)}
                      className="p-1.5 rounded-lg hover:bg-pink-500/25 text-pink-300 transition"
                      title="Editar Faixa"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {pickerTrackId === track.id && (
                    <div className="absolute right-0 top-9 z-30 w-48 rounded-xl bg-[#120829] border border-purple-400/40 shadow-2xl p-1.5 space-y-0.5">
                      <div className="text-[10px] font-bold text-purple-300 px-2 py-1 uppercase">Salvar em:</div>
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => {
                            onAddToPlaylist(pl.id, track);
                            setPickerTrackId(null);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-pink-500/25 text-xs text-white flex items-center gap-1.5"
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
      ) : (
        /* FLOATING 3D GRID CARDS (Zero V2 clutter) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filtered.map((track) => {
            const active = currentTrack?.id === track.id;
            const isOff = offlineTrackIds.has(track.id);
            const isDl = downloadingIds.has(track.id);
            return (
              <div
                key={track.id}
                className={`group rounded-2xl cosmic-card-3d p-3 space-y-2.5 ${
                  active ? 'border-pink-500/70 shadow-[0_0_26px_rgba(236,72,153,0.3)]' : ''
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono font-bold text-cyan-300">
                    #{String(track.number).padStart(2, '0')}
                  </span>
                  {isOff && (
                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-500/85 text-[8px] font-extrabold text-black">
                      OFFLINE
                    </span>
                  )}
                  <button
                    onClick={() => onPlayTrack(track, 'v1')}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center shadow-lg transition hover:scale-110"
                  >
                    {active && isPlaying ? (
                      <Pause className="w-4 h-4 text-white fill-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white truncate">
                    {track.emoji} {track.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-purple-200/75">
                    <span>
                      {track.bpm} BPM · {fmtDur(track.durationSec)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleOffline(track)}
                        disabled={isDl}
                        className={`p-1 rounded bg-white/5 hover:bg-emerald-500/25 ${
                          isOff ? 'text-emerald-400' : 'text-cyan-300'
                        }`}
                        title={isOff ? 'Salva Offline' : 'Baixar Offline'}
                      >
                        {isDl ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isOff ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <DownloadCloud className="w-3 h-3" />
                        )}
                      </button>
                      {onSendToVideo && (
                        <button
                          onClick={() => onSendToVideo(track)}
                          className="p-1 rounded bg-white/5 hover:bg-cyan-500/25 text-cyan-300"
                          title="Criar Vídeo"
                        >
                          <Video className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LYRICS MODAL */}
      {lyricsTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3">
          <div className="w-full max-w-xl rounded-3xl cosmic-card-3d neon-border overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={lyricsTrack.coverUrl} alt={lyricsTrack.title} className="w-11 h-11 rounded-xl object-cover" />
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-extrabold text-white truncate">
                    {lyricsTrack.emoji} {lyricsTrack.title}
                  </h3>
                  <p className="text-[11px] text-purple-300">
                    {lyricsTrack.album} · {lyricsTrack.bpm} BPM
                  </p>
                </div>
              </div>
              <button onClick={() => onSetLyricsTrack(null)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {lyricsTrack.sunoPrompt && mode === 'creator' && (
                <div className="rounded-xl bg-purple-950/60 border border-purple-500/30 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Prompt Master</span>
                    <button
                      onClick={() => handleCopyPrompt(lyricsTrack.sunoPrompt)}
                      className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 text-[11px] font-bold flex items-center gap-1"
                    >
                      {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs text-purple-100/90 leading-relaxed">{lyricsTrack.sunoPrompt}</p>
                </div>
              )}

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-pink-300 mb-1.5">Letra Oficial</div>
                <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-purple-50/95 leading-relaxed bg-black/40 rounded-xl p-3.5 border border-white/10">
                  {lyricsTrack.lyrics || 'Letra não cadastrada para esta faixa.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

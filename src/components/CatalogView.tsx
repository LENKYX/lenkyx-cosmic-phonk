import React, { useMemo, useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  QrCode,
  Disc3,
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
} from 'lucide-react';
import { AppMode, AppSettings, AudioVersion, Track, UserPlaylist } from '../types';
import { copyTextReliable, isAndroidApk } from '../utils/androidBridge';

interface Props {
  tracks: Track[];
  settings: AppSettings;
  mode: AppMode;
  searchQuery: string;
  playlists: UserPlaylist[];
  currentTrack: Track | null;
  activeVersion: AudioVersion;
  isPlaying: boolean;
  onPlayTrack: (track: Track, version?: AudioVersion) => void;
  onLikeTrack: (track: Track) => void;
  onShareTrack: (track: Track | null) => void;
  onOpenPix: () => void;
  onSendToDJ: (track: Track, deck: 'A' | 'B') => void;
  onSendToVideo: (track: Track) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onEditTrack: (track: Track) => void;
  onAddTrack: () => void;
  lyricsTrack: Track | null;
  onSetLyricsTrack: (track: Track | null) => void;
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
  activeVersion,
  isPlaying,
  onPlayTrack,
  onLikeTrack,
  onShareTrack,
  onOpenPix,
  onSendToDJ,
  onSendToVideo,
  onAddToPlaylist,
  onEditTrack,
  onAddTrack,
  lyricsTrack,
  onSetLyricsTrack,
  onToast,
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);

  const albums = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => set.add(t.album));
    return ['ALL', 'FAV', ...Array.from(set)];
  }, [tracks]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tracks.filter((t) => {
      if (selectedAlbum === 'FAV' && !t.favorite) return false;
      if (selectedAlbum !== 'ALL' && selectedAlbum !== 'FAV' && t.album !== selectedAlbum) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        String(t.bpm).includes(q) ||
        (t.v2Label || '').toLowerCase().includes(q) ||
        t.lyrics.toLowerCase().includes(q)
      );
    });
  }, [tracks, searchQuery, selectedAlbum]);

  const totalPlays = useMemo(() => tracks.reduce((acc, t) => acc + (t.plays || 0), 0), [tracks]);
  const pctGoal = Math.min(100, (tracks.length / Math.max(1, settings.totalGoal)) * 100);

  const handleCopyPrompt = async (txt: string) => {
    const ok = await copyTextReliable(txt);
    if (ok) {
      setCopiedPrompt(true);
      onToast('Prompt do Suno copiado!');
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      onToast('Não foi possível copiar automaticamente.');
    }
  };

  return (
    <div className="space-y-4 pb-28 md:pb-24">
      {/* COMPACT SPOTIFY / YOUTUBE MUSIC HERO HEADER */}
      <section className="relative rounded-2xl overflow-hidden border border-purple-500/25">
        <div className="relative h-40 sm:h-48 w-full">
          <img
            src="/covers/banner.jpg"
            alt="LENKYX Cosmic Phonk"
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070412] via-[#070412]/70 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070412]/90 via-[#070412]/45 to-transparent" />

          <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <img
                  src="/covers/avatar.jpg"
                  alt="LENKYX"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.6)] shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/35 text-[10px] font-bold text-pink-200 mb-1">
                    <Sparkles className="w-2.5 h-2.5" /> ARTISTA VERIFICADO · {tracks.length} FAIXAS (V1 & V2)
                  </div>
                  <h1 className="font-display text-xl sm:text-2xl font-black tracking-wide text-white truncate">
                    {settings.artistName} <span className="neon-text">{settings.brandSubtitle}</span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-purple-200/80 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                      {totalPlays.toLocaleString('pt-BR')} plays
                    </span>
                    <span>·</span>
                    <span>
                      Meta {tracks.length}/{settings.totalGoal} ({pctGoal.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => tracks[0] && onPlayTrack(tracks[0], 'v1')}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:brightness-110 text-white font-extrabold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Tocar
                </button>
                {!isAndroidApk() && (
                  <a
                    href={settings.apkDownloadUrl || '/download/apk'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_16px_rgba(52,211,153,0.4)] transition active:scale-95"
                    title="Baixar e instalar o Aplicativo Oficial LENKYX no Android"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Baixar App Android
                  </a>
                )}
                <button
                  onClick={() => onShareTrack(null)}
                  className="px-3 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  onClick={onOpenPix}
                  className="px-3 py-2 rounded-full bg-purple-600/30 hover:bg-purple-600/45 border border-pink-400/40 text-pink-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <QrCode className="w-3.5 h-3.5" /> PIX
                </button>
                {mode === 'creator' && (
                  <button
                    onClick={onAddTrack}
                    className="px-3 py-2 rounded-full bg-white text-black hover:bg-purple-100 font-extrabold text-xs flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nova Faixa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER PILLS + VIEW TOGGLE (LIST SPOTIFY vs COMPACT GRID) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {albums.map((alb) => {
            const label = alb === 'ALL' ? `Todas (${tracks.length})` : alb === 'FAV' ? '❤️ Curtidas' : alb;
            const active = selectedAlbum === alb;
            return (
              <button
                key={alb}
                onClick={() => setSelectedAlbum(alb)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  active
                    ? 'bg-white text-black'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-purple-100 border border-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center rounded-lg bg-white/[0.06] border border-white/10 p-0.5">
          <button
            onClick={() => setViewLayout('list')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
              viewLayout === 'list' ? 'bg-pink-500 text-white' : 'text-purple-200 hover:text-white'
            }`}
            title="Visualização Lista (Spotify / YouTube Music)"
          >
            <List className="w-3.5 h-3.5" /> Lista
          </button>
          <button
            onClick={() => setViewLayout('grid')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
              viewLayout === 'grid' ? 'bg-pink-500 text-white' : 'text-purple-200 hover:text-white'
            }`}
            title="Visualização Capas Compactas"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Capas
          </button>
        </div>
      </div>

      {/* SPOTIFY / YOUTUBE MUSIC COMPACT TRACKLIST VIEW */}
      {viewLayout === 'list' ? (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-visible">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
            <div className="col-span-4 pl-2"># · Título</div>
            <div className="col-span-2">Versões (V1 / V2)</div>
            <div className="col-span-2">Álbum</div>
            <div className="col-span-1 text-right pr-2 flex items-center justify-end">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="col-span-3 text-right pr-1">Ações</div>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {filtered.map((track) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`group grid grid-cols-12 gap-2 items-center px-3 py-2 hover:bg-white/[0.06] transition ${
                    active ? 'bg-pink-500/12' : ''
                  }`}
                >
                  {/* # + Cover + Title */}
                  <div className="col-span-8 sm:col-span-5 md:col-span-4 flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-right text-[11px] font-mono text-purple-300/60 shrink-0 hidden sm:inline">
                      {String(track.number).padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10"
                    >
                      <img src={track.coverUrl} alt={track.title} loading="lazy" className="w-full h-full object-cover" />
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
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlayTrack(track)}>
                      <div className={`text-xs sm:text-sm font-bold truncate ${active ? 'text-pink-400' : 'text-white'}`}>
                        {track.emoji} {track.title}
                      </div>
                      <div className="text-[11px] text-purple-300/75 truncate flex items-center gap-1.5">
                        <span>{track.artist}</span>
                        <span className="font-mono text-[10px] text-cyan-300/80">{track.bpm} BPM</span>
                        {track.sunoPrivate && track.isDemoAudio && (
                          <a
                            href={track.sunoUrl || 'https://suno.com/@lenkyx'}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-1.5 py-0.2 rounded bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 text-[9px] font-bold"
                            title="Esta música ainda está privada no Suno — clique para abrir no Suno e deixar Pública (ou suba o WAV no botão Upload)"
                          >
                            PRIVADA NO SUNO ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* V1 / V2 Quick Pills */}
                  <div className="col-span-4 sm:col-span-3 md:col-span-2 flex items-center gap-1">
                    <button
                      onClick={() => onPlayTrack(track, 'v1')}
                      className={`px-2 py-1 rounded-md text-[10px] font-extrabold border transition ${
                        active && activeVersion === 'v1'
                          ? 'bg-pink-500 border-pink-400 text-white'
                          : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/15'
                      }`}
                    >
                      V1
                    </button>
                    {track.audioUrlV2 && (
                      <button
                        onClick={() => onPlayTrack(track, 'v2')}
                        className={`px-2 py-1 rounded-md text-[10px] font-extrabold border truncate max-w-[110px] transition ${
                          active && activeVersion === 'v2'
                            ? 'bg-cyan-400 border-cyan-300 text-black'
                            : 'bg-white/5 border-white/10 text-cyan-200 hover:bg-white/15'
                        }`}
                        title={track.v2Label ? `Versão 2: ${track.v2Label}` : 'Versão 2'}
                      >
                        V2{track.v2Label ? ` · ${track.v2Label}` : ''}
                      </button>
                    )}
                  </div>

                  {/* Album */}
                  <div className="hidden md:block md:col-span-2 text-xs text-purple-300/75 truncate">
                    {track.album}
                  </div>

                  {/* Duration */}
                  <div className="hidden md:block md:col-span-1 text-right pr-2 text-[11px] font-mono text-purple-300/70">
                    {fmtDur(track.durationSec)}
                  </div>

                  {/* Compact Action Icons */}
                  <div className="hidden sm:flex sm:col-span-4 md:col-span-3 items-center justify-end gap-0.5 relative">
                    <button
                      onClick={() => onLikeTrack(track)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition"
                      title="Curtir"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${track.favorite ? 'fill-pink-500 text-pink-500' : 'text-purple-300'}`}
                      />
                    </button>
                    <button
                      onClick={() => setPickerTrackId(pickerTrackId === track.id ? null : track.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-purple-300 hover:text-white transition"
                      title="Adicionar à Playlist"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSendToDJ(track, 'A')}
                      className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 transition"
                      title="Mixar na Mesa de DJ"
                    >
                      <Disc3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSetLyricsTrack(track)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 transition"
                      title="Letra & Prompt Suno"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onShareTrack(track)}
                      className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 transition"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    {mode === 'creator' && (
                      <>
                        <button
                          onClick={() => onEditTrack(track)}
                          className="p-1.5 rounded-lg hover:bg-pink-500/25 text-pink-300 transition"
                          title="Subir WAV V1/V2 ou Editar"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSendToVideo(track)}
                          className="p-1.5 rounded-lg hover:bg-red-500/25 text-red-300 transition"
                          title="Criar Vídeo YouTube / Shorts"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                      </>
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
        </div>
      ) : (
        /* COMPACT SPOTIFY ALBUM-PROPORTION GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((track) => {
            const active = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`group rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border transition p-2.5 space-y-2 ${
                  active ? 'border-pink-500/70 bg-pink-500/10' : 'border-white/10'
                }`}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono font-bold text-cyan-300">
                    #{String(track.number).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => onPlayTrack(track)}
                    className={`absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition ${
                      active && isPlaying
                        ? 'bg-pink-500 scale-105'
                        : 'bg-pink-500 opacity-95 group-hover:scale-110'
                    }`}
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
                  <div className="text-[10px] text-purple-300/75 truncate">
                    {track.bpm} BPM · {fmtDur(track.durationSec)}
                  </div>

                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      onClick={() => onPlayTrack(track, 'v1')}
                      className={`flex-1 py-0.5 rounded text-[9px] font-extrabold border ${
                        active && activeVersion === 'v1'
                          ? 'bg-pink-500 border-pink-400 text-white'
                          : 'bg-white/5 border-white/10 text-purple-200'
                      }`}
                    >
                      V1
                    </button>
                    {track.audioUrlV2 && (
                      <button
                        onClick={() => onPlayTrack(track, 'v2')}
                        className={`flex-1 py-0.5 rounded text-[9px] font-extrabold border ${
                          active && activeVersion === 'v2'
                            ? 'bg-cyan-400 border-cyan-300 text-black'
                            : 'bg-white/5 border-white/10 text-cyan-200'
                        }`}
                      >
                        V2
                      </button>
                    )}
                    <button
                      onClick={() => onSendToDJ(track, 'A')}
                      className="p-1 rounded bg-white/5 hover:bg-cyan-500/25 text-cyan-300"
                      title="DJ"
                    >
                      <Disc3 className="w-3 h-3" />
                    </button>
                    {mode === 'creator' && (
                      <button
                        onClick={() => onEditTrack(track)}
                        className="p-1 rounded bg-white/5 hover:bg-pink-500/25 text-pink-300"
                        title="WAV V1/V2"
                      >
                        <Upload className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LYRICS & SUNO PROMPT MODAL */}
      {lyricsTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3">
          <div className="w-full max-w-xl rounded-2xl glass-panel neon-border overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={lyricsTrack.coverUrl} alt={lyricsTrack.title} className="w-11 h-11 rounded-lg object-cover" />
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-extrabold text-white truncate">
                    {lyricsTrack.emoji} {lyricsTrack.title}
                  </h3>
                  <p className="text-[11px] text-purple-300">
                    {lyricsTrack.album} · {lyricsTrack.bpm} BPM · Tom {lyricsTrack.key}
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      Prompt Master do Suno
                    </span>
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

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
  Bell,
  BellRing,
  Share2,
} from 'lucide-react';
import { AppMode, AppSettings, AudioVersion, Track, UserPlaylist } from '../types';
import { copyTextReliable, isAndroidApk } from '../utils/androidBridge';
import {
  fetchChannelSubscriptions,
  getClientSubscriberId,
  toggleChannelSubscribe,
} from '../utils/communityApi';
import { BailesAndEstiloView } from './BailesAndEstiloView';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';

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
  onInstallApp?: () => void;
  onSendToVideo?: (track: Track) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onToggleOffline: (track: Track) => void;
  onDownloadAllOffline: () => void;
  onEditTrack: (track: Track) => void;
  onAddTrack: () => void;
  lyricsTrack: Track | null;
  onSetLyricsTrack: (track: Track | null) => void;
  onCommentTrack?: (track: Track) => void;
  onOpenGlobalChat?: () => void;
  onSearchWorld?: (query: string) => void;
  onOpenShop?: () => void;
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
  onInstallApp,
  onSendToVideo,
  onAddToPlaylist,
  onToggleOffline,
  onDownloadAllOffline,
  onEditTrack,
  onAddTrack,
  lyricsTrack,
  onSetLyricsTrack,
  onCommentTrack,
  onOpenGlobalChat,
  onSearchWorld,
  onOpenShop,
  onToast,
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'feed' | 'list'>('feed');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);
  const [channelSubscribed, setChannelSubscribed] = useState(false);
  const [channelSubsCount, setChannelSubsCount] = useState(1240);
  const subscriberId = useMemo(() => getClientSubscriberId(), []);

  useEffect(() => {
    void fetchChannelSubscriptions(subscriberId).then((res) => {
      setChannelSubsCount(res.counts['lenkyx-oficial'] || 1240);
      setChannelSubscribed(res.subscribed.includes('lenkyx-oficial'));
    });
  }, [subscriberId]);

  const handleToggleMainChannelSubscribe = async () => {
    const res = await toggleChannelSubscribe({
      channelId: 'lenkyx-oficial',
      channelName: 'MORRO GOLD Oficial',
      subscriberId,
    });
    if (res) {
      setChannelSubscribed(res.subscribed);
      setChannelSubsCount(res.count);
      onToast(
        res.subscribed
          ? `🔔 Fechado com o MORRO GOLD Oficial! (${res.count} inscritos)`
          : 'Inscrição removida'
      );
    }
  };

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
    <div className="space-y-4 pb-36 md:pb-28 cosmic-scene">
      {/* LUXURY FAVELA VIP COMMAND HEADER BAR */}
      <section className="rounded-3xl cosmic-card-3d px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LenkyxEdgeLogo size="lg" className="shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-sm sm:text-base font-black lux-gold-text truncate">
                Salve, Cria! · Baile, Nave & Ostentação
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-[9px] font-black text-amber-200 tracking-wide">
                👑 DE CRIA · TÁ LIGADO 🇧🇷
              </span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
              <span className="text-amber-200/90 font-semibold">{tracks.length} pedradas</span>
              <span className="text-amber-400/50">·</span>
              <span>{totalPlays.toLocaleString('pt-BR')} plays na quebrada</span>
              {offlineCount > 0 && (
                <>
                  <span className="text-amber-400/50">·</span>
                  <span className="text-emerald-300 font-bold">{offlineCount} offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => tracks[0] && onPlayTrack(tracks[0], 'v1')}
            className="px-4 py-2 rounded-full lux-btn-gold font-black text-xs flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-black" /> Soltar o Pancadão
          </button>
          <button
            onClick={onDownloadAllOffline}
            disabled={downloadingAll}
            className="px-3.5 py-2 rounded-full lux-btn-obsidian font-bold text-xs flex items-center gap-1.5"
          >
            {downloadingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
            ) : offlineCount >= tracks.length && tracks.length > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <DownloadCloud className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{offlineCount >= tracks.length && tracks.length > 0 ? 'Tudo Salvo' : 'Baixar Offline'}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleToggleMainChannelSubscribe()}
            className={`px-3.5 py-2 rounded-full font-black text-xs flex items-center gap-1.5 transition ${
              channelSubscribed
                ? 'lux-btn-obsidian text-emerald-200 border-emerald-400/40'
                : 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 text-white shadow-[0_6px_20px_rgba(244,63,94,0.35)] hover:brightness-110'
            }`}
          >
            {channelSubscribed ? <BellRing className="w-3.5 h-3.5 text-emerald-300" /> : <Bell className="w-3.5 h-3.5" />}
            <span>{channelSubscribed ? 'Fechado' : 'Seguir'} · {channelSubsCount}</span>
          </button>
          {mode === 'creator' && (
            <button
              onClick={onAddTrack}
              className="px-3.5 py-2 rounded-full lux-btn-gold font-black text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Nova
            </button>
          )}
        </div>
      </section>

      {/* INTERACTIVE FAVELA OSTENTAÇÃO SHOWCASE (Motos, Carros Nave & Baile VIP na Laje) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onSearchWorld?.('baile de favela mandelao grave pesado')}
          className="group relative h-36 sm:h-40 rounded-3xl overflow-hidden border border-amber-400/35 text-left shadow-[0_14px_34px_rgba(0,0,0,0.7)] hover:border-amber-300 transition"
        >
          <img
            src="/covers/favela-night-skyline.jpg"
            alt="Morro Iluminado"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider">
            🌃 VISÃO DA QUEBRADA
          </span>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition">
              Morro Iluminado & Pancadão
            </div>
            <div className="text-[10px] text-amber-100/85">
              Toca o som de favela pros parça, tá ligado!
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => (onOpenShop ? onOpenShop() : onSearchWorld?.('som automotivo carro moto'))}
          className="group relative h-36 sm:h-40 rounded-3xl overflow-hidden border border-cyan-400/35 text-left shadow-[0_14px_34px_rgba(0,0,0,0.7)] hover:border-cyan-300 transition"
        >
          <img
            src="/covers/ostentacao-motos-carros.jpg"
            alt="Motos e Carros Nave"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-cyan-400 text-black text-[9px] font-black uppercase tracking-wider">
            🏍️ MOTOS & NAVE VIP
          </span>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="text-xs sm:text-sm font-black text-white group-hover:text-cyan-300 transition">
              Hornet, S1000RR & BMW na Pista
            </div>
            <div className="text-[10px] text-cyan-100/85">
              Só foguete e nave chave na Loja dos Cria
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSearchWorld?.('funk verao dj baile piscina brasil')}
          className="group relative h-36 sm:h-40 rounded-3xl overflow-hidden border border-pink-400/35 text-left shadow-[0_14px_34px_rgba(0,0,0,0.7)] hover:border-pink-300 transition"
        >
          <img
            src="/covers/baile-verao-vip.jpg"
            alt="Baile VIP na Laje"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 text-black text-[9px] font-black uppercase tracking-wider">
            🌴 BAILE VIP NA LAJE
          </span>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="text-xs sm:text-sm font-black text-white group-hover:text-pink-300 transition">
              Piscina, Biquíni & Sol no Morro
            </div>
            <div className="text-[10px] text-pink-100/85">
              Resenha dos cria no pôr do sol VIP 🥂
            </div>
          </div>
        </button>
      </section>

      {/* REAL TOP BRASIL ARTISTS STRIP */}
      {onSearchWorld && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            'Henrique & Juliano',
            'Gusttavo Lima',
            'Ana Castela',
            'MC Ryan SP',
            'Matuê',
            'Grupo Menos É Mais',
            'Alok',
            'Marília Mendonça',
            'The Weeknd',
            'Bruno Mars',
          ].map((artistName) => (
            <button
              key={artistName}
              type="button"
              onClick={() => onSearchWorld(artistName)}
              className="px-3.5 py-1.5 rounded-full lux-btn-obsidian hover:border-amber-300 text-xs font-extrabold text-amber-100 whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>{artistName}</span>
            </button>
          ))}
        </div>
      )}

      {/* FILTER PILLS + YOUTUBE/LIST VIEW TOGGLE */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 flex-1 min-w-0">
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

        <div className="inline-flex items-center rounded-xl bg-white/[0.06] border border-white/10 p-0.5 backdrop-blur-md shrink-0">
          <button
            onClick={() => setViewLayout('feed')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
              viewLayout === 'feed' ? 'bg-gradient-to-r from-pink-500 to-cyan-400 text-black font-black' : 'text-purple-200 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Feed
          </button>
          <button
            onClick={() => setViewLayout('list')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
              viewLayout === 'list' ? 'bg-pink-500 text-white' : 'text-purple-200 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Lista
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSearchWorld?.(track.artist);
                        }}
                        className="hover:text-cyan-300 hover:underline truncate"
                      >
                        {track.artist}
                      </button>
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
        /* YOUTUBE-STYLE COSMIC GALAXY FEED CARDS (Dynamic, intuitive, zero clutter) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((track) => {
            const active = currentTrack?.id === track.id;
            const isOff = offlineTrackIds.has(track.id);
            const isDl = downloadingIds.has(track.id);
            return (
              <div
                key={track.id}
                className={`group rounded-2xl cosmic-card-3d overflow-hidden transition duration-200 ${
                  active ? 'border-cyan-400/70 shadow-[0_0_28px_rgba(34,211,238,0.28)]' : 'hover:border-white/25'
                }`}
              >
                {/* 16:9 YouTube-style Cover Stage */}
                <div
                  onClick={() => onPlayTrack(track, 'v1')}
                  className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer"
                >
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-cyan-300">
                      #{String(track.number).padStart(2, '0')}
                    </span>
                    {isOff && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-black text-[9px] font-black">
                        OFFLINE
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                    {fmtDur(track.durationSec)}
                  </span>

                  <div
                    className={`absolute inset-0 flex items-center justify-center transition ${
                      active ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.65)] transition group-hover:scale-110 ${
                        active
                          ? 'bg-gradient-to-r from-pink-500 to-cyan-400 text-black'
                          : 'bg-black/65 backdrop-blur-md border border-white/30 text-white'
                      }`}
                    >
                      {active && isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* YouTube-style Channel Info & Quick Controls */}
                <div className="p-3 flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/10 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {(track.artist || 'L').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      onClick={() => onPlayTrack(track, 'v1')}
                      className={`text-sm font-black truncate cursor-pointer ${
                        active ? 'text-cyan-300' : 'text-white'
                      }`}
                    >
                      {track.emoji} {track.title}
                    </div>
                    <div className="text-[11px] text-slate-300/80 truncate mt-0.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSearchWorld?.(track.artist)}
                        className="hover:text-cyan-300 hover:underline truncate font-semibold"
                      >
                        {track.artist}
                      </button>
                      <span>· {track.bpm} BPM · {(track.plays || 0).toLocaleString('pt-BR')}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleOffline(track)}
                          disabled={isDl}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition ${
                            isOff
                              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                              : 'bg-white/[0.06] hover:bg-white/15 border-white/10 text-cyan-200'
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
                          <span>{isOff ? 'Salva' : 'Baixar'}</span>
                        </button>
                        <button
                          onClick={() => onLikeTrack(track)}
                          className={`p-1.5 rounded-lg border transition ${
                            track.favorite
                              ? 'bg-pink-500/20 border-pink-400/45 text-pink-400'
                              : 'bg-white/[0.06] hover:bg-white/15 border-white/10 text-purple-200'
                          }`}
                          title="Curtir"
                        >
                          <Heart className={`w-3.5 h-3.5 ${track.favorite ? 'fill-pink-500' : ''}`} />
                        </button>
                        {onCommentTrack && (
                          <button
                            onClick={() => onCommentTrack(track)}
                            className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-cyan-500/20 border border-white/10 text-cyan-300 transition"
                            title="Comentar"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSetLyricsTrack(track)}
                          className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/15 border border-white/10 text-purple-200 transition"
                          title="Letra"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 relative">
                        <button
                          onClick={() => setPickerTrackId(pickerTrackId === track.id ? null : track.id)}
                          className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/15 border border-white/10 text-purple-200 transition"
                          title="Adicionar à Playlist"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onShareTrack(track)}
                          className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-emerald-500/20 border border-white/10 text-emerald-300 transition"
                          title="Compartilhar"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        {pickerTrackId === track.id && (
                          <div className="absolute right-0 bottom-9 z-30 w-44 rounded-xl bg-[#120829] border border-purple-400/40 shadow-2xl p-1.5 space-y-0.5">
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

      {/* AGENDA AUTOMÁTICA DE BAILES + CORTES DE CABELO & SALÕES VIP */}
      <BailesAndEstiloView onToast={onToast} />
    </div>
  );
};

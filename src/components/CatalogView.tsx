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
  MoreVertical,
  Trash2,
  Camera,
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
  onCommentTarget?: (id: string, title: string, youtubeId?: string) => void;
  onOpenGlobalChat?: () => void;
  onNavigateTab?: (id: string) => void;
  onSearchWorld?: (query: string) => void;
  onOpenShop?: () => void;
  onDeleteTrack?: (trackId: string) => void;
  onUpdateTrackCover?: (trackId: string, coverUrl: string) => void;
  onUpdateAlbumCover?: (coverUrl: string) => void;
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
  onCommentTarget,
  onNavigateTab,
  onSearchWorld,
  onOpenShop,
  onDeleteTrack,
  onUpdateTrackCover,
  onUpdateAlbumCover,
  onToast,
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'feed' | 'list'>('feed');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pickerTrackId, setPickerTrackId] = useState<string | null>(null);
  const [cardMoreTrackId, setCardMoreTrackId] = useState<string | null>(null);
  const [albumsMoreOpen, setAlbumsMoreOpen] = useState(false);
  const [myMusicFolderOpen, setMyMusicFolderOpen] = useState(false);
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

        </div>
      </section>

      {/* 🗂️ SEUS SETORES — cada um abre sua janela */}
      <section className="rounded-3xl cosmic-card-3d p-4">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300 mb-3">🗂️ Seus Setores · cada um abre sua janela</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {([
            { id: 'catalog', icon: '🏠', label: 'Início', desc: 'Página principal' },
            { id: 'reels', icon: '📺', label: 'Vibe', desc: 'Vídeos curtos' },
            { id: 'radio', icon: '📻', label: 'Rádio do Morro', desc: '24h sem parar' },
            { id: 'explore', icon: '🎵', label: 'Música', desc: 'Catálogo & letras' },
            { id: 'shop', icon: '🛍️', label: 'Loja dos Cria', desc: 'Indicações' },
            { id: 'utils', icon: '🛠️', label: 'Utilidades', desc: 'Emergência & igrejas' },
          ]).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onNavigateTab?.(s.id)}
              className="group rounded-2xl border border-white/12 bg-white/[0.05] hover:border-amber-400/45 hover:bg-amber-400/10 text-left overflow-hidden transition active:scale-95"
            >
              {/* barra da janelinha */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-white/10 bg-white/[0.04]">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                <span className="text-[8.5px] text-slate-300 ml-1 font-bold">janela</span>
              </div>
              <div className="p-2.5 flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <div className="min-w-0">
                  <div className="text-[11px] font-black text-white truncate">{s.label}</div>
                  <div className="text-[9px] text-slate-300 truncate">{s.desc}</div>
                </div>
                <span className="ml-auto text-amber-300 text-xs group-hover:translate-x-0.5 transition">→</span>
              </div>
            </button>
          ))}
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


      {/* LYRICS MODAL */}

      {/* AGENDA AUTOMÁTICA DE BAILES + CORTES DE CABELO & SALÕES VIP */}
      <BailesAndEstiloView
        onToast={onToast}
        onCommentTarget={onCommentTarget}
      />
    </div>
  );
};

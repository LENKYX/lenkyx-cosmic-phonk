import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Tv,
  Plus,
  Search,
  Bell,
  BellOff,
  Play,
  Film,
  Music,
  Smartphone,
  MessageSquare,
  Radio,
  Scale,
  Crown,
  CheckCircle2,
  ArrowLeft,
  Maximize2,
  Minimize2,
  X,
  Upload,
  Trash2,
  MapPin,
  ShieldCheck,
  Edit3,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  CreatorChannel,
  CreatorChannelVideo,
  deleteCreatorChannelVideo,
  fetchCreatorChannels,
  getCommunityAnonId,
  publishCreatorChannelPost,
  publishCreatorChannelVideo,
  saveCreatorChannel,
  toggleChannelSubscribe,
} from '../utils/communityApi';

interface Props {
  onOpenLiveChat: (roomId: string, roomTitle: string) => void;
  onCommentTarget: (targetId: string, title: string, youtubeVideoId?: string) => void;
  onOpenLegalModal: (initialTab?: 'charter' | 'youtube' | 'report', targetTitle?: string) => void;
  onPauseMusic: () => void;
  onToast: (msg: string) => void;
}

const CHANNEL_CATEGORIES = ['Todos', 'Meu Canal', 'Inscritos', 'Funk & Bailes', 'Rap & Trap', 'Pagode', 'Bailes', 'Humor & Vlog'];

const BANNER_PRESETS = [
  '/covers/album-official.jpg',
  '/covers/track-05.jpg',
  '/covers/track-12.jpg',
  '/covers/track-16.jpg',
];

function extractYoutubeId(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m =
    s.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    s.match(/youtube\.com\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

export const CreatorChannelsView: React.FC<Props> = ({
  onOpenLiveChat,
  onCommentTarget,
  onOpenLegalModal,
  onPauseMusic,
  onToast,
}) => {
  const userId = useMemo(() => getCommunityAnonId(), []);
  const [channels, setChannels] = useState<CreatorChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [channelTab, setChannelTab] = useState<'home' | 'videos' | 'shorts' | 'community' | 'about'>('home');

  // Create / Edit Channel Modal
  const [channelFormOpen, setChannelFormOpen] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | undefined>(undefined);
  const [chName, setChName] = useState('');
  const [chHandle, setChHandle] = useState('');
  const [chBio, setChBio] = useState('');
  const [chCategory, setChCategory] = useState('Funk & Bailes');
  const [chLocation, setChLocation] = useState('Favela · Brasil');
  const [chAvatar, setChAvatar] = useState('/covers/morro-gold-emblema-grosso.png');
  const [chBanner, setChBanner] = useState('/covers/album-official.jpg');
  const [savingChannel, setSavingChannel] = useState(false);

  // Publish Video / Short / Audio Modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [vidTitle, setVidTitle] = useState('');
  const [vidDesc, setVidDesc] = useState('');
  const [vidKind, setVidKind] = useState<'video' | 'short' | 'music'>('video');
  const [vidMediaUrl, setVidMediaUrl] = useState('');
  const [vidYoutubeInput, setVidYoutubeInput] = useState('');
  const [vidPoster, setVidPoster] = useState('');
  const [vidOriginalCheck, setVidOriginalCheck] = useState(true);
  const [publishingVid, setPublishingVid] = useState(false);

  // Community post
  const [postText, setPostText] = useState('');
  const [postingCommunity, setPostingCommunity] = useState(false);

  // Active video player (Safe wrapper with Voltar, Aumentar/Reduzir, Comentar, Fechar — NEVER trapped!)
  const [playingItem, setPlayingItem] = useState<{ channel: CreatorChannel; video: CreatorChannelVideo } | null>(null);
  const [playerFullscreen, setPlayerFullscreen] = useState(false);
  const playerWrapRef = React.useRef<HTMLDivElement | null>(null);

  const loadChannels = async () => {
    setLoading(true);
    const list = await fetchCreatorChannels(userId);
    setChannels(list);
    setLoading(false);
  };

  useEffect(() => {
    void loadChannels();
  }, []);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) || null,
    [channels, selectedChannelId]
  );

  const filteredChannels = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return channels.filter((c) => {
      if (catFilter === 'Meu Canal' && !c.isOwner) return false;
      if (catFilter === 'Inscritos' && !c.subscribed) return false;
      if (!['Todos', 'Meu Canal', 'Inscritos'].includes(catFilter) && c.category !== catFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
      );
    });
  }, [channels, catFilter, searchQ]);

  const handleOpenCreateChannel = (existing?: CreatorChannel) => {
    if (existing) {
      setEditingChannelId(existing.id);
      setChName(existing.name);
      setChHandle(existing.handle.replace(/^@/, ''));
      setChBio(existing.bio);
      setChCategory(existing.category || 'Funk & Bailes');
      setChLocation(existing.location || 'Favela · Brasil');
      setChAvatar(existing.avatarUrl || '/covers/morro-gold-emblema-grosso.png');
      setChBanner(existing.bannerUrl || '/covers/album-official.jpg');
    } else {
      setEditingChannelId(undefined);
      setChName('');
      setChHandle('');
      setChBio('');
      setChCategory('Funk & Bailes');
      setChLocation('Favela · Brasil');
      setChAvatar('/covers/morro-gold-emblema-grosso.png');
      setChBanner('/covers/album-official.jpg');
    }
    setChannelFormOpen(true);
  };

  const handleImagePick = (file: File | undefined, target: 'avatar' | 'banner' | 'poster') => {
    if (!file) return;
    if (file.size > 1500000) {
      onToast('Escolha uma imagem menor que 1,5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (target === 'avatar') setChAvatar(dataUrl);
      if (target === 'banner') setChBanner(dataUrl);
      if (target === 'poster') setVidPoster(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFilePick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 4500000) {
      onToast('Para envio rápido no canal, use arquivo até 4,5 MB ou cole um link.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setVidMediaUrl(String(reader.result || ''));
      if (!vidTitle.trim()) {
        setVidTitle(file.name.replace(/\.[^.]+$/, ''));
      }
      onToast('✅ Mídia carregada! Agora clique em Publicar no Canal.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chName.trim()) {
      onToast('Digite o nome do seu Canal.');
      return;
    }
    setSavingChannel(true);
    const saved = await saveCreatorChannel({
      id: editingChannelId,
      ownerId: userId,
      name: chName.trim(),
      handle: chHandle.trim() || chName.trim(),
      bio: chBio.trim(),
      category: chCategory,
      location: chLocation.trim(),
      avatarUrl: chAvatar,
      bannerUrl: chBanner,
      licenseType: 'morro_gold_favela',
    });
    setSavingChannel(false);
    if (saved) {
      setChannelFormOpen(false);
      await loadChannels();
      setSelectedChannelId(saved.id);
      setChannelTab('home');
      onToast(`👑 Canal "${saved.name}" pronto no MORRO GOLD!`);
    } else {
      onToast('Não foi possível salvar o canal.');
    }
  };

  const handleSubscribe = async (ch: CreatorChannel) => {
    const res = await toggleChannelSubscribe({
      channelId: ch.id,
      channelName: ch.name,
      subscriberId: userId,
    });
    if (res) {
      setChannels((prev) =>
        prev.map((item) =>
          item.id === ch.id ? { ...item, subscribed: res.subscribed, subscribersCount: res.count } : item
        )
      );
      onToast(res.subscribed ? `🔔 Inscrito no canal ${ch.name}!` : `Inscrição removida de ${ch.name}.`);
    }
  };

  const handlePublishVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;
    if (!vidTitle.trim()) {
      onToast('Digite um título para o vídeo ou som.');
      return;
    }
    if (!vidOriginalCheck) {
      onToast('Confirme a Declaração Anti-Plágio para publicar.');
      return;
    }
    const ytId = extractYoutubeId(vidYoutubeInput);
    if (!vidMediaUrl.trim() && !ytId) {
      onToast('Envie um arquivo de vídeo/áudio ou cole um link oficial.');
      return;
    }
    setPublishingVid(true);
    const created = await publishCreatorChannelVideo(selectedChannel.id, {
      title: vidTitle.trim(),
      description: vidDesc.trim(),
      kind: vidKind,
      mediaUrl: vidMediaUrl.trim(),
      youtubeId: ytId,
      posterUrl: vidPoster || selectedChannel.bannerUrl,
      originalDeclaration: vidOriginalCheck,
    });
    setPublishingVid(false);
    if (created) {
      setUploadOpen(false);
      setVidTitle('');
      setVidDesc('');
      setVidMediaUrl('');
      setVidYoutubeInput('');
      setVidPoster('');
      await loadChannels();
      onToast('🚀 Publicado no Canal com Selo Original MORRO GOLD!');
    } else {
      onToast('Erro ao publicar no canal.');
    }
  };

  const handlePostCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !postText.trim()) return;
    setPostingCommunity(true);
    const post = await publishCreatorChannelPost(selectedChannel.id, { text: postText.trim() });
    setPostingCommunity(false);
    if (post) {
      setPostText('');
      await loadChannels();
      onToast('💬 Post publicado na aba Comunidade do canal!');
    }
  };

  const handlePlayChannelVideo = (channel: CreatorChannel, video: CreatorChannelVideo) => {
    onPauseMusic();
    setPlayerFullscreen(false);
    setPlayingItem({ channel, video });
  };

  const closePlayerSafe = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    setPlayerFullscreen(false);
    setPlayingItem(null);
  };

  const renderVideoCard = (channel: CreatorChannel, v: CreatorChannelVideo) => (
    <div
      key={v.id}
      className="group rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 overflow-hidden transition flex flex-col"
    >
      <button
        type="button"
        onClick={() => handlePlayChannelVideo(channel, v)}
        className="relative aspect-video bg-black overflow-hidden text-left"
      >
        <img
          src={v.posterUrl || channel.bannerUrl || '/covers/album-official.jpg'}
          alt={v.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex items-center justify-center">
          <span className="w-11 h-11 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </span>
        </div>
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 border border-amber-400/40 text-[9px] font-black text-amber-300 uppercase">
          {v.kind === 'short' ? 'Short' : v.kind === 'music' ? 'Música' : 'Vídeo'}
        </span>
      </button>
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <h4 className="text-xs font-black text-white line-clamp-2">{v.title}</h4>
          {v.description && <p className="text-[11px] text-slate-300/75 line-clamp-2 mt-0.5">{v.description}</p>}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-[10px] text-slate-300">
          <span className="text-emerald-300 font-bold flex items-center gap-1 truncate">
            <ShieldCheck className="w-3 h-3 shrink-0" /> Lei MORRO GOLD
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onCommentTarget(`channel-video:${v.id}`, `📺 ${v.title} — ${channel.name}`, v.youtubeId)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold"
            >
              Comentar
            </button>
            {channel.isOwner && (
              <button
                type="button"
                onClick={async () => {
                  await deleteCreatorChannelVideo(channel.id, v.id);
                  await loadChannels();
                  onToast('Removido do canal.');
                }}
                className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300"
                title="Remover vídeo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1f1035] via-[#110922] to-[#1d1404] border border-amber-400/35 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/45 text-[10px] font-black uppercase tracking-wider text-amber-200">
            <Crown className="w-3.5 h-3.5" /> Canais da Quebrada · Igual ao YouTube
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Canais de Usuários & Criadores MORRO GOLD
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Crie seu próprio Canal com banner, @arroba, vídeos, Shorts, músicas e aba Comunidade — com{' '}
            <strong className="text-amber-300">Selo Original da Favela</strong> e proteção contra plágio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenLegalModal('charter')}
            className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-amber-400/35 text-amber-200 text-xs font-black flex items-center gap-1.5 transition"
          >
            <Scale className="w-4 h-4" /> Lei da Favela & Licenças
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreateChannel()}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black text-xs font-black flex items-center gap-1.5 shadow-[0_0_25px_rgba(251,191,36,0.45)] hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" /> Criar Meu Canal
          </button>
        </div>
      </div>

      {/* Selected Channel Page (YouTube Channel Layout) */}
      {selectedChannel ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSelectedChannelId(null)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-black text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Todos os Canais
            </button>
            <div className="flex items-center gap-2">
              {selectedChannel.isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateChannel(selectedChannel)}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar Canal
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black flex items-center gap-1 shadow"
                  >
                    <Upload className="w-3.5 h-3.5" /> Publicar Vídeo / Short
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Channel Banner + Profile Header */}
          <div className="rounded-3xl overflow-hidden bg-white/[0.04] border border-white/10">
            <div className="h-32 sm:h-48 w-full relative bg-black overflow-hidden">
              <img
                src={selectedChannel.bannerUrl || '/covers/album-official.jpg'}
                alt={selectedChannel.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090514] via-transparent to-black/30" />
            </div>

            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-8 relative z-10">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={selectedChannel.avatarUrl || '/covers/morro-gold-emblema-grosso.png'}
                  alt={selectedChannel.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-amber-400 bg-black shadow-xl shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-white truncate">{selectedChannel.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-[10px] font-black text-amber-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Original Favela
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-bold text-cyan-300">{selectedChannel.handle}</span>
                    <span>· {(selectedChannel.subscribersCount || 0).toLocaleString('pt-BR')} inscritos</span>
                    <span>· {(selectedChannel.videos || []).length} publicações</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-200/80">
                      <MapPin className="w-3 h-3" /> {selectedChannel.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSubscribe(selectedChannel)}
                  className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition ${
                    selectedChannel.subscribed
                      ? 'bg-white/15 text-white border border-white/25'
                      : 'bg-white text-black hover:bg-amber-300'
                  }`}
                >
                  {selectedChannel.subscribed ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                  {selectedChannel.subscribed ? 'Inscrito' : 'Inscrever-se'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLiveChat(`canal-${selectedChannel.id}`, `💬 Chat de ${selectedChannel.name}`)}
                  className="px-3.5 py-2 rounded-full bg-rose-600/85 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" /> Chat do Canal
                </button>
              </div>
            </div>

            {/* Channel Tabs */}
            <div className="px-4 sm:px-6 border-t border-white/10 flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'home', label: 'Início' },
                { id: 'videos', label: `Vídeos (${(selectedChannel.videos || []).filter((v) => v.kind !== 'short').length})` },
                { id: 'shorts', label: `Shorts (${(selectedChannel.videos || []).filter((v) => v.kind === 'short').length})` },
                { id: 'community', label: `Comunidade (${(selectedChannel.communityPosts || []).length})` },
                { id: 'about', label: 'Sobre & Lei da Favela' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChannelTab(t.id as typeof channelTab)}
                  className={`px-3.5 py-3 text-xs font-black whitespace-nowrap border-b-2 transition ${
                    channelTab === t.id
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Tab Content */}
          {(channelTab === 'home' || channelTab === 'videos' || channelTab === 'shorts') && (
            <div className="space-y-4">
              {(() => {
                const all = selectedChannel.videos || [];
                const list =
                  channelTab === 'videos'
                    ? all.filter((v) => v.kind !== 'short')
                    : channelTab === 'shorts'
                      ? all.filter((v) => v.kind === 'short')
                      : all;
                if (list.length === 0) {
                  return (
                    <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 text-center space-y-3">
                      <Film className="w-10 h-10 text-amber-300/70 mx-auto" />
                      <div className="text-sm font-black text-white">Ainda não há publicações nesta aba</div>
                      <p className="text-xs text-slate-300/75">
                        {selectedChannel.isOwner
                          ? 'Clique em "Publicar Vídeo / Short" para estrear seu conteúdo no canal!'
                          : 'Volte em breve ou entre no Chat do Canal para conversar com o criador.'}
                      </p>
                      {selectedChannel.isOwner && (
                        <button
                          type="button"
                          onClick={() => setUploadOpen(true)}
                          className="px-4 py-2 rounded-full bg-amber-400 text-black text-xs font-black inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Publicar Agora
                        </button>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((v) => renderVideoCard(selectedChannel, v))}
                  </div>
                );
              })()}
            </div>
          )}

          {channelTab === 'community' && (
            <div className="space-y-4">
              {selectedChannel.isOwner && (
                <form
                  onSubmit={handlePostCommunity}
                  className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2.5"
                >
                  <div className="text-xs font-black text-amber-300">Publicar novidade na aba Comunidade</div>
                  <textarea
                    rows={2}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="Mande um salve para os inscritos do canal..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={postingCommunity}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-black inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> {postingCommunity ? 'Publicando...' : 'Publicar Post'}
                  </button>
                </form>
              )}

              {(selectedChannel.communityPosts || []).length === 0 ? (
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 text-center text-xs text-slate-300">
                  Nenhuma postagem na Comunidade ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedChannel.communityPosts.map((p) => (
                    <div key={p.id} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={selectedChannel.avatarUrl || '/covers/morro-gold-emblema-grosso.png'}
                          alt={selectedChannel.name}
                          className="w-8 h-8 rounded-full object-cover border border-amber-400/50"
                        />
                        <div>
                          <div className="text-xs font-black text-white">{selectedChannel.name}</div>
                          <div className="text-[10px] text-slate-400">{selectedChannel.handle}</div>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-100 whitespace-pre-line">{p.text}</p>
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt="Post"
                          className="max-h-60 rounded-xl object-contain bg-black/50 border border-white/10"
                        />
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onCommentTarget(`channel-post:${p.id}`, `💬 Post de ${selectedChannel.name}`)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> Comentar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {channelTab === 'about' && (
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 space-y-3 text-xs sm:text-sm text-slate-200">
              <div className="font-black text-white text-base">Sobre {selectedChannel.name}</div>
              <p className="text-slate-300">{selectedChannel.bio}</p>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/35 space-y-1.5">
                <div className="font-black text-amber-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" /> Proteção: Lei Soberana MORRO GOLD · Cultura da Favela
                </div>
                <p className="text-xs text-slate-200">
                  Canal criado na plataforma MORRO GOLD (voltada para a favela). Todo conteúdo original pertence ao
                  criador {selectedChannel.handle} e está protegido contra plágio nos termos da Lei nº 9.610/1998 e da
                  Carta MORRO GOLD.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal('charter')}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-[11px] font-black"
                  >
                    Ver Lei Completa
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal('report', selectedChannel.name)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold"
                  >
                    Reportar Direitos / Plágio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Channel Directory */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Buscar canal, @arroba ou quebrada..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CHANNEL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    catFilter === cat
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-300">Carregando canais da comunidade...</div>
          ) : filteredChannels.length === 0 ? (
            <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 text-center space-y-3">
              <Tv className="w-10 h-10 text-amber-300/70 mx-auto" />
              <div className="text-sm font-black text-white">Nenhum canal encontrado nesse filtro</div>
              <button
                type="button"
                onClick={() => handleOpenCreateChannel()}
                className="px-4 py-2 rounded-full bg-amber-400 text-black text-xs font-black inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Criar o Primeiro Canal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChannels.map((ch) => (
                <div
                  key={ch.id}
                  className="rounded-3xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-amber-400/45 overflow-hidden transition flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChannelId(ch.id);
                      setChannelTab('home');
                    }}
                    className="h-24 w-full relative bg-black overflow-hidden text-left"
                  >
                    <img
                      src={ch.bannerUrl || '/covers/album-official.jpg'}
                      alt={ch.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 text-[9px] font-black text-amber-300 border border-amber-400/35">
                      {ch.category}
                    </span>
                  </button>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={ch.avatarUrl || '/covers/morro-gold-emblema-grosso.png'}
                        alt={ch.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shrink-0 -mt-7 relative z-10 bg-black"
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChannelId(ch.id);
                            setChannelTab('home');
                          }}
                          className="text-left group"
                        >
                          <div className="text-sm font-black text-white group-hover:text-amber-300 truncate flex items-center gap-1">
                            {ch.name}
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </div>
                          <div className="text-[11px] text-cyan-300 truncate">
                            {ch.handle} · {(ch.subscribersCount || 0).toLocaleString('pt-BR')} inscritos
                          </div>
                        </button>
                        <p className="text-xs text-slate-300/80 line-clamp-2 mt-1">{ch.bio}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChannelId(ch.id);
                          setChannelTab('home');
                        }}
                        className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black text-white"
                      >
                        Abrir Canal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubscribe(ch)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                          ch.subscribed ? 'bg-white/15 text-slate-200' : 'bg-amber-400 text-black hover:bg-amber-300'
                        }`}
                      >
                        {ch.subscribed ? 'Inscrito' : 'Inscrever'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === CREATE / EDIT CHANNEL MODAL === */}
      {channelFormOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9996] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
            <form
              onSubmit={handleSaveChannel}
              className="w-full max-w-lg rounded-3xl bg-[#0e081d] border border-amber-400/45 p-5 space-y-3.5 shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  {editingChannelId ? 'Editar Meu Canal' : 'Criar Canal Igual YouTube · MORRO GOLD'}
                </h3>
                <button
                  type="button"
                  onClick={() => setChannelFormOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={chName}
                  onChange={(e) => setChName(e.target.value)}
                  placeholder="Nome do Canal (ex: MC Cria TV)"
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={chHandle}
                  onChange={(e) => setChHandle(e.target.value)}
                  placeholder="@arroba (ex: mccriatv)"
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={chCategory}
                  onChange={(e) => setChCategory(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#150c2b] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {CHANNEL_CATEGORIES.filter((c) => !['Todos', 'Meu Canal', 'Inscritos'].includes(c)).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={chLocation}
                  onChange={(e) => setChLocation(e.target.value)}
                  placeholder="Favela / Cidade"
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <textarea
                rows={2}
                value={chBio}
                onChange={(e) => setChBio(e.target.value)}
                placeholder="Descrição do seu canal, agenda, contatos..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold cursor-pointer text-center">
                  📷 Foto do Canal
                  <input type="file" accept="image/*" onChange={(e) => handleImagePick(e.target.files?.[0], 'avatar')} className="hidden" />
                </label>
                <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold cursor-pointer text-center">
                  🖼️ Capa / Banner
                  <input type="file" accept="image/*" onChange={(e) => handleImagePick(e.target.files?.[0], 'banner')} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-[10px] text-slate-400 shrink-0">Capas rápidas:</span>
                {BANNER_PRESETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setChBanner(b)}
                    className={`w-12 h-8 rounded-lg overflow-hidden border-2 shrink-0 ${
                      chBanner === b ? 'border-amber-400' : 'border-white/10'
                    }`}
                  >
                    <img src={b} alt="Capa" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-100 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Seu canal já nasce protegido pela <strong>Lei Soberana MORRO GOLD (Cultura da Favela)</strong> —
                  você mantém 100% da autoria das suas criações.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingChannel}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-black shadow-lg"
              >
                {savingChannel ? 'Salvando Canal...' : editingChannelId ? 'Salvar Alterações' : '🚀 Criar Meu Canal Agora'}
              </button>
            </form>
          </div>,
          document.body
        )}

      {/* === PUBLISH VIDEO / SHORT / AUDIO TO CHANNEL MODAL === */}
      {uploadOpen && selectedChannel &&
        createPortal(
          <div className="fixed inset-0 z-[9996] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
            <form
              onSubmit={handlePublishVideo}
              className="w-full max-w-lg rounded-3xl bg-[#0e081d] border border-emerald-400/40 p-5 space-y-3.5 shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  Publicar em {selectedChannel.name}
                </h3>
                <button type="button" onClick={() => setUploadOpen(false)} className="p-1.5 rounded-full bg-white/10 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'video', label: '🎬 Vídeo', icon: Film },
                  { id: 'short', label: '📱 Short', icon: Smartphone },
                  { id: 'music', label: '🎵 Música', icon: Music },
                ].map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setVidKind(k.id as 'video' | 'short' | 'music')}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      vidKind === k.id
                        ? 'bg-emerald-400 text-black border-emerald-300'
                        : 'bg-white/5 text-white border-white/15'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                value={vidTitle}
                onChange={(e) => setVidTitle(e.target.value)}
                placeholder="Título da publicação"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
              />

              <textarea
                rows={2}
                value={vidDesc}
                onChange={(e) => setVidDesc(e.target.value)}
                placeholder="Descrição / créditos da quebrada..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400 resize-none"
              />

              <div className="space-y-2">
                <label className="block w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-dashed border-emerald-400/50 text-xs font-bold text-emerald-200 cursor-pointer text-center">
                  {vidMediaUrl ? '✅ Arquivo carregado! Clique para trocar' : '📁 Enviar Vídeo / Áudio do Celular ou PC'}
                  <input type="file" accept="video/*,audio/*" onChange={(e) => handleVideoFilePick(e.target.files?.[0])} className="hidden" />
                </label>
                <input
                  type="text"
                  value={vidYoutubeInput}
                  onChange={(e) => setVidYoutubeInput(e.target.value)}
                  placeholder="Ou cole link oficial / ID do YouTube (ex: youtu.be/...)"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-400/35 text-[11px] text-amber-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vidOriginalCheck}
                  onChange={(e) => setVidOriginalCheck(e.target.checked)}
                  className="mt-0.5 accent-amber-400"
                />
                <span>
                  <strong>Declaração Anti-Plágio:</strong> Confirmo que este conteúdo é criação original minha/da
                  minha equipe ou incorporado oficialmente, sob a <strong>Lei da Favela MORRO GOLD</strong> e Lei nº
                  9.610/1998.
                </span>
              </label>

              <button
                type="submit"
                disabled={publishingVid}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black shadow-lg"
              >
                {publishingVid ? 'Publicando...' : '🚀 Publicar no Canal'}
              </button>
            </form>
          </div>,
          document.body
        )}

      {/* === SAFE CHANNEL VIDEO PLAYER (ALWAYS HAS VOLTAR, REDUZIR, FECHAR — NEVER TRAPS!) === */}
      {playingItem &&
        createPortal(
          <div
            ref={playerWrapRef}
            className={`fixed inset-0 z-[9997] bg-black flex flex-col justify-center ${
              playerFullscreen ? 'p-0' : 'p-0 sm:p-4'
            }`}
          >
            <div
              className={`w-full mx-auto bg-[#070412] flex flex-col overflow-hidden ${
                playerFullscreen
                  ? 'h-[100dvh] rounded-none'
                  : 'h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:max-w-5xl sm:rounded-3xl sm:border sm:border-amber-400/35'
              }`}
            >
              <div className="px-3 sm:px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#0d071b] shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (document.fullscreenElement) {
                        void document.exitFullscreen().catch(() => {});
                        setPlayerFullscreen(false);
                        return;
                      }
                      if (playerFullscreen) {
                        setPlayerFullscreen(false);
                        return;
                      }
                      closePlayerSafe();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black flex items-center gap-1 shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar</span>
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black text-white truncate">{playingItem.video.title}</div>
                    <div className="text-[10px] text-amber-300 truncate">
                      {playingItem.channel.name} ({playingItem.channel.handle}) · Lei MORRO GOLD
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onCommentTarget(
                        `channel-video:${playingItem.video.id}`,
                        `📺 ${playingItem.video.title}`,
                        playingItem.video.youtubeId
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-100 text-xs font-black flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Comentar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (playerFullscreen || document.fullscreenElement) {
                        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
                        setPlayerFullscreen(false);
                      } else {
                        setPlayerFullscreen(true);
                        void playerWrapRef.current?.requestFullscreen?.().catch(() => {});
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/40 text-amber-200 text-xs font-black flex items-center gap-1"
                  >
                    {playerFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{playerFullscreen ? 'Reduzir' : 'Aumentar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={closePlayerSafe}
                    className="px-2.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Fechar
                  </button>
                </div>
              </div>

              <div className="relative w-full bg-black flex-1 min-h-[240px] sm:aspect-video flex items-center justify-center overflow-hidden">
                {playingItem.video.youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${playingItem.video.youtubeId}?autoplay=1&rel=0&playsinline=1&fs=0`}
                    title={playingItem.video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-full h-full border-0"
                  />
                ) : playingItem.video.kind === 'music' || playingItem.video.mediaUrl.startsWith('data:audio') || playingItem.video.mediaUrl.endsWith('.mp3') ? (
                  <div className="p-6 text-center space-y-4 w-full max-w-md">
                    <img
                      src={playingItem.video.posterUrl || playingItem.channel.avatarUrl}
                      alt={playingItem.video.title}
                      className="w-40 h-40 rounded-3xl object-cover mx-auto border-2 border-amber-400 shadow-2xl"
                    />
                    <audio src={playingItem.video.mediaUrl} controls autoPlay className="w-full" />
                  </div>
                ) : (
                  <video
                    src={playingItem.video.mediaUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

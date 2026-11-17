import React, { Suspense, useEffect, useRef, useState } from 'react';
import {
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Radio,
  Video,
  Film,
  Upload,
  Camera,
  Mic,
  MicOff,
  SwitchCamera,
  Send,
  Sparkles,
  Square,
  Play,
  Users,
  X,
} from 'lucide-react';
import { Track, UserProfile } from '../types';
import {
  ChatMessageItem,
  CommunityShortItem,
  LiveRoomItem,
  fetchActiveLives,
  fetchChatMessages,
  fetchCommunityShorts,
  likeCommunityShortItem,
  publishCommunityShort,
  sendChatMessage,
  updateLiveRoom,
} from '../utils/communityApi';
import { TargetCommentsModal } from './CommunityChatModal';

const VideoStudioView = React.lazy(() =>
  import('./VideoStudioView').then((m) => ({ default: m.VideoStudioView }))
);

interface Props {
  tracks: Track[];
  initialTrack: Track | null;
  user: UserProfile | null;
  onPlayTrack: (track: Track) => void;
  onPauseCatalogPlayer: () => void;
  onOpenUserAuth: () => void;
  onToast: (msg: string) => void;
}

type SubTab = 'shorts' | 'live' | 'studio';

export const SocialShortsAndLiveView: React.FC<Props> = ({
  tracks,
  initialTrack,
  user,
  onPlayTrack,
  onPauseCatalogPlayer,
  onOpenUserAuth,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('shorts');

  // === HORIZONTAL SWIPE SHORTS STATE ===
  const [shorts, setShorts] = useState<CommunityShortItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentTarget, setCommentTarget] = useState<{ id: string; title: string } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [newShortTitle, setNewShortTitle] = useState('');
  const [newShortDesc, setNewShortDesc] = useState('');
  const [newShortVideoData, setNewShortVideoData] = useState('');
  const [publishingShort, setPublishingShort] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);

  // === LIVE STREAM STUDIO & WATCH STATE ===
  const [lives, setLives] = useState<LiveRoomItem[]>([]);
  const [watchingLive, setWatchingLive] = useState<LiveRoomItem | null>(null);
  const [isHostingLive, setIsHostingLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState('Live Cosmic Phonk · Conversa & Som');
  const [liveRoomId, setLiveRoomId] = useState('');
  const [liveChatMsgs, setLiveChatMsgs] = useState<ChatMessageItem[]>([]);
  const [liveChatInput, setLiveChatInput] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordingReplay, setRecordingReplay] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    void fetchCommunityShorts().then(setShorts);
    void fetchActiveLives().then(setLives);
  }, []);

  // Poll active lives & live chat when on Live tab
  useEffect(() => {
    if (subTab !== 'live') return;
    const activeRoom = isHostingLive ? liveRoomId : watchingLive?.id || '';
    const tick = () => {
      void fetchActiveLives().then(setLives);
      if (activeRoom) {
        void fetchChatMessages(activeRoom).then(setLiveChatMsgs);
      }
    };
    tick();
    const timer = window.setInterval(tick, 3500);
    return () => window.clearInterval(timer);
  }, [subTab, isHostingLive, liveRoomId, watchingLive?.id]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const scrollToShort = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(shorts.length - 1, nextIdx));
    setActiveIndex(clamped);
    const el = railRef.current;
    if (!el) return;
    const child = el.children[clamped] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleLikeShort = async (s: CommunityShortItem) => {
    setShorts((prev) => prev.map((x) => (x.id === s.id ? { ...x, likes: x.likes + 1 } : x)));
    await likeCommunityShortItem(s.id);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 12 * 1024 * 1024) {
      onToast('Escolha um vídeo curto de até 12 MB para publicar rápido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewShortVideoData(String(reader.result || ''));
      if (!newShortTitle.trim()) {
        setNewShortTitle(f.name.replace(/\.[^.]+$/, '').slice(0, 60));
      }
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const handlePublishShort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortTitle.trim() || publishingShort) return;
    setPublishingShort(true);
    try {
      const created = await publishCommunityShort({
        title: newShortTitle.trim(),
        creatorName: user?.name || 'Criador LENKYX',
        creatorColor: user?.avatarColor || 'from-cyan-400 to-pink-500',
        description: newShortDesc.trim(),
        mediaType: newShortVideoData ? 'video' : 'cosmic_reel',
        videoUrl: newShortVideoData,
        posterUrl: initialTrack?.coverUrl || '/covers/album-official.jpg',
        audioTitle: initialTrack?.title || 'Cosmic Phonk',
      });
      if (created) {
        setShorts((prev) => [created, ...prev]);
        setActiveIndex(0);
        setPublishOpen(false);
        setNewShortTitle('');
        setNewShortDesc('');
        setNewShortVideoData('');
        onToast('🚀 Vídeo curto publicado no feed horizontal!');
      }
    } finally {
      setPublishingShort(false);
    }
  };

  const startLiveCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        void liveVideoRef.current.play().catch(() => {});
      }

      if (!isHostingLive) {
        onPauseCatalogPlayer();
        const created = await updateLiveRoom({
          hostName: user?.name || 'Criador LENKYX',
          hostColor: user?.avatarColor || 'from-rose-500 to-pink-500',
          title: liveTitle.trim() || 'Live Cósmica LENKYX',
          theme: 'Cosmic Phonk Live',
          posterUrl: initialTrack?.coverUrl || '/covers/album-official.jpg',
          isLive: true,
        });
        const rid = created?.id || `live-${Date.now()}`;
        setLiveRoomId(rid);
        setIsHostingLive(true);
        setRecordedBlobUrl('');
        if (created) setLives((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);

        // Start optional replay recorder so creator can save/publish to Shorts!
        try {
          recordedChunksRef.current = [];
          const rec = new MediaRecorder(stream);
          rec.ondataavailable = (ev) => {
            if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
          };
          rec.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            if (blob.size > 0) {
              setRecordedBlobUrl(URL.createObjectURL(blob));
            }
          };
          rec.start(1000);
          mediaRecorderRef.current = rec;
          setRecordingReplay(true);
        } catch {
          // MediaRecorder optional
        }

        onToast('🔴 Você está AO VIVO no Espaço LENKYX! Fãs já podem comentar no chat.');
      }
    } catch {
      onToast('Permita acesso à Câmera e Microfone no navegador/app para entrar ao vivo.');
    }
  };

  const stopLiveStream = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingReplay(false);
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (liveRoomId) {
      await updateLiveRoom({ id: liveRoomId, isLive: false });
      setLives((prev) => prev.filter((l) => l.id !== liveRoomId));
    }
    setIsHostingLive(false);
    onToast('Live encerrada!');
  };

  const toggleMic = () => {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    const next = !micEnabled;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setMicEnabled(next);
  };

  const flipCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (isHostingLive) {
      await startLiveCamera(next);
    }
  };

  const sendLiveHeart = async () => {
    const rid = isHostingLive ? liveRoomId : watchingLive?.id;
    setFloatingHearts((prev) => [...prev.slice(-12), Date.now()]);
    if (rid) {
      await updateLiveRoom({ id: rid, likeDelta: 1 });
      if (watchingLive) {
        setWatchingLive((w) => (w ? { ...w, likes: w.likes + 1 } : w));
      }
    }
  };

  const handleSendLiveChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const rid = isHostingLive ? liveRoomId : watchingLive?.id;
    if (!rid || !liveChatInput.trim()) return;
    const created = await sendChatMessage({
      roomId: rid,
      authorName: user?.name || 'Fã Cósmico',
      authorColor: user?.avatarColor || 'from-cyan-400 to-pink-500',
      message: liveChatInput.trim(),
    });
    if (created) {
      setLiveChatMsgs((prev) => [...prev, created]);
      setLiveChatInput('');
    }
  };

  return (
    <div className="space-y-4 pb-36 md:pb-28">
      {/* Clean Organized Sub-Navigation */}
      <div className="rounded-2xl glass-panel p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('shorts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
              subTab === 'shorts'
                ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow'
                : 'bg-white/[0.06] hover:bg-white/15 text-purple-100'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Vídeos Curtos (Arraste ⬅️➡️)</span>
          </button>
          <button
            onClick={() => setSubTab('live')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
              subTab === 'live'
                ? 'bg-gradient-to-r from-rose-600 to-pink-500 text-white shadow'
                : 'bg-white/[0.06] hover:bg-white/15 text-rose-200'
            }`}
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Ao Vivo / Entrar em Live ({lives.length})</span>
          </button>
          <button
            onClick={() => setSubTab('studio')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
              subTab === 'studio'
                ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black shadow'
                : 'bg-white/[0.06] hover:bg-white/15 text-cyan-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Estúdio Criar Vídeo (9:16 / 16:9)</span>
          </button>
        </div>

        {subTab === 'shorts' && (
          <button
            onClick={() => setPublishOpen((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center gap-1.5 shadow transition"
          >
            <Upload className="w-3.5 h-3.5" /> Publicar Vídeo Curto
          </button>
        )}
      </div>

      {/* === SUB-TAB 1: HORIZONTAL SWIPE SHORT VIDEOS === */}
      {subTab === 'shorts' && (
        <div className="space-y-4">
          {publishOpen && (
            <form
              onSubmit={handlePublishShort}
              className="rounded-3xl cosmic-card-3d p-4 space-y-3 border border-emerald-400/35"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300" /> Postar Novo Vídeo Curto no Feed Horizontal
                </h3>
                <button
                  type="button"
                  onClick={() => setPublishOpen(false)}
                  className="p-1 rounded-full bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={newShortTitle}
                  onChange={(e) => setNewShortTitle(e.target.value)}
                  placeholder="Título do vídeo curto..."
                  className="px-3.5 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  value={newShortDesc}
                  onChange={(e) => setNewShortDesc(e.target.value)}
                  placeholder="Legenda / comentário..."
                  className="px-3.5 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-cyan-200 cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{newShortVideoData ? '✅ Vídeo Carregado!' : 'Escolher Vídeo MP4/WebM (opcional)'}</span>
                  <input type="file" accept="video/*" onChange={handleVideoFileChange} className="hidden" />
                </label>
                <button
                  type="submit"
                  disabled={publishingShort}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black"
                >
                  {publishingShort ? 'Publicando...' : 'Publicar Agora 🚀'}
                </button>
              </div>
            </form>
          )}

          {/* Horizontal Swipe Controls Hint */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <span>⬅️ Arraste os vídeos para o lado ➡️</span>
              <span className="text-purple-300/75 font-normal hidden sm:inline">
                ({activeIndex + 1} de {shorts.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollToShort(activeIndex - 1)}
                disabled={activeIndex <= 0}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white transition"
                title="Vídeo Anterior (Esquerda)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToShort(activeIndex + 1)}
                disabled={activeIndex >= shorts.length - 1}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white transition"
                title="Próximo Vídeo (Direita)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* HORIZONTAL SNAP-X REELS CAROUSEL (Swipe Sideways, NOT Vertical!) */}
          <div
            ref={railRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-1 scroll-smooth"
          >
            {shorts.map((s, idx) => (
              <div
                key={s.id}
                onMouseEnter={() => setActiveIndex(idx)}
                className="snap-center shrink-0 w-[290px] sm:w-[320px] rounded-[28px] overflow-hidden border border-white/15 bg-[#090416] shadow-[0_18px_50px_rgba(0,0,0,0.75)] flex flex-col"
              >
                {/* 9:16 Stage */}
                <div className="relative aspect-[9/14] bg-black overflow-hidden">
                  {s.video_url ? (
                    <video
                      src={s.video_url}
                      poster={s.poster_url}
                      controls
                      playsInline
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : s.youtube_id ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${s.youtube_id}?rel=0&playsinline=1`}
                      title={s.title}
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <>
                      <img
                        src={s.poster_url || '/covers/album-official.jpg'}
                        alt={s.title}
                        className="w-full h-full object-cover scale-105 animate-pulse opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                      <button
                        onClick={() => {
                          const match = tracks[idx % Math.max(1, tracks.length)];
                          if (match) onPlayTrack(match);
                        }}
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-white flex items-center justify-center shadow-[0_0_35px_rgba(236,72,153,0.7)] hover:scale-105 transition"
                        title="Tocar Som deste Reel"
                      >
                        <Play className="w-7 h-7 fill-white ml-0.5" />
                      </button>
                    </>
                  )}

                  {/* Top creator badge */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[10px] font-black text-white truncate">
                      @{s.creator_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/85 text-[9px] font-black text-white">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Floating Side Reactions */}
                  <div className="absolute right-2.5 bottom-4 flex flex-col items-center gap-2.5">
                    <button
                      onClick={() => void handleLikeShort(s)}
                      className="w-11 h-11 rounded-full bg-black/65 backdrop-blur-md border border-pink-400/40 flex flex-col items-center justify-center text-white hover:scale-105 transition"
                      title="Curtir"
                    >
                      <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                      <span className="text-[9px] font-black">{s.likes}</span>
                    </button>
                    <button
                      onClick={() => setCommentTarget({ id: `short:${s.id}`, title: s.title })}
                      className="w-11 h-11 rounded-full bg-black/65 backdrop-blur-md border border-cyan-400/40 flex flex-col items-center justify-center text-white hover:scale-105 transition"
                      title="Comentar neste vídeo"
                    >
                      <MessageCircle className="w-4 h-4 text-cyan-300" />
                      <span className="text-[9px] font-bold">Chat</span>
                    </button>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3.5 space-y-1">
                  <div className="text-xs font-black text-white line-clamp-1">{s.title}</div>
                  <p className="text-[11px] text-purple-200/75 line-clamp-2">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === SUB-TAB 2: GO LIVE IN SPACE + WATCH COMMUNITY LIVES === */}
      {subTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Go Live Studio / Live Viewer */}
          <div className="lg:col-span-7 rounded-3xl cosmic-card-3d p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  {isHostingLive
                    ? '🔴 Você está AO VIVO no Espaço!'
                    : watchingLive
                      ? `🔴 Assistindo: ${watchingLive.title}`
                      : 'Estúdio Ao Vivo — Entre em Live Agora'}
                </h2>
                <p className="text-[11px] text-purple-200/75">
                  Ligue sua câmera, converse ao vivo no chat com os fãs e grave o replay para os Vídeos Curtos!
                </p>
              </div>
              {watchingLive && !isHostingLive && (
                <button
                  onClick={() => setWatchingLive(null)}
                  className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white"
                >
                  Voltar ao Meu Estúdio
                </button>
              )}
            </div>

            {!isHostingLive && !watchingLive && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  placeholder="Título da sua Live (ex: Tocando Cosmic Phonk ao vivo!)"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-rose-400"
                />
                {!user && (
                  <button
                    onClick={onOpenUserAuth}
                    className="text-xs text-cyan-300 underline"
                  >
                    Entre com seu perfil para exibir seu nome na Live
                  </button>
                )}
              </div>
            )}

            {/* Camera / Live Stage */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-rose-500/35 flex items-center justify-center">
              {isHostingLive ? (
                <video
                  ref={liveVideoRef}
                  muted
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : watchingLive ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <img
                    src={watchingLive.poster_url || '/covers/album-official.jpg'}
                    alt={watchingLive.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                  <div className="relative z-10 space-y-2">
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-xs font-black text-white inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" /> AO VIVO AGORA
                    </span>
                    <h3 className="text-lg font-black text-white">{watchingLive.title}</h3>
                    <p className="text-xs text-cyan-200">
                      Host: @{watchingLive.host_name} · Converse no chat ao lado e mande curtidas ❤️!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6">
                  <Camera className="w-12 h-12 mx-auto text-rose-400/80" />
                  <p className="text-xs text-purple-200/80 max-w-sm">
                    Clique em <strong>Entrar Ao Vivo</strong> para ligar câmera + microfone, abrir seu chat da live e gravar o replay.
                  </p>
                  <button
                    onClick={() => void startLiveCamera('user')}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 via-pink-500 to-cyan-500 text-white text-xs font-black shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:brightness-110 transition"
                  >
                    🔴 ENTRAR AO VIVO AGORA
                  </button>
                </div>
              )}

              {/* Live Overlay Badges & Floating Hearts */}
              {(isHostingLive || watchingLive) && (
                <>
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-rose-600 text-[10px] font-black text-white flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> AO VIVO
                    </span>
                    {recordingReplay && (
                      <span className="px-2.5 py-1 rounded-full bg-black/70 text-[10px] font-bold text-emerald-300">
                        ● Gravando Replay
                      </span>
                    )}
                  </div>
                  <div className="absolute right-3 bottom-14 flex flex-col gap-1 pointer-events-none">
                    {floatingHearts.map((id) => (
                      <Heart key={id} className="w-6 h-6 fill-pink-500 text-pink-400 animate-bounce" />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Live Studio Controls */}
            {isHostingLive && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMic}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                      micEnabled
                        ? 'bg-white/10 border-white/15 text-white'
                        : 'bg-rose-500/25 border-rose-400 text-rose-200'
                    }`}
                  >
                    {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    {micEnabled ? 'Mic Ligado' : 'Mic Mudo'}
                  </button>
                  <button
                    onClick={() => void flipCamera()}
                    className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-cyan-300" /> Virar Câmera
                  </button>
                  <button
                    onClick={() => void sendLiveHeart()}
                    className="px-3 py-2 rounded-xl bg-pink-500/20 border border-pink-400/40 text-xs font-bold text-pink-200 flex items-center gap-1"
                  >
                    <Heart className="w-3.5 h-3.5 fill-pink-500" /> Coração
                  </button>
                </div>
                <button
                  onClick={() => void stopLiveStream()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-white" /> Encerrar Live
                </button>
              </div>
            )}

            {/* Replay Preview after ending Live */}
            {!isHostingLive && recordedBlobUrl && (
              <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/40 p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-emerald-200">
                  🎬 Replay da sua Live gravado! Baixe ou publique nos Vídeos Curtos.
                </div>
                <a
                  href={recordedBlobUrl}
                  download={`LENKYX-Live-${Date.now()}.webm`}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-400 text-black text-xs font-black"
                >
                  Baixar Vídeo da Live
                </a>
              </div>
            )}

            {/* Active Lives List */}
            {lives.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Transmissões Ativas Agora ({lives.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lives.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setWatchingLive(l)}
                      className="p-2.5 rounded-2xl bg-white/[0.06] hover:bg-rose-500/15 border border-white/10 text-left flex items-center gap-2.5 transition"
                    >
                      <span className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-400/50 flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4 text-rose-300 animate-pulse" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{l.title}</div>
                        <div className="text-[10px] text-cyan-300 truncate">
                          @{l.host_name} · ❤️ {l.likes}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Chat Panel */}
          <div className="lg:col-span-5 rounded-3xl cosmic-card-3d p-4 flex flex-col h-[460px]">
            <div className="pb-2.5 border-b border-white/10 flex items-center justify-between">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-cyan-300" />
                Chat da Live em Tempo Real
              </div>
              {(watchingLive || isHostingLive) && (
                <button
                  onClick={() => void sendLiveHeart()}
                  className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-[10px] font-black text-pink-200 flex items-center gap-1"
                >
                  <Heart className="w-3 h-3 fill-pink-500" /> Curtir Live
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {!(isHostingLive || watchingLive) ? (
                <div className="py-12 text-center text-xs text-purple-300/75">
                  Entre ao vivo ou escolha uma transmissão para conversar aqui!
                </div>
              ) : liveChatMsgs.length === 0 ? (
                <div className="py-12 text-center text-xs text-purple-300/75">
                  Live iniciada! Mande a primeira mensagem para a galera. 💬
                </div>
              ) : (
                liveChatMsgs.map((m) => (
                  <div key={m.id} className="rounded-xl bg-white/[0.06] px-3 py-2 text-xs">
                    <span className="font-black text-cyan-300 mr-1.5">{m.author_name}:</span>
                    <span className="text-white/95">{m.message}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendLiveChat} className="pt-2 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={liveChatInput}
                onChange={(e) => setLiveChatInput(e.target.value)}
                disabled={!(isHostingLive || watchingLive)}
                placeholder="Comente na live..."
                className="flex-1 px-3 py-2 rounded-full bg-white/[0.07] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!(isHostingLive || watchingLive) || !liveChatInput.trim()}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-cyan-400 text-white text-xs font-black disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === SUB-TAB 3: STUDIO VIDEO CREATOR (9:16 & 16:9) === */}
      {subTab === 'studio' && (
        <Suspense
          fallback={
            <div className="py-16 text-center text-xs text-purple-300 font-semibold">
              Carregando Estúdio de Vídeo...
            </div>
          }
        >
          <VideoStudioView
            tracks={tracks}
            initialTrack={initialTrack}
            onPauseCatalogPlayer={onPauseCatalogPlayer}
            onToast={onToast}
          />
        </Suspense>
      )}

      {/* Target Comments Modal for any Short Video */}
      <TargetCommentsModal
        open={Boolean(commentTarget)}
        onClose={() => setCommentTarget(null)}
        targetId={commentTarget?.id || ''}
        targetTitle={commentTarget?.title || ''}
        user={user}
      />
    </div>
  );
};

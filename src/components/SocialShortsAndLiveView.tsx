import React, { Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Maximize2,
  Minimize2,
  Globe2,
  Search,
  Tv,
  FlipHorizontal2,
  Wand2,
  Zap,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { Track, UserProfile } from '../types';
import {
  ChatMessageItem,
  CommunityShortItem,
  LiveRoomItem,
  fetchActiveLives,
  fetchChatMessages,
  fetchWorldShorts,
  likeCommunityShortItem,
  publishCommunityShort,
  sendChatMessage,
  updateLiveRoom,
} from '../utils/communityApi';
import { TargetCommentsModal } from './CommunityChatModal';
import { LiveSpaceCreatures, SpaceCreatureSpecies } from './LiveSpaceCreatures';
import { CosmicScrollRow } from './CosmicScrollRow';

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
  onOpenTvCast?: (media: {
    title: string;
    artist?: string;
    mode?: 'galaxy' | 'video' | 'shorts' | 'tv';
    youtubeVideoId?: string;
    audioUrl?: string;
    coverUrl?: string;
  }) => void;
  onToast: (msg: string) => void;
}

type SubTab = 'shorts' | 'live' | 'studio';
type LiveEffectId = 'studio_hd' | 'cosmic_aurora' | 'cyber_glitch' | 'jbl_pulse' | 'galaxy_portal';

const SHORT_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: '🌍 Mundo Inteiro' },
  { id: 'phonk', label: '🔥 Phonk & Drift' },
  { id: 'brazil', label: '🇧🇷 Brasil' },
  { id: 'djs', label: '🎧 DJs & Beats' },
  { id: 'space', label: '🚀 Espaço & Galáxia' },
  { id: 'dance', label: '💃 Dança & Pop' },
  { id: 'rock', label: '🎸 Rock & Guitar' },
  { id: 'community', label: '🎬 Só Comunidade' },
];

const LIVE_EFFECTS: { id: LiveEffectId; label: string; desc: string }[] = [
  { id: 'studio_hd', label: '✨ Studio HD', desc: 'Nitidez & contraste profissional' },
  { id: 'cosmic_aurora', label: '🌌 Aurora Cósmica', desc: 'Moldura neon & estrelas' },
  { id: 'cyber_glitch', label: '👾 Cyber Glitch', desc: 'Vibe VHS Phonk Neon' },
  { id: 'jbl_pulse', label: '🔥 Pulse Bass', desc: 'Brilho reativo à sua voz' },
  { id: 'galaxy_portal', label: '🛸 Portal Galáxia', desc: 'Anel orbital holográfico' },
];

function triggerLiveCosmicSfx(kind: 'ship' | 'sub808' | 'laser') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx({ sampleRate: 48000 });
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (kind === 'sub808') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.55);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.start(now);
      osc.stop(now + 0.66);
    } else if (kind === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.start(now);
      osc.stop(now + 0.27);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.45);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.52);
    }
    setTimeout(() => void ctx.close().catch(() => {}), 800);
  } catch {
    // ignore
  }
}

export const SocialShortsAndLiveView: React.FC<Props> = ({
  tracks,
  initialTrack,
  user,
  onPlayTrack,
  onPauseCatalogPlayer,
  onOpenUserAuth,
  onOpenTvCast,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('shorts');

  // === EXCLUSIVE HORIZONTAL SWIPE SHORTS STATE ===
  const [shorts, setShorts] = useState<CommunityShortItem[]>([]);
  const [shortCategory, setShortCategory] = useState('all');
  const [shortSearch, setShortSearch] = useState('');
  const [shortsLoading, setShortsLoading] = useState(false);
  const [exclusiveShortsOpen, setExclusiveShortsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentTarget, setCommentTarget] = useState<{ id: string; title: string } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [newShortTitle, setNewShortTitle] = useState('');
  const [newShortDesc, setNewShortDesc] = useState('');
  const [newShortVideoData, setNewShortVideoData] = useState('');
  const [publishingShort, setPublishingShort] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);

  // === HD LIVE STREAM STUDIO + EFFECTS + AI CREATURES STATE ===
  const [lives, setLives] = useState<LiveRoomItem[]>([]);
  const [watchingLive, setWatchingLive] = useState<LiveRoomItem | null>(null);
  const [isHostingLive, setIsHostingLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState('Live Cosmic Phonk · Conversa & Som HD');
  const [liveRoomId, setLiveRoomId] = useState('');
  const [liveChatMsgs, setLiveChatMsgs] = useState<ChatMessageItem[]>([]);
  const [liveChatInput, setLiveChatInput] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [mirrorCamera, setMirrorCamera] = useState(true); // true = moving head right goes RIGHT on screen!
  const [liveEffect, setLiveEffect] = useState<LiveEffectId>('cosmic_aurora');
  const [creaturesEnabled, setCreaturesEnabled] = useState(true);
  const [creatureQueue, setCreatureQueue] = useState<
    { species: SpaceCreatureSpecies; sender: string; ts: number }[]
  >([]);
  const [audioEnergy, setAudioEnergy] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordingReplay, setRecordingReplay] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState('');
  const [liveResolutionLabel, setLiveResolutionLabel] = useState('HD 1080p');

  const rawVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const mirrorRef = useRef(mirrorCamera);
  mirrorRef.current = mirrorCamera;
  const effectRef = useRef(liveEffect);
  effectRef.current = liveEffect;

  const loadShorts = async (cat = shortCategory, q = shortSearch) => {
    setShortsLoading(true);
    try {
      const list = await fetchWorldShorts(cat, q);
      setShorts(list);
      setActiveIndex(0);
    } finally {
      setShortsLoading(false);
    }
  };

  useEffect(() => {
    void loadShorts('all', '');
    void fetchActiveLives().then(setLives);
  }, []);

  // Keyboard Left/Right navigation for Horizontal Shorts
  useEffect(() => {
    if (subTab !== 'shorts') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') scrollToShort(activeIndex + 1);
      if (e.key === 'ArrowLeft') scrollToShort(activeIndex - 1);
      if (e.key === 'Escape' && exclusiveShortsOpen) setExclusiveShortsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [subTab, activeIndex, shorts.length, exclusiveShortsOpen]);

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

  // Cleanup camera & audio analyser on unmount
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Real-time HD Canvas Compositor Loop (applies EXACT mirror orientation + crisp HD + 5 Cosmic Live Effects!)
  useEffect(() => {
    if (!isHostingLive) return;
    const canvas = liveCanvasRef.current;
    const vid = rawVideoRef.current;
    if (!canvas || !vid) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    const freqBuf = new Uint8Array(new ArrayBuffer(64));

    const stars = Array.from({ length: 28 }, (_, i) => ({
      x: (Math.sin(i * 19.7) * 0.5 + 0.5),
      y: (Math.cos(i * 31.3) * 0.5 + 0.5),
      r: 1.2 + (i % 3) * 0.9,
      sp: 0.2 + (i % 5) * 0.15,
    }));

    const renderFrame = () => {
      phase += 0.035;
      const vw = vid.videoWidth || 1280;
      const vh = vid.videoHeight || 720;
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }

      // Compute mic audio energy for reactive creatures & JBL pulse
      let energy = 0;
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(freqBuf);
        let sum = 0;
        for (let i = 0; i < 20; i++) sum += freqBuf[i];
        energy = Math.min(1, sum / (20 * 180));
      }
      setAudioEnergy((prev) => prev * 0.7 + energy * 0.3);

      const eff = effectRef.current;
      const mirrored = mirrorRef.current;

      ctx.save();
      ctx.clearRect(0, 0, vw, vh);

      // Apply exact mirror orientation so moving head RIGHT moves RIGHT on screen!
      if (mirrored) {
        ctx.translate(vw, 0);
        ctx.scale(-1, 1);
      }

      // Apply Studio HD color grading / effects
      if (eff === 'studio_hd') {
        ctx.filter = 'contrast(1.08) saturate(1.12) brightness(1.05)';
      } else if (eff === 'cyber_glitch') {
        ctx.filter = 'contrast(1.18) saturate(1.35) hue-rotate(-8deg)';
      } else if (eff === 'cosmic_aurora') {
        ctx.filter = 'contrast(1.09) saturate(1.18) brightness(1.04)';
      } else if (eff === 'jbl_pulse') {
        ctx.filter = `contrast(1.12) saturate(${(1.15 + energy * 0.45).toFixed(2)}) brightness(${(
          1.03 +
          energy * 0.12
        ).toFixed(2)})`;
      } else {
        ctx.filter = 'contrast(1.08) saturate(1.15)';
      }

      if (vid.readyState >= 2) {
        ctx.drawImage(vid, 0, 0, vw, vh);
      }
      ctx.restore();
      ctx.filter = 'none';

      // Post-overlays (un-mirrored so badges/effects stay crisp!)
      if (eff === 'cosmic_aurora') {
        const g = ctx.createRadialGradient(vw / 2, vh / 2, vw * 0.28, vw / 2, vh / 2, vw * 0.65);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.75, 'rgba(34,211,238,0.14)');
        g.addColorStop(1, 'rgba(236,72,153,0.34)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, vw, vh);

        ctx.save();
        ctx.fillStyle = '#a5f3fc';
        for (const s of stars) {
          const sx = ((s.x + Math.sin(phase * 0.4 + s.sp) * 0.03 + 1) % 1) * vw;
          const sy = ((s.y + phase * 0.01 * s.sp) % 1) * vh;
          // Keep stars near edges so face stays crystal clear
          if (sx > vw * 0.25 && sx < vw * 0.75 && sy > vh * 0.2 && sy < vh * 0.8) continue;
          ctx.globalAlpha = 0.55 + Math.sin(phase * 2 + s.sp * 6) * 0.35;
          ctx.beginPath();
          ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (eff === 'cyber_glitch') {
        ctx.save();
        ctx.fillStyle = 'rgba(236,72,153,0.08)';
        for (let y = 0; y < vh; y += 6) {
          ctx.fillRect(0, y, vw, 1.5);
        }
        ctx.strokeStyle = 'rgba(34,211,238,0.55)';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, vw - 8, vh - 8);
        ctx.restore();
      } else if (eff === 'jbl_pulse') {
        ctx.save();
        const border = 4 + energy * 16;
        ctx.strokeStyle = `rgba(236,72,153,${(0.4 + energy * 0.55).toFixed(2)})`;
        ctx.lineWidth = border;
        ctx.strokeRect(border / 2, border / 2, vw - border, vh - border);
        ctx.restore();
      } else if (eff === 'galaxy_portal') {
        ctx.save();
        const r = Math.min(vw, vh) * (0.42 + energy * 0.05);
        ctx.strokeStyle = 'rgba(34,211,238,0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([16, 10]);
        ctx.lineDashOffset = -phase * 35;
        ctx.beginPath();
        ctx.arc(vw / 2, vh / 2, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(renderFrame);
    };

    raf = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(raf);
  }, [isHostingLive]);

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
        video: {
          facingMode: mode,
          width: { ideal: 1920, min: 720 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      mediaStreamRef.current = stream;
      setMirrorCamera(mode === 'user');

      const vTrack = stream.getVideoTracks()[0];
      const vSettings = vTrack?.getSettings();
      if (vSettings?.width && vSettings?.height) {
        setLiveResolutionLabel(`${vSettings.width}x${vSettings.height} HD`);
      }

      if (rawVideoRef.current) {
        rawVideoRef.current.srcObject = stream;
        void rawVideoRef.current.play().catch(() => {});
      }

      // Attach live mic audio analyser for reactive AI Creatures & JBL Pulse
      try {
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          await audioCtxRef.current.close().catch(() => {});
        }
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx({ sampleRate: 48000 });
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        src.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      } catch {
        // optional analyser
      }

      if (!isHostingLive) {
        onPauseCatalogPlayer();
        const created = await updateLiveRoom({
          hostName: user?.name || 'Criador LENKYX',
          hostColor: user?.avatarColor || 'from-rose-500 to-pink-500',
          title: liveTitle.trim() || 'Live Cósmica LENKYX HD',
          theme: 'Cosmic Phonk Live HD',
          posterUrl: initialTrack?.coverUrl || '/covers/album-official.jpg',
          isLive: true,
        });
        const rid = created?.id || `live-${Date.now()}`;
        setLiveRoomId(rid);
        setIsHostingLive(true);
        setRecordedBlobUrl('');
        if (created) setLives((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);

        // Start HD Canvas + Mic recording after slight delay so canvas initializes
        setTimeout(() => {
          try {
            const canvasEl = liveCanvasRef.current;
            const recStream = canvasEl
              ? new MediaStream([
                  ...canvasEl.captureStream(30).getVideoTracks(),
                  ...stream.getAudioTracks(),
                ])
              : stream;
            recordedChunksRef.current = [];
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
              ? 'video/webm;codecs=vp9,opus'
              : 'video/webm';
            const rec = new MediaRecorder(recStream, {
              mimeType,
              videoBitsPerSecond: 4_500_000,
              audioBitsPerSecond: 192_000,
            });
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
            // fallback raw stream
          }
        }, 450);

        onToast('🔴 Live HD no ar com efeitos, espelho corrigido e Criaturinhas IA!');
      }
    } catch {
      onToast('Permita acesso à Câmera e Microfone no navegador/app para entrar ao vivo em HD.');
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
    onToast('Live encerrada! Replay em HD pronto abaixo.');
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

  const spawnCreature = async (species: SpaceCreatureSpecies) => {
    const rid = isHostingLive ? liveRoomId : watchingLive?.id;
    setCreatureQueue((prev) => [
      ...prev.slice(-16),
      { species, sender: user?.name || 'Fã', ts: Date.now() },
    ]);
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

  const renderShortsStage = (isExclusiveModal: boolean) => (
    <div className={isExclusiveModal ? 'flex flex-col h-full justify-between gap-2' : 'space-y-3.5'}>
      {/* Exclusive Header Bar when opened as dedicated Full-Focus Mode */}
      {isExclusiveModal && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-black/75 border border-white/15 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExclusiveShortsOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black flex items-center gap-1"
            >
              <Minimize2 className="w-3.5 h-3.5" /> Voltar
            </button>
            <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-pink-400" /> Shorts Mundiais Exclusivos · Arraste ⬅️➡️
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-purple-200">
              {activeIndex + 1} / {shorts.length}
            </span>
            <button
              onClick={() => setExclusiveShortsOpen(false)}
              className="p-1.5 rounded-full bg-red-600/85 hover:bg-red-500 text-white"
              title="Fechar Modo Exclusivo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* World Categories + Search */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-2.5 space-y-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1">
            {SHORT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setShortCategory(c.id);
                  void loadShorts(c.id, shortSearch);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition ${
                  shortCategory === c.id
                    ? 'bg-gradient-to-r from-pink-500 to-cyan-400 text-black shadow'
                    : 'bg-white/[0.07] hover:bg-white/15 text-purple-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {!isExclusiveModal && (
            <button
              onClick={() => setExclusiveShortsOpen(true)}
              className="px-3 py-1.5 rounded-full bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-[11px] font-black flex items-center gap-1.5 shrink-0"
              title="Abrir só os vídeos curtos em tela exclusiva"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Abrir Tela Exclusiva
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void loadShorts(shortCategory, shortSearch);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-cyan-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={shortSearch}
              onChange={(e) => setShortSearch(e.target.value)}
              placeholder="Buscar vídeos curtos do mundo inteiro (ex: drift japonês, funk brasil, DJ, espaço)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/45 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-black text-white"
          >
            {shortsLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      {/* Horizontal Swipe Controls */}
      <div className="flex items-center justify-between gap-2 px-1 shrink-0">
        <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
          <span>⬅️ Arraste os vídeos para o lado ➡️</span>
          <span className="text-purple-300/75 font-normal">
            ({shorts.length > 0 ? activeIndex + 1 : 0} de {shorts.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => void loadShorts(shortCategory, shortSearch)}
            disabled={shortsLoading}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-emerald-300 flex items-center gap-1 transition"
            title="Buscar novos vídeos curtos agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${shortsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
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

      {/* HORIZONTAL SNAP-X EXCLUSIVE REELS CAROUSEL WITH TRANSLUCENT FLOATING ◀▶ ARROWS */}
      {shortsLoading && shorts.length === 0 ? (
        <div className="py-16 text-center text-xs text-cyan-300 font-bold">
          🌍 Buscando vídeos curtos do mundo inteiro...
        </div>
      ) : (
        <div className={`relative group/shorts ${isExclusiveModal ? 'flex-1 flex items-center' : ''}`}>
          {/* Translucent Floating Left Arrow */}
          <button
            type="button"
            onClick={() => scrollToShort(activeIndex - 1)}
            disabled={activeIndex <= 0}
            aria-label="Vídeo curto anterior"
            className="flex items-center justify-center absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-24 rounded-2xl bg-black/45 hover:bg-black/80 disabled:opacity-25 backdrop-blur-md border border-white/25 text-white shadow-[0_0_25px_rgba(0,0,0,0.8)] transition active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            ref={railRef}
            className={`flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 px-12 sm:px-14 scroll-smooth w-full ${
              isExclusiveModal ? 'items-center' : ''
            }`}
          >
            {shorts.map((s, idx) => (
            <div
              key={s.id}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`snap-center shrink-0 rounded-[28px] overflow-hidden border border-white/15 bg-[#090416] shadow-[0_18px_50px_rgba(0,0,0,0.75)] flex flex-col ${
                isExclusiveModal ? 'w-[300px] sm:w-[350px] max-h-[72dvh]' : 'w-[285px] sm:w-[320px]'
              }`}
            >
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

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-white truncate max-w-[190px]">
                    @{s.creator_name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/85 text-[9px] font-black text-white">
                    #{idx + 1}
                  </span>
                </div>

                {/* Floating Side Reactions */}
                <div className="absolute right-2.5 bottom-4 flex flex-col items-center gap-2">
                  <button
                    onClick={() => void handleLikeShort(s)}
                    className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-pink-400/40 flex flex-col items-center justify-center text-white hover:scale-105 transition"
                    title="Curtir"
                  >
                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                    <span className="text-[9px] font-black">{s.likes}</span>
                  </button>
                  <button
                    onClick={() => setCommentTarget({ id: `short:${s.id}`, title: s.title })}
                    className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/40 flex flex-col items-center justify-center text-white hover:scale-105 transition"
                    title="Comentar"
                  >
                    <MessageCircle className="w-4 h-4 text-cyan-300" />
                    <span className="text-[9px] font-bold">Chat</span>
                  </button>
                  {onOpenTvCast && (
                    <button
                      onClick={() =>
                        onOpenTvCast({
                          title: s.title,
                          artist: s.creator_name,
                          mode: 'shorts',
                          youtubeVideoId: s.youtube_id,
                          audioUrl: s.video_url,
                          coverUrl: s.poster_url,
                        })
                      }
                      className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-emerald-400/45 flex flex-col items-center justify-center text-emerald-300 hover:scale-105 transition"
                      title="Passar vídeo para a Smart TV"
                    >
                      <Tv className="w-4 h-4" />
                      <span className="text-[8px] font-black">TV</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 space-y-1">
                <div className="text-xs font-black text-white line-clamp-1">{s.title}</div>
                <p className="text-[11px] text-purple-200/75 line-clamp-2">{s.description}</p>
              </div>
            </div>
          ))}
          </div>

          {/* Translucent Floating Right Arrow */}
          <button
            type="button"
            onClick={() => scrollToShort(activeIndex + 1)}
            disabled={activeIndex >= shorts.length - 1}
            aria-label="Próximo vídeo curto"
            className="flex items-center justify-center absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-24 rounded-2xl bg-black/45 hover:bg-black/80 disabled:opacity-25 backdrop-blur-md border border-white/25 text-white shadow-[0_0_25px_rgba(0,0,0,0.8)] transition active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-36 md:pb-28">
      {/* Hidden source video element for HD Canvas compositor */}
      <video ref={rawVideoRef} muted autoPlay playsInline className="hidden" />

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
            <span>Vídeos Curtos Mundiais (⬅️➡️)</span>
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
            <span>Ao Vivo HD & Criaturinhas IA ({lives.length})</span>
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
            <span>Estúdio Criar Vídeo</span>
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

      {/* === SUB-TAB 1: EXCLUSIVE HORIZONTAL WORLD SHORTS === */}
      {subTab === 'shorts' && (
        <div className="space-y-4">
          {publishOpen && (
            <form
              onSubmit={handlePublishShort}
              className="rounded-3xl cosmic-card-3d p-4 space-y-3 border border-emerald-400/35"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300" /> Postar Novo Vídeo Curto no Feed Global
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

          {!exclusiveShortsOpen && renderShortsStage(false)}
        </div>
      )}

      {/* === EXCLUSIVE FULL-FOCUS SHORTS MODAL === */}
      {exclusiveShortsOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9992] bg-[#04010c]/96 backdrop-blur-xl p-3 sm:p-5 flex flex-col">
            {renderShortsStage(true)}
          </div>,
          document.body
        )}

      {/* === SUB-TAB 2: HD GO LIVE + MIRROR FIX + EFFECTS + AI SPACE CREATURES === */}
      {subTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 rounded-3xl cosmic-card-3d p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  {isHostingLive
                    ? `🔴 AO VIVO (${liveResolutionLabel})`
                    : watchingLive
                      ? `🔴 Assistindo: ${watchingLive.title}`
                      : 'Estúdio Ao Vivo HD — Câmera Corrigida & Efeitos'}
                </h2>
                <p className="text-[11px] text-purple-200/75">
                  Câmera em HD com direção corrigida (virou à direita, vai pra direita), efeitos visuais e criaturinhas IA na borda!
                </p>
              </div>
              {watchingLive && !isHostingLive && (
                <button
                  onClick={() => setWatchingLive(null)}
                  className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white"
                >
                  Voltar ao Estúdio
                </button>
              )}
            </div>

            {!isHostingLive && !watchingLive && (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  placeholder="Título da sua Live HD..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-rose-400"
                />
                {!user && (
                  <button onClick={onOpenUserAuth} className="text-xs text-cyan-300 underline">
                    Entre com seu perfil para exibir seu nome na Live
                  </button>
                )}
              </div>
            )}

            {/* HD Camera / Live Compositor Stage + AI Space Creatures Layer */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-rose-500/40 flex items-center justify-center">
              {isHostingLive ? (
                <canvas ref={liveCanvasRef} className="w-full h-full object-cover" />
              ) : watchingLive ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <img
                    src={watchingLive.poster_url || '/covers/album-official.jpg'}
                    alt={watchingLive.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                  <div className="relative z-10 space-y-2">
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-xs font-black text-white inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" /> AO VIVO
                    </span>
                    <h3 className="text-lg font-black text-white">{watchingLive.title}</h3>
                    <p className="text-xs text-cyan-200">
                      Host: @{watchingLive.host_name} · Solte Criaturinhas Espaciais IA abaixo!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6">
                  <Camera className="w-12 h-12 mx-auto text-rose-400/80" />
                  <p className="text-xs text-purple-200/80 max-w-sm">
                    Transmissão em <strong>Full HD</strong> com espelho calibrado para o mesmo lado, 5 efeitos visuais e
                    criaturinhas IA interativas!
                  </p>
                  <button
                    onClick={() => void startLiveCamera('user')}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 via-pink-500 to-cyan-500 text-white text-xs font-black shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:brightness-110 transition"
                  >
                    🔴 ENTRAR AO VIVO EM HD
                  </button>
                </div>
              )}

              {/* Autonomous AI Space Creatures Layer (stays on edges, never blocks face!) */}
              {(isHostingLive || watchingLive) && (
                <LiveSpaceCreatures
                  enabled={creaturesEnabled}
                  audioEnergy={audioEnergy}
                  spawnQueue={creatureQueue}
                />
              )}

              {(isHostingLive || watchingLive) && (
                <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-[10px] font-black text-white flex items-center gap-1 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> AO VIVO · {liveResolutionLabel}
                  </span>
                  {recordingReplay && (
                    <span className="px-2.5 py-1 rounded-full bg-black/75 text-[10px] font-bold text-emerald-300">
                      ● Gravando HD
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Live Effects + Camera Direction + AI Creatures + Beat Drops Controls */}
            {isHostingLive && (
              <div className="space-y-3">
                {/* Camera & Direction Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={toggleMic}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                        micEnabled
                          ? 'bg-white/10 border-white/15 text-white'
                          : 'bg-rose-500/25 border-rose-400 text-rose-200'
                      }`}
                    >
                      {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      {micEnabled ? 'Mic HD' : 'Mudo'}
                    </button>
                    <button
                      onClick={() => void flipCamera()}
                      className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5"
                    >
                      <SwitchCamera className="w-3.5 h-3.5 text-cyan-300" /> Virar Câmera
                    </button>
                    <button
                      onClick={() => setMirrorCamera((v) => !v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                        mirrorCamera
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100'
                          : 'bg-white/10 border-white/15 text-purple-200'
                      }`}
                      title="Quando ligado, mover a cabeça para a direita vai para o lado direito da tela!"
                    >
                      <FlipHorizontal2 className="w-3.5 h-3.5" />
                      {mirrorCamera ? 'Mesmo Lado: ON' : 'Mesmo Lado: OFF'}
                    </button>
                  </div>

                  <button
                    onClick={() => void stopLiveStream()}
                    className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" /> Encerrar Live
                  </button>
                </div>

                {/* Live Visual Effects Picker */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                    <Wand2 className="w-3.5 h-3.5" /> Efeitos Visuais da Live
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LIVE_EFFECTS.map((ef) => (
                      <button
                        key={ef.id}
                        onClick={() => setLiveEffect(ef.id)}
                        title={ef.desc}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                          liveEffect === ef.id
                            ? 'bg-gradient-to-r from-pink-500/40 to-cyan-500/40 border-cyan-400 text-white'
                            : 'bg-white/[0.05] border-white/10 text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        {ef.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Cosmic Drops (Synthesized SFX!) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 flex items-center gap-1 mr-1">
                    <Zap className="w-3.5 h-3.5" /> Efeitos Sonoros DJ:
                  </span>
                  <button
                    onClick={() => triggerLiveCosmicSfx('ship')}
                    className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/35"
                  >
                    🚀 Nave
                  </button>
                  <button
                    onClick={() => triggerLiveCosmicSfx('sub808')}
                    className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-[11px] font-bold text-pink-200 hover:bg-pink-500/35"
                  >
                    💥 Grave 808
                  </button>
                  <button
                    onClick={() => triggerLiveCosmicSfx('laser')}
                    className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-[11px] font-bold text-purple-200 hover:bg-purple-500/35"
                  >
                    ⚡ Laser Phonk
                  </button>
                </div>
              </div>
            )}

            {/* AI Space Creatures Spawner Bar (works for both Host and Viewers!) */}
            {(isHostingLive || watchingLive) && (
              <div className="rounded-2xl bg-white/[0.05] border border-cyan-400/30 p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span className="text-[11px] font-black text-white">
                    Criaturinhas Espaciais IA (Orbitam as bordas · toque nelas!):
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setCreaturesEnabled((v) => !v)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      creaturesEnabled
                        ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200'
                        : 'bg-white/10 border-white/15 text-purple-300'
                    }`}
                  >
                    {creaturesEnabled ? 'IA: ON' : 'IA: OFF'}
                  </button>
                  <button
                    onClick={() => void spawnCreature('astro')}
                    className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/45 text-[11px] font-bold text-white hover:scale-105 transition"
                  >
                    +🛸 Astro
                  </button>
                  <button
                    onClick={() => void spawnCreature('phonkbot')}
                    className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/45 text-[11px] font-bold text-white hover:scale-105 transition"
                  >
                    +👾 PhonkBot
                  </button>
                  <button
                    onClick={() => void spawnCreature('starpuff')}
                    className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/45 text-[11px] font-bold text-white hover:scale-105 transition"
                  >
                    +🌟 StarPuff
                  </button>
                  <button
                    onClick={() => void spawnCreature('cosmiccat')}
                    className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/45 text-[11px] font-bold text-white hover:scale-105 transition"
                  >
                    +👽 Amigo IA
                  </button>
                </div>
              </div>
            )}

            {/* Replay Preview after ending Live */}
            {!isHostingLive && recordedBlobUrl && (
              <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/40 p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-emerald-200">
                  🎬 Replay HD da sua Live gravado (com efeitos e direção corrigida)!
                </div>
                <a
                  href={recordedBlobUrl}
                  download={`LENKYX-Live-HD-${Date.now()}.webm`}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-400 text-black text-xs font-black"
                >
                  Baixar Vídeo HD
                </a>
              </div>
            )}

            {/* Active Lives Horizontal Row with Translucent ◀▶ Arrows */}
            {lives.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <CosmicScrollRow
                  title={
                    <>
                      <Users className="w-3.5 h-3.5 text-rose-300" />
                      <span className="text-rose-300">Transmissões Ativas Agora</span>
                    </>
                  }
                  count={lives.length}
                  gridToggleable={false}
                >
                  {lives.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setWatchingLive(l)}
                      className="w-60 shrink-0 p-2.5 rounded-2xl bg-white/[0.06] hover:bg-rose-500/15 border border-white/10 text-left flex items-center gap-2.5 transition"
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
                </CosmicScrollRow>
              </div>
            )}
          </div>

          {/* Right: Live Chat Panel */}
          <div className="lg:col-span-5 rounded-3xl cosmic-card-3d p-4 flex flex-col h-[500px]">
            <div className="pb-2.5 border-b border-white/10 flex items-center justify-between">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-cyan-300" />
                Chat da Live em Tempo Real
              </div>
              {(watchingLive || isHostingLive) && (
                <button
                  onClick={() => void spawnCreature('astro')}
                  className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-black text-cyan-200 flex items-center gap-1"
                >
                  🛸 Mandar Companheiro IA
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {!(isHostingLive || watchingLive) ? (
                <div className="py-12 text-center text-xs text-purple-300/75">
                  Entre ao vivo em HD ou escolha uma transmissão para conversar aqui!
                </div>
              ) : liveChatMsgs.length === 0 ? (
                <div className="py-12 text-center text-xs text-purple-300/75">
                  Live iniciada! Mande a primeira mensagem ou solte uma criaturinha IA. 💬
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

      {/* === SUB-TAB 3: STUDIO VIDEO CREATOR === */}
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

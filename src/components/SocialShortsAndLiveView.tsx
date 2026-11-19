import React, { Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
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
  Eye,
  EyeOff,
  Repeat,
  SkipForward,
  Headphones,
  ArrowLeft,
  Bell,
  BellRing,
  Plus,
} from 'lucide-react';
import { Track, UserProfile } from '../types';
import {
  ChatMessageItem,
  CommunityShortItem,
  LiveRoomItem,
  fetchActiveLives,
  fetchChatMessages,
  fetchWorldShorts,
  fetchChannelSubscriptions,
  getClientSubscriberId,
  normalizeChannelKey,
  toggleChannelSubscribe,
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
  initialAction?: 'shorts' | 'create_reel' | 'go_live';
  actionNonce?: number;
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
  { id: 'all', label: '🌍 Todos Canais' },
  { id: 'viral', label: '🔥 Virais Hoje' },
  { id: 'humor', label: '😂 Humor & Memes' },
  { id: 'games', label: '🎮 Games' },
  { id: 'football', label: '⚽ Futebol' },
  { id: 'cinema', label: '🎬 Cinema & Animes' },
  { id: 'music', label: '🎵 Música' },
  { id: 'phonk', label: '⚡ Phonk & Drift' },
  { id: 'brazil', label: '🇧🇷 Brasil' },
  { id: 'tech', label: '🚗 Tech & Carros' },
  { id: 'live', label: '🔴 Ao Vivo Agora' },
  { id: 'djs', label: '🎧 DJs & Beats' },
  { id: 'space', label: '🚀 Espaço' },
  { id: 'community', label: '📱 Comunidade' },
];

const LIVE_EFFECTS: { id: LiveEffectId; label: string; desc: string }[] = [
  { id: 'studio_hd', label: '✨ Studio HD', desc: 'Nitidez & contraste profissional' },
  { id: 'cosmic_aurora', label: '🌌 Aurora Cósmica', desc: 'Moldura neon & estrelas' },
  { id: 'cyber_glitch', label: '👾 Cyber Glitch', desc: 'Vibe VHS Phonk Neon' },
  { id: 'jbl_pulse', label: '🔥 Pulse Bass', desc: 'Brilho reativo à sua voz' },
  { id: 'galaxy_portal', label: '🛸 Portal Galáxia', desc: 'Anel orbital holográfico' },
];

// Official YouTube IFrame Player API loader + Individual Short Player with auto-advance & error skip
declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayerHandle }) => void;
            onStateChange?: (e: { data: number; target: YTPlayerHandle }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayerHandle;
      PlayerState?: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerHandle {
  playVideo?: () => void;
  seekTo?: (sec: number, allowSeekAhead?: boolean) => void;
  destroy?: () => void;
}

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
    window.setTimeout(resolve, 4500);
  });
  return ytApiPromise;
}

const YouTubeShortPlayer: React.FC<{
  videoId: string;
  loopOne: boolean;
  onEnded: () => void;
  onUnavailable: () => void;
}> = ({ videoId, loopOne, onEnded, onUnavailable }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerHandle | null>(null);
  const [paused, setPaused] = useState(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onUnavailRef = useRef(onUnavailable);
  onUnavailRef.current = onUnavailable;
  const loopRef = useRef(loopOne);
  loopRef.current = loopOne;

  useEffect(() => {
    let destroyed = false;
    let player: YTPlayerHandle | null = null;
    setPaused(false);

    loadYouTubeIframeApi().then(() => {
      if (destroyed || !hostRef.current) return;
      hostRef.current.innerHTML = '';
      const mount = document.createElement('div');
      mount.style.width = '100%';
      mount.style.height = '100%';
      hostRef.current.appendChild(mount);

      if (!window.YT?.Player) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1`;
        iframe.allow = 'autoplay; encrypted-media; fullscreen';
        iframe.allowFullscreen = true;
        iframe.className = 'w-full h-full border-0';
        mount.replaceWith(iframe);
        return;
      }

      player = new window.YT.Player(mount, {
        videoId,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (ev) => {
            playerRef.current = ev.target;
            try {
              ev.target.playVideo?.();
            } catch {
              // ignore
            }
          },
          onStateChange: (ev) => {
            if (ev.data === 1) setPaused(false);
            else if (ev.data === 2) setPaused(true);
            else if (ev.data === 0) {
              if (loopRef.current) {
                ev.target.seekTo?.(0, true);
                ev.target.playVideo?.();
              } else {
                onEndedRef.current();
              }
            }
          },
          onError: () => {
            onUnavailRef.current();
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      destroyed = true;
      playerRef.current = null;
      try {
        player?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, [videoId]);

  const toggleShortPlay = () => {
    const p = playerRef.current as (YTPlayerHandle & { pauseVideo?: () => void }) | null;
    if (!p) return;
    if (paused) {
      p.playVideo?.();
      setPaused(false);
    } else {
      p.pauseVideo?.();
      setPaused(true);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={hostRef} className="w-full h-full bg-black" />
      <button
        type="button"
        onClick={toggleShortPlay}
        aria-label={paused ? 'Continuar Reel' : 'Pausar Reel'}
        className={`absolute inset-0 z-10 flex items-center justify-center transition ${
          paused ? 'bg-black/55 backdrop-blur-sm' : 'bg-transparent'
        }`}
      >
        {paused && (
          <span className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.65)]">
            <Play className="w-7 h-7 fill-black ml-0.5" />
          </span>
        )}
      </button>
    </div>
  );
};

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
  initialAction,
  actionNonce = 0,
  onPlayTrack,
  onPauseCatalogPlayer,
  onOpenUserAuth,
  onOpenTvCast,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('shorts');
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  const subscriberId = getClientSubscriberId(user?.id);

  useEffect(() => {
    void fetchChannelSubscriptions(subscriberId).then((res) => {
      setChannelCounts(res.counts || {});
      setSubscribedChannels(new Set(res.subscribed || []));
    });
  }, [subscriberId]);

  const handleToggleSubscribe = async (channelName: string) => {
    const key = normalizeChannelKey(channelName);
    const res = await toggleChannelSubscribe({
      channelId: key,
      channelName: channelName || 'LENKYX Oficial',
      subscriberId,
    });
    if (res) {
      setChannelCounts((prev) => ({ ...prev, [res.channelId]: res.count }));
      setSubscribedChannels((prev) => {
        const next = new Set(prev);
        if (res.subscribed) next.add(res.channelId);
        else next.delete(res.channelId);
        return next;
      });
      onToast(
        res.subscribed
          ? `🔔 Inscrito no canal ${res.channelName}! (${res.count} inscritos)`
          : `Inscrição removida de ${res.channelName}`
      );
    }
  };

  // === YOUTUBE SHORTS STYLE INDIVIDUAL VERTICAL REELS STATE ===
  const [shorts, setShorts] = useState<CommunityShortItem[]>([]);
  const [shortCategory, setShortCategory] = useState('all');
  const [shortSearch, setShortSearch] = useState('');
  const [shortsMenuOpen, setShortsMenuOpen] = useState(false);
  const [shortsLoading, setShortsLoading] = useState(false);
  const [exclusiveShortsOpen, setExclusiveShortsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoAdvanceShorts, setAutoAdvanceShorts] = useState(true);
  const [loopCurrentShort, setLoopCurrentShort] = useState(false);
  const [zenShortMode, setZenShortMode] = useState(false);
  const [leftOverlayOpen, setLeftOverlayOpen] = useState(false);
  const leftOverlayTimerRef = useRef<number | null>(null);
  const seenReelIdsRef = useRef<string[]>(
    (() => {
      try {
        const raw = localStorage.getItem('lenkyx_seen_reels_v1');
        return raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        return [];
      }
    })()
  );

  const revealLeftOverlay = () => {
    setLeftOverlayOpen(true);
    if (leftOverlayTimerRef.current !== null) window.clearTimeout(leftOverlayTimerRef.current);
    leftOverlayTimerRef.current = window.setTimeout(() => {
      setLeftOverlayOpen(false);
    }, 4500);
  };

  const markReelSeen = (item?: CommunityShortItem | null) => {
    if (!item) return;
    const key = item.youtube_id || item.id;
    if (!key) return;
    if (!seenReelIdsRef.current.includes(key)) {
      seenReelIdsRef.current = [...seenReelIdsRef.current.slice(-300), key];
      try {
        localStorage.setItem('lenkyx_seen_reels_v1', JSON.stringify(seenReelIdsRef.current));
      } catch {
        // ignore storage errors
      }
    }
  };
  const [commentTarget, setCommentTarget] = useState<{ id: string; title: string } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [newShortTitle, setNewShortTitle] = useState('');
  const [newShortDesc, setNewShortDesc] = useState('');
  const [newShortVideoData, setNewShortVideoData] = useState('');
  const [publishingShort, setPublishingShort] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const wheelLockRef = useRef<number>(0);

  // === HD LIVE STREAM STUDIO + EFFECTS + AI CREATURES STATE ===
  const [lives, setLives] = useState<LiveRoomItem[]>([]);
  const [ytLives, setYtLives] = useState<CommunityShortItem[]>([]);
  const [watchingYtLive, setWatchingYtLive] = useState<CommunityShortItem | null>(null);
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

  const loadShorts = async (cat = shortCategory, q = shortSearch, forceRefresh = false) => {
    setShortsLoading(true);
    try {
      // Mark currently visible batch as seen when user explicitly refreshes so they NEVER repeat!
      if (forceRefresh) {
        shorts.forEach((s) => markReelSeen(s));
      }
      let list = await fetchWorldShorts(cat, q, seenReelIdsRef.current, forceRefresh);
      if (list.length === 0 && seenReelIdsRef.current.length > 0) {
        // If user watched every single video in this category, reset history for this category so fresh cycle begins
        seenReelIdsRef.current = [];
        try {
          localStorage.removeItem('lenkyx_seen_reels_v1');
        } catch {
          // ignore
        }
        list = await fetchWorldShorts(cat, q, [], true);
      }
      setShorts(list);
      setActiveIndex(0);
    } finally {
      setShortsLoading(false);
    }
  };

  useEffect(() => {
    void loadShorts('all', '');
    void fetchActiveLives().then(setLives);
    void fetchWorldShorts('live', '').then(setYtLives);
  }, []);

  useEffect(() => {
    if (!actionNonce && !initialAction) return;
    if (initialAction === 'create_reel') {
      setSubTab('shorts');
      setExclusiveShortsOpen(false);
      setPublishOpen(true);
    } else if (initialAction === 'go_live') {
      setSubTab('live');
      setExclusiveShortsOpen(false);
    } else if (initialAction === 'shorts') {
      setSubTab('shorts');
    }
  }, [actionNonce, initialAction]);

  // Keyboard Up/Down & Left/Right navigation for Individual YouTube Shorts Player
  useEffect(() => {
    if (subTab !== 'shorts' && !exclusiveShortsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (exclusiveShortsOpen) e.preventDefault();
        scrollToShort(activeIndex + 1);
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (exclusiveShortsOpen) e.preventDefault();
        scrollToShort(activeIndex - 1);
      }
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
    if (shorts.length === 0) return;
    markReelSeen(shorts[activeIndex]);
    const clamped = Math.max(0, Math.min(shorts.length - 1, nextIdx));
    setActiveIndex(clamped);
    // Automatically load a fresh non-repeating batch when reaching the last 2 Reels!
    if (clamped >= shorts.length - 2 && !shortsLoading) {
      void fetchWorldShorts(shortCategory, shortSearch, seenReelIdsRef.current, true).then((more) => {
        if (more.length > 0) {
          setShorts((prev) => {
            const ids = new Set(prev.map((x) => x.id));
            const uniqueNew = more.filter((x) => !ids.has(x.id));
            return uniqueNew.length > 0 ? [...prev, ...uniqueNew] : prev;
          });
        }
      });
    }
  };

  const openShortIndividual = (idx: number) => {
    setActiveIndex(Math.max(0, Math.min(shorts.length - 1, idx)));
    setExclusiveShortsOpen(true);
    onPauseCatalogPlayer();
  };

  const handleShortEnded = () => {
    markReelSeen(shorts[activeIndex]);
    if (!autoAdvanceShorts || loopCurrentShort || shorts.length <= 1) return;
    const next = activeIndex + 1 < shorts.length ? activeIndex + 1 : 0;
    setActiveIndex(next);
  };

  const handleShortUnavailable = (badId: string) => {
    setShorts((prev) => {
      const filtered = prev.filter((x) => x.id !== badId);
      if (filtered.length === 0) return prev;
      setActiveIndex((cur) => Math.min(cur, filtered.length - 1));
      return filtered;
    });
    onToast('⏭️ Pulando vídeo bloqueado pelo autor para o próximo disponível...');
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

  const activeShort = shorts[activeIndex] || shorts[0] || null;

  const renderShortsStage = (isExclusiveModal: boolean) => {
    if (isExclusiveModal && activeShort) {
      return (
        <div
          className="relative flex flex-col h-full w-full select-none overscroll-contain overflow-hidden"
          onTouchStart={(e) => {
            touchStartYRef.current = e.touches[0]?.clientY ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartYRef.current === null) return;
            const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
            const dy = touchStartYRef.current - endY;
            touchStartYRef.current = null;
            if (Math.abs(dy) > 48) {
              if (dy > 0) scrollToShort(activeIndex + 1);
              else scrollToShort(activeIndex - 1);
            }
          }}
          onWheel={(e) => {
            const now = Date.now();
            if (now - wheelLockRef.current < 420) return;
            if (Math.abs(e.deltaY) > 28) {
              wheelLockRef.current = now;
              if (e.deltaY > 0) scrollToShort(activeIndex + 1);
              else scrollToShort(activeIndex - 1);
            }
          }}
        >
          {/* Floating Translucent Top Controls Bar (Never covers the video!) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 z-30 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExclusiveShortsOpen(false)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white text-xs font-black flex items-center gap-1.5 transition"
              >
                <Minimize2 className="w-3.5 h-3.5" /> Grade
              </button>
              <span className="px-2.5 py-1 rounded-full bg-white/[0.07] border border-white/10 text-[11px] font-bold text-cyan-200">
                {activeIndex + 1} / {shorts.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setAutoAdvanceShorts((v) => !v);
                  if (!autoAdvanceShorts) setLoopCurrentShort(false);
                }}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-black backdrop-blur-md border flex items-center gap-1 transition ${
                  autoAdvanceShorts && !loopCurrentShort
                    ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                    : 'bg-white/10 border-white/15 text-slate-300'
                }`}
                title="Passar automaticamente para o próximo vídeo quando terminar"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Auto Próximo</span>
              </button>

              <button
                onClick={() => setLoopCurrentShort((v) => !v)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-black backdrop-blur-md border flex items-center gap-1 transition ${
                  loopCurrentShort
                    ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200'
                    : 'bg-white/10 border-white/15 text-slate-300'
                }`}
                title="Repetir este vídeo"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Loop</span>
              </button>

              <button
                onClick={() => setZenShortMode((v) => !v)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-black backdrop-blur-md border flex items-center gap-1 transition ${
                  zenShortMode
                    ? 'bg-pink-500/25 border-pink-400/50 text-pink-200'
                    : 'bg-white/10 border-white/15 text-slate-300'
                }`}
                title="Ocultar textos sobre o vídeo (Modo Limpo)"
              >
                {zenShortMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Tela Limpa</span>
              </button>

              <button
                onClick={() => setExclusiveShortsOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 border border-white/15 text-white transition"
                title="Fechar Modo Individual"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CENTERED 1-BY-1 YOUTUBE SHORTS VERTICAL STAGE */}
          <div className="flex-1 min-h-0 flex items-center justify-center px-2 pb-3 relative">
            <div className="relative h-full max-h-[840px] w-full max-w-[440px] rounded-[28px] overflow-hidden border border-white/15 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.9)]">
              {activeShort.video_url ? (
                <video
                  key={activeShort.id}
                  src={activeShort.video_url}
                  poster={activeShort.poster_url}
                  controls
                  autoPlay
                  playsInline
                  loop={loopCurrentShort}
                  onEnded={handleShortEnded}
                  className="w-full h-full object-cover"
                />
              ) : activeShort.youtube_id ? (
                <YouTubeShortPlayer
                  key={activeShort.id}
                  videoId={activeShort.youtube_id}
                  loopOne={loopCurrentShort}
                  onEnded={handleShortEnded}
                  onUnavailable={() => handleShortUnavailable(activeShort.id)}
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={activeShort.poster_url || '/covers/album-official.jpg'}
                    alt={activeShort.title}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <button
                    onClick={() => {
                      const match = tracks[activeIndex % Math.max(1, tracks.length)];
                      if (match) onPlayTrack(match);
                    }}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-white flex items-center justify-center shadow-[0_0_35px_rgba(236,72,153,0.7)] hover:scale-105 transition"
                  >
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  </button>
                </div>
              )}

              {/* Bottom Title & Creator Overlay + Channel Subscribe (hidden in Zen Mode!) */}
              {!zenShortMode && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/55 to-transparent p-4 pr-16 pointer-events-none">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5 pointer-events-auto">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-black text-cyan-200">
                      @{activeShort.creator_name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggleSubscribe(activeShort.creator_name);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 transition shadow ${
                        subscribedChannels.has(normalizeChannelKey(activeShort.creator_name))
                          ? 'bg-white/20 border border-white/25 text-white'
                          : 'bg-gradient-to-r from-red-600 to-pink-500 text-white hover:brightness-110'
                      }`}
                    >
                      {subscribedChannels.has(normalizeChannelKey(activeShort.creator_name)) ? (
                        <>
                          <BellRing className="w-3 h-3 text-emerald-300" />
                          <span>Inscrito</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3 h-3" />
                          <span>Inscrever-se</span>
                        </>
                      )}
                      {(channelCounts[normalizeChannelKey(activeShort.creator_name)] || 0) > 0 && (
                        <span className="opacity-85">
                          · {channelCounts[normalizeChannelKey(activeShort.creator_name)]}
                        </span>
                      )}
                    </button>
                    {shortCategory === 'live' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-[9px] font-black text-white">
                        AO VIVO
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black text-white line-clamp-2 drop-shadow">
                    {activeShort.title}
                  </div>
                  {activeShort.description && (
                    <p className="text-[11px] text-slate-200/80 line-clamp-1 mt-0.5">
                      {activeShort.description}
                    </p>
                  )}
                </div>
              )}

              {/* Left-Edge YouTube-Style Tap-to-Reveal Quick Controls (Back / Close / Prev / Next / Refresh) */}
              <div
                onClick={revealLeftOverlay}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex items-center"
              >
                {!leftOverlayOpen ? (
                  <button
                    type="button"
                    onClick={revealLeftOverlay}
                    className="ml-1.5 px-1.5 py-4 rounded-full bg-black/35 hover:bg-black/65 backdrop-blur-md border border-white/15 text-white/80 hover:text-white flex items-center justify-center shadow-lg transition"
                    title="Toque para abrir botões laterais (Voltar / Fechar)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="ml-2 p-1.5 rounded-2xl bg-[#090418]/85 backdrop-blur-xl border border-cyan-400/35 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExclusiveShortsOpen(false)}
                      className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex flex-col items-center justify-center transition"
                      title="Voltar"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-[8px] font-black">Voltar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToShort(activeIndex - 1)}
                      disabled={activeIndex <= 0}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center transition"
                      title="Anterior"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToShort(activeIndex + 1)}
                      disabled={activeIndex >= shorts.length - 1}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center transition"
                      title="Próximo"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadShorts(shortCategory, shortSearch, true)}
                      className="w-10 h-10 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 flex items-center justify-center transition"
                      title="Novos Reels sem repetir"
                    >
                      <RefreshCw className={`w-4 h-4 ${shortsLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExclusiveShortsOpen(false)}
                      className="w-10 h-10 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 text-rose-100 flex flex-col items-center justify-center transition"
                      title="Fechar"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-[8px] font-black">Fechar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right-Side Translucent Action Rail (YouTube Shorts + Cosmic Beats) */}
              <div className="absolute right-2.5 bottom-16 z-20 flex flex-col items-center gap-2.5">
                <button
                  onClick={() => void handleLikeShort(activeShort)}
                  className="w-11 h-11 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center text-white transition active:scale-95"
                  title="Curtir"
                >
                  <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                  <span className="text-[9px] font-black">{activeShort.likes}</span>
                </button>

                <button
                  onClick={() => setCommentTarget({ id: `short:${activeShort.id}`, title: activeShort.title })}
                  className="w-11 h-11 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center text-white transition active:scale-95"
                  title="Comentar"
                >
                  <MessageCircle className="w-4 h-4 text-cyan-300" />
                  <span className="text-[8px] font-bold">Chat</span>
                </button>

                {tracks.length > 0 && (
                  <button
                    onClick={() => {
                      const match = tracks[activeIndex % tracks.length];
                      if (match) {
                        onPlayTrack(match);
                        onToast(`🎧 Tocando batida: ${match.title}`);
                      }
                    }}
                    className="w-11 h-11 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center text-pink-300 transition active:scale-95"
                    title="Ouvir batida LENKYX junto"
                  >
                    <Headphones className="w-4 h-4" />
                    <span className="text-[8px] font-black">Beat</span>
                  </button>
                )}

                {onOpenTvCast && (
                  <button
                    onClick={() =>
                      onOpenTvCast({
                        title: activeShort.title,
                        artist: activeShort.creator_name,
                        mode: 'shorts',
                        youtubeVideoId: activeShort.youtube_id,
                        audioUrl: activeShort.video_url,
                        coverUrl: activeShort.poster_url,
                      })
                    }
                    className="w-11 h-11 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center text-emerald-300 transition active:scale-95"
                    title="Passar vídeo para a Smart TV"
                  >
                    <Tv className="w-4 h-4" />
                    <span className="text-[8px] font-black">TV</span>
                  </button>
                )}
              </div>
            </div>

            {/* TRANSPARENT FLOATING UP (▲) & DOWN (▼) ARROWS (YouTube Shorts Style!) */}
            <div className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => scrollToShort(activeIndex - 1)}
                disabled={activeIndex <= 0}
                aria-label="Vídeo anterior (para cima)"
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-black/25 hover:bg-black/55 disabled:opacity-20 backdrop-blur-md border border-white/15 text-white flex items-center justify-center shadow-lg transition active:scale-90"
                title="Subir (Vídeo anterior)"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => scrollToShort(activeIndex + 1)}
                disabled={activeIndex >= shorts.length - 1}
                aria-label="Próximo vídeo (para baixo)"
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-black/25 hover:bg-black/55 disabled:opacity-20 backdrop-blur-md border border-white/15 text-white flex items-center justify-center shadow-lg transition active:scale-90"
                title="Descer (Próximo vídeo)"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Contextual Header & Category Toggle (Zero overlap with top header!) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setShortsMenuOpen((v) => !v)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-black text-cyan-200 flex items-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5" />
              {shortsMenuOpen ? 'Fechar Categorias' : 'Categorias & Busca'}
            </button>
            <button
              onClick={() => {
                setShortCategory('live');
                void loadShorts('live', '');
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black transition ${
                shortCategory === 'live'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-rose-500/20 border border-rose-400/40 text-rose-200 hover:bg-rose-500/35'
              }`}
            >
              🔴 Lives Ao Vivo
            </button>
            <button
              onClick={() => void loadShorts(shortCategory, shortSearch, true)}
              disabled={shortsLoading}
              className="px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/10 text-[11px] font-bold text-emerald-300 flex items-center gap-1 transition"
              title="Buscar Reels novos sem repetir os já assistidos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${shortsLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar (Sem Repetir)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPublishOpen((v) => !v)}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black flex items-center gap-1 shadow-[0_0_20px_rgba(52,211,153,0.35)] hover:brightness-110 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Criar Reel
            </button>
            <button
              onClick={() => setSubTab('live')}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-black flex items-center gap-1 shadow-[0_0_20px_rgba(244,63,94,0.35)] hover:brightness-110 transition"
            >
              <Radio className="w-3.5 h-3.5" /> Fazer Live
            </button>
            {shorts.length > 0 && (
              <button
                onClick={() => openShortIndividual(activeIndex)}
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black text-xs font-black flex items-center gap-1.5 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:brightness-110 transition"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> Assistir 1 por 1 (Shorts)
              </button>
            )}
          </div>
        </div>

        {shortsMenuOpen && (
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1">
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
                  placeholder="Buscar Reels ou Lives (ex: phonk, funk brasil, DJ, espaço)..."
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
        )}

        {/* ALIGNED YOUTUBE SHORTS GRID (Click any Reel -> Opens 1-by-1 Vertical Fullscreen Player!) */}
        {shortsLoading && shorts.length === 0 ? (
          <div className="py-16 text-center text-xs text-cyan-300 font-bold">
            🌍 Buscando Reels verificados e alinhando sua grade...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {shorts.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => openShortIndividual(idx)}
                className="group cursor-pointer rounded-2xl overflow-hidden cosmic-card-3d flex flex-col text-left"
              >
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  <img
                    src={s.poster_url || '/covers/album-official.jpg'}
                    alt={s.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/30" />

                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white truncate max-w-[130px]">
                      @{s.creator_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/80 text-[9px] font-black text-white shrink-0">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Center Translucent Play Trigger */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-black/40 group-hover:bg-cyan-400 group-hover:text-black backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-xl transition transform group-hover:scale-110">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1.5">
                    <div className="text-xs font-black text-white line-clamp-2 leading-snug drop-shadow">
                      {s.title}
                    </div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] text-cyan-200/85">❤️ {s.likes}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCommentTarget({ id: `short:${s.id}`, title: s.title });
                          }}
                          className="px-1.5 py-0.5 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 text-[9px] font-bold text-cyan-200"
                          title="Comentar"
                        >
                          💬
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleSubscribe(s.creator_name);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black transition ${
                            subscribedChannels.has(normalizeChannelKey(s.creator_name))
                              ? 'bg-white/20 text-emerald-200'
                              : 'bg-red-600/90 hover:bg-red-500 text-white'
                          }`}
                        >
                          {subscribedChannels.has(normalizeChannelKey(s.creator_name))
                            ? '✓ Inscrito'
                            : '+ Inscrever'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
            <span>Reels Mundiais (1 por 1)</span>
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
          <div className="fixed inset-0 z-[9992] bg-[#03010a]/98 backdrop-blur-2xl overscroll-contain overflow-hidden p-2 sm:p-4 flex flex-col">
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
              {(watchingLive || watchingYtLive) && !isHostingLive && (
                <button
                  onClick={() => {
                    setWatchingLive(null);
                    setWatchingYtLive(null);
                  }}
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
              ) : watchingYtLive && watchingYtLive.youtube_id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${watchingYtLive.youtube_id}?autoplay=1&rel=0`}
                  title={watchingYtLive.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
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
                      onClick={() => {
                        setWatchingYtLive(null);
                        setWatchingLive(l);
                      }}
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

            {/* YouTube Live Streams Row */}
            {ytLives.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <CosmicScrollRow
                  title={
                    <>
                      <Tv className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-red-300">Transmissões Ao Vivo Agora</span>
                    </>
                  }
                  count={ytLives.length}
                  gridToggleable={false}
                >
                  {ytLives.map((yt) => (
                    <button
                      key={yt.id}
                      onClick={() => {
                        setWatchingLive(null);
                        setWatchingYtLive(yt);
                      }}
                      className="w-56 shrink-0 rounded-2xl overflow-hidden bg-white/[0.06] hover:bg-red-500/15 border border-white/10 text-left transition group"
                    >
                      <div className="relative aspect-video bg-black">
                        <img
                          src={yt.poster_url || '/covers/album-official.jpg'}
                          alt={yt.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-red-600 text-[9px] font-black text-white">
                          ● AO VIVO
                        </span>
                      </div>
                      <div className="p-2">
                        <div className="text-[11px] font-black text-white truncate">{yt.title}</div>
                        <div className="text-[10px] text-cyan-300 truncate">{yt.creator_name}</div>
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

            <div className="flex-1 overflow-y-auto overscroll-contain py-3 space-y-2">
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

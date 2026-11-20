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
  Share2,
  Volume2,
  VolumeX,
  Disc3,
  Loader2,
  CheckCircle2,
  Music2,
  Download,
  MoreVertical,
  Bookmark,
  Crown,
  ExternalLink,
  Trophy,
} from 'lucide-react';
import { triggerDirectFileDownload } from '../utils/offlineCache';
import { Track, UserProfile } from '../types';
import {
  ChatMessageItem,
  CommunityShortItem,
  CreatorProfileData,
  LiveRoomItem,
  fetchActiveLives,
  fetchChatMessages,
  fetchCreatorProfile,
  fetchLikedShortIds,
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
import { ToguroPromoBanner } from './ToguroPromoBanner';
import { claimMediaFocus, registerMediaStopper } from '../utils/mediaCoordinator';
import { recordSmartInteraction } from '../utils/smartEngine';

const VideoStudioView = React.lazy(() =>
  import('./VideoStudioView').then((m) => ({ default: m.VideoStudioView }))
);

interface Props {
  tracks: Track[];
  initialTrack: Track | null;
  user: UserProfile | null;
  initialAction?: 'shorts' | 'create_reel' | 'go_live';
  actionNonce?: number;
  initialShortsQuery?: string;
  initialShortsNonce?: number;
  onPlayTrack: (track: Track) => void;
  onPauseCatalogPlayer: () => void;
  onOpenUserAuth: () => void;
  onOpenPartners?: () => void;
  onMinimizeReel?: (short: CommunityShortItem) => void;
  onOpenToguroShop?: () => void;
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
  { id: 'all', label: '🇧🇷 Tudo dos Cria' },
  { id: 'memes', label: '😂 Memes da Quebrada' },
  { id: 'pegadinhas', label: '🎭 Pegadinhas BR' },
  { id: 'creators', label: '🏆 YouTubers Top BR' },
  { id: 'viral', label: '🔥 Virais Brasil' },
  { id: 'humor', label: '🤣 Humor & Stand-up' },
  { id: 'music', label: '🎵 Som & Clipes' },
  { id: 'football', label: '⚽ Futebol dos Cria' },
  { id: 'cinema', label: '🎬 Cinema & Animes' },
  { id: 'tech', label: '🏍️ Motos & Carros' },
  { id: 'live', label: '🔴 Ao Vivo Agora' },
  { id: 'community', label: '📱 Da Galera' },
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
  pauseVideo?: () => void;
  seekTo?: (sec: number, allowSeekAhead?: boolean) => void;
  mute?: () => void;
  unMute?: () => void;
  setPlaybackRate?: (rate: number) => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
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
  muted?: boolean;
  playbackRate?: number;
  onDoubleTapLike?: () => void;
  onEnded: () => void;
  onUnavailable: () => void;
}> = ({
  videoId,
  loopOne,
  muted = false,
  playbackRate = 1,
  onDoubleTapLike,
  onEnded,
  onUnavailable,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerHandle | null>(null);
  const [paused, setPaused] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [durTime, setDurTime] = useState(0);
  const [heartBurst, setHeartBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<number | null>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onUnavailRef = useRef(onUnavailable);
  onUnavailRef.current = onUnavailable;
  const loopRef = useRef(loopOne);
  loopRef.current = loopOne;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const rateRef = useRef(playbackRate);
  rateRef.current = playbackRate;

  useEffect(() => {
    let destroyed = false;
    let player: YTPlayerHandle | null = null;
    setPaused(false);
    setCurTime(0);
    setDurTime(0);

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
              if (mutedRef.current) ev.target.mute?.();
              else ev.target.unMute?.();
              if (rateRef.current !== 1) ev.target.setPlaybackRate?.(rateRef.current);
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

    const progTimer = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const d = p.getDuration?.() || 0;
        const c = p.getCurrentTime?.() || 0;
        if (d > 0) {
          setDurTime(d);
          setCurTime(c);
        }
      } catch {
        // ignore
      }
    }, 180);

    return () => {
      destroyed = true;
      window.clearInterval(progTimer);
      if (tapTimerRef.current !== null) window.clearTimeout(tapTimerRef.current);
      playerRef.current = null;
      try {
        player?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, [videoId]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (muted) p.mute?.();
      else p.unMute?.();
    } catch {
      // ignore
    }
  }, [muted]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.setPlaybackRate?.(playbackRate);
    } catch {
      // ignore
    }
  }, [playbackRate]);

  const toggleShortPlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (paused) {
      p.playVideo?.();
      setPaused(false);
    } else {
      p.pauseVideo?.();
      setPaused(true);
    }
  };

  const handleStageTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 260) {
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      const rect = e.currentTarget.getBoundingClientRect();
      setHeartBurst({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        key: now,
      });
      window.setTimeout(() => setHeartBurst(null), 700);
      onDoubleTapLike?.();
      return;
    }
    lastTapRef.current = now;
    tapTimerRef.current = window.setTimeout(() => {
      toggleShortPlay();
      tapTimerRef.current = null;
    }, 230);
  };

  const pct = durTime > 0 ? Math.min(100, (curTime / durTime) * 100) : 0;

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={hostRef} className="w-full h-full bg-black" />
      <button
        type="button"
        onClick={handleStageTap}
        aria-label={paused ? 'Continuar Reel' : 'Pausar Reel'}
        className={`absolute inset-x-0 top-0 bottom-28 z-10 flex items-center justify-center transition ${
          paused ? 'bg-black/45 backdrop-blur-sm' : 'bg-transparent'
        }`}
      >
        {paused && (
          <span className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.65)]">
            <Play className="w-7 h-7 fill-black ml-0.5" />
          </span>
        )}
        {heartBurst && (
          <span
            key={heartBurst.key}
            style={{ left: heartBurst.x - 32, top: heartBurst.y - 32 }}
            className="absolute pointer-events-none w-16 h-16 flex items-center justify-center animate-ping"
          >
            <Heart className="w-14 h-14 fill-pink-500 text-pink-400 drop-shadow-[0_0_24px_rgba(236,72,153,0.9)]" />
          </span>
        )}
      </button>

      {/* YouTube Shorts Thin Bottom Progress Bar */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (durTime <= 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          playerRef.current?.seekTo?.(ratio * durTime, true);
          setCurTime(ratio * durTime);
        }}
        className="absolute inset-x-0 bottom-0 h-4 z-40 flex flex-col justify-end cursor-pointer group"
      >
        <div className="w-full h-[2px] group-hover:h-[5px] bg-white/25 transition-all relative">
          <div
            className="h-full bg-white group-hover:bg-red-500 transition-[width] duration-150 relative"
            style={{ width: `${pct}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
};

const NativeShortVideoPlayer: React.FC<{
  src: string;
  poster?: string;
  muted: boolean;
  loop: boolean;
  playbackRate?: number;
  onEnded: () => void;
  onDoubleTapLike?: () => void;
}> = ({ src, poster, muted, loop, playbackRate = 1, onEnded, onDoubleTapLike }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [durTime, setDurTime] = useState(0);
  const [heartBurst, setHeartBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, src]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 260) {
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      const rect = e.currentTarget.getBoundingClientRect();
      setHeartBurst({ x: e.clientX - rect.left, y: e.clientY - rect.top, key: now });
      window.setTimeout(() => setHeartBurst(null), 700);
      onDoubleTapLike?.();
      return;
    }
    lastTapRef.current = now;
    tapTimerRef.current = window.setTimeout(() => {
      togglePlay();
      tapTimerRef.current = null;
    }, 230);
  };

  const pct = durTime > 0 ? Math.min(100, (curTime / durTime) * 100) : 0;
  const fmtSec = (s: number) => {
    const t = Math.max(0, Math.floor(s));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        playsInline
        muted={muted}
        loop={loop}
        onLoadedMetadata={(e) => setDurTime(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          setCurTime(e.currentTarget.currentTime || 0);
          if (!durTime && e.currentTarget.duration) setDurTime(e.currentTarget.duration);
        }}
        onEnded={onEnded}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={handleTap}
        aria-label={paused ? 'Continuar Reel' : 'Pausar Reel'}
        className={`absolute inset-x-0 top-0 bottom-28 z-10 flex items-center justify-center transition ${
          paused ? 'bg-black/45 backdrop-blur-sm' : 'bg-transparent'
        }`}
      >
        {paused && (
          <span className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.65)]">
            <Play className="w-7 h-7 fill-black ml-0.5" />
          </span>
        )}
        {heartBurst && (
          <span
            key={heartBurst.key}
            style={{ left: heartBurst.x - 32, top: heartBurst.y - 32 }}
            className="absolute pointer-events-none w-16 h-16 flex items-center justify-center animate-ping"
          >
            <Heart className="w-14 h-14 fill-pink-500 text-pink-400 drop-shadow-[0_0_24px_rgba(236,72,153,0.9)]" />
          </span>
        )}
      </button>

      <div
        onClick={(e) => {
          e.stopPropagation();
          const v = videoRef.current;
          if (!v || durTime <= 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          v.currentTime = ratio * durTime;
          setCurTime(v.currentTime);
        }}
        className="absolute inset-x-0 bottom-0 h-5 z-40 flex flex-col justify-end cursor-pointer group"
      >
        {durTime > 0 && (
          <div className="px-3 pb-1 flex items-center justify-between pointer-events-none">
            <span className="px-1.5 py-0.5 rounded bg-black/75 border border-white/10 text-[9px] font-black text-white/95 tabular-nums">
              {fmtSec(curTime)} / {fmtSec(durTime)}
            </span>
          </div>
        )}
        <div className="w-full h-[3px] group-hover:h-[6px] bg-white/25 transition-all relative">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-pink-500 to-cyan-400 transition-[width] duration-150 relative"
            style={{ width: `${pct}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] opacity-85 group-hover:opacity-100" />
          </div>
        </div>
      </div>
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
  initialShortsQuery = '',
  initialShortsNonce = 0,
  onPlayTrack,
  onPauseCatalogPlayer,
  onOpenUserAuth,
  onOpenPartners,
  onMinimizeReel,
  onOpenToguroShop,
  onOpenTvCast,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('shorts');
  const [hubMoreOpen, setHubMoreOpen] = useState(false);
  const [topCreatorsDrawerOpen, setTopCreatorsDrawerOpen] = useState(false);
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
  const [shortsMoreOpen, setShortsMoreOpen] = useState(false);
  const [shortsSearchBarOpen, setShortsSearchBarOpen] = useState(false);
  const [shortsLoading, setShortsLoading] = useState(false);
  const [exclusiveShortsOpen, setExclusiveShortsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoAdvanceShorts, setAutoAdvanceShorts] = useState(true);
  const [loopCurrentShort, setLoopCurrentShort] = useState(false);
  const [shortsMuted, setShortsMuted] = useState(false);
  const [shortsRate, setShortsRate] = useState<number>(1);
  const [reelsExpanded, setReelsExpanded] = useState(false);
  const [downloadingShortId, setDownloadingShortId] = useState<string | null>(null);
  const [newShortDurationSec, setNewShortDurationSec] = useState<number>(0);
  const [likedShortIds, setLikedShortIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('lenkyx_liked_shorts_v1');
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileData | null>(null);
  const [creatorTab, setCreatorTab] = useState<'shorts' | 'videos'>('shorts');
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
  const [commentTarget, setCommentTarget] = useState<{
    id: string;
    title: string;
    youtubeId?: string;
  } | null>(null);
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

  const persistLikedIds = (nextSet: Set<string>) => {
    try {
      localStorage.setItem('lenkyx_liked_shorts_v1', JSON.stringify(Array.from(nextSet)));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void fetchLikedShortIds(subscriberId).then((ids) => {
      if (ids.length > 0) {
        setLikedShortIds((prev) => {
          const merged = new Set([...prev, ...ids]);
          persistLikedIds(merged);
          return merged;
        });
      }
    });
  }, [subscriberId]);

  const localCountryCode = (() => {
    try {
      const lang = (navigator.language || 'pt-BR').split('-')[1];
      return lang && lang.length === 2 ? lang.toUpperCase() : 'BR';
    } catch {
      return 'BR';
    }
  })();

  const loadShorts = async (cat = shortCategory, q = shortSearch, forceRefresh = false, autoOpen = false) => {
    setShortsLoading(true);
    try {
      // Mark currently visible batch as seen when user explicitly refreshes so they NEVER repeat!
      if (forceRefresh) {
        shorts.forEach((s) => markReelSeen(s));
      }
      let list = await fetchWorldShorts(cat, q, seenReelIdsRef.current, forceRefresh, subscriberId, localCountryCode);
      if (list.length === 0 && seenReelIdsRef.current.length > 0) {
        // If user watched every single video in this category, reset history for this category so fresh cycle begins
        seenReelIdsRef.current = [];
        try {
          localStorage.removeItem('lenkyx_seen_reels_v1');
        } catch {
          // ignore
        }
        list = await fetchWorldShorts(cat, q, [], true, subscriberId, localCountryCode);
      }
      setShorts(list);
      setActiveIndex(0);
      if (autoOpen && list.length > 0) {
        claimMediaFocus('reels');
        onPauseCatalogPlayer();
        setExclusiveShortsOpen(true);
        const first = list[0];
        if (first) {
          recordSmartInteraction({
            kind: 'watch_reel',
            artist: first.creator_name,
            title: first.title,
            category: cat,
          });
        }
      }
    } finally {
      setShortsLoading(false);
    }
  };

  interface BrCreatorRank {
    id: string;
    name: string;
    handle: string;
    category: string;
    badge: string;
    subscribersText: string;
    youtubeUrl: string;
    shortsQuery: string;
    votes: number;
    gradient: string;
  }
  const [brTop5, setBrTop5] = useState<BrCreatorRank[]>([]);
  const [brAllCreators, setBrAllCreators] = useState<BrCreatorRank[]>([]);
  const [selectedCreatorFilter, setSelectedCreatorFilter] = useState<string>('');

  const handleVoteBrCreator = async (creatorId: string, name: string) => {
    try {
      const r = await fetch('/api/community/br-creators/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      });
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d?.top5)) setBrTop5(d.top5);
        if (Array.isArray(d?.allCreators)) setBrAllCreators(d.allCreators);
        onToast(`🏆 Boa, cria! +1 reconhecimento pra ${name}!`);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const shouldAutoPlay = initialAction !== 'create_reel' && initialAction !== 'go_live';
    void loadShorts('all', '', false, shouldAutoPlay);
    void fetchActiveLives().then(setLives);
    void fetchWorldShorts('live', '', [], false, subscriberId, localCountryCode).then(setYtLives);
    fetch('/api/community/br-creators')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.top5)) setBrTop5(d.top5);
        if (Array.isArray(d?.allCreators)) setBrAllCreators(d.allCreators);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialShortsNonce || !initialShortsQuery.trim()) return;
    setSubTab('shorts');
    setShortCategory('creators');
    setShortSearch(initialShortsQuery);
    void loadShorts('creators', initialShortsQuery, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialShortsNonce, initialShortsQuery]);

  useEffect(() => {
    return registerMediaStopper('reels', () => {
      setExclusiveShortsOpen(false);
      setWatchingLive(null);
      setWatchingYtLive(null);
    });
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
      if (shorts.length > 0) {
        claimMediaFocus('reels');
        onPauseCatalogPlayer();
        setExclusiveShortsOpen(true);
      } else {
        void loadShorts(shortCategory, shortSearch, false, true);
      }
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
    claimMediaFocus('reels');
    onPauseCatalogPlayer();
    setActiveIndex(Math.max(0, Math.min(shorts.length - 1, idx)));
    setExclusiveShortsOpen(true);
    const chosen = shorts[idx];
    if (chosen) {
      recordSmartInteraction({
        kind: 'watch_reel',
        artist: chosen.creator_name,
        title: chosen.title,
        category: shortCategory,
      });
    }
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

  const fmtCompactCount = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const handleLikeShort = async (s: CommunityShortItem, forceLikeOnly = false) => {
    const alreadyLiked = likedShortIds.has(s.id) || Boolean(s.liked_by_me);
    if (forceLikeOnly && alreadyLiked) {
      return; // Double-tap keeps the single like without unliking or stacking!
    }
    const nextLiked = !alreadyLiked;
    const optimisticLikes = Math.max(0, s.likes + (nextLiked ? 1 : -1));

    setLikedShortIds((prev) => {
      const next = new Set(prev);
      if (nextLiked) next.add(s.id);
      else next.delete(s.id);
      persistLikedIds(next);
      return next;
    });
    setShorts((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, likes: optimisticLikes, liked_by_me: nextLiked } : x))
    );

    const res = await likeCommunityShortItem(s.id, subscriberId, s.likes);
    if (res && typeof res.likes === 'number') {
      setLikedShortIds((prev) => {
        const next = new Set(prev);
        if (res.liked) next.add(s.id);
        else next.delete(s.id);
        persistLikedIds(next);
        return next;
      });
      setShorts((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, likes: res.likes, liked_by_me: res.liked } : x))
      );
    }
  };

  const openCreatorProfile = async (item: CommunityShortItem) => {
    setCreatorModalOpen(true);
    setCreatorLoading(true);
    setCreatorTab('shorts');
    setCreatorProfile({
      channelId: '',
      channelName: item.creator_name || 'Criador',
      handle: `@${(item.creator_name || 'criador').replace(/[^a-zA-Z0-9_.-]+/g, '')}`,
      avatarUrl: '',
      bannerUrl: item.poster_url || '',
      subscriberText: '',
      description: '',
      shorts: shorts.filter(
        (x) => x.creator_name.toLowerCase() === (item.creator_name || '').toLowerCase()
      ),
      videos: [],
    });
    try {
      const data = await fetchCreatorProfile({
        creatorName: item.creator_name,
        youtubeId: item.youtube_id,
        userId: subscriberId,
      });
      if (data) {
        setCreatorProfile(data);
        if (data.shorts.length === 0 && data.videos.length > 0) {
          setCreatorTab('videos');
        }
      }
    } finally {
      setCreatorLoading(false);
    }
  };

  const handlePlayCreatorList = (list: CommunityShortItem[], startIndex = 0) => {
    if (!list.length) return;
    setShorts((prev) => {
      const seen = new Set(list.map((x) => x.id));
      return [...list, ...prev.filter((x) => !seen.has(x.id))];
    });
    setCreatorModalOpen(false);
    claimMediaFocus('reels');
    onPauseCatalogPlayer();
    setActiveIndex(startIndex);
    setExclusiveShortsOpen(true);
  };

  const handleShareShort = async (s: CommunityShortItem) => {
    const appUrl = window.location.origin;
    const shareText = `${s.title} — @${s.creator_name} no app LENKYX`;
    try {
      if (navigator.share) {
        await navigator.share({ title: s.title, text: shareText, url: appUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText} · ${appUrl}`);
        onToast('🔗 Link copiado para compartilhar!');
      }
    } catch {
      // cancelled
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 18 * 1024 * 1024) {
      onToast('Escolha um vídeo curto de até 18 MB para publicar rápido.');
      e.target.value = '';
      return;
    }
    const probeUrl = URL.createObjectURL(f);
    const probeVideo = document.createElement('video');
    probeVideo.preload = 'metadata';
    probeVideo.onloadedmetadata = () => {
      const dur = Math.round(probeVideo.duration || 0);
      URL.revokeObjectURL(probeUrl);
      if (dur > 180) {
        onToast('⏱️ Reels aceitam apenas vídeos curtos de até 3:00 (padrão YouTube Shorts).');
        return;
      }
      setNewShortDurationSec(dur);
      const reader = new FileReader();
      reader.onload = () => {
        setNewShortVideoData(String(reader.result || ''));
        if (!newShortTitle.trim()) {
          setNewShortTitle(f.name.replace(/\.[^.]+$/, '').slice(0, 60));
        }
      };
      reader.readAsDataURL(f);
    };
    probeVideo.onerror = () => {
      URL.revokeObjectURL(probeUrl);
      onToast('Não foi possível ler a duração deste vídeo.');
    };
    probeVideo.src = probeUrl;
    e.target.value = '';
  };

  const handleDownloadShort = async (s: CommunityShortItem) => {
    if (downloadingShortId) return;
    setDownloadingShortId(s.id);
    onToast(`⬇️ Preparando download de "${s.title}"...`);
    try {
      const res = await triggerDirectFileDownload({
        title: s.title,
        artist: s.creator_name,
        directUrl: s.video_url || undefined,
        kind: s.video_url ? 'video' : 'audio',
        onProgress: (pct) => {
          if (pct === 50) onToast(`⬇️ Baixando "${s.title}" · ${pct}%`);
        },
      });
      onToast(`✅ "${res.filename}" baixado (${res.mb} MB)!`);
    } catch {
      onToast(`Não foi possível baixar "${s.title}" agora.`);
    } finally {
      setDownloadingShortId(null);
    }
  };

  const handlePublishShort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortTitle.trim() || publishingShort) return;
    if (newShortDurationSec > 180) {
      onToast('⏱️ Reels permitem apenas vídeos curtos de até 3:00.');
      return;
    }
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
        durationSec: newShortDurationSec || 30,
      });
      if (created) {
        setShorts((prev) => [created, ...prev]);
        setActiveIndex(0);
        setPublishOpen(false);
        setNewShortTitle('');
        setNewShortDesc('');
        setNewShortVideoData('');
        setNewShortDurationSec(0);
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
        claimMediaFocus('reels');
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

  const [shortsFilterSubscribed, setShortsFilterSubscribed] = useState(false);

  const visibleShorts = shortsFilterSubscribed
    ? shorts.filter((s) => subscribedChannels.has(normalizeChannelKey(s.creator_name)))
    : shorts;

  const activeShort = visibleShorts[activeIndex] || visibleShorts[0] || shorts[0] || null;

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
          {/* CENTERED 1-BY-1 YOUTUBE SHORTS VERTICAL STAGE (Identical Clean Layout) */}
          <div className="flex-1 min-h-0 flex items-center justify-center sm:px-3 sm:py-2 relative">
            <div
              className={`relative h-full w-full rounded-none sm:rounded-[26px] overflow-hidden bg-black shadow-[0_24px_80px_rgba(0,0,0,0.95)] transition-all duration-300 ${
                reelsExpanded ? 'sm:max-w-[780px]' : 'sm:max-w-[430px] sm:max-h-[860px]'
              }`}
            >
              {activeShort.video_url ? (
                <NativeShortVideoPlayer
                  key={activeShort.id}
                  src={activeShort.video_url}
                  poster={activeShort.poster_url}
                  muted={shortsMuted}
                  loop={loopCurrentShort}
                  playbackRate={shortsRate}
                  onEnded={handleShortEnded}
                  onDoubleTapLike={() => void handleLikeShort(activeShort, true)}
                />
              ) : activeShort.youtube_id ? (
                <YouTubeShortPlayer
                  key={activeShort.id}
                  videoId={activeShort.youtube_id}
                  loopOne={loopCurrentShort}
                  muted={shortsMuted}
                  playbackRate={shortsRate}
                  onDoubleTapLike={() => void handleLikeShort(activeShort, true)}
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
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl hover:scale-105 transition"
                  >
                    <Play className="w-7 h-7 fill-black ml-0.5" />
                  </button>
                </div>
              )}

              {/* CLEAN TOP BAR OVERLAY: Back, Minimize (keeps playing!), Expand, 3-Dots & Close */}
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 pt-3 pb-6 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none"
              >
                <div className="pointer-events-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExclusiveShortsOpen(false)}
                    className="w-9 h-9 rounded-full bg-black/55 hover:bg-white/20 flex items-center justify-center text-white drop-shadow transition active:scale-90"
                    title="Voltar para Grade"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {onMinimizeReel && (
                    <button
                      type="button"
                      onClick={() => {
                        onMinimizeReel(activeShort);
                        setExclusiveShortsOpen(false);
                      }}
                      className="px-2.5 h-9 rounded-full bg-black/55 hover:bg-amber-400 hover:text-black border border-white/20 flex items-center gap-1 text-white text-[11px] font-black drop-shadow transition active:scale-90"
                      title="Minimizar e continuar assistindo pela plataforma"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Minimizar</span>
                    </button>
                  )}
                </div>

                <div className="pointer-events-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReelsExpanded((v) => !v)}
                    className="w-9 h-9 rounded-full bg-black/55 hover:bg-white/20 flex items-center justify-center text-white drop-shadow transition active:scale-90"
                    title={reelsExpanded ? 'Reduzir Tela' : 'Aumentar Tela'}
                  >
                    {reelsExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShortsSearchBarOpen((v) => !v)}
                    className="w-9 h-9 rounded-full bg-black/55 hover:bg-white/20 flex items-center justify-center text-white drop-shadow transition active:scale-90"
                    title="Buscar Shorts"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShortsMoreOpen(true)}
                    className="w-9 h-9 rounded-full bg-black/55 hover:bg-white/20 flex items-center justify-center text-white drop-shadow transition active:scale-90"
                    title="Mais opções"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExclusiveShortsOpen(false)}
                    className="w-9 h-9 rounded-full bg-rose-600/85 hover:bg-rose-500 flex items-center justify-center text-white drop-shadow transition active:scale-90"
                    title="Fechar Reels"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Floating Search Overlay when tapping 🔍 */}
              {shortsSearchBarOpen && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShortsSearchBarOpen(false);
                    void loadShorts(shortCategory, shortSearch, true);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-14 inset-x-3 z-40 flex items-center gap-2 rounded-full bg-[#0f0f0f]/95 border border-white/20 px-3.5 py-2 shadow-2xl"
                >
                  <Search className="w-4 h-4 text-white/70 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={shortSearch}
                    onChange={(e) => setShortSearch(e.target.value)}
                    placeholder="Buscar Shorts..."
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShortsSearchBarOpen(false)}
                    className="p-1 text-white/70 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* CLEAN YOUTUBE SHORTS BOTTOM-LEFT CREATOR ROW + WHITE PILL SUBSCRIBE + 1-LINE TITLE */}
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute inset-x-0 bottom-1.5 z-30 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3.5 pb-3 pt-10 pr-16"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      void openCreatorProfile(activeShort);
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-white transition active:scale-95 min-w-0"
                    title="Ver canal"
                  >
                    <span
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                        activeShort.creator_color || 'from-cyan-400 to-pink-500'
                      } text-xs font-black text-white flex items-center justify-center shrink-0 shadow`}
                    >
                      {(activeShort.creator_name || 'C').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="truncate max-w-[130px] drop-shadow">@{activeShort.creator_name}</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleSubscribe(activeShort.creator_name);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition shrink-0 ${
                      subscribedChannels.has(normalizeChannelKey(activeShort.creator_name))
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    {subscribedChannels.has(normalizeChannelKey(activeShort.creator_name))
                      ? 'Inscrito'
                      : 'Inscrever-se'}
                  </button>
                </div>
                <div className="text-[13px] font-medium text-white line-clamp-2 leading-snug drop-shadow">
                  {activeShort.title}
                </div>
              </div>

              {/* CLEAN YOUTUBE SHORTS RIGHT ACTION RAIL (Borderless Icons + Count/Label Below + Square Sound Thumb) */}
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute right-2.5 bottom-3.5 z-30 flex flex-col items-center gap-4"
              >
                <button
                  type="button"
                  onClick={() => void handleLikeShort(activeShort)}
                  className="flex flex-col items-center gap-1 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] transition active:scale-90"
                  title="Curtir"
                >
                  <Heart
                    className={`w-7 h-7 ${
                      likedShortIds.has(activeShort.id) || activeShort.liked_by_me
                        ? 'fill-red-500 text-red-500'
                        : 'text-white'
                    }`}
                  />
                  <span className="text-[11px] font-semibold">{fmtCompactCount(activeShort.likes)}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCommentTarget({
                      id: `short:${activeShort.id}`,
                      title: activeShort.title,
                      youtubeId: activeShort.youtube_id,
                    })
                  }
                  className="flex flex-col items-center gap-1 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] transition active:scale-90"
                  title="Comentários"
                >
                  <MessageCircle className="w-7 h-7" />
                  <span className="text-[11px] font-semibold">Coment.</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingShortId === activeShort.id}
                  onClick={() => void handleDownloadShort(activeShort)}
                  className="flex flex-col items-center gap-1 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] transition active:scale-90"
                  title="Salvar"
                >
                  {downloadingShortId === activeShort.id ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <Bookmark className="w-7 h-7" />
                  )}
                  <span className="text-[11px] font-semibold">Salvar</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleShareShort(activeShort)}
                  className="flex flex-col items-center gap-1 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] transition active:scale-90"
                  title="Compartilhar"
                >
                  <Share2 className="w-7 h-7" />
                  <span className="text-[11px] font-semibold">Compart.</span>
                </button>

                {/* Square Creator / Audio Thumbnail (YouTube Shorts bottom-right) */}
                <button
                  type="button"
                  onClick={() => void openCreatorProfile(activeShort)}
                  className="w-9 h-9 rounded-lg border-2 border-white/80 overflow-hidden shadow-lg active:scale-95 transition"
                  title="Som & Canal"
                >
                  <img
                    src={activeShort.poster_url || '/covers/album-official.jpg'}
                    alt={activeShort.creator_name}
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>

              {/* Clean YouTube Bottom Sheet for ⋮ Options (Speed, Loop, Mute, Expand, Auto, Subscribed) */}
              {shortsMoreOpen && (
                <div
                  onClick={() => setShortsMoreOpen(false)}
                  className="absolute inset-0 z-50 bg-black/60 flex items-end justify-center"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded-t-2xl bg-[#212121] border-t border-white/15 p-4 space-y-2 text-white"
                  >
                    <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-2" />
                    <div className="text-xs font-bold text-white/60 px-2 pb-1 flex items-center justify-between">
                      <span>Opções do Short ({activeIndex + 1}/{visibleShorts.length})</span>
                      <button
                        type="button"
                        onClick={() => setShortsMoreOpen(false)}
                        className="text-white/80 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setShortsMuted((m) => !m)}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        {shortsMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                        <span>{shortsMuted ? 'Ativar som' : 'Silenciar'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShortsRate((r) => (r === 1 ? 1.5 : r === 1.5 ? 2 : 1))}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-cyan-300" />
                        <span>Velocidade: {shortsRate}x</span>
                      </button>
                      {onMinimizeReel && (
                        <button
                          type="button"
                          onClick={() => {
                            setShortsMoreOpen(false);
                            onMinimizeReel(activeShort);
                            setExclusiveShortsOpen(false);
                          }}
                          className="px-3 py-2.5 rounded-xl bg-amber-400 text-black font-black flex items-center gap-2"
                        >
                          <Minimize2 className="w-4 h-4" />
                          <span>Minimizar na Tela</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShortsMoreOpen(false);
                          setExclusiveShortsOpen(false);
                          setSubTab('live');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        <Radio className="w-4 h-4 text-rose-400" />
                        <span>Ao Vivo HD</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShortsMoreOpen(false);
                          setExclusiveShortsOpen(false);
                          setTopCreatorsDrawerOpen(true);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        <Crown className="w-4 h-4 text-amber-300" />
                        <span>Top 5 Youtubers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShortsMoreOpen(false);
                          setExclusiveShortsOpen(false);
                          setPublishOpen(true);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4 text-emerald-400" />
                        <span>Publicar Short</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoopCurrentShort((v) => !v)}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        <Repeat className={`w-4 h-4 ${loopCurrentShort ? 'text-cyan-300' : ''}`} />
                        <span>{loopCurrentShort ? 'Repetir: Ligado' : 'Repetir vídeo'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAutoAdvanceShorts((v) => !v)}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        <SkipForward className={`w-4 h-4 ${autoAdvanceShorts ? 'text-emerald-400' : ''}`} />
                        <span>{autoAdvanceShorts ? 'Auto Próximo: Sim' : 'Auto Próximo: Não'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReelsExpanded((v) => !v)}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        {reelsExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span>{reelsExpanded ? 'Tela Padrão' : 'Expandir Tela'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShortsFilterSubscribed((v) => !v);
                          setShortsMoreOpen(false);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
                      >
                        <Bell className={`w-4 h-4 ${shortsFilterSubscribed ? 'text-red-400' : ''}`} />
                        <span>{shortsFilterSubscribed ? 'Ver Todos' : 'Só Inscrições'}</span>
                      </button>
                    </div>
                    {onOpenToguroShop && (
                      <button
                        type="button"
                        onClick={() => {
                          setShortsMoreOpen(false);
                          setExclusiveShortsOpen(false);
                          onOpenToguroShop();
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <Crown className="w-4 h-4" />
                        <span>🥃 Produtos do Toguro · Mansão Maromba (-30% OFF)</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          scrollToShort(activeIndex - 1);
                          setShortsMoreOpen(false);
                        }}
                        disabled={activeIndex <= 0}
                        className="flex-1 py-2.5 rounded-xl bg-white/10 disabled:opacity-35 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <ChevronUp className="w-4 h-4" /> Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          scrollToShort(activeIndex + 1);
                          setShortsMoreOpen(false);
                        }}
                        disabled={activeIndex >= visibleShorts.length - 1}
                        className="flex-1 py-2.5 rounded-xl bg-white/10 disabled:opacity-35 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <ChevronDown className="w-4 h-4" /> Próximo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* PROPAGANDA TOGURO DISCRETA + OPCIONAL */}
        {onOpenToguroShop && (
          <ToguroPromoBanner variant="strip" onOpenToguroShop={onOpenToguroShop} />
        )}

        {/* TOP 5 YOUTUBERS BR — ONLY SHOWN WHEN OPENED VIA ⋮ MENU */}
        {topCreatorsDrawerOpen && brTop5.length > 0 && (
          <section className="rounded-3xl cosmic-card-3d p-3.5 sm:p-4 space-y-3 border border-cyan-400/35">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> TOP 1 AO TOP 5 · YOUTUBERS BRASILEIROS
                </div>
                <h3 className="font-display text-sm sm:text-base font-black text-white">
                  Mídia dos Cria no YouTube Brasil 🇧🇷
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                {onOpenPartners && (
                  <button
                    type="button"
                    onClick={onOpenPartners}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-[11px] font-black flex items-center gap-1 shadow shrink-0"
                  >
                    <Share2 className="w-3 h-3" /> Patrocínio
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTopCreatorsDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {brTop5.map((c, idx) => {
                const isSelected = selectedCreatorFilter === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCreatorFilter(c.id);
                      setShortCategory('creators');
                      setShortSearch(c.shortsQuery);
                      void loadShorts('creators', c.shortsQuery, true, true);
                      onToast(`🔥 Entrando direto nos vídeos de ${c.name}!`);
                    }}
                    className={`w-56 shrink-0 rounded-2xl p-3 border transition flex flex-col justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.35)]'
                        : 'bg-black/45 border-white/15 hover:border-amber-400/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${c.gradient} text-black text-[9px] font-black`}
                        >
                          TOP #{idx + 1}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-300 font-bold">
                          🏆 {c.votes.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs font-black text-white truncate">{c.name}</div>
                      <div className="text-[10px] text-cyan-300 font-mono truncate">
                        {c.handle} · {c.subscribersText}
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">{c.category}</div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCreatorFilter(c.id);
                          setShortCategory('creators');
                          setShortSearch(c.shortsQuery);
                          void loadShorts('creators', c.shortsQuery, true, true);
                          onToast(`🔥 Entrando direto nos vídeos de ${c.name}!`);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-full lux-btn-gold text-[10px] font-black flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-black" /> Assistir Agora
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleVoteBrCreator(c.id, c.name);
                        }}
                        className="py-1.5 px-2 rounded-full lux-btn-obsidian border-amber-400/40 text-amber-200 text-[10px] font-black"
                        title="Reconhecer este criador no Top 5"
                      >
                        +1 🏆
                      </button>
                      <a
                        href={c.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/35 text-red-200"
                        title={`Abrir canal oficial ${c.handle}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {brAllCreators.length > 5 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[10px] font-black text-slate-400 shrink-0">Mais Cria BR:</span>
                {brAllCreators.slice(5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCreatorFilter(c.id);
                      setShortCategory('creators');
                      setShortSearch(c.shortsQuery);
                      void loadShorts('creators', c.shortsQuery, true, true);
                      onToast(`🔥 Entrando direto nos vídeos de ${c.name}!`);
                    }}
                    className="px-3 py-1 rounded-full lux-btn-obsidian hover:border-amber-300 text-[10px] font-bold text-amber-100 whitespace-nowrap transition shrink-0"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ULTRA-CLEAN SHORTS BAR: Play Now + Quick Search + 3-Dot Organized Menu */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {visibleShorts.length > 0 && (
              <button
                onClick={() => openShortIndividual(activeIndex)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-cyan-400 text-black text-xs font-black flex items-center gap-1.5 shadow-[0_0_24px_rgba(250,204,21,0.35)] hover:brightness-110 transition"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> Assistir Reels Agora
              </button>
            )}
            <button
              type="button"
              onClick={() => setShortsMenuOpen((v) => !v)}
              className="px-3 py-2 rounded-full lux-btn-obsidian text-xs font-black text-amber-200 flex items-center gap-1.5"
            >
              <MoreVertical className="w-3.5 h-3.5" />
              <span>{shortsMenuOpen ? 'Fechar Opções' : 'Mais Funções'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              setShortsFilterSubscribed(false);
              void loadShorts(shortCategory, shortSearch, true, true);
            }}
            disabled={shortsLoading}
            className="px-3 py-2 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/10 text-[11px] font-bold text-emerald-300 flex items-center gap-1 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${shortsLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {shortsMenuOpen && (
          <div className="rounded-2xl bg-[#110c24]/95 border border-amber-400/30 p-3 space-y-2.5 shadow-xl">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTopCreatorsDrawerOpen((v) => !v);
                  setShortsMenuOpen(false);
                }}
                className="px-3 py-1.5 rounded-full lux-btn-obsidian text-[11px] font-black text-amber-200 flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5" /> Top 5 Youtubers BR
              </button>
              <button
                type="button"
                onClick={() => {
                  setShortsFilterSubscribed((v) => !v);
                  setShortsMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1 ${
                  shortsFilterSubscribed ? 'bg-red-600 text-white' : 'lux-btn-obsidian text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" /> Inscrições ({subscribedChannels.size})
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1">
              {SHORT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setShortCategory(c.id);
                    void loadShorts(c.id, shortSearch, false, true);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition ${
                    shortCategory === c.id
                      ? 'lux-btn-gold'
                      : 'lux-btn-obsidian text-purple-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void loadShorts(shortCategory, shortSearch, true, true);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-cyan-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={shortSearch}
                  onChange={(e) => setShortSearch(e.target.value)}
                  placeholder="Buscar Reels ou Lives (ex: mc oruan, funk, humor)..."
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
        ) : visibleShorts.length === 0 ? (
          <div className="py-12 text-center rounded-2xl cosmic-card-3d space-y-2">
            <Bell className="w-7 h-7 mx-auto text-cyan-300" />
            <div className="text-xs font-bold text-white">Nenhum vídeo de canais inscritos ainda</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {visibleShorts.map((s, idx) => (
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

                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void openCreatorProfile(s);
                      }}
                      className="px-2 py-0.5 rounded-full bg-black/65 hover:bg-cyan-500/35 backdrop-blur-md border border-white/20 text-[10px] font-bold text-cyan-200 truncate max-w-[135px] transition"
                      title="Abrir perfil do criador"
                    >
                      @{s.creator_name}
                    </button>
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

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1.5 z-10">
                    <div className="text-xs font-black text-white line-clamp-2 leading-snug drop-shadow">
                      {s.title}
                    </div>
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLikeShort(s);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${
                          likedShortIds.has(s.id) || s.liked_by_me
                            ? 'bg-pink-500/35 border border-pink-400 text-pink-200'
                            : 'bg-black/55 border border-white/15 text-cyan-200/90 hover:bg-white/15'
                        }`}
                      >
                        <span>{likedShortIds.has(s.id) || s.liked_by_me ? '❤️' : '🤍'}</span>
                        <span>{fmtCompactCount(s.likes)}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCommentTarget({
                              id: `short:${s.id}`,
                              title: s.title,
                              youtubeId: s.youtube_id,
                            });
                          }}
                          className="px-1.5 py-0.5 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 text-[9px] font-bold text-cyan-200"
                          title="Comentários"
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

      {/* Clean Sub-Navigation Collapsed into 1 Simple Header + 3-Dot Hub Menu */}
      <div className="rounded-2xl glass-panel px-3 py-2 flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setSubTab('shorts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
              subTab === 'shorts'
                ? 'lux-btn-gold'
                : 'bg-white/[0.06] hover:bg-white/15 text-purple-100'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Reels & Shorts</span>
          </button>
          {subTab !== 'shorts' && (
            <span className="text-xs font-black text-amber-200 truncate">
              {subTab === 'live' ? '🔴 Ao Vivo HD' : '🎬 Estúdio Vídeo'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setHubMoreOpen((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-black text-white flex items-center gap-1.5 transition shrink-0"
          title="Mais funções de Reels, Lives e Estúdio"
        >
          <MoreVertical className="w-4 h-4" />
          <span>Mais</span>
        </button>

        {hubMoreOpen && (
          <div className="absolute right-2 top-12 z-40 w-60 rounded-2xl bg-[#140e28]/98 backdrop-blur-xl border border-amber-400/40 shadow-2xl p-2 space-y-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSubTab('shorts');
                setHubMoreOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-white flex items-center gap-2"
            >
              <Film className="w-4 h-4 text-amber-300" /> Reels & Shorts
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab('live');
                setHubMoreOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-rose-200 flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-rose-400" /> Ao Vivo HD ({lives.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab('studio');
                setHubMoreOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-cyan-200 flex items-center gap-2"
            >
              <Video className="w-4 h-4 text-cyan-400" /> Estúdio Criar Vídeo
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab('shorts');
                setPublishOpen(true);
                setHubMoreOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-emerald-300 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Publicar Vídeo Curto
            </button>
          </div>
        )}
      </div>

      {/* === SUB-TAB 1: EXCLUSIVE HORIZONTAL WORLD SHORTS === */}
      {subTab === 'shorts' && (
        <div className="space-y-4">
          {publishOpen && (
            <form
              onSubmit={handlePublishShort}
              className="rounded-3xl cosmic-card-3d p-4 space-y-3 border border-emerald-400/45"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300" /> Enviar Vídeo / Criar Reel
                </h3>
                <button
                  type="button"
                  onClick={() => setPublishOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {newShortVideoData && (
                <video
                  src={newShortVideoData}
                  controls
                  playsInline
                  className="w-full max-h-56 rounded-2xl bg-black border border-white/15 object-contain"
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={newShortTitle}
                  onChange={(e) => setNewShortTitle(e.target.value)}
                  placeholder="Título do vídeo..."
                  className="px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  value={newShortDesc}
                  onChange={(e) => setNewShortDesc(e.target.value)}
                  placeholder="Descrição / #hashtag..."
                  className="px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-cyan-200 cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{newShortVideoData ? '✅ Trocar Vídeo' : 'Selecionar Vídeo do Celular / PC'}</span>
                  <input type="file" accept="video/*" onChange={handleVideoFileChange} className="hidden" />
                </label>
                <button
                  type="submit"
                  disabled={publishingShort}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black shadow-lg"
                >
                  {publishingShort ? 'Publicando...' : 'Publicar 🚀'}
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
          <div className="fixed inset-0 z-[9992] bg-black overscroll-contain overflow-hidden p-0 sm:p-4 flex flex-col">
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
                        claimMediaFocus('reels');
                        onPauseCatalogPlayer();
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
                        claimMediaFocus('reels');
                        onPauseCatalogPlayer();
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
            creatorName={user?.name || 'Criador LENKYX'}
            creatorColor={user?.avatarColor || 'from-cyan-400 to-pink-500'}
            onPauseCatalogPlayer={onPauseCatalogPlayer}
            onAutoPublished={(createdShort) => {
              setShorts((prev) => [createdShort, ...prev.filter((s) => s.id !== createdShort.id)]);
              setActiveIndex(0);
              setSubTab('shorts');
            }}
            onToast={onToast}
          />
        </Suspense>
      )}

      {/* === YOUTUBE-STYLE CREATOR CHANNEL PROFILE MODAL === */}
      {creatorModalOpen &&
        creatorProfile &&
        createPortal(
          <div
            onClick={() => setCreatorModalOpen(false)}
            className="fixed inset-0 z-[9996] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-5"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl h-[86vh] max-h-[760px] rounded-t-3xl sm:rounded-3xl bg-[#0e0722]/98 border border-white/20 flex flex-col overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.28)]"
            >
              {/* Banner */}
              <div className="relative h-28 sm:h-36 bg-gradient-to-r from-[#23104c] via-[#13294b] to-[#2e1042] shrink-0 overflow-hidden">
                {creatorProfile.bannerUrl && (
                  <img
                    src={creatorProfile.bannerUrl}
                    alt={creatorProfile.channelName}
                    className="w-full h-full object-cover opacity-55"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0722] via-transparent to-black/40" />
                <button
                  type="button"
                  onClick={() => setCreatorModalOpen(false)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/55 hover:bg-rose-500/80 border border-white/20 text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Channel Header */}
              <div className="px-4 sm:px-6 pb-3 -mt-10 relative z-10 shrink-0 space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex items-end gap-3 min-w-0">
                    <div className="w-20 h-20 rounded-full border-4 border-[#0e0722] bg-gradient-to-br from-cyan-400 to-pink-500 overflow-hidden flex items-center justify-center shadow-xl shrink-0">
                      {creatorProfile.avatarUrl ? (
                        <img
                          src={creatorProfile.avatarUrl}
                          alt={creatorProfile.channelName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-black text-white">
                          {creatorProfile.channelName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 pb-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base sm:text-lg font-black text-white truncate">
                          {creatorProfile.channelName}
                        </h3>
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      </div>
                      <div className="text-xs font-bold text-cyan-300 truncate">
                        {creatorProfile.handle}
                        {creatorProfile.subscriberText ? ` · ${creatorProfile.subscriberText}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggleSubscribe(creatorProfile.channelName)}
                      className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition shadow ${
                        subscribedChannels.has(normalizeChannelKey(creatorProfile.channelName))
                          ? 'bg-white/20 border border-white/25 text-white'
                          : 'bg-gradient-to-r from-red-600 to-pink-500 text-white hover:brightness-110'
                      }`}
                    >
                      {subscribedChannels.has(normalizeChannelKey(creatorProfile.channelName)) ? (
                        <>
                          <BellRing className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Inscrito</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5" />
                          <span>Inscrever-se</span>
                        </>
                      )}
                    </button>

                    {(creatorProfile.shorts.length > 0 || creatorProfile.videos.length > 0) && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePlayCreatorList(
                            creatorProfile.shorts.length > 0
                              ? creatorProfile.shorts
                              : creatorProfile.videos,
                            0
                          )
                        }
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-xs font-black flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Play Tudo</span>
                      </button>
                    )}
                  </div>
                </div>

                {creatorProfile.description && (
                  <p className="text-xs text-purple-100/80 line-clamp-2">
                    {creatorProfile.description}
                  </p>
                )}

                {/* Channel Tabs: Shorts vs Videos */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <button
                    type="button"
                    onClick={() => setCreatorTab('shorts')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition ${
                      creatorTab === 'shorts'
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-purple-100 hover:bg-white/20'
                    }`}
                  >
                    Reels / Shorts ({creatorProfile.shorts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatorTab('videos')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition ${
                      creatorTab === 'videos'
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-purple-100 hover:bg-white/20'
                    }`}
                  >
                    Vídeos ({creatorProfile.videos.length})
                  </button>
                </div>
              </div>

              {/* Channel Videos Grid */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 pb-6">
                {creatorLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-cyan-300 font-bold">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Carregando canal de {creatorProfile.channelName}...</span>
                  </div>
                ) : (
                  (() => {
                    const list =
                      creatorTab === 'shorts' ? creatorProfile.shorts : creatorProfile.videos;
                    if (list.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-purple-200/75">
                          Nenhum conteúdo nesta aba do canal.
                        </div>
                      );
                    }
                    return (
                      <div
                        className={
                          creatorTab === 'shorts'
                            ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
                            : 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                        }
                      >
                        {list.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handlePlayCreatorList(list, idx)}
                            className="group rounded-2xl overflow-hidden bg-white/[0.06] hover:bg-white/15 border border-white/15 text-left transition"
                          >
                            <div
                              className={`relative bg-black overflow-hidden ${
                                creatorTab === 'shorts' ? 'aspect-[9/16]' : 'aspect-video'
                              }`}
                            >
                              <img
                                src={item.poster_url || '/covers/album-official.jpg'}
                                alt={item.title}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/55 group-hover:bg-cyan-400 group-hover:text-black text-white flex items-center justify-center transition">
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </span>
                              {item.duration_text && (
                                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                                  {item.duration_text}
                                </span>
                              )}
                            </div>
                            <div className="p-2.5">
                              <div className="text-xs font-black text-white line-clamp-2">
                                {item.title}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      <TargetCommentsModal
        open={Boolean(commentTarget)}
        onClose={() => setCommentTarget(null)}
        targetId={commentTarget?.id || ''}
        targetTitle={commentTarget?.title || ''}
        youtubeId={commentTarget?.youtubeId || ''}
        user={user}
      />
    </div>
  );
};

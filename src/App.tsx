import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Music,
  Wand2,
  QrCode,
  Globe2,
  ListMusic,
  Search,
  Sparkles,
  LogOut,
  Rocket,
  Film,
  X,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Minimize2,
  Clapperboard,
  Volume2,
  VolumeX,
  Maximize2,
  ArrowLeft,
  Scale,
  Shield,
  Share2,
  Trophy,
  Users,
  Target,
  AudioWaveform,
  Crown,
} from 'lucide-react';
import {
  AppMode,
  AppSettings,
  AudioVersion,
  LiveStats,
  MovieItem,
  TabId,
  Track,
  UserPlaylist,
} from './types';
import { isAndroidApk } from './utils/androidBridge';
import { CatalogView } from './components/CatalogView';
import { WorldExploreView } from './components/WorldExploreView';
import { PlaylistsView } from './components/PlaylistsView';
import { CosmicSpaceBackdrop } from './components/CosmicSpaceBackdrop';
const MoviesView = React.lazy(() => import('./components/MoviesView').then((m) => ({ default: m.MoviesView })));
const SportsArenaView = React.lazy(() =>
  import('./components/SportsArenaView').then((m) => ({ default: m.SportsArenaView }))
);
const StudioCreateView = React.lazy(() =>
  import('./components/StudioCreateView').then((m) => ({ default: m.StudioCreateView }))
);
const CosmicSearchView = React.lazy(() =>
  import('./components/CosmicSearchView').then((m) => ({ default: m.CosmicSearchView }))
);
import { BassBoostLevel, MiniPlayer } from './components/MiniPlayer';
import { LegalTermsModal } from './components/LegalTermsModal';
import { CosmicGtaLoader } from './components/CosmicGtaLoader';
import { PlayerQueueStrip } from './components/PlayerQueueStrip';
import { PixModal } from './components/PixModal';
import { ShareModal } from './components/ShareModal';
import { UploadTrackModal } from './components/UploadTrackModal';
import { CreatorModal } from './components/CreatorModal';
import { authFetch, setAuthToken } from './utils/api';
import {
  addUserLocalTrack,
  deleteUserLocalTrack,
  loadUserPlaylists,
  loadUserTracks,
  saveUserPlaylists,
} from './utils/userVault';
import {
  downloadTrackOffline,
  getOfflineTrackIds,
  removeTrackOffline,
  resolvePlayableAudioUrl,
} from './utils/offlineCache';

const DEFAULT_SETTINGS: AppSettings = {
  artistName: 'LENKYX',
  brandSubtitle: 'UNIVERSO LIVRE',
  tagline: 'Som Pesado · Clipes HD · Cinema & Séries · Futebol & UFC Ao Vivo — Sem Anúncios',
  pixKey: '41651191808',
  pixKeyConfigured: true,
  pixName: 'LENKYX COSMIC PHONK',
  pixCity: 'CAMPO GRANDE',
  pixMessage: '100% gratuito e sem anúncios! Sua doação exclusiva via PIX (PicPay) ajuda na manutenção diária do app.',
  publicUrl: 'https://lenkyx-cosmic-phonk.onrender.com',
  apkDownloadUrl: 'https://drive.google.com/uc?id=1SsBXDSKNWQxsPqURWWavVhcjvYUJgRFI&export=download',
  youtubeUrl: '',
  sunoHandle: '@lenkyx',
  sunoProfileUrl: 'https://suno.com/@lenkyx',
  dailyGoal: 10,
  totalGoal: 1000,
};

const ACCENT_CYCLE = [
  'from-pink-500 to-purple-600',
  'from-cyan-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
];

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem('lenkyx_live_sid');
    if (existing) return existing;
    const created = 'sid-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('lenkyx_live_sid', created);
    return created;
  } catch {
    return 'sid-' + Date.now().toString(36);
  }
}

export function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('catalog');
  const [tabHistory, setTabHistory] = useState<TabId[]>([]);

  // Real-time online listeners & Daily PIX Goal
  const [liveStats, setLiveStats] = useState<LiveStats>({
    onlineCount: 1,
    dateKey: '',
    dailyGoalBrl: 50,
    dailyCollectedBrl: 0,
    dailyContributors: 0,
  });
  const liveSessionIdRef = useRef<string>(getOrCreateSessionId());

  // Bass Boost Web Audio nodes + Speed + Loop
  const [bassBoostLevel, setBassBoostLevel] = useState<BassBoostLevel>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [loopTrack, setLoopTrack] = useState<boolean>(false);
  const loopTrackRef = useRef<boolean>(false);
  useEffect(() => {
    loopTrackRef.current = loopTrack;
    if (audioRef.current) audioRef.current.loop = loopTrack;
  }, [loopTrack]);
  const bassAudioCtxRef = useRef<AudioContext | null>(null);
  const bassLowShelfRef = useRef<BiquadFilterNode | null>(null);
  const bassPeakRef = useRef<BiquadFilterNode | null>(null);
  const bassGainRef = useRef<GainNode | null>(null);

  // Cinematic Startup Intro + Auto-Update Check on Entry
  const [gtaLoaderOpen, setGtaLoaderOpen] = useState(() => !sessionStorage.getItem('lenkyx_splash_done'));
  const [introStatus, setIntroStatus] = useState('Sincronizando catálogo & verificando atualizações...');

  const navigateTab = useCallback((next: TabId) => {
    setActiveTab((prev) => {
      if (prev === next) return prev;
      setTabHistory((h) => [...h.slice(-15), prev]);
      return next;
    });
    window.requestAnimationFrame(() => {
      document.getElementById('lenkyx-main-scroll')?.scrollTo({ top: 0, behavior: 'auto' });
    });
  }, []);

  const goBackTab = useCallback(() => {
    setTabHistory((h) => {
      if (h.length > 0) {
        const last = h[h.length - 1];
        setActiveTab(last);
        return h.slice(0, -1);
      }
      setActiveTab('catalog');
      return h;
    });
  }, []);

  // Global search bar state
  const [globalSearch, setGlobalSearch] = useState('');
  const [worldTriggerQuery, setWorldTriggerQuery] = useState('');
  const [worldSearchNonce, setWorldSearchNonce] = useState(0);
  const [pendingMovie, setPendingMovie] = useState<MovieItem | null>(null);

  // Creator auth state (default = Fan mode, hidden unless 5 logo taps)
  const [mode, setMode] = useState<AppMode>('fan');
  const [hasCustomPassword, setHasCustomPassword] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);

  // Playlists & Personal Uploaded Tracks (IndexedDB)
  const [playlists, setPlaylists] = useState<UserPlaylist[]>(() => loadUserPlaylists());
  const [userTracks, setUserTracks] = useState<Track[]>([]);
  const [worldCacheTracks, setWorldCacheTracks] = useState<Track[]>([]);

  // Global Player state (On-Demand: starts closed until user plays a song!)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<{
    loadVideoById?: (arg: string | { videoId: string; suggestedQuality?: string }) => void;
    playVideo?: () => void;
    pauseVideo?: () => void;
    stopVideo?: () => void;
    seekTo?: (sec: number, allowSeekAhead?: boolean) => void;
    setVolume?: (vol: number) => void;
    setPlaybackQuality?: (q: string) => void;
    getCurrentTime?: () => number;
    getDuration?: () => number;
    getPlayerState?: () => number;
  } | null>(null);
  const ytPendingVideoRef = useRef<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [musicMenuOpen, setMusicMenuOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState<AudioVersion>('v1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.88);
  const [muted, setMuted] = useState(false);

  const [playQueue, setPlayQueue] = useState<Track[]>([]);
  const playQueueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const handlePlayTrackRef = useRef<
    ((track: Track, requestedVersion?: AudioVersion, customQueue?: Track[]) => Promise<void>) | null
  >(null);
  useEffect(() => {
    playQueueRef.current = playQueue;
  }, [playQueue]);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const [watchingMovie, setWatchingMovie] = useState(false);

  // Omnibox & Search states
  const [searchViewQuery, setSearchViewQuery] = useState('');
  const [searchViewPrivate, setSearchViewPrivate] = useState(false);
  const [omniboxOpen, setOmniboxOpen] = useState(false);
  const [omniboxSuggestions, setOmniboxSuggestions] = useState<string[]>([]);
  const omniboxWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!omniboxOpen) return;
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(globalSearch.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setOmniboxSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        }
      } catch {
        // ignore
      }
    }, 180);
    return () => window.clearTimeout(t);
  }, [globalSearch, omniboxOpen]);

  useEffect(() => {
    const onDocDown = (ev: MouseEvent) => {
      if (omniboxWrapRef.current && !omniboxWrapRef.current.contains(ev.target as Node)) {
        setOmniboxOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  // Offline Downloads state
  const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(() => getOfflineTrackIds());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [isPlayingFromOffline, setIsPlayingFromOffline] = useState(false);

  // Secret Creator trigger (5 rapid taps on LENKYX logo OR #criador / ?studio=1)
  const brandTapRef = useRef<{ count: number; last: number }>({ count: 0, last: 0 });

  // Modals & notifications
  const [pixOpen, setPixOpen] = useState(false);
  const [pixInitialTab, setPixInitialTab] = useState<'donate' | 'ranking' | 'collection' | 'config'>('donate');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTrack, setShareTrack] = useState<Track | null>(null);
  const [clipTheaterOpen, setClipTheaterOpen] = useState(false);
  const [, setClipPrerollActive] = useState(false);
  const clipTheaterOpenRef = useRef(false);
  useEffect(() => {
    clipTheaterOpenRef.current = clipTheaterOpen;
    if (clipTheaterOpen && currentTrackRef.current?.youtubeVideoId && clipQualityRef.current !== 'default') {
      ytPlayerRef.current?.setPlaybackQuality?.(clipQualityRef.current);
    }
  }, [clipTheaterOpen]);
  const clipStageRef = useRef<HTMLDivElement | null>(null);
  const [clipFitMode, setClipFitMode] = useState<'standard' | 'compact' | 'fullscreen'>('standard');
  const [clipQuality, setClipQuality] = useState<'medium' | 'large' | 'hd720' | 'default'>('hd720');
  const clipQualityRef = useRef<'medium' | 'large' | 'hd720' | 'default'>('hd720');
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  useEffect(() => {
    clipQualityRef.current = clipQuality;
    if (clipQuality !== 'default') {
      ytPlayerRef.current?.setPlaybackQuality?.(clipQuality);
    }
  }, [clipQuality]);

  useEffect(() => {
    const onFs = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsNativeFullscreen(fs);
      if (fs && clipQualityRef.current !== 'default') {
        window.setTimeout(() => {
          ytPlayerRef.current?.setPlaybackQuality?.(clipQualityRef.current);
        }, 250);
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const [legalOpen, setLegalOpen] = useState(false);
  const [appUpdateInfo, setAppUpdateInfo] = useState<{
    latestVersionName: string;
    apkUrl: string;
    releaseNotes: string;
  } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [lyricsTrack, setLyricsTrack] = useState<Track | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  // Entry Cinematic Intro + Automatic Service Worker Update Check
  useEffect(() => {
    if (!gtaLoaderOpen) return;

    let cancelled = false;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then(async (reg) => {
          if (!reg || cancelled) return;
          await reg.update().catch(() => {});
          if (reg.waiting) {
            setIntroStatus('Aplicando nova atualização automaticamente...');
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch(() => {});
    }

    const t = window.setTimeout(() => {
      if (!cancelled) {
        setGtaLoaderOpen(false);
        sessionStorage.setItem('lenkyx_splash_done', '1');
      }
    }, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [gtaLoaderOpen]);

  const handleBrandTap = useCallback(() => {
    setActiveTab('catalog');
    const now = Date.now();
    if (now - brandTapRef.current.last > 2000) {
      brandTapRef.current = { count: 1, last: now };
    } else {
      brandTapRef.current = { count: brandTapRef.current.count + 1, last: now };
    }
    if (brandTapRef.current.count >= 5) {
      brandTapRef.current = { count: 0, last: 0 };
      setCreatorModalOpen(true);
    }
  }, []);

  const allTracksPool = useMemo(() => {
    const map = new Map<string, Track>();
    tracks.forEach((t) => map.set(t.id, t));
    userTracks.forEach((t) => map.set(t.id, t));
    worldCacheTracks.forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
    playlists.forEach((pl) => {
      if (pl.savedExternalTracks) {
        Object.values(pl.savedExternalTracks).forEach((t) => {
          if (!map.has(t.id)) map.set(t.id, t);
        });
      }
    });
    return Array.from(map.values());
  }, [tracks, userTracks, worldCacheTracks, playlists]);

  useEffect(() => {
    void loadUserTracks().then((loaded: Track[]) => setUserTracks(loaded));
  }, []);

  // Silent Auto-Update check for Android APK
  useEffect(() => {
    if (!isAndroidApk()) return;
    fetch('/api/app-update')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.updateAvailable && d?.apkUrl) {
          setAppUpdateInfo({
            latestVersionName: String(d.latestVersionName || 'Nova Versão'),
            apkUrl: String(d.apkUrl),
            releaseNotes: String(d.releaseNotes || ''),
          });
        }
      })
      .catch(() => {});
  }, []);

  // Secret URL trigger (#criador or ?studio=1)
  useEffect(() => {
    const checkSecretTrigger = () => {
      const p = new URLSearchParams(window.location.search);
      if (window.location.hash === '#criador' || p.get('studio') === '1') {
        setCreatorModalOpen(true);
      }
    };
    checkSecretTrigger();
    window.addEventListener('hashchange', checkSecretTrigger);
    return () => window.removeEventListener('hashchange', checkSecretTrigger);
  }, []);

  // Fetch initial catalog + check creator session
  useEffect(() => {
    (async () => {
      try {
        let data: { tracks?: Track[]; settings?: Partial<AppSettings> } | null = null;
        try {
          const [stateRes, authRes] = await Promise.all([
            authFetch('/api/state'),
            authFetch('/api/auth/status'),
          ]);
          if (stateRes.ok) {
            data = await stateRes.json();
          }
          if (authRes.ok) {
            const authData = await authRes.json();
            setMode(authData.authenticated ? 'creator' : 'fan');
            setHasCustomPassword(Boolean(authData.hasCustomPassword));
          }
        } catch {
          // offline fallback below
        }

        if (!data || !Array.isArray(data.tracks) || data.tracks.length === 0) {
          const seedRes = await fetch('/seed-data.json');
          if (seedRes.ok) {
            data = await seedRes.json();
          }
        }

        const loadedTracks: Track[] = data?.tracks || [];
        setTracks(loadedTracks);
        setPlayQueue(loadedTracks);
        if (data?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data!.settings,
            pixKey: '41651191808',
            pixKeyConfigured: true,
            apkDownloadUrl: (data!.settings?.apkDownloadUrl || '').trim() || prev.apkDownloadUrl,
          }));
        }

        // Only open MiniPlayer automatically if arriving from a shared ?track= link!
        const params = new URLSearchParams(window.location.search);
        const deepId = params.get('track');
        if (deepId && loadedTracks.length) {
          const found = loadedTracks.find((t: Track) => t.id === deepId);
          if (found) {
            setCurrentTrack(found);
            setMusicMenuOpen(true);
            showToast(`🎵 Faixa compartilhada: ${found.emoji} ${found.title}`);
          }
        }
      } catch {
        showToast('Modo offline ativo — toque nas faixas baixadas para ouvir.');
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  // Setup persistent global <audio> element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = volume;
    audioRef.current = audio;

    let lastAudioSec = -1;
    const onTime = () => {
      const sec = Math.floor(audio.currentTime || 0);
      if (sec !== lastAudioSec) {
        lastAudioSec = sec;
        setCurrentTime(audio.currentTime || 0);
      }
    };
    const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  // Setup YouTube IFrame Full-Length Audio & Clip Engine
  useEffect(() => {
    const win = window as unknown as {
      YT?: {
        Player: new (
          id: string,
          opts: Record<string, unknown>
        ) => NonNullable<typeof ytPlayerRef.current>;
      };
      onYouTubeIframeAPIReady?: () => void;
    };

    const initYt = () => {
      if (ytPlayerRef.current || !win.YT?.Player) return;
      const hostEl = document.getElementById('lenkyx-yt-audio-host');
      if (!hostEl) return;
      const isLocalLoopback =
        window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
      const playerVars: Record<string, unknown> = {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        iv_load_policy: 3,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        fs: 0,
      };
      if (!isLocalLoopback) {
        playerVars.origin = window.location.origin;
      }
      ytPlayerRef.current = new win.YT.Player('lenkyx-yt-audio-host', {
        height: '100%',
        width: '100%',
        playerVars,
        events: {
          onReady: () => {
            ytPlayerRef.current?.setVolume?.(Math.round(volume * 100));
            if (clipQualityRef.current !== 'default') {
              ytPlayerRef.current?.setPlaybackQuality?.(clipQualityRef.current);
            }
            if (ytPendingVideoRef.current) {
              const vid = ytPendingVideoRef.current;
              ytPendingVideoRef.current = null;
              const q = clipTheaterOpenRef.current ? clipQualityRef.current : 'medium';
              ytPlayerRef.current?.loadVideoById?.(
                q !== 'default' ? { videoId: vid, suggestedQuality: q } : vid
              );
            }
          },
          onError: () => {
            if (!currentTrackRef.current?.youtubeVideoId) return;
            showToast('Este clipe bloqueou player embutido — pulando para o próximo...');
            const list = playQueueRef.current.length ? playQueueRef.current : tracks;
            const cur = currentTrackRef.current;
            if (cur && list.length > 1) {
              const idx = list.findIndex((t) => t.id === cur.id);
              const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
              if (next && next.id !== cur.id && handlePlayTrackRef.current) {
                window.setTimeout(() => void handlePlayTrackRef.current?.(next, 'v1', list), 900);
              }
            }
          },
          onStateChange: (ev: { data: number }) => {
            if (!currentTrackRef.current?.youtubeVideoId) return;
            if (ev.data === 1) {
              setIsPlaying(true);
              const dur = ytPlayerRef.current?.getDuration?.() || 0;
              if (dur > 0) setDuration(dur);
              if (clipQualityRef.current !== 'default') {
                ytPlayerRef.current?.setPlaybackQuality?.(clipQualityRef.current);
              }
            } else if (ev.data === 2) {
              setIsPlaying(false);
            } else if (ev.data === 0) {
              setIsPlaying(false);
              const list = playQueueRef.current.length ? playQueueRef.current : tracks;
              const cur = currentTrackRef.current;
              if (cur && list.length > 0) {
                const idx = list.findIndex((t) => t.id === cur.id);
                const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
                if (next && handlePlayTrackRef.current) {
                  void handlePlayTrackRef.current(next, 'v1', list);
                }
              }
            }
          },
        },
      });
    };

    if (win.YT?.Player) {
      initYt();
    } else {
      const prevReady = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        initYt();
      };
      if (!document.getElementById('yt-iframe-api-script')) {
        const s = document.createElement('script');
        s.id = 'yt-iframe-api-script';
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }

    let lastYtSec = -1;
    const timer = window.setInterval(() => {
      if (!currentTrackRef.current?.youtubeVideoId || !ytPlayerRef.current) return;
      const st = ytPlayerRef.current.getPlayerState?.();
      if (st === 1) {
        const ct = ytPlayerRef.current.getCurrentTime?.() || 0;
        const sec = Math.floor(ct);
        if (sec !== lastYtSec) {
          lastYtSec = sec;
          const dt = ytPlayerRef.current.getDuration?.() || 0;
          setCurrentTime(ct);
          if (dt > 0) setDuration(dt);
        }
      }
    }, 900);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pauseCatalogPlayer = useCallback(() => {
    audioRef.current?.pause();
    ytPlayerRef.current?.pauseVideo?.();
  }, []);

  // Real-time online listeners + daily PIX goal heartbeat
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const r = await fetch('/api/live-stats/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: liveSessionIdRef.current,
            activity: activeTab,
          }),
        });
        if (r.ok && !cancelled) {
          const data: LiveStats = await r.json();
          setLiveStats(data);
        }
      } catch {
        // ignore offline ping failure
      }
    };
    void ping();
    const t = window.setInterval(() => void ping(), 25000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [activeTab]);

  // Apply Web Audio Bass Boost + Anti-Clipping Limiter safely across all menus
  const applyBassBoostGain = useCallback((level: BassBoostLevel) => {
    const audio = audioRef.current;
    if (audio && (!currentTrackRef.current?.youtubeVideoId || Boolean(currentTrackRef.current?.audioUrl))) {
      const curSrc = audio.currentSrc || audio.src || '';
      const isSameOriginOrBlob =
        !curSrc ||
        curSrc.startsWith('blob:') ||
        curSrc.startsWith('data:') ||
        curSrc.startsWith(window.location.origin) ||
        curSrc.startsWith('/');

      if (level > 0 && isSameOriginOrBlob && !bassAudioCtxRef.current) {
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const source = ctx.createMediaElementSource(audio);
            const lowShelf = ctx.createBiquadFilter();
            lowShelf.type = 'lowshelf';
            lowShelf.frequency.value = 95;
            const peak = ctx.createBiquadFilter();
            peak.type = 'peaking';
            peak.frequency.value = 55;
            peak.Q.value = 1.1;
            const gain = ctx.createGain();
            gain.gain.value = 1.0;
            const limiter = ctx.createDynamicsCompressor();
            limiter.threshold.value = -3;
            limiter.knee.value = 6;
            limiter.ratio.value = 12;
            limiter.attack.value = 0.003;
            limiter.release.value = 0.12;
            source.connect(lowShelf);
            lowShelf.connect(peak);
            peak.connect(gain);
            gain.connect(limiter);
            limiter.connect(ctx.destination);
            bassAudioCtxRef.current = ctx;
            bassLowShelfRef.current = lowShelf;
            bassPeakRef.current = peak;
            bassGainRef.current = gain;
          }
        } catch {
          // Fallback if already attached
        }
      }
      if (bassAudioCtxRef.current?.state === 'suspended') {
        void bassAudioCtxRef.current.resume().catch(() => {});
      }
      const shelfGains = [0, 4.5, 9, 14];
      const peakGains = [0, 3, 6.5, 10];
      const punchGains = [1.0, 1.08, 1.18, 1.28];
      if (bassLowShelfRef.current) bassLowShelfRef.current.gain.value = shelfGains[level] || 0;
      if (bassPeakRef.current) bassPeakRef.current.gain.value = peakGains[level] || 0;
      if (bassGainRef.current) bassGainRef.current.gain.value = punchGains[level] || 1.0;
    }

    // For embed-stream tracks, keep volume punch synced cleanly
    if (currentTrackRef.current?.youtubeVideoId && !currentTrackRef.current?.audioUrl && ytPlayerRef.current?.setVolume) {
      const targetVol = muted ? 0 : Math.min(100, Math.round((level > 0 ? Math.max(volume, 0.92) : volume) * 100));
      ytPlayerRef.current.setVolume(targetVol);
    }
  }, [volume, muted]);

  const handleSetBassBoostLevel = useCallback(
    (level: BassBoostLevel) => {
      setBassBoostLevel(level);
      applyBassBoostGain(level);
      const labels = ['Graves Normal', 'Graves Suave (+4dB)', 'Graves Pesado (+9dB)', 'Subwoofer Máximo (+14dB)'];
      showToast(`🔊 ${labels[level]}`);
    },
    [applyBassBoostGain, showToast]
  );

  const handleCycleBassBoost = useCallback(() => {
    setBassBoostLevel((prev) => {
      const next = ((prev + 1) % 4) as BassBoostLevel;
      applyBassBoostGain(next);
      const labels = ['Graves Normal', 'Graves Suave (+4dB)', 'Graves Pesado (+9dB)', 'Subwoofer Máximo (+14dB)'];
      showToast(`🔊 ${labels[next]}`);
      return next;
    });
  }, [applyBassBoostGain, showToast]);

  const handleCycleSpeed = useCallback(() => {
    const speeds = [1, 1.15, 1.25, 0.85];
    setPlaybackSpeed((prev) => {
      const next = speeds[(speeds.indexOf(prev) + 1) % speeds.length] || 1;
      if (audioRef.current) audioRef.current.playbackRate = next;
      showToast(`⚡ Velocidade: ${next}x`);
      return next;
    });
  }, [showToast]);

  const handleToggleLoop = useCallback(() => {
    setLoopTrack((prev) => {
      const next = !prev;
      showToast(next ? '🔁 Repetir música ativado' : 'Repetição desativada');
      return next;
    });
  }, [showToast]);

  const handlePlayTrack = useCallback(
    async (track: Track, requestedVersion?: AudioVersion, customQueue?: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      setMusicMenuOpen(true);

      if (track.source === 'world_full' || track.source === 'world_preview') {
        setWorldCacheTracks((prev) => (prev.some((x) => x.id === track.id) ? prev : [track, ...prev].slice(0, 60)));
      }
      if (customQueue && customQueue.length > 0) {
        setPlayQueue(customQueue);
        playQueueRef.current = customQueue;
      }

      const targetVersion: AudioVersion =
        requestedVersion || (currentTrack?.id === track.id ? activeVersion : 'v1');
      const finalVersion: AudioVersion = targetVersion === 'v2' && track.audioUrlV2 ? 'v2' : 'v1';

      if (currentTrack?.id === track.id && activeVersion === finalVersion && !requestedVersion) {
        if (track.youtubeVideoId && !track.audioUrl) {
          const st = ytPlayerRef.current?.getPlayerState?.();
          if (st === 1) {
            ytPlayerRef.current?.pauseVideo?.();
          } else {
            ytPlayerRef.current?.playVideo?.();
          }
          return;
        }
        if (audio.paused) {
          await audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        return;
      }

      setCurrentTrack(track);
      currentTrackRef.current = track;
      setActiveVersion(finalVersion);

      if (track.youtubeVideoId && !track.audioUrl) {
        audio.pause();
        audio.removeAttribute('src');
        setIsPlayingFromOffline(false);
        setCurrentTime(0);
        setDuration(track.durationSec || 0);
        if (ytPlayerRef.current?.loadVideoById) {
          ytPlayerRef.current.setVolume?.(muted ? 0 : Math.round(volume * 100));
          const q = clipTheaterOpenRef.current ? clipQualityRef.current : 'medium';
          ytPlayerRef.current.loadVideoById(
            q !== 'default' ? { videoId: track.youtubeVideoId, suggestedQuality: q } : track.youtubeVideoId
          );
          setIsPlaying(true);
        } else {
          ytPendingVideoRef.current = track.youtubeVideoId;
        }
        return;
      }

      ytPlayerRef.current?.pauseVideo?.();
      setClipTheaterOpen(false);

      const resolved = await resolvePlayableAudioUrl(track, finalVersion);
      setIsPlayingFromOffline(resolved.fromOffline);
      const playableSrc =
        !resolved.fromOffline &&
        resolved.url.startsWith('https://') &&
        (resolved.url.includes('audius') || resolved.url.includes('archive.org') || resolved.url.includes('suno'))
          ? `/api/audio-proxy?url=${encodeURIComponent(resolved.url)}`
          : resolved.url;
      audio.src = playableSrc;
      audio.volume = muted ? 0 : volume;
      audio.muted = muted;
      audio.playbackRate = playbackSpeed;
      audio.loop = loopTrackRef.current;
      audio.load();
      if (bassBoostLevel > 0) {
        applyBassBoostGain(bassBoostLevel);
      }
      try {
        await audio.play();
        if (!track.source || track.source === 'lenkyx') {
          authFetch(`/api/tracks/${track.id}/play`, { method: 'POST' })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d && typeof d.plays === 'number') {
                setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, plays: d.plays } : t)));
              }
            })
            .catch(() => {});
        }
      } catch {
        showToast(
          !navigator.onLine && !resolved.fromOffline
            ? 'Sem internet — baixe a música Offline antes para ouvir sem conexão.'
            : 'Toque em Play novamente para iniciar o áudio.'
        );
      }
    },
    [currentTrack?.id, activeVersion, volume, muted, showToast]
  );

  useEffect(() => {
    handlePlayTrackRef.current = handlePlayTrack;
  }, [handlePlayTrack]);

  const openClipWithIntro = useCallback(
    (track: Track, queue?: Track[]) => {
      setClipPrerollActive(false);
      setClipTheaterOpen(true);
      void handlePlayTrack(track, 'v1', queue);
    },
    [handlePlayTrack]
  );

  const handleToggleOffline = useCallback(
    async (track: Track) => {
      if (track.youtubeVideoId && !track.audioUrl) {
        showToast('Use as faixas LENKYX para baixar e ouvir sem internet!');
        return;
      }
      if (offlineTrackIds.has(track.id)) {
        await removeTrackOffline(track.id);
        setOfflineTrackIds(getOfflineTrackIds());
        showToast(`🗑️ "${track.title}" removida do modo offline.`);
        return;
      }
      setDownloadingIds((prev) => new Set(prev).add(track.id));
      try {
        const entry = await downloadTrackOffline(track);
        setOfflineTrackIds(getOfflineTrackIds());
        const mb = (entry.bytes / (1024 * 1024)).toFixed(1);
        showToast(`📱 "${track.title}" salva no aparelho (${mb} MB) — toca offline!`);
      } catch {
        showToast(`Não foi possível baixar "${track.title}" offline agora.`);
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    },
    [offlineTrackIds, showToast]
  );

  const handleDownloadAllOffline = useCallback(async () => {
    const missing = tracks.filter((t) => !offlineTrackIds.has(t.id));
    if (missing.length === 0) {
      showToast('✅ Todas as músicas já estão salvas offline!');
      return;
    }
    setDownloadingAll(true);
    let okCount = 0;
    for (const track of missing) {
      setDownloadingIds((prev) => new Set(prev).add(track.id));
      try {
        await downloadTrackOffline(track);
        okCount++;
        setOfflineTrackIds(getOfflineTrackIds());
      } catch {
        // continue
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    }
    setDownloadingAll(false);
    showToast(`📱 ${okCount} músicas salvas offline no aparelho!`);
  }, [tracks, offlineTrackIds, showToast]);

  // Auto-advance to next track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const list = playQueueRef.current.length ? playQueueRef.current : tracks;
      if (!currentTrack || !list.length) return;
      const idx = list.findIndex((t) => t.id === currentTrack.id);
      const next = list[(idx + 1) % list.length];
      if (next) void handlePlayTrack(next, 'v1', list);
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [currentTrack, tracks, handlePlayTrack]);

  const handleSelectVersion = (ver: AudioVersion) => {
    if (!currentTrack) return;
    if (ver === 'v2' && !currentTrack.audioUrlV2) return;
    void handlePlayTrack(currentTrack, ver);
  };

  const handleTogglePlay = async () => {
    if (!currentTrack) return;
    if (currentTrack.youtubeVideoId && !currentTrack.audioUrl) {
      const st = ytPlayerRef.current?.getPlayerState?.();
      if (st === 1) {
        ytPlayerRef.current?.pauseVideo?.();
      } else {
        ytPlayerRef.current?.playVideo?.();
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) {
      await handlePlayTrack(currentTrack, activeVersion);
      return;
    }
    if (audio.paused) {
      await audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const handlePrevNext = useCallback(
    (dir: -1 | 1) => {
      const list = playQueueRef.current.length ? playQueueRef.current : tracks;
      if (!list.length) return;
      const idx = currentTrack ? list.findIndex((t) => t.id === currentTrack.id) : 0;
      const safeIdx = idx >= 0 ? idx : 0;
      const nextIdx = (safeIdx + dir + list.length) % list.length;
      void handlePlayTrack(list[nextIdx], 'v1', list);
    },
    [tracks, currentTrack, handlePlayTrack]
  );

  // MediaSession + Android Bridge
  useEffect(() => {
    if (!currentTrack) return;
    try {
      window.AndroidBridge?.updateMediaState?.(
        `${currentTrack.emoji ? currentTrack.emoji + ' ' : ''}${currentTrack.title}`,
        currentTrack.artist || 'LENKYX',
        currentTrack.album || 'Cosmic Phonk',
        isPlaying
      );
    } catch {
      // ignore
    }
    if ('mediaSession' in navigator) {
      try {
        const absCover = new URL(currentTrack.coverUrl || '/covers/album-official.jpg', window.location.origin).href;
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || 'LENKYX',
          album: currentTrack.album || 'Cosmic Phonk',
          artwork: [
            { src: absCover, sizes: '512x512', type: 'image/jpeg' },
            { src: absCover, sizes: '1024x1024', type: 'image/jpeg' },
          ],
        });
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        navigator.mediaSession.setActionHandler('play', () => void handleTogglePlay());
        navigator.mediaSession.setActionHandler('pause', () => void handleTogglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevNext(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => handlePrevNext(1));
      } catch {
        // ignore
      }
    }
  }, [currentTrack, isPlaying, handlePrevNext]);

  useEffect(() => {
    window.__lenkyxMediaAction = (action) => {
      if (action === 'prev') handlePrevNext(-1);
      else if (action === 'next') handlePrevNext(1);
      else if (action === 'play') {
        if (currentTrackRef.current?.youtubeVideoId && !currentTrackRef.current.audioUrl) {
          ytPlayerRef.current?.playVideo?.();
        } else if (audioRef.current?.paused) {
          void audioRef.current.play().catch(() => {});
        }
      } else if (action === 'pause') {
        if (currentTrackRef.current?.youtubeVideoId && !currentTrackRef.current.audioUrl) {
          ytPlayerRef.current?.pauseVideo?.();
        } else if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      } else if (action === 'toggle') {
        void handleTogglePlay();
      }
    };
    return () => {
      delete window.__lenkyxMediaAction;
    };
  }, [handlePrevNext]);

  const handleSeek = (t: number) => {
    if (currentTrackRef.current?.youtubeVideoId && !currentTrackRef.current.audioUrl) {
      ytPlayerRef.current?.seekTo?.(t, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = t;
    }
    setCurrentTime(t);
  };

  const handleVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    const shouldMute = clamped === 0;
    setMuted(shouldMute);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = shouldMute;
    }
    ytPlayerRef.current?.setVolume?.(Math.round(clamped * 100));
  };

  const handleToggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      const eff = next ? 0 : volume;
      if (audioRef.current) {
        audioRef.current.muted = next;
        audioRef.current.volume = eff;
      }
      ytPlayerRef.current?.setVolume?.(Math.round(eff * 100));
      return next;
    });
  };

  // Playlist mutations
  const addTrackToPlaylist = useCallback(
    (playlistId: string, track: Track) => {
      if (track.source === 'world_full' || track.source === 'world_preview') {
        setWorldCacheTracks((prev) => (prev.some((x) => x.id === track.id) ? prev : [track, ...prev].slice(0, 60)));
      }
      setPlaylists((prev) => {
        const next = prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          const exists = pl.trackIds.includes(track.id);
          const nextIds = exists ? pl.trackIds.filter((id) => id !== track.id) : [...pl.trackIds, track.id];
          const nextExt = { ...(pl.savedExternalTracks || {}) };
          if (!exists && (track.source === 'world_full' || track.source === 'world_preview')) {
            nextExt[track.id] = track;
          }
          return { ...pl, trackIds: nextIds, savedExternalTracks: nextExt };
        });
        saveUserPlaylists(next);
        return next;
      });
      const target = playlists.find((p) => p.id === playlistId);
      const exists = target?.trackIds.includes(track.id);
      showToast(
        exists
          ? `Removida de "${target?.name}"`
          : `✅ "${track.title}" salva em "${target?.emoji || '🎵'} ${target?.name || 'Playlist'}"!`
      );
    },
    [playlists, showToast]
  );

  const handleRemoveFromPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists((prev) => {
        const next = prev.map((pl) =>
          pl.id === playlistId ? { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId) } : pl
        );
        saveUserPlaylists(next);
        return next;
      });
      showToast('Faixa removida da playlist.');
    },
    [showToast]
  );

  const handleCreatePlaylist = (name: string, description: string, emoji: string) => {
    const pl: UserPlaylist = {
      id: 'pl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      name: name.trim() || 'Nova Playlist',
      description: description.trim() || 'Minha seleção personalizada',
      emoji: emoji || '🎵',
      accentColor: ACCENT_CYCLE[playlists.length % ACCENT_CYCLE.length],
      trackIds: [],
      savedExternalTracks: {},
      createdAt: new Date().toISOString(),
    };
    const next = [...playlists, pl];
    setPlaylists(next);
    saveUserPlaylists(next);
    showToast(`📁 Playlist "${pl.emoji} ${pl.name}" criada!`);
  };

  const handleDeletePlaylist = (id: string) => {
    const next = playlists.filter((p) => p.id !== id);
    setPlaylists(next);
    saveUserPlaylists(next);
    showToast('Playlist removida.');
  };

  const handleUploadUserTrack = async (params: {
    title: string;
    artist: string;
    bpm: number;
    audioFile: File;
    coverFile?: File | null;
    targetPlaylistId?: string;
  }) => {
    const newTrack = await addUserLocalTrack(params);
    setUserTracks((prev) => [newTrack, ...prev]);
    if (params.targetPlaylistId) {
      setPlaylists((prev) => {
        const next = prev.map((pl) =>
          pl.id === params.targetPlaylistId && !pl.trackIds.includes(newTrack.id)
            ? { ...pl, trackIds: [newTrack.id, ...pl.trackIds] }
            : pl
        );
        saveUserPlaylists(next);
        return next;
      });
    }
    showToast(`🎵 "${newTrack.title}" adicionada à sua biblioteca pessoal!`);
  };

  const handleDeleteUserTrack = (id: string) => {
    deleteUserLocalTrack(id);
    setUserTracks((prev) => prev.filter((t) => t.id !== id));
    showToast('Música pessoal removida da biblioteca.');
  };

  const handleLikeTrack = async (track: Track) => {
    const nextFav = !track.favorite;
    if (!track.source || track.source === 'lenkyx') {
      setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, favorite: nextFav } : t)));
      if (currentTrack?.id === track.id) setCurrentTrack((c) => (c ? { ...c, favorite: nextFav } : c));
      try {
        await authFetch(`/api/tracks/${track.id}/like`, { method: 'POST' });
      } catch {
        // optimistic ok
      }
    }
    showToast(nextFav ? `❤️ "${track.title}" curtida!` : `Curtida removida.`);
  };

  const handleToggleStatus = async (track: Track, field: keyof Track['status']) => {
    const updatedStatus = { ...track.status, [field]: !track.status[field] };
    setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, status: updatedStatus } : t)));
    const res = await authFetch(`/api/tracks/${track.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: updatedStatus }),
    });
    if (res.status === 401) {
      setMode('fan');
      setCreatorModalOpen(true);
      showToast('Sessão de Criador expirada. Entre novamente.');
    }
  };

  const handleSyncSuno = async () => {
    const res = await authFetch('/api/sync-suno', { method: 'POST' });
    if (res.status === 401) {
      setCreatorModalOpen(true);
      showToast('Entre como Criador para sincronizar o Suno.');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || 'Falha ao sincronizar com Suno.');
      return;
    }
    const stateRes = await authFetch('/api/state');
    if (stateRes.ok) {
      const st: { tracks?: Track[] } = await stateRes.json();
      setTracks(st.tracks || []);
    }
    showToast(`✅ Suno sincronizado! +${data.added || 0} novas, ${data.updated || 0} atualizadas.`);
  };

  const handleTrackSaved = (saved: Track) => {
    setTracks((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved];
    });
    if (currentTrack?.id === saved.id) setCurrentTrack(saved);
  };

  const handleTrackDeleted = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    if (currentTrack?.id === id) {
      audioRef.current?.pause();
      setCurrentTrack(null);
      setMusicMenuOpen(false);
    }
  };

  const handleSaveSettings = async (partial: Partial<AppSettings>) => {
    const res = await authFetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (res.status === 401) {
      setMode('fan');
      setCreatorModalOpen(true);
      showToast('Faça login como Criador para salvar configurações.');
      return;
    }
    if (res.ok) {
      const updated = await res.json();
      setSettings((prev) => ({ ...prev, ...updated }));
    }
  };

  const handleCreatorLogout = async () => {
    await authFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthToken(null);
    setMode('fan');
    if (activeTab === 'studio') setActiveTab('catalog');
    showToast('Modo Ouvinte ativado.');
  };

  const openWebSearch = (q: string, isPrivate = false) => {
    const clean = q.trim();
    if (!clean) return;
    setGlobalSearch(clean);
    setSearchViewQuery(clean);
    setSearchViewPrivate(isPrivate);
    setOmniboxOpen(false);
    navigateTab('search');
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;
    setOmniboxOpen(false);
    if (activeTab === 'explore') {
      setWorldTriggerQuery(q);
      setWorldSearchNonce((n) => n + 1);
      navigateTab('explore');
    } else {
      openWebSearch(q, searchViewPrivate);
    }
  };

  const triggerWorldSearchDirect = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setGlobalSearch(clean);
    setWorldTriggerQuery(clean);
    setWorldSearchNonce((n) => n + 1);
    setOmniboxOpen(false);
    navigateTab('explore');
  };

  const sidebarMain: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'catalog', label: 'Som LENKYX', icon: <Music className="w-4 h-4" /> },
    { id: 'explore', label: 'Artistas & Clipes', icon: <Globe2 className="w-4 h-4" /> },
    { id: 'movies', label: 'Cinema & Séries', icon: <Clapperboard className="w-4 h-4" /> },
    { id: 'sports', label: 'Futebol & UFC', icon: <Trophy className="w-4 h-4" /> },
    { id: 'search', label: 'Busca Rápida', icon: <Search className="w-4 h-4" /> },
    { id: 'playlists', label: 'Minhas Playlists', icon: <ListMusic className="w-4 h-4" /> },
  ];

  const clipSuggestions = useMemo(() => {
    const pool = [...playQueue, ...allTracksPool].filter(
      (t) => Boolean(t.youtubeVideoId) && t.id !== currentTrack?.id
    );
    const seen = new Set<string>();
    const out: Track[] = [];
    for (const t of pool) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
      if (out.length >= 12) break;
    }
    return out;
  }, [playQueue, allTracksPool, currentTrack?.id]);

  const isPlayerAllowedTab = activeTab !== 'movies' && activeTab !== 'sports';
  const dailyPixPct = liveStats.dailyGoalBrl > 0
    ? Math.min(100, Math.round((liveStats.dailyCollectedBrl / liveStats.dailyGoalBrl) * 100))
    : 0;

  return (
    <div className="h-dvh overflow-hidden bg-[#05020d] text-white flex relative">
      <CosmicSpaceBackdrop />

      {/* === DESKTOP & SMART TV LEFT SIDEBAR === */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 fixed inset-y-2 left-2 z-30 rounded-3xl glass-panel overflow-hidden">
        {/* Brand Monument (tap 5x secretly for Creator access) */}
        <div
          onClick={handleBrandTap}
          className="h-16 px-4 flex items-center gap-3 border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.03] select-none"
        >
          <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-rose-500">
            <img
              src="/covers/avatar.jpg"
              alt="LENKYX"
              className="w-9 h-9 rounded-full object-cover bg-black"
            />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-display text-sm font-black tracking-[0.14em] text-white">LENKYX</div>
            <div className="text-[9px] font-bold tracking-[0.22em] text-cyan-300/90 truncate">SEM ANÚNCIOS</div>
          </div>
        </div>

        {/* 5 Clean Focused Tabs */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-3 space-y-3">
          <nav className="space-y-1">
            {sidebarMain.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTab(tab.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                    active
                      ? 'bg-gradient-to-r from-white/[0.12] via-cyan-500/15 to-transparent text-white border border-cyan-300/35 shadow-[inset_2px_0_0_#22d3ee]'
                      : 'text-slate-300/80 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <span className={active ? 'text-cyan-300' : 'text-slate-400'}>{tab.icon}</span>
                  <span className="truncate tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {mode === 'creator' && (
            <div className="space-y-1 pt-2 border-t border-white/[0.07]">
              <div className="px-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-300/80 mb-1">
                Estúdio Criador
              </div>
              <button
                onClick={() => navigateTab('studio')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                  activeTab === 'studio'
                    ? 'bg-cyan-500/20 text-white border border-cyan-400/40'
                    : 'text-slate-300/80 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Wand2 className="w-4 h-4 text-cyan-300" />
                <span>Suno × DistroKid</span>
              </button>
            </div>
          )}

          {/* Playlists Quick List */}
          <div className="space-y-1 pt-2 border-t border-white/[0.07]">
            <div className="px-3 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-1">
              <span>Suas Playlists</span>
              <button
                onClick={() => navigateTab('playlists')}
                className="text-cyan-300 hover:underline normal-case font-bold"
              >
                + Nova
              </button>
            </div>
            {playlists.slice(0, 4).map((pl) => (
              <button
                key={pl.id}
                onClick={() => navigateTab('playlists')}
                className="w-full px-3 py-1.5 rounded-lg hover:bg-white/[0.05] text-left text-[11px] text-slate-300/85 hover:text-white flex items-center justify-between gap-2 transition"
              >
                <span className="truncate">
                  {pl.emoji} {pl.name}
                </span>
                <span className="text-[10px] text-slate-500 shrink-0">{pl.trackIds.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clean Utility Dock (PIX QR + Ranking & Bonequinhos + Share + Legal) */}
        <div className="p-2.5 border-t border-white/[0.08] bg-black/25 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setPixInitialTab('donate');
                setPixOpen(true);
              }}
              className="py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 hover:from-emerald-500/40 hover:to-cyan-500/40 border border-emerald-400/45 text-emerald-100 text-[11px] font-black flex items-center justify-center gap-1 transition"
              title="Abrir QR Code PIX & Meta Diária"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-300" /> PIX QR
            </button>
            <button
              onClick={() => {
                setPixInitialTab('ranking');
                setPixOpen(true);
              }}
              className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 hover:from-amber-500/35 hover:to-pink-500/35 border border-amber-400/40 text-amber-100 text-[11px] font-black flex items-center justify-center gap-1 transition"
              title="Ver Ranking de Apoiadores & Bonequinhos"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" /> Ranking
            </button>
          </div>

          <button
            onClick={() => {
              setPixInitialTab('collection');
              setPixOpen(true);
            }}
            className="w-full py-1.5 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 border border-purple-400/35 text-purple-100 text-[11px] font-black flex items-center justify-center gap-1.5 transition"
          >
            <span>👾</span> Meus Bonequinhos (1.000)
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setShareTrack(null);
                setShareOpen(true);
              }}
              className="py-1.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-[10px] font-bold flex items-center justify-center gap-1 transition"
            >
              <Share2 className="w-3 h-3 text-emerald-300" /> Convidar Amigos
            </button>
            <button
              onClick={() => setLegalOpen(true)}
              className="py-1.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-[10px] font-bold flex items-center justify-center gap-1 transition"
            >
              <Scale className="w-3 h-3 text-amber-300" /> Termos
            </button>
          </div>

          {!isAndroidApk() && (
            <a
              href={settings.apkDownloadUrl || '/download/apk'}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-black text-[11px] font-black flex items-center justify-center gap-1 shadow transition"
            >
              <Rocket className="w-3.5 h-3.5" /> Baixar App Android
            </a>
          )}

          {mode === 'creator' && (
            <button
              onClick={() => setCreatorModalOpen(true)}
              className="w-full py-1.5 px-2 rounded-xl border bg-amber-500/15 border-amber-400/35 text-amber-200 text-[11px] font-bold flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Painel Criador
            </button>
          )}
        </div>
      </aside>

      {/* === MAIN CONTENT SHELL === */}
      <div className="relative z-10 flex-1 md:pl-60 lg:pl-64 min-w-0 h-full overflow-hidden flex flex-col">
        {/* TOP HEADER */}
        <header className="shrink-0 z-30 mx-3 sm:mx-5 mt-2 rounded-2xl glass-panel h-14 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 shrink-0">
            {(tabHistory.length > 0 || activeTab !== 'catalog') && (
              <button
                onClick={goBackTab}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div
              onClick={handleBrandTap}
              className="flex md:hidden items-center gap-1.5 shrink-0 cursor-pointer select-none"
            >
              <img src="/covers/avatar.jpg" alt="LENKYX" className="w-7 h-7 rounded-full border border-pink-500" />
              <span className="font-display text-xs font-black hidden xs:inline">LENKYX</span>
            </div>
          </div>

          {/* SEARCH OMNIBOX */}
          <div ref={omniboxWrapRef} className="flex-1 min-w-0 max-w-2xl relative flex items-center gap-2">
            <form
              onSubmit={handleGlobalSearchSubmit}
              className="flex-1 min-w-0 flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.11] focus-within:bg-[#0c081a] border border-white/15 focus-within:border-cyan-400/70 px-2.5 sm:px-3.5 py-1.5 shadow-inner transition"
            >
              <Search className="w-4 h-4 text-cyan-300 shrink-0" />
              <input
                type="text"
                value={globalSearch}
                onFocus={() => setOmniboxOpen(true)}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setOmniboxOpen(true);
                }}
                placeholder="Buscar músicas, artistas, clipes, filmes..."
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearch('');
                    setOmniboxOpen(true);
                  }}
                  className="p-1 rounded-full hover:bg-white/15 text-slate-300 hover:text-white shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => openWebSearch(globalSearch || 'LENKYX', true)}
                className={`p-1.5 rounded-full border shrink-0 transition ${
                  searchViewPrivate
                    ? 'bg-purple-500/35 border-purple-400 text-purple-100'
                    : 'bg-white/[0.06] hover:bg-purple-500/25 border-white/10 text-slate-300'
                }`}
                title="Pesquisa Privada"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                className="px-2.5 sm:px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-[11px] font-black hover:brightness-110 shrink-0 transition"
              >
                Ir
              </button>
            </form>

            {isPlayerAllowedTab && currentTrack && !musicMenuOpen && (
              <button
                onClick={() => setMusicMenuOpen(true)}
                className="hidden sm:flex px-2.5 py-1.5 rounded-full bg-pink-500/25 hover:bg-pink-500/40 border border-pink-400/45 text-pink-100 text-[11px] font-black items-center gap-1 shrink-0 transition"
                title="Abrir Player de Música"
              >
                <Music className="w-3.5 h-3.5" />
                <span className="hidden xl:inline max-w-[100px] truncate">{currentTrack.title}</span>
              </button>
            )}

            {omniboxOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-[60] rounded-2xl bg-[#090616]/98 backdrop-blur-2xl border border-cyan-400/30 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden">
                {globalSearch.trim() && (
                  <div className="p-2 border-b border-white/[0.08] flex flex-wrap gap-1.5 bg-white/[0.03]">
                    <button
                      type="button"
                      onClick={() => openWebSearch(globalSearch, false)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black text-xs font-black flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Buscar Tudo: "{globalSearch.trim().slice(0, 24)}"
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerWorldSearchDirect(globalSearch)}
                      className="px-3 py-1.5 rounded-xl bg-pink-500/25 border border-pink-400/40 text-pink-100 text-xs font-black flex items-center gap-1.5"
                    >
                      <Music className="w-3.5 h-3.5" /> Artistas & Clipes
                    </button>
                  </div>
                )}
                <div className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-white/[0.04]">
                  {omniboxSuggestions.slice(0, 6).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => openWebSearch(sug, searchViewPrivate)}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-100 hover:bg-white/[0.08] flex items-center justify-between gap-2 transition"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{sug}</span>
                      </span>
                      <span className="text-[10px] text-cyan-300/75 shrink-0">Buscar</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Compact Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.07] border border-white/10">
              <button
                onClick={handleToggleMute}
                className="text-cyan-300 hover:text-white transition"
                title={muted ? 'Ativar Som' : 'Silenciar'}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolume(Number(e.target.value))}
                className="hidden lg:block w-16 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Quick PIX QR + Ranking Pills */}
            <button
              onClick={() => {
                setPixInitialTab('donate');
                setPixOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/45 text-emerald-100 text-[11px] font-black flex items-center gap-1 transition"
              title="Abrir QR Code PIX & Apoiar Igrejas/Combate à Fome"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-300" />
              <span>PIX</span>
            </button>

            <button
              onClick={() => {
                setPixInitialTab('ranking');
                setPixOpen(true);
              }}
              className="hidden sm:flex px-2.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-100 text-[11px] font-black items-center gap-1 transition"
              title="Classificação de Apoio & Coleção de Bonequinhos"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden lg:inline">Ranking</span>
            </button>

            {/* Quick Invite Friends Button */}
            <button
              onClick={() => {
                setShareTrack(null);
                setShareOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/35 hover:to-cyan-500/35 border border-emerald-400/40 text-emerald-100 text-[11px] font-black flex items-center gap-1 transition"
              title="Compartilhe com amigos"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>

            {mode === 'creator' && (
              <button
                onClick={() => void handleCreatorLogout()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/25"
                title="Voltar ao Modo Ouvinte"
              >
                <Sparkles className="w-3 h-3" />
                <LogOut className="w-3 h-3 opacity-75" />
              </button>
            )}
          </div>
        </header>

        {/* ACTIVE VIEW CONTAINER */}
        <main id="lenkyx-main-scroll" className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain w-full">
          <div className="w-full max-w-[1380px] mx-auto px-3 sm:px-5 pt-3">
            {/* Real-Time Active Listeners + Daily PIX Goal + Voluntary Share Strip */}
            <div className="mb-3 rounded-2xl cosmic-card-3d px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 border border-white/10">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="inline-flex items-center gap-1.5 font-extrabold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {liveStats.onlineCount}{' '}
                    {liveStats.onlineCount === 1 ? 'pessoa curtindo agora' : 'pessoas curtindo agora'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPixInitialTab('donate');
                    setPixOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-pink-500/20 border border-pink-400/30 transition"
                >
                  <Target className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-[11px] font-bold text-white">
                    Meta PIX Hoje:{' '}
                    <span className="font-mono text-cyan-300">
                      R$ {liveStats.dailyCollectedBrl.toFixed(0)} / R$ {liveStats.dailyGoalBrl.toFixed(0)}
                    </span>
                  </span>
                  <span className="w-12 h-1.5 rounded-full bg-black/50 overflow-hidden hidden sm:inline-block">
                    <span
                      style={{ width: `${dailyPixPct}%` }}
                      className="block h-full bg-gradient-to-r from-emerald-400 to-pink-500"
                    />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPixInitialTab('ranking');
                    setPixOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/35 text-[11px] font-black text-amber-200 transition"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {liveStats.leaderboard && liveStats.leaderboard[0]
                      ? `Top #1: ${liveStats.leaderboard[0].name} (R$ ${liveStats.leaderboard[0].totalBrl.toFixed(0)})`
                      : 'Ranking & Bonequinhos 👾'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShareTrack(null);
                  setShareOpen(true);
                }}
                className="text-[11px] font-bold text-cyan-200 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 hover:from-cyan-500/30 hover:to-emerald-500/30 border border-cyan-400/30 transition"
              >
                <Share2 className="w-3 h-3 text-emerald-300" />
                <span>Curtiu o som e os vídeos sem anúncios? Manda pros amigos!</span>
              </button>
            </div>

            {appUpdateInfo && (
              <div className="mb-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-pink-500/20 border border-cyan-400/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg">
                <div className="min-w-0">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <Rocket className="w-4 h-4 text-cyan-300" />
                    Nova atualização v{appUpdateInfo.latestVersionName} disponível!
                  </div>
                  {appUpdateInfo.releaseNotes && (
                    <p className="text-[11px] text-cyan-100/80 truncate">{appUpdateInfo.releaseNotes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (window.AndroidBridge?.openExternalUrl) {
                        window.AndroidBridge.openExternalUrl(appUpdateInfo.apkUrl);
                      } else {
                        window.open(appUpdateInfo.apkUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black"
                  >
                    Atualizar Agora
                  </button>
                  <button
                    onClick={() => setAppUpdateInfo(null)}
                    className="p-1 rounded-lg bg-white/10 text-purple-200 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full border-3 border-pink-500 border-t-cyan-400 animate-spin" />
                <div className="font-display text-xs tracking-widest text-purple-300">CARREGANDO LENKYX...</div>
              </div>
            ) : (
              <>
                {activeTab === 'catalog' && (
                  <CatalogView
                    tracks={tracks}
                    settings={settings}
                    mode={mode}
                    searchQuery={globalSearch}
                    playlists={playlists}
                    currentTrack={currentTrack}
                    activeVersion={activeVersion}
                    isPlaying={isPlaying}
                    offlineTrackIds={offlineTrackIds}
                    downloadingIds={downloadingIds}
                    downloadingAll={downloadingAll}
                    onPlayTrack={(t, ver) => void handlePlayTrack(t, ver, tracks)}
                    onLikeTrack={(t) => void handleLikeTrack(t)}
                    onShareTrack={(t) => {
                      setShareTrack(t);
                      setShareOpen(true);
                    }}
                    onOpenPix={() => {
                      setPixInitialTab('donate');
                      setPixOpen(true);
                    }}
                    onAddToPlaylist={addTrackToPlaylist}
                    onToggleOffline={(t) => void handleToggleOffline(t)}
                    onDownloadAllOffline={() => void handleDownloadAllOffline()}
                    onEditTrack={(t) => {
                      setEditingTrack(t);
                      setUploadModalOpen(true);
                    }}
                    onAddTrack={() => {
                      setEditingTrack(null);
                      setUploadModalOpen(true);
                    }}
                    lyricsTrack={lyricsTrack}
                    onSetLyricsTrack={setLyricsTrack}
                    onSearchWorld={triggerWorldSearchDirect}
                    onToast={showToast}
                  />
                )}

                {activeTab === 'explore' && (
                  <WorldExploreView
                    initialQuery={worldTriggerQuery || globalSearch}
                    searchNonce={worldSearchNonce}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    playlists={playlists}
                    onPlayTrack={(t, queue) => void handlePlayTrack(t, 'v1', queue)}
                    onWatchClip={openClipWithIntro}
                    onAddToPlaylist={addTrackToPlaylist}
                  />
                )}

                {activeTab === 'playlists' && (
                  <PlaylistsView
                    user={null}
                    playlists={playlists}
                    allCatalogTracks={allTracksPool}
                    userTracks={userTracks}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onPlayTrack={(t, queue) => void handlePlayTrack(t, 'v1', queue)}
                    onCreatePlaylist={handleCreatePlaylist}
                    onDeletePlaylist={handleDeletePlaylist}
                    onRemoveFromPlaylist={handleRemoveFromPlaylist}
                    onUploadUserTrack={handleUploadUserTrack}
                    onDeleteUserTrack={handleDeleteUserTrack}
                  />
                )}

                <Suspense
                  fallback={
                    <div className="py-16 text-center text-xs text-purple-300 font-semibold">Carregando...</div>
                  }
                >
                  {activeTab === 'movies' && (
                    <MoviesView
                      onPauseMusic={pauseCatalogPlayer}
                      onMovieModalChange={setWatchingMovie}
                      volume={volume}
                      muted={muted}
                      onVolume={handleVolume}
                      onToggleMute={handleToggleMute}
                      onOpenPix={() => {
                        setPixInitialTab('donate');
                        setPixOpen(true);
                      }}
                      initialMovie={pendingMovie}
                      onConsumeInitialMovie={() => setPendingMovie(null)}
                    />
                  )}

                  {activeTab === 'sports' && (
                    <SportsArenaView
                      onPauseMusic={pauseCatalogPlayer}
                      onSportsModalChange={setWatchingMovie}
                      volume={volume}
                      muted={muted}
                      onVolume={handleVolume}
                      onToggleMute={handleToggleMute}
                      onOpenPix={() => {
                        setPixInitialTab('donate');
                        setPixOpen(true);
                      }}
                    />
                  )}

                  {activeTab === 'search' && (
                    <CosmicSearchView
                      initialQuery={searchViewQuery}
                      initialPrivate={searchViewPrivate}
                      localTracks={allTracksPool}
                      onPlayTrack={(t, q) => void handlePlayTrack(t, 'v1', q)}
                      onWatchClip={openClipWithIntro}
                      onOpenMovie={(m) => {
                        setPendingMovie(m);
                        navigateTab('movies');
                      }}
                      onNavigateTab={(tab) => navigateTab(tab)}
                      onToast={showToast}
                    />
                  )}

                  {activeTab === 'studio' && mode === 'creator' && (
                    <StudioCreateView
                      tracks={tracks}
                      settings={settings}
                      onTrackCreated={handleTrackSaved}
                      onToggleTrackStatus={handleToggleStatus}
                      onPauseCatalogPlayer={pauseCatalogPlayer}
                      onSyncSuno={handleSyncSuno}
                      onToast={showToast}
                    />
                  )}
                </Suspense>
              </>
            )}
          </div>
        </main>
      </div>

      {/* ON-DEMAND MUSIC PLAYER BAR: Shown ONLY when actively playing/using music! */}
      {!watchingMovie && isPlayerAllowedTab && currentTrack && musicMenuOpen && (
        <MiniPlayer
          track={currentTrack}
          activeVersion={activeVersion}
          isPlaying={isPlaying}
          isPlayingFromOffline={isPlayingFromOffline}
          isCurrentTrackOffline={offlineTrackIds.has(currentTrack.id)}
          isDownloadingOffline={downloadingIds.has(currentTrack.id)}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          muted={muted}
          bassBoostLevel={bassBoostLevel}
          playbackSpeed={playbackSpeed}
          loopTrack={loopTrack}
          onCycleBassBoost={handleCycleBassBoost}
          onSetBassBoostLevel={handleSetBassBoostLevel}
          onCycleSpeed={handleCycleSpeed}
          onToggleLoop={handleToggleLoop}
          onOpenPix={() => {
            setPixInitialTab('donate');
            setPixOpen(true);
          }}
          onTogglePlay={() => void handleTogglePlay()}
          onSelectVersion={handleSelectVersion}
          onPrev={() => handlePrevNext(-1)}
          onNext={() => handlePrevNext(1)}
          onSeek={handleSeek}
          onVolume={handleVolume}
          onToggleMute={handleToggleMute}
          onShare={(t) => {
            setShareTrack(t);
            setShareOpen(true);
          }}
          onOpenLyrics={(t) => {
            setActiveTab('catalog');
            setLyricsTrack(t);
          }}
          onLike={(t) => void handleLikeTrack(t)}
          onToggleOffline={(t) => void handleToggleOffline(t)}
          onWatchClip={() => {
            if (currentTrack?.youtubeVideoId) {
              setClipPrerollActive(false);
              setClipTheaterOpen(true);
            }
          }}
          onCloseMenu={() => setMusicMenuOpen(false)}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {!watchingMovie && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#090516]/96 backdrop-blur-xl border-t border-white/10 grid grid-cols-6 px-0.5">
          {(
            [
              { id: 'catalog' as TabId, label: 'Som', icon: <Music className="w-4 h-4" /> },
              { id: 'explore' as TabId, label: 'Clipes', icon: <Globe2 className="w-4 h-4" /> },
              { id: 'movies' as TabId, label: 'Cinema', icon: <Clapperboard className="w-4 h-4" /> },
              { id: 'sports' as TabId, label: 'Ao Vivo', icon: <Trophy className="w-4 h-4" /> },
              { id: 'search' as TabId, label: 'Buscar', icon: <Search className="w-4 h-4" /> },
              { id: 'playlists' as TabId, label: 'Listas', icon: <ListMusic className="w-4 h-4" /> },
            ] as { id: TabId; label: string; icon: React.ReactNode }[]
          ).map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition ${
                  active ? 'text-cyan-300' : 'text-slate-300/75'
                }`}
              >
                {item.icon}
                <span className="text-[9px] font-bold truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* === MODALS === */}
      <PixModal
        open={pixOpen}
        onClose={() => setPixOpen(false)}
        initialTab={pixInitialTab}
        settings={settings}
        mode={mode}
        liveStats={liveStats}
        onLiveStatsUpdated={(st) => setLiveStats(st)}
        onSaveSettings={handleSaveSettings}
        onToast={showToast}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        track={shareTrack}
        settings={settings}
        mode={mode}
        onSaveSettings={handleSaveSettings}
        onOpenSpaceDownload={() => {}}
        onToast={showToast}
      />
      <LegalTermsModal open={legalOpen} onClose={() => setLegalOpen(false)} />

      {/* STARTUP CINEMATIC INTRO + AUTO-UPDATE CHECK + PIX SUPPORT APPEAL */}
      <CosmicGtaLoader
        open={gtaLoaderOpen}
        mode="splash"
        statusText={introStatus}
        dailyCollectedBrl={liveStats.dailyCollectedBrl}
        dailyGoalBrl={liveStats.dailyGoalBrl}
        onlineCount={liveStats.onlineCount}
        onOpenPix={() => {
          setGtaLoaderOpen(false);
          sessionStorage.setItem('lenkyx_splash_done', '1');
          setPixInitialTab('donate');
          setPixOpen(true);
        }}
        onShareApp={() => {
          setGtaLoaderOpen(false);
          sessionStorage.setItem('lenkyx_splash_done', '1');
          setShareTrack(null);
          setShareOpen(true);
        }}
        onSkip={() => {
          setGtaLoaderOpen(false);
          sessionStorage.setItem('lenkyx_splash_done', '1');
        }}
      />

      {/* CLIP THEATER (with Netflix-style pre-roll intro before clip rolls, 100% pure LENKYX) */}
      <div
        onClick={(e) => {
          if (clipTheaterOpen && e.target === e.currentTarget) setClipTheaterOpen(false);
        }}
        className={
          clipTheaterOpen && currentTrack?.youtubeVideoId
            ? `fixed inset-0 z-[9995] bg-black flex items-center justify-center ${
                clipFitMode === 'fullscreen' ? 'p-0' : 'p-0 sm:p-4'
              }`
            : 'fixed bottom-1 right-1 w-2 h-2 opacity-[0.01] pointer-events-none z-0 overflow-hidden'
        }
      >
        <div
          ref={clipStageRef}
          className={
            clipTheaterOpen && currentTrack?.youtubeVideoId
              ? `w-full flex flex-col overflow-hidden bg-[#090418] border border-cyan-400/40 shadow-[0_0_70px_rgba(236,72,153,0.35)] relative ${
                  clipFitMode === 'fullscreen' || isNativeFullscreen
                    ? 'h-[100dvh] max-w-none rounded-none border-0'
                    : clipFitMode === 'compact'
                      ? 'max-w-2xl max-h-[85dvh] rounded-3xl'
                      : 'max-w-5xl h-[100dvh] sm:h-[92dvh] sm:rounded-3xl'
                }`
              : 'w-full h-full'
          }
        >
          {clipTheaterOpen && currentTrack?.youtubeVideoId && (
            <div className="px-3 sm:px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-[#1a0b38] to-[#0a1b2e] shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={() => setClipTheaterOpen(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black flex items-center gap-1 shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300 truncate flex items-center gap-1">
                    <Film className="w-3 h-3" /> Clipe Oficial · LENKYX
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white truncate">{currentTrack.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <button
                  onClick={handleCycleBassBoost}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 transition ${
                    bassBoostLevel > 0
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-pink-300 text-white shadow-[0_0_14px_rgba(236,72,153,0.5)]'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-purple-100'
                  }`}
                  title="Turbina os graves do som"
                >
                  <AudioWaveform className="w-3.5 h-3.5" />
                  <span>
                    {bassBoostLevel === 3
                      ? 'Subwoofer'
                      : bassBoostLevel === 2
                        ? 'Pesado'
                        : bassBoostLevel === 1
                          ? 'Suave'
                          : 'Graves +'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setClipTheaterOpen(false);
                    setPixInitialTab('donate');
                    setPixOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[11px] font-black flex items-center gap-1"
                  title="Abrir QR Code PIX"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PIX</span>
                </button>
                <select
                  value={clipQuality}
                  onChange={(e) => {
                    const q = e.target.value as typeof clipQuality;
                    setClipQuality(q);
                    if (q !== 'default') ytPlayerRef.current?.setPlaybackQuality?.(q);
                  }}
                  className="px-2 py-1.5 rounded-xl bg-white/10 border border-cyan-400/35 text-cyan-100 text-[11px] font-black focus:outline-none cursor-pointer"
                >
                  <option value="hd720" className="bg-[#090418]">720p HD</option>
                  <option value="large" className="bg-[#090418]">480p Leve</option>
                  <option value="medium" className="bg-[#090418]">360p Rápido</option>
                  <option value="default" className="bg-[#090418]">Auto</option>
                </select>
                <button
                  onClick={() =>
                    setClipFitMode((m) =>
                      m === 'standard' ? 'fullscreen' : m === 'fullscreen' ? 'compact' : 'standard'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/45 text-cyan-100 text-[11px] font-black flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">
                    {clipFitMode === 'fullscreen' ? 'Tela Cheia' : clipFitMode === 'compact' ? 'Compacto' : 'Ajustar'}
                  </span>
                </button>
                <button
                  onClick={() => setClipTheaterOpen(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-purple-100 flex items-center gap-1"
                  title="Ouvir em segundo plano"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Só Som</span>
                </button>
                <button
                  onClick={() => setClipTheaterOpen(false)}
                  className="px-2.5 py-1.5 rounded-full bg-rose-600/85 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Fechar</span>
                </button>
              </div>
            </div>
          )}

          <div
            className={
              clipTheaterOpen
                ? 'flex-1 min-h-[200px] w-full bg-black flex items-center justify-center relative overflow-hidden'
                : 'w-full h-full bg-black relative'
            }
          >
            <div id="lenkyx-yt-audio-host" className="w-full h-full" />

            {clipTheaterOpen && currentTrack?.youtubeVideoId && !isPlaying && (
              <div
                onClick={() => void handleTogglePlay()}
                className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center bg-black/70 backdrop-blur-sm transition"
              >
                <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-3xl bg-[#0b0618]/90 border border-white/15 shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.55)]">
                    <Play className="w-7 h-7 fill-black ml-0.5" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-black text-white max-w-[260px] truncate">{currentTrack.title}</div>
                    <div className="text-[10px] text-cyan-300 font-bold">Toque para continuar</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {clipTheaterOpen && currentTrack?.youtubeVideoId && (
            <div className="px-3 sm:px-4 py-2.5 border-t border-white/10 flex flex-col gap-2 bg-[#090418] shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-mono text-purple-200/85">
                <span className="w-9 text-right">
                  {`${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || currentTrack.durationSec || 180}
                  step={1}
                  value={Math.min(currentTime, duration || currentTrack.durationSec || 180)}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="flex-1 h-1.5 accent-pink-500 cursor-pointer"
                />
                <span className="w-9">
                  {`${Math.floor((duration || currentTrack.durationSec || 180) / 60)}:${String(
                    Math.floor((duration || currentTrack.durationSec || 180) % 60)
                  ).padStart(2, '0')}`}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-purple-200 truncate">{currentTrack.artist}</div>
                  <div className="text-[10px] text-cyan-300/80">Reprodução contínua sem anúncios</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10">
                    <button onClick={handleToggleMute} className="text-cyan-300">
                      {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={muted ? 0 : volume}
                      onChange={(e) => handleVolume(Number(e.target.value))}
                      className="w-16 accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => handlePrevNext(-1)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void handleTogglePlay()}
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black flex items-center justify-center shadow"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                  </button>
                  <button
                    onClick={() => handlePrevNext(1)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        if (!document.fullscreenElement) {
                          await clipStageRef.current?.requestFullscreen?.();
                        } else {
                          await document.exitFullscreen?.();
                        }
                      } catch {
                        setClipFitMode((m) => (m === 'fullscreen' ? 'standard' : 'fullscreen'));
                      }
                    }}
                    className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200"
                  >
                    {isNativeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Clickable Clip Suggestions Strip (Auto-Fading Arrows + Interactive Grid + Closable) */}
              {clipFitMode !== 'fullscreen' && !isNativeFullscreen && clipSuggestions.length > 0 && (
                <div className="-mx-3 sm:-mx-4 -mb-2.5 mt-1">
                  <PlayerQueueStrip
                    title="🎬 Sugestões para assistir a seguir"
                    accent="cyan"
                    items={clipSuggestions.map((sug) => ({
                      id: sug.id,
                      title: sug.title,
                      subtitle: sug.artist,
                      imageUrl: sug.coverUrl || '/covers/album-official.jpg',
                    }))}
                    onSelect={(id) => {
                      const picked = clipSuggestions.find((x) => x.id === id);
                      if (picked) {
                        openClipWithIntro(picked, playQueue.length ? playQueue : clipSuggestions);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UploadTrackModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        editingTrack={editingTrack}
        onSaved={(saved) => handleTrackSaved(saved)}
        onDeleted={handleTrackDeleted}
        onToast={showToast}
      />
      <CreatorModal
        open={creatorModalOpen}
        onClose={() => setCreatorModalOpen(false)}
        isAuthenticated={mode === 'creator'}
        hasCustomPassword={hasCustomPassword}
        settings={settings}
        onLoginSuccess={(token, customPwd) => {
          setAuthToken(token);
          setMode('creator');
          setHasCustomPassword(customPwd);
        }}
        onLogout={() => void handleCreatorLogout()}
        onPasswordChanged={(newToken) => {
          setAuthToken(newToken);
          setHasCustomPassword(true);
        }}
        onOpenPixConfig={() => {
          setCreatorModalOpen(false);
          setPixInitialTab('config');
          setPixOpen(true);
        }}
        onSyncedTracks={(synced) => setTracks(synced)}
        onToast={showToast}
      />

      {toast && (
        <div className="fixed top-16 right-4 z-50 max-w-sm px-4 py-2.5 rounded-xl bg-[#140a2c]/95 border border-cyan-400/45 text-xs font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;

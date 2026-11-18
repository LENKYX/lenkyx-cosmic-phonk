import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Music,
  Video,
  Wand2,
  QrCode,
  MessageCircle,
  Globe2,
  ListMusic,
  Search,
  UserCircle2,
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
  Speaker,
  Volume2,
  VolumeX,
  Zap,
  Waves,
  MessageSquare,
  Maximize2,
  ArrowLeft,
  Tv,
  Scale,
  Download,
  Power,
  Share2,
  Gift,
  Gamepad2,
  Shield,
} from 'lucide-react';
import {
  AppMode,
  AppSettings,
  AudioVersion,
  TabId,
  Track,
  UserPlaylist,
  UserProfile,
} from './types';
import { isAndroidApk } from './utils/androidBridge';
import { saveDeviceAccount } from './utils/fanAuth';
import { CatalogView } from './components/CatalogView';
import { WorldExploreView } from './components/WorldExploreView';
import { PlaylistsView } from './components/PlaylistsView';
import { CosmicSpaceBackdrop } from './components/CosmicSpaceBackdrop';
import { JblLightShowOverlay, JblLightTheme } from './components/JblLightShowOverlay';
const MoviesView = React.lazy(() => import('./components/MoviesView').then((m) => ({ default: m.MoviesView })));
const SocialShortsAndLiveView = React.lazy(() =>
  import('./components/SocialShortsAndLiveView').then((m) => ({ default: m.SocialShortsAndLiveView }))
);
const StudioCreateView = React.lazy(() => import('./components/StudioCreateView').then((m) => ({ default: m.StudioCreateView })));
const CosmicHubView = React.lazy(() => import('./components/CosmicHubView').then((m) => ({ default: m.CosmicHubView })));
const ArcadeView = React.lazy(() => import('./components/ArcadeView').then((m) => ({ default: m.ArcadeView })));
const CosmicSearchView = React.lazy(() => import('./components/CosmicSearchView').then((m) => ({ default: m.CosmicSearchView })));
import { MiniPlayer } from './components/MiniPlayer';
import { CosmicScreensaver3D, ExperienceMode } from './components/CosmicScreensaver3D';
import { SoundBoostModal } from './components/SoundBoostModal';
import { CommunityChatModal, TargetCommentsModal } from './components/CommunityChatModal';
import { TvCastModal } from './components/TvCastModal';
import { LegalTermsModal } from './components/LegalTermsModal';
import { CosmicGtaLoader } from './components/CosmicGtaLoader';
import { SafeExitModal } from './components/SafeExitModal';
import { SocialDistributionModal } from './components/SocialDistributionModal';
import { fetchTvHandoff } from './utils/communityApi';
import { PixModal } from './components/PixModal';
import {
  AudioSoundProfile,
  lenkyxAudioEngine,
  loadSoundProfile,
} from './utils/audioBoostEngine';
import { ShareModal } from './components/ShareModal';
import { SpaceDownloadModal } from './components/SpaceDownloadModal';
import { UploadTrackModal } from './components/UploadTrackModal';
import { CreatorModal } from './components/CreatorModal';
import { UserAuthModal } from './components/UserAuthModal';
import { authFetch, setAuthToken } from './utils/api';
import {
  addUserLocalTrack,
  deleteUserLocalTrack,
  loadUserPlaylists,
  loadUserProfile,
  loadUserTracks,
  saveUserPlaylists,
  saveUserProfile,
} from './utils/userVault';
import {
  downloadTrackOffline,
  getOfflineTrackIds,
  removeTrackOffline,
  resolvePlayableAudioUrl,
} from './utils/offlineCache';

const DEFAULT_SETTINGS: AppSettings = {
  artistName: 'LENKYX',
  brandSubtitle: 'COSMIC PHONK',
  tagline: 'Música Futurista · Cosmic Phonk & Funk Melody · Rumo às 1.000 Faixas',
  pixKey: '41651191808',
  pixKeyConfigured: true,
  pixName: 'LENKYX COSMIC PHONK',
  pixCity: 'CAMPO GRANDE',
  pixMessage: 'Apoio LENKYX Cosmic Phonk',
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

export function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('catalog');
  const [tabHistory, setTabHistory] = useState<TabId[]>([]);

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

  // Global search bar state (Spotify / YouTube Music top bar)
  const [globalSearch, setGlobalSearch] = useState('');
  const [worldTriggerQuery, setWorldTriggerQuery] = useState('');
  const [worldSearchNonce, setWorldSearchNonce] = useState(0);

  // Creator auth state (default = Fan mode)
  const [mode, setMode] = useState<AppMode>('fan');
  const [hasCustomPassword, setHasCustomPassword] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);

  // Fan / Open User Profile, Playlists & Personal Uploaded Tracks (IndexedDB)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => loadUserProfile());
  const [userAuthOpen, setUserAuthOpen] = useState(false);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>(() => loadUserPlaylists());
  const [userTracks, setUserTracks] = useState<Track[]>([]);
  const [worldCacheTracks, setWorldCacheTracks] = useState<Track[]>([]);

  // Global Player state (HTML5 <audio> + YouTube Full-Track Audio Engine)
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
  const [soundProfile, setSoundProfile] = useState<AudioSoundProfile>(() => loadSoundProfile());
  const [soundBoostOpen, setSoundBoostOpen] = useState(false);
  const [screensaverOpen, setScreensaverOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ id: string; title: string } | null>(null);
  const [autoScreensaverOnPlay, setAutoScreensaverOnPlay] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lenkyx_auto_screensaver_v1') === '1';
    } catch {
      return false;
    }
  });
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

  // Cross-tab context & JBL Light Show + Cinema Movie mode
  const [videoTrack, setVideoTrack] = useState<Track | null>(null);
  const [jblLightsEnabled, setJblLightsEnabled] = useState(true);
  const [jblTheme, setJblTheme] = useState<JblLightTheme>('partybox');
  const [watchingMovie, setWatchingMovie] = useState(false);

  // Google + AI Omnibox & Private Search states
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
  const [pixInitialTab, setPixInitialTab] = useState<'donate' | 'config'>('donate');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTrack, setShareTrack] = useState<Track | null>(null);
  const [spaceDownloadOpen, setSpaceDownloadOpen] = useState(false);
  const [clipTheaterOpen, setClipTheaterOpen] = useState(false);
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
  const [safeExitOpen, setSafeExitOpen] = useState(false);
  const [socialDistOpen, setSocialDistOpen] = useState(false);
  const [tvCastOpen, setTvCastOpen] = useState(false);
  const [tvCustomMedia, setTvCustomMedia] = useState<{
    title: string;
    artist?: string;
    mode?: 'galaxy' | 'video' | 'shorts' | 'tv';
    youtubeVideoId?: string;
    audioUrl?: string;
    coverUrl?: string;
  } | null>(null);
  const [tvModeBanner, setTvModeBanner] = useState<string | null>(null);
  const [tvPinInput, setTvPinInput] = useState('');
  const [gtaLoaderOpen, setGtaLoaderOpen] = useState(() => !sessionStorage.getItem('lenkyx_splash_done'));
  const [gtaUpdateCorner, setGtaUpdateCorner] = useState(false);

  // Brief discreet GTA-5 style cosmic splash on first visit (2.2s, skippable anytime) + SW update listener
  useEffect(() => {
    if (gtaLoaderOpen) {
      const t = window.setTimeout(() => {
        setGtaLoaderOpen(false);
        sessionStorage.setItem('lenkyx_splash_done', '1');
      }, 2200);
      return () => window.clearTimeout(t);
    }
  }, [gtaLoaderOpen]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          setGtaUpdateCorner(true);
          setTimeout(() => setGtaUpdateCorner(false), 6000);
        });
      })
      .catch(() => {});
  }, []);
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

  // Combined tracks pool for DJ Mixer & Playlists lookup (LENKYX + User Uploads + Discovered World tracks)
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

  // Load persisted User Uploaded Tracks from IndexedDB
  useEffect(() => {
    void loadUserTracks().then((loaded: Track[]) => setUserTracks(loaded));
  }, []);

  // Smart TV Independent Handoff (?tv=LNX-XXX or ?tvMode=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tvCode = params.get('tv') || '';
    const tvMode = params.get('tvMode') === '1';
    if (!tvCode && !tvMode) return;

    if (tvCode) {
      void fetchTvHandoff(tvCode, true).then((session) => {
        if (!session) {
          setTvModeBanner('📺 Modo Smart TV ativo! Escolha uma música, filme ou TV ao vivo.');
          return;
        }
        setTvModeBanner(`📺 Smart TV Conectada (${session.code}) · Modo Independente`);
        const tvTrack: Track = {
          id: session.trackId || `tv-${session.code}`,
          number: 1,
          title: session.title,
          artist: session.artist || 'LENKYX',
          album: 'Smart TV Handoff',
          emoji: '📺',
          bpm: 132,
          key: 'Fm',
          audioUrl: session.audioUrl || '',
          youtubeVideoId: session.youtubeVideoId || undefined,
          coverUrl: session.coverUrl || '/covers/album-official.jpg',
          plays: 0,
          likes: 0,
          favorite: false,
          releaseBatch: 1,
          status: { suno: true, cover: true, app: true, youtube: Boolean(session.youtubeVideoId), distrokid: true },
          sunoPrompt: '',
          lyrics: '',
          createdAt: new Date().toISOString(),
        };
        setCurrentTrack(tvTrack);
        setIsPlaying(true);
        if (session.youtubeVideoId) {
          setClipTheaterOpen(true);
        } else {
          setScreensaverOpen(true);
        }
      });
    } else if (tvMode) {
      setTvModeBanner('📺 Modo Smart TV Ativo! Digite o código de 3 números do celular ou navegue livremente.');
    }
  }, []);

  const handleClaimTvPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tvPinInput.trim();
    if (!clean) return;
    const session = await fetchTvHandoff(clean, true);
    if (!session) {
      showToast('Código não encontrado. Gere um novo no botão TV do celular!');
      return;
    }
    setTvModeBanner(`📺 Conectado à TV (${session.code}) · Celular já pode ser desconectado!`);
    setTvPinInput('');
    const tvTrack: Track = {
      id: session.trackId || `tv-${session.code}`,
      number: 1,
      title: session.title,
      artist: session.artist || 'LENKYX',
      album: 'Smart TV Handoff',
      emoji: '📺',
      bpm: 132,
      key: 'Fm',
      audioUrl: session.audioUrl || '',
      youtubeVideoId: session.youtubeVideoId || undefined,
      coverUrl: session.coverUrl || '/covers/album-official.jpg',
      plays: 0,
      likes: 0,
      favorite: false,
      releaseBatch: 1,
      status: { suno: true, cover: true, app: true, youtube: Boolean(session.youtubeVideoId), distrokid: true },
      sunoPrompt: '',
      lyrics: '',
      createdAt: new Date().toISOString(),
    };
    setCurrentTrack(tvTrack);
    setIsPlaying(true);
    if (session.youtubeVideoId) setClipTheaterOpen(true);
    else setScreensaverOpen(true);
  };

  // Silent Auto-Update check (Android APK checks Supabase manifest via LocalAssetServer)
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

  // Silent Cloud Sync for Fan Profile + Playlists (Supabase when online!)
  useEffect(() => {
    if (!userProfile || isAndroidApk()) return;
    const t = window.setTimeout(() => {
      void fetch('/api/fans/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email || '',
          avatarColor: userProfile.avatarColor,
          acceptedTermsAt: userProfile.acceptedTermsAt || '',
          playlists,
        }),
      }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(t);
  }, [userProfile, playlists]);

  // Secret URL trigger (#criador or ?studio=1) + hashchange listener
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

  // Fetch initial catalog + check creator session (with seamless offline seed-data fallback)
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
          // offline: try cached seed-data.json below
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
            apkDownloadUrl: (data!.settings?.apkDownloadUrl || '').trim() || prev.apkDownloadUrl,
          }));
        }

        const params = new URLSearchParams(window.location.search);
        const deepId = params.get('track');
        if (deepId && loadedTracks.length) {
          const found = loadedTracks.find((t: Track) => t.id === deepId);
          if (found) {
            setCurrentTrack(found);
            showToast(`🎵 Faixa compartilhada: ${found.emoji} ${found.title}`);
          }
        } else if (loadedTracks.length) {
          setCurrentTrack(loadedTracks[0]);
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

    const onTime = () => setCurrentTime(audio.currentTime || 0);
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

  // Setup YouTube IFrame Full-Length Audio Engine (zero 30s previews — plays complete official songs!)
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
        controls: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        fs: 1,
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
              ytPlayerRef.current?.loadVideoById?.(
                clipQualityRef.current !== 'default'
                  ? { videoId: vid, suggestedQuality: clipQualityRef.current }
                  : vid
              );
            }
          },
          onError: () => {
            if (!currentTrackRef.current?.youtubeVideoId) return;
            showToast('Este clipe bloqueou player embutido — pulando para o próximo da lista...');
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

    const timer = window.setInterval(() => {
      if (!currentTrackRef.current?.youtubeVideoId || !ytPlayerRef.current) return;
      const st = ytPlayerRef.current.getPlayerState?.();
      if (st === 1) {
        const ct = ytPlayerRef.current.getCurrentTime?.() || 0;
        const dt = ytPlayerRef.current.getDuration?.() || 0;
        setCurrentTime(ct);
        if (dt > 0) setDuration(dt);
      }
    }, 350);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pauseCatalogPlayer = useCallback(() => {
    audioRef.current?.pause();
    ytPlayerRef.current?.pauseVideo?.();
  }, []);

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

      // Toggle play/pause if tapping the already active track without changing version
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

      if (autoScreensaverOnPlay && !watchingMovie && !clipTheaterOpen) {
        setScreensaverOpen(true);
      }

      // Play full-length YouTube audio track when track is backed by youtubeVideoId
      if (track.youtubeVideoId && !track.audioUrl) {
        audio.pause();
        audio.removeAttribute('src');
        setIsPlayingFromOffline(false);
        setCurrentTime(0);
        setDuration(track.durationSec || 0);
        if (ytPlayerRef.current?.loadVideoById) {
          ytPlayerRef.current.setVolume?.(muted ? 0 : Math.round(volume * 100));
          ytPlayerRef.current.loadVideoById(
            clipQualityRef.current !== 'default'
              ? { videoId: track.youtubeVideoId, suggestedQuality: clipQualityRef.current }
              : track.youtubeVideoId
          );
          setIsPlaying(true);
        } else {
          ytPendingVideoRef.current = track.youtubeVideoId;
        }
        return;
      }

      // Stop any active YouTube playback when switching to direct MP3/MP4/Offline stream
      ytPlayerRef.current?.pauseVideo?.();
      setClipTheaterOpen(false);

      const resolved = await resolvePlayableAudioUrl(track, finalVersion);
      setIsPlayingFromOffline(resolved.fromOffline);
      audio.src = resolved.url;
      audio.volume = muted ? 0 : volume;
      audio.muted = muted;
      audio.load();
      lenkyxAudioEngine.attachAudioElement(audio);
      lenkyxAudioEngine.resume();
      lenkyxAudioEngine.applyProfile(soundProfile);
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
    [
      currentTrack?.id,
      activeVersion,
      volume,
      muted,
      autoScreensaverOnPlay,
      watchingMovie,
      clipTheaterOpen,
      soundProfile,
      showToast,
    ]
  );

  useEffect(() => {
    handlePlayTrackRef.current = handlePlayTrack;
  }, [handlePlayTrack]);

  // Offline download toggle (single track) & Download All
  const handleToggleOffline = useCallback(
    async (track: Track) => {
      if (track.youtubeVideoId && !track.audioUrl) {
        showToast('Faixas do YouTube são reproduzidas online; use as faixas LENKYX/Audius/Espaço para salvar offline!');
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
      showToast('✅ Todas as músicas já estão salvas offline no aparelho!');
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
        // continue remaining tracks
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    }
    setDownloadingAll(false);
    showToast(`📱 ${okCount} músicas baixadas no aparelho! Agora tocam mesmo sem internet.`);
  }, [tracks, offlineTrackIds, showToast]);

  // Auto-next when HTML5 song ends (strictly follows active playQueue!)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const list = playQueueRef.current.length ? playQueueRef.current : tracks;
      if (!currentTrack || list.length === 0) return;
      const idx = list.findIndex((t) => t.id === currentTrack.id);
      const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
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

  // Lock-Screen MediaSession (Chrome/Safari/PWA) + Native Android Lock-Screen Foreground Service Bridge
  useEffect(() => {
    if (!currentTrack) return;

    // 1. Native Android APK Media Notification + WakeLock
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

    // 2. Web MediaSession API (Lock Screen cover + controls on Chrome/iOS/Android)
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
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (typeof details.seekTime === 'number' && audioRef.current) {
            audioRef.current.currentTime = details.seekTime;
            setCurrentTime(details.seekTime);
          }
        });
      } catch {
        // ignore MediaSession unsupported fields
      }
    }
  }, [currentTrack, isPlaying, handlePrevNext]);

  // Android Lock-Screen Notification Action Callback
  useEffect(() => {
    window.__lenkyxMediaAction = (action) => {
      if (action === 'prev') {
        handlePrevNext(-1);
      } else if (action === 'next') {
        handlePrevNext(1);
      } else if (action === 'play') {
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

  const handleChangeSoundProfile = (next: AudioSoundProfile) => {
    setSoundProfile(next);
    lenkyxAudioEngine.attachAudioElement(audioRef.current);
    lenkyxAudioEngine.applyProfile(next);
  };

  const handleToggleAutoScreensaver = () => {
    setAutoScreensaverOnPlay((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lenkyx_auto_screensaver_v1', next ? '1' : '0');
      } catch {
        // ignore
      }
      showToast(
        next
          ? '🌌 Protetor 3D Automático ligado! Ao tocar música os menus dão lugar ao efeito 3D.'
          : 'Protetor 3D Automático desligado.'
      );
      return next;
    });
  };

  const handleExperienceMode = (exp: ExperienceMode) => {
    if (exp === 'audio') {
      setScreensaverOpen(false);
      setClipTheaterOpen(false);
    } else if (exp === 'screensaver') {
      setClipTheaterOpen(false);
      setScreensaverOpen(true);
    } else if (exp === 'video') {
      setScreensaverOpen(false);
      if (currentTrack?.youtubeVideoId) setClipTheaterOpen(true);
    }
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
    showToast(
      `✅ Suno sincronizado! +${data.added || 0} novas, ${data.updated || 0} atualizadas (capas LENKYX mantidas!).`
    );
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
    showToast('Modo Fã ativado.');
  };

  const handleSendToVideo = (track: Track) => {
    if (track.source === 'world_full' || track.source === 'world_preview') {
      setWorldCacheTracks((prev) => (prev.some((x) => x.id === track.id) ? prev : [track, ...prev].slice(0, 60)));
    }
    setVideoTrack(track);
    setActiveTab('video');
    showToast(`🎬 "${track.title}" pronta no Estúdio de Vídeos!`);
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
    if (activeTab === 'explore' || activeTab === 'catalog') {
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
    { id: 'catalog', label: 'Início · LENKYX', icon: <Music className="w-4 h-4" /> },
    { id: 'search', label: 'Pesquisa Web & IA', icon: <Search className="w-4 h-4" /> },
    { id: 'explore', label: 'Artistas & Mundo', icon: <Globe2 className="w-4 h-4" /> },
    { id: 'movies', label: 'Cinema, Séries & TV', icon: <Clapperboard className="w-4 h-4" /> },
    { id: 'video', label: 'Reels, Live & Vídeos', icon: <Video className="w-4 h-4" /> },
    { id: 'arcade', label: 'Fliperama & Jogos', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'community_hub', label: 'Prêmios & Metas', icon: <Gift className="w-4 h-4" /> },
    { id: 'playlists', label: 'Minhas Playlists', icon: <ListMusic className="w-4 h-4" /> },
  ];

  const isMusicSection =
    activeTab === 'catalog' || activeTab === 'explore' || activeTab === 'playlists';

  const isWatchingVideoOrMovie =
    clipTheaterOpen || watchingMovie;

  return (
    <div className="h-dvh overflow-hidden bg-[#04010c] text-white flex relative">
      {/* === 3D DEEP SPACE PARALLAX STARFIELD & FLOATING PLANETS (Auto-pauses during Video/Fullscreen!) === */}
      <CosmicSpaceBackdrop paused={isWatchingVideoOrMovie || activeTab === 'video' || isNativeFullscreen} />

      {/* === JBL PARTYBOX REACTIVE LIGHT SHOW (dims automatically for Videos & Movies!) === */}
      <JblLightShowOverlay
        enabled={jblLightsEnabled}
        isPlaying={isPlaying}
        dimForVideo={isWatchingVideoOrMovie}
        theme={jblTheme}
      />

      {/* === DESKTOP FLOATING GLASS LEFT SIDEBAR (Spatial transition out during 3D Screensaver) === */}
      <aside
        className={`hidden md:flex flex-col w-56 lg:w-60 shrink-0 fixed inset-y-2 left-2 z-30 rounded-3xl glass-panel overflow-hidden transition-all duration-700 ease-out ${
          screensaverOpen ? '-translate-x-10 scale-90 opacity-0 blur-sm pointer-events-none' : 'translate-x-0 scale-100 opacity-100'
        }`}
      >
        {/* Brand Monument (tap 5x secretly for Creator access) */}
        <div
          onClick={handleBrandTap}
          className="h-16 px-4 flex items-center gap-3 border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.03] select-none"
        >
          <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-amber-300/70 to-pink-500 shadow-[0_0_18px_rgba(56,189,248,0.28)]">
            <img
              src="/covers/avatar.jpg"
              alt="LENKYX"
              className="w-9 h-9 rounded-full object-cover bg-black"
            />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-display text-sm font-black tracking-[0.14em] text-white">LENKYX</div>
            <div className="text-[9px] font-bold tracking-[0.26em] text-cyan-300/90 truncate">COSMIC PHONK</div>
          </div>
        </div>

        {/* Architectural Primary Sector Navigation (All 7 Universe Sectors Immediately Visible) */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-3 space-y-3">
          <nav className="space-y-1">
            {sidebarMain.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTab(tab.id)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
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

          {/* Creator Tools (Visible when Creator unlocked) */}
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

        {/* Compact Architectural Utility Dock */}
        <div className="p-2.5 border-t border-white/[0.08] bg-black/25 space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setChatOpen(true)}
              className="py-2 px-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-cyan-200 text-[10px] font-bold flex flex-col items-center gap-1 transition"
              title="Chat da Comunidade"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => {
                setTvCustomMedia(null);
                setTvCastOpen(true);
              }}
              className="py-2 px-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-[10px] font-bold flex flex-col items-center gap-1 transition"
              title="Passar para Smart TV & Bluetooth"
            >
              <Tv className="w-3.5 h-3.5 text-cyan-300" />
              <span>Smart TV</span>
            </button>
            <button
              onClick={() => {
                setShareTrack(null);
                setShareOpen(true);
              }}
              className="py-2 px-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-emerald-200 text-[10px] font-bold flex flex-col items-center gap-1 transition"
              title="Indicar no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span>Indicar</span>
            </button>
            <button
              onClick={() => setSocialDistOpen(true)}
              className="py-2 px-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-pink-200 text-[10px] font-bold flex flex-col items-center gap-1 transition"
              title="Auto-Divulgar Redes Sociais"
            >
              <Share2 className="w-3.5 h-3.5 text-pink-300" />
              <span>Divulgar</span>
            </button>
            <button
              onClick={() => setLegalOpen(true)}
              className="py-2 px-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-[10px] font-bold flex flex-col items-center gap-1 transition"
              title="Direitos Autorais & DMCA"
            >
              <Scale className="w-3.5 h-3.5 text-amber-300" />
              <span>DMCA</span>
            </button>
            <button
              onClick={() => setSafeExitOpen(true)}
              className="py-2 px-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-emerald-200 text-[10px] font-bold flex flex-col items-center gap-1 transition"
              title="Sair com Segurança"
            >
              <Power className="w-3.5 h-3.5 text-emerald-300" />
              <span>Sair</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {!isAndroidApk() && (
              <button
                onClick={() => setSpaceDownloadOpen(true)}
                className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-black text-[11px] font-black flex items-center justify-center gap-1 shadow transition"
              >
                <Rocket className="w-3.5 h-3.5" /> App APK
              </button>
            )}
            <button
              onClick={() => {
                setPixInitialTab('donate');
                setPixOpen(true);
              }}
              className="flex-1 py-2 px-2.5 rounded-xl bg-white/[0.08] hover:bg-pink-500/25 border border-pink-400/35 text-pink-100 text-[11px] font-bold flex items-center justify-center gap-1 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-pink-300" /> Apoiar
            </button>
          </div>

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

      {/* === MAIN CONTENT SHELL (Isolated Architectural Scrollport — zero overlap & zero scroll bleeding) === */}
      <div
        className={`relative z-10 flex-1 md:pl-60 lg:pl-64 min-w-0 h-full overflow-hidden flex flex-col transition-all duration-700 ease-out ${
          screensaverOpen ? 'scale-90 opacity-0 blur-sm pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        {/* ARCHITECTURAL TOP HEADER (Dedicated non-overlapping header bar) */}
        <header className="shrink-0 z-30 mx-3 sm:mx-5 mt-2 rounded-2xl glass-panel h-14 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Universal Back (←) + Close (X) Navigation across ALL menus */}
          <div className="flex items-center gap-1 shrink-0">
            {(tabHistory.length > 0 || activeTab !== 'catalog') && (
              <>
                <button
                  onClick={goBackTab}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition"
                  title="Voltar para a tela anterior"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateTab('catalog')}
                  className="hidden sm:flex p-2 rounded-xl bg-white/10 hover:bg-red-500/80 border border-white/15 text-white transition"
                  title="Fechar seção e voltar ao Início"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Mobile Brand Mini (tap 5x secretly for Creator access) */}
            <div
              onClick={handleBrandTap}
              className="flex md:hidden items-center gap-1.5 shrink-0 cursor-pointer select-none"
            >
              <img src="/covers/avatar.jpg" alt="LENKYX" className="w-7 h-7 rounded-full border border-pink-500" />
              <span className="font-display text-xs font-black hidden xs:inline">LENKYX</span>
            </div>
          </div>

          {/* ADAPTIVE GOOGLE + AI OMNIBOX SEARCH (Full Room, Clear Letters on Mobile, PC & TV) */}
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
                placeholder="Pesquisar na Web, IA, Músicas, Filmes..."
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
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => openWebSearch(globalSearch || 'LENKYX Cosmic Phonk', true)}
                className={`p-1.5 rounded-full border shrink-0 transition ${
                  searchViewPrivate
                    ? 'bg-purple-500/35 border-purple-400 text-purple-100'
                    : 'bg-white/[0.06] hover:bg-purple-500/25 border-white/10 text-slate-300'
                }`}
                title="Pesquisar em Modo Privado (sem salvar histórico)"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                className="px-2.5 sm:px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-[11px] font-black hover:brightness-110 shrink-0 transition"
                title="Buscar com IA na Internet e no Catálogo"
              >
                Buscar
              </button>
            </form>

            {isMusicSection && currentTrack && !musicMenuOpen && (
              <button
                onClick={() => setMusicMenuOpen(true)}
                className="hidden sm:flex px-2.5 py-1.5 rounded-full bg-pink-500/25 hover:bg-pink-500/40 border border-pink-400/45 text-pink-100 text-[11px] font-black items-center gap-1 shrink-0 transition"
                title="Abrir Player de Música"
              >
                <Music className="w-3.5 h-3.5" />
                <span className="hidden xl:inline max-w-[100px] truncate">{currentTrack.title}</span>
              </button>
            )}

            {/* GOOGLE + AI INSTANT OMNIBOX DROPDOWN */}
            {omniboxOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-[60] rounded-2xl bg-[#090616]/98 backdrop-blur-2xl border border-cyan-400/30 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden">
                {globalSearch.trim() && (
                  <div className="p-2 border-b border-white/[0.08] flex flex-wrap gap-1.5 bg-white/[0.03]">
                    <button
                      type="button"
                      onClick={() => openWebSearch(globalSearch, false)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black text-xs font-black flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Modo IA & Web: "{globalSearch.trim().slice(0, 26)}"
                    </button>
                    <button
                      type="button"
                      onClick={() => openWebSearch(globalSearch, true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-100 text-xs font-black flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" /> Modo Privado
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerWorldSearchDirect(globalSearch)}
                      className="px-3 py-1.5 rounded-xl bg-pink-500/25 border border-pink-400/40 text-pink-100 text-xs font-black flex items-center gap-1.5"
                    >
                      <Music className="w-3.5 h-3.5" /> Músicas
                    </button>
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto overscroll-contain divide-y divide-white/[0.04]">
                  {omniboxSuggestions.slice(0, 7).map((sug) => (
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
                      <span className="text-[10px] text-cyan-300/75 shrink-0">Web & IA</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Compact Controls (Clean architectural spacing so Search Bar stays wide!) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Master Volume Control Visible in ALL Menus */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.07] border border-white/10">
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
                title={`Volume: ${Math.round((muted ? 0 : volume) * 100)}%`}
              />
              <button
                onClick={() => setSoundBoostOpen(true)}
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 transition ${
                  soundProfile.turboEnabled
                    ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-black shadow'
                    : 'bg-white/10 hover:bg-white/20 text-amber-200'
                }`}
                title="Volume Máximo Limpo & Equalizador (Opcional)"
              >
                <Zap className="w-3 h-3" />
                <span className="hidden xl:inline">{soundProfile.turboEnabled ? 'Máx ON' : 'EQ'}</span>
              </button>
            </div>

            {/* Smart TV Handoff & Bluetooth Button */}
            <button
              onClick={() => {
                setTvCustomMedia(null);
                setTvCastOpen(true);
              }}
              className="px-2 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/35 border border-cyan-400/45 text-cyan-100 text-[11px] font-extrabold flex items-center gap-1 transition"
              title="Enviar para Smart TV & Som Bluetooth"
            >
              <Tv className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden xl:inline">TV</span>
            </button>

            {/* 3D Cosmic Screensaver Toggle Button (Ligar / Desligar) */}
            <button
              onClick={() => setScreensaverOpen((v) => !v)}
              className={`hidden sm:flex px-2.5 py-1.5 rounded-full border text-[11px] font-black items-center gap-1 transition ${
                screensaverOpen
                  ? 'bg-gradient-to-r from-cyan-400 to-pink-500 border-white/40 text-black shadow-[0_0_16px_rgba(34,211,238,0.45)]'
                  : 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/40 hover:to-pink-500/40 border-cyan-400/50 text-cyan-100'
              }`}
              title={screensaverOpen ? 'Desligar Efeito 3D' : 'Ligar Efeito 3D'}
            >
              <Waves className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">{screensaverOpen ? 'Efeito 3D ON' : 'Efeito 3D'}</span>
            </button>

            <button
              onClick={() => {
                if (!jblLightsEnabled) {
                  setJblLightsEnabled(true);
                  setJblTheme('partybox');
                  showToast('🔊 Luzes JBL PartyBox Ligadas!');
                } else if (jblTheme === 'partybox') {
                  setJblTheme('aurora');
                  showToast('✨ Tema JBL Aurora Ativado!');
                } else if (jblTheme === 'aurora') {
                  setJblTheme('cosmic');
                  showToast('🌌 Tema JBL Cósmico Ativado!');
                } else {
                  setJblLightsEnabled(false);
                  showToast('Luzes JBL Desligadas.');
                }
              }}
              className={`hidden sm:flex p-2 rounded-full border transition ${
                jblLightsEnabled
                  ? 'bg-pink-500/25 border-pink-400/50 text-pink-200'
                  : 'bg-white/[0.06] border-white/10 text-purple-200/75'
              }`}
              title="Trocar Tema das Luzes JBL (PartyBox / Aurora / Cósmico / Off)"
            >
              <Speaker className="w-3.5 h-3.5" />
            </button>

            {!isAndroidApk() && (
              <button
                onClick={() => setSpaceDownloadOpen(true)}
                className="md:hidden px-2.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 text-black text-[11px] font-black flex items-center gap-1 shadow"
                title="Baixar App Android (APK)"
              >
                <Rocket className="w-3.5 h-3.5" /> App
              </button>
            )}

            {userProfile ? (
              <button
                onClick={() => setUserAuthOpen(true)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition"
              >
                <span
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${userProfile.avatarColor} text-[11px] font-black text-white flex items-center justify-center`}
                >
                  {userProfile.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xs font-bold text-white max-w-[80px] truncate hidden lg:inline">
                  {userProfile.name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setUserAuthOpen(true)}
                className="px-2.5 py-1.5 rounded-full bg-white hover:bg-purple-100 text-black text-xs font-extrabold flex items-center gap-1 shadow transition"
              >
                <UserCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}

            {mode === 'creator' && (
              <button
                onClick={() => void handleCreatorLogout()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/25"
                title="Voltar ao Modo Fã"
              >
                <Sparkles className="w-3 h-3" /> <span className="hidden lg:inline">CRIADOR</span>
                <LogOut className="w-3 h-3 ml-0.5 opacity-75" />
              </button>
            )}
          </div>
        </header>

        {/* ACTIVE VIEW CONTAINER (Isolated vertical scrollport below header) */}
        <main
          id="lenkyx-main-scroll"
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain w-full"
        >
          <div className="w-full max-w-[1380px] mx-auto px-3 sm:px-5 pt-4">
          {appUpdateInfo && (
            <div className="mb-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-pink-500/20 border border-cyan-400/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg">
              <div className="min-w-0">
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <Rocket className="w-4 h-4 text-cyan-300" />
                  Nova atualização v{appUpdateInfo.latestVersionName} disponível automaticamente!
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
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black hover:brightness-110 transition"
                >
                  Atualizar Agora 🚀
                </button>
                <button
                  onClick={() => setAppUpdateInfo(null)}
                  className="p-1 rounded-lg bg-white/10 text-purple-200 hover:text-white"
                  title="Fechar aviso"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-pink-500 border-t-cyan-400 animate-spin" />
              <div className="font-display text-xs tracking-widest text-purple-300">CARREGANDO LENKYX COSMIC PHONK...</div>
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
                  onSendToVideo={handleSendToVideo}
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
                  onCommentTrack={(t) => setCommentTarget({ id: `track:${t.id}`, title: `${t.title} — ${t.artist}` })}
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
                  onWatchClip={(t, queue) => {
                    void handlePlayTrack(t, 'v1', queue);
                    setClipTheaterOpen(true);
                  }}
                  onAddToPlaylist={addTrackToPlaylist}
                  onSendToVideo={handleSendToVideo}
                  onOpenTvCast={(m) => {
                    setTvCustomMedia(m);
                    setTvCastOpen(true);
                  }}
                />
              )}

              {activeTab === 'playlists' && (
                <PlaylistsView
                  user={userProfile}
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
                  onSendToVideo={handleSendToVideo}
                  onOpenUserAuth={() => setUserAuthOpen(true)}
                />
              )}

              <Suspense
                fallback={
                  <div className="py-16 text-center text-xs text-purple-300 font-semibold">
                    Carregando módulo...
                  </div>
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
                    onOpenTvCast={(m) => {
                      setTvCustomMedia(m);
                      setTvCastOpen(true);
                    }}
                    onOpenPix={() => {
                      setPixInitialTab('donate');
                      setPixOpen(true);
                    }}
                  />
                )}

                {activeTab === 'video' && (
                  <SocialShortsAndLiveView
                    tracks={allTracksPool}
                    initialTrack={videoTrack || currentTrack}
                    user={userProfile}
                    onPlayTrack={(t) => void handlePlayTrack(t, 'v1', allTracksPool)}
                    onPauseCatalogPlayer={pauseCatalogPlayer}
                    onOpenUserAuth={() => setUserAuthOpen(true)}
                    onOpenTvCast={(m) => {
                      setTvCustomMedia(m);
                      setTvCastOpen(true);
                    }}
                    onToast={showToast}
                  />
                )}

                {activeTab === 'arcade' && (
                  <ArcadeView user={userProfile} onToast={showToast} />
                )}

                {activeTab === 'search' && (
                  <CosmicSearchView
                    initialQuery={searchViewQuery}
                    initialPrivate={searchViewPrivate}
                    localTracks={allTracksPool}
                    onPlayTrack={(t, q) => void handlePlayTrack(t, 'v1', q)}
                    onNavigateTab={(tab) => navigateTab(tab)}
                    onToast={showToast}
                  />
                )}

                {activeTab === 'community_hub' && (
                  <CosmicHubView
                    user={userProfile}
                    mode={mode}
                    settings={settings}
                    onOpenUserAuth={() => setUserAuthOpen(true)}
                    onOpenPix={() => {
                      setPixInitialTab('donate');
                      setPixOpen(true);
                    }}
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

      {/* MUSIC PLAYER BAR: ONLY appears inside Music sections when user opens a song (never blocks Videos, Movies, Games or Images!) */}
      {!watchingMovie && !screensaverOpen && isMusicSection && musicMenuOpen && (
        <MiniPlayer
          track={currentTrack}
          activeVersion={activeVersion}
          isPlaying={isPlaying}
          isPlayingFromOffline={isPlayingFromOffline}
          isCurrentTrackOffline={currentTrack ? offlineTrackIds.has(currentTrack.id) : false}
          isDownloadingOffline={currentTrack ? downloadingIds.has(currentTrack.id) : false}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          muted={muted}
          jblLightsEnabled={jblLightsEnabled}
          onToggleJblLights={() => setJblLightsEnabled((v) => !v)}
          onTogglePlay={() => void handleTogglePlay()}
          onSelectVersion={handleSelectVersion}
          onPrev={() => handlePrevNext(-1)}
          onNext={() => handlePrevNext(1)}
          onSeek={handleSeek}
          onVolume={handleVolume}
          onToggleMute={handleToggleMute}
          onOpenScreensaver={() => setScreensaverOpen(true)}
          onShare={(t) => {
            setShareTrack(t);
            setShareOpen(true);
          }}
          onSendToVideo={handleSendToVideo}
          onOpenLyrics={(t) => {
            setActiveTab('catalog');
            setLyricsTrack(t);
          }}
          onLike={(t) => void handleLikeTrack(t)}
          onToggleOffline={(t) => void handleToggleOffline(t)}
          onWatchClip={() => {
            if (currentTrack?.youtubeVideoId) setClipTheaterOpen(true);
          }}
          onCloseMenu={() => setMusicMenuOpen(false)}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (Scrollable across all 7 sections cleanly!) */}
      {!watchingMovie && !screensaverOpen && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#090516]/96 backdrop-blur-xl border-t border-white/10 flex items-center justify-around overflow-x-auto px-1">
        {(
          [
            { id: 'catalog' as TabId, label: 'Músicas', icon: <Music className="w-4 h-4" /> },
            { id: 'explore' as TabId, label: 'Artistas', icon: <Globe2 className="w-4 h-4" /> },
            { id: 'movies' as TabId, label: 'Cinema', icon: <Clapperboard className="w-4 h-4" /> },
            { id: 'video' as TabId, label: 'Reels', icon: <Video className="w-4 h-4" /> },
            { id: 'arcade' as TabId, label: 'Jogos', icon: <Gamepad2 className="w-4 h-4" /> },
            { id: 'community_hub' as TabId, label: 'Prêmios', icon: <Gift className="w-4 h-4" /> },
            { id: 'playlists' as TabId, label: 'Playlists', icon: <ListMusic className="w-4 h-4" /> },
          ] as { id: TabId; label: string; icon: React.ReactNode; isPix?: boolean }[]
        ).map((item) => {
          const active = !item.isPix && activeTab === item.id;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.isPix) {
                  setPixInitialTab('donate');
                  setPixOpen(true);
                } else {
                  navigateTab(item.id);
                }
              }}
              className={`min-w-[50px] shrink-0 flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition ${
                active ? 'text-pink-400' : 'text-purple-300/75'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
      )}

      {/* MODALS */}
      <PixModal
        open={pixOpen}
        onClose={() => setPixOpen(false)}
        initialTab={pixInitialTab}
        settings={settings}
        mode={mode}
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
        onOpenSpaceDownload={() => setSpaceDownloadOpen(true)}
        onToast={showToast}
      />
      <SpaceDownloadModal
        open={spaceDownloadOpen}
        onClose={() => setSpaceDownloadOpen(false)}
        settings={settings}
        onOpenShare={() => {
          setShareTrack(null);
          setShareOpen(true);
        }}
        onToast={showToast}
      />
      {/* FULLSCREEN 3D SOUNDWAVE SCREENSAVER + CUSTOM IMAGE SLIDESHOW */}
      <CosmicScreensaver3D
        open={screensaverOpen}
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        muted={muted}
        autoOnPlay={autoScreensaverOnPlay}
        turboEnabled={soundProfile.turboEnabled}
        audioElement={audioRef.current}
        hasVideo={Boolean(currentTrack?.youtubeVideoId)}
        onToggleAutoOnPlay={handleToggleAutoScreensaver}
        onOpenSoundBoost={() => setSoundBoostOpen(true)}
        onTogglePlay={() => void handleTogglePlay()}
        onPrev={() => handlePrevNext(-1)}
        onNext={() => handlePrevNext(1)}
        onSeek={handleSeek}
        onVolume={handleVolume}
        onToggleMute={handleToggleMute}
        onSelectMode={handleExperienceMode}
        onClose={() => setScreensaverOpen(false)}
      />

      {/* OPTIONAL MAX VOLUME + STUDIO LIMITER + 3-BAND EQ MODAL */}
      <SoundBoostModal
        open={soundBoostOpen}
        onClose={() => setSoundBoostOpen(false)}
        volume={volume}
        muted={muted}
        profile={soundProfile}
        isYoutubeStream={Boolean(currentTrack?.youtubeVideoId && !currentTrack?.audioUrl)}
        onVolume={handleVolume}
        onToggleMute={handleToggleMute}
        onChangeProfile={handleChangeSoundProfile}
      />

      {/* SMART TV INDEPENDENT MODE BANNER (When opened on a Smart TV via /tv or /tv/413) */}
      {tvModeBanner && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9994] w-[96vw] max-w-5xl rounded-2xl bg-[#090418]/95 border-2 border-cyan-400/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-[0_0_40px_rgba(34,211,238,0.45)]">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
            <Tv className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>{tvModeBanner}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={(e) => void handleClaimTvPin(e)} className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={tvPinInput}
                onChange={(e) => setTvPinInput(e.target.value)}
                placeholder="Código (ex: 413)"
                className="w-28 px-2.5 py-1 rounded-xl bg-black/60 border border-cyan-400/50 text-xs font-mono font-bold text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-xl bg-cyan-400 text-black text-xs font-black"
              >
                OK
              </button>
            </form>
            <button
              onClick={() => {
                setActiveTab('movies');
                setTvModeBanner(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black"
            >
              🎬 Filmes & Séries TV
            </button>
            <button
              onClick={() => setScreensaverOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-400 text-black text-xs font-black"
            >
              🌌 Galáxia 3D
            </button>
            {settings.apkDownloadUrl && (
              <a
                href={settings.apkDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-400 text-black text-xs font-black flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Baixar App na TV
              </a>
            )}
            <button
              onClick={() => setTvModeBanner(null)}
              className="p-1.5 rounded-full bg-white/10 text-white"
              title="Ocultar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SMART TV INDEPENDENT HANDOFF & BLUETOOTH MODAL */}
      <TvCastModal
        open={tvCastOpen}
        onClose={() => setTvCastOpen(false)}
        currentMedia={
          tvCustomMedia || {
            title: currentTrack?.title || 'LENKYX Cosmic Phonk',
            artist: currentTrack?.artist || 'LENKYX',
            mode: currentTrack?.youtubeVideoId ? 'video' : 'galaxy',
            youtubeVideoId: currentTrack?.youtubeVideoId,
            audioUrl: currentTrack?.audioUrl,
            coverUrl: currentTrack?.coverUrl || '/covers/album-official.jpg',
            trackId: currentTrack?.id,
          }
        }
        apkDownloadUrl={settings.apkDownloadUrl}
        onDetachPhone={() => {
          pauseCatalogPlayer();
          setClipTheaterOpen(false);
          setScreensaverOpen(false);
        }}
        onToast={showToast}
      />

      {/* DISCREET GTA-5 STYLE COSMIC LOADING / UPDATE SCREEN */}
      <CosmicGtaLoader
        open={gtaLoaderOpen}
        mode="splash"
        statusText="Sincronizando Universo LENKYX..."
        onSkip={() => {
          setGtaLoaderOpen(false);
          sessionStorage.setItem('lenkyx_splash_done', '1');
        }}
      />
      <CosmicGtaLoader
        open={!gtaLoaderOpen && gtaUpdateCorner}
        mode="discreet_corner"
        statusText="Nova atualização cósmica aplicada!"
        onSkip={() => setGtaUpdateCorner(false)}
      />

      {/* REAL COPYRIGHT / DMCA SAFE HARBOR LEGAL TERMS MODAL */}
      <LegalTermsModal
        open={legalOpen}
        onClose={() => setLegalOpen(false)}
        creatorEmail={userProfile?.email || undefined}
      />

      {/* SAFE EXIT MODAL (Saves Cloud, Playlists & Offline Data before exiting) */}
      <SafeExitModal
        open={safeExitOpen}
        onClose={() => setSafeExitOpen(false)}
        user={userProfile}
        playlists={playlists}
        userTracks={userTracks}
        offlineCount={offlineTrackIds.size}
        onSyncCloud={async () => {
          if (userProfile) {
            await authFetch('/api/fans/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                avatarColor: userProfile.avatarColor,
                playlists,
              }),
            }).catch(() => {});
          }
        }}
        onLogoutUser={() => {
          setUserProfile(null);
          saveUserProfile(null);
          showToast('Sessão encerrada com segurança — suas playlists e offline continuam salvos!');
        }}
        onPauseAllMedia={() => {
          pauseCatalogPlayer();
          setClipTheaterOpen(false);
          setScreensaverOpen(false);
        }}
        onToast={showToast}
      />

      {/* OFFICIAL GLOBAL SOCIAL DISTRIBUTION & AUTO-PUBLISH MODAL */}
      <SocialDistributionModal
        open={socialDistOpen}
        onClose={() => setSocialDistOpen(false)}
        track={currentTrack}
        settings={settings}
        mode={mode}
        onSaveSettings={handleSaveSettings}
        onToast={showToast}
      />

      {/* COMMUNITY GLOBAL CHAT & TRACK COMMENTS */}
      <CommunityChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        user={userProfile}
        onOpenAuth={() => {
          setChatOpen(false);
          setUserAuthOpen(true);
        }}
      />
      <TargetCommentsModal
        open={Boolean(commentTarget)}
        onClose={() => setCommentTarget(null)}
        targetId={commentTarget?.id || ''}
        targetTitle={commentTarget?.title || ''}
        user={userProfile}
      />

      {/* Persistent Cinema Clip Theater (fits strictly inside viewport — Voltar, Ajustar Tela & Fechar ALWAYS visible!) */}
      <div
        onClick={(e) => {
          if (clipTheaterOpen && e.target === e.currentTarget) setClipTheaterOpen(false);
        }}
        className={
          clipTheaterOpen && currentTrack?.youtubeVideoId
            ? `fixed inset-0 z-[9995] bg-black flex items-center justify-center ${
                clipFitMode === 'fullscreen' ? 'p-0' : 'p-2 sm:p-4'
              }`
            : 'fixed -left-[9999px] -top-[9999px] w-[320px] h-[180px] opacity-0 pointer-events-none'
        }
      >
        <div
          className={
            clipTheaterOpen && currentTrack?.youtubeVideoId
              ? `w-full flex flex-col overflow-hidden bg-[#090418] border border-cyan-400/40 shadow-[0_0_70px_rgba(236,72,153,0.35)] ${
                  clipFitMode === 'fullscreen'
                    ? 'h-[100dvh] max-w-none rounded-none border-0'
                    : clipFitMode === 'compact'
                      ? 'max-w-2xl max-h-[85dvh] rounded-3xl'
                      : 'max-w-5xl h-[92dvh] max-h-[92dvh] rounded-3xl'
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
                  title="Voltar para o App"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300 truncate">
                    Clipe Oficial · Modo Cinema
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white truncate">
                    {currentTrack.title}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <select
                  value={clipQuality}
                  onChange={(e) => {
                    const q = e.target.value as typeof clipQuality;
                    setClipQuality(q);
                    if (q !== 'default') {
                      ytPlayerRef.current?.setPlaybackQuality?.(q);
                    }
                    showToast(
                      q === 'medium'
                        ? '⚡ Qualidade 360p (Ultra Leve · Zero Travamento)'
                        : q === 'large'
                          ? '⚡ Qualidade 480p (Leve & Rápido)'
                          : q === 'hd720'
                            ? '🎬 Qualidade 720p HD (Estável em Tela Cheia)'
                            : '🎬 Qualidade Automática'
                    );
                  }}
                  className="px-2 py-1.5 rounded-xl bg-white/10 border border-cyan-400/35 text-cyan-100 text-[11px] font-black focus:outline-none cursor-pointer"
                  title="Escolher qualidade para evitar travamentos em Tela Cheia"
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
                  title="Ajustar tamanho da tela (Padrão / Tela Cheia / Compacto)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>
                    {clipFitMode === 'fullscreen'
                      ? 'Tela Cheia'
                      : clipFitMode === 'compact'
                        ? 'Compacto'
                        : 'Ajustar Tela'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setClipTheaterOpen(false);
                    setScreensaverOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-pink-500/25 hover:bg-pink-500/40 border border-pink-400/45 text-pink-100 text-[11px] font-bold flex items-center gap-1"
                  title="Abrir Galáxia / Efeito 3D"
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Efeito 3D</span>
                </button>
                <button
                  onClick={() => setClipTheaterOpen(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-purple-100 flex items-center gap-1"
                  title="Continuar ouvindo somente o som"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Só Som</span>
                </button>
                <button
                  onClick={() => setClipTheaterOpen(false)}
                  className="px-2.5 py-1.5 rounded-full bg-red-600/85 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1"
                  title="Fechar Vídeo"
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
                ? 'flex-1 min-h-[200px] w-full bg-black flex items-center justify-center'
                : 'w-full h-full bg-black'
            }
          >
            <div id="lenkyx-yt-audio-host" className="w-full h-full" />
          </div>

          {clipTheaterOpen && currentTrack?.youtubeVideoId && (
            <div className="px-3 sm:px-4 py-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#090418] shrink-0">
              <div className="min-w-0">
                <div className="text-xs font-bold text-purple-200 truncate">{currentTrack.artist}</div>
                <div className="text-[10px] text-cyan-300/80 flex items-center gap-2">
                  <span>Próxima segue na sequência · Reproduzindo no LENKYX</span>
                </div>
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
                  title="Clipe Anterior"
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
                  title="Próximo Clipe"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
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
      <UserAuthModal
        open={userAuthOpen}
        requireGate={!loading && !userProfile && mode !== 'creator'}
        onClose={() => setUserAuthOpen(false)}
        user={userProfile}
        onSaveUser={(u) => {
          setUserProfile(u);
          saveUserProfile(u);
          saveDeviceAccount(u);
        }}
        onLogoutUser={() => {
          setUserProfile(null);
          saveUserProfile(null);
          showToast('Sessão encerrada.');
        }}
        onOpenShare={() => {
          setUserAuthOpen(false);
          setShareTrack(null);
          setShareOpen(true);
        }}
        onBrandTap={handleBrandTap}
        onToast={showToast}
      />

      {/* TOAST */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 max-w-sm px-4 py-2.5 rounded-xl bg-[#140a2c]/95 border border-pink-500/50 text-xs font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;

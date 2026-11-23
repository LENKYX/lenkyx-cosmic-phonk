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
  Sun,
  Moon,
  ArrowLeft,
  Scale,
  Shield,
  Share2,
  Trophy,
  Users,
  Target,
  AudioWaveform,
  Crown,
  Flame,
  Smartphone,
  Zap,
  CheckCircle2,
  Power,
  ShieldOff,
  Car,
  Monitor,
  Download,
  Copy,
  ExternalLink,
  Tv,
  Gamepad2,
  Disc3,
  Plus,
  Radio,
  MessageCircle,
  ChevronRight,
  RefreshCw,
  Home,
  MoreVertical,
  Compass,
  Bell,
  ShoppingBag,
  Mic,
  Handshake,
  TrendingUp,
  Headphones,
  MessageSquare,
  Menu,
  Lock,
  Crop,
} from 'lucide-react';
import {
  clearBackgroundMediaSession,
  prefetchVideoAudioBackup,
  requestYoutubeMediaPermissions,
  setMediaWakeLock,
  setMobileBackgroundKeepalive,
  syncBackgroundMediaSession,
} from './utils/backgroundAudioGuard';
import {
  detectVisitorLanguage,
  getLanguageMeta,
  hasManualLanguageOverride,
  saveUserLanguage,
  startAutoDomTranslator,
} from './utils/globalI18n';
import {
  applyGamingFpsBoostClass,
  closeGamingFloatingPlayer,
  isGamingFpsBoostStored,
  isGamingModeStored,
  isGamingPipOpen,
  openGamingFloatingPlayer,
  setGamingModeActive,
  updateGamingPipMetadata,
} from './utils/gamingAudioBridge';
import { GamingMusicModeModal } from './components/GamingMusicModeModal';
import { WorldLanguageModal } from './components/WorldLanguageModal';
import { AudioEffectId, MediaPlayerMenuModal } from './components/MediaPlayerMenuModal';
import { AudioVisualizerModal } from './components/AudioVisualizerModal';
import { CommunityChatModal, TargetCommentsModal } from './components/CommunityChatModal';
import { fetchChannelSubscriptions, getClientSubscriberId } from './utils/communityApi';
import { recordRankingHit } from './utils/rankingsApi';
import { claimMediaFocus, registerMediaStopper, stopAllMedia } from './utils/mediaCoordinator';
import { rankTracksBySmartTaste, recordSmartInteraction } from './utils/smartEngine';
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
import { ShopCat as ShopCategory, ShopCriaView } from './components/ShopCriaView';
import { copyTextReliable, isAndroidApk } from './utils/androidBridge';
import { CatalogView } from './components/CatalogView';
import { WorldExploreView } from './components/WorldExploreView';
import { PlaylistsView } from './components/PlaylistsView';
import { CosmicSpaceBackdrop } from './components/CosmicSpaceBackdrop';
import { LenkyxEdgeLogo } from './components/LenkyxEdgeLogo';
import { playLenkyxStartupSound, stopLenkyxStartupSound, isStartupBeatPlaying } from './utils/startupSound';
import { useVideoAspect, useFittedSize, useAutoHideChrome } from './utils/videoChrome';
import {
  FuturisticFeaturesModal,
  FuturisticTab,
  recordPlayHistoryItem,
} from './components/FuturisticFeaturesModal';
import { LyricsKaraokeModal } from './components/LyricsKaraokeModal';
const MoviesView = React.lazy(() => import('./components/MoviesView').then((m) => ({ default: m.MoviesView })));
const SportsArenaView = React.lazy(() =>
  import('./components/SportsArenaView').then((m) => ({ default: m.SportsArenaView }))
);
const StudioCreateView = React.lazy(() =>
  import('./components/StudioCreateView').then((m) => ({ default: m.StudioCreateView }))
);
const SocialShortsAndLiveView = React.lazy(() =>
  import('./components/SocialShortsAndLiveView').then((m) => ({ default: m.SocialShortsAndLiveView }))
);
const CosmicSearchView = React.lazy(() =>
  import('./components/CosmicSearchView').then((m) => ({ default: m.CosmicSearchView }))
);
const OfflineTravelView = React.lazy(() =>
  import('./components/OfflineTravelView').then((m) => ({ default: m.OfflineTravelView }))
);
const CreatorChannelsView = React.lazy(() =>
  import('./components/CreatorChannelsView').then((m) => ({ default: m.CreatorChannelsView }))
);
import { LegalCharterModal } from './components/LegalCharterModal';
import { BassBoostLevel, MiniPlayer } from './components/MiniPlayer';
import { LegalTermsModal } from './components/LegalTermsModal';
import { MobileIosSearchModal } from './components/MobileIosSearchModal';
import { PlayerQueueStrip } from './components/PlayerQueueStrip';
import { PixModal } from './components/PixModal';
import { CommissionPanel } from './components/CommissionPanel';
import { ShareModal } from './components/ShareModal';
import { UploadTrackModal } from './components/UploadTrackModal';
import { initSentry } from './utils/sentry';
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
  triggerDirectFileDownload,
} from './utils/offlineCache';

const DEFAULT_SETTINGS: AppSettings = {
  artistName: 'MORRO GOLD',
  brandSubtitle: 'UNIVERSO LIVRE',
  tagline: 'Som Pesado · Clipes HD · Cinema & Séries · Futebol & UFC Ao Vivo — Sem Anúncios',
  pixKey: '41651191808',
  pixKeyConfigured: true,
  pixName: 'MORRO GOLD VIP',
  pixCity: 'CAMPO GRANDE',
  pixMessage: '100% gratuito e sem anúncios! Sua doação exclusiva via PIX (PicPay) ajuda na manutenção diária do app.',
  vipActive: false,
  vipPlan: null,
  vipUntil: null,
  mpAccessToken: '',
  sentryDsn: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  publicUrl: 'https://lenkyx-cosmic-phonk.onrender.com',
  apkDownloadUrl: '/download/apk',
  youtubeUrl: '',
  sunoHandle: '@lenkyx',
  sunoProfileUrl: 'https://suno.com/@lenkyx',
  dailyGoal: 10,
  totalGoal: 1000,
  affiliateMlTool: '61298625',
  affiliateMlWord: 'hera20240419111826',
  whatsappStoreNumber: '5567996785099',
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

/** Arrasta as janelas flutuantes (PiP minimizado) para qualquer lugar da tela. */
function useFloatingDrag() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const offset = useRef<{ dx: number; dy: number; w: number; h: number } | null>(null);
  const onPointerDown = (e: any) => {
    if ((e.target as HTMLElement).closest('button, input, a, select, textarea, video, iframe')) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    offset.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height };
    setPos({ x: r.left, y: r.top });
    try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
  };
  const onPointerMove = (e: any) => {
    const o = offset.current;
    if (!o) return;
    const x = Math.min(Math.max(4, e.clientX - o.dx), Math.max(4, window.innerWidth - o.w - 4));
    const y = Math.min(Math.max(4, e.clientY - o.dy), Math.max(4, window.innerHeight - o.h - 4));
    setPos({ x, y });
  };
  const onPointerUp = (e: any) => {
    if (!offset.current) return;
    offset.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ }
  };
  const style = pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto', touchAction: 'none' as const } : {};
  return { style, dragHandlers: { onPointerDown, onPointerMove, onPointerUp } };
}

export function App() {
  const reelDrag = useFloatingDrag();
  const movieDrag = useFloatingDrag();
  const clipDrag = useFloatingDrag();

  // === BARRINHA VERDE DE ATUALIZACAO (reinicia o site e abre atualizado) ===
  const [updPct, setUpdPct] = useState<number | null>(null);
  const updRunningRef = useRef(false);

  const runSiteUpdate = useCallback(() => {
    if (updRunningRef.current) return;
    updRunningRef.current = true;
    try { sessionStorage.setItem('mg_upd_v1', '1'); } catch { /* ok */ }
    setUpdPct(6);
    const t0 = Date.now();
    const iv = window.setInterval(() => {
      setUpdPct(Math.min(78, 6 + ((Date.now() - t0) / 2200) * 72));
    }, 90);
    void (async () => {
      try {
        const v = await fetch('/api/version?_=' + Date.now(), { cache: 'no-store' }).then((r) => r.json());
        if (v && v.js) await fetch('/assets/' + v.js, { cache: 'no-store' }).catch(() => {});
      } catch { /* ok */ }
      await new Promise((r) => setTimeout(r, 1500));
      window.clearInterval(iv);
      window.location.reload();
    })();
  }, []);

  // Conclui a atualizacao apos o reinicio e abre o site
  useEffect(() => {
    try {
      if (sessionStorage.getItem('mg_upd_v1') !== '1') return;
      sessionStorage.removeItem('mg_upd_v1');
    } catch { return; }
    setUpdPct(78);
    const t0 = Date.now();
    const iv = window.setInterval(() => {
      const p = Math.min(100, 78 + ((Date.now() - t0) / 1100) * 22);
      setUpdPct(p);
      if (p >= 100) {
        window.clearInterval(iv);
        window.setTimeout(() => setUpdPct(null), 450);
      }
    }, 80);
    return () => window.clearInterval(iv);
  }, []);

  // Detecta atualizacao nova no servidor (reinicia sozinho com a barrinha verde)
  useEffect(() => {
    const myName = (Array.from(document.scripts).map((s) => s.src || '').find((s) => s.indexOf('assets/index-') >= 0) || '').split('/').pop() || '';
    if (!myName) return;
    let stopped = false;
    const check = async () => {
      if (stopped || document.hidden || updRunningRef.current) return;
      try {
        const v = await fetch('/api/version?_=' + Date.now(), { cache: 'no-store' }).then((r) => r.json());
        if (!stopped && v && v.js && v.js !== myName) runSiteUpdate();
      } catch { /* ok */ }
    };
    const iv = window.setInterval(() => void check(), 60000);
    const onVis = () => { if (!document.hidden) void check(); };
    document.addEventListener('visibilitychange', onVis);
    const tm = window.setTimeout(() => void check(), 7000);
    return () => { stopped = true; window.clearInterval(iv); window.clearTimeout(tm); document.removeEventListener('visibilitychange', onVis); };
  }, [runSiteUpdate]);

  const [catRowOpen, setCatRowOpen] = useState(false);

  // ===== MODO TV (Smart TV / navegador de TV) — estável e legível como o YouTube =====
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ua = navigator.userAgent || '';
      const uaTv = /SmartTV|TV|Tizen|WebOS|BRAVIA|AFT|CrKey|HbbTV|NetCast|Viera/i.test(ua);
      const wantTv = params.has('tvMode') || params.has('tv') || uaTv || localStorage.getItem('morro_gold_tv_v1') === '1';
      if (wantTv) {
        document.documentElement.classList.add('mg-tv');
        localStorage.setItem('morro_gold_tv_v1', '1');
      }
    } catch {
      // ok
    }
  }, []);

  // Botão "voltar" do celular NÃO fecha o app: mantém a música tocando e volta ao início
  useEffect(() => {
    const pushGuard = () => {
      try {
        window.history.pushState({ mgAppGuard: true }, '');
      } catch {
        // ok
      }
    };
    pushGuard();
    const onPopState = () => {
      pushGuard();
      try {
        const main = document.getElementById('lenkyx-main-scroll');
        if (main) main.scrollTop = 0;
      } catch {
        // ok
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
    totalVisits: 120,
    totalShares: 18,
    popularityScore: 480,
    popularityLevel: 'Em Alta',
  });
  const liveSessionIdRef = useRef<string>(getOrCreateSessionId());

  // Instant 2-Second PWA Install & Official Site PC/TV/Mobile Download Modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installPlatformTab, setInstallPlatformTab] = useState<'pc' | 'mobile' | 'tv'>(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/SmartTV|Tizen|Web0S|WebOS|BRAVIA|Android TV|GoogleTV|AFT|Roku|CrKey/i.test(ua)) return 'tv';
      if (/Android|iPhone|iPad|iPod|Mobile|HarmonyOS|EMUI|MIUI/i.test(ua)) return 'mobile';
    }
    return 'pc';
  });
  const isInAppWebView =
    typeof navigator !== 'undefined' &&
    /FBAN|FBAV|Instagram|WhatsApp|Line|TikTok|Snapchat/i.test(navigator.userAgent || '');
  const isAndroidDevice =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

  const [isAppInstalledOnDevice, setIsAppInstalledOnDevice] = useState<boolean>(() => {
    if (isAndroidApk()) return true;
    if (typeof window === 'undefined') return false;
    const standalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    let markedInstalled = false;
    try {
      markedInstalled = localStorage.getItem('lenkyx_app_installed_v1') === '1';
    } catch {
      // ignore
    }
    return Boolean(standalone || markedInstalled);
  });
  const [quickDownloadDismissed, setQuickDownloadDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsAppInstalledOnDevice(true);
      setDeferredInstallPrompt(null);
      setInstallModalOpen(false);
      try {
        localStorage.setItem('lenkyx_app_installed_v1', '1');
      } catch {
        // ignore
      }
      showToast('✅ App instalado no seu aparelho!');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('install') === '1' && !isAndroidApk()) {
        setInstallModalOpen(true);
      }
    } catch {
      // ignore
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstantInstall = useCallback(async () => {
    if (deferredInstallPrompt) {
      try {
        await deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsAppInstalledOnDevice(true);
          try {
            localStorage.setItem('lenkyx_app_installed_v1', '1');
          } catch {
            // ignore
          }
          showToast('MORRO GOLD instalado em 1 clique! 🚀');
          setDeferredInstallPrompt(null);
          setInstallModalOpen(false);
          return;
        }
      } catch {
        // fallback below
      }
    }
    const ua = navigator.userAgent || '';
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const isTv = /SmartTV|TV|Tizen|WebOS|BRAVIA|AFT|CrKey/i.test(ua);
    // Desktop/PC 1-click direct app download (no extra clicks, no shortcuts!)
    if (!isMobile && !isTv) {
      const a = document.createElement('a');
      a.href = '/download/pc';
      a.download = 'MORRO-GOLD-App-PC.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('💻 Baixando o App MORRO GOLD original em 1 clique!');
      return;
    }
    setInstallModalOpen(true);
  }, [deferredInstallPrompt]);

  // 1-Click PC Download / Install (Edge/Chrome desktop PWA install OR direct 1-click PC app)
  const handleOneClickPcDownload = useCallback(async () => {
    if (deferredInstallPrompt) {
      try {
        await deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          showToast('💻 MORRO GOLD instalado no seu PC com 1 clique!');
          setDeferredInstallPrompt(null);
          setInstallModalOpen(false);
          return;
        }
      } catch {
        // fall through to direct app download
      }
    }
    const a = document.createElement('a');
    a.href = '/download/pc';
    a.download = 'MORRO-GOLD-App-PC.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('💻 Download do App MORRO GOLD para PC iniciado em 1 clique!');
  }, [deferredInstallPrompt]);

  // Clean Edge-3D Opening Splash + Cool Startup Chime on Launch
  const [showEntrySplash, setShowEntrySplash] = useState(true);
  const [entrySplashExiting, setEntrySplashExiting] = useState(false);

  // MORRO GOLD 24K — Modo Claro / Modo Escuro (persistido) com botão na barra de menus
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('morro_gold_theme_v1') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    try {
      localStorage.setItem('morro_gold_theme_v1', themeMode);
    } catch {
      // ignore
    }
  }, [themeMode]);

  useEffect(() => {
    // Introdução sem barra de rolagem na lateral
    if (showEntrySplash) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showEntrySplash]);

  // v62: Futuristic Robot HUD Features (Shazam, Jam, Wrapped, YouTubers & Sponsors) + Autoplay + Crossfade
  const [futuristicModalOpen, setFuturisticModalOpen] = useState(false);
  const [futuristicTab, setFuturisticTab] = useState<FuturisticTab>('shazam');
  const [initialJamCode, setInitialJamCode] = useState('');
  const [shortsTriggerQuery, setShortsTriggerQuery] = useState('');
  const [shortsTriggerNonce, setShortsTriggerNonce] = useState(0);
  const [autoplayInfinite] = useState(true);

  const openFuturisticFeature = useCallback((t: FuturisticTab) => {
    setFuturisticTab(t);
    setFuturisticModalOpen(true);
  }, []);

  useEffect(() => {
    try {
      const jam = new URLSearchParams(window.location.search).get('jam');
      if (jam && jam.trim()) {
        setInitialJamCode(jam.trim().toUpperCase());
        setFuturisticTab('jam');
        setFuturisticModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const dismissEntrySplash = useCallback((withSound = true) => {
    // Intro SEM som — apenas o logo
    setEntrySplashExiting(true);
    window.setTimeout(() => setShowEntrySplash(false), 320);
  }, []);

  // Sai da intro -> o beat da abertura sai com fade (a musica do app assume)
  useEffect(() => {
    if (!showEntrySplash) {
      stopLenkyxStartupSound(700);
    }
  }, [showEntrySplash]);

  useEffect(() => {
    // Abertura SEM som: so o logo 24k por 5 segundos.
    const autoClose = window.setTimeout(() => {
      setEntrySplashExiting(true);
      window.setTimeout(() => setShowEntrySplash(false), 320);
    }, 5000);
    return () => {
      window.clearTimeout(autoClose);
    };
  }, []);

  // Bass Boost + Live Audio Effects + Loud Mode ("Som Alto") Web Audio DSP nodes
  const [bassBoostLevel, setBassBoostLevel] = useState<BassBoostLevel>(0);
  const [audioEffect, setAudioEffect] = useState<AudioEffectId>('normal');
  const [loudMode, setLoudMode] = useState<boolean>(false);
  const bassBoostRef = useRef<BassBoostLevel>(0);
  const audioEffectRef = useRef<AudioEffectId>('normal');
  const loudModeRef = useRef<boolean>(false);
  useEffect(() => {
    bassBoostRef.current = bassBoostLevel;
  }, [bassBoostLevel]);
  useEffect(() => {
    audioEffectRef.current = audioEffect;
  }, [audioEffect]);
  useEffect(() => {
    loudModeRef.current = loudMode;
  }, [loudMode]);

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
  const bassPresenceRef = useRef<BiquadFilterNode | null>(null);
  const bassHighShelfRef = useRef<BiquadFilterNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const bassGainRef = useRef<GainNode | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const nextBackupUrlRef = useRef<string>('');
  const nextBackupTrackIdRef = useRef<string>('');
  const [visualizerOpen, setVisualizerOpen] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ label: string; pct: number; mb: number } | null>(null);

  const navigateTab = useCallback((next: TabId) => {
    setMoreSheetOpen(false);
    setActiveTab((prev) => {
      if (prev === next) return prev;
      setTabHistory((h) => [...h.slice(-15), prev]);
      return next;
    });
    if (['reels', 'movies', 'sports', 'studio', 'search'].includes(next)) {
      setMusicMenuOpen(false);
    }
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
  const [mobileIosSearchOpen, setMobileIosSearchOpen] = useState(false);

  // Worldwide Auto-Language & Geo-Region Engine (100+ Languages)
  const [userLang, setUserLang] = useState<string>(() => detectVisitorLanguage());
  const [detectedCountry, setDetectedCountry] = useState<string>('');
  const [langModalOpen, setLangModalOpen] = useState(false);

  // Universal Music-While-Gaming Mode (Mobile, PC, Consoles & PiP Floating HUD)
  const [gamingModeEnabled, setGamingModeEnabled] = useState<boolean>(() => isGamingModeStored());
  const [fpsBoostEnabled, setFpsBoostEnabled] = useState<boolean>(() => isGamingFpsBoostStored());
  const [gamingModalOpen, setGamingModalOpen] = useState(false);
  const [gamingPipOpen, setGamingPipOpen] = useState(false);
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
    setSize?: (width: number, height: number) => void;
  } | null>(null);
  const ytPendingVideoRef = useRef<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [musicMenuOpen, setMusicMenuOpen] = useState(false);
  const [mediaPlayerMenuOpen, setMediaPlayerMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [topOverflowOpen, setTopOverflowOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reelsAction, setReelsAction] = useState<'shorts' | 'create_reel' | 'go_live'>('shorts');
  const [reelsActionNonce, setReelsActionNonce] = useState(0);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState<{ id: string; title?: string }>({ id: 'global' });
  const [commentTarget, setCommentTarget] = useState<{
    id: string;
    title: string;
    youtubeId?: string;
  } | null>(null);
  const openLiveChat = useCallback((roomId = 'global', roomTitle?: string) => {
    setChatRoom({ id: roomId, title: roomTitle });
    setChatModalOpen(true);
  }, []);
  const openCommentTarget = useCallback((id: string, title: string, youtubeId?: string) => {
    setCommentTarget({ id, title, youtubeId });
  }, []);
  const [clipLeftOverlayOpen, setClipLeftOverlayOpen] = useState(false);
  const clipLeftTimerRef = useRef<number | null>(null);
  const revealClipLeftOverlay = useCallback(() => {
    setClipLeftOverlayOpen(true);
    if (clipLeftTimerRef.current !== null) window.clearTimeout(clipLeftTimerRef.current);
    clipLeftTimerRef.current = window.setTimeout(() => {
      setClipLeftOverlayOpen(false);
    }, 4500);
  }, []);
  const [sleepEndAt, setSleepEndAt] = useState<number | null>(null);
  const [sleepMinutesLeft, setSleepMinutesLeft] = useState<number | null>(null);
  const [activeVersion, setActiveVersion] = useState<AudioVersion>('v1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState(true);
  const backgroundModeRef = useRef<boolean>(true);
  const userPausedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const bgBackupUrlRef = useRef<string>('');
  const bgHandoffActiveRef = useRef<boolean>(false);
  useEffect(() => {
    backgroundModeRef.current = backgroundMode;
    setMobileBackgroundKeepalive(isPlaying && backgroundMode && !userPausedRef.current);
  }, [backgroundMode, isPlaying]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    if (!sleepEndAt) {
      setSleepMinutesLeft(null);
      return;
    }
    const tick = () => {
      const remMs = sleepEndAt - Date.now();
      if (remMs <= 0) {
        setSleepEndAt(null);
        setSleepMinutesLeft(null);
        userPausedRef.current = true;
        audioRef.current?.pause();
        ytPlayerRef.current?.pauseVideo?.();
        setIsPlaying(false);
        setMobileBackgroundKeepalive(false);
        return;
      }
      setSleepMinutesLeft(Math.max(1, Math.ceil(remMs / 60000)));
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [sleepEndAt]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.88);
  const [muted, setMuted] = useState(false);

  const [playQueue, setPlayQueue] = useState<Track[]>([]);
  const playQueueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const playSeqRef = useRef(0);
  const directAudioRawUrlRef = useRef('');
  const audioProxyRetriedRef = useRef(false);
  const ytStallTimerRef = useRef<number | null>(null);
  const lastTrackStartTsRef = useRef(0);
  const autoSkipCountRef = useRef(0);
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

  useEffect(() => {
    setMediaWakeLock(Boolean((isPlaying && backgroundMode) || watchingMovie));
  }, [isPlaying, backgroundMode, watchingMovie]);

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
  const [pixInitialTab, setPixInitialTab] = useState<'vip' | 'donate' | 'ranking' | 'config'>('donate');
  // Painel PRIVADO de comissões do dono (somente Modo Criador)
  const [commissionPanelOpen, setCommissionPanelOpen] = useState(false);

  // Retorno do checkout Mercado Pago: confirma o pagamento e ativa o VIP sozinho
  useEffect(() => {
    if (!/[?&]vipReturn=1/.test(window.location.search)) return;
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch {
      /* ignore */
    }
    let ref = 'guest';
    try {
      ref = localStorage.getItem('mg_device_id') || 'guest';
    } catch {
      /* ignore */
    }
    let tries = 0;
    const check = async () => {
      tries++;
      try {
        const r = await fetch(`/api/payments/vip-status?ref=${encodeURIComponent(ref)}`);
        const d = await r.json();
        if (d?.active) {
          await handleSaveSettings({
            vipActive: true,
            vipPlan: d.plan === 'anual' ? 'anual' : 'mensal',
            vipUntil: d.until,
          });
          showToast('👑 PAGAMENTO CONFIRMADO! Seu VIP MORRO GOLD está ativo!');
          return;
        }
      } catch {
        /* ignore */
      }
      if (tries < 8) window.setTimeout(() => void check(), 2500);
      else showToast('Pagamento em processamento — o VIP ativa sozinho em instantes.');
    };
    window.setTimeout(() => void check(), 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Sentry: monitor de erros ativa quando o DSN existe (config do criador)
  useEffect(() => {
    try {
      if (settings.sentryDsn) initSentry(settings.sentryDsn);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.sentryDsn]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTrack, setShareTrack] = useState<Track | null>(null);
  const [clipTheaterOpen, setClipTheaterOpen] = useState(false);
  const [clipMinimized, setClipMinimized] = useState(false);
  const [clipMoreOpen, setClipMoreOpen] = useState(false);
  const [shopInitialCategory, setShopInitialCategory] = useState<ShopCategory | undefined>(undefined);
  const [shopCategoryNonce, setShopCategoryNonce] = useState(0);
  const [minimizedReel, setMinimizedReel] = useState<{
    id: string;
    title: string;
    creatorName: string;
    youtubeVideoId?: string;
    videoUrl?: string;
  } | null>(null);
  const [minimizedMovie, setMinimizedMovie] = useState<MovieItem | null>(null);
  const [hiddenTrackIds, setHiddenTrackIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('morro_gold_hidden_tracks_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [customTrackCovers, setCustomTrackCovers] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('morro_gold_track_covers_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [albumCoverOverride, setAlbumCoverOverride] = useState<string>(() => {
    try {
      return localStorage.getItem('morro_gold_album_cover_v1') || '';
    } catch {
      return '';
    }
  });
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

  // === CLIP THEATER: proporção automática + menus que somem ao tocar ===
  const clipAspect = useVideoAspect('auto');
  const clipStageBoxRef = useRef<HTMLDivElement | null>(null);
  const clipFitted = useFittedSize(clipStageBoxRef, clipAspect.ratio);
  const clipChrome = useAutoHideChrome({
    enabled: clipTheaterOpen && !clipMinimized && clipFitMode !== 'compact',
    delayMs: 3600,
  });

  // Ao abrir o clipe os menus já aparecem escondidos (like YouTube)
  useEffect(() => {
    if (clipTheaterOpen && !clipMinimized) clipChrome.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipTheaterOpen, clipMinimized]);

  // Mantém o player do YouTube exatamente no tamanho do quadro (sem tarjas)
  useEffect(() => {
    if (!clipFitted.width || !clipFitted.height) return;
    try {
      ytPlayerRef.current?.setSize?.(clipFitted.width, clipFitted.height);
    } catch {
      /* ignore */
    }
  }, [clipFitted.width, clipFitted.height]);

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
  const [charterOpen, setCharterOpen] = useState(false);
  const [charterTab, setCharterTab] = useState<'charter' | 'youtube' | 'report'>('charter');
  const [charterTarget, setCharterTarget] = useState('');
  const [appUpdateInfo, setAppUpdateInfo] = useState<{
    latestVersionName: string;
    apkUrl: string;
    releaseNotes: string;
  } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [lyricsTrack, setLyricsTrack] = useState<Track | null>(null);
  const [subscribedChannelsList, setSubscribedChannelsList] = useState<string[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeYtChip, setActiveYtChip] = useState<string>('tudo');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void fetchChannelSubscriptions(getClientSubscriberId()).then((res) => {
      if (Array.isArray(res?.subscribed)) {
        setSubscribedChannelsList(res.subscribed);
      }
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const handleVoiceSearch = useCallback(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!SR) {
      openFuturisticFeature('shazam');
      return;
    }
    try {
      const rec = new SR();
      rec.lang = 'pt-BR';
      rec.interimResults = false;
      showToast('🎙️ Fala aí, cria! Pode dizer o nome da música ou artista...');
      rec.onresult = (ev: any) => {
        const spoken = String(ev?.results?.[0]?.[0]?.transcript || '').trim();
        if (spoken) {
          setGlobalSearch(spoken);
          setWorldTriggerQuery(spoken);
          setWorldSearchNonce((n) => n + 1);
          navigateTab('explore');
          showToast(`🔎 Buscando "${spoken}"!`);
        }
      };
      rec.onerror = () => openFuturisticFeature('shazam');
      rec.start();
    } catch {
      openFuturisticFeature('shazam');
    }
  }, [navigateTab, openFuturisticFeature, showToast]);

  // Fast Automatic Platform Update Listener + Manual 1-Click Update
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  const handleForceAppUpdate = useCallback(async () => {
    if (updatingApp) return;
    setUpdatingApp(true);
    showToast('⚡ Verificando e aplicando atualização...');
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
        for (const reg of regs) {
          reg.active?.postMessage({ type: 'CLEAR_ALL_CACHES' });
          await reg.update().catch(() => {});
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys().catch(() => []);
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      const res = await authFetch(`/api/state?t=${Date.now()}`);
      if (res.ok) {
        const fresh = await res.json();
        if (Array.isArray(fresh?.tracks) && fresh.tracks.length > 0) {
          setTracks(fresh.tracks);
        }
        if (fresh?.settings) {
          setSettings((prev) => ({ ...prev, ...fresh.settings }));
        }
      }
      showToast('✅ Plataforma atualizada na versão mais recente!');
    } catch {
      showToast('Catálogo sincronizado!');
    } finally {
      setUpdatingApp(false);
    }
  }, [updatingApp, showToast]);

  // Background Service Worker Update Check on Entry (Instant open — no intro screen)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then(async (reg) => {
          if (!reg) return;
          await reg.update().catch(() => {});
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch(() => {});
    }
  }, []);

  // Global Auto-Region & Multi-Language Translator Lifecycle
  useEffect(() => {
    const stopTranslator = startAutoDomTranslator(userLang);
    return () => stopTranslator();
  }, [userLang]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/geo-locale')
      .then((r) => (r.ok ? r.json() : null))
      .then((geo) => {
        if (cancelled || !geo) return;
        if (geo.country) setDetectedCountry(String(geo.country));
        if (!hasManualLanguageOverride() && geo.lang) {
          const detected = saveUserLanguage(String(geo.lang), false);
          setUserLang(detected);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Gaming Mode & FPS Boost Lifecycle
  useEffect(() => {
    setGamingModeActive(gamingModeEnabled);
  }, [gamingModeEnabled]);

  useEffect(() => {
    applyGamingFpsBoostClass(fpsBoostEnabled);
  }, [fpsBoostEnabled]);

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

  const visibleTracks = useMemo(() => {
    const hiddenSet = new Set(hiddenTrackIds);
    return tracks
      .filter((t) => !hiddenSet.has(t.id))
      .map((t) => ({
        ...t,
        coverUrl: customTrackCovers[t.id] || albumCoverOverride || t.coverUrl,
      }));
  }, [tracks, hiddenTrackIds, customTrackCovers, albumCoverOverride]);

  const allTracksPool = useMemo(() => {
    const hiddenSet = new Set(hiddenTrackIds);
    const map = new Map<string, Track>();
    visibleTracks.forEach((t) => map.set(t.id, t));
    userTracks
      .filter((t) => !hiddenSet.has(t.id))
      .forEach((t) =>
        map.set(t.id, {
          ...t,
          coverUrl: customTrackCovers[t.id] || albumCoverOverride || t.coverUrl,
        })
      );
    worldCacheTracks.forEach((t) => {
      if (!hiddenSet.has(t.id) && !map.has(t.id)) map.set(t.id, t);
    });
    playlists.forEach((pl) => {
      if (pl.savedExternalTracks) {
        Object.values(pl.savedExternalTracks).forEach((t) => {
          if (!hiddenSet.has(t.id) && !map.has(t.id)) map.set(t.id, t);
        });
      }
    });
    return Array.from(map.values());
  }, [visibleTracks, userTracks, worldCacheTracks, playlists, hiddenTrackIds, customTrackCovers, albumCoverOverride]);

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
          const rawApk = (data!.settings?.apkDownloadUrl || '').trim();
          const safeApk = rawApk && !rawApk.includes('1SsBXDSKNWQxsPqURWWavVhcjvYUJgRFI') ? rawApk : '/download/apk';
          setSettings((prev) => ({
            ...prev,
            ...data!.settings,
            pixKey: '41651191808',
            pixKeyConfigured: true,
            apkDownloadUrl: safeApk,
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

  // Setup persistent global <audio> element with anti-freeze & automatic stream recovery
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    let lastAudioSec = -1;
    let stallTimer: number | null = null;
    const clearStallTimer = () => {
      if (stallTimer !== null) {
        window.clearTimeout(stallTimer);
        stallTimer = null;
      }
    };

    const onTime = () => {
      clearStallTimer();
      const sec = Math.floor(audio.currentTime || 0);
      if (sec !== lastAudioSec) {
        lastAudioSec = sec;
        setCurrentTime(audio.currentTime || 0);
      }
    };
    const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => {
      clearStallTimer();
      setIsPlaying(true);
      isPlayingRef.current = true;
    };
    const onPlaying = () => {
      clearStallTimer();
      autoSkipCountRef.current = 0;
      setIsPlaying(true);
      isPlayingRef.current = true;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onPause = () => {
      clearStallTimer();
      if (document.hidden && !userPausedRef.current && backgroundModeRef.current && audio.src && !audio.ended) {
        window.setTimeout(() => {
          if (!userPausedRef.current && backgroundModeRef.current && audio.paused && audio.src) {
            void bassAudioCtxRef.current?.resume().catch(() => {});
            void audio.play().catch(() => {});
          }
        }, 120);
        return;
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
    };

    const recoverOrAdvance = (reason: 'error' | 'stalled') => {
      clearStallTimer();
      if (userPausedRef.current) return;
      // Ignore residual <audio> errors when audio has no active src or when YouTube is actively playing this track!
      const activeSrc = audio.getAttribute('src') || '';
      if (!activeSrc) return;
      const curTrack = currentTrackRef.current;
      if (curTrack?.youtubeVideoId && !bgHandoffActiveRef.current) return;

      const rawUrl = directAudioRawUrlRef.current;
      // 1st automatic recovery: if direct HTTPS stream failed/stalled, retry once via streaming /api/audio-proxy
      if (
        !audioProxyRetriedRef.current &&
        rawUrl &&
        rawUrl.startsWith('https://') &&
        !audio.src.includes('/api/audio-proxy')
      ) {
        audioProxyRetriedRef.current = true;
        audio.removeAttribute('crossorigin');
        audio.src = `/api/audio-proxy?url=${encodeURIComponent(rawUrl)}`;
        audio.load();
        void audio.play().catch(() => {});
        return;
      }
      // 2nd automatic recovery: resolve clean backup audio for this SAME track (do NOT blindly jump tracks)
      const cur = currentTrackRef.current;
      if (cur && !audioProxyRetriedRef.current && cur.title) {
        audioProxyRetriedRef.current = true;
        void prefetchVideoAudioBackup(cur.title, cur.artist || '').then((backup) => {
          if (backup && currentTrackRef.current?.id === cur.id && !userPausedRef.current) {
            audio.removeAttribute('crossorigin');
            audio.src = backup;
            audio.load();
            void audio.play().catch(() => {});
            return;
          }
          if (reason === 'error' && autoSkipCountRef.current < 1) {
            const list = playQueueRef.current.length ? playQueueRef.current : [];
            if (list.length > 1 && handlePlayTrackRef.current) {
              const idx = list.findIndex((t) => t.id === cur.id);
              const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
              if (next && next.id !== cur.id) {
                autoSkipCountRef.current += 1;
                showToast('Fonte indisponível — pulando para a próxima...');
                void handlePlayTrackRef.current(next, 'v1', list);
              }
            }
          }
        });
        return;
      }
      if (reason === 'error' && cur && autoSkipCountRef.current < 1) {
        const list = playQueueRef.current;
        if (list.length > 1 && handlePlayTrackRef.current) {
          const idx = list.findIndex((t) => t.id === cur.id);
          const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
          if (next && next.id !== cur.id) {
            autoSkipCountRef.current += 1;
            showToast('Áudio instável — avançando para a próxima...');
            void handlePlayTrackRef.current(next, 'v1', list);
          }
        }
      }
    };

    const armStallWatchdog = () => {
      if (userPausedRef.current || !audio.getAttribute('src') || audio.paused) return;
      if (currentTrackRef.current?.youtubeVideoId && !bgHandoffActiveRef.current) return;
      if (stallTimer !== null) return;
      stallTimer = window.setTimeout(() => {
        stallTimer = null;
        if (!userPausedRef.current && audio.getAttribute('src') && !audio.paused && audio.readyState < 3) {
          recoverOrAdvance('stalled');
        }
      }, 15000);
    };

    const onError = () => recoverOrAdvance('error');

    const onEnded = () => {
      clearStallTimer();
      if (userPausedRef.current) return;
      // Ignore <audio> ended if YouTube is the active engine for this track or track started < 3s ago
      if (currentTrackRef.current?.youtubeVideoId && !bgHandoffActiveRef.current) return;
      if (Date.now() - lastTrackStartTsRef.current < 3000) return;

      if (loopTrackRef.current) {
        audio.currentTime = 0;
        void audio.play().catch(() => {});
        return;
      }
      const list = playQueueRef.current.length ? playQueueRef.current : [];
      const cur = currentTrackRef.current;
      if (!cur || list.length === 0) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        return;
      }
      const idx = list.findIndex((t) => t.id === cur.id);
      const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
      if (!next) return;

      // When screen is locked / backgrounded, reuse the SAME active <audio> element seamlessly so OS never revokes lock-screen focus!
      if (document.hidden && backgroundModeRef.current) {
        void (async () => {
          setMobileBackgroundKeepalive(true);
          let nextUrl =
            next.audioUrl ||
            (nextBackupTrackIdRef.current === next.id ? nextBackupUrlRef.current : '');
          if (!nextUrl) {
            try {
              const res = await resolvePlayableAudioUrl(next, 'v1');
              nextUrl = res.url || '';
            } catch {
              // fallback below
            }
          }
          if (!nextUrl) {
            nextUrl = await prefetchVideoAudioBackup(next.title, next.artist || '');
          }
          if (nextUrl && audioRef.current) {
            const proxied =
              nextUrl.startsWith('https://') &&
              !nextUrl.includes('suno.ai') &&
              !nextUrl.includes('audius')
                ? `/api/audio-proxy?url=${encodeURIComponent(nextUrl)}`
                : nextUrl;
            bgHandoffActiveRef.current = true;
            directAudioRawUrlRef.current = nextUrl;
            setCurrentTrack(next);
            currentTrackRef.current = next;
            audio.removeAttribute('crossorigin');
            audio.src = proxied;
            audio.load();
            void audio.play().catch(() => {});
            setIsPlaying(true);
            isPlayingRef.current = true;
            syncBackgroundMediaSession({
              title: next.title,
              artist: next.artist || 'MORRO GOLD',
              album: next.album || 'Favela VIP',
              artworkUrl: next.coverUrl,
              isPlaying: true,
            });
            // Pre-fetch the following track too!
            const afterNext = list[(idx + 2) % list.length];
            if (afterNext && !afterNext.audioUrl && afterNext.title) {
              void prefetchVideoAudioBackup(afterNext.title, afterNext.artist || '').then((u) => {
                if (u) {
                  nextBackupTrackIdRef.current = afterNext.id;
                  nextBackupUrlRef.current = u;
                }
              });
            }
            return;
          }
          if (handlePlayTrackRef.current) {
            void handlePlayTrackRef.current(next, 'v1', list);
          }
        })();
        return;
      }

      if (handlePlayTrackRef.current) {
        void handlePlayTrackRef.current(next, 'v1', list);
      }
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('stalled', armStallWatchdog);
    audio.addEventListener('waiting', armStallWatchdog);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    return () => {
      clearStallTimer();
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('stalled', armStallWatchdog);
      audio.removeEventListener('waiting', armStallWatchdog);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
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
            if (!currentTrackRef.current?.youtubeVideoId || bgHandoffActiveRef.current) return;
            const cur = currentTrackRef.current;
            // Try direct audio fallback first before skipping the song
            const fallbackUrl = bgBackupUrlRef.current;
            if (fallbackUrl && audioRef.current && !bgHandoffActiveRef.current) {
              bgHandoffActiveRef.current = true;
              directAudioRawUrlRef.current = fallbackUrl;
              const el = audioRef.current;
              el.removeAttribute('crossorigin');
              el.src = fallbackUrl;
              el.volume = muted ? 0 : volume;
              el.muted = muted;
              el.playbackRate = playbackSpeed;
              el.load();
              void el.play().catch(() => {});
              showToast('🎵 Tocando versão áudio direta!');
              return;
            }
            if (autoSkipCountRef.current >= 1) {
              setIsPlaying(false);
              isPlayingRef.current = false;
              showToast('Este clipe bloqueou player embutido — escolha outra faixa ou toque em Próxima.');
              return;
            }
            autoSkipCountRef.current += 1;
            showToast('Este clipe bloqueou player embutido — pulando para o próximo...');
            const list = playQueueRef.current.length ? playQueueRef.current : tracks;
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
              bgHandoffActiveRef.current = false;
              autoSkipCountRef.current = 0;
              setIsPlaying(true);
              isPlayingRef.current = true;
              const dur = ytPlayerRef.current?.getDuration?.() || 0;
              if (dur > 0) setDuration(dur);
              if (clipQualityRef.current !== 'default') {
                ytPlayerRef.current?.setPlaybackQuality?.(clipQualityRef.current);
              }
            } else if (ev.data === 2) {
              if (document.hidden && !userPausedRef.current && backgroundModeRef.current && !bgHandoffActiveRef.current) {
                // Browser/OS paused video on screen lock or minimize — try keeping video alive first, then handoff to audio!
                ytPlayerRef.current?.playVideo?.();
                void bassAudioCtxRef.current?.resume().catch(() => {});
                window.setTimeout(() => {
                  if (
                    document.hidden &&
                    !userPausedRef.current &&
                    backgroundModeRef.current &&
                    ytPlayerRef.current?.getPlayerState?.() !== 1
                  ) {
                    const backupUrl = bgBackupUrlRef.current;
                    const audio = audioRef.current;
                    if (backupUrl && audio && currentTrackRef.current?.youtubeVideoId) {
                      bgHandoffActiveRef.current = true;
                      const ct = ytPlayerRef.current?.getCurrentTime?.() || 0;
                      const proxied = backupUrl.startsWith('https://')
                        ? `/api/audio-proxy?url=${encodeURIComponent(backupUrl)}`
                        : backupUrl;
                      audio.src = proxied;
                      audio.volume = volume;
                      audio.muted = muted;
                      audio.playbackRate = playbackSpeed;
                      audio.loop = loopTrackRef.current;
                      audio.load();
                      if (ct > 1 && ct < 180) {
                        audio.addEventListener(
                          'loadedmetadata',
                          () => {
                            try {
                              if (Number.isFinite(audio.duration) && ct < audio.duration - 2) {
                                audio.currentTime = ct;
                              }
                            } catch {
                              // ignore
                            }
                          },
                          { once: true }
                        );
                      }
                      void audio.play().catch(() => {});
                      setIsPlaying(true);
                      isPlayingRef.current = true;
                    }
                  }
                }, 480);
                return;
              }
              if (!bgHandoffActiveRef.current) {
                setIsPlaying(false);
                isPlayingRef.current = false;
              }
            } else if (ev.data === 0) {
              // Ignore spurious ENDED events during audio handoff or right after switching tracks!
              if (bgHandoffActiveRef.current) return;
              if (Date.now() - lastTrackStartTsRef.current < 4000) return;
              const ytDur = ytPlayerRef.current?.getDuration?.() || 0;
              const ytCt = ytPlayerRef.current?.getCurrentTime?.() || 0;
              if (ytDur > 15 && ytCt > 0 && ytCt < ytDur - 5) return;

              if (loopTrackRef.current) {
                ytPlayerRef.current?.seekTo?.(0, true);
                ytPlayerRef.current?.playVideo?.();
                return;
              }
              setIsPlaying(false);
              isPlayingRef.current = false;
              const list = playQueueRef.current;
              const cur = currentTrackRef.current;
              if (cur && list.length > 1) {
                const idx = list.findIndex((t) => t.id === cur.id);
                const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
                if (!next || next.id === cur.id) return;
                if (document.hidden && backgroundModeRef.current && audioRef.current) {
                  void (async () => {
                    setMobileBackgroundKeepalive(true);
                    let nextUrl =
                      next.audioUrl ||
                      (nextBackupTrackIdRef.current === next.id ? nextBackupUrlRef.current : '');
                    if (!nextUrl) {
                      nextUrl = await prefetchVideoAudioBackup(next.title, next.artist || '');
                    }
                    if (nextUrl && audioRef.current) {
                      const proxied =
                        nextUrl.startsWith('https://') &&
                        !nextUrl.includes('suno.ai') &&
                        !nextUrl.includes('audius')
                          ? `/api/audio-proxy?url=${encodeURIComponent(nextUrl)}`
                          : nextUrl;
                      bgHandoffActiveRef.current = true;
                      directAudioRawUrlRef.current = nextUrl;
                      setCurrentTrack(next);
                      currentTrackRef.current = next;
                      const el = audioRef.current;
                      el.removeAttribute('crossorigin');
                      el.src = proxied;
                      el.load();
                      void el.play().catch(() => {});
                      setIsPlaying(true);
                      isPlayingRef.current = true;
                      syncBackgroundMediaSession({
                        title: next.title,
                        artist: next.artist || 'MORRO GOLD',
                        album: next.album || 'Favela VIP',
                        artworkUrl: next.coverUrl,
                        isPlaying: true,
                      });
                      return;
                    }
                    if (handlePlayTrackRef.current) {
                      void handlePlayTrackRef.current(next, 'v1', list);
                    }
                  })();
                  return;
                }
                if (handlePlayTrackRef.current) {
                  void handlePlayTrack(next, 'v1', list);
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
    userPausedRef.current = true;
    audioRef.current?.pause();
    ytPlayerRef.current?.pauseVideo?.();
  }, []);

  useEffect(() => {
    return registerMediaStopper('catalog', pauseCatalogPlayer);
  }, [pauseCatalogPlayer]);

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

  // Apply Web Audio DSP Chain: Bass Boost + Live Effects (3D Baile, Estúdio HD, Pancadão, Noite VIP) + Som Alto (Turbo Limiter)
  const applyBassBoostGain = useCallback(
    (level: BassBoostLevel, effOverride?: AudioEffectId, loudOverride?: boolean) => {
      const activeEffect = effOverride ?? audioEffectRef.current;
      const activeLoud = loudOverride ?? loudModeRef.current;
      const audio = audioRef.current;
      const dspActive = level > 0 || activeEffect !== 'normal' || activeLoud;

      if (audio && (!currentTrackRef.current?.youtubeVideoId || Boolean(currentTrackRef.current?.audioUrl) || bgHandoffActiveRef.current)) {
        const curSrc = audio.currentSrc || audio.src || '';
        const isSafeForWebAudio =
          Boolean(curSrc) &&
          (curSrc.startsWith('blob:') ||
            curSrc.startsWith('data:') ||
            curSrc.startsWith(window.location.origin) ||
            curSrc.startsWith('/') ||
            audio.crossOrigin === 'anonymous');

        if (isSafeForWebAudio && !bassAudioCtxRef.current) {
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
              const presence = ctx.createBiquadFilter();
              presence.type = 'peaking';
              presence.frequency.value = 3200;
              presence.Q.value = 0.9;
              const highShelf = ctx.createBiquadFilter();
              highShelf.type = 'highshelf';
              highShelf.frequency.value = 10000;

              const delay = ctx.createDelay(1.0);
              delay.delayTime.value = 0.13;
              const delayFb = ctx.createGain();
              delayFb.gain.value = 0;

              const gain = ctx.createGain();
              gain.gain.value = 1.0;
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 128;
              analyser.smoothingTimeConstant = 0.78;
              const limiter = ctx.createDynamicsCompressor();
              limiter.threshold.value = -5;
              limiter.knee.value = 6;
              limiter.ratio.value = 12;
              limiter.attack.value = 0.002;
              limiter.release.value = 0.12;

              source.connect(lowShelf);
              lowShelf.connect(peak);
              peak.connect(presence);
              presence.connect(highShelf);
              highShelf.connect(gain);
              // Parallel spatial echo loop for 3D Baile effect
              highShelf.connect(delay);
              delay.connect(delayFb);
              delayFb.connect(gain);

              gain.connect(analyser);
              analyser.connect(limiter);
              limiter.connect(ctx.destination);

              bassAudioCtxRef.current = ctx;
              bassLowShelfRef.current = lowShelf;
              bassPeakRef.current = peak;
              bassPresenceRef.current = presence;
              bassHighShelfRef.current = highShelf;
              delayNodeRef.current = delay;
              delayFeedbackRef.current = delayFb;
              bassGainRef.current = gain;
              audioAnalyserRef.current = analyser;
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
        let lowGain = shelfGains[level] || 0;
        let subGain = peakGains[level] || 0;
        let presGain = 0;
        let hiGain = 0;
        let echoMix = 0;
        let punch = [1.0, 1.08, 1.18, 1.28][level] || 1.0;

        if (activeEffect === 'baile3d') {
          lowGain += 4;
          presGain = 3.5;
          hiGain = 4.5;
          echoMix = 0.22;
        } else if (activeEffect === 'studio') {
          presGain = 5.5;
          hiGain = 4;
        } else if (activeEffect === 'grave_pancadao') {
          lowGain += 6;
          subGain += 5;
          hiGain = 2;
        } else if (activeEffect === 'noite_chill') {
          lowGain += 2;
          presGain = -2;
          hiGain = -3.5;
        }
        if (activeLoud) {
          punch *= 1.85;
        }

        if (bassLowShelfRef.current) bassLowShelfRef.current.gain.value = Math.min(18, lowGain);
        if (bassPeakRef.current) bassPeakRef.current.gain.value = Math.min(15, subGain);
        if (bassPresenceRef.current) bassPresenceRef.current.gain.value = presGain;
        if (bassHighShelfRef.current) bassHighShelfRef.current.gain.value = hiGain;
        if (delayFeedbackRef.current) delayFeedbackRef.current.gain.value = echoMix;
        if (bassGainRef.current) bassGainRef.current.gain.value = Math.min(2.6, punch);
      }

      // For embed-stream tracks, keep volume punch synced cleanly
      if (currentTrackRef.current?.youtubeVideoId && !currentTrackRef.current?.audioUrl && ytPlayerRef.current?.setVolume) {
        const targetVol = muted
          ? 0
          : Math.min(100, Math.round((dspActive ? Math.max(volume, activeLoud ? 1 : 0.94) : volume) * 100));
        ytPlayerRef.current.setVolume(targetVol);
      }
    },
    [volume, muted]
  );

  const handleSetBassBoostLevel = useCallback(
    (level: BassBoostLevel) => {
      bassBoostRef.current = level;
      setBassBoostLevel(level);
      applyBassBoostGain(level);
      const labels = ['Graves Normal', 'Graves Suave (+4dB)', 'Graves Pesado (+9dB)', 'Subwoofer Máximo (+14dB)'];
      showToast(`🔊 ${labels[level]}`);
    },
    [applyBassBoostGain, showToast]
  );

  const handleSetAudioEffect = useCallback(
    (eff: AudioEffectId) => {
      audioEffectRef.current = eff;
      setAudioEffect(eff);
      applyBassBoostGain(bassBoostRef.current, eff, loudModeRef.current);
      const labels: Record<AudioEffectId, string> = {
        normal: 'Efeito Normal (Puro)',
        baile3d: '🎧 Efeito 3D Baile Espacial ativado!',
        studio: '🎙️ Efeito Estúdio HD ativado!',
        grave_pancadao: '⚡ Efeito Pancadão Favela ativado!',
        noite_chill: '🌙 Efeito Noite VIP ativado!',
      };
      showToast(labels[eff]);
    },
    [applyBassBoostGain, showToast]
  );

  const handleToggleLoudMode = useCallback(() => {
    setLoudMode((prev) => {
      const next = !prev;
      loudModeRef.current = next;
      if (next && volume < 0.9) {
        setVolume(1);
        if (audioRef.current) audioRef.current.volume = 1;
      }
      applyBassBoostGain(bassBoostRef.current, audioEffectRef.current, next);
      showToast(
        next
          ? '🔥 SOM ALTO ATIVADO (+100% com limitador limpo)!'
          : 'Som Alto desativado (volume padrão)'
      );
      return next;
    });
  }, [applyBassBoostGain, showToast, volume]);

  const handleCycleBassBoost = useCallback(() => {
    setBassBoostLevel((prev) => {
      const next = ((prev + 1) % 4) as BassBoostLevel;
      bassBoostRef.current = next;
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

  const openToguroShop = useCallback(() => {
    setShopInitialCategory('mansao');
    setShopCategoryNonce((n) => n + 1);
    navigateTab('shop');
    showToast('🥃 Mansão Maromba · Produtos Oficiais do Toguro com -30% OFF!');
  }, [navigateTab, showToast]);

  const handleDeleteOrHideTrack = useCallback(
    (trackId: string) => {
      setHiddenTrackIds((prev) => {
        const next = prev.includes(trackId) ? prev : [...prev, trackId];
        try {
          localStorage.setItem('morro_gold_hidden_tracks_v1', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setPlayQueue((prev) => {
        const next = prev.filter((t) => t.id !== trackId);
        playQueueRef.current = next;
        return next;
      });
      showToast('🗑️ Música removida do seu álbum!');
    },
    [showToast]
  );

  const handleUpdateTrackCover = useCallback(
    (trackId: string, coverUrl: string) => {
      setCustomTrackCovers((prev) => {
        const next = { ...prev, [trackId]: coverUrl };
        try {
          localStorage.setItem('morro_gold_track_covers_v1', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      if (currentTrackRef.current?.id === trackId) {
        setCurrentTrack((prev) => (prev ? { ...prev, coverUrl } : prev));
      }
      showToast('📷 Foto atualizada na capa da música!');
    },
    [showToast]
  );

  const handleUpdateAlbumCover = useCallback(
    (coverUrl: string) => {
      setAlbumCoverOverride(coverUrl);
      try {
        localStorage.setItem('morro_gold_album_cover_v1', coverUrl);
      } catch {
        // ignore
      }
      if (currentTrackRef.current) {
        setCurrentTrack((prev) => (prev ? { ...prev, coverUrl } : prev));
      }
      showToast('📷 Sua foto foi aplicada no seu álbum! Agora você pode remover qualquer música que não combine.');
    },
    [showToast]
  );

  const handleRemoveFromQueue = useCallback(
    (trackId: string) => {
      setPlayQueue((prev) => {
        const next = prev.filter((t) => t.id !== trackId);
        playQueueRef.current = next;
        return next;
      });
      showToast('Música removida da fila.');
    },
    [showToast]
  );

  const handleClearQueue = useCallback(() => {
    const keep = currentTrackRef.current ? [currentTrackRef.current] : [];
    setPlayQueue(keep);
    playQueueRef.current = keep;
    showToast('🧹 Fila limpa! Mantendo apenas a música atual.');
  }, [showToast]);

  const handlePlayTrack = useCallback(
    async (track: Track, requestedVersion?: AudioVersion, customQueue?: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      claimMediaFocus('catalog');
      const mySeq = ++playSeqRef.current;
      lastTrackStartTsRef.current = Date.now();
      userPausedRef.current = false;
      bgHandoffActiveRef.current = false;
      audioProxyRetriedRef.current = false;
      recordSmartInteraction({
        kind: 'play',
        artist: track.artist,
        genre: track.genre || track.album,
        title: track.title,
      });
      if (ytStallTimerRef.current !== null) {
        window.clearTimeout(ytStallTimerRef.current);
        ytStallTimerRef.current = null;
      }
      setMusicMenuOpen(true);

      if (track.source === 'world_full' || track.source === 'world_preview') {
        setWorldCacheTracks((prev) => (prev.some((x) => x.id === track.id) ? prev : [track, ...prev].slice(0, 60)));
      }
      if (customQueue && customQueue.length > 0) {
        setPlayQueue(customQueue);
        playQueueRef.current = customQueue;
      } else if (!playQueueRef.current.some((q) => q.id === track.id)) {
        const singleQueue = [track];
        setPlayQueue(singleQueue);
        playQueueRef.current = singleQueue;
      }

      const targetVersion: AudioVersion =
        requestedVersion || (currentTrack?.id === track.id ? activeVersion : 'v1');
      const finalVersion: AudioVersion = targetVersion === 'v2' && track.audioUrlV2 ? 'v2' : 'v1';

      if (currentTrack?.id === track.id && activeVersion === finalVersion && !requestedVersion) {
        if (track.youtubeVideoId && !track.audioUrl && !bgHandoffActiveRef.current) {
          const st = ytPlayerRef.current?.getPlayerState?.();
          if (st === 1) {
            userPausedRef.current = true;
            ytPlayerRef.current?.pauseVideo?.();
          } else {
            userPausedRef.current = false;
            ytPlayerRef.current?.playVideo?.();
          }
          return;
        }
        if (audio.paused) {
          userPausedRef.current = false;
          await audio.play().catch(() => {});
        } else {
          userPausedRef.current = true;
          audio.pause();
        }
        return;
      }

      setCurrentTrack(track);
      currentTrackRef.current = track;
      setActiveVersion(finalVersion);
      bgBackupUrlRef.current = '';
      recordPlayHistoryItem(track);

      if (track.artist) {
        void recordRankingHit({
          kind: 'artist',
          name: track.artist,
          photoUrl: track.coverUrl,
          genre: track.genre || track.album,
        });
      }
      if (track.youtubeVideoId) {
        void recordRankingHit({
          kind: 'video',
          id: track.id,
          title: track.title,
          artist: track.artist,
          coverUrl: track.coverUrl,
          youtubeVideoId: track.youtubeVideoId,
          audioUrl: track.audioUrl,
          durationSec: track.durationSec,
        });
      }

      if (track.youtubeVideoId && !track.audioUrl) {
        // Pre-fetch next track backup audio so lock-screen auto-advance never drops!
        const qList = customQueue && customQueue.length > 0 ? customQueue : playQueueRef.current;
        if (qList.length > 1) {
          const curIdx = qList.findIndex((t) => t.id === track.id);
          const nextItem = qList[(curIdx >= 0 ? curIdx + 1 : 0) % qList.length];
          if (nextItem && !nextItem.audioUrl && nextItem.title) {
            void prefetchVideoAudioBackup(nextItem.title, nextItem.artist || '').then((u) => {
              if (u) {
                nextBackupTrackIdRef.current = nextItem.id;
                nextBackupUrlRef.current = u;
              }
            });
          }
        }

        // If phone is already locked/hidden, skip iframe and stream audio directly on <audio>
        if (document.hidden && backgroundModeRef.current) {
          setMobileBackgroundKeepalive(true);
          const directBackup =
            (nextBackupTrackIdRef.current === track.id ? nextBackupUrlRef.current : '') ||
            (await prefetchVideoAudioBackup(track.title, track.artist || ''));
          if (directBackup && playSeqRef.current === mySeq) {
            bgHandoffActiveRef.current = true;
            directAudioRawUrlRef.current = directBackup;
            const proxied =
              directBackup.startsWith('https://') &&
              !directBackup.includes('suno.ai') &&
              !directBackup.includes('audius')
                ? `/api/audio-proxy?url=${encodeURIComponent(directBackup)}`
                : directBackup;
            audio.removeAttribute('crossorigin');
            audio.src = proxied;
            audio.volume = muted ? 0 : volume;
            audio.muted = muted;
            audio.playbackRate = playbackSpeed;
            audio.loop = loopTrackRef.current;
            audio.load();
            void audio.play().catch(() => {});
            setIsPlaying(true);
            isPlayingRef.current = true;
            return;
          }
        }

        audio.pause();
        audio.removeAttribute('src');
        directAudioRawUrlRef.current = '';
        setIsPlayingFromOffline(false);
        setCurrentTime(0);
        setDuration(track.durationSec || 0);
        void prefetchVideoAudioBackup(track.title, track.artist).then((backupUrl) => {
          if (backupUrl && currentTrackRef.current?.id === track.id) {
            bgBackupUrlRef.current = backupUrl;
          }
        });
        if (ytPlayerRef.current?.loadVideoById) {
          ytPlayerRef.current.setVolume?.(muted ? 0 : Math.round(volume * 100));
          const q = clipTheaterOpenRef.current ? clipQualityRef.current : 'medium';
          ytPlayerRef.current.loadVideoById(
            q !== 'default' ? { videoId: track.youtubeVideoId, suggestedQuality: q } : track.youtubeVideoId
          );
          setIsPlaying(true);
          isPlayingRef.current = true;
        } else {
          ytPendingVideoRef.current = track.youtubeVideoId;
        }

        // If YouTube player stays blocked/unstarted after 9.5s (and NOT actively buffering), fall back to direct audio stream!
        ytStallTimerRef.current = window.setTimeout(() => {
          ytStallTimerRef.current = null;
          if (playSeqRef.current !== mySeq || userPausedRef.current || currentTrackRef.current?.id !== track.id) {
            return;
          }
          const st = ytPlayerRef.current?.getPlayerState?.();
          if (st !== 1 && st !== 3 && bgBackupUrlRef.current && !clipTheaterOpenRef.current) {
            bgHandoffActiveRef.current = true;
            directAudioRawUrlRef.current = bgBackupUrlRef.current;
            audio.removeAttribute('crossorigin');
            audio.src = bgBackupUrlRef.current;
            audio.volume = muted ? 0 : volume;
            audio.muted = muted;
            audio.playbackRate = playbackSpeed;
            audio.loop = loopTrackRef.current;
            audio.load();
            void audio.play().catch(() => {});
          }
        }, 9500);
        return;
      }

      ytPlayerRef.current?.pauseVideo?.();
      setClipTheaterOpen(false);

      const resolved = await resolvePlayableAudioUrl(track, finalVersion);
      if (playSeqRef.current !== mySeq) return; // User clicked another track while resolving

      setIsPlayingFromOffline(resolved.fromOffline);
      directAudioRawUrlRef.current = resolved.url;

      // Play directly from CDN/offline cache for instant Range streaming; only route via proxy when DSP Effects/Bass/Loud Mode needs CORS
      const needsCorsProxy =
        !resolved.fromOffline &&
        (bassBoostLevel > 0 || audioEffectRef.current !== 'normal' || loudModeRef.current) &&
        resolved.url.startsWith('https://') &&
        !resolved.url.includes('suno.ai') &&
        !resolved.url.includes('audius');

      const playableSrc = needsCorsProxy
        ? `/api/audio-proxy?url=${encodeURIComponent(resolved.url)}`
        : resolved.url;

      if (
        bassBoostLevel > 0 &&
        (resolved.fromOffline ||
          playableSrc.startsWith('/') ||
          playableSrc.includes('suno.ai') ||
          playableSrc.includes('audius'))
      ) {
        audio.crossOrigin = 'anonymous';
      } else {
        audio.removeAttribute('crossorigin');
      }

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
        if (playSeqRef.current !== mySeq) return;
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
      } catch (err) {
        if (playSeqRef.current !== mySeq) return;
        const errName = (err as { name?: string })?.name || '';
        if (errName === 'AbortError') return; // superseded by rapid click or load
        if (
          !audioProxyRetriedRef.current &&
          resolved.url.startsWith('https://') &&
          !playableSrc.includes('/api/audio-proxy')
        ) {
          audioProxyRetriedRef.current = true;
          audio.removeAttribute('crossorigin');
          audio.src = `/api/audio-proxy?url=${encodeURIComponent(resolved.url)}`;
          audio.load();
          try {
            await audio.play();
            return;
          } catch {
            // fall through to toast
          }
        }
        showToast(
          !navigator.onLine && !resolved.fromOffline
            ? 'Sem internet — baixe a música Offline antes para ouvir sem conexão.'
            : 'Toque em Play novamente para liberar o áudio.'
        );
      }
    },
    [currentTrack?.id, activeVersion, volume, muted, bassBoostLevel, playbackSpeed, applyBassBoostGain, showToast]
  );

  useEffect(() => {
    handlePlayTrackRef.current = handlePlayTrack;
  }, [handlePlayTrack]);

  const openClipWithIntro = useCallback(
    (track: Track, queue?: Track[]) => {
      setClipPrerollActive(false);
      setMediaPlayerMenuOpen(false);
      setClipMinimized(false);
      setClipTheaterOpen(true);
      void handlePlayTrack(track, 'v1', queue);
    },
    [handlePlayTrack]
  );

  const handleToggleOffline = useCallback(
    async (track: Track) => {
      if (offlineTrackIds.has(track.id)) {
        await removeTrackOffline(track.id);
        setOfflineTrackIds(getOfflineTrackIds());
        showToast(`🗑️ "${track.title}" removida do modo offline.`);
        return;
      }
      setDownloadingIds((prev) => new Set(prev).add(track.id));
      setDownloadProgress({ label: track.title, pct: 8, mb: 0 });
      try {
        const entry = await downloadTrackOffline(track, (pct, loadedMb) => {
          setDownloadProgress({ label: track.title, pct, mb: loadedMb });
        });
        setOfflineTrackIds(getOfflineTrackIds());
        const mb = (entry.bytes / (1024 * 1024)).toFixed(1);
        setDownloadProgress({ label: track.title, pct: 100, mb: Number(mb) });
        showToast(`✅ "${track.title}" salva Offline (${mb} MB) — toca sem internet!`);
        window.setTimeout(() => setDownloadProgress(null), 2200);
      } catch {
        setDownloadProgress(null);
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

  const handleDownloadTrackFile = useCallback(
    async (track: Track) => {
      setDownloadingIds((prev) => new Set(prev).add(track.id));
      setDownloadProgress({ label: `${track.title}.mp3`, pct: 8, mb: 0 });
      try {
        const res = await triggerDirectFileDownload({
          title: track.title,
          artist: track.artist,
          directUrl: track.audioUrl || track.audioUrlV2 || undefined,
          kind: 'audio',
          onProgress: (pct, loadedMb) => {
            setDownloadProgress({ label: `${track.title}.mp3`, pct, mb: loadedMb });
          },
        });
        setDownloadProgress({ label: res.filename, pct: 100, mb: res.mb });
        showToast(`⬇️ "${res.filename}" baixada (${res.mb} MB)!`);
        window.setTimeout(() => setDownloadProgress(null), 2400);
      } catch {
        setDownloadProgress(null);
        showToast(`Não foi possível baixar o arquivo de "${track.title}" agora.`);
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    },
    [showToast]
  );

  const handleDownloadAllOffline = useCallback(async () => {
    const missing = tracks.filter((t) => !offlineTrackIds.has(t.id));
    if (missing.length === 0) {
      showToast('✅ Todas as músicas já estão salvas offline!');
      return;
    }
    setDownloadingAll(true);
    let okCount = 0;
    for (let i = 0; i < missing.length; i += 3) {
      const batch = missing.slice(i, i + 3);
      await Promise.all(
        batch.map(async (track) => {
          setDownloadingIds((prev) => new Set(prev).add(track.id));
          try {
            await downloadTrackOffline(track);
            okCount++;
            setOfflineTrackIds(getOfflineTrackIds());
            setDownloadProgress({
              label: `Baixando músicas (${okCount}/${missing.length})`,
              pct: Math.round((okCount / missing.length) * 100),
              mb: 0,
            });
          } catch {
            // continue
          } finally {
            setDownloadingIds((prev) => {
              const next = new Set(prev);
              next.delete(track.id);
              return next;
            });
          }
        })
      );
    }
    setDownloadingAll(false);
    setDownloadProgress(null);
    showToast(`📱 ${okCount} músicas salvas offline no aparelho!`);
  }, [tracks, offlineTrackIds, showToast]);

  // (Lock-screen & normal auto-advance handled cleanly by the unified <audio> 'ended' & YT state 0 listeners)

  // PC Keyboard Shortcuts (Espaço = Play/Pause, Setas = ±10s, M = Mudo, Shift+N/P = Próxima/Anterior)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' && currentTrackRef.current) {
        e.preventDefault();
        void handleTogglePlay();
      } else if (e.code === 'ArrowRight' && audioRef.current) {
        audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10);
      } else if (e.code === 'ArrowLeft' && audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      } else if (e.key.toLowerCase() === 'm') {
        setMuted((v) => !v);
      } else if (e.shiftKey && e.key.toLowerCase() === 'n') {
        handlePrevNext(1);
      } else if (e.shiftKey && e.key.toLowerCase() === 'p') {
        handlePrevNext(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectVersion = (ver: AudioVersion) => {
    if (!currentTrack) return;
    if (ver === 'v2' && !currentTrack.audioUrlV2) return;
    void handlePlayTrack(currentTrack, ver);
  };

  const handleTogglePlay = async () => {
    if (!currentTrack) return;
    if (currentTrack.youtubeVideoId && !currentTrack.audioUrl && !bgHandoffActiveRef.current) {
      const st = ytPlayerRef.current?.getPlayerState?.();
      if (st === 1) {
        userPausedRef.current = true;
        ytPlayerRef.current?.pauseVideo?.();
      } else {
        userPausedRef.current = false;
        ytPlayerRef.current?.playVideo?.();
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) {
      userPausedRef.current = false;
      await handlePlayTrack(currentTrack, activeVersion);
      return;
    }
    if (audio.paused) {
      userPausedRef.current = false;
      await audio.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      audio.pause();
    }
  };

  // Botão de Segurança: Só para tudo de verdade quando o usuário clicar em Sair/Parar Tudo ou fechar o site
  const handleEmergencyStop = useCallback(() => {
    userPausedRef.current = true;
    bgHandoffActiveRef.current = false;
    isPlayingRef.current = false;
    stopAllMedia();
    try {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
      }
      ytPlayerRef.current?.stopVideo?.();
      ytPlayerRef.current?.pauseVideo?.();
    } catch {
      // ignore
    }
    setIsPlaying(false);
    setClipTheaterOpen(false);
    setMusicMenuOpen(false);
    setWatchingMovie(false);
    clearBackgroundMediaSession();
    showToast('🔒 Áudio, vídeo e segundo plano encerrados com segurança!');
  }, [showToast]);

  // Auto YouTube-Music Style Media Player on Minimize / Screen Off / App Leave: keeps playing continuously!
  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') {
        if (!userPausedRef.current && isPlayingRef.current && backgroundModeRef.current) {
          setMobileBackgroundKeepalive(true);
          void bassAudioCtxRef.current?.resume().catch(() => {});
          if (audioRef.current?.src && audioRef.current.paused) {
            void audioRef.current.play().catch(() => {});
          }
          // Proactively hand off active YouTube playback onto persistent <audio> immediately on screen lock!
          const cur = currentTrackRef.current;
          if (cur?.youtubeVideoId && !cur.audioUrl && !bgHandoffActiveRef.current && audioRef.current) {
            const curPos = ytPlayerRef.current?.getCurrentTime?.() || 0;
            const backup = bgBackupUrlRef.current;
            if (backup) {
              bgHandoffActiveRef.current = true;
              directAudioRawUrlRef.current = backup;
              try {
                ytPlayerRef.current?.pauseVideo?.();
              } catch {
                // ignore
              }
              const el = audioRef.current;
              const proxied =
                backup.startsWith('https://') &&
                !backup.includes('suno.ai') &&
                !backup.includes('audius')
                  ? `/api/audio-proxy?url=${encodeURIComponent(backup)}`
                  : backup;
              el.removeAttribute('crossorigin');
              el.src = proxied;
              el.volume = muted ? 0 : volume;
              el.muted = muted;
              el.playbackRate = playbackSpeed;
              el.loop = loopTrackRef.current;
              el.load();
              if (curPos > 1) {
                const seekFn = () => {
                  try {
                    if (Number.isFinite(el.duration) && curPos < el.duration - 2) {
                      el.currentTime = curPos;
                    }
                  } catch {
                    // ignore
                  }
                  el.removeEventListener('loadedmetadata', seekFn);
                };
                el.addEventListener('loadedmetadata', seekFn);
              }
              void el.play().catch(() => {});
            } else {
              ytPlayerRef.current?.playVideo?.();
              void prefetchVideoAudioBackup(cur.title, cur.artist || '').then((u) => {
                if (u && document.hidden && !userPausedRef.current && !bgHandoffActiveRef.current && audioRef.current) {
                  bgBackupUrlRef.current = u;
                  bgHandoffActiveRef.current = true;
                  directAudioRawUrlRef.current = u;
                  try {
                    ytPlayerRef.current?.pauseVideo?.();
                  } catch {
                    // ignore
                  }
                  const el = audioRef.current;
                  el.removeAttribute('crossorigin');
                  el.src = u.startsWith('https://') ? `/api/audio-proxy?url=${encodeURIComponent(u)}` : u;
                  el.load();
                  void el.play().catch(() => {});
                }
              });
            }
          }
        }
      } else if (document.visibilityState === 'visible') {
        if (!userPausedRef.current && isPlayingRef.current) {
          void bassAudioCtxRef.current?.resume().catch(() => {});
        }
      }
    };
    const onPageHide = () => {
      if (!userPausedRef.current && isPlayingRef.current && backgroundModeRef.current) {
        setMobileBackgroundKeepalive(true);
        if (audioRef.current?.src && audioRef.current.paused) {
          void audioRef.current.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

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

  // Universal MediaSession + Lock-Screen Controls + Gaming PiP HUD Sync
  useEffect(() => {
    if (!currentTrack) return;
    const displayTitle = `${currentTrack.emoji ? currentTrack.emoji + ' ' : ''}${currentTrack.title}`;
    syncBackgroundMediaSession(
      {
        title: displayTitle,
        artist: currentTrack.artist || 'MORRO GOLD',
        album: currentTrack.album || 'Cosmic Phonk',
        artworkUrl: currentTrack.coverUrl,
        duration,
        currentTime,
        isPlaying,
      },
      {
        onPlay: () => {
          userPausedRef.current = false;
          void handleTogglePlay();
        },
        onPause: () => {
          userPausedRef.current = true;
          void handleTogglePlay();
        },
        onPrev: () => handlePrevNext(-1),
        onNext: () => handlePrevNext(1),
        onStop: () => handleEmergencyStop(),
        onSeek: (sec) => handleSeek(sec),
      }
    );
    updateGamingPipMetadata(
      {
        title: displayTitle,
        artist: currentTrack.artist || 'MORRO GOLD',
        coverUrl: currentTrack.coverUrl,
        isPlaying,
      },
      {
        onTogglePlay: () => void handleTogglePlay(),
        onPrev: () => handlePrevNext(-1),
        onNext: () => handlePrevNext(1),
      }
    );
    setGamingPipOpen(isGamingPipOpen());
  }, [currentTrack, isPlaying, duration, handlePrevNext, handleEmergencyStop]);

  // Lock-Screen / Screen-Off & In-Game Anti-Cut Auto-Recovery: keeps music playing continuously until closed
  useEffect(() => {
    if (!gamingModeEnabled && !backgroundMode) return;
    const recoverAudio = () => {
      if (userPausedRef.current || !isPlayingRef.current) return;
      const el = audioRef.current;
      if (el && el.paused && el.src && !el.ended) {
        void el.play().catch(() => {});
      }
    };
    const onVis = () => {
      window.setTimeout(recoverAudio, 150);
    };
    document.addEventListener('visibilitychange', onVis);
    const interval = window.setInterval(recoverAudio, 1500);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(interval);
    };
  }, [gamingModeEnabled, backgroundMode]);

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
    if (nextFav) {
      recordSmartInteraction({
        kind: 'like',
        artist: track.artist,
        genre: track.genre || track.album,
        title: track.title,
      });
    }
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
    { id: 'catalog', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'reels', label: 'Vibe', icon: <Film className="w-5 h-5" /> },
    { id: 'channels', label: 'Canais & Criadores', icon: <Tv className="w-5 h-5" /> },
    { id: 'explore', label: 'Música & Clipes', icon: <Compass className="w-5 h-5" /> },
    { id: 'shop', label: 'Loja dos Cria VIP', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'movies', label: 'Filmes & Séries', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'sports', label: 'Futebol & Ao Vivo', icon: <Trophy className="w-5 h-5" /> },
    { id: 'offline', label: 'Som Offline', icon: <Car className="w-5 h-5" /> },
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
  const officialSiteUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';
    const isLocal = !origin || /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(origin);
    if (!isAndroidApk() && !isLocal) return origin;
    return (settings.publicUrl || 'https://lenkyx-cosmic-phonk.onrender.com').replace(/\/$/, '');
  }, [settings.publicUrl]);

  return (
    <div className="h-dvh overflow-hidden bg-[#070b18] text-white flex relative">
      <CosmicSpaceBackdrop />

      {updPct !== null && (
        <div className="fixed top-0 left-0 right-0 z-[999] h-[3px] pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-lime-300 shadow-[0_0_16px_rgba(16,185,129,0.85)] transition-[width] duration-150 ease-out"
            style={{ width: updPct + '%' }}
          />
        </div>
      )}

      {/* === FAVELA OSTENTAÇÃO VIP ENTRY SPLASH (Logo Grosso + Palco VIP Diamante Iluminado) === */}
      {showEntrySplash && (
        <div
          onClick={() => dismissEntrySplash(false)}
          className={`fixed inset-0 z-[120] flex items-center justify-center bg-[#0a0612] overflow-hidden cursor-pointer transition-opacity duration-300 ${
            entrySplashExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* SO O LOGO: quadrado, cantos arredondados, borda de ouro, 3D 24k, fixo */}
          <div className="relative w-[min(58vw,42vh)] h-[min(58vw,42vh)] rounded-[28px] bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 p-[5px] shadow-[0_28px_80px_rgba(245,200,76,0.35)]">
            <div className="w-full h-full rounded-[22px] bg-[#120a1e] flex items-center justify-center overflow-hidden shadow-[inset_0_2px_24px_rgba(255,215,90,0.18)]">
              <img
                src="/covers/morro-gold-emblema-grosso.png"
                alt="MORRO GOLD"
                className="w-[88%] h-[88%] object-contain select-none drop-shadow-[0_10px_28px_rgba(255,205,80,0.35)]"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}


      {/* === MAIN CONTENT SHELL === */}
      <div className="relative z-10 flex-1 min-w-0 h-full overflow-hidden flex flex-col">
        {/* TOP HEADER (Luxury Obsidian Glass Bar) */}
        <header className="shrink-0 z-30 mg24k-bar border-b border-amber-400/15 h-14 px-3 sm:px-5 flex items-center justify-between gap-3 shadow-[0_6px_28px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            {activeTab !== 'catalog' && (
              <button
                onClick={goBackTab}
                className="w-9 h-9 rounded-full lux-btn-obsidian flex items-center justify-center text-amber-200 shrink-0"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div
              onClick={handleBrandTap}
              className="flex items-center justify-center shrink-0 cursor-pointer select-none"
              title="MORRO GOLD"
            >
              <LenkyxEdgeLogo size="sm" />
            </div>
          </div>

          {/* DESKTOP YOUTUBE-STYLE SEARCH OMNIBOX */}
          <div ref={omniboxWrapRef} className="hidden md:flex flex-1 min-w-0 max-w-xl relative items-center gap-2">
            <form
              onSubmit={handleGlobalSearchSubmit}
              className="flex-1 min-w-0 flex items-center gap-2 rounded-full bg-white/[0.07] hover:bg-white/[0.1] focus-within:bg-[#121212] border border-white/15 focus-within:border-white/40 px-4 py-1.5 transition"
            >
              <Search className="w-4 h-4 text-slate-300 shrink-0" />
              <input
                type="text"
                value={globalSearch}
                onFocus={() => setOmniboxOpen(true)}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setOmniboxOpen(true);
                }}
                placeholder="Pesquisar"
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
                onClick={handleVoiceSearch}
                className="p-1.5 rounded-full hover:bg-cyan-400/20 text-cyan-300 shrink-0 transition"
                title="Busca por Voz (Fala aí, cria!)"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openWebSearch(globalSearch || 'MORRO GOLD', true)}
                className={`p-1 rounded-full shrink-0 transition ${
                  searchViewPrivate ? 'text-purple-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Pesquisa Privada"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            </form>

            {omniboxOpen && (
              <div className="mg-on-video absolute left-0 right-0 top-full mt-2 z-[60] rounded-2xl bg-[#16161c]/98 backdrop-blur-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden">
                {globalSearch.trim() && (
                  <div className="p-2 border-b border-white/[0.08] flex flex-wrap gap-1.5 bg-white/[0.03]">
                    <button
                      type="button"
                      onClick={() => openWebSearch(globalSearch, false)}
                      className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-black flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" /> Buscar "{globalSearch.trim().slice(0, 24)}"
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerWorldSearchDirect(globalSearch)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-1.5"
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
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sug}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CLEAN YOUTUBE-STYLE RIGHT ICON CLUSTER */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative">
            

            <button
              type="button"
              onClick={() => setCreateMenuOpen(true)}
              className="hidden sm:flex px-3.5 py-1.5 rounded-full lux-btn-gold text-xs font-black items-center gap-1.5"
              title="Criar Vibe, Live HD ou Música"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Criar</span>
            </button>

            <button
              type="button"
              onClick={() => openLiveChat('global', '🔥 Geral do Morro · Chat Ao Vivo')}
              className="relative px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-600/90 via-pink-500/90 to-amber-500/90 hover:brightness-110 text-white text-[11px] font-black flex items-center gap-1.5 shadow-[0_0_16px_rgba(244,63,94,0.45)] transition"
              title="Chat Ao Vivo em Tempo Real (Estilo Instagram Live)"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat Ao Vivo</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-amber-300 transition focus-visible:ring-2 focus-visible:ring-amber-400"
                title="Notificações & Novidades"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#06070d]" />
              </button>

              {notificationsOpen && (
                <>
                  <div
                    onClick={() => setNotificationsOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <div className="mg-on-video absolute right-0 top-11 z-50 w-72 sm:w-80 rounded-2xl bg-[#161622]/98 backdrop-blur-2xl border border-white/15 shadow-2xl p-2.5 space-y-1.5 text-xs">
                    <div className="px-2 py-1 flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-black text-white">Notificações</span>
                      <span className="text-[10px] font-bold text-amber-300">MORRO GOLD</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        triggerWorldSearchDirect('funk 2026 favela');
                      }}
                      className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-start gap-2.5 transition"
                    >
                      <span className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">🔥</span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">Top Funk, Rap & Pagode 2026</div>
                        <div className="text-[11px] text-slate-300 line-clamp-1">MC Ryan SP, Menos É Mais, Matuê & mais!</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        openLiveChat('global', '🔥 Geral do Morro · Chat Ao Vivo');
                      }}
                      className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-start gap-2.5 transition"
                    >
                      <span className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">💬</span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">Chat Ao Vivo Estilo Instagram</div>
                        <div className="text-[11px] text-slate-300 line-clamp-1">7 salas abertas em tempo real agora!</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setShortsTriggerQuery('__subscribed__');
                        setShortsTriggerNonce((n) => n + 1);
                        navigateTab('reels');
                      }}
                      className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-start gap-2.5 transition"
                    >
                      <span className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">🔔</span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">Suas Inscrições ({subscribedChannelsList.length})</div>
                        <div className="text-[11px] text-slate-300 line-clamp-1">Ver as novas Vibes dos seus canais</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setPixInitialTab('ranking');
                        setPixOpen(true);
                      }}
                      className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-start gap-2.5 transition"
                    >
                      <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">👑</span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">Ranking VIP & Apoio PIX</div>
                        <div className="text-[11px] text-slate-300 line-clamp-1">Confira os top apoiadores do MORRO GOLD</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleVoiceSearch}
              className="md:hidden w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-cyan-300 transition"
              title="Busca por Voz"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileIosSearchOpen(true)}
              className="md:hidden w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition"
              title="Pesquisar"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
              className="mg24k-btn !w-9 !h-9 !min-w-[36px] !p-0 rounded-full"
              title={themeMode === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
              aria-label={themeMode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setTopOverflowOpen((v) => !v)}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
              title="Mais opções"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {mode === 'creator' && (
              <button
                onClick={() => void handleCreatorLogout()}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-emerald-300"
                title="Sair Modo Criador"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Clean YouTube-Style Overflow Dropdown */}
            {topOverflowOpen && (
              <>
                <div
                  onClick={() => setTopOverflowOpen(false)}
                  className="fixed inset-0 z-40"
                />
                <div className="mg-on-video absolute right-0 top-11 z-50 w-64 rounded-2xl bg-[#1c1c22]/98 backdrop-blur-2xl border border-white/15 shadow-2xl p-1.5 text-xs font-semibold text-white">
                  <button
                    type="button"
                    onClick={() => {
                      setTopOverflowOpen(false);
                      setLangModalOpen(true);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>{getLanguageMeta(userLang).flag}</span>
                      <span>Idioma ({getLanguageMeta(userLang).nativeName})</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setTopOverflowOpen(false);
                      setBackgroundMode(true);
                      const perms = await requestYoutubeMediaPermissions();
                      showToast(
                        `🔋 Segundo plano ativo! Tela/WakeLock: ${perms.wakeLock ? 'OK' : 'Web'} · Notif: ${perms.notifications}`
                      );
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center gap-2.5"
                  >
                    <Zap className="w-4 h-4 text-emerald-300" />
                    <span>Tela Apagada & Permissões</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTopOverflowOpen(false);
                      runSiteUpdate();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center gap-2.5"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-300 ${updatingApp ? 'animate-spin' : ''}`} />
                    <span>Atualizar MORRO GOLD</span>
                  </button>
                  
                  
                  
                  
                  {mode === 'creator' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTopOverflowOpen(false);
                        setCommissionPanelOpen(true);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center gap-2.5 bg-amber-400/10 border border-amber-400/30"
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-300" />
                      <span>Minhas Comissões (Privado)</span>
                      <Lock className="w-3 h-3 ml-auto text-amber-300" />
                    </button>
                  )}
                  
                  
                  
                </div>
              </>
            )}
          </div>
        </header>

        

        {/* CLEAN YOUTUBE-STYLE UNDERLINED TOP TAB BAR */}
        <div className="shrink-0 z-20 px-3 sm:px-5 border-b border-amber-300/15 bg-gradient-to-b from-[#17101c]/90 via-[#100d16]/88 to-[#090910]/94 backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.36)]">
          <div className="max-w-[1380px] mx-auto flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar border-b border-white/[0.08]">

            {(
              [
                { id: 'catalog', label: 'Início' },
                { id: 'reels', label: 'Vibe' },
                { id: 'channels', label: 'Canais' },
                { id: 'explore', label: 'Música' },
                { id: 'sports', label: 'Ao vivo' },
                { id: 'shop', label: 'Loja VIP' },
              ] as { id: TabId; label: string }[]
            ).map((tab) => {
              const active = !moreSheetOpen && activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigateTab(tab.id)}
                  className={`py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition shrink-0 ${
                    active
                      ? 'border-amber-400 text-white'
                      : 'border-transparent text-slate-300/85 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreSheetOpen((v) => !v)}
              className={`py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition shrink-0 flex items-center gap-1 ${
                moreSheetOpen
                  ? 'border-amber-400 text-white'
                  : 'border-transparent text-slate-300/85 hover:text-white'
              }`}
              title="Mais seções"
            >
              <MoreVertical className="w-4 h-4 text-amber-300" /> Mais
            </button>
            <button
              type="button"
              onClick={() => setCatRowOpen((v) => !v)}
              className={`py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition shrink-0 flex items-center gap-1 ${
                catRowOpen
                  ? 'border-amber-400 text-white'
                  : 'border-transparent text-slate-300/85 hover:text-white'
              }`}
              title="Mostrar ou ocultar as categorias"
            >
              ▾ Categorias
            </button>
          </div>

          {/* CATEGORIAS (recolhidas por padrão — toque em "Categorias" para abrir) */}
          {!moreSheetOpen && catRowOpen && (
            <div className="max-w-[1380px] mx-auto flex items-center gap-2 py-2 border-t border-white/[0.06]">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
              {(
                [
                  {
                    id: 'funk',
                    label: 'Funk & Baile',
                    run: () => triggerWorldSearchDirect('funk 2026 favela baile'),
                  },
                  {
                    id: 'rap',
                    label: 'Rap & Trap',
                    run: () => triggerWorldSearchDirect('rap trap brasil 2026'),
                  },
                  {
                    id: 'pagode',
                    label: 'Pagode',
                    run: () => triggerWorldSearchDirect('pagode 2026 menos e mais'),
                  },
                  { id: 'filmes', label: 'Filmes & Animes', run: () => navigateTab('movies') },
                  { id: 'jogos', label: 'Jogos', run: () => navigateTab('arcade') },
                ] as { id: string; label: string; run: () => void }[]
              ).map((chip) => {
                const selected = activeYtChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setActiveYtChip(chip.id);
                      chip.run();
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      selected
                        ? 'bg-white text-black shadow'
                        : 'bg-white/[0.09] hover:bg-white/[0.18] text-slate-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
              </div>

            </div>
          )}
        </div>

        {/* YOUTUBE-STYLE "MAIS" CLEAN TWO-SECTION MENU */}
        {moreSheetOpen && (
          <div className="flex-1 overflow-y-auto bg-[#07080e] text-white px-4 sm:px-8 py-4">
            <div className="max-w-xl mx-auto space-y-1">
              <button
                type="button"
                onClick={() => navigateTab('movies')}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <Clapperboard className="w-5 h-5 text-white shrink-0" />
                <span>Filmes & Séries</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTab('arcade')}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <Gamepad2 className="w-5 h-5 text-white shrink-0" />
                <span>Jogos & Arcade</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  openFuturisticFeature('wrapped');
                }}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <TrendingUp className="w-5 h-5 text-white shrink-0" />
                <span>Paradas & Top BR</span>
              </button>

              

              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  openFuturisticFeature('shazam');
                }}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <Mic className="w-5 h-5 text-white shrink-0" />
                <span>Podcasts & Radar Som</span>
              </button>

              

              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  openFuturisticFeature('jam');
                }}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <Headphones className="w-5 h-5 text-white shrink-0" />
                <span>Ouvir Junto (Sala Festa)</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTab('offline')}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <Car className="w-5 h-5 text-white shrink-0" />
                <span>Som Offline</span>
              </button>

              <div className="my-3 border-t border-white/10" />

              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  setPixInitialTab('vip');
                  setPixOpen(true);
                }}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-yellow-600 text-black flex items-center justify-center shrink-0">
                  <Crown className="w-3.5 h-3.5" />
                </span>
                <span>MORRO GOLD VIP & PIX</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTab('studio')}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shrink-0">
                  <Wand2 className="w-3.5 h-3.5" />
                </span>
                <span>MORRO GOLD Studio</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTab('playlists')}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shrink-0">
                  <Music className="w-3.5 h-3.5" />
                </span>
                <span>MORRO GOLD Music</span>
              </button>

              

              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  openFuturisticFeature('partners');
                }}
                className="w-full py-3.5 px-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-5 text-[15px] font-medium text-white transition"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-black flex items-center justify-center shrink-0">
                  <Handshake className="w-3.5 h-3.5" />
                </span>
                <span>Patrocínio & Criadores</span>
              </button>

              <div className="my-3 border-t border-white/10" />

              <div className="flex flex-wrap items-center gap-2 pt-1 pb-20">
                <button
                  type="button"
                  onClick={() => {
                    setMoreSheetOpen(false);
                    setShareTrack(null);
                    setShareOpen(true);
                try { const voz = new Audio('/audio/compartilha-crias.mp3'); void voz.play().catch(() => {}); } catch { /* ok */ }
                  }}
                  className="px-4 py-2 rounded-full lux-btn-obsidian text-xs font-bold flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-300" /> Convidar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreSheetOpen(false);
                    setLegalOpen(true);
                  }}
                  className="px-4 py-2 rounded-full lux-btn-obsidian text-xs font-bold flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-300" /> Termos
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMoreSheetOpen(false);
                    setCharterTab('charter');
                    setCharterOpen(true);
                  }}
                  className="px-4 py-2 rounded-full lux-btn-obsidian text-xs font-bold flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-300" /> Direitos & Licenças
                </button>
                {!isAndroidApk() && (
                  <button
                    type="button"
                    onClick={() => void handleOneClickPcDownload()}
                    className="px-4 py-2 rounded-full lux-btn-gold text-xs font-black flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar App
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE VIEW CONTAINER */}
        <main id="lenkyx-main-scroll" className={`mg-lightable flex-1 overflow-y-auto overflow-x-hidden overscroll-contain w-full ${moreSheetOpen ? 'hidden' : ''}`}>
          <div className="w-full max-w-[1380px] mx-auto px-2.5 sm:px-5 pt-3">
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
                <div className="font-display text-xs tracking-widest text-purple-300">CARREGANDO...</div>
              </div>
            ) : (
              <>
                {activeTab === 'catalog' && (
                  <CatalogView
                    tracks={globalSearch.trim() ? visibleTracks : rankTracksBySmartTaste(visibleTracks)}
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
                    onPlayTrack={(t, ver) => {
                      if (t.vipOnly && !settings.vipActive) {
                        showToast('🔒 Essa é música exclusiva da realeza VIP! Assine e ouça primeiro.');
                        setPixInitialTab('vip');
                        setPixOpen(true);
                        return;
                      }
                      void handlePlayTrack(t, ver, visibleTracks);
                    }}
                    onLikeTrack={(t) => void handleLikeTrack(t)}
                    onShareTrack={(t) => {
                      setShareTrack(t);
                      setShareOpen(true);
                try { const voz = new Audio('/audio/compartilha-crias.mp3'); void voz.play().catch(() => {}); } catch { /* ok */ }
                    }}
                    onOpenPix={() => {
                      setPixInitialTab('donate');
                      setPixOpen(true);
                    }}
                    onInstallApp={() => void handleInstantInstall()}
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
                    lyricsTrack={null}
                    onSetLyricsTrack={setLyricsTrack}
                    onCommentTrack={(t) =>
                      openCommentTarget(`track:${t.id}`, `${t.title} — ${t.artist}`, t.youtubeVideoId)
                    }
                    onCommentTarget={openCommentTarget}
                    onOpenGlobalChat={() => openLiveChat('global', '🔥 Geral do Morro · Chat Ao Vivo')}
                    onOpenLiveChat={openLiveChat}
                    onSearchWorld={triggerWorldSearchDirect}
                    onOpenShop={() => navigateTab('shop')}
                    onOpenToguroShop={openToguroShop}
                    onDeleteTrack={handleDeleteOrHideTrack}
                    onUpdateTrackCover={handleUpdateTrackCover}
                    onUpdateAlbumCover={handleUpdateAlbumCover}
                    onToast={showToast}
                  />
                )}

                {activeTab === 'reels' && (
                  <Suspense
                    fallback={
                      <div className="py-16 text-center text-xs text-cyan-300 font-semibold">
                        Carregando o Vibe dos Cria...
                      </div>
                    }
                  >
                    <SocialShortsAndLiveView
                      tracks={allTracksPool}
                      initialTrack={currentTrack}
                      user={null}
                      initialAction={reelsAction}
                      onGoHome={() => navigateTab('catalog')}
                      actionNonce={reelsActionNonce}
                      initialShortsQuery={shortsTriggerQuery}
                      initialShortsNonce={shortsTriggerNonce}
                      onSubscriptionsChanged={setSubscribedChannelsList}
                      onPlayTrack={(t) => {
                        if (t.vipOnly && !settings.vipActive) {
                          showToast('🔒 Essa é música exclusiva da realeza VIP! Assine e ouça primeiro.');
                          setPixInitialTab('vip');
                          setPixOpen(true);
                          return;
                        }
                        void handlePlayTrack(t, 'v1', [t]);
                      }}
                      onPauseCatalogPlayer={pauseCatalogPlayer}
                      onOpenUserAuth={() => setChatModalOpen(true)}
                      onOpenPartners={() => openFuturisticFeature('partners')}
                      onMinimizeReel={(short) => {
                        setMinimizedMovie(null);
                        setClipMinimized(false);
                        setClipTheaterOpen(false);
                        setMinimizedReel({
                          id: short.id,
                          title: short.title,
                          creatorName: short.creator_name,
                          youtubeVideoId: short.youtube_id,
                          videoUrl: short.video_url,
                        });
                        showToast('🎬 Vibe minimizado! Continua tocando enquanto você navega.');
                      }}
                      onOpenToguroShop={openToguroShop}
                      onToast={showToast}
                    />
                  </Suspense>
                )}

                {activeTab === 'shop' && (
                  <ShopCriaView
                    settings={settings}
                    mode={mode}
                    initialCategory={shopInitialCategory}
                    categoryNonce={shopCategoryNonce}
                    onSaveSettings={handleSaveSettings}
                    onCommentTarget={openCommentTarget}
                    onOpenLiveChat={openLiveChat}
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
                    onPlayTrack={(t, queue) => {
                      if (t.vipOnly && !settings.vipActive) {
                        showToast('🔒 Essa é música exclusiva da realeza VIP! Assine e ouça primeiro.');
                        setPixInitialTab('vip');
                        setPixOpen(true);
                        return;
                      }
                      void handlePlayTrack(t, 'v1', queue);
                    }}
                    onWatchClip={openClipWithIntro}
                    onAddToPlaylist={addTrackToPlaylist}
                    onOpenToguroShop={openToguroShop}
                    onCommentTarget={openCommentTarget}
                    onOpenLiveChat={openLiveChat}
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
                    onPlayTrack={(t, queue) => {
                      if (t.vipOnly && !settings.vipActive) {
                        showToast('🔒 Essa é música exclusiva da realeza VIP! Assine e ouça primeiro.');
                        setPixInitialTab('vip');
                        setPixOpen(true);
                        return;
                      }
                      void handlePlayTrack(t, 'v1', queue);
                    }}
                    onCreatePlaylist={handleCreatePlaylist}
                    onDeletePlaylist={handleDeletePlaylist}
                    onRemoveFromPlaylist={handleRemoveFromPlaylist}
                    onUploadUserTrack={handleUploadUserTrack}
                    onDeleteUserTrack={handleDeleteUserTrack}
                    onCommentTarget={openCommentTarget}
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
                      onEmergencyStop={handleEmergencyStop}
                      onMinimizeMovie={(movie) => {
                        setMinimizedReel(null);
                        setClipMinimized(false);
                        setClipTheaterOpen(false);
                        setMinimizedMovie(movie);
                        showToast('🍿 Filme minimizado! Continua tocando enquanto você navega.');
                      }}
                      onOpenToguroShop={openToguroShop}
                      onCommentTarget={openCommentTarget}
                      onOpenLiveChat={openLiveChat}
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
                      onEmergencyStop={handleEmergencyStop}
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
                      onCommentTarget={openCommentTarget}
                      onToast={showToast}
                    />
                  )}

                  {activeTab === 'offline' && (
                    <OfflineTravelView
                      currentTrack={currentTrack}
                      isPlaying={isPlaying}
                      offlineTrackIds={offlineTrackIds}
                      onRefreshOfflineIds={() => setOfflineTrackIds(getOfflineTrackIds())}
                      onPlayTrack={(t, q) => void handlePlayTrack(t, 'v1', q)}
                      onPauseMusic={pauseCatalogPlayer}
                      onToast={showToast}
                    />
                  )}

                  {activeTab === 'channels' && (
                    <CreatorChannelsView
                      onOpenLiveChat={(roomId, roomTitle) => openLiveChat(roomId, roomTitle)}
                      onCommentTarget={(targetId, title, ytId) => openCommentTarget(targetId, title, ytId)}
                      onOpenLegalModal={(t = 'charter', title = '') => {
                        setCharterTab(t);
                        setCharterTarget(title);
                        setCharterOpen(true);
                      }}
                      onPauseMusic={pauseCatalogPlayer}
                      onToast={showToast}
                    />
                  )}

                  {activeTab === 'studio' && (
                    <StudioCreateView
                      tracks={tracks}
                      settings={settings}
                      mode={mode}
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

      {/* PERSISTENT MUSIC PLAYER BAR: Shown when not watching full-focus Video Clip or Movie (never 2 overlapping menus!) */}
      {!watchingMovie && currentTrack && musicMenuOpen && !(clipTheaterOpen && !clipMinimized) && (
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
          backgroundMode={backgroundMode}
          onToggleBackgroundMode={() => {
            setBackgroundMode((prev) => {
              const next = !prev;
              showToast(
                next
                  ? '🔋 Modo Tela Apagada ATIVO: continua tocando com o celular bloqueado ou minimizado!'
                  : 'Modo Tela Apagada desativado'
              );
              return next;
            });
          }}
          onEmergencyStop={handleEmergencyStop}
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
                try { const voz = new Audio('/audio/compartilha-crias.mp3'); void voz.play().catch(() => {}); } catch { /* ok */ }
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
          onOpenMediaMenu={() => setMediaPlayerMenuOpen(true)}
          onOpenVisualizer={() => setVisualizerOpen(true)}
          onCommentTrack={(t) =>
            openCommentTarget(`track:${t.id}`, `${t.title} — ${t.artist}`, t.youtubeVideoId)
          }
          onOpenLiveChat={() => openLiveChat('global', '🔥 Geral do Morro · Chat Ao Vivo')}
          onCloseMenu={() => setMusicMenuOpen(false)}
        />
      )}

      {/* CLEAN YOUTUBE-STYLE 5-SLOT MOBILE BOTTOM DOCK (Início, Shorts, Criar, Inscrições, Você) */}
      {!watchingMovie && (
        <nav
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 min-h-[56px] mg24k-taskbar grid grid-cols-5 px-1.5"
        >
          <button
            type="button"
            onClick={() => {
              setActiveYtChip('tudo');
              navigateTab('catalog');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition ${
              !moreSheetOpen && activeTab === 'catalog' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Início"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Início</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveYtChip('shorts');
              navigateTab('reels');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition ${
              !moreSheetOpen && activeTab === 'reels' && shortsTriggerQuery !== '__subscribed__'
                ? 'text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Vibe"
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Vibe</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateMenuOpen(true)}
            className="flex items-center justify-center transition"
            title="Criar"
          >
            <span className="w-10 h-10 rounded-full border border-amber-200/70 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex items-center justify-center text-black shadow-[0_4px_14px_rgba(245,200,76,0.45)] active:scale-90 transition">
              <Plus className="w-5 h-5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShortsTriggerQuery('__subscribed__');
              setShortsTriggerNonce((n) => n + 1);
              navigateTab('reels');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition ${
              !moreSheetOpen && activeTab === 'reels' && shortsTriggerQuery === '__subscribed__'
                ? 'text-amber-300'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Inscrições"
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Inscrições</span>
          </button>

          <button
            type="button"
            onClick={() => setMoreSheetOpen((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition ${
              moreSheetOpen ? 'text-amber-300' : 'text-slate-400 hover:text-white'
            }`}
            title="Você & Mais"
          >
            <span className={`w-6 h-6 rounded-full overflow-hidden border flex items-center justify-center ${
              moreSheetOpen ? 'border-amber-400' : 'border-white/30'
            }`}>
              <img src="/covers/icon-192.png" alt="MORRO GOLD" className="w-full h-full object-cover" />
            </span>
            <span className="text-[10px] font-semibold">Você</span>
          </button>
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
      <CommissionPanel
        open={commissionPanelOpen && mode === 'creator'}
        onClose={() => setCommissionPanelOpen(false)}
        onToast={showToast}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        track={shareTrack}
        settings={settings}
        mode={mode}
        liveStats={liveStats}
        onStatsUpdate={(st) => setLiveStats(st)}
        onSaveSettings={handleSaveSettings}
        onOpenInstallApp={() => void handleInstantInstall()}
        onToast={showToast}
      />
      <LegalTermsModal open={legalOpen} onClose={() => setLegalOpen(false)} />
      <LegalCharterModal
        open={charterOpen}
        onClose={() => setCharterOpen(false)}
        onToast={showToast}
        initialTab={charterTab}
        initialTargetTitle={
          charterTarget ||
          (currentTrack ? `${currentTrack.title} — ${currentTrack.artist}` : '')
        }
      />
      <MobileIosSearchModal
        open={mobileIosSearchOpen}
        query={globalSearch}
        isPrivate={searchViewPrivate}
        suggestions={omniboxSuggestions}
        onChangeQuery={setGlobalSearch}
        onClose={() => setMobileIosSearchOpen(false)}
        onSubmitAll={(q, priv) => openWebSearch(q, priv)}
        onSubmitMusic={(q) => triggerWorldSearchDirect(q)}
        onTogglePrivate={() => setSearchViewPrivate((v) => !v)}
      />
      <WorldLanguageModal
        open={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        currentLang={userLang}
        detectedCountry={detectedCountry}
        onSelectLanguage={(code) => {
          const next = saveUserLanguage(code, true);
          setUserLang(next);
          showToast(`${getLanguageMeta(next).flag} ${getLanguageMeta(next).nativeName}`);
        }}
        onResetAutoDetect={() => {
          try {
            localStorage.removeItem('lenkyx_user_lang_manual_v1');
          } catch {
            // ignore
          }
          const auto = saveUserLanguage(detectVisitorLanguage(), false);
          setUserLang(auto);
          showToast(`🌍 ${getLanguageMeta(auto).nativeName}`);
        }}
      />
      <MediaPlayerMenuModal
        open={mediaPlayerMenuOpen}
        onClose={() => setMediaPlayerMenuOpen(false)}
        track={currentTrack}
        queue={playQueue.length ? playQueue : currentTrack ? [currentTrack] : []}
        isPlaying={isPlaying}
        isCurrentTrackOffline={currentTrack ? offlineTrackIds.has(currentTrack.id) : false}
        isDownloadingOffline={currentTrack ? downloadingIds.has(currentTrack.id) : false}
        downloadPct={downloadProgress?.pct || 0}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        muted={muted}
        bassBoostLevel={bassBoostLevel}
        playbackSpeed={playbackSpeed}
        loopTrack={loopTrack}
        backgroundMode={backgroundMode}
        audioEffect={audioEffect}
        loudMode={loudMode}
        pipOpen={gamingPipOpen}
        sleepMinutesLeft={sleepMinutesLeft}
        onSelectTrack={(t) => void handlePlayTrack(t, 'v1', playQueue.length ? playQueue : [t])}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        onUpdateTrackCover={handleUpdateTrackCover}
        onTogglePlay={() => {
          if (!currentTrack && tracks.length > 0) {
            void handlePlayTrack(tracks[0], 'v1', tracks);
          } else {
            void handleTogglePlay();
          }
        }}
        onPrev={() => handlePrevNext(-1)}
        onNext={() => handlePrevNext(1)}
        onSeek={handleSeek}
        onVolume={handleVolume}
        onToggleMute={handleToggleMute}
        onSetBassBoostLevel={handleSetBassBoostLevel}
        onSetAudioEffect={handleSetAudioEffect}
        onToggleLoudMode={handleToggleLoudMode}
        onCycleSpeed={handleCycleSpeed}
        onToggleLoop={handleToggleLoop}
        onToggleBackgroundMode={() => {
          setBackgroundMode((prev) => {
            const next = !prev;
            showToast(
              next
                ? '📱 2º Plano ATIVO: música continua mesmo com o celular fechado ou tela apagada!'
                : 'Modo 2º Plano desativado'
            );
            return next;
          });
        }}
        onTogglePip={() => {
          void (async () => {
            if (isGamingPipOpen()) {
              await closeGamingFloatingPlayer();
              setGamingPipOpen(false);
              return;
            }
            const pipMode = await openGamingFloatingPlayer(
              {
                title: currentTrack?.title || 'MORRO GOLD Baile VIP',
                artist: currentTrack?.artist || 'MORRO GOLD',
                coverUrl: currentTrack?.coverUrl || '/covers/icon-512.png',
                isPlaying,
              },
              {
                onTogglePlay: () => void handleTogglePlay(),
                onPrev: () => handlePrevNext(-1),
                onNext: () => handlePrevNext(1),
              }
            );
            const ok = pipMode !== 'unsupported';
            setGamingPipOpen(ok);
            if (ok) showToast('🪟 Mini-Player Flutuante ativo por cima dos outros apps!');
            else showToast('Seu navegador já usa os controles nativos na tela bloqueada!');
          })();
        }}
        onSetSleepMinutes={(minutes) => {
          if (!minutes) {
            setSleepEndAt(null);
            setSleepMinutesLeft(null);
            showToast('⏰ Temporizador desligado');
          } else {
            setSleepEndAt(Date.now() + minutes * 60 * 1000);
            setSleepMinutesLeft(minutes);
            showToast(`⏰ Música vai parar automaticamente em ${minutes} minutos`);
          }
        }}
        onToggleOffline={(t) => void handleToggleOffline(t)}
        onDownloadFile={(t) => void handleDownloadTrackFile(t)}
        onEmergencyStop={handleEmergencyStop}
      />
      <AudioVisualizerModal
        open={visualizerOpen}
        onClose={() => setVisualizerOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        analyser={audioAnalyserRef.current}
        onTogglePlay={() => {
          if (!currentTrack && tracks.length > 0) {
            void handlePlayTrack(tracks[0], 'v1', tracks);
          } else {
            void handleTogglePlay();
          }
        }}
        onPrev={() => handlePrevNext(-1)}
        onNext={() => handlePrevNext(1)}
      />

      {/* LIVE DOWNLOAD PROGRESS PILL (Visible across all screens immediately on any download) */}
      {downloadProgress && (
        <div className="fixed top-16 right-3 z-[80] w-64 rounded-2xl bg-[#0e0722]/95 backdrop-blur-xl border border-cyan-400/50 p-3 shadow-[0_12px_40px_rgba(34,211,238,0.3)] space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-black text-white">
            <span className="truncate">⬇️ {downloadProgress.label}</span>
            <span className="text-cyan-300 shrink-0 tabular-nums">{downloadProgress.pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-pink-500 transition-all duration-150"
              style={{ width: `${downloadProgress.pct}%` }}
            />
          </div>
        </div>
      )}
      <GamingMusicModeModal
        open={gamingModalOpen}
        onClose={() => setGamingModalOpen(false)}
        gamingModeEnabled={gamingModeEnabled}
        fpsBoostEnabled={fpsBoostEnabled}
        pipOpen={gamingPipOpen}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onToggleGamingMode={(enabled) => {
          setGamingModeEnabled(enabled);
          if (enabled) setBackgroundMode(true);
          showToast(
            enabled
              ? '🎮 Modo Jogos ativado! Som continua ativo mesmo abrindo jogos no celular e PC.'
              : 'Modo Jogos desativado.'
          );
        }}
        onToggleFpsBoost={(enabled) => {
          setFpsBoostEnabled(enabled);
          showToast(enabled ? '⚡ Boost de FPS ativo para jogos sem travar!' : 'Boost de FPS desativado.');
        }}
        onLaunchFloatingPlayer={async () => {
          const trackToUse = currentTrack || allTracksPool[0] || null;
          if (trackToUse && !currentTrack) {
            await handlePlayTrack(trackToUse, 'v1', allTracksPool);
          }
          const res = await openGamingFloatingPlayer(
            {
              title: trackToUse?.title || 'MORRO GOLD Baile VIP',
              artist: trackToUse?.artist || 'MORRO GOLD',
              coverUrl: trackToUse?.coverUrl || '/covers/icon-512.png',
              isPlaying: true,
            },
            {
              onTogglePlay: () => void handleTogglePlay(),
              onPrev: () => handlePrevNext(-1),
              onNext: () => handlePrevNext(1),
            }
          );
          setGamingPipOpen(isGamingPipOpen());
          if (res === 'unsupported') {
            showToast('🎵 Modo Jogos ativo em segundo plano! Minimize e abra seu jogo.');
          } else {
            showToast('🎮 Mini-Player flutuante aberto por cima dos jogos!');
          }
        }}
        onCloseFloatingPlayer={async () => {
          await closeGamingFloatingPlayer();
          setGamingPipOpen(false);
        }}
        onQuickPlayStart={() => {
          const target = currentTrack || allTracksPool[0];
          if (target) {
            if (!currentTrack) void handlePlayTrack(target, 'v1', allTracksPool);
            else if (!isPlaying) void handleTogglePlay();
          }
        }}
        onOpenTvCast={() => {
          setInstallPlatformTab('tv');
          setInstallModalOpen(true);
        }}
      />

      {/* OFFICIAL SITE, VERIFIED SECURITY BADGE & PC / MOBILE APP DOWNLOAD MODAL */}
      {installModalOpen && (
        <div
          onClick={() => setInstallModalOpen(false)}
          className="fixed inset-0 z-[9996] bg-black/85 backdrop-blur-lg flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-emerald-400/45 bg-[#080417] shadow-[0_0_80px_rgba(16,185,129,0.28)] overflow-hidden my-auto max-h-[92dvh] overflow-y-auto"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500" />
            <div className="p-5 space-y-4">
              {/* Official Brand Clean Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <LenkyxEdgeLogo size="md" className="shrink-0" />
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/45 text-[10px] font-black text-emerald-300 mb-1">
                      <CheckCircle2 className="w-3 h-3" /> OFICIAL · 100% SEGURO & VERIFICADO
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-black text-white leading-tight">
                      App & Versão Web MORRO GOLD
                    </h3>
                    <p className="text-[11px] text-cyan-200/85 font-semibold">
                      Disponível para Android, iPhone (iOS), PC & Smart TV
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInstallModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Auto-Detected Global Language & Gaming Compatibility Banner */}
              <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/30 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-cyan-100 font-bold">
                  <span>{getLanguageMeta(userLang).flag}</span>
                  <span>
                    Idioma Automático: <strong>{getLanguageMeta(userLang).nativeName}</strong>
                    {detectedCountry ? ` (${detectedCountry})` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLangModalOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-black text-cyan-200"
                >
                  🌍 100+ Idiomas
                </button>
              </div>

              {/* 4-Platform Availability Strip (Android + iPhone + PC + TV) */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setInstallPlatformTab('mobile')}
                  className="py-1.5 px-2 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-center"
                >
                  <div className="text-xs">🤖</div>
                  <div className="text-[10px] font-black text-emerald-200">Android</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInstallPlatformTab('mobile')}
                  className="py-1.5 px-2 rounded-xl bg-pink-500/15 border border-pink-400/35 text-center"
                >
                  <div className="text-xs">🍎</div>
                  <div className="text-[10px] font-black text-pink-200">iPhone iOS</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInstallPlatformTab('pc')}
                  className="py-1.5 px-2 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-center"
                >
                  <div className="text-xs">💻</div>
                  <div className="text-[10px] font-black text-cyan-200">PC / Mac</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInstallPlatformTab('tv')}
                  className="py-1.5 px-2 rounded-xl bg-purple-500/15 border border-purple-400/35 text-center"
                >
                  <div className="text-xs">📺</div>
                  <div className="text-[10px] font-black text-purple-200">Smart TV</div>
                </button>
              </div>

              {/* Official Verified Security Guarantee */}
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/35 p-3.5 space-y-2 text-xs text-slate-100">
                <div className="font-black text-emerald-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-300" /> Selo de Segurança Oficial MORRO GOLD
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-purple-100/95">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Aplicativo Oficial Verificado
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 100% Seguro e Livre de Vírus
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Zero Anúncios & Zero Cadastro
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Sempre Atualizado (v3.3 3D)
                  </span>
                </div>
              </div>

              {/* Official Website URL Bar */}
              <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5" /> Endereço do Site Oficial MORRO GOLD
                  </span>
                  <a
                    href={officialSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-emerald-300 hover:underline flex items-center gap-1"
                  >
                    Abrir Site <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={officialSiteUrl}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-black/55 border border-white/10 text-[11px] text-cyan-200 font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void copyTextReliable(officialSiteUrl).then((ok) => {
                        if (ok) showToast('Link do Site Oficial copiado!');
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-300" /> Copiar
                  </button>
                </div>
              </div>

              {/* Platform Switcher: PC / Mobile / TV */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.05] border border-white/10">
                <button
                  type="button"
                  onClick={() => setInstallPlatformTab('pc')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                    installPlatformTab === 'pc'
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> PC / Notebook
                </button>
                <button
                  type="button"
                  onClick={() => setInstallPlatformTab('mobile')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                    installPlatformTab === 'mobile'
                      ? 'bg-gradient-to-r from-pink-500 to-cyan-400 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Celular
                </button>
                <button
                  type="button"
                  onClick={() => setInstallPlatformTab('tv')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                    installPlatformTab === 'tv'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" /> Smart TV
                </button>
              </div>

              {installPlatformTab === 'pc' && (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => void handleOneClickPcDownload()}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(34,211,238,0.45)]"
                  >
                    <Download className="w-4 h-4" /> Baixar e Instalar no PC (1 Clique)
                  </button>

                  <a
                    href="/download/pc"
                    download="MORRO-GOLD-App-PC.zip"
                    onClick={() => showToast('Download oficial do App MORRO GOLD para PC iniciado! 💻🚀')}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:brightness-110 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(34,211,238,0.38)] transition"
                  >
                    <Download className="w-4 h-4" /> Baixar Aplicativo para PC (Windows / Mac .ZIP)
                  </a>

                  <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 space-y-1.5 text-[11px] text-slate-200 leading-relaxed">
                    <div className="font-black text-cyan-300">Instalação Rápida em 1 Clique (App Original · Sem Atalhos):</div>
                    <p>
                      • Clique no botão acima para instalar ou baixar o aplicativo oficial <strong className="text-amber-300">MORRO GOLD</strong> direto no seu computador sem criar atalhos.
                    </p>
                  </div>
                </div>
              )}

              {installPlatformTab === 'mobile' && (
                <div className="space-y-2.5 text-xs">
                  {deferredInstallPrompt && (
                    <button
                      type="button"
                      onClick={() => void handleInstantInstall()}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(52,211,153,0.45)]"
                    >
                      <Zap className="w-4 h-4" /> Baixar & Instalar Agora (Qualquer Celular)
                    </button>
                  )}

                  {isInAppWebView && isAndroidDevice && (
                    <a
                      href={`intent://${officialSiteUrl.replace(/^https?:\/\//, '')}/?install=1#Intent;scheme=https;package=com.android.chrome;end`}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4" /> Abrir Direto no Chrome (Sem Restrições)
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setInstallModalOpen(false);
                      showToast('App MORRO GOLD liberado direto no seu celular sem restrições! 🎧');
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500/25 to-cyan-500/25 hover:brightness-110 border border-cyan-400/40 text-white font-black text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Abrir App Direto Aqui (Qualquer Celular · Zero Restrições)
                  </button>

                  <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 space-y-1">
                    <div className="font-black text-cyan-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> Android (Samsung, Xiaomi, Motorola, Huawei, qualquer modelo)
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Toque no menu <strong>(⋮ ou ≡)</strong> e escolha{' '}
                      <strong className="text-emerald-300">"Instalar aplicativo"</strong> ou{' '}
                      <strong className="text-emerald-300">"Adicionar à tela inicial"</strong>. Funciona em qualquer celular sem bloqueio!
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 space-y-1">
                    <div className="font-black text-pink-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> iPhone / iPad (iOS Safari)
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Toque em <strong>Compartilhar (↑)</strong> →{' '}
                      <strong className="text-pink-300">"Adicionar à Tela de Início"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {installPlatformTab === 'tv' && (
                <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 space-y-2.5 text-[11px] text-slate-200 leading-relaxed">
                  <div className="font-black text-purple-300 flex items-center gap-1.5">
                    <Tv className="w-4 h-4" /> Qualquer Smart TV (LG, Samsung, Android TV, TV Box)
                  </div>
                  <a
                    href="/?tvMode=1"
                    onClick={() => setInstallModalOpen(false)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Tv className="w-4 h-4" /> Abrir Modo Smart TV Tela Cheia Agora
                  </a>
                  <p>
                    Ou abra no navegador da TV o endereço direto:
                  </p>
                  <div className="px-3 py-2 rounded-xl bg-black/60 border border-purple-400/35 font-mono text-cyan-200 text-xs select-all">
                    {officialSiteUrl}/tv
                  </div>
                  <p className="text-slate-300">
                    Funciona em qualquer Smart TV sem precisar baixar nada da loja — músicas, clipes, cinema e Arena ao vivo!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MINIMIZED REELS PiP (keeps playing while navigating platform!) */}
      {minimizedReel && (
        <div
          {...reelDrag.dragHandlers}
          style={reelDrag.style}
          className="fixed bottom-16 md:bottom-4 right-3 z-[88] w-60 sm:w-64 rounded-2xl overflow-hidden bg-[#080514] border border-amber-400/55 shadow-[0_14px_45px_rgba(0,0,0,0.92)] cursor-move select-none"
        >
          <div className="px-2.5 py-1.5 bg-black/85 border-b border-white/10 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black text-amber-300 truncate">
              🎬 Vibe · {minimizedReel.title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMinimizedReel(null);
                  setReelsAction('shorts');
                  setReelsActionNonce((n) => n + 1);
                  navigateTab('reels');
                }}
                className="px-2 py-0.5 rounded-md bg-cyan-400/20 hover:bg-cyan-400 hover:text-black text-[10px] font-black text-cyan-200 transition"
                title="Aumentar Vibe"
              >
                ⤢ Aumentar
              </button>
              <button
                type="button"
                onClick={() => setMinimizedReel(null)}
                className="p-1 rounded-md bg-rose-600/80 hover:bg-rose-500 text-white"
                title="Fechar Vibe"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="aspect-[9/12] max-h-56 w-full bg-black">
            {minimizedReel.videoUrl && !minimizedReel.youtubeVideoId ? (
              <video
                src={minimizedReel.videoUrl}
                autoPlay
                loop
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            ) : minimizedReel.youtubeVideoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${minimizedReel.youtubeVideoId}?autoplay=1&loop=1&playlist=${minimizedReel.youtubeVideoId}&playsinline=1&rel=0`}
                title={minimizedReel.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full border-0"
              />
            ) : null}
          </div>
        </div>
      )}

      {/* FLOATING MINIMIZED MOVIE / VIDEO PiP (keeps playing while navigating platform!) */}
      {minimizedMovie && (
        <div
          {...movieDrag.dragHandlers}
          style={movieDrag.style}
          className="fixed bottom-16 md:bottom-4 right-3 z-[88] w-72 sm:w-80 rounded-2xl overflow-hidden bg-[#080514] border border-cyan-400/55 shadow-[0_14px_45px_rgba(0,0,0,0.92)] cursor-move select-none"
        >
          <div className="px-2.5 py-1.5 bg-black/85 border-b border-white/10 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black text-cyan-200 truncate">
              🍿 {minimizedMovie.title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const m = minimizedMovie;
                  setMinimizedMovie(null);
                  setPendingMovie(m);
                  navigateTab('movies');
                }}
                className="px-2 py-0.5 rounded-md bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-black transition"
                title="Aumentar Filme"
              >
                ⤢ Aumentar
              </button>
              <button
                type="button"
                onClick={() => setMinimizedMovie(null)}
                className="p-1 rounded-md bg-rose-600/80 hover:bg-rose-500 text-white"
                title="Fechar Vídeo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="aspect-video w-full bg-black">
            {minimizedMovie.videoStreamUrl && !minimizedMovie.youtubeVideoId && !minimizedMovie.youtubePlaylistId ? (
              <video
                src={minimizedMovie.videoStreamUrl}
                autoPlay
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={
                  minimizedMovie.youtubePlaylistId
                    ? `https://www.youtube.com/embed/videoseries?list=${minimizedMovie.youtubePlaylistId}&autoplay=1&rel=0&playsinline=1`
                    : minimizedMovie.youtubeVideoId
                      ? `https://www.youtube.com/embed/${minimizedMovie.youtubeVideoId}?autoplay=1&rel=0&playsinline=1`
                      : minimizedMovie.videoStreamUrl || ''
                }
                title={minimizedMovie.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>
      )}

      {/* CLIP THEATER (with Minimize floating PiP + clean Expand/Close controls) */}
      <div
        onClick={(e) => {
          if (clipTheaterOpen && !clipMinimized && e.target === e.currentTarget) setClipTheaterOpen(false);
        }}
        {...(clipMinimized ? clipDrag.dragHandlers : {})}
        style={clipMinimized ? clipDrag.style : undefined}
        className={
          clipTheaterOpen && currentTrack?.youtubeVideoId
            ? clipMinimized
              ? 'fixed bottom-16 md:bottom-4 right-3 z-[92] w-72 sm:w-80 shadow-[0_14px_45px_rgba(0,0,0,0.92)] cursor-move select-none'
              : `fixed inset-0 z-[9995] bg-black flex items-center justify-center ${
                  clipFitMode === 'fullscreen' ? 'p-0' : 'p-0 sm:p-4'
                }`
            : 'fixed bottom-0 right-0 w-[220px] h-[140px] opacity-[0.02] pointer-events-none z-0 overflow-hidden'
        }
      >
        <div
          ref={clipStageRef}
          className={
            clipTheaterOpen && currentTrack?.youtubeVideoId
              ? clipMinimized
                ? 'relative w-full flex flex-col overflow-hidden bg-[#090418] border border-amber-400/55 rounded-2xl'
                : `w-full flex flex-col overflow-hidden bg-[#090418] border border-cyan-400/40 shadow-[0_0_70px_rgba(236,72,153,0.35)] relative ${
                    clipFitMode === 'fullscreen' || isNativeFullscreen
                      ? 'h-[100dvh] max-w-none rounded-none border-0'
                      : clipFitMode === 'compact'
                        ? 'max-w-2xl max-h-[85dvh] rounded-3xl'
                        : 'max-w-5xl h-[100dvh] sm:h-[92dvh] sm:rounded-3xl'
                  }`
              : 'w-full h-full'
          }
        >




          <div
            ref={clipStageBoxRef}
            onClick={() => {
              if (clipTheaterOpen && !clipMinimized) clipChrome.toggle();
            }}
            className={
              clipTheaterOpen
                ? clipMinimized
                  ? 'aspect-video w-full bg-black relative overflow-hidden'
                  : 'flex-1 min-h-0 w-full bg-black relative overflow-hidden'
                : 'w-full h-full bg-black relative'
            }
          >
            {/* Video preenche toda a janela */}
            <div className="absolute inset-0 w-full h-full bg-black">
              <div id="lenkyx-yt-audio-host" className="w-full h-full" />
            </div>

          </div>

          {/* Casinha transparente — unico botao: volta pra home, musica continua */}
          {clipTheaterOpen && currentTrack?.youtubeVideoId && (
            <button
              type="button"
              onClick={() => {
                setClipMinimized(false);
                setClipTheaterOpen(false);
                navigateTab('catalog');
                showToast('🎬 Voltou pro app — o clipe continua tocando no player.');
              }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[60] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-[2px] flex items-center justify-center text-white/85 active:scale-90 transition"
              title="Início"
            >
              <span className="text-[22px] leading-none select-none">🏠</span>
            </button>
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

      {/* === BOTÃO + CRIAR (REEL, LIVE HD, CHAT AO VIVO, MÚSICA IA) === */}
      {createMenuOpen && (
        <div
          onClick={() => setCreateMenuOpen(false)}
          className="fixed inset-0 z-[9995] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#090318]/98 border border-cyan-400/40 p-5 space-y-3 shadow-[0_0_70px_rgba(236,72,153,0.35)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-400 text-white flex items-center justify-center shadow">
                  <Plus className="w-5 h-5 stroke-[2.8]" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-black text-white">Criar & Transmitir no MORRO GOLD</h3>
                  <p className="text-[11px] text-cyan-200/80">100% liberado — Vibe, Lives, Chats & Músicas IA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateMenuOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  navigateTab('channels');
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/25 to-yellow-500/20 hover:from-amber-500/40 hover:to-yellow-500/35 border border-amber-400/45 flex items-center gap-3 text-left transition"
              >
                <span className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0">
                  <Tv className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white">📺 Criar / Abrir Meu Canal (Igual YouTube)</div>
                  <div className="text-[11px] text-amber-200/85">Canal próprio com banner, @arroba, vídeos e Lei da Favela</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  setReelsAction('create_reel');
                  setReelsActionNonce((n) => n + 1);
                  navigateTab('reels');
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/35 hover:to-cyan-500/35 border border-emerald-400/40 flex items-center gap-3 text-left transition"
              >
                <span className="w-10 h-10 rounded-xl bg-emerald-400 text-black flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white">📹 Criar Conteúdo no Vibe (Vídeo Curto)</div>
                  <div className="text-[11px] text-emerald-200/80">Suba ou poste seu Vibe no feed global agora</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  setReelsAction('go_live');
                  setReelsActionNonce((n) => n + 1);
                  navigateTab('reels');
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/25 to-pink-500/25 hover:from-rose-500/40 hover:to-pink-500/40 border border-rose-400/45 flex items-center gap-3 text-left transition"
              >
                <span className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white">🔴 Fazer Live HD Agora</div>
                  <div className="text-[11px] text-rose-200/80">Câmera HD corrigida, efeitos cósmicos e chat ao vivo</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  setChatModalOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-cyan-400/30 flex items-center gap-3 text-left transition"
              >
                <span className="w-10 h-10 rounded-xl bg-cyan-400 text-black flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white">💬 Chat Espacial & Comentários</div>
                  <div className="text-[11px] text-cyan-200/80">Converse livremente com fãs e criadores ao vivo</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  navigateTab('studio');
                }}
                className="w-full p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-purple-400/30 flex items-center gap-3 text-left transition"
              >
                <span className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0">
                  <Wand2 className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white">🤖 Criar Música / Studio IA</div>
                  <div className="text-[11px] text-purple-200/80">Gere beats, capas e áudios profissionais no MORRO GOLD</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <CommunityChatModal
        open={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        user={null}
        roomId={chatRoom.id}
        roomTitle={chatRoom.title}
        onOpenAuth={() => {
          setChatModalOpen(false);
          showToast('💬 Chat liberado para todos! Digite sua mensagem abaixo.');
        }}
      />

      <TargetCommentsModal
        open={Boolean(commentTarget)}
        onClose={() => setCommentTarget(null)}
        targetId={commentTarget?.id || ''}
        targetTitle={commentTarget?.title || ''}
        youtubeId={commentTarget?.youtubeId || ''}
        user={null}
      />

      <LyricsKaraokeModal
        track={lyricsTrack}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onSeek={handleSeek}
        onClose={() => setLyricsTrack(null)}
      />

      <FuturisticFeaturesModal
        open={futuristicModalOpen}
        initialTab={futuristicTab}
        initialJamCode={initialJamCode}
        user={null}
        tracks={allTracksPool}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        officialSiteUrl={officialSiteUrl}
        onClose={() => setFuturisticModalOpen(false)}
        onPlayTrack={(t) => void handlePlayTrack(t, 'v1', allTracksPool)}
        onSearchWorld={triggerWorldSearchDirect}
        onOpenBrCreatorShorts={(q, label) => {
          setShortsTriggerQuery(q);
          setShortsTriggerNonce((n) => n + 1);
          navigateTab('reels');
          showToast(`🔥 Puxando ${label}!`);
        }}
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

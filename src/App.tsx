import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Music,
  Disc3,
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
  Smartphone,
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
import { CatalogView } from './components/CatalogView';
import { WorldExploreView } from './components/WorldExploreView';
import { PlaylistsView } from './components/PlaylistsView';
import { DJMixerView } from './components/DJMixerView';
import { VideoStudioView } from './components/VideoStudioView';
import { StudioCreateView } from './components/StudioCreateView';
import { MiniPlayer } from './components/MiniPlayer';
import { PixModal } from './components/PixModal';
import { ShareModal } from './components/ShareModal';
import { UploadTrackModal } from './components/UploadTrackModal';
import { CreatorModal } from './components/CreatorModal';
import { UserAuthModal } from './components/UserAuthModal';
import { authFetch, setAuthToken } from './utils/api';
import { djEngine } from './audio/djEngine';
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
  pixKey: '2342f59b-02a2-403e-bb0e-2b5c4d2e997e',
  pixKeyConfigured: true,
  pixName: 'LENKYX COSMIC PHONK',
  pixCity: 'CAMPO GRANDE',
  pixMessage: 'Apoio LENKYX Cosmic Phonk',
  publicUrl: 'https://lenkyx-cosmic-phonk.onrender.com',
  apkDownloadUrl: 'https://drive.google.com/uc?id=109-i00UMsMlBY_RcrVvng-oHiW0cXwFZ&export=download',
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

  // Global search bar state (Spotify / YouTube Music top bar)
  const [globalSearch, setGlobalSearch] = useState('');
  const [worldTriggerQuery, setWorldTriggerQuery] = useState('');

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

  // Global Player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [activeVersion, setActiveVersion] = useState<AudioVersion>('v1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.88);
  const [playQueue, setPlayQueue] = useState<Track[]>([]);

  // Cross-tab context
  const [djDeckA, setDjDeckA] = useState<Track | null>(null);
  const [djDeckB, setDjDeckB] = useState<Track | null>(null);
  const [videoTrack, setVideoTrack] = useState<Track | null>(null);

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

  const pauseCatalogPlayer = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const handlePlayTrack = useCallback(
    async (track: Track, requestedVersion?: AudioVersion, customQueue?: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (track.source === 'world_full' || track.source === 'world_preview') {
        setWorldCacheTracks((prev) => (prev.some((x) => x.id === track.id) ? prev : [track, ...prev].slice(0, 60)));
      }
      if (customQueue && customQueue.length > 0) {
        setPlayQueue(customQueue);
      }

      const targetVersion: AudioVersion =
        requestedVersion || (currentTrack?.id === track.id ? activeVersion : 'v1');
      const finalVersion: AudioVersion = targetVersion === 'v2' && track.audioUrlV2 ? 'v2' : 'v1';

      if (currentTrack?.id === track.id && activeVersion === finalVersion && !requestedVersion) {
        if (audio.paused) {
          djEngine.pauseDeck('A');
          djEngine.pauseDeck('B');
          await audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        return;
      }

      djEngine.pauseDeck('A');
      djEngine.pauseDeck('B');
      setCurrentTrack(track);
      setActiveVersion(finalVersion);

      const resolved = await resolvePlayableAudioUrl(track, finalVersion);
      setIsPlayingFromOffline(resolved.fromOffline);
      audio.src = resolved.url;
      audio.load();
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
    [currentTrack?.id, activeVersion, showToast]
  );

  // Offline download toggle (single track) & Download All
  const handleToggleOffline = useCallback(
    async (track: Track) => {
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

  // Auto-next when song ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const list = playQueue.length ? playQueue : tracks;
      if (!currentTrack || list.length === 0) return;
      const idx = list.findIndex((t) => t.id === currentTrack.id);
      const next = list[(idx + 1) % list.length];
      if (next) void handlePlayTrack(next, 'v1', list);
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [currentTrack, playQueue, tracks, handlePlayTrack]);

  const handleSelectVersion = (ver: AudioVersion) => {
    if (!currentTrack) return;
    if (ver === 'v2' && !currentTrack.audioUrlV2) return;
    void handlePlayTrack(currentTrack, ver);
  };

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (!audio.src) {
      await handlePlayTrack(currentTrack, activeVersion);
      return;
    }
    if (audio.paused) {
      djEngine.pauseDeck('A');
      djEngine.pauseDeck('B');
      await audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const handlePrevNext = useCallback(
    (dir: -1 | 1) => {
      const list = playQueue.length ? playQueue : tracks;
      if (!list.length) return;
      const idx = currentTrack ? list.findIndex((t) => t.id === currentTrack.id) : 0;
      const nextIdx = (idx + dir + list.length) % list.length;
      void handlePlayTrack(list[nextIdx], 'v1', list);
    },
    [playQueue, tracks, currentTrack, handlePlayTrack]
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
      const audio = audioRef.current;
      if (action === 'prev') {
        handlePrevNext(-1);
      } else if (action === 'next') {
        handlePrevNext(1);
      } else if (action === 'play') {
        if (audio && audio.paused) void audio.play().catch(() => {});
      } else if (action === 'pause') {
        if (audio && !audio.paused) audio.pause();
      } else if (action === 'toggle') {
        void handleTogglePlay();
      }
    };
    return () => {
      delete window.__lenkyxMediaAction;
    };
  }, [handlePrevNext]);

  const handleSeek = (t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
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
    if (activeTab === 'video' || activeTab === 'studio') setActiveTab('catalog');
    showToast('Modo Fã ativado.');
  };

  const handleSendToDJ = (track: Track, deck: 'A' | 'B') => {
    if (track.source === 'world_full' || track.source === 'world_preview') {
      setWorldCacheTracks((prev) => (prev.some((x) => x.id === track.id) ? prev : [track, ...prev].slice(0, 60)));
    }
    if (deck === 'A') setDjDeckA(track);
    else setDjDeckB(track);
    setActiveTab('dj');
    showToast(`🎛️ "${track.title}" carregada no Deck ${deck}!`);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      setWorldTriggerQuery(globalSearch.trim());
      setActiveTab('explore');
    }
  };

  const sidebarMain: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'catalog', label: 'Início · LENKYX', icon: <Music className="w-4 h-4" /> },
    { id: 'explore', label: 'Explorar Mundo', icon: <Globe2 className="w-4 h-4" /> },
    { id: 'playlists', label: 'Minhas Playlists', icon: <ListMusic className="w-4 h-4" /> },
    { id: 'dj', label: 'Mesa de DJ Pro', icon: <Disc3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#070412] text-white flex">
      {/* === DESKTOP SPOTIFY / YOUTUBE MUSIC LEFT SIDEBAR === */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 fixed inset-y-0 left-0 z-30 bg-[#090515] border-r border-white/10">
        {/* Brand Logo (tap 5x secretly for Creator access) */}
        <div
          onClick={handleBrandTap}
          className="h-14 px-4 flex items-center gap-2.5 border-b border-white/10 cursor-pointer hover:bg-white/[0.03] select-none"
        >
          <img
            src="/covers/avatar.jpg"
            alt="LENKYX"
            className="w-8 h-8 rounded-full border border-pink-500 object-cover shadow-[0_0_12px_rgba(236,72,153,0.5)]"
          />
          <div className="leading-tight min-w-0">
            <div className="font-display text-sm font-black tracking-wider text-white">LENKYX</div>
            <div className="text-[9px] font-bold tracking-[0.18em] text-cyan-300 truncate">COSMIC PHONK</div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          <nav className="space-y-1">
            {sidebarMain.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                    active
                      ? 'bg-gradient-to-r from-pink-500/25 to-cyan-500/20 text-white border border-pink-500/35'
                      : 'text-purple-200/80 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={active ? 'text-pink-400' : 'text-purple-300/75'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Creator Tools (Visible when Creator unlocked) */}
          {mode === 'creator' && (
            <div className="space-y-1 pt-2 border-t border-white/10">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-pink-300/80 mb-1">
                Estúdio Criador
              </div>
              <button
                onClick={() => setActiveTab('video')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                  activeTab === 'video'
                    ? 'bg-pink-500/25 text-white border border-pink-500/40'
                    : 'text-purple-200/80 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Video className="w-4 h-4 text-red-400" />
                <span>Estúdio YouTube</span>
              </button>
              <button
                onClick={() => setActiveTab('studio')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                  activeTab === 'studio'
                    ? 'bg-cyan-500/25 text-white border border-cyan-400/40'
                    : 'text-purple-200/80 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Wand2 className="w-4 h-4 text-cyan-300" />
                <span>Suno × DistroKid</span>
              </button>
            </div>
          )}

          {/* Playlists Quick List (Spotify Style) */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            <div className="px-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-purple-300/65 mb-1">
              <span>Suas Playlists</span>
              <button
                onClick={() => setActiveTab('playlists')}
                className="text-cyan-300 hover:underline normal-case font-bold"
              >
                + Nova
              </button>
            </div>
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setActiveTab('playlists')}
                className="w-full px-3 py-1.5 rounded-lg hover:bg-white/[0.06] text-left text-xs text-purple-200/85 hover:text-white flex items-center justify-between gap-2 transition"
              >
                <span className="truncate">
                  {pl.emoji} {pl.name}
                </span>
                <span className="text-[10px] text-purple-300/55 shrink-0">{pl.trackIds.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Download App + Share + PIX + Creator */}
        <div className="p-2.5 pb-20 border-t border-white/10 space-y-1.5">
          {!isAndroidApk() && (
            <a
              href={settings.apkDownloadUrl || '/download/apk'}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow transition"
            >
              <Smartphone className="w-3.5 h-3.5" /> Baixar App Android
            </a>
          )}
          <button
            onClick={() => {
              setShareTrack(null);
              setShareOpen(true);
            }}
            className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Indicar no WhatsApp
          </button>
          <button
            onClick={() => {
              setPixInitialTab('donate');
              setPixOpen(true);
            }}
            className="w-full py-2 px-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/35 text-pink-200 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" /> Apoiar via PIX
          </button>
          {mode === 'creator' && (
            <button
              onClick={() => setCreatorModalOpen(true)}
              className="w-full py-1.5 px-2 rounded-xl border bg-emerald-500/20 border-emerald-400/40 text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Painel Criador
            </button>
          )}
        </div>
      </aside>

      {/* === MAIN CONTENT SHELL === */}
      <div className="flex-1 md:pl-56 lg:pl-60 min-w-0 flex flex-col min-h-screen">
        {/* SLIM TOP HEADER WITH GLOBAL WORLD SEARCH BAR (YouTube Music / Spotify Style) */}
        <header className="sticky top-0 z-30 h-14 bg-[#070412]/90 backdrop-blur-xl border-b border-white/10 px-3 sm:px-5 flex items-center justify-between gap-2.5">
          {/* Mobile Brand Mini (tap 5x secretly for Creator access) */}
          <div
            onClick={handleBrandTap}
            className="flex md:hidden items-center gap-1.5 shrink-0 cursor-pointer select-none"
          >
            <img src="/covers/avatar.jpg" alt="LENKYX" className="w-7 h-7 rounded-full border border-pink-500" />
            <span className="font-display text-xs font-black">LENKYX</span>
          </div>

          {/* GLOBAL SEARCH BAR — filters catalog OR searches worldwide music! */}
          <form onSubmit={handleGlobalSearchSubmit} className="flex-1 max-w-xl relative flex items-center">
            <Search className="w-4 h-4 text-purple-300/70 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar músicas LENKYX ou qualquer artista do mundo..."
              className="w-full pl-9 pr-24 sm:pr-28 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.1] focus:bg-white/[0.12] border border-white/10 focus:border-cyan-400/50 text-xs sm:text-sm text-white placeholder-purple-300/60 focus:outline-none transition"
            />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-[10px] font-extrabold flex items-center gap-1 hover:brightness-110 transition"
              title="Pesquisar músicas do mundo inteiro"
            >
              <Globe2 className="w-3 h-3" />
              <span className="hidden sm:inline">Mundo</span>
            </button>
          </form>

          {/* Right User / Fan Auth & Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isAndroidApk() && (
              <a
                href={settings.apkDownloadUrl || '/download/apk'}
                target="_blank"
                rel="noreferrer"
                className="md:hidden px-2.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-[11px] font-black flex items-center gap-1 shadow"
                title="Baixar App Android (APK)"
              >
                <Smartphone className="w-3.5 h-3.5" /> App
              </a>
            )}
            <button
              onClick={() => {
                setShareTrack(null);
                setShareOpen(true);
              }}
              className="md:hidden p-2 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-300"
              title="Compartilhar no WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            {userProfile ? (
              <button
                onClick={() => setUserAuthOpen(true)}
                className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition"
              >
                <span
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${userProfile.avatarColor} text-[11px] font-black text-white flex items-center justify-center`}
                >
                  {userProfile.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xs font-bold text-white max-w-[90px] truncate hidden sm:inline">
                  {userProfile.name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setUserAuthOpen(true)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-purple-100 text-black text-xs font-extrabold flex items-center gap-1.5 shadow transition"
              >
                <UserCircle2 className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {mode === 'creator' && (
              <button
                onClick={() => void handleCreatorLogout()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/25"
                title="Voltar ao Modo Fã"
              >
                <Sparkles className="w-3 h-3" /> <span className="hidden sm:inline">CRIADOR</span>
                <LogOut className="w-3 h-3 ml-0.5 opacity-75" />
              </button>
            )}
          </div>
        </header>

        {/* ACTIVE VIEW CONTAINER (clean Spotify proportions) */}
        <main className="flex-1 w-full max-w-[1380px] mx-auto px-3 sm:px-5 pt-4">
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
                  onSendToDJ={handleSendToDJ}
                  onSendToVideo={(t) => {
                    setVideoTrack(t);
                    setActiveTab('video');
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
                  onToast={showToast}
                />
              )}

              {activeTab === 'explore' && (
                <WorldExploreView
                  initialQuery={worldTriggerQuery || globalSearch}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  playlists={playlists}
                  onPlayTrack={(t) => void handlePlayTrack(t, 'v1')}
                  onAddToPlaylist={addTrackToPlaylist}
                  onSendToDJ={handleSendToDJ}
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
                  onPlayTrack={(t) => void handlePlayTrack(t, 'v1')}
                  onCreatePlaylist={handleCreatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  onRemoveFromPlaylist={handleRemoveFromPlaylist}
                  onUploadUserTrack={handleUploadUserTrack}
                  onDeleteUserTrack={handleDeleteUserTrack}
                  onSendToDJ={handleSendToDJ}
                  onOpenUserAuth={() => setUserAuthOpen(true)}
                />
              )}

              {activeTab === 'dj' && (
                <DJMixerView
                  tracks={allTracksPool}
                  isCreator={mode === 'creator'}
                  initialDeckA={djDeckA}
                  initialDeckB={djDeckB}
                  onPauseCatalogPlayer={pauseCatalogPlayer}
                  onMixSaved={handleTrackSaved}
                  onToast={showToast}
                />
              )}

              {activeTab === 'video' && mode === 'creator' && (
                <VideoStudioView
                  tracks={tracks}
                  initialTrack={videoTrack || currentTrack}
                  onPauseCatalogPlayer={pauseCatalogPlayer}
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
            </>
          )}
        </main>
      </div>

      {/* PERSISTENT COMPACT SPOTIFY MINI PLAYER */}
      {activeTab !== 'dj' && (
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
          onTogglePlay={() => void handleTogglePlay()}
          onSelectVersion={handleSelectVersion}
          onPrev={() => handlePrevNext(-1)}
          onNext={() => handlePrevNext(1)}
          onSeek={handleSeek}
          onVolume={handleVolume}
          onShare={(t) => {
            setShareTrack(t);
            setShareOpen(true);
          }}
          onSendToDJ={(t) => handleSendToDJ(t, 'A')}
          onOpenLyrics={(t) => {
            setActiveTab('catalog');
            setLyricsTrack(t);
          }}
          onLike={(t) => void handleLikeTrack(t)}
          onToggleOffline={(t) => void handleToggleOffline(t)}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (Spotify / YouTube Music Pro style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#090516]/96 backdrop-blur-xl border-t border-white/10 grid grid-cols-5 items-center px-1">
        {(
          [
            { id: 'catalog' as TabId, label: 'Início', icon: <Music className="w-4 h-4" /> },
            { id: 'explore' as TabId, label: 'Mundo', icon: <Globe2 className="w-4 h-4" /> },
            { id: 'playlists' as TabId, label: 'Playlists', icon: <ListMusic className="w-4 h-4" /> },
            { id: 'dj' as TabId, label: 'DJ Pro', icon: <Disc3 className="w-4 h-4" /> },
            mode === 'creator'
              ? { id: 'studio' as TabId, label: 'Estúdio', icon: <Wand2 className="w-4 h-4" /> }
              : { id: 'catalog' as TabId, label: 'PIX', icon: <QrCode className="w-4 h-4" />, isPix: true },
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
                  setActiveTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 transition ${
                active ? 'text-pink-400' : 'text-purple-300/75'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>

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
        onToast={showToast}
      />
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
        onClose={() => setUserAuthOpen(false)}
        user={userProfile}
        onSaveUser={(u) => {
          setUserProfile(u);
          saveUserProfile(u);
        }}
        onLogoutUser={() => {
          setUserProfile(null);
          saveUserProfile(null);
          showToast('Você saiu do perfil de ouvinte.');
        }}
        onOpenShare={() => {
          setUserAuthOpen(false);
          setShareTrack(null);
          setShareOpen(true);
        }}
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

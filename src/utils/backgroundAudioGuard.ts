// Universal Background Playback & Lock-Screen MediaSession Guard
// Ensures audio & video keep playing when minimized or screen-locked across Web, PWA, Mobile, PC, TV & Android APK.
// Playback ONLY stops when the user explicitly taps Pause, the Safety Stop button, or closes the site.

export interface MediaGuardMeta {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
  duration?: number;
  currentTime?: number;
  isPlaying: boolean;
}

export interface MediaGuardHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onStop?: () => void;
  onSeek?: (time: number) => void;
}

export function syncBackgroundMediaSession(meta: MediaGuardMeta, handlers: MediaGuardHandlers = {}): void {
  try {
    const navAny = navigator as unknown as { audioSession?: { type: string } };
    if (navAny.audioSession && meta.isPlaying) {
      navAny.audioSession.type = 'playback';
    }
  } catch {
    // ignore unsupported
  }

  try {
    window.AndroidBridge?.updateMediaState?.(
      meta.title || 'LENKYX',
      meta.artist || 'LENKYX',
      meta.album || 'Universo Livre',
      meta.isPlaying
    );
  } catch {
    // ignore outside APK
  }

  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    const absCover = new URL(meta.artworkUrl || '/covers/icon-512.png', window.location.origin).href;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title || 'LENKYX',
      artist: meta.artist || 'LENKYX',
      album: meta.album || 'Universo Livre',
      artwork: [
        { src: absCover, sizes: '192x192', type: 'image/png' },
        { src: absCover, sizes: '512x512', type: 'image/png' },
      ],
    });
    navigator.mediaSession.playbackState = meta.isPlaying ? 'playing' : 'paused';

    try {
      const dur = Number((meta as unknown as { duration?: number }).duration || 0);
      if (dur > 0 && isFinite(dur)) {
        navigator.mediaSession.setPositionState({
          duration: dur,
          position: Math.min(Math.max(0, Number(meta.currentTime || 0)), dur),
          playbackRate: 1,
        });
      }
    } catch {
      // ignore
    }
    try {
      navigator.mediaSession.setActionHandler('stop', handlers.onPause ? () => handlers.onPause?.() : null);
    } catch {
      // ignore
    }

    navigator.mediaSession.setActionHandler('play', handlers.onPlay ? () => handlers.onPlay?.() : null);
    navigator.mediaSession.setActionHandler('pause', handlers.onPause ? () => handlers.onPause?.() : null);
    navigator.mediaSession.setActionHandler(
      'previoustrack',
      handlers.onPrev ? () => handlers.onPrev?.() : null
    );
    navigator.mediaSession.setActionHandler(
      'nexttrack',
      handlers.onNext ? () => handlers.onNext?.() : null
    );
    try {
      navigator.mediaSession.setActionHandler(
        'seekbackward',
        handlers.onSeek
          ? (details) => {
              const offset = details.seekOffset || 10;
              handlers.onSeek?.(Math.max(0, (meta.currentTime || 0) - offset));
            }
          : null
      );
      navigator.mediaSession.setActionHandler(
        'seekforward',
        handlers.onSeek
          ? (details) => {
              const offset = details.seekOffset || 10;
              const max = meta.duration && meta.duration > 0 ? meta.duration : (meta.currentTime || 0) + offset;
              handlers.onSeek?.(Math.min(max, (meta.currentTime || 0) + offset));
            }
          : null
      );
    } catch {
      // ignore
    }
    try {
      navigator.mediaSession.setActionHandler('stop', handlers.onStop ? () => handlers.onStop?.() : null);
    } catch {
      // not supported in all browsers
    }
    try {
      navigator.mediaSession.setActionHandler(
        'seekto',
        handlers.onSeek
          ? (details) => {
              if (typeof details.seekTime === 'number') handlers.onSeek?.(details.seekTime);
            }
          : null
      );
    } catch {
      // ignore
    }

    if (
      meta.isPlaying &&
      typeof navigator.mediaSession.setPositionState === 'function' &&
      Number.isFinite(meta.duration) &&
      (meta.duration || 0) > 1
    ) {
      const dur = Number(meta.duration);
      const pos = Math.max(0, Math.min(dur, Number(meta.currentTime || 0)));
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: 1,
        position: pos,
      });
    }
  } catch {
    // ignore mediaSession quirks
  }
}

let keepaliveCtx: AudioContext | null = null;
let keepaliveOsc: OscillatorNode | null = null;
let keepaliveAudioEl: HTMLAudioElement | null = null;

// Tiny 1-second silent PCM WAV data URI to keep Android/iOS lock-screen audio focus alive
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export function setMobileBackgroundKeepalive(active: boolean): void {
  try {
    if (!active) {
      if (keepaliveAudioEl) {
        try {
          keepaliveAudioEl.pause();
        } catch {
          // ignore
        }
      }
      if (keepaliveOsc) {
        try {
          keepaliveOsc.stop();
        } catch {
          // ignore
        }
        keepaliveOsc = null;
      }
      if (keepaliveCtx) {
        void keepaliveCtx.close().catch(() => {});
        keepaliveCtx = null;
      }
      return;
    }

    if (typeof Audio !== 'undefined') {
      if (!keepaliveAudioEl) {
        keepaliveAudioEl = new Audio(SILENT_WAV_DATA_URI);
        keepaliveAudioEl.loop = true;
        keepaliveAudioEl.volume = 0.001;
      }
      if (keepaliveAudioEl.paused) {
        void keepaliveAudioEl.play().catch(() => {});
      }
    }

    const AudioCtx =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!AudioCtx) return;
    if (!keepaliveCtx) {
      keepaliveCtx = new AudioCtx();
      const osc = keepaliveCtx.createOscillator();
      const g = keepaliveCtx.createGain();
      osc.frequency.value = 30;
      g.gain.value = 0.00001;
      osc.connect(g);
      g.connect(keepaliveCtx.destination);
      osc.start();
      keepaliveOsc = osc;
    } else if (keepaliveCtx.state === 'suspended') {
      void keepaliveCtx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function clearBackgroundMediaSession(): void {
  try {
    window.AndroidBridge?.stopBackgroundPlayback?.();
    window.AndroidBridge?.updateMediaState?.('LENKYX', 'Pausado', 'Universo Livre', false);
  } catch {
    // ignore
  }
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = 'none';
  } catch {
    // ignore
  }
}

const audioFallbackMemCache = new Map<string, string>();

export async function prefetchVideoAudioBackup(title: string, artist = ''): Promise<string> {
  const key = `${title}::${artist}`.toLowerCase().trim();
  if (!key) return '';
  if (audioFallbackMemCache.has(key)) return audioFallbackMemCache.get(key) || '';
  try {
    const res = await fetch(
      `/api/world-audio-fallback?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
    );
    if (!res.ok) return '';
    const data = await res.json();
    const url = String(data?.audioUrl || '').trim();
    if (url) {
      audioFallbackMemCache.set(key, url);
      return url;
    }
  } catch {
    // ignore
  }
  return '';
}

// Screen Wake Lock API ("impedir modo de inatividade do telefone" during Video/Shorts/Live playback)
let wakeLockSentinel: { release?: () => Promise<void>; released?: boolean } | null = null;
let wakeLockShouldHold = false;
let wakeLockListenerBound = false;

async function acquireWakeLockInternal(): Promise<void> {
  try {
    const navAny = navigator as unknown as {
      wakeLock?: { request: (type: 'screen') => Promise<{ release?: () => Promise<void>; released?: boolean }> };
    };
    if (!navAny.wakeLock) return;
    if (wakeLockSentinel && !wakeLockSentinel.released) return;
    wakeLockSentinel = await navAny.wakeLock.request('screen');
  } catch {
    // ignore unsupported or battery-saver rejection
  }
}

export function setMediaWakeLock(active: boolean): void {
  wakeLockShouldHold = active;
  if (typeof document !== 'undefined' && !wakeLockListenerBound) {
    wakeLockListenerBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && wakeLockShouldHold) {
        void acquireWakeLockInternal();
      }
    });
  }
  if (active) {
    void acquireWakeLockInternal();
  } else if (wakeLockSentinel) {
    try {
      void wakeLockSentinel.release?.();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}

export async function requestYoutubeMediaPermissions(): Promise<{
  notifications: string;
  cameraMic: boolean;
  wakeLock: boolean;
}> {
  let notifications = 'default';
  let cameraMic = false;
  let wakeLock = false;

  try {
    if (typeof Notification !== 'undefined') {
      notifications = await Notification.requestPermission();
    }
  } catch {
    // ignore
  }

  try {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      cameraMic = true;
    }
  } catch {
    cameraMic = false;
  }

  try {
    setMediaWakeLock(true);
    wakeLock = true;
  } catch {
    wakeLock = false;
  }

  return { notifications, cameraMic, wakeLock };
}


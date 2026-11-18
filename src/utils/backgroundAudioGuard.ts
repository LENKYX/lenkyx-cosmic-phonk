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
    const absCover = new URL(meta.artworkUrl || '/covers/album-official.jpg', window.location.origin).href;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title || 'LENKYX',
      artist: meta.artist || 'LENKYX',
      album: meta.album || 'Universo Livre',
      artwork: [
        { src: absCover, sizes: '512x512', type: 'image/jpeg' },
        { src: absCover, sizes: '1024x1024', type: 'image/jpeg' },
      ],
    });
    navigator.mediaSession.playbackState = meta.isPlaying ? 'playing' : 'paused';

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

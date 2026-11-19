// Global Single-Source Media Coordinator
// Ensures only ONE audio/video plays at a time across the entire app (Music, Reels, Lives, Movies, Sports, Studio).

export type MediaSourceId = 'catalog' | 'clip' | 'reels' | 'live' | 'movies' | 'sports' | 'studio' | 'intro';

type StopFn = () => void;

const registry = new Map<MediaSourceId, StopFn>();
let activeSource: MediaSourceId | null = null;

export function registerMediaStopper(id: MediaSourceId, stopFn: StopFn): () => void {
  registry.set(id, stopFn);
  return () => {
    if (registry.get(id) === stopFn) {
      registry.delete(id);
    }
  };
}

export function claimMediaFocus(id: MediaSourceId): void {
  activeSource = id;
  for (const [key, stop] of registry.entries()) {
    if (key !== id) {
      try {
        stop();
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

export function stopAllMedia(except?: MediaSourceId): void {
  for (const [key, stop] of registry.entries()) {
    if (key !== except) {
      try {
        stop();
      } catch {
        // ignore
      }
    }
  }
  if (!except) activeSource = null;
}

export function getActiveMediaSource(): MediaSourceId | null {
  return activeSource;
}

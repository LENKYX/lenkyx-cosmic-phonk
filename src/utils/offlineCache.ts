import { AudioVersion, Track } from '../types';
import { isAndroidApk } from './androidBridge';

const OFFLINE_META_KEY = 'lenkyx_offline_tracks_v1';
const OFFLINE_IDB_NAME = 'lenkyx_offline_media_v1';
const OFFLINE_IDB_STORE = 'media_blobs';

interface OfflineEntry {
  trackId: string;
  hasV1: boolean;
  hasV2: boolean;
  bytes: number;
  downloadedAt: string;
}

const activeBlobUrls = new Map<string, string>();

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OFFLINE_IDB_STORE)) {
        db.createObjectStore(OFFLINE_IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, blob: Blob): Promise<void> {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OFFLINE_IDB_STORE, 'readwrite');
    tx.objectStore(OFFLINE_IDB_STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key: string): Promise<Blob | undefined> {
  const db = await openOfflineDb();
  return new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(OFFLINE_IDB_STORE, 'readonly');
    const req = tx.objectStore(OFFLINE_IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OFFLINE_IDB_STORE, 'readwrite');
    tx.objectStore(OFFLINE_IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function loadOfflineMap(): Record<string, OfflineEntry> {
  try {
    const raw = localStorage.getItem(OFFLINE_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OfflineEntry>) : {};
  } catch {
    return {};
  }
}

function saveOfflineMap(map: Record<string, OfflineEntry>): void {
  localStorage.setItem(OFFLINE_META_KEY, JSON.stringify(map));
}

export function getOfflineTrackIds(): Set<string> {
  return new Set(Object.keys(loadOfflineMap()));
}

export function isTrackOffline(trackId: string): boolean {
  return Boolean(loadOfflineMap()[trackId]);
}

export function getOfflineStorageSummary(): { count: number; totalMb: number } {
  const entries = Object.values(loadOfflineMap());
  const bytes = entries.reduce((sum, e) => sum + (e.bytes || 0), 0);
  return { count: entries.length, totalMb: Math.round((bytes / (1024 * 1024)) * 10) / 10 };
}

async function fetchMediaBlob(url: string): Promise<Blob> {
  if (!url) throw new Error('Empty url');
  // 1. Direct fetch (works for local /audio/, /storage/, and Suno CORS * CDN)
  try {
    const direct = await fetch(url);
    if (direct.ok) {
      const b = await direct.blob();
      if (b.size > 1024) return b;
    }
  } catch {
    // try proxy below
  }

  // 2. Fallback via server audio proxy (for Audius/external CDNs without CORS)
  if (url.startsWith('https://')) {
    const proxyBase = isAndroidApk() ? 'https://lenkyx-cosmic-phonk.onrender.com' : '';
    const proxied = await fetch(`${proxyBase}/api/audio-proxy?url=${encodeURIComponent(url)}`);
    if (proxied.ok) {
      const b = await proxied.blob();
      if (b.size > 1024) return b;
    }
  }

  throw new Error('Não foi possível baixar o áudio offline');
}

export async function downloadTrackOffline(track: Track): Promise<OfflineEntry> {
  let totalBytes = 0;
  let hasV1 = false;
  let hasV2 = false;

  if (track.audioUrl) {
    const blobV1 = await fetchMediaBlob(track.audioUrl);
    await idbPut(`audio-${track.id}-v1`, blobV1);
    activeBlobUrls.set(`${track.id}-v1`, URL.createObjectURL(blobV1));
    totalBytes += blobV1.size;
    hasV1 = true;
  }

  if (track.audioUrlV2) {
    try {
      const blobV2 = await fetchMediaBlob(track.audioUrlV2);
      await idbPut(`audio-${track.id}-v2`, blobV2);
      activeBlobUrls.set(`${track.id}-v2`, URL.createObjectURL(blobV2));
      totalBytes += blobV2.size;
      hasV2 = true;
    } catch {
      // V1 succeeded; V2 optional if unavailable
    }
  }

  if (track.coverUrl) {
    try {
      const coverRes = await fetch(track.coverUrl);
      if (coverRes.ok) {
        const coverBlob = await coverRes.blob();
        await idbPut(`cover-${track.id}`, coverBlob);
        totalBytes += coverBlob.size;
      }
    } catch {
      // cover optional
    }
  }

  const map = loadOfflineMap();
  const entry: OfflineEntry = {
    trackId: track.id,
    hasV1,
    hasV2,
    bytes: totalBytes,
    downloadedAt: new Date().toISOString(),
  };
  map[track.id] = entry;
  saveOfflineMap(map);
  return entry;
}

export async function removeTrackOffline(trackId: string): Promise<void> {
  await Promise.allSettled([
    idbDelete(`audio-${trackId}-v1`),
    idbDelete(`audio-${trackId}-v2`),
    idbDelete(`cover-${trackId}`),
  ]);
  activeBlobUrls.delete(`${trackId}-v1`);
  activeBlobUrls.delete(`${trackId}-v2`);
  const map = loadOfflineMap();
  delete map[trackId];
  saveOfflineMap(map);
}

export async function resolvePlayableAudioUrl(
  track: Track,
  version: AudioVersion
): Promise<{ url: string; fromOffline: boolean }> {
  const key = `${track.id}-${version}`;
  if (activeBlobUrls.has(key)) {
    return { url: activeBlobUrls.get(key)!, fromOffline: true };
  }

  try {
    const blob = await idbGet(`audio-${track.id}-${version}`);
    if (blob && blob.size > 1024) {
      const objUrl = URL.createObjectURL(blob);
      activeBlobUrls.set(key, objUrl);
      return { url: objUrl, fromOffline: true };
    }
  } catch {
    // ignore IDB error
  }

  const remoteUrl = version === 'v2' && track.audioUrlV2 ? track.audioUrlV2 : track.audioUrl;
  return { url: remoteUrl, fromOffline: false };
}

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

export type DownloadProgressCb = (pct: number, loadedMb: number, totalMb: number) => void;

async function readResponseBlobWithProgress(
  res: Response,
  onProgress?: DownloadProgressCb
): Promise<Blob> {
  const total = Number(res.headers.get('content-length') || 0);
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  if (!res.body || !onProgress) {
    const b = await res.blob();
    if (onProgress && b.size > 0) {
      const mb = Math.round((b.size / (1024 * 1024)) * 10) / 10;
      onProgress(100, mb, mb);
    }
    return b;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  let lastEmit = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.byteLength;
      const now = Date.now();
      if (now - lastEmit > 120) {
        lastEmit = now;
        const loadedMb = Math.round((loaded / (1024 * 1024)) * 10) / 10;
        const totalMb = total > 0 ? Math.round((total / (1024 * 1024)) * 10) / 10 : loadedMb;
        const pct = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : Math.min(92, Math.round((loaded / (1024 * 64)) % 90 + 10));
        onProgress(pct, loadedMb, totalMb);
      }
    }
  }

  const blob = new Blob(chunks as BlobPart[], { type: contentType });
  const finalMb = Math.round((blob.size / (1024 * 1024)) * 10) / 10;
  onProgress(100, finalMb, finalMb);
  return blob;
}

async function fetchMediaBlob(url: string, onProgress?: DownloadProgressCb): Promise<Blob> {
  if (!url) throw new Error('Empty url');
  // 1. Direct fetch (works for local /audio/, /storage/, and Suno CORS * CDN)
  try {
    const direct = await fetch(url);
    if (direct.ok) {
      const b = await readResponseBlobWithProgress(direct, onProgress);
      if (b.size > 1024) return b;
    }
  } catch {
    // try proxy below
  }

  // 2. Fallback via server audio proxy (for Audius/Archive/external CDNs without CORS)
  if (url.startsWith('https://')) {
    const proxyBase = isAndroidApk() ? 'https://lenkyx-cosmic-phonk.onrender.com' : '';
    const proxied = await fetch(`${proxyBase}/api/audio-proxy?url=${encodeURIComponent(url)}`);
    if (proxied.ok) {
      const b = await readResponseBlobWithProgress(proxied, onProgress);
      if (b.size > 1024) return b;
    }
  }

  throw new Error('Não foi possível baixar o áudio offline');
}

export async function resolveDownloadStream(params: {
  title: string;
  artist?: string;
  directUrl?: string;
  kind?: 'audio' | 'video' | 'movie';
}): Promise<{ ok: boolean; url: string; downloadUrl: string; filename: string; kind: string }> {
  const apiBase = isAndroidApk() ? 'https://lenkyx-cosmic-phonk.onrender.com' : '';
  const qs = new URLSearchParams({
    title: params.title || 'LENKYX',
    artist: params.artist || '',
    directUrl: params.directUrl || '',
    kind: params.kind || 'audio',
  });
  const res = await fetch(`${apiBase}/api/world-resolve-download?${qs.toString()}`);
  if (!res.ok) throw new Error('Stream indisponível');
  return res.json();
}

export async function triggerDirectFileDownload(params: {
  title: string;
  artist?: string;
  directUrl?: string;
  kind?: 'audio' | 'video' | 'movie';
  onProgress?: DownloadProgressCb;
}): Promise<{ filename: string; mb: number; resolvedUrl: string }> {
  let targetUrl = params.directUrl || '';
  let downloadUrl = targetUrl;
  const safeBase = `${params.artist ? `${params.artist} - ` : ''}${params.title || 'LENKYX'}`
    .replace(/[^a-zA-Z0-9._ -]+/g, ' ')
    .trim()
    .slice(0, 72);
  let filename = `${safeBase}${params.kind === 'video' || params.kind === 'movie' ? '.mp4' : '.mp3'}`;

  if (!targetUrl || targetUrl.startsWith('https://')) {
    try {
      const resolved = await resolveDownloadStream(params);
      if (resolved.ok) {
        targetUrl = resolved.url;
        downloadUrl = resolved.downloadUrl;
        filename = resolved.filename || filename;
      }
    } catch {
      // keep directUrl if present
    }
  }

  if (!targetUrl) {
    throw new Error('Nenhum arquivo disponível para baixar.');
  }

  params.onProgress?.(5, 0, 0);
  const blob = await fetchMediaBlob(targetUrl, params.onProgress);
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
  const mb = Math.round((blob.size / (1024 * 1024)) * 10) / 10;
  return { filename, mb, resolvedUrl: downloadUrl };
}

export async function downloadTrackOffline(
  track: Track,
  onProgress?: DownloadProgressCb
): Promise<OfflineEntry> {
  let totalBytes = 0;
  let hasV1 = false;
  let hasV2 = false;

  let primaryAudioUrl = track.audioUrl || '';
  if (!primaryAudioUrl) {
    const resolved = await resolveDownloadStream({
      title: track.title,
      artist: track.artist,
      kind: 'audio',
    });
    primaryAudioUrl = resolved.url;
  }

  const jobs: Promise<void>[] = [];

  if (primaryAudioUrl) {
    jobs.push(
      fetchMediaBlob(primaryAudioUrl, onProgress).then(async (blobV1) => {
        await idbPut(`audio-${track.id}-v1`, blobV1);
        activeBlobUrls.set(`${track.id}-v1`, URL.createObjectURL(blobV1));
        totalBytes += blobV1.size;
        hasV1 = true;
      })
    );
  }

  if (track.audioUrlV2) {
    jobs.push(
      fetchMediaBlob(track.audioUrlV2)
        .then(async (blobV2) => {
          await idbPut(`audio-${track.id}-v2`, blobV2);
          activeBlobUrls.set(`${track.id}-v2`, URL.createObjectURL(blobV2));
          totalBytes += blobV2.size;
          hasV2 = true;
        })
        .catch(() => {})
    );
  }

  if (track.coverUrl) {
    jobs.push(
      fetch(track.coverUrl)
        .then(async (coverRes) => {
          if (coverRes.ok) {
            const coverBlob = await coverRes.blob();
            await idbPut(`cover-${track.id}`, coverBlob);
            totalBytes += coverBlob.size;
          }
        })
        .catch(() => {})
    );
  }

  await Promise.all(jobs);

  if (!hasV1 || totalBytes < 1024) {
    throw new Error('Não foi possível salvar esta faixa offline.');
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

// === OFFLINE TRAVEL GENRE FOLDERS (UP TO 500 PER GENRE · MUSIC + VIDEO + LOCAL FILES) ===
const OFFLINE_FOLDERS_KEY = 'lenkyx_offline_folders_v1';

export interface OfflineFolderMeta {
  id: string;
  title: string;
  emoji: string;
  description: string;
  mediaKind: 'audio' | 'video';
  accent: string;
}

export interface OfflineMediaItem extends Track {
  mediaKind?: 'audio' | 'video';
  videoUrl?: string;
}

export interface SavedOfflineFolderState {
  folder: OfflineFolderMeta;
  items: OfflineMediaItem[];
  savedIds: string[];
  updatedAt: string;
}

export const DEFAULT_OFFLINE_FOLDERS: OfflineFolderMeta[] = [
  { id: 'phonk', title: 'Phonk & Drift Automotivo', emoji: '⚡', description: 'Graves pesados e cowbells pra viagem sem internet', mediaKind: 'audio', accent: 'from-pink-500 to-purple-600' },
  { id: 'funk_brasil', title: 'Funk, Dance & Pancadão', emoji: '🇧🇷', description: 'Batidão brasileiro pra animar a estrada', mediaKind: 'audio', accent: 'from-emerald-400 to-cyan-500' },
  { id: 'electronic', title: 'Eletrônica, House & Bass', emoji: '🎧', description: 'Sets eletrônicos e bass house completos offline', mediaKind: 'audio', accent: 'from-cyan-400 to-blue-600' },
  { id: 'hiphop_trap', title: 'Trap, Rap & Hip-Hop', emoji: '🔥', description: 'Beats de trap e rap mundial offline', mediaKind: 'audio', accent: 'from-orange-400 to-rose-600' },
  { id: 'sertanejo_country', title: 'Sertanejo, Country & Estrada', emoji: '🤠', description: 'Viola, country e modão pra rodovia', mediaKind: 'audio', accent: 'from-amber-400 to-orange-600' },
  { id: 'rock_classics', title: 'Rock, Metal & Clássicos', emoji: '🎸', description: 'Guitarras pesadas e rock clássico offline', mediaKind: 'audio', accent: 'from-rose-500 to-red-700' },
  { id: 'lofi_chill', title: 'Lo-Fi, Synthwave & Noite', emoji: '🌙', description: 'Vibe relaxante pra dirigir à noite', mediaKind: 'audio', accent: 'from-indigo-400 to-violet-600' },
  { id: 'gospel_peace', title: 'Gospel, Louvor & Paz', emoji: '🙏', description: 'Louvores e paz pra toda a família', mediaKind: 'audio', accent: 'from-sky-400 to-teal-500' },
  { id: 'suno_ai', title: 'Músicas IA (Suno Mundial)', emoji: '🤖', description: 'Faixas futuristas de IA prontas pro modo viagem', mediaKind: 'audio', accent: 'from-fuchsia-500 to-cyan-400' },
  { id: 'videos_offline', title: 'Vídeos & Clipes Offline (MP4)', emoji: '🎬', description: 'Clipes e animações em MP4 pra assistir sem internet', mediaKind: 'video', accent: 'from-rose-500 to-amber-500' },
];

export function loadSavedOfflineFolders(): Record<string, SavedOfflineFolderState> {
  try {
    const raw = localStorage.getItem(OFFLINE_FOLDERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SavedOfflineFolderState>) : {};
  } catch {
    return {};
  }
}

function saveOfflineFoldersMap(map: Record<string, SavedOfflineFolderState>): void {
  try {
    localStorage.setItem(OFFLINE_FOLDERS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage limit
  }
}

export function upsertOfflineFolderItems(folder: OfflineFolderMeta, items: OfflineMediaItem[], markSavedId?: string): SavedOfflineFolderState {
  const all = loadSavedOfflineFolders();
  const prev = all[folder.id];
  const mergedMap = new Map<string, OfflineMediaItem>();
  for (const it of prev?.items || []) mergedMap.set(it.id, it);
  for (const it of items) mergedMap.set(it.id, it);
  const savedSet = new Set<string>(prev?.savedIds || []);
  if (markSavedId) savedSet.add(markSavedId);

  const nextState: SavedOfflineFolderState = {
    folder,
    items: Array.from(mergedMap.values()).slice(0, 500),
    savedIds: Array.from(savedSet),
    updatedAt: new Date().toISOString(),
  };
  all[folder.id] = nextState;
  saveOfflineFoldersMap(all);
  return nextState;
}

export async function downloadVideoOffline(item: OfflineMediaItem): Promise<OfflineEntry> {
  const src = item.videoUrl || item.audioUrl;
  if (!src) throw new Error('Vídeo sem URL');
  const blob = await fetchMediaBlob(src);
  await idbPut(`video-${item.id}`, blob);
  activeBlobUrls.set(`video-${item.id}`, URL.createObjectURL(blob));

  let totalBytes = blob.size;
  if (item.coverUrl) {
    try {
      const cr = await fetch(item.coverUrl);
      if (cr.ok) {
        const cb = await cr.blob();
        await idbPut(`cover-${item.id}`, cb);
        totalBytes += cb.size;
      }
    } catch {
      // ignore
    }
  }
  const map = loadOfflineMap();
  const entry: OfflineEntry = {
    trackId: item.id,
    hasV1: true,
    hasV2: false,
    bytes: totalBytes,
    downloadedAt: new Date().toISOString(),
  };
  map[item.id] = entry;
  saveOfflineMap(map);
  return entry;
}

export async function resolvePlayableVideoUrl(item: OfflineMediaItem): Promise<{ url: string; fromOffline: boolean }> {
  const key = `video-${item.id}`;
  if (activeBlobUrls.has(key)) {
    return { url: activeBlobUrls.get(key)!, fromOffline: true };
  }
  try {
    const blob = await idbGet(key);
    if (blob && blob.size > 1024) {
      const u = URL.createObjectURL(blob);
      activeBlobUrls.set(key, u);
      return { url: u, fromOffline: true };
    }
  } catch {
    // ignore
  }
  const remote = item.videoUrl || item.audioUrl || '';
  if (remote.startsWith('https://')) {
    const proxyBase = isAndroidApk() ? 'https://lenkyx-cosmic-phonk.onrender.com' : '';
    return { url: `${proxyBase}/api/audio-proxy?url=${encodeURIComponent(remote)}`, fromOffline: false };
  }
  return { url: remote, fromOffline: false };
}

export async function importLocalMediaToFolder(
  folder: OfflineFolderMeta,
  files: FileList
): Promise<OfflineMediaItem[]> {
  const imported: OfflineMediaItem[] = [];
  const map = loadOfflineMap();

  for (const file of Array.from(files)) {
    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    const id = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

    if (isVid) {
      await idbPut(`video-${id}`, file);
      activeBlobUrls.set(`video-${id}`, URL.createObjectURL(file));
    } else {
      await idbPut(`audio-${id}-v1`, file);
      activeBlobUrls.set(`audio-${id}-v1`, URL.createObjectURL(file));
    }

    map[id] = {
      trackId: id,
      hasV1: true,
      hasV2: false,
      bytes: file.size,
      downloadedAt: new Date().toISOString(),
    };

    const item: OfflineMediaItem = {
      id,
      number: imported.length + 1,
      title: cleanName || 'Arquivo Local',
      emoji: isVid ? '🎬' : '🎵',
      artist: 'Meu Aparelho (Offline)',
      album: folder.title,
      genre: folder.title,
      bpm: 128,
      key: 'Am',
      coverUrl: '/covers/icon-512.png',
      audioUrl: '',
      videoUrl: isVid ? 'local' : undefined,
      mediaKind: isVid ? 'video' : 'audio',
      durationSec: 180,
      plays: 0,
      likes: 0,
      favorite: false,
      releaseBatch: 1,
      sunoPrompt: '',
      lyrics: '',
      createdAt: new Date().toISOString(),
      status: { suno: false, cover: true, app: true, youtube: false, distrokid: false },
      source: 'lenkyx',
    };
    imported.push(item);
    upsertOfflineFolderItems(folder, [item], id);
  }

  saveOfflineMap(map);
  return imported;
}


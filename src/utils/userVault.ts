import { Track, UserPlaylist, UserProfile } from '../types';

const PROFILE_KEY = 'lenkyx_fan_profile_v1';
const PLAYLISTS_KEY = 'lenkyx_user_playlists_v1';
const USER_TRACKS_KEY = 'lenkyx_user_uploaded_tracks_v1';
const IDB_NAME = 'lenkyx_user_vault_v1';
const IDB_STORE = 'user_blobs';

const blobUrlCache = new Map<string, string>();

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putBlob(key: string, blob: Blob): Promise<string> {
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(key, url);
  return `uidb://${key}`;
}

async function resolveBlobUrl(url?: string): Promise<string> {
  if (!url) return '';
  if (!url.startsWith('uidb://')) return url;
  const key = url.slice(7);
  if (blobUrlCache.has(key)) return blobUrlCache.get(key)!;
  try {
    const db = await openVaultDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (blob) {
      const obj = URL.createObjectURL(blob);
      blobUrlCache.set(key, obj);
      return obj;
    }
  } catch {
    // ignore
  }
  return '';
}

// === USER PROFILE ===
export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile | null): void {
  if (!profile) {
    localStorage.removeItem(PROFILE_KEY);
  } else {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
}

// === USER PLAYLISTS ===
const DEFAULT_PLAYLISTS: UserPlaylist[] = [
  {
    id: 'pl-favoritas-treino',
    name: 'Meu Mix Cósmico',
    description: 'Minhas favoritas do MORRO GOLD e do mundo todo',
    emoji: '🚀',
    accentColor: 'from-pink-500 to-purple-600',
    trackIds: [],
    savedExternalTracks: {},
    createdAt: new Date().toISOString(),
  },
];

export function loadUserPlaylists(): UserPlaylist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(DEFAULT_PLAYLISTS));
  return DEFAULT_PLAYLISTS;
}

export function saveUserPlaylists(playlists: UserPlaylist[]): void {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

// === USER PERSONAL UPLOADED TRACKS ===
export async function loadUserTracks(): Promise<Track[]> {
  let rawList: Track[] = [];
  try {
    const raw = localStorage.getItem(USER_TRACKS_KEY);
    if (raw) rawList = JSON.parse(raw);
  } catch {
    rawList = [];
  }
  const hydrated = await Promise.all(
    rawList.map(async (t) => ({
      ...t,
      audioUrl: await resolveBlobUrl(t.audioUrl),
      coverUrl: (await resolveBlobUrl(t.coverUrl)) || '/covers/playlist-hero.jpg',
    }))
  );
  return hydrated.filter((t) => Boolean(t.audioUrl));
}

export async function addUserLocalTrack(params: {
  title: string;
  artist: string;
  bpm: number;
  audioFile: File;
  coverFile?: File | null;
}): Promise<Track> {
  const id = 'user-track-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const audioKey = await putBlob(`audio-${id}`, params.audioFile);
  const coverKey = params.coverFile ? await putBlob(`cover-${id}`, params.coverFile) : '/covers/playlist-hero.jpg';

  let rawList: Track[] = [];
  try {
    const raw = localStorage.getItem(USER_TRACKS_KEY);
    if (raw) rawList = JSON.parse(raw);
  } catch {
    rawList = [];
  }

  const storedTrack: Track = {
    id,
    number: rawList.length + 1,
    title: params.title.trim() || params.audioFile.name.replace(/\.[^.]+$/, ''),
    emoji: '🎵',
    artist: params.artist.trim() || 'Minha Biblioteca',
    album: 'Minhas Músicas',
    bpm: params.bpm || 128,
    key: 'Fm',
    coverUrl: coverKey,
    audioUrl: audioKey,
    source: 'user_local',
    isDemoAudio: false,
    hasCustomCover: Boolean(params.coverFile),
    plays: 0,
    likes: 0,
    favorite: false,
    releaseBatch: 0,
    status: { suno: false, cover: Boolean(params.coverFile), app: true, youtube: false, distrokid: false },
    sunoPrompt: '',
    lyrics: '',
    createdAt: new Date().toISOString(),
  };

  rawList.unshift(storedTrack);
  localStorage.setItem(USER_TRACKS_KEY, JSON.stringify(rawList));

  return {
    ...storedTrack,
    audioUrl: await resolveBlobUrl(audioKey),
    coverUrl: (await resolveBlobUrl(coverKey)) || '/covers/playlist-hero.jpg',
  };
}

export function deleteUserLocalTrack(id: string): void {
  try {
    const raw = localStorage.getItem(USER_TRACKS_KEY);
    if (!raw) return;
    const list: Track[] = JSON.parse(raw);
    const next = list.filter((t) => t.id !== id);
    localStorage.setItem(USER_TRACKS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

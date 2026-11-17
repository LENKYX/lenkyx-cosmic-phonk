import { AppSettings, Track } from '../types';

const DB_LS_KEY = 'lenkyx_offline_db_v1';
const AUTH_LS_KEY = 'lenkyx_offline_auth_v1';
const IDB_NAME = 'lenkyx_media_vault_v1';
const IDB_STORE = 'blobs';
const TARGET_CATALOG_VERSION = 7;

const DEFAULT_PASSWORD_SHA256 = '321a63151fae18ed6677a4dbd331d1ac914dbd3291ca346589b7bde02afd9f7b';

interface OfflineAuth {
  passwordHash?: string;
  password?: string;
  hasCustomPassword: boolean;
  token: string;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyOfflinePassword(auth: OfflineAuth, candidate: string): Promise<boolean> {
  if (auth.password && candidate === auth.password) return true;
  const targetHash = auth.passwordHash || DEFAULT_PASSWORD_SHA256;
  return (await sha256Hex(candidate)) === targetHash;
}

interface OfflineDb {
  catalogVersion?: number;
  tracks: Track[];
  settings: AppSettings;
}

const blobUrlCache = new Map<string, string>();

function openMediaDb(): Promise<IDBDatabase> {
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

async function saveMediaBlob(key: string, blob: Blob): Promise<string> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(key, url);
  return `idb://${key}`;
}

async function resolveMediaUrl(url?: string): Promise<string> {
  if (!url) return '';
  if (!url.startsWith('idb://')) return url;
  const key = url.slice(6);
  if (blobUrlCache.has(key)) return blobUrlCache.get(key)!;
  try {
    const db = await openMediaDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (blob) {
      const objUrl = URL.createObjectURL(blob);
      blobUrlCache.set(key, objUrl);
      return objUrl;
    }
  } catch {
    // ignore
  }
  return '/audio/lost-spaceship.wav';
}

function getAuth(): OfflineAuth {
  try {
    const raw = localStorage.getItem(AUTH_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const init: OfflineAuth = {
    passwordHash: DEFAULT_PASSWORD_SHA256,
    hasCustomPassword: false,
    token: 'lenkyx-local-token-' + Math.random().toString(36).slice(2),
  };
  localStorage.setItem(AUTH_LS_KEY, JSON.stringify(init));
  return init;
}

function saveAuth(auth: OfflineAuth) {
  localStorage.setItem(AUTH_LS_KEY, JSON.stringify(auth));
}

async function loadDb(): Promise<OfflineDb> {
  let parsed: OfflineDb | null = null;
  try {
    const raw = localStorage.getItem(DB_LS_KEY);
    if (raw) {
      const p: OfflineDb = JSON.parse(raw);
      if (p && Array.isArray(p.tracks)) parsed = p;
    }
  } catch {
    parsed = null;
  }

  if (parsed && (parsed.catalogVersion || 1) >= TARGET_CATALOG_VERSION) {
    return parsed;
  }

  const res = await fetch('/seed-data.json');
  const seed: OfflineDb = await res.json();

  if (parsed) {
    // Preserve user settings and any local IndexedDB uploads when upgrading v1 -> v2!
    const mergedSettings: AppSettings = {
      ...seed.settings,
      ...parsed.settings,
      sunoPlaylistId: parsed.settings?.sunoPlaylistId || seed.settings.sunoPlaylistId,
      sunoProfileUrl: parsed.settings?.sunoProfileUrl || seed.settings.sunoProfileUrl,
    };
    const localUploads = parsed.tracks.filter((t) => t.audioUrl && t.audioUrl.startsWith('idb://'));
    const mergedTracks = [...seed.tracks];
    for (const ut of localUploads) {
      const idx = mergedTracks.findIndex((t) => t.title.toLowerCase() === ut.title.toLowerCase());
      if (idx >= 0) {
        mergedTracks[idx] = {
          ...mergedTracks[idx],
          audioUrl: ut.audioUrl,
          audioUrlV2: ut.audioUrlV2 || mergedTracks[idx].audioUrl,
          isDemoAudio: false,
        };
      } else {
        mergedTracks.push({ ...ut, number: mergedTracks.length + 1 });
      }
    }
    const upgraded: OfflineDb = {
      catalogVersion: TARGET_CATALOG_VERSION,
      settings: mergedSettings,
      tracks: mergedTracks,
    };
    localStorage.setItem(DB_LS_KEY, JSON.stringify(upgraded));
    return upgraded;
  }

  localStorage.setItem(DB_LS_KEY, JSON.stringify(seed));
  return seed;
}

function persistDb(db: OfflineDb) {
  localStorage.setItem(DB_LS_KEY, JSON.stringify(db));
}

async function hydrateTracks(tracks: Track[]): Promise<Track[]> {
  return Promise.all(
    tracks.map(async (t) => ({
      ...t,
      audioUrl: await resolveMediaUrl(t.audioUrl),
      audioUrlV2: t.audioUrlV2 ? await resolveMediaUrl(t.audioUrlV2) : '',
      coverUrl: await resolveMediaUrl(t.coverUrl),
    }))
  );
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isCreatorAuthorized(headers: Headers): boolean {
  const h = headers.get('Authorization') || '';
  if (!h.startsWith('Bearer ')) return false;
  const tok = h.slice(7).trim();
  const auth = getAuth();
  return tok === auth.token;
}

export async function handleStandaloneApi(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
  const pathname = urlStr.startsWith('http') ? new URL(urlStr).pathname : urlStr.split('?')[0];
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});

  // AUTH STATUS
  if (pathname === '/api/auth/status' && method === 'GET') {
    const auth = getAuth();
    return jsonResponse({
      authenticated: isCreatorAuthorized(headers),
      hasCustomPassword: auth.hasCustomPassword,
    });
  }

  // AUTH LOGIN
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = JSON.parse(String(init.body || '{}'));
    const auth = getAuth();
    if (!(await verifyOfflinePassword(auth, String(body.password || '')))) {
      return jsonResponse({ error: 'Senha incorreta. Tente novamente.' }, 401);
    }
    return jsonResponse({
      token: auth.token,
      authenticated: true,
      hasCustomPassword: auth.hasCustomPassword,
    });
  }

  // CHANGE PASSWORD
  if (pathname === '/api/auth/change-password' && method === 'POST') {
    if (!isCreatorAuthorized(headers)) return jsonResponse({ error: 'Não autorizado' }, 401);
    const body = JSON.parse(String(init.body || '{}'));
    const auth = getAuth();
    if (!(await verifyOfflinePassword(auth, String(body.currentPassword || '')))) {
      return jsonResponse({ error: 'Senha atual incorreta.' }, 401);
    }
    const nextPass = String(body.newPassword || '').trim();
    if (nextPass.length < 6) {
      return jsonResponse({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' }, 400);
    }
    delete auth.password;
    auth.passwordHash = await sha256Hex(nextPass);
    auth.hasCustomPassword = true;
    auth.token = 'lenkyx-local-token-' + Math.random().toString(36).slice(2);
    saveAuth(auth);
    return jsonResponse({ token: auth.token, ok: true, hasCustomPassword: true });
  }

  // GET STATE
  if (pathname === '/api/state' && method === 'GET') {
    const db = await loadDb();
    const auth = getAuth();
    const hydrated = await hydrateTracks(db.tracks);
    return jsonResponse({
      tracks: hydrated,
      settings: db.settings,
      auth: {
        authenticated: isCreatorAuthorized(headers),
        hasCustomPassword: auth.hasCustomPassword,
      },
    });
  }

  // SYNC SUNO PLAYLIST (in APK when online)
  if (pathname === '/api/sync-suno' && method === 'POST') {
    if (!isCreatorAuthorized(headers)) return jsonResponse({ error: 'Não autorizado' }, 401);
    try {
      const db = await loadDb();
      const playlistId = db.settings.sunoPlaylistId || '785945be-498d-4b1a-a6f6-86ce99b4082d';
      const r = await fetch(`https://studio-api.prod.suno.com/api/playlist/${playlistId}/?page=1`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      const items = data.playlist_clips || [];
      let updatedCount = 0;
      let addedCount = 0;

      for (const item of items) {
        const c = item?.clip;
        if (!c?.id) continue;
        const videoUrl = (c.video_url || '').trim();
        const existingV1 = db.tracks.find((t) => t.sunoId === c.id);
        const existingV2 = db.tracks.find((t) => t.sunoIdV2 === c.id);
        if (existingV1) {
          const hasLocal = existingV1.audioUrl && existingV1.audioUrl.startsWith('idb://');
          if (videoUrl && !hasLocal && (existingV1.isDemoAudio || existingV1.audioUrl !== videoUrl)) {
            existingV1.audioUrl = videoUrl;
            existingV1.isDemoAudio = false;
            existingV1.sunoPrivate = false;
            updatedCount++;
          }
        } else if (existingV2) {
          const hasLocalV2 = existingV2.audioUrlV2 && existingV2.audioUrlV2.startsWith('idb://');
          if (videoUrl && !hasLocalV2 && existingV2.audioUrlV2 !== videoUrl) {
            existingV2.audioUrlV2 = videoUrl;
            existingV2.sunoPrivateV2 = false;
            updatedCount++;
          }
        } else {
          const rawTitle = (c.title || 'Nova Faixa').trim();
          const m = rawTitle.match(/^([^\w\s]+(?:\s*[^\w\s]+)*)\s+(.+)$/);
          const emoji = m ? m[1].trim() : '🚀';
          const title = m ? m[2].trim() : rawTitle;
          const meta = c.metadata || {};
          const nextNum = db.tracks.reduce((max, t) => Math.max(max, t.number || 0), 0) + 1;
          db.tracks.push({
            id: `suno-${c.id.slice(0, 8)}`,
            number: nextNum,
            title,
            emoji,
            artist: db.settings.artistName || 'LENKYX',
            album: `Cosmic Phonk Vol. ${Math.ceil(nextNum / 20)}`,
            bpm: 132,
            key: 'Fm',
            coverUrl: '/covers/void-horizon.jpg',
            audioUrl: videoUrl || '/audio/lost-spaceship.wav',
            audioUrlV2: '',
            sunoId: c.id,
            sunoUrl: `https://suno.com/song/${c.id}`,
            sunoPrivate: !videoUrl,
            durationSec: Math.round(Number(meta.duration) || 0),
            isDemoAudio: !videoUrl,
            hasCustomCover: false,
            plays: Number(c.play_count) || 0,
            likes: Number(c.upvote_count) || 0,
            favorite: false,
            releaseBatch: Math.ceil(nextNum / (db.settings.dailyGoal || 10)),
            status: { suno: true, cover: false, app: true, youtube: false, distrokid: false },
            sunoPrompt: (meta.tags || '').trim(),
            lyrics: (meta.prompt || '').trim(),
            createdAt: c.created_at || new Date().toISOString(),
          });
          addedCount++;
        }
      }
      persistDb(db);
      const hydrated = await hydrateTracks(db.tracks);
      return jsonResponse({ ok: true, totalFound: items.length, addedCount, updatedCount, tracks: hydrated });
    } catch {
      return jsonResponse({ error: 'Conecte-se à internet para sincronizar novas músicas do Suno.' }, 502);
    }
  }

  // EXPORT BACKUP
  if (pathname === '/api/export-backup' && method === 'GET') {
    if (!isCreatorAuthorized(headers)) return jsonResponse({ error: 'Não autorizado' }, 401);
    const db = await loadDb();
    return new Response(JSON.stringify(db, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // UPDATE SETTINGS
  if (pathname === '/api/settings' && method === 'PUT') {
    if (!isCreatorAuthorized(headers)) return jsonResponse({ error: 'Não autorizado' }, 401);
    const db = await loadDb();
    const partial = JSON.parse(String(init.body || '{}'));
    db.settings = { ...db.settings, ...partial };
    persistDb(db);
    return jsonResponse(db.settings);
  }

  // PLAY / LIKE TRACK
  const playMatch = pathname.match(/^\/api\/tracks\/([^/]+)\/play$/);
  if (playMatch && method === 'POST') {
    const db = await loadDb();
    const t = db.tracks.find((x) => x.id === playMatch[1]);
    if (!t) return jsonResponse({ error: 'Not found' }, 404);
    t.plays = (t.plays || 0) + 1;
    persistDb(db);
    return jsonResponse({ plays: t.plays });
  }

  const likeMatch = pathname.match(/^\/api\/tracks\/([^/]+)\/like$/);
  if (likeMatch && method === 'POST') {
    const db = await loadDb();
    const t = db.tracks.find((x) => x.id === likeMatch[1]);
    if (!t) return jsonResponse({ error: 'Not found' }, 404);
    const body = JSON.parse(String(init.body || '{}'));
    const delta = body.liked === false ? -1 : 1;
    t.likes = Math.max(0, (t.likes || 0) + delta);
    t.favorite = delta > 0;
    persistDb(db);
    return jsonResponse({ likes: t.likes, favorite: t.favorite });
  }

  // CREATE TRACK
  if (pathname === '/api/tracks' && method === 'POST') {
    if (!isCreatorAuthorized(headers)) return jsonResponse({ error: 'Não autorizado' }, 401);
    const db = await loadDb();
    const fd = init.body instanceof FormData ? init.body : null;
    const getStr = (k: string) => (fd ? String(fd.get(k) || '') : '');
    const audioFile = fd ? fd.get('audio') : null;
    const audioV2File = fd ? fd.get('audioV2') : null;
    const coverFile = fd ? fd.get('cover') : null;

    const title = getStr('title').trim() || 'Nova Faixa Cósmica';
    const slug =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString(36).slice(-4);

    let storedAudio = getStr('audioUrl') || '/audio/lost-spaceship.wav';
    let isDemoAudio = true;
    if (audioFile instanceof Blob && audioFile.size > 0) {
      storedAudio = await saveMediaBlob(`audio-${slug}`, audioFile);
      isDemoAudio = false;
    }

    let storedAudioV2 = getStr('audioUrlV2') || '';
    if (audioV2File instanceof Blob && audioV2File.size > 0) {
      storedAudioV2 = await saveMediaBlob(`audio-v2-${slug}`, audioV2File);
    }

    let storedCover = getStr('coverUrl') || '/covers/playlist-hero.jpg';
    let hasCustomCover = false;
    if (coverFile instanceof Blob && coverFile.size > 0) {
      storedCover = await saveMediaBlob(`cover-${slug}`, coverFile);
      hasCustomCover = true;
    }

    const nextNum = db.tracks.reduce((max, t) => Math.max(max, t.number || 0), 0) + 1;
    let parsedStatus = { suno: !isDemoAudio, cover: hasCustomCover, app: true, youtube: false, distrokid: false };
    const statusRaw = getStr('status');
    if (statusRaw) {
      try {
        parsedStatus = { ...parsedStatus, ...JSON.parse(statusRaw) };
      } catch {
        // ignore
      }
    }

    const newTrack: Track = {
      id: slug,
      number: nextNum,
      title,
      emoji: getStr('emoji') || '🎵',
      artist: db.settings.artistName || 'LENKYX',
      album: getStr('album') || 'Lançamentos LENKYX',
      bpm: Number(getStr('bpm')) || 132,
      key: getStr('key') || 'Fm',
      coverUrl: storedCover,
      audioUrl: storedAudio,
      audioUrlV2: storedAudioV2,
      isDemoAudio,
      hasCustomCover,
      plays: 0,
      likes: 0,
      favorite: false,
      releaseBatch: Math.ceil(nextNum / (db.settings.dailyGoal || 10)),
      status: parsedStatus,
      sunoPrompt: getStr('sunoPrompt'),
      lyrics: getStr('lyrics'),
      createdAt: new Date().toISOString(),
    };

    db.tracks.push(newTrack);
    persistDb(db);

    const [hydrated] = await hydrateTracks([newTrack]);
    return jsonResponse(hydrated, 201);
  }

  // UPDATE OR DELETE TRACK
  const trackMatch = pathname.match(/^\/api\/tracks\/([^/]+)$/);
  if (trackMatch) {
    if (!isCreatorAuthorized(headers)) return jsonResponse({ error: 'Não autorizado' }, 401);
    const db = await loadDb();
    const idx = db.tracks.findIndex((t) => t.id === trackMatch[1]);
    if (idx === -1) return jsonResponse({ error: 'Faixa não encontrada' }, 404);

    if (method === 'DELETE') {
      db.tracks.splice(idx, 1);
      persistDb(db);
      return jsonResponse({ ok: true });
    }

    if (method === 'PUT') {
      const existing = db.tracks[idx];
      const fd = init.body instanceof FormData ? init.body : null;
      const has = (k: string) => (fd ? fd.has(k) : false);
      const getStr = (k: string) => (fd ? String(fd.get(k) || '') : '');
      const audioFile = fd ? fd.get('audio') : null;
      const audioV2File = fd ? fd.get('audioV2') : null;
      const coverFile = fd ? fd.get('cover') : null;

      let storedAudio = existing.audioUrl;
      let isDemoAudio = existing.isDemoAudio;
      let sunoPrivate = existing.sunoPrivate;
      if (audioFile instanceof Blob && audioFile.size > 0) {
        storedAudio = await saveMediaBlob(`audio-${existing.id}-${Date.now()}`, audioFile);
        isDemoAudio = false;
        sunoPrivate = false;
      }

      let storedAudioV2 = existing.audioUrlV2 || '';
      if (audioV2File instanceof Blob && audioV2File.size > 0) {
        storedAudioV2 = await saveMediaBlob(`audio-v2-${existing.id}-${Date.now()}`, audioV2File);
      }

      let storedCover = existing.coverUrl;
      let hasCustomCover = existing.hasCustomCover;
      if (coverFile instanceof Blob && coverFile.size > 0) {
        storedCover = await saveMediaBlob(`cover-${existing.id}-${Date.now()}`, coverFile);
        hasCustomCover = true;
      }

      let updatedStatus = existing.status;
      if (has('status')) {
        try {
          updatedStatus = JSON.parse(getStr('status'));
        } catch {
          // ignore
        }
      }

      const updated: Track = {
        ...existing,
        title: has('title') ? getStr('title') : existing.title,
        emoji: has('emoji') ? getStr('emoji') : existing.emoji,
        album: has('album') ? getStr('album') : existing.album,
        bpm: has('bpm') ? Number(getStr('bpm')) || existing.bpm : existing.bpm,
        key: has('key') ? getStr('key') : existing.key,
        sunoPrompt: has('sunoPrompt') ? getStr('sunoPrompt') : existing.sunoPrompt,
        lyrics: has('lyrics') ? getStr('lyrics') : existing.lyrics,
        audioUrl: storedAudio,
        audioUrlV2: storedAudioV2,
        isDemoAudio,
        sunoPrivate,
        coverUrl: storedCover,
        hasCustomCover,
        status: {
          ...updatedStatus,
          suno: audioFile instanceof Blob && audioFile.size > 0 ? true : updatedStatus.suno,
          cover: coverFile instanceof Blob && coverFile.size > 0 ? true : updatedStatus.cover,
        },
      };

      db.tracks[idx] = updated;
      persistDb(db);
      const [hydrated] = await hydrateTracks([updated]);
      return jsonResponse(hydrated);
    }
  }

  return jsonResponse({ error: 'Rota não encontrada' }, 404);
}

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATALOG_VERSION, SUNO_PLAYLIST_ID, getInitialDb } from './seed.js';
import { createAuthManager } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Environment-configurable directories so cloud volumes (Render Disk / Railway Volume) persist across deploys!
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const STORAGE_ROOT = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(ROOT, 'storage');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const STORAGE_AUDIO = path.join(STORAGE_ROOT, 'audio');
const STORAGE_COVERS = path.join(STORAGE_ROOT, 'covers');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(STORAGE_AUDIO, { recursive: true });
fs.mkdirSync(STORAGE_COVERS, { recursive: true });

const auth = createAuthManager(DATA_DIR);

function migrateIfNeeded(db) {
  if ((db.catalogVersion || 1) >= CATALOG_VERSION) return db;
  const fresh = getInitialDb();
  // Preserve user's saved settings (PIX key, public URL, etc.)
  const mergedSettings = {
    ...fresh.settings,
    ...(db.settings || {}),
    sunoPlaylistId: (db.settings && db.settings.sunoPlaylistId) || SUNO_PLAYLIST_ID,
    sunoProfileUrl: (db.settings && db.settings.sunoProfileUrl) || 'https://suno.com/@lenkyx',
  };
  // Preserve any real user-uploaded tracks stored in /storage/audio/
  const userUploaded = (db.tracks || []).filter(
    (t) => t && typeof t.audioUrl === 'string' && t.audioUrl.startsWith('/storage/audio/')
  );
  const existingTitles = new Set(fresh.tracks.map((t) => t.title.toLowerCase()));
  const mergedTracks = [...fresh.tracks];

  for (const ut of userUploaded) {
    const matchIdx = mergedTracks.findIndex((t) => t.title.toLowerCase() === (ut.title || '').toLowerCase());
    if (matchIdx >= 0) {
      mergedTracks[matchIdx] = {
        ...mergedTracks[matchIdx],
        audioUrl: ut.audioUrl,
        audioUrlV2: ut.audioUrlV2 || mergedTracks[matchIdx].audioUrl,
        isDemoAudio: false,
      };
    } else if (!existingTitles.has((ut.title || '').toLowerCase())) {
      mergedTracks.push({
        ...ut,
        number: mergedTracks.length + 1,
      });
    }
  }

  const upgraded = {
    catalogVersion: CATALOG_VERSION,
    settings: mergedSettings,
    tracks: mergedTracks,
  };
  writeDb(upgraded);
  console.log(`LENKYX Catalog upgraded to v${CATALOG_VERSION} (${mergedTracks.length} real Suno tracks)!`);
  return upgraded;
}

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const init = getInitialDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return migrateIfNeeded(parsed);
  } catch {
    const init = getInitialDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// Configure multer storage for user-uploaded Suno WAV/MP3 (V1 & V2) + Cover arts (up to 150 MB per WAV!)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio' || file.fieldname === 'audioV2') cb(null, STORAGE_AUDIO);
    else cb(null, STORAGE_COVERS);
  },
  filename: (req, file, cb) => {
    const isAudio = file.fieldname === 'audio' || file.fieldname === 'audioV2';
    const safeExt = path.extname(file.originalname || '').toLowerCase() || (isAudio ? '.wav' : '.jpg');
    const cleanName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
    cb(null, cleanName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
});

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '5mb' }));

// Health check for Render / Railway / Fly.io
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'lenkyx-cosmic-phonk', timestamp: new Date().toISOString() });
});

// Static assets
app.use('/storage', express.static(STORAGE_ROOT, { maxAge: '7d' }));
app.use('/covers', express.static(path.join(PUBLIC_DIR, 'covers'), { maxAge: '7d' }));
app.use('/audio', express.static(path.join(PUBLIC_DIR, 'audio'), { maxAge: '7d' }));
app.use('/manifest.json', express.static(path.join(PUBLIC_DIR, 'manifest.json')));
app.use('/sw.js', express.static(path.join(PUBLIC_DIR, 'sw.js')));

// === AUTHENTICATION ROUTES ===
app.get('/api/auth/status', (req, res) => {
  res.json(auth.getStatus(req));
});

app.post('/api/auth/login', (req, res) => {
  const ip = req.ip || 'unknown';
  const rl = auth.checkRateLimit(ip);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Muitas tentativas incorretas. Aguarde ${rl.mins || 15} minuto(s) e tente novamente.`,
    });
  }
  const password = String(req.body?.password || '');
  if (!auth.verifyPassword(password)) {
    auth.recordFailedAttempt(ip);
    return res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
  }
  auth.clearAttempts(ip);
  const token = auth.signToken();
  const status = auth.getStatus(req);
  res.json({
    token,
    authenticated: true,
    hasCustomPassword: status.hasCustomPassword,
  });
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/change-password', auth.requireCreator, (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '').trim();
  if (!auth.verifyPassword(currentPassword)) {
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' });
  }
  const newToken = auth.changePassword(newPassword);
  res.json({ ok: true, token: newToken, hasCustomPassword: true });
});

// === PUBLIC API ROUTES ===
app.get('/api/state', (req, res) => {
  const db = readDb();
  res.json({
    ...db,
    auth: auth.getStatus(req),
  });
});

app.post('/api/tracks/:id/play', (req, res) => {
  const db = readDb();
  const track = db.tracks.find((t) => t.id === req.params.id);
  if (!track) return res.status(404).json({ error: 'Faixa não encontrada' });
  track.plays = (track.plays || 0) + 1;
  writeDb(db);
  res.json({ plays: track.plays });
});

app.post('/api/tracks/:id/like', (req, res) => {
  const db = readDb();
  const track = db.tracks.find((t) => t.id === req.params.id);
  if (!track) return res.status(404).json({ error: 'Faixa não encontrada' });
  const delta = req.body && req.body.liked === false ? -1 : 1;
  track.likes = Math.max(0, (track.likes || 0) + delta);
  track.favorite = delta > 0;
  writeDb(db);
  res.json({ likes: track.likes, favorite: track.favorite });
});

// === PROTECTED CREATOR ROUTES ===
app.post(
  '/api/tracks',
  auth.requireCreator,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'audioV2', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  (req, res) => {
    const db = readDb();
    const files = req.files || {};
    const audioFile = files.audio?.[0];
    const audioV2File = files.audioV2?.[0];
    const coverFile = files.cover?.[0];

    const title = (req.body.title || 'Nova Faixa Cósmica').trim();
    const slug =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString(36).slice(-4);

    const nextNum = db.tracks.reduce((max, t) => Math.max(max, t.number || 0), 0) + 1;
    let parsedStatus = { suno: Boolean(audioFile), cover: Boolean(coverFile), app: true, youtube: false, distrokid: false };
    if (req.body.status) {
      try {
        parsedStatus = { ...parsedStatus, ...JSON.parse(req.body.status) };
      } catch {
        // ignore
      }
    }

    const newTrack = {
      id: slug,
      number: nextNum,
      title,
      emoji: req.body.emoji || '🎵',
      artist: req.body.artist || db.settings.artistName || 'LENKYX',
      album: req.body.album || 'Lançamentos LENKYX',
      bpm: Number(req.body.bpm) || 132,
      key: req.body.key || 'Fm',
      coverUrl: coverFile ? `/storage/covers/${coverFile.filename}` : req.body.coverUrl || '/covers/playlist-hero.jpg',
      audioUrl: audioFile ? `/storage/audio/${audioFile.filename}` : req.body.audioUrl || '/audio/lost-spaceship.wav',
      audioUrlV2: audioV2File ? `/storage/audio/${audioV2File.filename}` : req.body.audioUrlV2 || '',
      isDemoAudio: !audioFile && !req.body.isRealAudio,
      hasCustomCover: Boolean(coverFile) || Boolean(req.body.hasCustomCover),
      plays: 0,
      likes: 0,
      favorite: false,
      releaseBatch: Number(req.body.releaseBatch) || Math.ceil(nextNum / (db.settings.dailyGoal || 10)),
      status: parsedStatus,
      sunoPrompt: req.body.sunoPrompt || '',
      lyrics: req.body.lyrics || '',
      createdAt: new Date().toISOString(),
    };

    db.tracks.push(newTrack);
    writeDb(db);
    res.status(201).json(newTrack);
  }
);

app.put(
  '/api/tracks/:id',
  auth.requireCreator,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'audioV2', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  (req, res) => {
    const db = readDb();
    const idx = db.tracks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Faixa não encontrada' });

    const existing = db.tracks[idx];
    const files = req.files || {};
    const audioFile = files.audio?.[0];
    const audioV2File = files.audioV2?.[0];
    const coverFile = files.cover?.[0];

    let updatedStatus = existing.status;
    if (req.body.status) {
      try {
        updatedStatus = typeof req.body.status === 'string' ? JSON.parse(req.body.status) : req.body.status;
      } catch {
        // ignore
      }
    }

    const updated = {
      ...existing,
      title: req.body.title !== undefined ? req.body.title : existing.title,
      emoji: req.body.emoji !== undefined ? req.body.emoji : existing.emoji,
      album: req.body.album !== undefined ? req.body.album : existing.album,
      bpm: req.body.bpm !== undefined ? Number(req.body.bpm) || existing.bpm : existing.bpm,
      key: req.body.key !== undefined ? req.body.key : existing.key,
      sunoPrompt: req.body.sunoPrompt !== undefined ? req.body.sunoPrompt : existing.sunoPrompt,
      lyrics: req.body.lyrics !== undefined ? req.body.lyrics : existing.lyrics,
      favorite: req.body.favorite !== undefined ? req.body.favorite === true || req.body.favorite === 'true' : existing.favorite,
      status: {
        ...updatedStatus,
        suno: audioFile ? true : updatedStatus.suno,
        cover: coverFile ? true : updatedStatus.cover,
      },
      audioUrl: audioFile ? `/storage/audio/${audioFile.filename}` : existing.audioUrl,
      audioUrlV2: audioV2File ? `/storage/audio/${audioV2File.filename}` : existing.audioUrlV2 || '',
      isDemoAudio: audioFile ? false : existing.isDemoAudio,
      sunoPrivate: audioFile ? false : existing.sunoPrivate,
      coverUrl: coverFile ? `/storage/covers/${coverFile.filename}` : existing.coverUrl,
      hasCustomCover: coverFile ? true : existing.hasCustomCover,
    };

    db.tracks[idx] = updated;
    writeDb(db);
    res.json(updated);
  }
);

app.delete('/api/tracks/:id', auth.requireCreator, (req, res) => {
  const db = readDb();
  const idx = db.tracks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Faixa não encontrada' });
  db.tracks.splice(idx, 1);
  writeDb(db);
  res.json({ ok: true });
});

app.put('/api/settings', auth.requireCreator, (req, res) => {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  writeDb(db);
  res.json(db.settings);
});

// Live 1-Click Sync with Suno Playlist (@lenkyx)
app.post('/api/sync-suno', auth.requireCreator, async (req, res) => {
  try {
    const db = readDb();
    const playlistId = (req.body?.playlistId || db.settings.sunoPlaylistId || SUNO_PLAYLIST_ID).trim();
    const clips = [];
    const seen = new Set();

    for (let page = 1; page <= 15; page++) {
      const r = await fetch(`https://studio-api.prod.suno.com/api/playlist/${playlistId}/?page=${page}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!r.ok) break;
      const data = await r.json();
      const items = data.playlist_clips || [];
      let added = 0;
      for (const item of items) {
        const c = item?.clip;
        if (c?.id && !seen.has(c.id)) {
          seen.add(c.id);
          clips.push(c);
          added++;
        }
      }
      if (added === 0) break;
    }

    let updatedCount = 0;
    let addedCount = 0;
    const fallbackCovers = [
      '/covers/void-horizon.jpg',
      '/covers/black-hole-drive.jpg',
      '/covers/galactic-nightride.jpg',
      '/covers/stardust-pyramid.jpg',
      '/covers/dark-satellite-alt.jpg',
    ];

    for (const c of clips) {
      const videoUrl = (c.video_url || '').trim();
      const existingV1 = db.tracks.find((t) => t.sunoId === c.id);
      const existingV2 = db.tracks.find((t) => t.sunoIdV2 === c.id);

      if (existingV1) {
        let changed = false;
        const hasLocalUpload = existingV1.audioUrl && existingV1.audioUrl.startsWith('/storage/audio/');
        if (videoUrl && !hasLocalUpload && (existingV1.isDemoAudio || existingV1.audioUrl !== videoUrl)) {
          existingV1.audioUrl = videoUrl;
          existingV1.isDemoAudio = false;
          existingV1.sunoPrivate = false;
          changed = true;
        }
        if (changed) updatedCount++;
      } else if (existingV2) {
        let changed = false;
        const hasLocalV2 = existingV2.audioUrlV2 && existingV2.audioUrlV2.startsWith('/storage/audio/');
        if (videoUrl && !hasLocalV2 && existingV2.audioUrlV2 !== videoUrl) {
          existingV2.audioUrlV2 = videoUrl;
          existingV2.sunoPrivateV2 = false;
          changed = true;
        }
        if (changed) updatedCount++;
      } else {
        const rawTitle = (c.title || 'Nova Faixa').trim();
        const m = rawTitle.match(/^([^\w\s]+(?:\s*[^\w\s]+)*)\s+(.+)$/);
        const emoji = m ? m[1].trim() : '🚀';
        const title = m ? m[2].trim() : rawTitle;
        const meta = c.metadata || {};
        const tags = (meta.tags || '').trim();
        const bpmMatch = tags.match(/(\d{2,3})\s*BPM/i);
        const nextNum = db.tracks.reduce((max, t) => Math.max(max, t.number || 0), 0) + 1;
        const slug =
          title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') +
          '-' +
          c.id.slice(0, 6);

        // NUNCA puxar capa do Suno — usar sempre nossas capas cósmicas LENKYX até a capa oficial nova ser criada!
        const coverUrl = fallbackCovers[(nextNum - 1) % fallbackCovers.length];

        db.tracks.push({
          id: slug,
          number: nextNum,
          title,
          emoji,
          artist: db.settings.artistName || 'LENKYX',
          album: `Cosmic Phonk Vol. ${Math.ceil(nextNum / 20)}`,
          bpm: bpmMatch ? Number(bpmMatch[1]) : 132,
          key: 'Fm',
          coverUrl,
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
          sunoPrompt: tags,
          lyrics: (meta.prompt || '').trim(),
          createdAt: c.created_at || new Date().toISOString(),
        });
        addedCount++;
      }
    }

    writeDb(db);
    res.json({
      ok: true,
      totalFound: clips.length,
      addedCount,
      updatedCount,
      tracks: db.tracks,
    });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao sincronizar com o Suno. Verifique sua internet.' });
  }
});

app.get('/api/export-backup', auth.requireCreator, (req, res) => {
  const db = readDb();
  res.setHeader('Content-Disposition', `attachment; filename="lenkyx-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(db);
});

// === GLOBAL WORLD MUSIC SEARCH & TRENDING (Audius Full-Length + Deezer + iTunes) ===
app.get('/api/world-trending', async (_req, res) => {
  try {
    const r = await fetch('https://api.audius.co/v1/tracks/trending?app_name=LENKYX&limit=24', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const d = await r.json();
    const tracks = (d?.data || []).map((item, idx) => {
      const artwork = item.artwork || {};
      return {
        id: `world-audius-${item.id}`,
        number: idx + 1,
        title: String(item.title || 'Faixa Global').trim(),
        emoji: '🌍',
        artist: String(item.user?.name || item.user?.handle || 'Artista Global').trim(),
        album: String(item.genre || 'Em Alta no Mundo'),
        bpm: 128,
        key: 'Fm',
        coverUrl: artwork['480x480'] || artwork['150x150'] || '/covers/void-horizon.jpg',
        audioUrl: `https://api.audius.co/v1/tracks/${encodeURIComponent(item.id)}/stream?app_name=LENKYX`,
        durationSec: Math.round(Number(item.duration) || 0),
        source: 'world_full',
        externalUrl: `https://audius.co${item.permalink || ''}`,
        isDemoAudio: false,
        hasCustomCover: true,
        plays: Number(item.play_count) || 0,
        likes: Number(item.favorite_count) || 0,
        favorite: false,
        releaseBatch: 0,
        status: { suno: false, cover: true, app: true, youtube: false, distrokid: false },
        sunoPrompt: '',
        lyrics: '',
        createdAt: item.release_date || new Date().toISOString(),
      };
    });
    res.json({ tracks });
  } catch {
    res.json({ tracks: [] });
  }
});

app.get('/api/world-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ tracks: [] });
  const enc = encodeURIComponent(q);

  const [audiusRes, deezerRes, itunesRes] = await Promise.allSettled([
    fetch(`https://api.audius.co/v1/tracks/search?query=${enc}&app_name=LENKYX`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then((r) => r.json()),
    fetch(`https://api.deezer.com/search?q=${enc}&limit=14`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then((r) => r.json()),
    fetch(`https://itunes.apple.com/search?term=${enc}&media=music&limit=12`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then((r) => r.json()),
  ]);

  const tracks = [];
  const seenKeys = new Set();

  if (audiusRes.status === 'fulfilled' && Array.isArray(audiusRes.value?.data)) {
    for (const item of audiusRes.value.data.slice(0, 12)) {
      if (!item?.id) continue;
      const artwork = item.artwork || {};
      const key = `${String(item.title || '').toLowerCase()}|${String(item.user?.name || '').toLowerCase()}`;
      seenKeys.add(key);
      tracks.push({
        id: `world-audius-${item.id}`,
        number: tracks.length + 1,
        title: String(item.title || 'Faixa Global').trim(),
        emoji: '🌍',
        artist: String(item.user?.name || item.user?.handle || 'Artista Global').trim(),
        album: String(item.genre || 'Audius Global'),
        bpm: 128,
        key: 'Fm',
        coverUrl: artwork['480x480'] || artwork['150x150'] || '/covers/void-horizon.jpg',
        audioUrl: `https://api.audius.co/v1/tracks/${encodeURIComponent(item.id)}/stream?app_name=LENKYX`,
        durationSec: Math.round(Number(item.duration) || 0),
        source: 'world_full',
        externalUrl: `https://audius.co${item.permalink || ''}`,
        isDemoAudio: false,
        hasCustomCover: true,
        plays: Number(item.play_count) || 0,
        likes: Number(item.favorite_count) || 0,
        favorite: false,
        releaseBatch: 0,
        status: { suno: false, cover: true, app: true, youtube: false, distrokid: false },
        sunoPrompt: '',
        lyrics: '',
        createdAt: item.release_date || new Date().toISOString(),
      });
    }
  }

  if (deezerRes.status === 'fulfilled' && Array.isArray(deezerRes.value?.data)) {
    for (const item of deezerRes.value.data) {
      if (!item?.preview) continue;
      const title = String(item.title || '').trim();
      const artist = String(item.artist?.name || '').trim();
      const key = `${title.toLowerCase()}|${artist.toLowerCase()}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      tracks.push({
        id: `world-deezer-${item.id}`,
        number: tracks.length + 1,
        title,
        emoji: '🎧',
        artist,
        album: String(item.album?.title || 'Global'),
        bpm: 126,
        key: 'Cm',
        coverUrl: item.album?.cover_big || item.album?.cover_medium || '/covers/void-horizon.jpg',
        audioUrl: item.preview,
        durationSec: Math.round(Number(item.duration) || 30),
        source: 'world_preview',
        externalUrl: item.link || '',
        isDemoAudio: false,
        hasCustomCover: true,
        plays: Number(item.rank) || 0,
        likes: 0,
        favorite: false,
        releaseBatch: 0,
        status: { suno: false, cover: true, app: true, youtube: false, distrokid: false },
        sunoPrompt: '',
        lyrics: '',
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (itunesRes.status === 'fulfilled' && Array.isArray(itunesRes.value?.results)) {
    for (const item of itunesRes.value.results) {
      if (!item?.previewUrl) continue;
      const title = String(item.trackName || '').trim();
      const artist = String(item.artistName || '').trim();
      const key = `${title.toLowerCase()}|${artist.toLowerCase()}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      tracks.push({
        id: `world-itunes-${item.trackId}`,
        number: tracks.length + 1,
        title,
        emoji: '🎧',
        artist,
        album: String(item.collectionName || item.primaryGenreName || 'Global'),
        bpm: 126,
        key: 'Gm',
        coverUrl: String(item.artworkUrl100 || '').replace('100x100bb', '600x600bb') || '/covers/void-horizon.jpg',
        audioUrl: item.previewUrl,
        durationSec: Math.round((Number(item.trackTimeMillis) || 30000) / 1000),
        source: 'world_preview',
        externalUrl: item.trackViewUrl || '',
        isDemoAudio: false,
        hasCustomCover: true,
        plays: 0,
        likes: 0,
        favorite: false,
        releaseBatch: 0,
        status: { suno: false, cover: true, app: true, youtube: false, distrokid: false },
        sunoPrompt: '',
        lyrics: '',
        createdAt: item.releaseDate || new Date().toISOString(),
      });
    }
  }

  res.json({ tracks });
});

// Direct Android APK download endpoint — streams local APK or redirects to official public Google Drive APK link
app.get('/download/apk', (_req, res) => {
  const candidates = [
    path.join(ROOT, 'downloads', 'LENKYX-Cosmic-Phonk.apk'),
    path.join(PUBLIC_DIR, 'LENKYX-Cosmic-Phonk.apk'),
    path.resolve(ROOT, '..', 'LENKYX-Cosmic-Phonk.apk'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) {
    return res.download(found, 'LENKYX-Cosmic-Phonk.apk');
  }
  const db = readDb();
  const redirectUrl =
    (db.settings?.apkDownloadUrl || '').trim() ||
    'https://drive.google.com/uc?id=1jFR9MhmD1MP9bDzAmHM17Nk_-cwa9CN1&export=download';
  return res.redirect(302, redirectUrl);
});

// Serve built frontend
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LENKYX Cosmic Phonk Server running on http://0.0.0.0:${PORT}`);
  console.log(`Data dir: ${DATA_DIR} | Storage dir: ${STORAGE_ROOT}`);
});

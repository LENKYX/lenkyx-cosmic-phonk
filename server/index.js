import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATALOG_VERSION, SUNO_PLAYLIST_ID, getInitialDb } from './seed.js';
import { createAuthManager } from './auth.js';
import {
  isSupabaseEnabled,
  hydrateDbFromSupabase,
  syncDbToSupabase,
  hydrateAuthFromSupabase,
  syncAuthToSupabase,
  upsertFanToSupabase,
  findFanInSupabase,
} from './supabaseStore.js';
import {
  registerFanUser,
  loginFanUser,
  requestPasswordRecovery,
  verifyPasswordRecovery,
} from './fanAuthStore.js';
import {
  runSmartWorldSearch,
  searchWorldShorts,
  getFamousArtistsWithPhotos,
  getWorldNewReleases,
  CURATED_PLAYLISTS,
} from './musicAI.js';
import { getMoviesDirectory, searchMovies } from './moviesAI.js';
import { getLiveTvDirectory, searchLiveTv } from './tvAI.js';
import {
  getChatMessages,
  postChatMessage,
  getCommentsForTarget,
  postComment,
  likeComment,
  getCommunityShorts,
  createCommunityShort,
  likeCommunityShort,
  getActiveLives,
  startOrUpdateLive,
  createTvHandoffSession,
  getTvHandoffSession,
} from './communityStore.js';

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

function writeDb(db, deletedTrackId = null) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  void syncDbToSupabase(db, deletedTrackId);
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
  res.json({
    ok: true,
    service: 'lenkyx-cosmic-phonk',
    database: isSupabaseEnabled() ? 'supabase' : 'local-json',
    tracksCount: readDb().tracks.length,
    timestamp: new Date().toISOString(),
  });
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
  void syncAuthToSupabase(auth.getConfig());
  res.json({ ok: true, token: newToken, hasCustomPassword: true });
});

// === FAN CLOUD ACCOUNTS & PLAYLISTS SYNC (Supabase) ===
app.post('/api/fans/sync', async (req, res) => {
  try {
    const { id, name, email, avatarColor, playlists } = req.body || {};
    if (!id || !name) return res.status(400).json({ error: 'Perfil inválido' });
    if (isSupabaseEnabled()) {
      await upsertFanToSupabase({ id, name, email, avatarColor, playlists });
    }
    res.json({ ok: true, cloud: isSupabaseEnabled() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao sincronizar perfil' });
  }
});

app.get('/api/fans/lookup', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim();
    const id = String(req.query.id || '').trim();
    if (!email && !id) return res.status(400).json({ error: 'Informe e-mail ou ID' });
    const fan = await findFanInSupabase({ id, email });
    res.json({ found: Boolean(fan), fan: fan || null });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao buscar perfil' });
  }
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
    const pubBase = (db.settings?.publicUrl || 'https://lenkyx-cosmic-phonk.onrender.com').replace(/\/$/, '');
    void dispatchSocialWebhook(db, {
      event: 'new_track_published',
      title: `${newTrack.title} — ${newTrack.artist}`,
      url: `${pubBase}/?track=${encodeURIComponent(newTrack.id)}`,
      coverUrl: newTrack.coverUrl.startsWith('http') ? newTrack.coverUrl : `${pubBase}${newTrack.coverUrl}`,
      platforms: ['instagram', 'youtube', 'tiktok', 'facebook', 'x'],
    });
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
  writeDb(db, req.params.id);
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

// === AI-POWERED WORLD MUSIC DISCOVERY (Brasil, Mundo, Todas as Gerações & Espaço/E.T. — 100% Completas!) ===
app.use('/api/world-', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/world-directory', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const [artists, releases] = await Promise.all([
      getFamousArtistsWithPhotos(),
      getWorldNewReleases(refresh),
    ]);
    res.json({
      artists,
      playlists: CURATED_PLAYLISTS,
      newReleases: releases.tracks || [],
      updatedAt: releases.updatedAt,
    });
  } catch {
    res.json({ artists: [], playlists: CURATED_PLAYLISTS, newReleases: [] });
  }
});

app.get('/api/world-new-releases', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const releases = await getWorldNewReleases(refresh);
    res.json(releases);
  } catch {
    res.json({ updatedAt: new Date().toISOString(), year: new Date().getFullYear(), tracks: [] });
  }
});

app.get('/api/world-trending', async (_req, res) => {
  try {
    const payload = await runSmartWorldSearch('');
    res.json(payload);
  } catch {
    res.json({ tracks: [], playlists: CURATED_PLAYLISTS, artistProfile: null, aiInsight: null });
  }
});

app.get('/api/world-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const space = req.query.space === '1' || req.query.space === 'true';
  try {
    const payload = await runSmartWorldSearch(q, { includeArchiveSpace: space });
    res.json(payload);
  } catch {
    res.json({ tracks: [], playlists: CURATED_PLAYLISTS, artistProfile: null, aiInsight: null });
  }
});

// === NETFLIX-STYLE FREE FULL MOVIES & OFFICIAL TRAILERS ===
app.use('/api/movies-', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/movies-directory', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const payload = await getMoviesDirectory(refresh);
    res.json(payload);
  } catch {
    res.json({ categories: [] });
  }
});

app.get('/api/movies-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const isTrailer = req.query.trailer === '1' || req.query.trailer === 'true';
  const mediaType = String(req.query.type || 'movie').trim();
  try {
    const movies = await searchMovies(
      q || 'filme internacional completo dublado full hd',
      q || 'Busca de Cinema',
      isTrailer,
      mediaType
    );
    res.json({ movies });
  } catch {
    res.json({ movies: [] });
  }
});

// === GLOBAL FREE-TO-AIR LIVE TV CHANNELS (Brazil + World Top 7,200+ Streams) ===
app.use('/api/tv-', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/tv-directory', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const payload = await getLiveTvDirectory(refresh);
    res.json(payload);
  } catch {
    res.json({ totalAvailable: 0, categories: [] });
  }
});

app.get('/api/tv-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const country = String(req.query.country || '').trim();
  try {
    const payload = await searchLiveTv(q, country);
    res.json(payload);
  } catch {
    res.json({ totalAvailable: 0, channels: [] });
  }
});

app.get('/api/tv-proxy', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).send('Invalid URL');
  }
  const host = parsed.hostname.toLowerCase();
  if (
    (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
    host === 'localhost' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    host.includes('::1')
  ) {
    return res.status(403).send('Blocked host');
  }
  try {
    const upstream = await fetch(rawUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) return res.status(upstream.status).send('Stream unavailable');
    const ct = upstream.headers.get('content-type') || '';
    const finalUrl = upstream.url || rawUrl;
    if (ct.includes('mpegurl') || finalUrl.toLowerCase().includes('.m3u8')) {
      const txt = await upstream.text();
      const rewritten = txt
        .split(/\r?\n/)
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith('#')) {
            return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
              try {
                const abs = new URL(uri, finalUrl).toString();
                return `URI="/api/tv-proxy?url=${encodeURIComponent(abs)}"`;
              } catch {
                return `URI="${uri}"`;
              }
            });
          }
          try {
            const abs = new URL(trimmed, finalUrl).toString();
            return `/api/tv-proxy?url=${encodeURIComponent(abs)}`;
          } catch {
            return line;
          }
        })
        .join('\n');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(rewritten);
    }
    if (ct) res.setHeader('Content-Type', ct);
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.send(buf);
  } catch {
    return res.status(502).send('Stream proxy failed');
  }
});

// Safe CORS Audio/Media Proxy for Offline Device Downloads (Suno, Audius & Archive.org CDNs only)
app.get('/api/audio-proxy', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  if (!rawUrl) return res.status(400).json({ error: 'Missing url' });
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }
  const host = parsed.hostname.toLowerCase();
  const allowed =
    parsed.protocol === 'https:' &&
    (host.endsWith('.suno.ai') ||
      host.endsWith('.suno.com') ||
      host === 'api.audius.co' ||
      host.endsWith('.audius.co') ||
      host.includes('audius') ||
      host === 'archive.org' ||
      host.endsWith('.archive.org'));
  if (!allowed) {
    return res.status(403).json({ error: 'Host not permitted for offline caching' });
  }
  try {
    const upstream = await fetch(rawUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 LENKYX-OfflineCache/1.0' },
      redirect: 'follow',
    });
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ error: 'Upstream media unavailable' });
    }
    const ct = upstream.headers.get('content-type') || 'audio/mpeg';
    const cl = upstream.headers.get('content-length');
    res.setHeader('Content-Type', ct);
    if (cl) res.setHeader('Content-Length', cl);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.send(buf);
  } catch {
    return res.status(502).json({ error: 'Proxy download failed' });
  }
});

// SEO Auto-Discovery for Google / Bing / Social Crawlers
app.get('/robots.txt', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});

async function dispatchSocialWebhook(db, payload) {
  const hook = String(db?.settings?.socialWebhookUrl || '').trim();
  if (!hook || !hook.startsWith('https://')) return false;
  try {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'LENKYX-AutoPublisher/2.2' },
      body: JSON.stringify({
        source: 'LENKYX Cosmic Phonk',
        timestamp: new Date().toISOString(),
        ...payload,
      }),
      signal: AbortSignal.timeout(7000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Global JSON & RSS Auto-Syndication Feeds (for Zapier / Make / IFTTT / Buffer / Social Platforms)
app.get('/api/releases.json', (req, res) => {
  const db = readDb();
  const base = (db.settings?.publicUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    version: 'https://jsonfeed.org/version/1.1',
    title: `${db.settings?.artistName || 'LENKYX'} — ${db.settings?.brandSubtitle || 'Cosmic Phonk'}`,
    home_page_url: base,
    feed_url: `${base}/api/releases.json`,
    items: (db.tracks || []).slice(-30).reverse().map((t) => ({
      id: t.id,
      url: `${base}/?track=${encodeURIComponent(t.id)}`,
      title: `${t.title} — ${t.artist}`,
      content_text: `Ouça "${t.title}" (${t.bpm} BPM) completo em LENKYX Cosmic Phonk! #LENKYX #CosmicPhonk`,
      image: t.coverUrl?.startsWith('http') ? t.coverUrl : `${base}${t.coverUrl}`,
      date_published: t.createdAt || new Date().toISOString(),
    })),
  });
});

app.get('/api/feed.xml', (req, res) => {
  const db = readDb();
  const base = (db.settings?.publicUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const esc = (s = '') =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const itemsXml = (db.tracks || [])
    .slice(-25)
    .reverse()
    .map((t) => {
      const link = `${base}/?track=${encodeURIComponent(t.id)}`;
      return `<item><title>${esc(t.title)} — ${esc(t.artist)}</title><link>${esc(link)}</link><guid isPermaLink="false">${esc(t.id)}</guid><pubDate>${new Date(t.createdAt || Date.now()).toUTCString()}</pubDate><description>${esc(`Ouça ${t.title} (${t.bpm} BPM) grátis no Super App LENKYX! #LENKYX #CosmicPhonk`)}</description></item>`;
    })
    .join('\n');
  res
    .type('application/rss+xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(db.settings?.artistName || 'LENKYX')} — Cosmic Phonk</title><link>${esc(base)}</link><description>Lançamentos musicais, clipes, cinema e entretenimento global LENKYX</description>\n${itemsXml}\n</channel></rss>`
    );
});

app.post('/api/social/auto-publish', auth.requireCreator, async (req, res) => {
  const db = readDb();
  const dispatched = await dispatchSocialWebhook(db, {
    event: 'manual_or_ai_social_publish',
    title: req.body?.title || 'LENKYX Cosmic Phonk',
    caption: req.body?.caption || '',
    url: req.body?.url || db.settings?.publicUrl || 'https://lenkyx-cosmic-phonk.onrender.com',
    coverUrl: req.body?.coverUrl || '',
    platforms: req.body?.platforms || ['instagram', 'youtube', 'tiktok', 'facebook', 'x'],
  });
  res.json({
    ok: true,
    dispatched,
    message: dispatched
      ? 'Auto-publicação disparada via Webhook oficial!'
      : 'Feed RSS/JSON atualizado. Conecte um Webhook HTTPS (Zapier/Make/n8n) para disparo automático.',
  });
});

app.get('/sitemap.xml', (req, res) => {
  const db = readDb();
  const base = (db.settings?.publicUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const now = new Date().toISOString().slice(0, 10);
  const urls = [
    `<url><loc>${base}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${base}/tv</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${base}/app</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
    ...db.tracks.map(
      (t) =>
        `<url><loc>${base}/?track=${encodeURIComponent(t.id)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`
    ),
  ];
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
    );
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
    'https://drive.google.com/uc?id=1CqwpvAgNKH_ULB5msJzVXwYz-voJ-Hjk&export=download';
  return res.redirect(302, redirectUrl);
});

// Live App Auto-Update Manifest (reads Supabase public manifest or local fallback)
app.post('/api/fan-auth/register', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const user = await registerFanUser(req.body || {});
    return res.json({ ok: true, user });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e?.message || 'Erro no cadastro.' });
  }
});

app.post('/api/fan-auth/login', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { identifier, passwordHash } = req.body || {};
    const result = await loginFanUser(identifier, passwordHash);
    return res.status(result.ok ? 200 : 401).json(result);
  } catch (e) {
    return res.status(400).json({ ok: false, error: e?.message || 'Erro no login.' });
  }
});

app.post('/api/fan-auth/recover-request', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { identifier } = req.body || {};
    const result = await requestPasswordRecovery(identifier);
    return res.status(result.ok ? 200 : 404).json(result);
  } catch (e) {
    return res.status(400).json({ ok: false, error: e?.message || 'Erro ao gerar código.' });
  }
});

app.post('/api/fan-auth/recover-verify', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { identifier, code, newPasswordHash } = req.body || {};
    const result = await verifyPasswordRecovery(identifier, code, newPasswordHash);
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (e) {
    return res.status(400).json({ ok: false, error: e?.message || 'Erro ao redefinir senha.' });
  }
});

// Live App Auto-Update Manifest (reads Supabase public manifest or local fallback)
app.get('/api/app-update', async (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const db = readDb();
  const fallback = {
    latestVersionCode: 17,
    latestVersionName: '2.1.3',
    apkUrl:
      (db.settings?.apkDownloadUrl || '').trim() ||
      'https://drive.google.com/uc?id=1CqwpvAgNKH_ULB5msJzVXwYz-voJ-Hjk&export=download',
    releaseNotes: 'App 100% otimizado, busca IA, clipes HD, modo offline e auto-atualização.',
    updateAvailable: false,
  };
  try {
    const supaUrl = (process.env.SUPABASE_URL || 'https://uzififnhdzfobynsbcgk.supabase.co').replace(/\/$/, '');
    const anonKey =
      process.env.SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aWZpZm5oZHpmb2J5bnNiY2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4ODI1OTUsImV4cCI6MjExMDQ1ODU5NX0.oIl5j0RwZ0yuKBbCToUsuypAihT9y3jBY4gN2EMNylA';
    const r = await fetch(`${supaUrl}/rest/v1/lenkyx_app_manifest?id=eq.android&select=*`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]) {
        return res.json({
          latestVersionCode: Number(rows[0].version_code) || 11,
          latestVersionName: rows[0].version_name || '2.0.7',
          apkUrl: rows[0].apk_url || fallback.apkUrl,
          releaseNotes: rows[0].release_notes || fallback.releaseNotes,
          updateAvailable: false,
        });
      }
    }
  } catch {
    // fallback
  }
  return res.json(fallback);
});

// === COMMUNITY SOCIAL ENGINE (Chat, Comments, Likes, Horizontal Shorts, Go Live) ===
app.get('/api/community/chat', async (req, res) => {
  try {
    const room = String(req.query.room || 'global');
    const messages = await getChatMessages(room, 70);
    res.json({ room, messages });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/chat', async (req, res) => {
  try {
    const msg = await postChatMessage({
      roomId: req.body?.roomId || 'global',
      authorName: req.body?.authorName,
      authorColor: req.body?.authorColor,
      message: req.body?.message,
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/comments', async (req, res) => {
  try {
    const targetId = String(req.query.targetId || '');
    const comments = await getCommentsForTarget(targetId, 80);
    res.json({ targetId, comments });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/comments', async (req, res) => {
  try {
    const item = await postComment({
      targetId: req.body?.targetId,
      authorName: req.body?.authorName,
      authorColor: req.body?.authorColor,
      text: req.body?.text,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/comments/:id/like', async (req, res) => {
  try {
    const upd = await likeComment(req.params.id);
    res.json(upd || { id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/shorts', async (_req, res) => {
  try {
    const shorts = await getCommunityShorts();
    res.json({ shorts });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/world-shorts', async (req, res) => {
  const category = String(req.query.category || 'all').trim();
  const q = String(req.query.q || '').trim();
  try {
    const [worldShorts, communityShorts] = await Promise.all([
      searchWorldShorts(category, q),
      getCommunityShorts(),
    ]);
    const combined =
      category === 'community'
        ? communityShorts
        : category === 'all' && !q
          ? [...communityShorts.slice(0, 4), ...worldShorts]
          : worldShorts.length > 0
            ? worldShorts
            : communityShorts;
    res.json({ shorts: combined });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/tv-handoff', (req, res) => {
  try {
    const session = createTvHandoffSession(req.body || {});
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.get('/api/tv-handoff/:code', (req, res) => {
  const claim = req.query.claim === '1' || req.query.claim === 'true';
  const session = getTvHandoffSession(req.params.code, claim);
  if (!session) {
    return res.status(404).json({ error: 'Código de TV não encontrado ou expirado.' });
  }
  res.json(session);
});

app.post('/api/community/shorts', async (req, res) => {
  try {
    const created = await createCommunityShort({
      title: req.body?.title,
      creatorName: req.body?.creatorName,
      creatorColor: req.body?.creatorColor,
      description: req.body?.description,
      mediaType: req.body?.mediaType,
      videoUrl: req.body?.videoUrl,
      youtubeId: req.body?.youtubeId,
      posterUrl: req.body?.posterUrl,
      audioTitle: req.body?.audioTitle,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/shorts/:id/like', async (req, res) => {
  try {
    const upd = await likeCommunityShort(req.params.id);
    res.json(upd || { id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/lives', async (_req, res) => {
  try {
    const lives = await getActiveLives();
    res.json({ lives });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/lives', async (req, res) => {
  try {
    const live = await startOrUpdateLive({
      id: req.body?.id,
      hostName: req.body?.hostName,
      hostColor: req.body?.hostColor,
      title: req.body?.title,
      theme: req.body?.theme,
      posterUrl: req.body?.posterUrl,
      isLive: req.body?.isLive !== false,
      likeDelta: Number(req.body?.likeDelta || 0),
    });
    res.json(live);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.get('/tv', (_req, res) => {
  res.redirect(302, '/?tvMode=1');
});

app.get('/tv/:code', (req, res) => {
  const c = String(req.params.code || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 12);
  res.redirect(302, c ? `/?tv=${encodeURIComponent(c)}` : '/?tvMode=1');
});

app.get('/app', (_req, res) => {
  res.redirect(302, '/download/apk');
});

// Serve built frontend with optimized mobile/desktop HTTP caching
if (fs.existsSync(DIST_DIR)) {
  app.use(
    '/assets',
    express.static(path.join(DIST_DIR, 'assets'), { maxAge: '365d', immutable: true })
  );
  app.use(
    express.static(DIST_DIR, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      },
    })
  );
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3000;

async function boot() {
  if (isSupabaseEnabled()) {
    console.log('[Supabase] Cloud PostgreSQL enabled — hydrating LENKYX state...');
    const cloudAuth = await hydrateAuthFromSupabase();
    if (cloudAuth) {
      auth.replaceConfig(cloudAuth);
    } else {
      await syncAuthToSupabase(auth.getConfig());
    }
    const localDb = readDb();
    const cloudDb = await hydrateDbFromSupabase(localDb);
    if (cloudDb) {
      fs.writeFileSync(DB_PATH, JSON.stringify(cloudDb, null, 2), 'utf-8');
    }
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LENKYX Cosmic Phonk Server running on http://0.0.0.0:${PORT}`);
    console.log(
      `Storage mode: ${isSupabaseEnabled() ? 'Supabase Cloud PostgreSQL + local cache' : 'Local JSON'} | Data dir: ${DATA_DIR}`
    );
    // Warm up 300+ movies, 100+ series, 50+ animes & 7,200+ Live TV caches in background
    setTimeout(() => {
      void getMoviesDirectory().catch(() => {});
      void getLiveTvDirectory().catch(() => {});
    }, 2000);
  });
}

void boot();

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
  getFamousArtistsWithPhotos,
  CURATED_PLAYLISTS,
} from './musicAI.js';

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

app.get('/api/world-directory', async (_req, res) => {
  try {
    const artists = await getFamousArtistsWithPhotos();
    res.json({ artists, playlists: CURATED_PLAYLISTS });
  } catch {
    res.json({ artists: [], playlists: CURATED_PLAYLISTS });
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

app.get('/sitemap.xml', (req, res) => {
  const db = readDb();
  const base = (db.settings?.publicUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const now = new Date().toISOString().slice(0, 10);
  const urls = [
    `<url><loc>${base}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
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
    latestVersionCode: 13,
    latestVersionName: '2.0.9',
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
  });
}

void boot();

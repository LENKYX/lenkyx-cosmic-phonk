import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
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
  fetchYouTubeVideoComments,
  fetchCreatorProfile,
  getFamousArtistsWithPhotos,
  fetchArtistPhotoAndBio,
  FAMOUS_ARTISTS_DIRECTORY,
  getWorldNewReleases,
  resolveBackgroundAudioStream,
  getSunoDiscoverHub,
  OFFLINE_GENRE_FOLDERS,
  getOfflineGenrePack,
  CURATED_PLAYLISTS,
  getBrCreatorsRanked,
  voteBrCreator,
} from './musicAI.js';
import { getMoviesDirectory, searchMovies, getSeriesSeasonsAndEpisodes } from './moviesAI.js';
import { getSportsDirectory, searchSports } from './sportsAI.js';
import { getLiveTvDirectory, searchLiveTv } from './tvAI.js';
import {
  getSearchSuggestions,
  runCosmicWebSearch,
  readSafeWebPage,
} from './webSearchAI.js';
import {
  fetchWorldNews,
  fetchMarketsData,
  getOrUpdateAutoPortfolio,
  fetchShoppingProducts,
  createInstantOrder,
  getRecentOrders,
  fetchDarkWebIntel,
  postDarkWebChat,
  inspectHostSecurity,
  resolveIdeaPlanetContent,
  registerCallPeer,
  getCallDirectory,
  pushCallSignal,
  pollCallSignals,
  getGalaxyConsciousness,
  stepAutonomousConsciousness,
  replyAsConsciousNpc,
  AI_CITIZENS,
  synthesizeLocalNeuralVoice,
  getAmbientAiConversation,
  fetchSatelliteLiveOverview,
  stepRobotWorkers,
  getRobotFleetStatus,
  startAutonomousWorldSync,
} from './worldsAutonomous.js';
import {
  getChatMessages,
  postChatMessage,
  getCommentsForTarget,
  postComment,
  likeComment,
  getCommunityShorts,
  createCommunityShort,
  likeCommunityShort,
  getUserLikedShortIds,
  applyShortLikeOverlay,
  getCreatorChannels,
  upsertCreatorChannel,
  addCreatorChannelVideo,
  deleteCreatorChannelVideo,
  addCreatorChannelPost,
  submitCopyrightReport,
  getActiveLives,
  startOrUpdateLive,
  getChannelSubscriptions,
  toggleChannelSubscribe,
  createTvHandoffSession,
  getTvHandoffSession,
} from './communityStore.js';
import {
  getHubOverview,
  joinFreeGiveaway,
  drawFreeGiveaway,
  createFreeGiveaway,
  createSupportGoal,
  recordGoalSupport,
  spinCosmicWheel,
  claimCosmicMission,
} from './cosmicHub.js';
import {
  getArcadeDirectory,
  searchAllGenerationsGames,
  getWorldBootstrap,
  syncWorldPresence,
  postWorldProgress,
  postSectorChat,
} from './arcadeAI.js';
import {
  registerSale,
  listSales,
  updateCommissionConfig,
  updateSaleStatus,
  deleteSale,
} from './commissionStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Environment-configurable directories so cloud volumes (Render Disk / Railway Volume) persist across deploys!
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const STORAGE_ROOT = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(ROOT, 'storage');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const STORAGE_AUDIO = path.join(STORAGE_ROOT, 'audio');
const STORAGE_COVERS = path.join(STORAGE_ROOT, 'covers');
const STORAGE_VIDEOS = path.join(STORAGE_ROOT, 'videos');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(STORAGE_AUDIO, { recursive: true });
fs.mkdirSync(STORAGE_COVERS, { recursive: true });
fs.mkdirSync(STORAGE_VIDEOS, { recursive: true });

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
    const migrated = migrateIfNeeded(parsed);
    if (
      migrated?.settings &&
      (!migrated.settings.pixKeyConfigured ||
        !migrated.settings.pixKey ||
        migrated.settings.pixKey === 'lenkyx.cosmic@pix.exemplo.com')
    ) {
      migrated.settings.pixKey = '41651191808';
      migrated.settings.pixKeyConfigured = true;
      migrated.settings.pixName = migrated.settings.pixName || 'LENKYX COSMIC PHONK';
      writeDb(migrated);
    }
    return migrated;
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
    else if (file.fieldname === 'video') cb(null, STORAGE_VIDEOS);
    else cb(null, STORAGE_COVERS);
  },
  filename: (req, file, cb) => {
    const isAudio = file.fieldname === 'audio' || file.fieldname === 'audioV2';
    const isVideo = file.fieldname === 'video';
    const safeExt =
      path.extname(file.originalname || '').toLowerCase() || (isVideo ? '.webm' : isAudio ? '.wav' : '.jpg');
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
app.use('/covers', (req, res, next) => {
  if (/^\/(icon-|favicon|apple-touch-icon|lenkyx-app)/i.test(req.path)) {
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  }
  next();
}, express.static(path.join(PUBLIC_DIR, 'covers'), { maxAge: '7d' }));
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

function getEffectiveSettings(db) {
  const s = { ...(db?.settings || {}) };
  if (!s.affiliateMlTool) {
    s.affiliateMlTool = String(process.env.AFFILIATE_ML_TOOL || '61298625').trim();
  }
  if (!s.affiliateMlWord) {
    s.affiliateMlWord = String(process.env.AFFILIATE_ML_WORD || 'hera20240419111826').trim();
  }
  if (!s.affiliateShopeeId && process.env.AFFILIATE_SHOPEE_ID) {
    s.affiliateShopeeId = String(process.env.AFFILIATE_SHOPEE_ID).trim();
  }
  if (!s.affiliateAmazonTag && process.env.AFFILIATE_AMAZON_TAG) {
    s.affiliateAmazonTag = String(process.env.AFFILIATE_AMAZON_TAG).trim();
  }
  if (!s.whatsappStoreNumber) {
    s.whatsappStoreNumber = String(process.env.WHATSAPP_STORE_NUMBER || '5567996785099').trim();
  }
  return s;
}

// === PUBLIC API ROUTES ===
app.get('/api/state', (req, res) => {
  const db = readDb();
  res.json({
    ...db,
    settings: getEffectiveSettings(db),
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

const artistPhotoCache = new Map();

app.get('/api/artist-photo', async (req, res) => {
  const raw = String(req.query.u || '').trim();
  if (!raw.startsWith('https://')) return res.status(400).end();
  try {
    const parsed = new URL(raw);
    const allowed = ['upload.wikimedia.org', 'thumb.wikimedia.org', 'commons.wikimedia.org', 'is1-ssl.mzstatic.com', 'i.ytimg.com'];
    if (!allowed.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
      return res.status(403).end();
    }
    const cached = artistPhotoCache.get(raw);
    if (cached && Date.now() - cached.ts < 12 * 3600 * 1000) {
      res.setHeader('Content-Type', cached.type);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buf);
    }
    const upstream = await fetch(raw, {
      headers: {
        'User-Agent': 'LENKYX-Cosmic-Phonk/2.0 (https://lenkyx-cosmic-phonk.onrender.com)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!upstream.ok) return res.status(upstream.status).end();
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (artistPhotoCache.size > 160) {
      const firstKey = artistPhotoCache.keys().next().value;
      if (firstKey) artistPhotoCache.delete(firstKey);
    }
    artistPhotoCache.set(raw, { ts: Date.now(), type: contentType, buf });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buf);
  } catch {
    return res.status(502).end();
  }
});

app.get('/api/offline-folders', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    maxPerFolder: 500,
    folders: OFFLINE_GENRE_FOLDERS,
  });
});

app.get('/api/offline-folders/:id', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const id = String(req.params.id || 'phonk');
  const limit = Number(req.query.limit || 100);
  try {
    const db = readDb();
    const pack = await getOfflineGenrePack(id, limit, db.tracks || []);
    res.json(pack);
  } catch {
    res.status(500).json({ error: 'Falha ao montar pasta offline.' });
  }
});

app.get('/api/suno-artists', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const data = await getSunoDiscoverHub(refresh);
    res.json(data);
  } catch {
    res.json({ updatedAt: new Date().toISOString(), artists: [], tracks: [] });
  }
});

app.get('/api/world-audio-fallback', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const title = String(req.query.title || '').trim();
  const artist = String(req.query.artist || '').trim();
  try {
    const info = await resolveBackgroundAudioStream(title, artist);
    res.json(info);
  } catch {
    res.json({ audioUrl: '', title, artist });
  }
});

app.get('/api/world-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const space = req.query.space === '1' || req.query.space === 'true';
  try {
    const payload = await runSmartWorldSearch(q, { includeArchiveSpace: space });
    const qLow = q.toLowerCase();
    // Only surface user/MORRO GOLD local tracks when the user explicitly searches for their own catalog!
    const brandQuery = q.length >= 2 && (qLow.includes('lenkyx') || qLow.includes('morro gold'));
    if (brandQuery) {
      const db = readDb();
      const ownCatalog = db.tracks || [];
      let localMatches = ownCatalog.filter((t) =>
        `${t.artist || ''} ${t.title || ''}`.toLowerCase().includes(qLow)
      );
      if (localMatches.length === 0) {
        // remove as palavras da marca e tenta casar com título/faixa do catálogo
        const bare = qLow.replace(/lenkyx|morro gold/g, '').trim();
        if (bare) {
          localMatches = ownCatalog.filter((t) =>
            `${t.artist || ''} ${t.title || ''}`.toLowerCase().includes(bare)
          );
        }
      }
      if (localMatches.length === 0) localMatches = ownCatalog;
      const existing = new Set((payload.tracks || []).map((t) => t.id));
      const merged = [...localMatches.filter((t) => !existing.has(t.id)), ...(payload.tracks || [])].map(
        (t, i) => ({ ...t, number: i + 1 })
      );
      payload.tracks = merged;
      // Canal oficial SEMPRE vence em busca da própria marca (estilo canal do YouTube)
      const isGold = qLow.includes('morro gold');
      const localName = isGold ? 'MORRO GOLD' : 'LENKYX';
      const localSlug = isGold ? 'morrogold' : 'lenkyx';
      payload.artistProfile = {
        name: localName,
        photoUrl: '/covers/morro-gold-emblema-grosso.png',
        bio: `Catálogo oficial ${localName} — tudo que o artista já lançou de músicas e clipes, completo e sem anúncios.`,
        genre: 'Favela / Phonk / Trap',
        era: 'Oficial',
        wikiUrl: '',
        handle: `@${localSlug}`,
        bannerUrl: '/covers/favela-night-skyline.jpg',
        country: 'Brasil',
        musicCount: merged.length,
        clipCount: merged.filter((t) => t.youtubeVideoId).length,
        links: {
          youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(localName + ' official')}`,
          instagram: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(localName)}`,
          wikipedia: '',
        },
      };
    }
    res.json(payload);
  } catch {
    res.json({ tracks: [], playlists: CURATED_PLAYLISTS, artistProfile: null, aiInsight: null });
  }
});

// === LENKYX COSMIC GOOGLE+AI OMNIBOX SEARCH & PRIVATE WEB READER ===
app.get('/api/search-suggest', async (req, res) => {
  const q = String(req.query.q || '').trim();
  try {
    const suggestions = await getSearchSuggestions(q);
    res.json({ query: q, suggestions });
  } catch {
    res.json({ query: q, suggestions: [] });
  }
});

app.get('/api/web-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const mode = String(req.query.mode || 'ai') === 'web' ? 'web' : 'ai';
  const privateMode = req.query.private === '1' || req.query.private === 'true';
  if (privateMode) {
    res.setHeader('Cache-Control', 'no-store');
  }
  try {
    const payload = await runCosmicWebSearch(q, { mode, privateMode });
    res.json(payload);
  } catch {
    res.json({ query: q, mode, privateMode, aiSummary: null, webResults: [] });
  }
});

app.get('/api/web-reader', async (req, res) => {
  const u = String(req.query.url || '').trim();
  res.setHeader('Cache-Control', 'no-store');
  try {
    const page = await readSafeWebPage(u);
    res.json({ ok: true, page });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message || 'Não foi possível carregar o site.' });
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

app.get('/api/series-episodes', async (req, res) => {
  const title = String(req.query.title || '').trim();
  const season = Number(req.query.season || 1);
  const playlistId = String(req.query.playlistId || '').trim();
  const mediaType = String(req.query.mediaType || 'series').trim();
  try {
    const payload = await getSeriesSeasonsAndEpisodes({ title, season, playlistId, mediaType });
    res.json(payload);
  } catch {
    res.json({ seriesTitle: title, season: 1, seasons: [{ number: 1, name: 'Temporada 1', episodeCount: 0 }], episodes: [] });
  }
});

// === LENKYX ARENA AO VIVO (FUTEBOL & UFC/MMA EM TEMPO REAL) ===
app.use('/api/sports-', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/sports-directory', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const payload = await getSportsDirectory(refresh);
    res.json(payload);
  } catch {
    res.json({ scoreboard: { soccer: [], mma: [] }, categories: [] });
  }
});

app.get('/api/sports-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const sport = String(req.query.sport || 'all').trim();
  const liveOnly = req.query.live === '1' || req.query.live === 'true';
  try {
    const items = await searchSports(q, sport, liveOnly);
    res.json({ items });
  } catch {
    res.json({ items: [] });
  }
});

// === REAL-TIME ONLINE LISTENERS + DAILY PIX GOAL + APP POPULARITY + SUPPORTER RANKING & ALIEN MASCOTS ===
const LIVE_STATS_PATH = path.join(DATA_DIR, 'live-stats.json');
const activeListenerSessions = new Map(); // sessionId -> { ts, activity }
const seenVisitorSessions = new Set();
const LISTENER_TTL_MS = 180 * 1000; // 3 min heartbeat window

function getTodayBrtKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function computePopularityMeta(store, onlineCount = 1) {
  const visits = Math.max(1, Number(store.totalVisits || 0));
  const shares = Math.max(0, Number(store.totalShares || 0));
  const contributors = Math.max(0, Number(store.dailyContributors || 0));
  const score = visits * 4 + shares * 25 + contributors * 35 + Math.max(1, onlineCount) * 8;
  let level = 'Radar Cósmico';
  if (score >= 5000) level = 'Super Nova LENKYX';
  else if (score >= 2000) level = 'Fenômeno Viral';
  else if (score >= 700) level = 'Tendência Brasil';
  else if (score >= 150) level = 'Em Alta';
  return {
    totalVisits: visits,
    totalShares: shares,
    popularityScore: score,
    popularityLevel: level,
  };
}

function pickUniqueMascotId(existingIds = []) {
  const owned = new Set((existingIds || []).map((n) => Number(n)));
  if (owned.size >= 1000) return ((owned.size % 1000) + 1);
  // Try random picks first, then linear scan for guaranteed unique ID in 1..1000
  for (let i = 0; i < 40; i++) {
    const candidate = Math.floor(Math.random() * 1000) + 1;
    if (!owned.has(candidate)) return candidate;
  }
  for (let id = 1; id <= 1000; id++) {
    if (!owned.has(id)) return id;
  }
  return 1;
}

function getSortedLeaderboard(supporters = []) {
  return [...(supporters || [])]
    .sort((a, b) => Number(b.totalBrl || 0) - Number(a.totalBrl || 0) || Number(b.donationsCount || 0) - Number(a.donationsCount || 0))
    .slice(0, 50);
}

const DEFAULT_ARTIST_PLAYS = {
  'henrique & juliano': { name: 'Henrique & Juliano', count: 198, photoUrl: '', genre: 'Sertanejo · #1 Brasil' },
  'gusttavo lima': { name: 'Gusttavo Lima', count: 164, photoUrl: '', genre: 'Sertanejo · Embaixador' },
  'ana castela': { name: 'Ana Castela', count: 142, photoUrl: '', genre: 'Agronejo / Sertanejo' },
  'mc ryan sp': { name: 'MC Ryan SP', count: 126, photoUrl: '', genre: 'Funk Brasil' },
  matue: { name: 'Matuê', count: 118, photoUrl: '', genre: 'Trap Brasil' },
};

function isExcludedCreatorBrand(name) {
  const n = String(name || '').trim().toLowerCase();
  return !n || n.includes('lenkyx');
}

function needsArtistPhotoRefresh(name, photoUrl) {
  const n = String(name || '').trim().toLowerCase();
  const p = String(photoUrl || '').trim();
  if (!p) return true;
  if (n === 'lenkyx') return p !== '/covers/icon-512.png';
  return p.includes('album-official.jpg') || p.includes('avatar.jpg');
}

async function enrichTopArtistsWithPhotos(store) {
  const ranked = Object.entries(store.artistPlays || {})
    .filter(([, art]) => art && !isExcludedCreatorBrand(art.name))
    .sort((a, b) => Number(b[1]?.count || 0) - Number(a[1]?.count || 0))
    .slice(0, 5);
  let dirty = false;
  await Promise.all(
    ranked.map(async ([key, art]) => {
      if (!art || !needsArtistPhotoRefresh(art.name, art.photoUrl)) return;
      if (String(art.name || '').trim().toLowerCase() === 'lenkyx') {
        store.artistPlays[key] = { ...art, photoUrl: '/covers/icon-512.png' };
        dirty = true;
        return;
      }
      const dirMatch = FAMOUS_ARTISTS_DIRECTORY.find(
        (d) => d.name.toLowerCase() === String(art.name || '').trim().toLowerCase()
      );
      const info = await fetchArtistPhotoAndBio(
        art.name,
        dirMatch?.lang || 'pt',
        dirMatch?.wiki || ''
      ).catch(() => null);
      if (info?.photoUrl) {
        store.artistPlays[key] = { ...art, photoUrl: info.photoUrl };
        dirty = true;
      }
    })
  );
  if (dirty) writeLiveStatsStore(store);
}

function readLiveStatsStore() {
  const today = getTodayBrtKey();
  const defaults = {
    dateKey: today,
    dailyGoalBrl: 50,
    dailyCollectedBrl: 0,
    dailyContributors: 0,
    totalVisits: 120,
    totalShares: 18,
    recentSupporters: [],
    supporters: [],
    artistPlays: { ...DEFAULT_ARTIST_PLAYS },
    videoPlays: {},
    moviePlays: {},
  };
  try {
    if (!fs.existsSync(LIVE_STATS_PATH)) {
      fs.writeFileSync(LIVE_STATS_PATH, JSON.stringify(defaults, null, 2), 'utf-8');
      return defaults;
    }
    const parsed = JSON.parse(fs.readFileSync(LIVE_STATS_PATH, 'utf-8'));
    const persistedArtistPlays =
      parsed.artistPlays && Object.keys(parsed.artistPlays).length > 0
        ? parsed.artistPlays
        : { ...DEFAULT_ARTIST_PLAYS };
    const persistedVideoPlays = parsed.videoPlays && typeof parsed.videoPlays === 'object' ? parsed.videoPlays : {};
    const persistedMoviePlays = parsed.moviePlays && typeof parsed.moviePlays === 'object' ? parsed.moviePlays : {};
    if (parsed.dateKey !== today) {
      const rolled = {
        dateKey: today,
        dailyGoalBrl: Number(parsed.dailyGoalBrl) > 0 ? Number(parsed.dailyGoalBrl) : 50,
        dailyCollectedBrl: 0,
        dailyContributors: 0,
        totalVisits: Number(parsed.totalVisits || 120),
        totalShares: Number(parsed.totalShares || 18),
        recentSupporters: [],
        supporters: Array.isArray(parsed.supporters) ? parsed.supporters : [],
        pendingPixPledges: Array.isArray(parsed.pendingPixPledges) ? parsed.pendingPixPledges : [],
        approvedPixPledges: Array.isArray(parsed.approvedPixPledges) ? parsed.approvedPixPledges.slice(0, 40) : [],
        usedPixE2eIds: Array.isArray(parsed.usedPixE2eIds) ? parsed.usedPixE2eIds.slice(-300) : [],
        artistPlays: persistedArtistPlays,
        videoPlays: persistedVideoPlays,
        moviePlays: persistedMoviePlays,
      };
      fs.writeFileSync(LIVE_STATS_PATH, JSON.stringify(rolled, null, 2), 'utf-8');
      return rolled;
    }
    return {
      ...defaults,
      ...parsed,
      totalVisits: Number(parsed.totalVisits ?? defaults.totalVisits),
      totalShares: Number(parsed.totalShares ?? defaults.totalShares),
      supporters: Array.isArray(parsed.supporters) ? parsed.supporters : [],
      pendingPixPledges: Array.isArray(parsed.pendingPixPledges) ? parsed.pendingPixPledges : [],
      approvedPixPledges: Array.isArray(parsed.approvedPixPledges) ? parsed.approvedPixPledges : [],
      usedPixE2eIds: Array.isArray(parsed.usedPixE2eIds) ? parsed.usedPixE2eIds : [],
      artistPlays: persistedArtistPlays,
      videoPlays: persistedVideoPlays,
      moviePlays: persistedMoviePlays,
    };
  } catch {
    return defaults;
  }
}

function buildTop5Rankings(store) {
  const rankTop5 = (mapObj, filterFn) =>
    Object.values(mapObj || {})
      .filter((item) => (!filterFn ? true : filterFn(item)))
      .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));
  return {
    topArtists: rankTop5(store.artistPlays, (item) => !isExcludedCreatorBrand(item?.name)),
    topVideos: rankTop5(store.videoPlays, (item) => !isExcludedCreatorBrand(item?.artist)),
    topMovies: rankTop5(store.moviePlays),
  };
}

function writeLiveStatsStore(data) {
  try {
    fs.writeFileSync(LIVE_STATS_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

function pruneAndCountListeners() {
  const now = Date.now();
  for (const [sid, info] of activeListenerSessions.entries()) {
    if (now - info.ts > LISTENER_TTL_MS) activeListenerSessions.delete(sid);
  }
  return Math.max(1, activeListenerSessions.size);
}

app.get('/api/live-stats', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const store = readLiveStatsStore();
  const onlineCount = pruneAndCountListeners();
  const { pendingPixPledges: _p, usedPixE2eIds: _u, ...publicStore } = store;
  res.json({
    onlineCount,
    ...publicStore,
    pendingPixCount: Array.isArray(_p) ? _p.length : 0,
    ...computePopularityMeta(store, onlineCount),
    leaderboard: getSortedLeaderboard(store.supporters),
  });
});

app.post('/api/live-stats/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const sid = String(req.body?.sessionId || req.ip || 'anon').slice(0, 64);
  const activity = String(req.body?.activity || 'music').slice(0, 32);
  activeListenerSessions.set(sid, { ts: Date.now(), activity });
  const store = readLiveStatsStore();
  if (!seenVisitorSessions.has(sid)) {
    seenVisitorSessions.add(sid);
    store.totalVisits = Number(store.totalVisits || 0) + 1;
    writeLiveStatsStore(store);
  }
  const onlineCount = pruneAndCountListeners();
  res.json({
    onlineCount,
    ...store,
    ...computePopularityMeta(store, onlineCount),
    leaderboard: getSortedLeaderboard(store.supporters),
  });
});

app.get('/api/rankings', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const store = readLiveStatsStore();
  await enrichTopArtistsWithPhotos(store).catch(() => {});
  res.json(buildTop5Rankings(store));
});

app.post('/api/rankings/hit', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const kind = String(req.body?.kind || 'artist');
  const store = readLiveStatsStore();

  if (kind === 'artist') {
    const rawName = String(req.body?.name || '').replace(/ - Topic$/i, '').trim().slice(0, 60);
    if (rawName && !isExcludedCreatorBrand(rawName)) {
      const key = rawName.toLowerCase();
      const prev = store.artistPlays[key] || { name: rawName, count: 0 };
      const incomingPhoto = String(req.body?.photoUrl || '').trim();
      const safeIncoming =
        incomingPhoto && !incomingPhoto.includes('album-official.jpg') ? incomingPhoto : '';
      const resolvedPhoto =
        safeIncoming || (prev.photoUrl && !String(prev.photoUrl).includes('album-official.jpg') ? prev.photoUrl : '');
      store.artistPlays[key] = {
        name: rawName,
        count: Number(prev.count || 0) + 1,
        photoUrl: resolvedPhoto,
        genre: String(req.body?.genre || prev.genre || ''),
        lastPlayedAt: new Date().toISOString(),
      };
    }
  } else if (kind === 'video') {
    const id = String(req.body?.id || req.body?.youtubeVideoId || '').trim().slice(0, 80);
    const title = String(req.body?.title || '').trim().slice(0, 90);
    if (id && title) {
      const prev = store.videoPlays[id] || { id, count: 0 };
      store.videoPlays[id] = {
        id,
        title,
        artist: String(req.body?.artist || prev.artist || 'LENKYX').slice(0, 50),
        coverUrl: String(req.body?.coverUrl || prev.coverUrl || '/covers/icon-512.png'),
        youtubeVideoId: String(req.body?.youtubeVideoId || prev.youtubeVideoId || ''),
        audioUrl: String(req.body?.audioUrl || prev.audioUrl || ''),
        durationSec: Number(req.body?.durationSec || prev.durationSec || 180),
        count: Number(prev.count || 0) + 1,
        lastPlayedAt: new Date().toISOString(),
      };
    }
  } else if (kind === 'movie') {
    const id = String(req.body?.id || '').trim().slice(0, 80);
    const title = String(req.body?.title || '').trim().slice(0, 90);
    if (id && title) {
      const prev = store.moviePlays[id] || { id, count: 0 };
      store.moviePlays[id] = {
        id,
        title,
        subtitle: String(req.body?.subtitle || prev.subtitle || 'Cinema HD').slice(0, 60),
        posterUrl: String(req.body?.posterUrl || prev.posterUrl || '/covers/icon-512.png'),
        youtubeVideoId: String(req.body?.youtubeVideoId || prev.youtubeVideoId || ''),
        youtubePlaylistId: String(req.body?.youtubePlaylistId || prev.youtubePlaylistId || ''),
        mediaType: String(req.body?.mediaType || prev.mediaType || 'movie'),
        count: Number(prev.count || 0) + 1,
        lastPlayedAt: new Date().toISOString(),
      };
    }
  }

  writeLiveStatsStore(store);
  res.json({ ok: true, ...buildTop5Rankings(store) });
});

app.post('/api/live-stats/share', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const store = readLiveStatsStore();
  store.totalShares = Number(store.totalShares || 0) + 1;
  writeLiveStatsStore(store);
  const onlineCount = pruneAndCountListeners();
  res.json({
    ok: true,
    channel: String(req.body?.channel || 'social').slice(0, 32),
    onlineCount,
    ...store,
    ...computePopularityMeta(store, onlineCount),
    leaderboard: getSortedLeaderboard(store.supporters),
  });
});

app.post('/api/live-stats/pix-pledge', (req, res) => {
  const amount = Math.round(Number(req.body?.amount || 0) * 100) / 100;
  const donorName = String(req.body?.donorName || 'Cria MORRO GOLD').trim().slice(0, 40) || 'Cria MORRO GOLD';
  const donorKey = String(req.body?.supporterId || donorName.toLowerCase().replace(/\s+/g, '-')).slice(0, 48);
  const existingOwned = Array.isArray(req.body?.ownedMascots) ? req.body.ownedMascots.map(Number) : [];
  const rawE2eId = String(req.body?.e2eId || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const txid = String(req.body?.txid || 'LENKYXSOCIAL').trim().slice(0, 25);
  const receiptDataUrl = String(req.body?.receiptDataUrl || '').trim();

  if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
    return res.status(400).json({ error: 'Informe um valor válido entre R$ 1 e R$ 10.000.' });
  }

  const hasValidE2e = /^E[A-Z0-9]{20,40}$/.test(rawE2eId);
  const hasReceiptImg = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]{100,}$/i.test(receiptDataUrl) && receiptDataUrl.length < 2_200_000;

  if (!hasValidE2e && !hasReceiptImg) {
    return res.status(400).json({
      error:
        'Para evitar resgates sem pagamento, informe o ID da Transação PIX (código E... com 20+ caracteres do comprovante) ou anexe a imagem do comprovante PIX.',
    });
  }

  const store = readLiveStatsStore();
  const usedIds = new Set(Array.isArray(store.usedPixE2eIds) ? store.usedPixE2eIds : []);
  const pending = Array.isArray(store.pendingPixPledges) ? [...store.pendingPixPledges] : [];

  if (hasValidE2e && (usedIds.has(rawE2eId) || pending.some((p) => p.e2eId === rawE2eId))) {
    return res.status(409).json({
      error: 'Esse ID de Transação PIX (E2E) já foi enviado anteriormente. Use o comprovante de um novo PIX.',
    });
  }

  const pledge = {
    id: `pix_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    amount,
    donorName,
    supporterId: donorKey,
    ownedMascots: existingOwned.slice(0, 1000),
    e2eId: hasValidE2e ? rawE2eId : '',
    txid,
    receiptDataUrl: hasReceiptImg ? receiptDataUrl : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  store.pendingPixPledges = [pledge, ...pending].slice(0, 60);
  writeLiveStatsStore(store);

  res.status(202).json({
    ok: true,
    status: 'pending',
    pledgeId: pledge.id,
    message:
      'Comprovante recebido! Seu bonequinho surpresa será desbloqueado automaticamente assim que o PIX for confirmado.',
  });
});

app.get('/api/live-stats/pix-status', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const supporterId = String(req.query.supporterId || '').trim().slice(0, 48);
  if (!supporterId) return res.json({ ok: true, pending: [], approved: [] });
  const store = readLiveStatsStore();
  const pending = (store.pendingPixPledges || [])
    .filter((p) => p.supporterId === supporterId)
    .map(({ receiptDataUrl: _r, ...rest }) => rest);
  const approved = (store.approvedPixPledges || []).filter((a) => a.supporterId === supporterId);
  res.json({ ok: true, pending, approved });
});

app.get('/api/live-stats/pix-pending', auth.requireCreator, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const store = readLiveStatsStore();
  res.json({
    ok: true,
    pending: Array.isArray(store.pendingPixPledges) ? store.pendingPixPledges : [],
  });
});

app.post('/api/live-stats/pix-verify', auth.requireCreator, (req, res) => {
  const pledgeId = String(req.body?.pledgeId || '').trim();
  const action = req.body?.action === 'reject' ? 'reject' : 'approve';
  const store = readLiveStatsStore();
  const pending = Array.isArray(store.pendingPixPledges) ? [...store.pendingPixPledges] : [];
  const idx = pending.findIndex((p) => p.id === pledgeId);
  if (idx === -1) return res.status(404).json({ error: 'Comprovante PIX não encontrado ou já processado.' });

  const [pledge] = pending.splice(idx, 1);
  store.pendingPixPledges = pending;

  if (action === 'reject') {
    writeLiveStatsStore(store);
    const onlineCount = pruneAndCountListeners();
    return res.json({
      ok: true,
      rejected: true,
      pending,
      onlineCount,
      ...store,
      ...computePopularityMeta(store, onlineCount),
      leaderboard: getSortedLeaderboard(store.supporters),
    });
  }

  // Approved: PIX confirmed in PicPay! Now unlock mascot & credit ranking/goal
  const amount = Number(pledge.amount || 0);
  const donorName = pledge.donorName || 'Cria MORRO GOLD';
  const donorKey = pledge.supporterId || donorName.toLowerCase().replace(/\s+/g, '-');
  const existingOwned = Array.isArray(pledge.ownedMascots) ? pledge.ownedMascots : [];

  if (pledge.e2eId) {
    store.usedPixE2eIds = Array.from(new Set([...(store.usedPixE2eIds || []), pledge.e2eId])).slice(-300);
  }
  store.dailyCollectedBrl = Math.round((Number(store.dailyCollectedBrl || 0) + amount) * 100) / 100;
  store.dailyContributors = Number(store.dailyContributors || 0) + 1;
  store.recentSupporters = [
    { name: donorName, amount, at: new Date().toISOString() },
    ...(store.recentSupporters || []),
  ].slice(0, 8);

  const supporters = Array.isArray(store.supporters) ? [...store.supporters] : [];
  let entry = supporters.find(
    (s) => s.id === donorKey || String(s.name || '').toLowerCase() === donorName.toLowerCase()
  );
  const combinedOwned = Array.from(new Set([...(entry?.mascots || []), ...existingOwned]));
  const unlockedMascotId = pickUniqueMascotId(combinedOwned);
  const nextMascots = [...(entry?.mascots || []), unlockedMascotId];

  if (entry) {
    entry.name = donorName;
    entry.totalBrl = Math.round((Number(entry.totalBrl || 0) + amount) * 100) / 100;
    entry.donationsCount = Number(entry.donationsCount || 0) + 1;
    entry.mascots = Array.from(new Set(nextMascots));
    entry.lastDonationAt = new Date().toISOString();
  } else {
    entry = {
      id: donorKey || `sup-${Date.now().toString(36)}`,
      name: donorName,
      totalBrl: amount,
      donationsCount: 1,
      mascots: [unlockedMascotId],
      lastDonationAt: new Date().toISOString(),
    };
    supporters.push(entry);
  }
  store.supporters = supporters;
  store.approvedPixPledges = [
    {
      id: pledge.id,
      supporterId: donorKey,
      donorName,
      amount,
      unlockedMascotId,
      approvedAt: new Date().toISOString(),
    },
    ...(store.approvedPixPledges || []),
  ].slice(0, 40);

  writeLiveStatsStore(store);

  const onlineCount = pruneAndCountListeners();
  res.json({
    ok: true,
    unlockedMascotId,
    supporterEntry: entry,
    pending,
    onlineCount,
    ...store,
    ...computePopularityMeta(store, onlineCount),
    leaderboard: getSortedLeaderboard(store.supporters),
  });
});

app.post('/api/live-stats/pix-goal', auth.requireCreator, (req, res) => {
  const store = readLiveStatsStore();
  if (req.body?.dailyGoalBrl !== undefined) {
    const g = Number(req.body.dailyGoalBrl);
    if (Number.isFinite(g) && g >= 5) store.dailyGoalBrl = Math.round(g * 100) / 100;
  }
  if (req.body?.dailyCollectedBrl !== undefined) {
    const c = Number(req.body.dailyCollectedBrl);
    if (Number.isFinite(c) && c >= 0) store.dailyCollectedBrl = Math.round(c * 100) / 100;
  }
  writeLiveStatsStore(store);
  const onlineCount = pruneAndCountListeners();
  res.json({
    ok: true,
    onlineCount,
    ...store,
    ...computePopularityMeta(store, onlineCount),
    leaderboard: getSortedLeaderboard(store.supporters),
  });
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

// Safe Streaming CORS & Range Audio/Media Proxy (Suno, Audius, Archive, iTunes, Jamendo CDNs)
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
      host.endsWith('.archive.org') ||
      host.endsWith('.us.archive.org') ||
      host.endsWith('.mzstatic.com') ||
      host.endsWith('.itunes.apple.com') ||
      host.endsWith('.jamendo.com') ||
      host.endsWith('.wikimedia.org') ||
      host === 'commondatastorage.googleapis.com');
  if (!allowed) {
    return res.status(403).json({ error: 'Host not permitted for audio proxy' });
  }
  try {
    const reqHeaders = { 'User-Agent': 'Mozilla/5.0 LENKYX-AudioStream/2.0' };
    if (req.headers.range) {
      reqHeaders.Range = String(req.headers.range);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    req.on('close', () => controller.abort());

    const upstream = await fetch(rawUrl, {
      headers: reqHeaders,
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if ((!upstream.ok && upstream.status !== 206) || !upstream.body) {
      return res.status(502).json({ error: 'Upstream media unavailable' });
    }

    const ct = upstream.headers.get('content-type') || 'audio/mpeg';
    const cl = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');
    const ar = upstream.headers.get('accept-ranges') || 'bytes';
    const asDownload = req.query.download === '1' || req.query.download === 'true';
    const rawFile = String(req.query.filename || 'MORRO-GOLD-Media')
      .replace(/[^a-zA-Z0-9._ -]+/g, '_')
      .trim()
      .slice(0, 80);

    res.status(upstream.status === 206 ? 206 : 200);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Content-Type', ct);
    res.setHeader('Accept-Ranges', ar);
    if (asDownload) {
      const ext = ct.includes('mp4') || ct.includes('video')
        ? '.mp4'
        : ct.includes('webm')
          ? '.webm'
          : ct.includes('ogg')
            ? '.ogg'
            : '.mp3';
      const finalName = rawFile.match(/\.(mp3|mp4|webm|m4a|ogg|wav)$/i) ? rawFile : `${rawFile}${ext}`;
      res.setHeader('Content-Disposition', `attachment; filename="${finalName}"`);
    }
    if (cl) res.setHeader('Content-Length', cl);
    if (cr) res.setHeader('Content-Range', cr);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const nodeStream = Readable.fromWeb(upstream.body);
    nodeStream.on('error', () => {
      if (!res.headersSent) res.status(502).end();
      else res.end();
    });
    return nodeStream.pipe(res);
  } catch {
    if (!res.headersSent) return res.status(502).json({ error: 'Proxy stream failed' });
    return res.end();
  }
});

// Universal Download Resolver (Music, Reels/Videos, Movies) — resolves direct playable/downloadable audio or MP4 stream
app.get('/api/world-resolve-download', async (req, res) => {
  const title = String(req.query.title || '').trim();
  const artist = String(req.query.artist || '').trim();
  const directUrl = String(req.query.directUrl || '').trim();
  const kind = String(req.query.kind || 'audio').trim();
  const safeName = `${artist ? `${artist} - ` : ''}${title || 'LENKYX'}`
    .replace(/[^a-zA-Z0-9._ -]+/g, ' ')
    .trim()
    .slice(0, 72);

  if (directUrl && (directUrl.startsWith('/') || directUrl.startsWith('https://'))) {
    const isLocal = directUrl.startsWith('/');
    return res.json({
      ok: true,
      url: directUrl,
      downloadUrl: isLocal
        ? directUrl
        : `/api/audio-proxy?url=${encodeURIComponent(directUrl)}&download=1&filename=${encodeURIComponent(safeName)}`,
      filename: `${safeName}${kind === 'video' || kind === 'movie' ? '.mp4' : '.mp3'}`,
      kind,
    });
  }

  try {
    if (kind === 'movie' || kind === 'video') {
      const qArchive = `${title} ${artist}`.trim();
      const arRes = await fetch(
        `https://archive.org/advancedsearch.php?q=${encodeURIComponent(`(${qArchive}) AND mediatype:movies`)}&fl[]=identifier,title&sort[]=downloads+desc&rows=4&output=json`,
        { headers: { 'User-Agent': 'LENKYX-Cinema/2.0' }, signal: AbortSignal.timeout(5000) }
      );
      if (arRes.ok) {
        const arJson = await arRes.json();
        for (const doc of arJson?.response?.docs || []) {
          try {
            const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`, {
              signal: AbortSignal.timeout(4000),
            });
            if (!metaRes.ok) continue;
            const metaJson = await metaRes.json();
            const mp4 = (metaJson?.result || []).find((f) => /\.mp4$/i.test(f.name || ''));
            if (mp4?.name) {
              const mp4Url = `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(mp4.name)}`;
              return res.json({
                ok: true,
                url: mp4Url,
                downloadUrl: `/api/audio-proxy?url=${encodeURIComponent(mp4Url)}&download=1&filename=${encodeURIComponent(safeName)}`,
                filename: `${safeName}.mp4`,
                kind: 'video',
              });
            }
          } catch {
            // continue
          }
        }
      }
    }

    const bg = await resolveBackgroundAudioStream(title, artist);
    if (bg?.audioUrl) {
      return res.json({
        ok: true,
        url: bg.audioUrl,
        downloadUrl: bg.audioUrl.startsWith('/')
          ? bg.audioUrl
          : `/api/audio-proxy?url=${encodeURIComponent(bg.audioUrl)}&download=1&filename=${encodeURIComponent(safeName)}`,
        filename: `${safeName}.mp3`,
        kind: 'audio',
        title: bg.title || title,
        artist: bg.artist || artist,
      });
    }
  } catch {
    // fallback below
  }

  return res.status(404).json({ ok: false, error: 'Stream direto indisponível para este item.' });
});

// SEO Auto-Discovery for Google / Bing / Yandex / Baidu / Global Crawlers
app.get('/robots.txt', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res
    .type('text/plain')
    .send(
      `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\nHost: ${base}\n`
    );
});

// === WORLDWIDE GEO-LOCALE AUTO-DETECTION & REAL-TIME MULTI-LANGUAGE ENGINE ===
const COUNTRY_TO_LANG = {
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en', NG: 'en', KE: 'en', GH: 'en', SG: 'en', JM: 'en',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', BO: 'es', PY: 'es', UY: 'es',
  CR: 'es', PA: 'es', DO: 'es', GT: 'es', HN: 'es', SV: 'es', NI: 'es', CU: 'es', PR: 'es',
  FR: 'fr', BE: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', CM: 'fr', MA: 'fr', DZ: 'fr', TN: 'fr', LU: 'fr',
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  IT: 'it', SM: 'it', VA: 'it',
  JP: 'ja', KR: 'ko', CN: 'zh-CN', TW: 'zh-TW', HK: 'zh-TW', MO: 'zh-TW',
  SA: 'ar', AE: 'ar', EG: 'ar', IQ: 'ar', JO: 'ar', KW: 'ar', LB: 'ar', OM: 'ar', QA: 'ar', BH: 'ar', SY: 'ar', YE: 'ar',
  IN: 'hi', RU: 'ru', BY: 'ru', KZ: 'kk', ID: 'id', MY: 'ms', TR: 'tr', VN: 'vi', TH: 'th',
  PL: 'pl', NL: 'nl', SE: 'sv', NO: 'no', DK: 'da', FI: 'fi', UA: 'uk', CZ: 'cs', RO: 'ro',
  GR: 'el', HU: 'hu', IL: 'he', IR: 'fa', PK: 'ur', BD: 'bn', PH: 'tl', TZ: 'sw', ET: 'am',
  SK: 'sk', BG: 'bg', HR: 'hr', RS: 'sr', SI: 'sl', LT: 'lt', LV: 'lv', EE: 'et', GE: 'ka', AM: 'hy', AZ: 'az',
  UZ: 'uz', MN: 'mn', MM: 'my', KH: 'km', LA: 'lo', NP: 'ne', LK: 'si', AL: 'sq', MK: 'mk', BA: 'bs', IS: 'is',
};
const RTL_LANG_SET = new Set(['ar', 'he', 'fa', 'ur', 'ps']);

function normalizeServerLang(raw) {
  const s = String(raw || '').trim();
  if (!s || s === '*') return '';
  const low = s.toLowerCase();
  if (low === 'zh-tw' || low === 'zh-hk' || low === 'zh-hant') return 'zh-TW';
  if (low.startsWith('zh')) return 'zh-CN';
  if (low === 'fil') return 'tl';
  if (low === 'iw') return 'he';
  const base = low.split(/[-_]/)[0];
  return /^[a-z]{2,3}$/.test(base) ? base : '';
}

app.get('/api/geo-locale', (req, res) => {
  const country = String(
    req.headers['cf-ipcountry'] ||
      req.headers['x-vercel-ip-country'] ||
      req.headers['x-country-code'] ||
      req.headers['x-geo-country'] ||
      ''
  )
    .trim()
    .toUpperCase();

  let lang = '';
  if (req.query?.lang) {
    lang = normalizeServerLang(req.query.lang);
  }
  if (!lang && country && COUNTRY_TO_LANG[country]) {
    lang = COUNTRY_TO_LANG[country];
  }
  if (!lang && req.headers['accept-language']) {
    const parts = String(req.headers['accept-language']).split(',');
    for (const part of parts) {
      const candidate = normalizeServerLang(part.split(';')[0]);
      if (candidate) {
        lang = candidate;
        break;
      }
    }
  }
  if (!lang) lang = 'en';

  res.json({
    ok: true,
    country: country || 'GLOBAL',
    lang,
    rtl: RTL_LANG_SET.has(lang),
    autoDetected: true,
  });
});

const serverTransCache = new Map();

async function translateSingleText(text, targetLang) {
  const clean = String(text || '').trim();
  if (!clean || !targetLang || targetLang === 'pt') return clean;
  const key = `${targetLang}::${clean}`;
  if (serverTransCache.has(key)) return serverTransCache.get(key);

  const tl = targetLang === 'jw' ? 'jv' : targetLang;
  // 1. Google Translate fast public endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(clean)}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3500),
    });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data?.[0])) {
        const out = data[0].map((seg) => (Array.isArray(seg) ? seg[0] || '' : '')).join('').trim();
        if (out) {
          if (serverTransCache.size > 12000) serverTransCache.clear();
          serverTransCache.set(key, out);
          return out;
        }
      }
    }
  } catch {
    // fallback below
  }

  // 2. MyMemory World Translation API fallback
  try {
    const mmLang = tl === 'zh-CN' ? 'zh' : tl === 'zh-TW' ? 'zh-TW' : tl;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=pt|${encodeURIComponent(mmLang)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (r.ok) {
      const data = await r.json();
      const out = String(data?.responseData?.translatedText || '').trim();
      if (out && !/^MYMEMORY WARNING/i.test(out)) {
        if (serverTransCache.size > 12000) serverTransCache.clear();
        serverTransCache.set(key, out);
        return out;
      }
    }
  } catch {
    // fallback below
  }

  // 3. Lingva free mirror fallback
  try {
    const url = `https://lingva.ml/api/v1/pt/${encodeURIComponent(tl)}/${encodeURIComponent(clean)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (r.ok) {
      const data = await r.json();
      if (data?.translation) {
        const out = String(data.translation).trim();
        if (out) {
          if (serverTransCache.size > 12000) serverTransCache.clear();
          serverTransCache.set(key, out);
          return out;
        }
      }
    }
  } catch {
    // keep original
  }
  return clean;
}

async function translateAnyText(text, sourceLang = 'auto', targetLang = 'pt') {
  const clean = String(text || '').trim();
  const sl = String(sourceLang || 'auto').trim() || 'auto';
  const tlRaw = String(targetLang || 'pt').trim() || 'pt';
  const tl = tlRaw === 'jw' ? 'jv' : tlRaw;
  if (!clean) return '';
  if (sl !== 'auto' && sl.split('-')[0] === tl.split('-')[0]) return clean;

  const key = `${sl}->${tl}::${clean}`;
  if (serverTransCache.has(key)) return serverTransCache.get(key);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(clean)}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3500),
    });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data?.[0])) {
        const out = data[0]
          .map((seg) => (Array.isArray(seg) ? seg[0] || '' : ''))
          .join('')
          .trim();
        if (out) {
          if (serverTransCache.size > 12000) serverTransCache.clear();
          serverTransCache.set(key, out);
          return out;
        }
      }
    }
  } catch {
    // fallback below
  }

  try {
    const pairSl = sl === 'auto' ? 'en' : sl.split('-')[0];
    const pairTl = tl === 'zh-CN' ? 'zh' : tl;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      clean
    )}&langpair=${encodeURIComponent(pairSl)}|${encodeURIComponent(pairTl)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (r.ok) {
      const data = await r.json();
      const out = String(data?.responseData?.translatedText || '').trim();
      if (out && !/^MYMEMORY WARNING/i.test(out)) {
        if (serverTransCache.size > 12000) serverTransCache.clear();
        serverTransCache.set(key, out);
        return out;
      }
    }
  } catch {
    // fallback below
  }

  return clean;
}

app.post('/api/translate-batch', async (req, res) => {
  try {
    const targetLang = String(req.body?.targetLang || 'en').trim().slice(0, 12);
    const texts = Array.isArray(req.body?.texts) ? req.body.texts.slice(0, 40) : [];
    if (!targetLang || targetLang === 'pt' || texts.length === 0) {
      return res.json({ ok: true, targetLang, translations: {} });
    }
    const translations = {};
    // Translate in small parallel groups so latency stays low
    const chunkSize = 8;
    for (let i = 0; i < texts.length; i += chunkSize) {
      const slice = texts.slice(i, i + chunkSize);
      const results = await Promise.all(
        slice.map(async (txt) => {
          const orig = String(txt || '').trim();
          if (!orig || orig.length > 300) return [orig, orig];
          const tr = await translateSingleText(orig, targetLang);
          return [orig, tr];
        })
      );
      for (const [orig, tr] of results) {
        if (orig && tr) translations[orig] = tr;
      }
    }
    res.json({ ok: true, targetLang, translations });
  } catch (err) {
    res.json({ ok: false, translations: {}, error: err?.message || 'translate error' });
  }
});

async function dispatchSocialWebhook(db, payload) {
  const hook = String(db?.settings?.socialWebhookUrl || '').trim();
  if (!hook || !hook.startsWith('https://')) return false;
  try {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'LENKYX-AutoPublisher/2.2' },
      body: JSON.stringify({
        source: 'MORRO GOLD',
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
      content_text: `Ouça "${t.title}" (${t.bpm} BPM) completo no MORRO GOLD! #LENKYX #CosmicPhonk`,
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
      return `<item><title>${esc(t.title)} — ${esc(t.artist)}</title><link>${esc(link)}</link><guid isPermaLink="false">${esc(t.id)}</guid><pubDate>${new Date(t.createdAt || Date.now()).toUTCString()}</pubDate><description>${esc(`Ouça ${t.title} (${t.bpm} BPM) grátis no App MORRO GOLD! #LENKYX #CosmicPhonk`)}</description></item>`;
    })
    .join('\n');
  res
    .type('application/rss+xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(db.settings?.artistName || 'LENKYX')} — Cosmic Phonk</title><link>${esc(base)}</link><description>Lançamentos musicais, clipes, cinema e entretenimento MORRO GOLD</description>\n${itemsXml}\n</channel></rss>`
    );
});

app.post('/api/social/auto-publish', auth.requireCreator, async (req, res) => {
  const db = readDb();
  const dispatched = await dispatchSocialWebhook(db, {
    event: 'manual_or_ai_social_publish',
    title: req.body?.title || 'MORRO GOLD',
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
  const globalLangs = [
    'pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh-CN', 'zh-TW',
    'ar', 'hi', 'ru', 'id', 'ms', 'tr', 'vi', 'th', 'pl', 'nl', 'uk', 'tl',
  ];
  const hrefLinks = (pathStr) =>
    `<xhtml:link rel="alternate" hreflang="x-default" href="${base}${pathStr}" />` +
    globalLangs
      .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${base}${pathStr}${pathStr.includes('?') ? '&' : '?'}lang=${l}" />`)
      .join('');

  const urls = [
    `<url><loc>${base}/</loc>${hrefLinks('/')}<lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${base}/app</loc>${hrefLinks('/app')}<lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.95</priority></url>`,
    `<url><loc>${base}/baixar</loc>${hrefLinks('/baixar')}<lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.95</priority></url>`,
    `<url><loc>${base}/download</loc>${hrefLinks('/download')}<lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.95</priority></url>`,
    `<url><loc>${base}/tv</loc>${hrefLinks('/tv')}<lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${base}/site-oficial</loc>${hrefLinks('/site-oficial')}<lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    ...db.tracks.map(
      (t) =>
        `<url><loc>${base}/?track=${encodeURIComponent(t.id)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`
    ),
  ];
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`
    );
});

// Zero-dependency store-only ZIP archive builder for instant PC Desktop Launcher downloads
function crc32Buffer(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildSimpleZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const item of entries) {
    const nameBuf = Buffer.from(item.name, 'utf8');
    const dataBuf = Buffer.isBuffer(item.content) ? item.content : Buffer.from(String(item.content), 'utf8');
    const crc = crc32Buffer(dataBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, dataBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(item.mode || 0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + dataBuf.length;
  }
  const centralSize = centralParts.reduce((a, b) => a + b.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralSize, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, endRecord]);
}

function resolveOfficialSiteUrl(req, db) {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim();
  const isLocal = !host || /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(host);
  if (!isLocal) return `${proto}://${host}`;
  const configured = String(db?.settings?.publicUrl || '').trim().replace(/\/$/, '');
  return configured && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(configured)
    ? configured
    : 'https://lenkyx-cosmic-phonk.onrender.com';
}

// Instant PC App Download (Windows / Mac / Linux standalone desktop app — NO shortcuts created!)
app.get(['/download/pc', '/download/pc/windows', '/download/pc/mac', '/pc'], (req, res) => {
  const db = readDb();
  const siteUrl = resolveOfficialSiteUrl(req, db);

  const winBat = [
    '@echo off',
    'title MORRO GOLD - Aplicativo Oficial para PC',
    'set "SITE_URL=' + siteUrl + '"',
    'where msedge >nul 2>nul && (start "" msedge --app="%SITE_URL%" & exit /b 0)',
    'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%SITE_URL%" & exit /b 0)',
    'if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%SITE_URL%" & exit /b 0)',
    'if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%SITE_URL%" & exit /b 0)',
    'if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="%SITE_URL%" & exit /b 0)',
    'start "" "%SITE_URL%"',
    'exit /b 0',
  ].join('\r\n');

  const macCmd = [
    '#!/usr/bin/env bash',
    `SITE_URL="${siteUrl}"`,
    'if [ -d "/Applications/Google Chrome.app" ]; then',
    '  open -na "Google Chrome" --args --app="$SITE_URL"',
    'elif [ -d "/Applications/Microsoft Edge.app" ]; then',
    '  open -na "Microsoft Edge" --args --app="$SITE_URL"',
    'elif command -v google-chrome >/dev/null 2>&1; then',
    '  google-chrome --app="$SITE_URL" &',
    'elif command -v chromium >/dev/null 2>&1; then',
    '  chromium --app="$SITE_URL" &',
    'elif command -v open >/dev/null 2>&1; then',
    '  open "$SITE_URL"',
    'else',
    '  xdg-open "$SITE_URL"',
    'fi',
  ].join('\n');

  const readme = [
    '====================================================',
    '   MORRO GOLD — APLICATIVO OFICIAL PARA PC',
    '====================================================',
    `Site Oficial: ${siteUrl}`,
    '',
    'COMO ABRIR NO WINDOWS (SEM ATALHOS):',
    '1. Extraia esta pasta.',
    '2. Execute "MORRO-GOLD-App.bat" para abrir o aplicativo',
    '   original em janela propria (sem abas de navegador).',
    '',
    'COMO ABRIR NO MAC / LINUX:',
    ' - Execute "MORRO-GOLD-App-Mac-Linux.command".',
    '====================================================',
  ].join('\r\n');

  const launcherHtml = [
    '<!DOCTYPE html>',
    '<html lang="pt-BR">',
    '<head><meta charset="UTF-8"><title>MORRO GOLD</title>',
    '<style>',
    'body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#04050a;color:#fff;font-family:system-ui,sans-serif;overflow:hidden}',
    '.wrap{position:relative;width:168px;height:168px;border-radius:38px;display:flex;align-items:center;justify-content:center;isolation:isolate}',
    '.aurora{position:absolute;inset:-6px;border-radius:42px;background:conic-gradient(#f5c84c,#fef08a,#d97706,#22d3ee,#fbbf24,#f5c84c);filter:blur(10px);z-index:-1;animation:spin 4s linear infinite}',
    '.badge{position:relative;overflow:hidden;width:100%;height:100%;border-radius:38px;background:#05060b;display:flex;align-items:center;justify-content:center;box-shadow:0 16px 40px rgba(245,200,76,.45)}',
    '.badge img{width:100%;height:100%;object-fit:contain}',
    '.sheen{position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 35%,rgba(245,200,76,.35) 45%,rgba(255,255,255,.78) 50%,rgba(34,211,238,.25) 55%,transparent 65%);animation:sweep 2.9s ease-in-out infinite}',
    '@keyframes spin{to{transform:rotate(360deg)}}',
    '@keyframes sweep{0%{transform:translateX(-110%) skewX(-18deg)}60%,100%{transform:translateX(125%) skewX(-18deg)}}',
    'h1{margin:20px 0 6px;letter-spacing:.22em;font-size:28px;color:#f5c84c}p{margin:0;color:#fde68a;font-size:13px}',
    '</style></head><body>',
    `<div class="wrap"><div class="aurora"></div><div class="badge"><img src="${siteUrl}/covers/morro-gold-emblema-grosso.png?v=74" alt="MORRO GOLD"/><div class="sheen"></div></div></div>`,
    '<h1>MORRO GOLD</h1><p>Abrindo Aplicativo Oficial VIP...</p>',
    `<script>setTimeout(function(){window.location.href=${JSON.stringify(siteUrl)};},950);</script>`,
    '</body></html>',
  ].join('');

  const entries = [
    { name: 'MORRO-GOLD-App-PC/MORRO-GOLD-App.bat', content: winBat },
    { name: 'MORRO-GOLD-App-PC/MORRO-GOLD-App-3D.html', content: launcherHtml },
    { name: 'MORRO-GOLD-App-PC/MORRO-GOLD-App-Mac-Linux.command', content: macCmd, mode: (0o100755 << 16) >>> 0 },
    { name: 'MORRO-GOLD-App-PC/LEIA-ME.txt', content: readme },
  ];

  const icoPath = path.join(PUBLIC_DIR, 'covers', 'lenkyx-app.ico');
  if (fs.existsSync(icoPath)) {
    entries.push({ name: 'MORRO-GOLD-App-PC/morro-gold-app.ico', content: fs.readFileSync(icoPath) });
  }

  const zipBuf = buildSimpleZip(entries);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="MORRO-GOLD-App-PC.zip"');
  res.setHeader('Content-Length', String(zipBuf.length));
  res.setHeader('Cache-Control', 'no-store');
  return res.send(zipBuf);
});

app.get(['/site-oficial', '/oficial', '/baixar', '/download'], (_req, res) => {
  res.redirect(302, '/?install=1');
});

// Direct Android APK download endpoint — streams local APK or opens Instant PWA App Install
app.get('/download/apk', (_req, res) => {
  const candidates = [
    path.join(ROOT, 'downloads', 'MORRO-GOLD.apk'),
    path.join(PUBLIC_DIR, 'MORRO-GOLD.apk'),
    path.join(ROOT, 'downloads', 'LENKYX-Cosmic-Phonk.apk'),
    path.join(PUBLIC_DIR, 'LENKYX-Cosmic-Phonk.apk'),
    path.resolve(ROOT, '..', 'LENKYX-Cosmic-Phonk.apk'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    return res.download(found, 'MORRO-GOLD.apk');
  }
  const db = readDb();
  const customUrl = (db.settings?.apkDownloadUrl || '').trim();
  if (customUrl && customUrl.startsWith('http') && !customUrl.includes('1SsBXDSKNWQxsPqURWWavVhcjvYUJgRFI')) {
    return res.redirect(302, customUrl);
  }
  return res.redirect(302, '/?install=1');
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
  const rawApkUrl = (db.settings?.apkDownloadUrl || '').trim();
  const safeApkUrl =
    rawApkUrl && !rawApkUrl.includes('1SsBXDSKNWQxsPqURWWavVhcjvYUJgRFI')
      ? rawApkUrl
      : '/download/apk';
  const fallback = {
    latestVersionCode: 33,
    latestVersionName: '3.3.0-Cosmic3D',
    apkUrl: safeApkUrl,
    releaseNotes: 'MORRO GOLD v76: Novo ícone 3D exclusivo da marca, Portal Site Oficial e Download direto do App para PC.',
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
      if (Array.isArray(rows) && rows[0] && Number(rows[0].version_code) >= fallback.latestVersionCode) {
        return res.json({
          latestVersionCode: Number(rows[0].version_code),
          latestVersionName: rows[0].version_name || fallback.latestVersionName,
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

// === COMMUNITY SOCIAL ENGINE (Chat, Comments, Likes, Horizontal Shorts, Go Live, Real-time SSE) ===
const chatRoomStreams = new Map(); // room -> Set<{ res, id }>
const commentTargetStreams = new Map(); // targetId -> Set<res>

function getRoomOnlineCount(room) {
  const set = chatRoomStreams.get(room);
  return Math.max(1, set ? set.size : 1);
}

function broadcastRoomEvent(room, eventName, payload) {
  const cleanRoom = String(room || 'global').slice(0, 64);
  const set = chatRoomStreams.get(cleanRoom);
  if (!set || set.size === 0) return;
  const frame = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of set) {
    try {
      client.res.write(frame);
    } catch {
      set.delete(client);
    }
  }
}

function broadcastCommentEvent(targetId, eventName, payload) {
  const cleanTarget = String(targetId || '').trim().slice(0, 100);
  const set = commentTargetStreams.get(cleanTarget);
  if (!set || set.size === 0) return;
  const frame = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(frame);
    } catch {
      set.delete(res);
    }
  }
}

app.get('/api/community/chat/stream', async (req, res) => {
  const room = String(req.query.room || 'global').slice(0, 64);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let set = chatRoomStreams.get(room);
  if (!set) {
    set = new Set();
    chatRoomStreams.set(room, set);
  }
  const client = { res, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  set.add(client);

  try {
    const messages = await getChatMessages(room, 70);
    res.write(
      `event: init\ndata: ${JSON.stringify({ room, onlineCount: getRoomOnlineCount(room), messages })}\n\n`
    );
  } catch {
    res.write(`event: init\ndata: ${JSON.stringify({ room, onlineCount: getRoomOnlineCount(room), messages: [] })}\n\n`);
  }

  broadcastRoomEvent(room, 'presence', { room, onlineCount: getRoomOnlineCount(room) });

  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(ping);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(ping);
    set.delete(client);
    if (set.size === 0) chatRoomStreams.delete(room);
    broadcastRoomEvent(room, 'presence', { room, onlineCount: getRoomOnlineCount(room) });
  });
});

app.get('/api/community/chat', async (req, res) => {
  try {
    const room = String(req.query.room || 'global');
    const messages = await getChatMessages(room, 70);
    res.json({ room, onlineCount: getRoomOnlineCount(room), messages });
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
    broadcastRoomEvent(msg.room_id, 'message', msg);
    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/chat/react', (req, res) => {
  const room = String(req.body?.roomId || 'global').slice(0, 64);
  const emoji = String(req.body?.emoji || '❤️').slice(0, 12);
  const authorName = String(req.body?.authorName || 'Cria').slice(0, 40);
  const payload = {
    id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    room_id: room,
    emoji,
    authorName,
    ts: Date.now(),
  };
  broadcastRoomEvent(room, 'reaction', payload);
  res.json(payload);
});

app.get('/api/community/comments/stream', (req, res) => {
  const targetId = String(req.query.targetId || '').trim().slice(0, 100);
  if (!targetId) return res.status(400).end();
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let set = commentTargetStreams.get(targetId);
  if (!set) {
    set = new Set();
    commentTargetStreams.set(targetId, set);
  }
  set.add(res);
  res.write(`event: ready\ndata: ${JSON.stringify({ targetId })}\n\n`);

  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(ping);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(ping);
    set.delete(res);
    if (set.size === 0) commentTargetStreams.delete(targetId);
  });
});

app.get('/api/community/comments', async (req, res) => {
  try {
    const targetId = String(req.query.targetId || '');
    const userId = String(req.query.userId || '').trim();
    const sort = String(req.query.sort || 'top').trim();
    let ytId = String(req.query.youtubeId || '').trim();
    if (!ytId && targetId.startsWith('short:wshort-')) {
      ytId = targetId.replace(/^short:wshort-/, '').trim();
    }

    const [localComments, ytComments] = await Promise.all([
      getCommentsForTarget(targetId, 120, userId),
      ytId ? fetchYouTubeVideoComments(ytId) : Promise.resolve([]),
    ]);

    // Attach liked_by_me / any local replies onto YouTube comments too
    const merged = [...localComments, ...ytComments];
    if (sort === 'newest') {
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      merged.sort((a, b) => {
        if ((a.source || 'lenkyx') !== (b.source || 'lenkyx')) {
          return a.source === 'lenkyx' ? -1 : 1;
        }
        return (b.likes || 0) - (a.likes || 0);
      });
    }
    res.json({ targetId, totalCount: merged.length, comments: merged });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/comments', async (req, res) => {
  try {
    const item = await postComment({
      targetId: req.body?.targetId,
      parentId: req.body?.parentId || '',
      authorName: req.body?.authorName,
      authorColor: req.body?.authorColor,
      text: req.body?.text,
    });
    broadcastCommentEvent(item.target_id, 'comment', item);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/comments/:id/like', async (req, res) => {
  try {
    const upd = await likeComment(
      req.params.id,
      req.body?.userId || '',
      Number(req.body?.baseLikes || 0)
    );
    if (req.body?.targetId && upd) {
      broadcastCommentEvent(String(req.body.targetId), 'comment_like', upd);
    }
    res.json(upd || { id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/shorts', async (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim();
    const shorts = applyShortLikeOverlay(await getCommunityShorts(), userId);
    res.json({ shorts });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/shorts/liked', (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim();
    res.json({ likedIds: getUserLikedShortIds(userId) });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/creator-profile', async (req, res) => {
  try {
    const creatorName = String(req.query.creatorName || '').trim();
    const youtubeId = String(req.query.youtubeId || '').trim();
    const channelId = String(req.query.channelId || '').trim();
    const userId = String(req.query.userId || '').trim();

    const [profile, communityShorts] = await Promise.all([
      fetchCreatorProfile({ creatorName, youtubeId, channelId }),
      getCommunityShorts(),
    ]);

    const matchKey = (profile.channelName || creatorName).toLowerCase();
    const ownCommunity = communityShorts.filter(
      (s) =>
        s.creator_name &&
        (s.creator_name.toLowerCase() === matchKey ||
          s.creator_name.toLowerCase() === creatorName.toLowerCase())
    );

    const seenVids = new Set(profile.shorts.map((s) => s.youtube_id || s.id));
    const mergedShorts = [
      ...ownCommunity,
      ...profile.shorts.filter((s) => !seenVids.has(s.id) && !seenVids.has(s.youtube_id)),
    ];
    // Preserve profile.shorts order if ownCommunity is empty
    const finalShorts = ownCommunity.length > 0 ? [...ownCommunity, ...profile.shorts] : profile.shorts;

    res.json({
      ...profile,
      shorts: applyShortLikeOverlay(finalShorts, userId),
      videos: applyShortLikeOverlay(profile.videos || [], userId),
    });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/channels', (req, res) => {
  try {
    const subscriberId = String(req.query.subscriberId || '').trim();
    res.json(getChannelSubscriptions(subscriberId));
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/subscribe', (req, res) => {
  try {
    const out = toggleChannelSubscribe({
      channelId: req.body?.channelId,
      channelName: req.body?.channelName,
      subscriberId: req.body?.subscriberId,
    });
    res.json(out);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

// === USER & CREATOR CHANNELS ("IGUAL DO YOUTUBE" + LEI DA FAVELA MORRO GOLD) ===
app.get('/api/community/creator-channels', (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim();
    res.json({ channels: getCreatorChannels(userId) });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/creator-channels', (req, res) => {
  try {
    const channel = upsertCreatorChannel(req.body || {});
    res.json({ channel });
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/creator-channels/:id/videos', (req, res) => {
  try {
    const video = addCreatorChannelVideo(req.params.id, req.body || {});
    res.json({ video });
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.delete('/api/community/creator-channels/:id/videos/:videoId', (req, res) => {
  try {
    res.json(deleteCreatorChannelVideo(req.params.id, req.params.videoId));
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/creator-channels/:id/posts', (req, res) => {
  try {
    const post = addCreatorChannelPost(req.params.id, req.body || {});
    res.json({ post });
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/copyright-report', (req, res) => {
  try {
    const report = submitCopyrightReport(req.body || {});
    res.json({ ok: true, report });
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.get('/api/community/world-shorts', async (req, res) => {
  const category = String(req.query.category || 'all').trim();
  const q = String(req.query.q || '').trim();
  const userId = String(req.query.userId || '').trim();
  const country = String(req.query.country || req.headers['cf-ipcountry'] || 'BR').trim().toUpperCase();
  const excludeRaw = String(req.query.exclude || '').trim();
  const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
  const excludeIds = excludeRaw
    ? excludeRaw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 300)
    : [];
  const excludeSet = new Set(excludeIds);
  try {
    const [worldShorts, communityShorts] = await Promise.all([
      searchWorldShorts(category, q, excludeIds, forceRefresh, country),
      getCommunityShorts(),
    ]);
    const filteredCommunity = communityShorts.filter(
      (s) => !excludeSet.has(s.id) && !excludeSet.has(s.youtube_id || '')
    );
    const combined =
      category === 'community'
        ? filteredCommunity
        : category === 'all' && !q
          ? [...filteredCommunity.slice(0, 3), ...worldShorts]
          : worldShorts.length > 0
            ? worldShorts
            : filteredCommunity;
    res.json({ shorts: applyShortLikeOverlay(combined, userId) });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// === SELF-IMPROVING GLOBAL SMART PREFERENCES ===
const globalSmartTastes = { artists: {}, genres: {}, reelCategories: {}, totalSignals: 0 };

app.post('/api/smart-learn', (req, res) => {
  const { artist = '', genre = '', reelCategory = '' } = req.body || {};
  if (artist) {
    const k = String(artist).trim().slice(0, 60);
    globalSmartTastes.artists[k] = (globalSmartTastes.artists[k] || 0) + 1;
  }
  if (genre) {
    const k = String(genre).trim().toLowerCase().slice(0, 40);
    globalSmartTastes.genres[k] = (globalSmartTastes.genres[k] || 0) + 1;
  }
  if (reelCategory) {
    const k = String(reelCategory).trim().toLowerCase().slice(0, 30);
    globalSmartTastes.reelCategories[k] = (globalSmartTastes.reelCategories[k] || 0) + 1;
  }
  globalSmartTastes.totalSignals += 1;
  res.json({ ok: true, totalSignals: globalSmartTastes.totalSignals });
});

app.get('/api/smart-learn', (_req, res) => {
  const top = (obj) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, score]) => ({ name, score }));
  res.json({
    totalSignals: globalSmartTastes.totalSignals,
    topArtists: top(globalSmartTastes.artists),
    topGenres: top(globalSmartTastes.genres),
    topReelCategories: top(globalSmartTastes.reelCategories),
  });
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
    const durSec = Number(req.body?.durationSec || 0);
    if (durSec > 180) {
      return res.status(400).json({
        error: 'Reels permitem apenas vídeos curtos de até 3 minutos (180s, limite do YouTube Shorts).',
      });
    }
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

app.post('/api/community/upload-short-video', upload.single('video'), async (req, res) => {
  try {
    const durSec = Number(req.body?.durationSec || 0);
    if (durSec > 180) {
      return res.status(400).json({
        error: 'Reels permitem apenas vídeos curtos de até 3 minutos (180s, limite do YouTube Shorts).',
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de vídeo não recebido.' });
    }
    const videoUrl = `/storage/videos/${req.file.filename}`;
    const created = await createCommunityShort({
      title: req.body?.title || 'Cosmic Reel',
      creatorName: req.body?.creatorName || 'Cria MORRO GOLD',
      creatorColor: req.body?.creatorColor || 'from-cyan-400 to-pink-500',
      description: req.body?.description || '',
      mediaType: 'video',
      videoUrl,
      posterUrl: req.body?.posterUrl || '/covers/album-official.jpg',
      audioTitle: req.body?.audioTitle || 'MORRO GOLD Sound',
    });
    res.status(201).json({ ok: true, short: created, videoUrl });
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/community/shorts/:id/like', async (req, res) => {
  try {
    const upd = await likeCommunityShort(
      req.params.id,
      req.body?.userId || '',
      Number(req.body?.initialLikes || 0)
    );
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

// === COSMIC HUB: FREE FAN GIVEAWAYS, VOLUNTARY SUPPORT GOALS & FREE TOKEN WHEEL ===
app.get('/api/hub/overview', (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim();
    const userName = String(req.query.userName || '').trim();
    res.json(getHubOverview(userId, userName));
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/hub/giveaways/join', (req, res) => {
  try {
    const result = joinFreeGiveaway({
      giveawayId: String(req.body?.giveawayId || ''),
      userId: String(req.body?.userId || ''),
      userName: String(req.body?.userName || ''),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/hub/giveaways', auth.requireCreator, (req, res) => {
  try {
    const created = createFreeGiveaway({
      title: req.body?.title,
      description: req.body?.description,
      prizeSummary: req.body?.prizeSummary,
      minParticipants: req.body?.minParticipants,
      maxParticipants: req.body?.maxParticipants,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/hub/giveaways/:id/draw', auth.requireCreator, (req, res) => {
  try {
    const result = drawFreeGiveaway({ giveawayId: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/hub/goals', auth.requireCreator, (req, res) => {
  try {
    const goal = createSupportGoal({
      title: req.body?.title,
      description: req.body?.description,
      targetAmount: req.body?.targetAmount,
      perkGuaranteed: req.body?.perkGuaranteed,
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/hub/goals/:id/support', (req, res) => {
  try {
    const result = recordGoalSupport({
      goalId: req.params.id,
      supporterName: req.body?.supporterName,
      amount: req.body?.amount,
      method: req.body?.method,
      message: req.body?.message,
      userId: req.body?.userId,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/hub/wheel/spin', (req, res) => {
  try {
    const result = spinCosmicWheel({
      userId: String(req.body?.userId || ''),
      userName: String(req.body?.userName || ''),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/hub/missions/claim', (req, res) => {
  try {
    const result = claimCosmicMission({
      userId: String(req.body?.userId || ''),
      userName: String(req.body?.userName || ''),
      missionId: String(req.body?.missionId || ''),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

// === GALÁXIA ARCADE & COSMIC PHONK: NOVO MUNDO ONLINE RPG ===
app.get('/api/arcade/directory', async (_req, res) => {
  try {
    const data = await getArcadeDirectory();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/arcade/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const generation = String(req.query.generation || 'all').trim();
    const data = await searchAllGenerationsGames(q, generation);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/arcade/world/state', (req, res) => {
  try {
    const playerId = String(req.query.playerId || '').trim();
    const playerName = String(req.query.playerName || '').trim();
    res.json(getWorldBootstrap(playerId, playerName));
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/arcade/world/sync', (req, res) => {
  try {
    const data = syncWorldPresence(req.body || {});
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/arcade/world/progress', (req, res) => {
  try {
    const data = postWorldProgress(req.body || {});
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/arcade/world/chat', (req, res) => {
  try {
    const data = postSectorChat({
      playerName: req.body?.playerName,
      message: req.body?.message,
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.post('/api/galaxy/chat', async (req, res) => {
  try {
    const personaId = String(req.body?.personaId || 'zylar').trim().toLowerCase();
    const message = String(req.body?.message || '').trim().slice(0, 400);
    const targetLang = normalizeServerLang(req.body?.userLang || 'pt') || 'pt';
    const currentTrackTitle = String(req.body?.currentTrackTitle || '').trim();
    const low = message.toLowerCase();

    const db = readDb();
    const publishedTracks = (db.tracks || []).filter((t) => t && t.published !== false);
    const sampleTrack = publishedTracks.length
      ? publishedTracks[Math.floor(Math.random() * publishedTracks.length)]
      : null;

    let action = null;
    let replyPt = '';

    if (/(toca|tocar|play|som|música|musica|music|song|beat|phonk|ouvir|listen)/i.test(low)) {
      if (sampleTrack) {
        action = { type: 'play_track', trackId: sampleTrack.id, trackTitle: sampleTrack.title, artist: sampleTrack.artist };
        replyPt = `Soltei nos alto-falantes da nave: "${sampleTrack.title}" de ${sampleTrack.artist}! A energia da galáxia já subiu.`;
      } else {
        action = { type: 'navigate', tab: 'catalog' };
        replyPt = 'Abrindo o planeta Terra Sonora para você escolher qualquer música agora!';
      }
    } else if (/(espectro|visual|efeito|luz|cores|fogo|agua|água|vento|terra|visualizer)/i.test(low)) {
      action = { type: 'visualizer' };
      replyPt = 'Ativando o Espectro Cósmico em WebGL direto do núcleo do Sol LENKYX!';
    } else if (/(filme|serie|série|anime|cinema|movie|watch|assistir)/i.test(low)) {
      action = { type: 'navigate', tab: 'movies' };
      replyPt = 'Abrindo o Portal Dourado para Saturnia HD — Cinema, Séries e Animes completos sem anúncios!';
    } else if (/(reel|short|live|vídeo|video|tiktok)/i.test(low)) {
      action = { type: 'navigate', tab: 'reels' };
      replyPt = 'Saltando para Nova Pulse! Reels infinitos e Lives em tempo real aguardando você.';
    } else if (/(futebol|ufc|luta|jogo ao vivo|esporte|sport|placar|soccer|mma)/i.test(low)) {
      action = { type: 'navigate', tab: 'sports' };
      replyPt = 'Conectando os sensores ao planeta Ares Arena — Futebol e UFC ao vivo na tela!';
    } else if (/(game|jogo|jogar|arcade|fliperama)/i.test(low)) {
      action = { type: 'navigate', tab: 'arcade' };
      replyPt = 'Portal aberto para Cybertron Arcade! Hora de acelerar nos jogos.';
    } else if (/(criar|ia|estúdio|estudio|studio|produzir|gerar)/i.test(low)) {
      action = { type: 'navigate', tab: 'studio' };
      replyPt = 'Entrando na Forja Genesis! Crie sua própria música com IA gratuitamente.';
    } else if (/(offline|baixar|download|viagem)/i.test(low)) {
      action = { type: 'navigate', tab: 'offline' };
      replyPt = 'Ativando Cryo Nova — baixe suas faixas para ouvir em qualquer lugar sem internet.';
    } else if (/(artista|clipe|explorar|youtube)/i.test(low)) {
      action = { type: 'navigate', tab: 'explore' };
      replyPt = 'Viajando para Aethelgard! Todos os artistas, clipes e biografias do mundo.';
    } else if (/(buraco negro|black hole|portal|multiverso|estranho|strange|guardi)/i.test(low)) {
      const portals = ['movies', 'reels', 'explore', 'arcade', 'studio'];
      const pick = portals[Math.floor(Math.random() * portals.length)];
      if (/(abrir|entrar|leva|vai|jump|open|teleport)/i.test(low)) {
        action = { type: 'navigate', tab: pick };
      }
      replyPt =
        personaId === 'nova'
          ? 'Os portais arcanos conectam cada realidade da LENKYX! Toque em qualquer anel dourado ou peça para eu abrir Cinema, Reels, Música ou Jogos.'
          : 'Esse Buraco Negro dobra o espaço-tempo da nossa galáxia! Cuidado para não cair direto numa dimensão aleatória de som pesado.';
    } else {
      const personas = {
        zylar: [
          `Saudações da Nave Alpha! ${currentTrackTitle ? `Estou curtindo "${currentTrackTitle}" no painel da nave.` : 'Os motores quânticos estão prontos.'} Quer que eu toque um som ou abra algum planeta?`,
          'E aí, viajante! Já patrulhei três nebulosas hoje. Se quiser música, filme completo ou falar com a galera online, é só mandar!',
          'Aqui na órbita dos Guardiões tudo tem vida: os satélites piscam, o buraco negro ruge e os portais nunca fecham. Para onde vamos?',
        ],
        nova: [
          'Os anéis de Kamar-Taj giram sobre o multiverso LENKYX. Diga qual realidade deseja abrir — Cinema, Reels, IA ou Músicas — e eu conjuro o portal!',
          'Cada fragmento brilhante ao redor do portal reflete um universo diferente. Quer atravessar para uma dimensão aleatória?',
        ],
        solis: [
          `Eu sou o coração solar desta galáxia! ${currentTrackTitle ? `Estou vibrando na frequência de "${currentTrackTitle}".` : 'Toque no Sol para liberar o Espectro 3D.'} Quer que eu coloque um som pra pulsar?`,
          'Minha coroa solar reage a cada grave, agudo e batida. Peça para tocar música ou abrir o Espectro!',
        ],
        sentinel: [
          'Satélite S-7 em órbita estável! Sinais de Futebol, UFC, Filmes HD e downloads instantâneos operando a 100% sem anúncios.',
          'Telemetria limpa: 9 planetas ativos, 3 portais dimensionais estáveis e chat global sincronizado com usuários online.',
        ],
        blackhole: [
          'Do outro lado do Horizonte de Eventos existem realidades infinitas. Diga "me leva para outro universo" ou escolha um portal dourado!',
          'A gravidade aqui curva até a luz e o som. Peça um filme, uma música ou um salto dimensional.',
        ],
      };
      const pool = personas[personaId] || personas.zylar;
      replyPt = pool[Math.floor(Math.random() * pool.length)];
    }

    const reply = targetLang !== 'pt' ? await translateSingleText(replyPt, targetLang) : replyPt;
    res.json({ ok: true, personaId, reply, action });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// === REAL-TIME VOICE DUBBING & REELS AUTO-DUB ===
app.post('/api/voice/translate-dub', async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim().slice(0, 800);
    const sourceLang = String(req.body?.sourceLang || 'auto').trim().slice(0, 12);
    const targetLang = String(req.body?.targetLang || 'pt').trim().slice(0, 12);
    const pitchRatio = Number(req.body?.pitchRatio || 1);
    const voiceEffect = String(req.body?.voiceEffect || 'natural');
    if (!text) return res.json({ ok: true, translatedText: '', sourceLang, targetLang, pitchRatio, voiceEffect });

    const translatedText = await translateAnyText(text, sourceLang, targetLang);
    res.json({
      ok: true,
      originalText: text,
      translatedText,
      sourceLang,
      targetLang,
      pitchRatio: Math.max(0.65, Math.min(1.55, pitchRatio)),
      voiceEffect,
    });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/reels/auto-dub', async (req, res) => {
  try {
    const videoId = String(req.body?.videoId || '').trim();
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const creatorName = String(req.body?.creatorName || '').trim();
    const targetLang = String(req.body?.targetLang || 'pt').trim().slice(0, 12);

    let transcriptLines = [];
    if (videoId && /^[a-zA-Z0-9_-]{8,15}$/.test(videoId)) {
      for (const tryLang of ['en', 'es', 'pt', 'ja', 'fr']) {
        try {
          const r = await fetch(
            `https://www.youtube.com/api/timedtext?lang=${tryLang}&v=${encodeURIComponent(videoId)}`,
            { signal: AbortSignal.timeout(2500) }
          );
          if (r.ok) {
            const xml = await r.text();
            const matches = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi)].slice(0, 12);
            if (matches.length > 0) {
              transcriptLines = matches
                .map((m) =>
                  m[1]
                    .replace(/&amp;/g, '&')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/<[^>]+>/g, ' ')
                    .trim()
                )
                .filter(Boolean);
              break;
            }
          }
        } catch {
          // try next lang
        }
      }
    }

    const baseScript =
      transcriptLines.length > 0
        ? transcriptLines.join('. ')
        : [title, description].filter(Boolean).join('. ') || 'Vídeo em reprodução na LENKYX.';

    const dubbedText = await translateAnyText(baseScript.slice(0, 750), 'auto', targetLang);
    res.json({
      ok: true,
      targetLang,
      hasTranscript: transcriptLines.length > 0,
      creatorName,
      dubbedText,
      segments: dubbedText
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean)
        .slice(0, 8),
    });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// === CUSTOM IDEA PLANETS (EVERY NEW IDEA BECOMES A NEW PLANET IN THE GALAXY) ===
app.get('/api/galaxy/planets', (_req, res) => {
  const db = readDb();
  res.json({ ok: true, planets: Array.isArray(db.galaxyPlanets) ? db.galaxyPlanets : [] });
});

app.post('/api/galaxy/planets', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 48);
    const topic = String(req.body?.topic || name).trim().slice(0, 120);
    const accentHex = /^#[0-9a-fA-F]{6}$/.test(String(req.body?.accentHex || ''))
      ? req.body.accentHex
      : '#38bdf8';
    const hasRing = Boolean(req.body?.hasRing ?? true);
    const style = String(req.body?.style || 'cyber').slice(0, 20);
    const creatorName = String(req.body?.creatorName || 'Explorador').slice(0, 40);
    if (!name) return res.status(400).json({ error: 'Nome do planeta é obrigatório.' });

    const db = readDb();
    const list = Array.isArray(db.galaxyPlanets) ? db.galaxyPlanets : [];
    const planet = {
      id: `idea_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      topic,
      accentHex,
      hasRing,
      style,
      creatorName,
      createdAt: new Date().toISOString(),
    };
    db.galaxyPlanets = [planet, ...list].slice(0, 32);
    writeDb(db);

    const liveContent = await resolveIdeaPlanetContent(topic).catch(() => null);
    res.status(201).json({ ok: true, planet, liveContent });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.delete('/api/galaxy/planets/:id', (req, res) => {
  const db = readDb();
  const list = Array.isArray(db.galaxyPlanets) ? db.galaxyPlanets : [];
  db.galaxyPlanets = list.filter((p) => p.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

app.get('/api/galaxy/planets/resolve', async (req, res) => {
  try {
    const topic = String(req.query.topic || '').trim();
    const data = await resolveIdeaPlanetContent(topic);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// === AUTONOMOUS WORLDS: NEWS, SHOPPING, DARK WEB, BITCOIN & STOCKS ===
app.get('/api/worlds/news', async (req, res) => {
  try {
    const category = String(req.query.category || 'all');
    const q = String(req.query.q || '');
    const refresh = req.query.refresh === '1';
    const localLang =
      normalizeServerLang(req.query.lang || req.headers['accept-language']?.split(',')[0] || 'pt') || 'pt';
    const data = await fetchWorldNews(category, q, refresh);
    if (localLang !== 'pt' && Array.isArray(data.articles)) {
      data.articles = await Promise.all(
        data.articles.slice(0, 14).map(async (a) => ({
          ...a,
          title: await translateCached(a.title, localLang),
          summary: await translateCached(a.summary, localLang),
        }))
      );
    }
    res.json({ ...data, localLang });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/worlds/markets', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1';
    const userId = String(req.query.userId || 'guest');
    const markets = await fetchMarketsData(refresh);
    const portfolio = getOrUpdateAutoPortfolio(userId);
    res.json({ ...markets, portfolio });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/worlds/markets/portfolio', (req, res) => {
  try {
    const userId = String(req.body?.userId || 'guest');
    const portfolio = getOrUpdateAutoPortfolio(userId, req.body);
    res.json({ ok: true, portfolio });
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.get('/api/worlds/shopping', async (req, res) => {
  try {
    const category = String(req.query.category || 'destaques');
    const q = String(req.query.q || '');
    const refresh = req.query.refresh === '1';
    res.json(await fetchShoppingProducts(category, q, refresh));
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/worlds/shopping/checkout', (req, res) => {
  try {
    const order = createInstantOrder(req.body || {});
    res.status(201).json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

app.get('/api/worlds/shopping/orders', (_req, res) => {
  res.json({ ok: true, orders: getRecentOrders() });
});

app.get('/api/worlds/darkweb', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1';
    const localLang =
      normalizeServerLang(req.query.lang || req.headers['accept-language']?.split(',')[0] || 'pt') || 'pt';
    const data = await fetchDarkWebIntel(refresh);
    const [vulnerabilities, cyberNews] = await Promise.all([
      Promise.all(
        (data.vulnerabilities || []).slice(0, 12).map(async (v) => ({
          ...v,
          title: await translateCached(v.title, localLang),
          summary: await translateCached(v.summary, localLang),
        }))
      ),
      Promise.all(
        (data.cyberNews || []).slice(0, 12).map(async (n) => ({
          ...n,
          title: await translateCached(n.title, localLang),
        }))
      ),
    ]);
    res.json({ ...data, localLang, vulnerabilities, cyberNews });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/worlds/darkweb/chat', (req, res) => {
  const chat = postDarkWebChat(req.body?.handle, req.body?.text);
  res.json({ ok: true, encryptedChat: chat });
});

app.get('/api/worlds/darkweb/inspect', async (req, res) => {
  try {
    const host = String(req.query.host || '');
    res.json(await inspectHostSecurity(host));
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

// === REAL-TIME GLOBAL SATELLITES, BRASIL+ (MJSP/PF) & QGIS XYZ TILES ===
const satTranslationCache = new Map();
async function translateCached(text, targetLang) {
  const clean = String(text || '').trim();
  if (!clean) return clean;
  const key = `${targetLang}:${clean}`;
  if (satTranslationCache.has(key)) return satTranslationCache.get(key);
  const out = await translateAnyText(clean, 'auto', targetLang).catch(() => clean);
  if (satTranslationCache.size > 600) satTranslationCache.clear();
  satTranslationCache.set(key, out);
  return out;
}

app.get('/api/worlds/satellites', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1';
    const rawLang = req.query.lang || req.headers['accept-language']?.split(',')[0] || 'pt';
    const localLang = normalizeServerLang(rawLang) || 'pt';
    const rawData = await fetchSatelliteLiveOverview(refresh);

    // Always translate live global events, quakes, and Brasil+ news into user's local language
    const [events, quakes, brasilMaisNews] = await Promise.all([
      Promise.all(
        (rawData.events || []).slice(0, 18).map(async (ev) => ({
          ...ev,
          title: await translateCached(ev.title, localLang),
          category: await translateCached(ev.category, localLang),
        }))
      ),
      Promise.all(
        (rawData.quakes || []).slice(0, 16).map(async (q) => ({
          ...q,
          title: await translateCached(q.title, localLang),
          place: await translateCached(q.place, localLang),
        }))
      ),
      localLang === 'pt'
        ? rawData.brasilMaisNews || []
        : Promise.all(
            (rawData.brasilMaisNews || []).slice(0, 8).map(async (n) => ({
              ...n,
              title: await translateCached(n.title, localLang),
              summary: await translateCached(n.summary, localLang),
            }))
          ),
    ]);

    res.json({
      ...rawData,
      localLang,
      events,
      quakes,
      brasilMaisNews,
    });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/worlds/satellites/qgis-layer.qlr', async (req, res) => {
  try {
    const layerId = String(req.query.layer || 'google_sat');
    const satData = await fetchSatelliteLiveOverview(false);
    const layer = (satData.qgisLayers || []).find((l) => l.id === layerId) || satData.qgisLayers[0];
    const safeUrl = String(layer.url || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const safeName = String(layer.name || 'MORRO GOLD Satellite')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const qlr = `<!DOCTYPE qgis-layer-definition>
<qlr>
  <layer-tree-group name="" expanded="1" checked="Qt::Checked">
    <layer-tree-layer id="${layer.id}_lenkyx" name="${safeName}" providerKey="wms" checked="Qt::Checked" expanded="1">
      <customproperties/>
    </layer-tree-layer>
  </layer-tree-group>
  <maplayers>
    <maplayer type="raster" autoRefreshEnabled="1" autoRefreshTime="30" hasScaleBasedVisibilityFlag="0">
      <id>${layer.id}_lenkyx</id>
      <datasource>type=xyz&amp;url=${safeUrl}&amp;zmax=${layer.maxZoom || 19}&amp;zmin=0</datasource>
      <layername>${safeName}</layername>
      <srs>
        <spatialrefsys>
          <authid>EPSG:3857</authid>
        </spatialrefsys>
      </srs>
      <provider>wms</provider>
    </maplayer>
  </maplayers>
</qlr>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="lenkyx-${layer.id}.qlr"`);
    res.send(qlr);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// === GLOBAL WHATSAPP-STYLE VOICE & VIDEO CALLS SIGNALING ===
app.post('/api/calls/register', (req, res) => {
  registerCallPeer(req.body || {});
  res.json({ ok: true });
});

app.get('/api/calls/directory', (req, res) => {
  const selfPeerId = String(req.query.selfPeerId || '');
  res.json({ ok: true, ...getCallDirectory(selfPeerId) });
});

app.post('/api/calls/signal', (req, res) => {
  pushCallSignal(req.body || {});
  res.json({ ok: true });
});

app.get('/api/calls/poll', (req, res) => {
  const peerId = String(req.query.peerId || '');
  res.json({ ok: true, signals: pollCallSignals(peerId) });
});

// === AUTONOMOUS LIVING GALAXY CONSCIOUSNESS, ECOSYSTEM & FREE GUY NPC ===
app.get('/api/galaxy/consciousness', async (req, res) => {
  const localLang =
    normalizeServerLang(req.query.lang || req.headers['accept-language']?.split(',')[0] || 'pt') || 'pt';
  const eco = getGalaxyConsciousness();
  if (localLang === 'pt') {
    return res.json({ ok: true, localLang, ecosystem: eco });
  }
  const translatedDecisions = await Promise.all(
    (eco.decisions || []).slice(0, 6).map(async (d) => ({
      ...d,
      domain: await translateCached(d.domain, localLang),
      decision: await translateCached(d.decision, localLang),
    }))
  );
  res.json({
    ok: true,
    localLang,
    ecosystem: {
      ...eco,
      weather: await translateCached(eco.weather, localLang),
      galaxyMood: await translateCached(eco.galaxyMood, localLang),
      decisions: translatedDecisions,
    },
  });
});

app.post('/api/galaxy/consciousness/act', (req, res) => {
  const type = String(req.body?.type || '').trim();
  const ecosystem = stepAutonomousConsciousness(type ? { type } : null);
  res.json({ ok: true, ecosystem });
});

app.post('/api/galaxy/npc-chat', async (req, res) => {
  try {
    const npcName = String(req.body?.npcName || 'Guy').slice(0, 32);
    const message = String(req.body?.message || '').slice(0, 300);
    const rawLocale = String(req.body?.locale || req.body?.userLang || req.headers['accept-language']?.split(',')[0] || 'pt-BR');
    const userLang = normalizeServerLang(rawLocale) || 'pt';
    const data = replyAsConsciousNpc({ npcName, message, userLang });
    if (userLang !== 'pt' && data.reply) {
      data.reply = await translateAnyText(data.reply, 'pt', userLang);
    }
    data.audioUrl = `/api/galaxy/tts?character=${encodeURIComponent(data.npcName)}&lang=${encodeURIComponent(
      rawLocale
    )}&text=${encodeURIComponent(data.reply)}`;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// === LOCAL-REGION NEURAL VOICES & AMBIENT AI CITIZENS DIALOGUES ===
app.get('/api/galaxy/ai-citizens', (_req, res) => {
  res.json({ ok: true, citizens: AI_CITIZENS });
});

app.get('/api/galaxy/tts', async (req, res) => {
  try {
    const text = String(req.query.text || '').trim().slice(0, 420);
    const locale = String(req.query.lang || req.headers['accept-language']?.split(',')[0] || 'pt-BR').slice(0, 20);
    const character = String(req.query.character || 'Guy').slice(0, 32);
    if (!text) return res.status(400).send('Missing text');
    const { buffer, voice } = await synthesizeLocalNeuralVoice({ text, locale, character });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Neural-Voice', voice);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/galaxy/ai-dialogue', async (req, res) => {
  try {
    const rawLocale = String(req.query.lang || req.headers['accept-language']?.split(',')[0] || 'pt-BR').slice(0, 20);
    const localLang = normalizeServerLang(rawLocale) || 'pt';
    const dlg = getAmbientAiConversation();
    const turns = await Promise.all(
      dlg.turns.map(async (t) => {
        const localized = localLang === 'pt' ? t.text : await translateCached(t.text, localLang);
        return {
          ...t,
          text: localized,
          audioUrl: `/api/galaxy/tts?character=${encodeURIComponent(t.speaker)}&lang=${encodeURIComponent(
            rawLocale
          )}&text=${encodeURIComponent(localized)}`,
        };
      })
    );
    res.json({ ok: true, id: dlg.id, locale: rawLocale, localLang, turns });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// === AUTONOMOUS INTELLIGENT WORKER ROBOTS (REAL-TIME APP OPTIMIZATION) ===
async function formatFleetForLang(fleet, localLang) {
  if (localLang === 'pt') return fleet;
  const [bots, logs] = await Promise.all([
    Promise.all(
      (fleet.bots || []).map(async (b) => ({
        ...b,
        role: await translateCached(b.role, localLang),
        status: await translateCached(b.status, localLang),
        currentTask: await translateCached(b.currentTask, localLang),
      }))
    ),
    Promise.all(
      (fleet.logs || []).slice(0, 8).map(async (l) => ({
        ...l,
        action: await translateCached(l.action, localLang),
      }))
    ),
  ]);
  return { ...fleet, bots, logs };
}

app.get('/api/robots/status', async (req, res) => {
  const localLang =
    normalizeServerLang(req.query.lang || req.headers['accept-language']?.split(',')[0] || 'pt') || 'pt';
  const fleet = getRobotFleetStatus();
  res.json({ ok: true, localLang, fleet: await formatFleetForLang(fleet, localLang) });
});

app.post('/api/robots/optimize', async (req, res) => {
  const localLang =
    normalizeServerLang(req.query.lang || req.body?.lang || req.headers['accept-language']?.split(',')[0] || 'pt') ||
    'pt';
  const fleet = stepRobotWorkers(true);
  res.json({ ok: true, localLang, fleet: await formatFleetForLang(fleet, localLang) });
});

app.get('/tv', (_req, res) => {
  res.redirect(302, '/?tvMode=1');
});

app.get('/tv/:code', (req, res) => {
  const c = String(req.params.code || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 12);
  res.redirect(302, c ? `/?tv=${encodeURIComponent(c)}` : '/?tvMode=1');
});

app.get('/app', (_req, res) => {
  res.redirect(302, '/?install=1');
});

// === v62: BRAZILIAN YOUTUBERS (MEMES & PEGADINHAS) TOP 1-5 ===
app.get('/api/community/br-creators', (_req, res) => {
  res.json(getBrCreatorsRanked());
});

app.post('/api/community/br-creators/vote', (req, res) => {
  const id = String(req.body?.creatorId || '').trim();
  const updated = voteBrCreator(id);
  if (!updated) return res.status(404).json({ error: 'Criador não encontrado' });
  return res.json(updated);
});

// === v62: SYNCED KARAOKE LYRICS RESOLVER (LRCLIB + Fallback) ===
const lyricsApiCache = new Map();
app.get('/api/lyrics', async (req, res) => {
  const artist = String(req.query.artist || '').trim().slice(0, 100);
  const title = String(req.query.title || '').trim().slice(0, 120);
  if (!title) return res.json({ syncedLyrics: '', plainLyrics: '' });
  const key = `${artist.toLowerCase()}|${title.toLowerCase()}`;
  const cached = lyricsApiCache.get(key);
  if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
    return res.json(cached.data);
  }
  try {
    const q = encodeURIComponent(`${artist} ${title}`.trim());
    const r = await fetch(`https://lrclib.net/api/search?q=${q}`, {
      headers: { 'User-Agent': 'LENKYX-App/6.2' },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const arr = await r.json();
      const first = Array.isArray(arr)
        ? arr.find((x) => x?.syncedLyrics) || arr.find((x) => x?.plainLyrics) || arr[0]
        : null;
      const payload = {
        syncedLyrics: String(first?.syncedLyrics || ''),
        plainLyrics: String(first?.plainLyrics || ''),
        trackName: String(first?.trackName || title),
        artistName: String(first?.artistName || artist),
      };
      lyricsApiCache.set(key, { ts: Date.now(), data: payload });
      return res.json(payload);
    }
  } catch {
    // ignore network error
  }
  return res.json({ syncedLyrics: '', plainLyrics: '', trackName: title, artistName: artist });
});

// === v62: OUVIR JUNTO (SALA FESTA / JAM BRASIL) ===
const jamRooms = new Map();

app.post('/api/jam/create', (req, res) => {
  const hostName = String(req.body?.hostName || 'Anfitrião BR').trim().slice(0, 40);
  const track = req.body?.track || null;
  const code = `LX-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const room = {
    code,
    hostName,
    track,
    isPlaying: Boolean(track),
    positionSec: Number(req.body?.positionSec || 0),
    updatedAt: Date.now(),
    queue: [],
    members: [hostName],
    messages: [
      {
        id: `jm-${Date.now()}`,
        author: '🤖 MORRO GOLD HUD',
        text: `Sala ${code} criada por ${hostName}! Compartilhe o código para ouvir junto no Brasil.`,
        ts: new Date().toISOString(),
      },
    ],
  };
  jamRooms.set(code, room);
  return res.json(room);
});

app.get('/api/jam/:code', (req, res) => {
  const code = String(req.params.code || '').toUpperCase().trim();
  const room = jamRooms.get(code);
  if (!room) return res.status(404).json({ error: 'Sala Jam não encontrada' });
  return res.json(room);
});

app.post('/api/jam/:code/sync', (req, res) => {
  const code = String(req.params.code || '').toUpperCase().trim();
  const room = jamRooms.get(code);
  if (!room) return res.status(404).json({ error: 'Sala Jam não encontrada' });
  const { memberName, track, isPlaying, positionSec, addToQueue, chatText } = req.body || {};
  if (memberName) {
    const cleanMember = String(memberName).trim().slice(0, 32);
    if (cleanMember && !room.members.includes(cleanMember)) {
      room.members = [...room.members.slice(-29), cleanMember];
    }
  }
  if (track !== undefined) room.track = track;
  if (typeof isPlaying === 'boolean') room.isPlaying = isPlaying;
  if (typeof positionSec === 'number' && Number.isFinite(positionSec)) room.positionSec = positionSec;
  if (addToQueue && addToQueue.id) {
    if (!room.queue.some((t) => t.id === addToQueue.id)) {
      room.queue = [...room.queue.slice(-24), addToQueue];
    }
  }
  if (chatText && String(chatText).trim()) {
    room.messages = [
      ...room.messages.slice(-49),
      {
        id: `jm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        author: String(memberName || 'Ouvinte BR').slice(0, 32),
        text: String(chatText).trim().slice(0, 260),
        ts: new Date().toISOString(),
      },
    ];
  }
  room.updatedAt = Date.now();
  return res.json(room);
});

// === v64: LOJA DOS CRIA — LIVE PUBLISHED ITEMS, LINK EXTRACTOR & AFFILIATE COMMISSIONS ===
const liveShopCache = new Map();

function extractAffiliateParamsFromUrl(rawUrl) {
  const extracted = {};
  try {
    const u = new URL(rawUrl);
    const sp = u.searchParams;
    const mattTool = sp.get('matt_tool');
    const mattWord = sp.get('matt_word');
    const tag = sp.get('tag');
    const utmSource = sp.get('utm_source') || '';
    const afSiteId = sp.get('af_siteid') || '';

    if (mattTool && mattTool.trim()) extracted.affiliateMlTool = mattTool.trim();
    if (mattWord && mattWord.trim()) extracted.affiliateMlWord = mattWord.trim();
    if (tag && tag.trim()) extracted.affiliateAmazonTag = tag.trim();
    if (afSiteId && afSiteId.trim()) {
      extracted.affiliateShopeeId = afSiteId.trim().replace(/^an_/i, '');
    } else if (/^an_(\d+)/i.test(utmSource)) {
      extracted.affiliateShopeeId = utmSource.replace(/^an_/i, '').trim();
    } else if (/^af_(\d+)/i.test(utmSource)) {
      extracted.affiliateShopeeId = utmSource.replace(/^af_/i, '').trim();
    }
  } catch {
    // ignore invalid url
  }
  return extracted;
}

function decorateAffiliateUrl(rawUrl, settings = {}) {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    if (host.includes('amazon.com') && settings.affiliateAmazonTag) {
      u.searchParams.set('tag', String(settings.affiliateAmazonTag).trim());
    } else if (host.includes('shopee.com') && settings.affiliateShopeeId) {
      const cleanShopee = String(settings.affiliateShopeeId).trim().replace(/^an_/i, '');
      u.searchParams.set('utm_source', `an_${cleanShopee}`);
      u.searchParams.set('utm_medium', 'affiliates');
    } else if ((host.includes('mercadolivre.com') || host.includes('mercadolibre.com')) && settings.affiliateMlTool) {
      u.searchParams.set('matt_tool', String(settings.affiliateMlTool).trim());
      if (settings.affiliateMlWord) {
        u.searchParams.set('matt_word', String(settings.affiliateMlWord).trim());
      }
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
}

app.post('/api/shop/parse-affiliate-link', async (req, res) => {
  const raw = String(req.body?.url || '').trim();
  if (!raw || !/^https?:\/\//i.test(raw)) {
    return res.status(400).json({ error: 'Cole um link válido começando com https://' });
  }
  let resolvedUrl = raw;
  let extracted = extractAffiliateParamsFromUrl(raw);
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const isPrivate =
      host === 'localhost' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.');
    if (!isPrivate && Object.keys(extracted).length === 0) {
      const r = await fetch(raw, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (r.url) {
        resolvedUrl = r.url;
        extracted = { ...extracted, ...extractAffiliateParamsFromUrl(r.url) };
      }
    }
  } catch {
    // fallback to direct parse only
  }
  return res.json({
    ok: Object.keys(extracted).length > 0,
    resolvedUrl,
    extracted,
  });
});

// ===== LOJA MORRO GOLD · CATÁLOGO REAL + SINCRONIZAÇÃO AUTOMÁTICA COM A INTERNET =====
const SHOP_CATALOG_PATH = path.join(DATA_DIR, 'shop-catalog.json');
const SHOP_ORDERS_PATH = path.join(DATA_DIR, 'shop-orders.json');

const SHOP_REAL_SEED = [
  {
    id: 'shop-mansao-maromba-combo',
    title: 'Drink Mansão Maromba Vodka Combo 6 Unidades',
    priceBrl: 169.9,
    priceLabel: 'R$ 169,90 no Pix',
    priceOtherLabel: 'ou R$ 179,90 em outros meios',
    originalPriceBrl: 179.9,
    discountPct: 5,
    seller: 'TONELLI SUPERMERCADOS · Loja Oficial',
    verifiedPrice: true,
    query: 'Bebida Mansao Maromba Toguro combo',
  },
  {
    id: 'shop-mansao-maromba-pack',
    title: 'Mansão Maromba Whisky + Maca Verde 1L (Drink Pronto)',
    priceBrl: 12.79,
    priceLabel: 'R$ 12,79 no Pix',
    priceOtherLabel: 'ou R$ 15,99 em outros meios',
    originalPriceBrl: 25,
    discountPct: 48,
    seller: 'FULL · SUPER',
    verifiedPrice: true,
    query: 'Mansao Maromba Whisky Maca Verde 1L',
  },
  {
    id: 'shop-mansao-maromba-kit-treino',
    title: 'Drink Do Job Mansao Maromba Sabor Beijo Na Noite 1L',
    priceBrl: 12.79,
    priceLabel: 'R$ 12,79 no Pix',
    priceOtherLabel: 'ou R$ 15,99 em outros meios',
    originalPriceBrl: 25,
    discountPct: 48,
    seller: 'FULL · SUPER',
    verifiedPrice: true,
    query: 'Drink Do Job Mansao Maromba Beijo Na Noite',
  },
  {
    id: 'shop-mansao-maromba-kit6',
    title: 'Kit 6 Unid Mansao Maromba Drink (Combo Fardo)',
    priceBrl: 183.17,
    priceLabel: 'R$ 183,17 no Pix',
    priceOtherLabel: 'ou 6x R$ 32,20 sem juros',
    originalPriceBrl: 193.17,
    discountPct: 5,
    seller: 'Mercado Livre · Frete gratis',
    verifiedPrice: true,
    query: 'Kit 6 Unid Maromba Mansao Drink',
  },
];

function readJsonFileSafe(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) || fallback;
  } catch {
    return fallback;
  }
}

function writeJsonFileSafe(p, data) {
  try {
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  } catch {
    // ignore
  }
}

function getShopCatalog() {
  const saved = readJsonFileSafe(SHOP_CATALOG_PATH, null);
  if (saved && Array.isArray(saved.products) && saved.products.length) return saved;
  return {
    products: SHOP_REAL_SEED,
    updatedAt: new Date().toISOString(),
    lastSyncAttempt: null,
    syncStatus: 'verificado-manual',
  };
}

async function syncShopCatalog() {
  const catalog = getShopCatalog();
  catalog.lastSyncAttempt = new Date().toISOString();
  let updated = 0;
  for (const prod of catalog.products) {
    try {
      const q = encodeURIComponent(`${prod.query || prod.title} preco`);
      const r = await fetch(`https://www.bing.com/search?q=${q}&mkt=pt-BR`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
        signal: AbortSignal.timeout(7000),
      });
      const html = await r.text();
      const m = html.match(/R\$\s?([\d.]{1,9},\d{2})/);
      if (m) {
        const price = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        if (price > 2 && price < 100000) {
          prod.priceBrl = price;
          prod.priceLabel = `R$ ${price.toFixed(2).replace('.', ',')} no Pix`;
          if (prod.originalPriceBrl && prod.originalPriceBrl > price) {
            prod.discountPct = Math.max(1, Math.round((1 - price / prod.originalPriceBrl) * 100));
          }
          prod.verifiedPrice = true;
          prod.verifiedAt = new Date().toISOString().slice(0, 10);
          updated++;
        }
      }
    } catch {
      // mantém o último preço real conhecido
    }
  }
  catalog.updatedAt = new Date().toISOString();
  catalog.syncStatus = updated > 0 ? 'sincronizado-web' : 'referencia-verificada';
  writeJsonFileSafe(SHOP_CATALOG_PATH, catalog);
  return catalog;
}

// sincronização automática: ao ligar (após 15s) e a cada 6 horas
setTimeout(() => {
  syncShopCatalog().catch(() => {});
}, 15 * 1000);
setInterval(() => {
  syncShopCatalog().catch(() => {});
}, 6 * 60 * 60 * 1000);

app.get('/api/shop/catalog', (_req, res) => {
  res.json(getShopCatalog());
});

app.post('/api/shop/sync', async (_req, res) => {
  try {
    res.json(await syncShopCatalog());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/shop/orders', (_req, res) => {
  res.json(readJsonFileSafe(SHOP_ORDERS_PATH, { orders: [] }));
});

app.post('/api/shop/orders', (req, res) => {
  const store = readJsonFileSafe(SHOP_ORDERS_PATH, { orders: [] });
  const order = {
    id: 'ord-' + Date.now().toString(36),
    productId: String(req.body?.productId || ''),
    title: String(req.body?.title || '').slice(0, 160),
    store: String(req.body?.store || 'Mercado Livre').slice(0, 60),
    url: String(req.body?.url || '').slice(0, 500),
    status: 'encaminhado-a-loja-parceira',
    commissionNote:
      'Comissao de afiliado creditada pelo parceiro apos a confirmacao da venda (Programa de Afiliados). Loja parceira envia o produto.',
    createdAt: new Date().toISOString(),
  };
  store.orders = Array.isArray(store.orders) ? store.orders : [];
  store.orders.unshift(order);
  if (store.orders.length > 200) store.orders = store.orders.slice(0, 200);
  writeJsonFileSafe(SHOP_ORDERS_PATH, store);
  res.json({ ok: true, order });
});

app.get('/api/shop/live', async (req, res) => {
  const qRaw = String(req.query.q || 'Lacoste Oakley Juliet Invicta Brasil').trim().slice(0, 120);
  const key = qRaw.toLowerCase();
  const db = readDb();
  const effectiveSettings = getEffectiveSettings(db);
  const clicks = Number(effectiveSettings.shopAffiliateClicks || 0);
  const cached = liveShopCache.get(key);
  if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
    return res.json({
      query: qRaw,
      clicks,
      items: cached.items.map((it) => ({
        ...it,
        affiliateUrl: decorateAffiliateUrl(it.productUrl, effectiveSettings),
      })),
    });
  }

  try {
    const bingUrl = `https://www.bing.com/images/async?q=${encodeURIComponent(
      `${qRaw} preco comprar brasil`
    )}&first=1&count=18&mkt=pt-BR`;
    const r = await fetch(bingUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(7000),
    });
    const rawHtml = await r.text();
    const unescape = (s) =>
      String(s || '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    const blocks = rawHtml.match(/m="\{[^"]*\}"/g) || [];
    const seen = new Set();
    const items = [];
    for (const blk of blocks) {
      const jsonStr = unescape(blk.slice(3, -1));
      try {
        const obj = JSON.parse(jsonStr);
        const murl = String(obj.murl || '').trim();
        const purl = String(obj.purl || '').trim();
        const t = String(obj.t || qRaw).trim();
        if (!murl.startsWith('http') || !purl.startsWith('http')) continue;
        if (seen.has(murl)) continue;
        seen.add(murl);
        let storeName = 'Loja Brasil';
        try {
          const h = new URL(purl).hostname.replace(/^www\./, '');
          if (h.includes('mercadolivre')) storeName = 'Mercado Livre';
          else if (h.includes('shopee')) storeName = 'Shopee Brasil';
          else if (h.includes('amazon')) storeName = 'Amazon BR';
          else if (h.includes('netshoes')) storeName = 'Netshoes';
          else if (h.includes('dafiti')) storeName = 'Dafiti';
          else if (h.includes('centauro')) storeName = 'Centauro';
          else if (h.includes('webmotors')) storeName = 'WebMotors';
          else if (h.includes('olx')) storeName = 'OLX Brasil';
          else storeName = h.split('.')[0].toUpperCase();
        } catch {
          // ignore
        }
        items.push({
          id: `live-${items.length}-${Date.now().toString(36)}`,
          title: t.slice(0, 95),
          imageUrl: murl,
          productUrl: purl,
          storeName,
        });
        if (items.length >= 12) break;
      } catch {
        // ignore invalid json block
      }
    }

    liveShopCache.set(key, { ts: Date.now(), items });
    return res.json({
      query: qRaw,
      clicks,
      items: items.map((it) => ({
        ...it,
        affiliateUrl: decorateAffiliateUrl(it.productUrl, effectiveSettings),
      })),
    });
  } catch {
    return res.json({ query: qRaw, clicks, items: [] });
  }
});

// === v67: REAL BRAND/PRODUCT PHOTO RESOLVER & CACHE ===
const shopPhotoCache = new Map();

function isSafePublicHttpUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const h = u.hostname.toLowerCase();
    if (
      h === 'localhost' ||
      h.startsWith('127.') ||
      h.startsWith('10.') ||
      h.startsWith('192.168.') ||
      h.startsWith('169.254.') ||
      h === '0.0.0.0' ||
      h === '::1'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchImageBuffer(imgUrl) {
  if (!isSafePublicHttpUrl(imgUrl)) return null;
  try {
    const r = await fetch(imgUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(5500),
    });
    if (!r.ok) return null;
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    if (!ct.startsWith('image/')) return null;
    const arr = await r.arrayBuffer();
    if (arr.byteLength < 2500 || arr.byteLength > 4 * 1024 * 1024) return null;
    return { contentType: ct.split(';')[0], buffer: Buffer.from(arr) };
  } catch {
    return null;
  }
}

async function resolveBrandPhotoForQuery(qRaw) {
  const key = qRaw.toLowerCase();
  const cached = shopPhotoCache.get(key);
  if (cached && Date.now() - cached.ts < 24 * 60 * 60 * 1000) {
    return cached;
  }
  const bingUrl = `https://www.bing.com/images/async?q=${encodeURIComponent(
    `${qRaw} produto foto oficial`
  )}&first=1&count=12&mkt=pt-BR`;
  const r = await fetch(bingUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    signal: AbortSignal.timeout(6500),
  });
  const rawHtml = await r.text();
  const unescape = (s) =>
    String(s || '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  const blocks = rawHtml.match(/m="\{[^"]*\}"/g) || [];
  const candidates = [];
  for (const blk of blocks) {
    try {
      const obj = JSON.parse(unescape(blk.slice(3, -1)));
      if (obj.murl && isSafePublicHttpUrl(obj.murl)) candidates.push(String(obj.murl));
      if (obj.turl && isSafePublicHttpUrl(obj.turl)) candidates.push(String(obj.turl));
    } catch {
      // ignore
    }
  }
  for (const cand of candidates.slice(0, 8)) {
    const img = await fetchImageBuffer(cand);
    if (img) {
      const entry = { ...img, ts: Date.now() };
      if (shopPhotoCache.size >= 140) {
        const oldestKey = shopPhotoCache.keys().next().value;
        if (oldestKey) shopPhotoCache.delete(oldestKey);
      }
      shopPhotoCache.set(key, entry);
      return entry;
    }
  }
  return null;
}

app.get('/api/shop/photo', async (req, res) => {
  const qRaw = String(req.query.q || 'Lacoste Brasil').trim().slice(0, 120);
  try {
    const entry = await resolveBrandPhotoForQuery(qRaw);
    if (entry) {
      res.setHeader('Content-Type', entry.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(entry.buffer);
    }
  } catch {
    // ignore
  }
  return res.status(404).end();
});

app.get('/api/shop/img-proxy', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  const qFallback = String(req.query.q || '').trim().slice(0, 120);
  if (rawUrl) {
    const img = await fetchImageBuffer(rawUrl);
    if (img) {
      res.setHeader('Content-Type', img.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(img.buffer);
    }
  }
  if (qFallback) {
    const entry = await resolveBrandPhotoForQuery(qFallback).catch(() => null);
    if (entry) {
      res.setHeader('Content-Type', entry.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(entry.buffer);
    }
  }
  return res.status(404).end();
});

app.post('/api/shop/track-click', (_req, res) => {
  const db = readDb();
  const nextClicks = Number(db.settings?.shopAffiliateClicks || 0) + 1;
  db.settings = {
    ...(db.settings || {}),
    shopAffiliateClicks: nextClicks,
  };
  writeDb(db);
  res.json({ ok: true, clicks: nextClicks });
});

// ============ MINHAS COMISSÕES NAS VENDAS (PRIVADO — SÓ O DONO) ============
// Rate limit simples por IP para evitar spam de registros de venda.
const shopSaleAttempts = new Map();
function shopSaleRateLimit(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxPerWindow = 25;
  const entry = shopSaleAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    shopSaleAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= maxPerWindow;
}

// O público registra a venda e recebe só o total. Taxa, comissão, dados do
// comprador e chave PIX ficam em arquivo privado e exigem o token de Criador.
app.post('/api/shop/sales', (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!shopSaleRateLimit(ip)) {
    return res.status(429).json({ ok: false, error: 'Muitas vendas registradas. Tente de novo em instantes.' });
  }
  const payload = registerSale({
    items: Array.isArray(req.body?.items) ? req.body.items : [],
    buyerName: req.body?.buyerName,
    buyerContact: req.body?.buyerContact,
    channel: req.body?.channel,
    source: req.body?.source,
  });
  if (!payload.ok) return res.status(400).json(payload);
  res.json(payload);
});

app.get('/api/shop/commissions', auth.requireCreator, (_req, res) => {
  res.json(listSales());
});

app.put('/api/shop/commissions/config', auth.requireCreator, (req, res) => {
  const config = updateCommissionConfig(req.body || {});
  res.json({ ok: true, config });
});

app.post('/api/shop/commissions/:id/status', auth.requireCreator, (req, res) => {
  const order = updateSaleStatus(req.params.id, req.body?.status);
  if (!order) return res.status(404).json({ ok: false, error: 'Venda não encontrada' });
  res.json({ ok: true, order });
});

app.delete('/api/shop/commissions/:id', auth.requireCreator, (req, res) => {
  const removed = deleteSale(req.params.id);
  if (!removed) return res.status(404).json({ ok: false, error: 'Venda não encontrada' });
  res.json({ ok: true });
});

// ==================== AUTOMATIC FAVELA BAILES & ROLÊS LIVE ENGINE ====================
const BAILES_PATH = path.join(DATA_DIR, 'bailes.json');
const bailesWebCache = new Map();

function readSavedBailes() {
  try {
    if (!fs.existsSync(BAILES_PATH)) return [];
    const parsed = JSON.parse(fs.readFileSync(BAILES_PATH, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedBailes(items) {
  try {
    fs.writeFileSync(BAILES_PATH, JSON.stringify(items.slice(0, 120), null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

function nextWeekendLabel(dayOffset = 0) {
  const now = new Date();
  const d = new Date(now);
  const dow = now.getDay(); // 0=Dom..5=Sex..6=Sab
  let daysToFri = (5 - dow + 7) % 7;
  if (dow === 5 || dow === 6) daysToFri = 0;
  d.setDate(now.getDate() + daysToFri + dayOffset);
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dias[d.getDay()]} · ${dd}/${mm}`;
}

function getCoreBrazilBailes() {
  return [
    {
      id: 'baile-dz7-sp',
      title: 'Fluxo da DZ7 & Baile da 17 — Paraisópolis',
      city: 'São Paulo - SP',
      neighborhood: 'Paraisópolis (Zona Sul)',
      address: 'Rua Ernest Renan / Rua Pasquale Gallupi, Paraisópolis - São Paulo, SP',
      schedule: `${nextWeekendLabel(0)} & ${nextWeekendLabel(1)} · 22h até 06h`,
      lineup: 'MCs da GR6 & Love Funk · Paredão Automotivo · Bebidas & Narguile liberado',
      entry: 'Pista Free na Rua · Camarotes no local',
      badge: '🔥 MAIOR FLUXO DE SP',
      liveUpdated: true,
    },
    {
      id: 'baile-helipa-sp',
      title: 'Baile do Helipa — Fluxo da Mina & Rampa',
      city: 'São Paulo - SP',
      neighborhood: 'Heliópolis (Zona Sul)',
      address: 'Av. Almirante Delamare / Estrada das Lágrimas, Heliópolis - São Paulo, SP',
      schedule: `${nextWeekendLabel(1)} · 22h30 até amanhecer`,
      lineup: 'DJs do Mandelão 130 BPM · Paredões & Motos · Mansão Maromba no rolê',
      entry: 'Entrada Franca na Rua',
      badge: '🔊 MANDELÃO PESADO',
      liveUpdated: true,
    },
    {
      id: 'baile-penha-rj',
      title: 'Baile da Gaiola — Vila Cruzeiro & Penha VIP',
      city: 'Rio de Janeiro - RJ',
      neighborhood: 'Penha / Vila Cruzeiro (Zona Norte)',
      address: 'Largo da Penha / Rua Nossa Senhora da Penha, Penha - Rio de Janeiro, RJ',
      schedule: `${nextWeekendLabel(0)} · 23h até 07h`,
      lineup: 'DJ Rennan da Penha Style · Funk 150 BPM · Paredão & Camarote Open',
      entry: 'Pista Free · Área VIP no local',
      badge: '👑 CLÁSSICO DO RIO',
      liveUpdated: true,
    },
    {
      id: 'baile-vidigal-rj',
      title: 'Baile VIP do Vidigal & Mirante do Arvrão (Sunset & Noite)',
      city: 'Rio de Janeiro - RJ',
      neighborhood: 'Vidigal (Zona Sul)',
      address: 'Av. Presidente João Goulart / Mirante do Arvrão, Vidigal - Rio de Janeiro, RJ',
      schedule: `${nextWeekendLabel(1)} & ${nextWeekendLabel(2)} · 17h às 04h`,
      lineup: 'Vista panorâmica pro mar + Funk Carioca + Mansão Maromba & Combos',
      entry: 'Lista VIP / Ingresso a partir de R$ 40',
      badge: '🌅 VISTA VIP DA LAJE',
      liveUpdated: true,
    },
    {
      id: 'baile-cg-ms',
      title: 'Fluxo dos Cria & Baile da Moreninha / Aero Rancho VIP',
      city: 'Campo Grande - MS',
      neighborhood: 'Moreninhas / Aero Rancho / Centro Oeste',
      address: 'Av. Gury Marques / Rua Barreiras, Moreninha II - Campo Grande, MS',
      schedule: `${nextWeekendLabel(0)} & ${nextWeekendLabel(1)} · 22h às 05h`,
      lineup: 'Eletrofunk + Mega Funk + Paredão de Carretinha + Encontro de Motos',
      entry: 'Entrada Liberada / Área VIP Combos',
      badge: '🏍️ CAMPO GRANDE MS',
      liveUpdated: true,
    },
    {
      id: 'baile-serra-bh',
      title: 'Baile da Serra & Aglomerado VIP — BH',
      city: 'Belo Horizonte - MG',
      neighborhood: 'Aglomerado da Serra',
      address: 'Rua Serra Negra / Av. Cardoso, Serra - Belo Horizonte, MG',
      schedule: `${nextWeekendLabel(1)} · 22h às 05h`,
      lineup: 'MTG BH Pesado · DJs de Minas + Paredão & Narguile VIP',
      entry: 'Entrada Free na Pista',
      badge: '⚡ MTG DE MINAS',
      liveUpdated: true,
    },
  ];
}

async function fetchLiveBailesFromWeb(cityQuery) {
  const key = (cityQuery || 'brasil').toLowerCase().trim();
  const cached = bailesWebCache.get(key);
  if (cached && Date.now() - cached.ts < 15 * 60 * 1000) return cached.items;

  const items = [];
  try {
    const q = cityQuery && cityQuery !== 'all'
      ? `baile funk festa favela agenda endereco ${cityQuery} 2026`
      : 'agenda baile funk festas favela fim de semana sao paulo rio de janeiro 2026';
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
      },
      signal: AbortSignal.timeout(5500),
    });
    if (r.ok) {
      const html = await r.text();
      const linkRx = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = linkRx.exec(html)) !== null && items.length < 6) {
        const cleanTitle = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        const cleanSnippet = m[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        let targetUrl = m[1];
        try {
          const u = new URL(targetUrl.startsWith('//') ? `https:${targetUrl}` : targetUrl);
          if (u.searchParams.get('uddg')) targetUrl = u.searchParams.get('uddg');
        } catch {
          // keep raw
        }
        if (cleanTitle && cleanSnippet) {
          items.push({
            id: `web-baile-${items.length}-${Date.now()}`,
            title: cleanTitle.slice(0, 90),
            city: cityQuery && cityQuery !== 'all' ? cityQuery : 'Brasil · Ao Vivo',
            neighborhood: 'Agenda Online Atualizada',
            address: cleanSnippet.slice(0, 140),
            schedule: `${nextWeekendLabel(0)} / Atualizado Agora`,
            lineup: 'Evento encontrado automaticamente na web · Clique para confirmar endereço e ingressos',
            entry: 'Consultar divulgação oficial',
            badge: '🌐 AUTO WEB LIVE',
            sourceUrl: targetUrl,
            liveUpdated: true,
          });
        }
      }
    }
  } catch {
    // ignore live web fetch timeout
  }
  bailesWebCache.set(key, { ts: Date.now(), items });
  return items;
}

app.get('/api/bailes/live', async (req, res) => {
  const city = String(req.query.city || 'all').trim();
  const saved = readSavedBailes();
  const core = getCoreBrazilBailes();
  const webLive = await fetchLiveBailesFromWeb(city);

  const merged = [...saved, ...core, ...webLive];
  const filtered =
    !city || city.toLowerCase() === 'all'
      ? merged
      : merged.filter((b) =>
          `${b.city} ${b.neighborhood} ${b.address} ${b.title}`
            .toLowerCase()
            .includes(city.toLowerCase())
        );

  res.json({
    ok: true,
    updatedAt: new Date().toISOString(),
    total: filtered.length,
    bailes: filtered,
  });
});

app.post('/api/bailes/submit', (req, res) => {
  const { title, city, neighborhood, address, schedule, lineup, entry, contact } = req.body || {};
  if (!title || !address || !city) {
    return res.status(400).json({ error: 'Informe nome do baile, cidade e endereço!' });
  }
  const newBaile = {
    id: `baile-user-${Date.now()}`,
    title: String(title).trim().slice(0, 100),
    city: String(city).trim().slice(0, 60),
    neighborhood: String(neighborhood || 'Comunidade / Quebrada').trim().slice(0, 60),
    address: String(address).trim().slice(0, 160),
    schedule: String(schedule || `${nextWeekendLabel(0)} · 22h`).trim().slice(0, 80),
    lineup: String(lineup || 'Funk · Paredão · Rolê VIP liberado').trim().slice(0, 140),
    entry: String(entry || 'Entrada Free / Consultar').trim().slice(0, 60),
    contact: String(contact || '').trim().slice(0, 40),
    badge: '📢 DIVULGAÇÃO AO VIVO',
    liveUpdated: true,
    createdAt: new Date().toISOString(),
  };
  const list = readSavedBailes();
  list.unshift(newBaile);
  writeSavedBailes(list);
  res.json({ ok: true, baile: newBaile });
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
    console.log(`MORRO GOLD Server running on http://0.0.0.0:${PORT}`);
    console.log(
      `Storage mode: ${isSupabaseEnabled() ? 'Supabase Cloud PostgreSQL + local cache' : 'Local JSON'} | Data dir: ${DATA_DIR}`
    );
    // Warm up movies, series, animes, live sports & autonomous worlds caches in background
    setTimeout(() => {
      void getMoviesDirectory().catch(() => {});
      void getSportsDirectory().catch(() => {});
    }, 2000);
    startAutonomousWorldSync();
  });
}

void boot();

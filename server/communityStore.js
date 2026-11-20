import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_FILE = path.join(DATA_DIR, 'community.json');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const HAS_SUPA = Boolean(SUPABASE_URL && SUPABASE_KEY);

const DEFAULT_SHORTS = [
  {
    id: 'short-lenkyx-01',
    title: '🌌 Cosmic Phonk Drift — Beat Visualizer',
    creator_name: 'MORRO GOLD Oficial',
    creator_color: 'from-pink-500 to-cyan-400',
    description: 'Arraste para o lado ⬅️➡️ para ver mais vídeos curtos no universo Cosmic Phonk!',
    media_type: 'cosmic_reel',
    video_url: '',
    youtube_id: '',
    poster_url: '/covers/album-official.jpg',
    audio_title: 'Faixa 01 · Cosmic Phonk',
    likes: 128,
    created_at: new Date().toISOString(),
  },
  {
    id: 'short-lenkyx-02',
    title: '⚡ Bass Drop Espacial — Estúdio 9:16',
    creator_name: 'MORRO GOLD Oficial',
    creator_color: 'from-purple-500 to-pink-500',
    description: 'Grave forte estilo JBL + luzes cósmicas em tela vertical.',
    media_type: 'cosmic_reel',
    video_url: '',
    youtube_id: '',
    poster_url: '/covers/track-05.jpg',
    audio_title: 'Faixa 05 · Órbita Phonk',
    likes: 94,
    created_at: new Date().toISOString(),
  },
  {
    id: 'short-lenkyx-03',
    title: '🛸 Sinais da Galáxia — Galeria Phonk',
    creator_name: 'MORRO GOLD Oficial',
    creator_color: 'from-cyan-400 to-emerald-400',
    description: 'Curta ❤️ e comente 💬 com outros fãs no chat da comunidade!',
    media_type: 'cosmic_reel',
    video_url: '',
    youtube_id: '',
    poster_url: '/covers/track-12.jpg',
    audio_title: 'Faixa 12 · Galáxia',
    likes: 76,
    created_at: new Date().toISOString(),
  },
  {
    id: 'short-lenkyx-04',
    title: '🔥 Eclipse Noturno — Cosmic Beats',
    creator_name: 'MORRO GOLD Oficial',
    creator_color: 'from-amber-400 to-rose-500',
    description: 'Grave seu vídeo no Estúdio ou entre Ao Vivo para aparecer aqui!',
    media_type: 'cosmic_reel',
    video_url: '',
    youtube_id: '',
    poster_url: '/covers/track-16.jpg',
    audio_title: 'Faixa 16 · Eclipse',
    likes: 63,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_CHAT = [
  {
    id: 'chat-welcome-1',
    room_id: 'global',
    author_name: 'MORRO GOLD Oficial',
    author_color: 'from-pink-500 to-cyan-400',
    message: '🌌 Bem-vindos ao Chat Ao Vivo MORRO GOLD! Comentem, curtam as músicas e compartilhem seus vídeos curtos!',
    created_at: new Date().toISOString(),
  },
];

function readLocal() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(LOCAL_FILE)) {
      const seed = {
        chat: DEFAULT_CHAT,
        comments: [],
        shorts: DEFAULT_SHORTS,
        lives: [],
        channels: {},
        shortLikes: {},
        commentLikes: {},
      };
      fs.writeFileSync(LOCAL_FILE, JSON.stringify(seed, null, 2));
      return seed;
    }
    const parsed = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf-8'));
    return {
      chat: Array.isArray(parsed.chat) ? parsed.chat : DEFAULT_CHAT,
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      shorts: Array.isArray(parsed.shorts) && parsed.shorts.length ? parsed.shorts : DEFAULT_SHORTS,
      lives: Array.isArray(parsed.lives) ? parsed.lives : [],
      channels: parsed.channels && typeof parsed.channels === 'object' ? parsed.channels : {},
      shortLikes: parsed.shortLikes && typeof parsed.shortLikes === 'object' ? parsed.shortLikes : {},
      commentLikes: parsed.commentLikes && typeof parsed.commentLikes === 'object' ? parsed.commentLikes : {},
    };
  } catch {
    return {
      chat: DEFAULT_CHAT,
      comments: [],
      shorts: DEFAULT_SHORTS,
      lives: [],
      channels: {},
      shortLikes: {},
      commentLikes: {},
    };
  }
}

function writeLocal(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
  } catch {
    // ignore
  }
}

async function supaReq(table, opts = {}) {
  const qs = opts.query ? `?${opts.query}` : '';
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: opts.method || 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(7000),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`Supabase ${table} ${r.status}: ${txt}`);
  }
  return r.json().catch(() => []);
}

export async function getChatMessages(roomId = 'global', limit = 60) {
  const cleanRoom = String(roomId || 'global').slice(0, 64);
  if (HAS_SUPA) {
    try {
      const rows = await supaReq('lenkyx_community_chat', {
        query: `room_id=eq.${encodeURIComponent(cleanRoom)}&order=created_at.desc&limit=${limit}`,
      });
      if (Array.isArray(rows) && rows.length > 0) return rows.reverse();
      if (cleanRoom === 'global') return DEFAULT_CHAT;
      return [];
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  return local.chat.filter((m) => m.room_id === cleanRoom).slice(-limit);
}

export async function postChatMessage({ roomId = 'global', authorName, authorColor, message }) {
  const cleanMsg = String(message || '').trim().slice(0, 400);
  if (!cleanMsg) throw new Error('Mensagem vazia');
  const item = {
    id: `chat-${crypto.randomUUID().slice(0, 12)}`,
    room_id: String(roomId || 'global').slice(0, 64),
    author_name: String(authorName || 'Fã Cósmico').trim().slice(0, 40),
    author_color: String(authorColor || 'from-pink-500 to-cyan-400').slice(0, 50),
    message: cleanMsg,
    created_at: new Date().toISOString(),
  };

  if (HAS_SUPA) {
    try {
      const inserted = await supaReq('lenkyx_community_chat', { method: 'POST', body: item });
      if (Array.isArray(inserted) && inserted[0]) return inserted[0];
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  local.chat.push(item);
  if (local.chat.length > 300) local.chat = local.chat.slice(-250);
  writeLocal(local);
  return item;
}

export async function getCommentsForTarget(targetId, limit = 120, userId = '') {
  const cleanTarget = String(targetId || '').trim().slice(0, 100);
  if (!cleanTarget) return [];
  const uid = String(userId || '').trim();
  const local = readLocal();
  const commentLikesMap = local.commentLikes || {};

  let rows = [];
  if (HAS_SUPA) {
    try {
      const supaRows = await supaReq('lenkyx_community_comments', {
        query: `target_id=eq.${encodeURIComponent(cleanTarget)}&order=created_at.desc&limit=${limit}`,
      });
      if (Array.isArray(supaRows)) rows = supaRows;
    } catch {
      // fallback
    }
  }
  if (rows.length === 0) {
    rows = local.comments.filter((c) => c.target_id === cleanTarget).slice(-limit).reverse();
  }

  // Also merge any local replies/comments not yet in Supabase
  const seenIds = new Set(rows.map((r) => r.id));
  for (const lc of local.comments) {
    if (lc.target_id === cleanTarget && !seenIds.has(lc.id)) {
      rows.push(lc);
    }
  }

  const normalized = rows.map((c) => {
    const likedList = Array.isArray(commentLikesMap[c.id]) ? commentLikesMap[c.id] : [];
    const likedByMe = Boolean(uid && likedList.includes(uid));
    return {
      ...c,
      source: c.source || 'lenkyx',
      liked_by_me: likedByMe,
      likes: Math.max(Number(c.likes || 0), likedList.length),
    };
  });

  // Nest replies under their parent_id
  const replyMap = new Map();
  const topLevel = [];
  for (const item of normalized) {
    if (item.parent_id) {
      const arr = replyMap.get(item.parent_id) || [];
      arr.push(item);
      replyMap.set(item.parent_id, arr);
    } else {
      topLevel.push(item);
    }
  }
  return topLevel.map((t) => ({
    ...t,
    replies: (replyMap.get(t.id) || []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }));
}

export async function postComment({ targetId, parentId = '', authorName, authorColor, text }) {
  const cleanTarget = String(targetId || '').trim().slice(0, 100);
  const cleanParent = String(parentId || '').trim().slice(0, 60);
  const cleanText = String(text || '').trim().slice(0, 500);
  if (!cleanTarget || !cleanText) throw new Error('Comentário inválido');
  const item = {
    id: `cmt-${crypto.randomUUID().slice(0, 12)}`,
    target_id: cleanTarget,
    parent_id: cleanParent || undefined,
    author_name: String(authorName || 'Fã Cósmico').trim().slice(0, 40),
    author_color: String(authorColor || 'from-purple-500 to-pink-500').slice(0, 50),
    text: cleanText,
    likes: 0,
    source: 'lenkyx',
    created_at: new Date().toISOString(),
  };

  if (HAS_SUPA && !cleanParent) {
    try {
      const inserted = await supaReq('lenkyx_community_comments', { method: 'POST', body: item });
      if (Array.isArray(inserted) && inserted[0]) return { ...inserted[0], replies: [], liked_by_me: false };
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  local.comments.push(item);
  if (local.comments.length > 1500) local.comments = local.comments.slice(-1200);
  writeLocal(local);
  return { ...item, replies: [], liked_by_me: false };
}

export async function likeComment(commentId, userId = '', baseLikesFallback = 0) {
  const id = String(commentId || '').trim();
  const uid = String(userId || '').trim() || 'anon-guest';
  if (!id) return null;

  const local = readLocal();
  if (!local.commentLikes || typeof local.commentLikes !== 'object') local.commentLikes = {};
  const list = Array.isArray(local.commentLikes[id]) ? [...local.commentLikes[id]] : [];
  const idx = list.indexOf(uid);
  let liked = false;
  if (idx >= 0) {
    list.splice(idx, 1);
    liked = false;
  } else {
    list.push(uid);
    liked = true;
  }
  local.commentLikes[id] = list;

  const c = local.comments.find((x) => x.id === id);
  let finalLikes = Math.max(0, Number(baseLikesFallback || 0)) + (liked ? 1 : 0);
  if (c) {
    const base = Math.max(0, Number(c.baseLikes ?? c.likes ?? 0) - (idx >= 0 ? 1 : 0));
    c.baseLikes = base;
    c.likes = base + list.length;
    finalLikes = c.likes;
  }
  writeLocal(local);

  if (HAS_SUPA && !id.startsWith('ytc-')) {
    try {
      await supaReq('lenkyx_community_comments', {
        method: 'PATCH',
        query: `id=eq.${encodeURIComponent(id)}`,
        body: { likes: finalLikes },
      });
    } catch {
      // ignore
    }
  }
  return { id, likes: finalLikes, liked };
}

export async function getCommunityShorts() {
  if (HAS_SUPA) {
    try {
      const rows = await supaReq('lenkyx_community_shorts', {
        query: 'order=created_at.desc&limit=40',
      });
      if (Array.isArray(rows) && rows.length > 0) {
        return [...rows, ...DEFAULT_SHORTS.filter((d) => !rows.some((r) => r.id === d.id))];
      }
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  return local.shorts;
}

export async function createCommunityShort({
  title,
  creatorName,
  creatorColor,
  description,
  mediaType,
  videoUrl,
  youtubeId,
  posterUrl,
  audioTitle,
}) {
  const cleanTitle = String(title || '').trim().slice(0, 120);
  if (!cleanTitle) throw new Error('Título obrigatório');

  const safeVideo = String(videoUrl || '').slice(0, 600000); // allow compact webm/mp4 data URL or https URL
  const item = {
    id: `short-${crypto.randomUUID().slice(0, 10)}`,
    title: cleanTitle,
    creator_name: String(creatorName || 'Cria MORRO GOLD').trim().slice(0, 40),
    creator_color: String(creatorColor || 'from-cyan-400 to-pink-500').slice(0, 50),
    description: String(description || '').trim().slice(0, 260),
    media_type: String(mediaType || 'cosmic_reel').slice(0, 24),
    video_url: safeVideo,
    youtube_id: String(youtubeId || '').slice(0, 32),
    poster_url: String(posterUrl || '/covers/album-official.jpg').slice(0, 400),
    audio_title: String(audioTitle || '').slice(0, 100),
    likes: 1,
    created_at: new Date().toISOString(),
  };

  if (HAS_SUPA) {
    try {
      const inserted = await supaReq('lenkyx_community_shorts', { method: 'POST', body: item });
      if (Array.isArray(inserted) && inserted[0]) return inserted[0];
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  local.shorts = [item, ...local.shorts].slice(0, 60);
  writeLocal(local);
  return item;
}

export function getUserLikedShortIds(userId = '') {
  const uid = String(userId || '').trim();
  if (!uid) return [];
  const local = readLocal();
  const map = local.shortLikes || {};
  const liked = [];
  for (const [sid, entry] of Object.entries(map)) {
    if (Array.isArray(entry?.likedBy) && entry.likedBy.includes(uid)) {
      liked.push(sid);
    }
  }
  return liked;
}

export function applyShortLikeOverlay(items = [], userId = '') {
  const uid = String(userId || '').trim();
  const local = readLocal();
  const map = local.shortLikes || {};
  return items.map((item) => {
    const entry = map[item.id];
    if (!entry) return { ...item, liked_by_me: false };
    const likedBy = Array.isArray(entry.likedBy) ? entry.likedBy : [];
    return {
      ...item,
      likes: Number(entry.baseLikes ?? item.likes ?? 0) + likedBy.length,
      liked_by_me: Boolean(uid && likedBy.includes(uid)),
    };
  });
}

export async function likeCommunityShort(shortId, userId = '', initialLikes = 0) {
  const id = String(shortId || '').trim();
  const uid = String(userId || '').trim() || 'anon-guest';
  if (!id) return null;

  const local = readLocal();
  if (!local.shortLikes || typeof local.shortLikes !== 'object') local.shortLikes = {};

  const shortObj = local.shorts.find((x) => x.id === id);
  const existing = local.shortLikes[id] || {
    baseLikes: Math.max(0, Number(shortObj?.likes ?? initialLikes ?? 0)),
    likedBy: [],
  };
  const likedBy = Array.isArray(existing.likedBy) ? [...existing.likedBy] : [];
  const idx = likedBy.indexOf(uid);
  let liked = false;
  if (idx >= 0) {
    // Already liked by this person -> toggle off (strict 1 like per person per video!)
    likedBy.splice(idx, 1);
    liked = false;
  } else {
    likedBy.push(uid);
    liked = true;
  }
  const finalLikes = Math.max(0, Number(existing.baseLikes || 0)) + likedBy.length;
  local.shortLikes[id] = { baseLikes: Math.max(0, Number(existing.baseLikes || 0)), likedBy };

  if (shortObj) {
    shortObj.likes = finalLikes;
  }
  writeLocal(local);

  if (HAS_SUPA && !id.startsWith('wshort-')) {
    try {
      await supaReq('lenkyx_community_shorts', {
        method: 'PATCH',
        query: `id=eq.${encodeURIComponent(id)}`,
        body: { likes: finalLikes },
      });
    } catch {
      // fallback
    }
  }
  return { id, likes: finalLikes, liked };
}

export async function getActiveLives() {
  const cutoff = Date.now() - 4 * 3600 * 1000;
  if (HAS_SUPA) {
    try {
      const rows = await supaReq('lenkyx_live_rooms', {
        query: 'is_live=eq.true&order=started_at.desc&limit=20',
      });
      if (Array.isArray(rows)) {
        return rows.filter((r) => new Date(r.updated_at || r.started_at).getTime() > cutoff);
      }
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  return local.lives.filter(
    (l) => l.is_live && new Date(l.updated_at || l.started_at).getTime() > cutoff
  );
}

export async function startOrUpdateLive({ id, hostName, hostColor, title, theme, posterUrl, isLive = true, likeDelta = 0 }) {
  const roomId = String(id || `live-${crypto.randomUUID().slice(0, 8)}`);
  const now = new Date().toISOString();

  if (HAS_SUPA) {
    try {
      const existing = await supaReq('lenkyx_live_rooms', { query: `id=eq.${encodeURIComponent(roomId)}` });
      if (existing?.[0]) {
        const nextLikes = (existing[0].likes || 0) + likeDelta;
        const upd = await supaReq('lenkyx_live_rooms', {
          method: 'PATCH',
          query: `id=eq.${encodeURIComponent(roomId)}`,
          body: {
            is_live: Boolean(isLive),
            likes: nextLikes,
            updated_at: now,
          },
        });
        return upd?.[0] || { ...existing[0], is_live: Boolean(isLive), likes: nextLikes, updated_at: now };
      }
      const item = {
        id: roomId,
        host_name: String(hostName || 'Cria MORRO GOLD').trim().slice(0, 40),
        host_color: String(hostColor || 'from-rose-500 to-pink-500').slice(0, 50),
        title: String(title || 'Live MORRO GOLD').trim().slice(0, 120),
        theme: String(theme || 'Cosmic Phonk Live').slice(0, 60),
        poster_url: String(posterUrl || '/covers/album-official.jpg').slice(0, 400),
        is_live: Boolean(isLive),
        likes: 1,
        viewers: 1,
        started_at: now,
        updated_at: now,
      };
      const inserted = await supaReq('lenkyx_live_rooms', { method: 'POST', body: item });
      return inserted?.[0] || item;
    } catch {
      // fallback
    }
  }

  const local = readLocal();
  const idx = local.lives.findIndex((l) => l.id === roomId);
  if (idx >= 0) {
    local.lives[idx] = {
      ...local.lives[idx],
      is_live: Boolean(isLive),
      likes: (local.lives[idx].likes || 0) + likeDelta,
      updated_at: now,
    };
    writeLocal(local);
    return local.lives[idx];
  }
  const item = {
    id: roomId,
    host_name: String(hostName || 'Cria MORRO GOLD').trim().slice(0, 40),
    host_color: String(hostColor || 'from-rose-500 to-pink-500').slice(0, 50),
    title: String(title || 'Live MORRO GOLD').trim().slice(0, 120),
    theme: String(theme || 'Cosmic Phonk Live').slice(0, 60),
    poster_url: String(posterUrl || '/covers/album-official.jpg').slice(0, 400),
    is_live: Boolean(isLive),
    likes: 1,
    viewers: 1,
    started_at: now,
    updated_at: now,
  };
  local.lives = [item, ...local.lives].slice(0, 30);
  writeLocal(local);
  return item;
}

// === CHANNEL SUBSCRIPTIONS (Inscrever-se em canais, artistas & criadores) ===
function normalizeChannelKey(channelId, channelName) {
  return String(channelId || channelName || 'lenkyx-oficial')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .slice(0, 80) || 'lenkyx-oficial';
}

export function getChannelSubscriptions(subscriberId = '') {
  const local = readLocal();
  const map = local.channels || {};
  const subKey = String(subscriberId || '').trim();
  const counts = {};
  const subscribed = [];
  for (const [k, entry] of Object.entries(map)) {
    const subs = Array.isArray(entry?.subscribers) ? entry.subscribers : [];
    const baseCount = Number(entry?.baseCount || 0);
    counts[k] = baseCount + subs.length;
    if (subKey && subs.includes(subKey)) subscribed.push(k);
  }
  return { counts, subscribed };
}

export function toggleChannelSubscribe({ channelId, channelName, subscriberId }) {
  const key = normalizeChannelKey(channelId, channelName);
  const sub = String(subscriberId || '').trim() || `anon-${crypto.randomUUID().slice(0, 8)}`;
  const local = readLocal();
  if (!local.channels || typeof local.channels !== 'object') local.channels = {};
  const existing = local.channels[key] || {
    channelId: key,
    channelName: String(channelName || key).slice(0, 80),
    baseCount: key.includes('lenkyx') ? 1240 : 0,
    subscribers: [],
  };
  const list = Array.isArray(existing.subscribers) ? [...existing.subscribers] : [];
  const pos = list.indexOf(sub);
  let isSubscribed = false;
  if (pos >= 0) {
    list.splice(pos, 1);
    isSubscribed = false;
  } else {
    list.push(sub);
    isSubscribed = true;
  }
  local.channels[key] = {
    ...existing,
    channelName: String(channelName || existing.channelName || key).slice(0, 80),
    subscribers: list,
  };
  writeLocal(local);
  return {
    channelId: key,
    channelName: local.channels[key].channelName,
    subscribed: isSubscribed,
    count: Number(local.channels[key].baseCount || 0) + list.length,
  };
}

// === INDEPENDENT SMART TV HANDOFF SESSIONS ===
const tvHandoffSessions = new Map();

export function createTvHandoffSession(payload) {
  const digits = String(Math.floor(100 + Math.random() * 900));
  const code = digits; // ultra-short 3-digit PIN for Smart TV remotes!
  const session = {
    code,
    shortPin: digits,
    title: String(payload?.title || 'MORRO GOLD').slice(0, 140),
    artist: String(payload?.artist || 'LENKYX').slice(0, 80),
    mode: String(payload?.mode || 'galaxy').slice(0, 24),
    youtubeVideoId: String(payload?.youtubeVideoId || '').slice(0, 32),
    audioUrl: String(payload?.audioUrl || '').slice(0, 600),
    streamUrl: String(payload?.streamUrl || '').slice(0, 600),
    coverUrl: String(payload?.coverUrl || '/covers/album-official.jpg').slice(0, 500),
    trackId: String(payload?.trackId || '').slice(0, 80),
    createdAt: Date.now(),
    claimedByTv: false,
  };
  tvHandoffSessions.set(code, session);
  tvHandoffSessions.set(`LNX-${digits}`, session);
  // Prune sessions older than 2 hours
  const cutoff = Date.now() - 2 * 3600 * 1000;
  for (const [k, v] of tvHandoffSessions.entries()) {
    if (v.createdAt < cutoff) tvHandoffSessions.delete(k);
  }
  return session;
}

export function getTvHandoffSession(code, markClaimed = false) {
  const raw = String(code || '').trim().toUpperCase();
  const digitsOnly = raw.replace(/^LNX-?/i, '');
  const s = tvHandoffSessions.get(raw) || tvHandoffSessions.get(digitsOnly);
  if (!s) return null;
  if (markClaimed) {
    s.claimedByTv = true;
    s.claimedAt = Date.now();
  }
  return s;
}

// === USER & CREATOR CHANNELS ("IGUAL DO YOUTUBE" + LEI SOBERANA DA FAVELA MORRO GOLD) ===
const DEFAULT_CREATOR_CHANNELS = [
  {
    id: 'canal-morro-gold-oficial',
    handle: '@morrogoldoficial',
    name: 'MORRO GOLD Oficial',
    bio: 'Canal oficial da favela ostentação! Lançamentos de Funk, Rap, Pagode, Bailes VIP, barbearias e cultura da quebrada.',
    category: 'Funk & Bailes',
    location: 'Morro Gold · Brasil',
    avatarUrl: '/covers/morro-gold-emblema-grosso.png',
    bannerUrl: '/covers/album-official.jpg',
    ownerId: 'system-morro-gold',
    licenseType: 'morro_gold_favela',
    verifiedOriginal: true,
    subscribersBase: 128000,
    createdAt: '2026-01-10T12:00:00.000Z',
    videos: [
      {
        id: 'cv-mg-01',
        title: 'MORRO GOLD — Boas-vindas à Plataforma da Favela (Original)',
        description: 'Plataforma cultural 100% voltada para os crias, MCs, DJs e empreendedores da comunidade.',
        kind: 'video',
        mediaUrl: '/audio/track-01.mp3',
        youtubeId: '',
        posterUrl: '/covers/album-official.jpg',
        originalDeclaration: true,
        copyrightNotice: 'Obra Cultural Original · Lei Soberana MORRO GOLD (Lei 9.610/98)',
        views: 42100,
        likes: 3890,
        createdAt: '2026-06-01T14:00:00.000Z',
      },
    ],
    communityPosts: [
      {
        id: 'cp-mg-01',
        text: '🔥 Agora cada cria e criador pode abrir o próprio Canal aqui no MORRO GOLD com selo de Cultura da Favela e direitos preservados!',
        imageUrl: '/covers/morro-gold-emblema-grosso.png',
        likes: 1940,
        createdAt: '2026-10-15T18:00:00.000Z',
      },
    ],
  },
  {
    id: 'canal-baile-fluxo-tv',
    handle: '@baileefluxotv',
    name: 'Baile & Fluxo TV',
    bio: 'Cobertura dos melhores bailes, paredões, cortes na régua e rolês da comunidade.',
    category: 'Bailes',
    location: 'Zona Sul · SP / RJ',
    avatarUrl: '/covers/track-05.jpg',
    bannerUrl: '/covers/track-12.jpg',
    ownerId: 'system-baile-tv',
    licenseType: 'morro_gold_favela',
    verifiedOriginal: true,
    subscribersBase: 64200,
    createdAt: '2026-03-14T15:00:00.000Z',
    videos: [],
    communityPosts: [
      {
        id: 'cp-bf-01',
        text: '📍 Agenda dos bailes do fim de semana atualizada na aba Explorar! Quem vai colar?',
        imageUrl: '',
        likes: 612,
        createdAt: '2026-11-01T20:00:00.000Z',
      },
    ],
  },
  {
    id: 'canal-cria-beats-studio',
    handle: '@criabeatsstudio',
    name: 'Cria Beats Studio',
    bio: 'Beats pesados de Funk Mandelão, Trap de Cria e Pagode acústico direto da quebrada.',
    category: 'Rap & Trap',
    location: 'Comunidade · BR',
    avatarUrl: '/covers/track-16.jpg',
    bannerUrl: '/covers/track-05.jpg',
    ownerId: 'system-cria-beats',
    licenseType: 'morro_gold_favela',
    verifiedOriginal: true,
    subscribersBase: 41900,
    createdAt: '2026-04-20T16:00:00.000Z',
    videos: [],
    communityPosts: [],
  },
];

function ensureCreatorChannels(local) {
  if (!Array.isArray(local.creatorChannels) || local.creatorChannels.length === 0) {
    local.creatorChannels = DEFAULT_CREATOR_CHANNELS.map((c) => ({ ...c }));
  }
  if (!Array.isArray(local.copyrightReports)) {
    local.copyrightReports = [];
  }
  return local;
}

export function getCreatorChannels(userId = '') {
  const local = ensureCreatorChannels(readLocal());
  const subMap = local.channels || {};
  const uid = String(userId || '').trim();
  const list = local.creatorChannels.map((ch) => {
    const key = normalizeChannelKey(ch.id, ch.name);
    const entry = subMap[key];
    const dynSubs = Array.isArray(entry?.subscribers) ? entry.subscribers : [];
    const totalSubs = Number(ch.subscribersBase || 0) + Number(entry?.baseCount || 0) + dynSubs.length;
    return {
      ...ch,
      channelKey: key,
      subscribersCount: totalSubs,
      subscribed: Boolean(uid && dynSubs.includes(uid)),
      isOwner: Boolean(uid && ch.ownerId === uid),
    };
  });
  return list;
}

export function upsertCreatorChannel(payload = {}) {
  const local = ensureCreatorChannels(readLocal());
  const ownerId = String(payload.ownerId || '').trim() || `cria-${crypto.randomUUID().slice(0, 8)}`;
  const rawName = String(payload.name || '').trim().slice(0, 60);
  if (!rawName) throw new Error('Nome do canal é obrigatório.');
  const rawHandle = String(payload.handle || rawName)
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_.-]+/g, '')
    .slice(0, 32);
  const handle = `@${rawHandle || 'canalcria'}`;
  const id = payload.id
    ? String(payload.id).trim().slice(0, 80)
    : `canal-${rawHandle || crypto.randomUUID().slice(0, 6)}-${crypto.randomUUID().slice(0, 4)}`;

  const existingIdx = local.creatorChannels.findIndex((c) => c.id === id);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    const prev = local.creatorChannels[existingIdx];
    const updated = {
      ...prev,
      name: rawName,
      handle,
      bio: String(payload.bio ?? prev.bio ?? '').trim().slice(0, 400),
      category: String(payload.category || prev.category || 'Funk & Bailes').slice(0, 40),
      location: String(payload.location ?? prev.location ?? 'Favela · Brasil').trim().slice(0, 60),
      avatarUrl: String(payload.avatarUrl || prev.avatarUrl || '/covers/morro-gold-emblema-grosso.png').slice(0, 200000),
      bannerUrl: String(payload.bannerUrl || prev.bannerUrl || '/covers/album-official.jpg').slice(0, 200000),
      licenseType: String(payload.licenseType || prev.licenseType || 'morro_gold_favela').slice(0, 40),
      updatedAt: now,
    };
    local.creatorChannels[existingIdx] = updated;
    writeLocal(local);
    return { ...updated, isOwner: updated.ownerId === ownerId };
  }

  const created = {
    id,
    handle,
    name: rawName,
    bio: String(payload.bio || 'Canal original criado na comunidade MORRO GOLD · Cultura da Favela!').trim().slice(0, 400),
    category: String(payload.category || 'Funk & Bailes').slice(0, 40),
    location: String(payload.location || 'Favela · Brasil').trim().slice(0, 60),
    avatarUrl: String(payload.avatarUrl || '/covers/morro-gold-emblema-grosso.png').slice(0, 200000),
    bannerUrl: String(payload.bannerUrl || '/covers/album-official.jpg').slice(0, 200000),
    ownerId,
    licenseType: String(payload.licenseType || 'morro_gold_favela').slice(0, 40),
    verifiedOriginal: true,
    subscribersBase: 1,
    createdAt: now,
    videos: [],
    communityPosts: [],
  };
  local.creatorChannels.unshift(created);
  writeLocal(local);
  return { ...created, isOwner: true, subscribersCount: 1, subscribed: false };
}

export function addCreatorChannelVideo(channelId, payload = {}) {
  const local = ensureCreatorChannels(readLocal());
  const ch = local.creatorChannels.find((c) => c.id === channelId);
  if (!ch) throw new Error('Canal não encontrado.');
  if (!payload.originalDeclaration) {
    throw new Error('Confirme a Declaração Anti-Plágio & Originalidade antes de publicar.');
  }
  const title = String(payload.title || '').trim().slice(0, 120);
  if (!title) throw new Error('Título do vídeo/faixa é obrigatório.');

  const kind = ['video', 'short', 'music'].includes(payload.kind) ? payload.kind : 'video';
  const item = {
    id: `cv-${crypto.randomUUID().slice(0, 8)}`,
    title,
    description: String(payload.description || '').trim().slice(0, 500),
    kind,
    mediaUrl: String(payload.mediaUrl || '').slice(0, 6000000),
    youtubeId: String(payload.youtubeId || '').trim().slice(0, 24),
    posterUrl: String(payload.posterUrl || ch.avatarUrl || '/covers/album-official.jpg').slice(0, 200000),
    originalDeclaration: true,
    copyrightNotice: 'Obra Original · Protegida pela Lei Soberana MORRO GOLD (Cultura da Favela) & Lei 9.610/98',
    views: 1,
    likes: 1,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(ch.videos)) ch.videos = [];
  ch.videos.unshift(item);

  // Also cross-post Shorts into community shorts feed if requested
  if (kind === 'short' && (item.mediaUrl || item.youtubeId)) {
    const shortItem = {
      id: `short-${crypto.randomUUID().slice(0, 8)}`,
      title: item.title,
      creator_name: ch.name,
      creator_color: 'from-amber-400 to-rose-500',
      description: `${item.description || 'Original do Canal'} (${ch.handle})`,
      media_type: item.youtubeId ? 'youtube' : 'video',
      video_url: item.youtubeId ? '' : item.mediaUrl,
      youtube_id: item.youtubeId,
      poster_url: item.posterUrl,
      audio_title: `${ch.name} · Canal MORRO GOLD`,
      likes: 1,
      created_at: item.createdAt,
    };
    local.shorts = [shortItem, ...(local.shorts || [])].slice(0, 100);
  }

  writeLocal(local);
  return item;
}

export function deleteCreatorChannelVideo(channelId, videoId) {
  const local = ensureCreatorChannels(readLocal());
  const ch = local.creatorChannels.find((c) => c.id === channelId);
  if (!ch) throw new Error('Canal não encontrado.');
  ch.videos = (ch.videos || []).filter((v) => v.id !== videoId);
  writeLocal(local);
  return { ok: true };
}

export function addCreatorChannelPost(channelId, payload = {}) {
  const local = ensureCreatorChannels(readLocal());
  const ch = local.creatorChannels.find((c) => c.id === channelId);
  if (!ch) throw new Error('Canal não encontrado.');
  const text = String(payload.text || '').trim().slice(0, 600);
  if (!text) throw new Error('Escreva algo para publicar na Comunidade.');
  const post = {
    id: `cp-${crypto.randomUUID().slice(0, 8)}`,
    text,
    imageUrl: String(payload.imageUrl || '').slice(0, 200000),
    likes: 1,
    createdAt: new Date().toISOString(),
  };
  if (!Array.isArray(ch.communityPosts)) ch.communityPosts = [];
  ch.communityPosts.unshift(post);
  writeLocal(local);
  return post;
}

export function submitCopyrightReport(payload = {}) {
  const local = ensureCreatorChannels(readLocal());
  const report = {
    id: `cr-${crypto.randomUUID().slice(0, 8)}`,
    targetId: String(payload.targetId || '').slice(0, 120),
    targetTitle: String(payload.targetTitle || '').slice(0, 160),
    reporterName: String(payload.reporterName || 'Anônimo').slice(0, 80),
    reporterEmail: String(payload.reporterEmail || '').slice(0, 120),
    reason: String(payload.reason || 'Direitos Autorais / Atribuição').slice(0, 120),
    details: String(payload.details || '').slice(0, 800),
    status: 'registrado_marco_civil_art19',
    createdAt: new Date().toISOString(),
  };
  local.copyrightReports.unshift(report);
  local.copyrightReports = local.copyrightReports.slice(0, 200);
  writeLocal(local);
  return report;
}


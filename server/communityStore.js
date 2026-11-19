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
    creator_name: 'LENKYX Oficial',
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
    creator_name: 'LENKYX Oficial',
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
    creator_name: 'LENKYX Oficial',
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
    creator_name: 'LENKYX Oficial',
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
    author_name: 'LENKYX Oficial',
    author_color: 'from-pink-500 to-cyan-400',
    message: '🌌 Bem-vindos ao Chat Espacial LENKYX! Comentem, curtam as músicas e compartilhem seus vídeos curtos!',
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
    };
  } catch {
    return { chat: DEFAULT_CHAT, comments: [], shorts: DEFAULT_SHORTS, lives: [], channels: {} };
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

export async function getCommentsForTarget(targetId, limit = 80) {
  const cleanTarget = String(targetId || '').trim().slice(0, 100);
  if (!cleanTarget) return [];
  if (HAS_SUPA) {
    try {
      const rows = await supaReq('lenkyx_community_comments', {
        query: `target_id=eq.${encodeURIComponent(cleanTarget)}&order=created_at.desc&limit=${limit}`,
      });
      return Array.isArray(rows) ? rows : [];
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  return local.comments.filter((c) => c.target_id === cleanTarget).slice(-limit).reverse();
}

export async function postComment({ targetId, authorName, authorColor, text }) {
  const cleanTarget = String(targetId || '').trim().slice(0, 100);
  const cleanText = String(text || '').trim().slice(0, 400);
  if (!cleanTarget || !cleanText) throw new Error('Comentário inválido');
  const item = {
    id: `cmt-${crypto.randomUUID().slice(0, 12)}`,
    target_id: cleanTarget,
    author_name: String(authorName || 'Fã Cósmico').trim().slice(0, 40),
    author_color: String(authorColor || 'from-purple-500 to-pink-500').slice(0, 50),
    text: cleanText,
    likes: 0,
    created_at: new Date().toISOString(),
  };

  if (HAS_SUPA) {
    try {
      const inserted = await supaReq('lenkyx_community_comments', { method: 'POST', body: item });
      if (Array.isArray(inserted) && inserted[0]) return inserted[0];
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  local.comments.push(item);
  if (local.comments.length > 1000) local.comments = local.comments.slice(-800);
  writeLocal(local);
  return item;
}

export async function likeComment(commentId) {
  const id = String(commentId || '').trim();
  if (!id) return null;
  if (HAS_SUPA) {
    try {
      const rows = await supaReq('lenkyx_community_comments', { query: `id=eq.${encodeURIComponent(id)}` });
      if (rows?.[0]) {
        const nextLikes = (rows[0].likes || 0) + 1;
        const upd = await supaReq('lenkyx_community_comments', {
          method: 'PATCH',
          query: `id=eq.${encodeURIComponent(id)}`,
          body: { likes: nextLikes },
        });
        return upd?.[0] || { ...rows[0], likes: nextLikes };
      }
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  const c = local.comments.find((x) => x.id === id);
  if (c) {
    c.likes = (c.likes || 0) + 1;
    writeLocal(local);
    return c;
  }
  return null;
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
    creator_name: String(creatorName || 'Criador LENKYX').trim().slice(0, 40),
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

export async function likeCommunityShort(shortId) {
  const id = String(shortId || '').trim();
  if (!id) return null;
  if (HAS_SUPA) {
    try {
      const rows = await supaReq('lenkyx_community_shorts', { query: `id=eq.${encodeURIComponent(id)}` });
      if (rows?.[0]) {
        const nextLikes = (rows[0].likes || 0) + 1;
        const upd = await supaReq('lenkyx_community_shorts', {
          method: 'PATCH',
          query: `id=eq.${encodeURIComponent(id)}`,
          body: { likes: nextLikes },
        });
        return upd?.[0] || { ...rows[0], likes: nextLikes };
      }
    } catch {
      // fallback
    }
  }
  const local = readLocal();
  const s = local.shorts.find((x) => x.id === id);
  if (s) {
    s.likes = (s.likes || 0) + 1;
    writeLocal(local);
    return s;
  }
  return null;
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
        host_name: String(hostName || 'Criador LENKYX').trim().slice(0, 40),
        host_color: String(hostColor || 'from-rose-500 to-pink-500').slice(0, 50),
        title: String(title || 'Live Cósmica LENKYX').trim().slice(0, 120),
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
    host_name: String(hostName || 'Criador LENKYX').trim().slice(0, 40),
    host_color: String(hostColor || 'from-rose-500 to-pink-500').slice(0, 50),
    title: String(title || 'Live Cósmica LENKYX').trim().slice(0, 120),
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
    title: String(payload?.title || 'LENKYX Cosmic Phonk').slice(0, 140),
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

import { Track } from '../types';
import { isAndroidApk } from './androidBridge';

function mapAudiusTrack(item: Record<string, unknown>, idx: number): Track | null {
  const id = String(item.id || '');
  const durationSec = Math.round(Number(item.duration) || 0);
  if (!id || durationSec < 45) return null;
  const user = (item.user as Record<string, unknown>) || {};
  const artwork = (item.artwork as Record<string, string>) || {};
  const cover = artwork['480x480'] || artwork['150x150'] || artwork['1000x1000'] || '/covers/void-horizon.jpg';
  const title = String(item.title || 'Faixa Global').trim();
  const artist = String(user.name || user.handle || 'Artista Global').trim();
  const genre = String(item.genre || 'Mundo');
  const plays = Number(item.play_count) || 0;
  const likes = Number(item.favorite_count) || 0;

  return {
    id: `world-audius-${id}`,
    number: idx + 1,
    title,
    emoji: '🌍',
    artist,
    album: genre,
    bpm: 128,
    key: 'Fm',
    coverUrl: cover,
    audioUrl: `https://api.audius.co/v1/tracks/${encodeURIComponent(id)}/stream?app_name=LENKYX`,
    durationSec,
    source: 'world_full',
    externalUrl: `https://audius.co${String(item.permalink || '')}`,
    isDemoAudio: false,
    hasCustomCover: true,
    plays,
    likes,
    favorite: false,
    releaseBatch: 0,
    status: { suno: false, cover: true, app: true, youtube: false, distrokid: false },
    sunoPrompt: '',
    lyrics: '',
    createdAt: String(item.release_date || new Date().toISOString()),
  };
}

async function directWorldSearch(query: string): Promise<Track[]> {
  const q = encodeURIComponent(query.trim());
  const res = await fetch(`https://api.audius.co/v1/tracks/search?query=${q}&app_name=LENKYX`).then((r) => r.json());
  const out: Track[] = [];
  if (Array.isArray(res?.data)) {
    res.data.forEach((item: Record<string, unknown>, idx: number) => {
      const mapped = mapAudiusTrack(item, idx);
      if (mapped && out.length < 24) out.push(mapped);
    });
  }
  return out;
}

async function directWorldTrending(): Promise<Track[]> {
  const r = await fetch('https://api.audius.co/v1/tracks/trending?app_name=LENKYX&limit=30');
  const d = await r.json();
  const out: Track[] = [];
  if (Array.isArray(d?.data)) {
    d.data.forEach((item: Record<string, unknown>, idx: number) => {
      const mapped = mapAudiusTrack(item, idx);
      if (mapped && out.length < 24) out.push(mapped);
    });
  }
  return out;
}

export async function searchWorldMusic(query: string): Promise<Track[]> {
  const clean = query.trim();
  if (!clean) return getWorldTrending();
  if (isAndroidApk()) {
    return directWorldSearch(clean);
  }
  try {
    const r = await fetch(`/api/world-search?q=${encodeURIComponent(clean)}`);
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d.tracks)) return d.tracks;
    }
  } catch {
    // fallback direct
  }
  return directWorldSearch(clean);
}

export async function getWorldTrending(): Promise<Track[]> {
  if (isAndroidApk()) {
    return directWorldTrending();
  }
  try {
    const r = await fetch('/api/world-trending');
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d.tracks)) return d.tracks;
    }
  } catch {
    // fallback direct
  }
  return directWorldTrending();
}

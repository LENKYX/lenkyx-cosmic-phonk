import { Track } from '../types';
import { isAndroidApk } from './androidBridge';

function mapAudiusTrack(item: Record<string, unknown>, idx: number): Track | null {
  const id = String(item.id || '');
  if (!id) return null;
  const user = (item.user as Record<string, unknown>) || {};
  const artwork = (item.artwork as Record<string, string>) || {};
  const cover = artwork['480x480'] || artwork['150x150'] || artwork['1000x1000'] || '/covers/void-horizon.jpg';
  const title = String(item.title || 'Faixa Global').trim();
  const artist = String(user.name || user.handle || 'Artista Global').trim();
  const genre = String(item.genre || 'Mundo');
  const durationSec = Math.round(Number(item.duration) || 0);
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

function mapItunesTrack(item: Record<string, unknown>, idx: number): Track | null {
  const preview = String(item.previewUrl || '');
  const tid = String(item.trackId || '');
  if (!preview || !tid) return null;
  const art = String(item.artworkUrl100 || '').replace('100x100bb', '600x600bb') || '/covers/void-horizon.jpg';
  return {
    id: `world-itunes-${tid}`,
    number: idx + 1,
    title: String(item.trackName || 'Música').trim(),
    emoji: '🎧',
    artist: String(item.artistName || 'Artista').trim(),
    album: String(item.collectionName || item.primaryGenreName || 'Global').trim(),
    bpm: 126,
    key: 'Cm',
    coverUrl: art,
    audioUrl: preview,
    durationSec: Math.round((Number(item.trackTimeMillis) || 30000) / 1000),
    source: 'world_preview',
    externalUrl: String(item.trackViewUrl || ''),
    isDemoAudio: false,
    hasCustomCover: true,
    plays: 0,
    likes: 0,
    favorite: false,
    releaseBatch: 0,
    status: { suno: false, cover: true, app: true, youtube: false, distrokid: false },
    sunoPrompt: '',
    lyrics: '',
    createdAt: String(item.releaseDate || new Date().toISOString()),
  };
}

async function directWorldSearch(query: string): Promise<Track[]> {
  const q = encodeURIComponent(query.trim());
  const [audiusRes, itunesRes] = await Promise.allSettled([
    fetch(`https://api.audius.co/v1/tracks/search?query=${q}&app_name=LENKYX`).then((r) => r.json()),
    fetch(`https://itunes.apple.com/search?term=${q}&media=music&limit=16`).then((r) => r.json()),
  ]);

  const out: Track[] = [];
  if (audiusRes.status === 'fulfilled' && Array.isArray(audiusRes.value?.data)) {
    audiusRes.value.data.slice(0, 14).forEach((item: Record<string, unknown>, idx: number) => {
      const mapped = mapAudiusTrack(item, idx);
      if (mapped) out.push(mapped);
    });
  }
  if (itunesRes.status === 'fulfilled' && Array.isArray(itunesRes.value?.results)) {
    itunesRes.value.results.slice(0, 14).forEach((item: Record<string, unknown>, idx: number) => {
      const mapped = mapItunesTrack(item, out.length + idx);
      if (mapped) out.push(mapped);
    });
  }
  return out;
}

async function directWorldTrending(): Promise<Track[]> {
  const r = await fetch('https://api.audius.co/v1/tracks/trending?app_name=LENKYX&limit=24');
  const d = await r.json();
  const out: Track[] = [];
  if (Array.isArray(d?.data)) {
    d.data.forEach((item: Record<string, unknown>, idx: number) => {
      const mapped = mapAudiusTrack(item, idx);
      if (mapped) out.push(mapped);
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

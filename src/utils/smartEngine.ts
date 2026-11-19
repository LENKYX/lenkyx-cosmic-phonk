// Smart Self-Improving Personalization Engine
// Learns what listeners across Mobile, PC, and Smart TV actually enjoy and adapts feeds & queues automatically.

export interface SmartSignals {
  genres: Record<string, number>;
  artists: Record<string, number>;
  reelCategories: Record<string, number>;
  bpmSum: number;
  bpmCount: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'lenkyx_smart_signals_v1';

function loadSignals(): SmartSignals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SmartSignals>;
      return {
        genres: parsed.genres || {},
        artists: parsed.artists || {},
        reelCategories: parsed.reelCategories || {},
        bpmSum: Number(parsed.bpmSum || 0),
        bpmCount: Number(parsed.bpmCount || 0),
        lastUpdated: Number(parsed.lastUpdated || Date.now()),
      };
    }
  } catch {
    // ignore
  }
  return { genres: {}, artists: {}, reelCategories: {}, bpmSum: 0, bpmCount: 0, lastUpdated: Date.now() };
}

function saveSignals(sig: SmartSignals): void {
  try {
    sig.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sig));
  } catch {
    // ignore
  }
}

export function recordSmartInteraction(evt: {
  kind: 'play' | 'like' | 'subscribe' | 'reel' | 'watch_reel' | 'search';
  artist?: string;
  genre?: string;
  title?: string;
  bpm?: number;
  category?: string;
  reelCategory?: string;
  weight?: number;
}): void {
  const w = evt.weight ?? (evt.kind === 'like' || evt.kind === 'subscribe' ? 3 : 1);
  const sig = loadSignals();
  if (evt.artist) {
    const k = evt.artist.trim();
    if (k) sig.artists[k] = (sig.artists[k] || 0) + w;
  }
  if (evt.genre) {
    const g = evt.genre.trim().toLowerCase();
    if (g) sig.genres[g] = (sig.genres[g] || 0) + w;
  }
  const cat = evt.reelCategory || evt.category;
  if (cat) {
    const c = cat.trim().toLowerCase();
    if (c) sig.reelCategories[c] = (sig.reelCategories[c] || 0) + w;
  }
  if (evt.bpm && evt.bpm > 40 && evt.bpm < 240) {
    sig.bpmSum += evt.bpm * w;
    sig.bpmCount += w;
  }
  saveSignals(sig);

  // Fire-and-forget global intelligence learning
  try {
    void fetch('/api/smart-learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: evt.kind,
        artist: evt.artist || '',
        genre: evt.genre || '',
        reelCategory: evt.reelCategory || '',
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function getSmartPreferredReelCategory(): string {
  const sig = loadSignals();
  const entries = Object.entries(sig.reelCategories).filter(([k]) => k && k !== 'all');
  if (entries.length === 0) return 'all';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0] || 'all';
}

export function rankTracksBySmartTaste<T extends { artist?: string; genre?: string; album?: string; bpm?: number; plays?: number; favorite?: boolean }>(
  items: T[]
): T[] {
  const sig = loadSignals();
  const avgBpm = sig.bpmCount > 0 ? sig.bpmSum / sig.bpmCount : 0;
  return [...items].sort((a, b) => {
    const score = (x: T) => {
      let s = x.favorite ? 15 : 0;
      if (x.artist && sig.artists[x.artist]) s += sig.artists[x.artist] * 4;
      const g = (x.genre || x.album || '').toLowerCase();
      if (g && sig.genres[g]) s += sig.genres[g] * 3;
      if (avgBpm && x.bpm) s += Math.max(0, 6 - Math.abs(x.bpm - avgBpm) / 10);
      s += Math.min(8, Math.log10((x.plays || 0) + 1) * 2);
      return s;
    };
    return score(b) - score(a);
  });
}

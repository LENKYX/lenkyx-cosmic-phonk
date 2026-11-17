const TASTE_KEY = 'lenkyx_ai_taste_v1';

export interface TasteMemory {
  recentQueries: string[];
  favoriteArtists: Record<string, number>;
  favoriteGenres: Record<string, number>;
  playedTitles: string[];
}

function loadMemory(): TasteMemory {
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        recentQueries: Array.isArray(parsed.recentQueries) ? parsed.recentQueries : [],
        favoriteArtists: parsed.favoriteArtists || {},
        favoriteGenres: parsed.favoriteGenres || {},
        playedTitles: Array.isArray(parsed.playedTitles) ? parsed.playedTitles : [],
      };
    }
  } catch {
    // ignore
  }
  return { recentQueries: [], favoriteArtists: {}, favoriteGenres: {}, playedTitles: [] };
}

function saveMemory(mem: TasteMemory): void {
  try {
    localStorage.setItem(TASTE_KEY, JSON.stringify(mem));
  } catch {
    // ignore
  }
}

export function recordSearchTaste(query: string): TasteMemory {
  const clean = query.trim();
  const mem = loadMemory();
  if (!clean || clean.length < 2) return mem;
  mem.recentQueries = [clean, ...mem.recentQueries.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 12);
  saveMemory(mem);
  return mem;
}

export function recordPlayTaste(artist: string, genre?: string, title?: string): TasteMemory {
  const mem = loadMemory();
  const cleanArt = (artist || '').trim();
  if (cleanArt && !cleanArt.toLowerCase().includes('lenkyx')) {
    mem.favoriteArtists[cleanArt] = (mem.favoriteArtists[cleanArt] || 0) + 1;
  }
  if (genre) {
    mem.favoriteGenres[genre] = (mem.favoriteGenres[genre] || 0) + 1;
  }
  if (title) {
    mem.playedTitles = [title, ...mem.playedTitles.filter((t) => t !== title)].slice(0, 20);
  }
  saveMemory(mem);
  return mem;
}

export function getSmartDiscoveryQueries(): { label: string; query: string }[] {
  const mem = loadMemory();
  const picks: { label: string; query: string }[] = [];

  const topArtists = Object.entries(mem.favoriteArtists)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  topArtists.forEach((art) => {
    picks.push({ label: `Mix ${art}`, query: `${art} top hits mix` });
  });

  mem.recentQueries.slice(0, 3).forEach((q) => {
    if (!picks.some((p) => p.query.toLowerCase() === q.toLowerCase())) {
      picks.push({ label: `Mais de "${q}"`, query: `${q} melhores musicas` });
    }
  });

  if (picks.length === 0) {
    return [
      { label: 'Descobertas Internacionais', query: 'The Weeknd Dua Lipa Bruno Mars top hits' },
      { label: 'Brasil em Alta', query: 'Henrique e Juliano Alok Anitta sucessos' },
      { label: 'Phonk & Espaço', query: 'Cosmic Phonk Drift Bass 2026' },
    ];
  }

  return picks.slice(0, 5);
}

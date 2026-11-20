import {
  Track,
  WorldArtistDirectoryItem,
  WorldCuratedPlaylist,
  WorldSearchPayload,
} from '../types';
import { isAndroidApk } from './androidBridge';

const CLOUD_API_BASE = 'https://lenkyx-cosmic-phonk.onrender.com';

export const FALLBACK_CURATED_PLAYLISTS: WorldCuratedPlaylist[] = [
  {
    id: 'pl-favela-funk-2026',
    title: 'Funk da Favela 2026 (Vivos na Correria)',
    subtitle: 'MC Iguinho CT, MC Leozinho ZS, MC Ryan SP, MC Hariel, MC IG, MC Jacaré, MC Poze do Rodo',
    emoji: '👑',
    era: 'Baile & Comunidade 2026',
    searchQuery: 'MC Iguinho CT Cuida do Pet MC Leozinho ZS MC Ryan SP MC Hariel MC IG MC Jacare funk oficial',
    gradient: 'from-amber-500/40 via-rose-600/25 to-yellow-500/25',
  },
  {
    id: 'pl-favela-rap-2026',
    title: 'Rap & Trap da Quebrada (Na Correria)',
    subtitle: "Racionais MC's, Filipe Ret, Orochi, BK', Djonga, MC Cabelinho, Veigh, L7NNON, TZ da Coronel",
    emoji: '🎤',
    era: 'Voz do Morro 2026',
    searchQuery: 'Racionais MCs Filipe Ret Orochi BK Djonga MC Cabelinho Veigh L7NNON rap nacional oficial',
    gradient: 'from-purple-600/40 via-amber-500/25 to-emerald-500/25',
  },
  {
    id: 'pl-favela-pagode-2026',
    title: 'Pagode da Comunidade & Churrasco',
    subtitle: 'Grupo Menos É Mais, Ferrugem, Turma do Pagode, Péricles, Sorriso Maroto, Belo, Kamisa 10',
    emoji: '🥁',
    era: 'Roda de Samba 2026',
    searchQuery: 'Grupo Menos e Mais Ferrugem Turma do Pagode Pericles Sorriso Maroto Kamisa 10 pagode ao vivo',
    gradient: 'from-emerald-500/35 via-amber-500/25 to-orange-500/25',
  },
  {
    id: 'pl-clips-oficiais',
    title: 'Melhores Clipes Oficiais & DVDs Completos',
    subtitle: 'Henrique & Juliano, Marília Mendonça, Gusttavo Lima, Queen, Michael Jackson, Alok',
    emoji: '🎬',
    era: 'Cinema & Clipes HD',
    searchQuery: 'Henrique e Juliano Marilia Mendonca Queen Michael Jackson The Weeknd clipe oficial official music video',
    gradient: 'from-rose-600/40 via-purple-600/25 to-cyan-500/25',
  },
  {
    id: 'pl-sertanejo-top',
    title: 'Sertanejo Gigantes & Sofrência',
    subtitle: 'Henrique & Juliano, Marília Mendonça, Gusttavo Lima, Jorge & Mateus',
    emoji: '🤠',
    era: 'Brasil Atual & Clássicos',
    searchQuery: 'Henrique e Juliano Marilia Mendonca Gusttavo Lima Jorge e Mateus musicas completas',
    gradient: 'from-amber-500/35 via-orange-600/20 to-pink-600/25',
  },
  {
    id: 'pl-brasil-lendas',
    title: 'Brasil Todos os Tempos (MPB, Rap, Funk & Rock)',
    subtitle: "Racionais MC's, Legião Urbana, Alok, Anitta, Tim Maia, Exaltasamba",
    emoji: '🇧🇷',
    era: 'Todas as Gerações BR',
    searchQuery: 'melhores musicas brasileiras pop rock rap pagode Alok Legiao Urbana Racionais',
    gradient: 'from-emerald-500/30 via-yellow-500/20 to-cyan-500/25',
  },
  {
    id: 'pl-golden-eras',
    title: 'Lendas Mundiais — Anos 60, 70, 80 & 90',
    subtitle: 'Queen, Michael Jackson, Nirvana, Elton John, Bee Gees, Tears For Fears',
    emoji: '🕰️',
    era: 'Anos 60 / 70 / 80 / 90',
    searchQuery: 'Queen Michael Jackson Nirvana 80s 90s greatest hits official audio',
    gradient: 'from-purple-600/35 via-fuchsia-500/20 to-amber-500/25',
  },
  {
    id: 'pl-2000-2026',
    title: 'Hits Globais — Anos 2000 até Hoje',
    subtitle: 'The Weeknd, Bruno Mars, Eminem, Coldplay, Linkin Park, Billie Eilish',
    emoji: '🌍',
    era: 'Anos 2000 – 2026',
    searchQuery: 'The Weeknd Bruno Mars Coldplay Eminem Linkin Park official audio hits',
    gradient: 'from-cyan-500/35 via-blue-600/25 to-pink-500/25',
  },
  {
    id: 'pl-phonk-drift',
    title: 'Phonk & Drift Mundial (Full Tracks)',
    subtitle: 'Brazilian Phonk, Kordhell, DVRST, Ghostface Playa & Cosmic Bass',
    emoji: '😈',
    era: 'Geração Phonk',
    searchQuery: 'brazilian phonk Kordhell DVRST drift phonk full track',
    gradient: 'from-pink-600/40 via-purple-700/25 to-red-600/25',
  },
  {
    id: 'pl-space-et',
    title: 'Galáxia, Espaço & Frequências E.T.',
    subtitle: 'NASA Voyager Golden Record, Ondas de Saturno, Sinais Alienígenas & Synth Cósmico',
    emoji: '🛸',
    era: 'Espaço & Outras Galáxias',
    searchQuery: 'NASA space sounds voyager cosmic ambient alien synthwave music',
    gradient: 'from-indigo-600/45 via-cyan-500/30 to-emerald-500/25',
    includeArchiveSpace: true,
  },
];

async function fetchAudiusDirect(term: string): Promise<Track[]> {
  try {
    const url = term.trim()
      ? `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(term)}&limit=20&app_name=LENKYX`
      : `https://discoveryprovider.audius.co/v1/tracks/trending?limit=20&app_name=LENKYX`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    const list: Record<string, unknown>[] = Array.isArray(data?.data) ? data.data : [];
    return list
      .filter((item) => item?.id && Number(item.duration || 0) >= 60)
      .slice(0, 20)
      .map((item, idx) => {
        const user = (item.user || {}) as Record<string, string>;
        const art = (item.artwork || {}) as Record<string, string>;
        const id = String(item.id);
        return {
          id: `audius-${id}`,
          number: idx + 1,
          title: String(item.title || 'Faixa Global').trim(),
          emoji: '🎧',
          artist: String(user.name || user.handle || 'Artista Global').trim(),
          album: String(item.genre || 'Global'),
          bpm: 128,
          key: 'Fm',
          coverUrl: art['480x480'] || art['150x150'] || '/covers/album-official.jpg',
          audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${encodeURIComponent(id)}/stream?app_name=LENKYX`,
          durationSec: Math.round(Number(item.duration || 180)),
          source: 'world_full',
          sourceLabel: 'MP3 Completo (Audius)',
          externalUrl: `https://audius.co${String(item.permalink || '')}`,
          isDemoAudio: false,
          hasCustomCover: true,
          plays: Number(item.play_count) || 0,
          likes: Number(item.favorite_count) || 0,
          favorite: false,
          releaseBatch: 0,
          status: { suno: true, cover: true, app: true, youtube: false, distrokid: false },
          sunoPrompt: '',
          lyrics: '',
          createdAt: new Date().toISOString(),
        };
      });
  } catch {
    return [];
  }
}

async function fetchWorldEndpoint<T>(path: string): Promise<T | null> {
  // Always try local server first (works both on Express Web AND inside Android APK via LocalAssetServer!)
  const urls = isAndroidApk()
    ? [path, `${CLOUD_API_BASE}${path}`]
    : [path, `${CLOUD_API_BASE}${path}`];

  for (const url of urls) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (r.ok) {
        return (await r.json()) as T;
      }
    } catch {
      // try next endpoint
    }
  }
  return null;
}

export async function getWorldDirectory(forceRefresh = false): Promise<{
  artists: WorldArtistDirectoryItem[];
  playlists: WorldCuratedPlaylist[];
  newReleases: Track[];
  updatedAt?: string;
}> {
  const qs = forceRefresh ? '?refresh=1' : '';
  const data = await fetchWorldEndpoint<{
    artists?: WorldArtistDirectoryItem[];
    playlists?: WorldCuratedPlaylist[];
    newReleases?: Track[];
    updatedAt?: string;
  }>(`/api/world-directory${qs}`);
  return {
    artists: data?.artists || [],
    playlists: data?.playlists?.length ? data.playlists : FALLBACK_CURATED_PLAYLISTS,
    newReleases: data?.newReleases || [],
    updatedAt: data?.updatedAt,
  };
}

export async function getWorldNewReleases(forceRefresh = false): Promise<{
  tracks: Track[];
  updatedAt?: string;
}> {
  const qs = forceRefresh ? '?refresh=1' : '';
  const data = await fetchWorldEndpoint<{ tracks?: Track[]; updatedAt?: string }>(
    `/api/world-new-releases${qs}`
  );
  return {
    tracks: data?.tracks || [],
    updatedAt: data?.updatedAt,
  };
}

export async function getWorldTrending(): Promise<WorldSearchPayload> {
  const data = await fetchWorldEndpoint<WorldSearchPayload>('/api/world-trending');
  if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
    return {
      ...data,
      playlists: data.playlists?.length ? data.playlists : FALLBACK_CURATED_PLAYLISTS,
    };
  }
  const audius = await fetchAudiusDirect('');
  return {
    query: '',
    aiInsight: {
      title: 'IA Musical MORRO GOLD',
      summary: 'Músicas completas gratuitas prontas para tocar em sequência.',
      tags: ['100% Completo', 'Grátis'],
    },
    artistProfile: null,
    tracks: audius,
    playlists: FALLBACK_CURATED_PLAYLISTS,
  };
}

export async function searchWorldMusic(
  query: string,
  options?: { includeArchiveSpace?: boolean }
): Promise<WorldSearchPayload> {
  const q = query.trim();
  if (!q) return getWorldTrending();

  const spaceParam = options?.includeArchiveSpace ? '&space=1' : '';
  const data = await fetchWorldEndpoint<WorldSearchPayload>(
    `/api/world-search?q=${encodeURIComponent(q)}${spaceParam}`
  );
  if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
    return {
      ...data,
      playlists: data.playlists?.length ? data.playlists : FALLBACK_CURATED_PLAYLISTS,
    };
  }

  const audius = await fetchAudiusDirect(q);
  return {
    query: q,
    aiInsight: {
      title: `Busca IA para "${q}"`,
      summary: `${audius.length} faixas completas encontradas.`,
      tags: ['Versões Completas'],
    },
    artistProfile: null,
    tracks: audius,
    playlists: FALLBACK_CURATED_PLAYLISTS,
  };
}

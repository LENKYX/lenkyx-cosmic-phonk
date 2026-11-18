import {
  LiveTvCategory,
  LiveTvChannel,
  MmaScoreItem,
  MovieItem,
  SeriesEpisodeItem,
  SeriesSeasonInfo,
  SoccerScoreItem,
  SportStreamItem,
} from '../types';
import { isAndroidApk } from './androidBridge';

const CLOUD_API_BASE = 'https://lenkyx-cosmic-phonk.onrender.com';

export interface MovieCategory {
  id: string;
  title: string;
  emoji: string;
  query: string;
  isTrailerCategory?: boolean;
  isArchiveOnly?: boolean;
  mediaType?: 'movie' | 'series' | 'anime' | 'trailer';
  movies: MovieItem[];
}

export interface SeriesSeasonsPayload {
  seriesTitle: string;
  season: number;
  showPoster?: string;
  showSummary?: string;
  seasons: SeriesSeasonInfo[];
  episodes: SeriesEpisodeItem[];
}

export interface SportsCategory {
  id: string;
  title: string;
  emoji: string;
  sport: 'soccer' | 'mma';
  items: SportStreamItem[];
}

export interface SportsDirectoryPayload {
  updatedAt: string;
  scoreboard: {
    soccer: SoccerScoreItem[];
    mma: MmaScoreItem[];
  };
  categories: SportsCategory[];
}

function getApiTargets(): string[] {
  return isAndroidApk() ? ['', CLOUD_API_BASE] : ['', CLOUD_API_BASE];
}

async function fetchJsonWithFallback<T>(path: string, timeoutMs = 20000): Promise<T | null> {
  for (const base of getApiTargets()) {
    try {
      const r = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
      if (r.ok) return (await r.json()) as T;
    } catch {
      // try next target
    }
  }
  return null;
}

export async function fetchMoviesDirectory(forceRefresh = false): Promise<MovieCategory[]> {
  const qs = forceRefresh ? '?refresh=1' : '';
  const data = await fetchJsonWithFallback<{ categories?: MovieCategory[] }>(
    `/api/movies-directory${qs}`,
    24000
  );
  return data?.categories || [];
}

export async function searchMoviesCatalog(
  query: string,
  isTrailer = false,
  mediaType: 'movie' | 'series' | 'anime' | 'trailer' = 'movie'
): Promise<MovieItem[]> {
  const params = new URLSearchParams({
    q: query,
    trailer: isTrailer ? '1' : '0',
    type: mediaType,
  });
  const data = await fetchJsonWithFallback<{ movies?: MovieItem[] }>(`/api/movies-search?${params.toString()}`);
  return data?.movies || [];
}

export async function fetchLiveTvDirectory(forceRefresh = false): Promise<{
  totalAvailable: number;
  categories: LiveTvCategory[];
}> {
  const qs = forceRefresh ? '?refresh=1' : '';
  const data = await fetchJsonWithFallback<{ totalAvailable?: number; categories?: LiveTvCategory[] }>(
    `/api/tv-directory${qs}`,
    25000
  );
  return {
    totalAvailable: data?.totalAvailable || 0,
    categories: data?.categories || [],
  };
}

export async function searchLiveTvCatalog(
  query: string,
  country = 'ALL'
): Promise<{ totalAvailable: number; channels: LiveTvChannel[] }> {
  const params = new URLSearchParams({ q: query, country });
  const data = await fetchJsonWithFallback<{ totalAvailable?: number; channels?: LiveTvChannel[] }>(
    `/api/tv-search?${params.toString()}`
  );
  return {
    totalAvailable: data?.totalAvailable || 0,
    channels: data?.channels || [],
  };
}

export async function fetchSeriesSeasonsAndEpisodes(params: {
  title: string;
  season?: number;
  playlistId?: string;
  mediaType?: string;
}): Promise<SeriesSeasonsPayload> {
  const qs = new URLSearchParams({
    title: params.title,
    season: String(params.season || 1),
    playlistId: params.playlistId || '',
    mediaType: params.mediaType || 'series',
  });
  const data = await fetchJsonWithFallback<SeriesSeasonsPayload>(`/api/series-episodes?${qs.toString()}`, 18000);
  return (
    data || {
      seriesTitle: params.title,
      season: params.season || 1,
      seasons: [{ number: 1, name: 'Temporada 1', episodeCount: 0 }],
      episodes: [],
    }
  );
}

export async function fetchSportsDirectory(forceRefresh = false): Promise<SportsDirectoryPayload> {
  const qs = forceRefresh ? '?refresh=1' : '';
  const data = await fetchJsonWithFallback<SportsDirectoryPayload>(`/api/sports-directory${qs}`, 20000);
  return (
    data || {
      updatedAt: new Date().toISOString(),
      scoreboard: { soccer: [], mma: [] },
      categories: [],
    }
  );
}

export async function searchSportsCatalog(
  query: string,
  sport: 'all' | 'soccer' | 'mma' = 'all',
  liveOnly = false
): Promise<SportStreamItem[]> {
  const qs = new URLSearchParams({
    q: query,
    sport,
    live: liveOnly ? '1' : '0',
  });
  const data = await fetchJsonWithFallback<{ items?: SportStreamItem[] }>(`/api/sports-search?${qs.toString()}`, 16000);
  return data?.items || [];
}

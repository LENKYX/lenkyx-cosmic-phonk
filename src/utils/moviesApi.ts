import { LiveTvCategory, LiveTvChannel, MovieItem } from '../types';
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

export async function fetchLiveTvDirectory(): Promise<{
  totalAvailable: number;
  categories: LiveTvCategory[];
}> {
  const data = await fetchJsonWithFallback<{ totalAvailable?: number; categories?: LiveTvCategory[] }>(
    '/api/tv-directory'
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

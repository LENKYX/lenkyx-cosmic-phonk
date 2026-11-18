import { Track } from '../types';

export interface RankedArtistEntry {
  rank: number;
  name: string;
  count: number;
  photoUrl?: string;
  genre?: string;
}

export interface RankedVideoEntry {
  rank: number;
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  youtubeVideoId?: string;
  audioUrl?: string;
  durationSec?: number;
  count: number;
}

export interface RankedMovieEntry {
  rank: number;
  id: string;
  title: string;
  subtitle?: string;
  posterUrl?: string;
  youtubeVideoId?: string;
  youtubePlaylistId?: string;
  mediaType?: 'movie' | 'series' | 'anime' | 'trailer';
  count: number;
}

export interface Top5RankingsPayload {
  topArtists: RankedArtistEntry[];
  topVideos: RankedVideoEntry[];
  topMovies: RankedMovieEntry[];
}

export interface SunoAiArtist {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  genre: string;
  playsCount: number;
  profileUrl: string;
  tracks: Track[];
}

export interface SunoAiHubPayload {
  updatedAt: string;
  artists: SunoAiArtist[];
  tracks: Track[];
}

export async function fetchTop5Rankings(): Promise<Top5RankingsPayload> {
  try {
    const r = await fetch('/api/rankings');
    if (r.ok) return await r.json();
  } catch {
    // ignore
  }
  return { topArtists: [], topVideos: [], topMovies: [] };
}

export async function recordRankingHit(payload: Record<string, unknown>): Promise<Top5RankingsPayload | null> {
  try {
    const r = await fetch('/api/rankings/hit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) return await r.json();
  } catch {
    // ignore
  }
  return null;
}

export async function fetchSunoAiHub(refresh = false): Promise<SunoAiHubPayload> {
  try {
    const r = await fetch(`/api/suno-artists${refresh ? '?refresh=1' : ''}`);
    if (r.ok) return await r.json();
  } catch {
    // ignore
  }
  return { updatedAt: new Date().toISOString(), artists: [], tracks: [] };
}

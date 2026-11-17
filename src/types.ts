export interface TrackStatus {
  suno: boolean;
  cover: boolean;
  app: boolean;
  youtube: boolean;
  distrokid: boolean;
}

export type TrackSource = 'lenkyx' | 'user_local' | 'world_full' | 'world_preview';

export interface Track {
  id: string;
  number: number;
  title: string;
  emoji: string;
  artist: string;
  album: string;
  bpm: number;
  key: string;
  coverUrl: string;
  audioUrl: string;
  audioUrlV2?: string;
  v2Label?: string;
  sunoId?: string;
  sunoIdV2?: string;
  sunoUrl?: string;
  sunoUrlV2?: string;
  sunoPrivate?: boolean;
  sunoPrivateV2?: boolean;
  durationSec?: number;
  isDemoAudio?: boolean;
  hasCustomCover?: boolean;
  source?: TrackSource;
  sourceLabel?: string;
  genre?: string;
  youtubeVideoId?: string;
  externalUrl?: string;
  plays: number;
  likes: number;
  favorite: boolean;
  releaseBatch: number;
  status: TrackStatus;
  sunoPrompt: string;
  lyrics: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  deviceUnlockEnabled?: boolean;
  avatarColor: string;
  acceptedTermsAt?: string;
  createdAt: string;
}

export interface UserPlaylist {
  id: string;
  name: string;
  description: string;
  emoji: string;
  accentColor: string;
  trackIds: string[];
  /** Snapshots of external/world tracks so playlists remember songs searched online */
  savedExternalTracks?: Record<string, Track>;
  createdAt: string;
}

export interface AppSettings {
  artistName: string;
  brandSubtitle: string;
  tagline: string;
  pixKey: string;
  pixKeyConfigured: boolean;
  pixName: string;
  pixCity: string;
  pixMessage: string;
  publicUrl: string;
  apkDownloadUrl?: string;
  youtubeUrl: string;
  sunoHandle?: string;
  sunoPlaylistId?: string;
  sunoProfileUrl?: string;
  dailyGoal: number;
  totalGoal: number;
}

export type AudioVersion = 'v1' | 'v2';
export type TabId = 'catalog' | 'explore' | 'movies' | 'playlists' | 'video' | 'studio';
export type AppMode = 'creator' | 'fan';

export interface MovieItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  year?: string;
  durationLabel: string;
  posterUrl: string;
  youtubeVideoId?: string;
  youtubePlaylistId?: string;
  videoStreamUrl?: string;
  externalUrl?: string;
  isTrailer?: boolean;
  sourceLabel: string;
  qualityLabel?: string;
  isDubbed?: boolean;
  mediaType?: 'movie' | 'series' | 'anime' | 'trailer';
}

export interface LiveTvChannel {
  id: string;
  name: string;
  country: string;
  network?: string;
  categories: string[];
  quality: string;
  logo: string;
  streamUrl: string;
  youtubeLiveId?: string;
}

export interface LiveTvCategory {
  id: string;
  title: string;
  emoji: string;
  channels: LiveTvChannel[];
}

export interface WorldArtistDirectoryItem {
  name: string;
  genre: string;
  era: string;
  query: string;
  photoUrl: string;
  bio?: string;
}

export interface WorldCuratedPlaylist {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  era: string;
  searchQuery: string;
  gradient: string;
  includeArchiveSpace?: boolean;
}

export interface WorldArtistProfile {
  name: string;
  photoUrl: string;
  bio?: string;
  genre?: string;
  era?: string;
  wikiUrl?: string;
}

export interface WorldAiInsight {
  title: string;
  summary: string;
  tags: string[];
}

export interface WorldSearchPayload {
  query: string;
  aiInsight: WorldAiInsight | null;
  artistProfile: WorldArtistProfile | null;
  tracks: Track[];
  playlists: WorldCuratedPlaylist[];
}

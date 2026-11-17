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
  avatarColor: string;
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
export type TabId = 'catalog' | 'explore' | 'dj' | 'playlists' | 'video' | 'studio';
export type AppMode = 'creator' | 'fan';

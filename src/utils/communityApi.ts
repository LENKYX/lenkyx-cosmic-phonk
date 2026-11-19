import { isAndroidApk } from './androidBridge';

const CLOUD_API_BASE = 'https://lenkyx-cosmic-phonk.onrender.com';

export interface ChatMessageItem {
  id: string;
  room_id: string;
  author_name: string;
  author_color: string;
  message: string;
  created_at: string;
}

export interface CommentItem {
  id: string;
  target_id: string;
  parent_id?: string;
  author_name: string;
  author_avatar?: string;
  author_color: string;
  text: string;
  likes: number;
  liked_by_me?: boolean;
  published_text?: string;
  is_creator?: boolean;
  reply_count?: number;
  source?: 'lenkyx' | 'youtube' | string;
  replies?: CommentItem[];
  created_at: string;
}

export interface CommunityShortItem {
  id: string;
  title: string;
  creator_name: string;
  creator_color: string;
  description: string;
  media_type: 'cosmic_reel' | 'video' | 'youtube' | string;
  video_url: string;
  youtube_id: string;
  poster_url: string;
  audio_title: string;
  duration_text?: string;
  likes: number;
  liked_by_me?: boolean;
  created_at: string;
}

export interface CreatorProfileData {
  channelId: string;
  channelName: string;
  handle: string;
  avatarUrl: string;
  bannerUrl: string;
  subscriberText: string;
  description: string;
  shorts: CommunityShortItem[];
  videos: CommunityShortItem[];
}

export interface LiveRoomItem {
  id: string;
  host_name: string;
  host_color: string;
  title: string;
  theme: string;
  poster_url: string;
  is_live: boolean;
  likes: number;
  viewers: number;
  started_at: string;
  updated_at: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = isAndroidApk() ? CLOUD_API_BASE : '';
  const urls = base ? [`${base}${path}`, path] : [path, `${CLOUD_API_BASE}${path}`];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) return (await r.json()) as T;
    } catch {
      // try next
    }
  }
  return null;
}

export async function fetchChatMessages(roomId = 'global'): Promise<ChatMessageItem[]> {
  const res = await req<{ messages?: ChatMessageItem[] }>(
    `/api/community/chat?room=${encodeURIComponent(roomId)}`
  );
  return res?.messages || [];
}

export async function sendChatMessage(payload: {
  roomId?: string;
  authorName: string;
  authorColor: string;
  message: string;
}): Promise<ChatMessageItem | null> {
  return req<ChatMessageItem>('/api/community/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCommentsFull(
  targetId: string,
  userId = '',
  sort: 'top' | 'newest' = 'top',
  youtubeId = ''
): Promise<{ comments: CommentItem[]; totalCount: number }> {
  const params = new URLSearchParams();
  params.set('targetId', targetId);
  if (userId) params.set('userId', userId);
  if (sort) params.set('sort', sort);
  if (youtubeId) params.set('youtubeId', youtubeId);
  const res = await req<{ comments?: CommentItem[]; totalCount?: number }>(
    `/api/community/comments?${params.toString()}`
  );
  const comments = res?.comments || [];
  return { comments, totalCount: res?.totalCount ?? comments.length };
}

export async function fetchComments(targetId: string): Promise<CommentItem[]> {
  const res = await fetchCommentsFull(targetId);
  return res.comments;
}

export async function postCommentItem(payload: {
  targetId: string;
  parentId?: string;
  authorName: string;
  authorColor: string;
  text: string;
}): Promise<CommentItem | null> {
  return req<CommentItem>('/api/community/comments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function likeCommentItem(
  commentId: string,
  userId = '',
  baseLikes = 0
): Promise<{ id: string; likes: number; liked: boolean } | null> {
  return req<{ id: string; likes: number; liked: boolean }>(
    `/api/community/comments/${encodeURIComponent(commentId)}/like`,
    {
      method: 'POST',
      body: JSON.stringify({ userId, baseLikes }),
    }
  );
}

export async function fetchCommunityShorts(userId = ''): Promise<CommunityShortItem[]> {
  const res = await req<{ shorts?: CommunityShortItem[] }>(
    `/api/community/shorts${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`
  );
  return res?.shorts || [];
}

export async function fetchWorldShorts(
  category = 'all',
  q = '',
  excludeIds: string[] = [],
  forceRefresh = false,
  userId = '',
  country = 'BR'
): Promise<CommunityShortItem[]> {
  const params = new URLSearchParams();
  params.set('category', category);
  params.set('country', country || 'BR');
  if (q) params.set('q', q);
  if (excludeIds.length > 0) params.set('exclude', excludeIds.slice(-250).join(','));
  if (forceRefresh) params.set('refresh', '1');
  if (userId) params.set('userId', userId);
  const res = await req<{ shorts?: CommunityShortItem[] }>(
    `/api/community/world-shorts?${params.toString()}`
  );
  return res?.shorts || [];
}

export async function fetchLikedShortIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const res = await req<{ likedIds?: string[] }>(
    `/api/community/shorts/liked?userId=${encodeURIComponent(userId)}`
  );
  return res?.likedIds || [];
}

export async function fetchCreatorProfile(payload: {
  creatorName: string;
  youtubeId?: string;
  channelId?: string;
  userId?: string;
}): Promise<CreatorProfileData | null> {
  const params = new URLSearchParams();
  params.set('creatorName', payload.creatorName || 'Criador');
  if (payload.youtubeId) params.set('youtubeId', payload.youtubeId);
  if (payload.channelId) params.set('channelId', payload.channelId);
  if (payload.userId) params.set('userId', payload.userId);
  return req<CreatorProfileData>(`/api/community/creator-profile?${params.toString()}`);
}

export interface TvHandoffSession {
  code: string;
  title: string;
  artist: string;
  mode: string;
  youtubeVideoId?: string;
  audioUrl?: string;
  streamUrl?: string;
  coverUrl?: string;
  trackId?: string;
  createdAt: number;
  claimedByTv: boolean;
}

export async function createTvHandoff(payload: {
  title: string;
  artist?: string;
  mode?: string;
  youtubeVideoId?: string;
  audioUrl?: string;
  streamUrl?: string;
  coverUrl?: string;
  trackId?: string;
}): Promise<TvHandoffSession | null> {
  return req<TvHandoffSession>('/api/tv-handoff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTvHandoff(
  code: string,
  claim = false
): Promise<TvHandoffSession | null> {
  return req<TvHandoffSession>(
    `/api/tv-handoff/${encodeURIComponent(code.trim().toUpperCase())}${claim ? '?claim=1' : ''}`
  );
}

export async function publishCommunityShort(payload: {
  title: string;
  creatorName: string;
  creatorColor: string;
  description?: string;
  mediaType?: string;
  videoUrl?: string;
  youtubeId?: string;
  posterUrl?: string;
  audioTitle?: string;
  durationSec?: number;
}): Promise<CommunityShortItem | null> {
  return req<CommunityShortItem>('/api/community/shorts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function likeCommunityShortItem(
  shortId: string,
  userId = '',
  initialLikes = 0
): Promise<{ id: string; likes: number; liked: boolean } | null> {
  return req<{ id: string; likes: number; liked: boolean }>(
    `/api/community/shorts/${encodeURIComponent(shortId)}/like`,
    {
      method: 'POST',
      body: JSON.stringify({ userId, initialLikes }),
    }
  );
}

export async function fetchActiveLives(): Promise<LiveRoomItem[]> {
  const res = await req<{ lives?: LiveRoomItem[] }>('/api/community/lives');
  return res?.lives || [];
}

export async function updateLiveRoom(payload: {
  id?: string;
  hostName?: string;
  hostColor?: string;
  title?: string;
  theme?: string;
  posterUrl?: string;
  isLive?: boolean;
  likeDelta?: number;
}): Promise<LiveRoomItem | null> {
  return req<LiveRoomItem>('/api/community/lives', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getClientSubscriberId(userId?: string): string {
  if (userId) return `u-${userId}`;
  try {
    const existing = localStorage.getItem('lenkyx_fan_sub_id');
    if (existing) return existing;
    const created = `fan-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('lenkyx_fan_sub_id', created);
    return created;
  } catch {
    return 'fan-guest';
  }
}

export function normalizeChannelKey(nameOrId: string): string {
  return (
    String(nameOrId || 'lenkyx-oficial')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .slice(0, 80) || 'lenkyx-oficial'
  );
}

export async function fetchChannelSubscriptions(subscriberId: string): Promise<{
  counts: Record<string, number>;
  subscribed: string[];
}> {
  const res = await req<{ counts?: Record<string, number>; subscribed?: string[] }>(
    `/api/community/channels?subscriberId=${encodeURIComponent(subscriberId)}`
  );
  return { counts: res?.counts || {}, subscribed: res?.subscribed || [] };
}

export async function toggleChannelSubscribe(payload: {
  channelId: string;
  channelName: string;
  subscriberId: string;
}): Promise<{ channelId: string; channelName: string; subscribed: boolean; count: number } | null> {
  return req<{ channelId: string; channelName: string; subscribed: boolean; count: number }>(
    '/api/community/subscribe',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

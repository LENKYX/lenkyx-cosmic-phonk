import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Send,
  Heart,
  X,
  Sparkles,
  CornerDownRight,
  Loader2,
  Radio,
  Users,
  Edit3,
  Check,
  Flame,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  ChatMessageItem,
  CommentItem,
  fetchChatMessages,
  fetchCommentsFull,
  getClientSubscriberId,
  getGuestNickname,
  likeCommentItem,
  postCommentItem,
  sendChatMessage,
  sendChatReaction,
  setGuestNickname,
  subscribeChatStream,
  subscribeCommentStream,
} from '../utils/communityApi';

export const LIVE_CHAT_ROOMS = [
  { id: 'global', label: '🔥 Geral do Morro', desc: 'Resenha ao vivo da comunidade' },
  { id: 'baile-funk', label: '👑 Baile & Funk', desc: 'Fluxos, MCs & pancadões 2026' },
  { id: 'rap-quebrada', label: '🎤 Rap & Trap', desc: 'Voz da favela e lançamentos' },
  { id: 'pagode', label: '🥁 Pagode & Churrasco', desc: 'Roda de samba da quebrada' },
  { id: 'loja', label: '🛍️ Loja dos Cria', desc: 'Kits, perfumes, narguile & Toguro' },
  { id: 'filmes', label: '🍿 Cinema & TV', desc: 'Comentando filmes e séries ao vivo' },
  { id: 'bailes', label: '💃 Bailes & Rolês', desc: 'Agenda, cortes e barbearias' },
];

interface FloatingHeart {
  id: string;
  emoji: string;
  offsetPx: number;
  authorName?: string;
}

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  roomId?: string;
  roomTitle?: string;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const INSTA_REACTIONS = ['❤️', '🔥', '👑', '👏', '💎', '🚀'];

export const CommunityChatModal: React.FC<ChatModalProps> = ({
  open,
  onClose,
  user,
  roomId = 'global',
  roomTitle,
}) => {
  const [activeRoom, setActiveRoom] = useState(roomId || 'global');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [guestName, setGuestName] = useState(() => getGuestNickname() || 'Cria do Morro');
  const [editingNick, setEditingNick] = useState(false);
  const [replyingToAuthor, setReplyingToAuthor] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && roomId) {
      setActiveRoom(roomId);
    }
  }, [open, roomId]);

  const spawnFloatingEmoji = (emoji: string, authorName?: string) => {
    const fid = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const offsetPx = Math.floor(Math.random() * 44) - 22;
    setFloatingHearts((prev) => [...prev.slice(-18), { id: fid, emoji, offsetPx, authorName }]);
    window.setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((x) => x.id !== fid));
    }, 2200);
  };

  useEffect(() => {
    if (!open) return;
    let alive = true;

    const unsub = subscribeChatStream(activeRoom, {
      onInit: (data) => {
        if (!alive) return;
        setMessages(data.messages || []);
        setOnlineCount(Math.max(1, data.onlineCount || 1));
      },
      onMessage: (msg) => {
        if (!alive) return;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      },
      onReaction: (rx) => {
        if (!alive) return;
        spawnFloatingEmoji(rx.emoji, rx.authorName);
      },
      onPresence: (p) => {
        if (!alive) return;
        setOnlineCount(Math.max(1, p.onlineCount || 1));
      },
    });

    // Initial HTTP load + slow fallback sync (in case SSE proxy buffers)
    const loadFallback = () => {
      void fetchChatMessages(activeRoom).then((list) => {
        if (!alive) return;
        setMessages((prev) => {
          if (list.length === 0) return prev;
          const seen = new Set(prev.map((x) => x.id));
          const merged = [...prev];
          for (const item of list) {
            if (!seen.has(item.id)) merged.push(item);
          }
          return merged.length > 0 ? merged : list;
        });
      });
    };
    loadFallback();
    const fallbackTimer = window.setInterval(loadFallback, 8000);

    return () => {
      alive = false;
      unsub();
      window.clearInterval(fallbackTimer);
    };
  }, [open, activeRoom]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, open]);

  const currentRoomMeta = useMemo(
    () => LIVE_CHAT_ROOMS.find((r) => r.id === activeRoom) || LIVE_CHAT_ROOMS[0],
    [activeRoom]
  );

  if (!open) return null;

  const displayAuthor = (user?.name || guestName || 'Cria do Morro').trim().slice(0, 32);

  const handleSaveNick = () => {
    const clean = guestName.trim() || 'Cria do Morro';
    setGuestName(clean);
    setGuestNickname(clean);
    setEditingNick(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = text.trim();
    if (!raw || sending) return;
    const finalMsg = replyingToAuthor && !raw.startsWith('@') ? `@${replyingToAuthor} ${raw}` : raw;
    setSending(true);
    try {
      const created = await sendChatMessage({
        roomId: activeRoom,
        authorName: displayAuthor,
        authorColor: user?.avatarColor || 'from-amber-400 via-pink-500 to-cyan-400',
        message: finalMsg,
      });
      if (created) {
        setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
        setText('');
        setReplyingToAuthor(null);
      }
    } finally {
      setSending(false);
    }
  };

  const handleTapReaction = async (emoji: string) => {
    spawnFloatingEmoji(emoji, displayAuthor);
    await sendChatReaction({
      roomId: activeRoom,
      emoji,
      authorName: displayAuthor,
    });
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9996] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl h-[88vh] sm:h-[86vh] max-h-[720px] rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#130824] via-[#090414] to-[#05020a] border border-amber-400/40 flex flex-col overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.28)]"
      >
        {/* INSTAGRAM LIVE HEADER */}
        <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#240a33]/90 via-[#160a24]/90 to-[#081b28]/90 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500 shrink-0">
                <div className="w-full h-full rounded-full bg-[#0d051a] flex items-center justify-center">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-rose-600 to-pink-600 text-[9px] font-black uppercase tracking-wider text-white shadow">
                    AO VIVO
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/50 border border-white/15 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {onlineCount} na sala
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white truncate">
                    {roomTitle || currentRoomMeta.label}
                  </span>
                </div>
                <p className="text-[10px] text-amber-200/80 truncate mt-0.5">
                  {currentRoomMeta.desc} · Tempo real instantâneo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
              title="Fechar Chat Ao Vivo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* LIVE ROOM SWITCHER PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {LIVE_CHAT_ROOMS.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveRoom(room.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap transition ${
                  activeRoom === room.id
                    ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 text-black shadow'
                    : 'bg-white/[0.08] hover:bg-white/15 text-purple-100 border border-white/10'
                }`}
              >
                {room.label}
              </button>
            ))}
          </div>
        </div>

        {/* CHAT FEED + FLOATING INSTAGRAM HEARTS */}
        <div className="relative flex-1 overflow-y-auto p-3.5 space-y-2">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-purple-200/75 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-amber-300" />
              <p>Sala aberta! Mande o primeiro salve ou solte um 🔥 ao vivo.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                onClick={() => setReplyingToAuthor(m.author_name)}
                className="group flex items-start gap-2.5 cursor-pointer rounded-2xl px-2 py-1.5 hover:bg-white/[0.05] transition"
                title="Toque para responder @"
              >
                <span
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${m.author_color} text-[11px] font-black text-white flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-white/20`}
                >
                  {m.author_name.slice(0, 1).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-amber-300 truncate">{m.author_name}</span>
                    <span className="text-[9px] text-purple-200/50 shrink-0">{fmtTime(m.created_at)}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-cyan-300 transition">
                      ↩ Responder
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-white/95 break-words leading-snug">{m.message}</p>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />

          {/* FLOATING INSTAGRAM LIVE HEARTS LAYER */}
          <div className="pointer-events-none fixed sm:absolute bottom-28 right-5 w-16 h-56 overflow-visible z-30">
            {floatingHearts.map((fh) => (
              <div
                key={fh.id}
                style={{ left: `${24 + fh.offsetPx}px` }}
                className="absolute bottom-0 insta-float-heart flex flex-col items-center"
              >
                <span className="text-2xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]">{fh.emoji}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INSTAGRAM LIVE BOTTOM REACTION BAR + COMPOSER */}
        <div className="p-3 border-t border-white/10 bg-[#070212]/95 space-y-2">
          {/* Nickname bar & @reply badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
            {!user && (
              <div className="flex items-center gap-1.5">
                {editingNick ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNick()}
                      maxLength={28}
                      className="px-2 py-0.5 rounded-full bg-white/10 border border-amber-400/50 text-[11px] text-white focus:outline-none w-32"
                      placeholder="Seu vulgo/nome"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNick}
                      className="p-1 rounded-full bg-emerald-500 text-black font-black"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingNick(true)}
                    className="px-2.5 py-0.5 rounded-full bg-white/[0.07] hover:bg-white/15 border border-white/10 text-amber-200 font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-2.5 h-2.5" /> Falando como: <strong>{displayAuthor}</strong>
                  </button>
                )}
              </div>
            )}

            {replyingToAuthor && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-bold">
                <span>Respondendo @{replyingToAuthor}</span>
                <button type="button" onClick={() => setReplyingToAuthor(null)}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Live Reactions Bar (Instagram Live style) */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-black text-rose-300 flex items-center gap-1 shrink-0">
              <Flame className="w-3 h-3" /> Ao vivo:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {INSTA_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => void handleTapReaction(emoji)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-rose-500/25 border border-white/10 text-sm transition active:scale-125 shrink-0"
                  title={`Enviar reação ${emoji} ao vivo`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Comentar ao vivo em ${currentRoomMeta.label}...`}
              className="flex-1 px-3.5 py-2.5 rounded-full bg-white/[0.09] border border-white/15 text-xs text-white placeholder-purple-200/60 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 text-black text-xs font-black flex items-center gap-1 disabled:opacity-40 shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> Enviar
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface TargetCommentsModalProps {
  open: boolean;
  onClose: () => void;
  targetId: string;
  targetTitle: string;
  youtubeId?: string;
  user: UserProfile | null;
}

function fmtRelativeCommentTime(iso?: string, publishedText?: string): string {
  if (publishedText) return publishedText;
  if (!iso) return 'agora';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `há ${days} d`;
}

function fmtLikesCompact(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const QUICK_REACTIONS = ['🔥', '❤️', '😂', '👏', '👑', '🚀'];

export const TargetCommentsModal: React.FC<TargetCommentsModalProps> = ({
  open,
  onClose,
  targetId,
  targetTitle,
  youtubeId = '',
  user,
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'top' | 'newest'>('top');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [likedLocalIds, setLikedLocalIds] = useState<Set<string>>(new Set());
  const [guestName, setGuestName] = useState(() => getGuestNickname() || 'Cria MORRO GOLD');
  const [editingNick, setEditingNick] = useState(false);
  const viewerId = getClientSubscriberId(user?.id);

  useEffect(() => {
    if (!open || !targetId) return;
    let alive = true;
    setLoading(true);
    void fetchCommentsFull(targetId, viewerId, sort, youtubeId)
      .then((res) => {
        if (!alive) return;
        setComments(res.comments);
        setTotalCount(res.totalCount);
        const initialLiked = new Set<string>();
        res.comments.forEach((c) => {
          if (c.liked_by_me) initialLiked.add(c.id);
          c.replies?.forEach((r) => {
            if (r.liked_by_me) initialLiked.add(r.id);
          });
        });
        setLikedLocalIds(initialLiked);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    // Live SSE comment updates in real time!
    const unsub = subscribeCommentStream(targetId, {
      onComment: (incoming) => {
        if (!alive) return;
        if (incoming.parent_id) {
          setComments((prev) =>
            prev.map((c) => {
              if (c.id !== incoming.parent_id) return c;
              const existing = c.replies || [];
              if (existing.some((r) => r.id === incoming.id)) return c;
              return { ...c, replies: [...existing, incoming] };
            })
          );
        } else {
          setComments((prev) => {
            if (prev.some((c) => c.id === incoming.id)) return prev;
            setTotalCount((n) => n + 1);
            return [incoming, ...prev];
          });
        }
      },
      onLike: (upd) => {
        if (!alive) return;
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === upd.id) return { ...c, likes: upd.likes };
            if (c.replies?.length) {
              return {
                ...c,
                replies: c.replies.map((r) => (r.id === upd.id ? { ...r, likes: upd.likes } : r)),
              };
            }
            return c;
          })
        );
      },
    });

    return () => {
      alive = false;
      unsub();
    };
  }, [open, targetId, sort, youtubeId, viewerId]);

  if (!open) return null;

  const displayAuthor = (user?.name || guestName || 'Cria MORRO GOLD').trim().slice(0, 32);

  const handleSaveNick = () => {
    const clean = guestName.trim() || 'Cria MORRO GOLD';
    setGuestName(clean);
    setGuestNickname(clean);
    setEditingNick(false);
  };

  const submitCommentText = async (rawText: string) => {
    const clean = rawText.trim();
    if (!clean || sending) return;
    setSending(true);
    try {
      const created = await postCommentItem({
        targetId,
        parentId: replyingTo?.id || '',
        authorName: displayAuthor,
        authorColor: user?.avatarColor || 'from-amber-400 via-pink-500 to-cyan-400',
        text: clean,
      });
      if (created) {
        if (replyingTo) {
          setComments((prev) =>
            prev.map((c) => {
              if (c.id !== replyingTo.id) return c;
              const existing = c.replies || [];
              if (existing.some((r) => r.id === created.id)) return c;
              return { ...c, replies: [...existing, created] };
            })
          );
          setExpandedReplies((prev) => new Set(prev).add(replyingTo.id));
          setReplyingTo(null);
        } else {
          setComments((prev) => {
            if (prev.some((c) => c.id === created.id)) return prev;
            setTotalCount((n) => n + 1);
            return [created, ...prev];
          });
        }
        setText('');
      }
    } finally {
      setSending(false);
    }
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    void submitCommentText(text);
  };

  const handleLikeComment = async (c: CommentItem, parentId?: string) => {
    const wasLiked = likedLocalIds.has(c.id);
    const optimisticNext = !wasLiked;
    setLikedLocalIds((prev) => {
      const next = new Set(prev);
      if (optimisticNext) next.add(c.id);
      else next.delete(c.id);
      return next;
    });

    const patchItem = (item: CommentItem, nextLikes: number, liked: boolean) => ({
      ...item,
      likes: nextLikes,
      liked_by_me: liked,
    });

    const optimisticCount = Math.max(0, c.likes + (optimisticNext ? 1 : -1));
    setComments((prev) =>
      prev.map((top) => {
        if (top.id === c.id) return patchItem(top, optimisticCount, optimisticNext);
        if (parentId && top.id === parentId && top.replies) {
          return {
            ...top,
            replies: top.replies.map((r) =>
              r.id === c.id ? patchItem(r, optimisticCount, optimisticNext) : r
            ),
          };
        }
        return top;
      })
    );

    const res = await likeCommentItem(c.id, viewerId, c.likes, targetId);
    if (res) {
      setLikedLocalIds((prev) => {
        const next = new Set(prev);
        if (res.liked) next.add(c.id);
        else next.delete(c.id);
        return next;
      });
      setComments((prev) =>
        prev.map((top) => {
          if (top.id === c.id) return patchItem(top, res.likes, res.liked);
          if (parentId && top.id === parentId && top.replies) {
            return {
              ...top,
              replies: top.replies.map((r) =>
                r.id === c.id ? patchItem(r, res.likes, res.liked) : r
              ),
            };
          }
          return top;
        })
      );
    }
  };

  const toggleExpandReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9997] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-[80vh] sm:h-[82vh] max-h-[680px] rounded-t-3xl sm:rounded-3xl bg-[#0e0722]/98 border border-amber-400/35 flex flex-col overflow-hidden shadow-[0_-12px_60px_rgba(245,158,11,0.22)]"
      >
        <div className="flex justify-center pt-2 pb-0.5 sm:hidden">
          <span className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        <div className="px-4 py-2.5 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Comentários ao vivo</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-[11px] font-black text-amber-200">
                  {totalCount}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[11px] text-purple-200/75 truncate">{targetTitle}</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSort('top')}
                className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
                  sort === 'top' ? 'bg-white text-black' : 'bg-white/10 text-purple-100 hover:bg-white/20'
                }`}
              >
                Principais
              </button>
              <button
                type="button"
                onClick={() => setSort('newest')}
                className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
                  sort === 'newest' ? 'bg-white text-black' : 'bg-white/10 text-purple-100 hover:bg-white/20'
                }`}
              >
                Mais recentes
              </button>
            </div>

            {!user && (
              editingNick ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNick()}
                    maxLength={28}
                    className="px-2 py-0.5 rounded-full bg-white/10 border border-amber-400/50 text-[10px] text-white focus:outline-none w-28"
                  />
                  <button type="button" onClick={handleSaveNick} className="p-1 rounded-full bg-emerald-500 text-black">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingNick(true)}
                  className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-amber-200 flex items-center gap-1"
                >
                  <Edit3 className="w-2.5 h-2.5" /> {displayAuthor}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-cyan-300 font-bold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Carregando comentários...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-xs text-purple-200/80">
              Seja o primeiro a mandar um comentário aqui! 💬
            </div>
          ) : (
            comments.map((c) => {
              const isLiked = likedLocalIds.has(c.id);
              const replies = c.replies || [];
              const isExpanded = expandedReplies.has(c.id);
              return (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    {c.author_avatar ? (
                      <img
                        src={c.author_avatar}
                        alt={c.author_name}
                        className="w-8 h-8 rounded-full object-cover border border-white/15 shrink-0"
                      />
                    ) : (
                      <span
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.author_color} text-xs font-black text-white flex items-center justify-center shrink-0`}
                      >
                        {c.author_name.slice(0, 1).toUpperCase()}
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[11px] font-black ${
                            c.is_creator ? 'px-2 py-0.5 rounded-full bg-white text-black' : 'text-amber-200'
                          }`}
                        >
                          {c.author_name}
                        </span>
                        <span className="text-[10px] text-purple-200/60">
                          {fmtRelativeCommentTime(c.created_at, c.published_text)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13px] text-white/95 break-words mt-0.5 leading-snug">
                        {c.text}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={() => void handleLikeComment(c)}
                          className={`flex items-center gap-1 text-[11px] font-bold transition ${
                            isLiked ? 'text-pink-400' : 'text-purple-200/75 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                          <span>{fmtLikesCompact(c.likes)}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReplyingTo(c)}
                          className="text-[11px] font-bold text-purple-200/75 hover:text-cyan-300 transition"
                        >
                          Responder
                        </button>
                      </div>

                      {replies.length > 0 && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => toggleExpandReplies(c.id)}
                            className="text-[11px] font-black text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>
                              {isExpanded
                                ? 'Ocultar respostas'
                                : `${replies.length} ${replies.length === 1 ? 'resposta' : 'respostas'}`}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2 pl-3 border-l border-white/15">
                              {replies.map((r) => {
                                const rLiked = likedLocalIds.has(r.id);
                                return (
                                  <div key={r.id} className="flex items-start gap-2">
                                    <span
                                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${r.author_color} text-[10px] font-black text-white flex items-center justify-center shrink-0`}
                                    >
                                      {r.author_name.slice(0, 1).toUpperCase()}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-black text-amber-200">
                                          {r.author_name}
                                        </span>
                                        <span className="text-[9px] text-purple-200/60">
                                          {fmtRelativeCommentTime(r.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-white/95 break-words">{r.text}</p>
                                      <button
                                        type="button"
                                        onClick={() => void handleLikeComment(r, c.id)}
                                        className={`mt-1 flex items-center gap-1 text-[10px] font-bold ${
                                          rLiked ? 'text-pink-400' : 'text-purple-200/75'
                                        }`}
                                      >
                                        <Heart
                                          className={`w-3 h-3 ${rLiked ? 'fill-pink-500 text-pink-500' : ''}`}
                                        />
                                        <span>{r.likes}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-white/10 bg-[#080316] p-3 space-y-2">
          {replyingTo && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-[11px] text-cyan-200">
              <span className="truncate">Respondendo a @{replyingTo.author_name}</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setText((prev) => `${prev}${prev ? ' ' : ''}${emoji}`)}
                className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/20 text-sm transition active:scale-90 shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handlePost} className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-cyan-400 text-xs font-black text-black flex items-center justify-center shrink-0">
              {displayAuthor.slice(0, 1).toUpperCase()}
            </span>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                replyingTo ? `Responder @${replyingTo.author_name}...` : 'Escreva seu comentário...'
              }
              className="flex-1 px-3.5 py-2 rounded-full bg-white/[0.1] border border-white/20 text-xs text-white placeholder-purple-200/60 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 text-black text-xs font-black disabled:opacity-40 shrink-0"
            >
              {sending ? '...' : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Send, Heart, X, Sparkles, UserCircle2, CornerDownRight, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import {
  ChatMessageItem,
  CommentItem,
  fetchChatMessages,
  fetchCommentsFull,
  getClientSubscriberId,
  likeCommentItem,
  postCommentItem,
  sendChatMessage,
} from '../utils/communityApi';

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

export const CommunityChatModal: React.FC<ChatModalProps> = ({
  open,
  onClose,
  user,
  onOpenAuth,
  roomId = 'global',
  roomTitle = 'Chat Espacial da Comunidade LENKYX',
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const load = () => {
      void fetchChatMessages(roomId).then((list) => {
        if (alive) setMessages(list);
      });
    };
    load();
    const timer = window.setInterval(load, 4000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [open, roomId]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, open]);

  if (!open) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    try {
      const created = await sendChatMessage({
        roomId,
        authorName: user?.name || 'Visitante Cósmico',
        authorColor: user?.avatarColor || 'from-pink-500 to-cyan-400',
        message: clean,
      });
      if (created) {
        setMessages((prev) => [...prev, created]);
        setText('');
      }
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9996] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-[82vh] max-h-[640px] rounded-3xl bg-[#090318]/96 border border-cyan-400/40 flex flex-col overflow-hidden shadow-[0_0_70px_rgba(34,211,238,0.3)]"
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 bg-gradient-to-r from-[#190a36] to-[#081a2c]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-white truncate">{roomTitle}</div>
              <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Chat ao vivo · Converse com outros fãs
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-purple-300/75 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-cyan-300" />
              <p>Nenhuma mensagem ainda. Seja o primeiro a falar com a galera!</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                <span
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${m.author_color} text-[11px] font-black text-white flex items-center justify-center shrink-0 mt-0.5`}
                >
                  {m.author_name.slice(0, 1).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0 rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-cyan-300 truncate">{m.author_name}</span>
                    <span className="text-[9px] text-purple-300/60 shrink-0">{fmtTime(m.created_at)}</span>
                  </div>
                  <p className="text-xs text-white/95 break-words mt-0.5">{m.message}</p>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#070212] space-y-2">
          {!user && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-[10px] text-cyan-300 hover:underline flex items-center gap-1"
            >
              <UserCircle2 className="w-3 h-3" /> Entre com seu nome para aparecer identificado no chat
            </button>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva uma mensagem no chat..."
              className="flex-1 px-3.5 py-2 rounded-full bg-white/[0.08] border border-white/15 text-xs text-white placeholder-purple-300/60 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-xs font-black flex items-center gap-1 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" /> Enviar
            </button>
          </div>
        </form>
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

const QUICK_REACTIONS = ['🔥', '❤️', '😂', '👏', '🤯', '🚀'];

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
    return () => {
      alive = false;
    };
  }, [open, targetId, sort, youtubeId, viewerId]);

  if (!open) return null;

  const submitCommentText = async (rawText: string) => {
    const clean = rawText.trim();
    if (!clean || sending) return;
    setSending(true);
    try {
      const created = await postCommentItem({
        targetId,
        parentId: replyingTo?.id || '',
        authorName: user?.name || 'Fã LENKYX',
        authorColor: user?.avatarColor || 'from-purple-500 to-pink-500',
        text: clean,
      });
      if (created) {
        if (replyingTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.id
                ? { ...c, replies: [...(c.replies || []), created] }
                : c
            )
          );
          setExpandedReplies((prev) => new Set(prev).add(replyingTo.id));
          setReplyingTo(null);
        } else {
          setComments((prev) => [created, ...prev]);
          setTotalCount((n) => n + 1);
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

    const res = await likeCommentItem(c.id, viewerId, c.likes);
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
        className="w-full max-w-lg h-[78vh] sm:h-[82vh] max-h-[680px] rounded-t-3xl sm:rounded-3xl bg-[#0e0722]/98 border border-white/20 flex flex-col overflow-hidden shadow-[0_-12px_60px_rgba(34,211,238,0.22)]"
      >
        {/* Drag Handle (Mobile YouTube Shorts Style) */}
        <div className="flex justify-center pt-2 pb-0.5 sm:hidden">
          <span className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header + Sort Tabs */}
        <div className="px-4 py-2.5 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Comentários</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-black text-cyan-200">
                  {totalCount}
                </span>
              </div>
              <div className="text-[11px] text-purple-200/75 truncate">{targetTitle}</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

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
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-cyan-300 font-bold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Carregando comentários...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-xs text-purple-200/80">
              Seja o primeiro a comentar neste vídeo! 💬
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
                            c.is_creator
                              ? 'px-2 py-0.5 rounded-full bg-white text-black'
                              : 'text-cyan-200'
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
                          <Heart
                            className={`w-3.5 h-3.5 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`}
                          />
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
                                        <span className="text-[11px] font-black text-cyan-200">
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

        {/* Quick Emoji Strip + Composer */}
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
            <span
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                user?.avatarColor || 'from-pink-500 to-cyan-400'
              } text-xs font-black text-white flex items-center justify-center shrink-0`}
            >
              {(user?.name || 'F').slice(0, 1).toUpperCase()}
            </span>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                replyingTo ? `Responder @${replyingTo.author_name}...` : 'Adicione um comentário...'
              }
              className="flex-1 px-3.5 py-2 rounded-full bg-white/[0.1] border border-white/20 text-xs text-white placeholder-purple-200/60 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black text-xs font-black disabled:opacity-40 shrink-0"
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

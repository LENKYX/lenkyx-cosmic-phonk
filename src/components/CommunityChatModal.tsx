import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Send, Heart, X, Sparkles, UserCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import {
  ChatMessageItem,
  CommentItem,
  fetchChatMessages,
  fetchComments,
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
  user: UserProfile | null;
}

export const TargetCommentsModal: React.FC<TargetCommentsModalProps> = ({
  open,
  onClose,
  targetId,
  targetTitle,
  user,
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !targetId) return;
    void fetchComments(targetId).then(setComments);
  }, [open, targetId]);

  if (!open) return null;

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const created = await postCommentItem({
        targetId,
        authorName: user?.name || 'Fã LENKYX',
        authorColor: user?.avatarColor || 'from-purple-500 to-pink-500',
        text: text.trim(),
      });
      if (created) {
        setComments((prev) => [created, ...prev]);
        setText('');
      }
    } finally {
      setSending(false);
    }
  };

  const handleLikeComment = async (id: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c)));
    await likeCommentItem(id);
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9997] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[80vh] rounded-3xl bg-[#0a041a]/96 border border-pink-400/40 flex flex-col overflow-hidden shadow-[0_0_60px_rgba(236,72,153,0.3)]"
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-pink-300">
              Comentários & Curtidas
            </div>
            <div className="text-xs font-black text-white truncate">{targetTitle}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {comments.length === 0 ? (
            <div className="py-10 text-center text-xs text-purple-300/75">
              Seja o primeiro a comentar e curtir! 💬❤️
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.author_color} text-[11px] font-black text-white flex items-center justify-center shrink-0`}
                  >
                    {c.author_name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black text-cyan-300">{c.author_name}</div>
                    <p className="text-xs text-white/95 break-words mt-0.5">{c.text}</p>
                  </div>
                </div>
                <button
                  onClick={() => void handleLikeComment(c.id)}
                  className="px-2 py-1 rounded-full bg-pink-500/15 hover:bg-pink-500/30 text-[10px] font-bold text-pink-200 flex items-center gap-1 shrink-0"
                >
                  <Heart className="w-3 h-3 fill-pink-500 text-pink-500" /> {c.likes}
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handlePost} className="p-3 border-t border-white/10 flex items-center gap-2 bg-[#070212]">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva um comentário..."
            className="flex-1 px-3.5 py-2 rounded-full bg-white/[0.08] border border-white/15 text-xs text-white placeholder-purple-300/60 focus:outline-none focus:border-pink-400"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-white text-xs font-black disabled:opacity-40"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

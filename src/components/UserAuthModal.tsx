import React, { useState } from 'react';
import { X, User, Sparkles, MessageCircle, Lock, LogOut, Music, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSaveUser: (user: UserProfile) => void;
  onLogoutUser: () => void;
  onOpenCreatorLogin: () => void;
  onOpenShare: () => void;
  onToast: (msg: string) => void;
}

const AVATAR_COLORS = [
  'from-pink-500 to-purple-600',
  'from-cyan-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-fuchsia-500 to-rose-600',
];

export const UserAuthModal: React.FC<Props> = ({
  open,
  onClose,
  user,
  onSaveUser,
  onLogoutUser,
  onOpenCreatorLogin,
  onOpenShare,
  onToast,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [color, setColor] = useState(user?.avatarColor || AVATAR_COLORS[0]);
  const [justRegistered, setJustRegistered] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const profile: UserProfile = {
      id: user?.id || 'fan-' + Date.now().toString(36),
      name: name.trim(),
      email: email.trim() || undefined,
      avatarColor: color,
      createdAt: user?.createdAt || new Date().toISOString(),
    };
    onSaveUser(profile);
    setJustRegistered(true);
    onToast(`🚀 Bem-vindo(a), ${profile.name}! Suas playlists e músicas pessoais estão liberadas!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl glass-panel neon-border overflow-hidden my-auto">
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center font-extrabold text-white shadow`}>
                {user ? user.name.slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-display text-base font-extrabold text-white">
                  {justRegistered
                    ? 'CONTA CRIADA COM SUCESSO!'
                    : user
                    ? `PERFIL: ${user.name}`
                    : 'ENTRAR / CRIAR CONTA GRÁTIS'}
                </h2>
                <p className="text-[11px] text-purple-200/75">
                  Crie suas playlists, suba suas músicas e curta o universo LENKYX
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setJustRegistered(false);
                onClose();
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-purple-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {justRegistered ? (
            <div className="space-y-3.5 text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Bem-vindo(a) à família LENKYX, {name}! 🚀</h3>
                <p className="text-xs text-purple-200/85 leading-relaxed">
                  Agora você já pode montar suas <strong>Playlists</strong>, subir suas próprias músicas MP3/WAV, ouvir sons
                  do mundo todo e mixar na <strong>Mesa de DJ Pro</strong>!
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/12 border border-emerald-400/35 p-3.5 space-y-2.5">
                <div className="text-xs font-extrabold text-emerald-300">
                  💜 Ajude a espalhar esse som — compartilhe com seus amigos!
                </div>
                <p className="text-[11px] text-emerald-100/85">
                  Convide sua galera no WhatsApp pra ouvir LENKYX Cosmic Phonk e montar a playlist deles também!
                </p>
                <button
                  onClick={() => {
                    setJustRegistered(false);
                    onClose();
                    onOpenShare();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <MessageCircle className="w-4 h-4" /> Compartilhar com Amigos no WhatsApp
                </button>
              </div>

              <button
                onClick={() => {
                  setJustRegistered(false);
                  onClose();
                }}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
              >
                Ir para as Músicas →
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Seu Nome ou Apelido</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Lucas, DJ Rafa, Maria..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1.5">Cor do seu Perfil</label>
                  <div className="flex items-center gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${c} transition ${
                          color === c ? 'ring-2 ring-white scale-110' : 'opacity-65 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Convite pra compartilhar já visível no cadastro! */}
                <div className="rounded-xl bg-purple-950/60 border border-pink-500/30 p-3 text-[11px] text-purple-100/90 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Conta 100% Grátis:</strong> monte suas playlists, suba suas músicas e <strong>compartilhe o app com seus amigos no WhatsApp</strong> pra curtirem juntos!
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Music className="w-4 h-4" /> {user ? 'Salvar Perfil' : 'Criar Conta & Entrar Agora'}
                </button>
              </form>

              {user && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenShare();
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Convidar Amigos
                  </button>
                  <button
                    onClick={() => {
                      onLogoutUser();
                      onClose();
                      onToast('Você saiu do seu perfil.');
                    }}
                    className="py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-400/30 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sair da Conta
                  </button>
                </div>
              )}

              <div className="pt-2.5 border-t border-white/10">
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreatorLogin();
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-purple-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Lock className="w-3.5 h-3.5 text-pink-400" /> Sou o Criador LENKYX (Entrar com Senha Admin)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

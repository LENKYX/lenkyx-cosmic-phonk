import React, { useState } from 'react';
import {
  X,
  User,
  MessageCircle,
  LogOut,
  Rocket,
  CheckCircle2,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserProfile } from '../types';
import { CosmicSpaceBackdrop } from './CosmicSpaceBackdrop';

interface Props {
  open: boolean;
  requireGate?: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSaveUser: (user: UserProfile) => void;
  onLogoutUser: () => void;
  onOpenShare: () => void;
  onBrandTap?: () => void;
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
  requireGate = false,
  onClose,
  user,
  onSaveUser,
  onLogoutUser,
  onOpenShare,
  onBrandTap,
  onToast,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [color, setColor] = useState(user?.avatarColor || AVATAR_COLORS[0]);
  const [acceptedTerms, setAcceptedTerms] = useState(Boolean(user?.acceptedTermsAt));
  const [showTermsText, setShowTermsText] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const visible = open || requireGate;
  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!acceptedTerms) {
      setTermsError(true);
      setShowTermsText(true);
      onToast('Marque a caixa aceitando os Termos de Uso antes de continuar.');
      return;
    }
    setTermsError(false);
    const profile: UserProfile = {
      id: user?.id || 'fan-' + Date.now().toString(36),
      name: name.trim(),
      email: email.trim() || undefined,
      avatarColor: color,
      acceptedTermsAt: user?.acceptedTermsAt || new Date().toISOString(),
      createdAt: user?.createdAt || new Date().toISOString(),
    };
    onSaveUser(profile);
    onToast(`🚀 Bem-vindo(a), ${profile.name}! Universo LENKYX liberado!`);
    if (requireGate) {
      setJustRegistered(false);
      onClose();
    } else {
      setJustRegistered(true);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 overflow-y-auto cosmic-scene ${
        requireGate ? 'z-40 bg-[#04010c]' : 'z-50 bg-black/75 backdrop-blur-md'
      }`}
    >
      {requireGate && <CosmicSpaceBackdrop intense />}

      {/* 3D Floating Holographic Space Card */}
      <div className="relative z-10 w-full max-w-md my-auto cosmic-card-3d cosmic-float-slow rounded-[28px] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400" />

        <div className="p-6 sm:p-7 space-y-5">
          {/* Orbiting Floating Emblem (5x tap secret Creator login preserved!) */}
          <div
            onClick={onBrandTap}
            className="flex flex-col items-center text-center gap-3 cursor-pointer select-none"
          >
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div
                className="absolute -inset-3 rounded-full border border-cyan-400/40 pointer-events-none"
                style={{ transform: 'rotateX(68deg) rotateY(-14deg)' }}
              />
              <div
                className="absolute -inset-5 rounded-full border border-pink-500/25 pointer-events-none"
                style={{ transform: 'rotateX(68deg) rotateY(16deg)' }}
              />
              <img
                src="/covers/album-official.jpg"
                alt="LENKYX Cosmic Phonk"
                className="w-20 h-20 rounded-2xl object-cover border border-white/25 shadow-[0_0_35px_rgba(236,72,153,0.55)]"
              />
            </div>

            <div>
              <h1 className="font-display text-xl font-black tracking-widest text-white">
                LENKYX <span className="neon-text">COSMIC PHONK</span>
              </h1>
              <p className="text-xs text-cyan-200/80 mt-1">
                {user
                  ? 'Seu passe espacial de música, clipes e playlists'
                  : 'Entre no universo musical — 100% grátis e sem anúncios'}
              </p>
            </div>
          </div>

          {!requireGate && (
            <button
              onClick={() => {
                setJustRegistered(false);
                onClose();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-purple-100 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {justRegistered ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Bem-vindo(a) à nave LENKYX, {name}! 🚀</h3>
                <p className="text-xs text-purple-200/85 leading-relaxed">
                  Tudo liberado: músicas completas, clipes HD, modo offline, playlists e Mesa de DJ!
                </p>
              </div>
              <button
                onClick={() => {
                  setJustRegistered(false);
                  onClose();
                  onOpenShare();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <MessageCircle className="w-4 h-4" /> Convidar Amigos no WhatsApp
              </button>
              <button
                onClick={() => {
                  setJustRegistered(false);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
              >
                Explorar Músicas →
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-200/80">
                    Seu Nome ou Apelido
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-cyan-300/75 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Como deseja ser chamado(a)?"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-pink-400 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-200/80">
                    E-mail <span className="normal-case font-normal text-purple-300/60">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200/80">
                    Cor da Órbita
                  </span>
                  <div className="flex items-center gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${c} transition ${
                          color === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Termos de Uso Obrigatórios */}
                <div
                  className={`rounded-2xl border p-3 space-y-2 transition ${
                    termsError ? 'bg-red-500/15 border-red-400/60' : 'bg-white/[0.04] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" /> Termos de Uso & Privacidade
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTermsText((v) => !v)}
                      className="text-[10px] font-bold text-purple-200 hover:text-white inline-flex items-center gap-0.5"
                    >
                      {showTermsText ? 'Ocultar' : 'Ler'}
                      {showTermsText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showTermsText && (
                    <div className="max-h-28 overflow-y-auto rounded-xl bg-black/55 p-2.5 text-[10px] text-purple-100/85 leading-relaxed space-y-1.5 border border-white/10">
                      <p>
                        <strong>1. Uso Gratuito:</strong> A plataforma LENKYX Cosmic Phonk oferece streaming gratuito
                        de músicas originais, clipes, download offline no aparelho, playlists e Mesa de DJ para uso
                        pessoal.
                      </p>
                      <p>
                        <strong>2. Direitos Autorais:</strong> Todas as composições originais LENKYX pertencem ao
                        criador LENKYX. Arquivos pessoais enviados ficam salvos apenas no seu aparelho.
                      </p>
                      <p>
                        <strong>3. Privacidade:</strong> Seu nome e playlists ficam salvos localmente para manter sua
                        experiência personalizada.
                      </p>
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (e.target.checked) setTermsError(false);
                      }}
                      className="mt-0.5 w-4 h-4 accent-pink-500 rounded shrink-0"
                    />
                    <span className="text-[11px] text-purple-100/90 leading-snug">
                      Li e aceito os <strong>Termos de Uso e Privacidade</strong> do app LENKYX Cosmic Phonk.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 rounded-2xl font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition ${
                    acceptedTerms
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white shadow-[0_0_28px_rgba(236,72,153,0.45)]'
                      : 'bg-white/15 text-purple-200/75 hover:bg-white/20'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  {user ? 'Salvar Perfil' : 'Decolar & Entrar no Espaço'}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

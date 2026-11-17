import React, { useState } from 'react';
import { X, User, Sparkles, MessageCircle, LogOut, Music, CheckCircle2, FileCheck2, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile } from '../types';

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
    onToast(`🚀 Bem-vindo(a), ${profile.name}! App LENKYX liberado!`);
    if (requireGate) {
      setJustRegistered(false);
      onClose();
    } else {
      setJustRegistered(true);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-3 overflow-y-auto ${
        requireGate
          ? 'bg-[#05020e] backdrop-blur-xl'
          : 'bg-black/80 backdrop-blur-md z-50'
      }`}
    >
      {requireGate && (
        <div
          className="absolute inset-0 pointer-events-none opacity-65"
          style={{
            background:
              'radial-gradient(circle at 20% 15%, rgba(236,72,153,0.28), transparent 45%), radial-gradient(circle at 80% 80%, rgba(34,211,238,0.25), transparent 48%)',
          }}
        />
      )}
      <div className="relative z-10 w-full max-w-md rounded-3xl glass-panel neon-border overflow-hidden my-auto shadow-[0_0_70px_rgba(236,72,153,0.25)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />
        <div className="p-5 space-y-4">
          {requireGate && (
            <div
              onClick={onBrandTap}
              className="flex flex-col items-center text-center gap-2 pb-2 border-b border-white/10 cursor-pointer select-none"
            >
              <img
                src="/covers/album-official.jpg"
                alt="LENKYX Cosmic Phonk"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-pink-500/70 shadow-[0_0_25px_rgba(236,72,153,0.45)]"
              />
              <div>
                <div className="font-display text-lg font-black tracking-wider text-white">
                  LENKYX <span className="neon-text">COSMIC PHONK</span>
                </div>
                <p className="text-[11px] text-cyan-200/85 font-semibold">
                  Cadastre-se grátis em 10 segundos para entrar no app e ouvir tudo completo!
                </p>
              </div>
            </div>
          )}
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
                    : requireGate
                    ? 'FAÇA SEU CADASTRO PARA ENTRAR'
                    : 'CRIAR CONTA GRÁTIS'}
                </h2>
                <p className="text-[11px] text-purple-200/75">
                  Músicas completas, clipes oficiais HD, modo offline e playlists grátis
                </p>
              </div>
            </div>
            {!requireGate && (
              <button
                onClick={() => {
                  setJustRegistered(false);
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-purple-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {justRegistered ? (
            <div className="space-y-3.5 text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Bem-vindo(a) à família LENKYX, {name}! 🚀</h3>
                <p className="text-xs text-purple-200/85 leading-relaxed">
                  Agora você já pode baixar músicas para ouvir <strong>offline</strong>, montar suas{' '}
                  <strong>Playlists</strong>, subir seus arquivos MP3/WAV e mixar na <strong>Mesa de DJ Pro</strong>!
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/12 border border-emerald-400/35 p-3.5 space-y-2.5">
                <div className="text-xs font-extrabold text-emerald-300">
                  💜 Ajude a espalhar esse som — compartilhe com seus amigos!
                </div>
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
                  <label className="block text-xs font-semibold text-purple-200 mb-1">E-mail (opcional — para recuperar playlists)</label>
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

                {/* Termos de Uso Obrigatórios antes do cadastro */}
                <div
                  className={`rounded-xl border p-3 space-y-2 transition ${
                    termsError
                      ? 'bg-red-500/15 border-red-400/60'
                      : 'bg-black/45 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" /> Termos de Uso do App LENKYX
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTermsText((v) => !v)}
                      className="text-[10px] font-bold text-purple-200 hover:text-white inline-flex items-center gap-0.5"
                    >
                      {showTermsText ? 'Ocultar' : 'Ler Termos'}
                      {showTermsText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showTermsText && (
                    <div className="max-h-32 overflow-y-auto rounded-lg bg-black/60 p-2.5 text-[10px] text-purple-100/85 leading-relaxed space-y-1.5 border border-white/10">
                      <p>
                        <strong>1. Uso Gratuito e Pessoal:</strong> A plataforma LENKYX Cosmic Phonk oferece streaming
                        gratuito de músicas originais da LENKYX, faixas completas de artistas parceiros, download offline
                        no próprio dispositivo, criação de playlists e Mesa de DJ para uso pessoal e não comercial.
                      </p>
                      <p>
                        <strong>2. Direitos Autorais e Conteúdo Enviado:</strong> Todas as composições originais LENKYX são
                        de titularidade do criador LENKYX. Ao subir arquivos pessoais (MP3/WAV) para sua biblioteca
                        privada no dispositivo, você declara possuir autorização para utilizá-los.
                      </p>
                      <p>
                        <strong>3. Privacidade & Armazenamento:</strong> Seu nome, e-mail opcional e playlists são salvos
                        apenas para manter sua conta e sincronizar suas seleções. Áudios baixados offline ficam
                        armazenados localmente no seu aparelho e podem ser apagados a qualquer momento.
                      </p>
                      <p>
                        <strong>4. Apoio Voluntário:</strong> Contribuições via PIX dentro do app são 100% opcionais e
                        voluntárias.
                      </p>
                    </div>
                  )}

                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (e.target.checked) setTermsError(false);
                      }}
                      className="mt-0.5 w-4 h-4 accent-pink-500 rounded shrink-0"
                    />
                    <span className="text-[11px] text-purple-100 leading-snug">
                      Li e aceito os <strong>Termos de Uso e Política de Privacidade</strong> do aplicativo LENKYX
                      Cosmic Phonk.
                    </span>
                  </label>
                </div>

                <div className="rounded-xl bg-purple-950/60 border border-pink-500/30 p-2.5 text-[11px] text-purple-100/90 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>100% Grátis:</strong> ouça faixas completas, baixe para ouvir <strong>offline</strong> e
                    curta com seus amigos!
                  </span>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition ${
                    acceptedTerms
                      ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-white'
                      : 'bg-white/15 text-purple-300/70 hover:bg-white/20'
                  }`}
                >
                  <Music className="w-4 h-4" />{' '}
                  {user
                    ? 'Salvar Perfil'
                    : requireGate
                    ? 'Aceitar Termos, Cadastrar & Entrar no App 🚀'
                    : 'Aceitar Termos & Criar Conta'}
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

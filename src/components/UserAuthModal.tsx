import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  Fingerprint,
  Smartphone,
  MessageCircle,
  MessageSquare,
  LogOut,
  Rocket,
  CheckCircle2,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types';
import { CosmicSpaceBackdrop } from './CosmicSpaceBackdrop';
import { authenticateWithDevice, isAndroidApk } from '../utils/androidBridge';
import {
  getPrimaryDeviceAccount,
  loginFanAccount,
  registerFanAccount,
  requestFanPasswordRecovery,
  saveDeviceAccount,
  verifyFanPasswordRecovery,
} from '../utils/fanAuth';

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

type AuthTab = 'login' | 'register' | 'recover';

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
  const [deviceAccount, setDeviceAccount] = useState<UserProfile | null>(() => getPrimaryDeviceAccount());
  const [tab, setTab] = useState<AuthTab>(() => (getPrimaryDeviceAccount() ? 'login' : 'register'));

  // Register state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [color, setColor] = useState(user?.avatarColor || AVATAR_COLORS[0]);
  const [deviceUnlockEnabled, setDeviceUnlockEnabled] = useState(user?.deviceUnlockEnabled !== false);
  const [acceptedTerms, setAcceptedTerms] = useState(Boolean(user?.acceptedTermsAt));
  const [showTermsText, setShowTermsText] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // Login state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  // Recover state
  const [recId, setRecId] = useState('');
  const [recSent, setRecSent] = useState<{
    code: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [recCodeInput, setRecCodeInput] = useState('');
  const [recNewPass, setRecNewPass] = useState('');

  useEffect(() => {
    const dev = getPrimaryDeviceAccount();
    setDeviceAccount(dev);
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setColor(user.avatarColor || AVATAR_COLORS[0]);
      setDeviceUnlockEnabled(user.deviceUnlockEnabled !== false);
      setAcceptedTerms(Boolean(user.acceptedTermsAt));
      setTab('register');
    } else if (dev) {
      setTab('login');
      setLoginId(dev.phone || dev.email || '');
    }
  }, [open, user]);

  const visible = open || requireGate;
  if (!visible) return null;

  const completeEntry = (profile: UserProfile, msg: string) => {
    saveDeviceAccount(profile);
    setDeviceAccount(profile);
    onSaveUser(profile);
    onToast(msg);
    setAuthError('');
    onClose();
  };

  // Unlock with phone Biometrics / Face / PIN / Pattern / Password
  const handleDeviceBiometricUnlock = async () => {
    if (!deviceAccount) return;
    setBusy(true);
    setAuthError('');
    try {
      const res = await authenticateWithDevice(
        'Entrar no LENKYX Cosmic Phonk',
        `Confirme sua biometria, PIN, senha ou padrão para liberar ${deviceAccount.name}`
      );
      if (res.ok) {
        completeEntry(deviceAccount, `🔓 Desbloqueado! Bem-vindo(a), ${deviceAccount.name}!`);
      } else {
        setAuthError('Verificação cancelada. Tente a biometria novamente ou entre com sua senha.');
      }
    } finally {
      setBusy(false);
    }
  };

  // Instant entry because this phone recognizes the saved account
  const handleInstantDeviceEntry = () => {
    if (!deviceAccount) return;
    completeEntry(deviceAccount, `⚡ Celular reconhecido! Bem-vindo(a) de volta, ${deviceAccount.name}!`);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!name.trim()) {
      setAuthError('Informe seu nome ou apelido.');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setAuthError('Preencha seu número de celular (WhatsApp/SMS) ou seu e-mail.');
      return;
    }
    if (!user && password.trim().length < 4) {
      setAuthError('Crie uma senha pessoal com pelo menos 4 caracteres.');
      return;
    }
    if (!acceptedTerms) {
      setTermsError(true);
      setShowTermsText(true);
      setAuthError('Aceite os Termos de Uso antes de continuar.');
      return;
    }
    setTermsError(false);
    setBusy(true);
    try {
      const res = await registerFanAccount({
        id: user?.id,
        name,
        phone,
        email,
        password: password.trim() || undefined,
        avatarColor: color,
        deviceUnlockEnabled,
        acceptedTermsAt: user?.acceptedTermsAt || new Date().toISOString(),
        createdAt: user?.createdAt,
      });
      if (!res.ok || !res.user) {
        setAuthError(res.error || 'Erro ao salvar cadastro.');
        return;
      }
      completeEntry(
        res.user,
        user ? `✅ Perfil atualizado, ${res.user.name}!` : `🚀 Bem-vindo(a) ao espaço, ${res.user.name}!`
      );
    } finally {
      setBusy(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setBusy(true);
    try {
      const res = await loginFanAccount(loginId, loginPassword);
      if (!res.ok || !res.user) {
        setAuthError(res.error || 'Não foi possível entrar.');
        return;
      }
      completeEntry(res.user, `🚀 Bem-vindo(a) de volta, ${res.user.name}!`);
    } finally {
      setBusy(false);
    }
  };

  const handleRecoverRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setBusy(true);
    try {
      const res = await requestFanPasswordRecovery(recId);
      if (!res.ok || !res.code) {
        setAuthError(res.error || 'Conta não encontrada.');
        return;
      }
      setRecSent({
        code: res.code,
        name: res.name,
        email: res.email,
        phone: res.phone,
      });
      onToast('Código de 6 dígitos gerado! Escolha WhatsApp, SMS ou E-mail.');
    } finally {
      setBusy(false);
    }
  };

  const openRecoveryChannel = (channel: 'whatsapp' | 'sms' | 'email') => {
    if (!recSent) return;
    const msg = `LENKYX Cosmic Phonk: seu código para recuperar a senha é ${recSent.code} (válido por 15 min).`;
    const cleanDigits = (recSent.phone || recId).replace(/\D/g, '');
    const waPhone = cleanDigits.startsWith('55') ? cleanDigits : cleanDigits.length >= 10 ? `55${cleanDigits}` : cleanDigits;

    let url = '';
    if (channel === 'whatsapp') {
      url = waPhone
        ? `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    } else if (channel === 'sms') {
      url = `sms:${cleanDigits || ''}?body=${encodeURIComponent(msg)}`;
    } else {
      const mail = recSent.email || (recId.includes('@') ? recId.trim() : '');
      url = `mailto:${mail}?subject=${encodeURIComponent('Recuperação de Senha — LENKYX Cosmic Phonk')}&body=${encodeURIComponent(msg)}`;
    }

    if (isAndroidApk() && window.AndroidBridge?.openExternalUrl) {
      window.AndroidBridge.openExternalUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRecoverVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setBusy(true);
    try {
      const res = await verifyFanPasswordRecovery(recId, recCodeInput, recNewPass);
      if (!res.ok || !res.user) {
        setAuthError(res.error || 'Código inválido ou senha muito curta.');
        return;
      }
      setRecSent(null);
      setRecCodeInput('');
      setRecNewPass('');
      completeEntry(res.user, `🔐 Senha redefinida! Bem-vindo(a), ${res.user.name}!`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto cosmic-scene ${
        requireGate ? 'z-40 bg-[#04010c]' : 'z-50 bg-black/75 backdrop-blur-md'
      }`}
    >
      {requireGate && <CosmicSpaceBackdrop intense />}

      {/* 3D Floating Holographic Space Card */}
      <div className="relative z-10 w-full max-w-md my-auto cosmic-card-3d cosmic-float-slow rounded-[28px] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400" />

        {!requireGate && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-purple-100 transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-5 sm:p-6 space-y-4">
          {/* Orbiting Floating Emblem (5x tap secret Creator login) */}
          <div
            onClick={onBrandTap}
            className="flex flex-col items-center text-center gap-2.5 cursor-pointer select-none"
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div
                className="absolute -inset-2.5 rounded-full border border-cyan-400/40 pointer-events-none"
                style={{ transform: 'rotateX(68deg) rotateY(-14deg)' }}
              />
              <div
                className="absolute -inset-4 rounded-full border border-pink-500/25 pointer-events-none"
                style={{ transform: 'rotateX(68deg) rotateY(16deg)' }}
              />
              <img
                src="/covers/album-official.jpg"
                alt="LENKYX Cosmic Phonk"
                className="w-16 h-16 rounded-2xl object-cover border border-white/25 shadow-[0_0_32px_rgba(236,72,153,0.55)]"
              />
            </div>

            <div>
              <h1 className="font-display text-lg sm:text-xl font-black tracking-widest text-white">
                LENKYX <span className="neon-text">COSMIC PHONK</span>
              </h1>
              <p className="text-[11px] text-cyan-200/80 mt-0.5">
                {user
                  ? `Conectado como ${user.name}`
                  : 'Entre com sua conta ou cadastre-se grátis no universo musical'}
              </p>
            </div>
          </div>

          {/* MODE SWITCHER: ENTRAR | CRIAR CONTA | RECUPERAR */}
          {!user && (
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/[0.06] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setAuthError('');
                }}
                className={`py-2 rounded-xl text-[11px] font-extrabold transition ${
                  tab === 'login'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                Já tenho conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setAuthError('');
                }}
                className={`py-2 rounded-xl text-[11px] font-extrabold transition ${
                  tab === 'register'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                Criar Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('recover');
                  setAuthError('');
                }}
                className={`py-2 rounded-xl text-[11px] font-extrabold transition ${
                  tab === 'recover'
                    ? 'bg-white text-black shadow'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                Recuperar
              </button>
            </div>
          )}

          {authError && (
            <div className="rounded-xl bg-red-500/15 border border-red-400/50 px-3 py-2 text-[11px] text-red-200 font-semibold">
              {authError}
            </div>
          )}

          {/* === TAB 1: LOGIN (JÁ TENHO CONTA + DESBLOQUEIO DO CELULAR) === */}
          {!user && tab === 'login' && (
            <div className="space-y-3.5">
              {deviceAccount && (
                <div className="rounded-2xl bg-gradient-to-br from-cyan-500/15 via-purple-500/15 to-pink-500/15 border border-cyan-400/40 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${deviceAccount.avatarColor} flex items-center justify-center font-black text-white text-sm shrink-0`}
                    >
                      {deviceAccount.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> Conta detectada neste aparelho
                      </div>
                      <div className="text-sm font-black text-white truncate">{deviceAccount.name}</div>
                      <div className="text-[10px] text-purple-200/75 truncate">
                        {deviceAccount.phone || deviceAccount.email || 'Conta salva no celular'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDeviceBiometricUnlock()}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 shadow transition"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                      Entrar com Biometria, PIN ou Padrão do Celular
                    </button>
                    <button
                      type="button"
                      onClick={handleInstantDeviceEntry}
                      className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" /> Entrar direto (aparelho já autorizado)
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200/70 text-center">
                  {deviceAccount ? 'Ou entre com outra conta / outro número' : 'Entre com seu Celular ou E-mail'}
                </div>

                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-cyan-300/75 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Celular (WhatsApp/SMS) ou E-mail"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-pink-300/75 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-pink-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 text-purple-300 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setRecId(loginId);
                      setTab('recover');
                      setAuthError('');
                    }}
                    className="text-cyan-300 hover:underline font-semibold"
                  >
                    Esqueci minha senha (WhatsApp / SMS / E-mail)
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  Entrar na Minha Conta
                </button>
              </form>
            </div>
          )}

          {/* === TAB 2: REGISTER OR EDIT LOGGED-IN PROFILE === */}
          {(user || tab === 'register') && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-pink-300/75 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu Nome ou Apelido *"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-emerald-300/80 absolute left-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Celular / WhatsApp"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs sm:text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-cyan-300/80 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs sm:text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <p className="text-[10px] text-purple-200/70 -mt-1">
                Informe seu <strong>número de celular</strong>, seu <strong>e-mail</strong> ou ambos (para entrar e recuperar sua senha).
              </p>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-purple-300/80 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required={!user}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={user ? 'Nova senha (deixe vazio para manter)' : 'Crie uma senha (mín. 4 caracteres) *'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-pink-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 text-purple-300 hover:text-white"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Biometria / Senha / Padrão do Celular */}
              <label className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 cursor-pointer">
                <span className="flex items-center gap-2 text-[11px] text-cyan-200 font-semibold">
                  <Fingerprint className="w-4 h-4 text-cyan-300 shrink-0" />
                  Liberar entrada com biometria / senha / padrão do celular
                </span>
                <input
                  type="checkbox"
                  checked={deviceUnlockEnabled}
                  onChange={(e) => setDeviceUnlockEnabled(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded shrink-0"
                />
              </label>

              {/* Avatar color */}
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

              {/* Mandatory Terms */}
              <div
                className={`rounded-2xl border p-2.5 space-y-2 transition ${
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
                      <strong>1. Autoria Original LENKYX:</strong> Todas as músicas oficiais Cosmic Phonk, capas, visualizadores WebGL2 e código são criações autorais originais de LENKYX.
                    </p>
                    <p>
                      <strong>2. Fontes Públicas & Incorporações:</strong> Clipes, rádios e vídeos mundiais são reproduzidos diretamente de fontes/players públicos oficiais (YouTube Embed, Archive.org, streams abertos), sem pirataria ou hospedagem ilegal de terceiros.
                    </p>
                    <p>
                      <strong>3. Privacidade, Conteúdo da Comunidade & Canal DMCA (Safe Harbor):</strong> Dados de login servem apenas para sua conta e recuperação por WhatsApp/SMS/e-mail. Vídeos curtos e chats enviados por usuários são de responsabilidade dos autores, com canal rápido de revisão/remoção DMCA para proteger o site e os criadores.
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
                  <span className="text-[11px] text-purple-100/90 leading-snug">
                    Li e aceito os <strong>Termos de Uso e Privacidade</strong> do app LENKYX.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={busy}
                className={`w-full py-3 rounded-2xl font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition ${
                  acceptedTerms
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white'
                    : 'bg-white/15 text-purple-200/75 hover:bg-white/20'
                }`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {user ? 'Salvar Alterações' : 'Cadastrar & Decolar no Espaço'}
              </button>
            </form>
          )}

          {/* === TAB 3: RECOVER PASSWORD VIA WHATSAPP / SMS / EMAIL === */}
          {!user && tab === 'recover' && (
            <div className="space-y-3.5">
              {!recSent ? (
                <form onSubmit={handleRecoverRequest} className="space-y-3">
                  <p className="text-xs text-purple-200/85 leading-relaxed">
                    Digite seu <strong>WhatsApp / Número de Celular</strong> ou <strong>E-mail</strong> cadastrado para gerar um código de recuperação de 6 dígitos:
                  </p>
                  <div className="relative flex items-center">
                    <KeyRound className="w-4 h-4 text-cyan-300/80 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={recId}
                      onChange={(e) => setRecId(e.target.value)}
                      placeholder="Seu celular (com DDD) ou e-mail"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder-purple-300/45 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Gerar Código de Recuperação
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/40 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" /> Código pronto para {recSent.name || 'sua conta'}!
                    </div>
                    <p className="text-[11px] text-purple-100/85">
                      Envie seu código por <strong>WhatsApp</strong>, <strong>SMS</strong> ou <strong>E-mail</strong> (ou use o código{' '}
                      <span className="font-mono font-black text-cyan-300 bg-black/50 px-1.5 py-0.5 rounded">
                        {recSent.code}
                      </span>
                      ):
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => openRecoveryChannel('whatsapp')}
                        className="py-2 px-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => openRecoveryChannel('sms')}
                        className="py-2 px-2 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/40 text-cyan-200 text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => openRecoveryChannel('email')}
                        className="py-2 px-2 rounded-xl bg-pink-500/25 hover:bg-pink-500/40 border border-pink-400/40 text-pink-200 text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" /> E-mail
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleRecoverVerify} className="space-y-2.5">
                    <input
                      type="text"
                      required
                      value={recCodeInput}
                      onChange={(e) => setRecCodeInput(e.target.value)}
                      placeholder="Digite o código de 6 dígitos"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="password"
                      required
                      value={recNewPass}
                      onChange={(e) => setRecNewPass(e.target.value)}
                      placeholder="Digite sua nova senha (mín. 4 caracteres)"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white focus:outline-none focus:border-pink-400"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-400 text-white font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                      Salvar Nova Senha & Entrar
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Logged-in quick actions */}
          {user && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShare();
                }}
                className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Convidar Amigos
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogoutUser();
                  onClose();
                  onToast('Sessão encerrada. Na próxima entrada você pode usar a biometria ou senha!');
                }}
                className="py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-400/30 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair da Conta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

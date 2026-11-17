import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  ShieldCheck,
  CloudUpload,
  Download,
  QrCode,
  AlertTriangle,
  Check,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { AppSettings, Track } from '../types';
import { apiFetch, authFetch, setAuthToken } from '../utils/api';
import { copyTextReliable, downloadBlobReliable } from '../utils/androidBridge';

interface Props {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  hasCustomPassword: boolean;
  settings: AppSettings;
  onLoginSuccess: (token: string, hasCustomPassword: boolean) => void;
  onLogout: () => void;
  onPasswordChanged: (newToken: string) => void;
  onOpenPixConfig: () => void;
  onSyncedTracks?: (tracks: Track[]) => void;
  onToast: (msg: string) => void;
}

export const CreatorModal: React.FC<Props> = ({
  open,
  onClose,
  isAuthenticated,
  hasCustomPassword,
  settings,
  onLoginSuccess,
  onLogout,
  onPasswordChanged,
  onOpenPixConfig,
  onSyncedTracks,
  onToast,
}) => {
  const [tab, setTab] = useState<'security' | 'deploy'>('security');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncingSuno, setSyncingSuno] = useState(false);

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Senha incorreta.');
        return;
      }
      setAuthToken(data.token);
      setPassword('');
      onLoginSuccess(data.token, Boolean(data.hasCustomPassword));
      onToast('🔓 Bem-vindo, LENKYX! Modo Criador desbloqueado.');
      onClose();
    } catch {
      setError('Falha ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.trim().length < 6) {
      setError('A nova senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As novas senhas não conferem.');
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível alterar a senha.');
        return;
      }
      setAuthToken(data.token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onPasswordChanged(data.token);
      onToast('🔐 Senha do Criador atualizada com sucesso!');
    } catch {
      setError('Erro de conexão ao salvar nova senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSuno = async () => {
    setSyncingSuno(true);
    try {
      const res = await authFetch('/api/sync-suno', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        onToast(data.error || 'Erro ao sincronizar com o Suno.');
        return;
      }
      if (Array.isArray(data.tracks)) {
        onSyncedTracks?.(data.tracks);
      }
      onToast(
        `Suno sincronizado! ${data.addedCount || 0} novas faixas e ${data.updatedCount || 0} atualizadas (total ${data.totalFound || 0} na playlist).`
      );
    } catch {
      onToast('Erro de conexão ao sincronizar Suno.');
    } finally {
      setSyncingSuno(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await authFetch('/api/export-backup');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      await downloadBlobReliable(blob, `lenkyx-backup-${new Date().toISOString().slice(0, 10)}.json`);
      onToast('Backup completo do catálogo baixado!');
    } catch {
      onToast('Erro ao baixar backup.');
    }
  };

  const envSnippet = `ADMIN_PASSWORD=SuaSenhaForteAqui123\nDATA_DIR=/var/data/lenkyx/data\nSTORAGE_DIR=/var/data/lenkyx/storage`;

  const handleCopyEnv = async () => {
    const ok = await copyTextReliable(envSnippet);
    if (ok) {
      setCopiedEnv(true);
      onToast('Variáveis de ambiente copiadas!');
      setTimeout(() => setCopiedEnv(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel neon-border overflow-hidden my-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
                  isAuthenticated
                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                    : 'bg-gradient-to-br from-pink-500 to-purple-600 neon-glow-pink'
                }`}
              >
                {isAuthenticated ? <Unlock className="w-6 h-6 text-black" /> : <Lock className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-extrabold text-white">
                  {isAuthenticated ? 'PAINEL DO CRIADOR LENKYX' : 'ACESSO RESTRITO — CRIADOR'}
                </h2>
                <p className="text-xs text-purple-200/75">
                  {isAuthenticated
                    ? 'Apenas você com sua senha pode subir músicas, criar vídeos e editar o PIX.'
                    : 'Digite sua senha para liberar uploads, estúdio, vídeos e configuração do PIX.'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-purple-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {!hasCustomPassword && (
                <div className="rounded-2xl bg-cyan-500/12 border border-cyan-400/35 p-3.5 text-xs text-cyan-100 leading-relaxed">
                  <strong>Primeiro acesso:</strong> sua senha inicial de fábrica é{' '}
                  <code className="px-1.5 py-0.5 rounded bg-black/60 text-pink-300 font-bold">lenkyx2026</code>. Assim que
                  entrar, clique em <strong>Trocar Senha</strong> para criar a sua senha pessoal!
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">Senha do Criador LENKYX</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/55 border border-purple-500/40 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/40 text-xs font-bold text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Unlock className="w-4 h-4" /> {loading ? 'Verificando...' : 'Desbloquear Modo Criador'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Creator Panel Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/5">
                <button
                  onClick={() => setTab('security')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    tab === 'security'
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                      : 'text-purple-200/75 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> Senha & PIX
                </button>
                <button
                  onClick={() => setTab('deploy')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    tab === 'deploy'
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                      : 'text-purple-200/75 hover:text-white'
                  }`}
                >
                  <CloudUpload className="w-4 h-4" /> Publicar Online 24h
                </button>
              </div>

              {tab === 'security' ? (
                <div className="space-y-4">
                  {/* Status checklist */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div
                      className={`p-3 rounded-2xl border text-xs ${
                        hasCustomPassword
                          ? 'bg-emerald-500/12 border-emerald-400/35 text-emerald-200'
                          : 'bg-amber-500/12 border-amber-400/35 text-amber-200'
                      }`}
                    >
                      <div className="font-extrabold flex items-center gap-1.5">
                        {hasCustomPassword ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        Senha Pessoal
                      </div>
                      <div className="text-[11px] opacity-85 mt-0.5">
                        {hasCustomPassword ? 'Personalizada e ativa' : 'Ainda na padrão (troque abaixo!)'}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenPixConfig();
                      }}
                      className={`p-3 rounded-2xl border text-left text-xs transition hover:brightness-110 ${
                        settings.pixKeyConfigured
                          ? 'bg-emerald-500/12 border-emerald-400/35 text-emerald-200'
                          : 'bg-pink-500/15 border-pink-400/40 text-pink-200'
                      }`}
                    >
                      <div className="font-extrabold flex items-center gap-1.5">
                        <QrCode className="w-4 h-4" /> Chave PIX Real
                      </div>
                      <div className="text-[11px] opacity-85 mt-0.5">
                        {settings.pixKeyConfigured ? 'Configurada ✓' : 'Clique para configurar →'}
                      </div>
                    </button>
                  </div>

                  {/* Suno Live Sync */}
                  <button
                    type="button"
                    onClick={handleSyncSuno}
                    disabled={syncingSuno}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-purple-600/35 to-cyan-500/30 hover:brightness-110 border border-cyan-400/40 text-cyan-100 text-xs font-extrabold flex items-center justify-center gap-2 transition"
                  >
                    <RefreshCw className={`w-4 h-4 text-cyan-300 ${syncingSuno ? 'animate-spin' : ''}`} />
                    {syncingSuno
                      ? 'Sincronizando playlist @lenkyx no Suno...'
                      : 'Sincronizar Novas Músicas do Suno (@lenkyx)'}
                  </button>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-3 pt-2 border-t border-white/10">
                    <div className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                      Alterar Senha do Criador
                    </div>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={hasCustomPassword ? 'Senha atual' : 'Senha atual (lenkyx2026)'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-pink-500"
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nova senha (mín. 6)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar nova senha"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {error && (
                      <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-xs text-red-200 font-bold">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-4 h-4" /> {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
                    </button>
                  </form>

                  {/* Lock / Logout */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={handleDownloadBackup}
                      className="px-3.5 py-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-xs font-bold text-purple-100 flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-cyan-400" /> Backup Catálogo (.json)
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/35 border border-red-400/40 text-xs font-extrabold text-red-200 flex items-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" /> Bloquear / Sair
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs text-purple-100/90 leading-relaxed">
                  <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-500/35 space-y-2">
                    <div className="font-extrabold text-cyan-300 text-sm">
                      🚀 Seu App já está 100% pronto para ficar Online 24h!
                    </div>
                    <p>
                      Os arquivos <code className="text-pink-300">Dockerfile</code>,{' '}
                      <code className="text-pink-300">render.yaml</code>,{' '}
                      <code className="text-pink-300">railway.json</code> e o manual{' '}
                      <code className="text-pink-300">GUIA_PUBLICACAO_ONLINE.md</code> já estão na pasta do projeto.
                    </p>
                  </div>

                  <ol className="space-y-2 list-decimal list-inside text-purple-100">
                    <li>
                      Suba a pasta <code className="text-cyan-300">lenkyx-app</code> para um repositório privado no{' '}
                      <strong>GitHub</strong>.
                    </li>
                    <li>
                      Conecte no <strong>Render.com</strong> (usando o arquivo <code>render.yaml</code>) ou no{' '}
                      <strong>Railway.app</strong> (com 1 Volume persistente para guardar suas 1.000 músicas MP3).
                    </li>
                    <li>
                      Configure as variáveis de ambiente abaixo no painel da hospedagem:
                    </li>
                  </ol>

                  <div className="relative p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-300 whitespace-pre">
                    {envSnippet}
                    <button
                      onClick={handleCopyEnv}
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-sans font-bold flex items-center gap-1"
                    >
                      {copiedEnv ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedEnv ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>

                  <p className="text-[11px] text-purple-300/85">
                    Depois de publicado (ex.: <strong>https://lenkyx.onrender.com</strong> ou seu domínio próprio{' '}
                    <strong>lenkyx.com.br</strong>), qualquer pessoa que receber seu link no WhatsApp abre direto no{' '}
                    <strong>Modo Fã</strong> com player, mesa de DJ e seu QR Code PIX!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

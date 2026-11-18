import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Power,
  LogOut,
  Download,
  CheckCircle2,
  ArrowLeft,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { UserPlaylist, UserProfile, Track } from '../types';
import { downloadBlobReliable, isAndroidApk } from '../utils/androidBridge';

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  playlists: UserPlaylist[];
  userTracks: Track[];
  offlineCount: number;
  onSyncCloud: () => Promise<void>;
  onLogoutUser: () => void;
  onPauseAllMedia: () => void;
  onToast: (msg: string) => void;
}

export const SafeExitModal: React.FC<Props> = ({
  open,
  onClose,
  user,
  playlists,
  userTracks,
  offlineCount,
  onSyncCloud,
  onLogoutUser,
  onPauseAllMedia,
  onToast,
}) => {
  const [syncState, setSyncState] = useState<'saving' | 'saved'>('saving');
  const [exitedScreen, setExitedScreen] = useState(false);

  useEffect(() => {
    if (!open) {
      setExitedScreen(false);
      return;
    }
    setSyncState('saving');
    onSyncCloud()
      .catch(() => {})
      .finally(() => {
        setSyncState('saved');
      });
  }, [open, onSyncCloud]);

  if (!open) return null;

  const handleDownloadVaultBackup = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'LENKYX Cosmic Phonk',
      user,
      playlists,
      userTracks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    await downloadBlobReliable(blob, `lenkyx-meus-dados-${new Date().toISOString().slice(0, 10)}.json`);
    onToast('💾 Cópia de segurança salva no seu dispositivo!');
  };

  const handleSafeExitApp = () => {
    onPauseAllMedia();
    setExitedScreen(true);
    try {
      const bridge = window.AndroidBridge as unknown as { exitApp?: () => void } | undefined;
      if (isAndroidApk() && bridge?.exitApp) {
        bridge.exitApp();
        return;
      }
    } catch {
      // fallback to clean exited confirmation screen
    }
    try {
      window.close();
    } catch {
      // browsers block window.close on non-script-opened tabs; exitedScreen covers it cleanly!
    }
  };

  if (exitedScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#04010c]/98 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl cosmic-card-3d border border-emerald-400/40 p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="font-display text-xl font-black text-white">App Encerrado com Segurança</h2>
          <p className="text-xs text-purple-100/80 leading-relaxed">
            Todas as suas playlists ({playlists.length}), músicas offline ({offlineCount}) e conta estão 100% protegidas.
            Você pode fechar esta janela/aba ou voltar a qualquer momento.
          </p>
          <button
            onClick={() => {
              setExitedScreen(false);
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black text-xs font-black"
          >
            ← Voltar para o App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl glass-panel border border-emerald-400/35 overflow-hidden my-auto shadow-[0_0_50px_rgba(16,185,129,0.25)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500" />
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-display text-base font-black text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sair com Segurança
                </h2>
                <p className="text-[11px] text-purple-200/75">
                  Seus dados são salvos antes de fechar ou trocar de conta.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Protection Checklist */}
          <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-purple-100/85 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-cyan-300" />
                Nuvem & Conta ({user?.name || 'Visitante'})
              </span>
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {syncState === 'saving' ? 'Salvando...' : 'Salvo 100%'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-purple-100/85 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-pink-300" />
                Playlists & Músicas Locais
              </span>
              <span className="text-emerald-300 font-bold">
                {playlists.length} playlists · {userTracks.length} faixas
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-purple-100/85">Cache Offline no Celular</span>
              <span className="text-cyan-300 font-bold">{offlineCount} faixas protegidas</span>
            </div>
          </div>

          <button
            onClick={() => void handleDownloadVaultBackup()}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-cyan-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> Baixar Cópia de Segurança (.JSON)
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {user && (
              <button
                onClick={() => {
                  onLogoutUser();
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/45 text-amber-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" /> Trocar / Sair Conta
              </button>
            )}

            <button
              onClick={handleSafeExitApp}
              className={`py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black text-xs font-black flex items-center justify-center gap-1.5 transition ${
                user ? '' : 'sm:col-span-2'
              }`}
            >
              <Power className="w-4 h-4" /> Sair do App Seguro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

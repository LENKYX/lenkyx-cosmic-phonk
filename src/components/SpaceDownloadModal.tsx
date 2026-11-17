import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Rocket,
  Download,
  Sparkles,
  WifiOff,
  Lock,
  Music2,
  Globe2,
  QrCode,
  Share2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onOpenShare: () => void;
  onToast: (msg: string) => void;
}

export const SpaceDownloadModal: React.FC<Props> = ({
  open,
  onClose,
  settings,
  onOpenShare,
  onToast,
}) => {
  const [launching, setLaunching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [qrUrl, setQrUrl] = useState('');

  const apkUrl =
    (settings.apkDownloadUrl || '').trim() ||
    'https://lenkyx-cosmic-phonk.onrender.com/download/apk';

  useEffect(() => {
    if (!open) {
      setLaunching(false);
      setProgress(0);
      return;
    }
    QRCode.toDataURL(apkUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#070312', light: '#ffffff' },
    })
      .then(setQrUrl)
      .catch(() => {});
  }, [open, apkUrl]);

  if (!open) return null;

  const handleLaunchDownload = () => {
    setLaunching(true);
    setProgress(15);
    const t1 = window.setTimeout(() => setProgress(55), 250);
    const t2 = window.setTimeout(() => setProgress(100), 650);
    window.setTimeout(() => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (window.AndroidBridge?.openExternalUrl) {
        window.AndroidBridge.openExternalUrl(apkUrl);
      } else {
        window.open(apkUrl, '_blank', 'noopener,noreferrer');
      }
      onToast('🚀 Download cósmico do LENKYX Cosmic Phonk v2.0.5 iniciado!');
    }, 750);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl overflow-hidden border border-cyan-400/40 bg-[#070314] shadow-[0_0_80px_rgba(34,211,238,0.28)] my-auto">
        {/* Animated Starfield & Nebula Backdrop */}
        <div
          className="absolute inset-0 pointer-events-none opacity-65"
          style={{
            background:
              'radial-gradient(circle at 18% 15%, rgba(236,72,153,0.32), transparent 42%), radial-gradient(circle at 82% 20%, rgba(34,211,238,0.3), transparent 45%), radial-gradient(circle at 50% 90%, rgba(139,92,246,0.28), transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            backgroundImage:
              'radial-gradient(1.5px 1.5px at 20px 30px, #fff, transparent), radial-gradient(1px 1px at 90px 70px, #67e8f9, transparent), radial-gradient(1.5px 1.5px at 160px 120px, #f472b6, transparent), radial-gradient(1px 1px at 240px 45px, #fff, transparent)',
            backgroundSize: '260px 160px',
          }}
        />

        <div className="relative z-10 p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-2xl p-[2px] bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_25px_rgba(236,72,153,0.55)] shrink-0">
                <img
                  src="/covers/album-official.jpg"
                  alt="LENKYX Cosmic Phonk"
                  className="w-full h-full object-cover rounded-[14px]"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow">
                  <Rocket className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-[10px] font-black uppercase tracking-widest mb-1">
                  <Sparkles className="w-3 h-3" /> Portal Espacial Oficial · v2.1.3
                </div>
                <h2 className="font-display text-lg sm:text-xl font-black text-white leading-tight">
                  LENKYX <span className="neon-text">COSMIC PHONK</span> APP
                </h2>
                <p className="text-[11px] text-purple-200/80">
                  Instale a nave sonora no seu Android — 100% grátis, sem anúncios
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Galactic Features Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-extrabold mb-1">
                <Lock className="w-4 h-4" /> Tela de Bloqueio
              </div>
              <p className="text-[11px] text-purple-100/75 leading-snug">
                Música continua tocando com o celular bloqueado e troca de faixa na notificação.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-extrabold mb-1">
                <WifiOff className="w-4 h-4" /> Modo Offline Real
              </div>
              <p className="text-[11px] text-purple-100/75 leading-snug">
                Baixe suas faixas favoritas no aparelho e escute em qualquer lugar sem internet.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-pink-300 text-xs font-extrabold mb-1">
                <Globe2 className="w-4 h-4" /> Terra & Galáxia IA
              </div>
              <p className="text-[11px] text-purple-100/75 leading-snug">
                Sertanejo, Pop, Rock, Phonk de todas as gerações e sons cósmicos da NASA/Espaço.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold mb-1">
                <Music2 className="w-4 h-4" /> 100% Completas
              </div>
              <p className="text-[11px] text-purple-100/75 leading-snug">
                Zero prévias de 30s — faixas e playlists inteiras estilo Spotify gratuito.
              </p>
            </div>
          </div>

          {/* Cosmic Rocket Launch Download Area */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-cyan-950/80 border border-cyan-400/35 space-y-3">
            {launching && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-200">
                  <span className="flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5 animate-bounce text-pink-400" />
                    {progress >= 100
                      ? 'Propulsão concluída! Iniciando download do APK...'
                      : 'Preparando teletransporte do APK...'}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/50 overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleLaunchDownload}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 text-black font-display text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(34,211,238,0.45)] hover:brightness-110 active:scale-[0.99] transition"
            >
              <Download className="w-5 h-5" />
              BAIXAR APP ANDROID OFICIAL (APK v2.0.5)
              <Rocket className="w-4 h-4" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-purple-200/80">
              <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> APK Assinado & Seguro (~13.5 MB)
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" /> Android 7.0 ou superior
              </span>
            </div>
          </div>

          {/* QR Code for Mobile Scan + Share Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            {qrUrl && (
              <div className="p-2 rounded-2xl bg-white shadow-[0_0_24px_rgba(236,72,153,0.4)] shrink-0">
                <img src={qrUrl} alt="QR Code APK LENKYX" className="w-24 h-24 rounded-lg" />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-extrabold text-white">
                <QrCode className="w-4 h-4 text-cyan-300" /> Aponte a câmera do celular para baixar direto
              </div>
              <p className="text-[11px] text-purple-200/75 leading-relaxed">
                Quer mandar o app para seus amigos no WhatsApp, Instagram ou Telegram? Use nosso portal de divulgação cósmica!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenShare();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500/25 to-cyan-500/25 hover:from-pink-500/40 hover:to-cyan-500/40 border border-pink-400/40 text-xs font-extrabold text-white transition"
              >
                <Share2 className="w-3.5 h-3.5 text-pink-300" /> Compartilhar App & QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

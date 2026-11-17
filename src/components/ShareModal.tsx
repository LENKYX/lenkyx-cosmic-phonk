import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Globe,
  Sparkles,
  Smartphone,
  Send,
  QrCode,
  Megaphone,
  Rocket,
} from 'lucide-react';
import { AppSettings, Track, AppMode } from '../types';
import { copyTextReliable, isAndroidApk } from '../utils/androidBridge';

interface Props {
  open: boolean;
  onClose: () => void;
  track?: Track | null;
  settings: AppSettings;
  mode: AppMode;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onOpenSpaceDownload?: () => void;
  onToast: (msg: string) => void;
}

function isLocalHostUrl(url: string): boolean {
  if (!url) return true;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.)/i.test(url.trim());
}

export const ShareModal: React.FC<Props> = ({
  open,
  onClose,
  track,
  settings,
  mode,
  onSaveSettings,
  onOpenSpaceDownload,
  onToast,
}) => {
  const [includePixText, setIncludePixText] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);
  const [showQr, setShowQr] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [customUrl, setCustomUrl] = useState(settings.publicUrl || '');
  const [apkUrl, setApkUrl] = useState(settings.apkDownloadUrl || '');

  useEffect(() => {
    if (open) {
      setCustomUrl(settings.publicUrl || '');
      setApkUrl(settings.apkDownloadUrl || '');
    }
  }, [open, settings.publicUrl, settings.apkDownloadUrl]);

  const configuredSite = (customUrl || settings.publicUrl || '').trim().replace(/\/$/, '');
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const effectiveSiteBase =
    configuredSite && !isLocalHostUrl(configuredSite)
      ? configuredSite
      : !isAndroidApk() && !isLocalHostUrl(currentOrigin)
      ? currentOrigin.replace(/\/$/, '')
      : 'https://lenkyx-cosmic-phonk.onrender.com';

  const mainClickableLink = track
    ? `${effectiveSiteBase}/?track=${encodeURIComponent(track.id)}`
    : effectiveSiteBase;

  useEffect(() => {
    if (!open || !showQr) return;
    QRCode.toDataURL(mainClickableLink, {
      width: 240,
      margin: 2,
      color: { dark: '#090515', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [open, showQr, mainClickableLink]);

  if (!open) return null;

  const effectiveApkLink =
    (apkUrl || settings.apkDownloadUrl || '').trim() || `${effectiveSiteBase}/download/apk`;

  const lines: string[] = [];
  if (track) {
    lines.push(`🚀🔥 Ouça *${track.emoji} ${track.title}* — *${track.artist}* (${settings.brandSubtitle}) completo!`);
    lines.push(`🎧 Ouça agora (online ou offline no celular): ${mainClickableLink}`);
  } else {
    lines.push(
      `🌌🚀 Conheça o App Oficial *${settings.artistName} — ${settings.brandSubtitle}*! 20 faixas completas, modo offline no celular, playlists e Mesa de DJ!`
    );
    lines.push(`🎧 Acesse e ouça agora: ${mainClickableLink}`);
  }
  if (effectiveApkLink && !isLocalHostUrl(effectiveApkLink)) {
    lines.push(`📲 Baixar App Android (APK): ${effectiveApkLink}`);
  }
  if (includePixText) {
    lines.push(`💜 Curtiu o som? Apoie o projeto rumo às ${settings.totalGoal} músicas dentro do app!`);
  }
  lines.push(`🤝 Gostou? *Compartilhe com seus amigos também!* #LENKYX #CosmicPhonk #Phonk`);

  const message = lines.join('\n');
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(mainClickableLink)}&text=${encodeURIComponent(message)}`;
  const xTwitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    track ? `🚀 Ouça "${track.title}" de LENKYX — Cosmic Phonk completo!` : `🌌 Ouça o álbum oficial LENKYX — Cosmic Phonk (20 faixas completas)!`
  )}&url=${encodeURIComponent(mainClickableLink)}&hashtags=LENKYX,CosmicPhonk,Phonk`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mainClickableLink)}`;

  const handleCopyMessage = async () => {
    const ok = await copyTextReliable(message);
    if (ok) {
      setCopied(true);
      onToast('Mensagem de divulgação + link + hashtags copiados!');
      setTimeout(() => setCopied(false), 2200);
    } else {
      onToast('Copie o texto acima.');
    }
  };

  const handleCopyLinkOnly = async () => {
    const ok = await copyTextReliable(mainClickableLink);
    if (ok) {
      setCopiedBio(true);
      onToast('Link oficial copiado para Instagram Bio / TikTok / YouTube!');
      setTimeout(() => setCopiedBio(false), 2200);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: track ? `${track.title} — ${settings.artistName}` : `${settings.artistName} — Cosmic Phonk`,
          text: message,
          url: mainClickableLink,
        });
      } catch {
        // canceled
      }
    } else {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveLinks = async () => {
    await onSaveSettings({
      publicUrl: customUrl.trim(),
      apkDownloadUrl: apkUrl.trim(),
    });
    onToast('Links públicos de site e download do APK salvos!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-3 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-cyan-400/35 bg-[#080417] shadow-[0_0_70px_rgba(236,72,153,0.28)] overflow-hidden my-auto">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(circle at 15% 10%, rgba(236,72,153,0.28), transparent 45%), radial-gradient(circle at 85% 20%, rgba(34,211,238,0.25), transparent 45%)',
          }}
        />
        <div className="relative z-10 h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500" />
        <div className="relative z-10 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-400 p-[2px] shadow-[0_0_18px_rgba(34,211,238,0.4)] shrink-0">
                <div className="w-full h-full rounded-[14px] bg-[#090517] flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-cyan-300" />
                </div>
              </div>
              <div>
                <h2 className="font-display text-sm sm:text-base font-black text-white">
                  {track ? `DIVULGAR: ${track.title}` : 'PORTAL CÓSMICO DE DIVULGAÇÃO'}
                </h2>
                <p className="text-[11px] text-purple-200/80">
                  Compartilhe na galáxia: WhatsApp, Instagram, TikTok, Telegram & QR
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-purple-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Link Direto (Bio Instagram / TikTok / YouTube) + QR Code */}
          <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                Link Oficial (Bio Instagram · TikTok · YouTube)
              </span>
              <button
                onClick={() => setShowQr((v) => !v)}
                className="px-2.5 py-0.5 rounded-full bg-pink-500/20 hover:bg-pink-500/35 text-pink-200 text-[10px] font-bold flex items-center gap-1"
              >
                <QrCode className="w-3 h-3" /> {showQr ? 'Ocultar QR' : 'Ver QR'}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={mainClickableLink}
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/55 border border-white/10 text-[11px] text-cyan-200 font-mono truncate"
              />
              <button
                onClick={handleCopyLinkOnly}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-black text-[11px] font-black shrink-0 flex items-center gap-1"
              >
                {copiedBio ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedBio ? 'Copiado' : 'Link'}
              </button>
            </div>
            {showQr && qrDataUrl && (
              <div className="pt-1 flex flex-col items-center gap-1.5">
                <div className="p-2 rounded-2xl bg-white shadow-[0_0_30px_rgba(34,211,238,0.45)]">
                  <img src={qrDataUrl} alt="QR Code LENKYX" className="w-32 h-32 rounded-lg" />
                </div>
                <span className="text-[10px] text-cyan-200/80 font-semibold">
                  ✨ Escaneie para abrir o som direto no celular!
                </span>
              </div>
            )}
          </div>

          {onOpenSpaceDownload && !isAndroidApk() && (
            <button
              onClick={() => {
                onClose();
                onOpenSpaceDownload();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-cyan-500/30 hover:brightness-110 border border-cyan-400/40 text-xs font-extrabold text-white flex items-center justify-center gap-2 transition"
            >
              <Rocket className="w-4 h-4 text-cyan-300" /> Abrir Portal Espacial de Download (APK)
            </button>
          )}

          {/* Unified Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-purple-200">Texto pronto com hashtags & link clicável</span>
              <label className="flex items-center gap-1.5 text-[11px] text-cyan-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePixText}
                  onChange={(e) => setIncludePixText(e.target.checked)}
                  className="accent-pink-500"
                />
                Incluir PIX
              </label>
            </div>
            <div className="p-3 rounded-xl bg-[#0b1f17] border border-emerald-500/30 text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed break-words max-h-36 overflow-y-auto">
              {message}
            </div>
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <button
              onClick={handleCopyMessage}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Tudo'}
            </button>
          </div>

          {/* Multi-Platform Auto-Share Bar */}
          <div className="grid grid-cols-3 gap-1.5">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/35 text-sky-200 text-[11px] font-bold flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Telegram
            </a>
            <a
              href={xTwitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-bold flex items-center justify-center gap-1"
            >
              𝕏 Postar
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 border border-blue-400/35 text-blue-200 text-[11px] font-bold flex items-center justify-center gap-1"
            >
              Facebook
            </a>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500/30 to-purple-600/30 hover:brightness-110 border border-pink-400/40 text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Enviar no Instagram Stories / TikTok / Status
            </button>
          )}

          {mode === 'creator' && (
            <div className="pt-2.5 border-t border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Configurar links oficiais (Site + Download APK)
              </div>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Link do Site Online (ex: https://lenkyx-cosmic-phonk.onrender.com)"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Smartphone className="w-3.5 h-3.5 text-purple-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={apkUrl}
                    onChange={(e) => setApkUrl(e.target.value)}
                    placeholder="Link pra baixar APK (ex: Google Drive)"
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-black/50 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
                <button
                  onClick={handleSaveLinks}
                  className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/35 text-cyan-200 text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

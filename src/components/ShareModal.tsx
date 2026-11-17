import React, { useEffect, useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Globe, Sparkles, Smartphone, AlertTriangle } from 'lucide-react';
import { AppSettings, Track, AppMode } from '../types';
import { copyTextReliable, isAndroidApk } from '../utils/androidBridge';

interface Props {
  open: boolean;
  onClose: () => void;
  track?: Track | null;
  settings: AppSettings;
  mode: AppMode;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onToast: (msg: string) => void;
}

function isLocalHostUrl(url: string): boolean {
  if (!url) return true;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.)/i.test(url.trim());
}

export const ShareModal: React.FC<Props> = ({ open, onClose, track, settings, mode, onSaveSettings, onToast }) => {
  const [includePixText, setIncludePixText] = useState(true);
  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState(settings.publicUrl || '');
  const [apkUrl, setApkUrl] = useState(settings.apkDownloadUrl || '');

  useEffect(() => {
    if (open) {
      setCustomUrl(settings.publicUrl || '');
      setApkUrl(settings.apkDownloadUrl || '');
    }
  }, [open, settings.publicUrl, settings.apkDownloadUrl]);

  if (!open) return null;

  const configuredSite = (customUrl || settings.publicUrl || '').trim().replace(/\/$/, '');
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const hasRealPublicSite = Boolean(configuredSite && !isLocalHostUrl(configuredSite)) || (!isAndroidApk() && !isLocalHostUrl(currentOrigin));

  const effectiveSiteBase =
    configuredSite && !isLocalHostUrl(configuredSite)
      ? configuredSite
      : !isAndroidApk() && !isLocalHostUrl(currentOrigin)
      ? currentOrigin.replace(/\/$/, '')
      : '';

  const fallbackSunoLink = track?.sunoUrl || track?.externalUrl || settings.sunoProfileUrl || 'https://suno.com/@lenkyx';
  const mainClickableLink = effectiveSiteBase
    ? track
      ? `${effectiveSiteBase}/?mode=fan&track=${encodeURIComponent(track.id)}`
      : `${effectiveSiteBase}/?mode=fan`
    : fallbackSunoLink;

  const effectiveApkLink = (apkUrl || settings.apkDownloadUrl || '').trim() || (effectiveSiteBase ? `${effectiveSiteBase}/download/apk` : '');

  // MENSAGEM UNIFICADA (texto + link clicável juntos no mesmo bloco, já pedindo pra compartilhar com amigos!)
  const lines: string[] = [];
  if (track) {
    lines.push(`🚀🔥 Ouça *${track.emoji} ${track.title}* — *${track.artist}* (${settings.brandSubtitle})!`);
    lines.push(`🎧 Acesse e ouça agora: ${mainClickableLink}`);
  } else {
    lines.push(`🌌🚀 Conheça a plataforma *${settings.artistName} — ${settings.brandSubtitle}*! Ouça minhas músicas originais, explore sons do mundo todo, monte sua playlist e mixe na Mesa de DJ!`);
    lines.push(`🎧 Acesse e ouça agora: ${mainClickableLink}`);
  }
  if (effectiveApkLink && !isLocalHostUrl(effectiveApkLink)) {
    lines.push(`📲 Baixar o App Android (APK): ${effectiveApkLink}`);
  }
  if (includePixText) {
    lines.push(`💜 Curtiu o som? Apoie o projeto rumo às ${settings.totalGoal} músicas pelo PIX dentro do app!`);
  }
  lines.push(`🤝 Gostou? *Compartilhe esta mensagem com seus amigos também!*`);

  const message = lines.join('\n');
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const handleCopyMessage = async () => {
    const ok = await copyTextReliable(message);
    if (ok) {
      setCopied(true);
      onToast('Mensagem completa + link clicável copiados!');
      setTimeout(() => setCopied(false), 2200);
    } else {
      onToast('Copie o texto acima.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: track ? `${track.title} — ${settings.artistName}` : `${settings.artistName} — Cosmic Phonk`,
          text: message,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl glass-panel neon-border overflow-hidden my-auto">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500" />
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display text-sm sm:text-base font-extrabold text-white">
                  {track ? `DIVULGAR: ${track.title}` : 'COMPARTILHAR NO WHATSAPP'}
                </h2>
                <p className="text-[11px] text-purple-200/75">Mensagem e link unificados num único bloco clicável</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-purple-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!hasRealPublicSite && (
            <div className="rounded-xl bg-emerald-500/12 border border-emerald-400/35 p-2.5 text-[11px] text-emerald-100 leading-relaxed flex gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <strong>Links públicos reais ativos!</strong> Sua mensagem já sai com o link público oficial das suas
                músicas (<strong>Suno @lenkyx</strong>) + o <strong>link público de download do App Android (APK)</strong>{' '}
                para qualquer amigo abrir e baixar no celular! Quando subir o site no Render, basta colar a URL abaixo.
              </div>
            </div>
          )}

          {/* Unified Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-purple-200">Prévia exata da mensagem no WhatsApp</span>
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
            <div className="p-3 rounded-xl bg-[#0b1f17] border border-emerald-500/30 text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed break-words">
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
              <MessageCircle className="w-4 h-4" /> Abrir no WhatsApp
            </a>
            <button
              onClick={handleCopyMessage}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Tudo'}
            </button>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-400/30 text-purple-100 text-[11px] font-bold flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Enviar por outros apps (Instagram, Telegram, SMS)
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
                placeholder="Link do Site Online (ex: https://lenkyx.onrender.com)"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Smartphone className="w-3.5 h-3.5 text-purple-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={apkUrl}
                    onChange={(e) => setApkUrl(e.target.value)}
                    placeholder="Link pra baixar APK (ex: link público do Google Drive)"
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

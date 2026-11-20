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
  Flame,
  TrendingUp,
  Mail,
  Zap,
} from 'lucide-react';
import { AppSettings, Track, AppMode, LiveStats } from '../types';
import { copyTextReliable, isAndroidApk } from '../utils/androidBridge';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';

interface Props {
  open: boolean;
  onClose: () => void;
  track?: Track | null;
  settings: AppSettings;
  mode: AppMode;
  liveStats?: LiveStats | null;
  onStatsUpdate?: (next: LiveStats) => void;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onOpenInstallApp?: () => void;
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
  liveStats,
  onStatsUpdate,
  onSaveSettings,
  onOpenInstallApp,
  onToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
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

  // Clean direct app link (opens instant download/install on PC, Smart TV, or ANY cell phone)
  const mainClickableLink = track
    ? `${effectiveSiteBase}/?track=${encodeURIComponent(track.id)}`
    : `${effectiveSiteBase}/app`;

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

  const trackSharePopularity = async (channel: string) => {
    try {
      const res = await fetch('/api/live-stats/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      if (res.ok) {
        const data = await res.json();
        onStatsUpdate?.(data);
      }
    } catch {
      // ignore offline
    }
  };

  // Invite message focused on growing MORRO GOLD in Brazil
  const appTitle = track
    ? `Ouça "${track.title}" grátis no MORRO GOLD 💎!`
    : 'Conheça o MORRO GOLD 💎 — Músicas, Bailes ao Vivo, Loja dos Cria & Clipes HD grátis!';
  const shareMessage = `${appTitle} 🇧🇷🎄\n${mainClickableLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(mainClickableLink)}&text=${encodeURIComponent(appTitle)}`;
  const xTwitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(appTitle)}&url=${encodeURIComponent(mainClickableLink)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mainClickableLink)}`;
  const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(mainClickableLink)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(mainClickableLink)}`;
  const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(mainClickableLink)}&title=${encodeURIComponent(appTitle)}`;
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(mainClickableLink)}&description=${encodeURIComponent(appTitle)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(appTitle)}&body=${encodeURIComponent(mainClickableLink)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(mainClickableLink)}`;

  const handleCopyLinkOnly = async () => {
    const ok = await copyTextReliable(mainClickableLink);
    void trackSharePopularity('copy_link');
    if (ok) {
      setCopiedLink(true);
      onToast('Link direto do App copiado! 🚀');
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleSocialLaunch = async (channel: string, url: string, copyFirst = false, notice?: string) => {
    void trackSharePopularity(channel);
    if (copyFirst) {
      await copyTextReliable(mainClickableLink);
    }
    if (notice) onToast(notice);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    void trackSharePopularity('native_all');
    if (navigator.share) {
      try {
        await navigator.share({
          title: appTitle,
          url: mainClickableLink,
        });
        onToast('App enviado automaticamente! Popularidade subiu 🔥');
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
    onToast('Links públicos atualizados!');
  };

  const score = Number(liveStats?.popularityScore || 480);
  const shares = Number(liveStats?.totalShares || 18);
  const visits = Number(liveStats?.totalVisits || 120);
  const level = liveStats?.popularityLevel || 'Em Alta';
  const nextMilestone = score < 150 ? 150 : score < 700 ? 700 : score < 2000 ? 2000 : 5000;
  const pct = Math.min(100, Math.round((score / nextMilestone) * 100));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-3 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-cyan-400/35 bg-[#080417] shadow-[0_0_70px_rgba(236,72,153,0.28)] overflow-hidden my-auto max-h-[92vh] overflow-y-auto"
      >
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
            <div className="flex items-center gap-3">
              <LenkyxEdgeLogo size="md" className="shrink-0" />
              <div>
                <div className="text-[10px] font-black text-emerald-300 flex items-center gap-1">
                  🇧🇷 CRESCIMENTO BRASIL · 100% GRATUITO
                </div>
                <h2 className="font-display text-sm sm:text-base font-black text-white">
                  {track ? `DIVULGAR: ${track.title}` : 'TRAZER AMIGOS PRO MORRO GOLD 💎'}
                </h2>
                <p className="text-[11px] text-amber-200/90">
                  Compartilhe no WhatsApp, Status e Grupos — baixa em 1 clique no Celular e PC!
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-purple-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* LIVE APP POPULARITY METER */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-500/15 via-pink-500/15 to-cyan-500/15 border border-orange-400/35 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-xs font-black text-white">Popularidade: {level}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-400/20 text-orange-200 text-[10px] font-black flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {score.toLocaleString('pt-BR')} pts
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-purple-100/85 font-semibold">
              <span>🚀 {shares.toLocaleString('pt-BR')} envios</span>
              <span>👀 {visits.toLocaleString('pt-BR')} acessos</span>
              <span>Meta: {nextMilestone.toLocaleString('pt-BR')} pts</span>
            </div>
          </div>

          {/* AUTOMATIC 1-CLICK APP SHARE */}
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(236,72,153,0.45)] transition active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" /> Enviar Somente o App Agora (Automático)
          </button>

          {/* ALL SOCIAL NETWORKS GRID — CLEAN LINK ONLY */}
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 mb-1.5">
              Enviar Direto Sem Textos (1 Toque)
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => handleSocialLaunch('whatsapp', whatsappUrl)}
                className="py-2 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={() =>
                  handleSocialLaunch(
                    'instagram',
                    'https://www.instagram.com/',
                    true,
                    'Link do App copiado! Cole no Direct ou Bio do Instagram 📸'
                  )
                }
                className="py-2 px-2 rounded-xl bg-gradient-to-r from-pink-500/25 to-amber-500/25 hover:brightness-125 border border-pink-400/40 text-pink-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                📸 Instagram
              </button>
              <button
                onClick={() =>
                  handleSocialLaunch(
                    'tiktok',
                    'https://www.tiktok.com/',
                    true,
                    'Link do App copiado! Cole no TikTok 🎵'
                  )
                }
                className="py-2 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                🎵 TikTok
              </button>
              <button
                onClick={() => handleSocialLaunch('facebook', facebookUrl)}
                className="py-2 px-2 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 border border-blue-400/40 text-blue-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                📘 Facebook
              </button>
              <button
                onClick={() => handleSocialLaunch('telegram', telegramUrl)}
                className="py-2 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                <Send className="w-3 h-3" /> Telegram
              </button>
              <button
                onClick={() => handleSocialLaunch('x_twitter', xTwitterUrl)}
                className="py-2 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold flex items-center justify-center gap-1"
              >
                𝕏 Postar
              </button>
              <button
                onClick={() => handleSocialLaunch('threads', threadsUrl)}
                className="py-2 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/35 text-purple-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                🧵 Threads
              </button>
              <button
                onClick={() => handleSocialLaunch('linkedin', linkedinUrl)}
                className="py-2 px-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/35 border border-blue-400/35 text-blue-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                💼 LinkedIn
              </button>
              <button
                onClick={() => handleSocialLaunch('reddit', redditUrl)}
                className="py-2 px-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/35 border border-orange-400/35 text-orange-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                👽 Reddit
              </button>
              <button
                onClick={() => handleSocialLaunch('pinterest', pinterestUrl)}
                className="py-2 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/35 text-rose-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                📌 Pinterest
              </button>
              <button
                onClick={() => handleSocialLaunch('sms', smsUrl)}
                className="py-2 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                💬 SMS
              </button>
              <button
                onClick={() => handleSocialLaunch('email', emailUrl)}
                className="py-2 px-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/35 text-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1"
              >
                <Mail className="w-3 h-3" /> E-mail
              </button>
            </div>
          </div>

          {/* Link Direto + QR Code */}
          <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                Link do App + QR Code
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
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            {showQr && qrDataUrl && (
              <div className="pt-1 flex flex-col items-center gap-1.5">
                <div className="p-2 rounded-2xl bg-white shadow-[0_0_30px_rgba(34,211,238,0.45)]">
                  <img src={qrDataUrl} alt="QR Code LENKYX" className="w-28 h-28 rounded-lg" />
                </div>
                <span className="text-[10px] text-cyan-200/80 font-semibold">
                  ✨ Aponte a câmera (PC, TV ou qualquer celular) — baixa sem restrições!
                </span>
              </div>
            )}
          </div>

          {onOpenInstallApp && !isAndroidApk() && (
            <button
              onClick={() => {
                onClose();
                onOpenInstallApp();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-cyan-500/25 to-purple-500/25 hover:brightness-110 border border-emerald-400/40 text-xs font-extrabold text-white flex items-center justify-center gap-2 transition"
            >
              <Zap className="w-4 h-4 text-emerald-300" /> Baixar no Android, iPhone, PC ou Smart TV (Verificado ✓)
            </button>
          )}

          {mode === 'creator' && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Links oficiais (Site + Download)
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
                    type="text"
                    value={apkUrl}
                    onChange={(e) => setApkUrl(e.target.value)}
                    placeholder="/download/apk"
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

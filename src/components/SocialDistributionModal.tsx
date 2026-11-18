import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowLeft,
  Globe2,
  Share2,
  Send,
  Copy,
  Check,
  Sparkles,
  Rss,
  Webhook,
  Rocket,
  Smartphone,
} from 'lucide-react';
import { AppMode, AppSettings, Track } from '../types';
import { authFetch } from '../utils/api';
import { copyTextReliable } from '../utils/androidBridge';

interface Props {
  open: boolean;
  onClose: () => void;
  track?: Track | null;
  settings: AppSettings;
  mode: AppMode;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onToast: (msg: string) => void;
}

export const SocialDistributionModal: React.FC<Props> = ({
  open,
  onClose,
  track,
  settings,
  mode,
  onSaveSettings,
  onToast,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(settings.socialWebhookUrl || '');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    if (open) setWebhookUrl(settings.socialWebhookUrl || '');
  }, [open, settings.socialWebhookUrl]);

  if (!open) return null;

  const baseUrl = (
    settings.publicUrl && !/localhost|127\.0\.0\.1/.test(settings.publicUrl)
      ? settings.publicUrl
      : 'https://lenkyx-cosmic-phonk.onrender.com'
  ).replace(/\/$/, '');

  const targetUrl = track ? `${baseUrl}/?track=${encodeURIComponent(track.id)}` : baseUrl;
  const rssUrl = `${baseUrl}/api/feed.xml`;
  const jsonFeedUrl = `${baseUrl}/api/releases.json`;

  const titleText = track
    ? `🚀 ${track.title} — ${track.artist} | ${settings.brandSubtitle}`
    : `🌌 ${settings.artistName} — ${settings.brandSubtitle} | Músicas, Filmes, Séries, TV & Reels`;

  const viralCaption = track
    ? `🔥 NOVO SOM NO AR! Ouça "${track.title}" de ${track.artist} completo e grátis no App Oficial LENKYX (Celular, PC e Smart TV): ${targetUrl}\n\n📲 Baixe o App: ${baseUrl}/app\n#LENKYX #CosmicPhonk #Phonk #MusicaBrasileira #Viral #Reels #TikTok #Shorts`
    : `🌌🚀 Chegou o Super App Mundial ${settings.artistName} — ${settings.brandSubtitle}! Músicas estilo Spotify/YT Music, 300+ Filmes & Séries estilo Netflix+, TV ao vivo, Vídeos Curtos & Galáxia 3D para qualquer celular do mundo!\n\n🎧 Acesse agora: ${baseUrl}\n📲 App Android: ${baseUrl}/app\n📺 Smart TV: ${baseUrl}/tv\n#LENKYX #CosmicPhonk #Streaming #Musica #Cinema #Phonk #Brasil #Global`;

  const copyItem = async (text: string, key: string, msg: string) => {
    const ok = await copyTextReliable(text);
    if (ok) {
      setCopiedKey(key);
      onToast(msg);
      setTimeout(() => setCopiedKey(''), 2000);
    }
  };

  const handleMobileNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: titleText,
          text: viralCaption,
          url: targetUrl,
        });
        onToast('🚀 Compartilhado com sucesso no seu celular!');
      } catch {
        // user canceled
      }
    } else {
      await copyItem(viralCaption, 'caption', 'Legenda + links copiados para colar nas redes!');
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      await onSaveSettings({ socialWebhookUrl: webhookUrl.trim() });
      onToast('✅ Webhook de Auto-Publicação salvo!');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTriggerAutoPublish = async () => {
    setDispatching(true);
    try {
      const res = await authFetch('/api/social/auto-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleText,
          caption: viralCaption,
          url: targetUrl,
          coverUrl: track?.coverUrl || `${baseUrl}/covers/album-official.jpg`,
          platforms: ['instagram', 'youtube', 'tiktok', 'facebook', 'x'],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.dispatched) {
        onToast('🤖 Payload enviado automaticamente ao seu Webhook Oficial (Make/Zapier/n8n)!');
      } else {
        onToast(
          data.message ||
            'Feed RSS/JSON atualizado! Use o botão "Publicar do Celular" ou conecte seu Webhook Zapier/Make abaixo.'
        );
      }
    } finally {
      setDispatching(false);
    }
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      color: 'from-emerald-500 to-green-600',
      href: `https://wa.me/?text=${encodeURIComponent(viralCaption)}`,
    },
    {
      name: 'Telegram',
      color: 'from-sky-400 to-blue-600',
      href: `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(viralCaption)}`,
    },
    {
      name: 'Facebook',
      color: 'from-blue-600 to-indigo-700',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`,
    },
    {
      name: 'X / Twitter',
      color: 'from-zinc-700 to-black',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(titleText)}&url=${encodeURIComponent(targetUrl)}&hashtags=LENKYX,CosmicPhonk,Phonk`,
    },
    {
      name: 'LinkedIn',
      color: 'from-blue-700 to-cyan-700',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`,
    },
    {
      name: 'Reddit',
      color: 'from-orange-500 to-red-600',
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(titleText)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl glass-panel border border-cyan-400/35 overflow-hidden my-auto shadow-[0_0_60px_rgba(34,211,238,0.25)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />
        <div className="p-5 sm:p-6 space-y-4">
          {/* Header with Back & Close */}
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
                <h2 className="font-display text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-cyan-300" />
                  Distribuição Global & Auto-Publicação Oficial
                </h2>
                <p className="text-[11px] text-purple-200/80">
                  Conecte em qualquer celular do mundo e distribua oficialmente para Instagram, YouTube, TikTok, Facebook e X.
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

          {/* 1-Tap Mobile Share (Instagram / TikTok / YouTube / WhatsApp) */}
          <div className="rounded-2xl bg-gradient-to-br from-pink-500/15 via-purple-600/15 to-cyan-500/15 border border-pink-400/35 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-300" />
                Publicar Direto do Celular (Instagram, TikTok, YouTube, Reels)
              </div>
              <button
                onClick={() => void handleMobileNativeShare()}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black flex items-center gap-1.5 shadow hover:brightness-110 transition"
              >
                <Share2 className="w-3.5 h-3.5" /> Abrir Menu de Redes do Celular
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3 py-2 rounded-xl bg-gradient-to-r ${s.color} text-white text-xs font-black flex items-center justify-center gap-1.5 hover:brightness-110 transition shadow`}
                >
                  <Send className="w-3.5 h-3.5" /> {s.name}
                </a>
              ))}
            </div>
          </div>

          {/* Copy Viral Caption & Global Links */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Legenda Viral + Hashtags (Instagram / TikTok / Shorts)
              </span>
              <button
                onClick={() => void copyItem(viralCaption, 'caption', 'Legenda + hashtags copiadas!')}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1"
              >
                {copiedKey === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'caption' ? 'Copiado!' : 'Copiar Legenda'}
              </button>
            </div>
            <textarea
              readOnly
              rows={3}
              value={viralCaption}
              className="w-full rounded-xl bg-black/45 border border-white/10 p-2.5 text-[11px] text-purple-100/90 focus:outline-none"
            />
          </div>

          {/* RSS / JSON Syndication + Official Webhook Auto-Publisher */}
          <div className="rounded-2xl bg-white/[0.04] border border-cyan-400/25 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <Rss className="w-4 h-4 text-amber-400" /> Feeds Automáticos Globais (Make / Zapier / IFTTT / Buffer)
              </div>
              <button
                onClick={() => void handleTriggerAutoPublish()}
                disabled={dispatching}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] font-black flex items-center gap-1 hover:brightness-110 transition"
              >
                <Rocket className="w-3.5 h-3.5" />
                {dispatching ? 'Enviando...' : 'Disparar Auto-Publicação'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => void copyItem(rssUrl, 'rss', 'Feed RSS copiado! Cole no Zapier/Make/IFTTT para auto-post.')}
                className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 hover:border-cyan-400/50 text-left flex items-center justify-between gap-2"
              >
                <span className="truncate text-cyan-200">📡 RSS: {rssUrl}</span>
                {copiedKey === 'rss' ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-purple-300 shrink-0" />}
              </button>
              <button
                onClick={() => void copyItem(jsonFeedUrl, 'json', 'Feed JSON copiado!')}
                className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 hover:border-cyan-400/50 text-left flex items-center justify-between gap-2"
              >
                <span className="truncate text-emerald-200">🧬 JSON: {jsonFeedUrl}</span>
                {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-purple-300 shrink-0" />}
              </button>
            </div>

            {mode === 'creator' && (
              <form onSubmit={(e) => void handleSaveWebhook(e)} className="pt-2 border-t border-white/10 space-y-2">
                <label className="text-[11px] font-bold text-purple-200 flex items-center gap-1.5">
                  <Webhook className="w-3.5 h-3.5 text-pink-400" />
                  Webhook Oficial de Auto-Postagem (Zapier, Make.com, n8n ou API Meta/YouTube):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hook.us1.make.com/... ou https://hooks.zapier.com/..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={savingWebhook}
                    className="px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-black shrink-0"
                  >
                    {savingWebhook ? '...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

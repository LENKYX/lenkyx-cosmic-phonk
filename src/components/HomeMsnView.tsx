import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Grid3x3,
  Cloud,
  CloudSun,
  Sun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Wind,
  X,
  Check,
  Sparkles,
  Music4,
  Film,
  Radio,
  ShoppingBag,
  HeartHandshake,
  Wrench,
  Newspaper,
  Trophy,
  TrendingUp,
  Gamepad2,
} from 'lucide-react';

/**
 * 🏠 INÍCIO MORRO GOLD — formato MSN da Microsoft, estilo 24k!
 * Busca web no topo · clima real de Campo Grande · abas · feed de cards ·
 * Meus Canais (feed personalizado) · aparência do feed · launcher de apps.
 */

interface Props {
  onNavigateTab: (id: string) => void;
  tracks?: { id: string; title: string; artist?: string; coverUrl?: string }[];
}

type Topic = { id: string; label: string };
type NewsItem = { title: string; link: string; source: string };

const TOPICS: Topic[] = [
  { id: 'musica', label: '🎵 Música' },
  { id: 'memes', label: '😂 Memes & Zueira' },
  { id: 'esportes', label: '⚽ Esportes' },
  { id: 'famosos', label: '🌟 Famosos' },
  { id: 'economia', label: '💰 Economia' },
  { id: 'tecnologia', label: '💻 Tecnologia' },
  { id: 'fitness', label: '💪 Fitness' },
  { id: 'bebidas', label: '🍹 Bebidas & Rolê' },
];

const CATEGORIES = [
  { id: 'descobrir', label: '✨ Descobrir' },
  { id: 'noticias', label: '📰 Notícias' },
  { id: 'esportes', label: '⚽ Esportes' },
  { id: 'vibe', label: '🎬 Vibe' },
  { id: 'musica', label: '🎵 Música' },
  { id: 'clima', label: '🌤️ Clima' },
  { id: 'compras', label: '🛍️ Compras' },
];

const APPS: { id: string; label: string; icon: React.ReactNode; tab: string }[] = [
  { id: 'vibe', label: 'Vibe', icon: <Film className="w-5 h-5" />, tab: 'reels' },
  { id: 'radio', label: 'Rádio do Morro', icon: <Radio className="w-5 h-5" />, tab: 'radio' },
  { id: 'loja', label: 'Loja dos Cria', icon: <ShoppingBag className="w-5 h-5" />, tab: 'loja' },
  { id: 'doacoes', label: 'Doações', icon: <HeartHandshake className="w-5 h-5" />, tab: 'doacoes' },
  { id: 'utils', label: 'Utilidades', icon: <Wrench className="w-5 h-5" />, tab: 'utils' },
  { id: 'membros', label: 'Membros', icon: <Sparkles className="w-5 h-5" />, tab: 'membros' },
];

const FOLLOW_KEY = 'mg_home_channels_v1';
const LOOK_KEY = 'mg_home_look_v1';

const WMO: Record<number, { icon: React.ReactNode; txt: string }> = {
  0: { icon: <Sun className="w-7 h-7 text-amber-300" />, txt: 'Céu limpo' },
  1: { icon: <CloudSun className="w-7 h-7 text-amber-200" />, txt: 'Poucas nuvens' },
  2: { icon: <CloudSun className="w-7 h-7 text-amber-200" />, txt: 'Parcialmente nublado' },
  3: { icon: <Cloud className="w-7 h-7 text-slate-200" />, txt: 'Nublado' },
  45: { icon: <Cloud className="w-7 h-7 text-slate-300" />, txt: 'Nevoeiro' },
  48: { icon: <Wind className="w-7 h-7 text-slate-300" />, txt: 'Nevoeiro gelado' },
  51: { icon: <CloudDrizzle className="w-7 h-7 text-cyan-200" />, txt: 'Garoa fraca' },
  53: { icon: <CloudDrizzle className="w-7 h-7 text-cyan-200" />, txt: 'Garoa' },
  55: { icon: <CloudDrizzle className="w-7 h-7 text-cyan-300" />, txt: 'Garoa forte' },
  61: { icon: <CloudRain className="w-7 h-7 text-cyan-200" />, txt: 'Chuva fraca' },
  63: { icon: <CloudRain className="w-7 h-7 text-cyan-200" />, txt: 'Chuva' },
  65: { icon: <CloudRain className="w-7 h-7 text-cyan-300" />, txt: 'Chuva forte' },
  80: { icon: <CloudRain className="w-7 h-7 text-cyan-200" />, txt: 'Pancadas' },
  95: { icon: <CloudLightning className="w-7 h-7 text-purple-300" />, txt: 'Tempestade' },
  96: { icon: <CloudLightning className="w-7 h-7 text-purple-300" />, txt: 'Tempestade + granizo' },
};

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}
function saveSet(key: string, s: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...s]));
  } catch {
    /* ok */
  }
}

export default function HomeMsnView({ onNavigateTab, tracks = [] }: Props) {
  const [webQuery, setWebQuery] = useState('');
  const [cat, setCat] = useState('descobrir');
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  const [followed, setFollowed] = useState<Set<string>>(() => loadSet(FOLLOW_KEY));
  const [look, setLook] = useState<string>(() => {
    try {
      return localStorage.getItem(LOOK_KEY) || 'completa';
    } catch {
      return 'completa';
    }
  });
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);

  // 🌤️ CLIMA REAL DE CAMPO GRANDE (Open-Meteo, grátis!)
  useEffect(() => {
    let alive = true;
    void fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-20.44&longitude=-54.62&current=temperature_2m,weather_code',
    )
      .then((r) => r.json())
      .then((d) => {
        if (alive && d?.current) {
          setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code });
        }
      })
      .catch(() => /* offline */ undefined);
    return () => {
      alive = false;
    };
  }, []);

  // 📰 NOTÍCIAS (RSS G1 — se a internet liberar!)
  useEffect(() => {
    let alive = true;
    const rss = 'https://g1.globo.com/rss/g1/';
    void fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(rss))
      .then((r) => r.text())
      .then((xml) => {
        if (!alive || !xml) return;
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const items = [...doc.querySelectorAll('item')].slice(0, 6).map((it) => ({
          title: it.querySelector('title')?.textContent || '',
          link: it.querySelector('link')?.textContent || '#',
          source: 'G1',
        }));
        if (items.length) setNews(items);
      })
      .catch(() => /* sem RSS */ undefined);
    return () => {
      alive = false;
    };
  }, []);

  const toggleFollow = (id: string) => {
    const next = new Set(followed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFollowed(next);
    saveSet(FOLLOW_KEY, next);
  };

  const setLookAndSave = (v: string) => {
    setLook(v);
    try {
      localStorage.setItem(LOOK_KEY, v);
    } catch {
      /* ok */
    }
    setLookOpen(false);
  };

  const onWebSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = webQuery.trim();
    if (!q) return;
    window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank', 'noopener');
  };

  const topTracks = useMemo(() => [...tracks].slice(0, 6), [tracks]);

  const cardPad = look === 'parcial' ? 'p-2.5' : look === 'cabecalhos' ? 'p-0 overflow-hidden' : 'p-3.5';

  return (
    <div className="relative min-h-[80vh] overflow-hidden pb-10">
      {/* FUNDO 24k */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,190,60,0.12),transparent_55%),radial-gradient(110%_70%_at_90%_110%,rgba(140,80,220,0.14),transparent_60%),linear-gradient(180deg,#0d0616,#09040f_55%,#07030f)]" />

      <div className="max-w-5xl mx-auto px-3 sm:px-5 pt-4 space-y-3.5">
        {/* TOPO: busca web estilo MSN + launcher + canais */}
        <div className="flex items-center gap-2">
          <form onSubmit={onWebSearch} className="relative flex-1">
            <Search className="w-4 h-4 text-amber-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={webQuery}
              onChange={(e) => setWebQuery(e.target.value)}
              placeholder="Pesquisar na Web..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-black/30 border border-amber-300/40 text-sm text-amber-50 focus:outline-none focus:border-amber-300 shadow-[0_6px_22px_rgba(255,190,50,0.12)]"
            />
          </form>
          <button
            type="button"
            onClick={() => setChannelsOpen(true)}
            className="px-3 py-2.5 rounded-full bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] text-[11px] font-black flex items-center gap-1.5 shadow-[0_4px_16px_rgba(255,190,50,0.5)] border border-amber-100/70 active:scale-95"
            title="Meus Canais"
          >
            <Check className="w-3.5 h-3.5" /> Canais
          </button>
          <button
            type="button"
            onClick={() => setLookOpen(true)}
            className="px-3 py-2.5 rounded-full border border-amber-300/45 bg-white/[0.07] text-amber-100 text-[11px] font-black flex items-center gap-1.5 active:scale-95"
            title="Aparência do feed"
          >
            <Sparkles className="w-3.5 h-3.5" /> Visual
          </button>
          <button
            type="button"
            onClick={() => setLauncherOpen((v) => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] shadow-[0_4px_16px_rgba(255,190,50,0.55)] border border-amber-100/70 active:scale-90"
            title="Todos os apps"
          >
            <Grid3x3 className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* LAUNCHER DE APPS (estilo Microsoft 365!) */}
        {launcherOpen && (
          <div className="rounded-2xl border border-amber-300/35 bg-black/25 backdrop-blur-xl p-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {APPS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setLauncherOpen(false);
                  onNavigateTab(a.tab);
                }}
                className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/30 transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] flex items-center justify-center shadow-[0_4px_14px_rgba(255,190,50,0.4)]">
                  {a.icon}
                </div>
                <span className="text-[10px] font-bold text-amber-100 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ABAS DE CATEGORIAS (MSN!) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCat(c.id);
                if (c.id === 'vibe') onNavigateTab('reels');
                else if (c.id === 'musica') onNavigateTab('radio');
                else if (c.id === 'compras') onNavigateTab('loja');
              }}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition ${
                cat === c.id ? 'lux-btn-gold' : 'lux-btn-obsidian text-amber-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* CLIMA STRIP (real!) */}
        <div className="rounded-2xl border border-amber-300/30 bg-white/[0.05] backdrop-blur-md px-4 py-3 flex items-center gap-3">
          {weather ? (
            <>
              {WMO[weather.code]?.icon || <CloudSun className="w-7 h-7 text-amber-200" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-white truncate">
                  Campo Grande · {weather.temp}°C · {WMO[weather.code]?.txt || 'Tempo bom'}
                </div>
                <div className="text-[10px] text-amber-200/80 font-bold uppercase tracking-[0.14em]">
                  🌤️ clima ao vivo · MS Morro Gold
                </div>
              </div>
            </>
          ) : (
            <>
              <CloudSun className="w-7 h-7 text-amber-200 animate-pulse" />
              <div className="text-xs text-amber-100 font-bold">Buscando o clima de Campo Grande...</div>
            </>
          )}
        </div>

        {/* FEED PRINCIPAL + LATERAL */}
        <div className={`grid gap-3 ${look === 'cabecalhos' ? 'grid-cols-1' : 'lg:grid-cols-[1.6fr_1fr]'}`}>
          {/* COLUNA PRINCIPAL */}
          <div className="space-y-3">
            {/* Card destaque = Vibe */}
            <button
              type="button"
              onClick={() => onNavigateTab('reels')}
              className={`w-full text-left rounded-3xl border border-amber-400/25 bg-white/[0.05] backdrop-blur-md hover:border-amber-400/45 transition active:scale-[0.99] ${cardPad}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 flex items-center justify-center shadow-[0_10px_26px_rgba(245,200,76,0.4)]">
                  <Film className="w-6 h-6 text-black" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">🔥 Em alta agora</div>
                  <div className="text-sm font-black text-white truncate">Vibe — memes e zueira sem parar!</div>
                  <div className="text-[11px] text-slate-300 truncate">Vídeos novos sozinhos · som automático · tela cheia</div>
                </div>
                <TrendingUp className="w-5 h-5 text-amber-300 shrink-0" />
              </div>
            </button>

            {/* Música em alta */}
            <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md ${cardPad}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-1.5">
                  <Music4 className="w-4 h-4" /> Música em alta
                </div>
                <button type="button" onClick={() => onNavigateTab('radio')} className="text-[10px] font-black text-amber-200 hover:text-amber-100">
                  VER TUDO →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topTracks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onNavigateTab('radio')}
                    className="flex items-center gap-2 rounded-2xl px-2 py-2 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/25 transition text-left"
                  >
                    <img src={t.coverUrl || '/covers/album-official.jpg'} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/15" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white truncate">{t.title}</div>
                      <div className="text-[9px] text-slate-300 truncate">{t.artist || 'MORRO GOLD'}</div>
                    </div>
                  </button>
                ))}
                {topTracks.length === 0 && (
                  <div className="col-span-full text-[11px] text-slate-300 text-center py-2">
                    Suas músicas aparecem aqui! Abre a Rádio do Morro 📻
                  </div>
                )}
              </div>
            </div>

            {/* Notícias */}
            <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md ${cardPad}`}>
              <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
                <Newspaper className="w-4 h-4" /> Notícias do Brasil
              </div>
              {news.length > 0 ? (
                <div className="space-y-1.5">
                  {news.map((n, i) => (
                    <a
                      key={i}
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl px-3 py-2.5 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/25 transition"
                    >
                      <div className="text-xs font-bold text-white leading-snug">{n.title}</div>
                      <div className="text-[9px] text-amber-200/80 font-black uppercase tracking-[0.12em] mt-0.5">📰 {n.source}</div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-300 text-center py-2">
                  As últimas notícias do Brasil aparecem aqui! 📰
                </div>
              )}
            </div>
          </div>

          {/* LATERAL */}
          <div className="space-y-3">
            <div className={`rounded-3xl border border-amber-400/25 bg-white/[0.05] backdrop-blur-md ${cardPad}`}>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 mb-2.5">👑 Rádio do Morro</div>
              <button
                type="button"
                onClick={() => onNavigateTab('radio')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(245,200,76,0.4)] active:scale-95"
              >
                <Radio className="w-4 h-4" /> LIGAR O RÁDIO
              </button>
              <div className="text-[10px] text-amber-200/80 text-center mt-2">
                Hits · playlists · downloads · clipes · voz 🎤
              </div>
            </div>

            <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md ${cardPad}`}>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 mb-2.5 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Destaques da quebrada
              </div>
              <div className="space-y-1.5">
                <button type="button" onClick={() => onNavigateTab('loja')} className="w-full flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/25 transition text-left">
                  <ShoppingBag className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="text-[11px] font-bold text-white">Loja dos Cria — produtos reais!</div>
                </button>
                <button type="button" onClick={() => onNavigateTab('doacoes')} className="w-full flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/25 transition text-left">
                  <HeartHandshake className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="text-[11px] font-bold text-white">Doações pras igrejas 💛</div>
                </button>
                <button type="button" onClick={() => onNavigateTab('utils')} className="w-full flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/25 transition text-left">
                  <Wrench className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="text-[11px] font-bold text-white">Utilidades do dia a dia</div>
                </button>
                <button type="button" onClick={() => onNavigateTab('reels')} className="w-full flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/25 transition text-left">
                  <Gamepad2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="text-[11px] font-bold text-white">Vibe — memes e zueira 😂</div>
                </button>
              </div>
            </div>

            {/* Meus canais (resumo) */}
            <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md ${cardPad}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">📺 Meus canais</div>
                <button type="button" onClick={() => setChannelsOpen(true)} className="text-[10px] font-black text-amber-200">
                  EDITAR
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...followed].map((id) => {
                  const t = TOPICS.find((x) => x.id === id);
                  return t ? (
                    <span key={id} className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-[10px] font-bold text-amber-100">
                      {t.label}
                    </span>
                  ) : null;
                })}
                {followed.size === 0 && (
                  <div className="text-[10px] text-slate-300">
                    Escolhe teus canais pra personalizar o feed! ✨
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 pt-2">
          🏠 Início Morro Gold · formato MSN · estilo 24k 👑
        </div>
      </div>

      {/* MODAL: MEUS CANAIS (personaliza o feed!) */}
      {channelsOpen && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setChannelsOpen(false)}>
          <div
            className="w-full max-w-md rounded-3xl border border-amber-300/40 bg-[#120a1e]/95 shadow-[0_24px_80px_rgba(0,0,0,0.8)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-black text-white">👑 Meus Canais</div>
              <button type="button" onClick={() => setChannelsOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[11px] text-amber-200/80 mb-4">
              Escolhe os tópicos que você mais curte — o feed se organiza pra você!
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TOPICS.map((t) => {
                const on = followed.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleFollow(t.id)}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[11px] font-bold border transition active:scale-95 ${
                      on
                        ? 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] border-amber-100/70'
                        : 'bg-white/[0.06] text-amber-100 border-amber-300/25 hover:bg-white/10'
                    }`}
                  >
                    {on ? <Check className="w-3.5 h-3.5" /> : null}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APARÊNCIA DO FEED */}
      {lookOpen && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLookOpen(false)}>
          <div
            className="w-full max-w-sm rounded-3xl border border-amber-300/40 bg-[#120a1e]/95 shadow-[0_24px_80px_rgba(0,0,0,0.8)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black text-white">✨ Aparência do feed</div>
              <button type="button" onClick={() => setLookOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { id: 'completa', label: '📱 Página completa' },
                { id: 'parcial', label: '📄 Exibição parcial' },
                { id: 'cabecalhos', label: '📰 Cabeçalhos' },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setLookAndSave(o.id)}
                  className={`w-full flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-xs font-bold border transition active:scale-95 ${
                    look === o.id
                      ? 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] border-amber-100/70'
                      : 'bg-white/[0.06] text-amber-100 border-amber-300/25 hover:bg-white/10'
                  }`}
                >
                  {look === o.id ? <Check className="w-4 h-4" /> : null}
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

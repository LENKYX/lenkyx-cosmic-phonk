import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bitcoin,
  Bot,
  CheckCircle2,
  CreditCard,
  Flame,
  Globe2,
  Lock,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShoppingBag,
  Skull,
  Sparkles,
  Terminal,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types';

export type SpecialWorldKind = 'shopping' | 'news' | 'darkweb' | 'finance' | 'idea' | 'create_planet';

export interface CustomIdeaPlanet {
  id: string;
  name: string;
  topic: string;
  accentHex: string;
  hasRing: boolean;
  style: string;
  creatorName?: string;
  createdAt?: string;
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
}

interface ShopProduct {
  id: string;
  title: string;
  priceBrl: number;
  originalPriceBrl: number;
  imageUrl: string;
  permalink?: string;
  freeShipping: boolean;
  soldQuantity: number;
  rating: number;
  store: string;
}

interface ShopOrder {
  id: string;
  productTitle: string;
  priceBrl: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  priceUsd: number;
  priceBrl: number;
  change24h: number;
  sparkline: number[];
  signal: string;
}

interface StockAsset {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  price: number;
  change24h: number;
  sparkline: number[];
  signal: string;
}

interface PortfolioState {
  cashUsd: number;
  autoBotEnabled: boolean;
  positions: { symbol: string; amount: number; avgEntryUsd: number }[];
  history: { ts: string; text: string }[];
}

interface Props {
  open: boolean;
  world: SpecialWorldKind;
  ideaPlanet?: CustomIdeaPlanet | null;
  user: UserProfile | null;
  onClose: () => void;
  onPlanetCreated: (planet: CustomIdeaPlanet) => void;
  onNavigateWebSearch?: (q: string) => void;
  onToast: (msg: string) => void;
}

const SparklineSvg: React.FC<{ points: number[]; positive: boolean }> = ({ points, positive }) => {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * 84;
      const y = 22 - ((v - min) / span) * 18;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width="84" height="24" className="shrink-0 overflow-visible">
      <polyline
        fill="none"
        stroke={positive ? '#34d399' : '#fb7185'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
};

export const GalaxyWorldsModal: React.FC<Props> = ({
  open,
  world,
  ideaPlanet,
  user,
  onClose,
  onPlanetCreated,
  onToast,
}) => {
  // News state
  const [newsCat, setNewsCat] = useState('all');
  const [newsQuery, setNewsQuery] = useState('');
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Shopping state
  const [shopCat, setShopCat] = useState('destaques');
  const [shopQuery, setShopQuery] = useState('');
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<ShopProduct | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('PIX Instantâneo');
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  // Finance (Bitcoin & Stocks) state
  const [crypto, setCrypto] = useState<CryptoAsset[]>([]);
  const [stocks, setStocks] = useState<StockAsset[]>([]);
  const [forex, setForex] = useState<{ pair: string; price: number; changePct: number }[]>([]);
  const [usdBrl, setUsdBrl] = useState(5.75);
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  // Dark Web state
  const [cves, setCves] = useState<
    { cveID: string; vendor: string; product: string; title: string; ransomware: boolean; summary: string }[]
  >([]);
  const [cyberNews, setCyberNews] = useState<{ id: string; title: string; url: string; author: string }[]>([]);
  const [darkChat, setDarkChat] = useState<{ id: string; handle: string; text: string; ts: string }[]>([]);
  const [darkInput, setDarkInput] = useState('');
  const [hashInput, setHashInput] = useState('LENKYX-QUANTUM-KEY');
  const [hashOutput, setHashOutput] = useState('');
  const [inspectHost, setInspectHost] = useState('lenkyx.app');
  const [inspectResult, setInspectResult] = useState<Record<string, unknown> | null>(null);

  // Idea Planet creator & resolver
  const [newPlanetName, setNewPlanetName] = useState('');
  const [newPlanetTopic, setNewPlanetTopic] = useState('');
  const [newPlanetColor, setNewPlanetColor] = useState('#38bdf8');
  const [newPlanetRing, setNewPlanetRing] = useState(true);
  const [creatingPlanet, setCreatingPlanet] = useState(false);
  const [ideaContent, setIdeaContent] = useState<{
    summary: string;
    imageUrl?: string;
    news: NewsArticle[];
    products: ShopProduct[];
  } | null>(null);

  const loadNews = useCallback(async (cat = newsCat, q = newsQuery, refresh = false) => {
    setNewsLoading(true);
    try {
      const r = await fetch(
        `/api/worlds/news?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}&refresh=${refresh ? '1' : '0'}`
      );
      const d = await r.json();
      if (d?.ok) setNewsItems(d.articles || []);
    } catch {
      // ignore
    } finally {
      setNewsLoading(false);
    }
  }, [newsCat, newsQuery]);

  const loadShop = useCallback(async (cat = shopCat, q = shopQuery, refresh = false) => {
    setShopLoading(true);
    try {
      const [sr, or] = await Promise.all([
        fetch(
          `/api/worlds/shopping?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}&refresh=${
            refresh ? '1' : '0'
          }`
        ).then((res) => res.json()),
        fetch('/api/worlds/shopping/orders').then((res) => res.json()),
      ]);
      if (sr?.ok) setProducts(sr.products || []);
      if (or?.ok) setOrders(or.orders || []);
    } catch {
      // ignore
    } finally {
      setShopLoading(false);
    }
  }, [shopCat, shopQuery]);

  const loadMarkets = useCallback(async (refresh = false) => {
    setFinanceLoading(true);
    try {
      const uid = user?.id || 'guest';
      const r = await fetch(`/api/worlds/markets?userId=${encodeURIComponent(uid)}&refresh=${refresh ? '1' : '0'}`);
      const d = await r.json();
      if (d?.ok) {
        setCrypto(d.crypto || []);
        setStocks(d.stocks || []);
        setForex(d.forex || []);
        setUsdBrl(d.usdBrl || 5.75);
        setPortfolio(d.portfolio || null);
      }
    } catch {
      // ignore
    } finally {
      setFinanceLoading(false);
    }
  }, [user?.id]);

  const loadDarkWeb = useCallback(async (refresh = false) => {
    try {
      const r = await fetch(`/api/worlds/darkweb?refresh=${refresh ? '1' : '0'}`);
      const d = await r.json();
      if (d?.ok) {
        setCves(d.vulnerabilities || []);
        setCyberNews(d.cyberNews || []);
        setDarkChat(d.encryptedChat || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (world === 'news') void loadNews(newsCat, newsQuery);
    else if (world === 'shopping') void loadShop(shopCat, shopQuery);
    else if (world === 'finance') {
      void loadMarkets();
      const iv = window.setInterval(() => void loadMarkets(true), 22000);
      return () => window.clearInterval(iv);
    } else if (world === 'darkweb') void loadDarkWeb();
    else if (world === 'idea' && ideaPlanet?.topic) {
      setIdeaContent(null);
      void fetch(`/api/galaxy/planets/resolve?topic=${encodeURIComponent(ideaPlanet.topic)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok) setIdeaContent(d);
        })
        .catch(() => {});
    }
  }, [open, world, ideaPlanet?.topic, loadNews, loadShop, loadMarkets, loadDarkWeb, newsCat, newsQuery, shopCat, shopQuery]);

  useEffect(() => {
    if (!open || world !== 'darkweb') return;
    const computeHash = async () => {
      try {
        const enc = new TextEncoder().encode(hashInput);
        const buf = await window.crypto.subtle.digest('SHA-256', enc);
        const hex = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        setHashOutput(hex);
      } catch {
        setHashOutput('');
      }
    };
    void computeHash();
  }, [open, world, hashInput]);

  if (!open) return null;

  const isDarkWeb = world === 'darkweb';

  const handleInstantBuy = async (p: ShopProduct) => {
    try {
      const r = await fetch('/api/worlds/shopping/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: p,
          buyerName: user?.name || 'Explorador LENKYX',
          paymentMethod,
          address: 'Entrega Expressa Automática',
        }),
      });
      const d = await r.json();
      if (d?.ok && d.order) {
        setOrders((prev) => [d.order, ...prev]);
        setCheckoutProduct(null);
        onToast(`⚡ Compra confirmada na hora! Pedido #${d.order.id}`);
      }
    } catch {
      onToast('Erro ao processar compra instantânea.');
    }
  };

  const handleTrade = async (symbol: string, priceUsd: number, side: 'buy' | 'sell') => {
    try {
      const r = await fetch('/api/worlds/markets/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'guest',
          type: 'trade',
          symbol,
          priceUsd,
          usdAmount: 250,
          side,
        }),
      });
      const d = await r.json();
      if (d?.ok) {
        setPortfolio(d.portfolio);
        onToast(`${side === 'buy' ? '🟢 Compra' : '🔴 Venda'} $250 em ${symbol} executada!`);
      }
    } catch {
      // ignore
    }
  };

  const handleCreatePlanetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nm = newPlanetName.trim();
    if (!nm) return;
    setCreatingPlanet(true);
    try {
      const r = await fetch('/api/galaxy/planets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nm,
          topic: newPlanetTopic.trim() || nm,
          accentHex: newPlanetColor,
          hasRing: newPlanetRing,
          style: 'cyber',
          creatorName: user?.name || 'Explorador',
        }),
      });
      const d = await r.json();
      if (d?.ok && d.planet) {
        onPlanetCreated(d.planet);
        setNewPlanetName('');
        setNewPlanetTopic('');
        onToast(`🪐 Planeta "${d.planet.name}" criado e conectado à internet!`);
        onClose();
      }
    } catch {
      onToast('Não foi possível criar o planeta agora.');
    } finally {
      setCreatingPlanet(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9993] bg-black/82 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4">
      <div
        className={`w-full max-w-5xl max-h-[92dvh] rounded-3xl overflow-hidden flex flex-col border shadow-[0_24px_95px_rgba(0,0,0,0.92)] ${
          isDarkWeb
            ? 'bg-[#090104]/98 border-red-600/50 shadow-[0_0_80px_rgba(220,38,38,0.3)]'
            : 'bg-slate-950/95 border-cyan-400/35'
        }`}
      >
        {/* Header */}
        <div
          className={`p-3.5 sm:p-4 border-b flex items-center justify-between gap-2 ${
            isDarkWeb
              ? 'border-red-500/30 bg-gradient-to-r from-red-950/80 via-black to-orange-950/70'
              : 'border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                world === 'shopping'
                  ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white'
                  : world === 'news'
                    ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white'
                    : world === 'darkweb'
                      ? 'bg-gradient-to-br from-red-600 to-orange-600 text-white animate-pulse'
                      : world === 'finance'
                        ? 'bg-gradient-to-br from-amber-400 to-emerald-400 text-black'
                        : 'bg-gradient-to-br from-cyan-400 to-purple-500 text-black'
              }`}
            >
              {world === 'shopping' && <ShoppingBag className="w-5 h-5" />}
              {world === 'news' && <Newspaper className="w-5 h-5" />}
              {world === 'darkweb' && <Skull className="w-5 h-5" />}
              {world === 'finance' && <Bitcoin className="w-5 h-5" />}
              {(world === 'idea' || world === 'create_planet') && <Sparkles className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {world === 'shopping' && 'Mercado Cósmico — Compras em Tempo Real'}
                {world === 'news' && 'Observatório Veritas — Notícias do Mundo'}
                {world === 'darkweb' && 'ABISMO OBSCURO — Dark Web & Cyber Inferno'}
                {world === 'finance' && 'Apex Quantum — Bitcoins & Bolsas em Tempo Real'}
                {world === 'idea' && `Planeta ${ideaPlanet?.name || 'Ideia'}`}
                {world === 'create_planet' && 'Criar Nova Ideia = Novo Planeta'}
              </h2>
              <div className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isDarkWeb ? 'bg-red-500' : 'bg-emerald-400'} animate-ping`} />
                <span>Conectado à internet com atualização autônoma</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* === WORLD 1: SHOPPING (REAL-TIME NO-BUREAUCRACY MARKET) === */}
        {world === 'shopping' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadShop(shopCat, shopQuery, true);
                }}
                className="flex-1 min-w-[210px] flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.07] border border-white/15"
              >
                <Search className="w-4 h-4 text-orange-300 shrink-0" />
                <input
                  type="text"
                  value={shopQuery}
                  onChange={(e) => setShopQuery(e.target.value)}
                  placeholder="Buscar qualquer produto do mundo..."
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
                <button type="submit" className="px-3 py-1 rounded-xl bg-orange-500 text-black text-[11px] font-black">
                  Buscar
                </button>
              </form>
              <button
                type="button"
                onClick={() => void loadShop(shopCat, shopQuery, true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <RefreshCw className={`w-4 h-4 ${shopLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'destaques', label: '⚡ Relâmpago' },
                { id: 'tech', label: '📱 Tech & Celulares' },
                { id: 'gamer', label: '🎮 Gamer' },
                { id: 'audio', label: '🎧 Áudio Bluetooth' },
                { id: 'moda', label: '👟 Moda' },
                { id: 'casa', label: '💡 Casa & LED' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setShopCat(c.id);
                    setShopQuery('');
                    void loadShop(c.id, '', false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border transition ${
                    shopCat === c.id
                      ? 'bg-orange-500 text-black border-orange-300'
                      : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/15'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {orders.length > 0 && (
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-black text-emerald-200 whitespace-nowrap">
                  Última compra: #{orders[0].id} — {orders[0].productTitle.slice(0, 32)} ({orders[0].status})
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white/[0.04] border border-white/10 hover:border-orange-400/60 overflow-hidden flex flex-col justify-between transition"
                >
                  <div className="aspect-square bg-white flex items-center justify-center p-2 relative">
                    <img src={p.imageUrl} alt={p.title} className="max-h-full max-w-full object-contain" />
                    {p.freeShipping && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-black">
                        FRETE GRÁTIS
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div className="text-[11px] font-bold text-white line-clamp-2">{p.title}</div>
                    <div>
                      <div className="text-sm font-black text-orange-300">
                        R$ {p.priceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">★ {p.rating.toFixed(1)} · {p.soldQuantity}+ vendidos</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutProduct(p)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[11px] font-black flex items-center justify-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" /> Comprar Agora
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Instant 1-Tap Checkout Drawer */}
            {checkoutProduct && (
              <div className="fixed inset-0 z-[9996] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-3xl bg-slate-950 border border-orange-400/50 p-4 space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-orange-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Checkout Instantâneo (1 Toque)
                    </span>
                    <button type="button" onClick={() => setCheckoutProduct(null)} className="text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5">
                    <img src={checkoutProduct.imageUrl} alt="" className="w-14 h-14 rounded-xl object-contain bg-white p-1" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white line-clamp-2">{checkoutProduct.title}</div>
                      <div className="text-sm font-black text-emerald-300">
                        R$ {checkoutProduct.priceBrl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-black">
                    {['PIX Instantâneo', 'Cartão Express'].map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`py-2 rounded-xl border ${
                          paymentMethod === pm
                            ? 'bg-emerald-400 text-black border-emerald-300'
                            : 'bg-white/5 text-white border-white/15'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleInstantBuy(checkoutProduct)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" /> Confirmar Compra em Tempo Real
                  </button>
                  {checkoutProduct.permalink && (
                    <a
                      href={checkoutProduct.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center text-[11px] text-cyan-300 underline"
                    >
                      Ver anúncio original na loja
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === WORLD 2: LIVE WORLD NEWS === */}
        {world === 'news' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadNews(newsCat, newsQuery, true);
                }}
                className="flex-1 min-w-[210px] flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.07] border border-white/15"
              >
                <Search className="w-4 h-4 text-sky-300 shrink-0" />
                <input
                  type="text"
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                  placeholder="Buscar notícias no mundo inteiro..."
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
                <button type="submit" className="px-3 py-1 rounded-xl bg-sky-400 text-black text-[11px] font-black">
                  Buscar
                </button>
              </form>
              <button
                type="button"
                onClick={() => void loadNews(newsCat, newsQuery, true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: '🌍 Todas' },
                { id: 'brasil', label: '🇧🇷 Brasil' },
                { id: 'mundo', label: '🌐 Mundo' },
                { id: 'nasa', label: '🚀 NASA & Espaço' },
                { id: 'tech', label: '💻 Tecnologia' },
                { id: 'economia', label: '📈 Economia' },
                { id: 'esportes', label: '⚽ Esportes' },
                { id: 'games', label: '🎮 Games' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setNewsCat(c.id);
                    setNewsQuery('');
                    void loadNews(c.id, '', false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border transition ${
                    newsCat === c.id
                      ? 'bg-sky-400 text-black border-sky-200'
                      : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/15'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {newsItems.map((art) => (
                <a
                  key={art.id}
                  href={art.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-sky-400/50 flex gap-3 transition"
                >
                  {art.imageUrl && (
                    <img src={art.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-[10px] font-black text-sky-300 flex items-center justify-between gap-2">
                      <span className="truncate">{art.source}</span>
                      <span className="text-slate-400 shrink-0">{art.category.toUpperCase()}</span>
                    </div>
                    <h3 className="text-xs font-black text-white line-clamp-2 leading-snug">{art.title}</h3>
                    {art.summary && <p className="text-[11px] text-slate-400 line-clamp-2">{art.summary}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* === WORLD 3: DARK WEB (INFERNAL CYBER UNDERWORLD + LIVE CISA CVE + CRYPTO LAB) === */}
        {world === 'darkweb' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950/75 via-black to-orange-950/60 border border-red-500/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-red-200 font-bold">
                <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                <span>CAMADA ONION · MONITORAMENTO DE ZERO-DAYS & SEGURANÇA GLOBAL</span>
              </div>
              <button
                type="button"
                onClick={() => void loadDarkWeb(true)}
                className="px-3 py-1 rounded-xl bg-red-600/30 border border-red-400/40 text-red-100 text-[11px] font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Sincronizar Rede
              </button>
            </div>

            {/* Interactive Security Tools: SHA-256 + Host TLS Inspector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-black/80 border border-red-500/30 space-y-2">
                <div className="text-xs font-black text-red-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> GERADOR SHA-256 & CRIPTOGRAFIA
                </div>
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-100 focus:outline-none"
                />
                <div className="p-2 rounded-xl bg-black border border-white/10 text-[10px] text-orange-300 break-all">
                  {hashOutput || '...'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/80 border border-red-500/30 space-y-2">
                <div className="text-xs font-black text-red-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> SCANNER TLS & HEADERS DE DOMÍNIO
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inspectHost}
                    onChange={(e) => setInspectHost(e.target.value)}
                    placeholder="ex: google.com"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void fetch(`/api/worlds/darkweb/inspect?host=${encodeURIComponent(inspectHost)}`)
                        .then((r) => r.json())
                        .then(setInspectResult)
                        .catch(() => {})
                    }
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black"
                  >
                    Escanear
                  </button>
                </div>
                {inspectResult && (
                  <pre className="p-2 rounded-xl bg-black border border-white/10 text-[10px] text-emerald-300 overflow-x-auto max-h-24">
                    {JSON.stringify(inspectResult, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Live CISA Vulnerabilities & Cyber Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-black/85 border border-red-500/30 space-y-2">
                <div className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> CISA EXPLOITS ATIVOS (TEMPO REAL)
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cves.map((v) => (
                    <div key={v.cveID} className="p-2.5 rounded-xl bg-red-950/25 border border-red-500/20">
                      <div className="flex items-center justify-between text-[10px] font-black">
                        <span className="text-red-400">{v.cveID}</span>
                        <span className="text-orange-300">{v.vendor}</span>
                      </div>
                      <div className="text-xs text-white font-bold mt-0.5">{v.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{v.summary}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/85 border border-red-500/30 flex flex-col justify-between space-y-2">
                <div className="text-xs font-black text-red-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> CANAL CRIPTOGRAFADO UNDERGROUND
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {darkChat.map((m) => (
                    <div key={m.id} className="text-[11px]">
                      <span className="text-red-400 font-black">[{m.handle}] </span>
                      <span className="text-slate-200">{m.text}</span>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!darkInput.trim()) return;
                    const txt = darkInput;
                    setDarkInput('');
                    void fetch('/api/worlds/darkweb/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ handle: user?.name || '0xUSER', text: txt }),
                    })
                      .then((r) => r.json())
                      .then((d) => d?.encryptedChat && setDarkChat(d.encryptedChat));
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={darkInput}
                    onChange={(e) => setDarkInput(e.target.value)}
                    placeholder="Comando ou mensagem cifrada..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-white focus:outline-none"
                  />
                  <button type="submit" className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {cyberNews.length > 0 && (
                  <div className="pt-2 border-t border-red-500/20 space-y-1 max-h-28 overflow-y-auto">
                    {cyberNews.slice(0, 5).map((n) => (
                      <a
                        key={n.id}
                        href={n.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-[10px] text-orange-300 hover:text-white truncate"
                      >
                        ▸ {n.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === WORLD 4: BITCOIN & GLOBAL STOCK EXCHANGE === */}
        {world === 'finance' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Live Forex & Portfolio Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-400/30">
                <div className="text-[10px] font-black text-emerald-300 uppercase">Câmbio Global Agora</div>
                <div className="mt-1 flex flex-wrap gap-3">
                  {forex.map((f) => (
                    <div key={f.pair}>
                      <div className="text-xs font-black text-white">{f.pair}</div>
                      <div className="text-sm font-black text-emerald-300">R$ {f.price.toFixed(2)}</div>
                    </div>
                  ))}
                  {forex.length === 0 && <div className="text-sm font-black text-white">USD/BRL R$ {usdBrl.toFixed(2)}</div>}
                </div>
              </div>

              {portfolio && (
                <div className="md:col-span-2 p-3 rounded-2xl bg-white/[0.05] border border-amber-400/30 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> CARTEIRA AUTOMÁTICA QUÂNTICA
                    </div>
                    <div className="text-base font-black text-white">
                      Caixa Livre: ${portfolio.cashUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
                    </div>
                    <div className="text-[10px] text-slate-300 flex flex-wrap gap-2 mt-0.5">
                      {portfolio.positions.map((pos) => (
                        <span key={pos.symbol} className="px-2 py-0.5 rounded-full bg-white/10 font-bold">
                          {pos.symbol}: {pos.amount.toFixed(3)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void fetch('/api/worlds/markets/portfolio', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user?.id || 'guest',
                            type: 'toggle_bot',
                            enabled: !portfolio.autoBotEnabled,
                          }),
                        })
                          .then((r) => r.json())
                          .then((d) => d?.ok && setPortfolio(d.portfolio))
                      }
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black border ${
                        portfolio.autoBotEnabled
                          ? 'bg-emerald-400 text-black border-emerald-200'
                          : 'bg-white/10 text-slate-300 border-white/15'
                      }`}
                    >
                      {portfolio.autoBotEnabled ? '⚡ Auto-Bot ON' : 'Auto-Bot OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadMarkets(true)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                    >
                      <RefreshCw className={`w-4 h-4 ${financeLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cryptocurrencies */}
            <div className="space-y-2">
              <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Bitcoin className="w-4 h-4" /> CRIPTOMOEDAS EM TEMPO REAL
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {crypto.map((c) => {
                  const pos = c.change24h >= 0;
                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-400/50 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {c.image && <img src={c.image} alt="" className="w-6 h-6 rounded-full" />}
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white truncate">{c.symbol}</div>
                            <div className="text-[10px] text-slate-400 truncate">{c.name}</div>
                          </div>
                        </div>
                        <SparklineSvg points={c.sparkline} positive={pos} />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-sm font-black text-white">
                            ${c.priceUsd.toLocaleString('en-US', { maximumFractionDigits: c.priceUsd < 10 ? 3 : 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            R$ {c.priceBrl.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 ${
                            pos ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {c.change24h.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => void handleTrade(c.symbol, c.priceUsd, 'buy')}
                          className="flex-1 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500 text-emerald-200 hover:text-black text-[10px] font-black"
                        >
                          Comprar $250
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTrade(c.symbol, c.priceUsd, 'sell')}
                          className="flex-1 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500 text-rose-200 hover:text-white text-[10px] font-black"
                        >
                          Vender
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Global Stock Indices & Stocks */}
            <div className="space-y-2">
              <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> BOLSAS DE VALORES MUNDIAIS (B3 · NYSE · NASDAQ)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {stocks.map((s) => {
                  const pos = s.change24h >= 0;
                  return (
                    <div key={s.symbol} className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{s.symbol}</span>
                        <span className="text-[9px] text-cyan-300 font-bold">{s.market}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{s.name}</div>
                      <SparklineSvg points={s.sparkline} positive={pos} />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-black text-white">
                          {s.currency === 'BRL' ? 'R$ ' : s.currency === 'USD' ? '$ ' : ''}
                          {s.price.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-black ${pos ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {pos ? '+' : ''}
                          {s.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* === WORLD 5: CREATE NEW IDEA = NEW PLANET === */}
        {world === 'create_planet' && (
          <form onSubmit={(e) => void handleCreatePlanetSubmit(e)} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-cyan-200">Nome do Novo Planeta</label>
                <input
                  type="text"
                  required
                  value={newPlanetName}
                  onChange={(e) => setNewPlanetName(e.target.value)}
                  placeholder="Ex: Planeta do Anime, Planeta Carros..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.07] border border-white/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-cyan-200">Tema / Conteúdo conectado à Internet</label>
                <input
                  type="text"
                  value={newPlanetTopic}
                  onChange={(e) => setNewPlanetTopic(e.target.value)}
                  placeholder="Ex: anime naruto notícias produtos..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.07] border border-white/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-black text-slate-300">Cor do Planeta:</span>
              {['#38bdf8', '#f472b6', '#34d399', '#fbbf24', '#a855f7', '#fb7185'].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setNewPlanetColor(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    newPlanetColor === hex ? 'border-white scale-115 shadow-lg' : 'border-transparent opacity-70'
                  }`}
                />
              ))}

              <label className="ml-auto flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPlanetRing}
                  onChange={(e) => setNewPlanetRing(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span>Anéis Planetários</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={creatingPlanet || !newPlanetName.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(56,189,248,0.45)]"
            >
              <Plus className="w-4 h-4" />
              <span>{creatingPlanet ? 'Gerando Planeta na Galáxia...' : 'Nascer Novo Planeta na Galáxia'}</span>
            </button>
          </form>
        )}

        {/* === WORLD 6: USER-CREATED IDEA PLANET AUTONOMOUS HUB === */}
        {world === 'idea' && ideaPlanet && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!ideaContent ? (
              <div className="py-12 text-center text-xs text-cyan-200 flex flex-col items-center gap-2">
                <Activity className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Conectando este planeta às informações da internet...</span>
              </div>
            ) : (
              <>
                {ideaContent.summary && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/15 flex gap-3 items-start">
                    {ideaContent.imageUrl && (
                      <img src={ideaContent.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="space-y-1">
                      <div className="text-[11px] font-black text-cyan-300 flex items-center gap-1">
                        <Globe2 className="w-3.5 h-3.5" /> Conhecimento Vivo
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{ideaContent.summary}</p>
                    </div>
                  </div>
                )}

                {ideaContent.news.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-black text-sky-300">Notícias Conectadas</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ideaContent.news.map((n) => (
                        <a
                          key={n.id}
                          href={n.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-bold text-white"
                        >
                          <div className="line-clamp-2">{n.title}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{n.source}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {ideaContent.products.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-black text-orange-300">Itens & Produtos Relacionados</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ideaContent.products.map((p) => (
                        <div key={p.id} className="p-2 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                          <img src={p.imageUrl} alt="" className="w-full h-24 object-contain bg-white rounded-lg p-1" />
                          <div className="text-[10px] font-bold text-white line-clamp-2">{p.title}</div>
                          <div className="text-xs font-black text-orange-300">R$ {p.priceBrl.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

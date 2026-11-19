import React, { useMemo, useState } from 'react';
import {
  ShoppingBag,
  Search,
  ExternalLink,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  Flame,
  X,
} from 'lucide-react';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';

type ShopCat = 'all' | 'roupas' | 'oculos' | 'relogios' | 'correntes' | 'motos' | 'carros';

interface CriaProduct {
  id: string;
  name: string;
  brand: string;
  category: Exclude<ShopCat, 'all'>;
  priceBrl: number;
  priceLabel: string;
  badge: string;
  emoji: string;
  specs: string;
  searchQuery: string;
  accent: string;
}

const CRIA_CATALOG: CriaProduct[] = [
  // ROUPAS DE MARCA (LACOSTE, OAKLEY, NIKE)
  {
    id: 'shop-lacoste-polo',
    name: 'Camisa Polo & Conjunto Lacoste Jacaré Sport',
    brand: 'Lacoste',
    category: 'roupas',
    priceBrl: 389,
    priceLabel: 'R$ 389',
    badge: '🐊 CLÁSSICO DOS CRIA',
    emoji: '🐊',
    specs: 'Tecido piquet respirável · Bordado original · Kit Peita + Bermuda',
    searchQuery: 'Conjunto Lacoste camisa polo original',
    accent: 'from-emerald-500/30 to-cyan-500/20',
  },
  {
    id: 'shop-oakley-corta',
    name: 'Corta-Vento & Dry-Fit Oakley Reflective',
    brand: 'Oakley',
    category: 'roupas',
    priceBrl: 449,
    priceLabel: 'R$ 449',
    badge: '⚡ REFLETIVO',
    emoji: '🧥',
    specs: 'Capuz impermeável · Zíper selado · Logo O-Icon refletivo no baile',
    searchQuery: 'Jaqueta corta vento Oakley original',
    accent: 'from-cyan-500/30 to-blue-600/20',
  },
  {
    id: 'shop-nike-tn',
    name: 'Tênis Nike Air Max Plus TN & Conjuntão Dri-FIT',
    brand: 'Nike',
    category: 'roupas',
    priceBrl: 1199,
    priceLabel: 'R$ 1.199',
    badge: '🔥 MAIS PROCURADO',
    emoji: '👟',
    specs: 'Amortecimento Tuned Air · Visual agressivo de quebrada',
    searchQuery: 'Tenis Nike Air Max Plus TN original',
    accent: 'from-pink-500/25 to-purple-600/20',
  },
  {
    id: 'shop-kenner-bone',
    name: 'Boné Lacoste Aba Curva + Chinelo Kenner Rakka',
    brand: 'Lacoste · Kenner',
    category: 'roupas',
    priceBrl: 299,
    priceLabel: 'R$ 299',
    badge: '🧢 KIT BAILE',
    emoji: '🧢',
    specs: 'Combo de responsa pro rolê · Conforto máximo',
    searchQuery: 'Bone Lacoste original chinelo Kenner Rakka',
    accent: 'from-amber-500/25 to-emerald-500/20',
  },

  // ÓCULOS DE MARCA
  {
    id: 'shop-juliet',
    name: 'Óculos Oakley Juliet X-Metal Plasma / Ruby',
    brand: 'Oakley',
    category: 'oculos',
    priceBrl: 1490,
    priceLabel: 'R$ 1.490',
    badge: '🕶️ LENDÁRIO',
    emoji: '🕶️',
    specs: 'Armação em liga metálica X-Metal · Lentes polarizadas iridium',
    searchQuery: 'Oculos Oakley Juliet original',
    accent: 'from-red-500/30 to-amber-500/20',
  },
  {
    id: 'shop-romeo2',
    name: 'Óculos Oakley Romeo 2 & Penny Titanium',
    brand: 'Oakley',
    category: 'oculos',
    priceBrl: 1690,
    priceLabel: 'R$ 1.690',
    badge: '💎 RELÍQUIA',
    emoji: '⚡',
    specs: 'Proteção UV400 · Design futurista de cria',
    searchQuery: 'Oculos Oakley Romeo 2 Penny',
    accent: 'from-cyan-400/30 to-indigo-500/20',
  },
  {
    id: 'shop-prada-rayban',
    name: 'Óculos Prada Linea Rossa & Ray-Ban Hexagonal',
    brand: 'Prada · Ray-Ban',
    category: 'oculos',
    priceBrl: 980,
    priceLabel: 'R$ 980',
    badge: '✨ LUXO',
    emoji: '🔥',
    specs: 'Lente espelhada / degradê · Acabamento premium',
    searchQuery: 'Oculos Prada Linea Rossa Ray Ban',
    accent: 'from-purple-500/30 to-pink-500/20',
  },

  // RELÓGIOS
  {
    id: 'shop-invicta-pro',
    name: 'Relógio Invicta Pro Diver & Bolt Zeus Dourado',
    brand: 'Invicta',
    category: 'relogios',
    priceBrl: 1290,
    priceLabel: 'R$ 1.290',
    badge: '⌚ PESADO',
    emoji: '⌚',
    specs: 'Caixa 52mm aço banhado a ouro 18k · À prova d’água 200m',
    searchQuery: 'Relogio Invicta Bolt Zeus Dourado original',
    accent: 'from-amber-400/30 to-yellow-500/20',
  },
  {
    id: 'shop-gshock',
    name: 'Relógio Casio G-Shock CasiOak & Mudmaster',
    brand: 'G-Shock',
    category: 'relogios',
    priceBrl: 890,
    priceLabel: 'R$ 890',
    badge: '🛡️ INDESTRUTÍVEL',
    emoji: '⏱️',
    specs: 'Resistente a impacto e água · Estilo esportivo futurista',
    searchQuery: 'Relogio Casio G-Shock original',
    accent: 'from-cyan-500/30 to-slate-600/30',
  },
  {
    id: 'shop-rolex-sub',
    name: 'Relógio Estilo Rolex Submariner / Datejust Ice',
    brand: 'Alta Relojoaria',
    category: 'relogios',
    priceBrl: 4500,
    priceLabel: 'A partir de R$ 4.500',
    badge: '👑 ELITE',
    emoji: '👑',
    specs: 'Movimento automático de precisão · Safira anti-risco',
    searchQuery: 'Relogio automatico estilo Submariner original',
    accent: 'from-emerald-400/30 to-amber-500/20',
  },

  // CORRENTES DE OURO
  {
    id: 'shop-corrente-grumet',
    name: 'Corrente Grumet 10mm Ouro 18k Maciço + Fecho Gaveta',
    brand: 'Joalheria Ouro 18k',
    category: 'correntes',
    priceBrl: 3890,
    priceLabel: 'R$ 3.890',
    badge: '🥇 OURO 18K',
    emoji: '⛓️',
    specs: 'Brilho intenso · Certificado de garantia 18k / Moeda Antiga top',
    searchQuery: 'Corrente Grumet ouro 18k moeda antiga 10mm',
    accent: 'from-yellow-400/35 to-amber-600/20',
  },
  {
    id: 'shop-cordao-cravejado',
    name: 'Cordão Cadeado + Pingente Cravejado Ice Zircônia',
    brand: 'Ice Drip BR',
    category: 'correntes',
    priceBrl: 690,
    priceLabel: 'R$ 690',
    badge: '❄️ ICE DRIP',
    emoji: '💎',
    specs: 'Cravejamento manual brilhando forte no flash e no rolê',
    searchQuery: 'Corrente cordao cadeado cravejado pingente',
    accent: 'from-cyan-300/30 to-blue-500/20',
  },

  // MOTOS ESPORTIVAS
  {
    id: 'shop-hornet',
    name: 'Honda CB 600F Hornet · Ronco 4 Cilindros',
    brand: 'Honda',
    category: 'motos',
    priceBrl: 42900,
    priceLabel: 'R$ 42.900 (Fipe/Oferta)',
    badge: '🏍️ SONHO DA QUEBRADA',
    emoji: '🏍️',
    specs: '102 cv · 4 cilindros em linha · Escapamento esportivo',
    searchQuery: 'Honda CB 600F Hornet a venda',
    accent: 'from-red-600/30 to-amber-500/20',
  },
  {
    id: 'shop-s1000rr',
    name: 'BMW S1000RR · Superbike 1000cc (210 cv)',
    brand: 'BMW Motorrad',
    category: 'motos',
    priceBrl: 118900,
    priceLabel: 'R$ 118.900',
    badge: '🚀 FOGUETE',
    emoji: '🔥',
    specs: 'Quickshifter · Controle de largada · Painel TFT futurista',
    searchQuery: 'BMW S1000RR a venda Brasil',
    accent: 'from-blue-500/35 to-cyan-400/25',
  },
  {
    id: 'shop-xj6-ninja',
    name: 'Yamaha XJ6 / MT-09 & Kawasaki Ninja ZX-10R',
    brand: 'Yamaha · Kawasaki',
    category: 'motos',
    priceBrl: 48500,
    priceLabel: 'A partir de R$ 48.500',
    badge: '💨 SÓ NO GRAU',
    emoji: '⚡',
    specs: 'Torque brutal · Ciclística perfeita pra pista e avenida',
    searchQuery: 'Yamaha XJ6 MT-09 Kawasaki Ninja a venda',
    accent: 'from-emerald-500/30 to-lime-400/20',
  },

  // CARROS ESPORTIVOS & NAVES
  {
    id: 'shop-bmw-320i',
    name: 'BMW 320i M Sport Turbo · Nave dos Cria',
    brand: 'BMW',
    category: 'carros',
    priceBrl: 249000,
    priceLabel: 'R$ 249.000',
    badge: '🚘 NAVE ESPORTIVA',
    emoji: '🚘',
    specs: 'Tração traseira · Pacote M Sport · Teto solar & som Harman',
    searchQuery: 'BMW 320i M Sport a venda Brasil',
    accent: 'from-cyan-500/30 to-blue-700/25',
  },
  {
    id: 'shop-golf-gti',
    name: 'VW Golf GTI / Jetta GLI Stage 2 · Pipoco no Escape',
    brand: 'Volkswagen',
    category: 'carros',
    priceBrl: 165000,
    priceLabel: 'A partir de R$ 165.000',
    badge: '🏁 TURBO BRABO',
    emoji: '🏁',
    specs: 'Motor 2.0 TSI · Câmbio DSG · Bancos xadrez esportivos',
    searchQuery: 'Volkswagen Golf GTI a venda Brasil',
    accent: 'from-rose-500/30 to-purple-600/20',
  },
  {
    id: 'shop-porsche',
    name: 'Porsche 911 Carrera / Macan GTS · Topo do Topo',
    brand: 'Porsche',
    category: 'carros',
    priceBrl: 590000,
    priceLabel: 'A partir de R$ 590.000',
    badge: '🏆 PATAMAR MÁXIMO',
    emoji: '🏎️',
    specs: '0 a 100 km/h em 3.5s · Interior em couro & som Bose/Burmester',
    searchQuery: 'Porsche 911 Macan a venda Brasil',
    accent: 'from-amber-400/30 to-pink-500/20',
  },
];

const CATEGORIES: { id: ShopCat; label: string }[] = [
  { id: 'all', label: '🔥 Tudo dos Cria' },
  { id: 'roupas', label: '🐊 Lacoste & Oakley' },
  { id: 'oculos', label: '🕶️ Óculos & Juliet' },
  { id: 'relogios', label: '⌚ Relógios' },
  { id: 'correntes', label: '🥇 Correntes Ouro' },
  { id: 'motos', label: '🏍️ Motos Esportivas' },
  { id: 'carros', label: '🚘 Carros & Naves' },
];

interface Props {
  onToast: (msg: string) => void;
}

export const ShopCriaView: React.FC<Props> = ({ onToast }) => {
  const [cat, setCat] = useState<ShopCat>('all');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<{ item: CriaProduct; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CRIA_CATALOG.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (!q) return true;
      return `${p.name} ${p.brand} ${p.specs} ${p.badge}`.toLowerCase().includes(q);
    });
  }, [cat, query]);

  const totalItems = cart.reduce((acc, c) => acc + c.qty, 0);
  const totalPrice = cart.reduce((acc, c) => acc + c.item.priceBrl * c.qty, 0);

  const addToCart = (item: CriaProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx >= 0) {
        return prev.map((c, i) => (i === idx ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item, qty: 1 }];
    });
    onToast(`🛍️ "${item.name}" na sacola dos cria!`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const buildOrderWhatsappUrl = () => {
    const lines = cart.map(
      (c) => `• ${c.qty}x ${c.item.name} (${c.item.priceLabel})`
    );
    const msg =
      `Salve! Montei minha lista de compras na Loja dos Cria do LENKYX Brasil 🔥:\n\n` +
      `${lines.join('\n')}\n\nTotal estimado: R$ ${totalPrice.toLocaleString('pt-BR')}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-5 pb-36 md:pb-28 cosmic-scene">
      {/* Graffiti + Robot HUD Shop Header */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LenkyxEdgeLogo size="md" className="shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> VITRINE DA QUEBRADA · LACOSTE, OAKLEY, OURO & NAVES
            </div>
            <h1 className="font-display text-base sm:text-xl font-black text-white truncate">
              🛍️ Loja dos Cria · Grife, Motos & Carros
            </h1>
            <p className="text-[11px] text-slate-300">
              Só o kit pesado que os cria curtem — monte sua lista ou compre direto nas ofertas oficiais do Brasil!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 text-black text-xs font-black flex items-center gap-2 shadow-[0_0_24px_rgba(34,211,238,0.4)] hover:brightness-110 transition shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Sacola ({totalItems})</span>
          {totalPrice > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-black/20 font-mono text-[10px]">
              R$ {totalPrice.toLocaleString('pt-BR')}
            </span>
          )}
        </button>
      </section>

      {/* Search + Category Pills */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar kit brabo: Lacoste, Juliet, Invicta, Corrente Ouro, Hornet, BMW..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-cyan-400/25 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition shrink-0 ${
                cat === c.id
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow'
                  : 'bg-white/[0.07] hover:bg-white/15 text-slate-200 border border-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const mlUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(item.searchQuery).replace(/%20/g, '-')}`;
          const webMotorsOrGoogle =
            item.category === 'motos' || item.category === 'carros'
              ? `https://www.webmotors.com.br/carros/estoque?tipoveiculo=${item.category === 'motos' ? 'motos' : 'carros'}&q=${encodeURIComponent(item.brand)}`
              : mlUrl;
          return (
            <div
              key={item.id}
              className="rounded-3xl cosmic-card-3d overflow-hidden flex flex-col justify-between p-4 space-y-3"
            >
              <div className="space-y-2.5">
                <div
                  className={`rounded-2xl bg-gradient-to-br ${item.accent} border border-white/15 p-4 flex items-center justify-between`}
                >
                  <span className="text-4xl select-none">{item.emoji}</span>
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/55 border border-cyan-400/35 text-[9px] font-black text-cyan-200">
                      {item.badge}
                    </span>
                    <div className="mt-1.5 font-mono text-sm font-black text-emerald-300">
                      {item.priceLabel}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    {item.brand}
                  </div>
                  <h3 className="font-display text-sm font-black text-white leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{item.specs}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => addToCart(item)}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-black text-xs font-black flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Botar na Sacola
                </button>
                <a
                  href={webMotorsOrGoogle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <span>Ver Oferta</span>
                  <ExternalLink className="w-3 h-3 text-cyan-300" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Drawer Modal */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl glass-panel border border-cyan-400/45 p-5 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-300" />
                <h3 className="font-display text-base font-black text-white">
                  Sacola dos Cria ({totalItems})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-full bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-300 space-y-2">
                <Sparkles className="w-8 h-8 text-cyan-300/60 mx-auto" />
                <p>Sua sacola tá vazia, parça! Escolhe umas peças ou naves aí pra salvar.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {cart.map(({ item, qty }) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          {item.emoji} {item.name}
                        </div>
                        <div className="text-[11px] text-emerald-300 font-mono">
                          R$ {(item.priceBrl * qty).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -qty)}
                          className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-sm font-black">
                    <span className="text-slate-200">Total Estimado:</span>
                    <span className="text-emerald-300 font-mono">
                      R$ {totalPrice.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <a
                    href={buildOrderWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4" /> Mandar Lista no Zap dos Cria
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setCart([]);
                      setCartOpen(false);
                      onToast('Lista limpa, parça!');
                    }}
                    className="w-full py-2 rounded-xl bg-white/10 text-xs font-bold text-slate-200"
                  >
                    Limpar Sacola
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

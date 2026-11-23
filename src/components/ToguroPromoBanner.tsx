import React from 'react';
import { Crown, Flame, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  variant?: 'card' | 'strip' | 'pill';
  onOpenToguroShop: () => void;
  className?: string;
}

export const ToguroPromoBanner: React.FC<Props> = ({
  variant = 'strip',
  onOpenToguroShop,
  className = '',
}) => {
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onOpenToguroShop}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 text-black text-[11px] font-black shadow-[0_0_20px_rgba(250,204,21,0.45)] hover:brightness-110 active:scale-95 transition ${className}`}
      >
        <Crown className="w-3.5 h-3.5 shrink-0" />
        <span>Mansão Maromba · Produtos do Toguro (Preços Reais)</span>
        <ArrowRight className="w-3 h-3 shrink-0" />
      </button>
    );
  }

  if (variant === 'strip') {
    return (
      <div
        onClick={onOpenToguroShop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpenToguroShop();
        }}
        className={`group cursor-pointer rounded-2xl overflow-hidden border border-amber-400/50 bg-gradient-to-r from-[#241605]/95 via-[#181207]/95 to-[#0b1f17]/95 p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-[0_10px_30px_rgba(250,204,21,0.16)] hover:border-amber-300 transition ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-amber-300/60 shrink-0">
            <img
              src="/shop/role-narguile-bebidas.jpg"
              alt="Produtos do Toguro · Mansão Maromba"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-emerald-400 text-[8px] font-black text-black">
              REAL
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> OFICIAL TOGURO
              </span>
              <span className="text-[10px] font-black text-emerald-300">Mansão Maromba</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
              🥃 Whisky, Vodka, Gin, Energético & Kit Treino do Toguro
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-100/80 truncate">
              Combos originais com preços reais do Mercado Livre, atualizados automaticamente
            </div>
          </div>
        </div>
        <span className="px-3.5 py-2 rounded-full lux-btn-gold text-[11px] font-black flex items-center gap-1.5 shrink-0">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ver Produtos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    );
  }

  return (
    <section
      onClick={onOpenToguroShop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenToguroShop();
      }}
      className={`group cursor-pointer relative rounded-3xl overflow-hidden border border-amber-400/55 bg-gradient-to-br from-[#2a1a05]/95 via-[#171108]/95 to-[#0b2319]/95 p-4 sm:p-5 shadow-[0_18px_48px_rgba(245,158,11,0.22)] hover:border-amber-300 transition ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-300/70 shrink-0 shadow-lg">
            <img
              src="/shop/role-narguile-bebidas.jpg"
              alt="Mansão Maromba Toguro"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-400 text-[8px] font-black text-black">
              PREÇO REAL
            </span>
          </div>
          <div className="min-w-0 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider">
              <Crown className="w-3 h-3" /> Indicação da Loja · Mansão Maromba (Toguro)
            </div>
            <h3 className="font-display text-sm sm:text-lg font-black text-white flex items-center gap-1.5">
              <span>🥃 Bebidas, Combos & Suplementos do Toguro</span>
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            </h3>
            <p className="text-[11px] sm:text-xs text-amber-100/85">
              Combo Mansão Maromba (Whisky, Vodka, Gin & Energético), Fardo Ice e Kit Treino + Whey com desconto VIP na plataforma!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenToguroShop();
          }}
          className="px-4 py-2.5 rounded-full lux-btn-gold text-xs font-black flex items-center gap-1.5 shrink-0 shadow-lg"
        >
          <Flame className="w-4 h-4" />
          <span>Comprar Produtos Toguro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};

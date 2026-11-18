import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LayoutGrid, Play, X } from 'lucide-react';

export interface PlayerQueueItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  badge?: string;
  badgeTone?: 'live' | 'accent' | 'neutral';
  durationLabel?: string;
  active?: boolean;
}

interface PlayerQueueStripProps {
  title: React.ReactNode;
  items: PlayerQueueItem[];
  onSelect: (id: string) => void;
  accent?: 'emerald' | 'cyan' | 'rose' | 'pink';
  headerRight?: React.ReactNode;
  defaultOpen?: boolean;
  emptyText?: string;
}

export const PlayerQueueStrip: React.FC<PlayerQueueStripProps> = ({
  title,
  items,
  onSelect,
  accent = 'cyan',
  headerRight,
  defaultOpen = true,
  emptyText,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [gridMode, setGridMode] = useState(false);
  const [arrowsVisible, setArrowsVisible] = useState(true);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const updateBounds = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  const wakeArrows = useCallback(() => {
    setArrowsVisible(true);
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = window.setTimeout(() => {
      setArrowsVisible(false);
    }, 2400);
  }, []);

  useEffect(() => {
    updateBounds();
    wakeArrows();
    window.addEventListener('resize', updateBounds);
    return () => {
      window.removeEventListener('resize', updateBounds);
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    };
  }, [items.length, open, gridMode, updateBounds, wakeArrows]);

  const scrollByStep = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    wakeArrows();
    const step = Math.max(260, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const accentTitle =
    accent === 'emerald'
      ? 'text-emerald-300'
      : accent === 'rose'
        ? 'text-rose-300'
        : accent === 'pink'
          ? 'text-pink-300'
          : 'text-cyan-300';

  const activeCardBorder =
    accent === 'emerald'
      ? 'border-emerald-400 bg-emerald-500/15'
      : accent === 'rose'
        ? 'border-rose-500 bg-rose-500/15'
        : accent === 'pink'
          ? 'border-pink-400 bg-pink-500/15'
          : 'border-cyan-400 bg-cyan-500/15';

  if (!open) {
    return (
      <div className="px-3 py-1.5 border-t border-white/10 bg-[#080412] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            wakeArrows();
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 text-[11px] font-black ${accentTitle} transition`}
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>{title}</span>
          <span className="text-white/70">({items.length})</span>
        </button>
        {headerRight}
      </div>
    );
  }

  return (
    <div
      className="p-2.5 sm:p-3 border-t border-white/10 bg-[#080412] space-y-2 shrink-0"
      onMouseMove={wakeArrows}
      onTouchStart={wakeArrows}
    >
      {/* Header Row with Interactive Grade + Fechar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${accentTitle}`}>
          <span>{title}</span>
          <span className="text-white/60">({items.length})</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {headerRight}

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setGridMode((g) => !g)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 transition ${
                gridMode
                  ? 'bg-cyan-400 text-black border-transparent'
                  : 'bg-white/[0.08] hover:bg-white/15 border-white/15 text-slate-100'
              }`}
              title={gridMode ? 'Voltar para faixa lateral' : 'Abrir menu em grade'}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{gridMode ? 'Faixa' : 'Ver Tudo'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setGridMode(false);
              setOpen(false);
            }}
            className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-rose-500/25 border border-white/15 text-[10px] font-black text-slate-200 hover:text-white flex items-center gap-1 transition"
            title="Fechar sugestões"
          >
            <ChevronDown className="w-3 h-3" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        emptyText ? <div className="text-[11px] text-slate-300/75 py-1">{emptyText}</div> : null
      ) : gridMode ? (
        /* Interactive Expandable Menu Grid (like Movies & Series) */
        <div className="max-h-56 sm:max-h-64 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id);
                setGridMode(false);
              }}
              className={`group text-left rounded-xl overflow-hidden border transition ${
                item.active ? activeCardBorder : 'border-white/10 bg-white/[0.04] hover:bg-white/10'
              }`}
            >
              <div className="relative aspect-video bg-black">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                {item.badge && (
                  <span
                    className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black ${
                      item.badgeTone === 'live'
                        ? 'bg-red-600 text-white'
                        : item.badgeTone === 'accent'
                          ? 'bg-cyan-400 text-black'
                          : 'bg-black/80 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.durationLabel && (
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono text-white">
                    {item.durationLabel}
                  </span>
                )}
                <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Play className="w-5 h-5 text-white fill-white" />
                </span>
              </div>
              <div className="p-1.5">
                <div className="text-[10px] font-bold text-white line-clamp-1">{item.title}</div>
                {item.subtitle && <div className="text-[9px] text-slate-300/70 truncate">{item.subtitle}</div>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Horizontal Strip with Auto-Fading Arrows + Mouse Wheel Support */
        <div className="relative group/strip">
          {canLeft && (
            <button
              type="button"
              onClick={() => scrollByStep(-1)}
              aria-label="Voltar sugestões"
              className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/85 hover:bg-black border border-white/25 text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-opacity duration-500 ${
                arrowsVisible ? 'opacity-95' : 'opacity-0 pointer-events-none group-hover/strip:opacity-95 group-hover/strip:pointer-events-auto'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div
            ref={scrollerRef}
            onScroll={() => {
              updateBounds();
              wakeArrows();
            }}
            onWheel={(e) => {
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && scrollerRef.current) {
                scrollerRef.current.scrollLeft += e.deltaY;
                wakeArrows();
              }
            }}
            className="flex items-stretch gap-2.5 overflow-x-auto overscroll-x-contain pb-1 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`group w-40 sm:w-48 shrink-0 text-left rounded-xl overflow-hidden border transition ${
                  item.active ? activeCardBorder : 'border-white/10 bg-white/[0.04] hover:bg-white/10'
                }`}
              >
                <div className="relative aspect-video bg-black">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  {item.badge && (
                    <span
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black ${
                        item.badgeTone === 'live'
                          ? 'bg-red-600 text-white'
                          : item.badgeTone === 'accent'
                            ? 'bg-cyan-400 text-black'
                            : 'bg-black/80 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.durationLabel && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono text-white">
                      {item.durationLabel}
                    </span>
                  )}
                  <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </span>
                </div>
                <div className="p-1.5">
                  <div className="text-[10px] font-bold text-white line-clamp-1">{item.title}</div>
                  {item.subtitle && <div className="text-[9px] text-slate-300/70 truncate">{item.subtitle}</div>}
                </div>
              </button>
            ))}
          </div>

          {canRight && (
            <button
              type="button"
              onClick={() => scrollByStep(1)}
              aria-label="Avançar sugestões"
              className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/85 hover:bg-black border border-white/25 text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-opacity duration-500 ${
                arrowsVisible ? 'opacity-95' : 'opacity-0 pointer-events-none group-hover/strip:opacity-95 group-hover/strip:pointer-events-auto'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

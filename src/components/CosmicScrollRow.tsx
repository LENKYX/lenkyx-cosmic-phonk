import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';

interface Props {
  title: React.ReactNode;
  subtitle?: string;
  count?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  gridToggleable?: boolean;
  defaultGrid?: boolean;
  rightActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  scrollStepPx?: number;
}

export const CosmicScrollRow: React.FC<Props> = ({
  title,
  subtitle,
  count,
  collapsible = false,
  defaultCollapsed = false,
  gridToggleable = true,
  defaultGrid = false,
  rightActions,
  children,
  className = '',
  scrollStepPx = 560,
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedGrid, setExpandedGrid] = useState(defaultGrid);

  const scrollRow = (dir: -1 | 1) => {
    const el = rowRef.current;
    if (!el) return;
    const step = Math.max(280, Math.min(scrollStepPx, el.clientWidth * 0.8));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className={`space-y-2.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xs sm:text-sm md:text-base font-black text-white flex items-center gap-1.5 truncate">
              {title}
            </h2>
            {typeof count === 'number' && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-purple-200 shrink-0">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-purple-200/70 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {rightActions}

          {!collapsed && !expandedGrid && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollRow(-1)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition"
                title="Passar para a esquerda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRow(1)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition"
                title="Passar para a direita"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {gridToggleable && !collapsed && (
            <button
              type="button"
              onClick={() => setExpandedGrid((v) => !v)}
              className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/15 text-[10px] font-extrabold text-cyan-200 flex items-center gap-1 transition"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{expandedGrid ? 'Carrossel' : 'Ver Tudo'}</span>
            </button>
          )}

          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.15] border border-white/10 text-[10px] font-bold text-purple-200 flex items-center gap-1 transition"
            >
              <span>{collapsed ? 'Mostrar' : 'Minimizar'}</span>
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        expandedGrid ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {children}
          </div>
        ) : (
          <div className="relative group/row">
            {/* Translucent Left Overlay Arrow */}
            <button
              type="button"
              onClick={() => scrollRow(-1)}
              aria-label="Rolar para a esquerda"
              className="flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 sm:w-11 h-20 sm:h-24 rounded-2xl bg-black/45 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-[0_0_25px_rgba(0,0,0,0.75)] opacity-85 sm:opacity-75 group-hover/row:opacity-100 transition active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div
              ref={rowRef}
              className="flex items-stretch gap-3 overflow-x-auto overscroll-x-contain pb-2 px-10 sm:px-12 scroll-smooth"
              style={{ scrollbarWidth: 'thin' }}
            >
              {children}
            </div>

            {/* Translucent Right Overlay Arrow */}
            <button
              type="button"
              onClick={() => scrollRow(1)}
              aria-label="Rolar para a direita"
              className="flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 sm:w-11 h-20 sm:h-24 rounded-2xl bg-black/45 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-[0_0_25px_rgba(0,0,0,0.75)] opacity-85 sm:opacity-75 group-hover/row:opacity-100 transition active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )
      )}
    </section>
  );
};

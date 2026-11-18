import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';

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
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ down: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    down: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedGrid, setExpandedGrid] = useState(defaultGrid);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = rowRef.current;
    if (!el || e.button !== 0) return;
    dragState.current = {
      down: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = rowRef.current;
    if (!el || !dragState.current.down) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragState.current.startX;
    if (Math.abs(walk) > 6) {
      dragState.current.moved = true;
      el.scrollLeft = dragState.current.scrollLeft - walk * 1.15;
    }
  };

  const stopDrag = () => {
    dragState.current.down = false;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  return (
    <section className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-2 truncate tracking-tight">
              {title}
            </h2>
            {typeof count === 'number' && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-cyan-200 shrink-0">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-300/70 truncate mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {rightActions}

          {gridToggleable && !collapsed && (
            <button
              type="button"
              onClick={() => setExpandedGrid((v) => !v)}
              className={`px-3 py-1 rounded-full border text-[10px] font-extrabold flex items-center gap-1 transition ${
                expandedGrid
                  ? 'bg-red-600/90 border-red-400 text-white shadow'
                  : 'bg-white/[0.08] hover:bg-white/15 border-white/15 text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{expandedGrid ? 'Carrossel' : 'Ver Tudo'}</span>
            </button>
          )}

          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.15] border border-white/10 text-[10px] font-bold text-slate-200 flex items-center gap-1 transition"
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
          <div className="relative">
            <div
              ref={rowRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              onClickCapture={handleClickCapture}
              className="flex items-stretch gap-3 overflow-x-auto overscroll-x-contain snap-x snap-proximity pb-2.5 px-1 scroll-smooth cursor-grab active:cursor-grabbing select-none"
              style={{ scrollbarWidth: 'none' }}
            >
              {children}
            </div>
            {/* Subtle Netflix-style edge vignette without blocking or floating arrows */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#04010c]/75 to-transparent" />
          </div>
        )
      )}
    </section>
  );
};

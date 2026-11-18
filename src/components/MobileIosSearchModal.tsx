import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Shield, Sparkles, Music, Film, Keyboard, Delete, CornerDownLeft, ArrowUp } from 'lucide-react';

interface Props {
  open: boolean;
  query: string;
  isPrivate: boolean;
  suggestions: string[];
  onChangeQuery: (q: string) => void;
  onClose: () => void;
  onSubmitAll: (q: string, priv: boolean) => void;
  onSubmitMusic: (q: string) => void;
  onTogglePrivate: () => void;
}

const QUICK_TRENDS = [
  'Alok',
  'Ana Castela',
  'MC Ryan SP',
  'Matuê',
  'Phonk',
  'Sertanejo',
  'Clipes HD',
  'Filmes',
  'Futebol Ao Vivo',
  'Suno IA',
];

const IOS_ROWS_ALPHA = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const IOS_ROWS_NUM = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  ['.', ',', '?', '!', "'", '+', '*', '#'],
];

export const MobileIosSearchModal: React.FC<Props> = ({
  open,
  query,
  isPrivate,
  suggestions,
  onChangeQuery,
  onClose,
  onSubmitAll,
  onSubmitMusic,
  onTogglePrivate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showIosKeyboard, setShowIosKeyboard] = useState(true);
  const [numericMode, setNumericMode] = useState(false);
  const [caps, setCaps] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      if (!showIosKeyboard) {
        inputRef.current?.focus();
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [open, showIosKeyboard]);

  if (!open) return null;

  const tapKey = (k: string) => {
    setActiveKey(k);
    window.setTimeout(() => setActiveKey((prev) => (prev === k ? null : prev)), 130);
    const ch = numericMode ? k : caps ? k.toUpperCase() : k.toLowerCase();
    onChangeQuery(query + ch);
  };

  const handleBackspace = () => {
    if (!query) return;
    onChangeQuery(query.slice(0, -1));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = query.trim();
    if (!cleaned) return;
    onSubmitAll(cleaned, isPrivate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9995] bg-[#070512]/92 backdrop-blur-3xl flex flex-col animate-[fadeIn_0.16s_ease-out]">
      {/* Top iPhone Spotlight Search Header */}
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent space-y-2.5">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2 rounded-2xl bg-[#1c1a29]/90 border border-white/20 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Search className="w-4 h-4 text-slate-300 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              inputMode={showIosKeyboard ? 'none' : 'search'}
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              onClick={() => {
                if (showIosKeyboard) setShowIosKeyboard(true);
              }}
              placeholder="Buscar músicas, artistas, filmes..."
              className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-white placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => onChangeQuery('')}
                className="w-5 h-5 rounded-full bg-slate-500/50 hover:bg-slate-400/70 text-white flex items-center justify-center shrink-0"
                aria-label="Limpar"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-2 text-[14px] font-semibold text-sky-400 hover:text-sky-300 shrink-0"
          >
            Cancelar
          </button>
        </form>

        {/* iPhone-style Quick Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowIosKeyboard((v) => {
                  const next = !v;
                  if (!next) {
                    window.setTimeout(() => inputRef.current?.focus(), 60);
                  }
                  return next;
                });
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border shrink-0 transition ${
                showIosKeyboard
                  ? 'bg-sky-500/25 border-sky-400/50 text-sky-200'
                  : 'bg-white/[0.07] border-white/10 text-slate-300'
              }`}
            >
              <Keyboard className="w-3 h-3" />
              {showIosKeyboard ? 'Digitador iPhone' : 'Teclado Nativo'}
            </button>

            <button
              type="button"
              onClick={onTogglePrivate}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border shrink-0 transition ${
                isPrivate
                  ? 'bg-purple-500/30 border-purple-400 text-purple-100'
                  : 'bg-white/[0.07] border-white/10 text-slate-300'
              }`}
            >
              <Shield className="w-3 h-3" /> Privada
            </button>
          </div>

          {query.trim() && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onSubmitMusic(query);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-full bg-pink-500/25 border border-pink-400/45 text-pink-100 text-[11px] font-bold flex items-center gap-1"
              >
                <Music className="w-3 h-3" /> Artistas
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 text-black text-[11px] font-black flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Buscar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle Suggestions / Quick Spotlight Cards */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3.5 py-3 space-y-4">
        {query.trim() && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="p-3 rounded-2xl bg-gradient-to-r from-sky-500/25 to-cyan-500/20 border border-sky-400/40 text-left flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">Buscar Tudo</div>
                <div className="text-[10px] text-sky-200/85 truncate">"{query.trim()}"</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                onSubmitMusic(query);
                onClose();
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-pink-500/25 to-purple-500/20 border border-pink-400/40 text-left flex items-center gap-2"
            >
              <Film className="w-4 h-4 text-pink-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">Artistas & Clipes</div>
                <div className="text-[10px] text-pink-200/85 truncate">Tocar direto</div>
              </div>
            </button>
          </div>
        )}

        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Sugestões Rápidas
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_TRENDS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  onSubmitAll(tag, isPrivate);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs font-semibold text-slate-100 transition active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
            {suggestions.slice(0, 5).map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  onSubmitAll(sug, isPrivate);
                  onClose();
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs text-slate-100 hover:bg-white/[0.08] flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Search className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate font-medium">{sug}</span>
                </span>
                <span className="text-[10px] text-sky-300 font-semibold shrink-0">Ir</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern iPhone-Style Liquid Glass Virtual Keyboard */}
      {showIosKeyboard && (
        <div className="shrink-0 px-1.5 pt-2 pb-3 bg-[#171622]/95 backdrop-blur-2xl border-t border-white/15 select-none space-y-1.5">
          {(numericMode ? IOS_ROWS_NUM : IOS_ROWS_ALPHA).map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center justify-center gap-1">
              {rowIdx === 2 && !numericMode && (
                <button
                  type="button"
                  onClick={() => setCaps((c) => !c)}
                  className={`h-11 px-2.5 rounded-lg flex items-center justify-center text-xs font-bold shadow-[0_1px_0_rgba(0,0,0,0.45)] transition active:scale-95 ${
                    caps ? 'bg-white text-black' : 'bg-[#3b3a4a] text-white'
                  }`}
                  aria-label="Maiúsculas"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
              {row.map((k) => {
                const label = numericMode ? k : caps ? k.toUpperCase() : k.toLowerCase();
                const isPopped = activeKey === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => tapKey(k)}
                    className={`relative flex-1 max-w-[36px] h-11 rounded-lg bg-[#525163]/90 hover:bg-[#646378] active:bg-white active:text-black text-white text-[17px] font-medium flex items-center justify-center shadow-[0_1.5px_0_rgba(0,0,0,0.55)] transition-transform ${
                      isPopped ? '-translate-y-1 scale-110 bg-white text-black' : ''
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              {rowIdx === 2 && (
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-11 px-2.5 rounded-lg bg-[#3b3a4a] active:bg-white active:text-black text-white flex items-center justify-center shadow-[0_1px_0_rgba(0,0,0,0.45)] transition active:scale-95"
                  aria-label="Apagar"
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* Bottom iOS Space / 123 / Buscar Row */}
          <div className="flex items-center gap-1.5 pt-0.5 px-0.5">
            <button
              type="button"
              onClick={() => setNumericMode((n) => !n)}
              className="h-11 px-3.5 rounded-lg bg-[#3b3a4a] active:bg-white active:text-black text-white text-xs font-bold shadow-[0_1px_0_rgba(0,0,0,0.45)]"
            >
              {numericMode ? 'ABC' : '123'}
            </button>
            <button
              type="button"
              onClick={() => onChangeQuery(query + ' ')}
              className="flex-1 h-11 rounded-lg bg-[#525163]/90 active:bg-white active:text-black text-slate-200 text-xs font-semibold shadow-[0_1.5px_0_rgba(0,0,0,0.55)]"
            >
              espaço
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="h-11 px-4 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-400 active:brightness-110 text-black text-xs font-black flex items-center gap-1 shadow-[0_1px_12px_rgba(56,189,248,0.45)]"
            >
              <CornerDownLeft className="w-3.5 h-3.5" /> Buscar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

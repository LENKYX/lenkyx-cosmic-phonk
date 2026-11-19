import React, { useMemo, useState } from 'react';
import { Globe2, Search, X, Check, Sparkles } from 'lucide-react';
import { WORLD_LANGUAGES, getLanguageMeta } from '../utils/globalI18n';

interface Props {
  open: boolean;
  onClose: () => void;
  currentLang: string;
  detectedCountry?: string;
  onSelectLanguage: (langCode: string) => void;
  onResetAutoDetect: () => void;
}

export const WorldLanguageModal: React.FC<Props> = ({
  open,
  onClose,
  currentLang,
  detectedCountry,
  onSelectLanguage,
  onResetAutoDetect,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORLD_LANGUAGES;
    return WORLD_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [query]);

  if (!open) return null;

  const cur = getLanguageMeta(currentLang);

  return (
    <div
      data-no-translate="true"
      className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-2xl max-h-[88vh] rounded-3xl cosmic-card-3d border border-cyan-400/40 bg-[#080316] shadow-[0_24px_80px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/60 via-purple-950/50 to-pink-950/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-black shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Global Auto-Language · 100+ Languages
              </div>
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {cur.flag} {cur.nativeName} ({cur.name}){detectedCountry ? ` · ${detectedCountry}` : ''}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search language / Idioma / 言語 / اللغة ..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onResetAutoDetect();
              onClose();
            }}
            className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-xs font-black transition"
          >
            🌍 Auto Region
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map((lang) => {
            const active = lang.code === cur.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border text-left transition ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/25 to-pink-500/25 border-cyan-400 text-white shadow'
                    : 'bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-black truncate">
                    {lang.flag} {lang.nativeName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{lang.name}</div>
                </div>
                {active && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

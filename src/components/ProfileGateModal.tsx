import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Check, Trash2, ArrowRight, Baby, Film, Music2, Flame } from 'lucide-react';
import { WorldProfile, TabId } from '../types';

const PROFILES_KEY = 'lenkyx_world_profiles_v1';
const ACTIVE_PROFILE_KEY = 'lenkyx_active_profile_id_v1';

export const DEFAULT_WORLD_PROFILES: WorldProfile[] = [
  {
    id: 'profile-main',
    name: 'Meu Mundo',
    avatarEmoji: '🌌',
    avatarColor: 'from-rose-500 via-pink-500 to-purple-600',
    subtitle: 'Acesso completo · Músicas, Clipes, Séries & Filmes em HD',
    tags: ['Músicas Mundiais', 'Clipes Oficiais', 'Cinema HD'],
    heroImg: '/covers/icon-512.png',
    focusTab: 'catalog',
  },
  {
    id: 'profile-cinema',
    name: 'Cinema & Séries',
    avatarEmoji: '🎬',
    avatarColor: 'from-red-600 via-rose-500 to-amber-500',
    subtitle: 'Maratonas de Filmes, Séries e Ação no Celular, PC e TV',
    tags: ['Filmes HD', 'Séries', 'Animes'],
    heroImg: '/covers/track-05.jpg',
    focusTab: 'movies',
  },
  {
    id: 'profile-business',
    name: 'Comércio & Clipes',
    avatarEmoji: '🏪',
    avatarColor: 'from-cyan-400 via-blue-500 to-indigo-600',
    subtitle: 'Ideal para conveniências, lojas e bares · Músicas & Clipes sem anúncios',
    tags: ['Zero Anúncios', 'Clipes Oficiais', 'Som Contínuo'],
    heroImg: '/covers/track-12.jpg',
    focusTab: 'explore',
  },
  {
    id: 'profile-kids',
    name: 'Infantil',
    avatarEmoji: '🧸',
    avatarColor: 'from-emerald-400 via-teal-400 to-cyan-500',
    subtitle: 'Animações, trilhas alegres e diversão segura para família',
    tags: ['Animes & Família', 'Animações', 'Livre'],
    isKids: true,
    heroImg: '/covers/track-09.jpg',
    focusTab: 'movies',
  },
];

export function loadWorldProfiles(): WorldProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return DEFAULT_WORLD_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WORLD_PROFILES;
  } catch {
    return DEFAULT_WORLD_PROFILES;
  }
}

export function loadActiveWorldProfile(): WorldProfile {
  const list = loadWorldProfiles();
  try {
    const savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return list.find((p) => p.id === savedId) || list[0];
  } catch {
    return list[0];
  }
}

export function saveActiveWorldProfile(id: string) {
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } catch {
    // ignore
  }
}

const AVATAR_PRESETS = [
  { emoji: '🌌', color: 'from-rose-500 via-pink-500 to-purple-600' },
  { emoji: '🎧', color: 'from-cyan-400 via-blue-500 to-indigo-600' },
  { emoji: '🎬', color: 'from-red-600 via-rose-500 to-amber-500' },
  { emoji: '🔥', color: 'from-orange-500 via-pink-500 to-purple-600' },
  { emoji: '🧸', color: 'from-emerald-400 via-teal-400 to-cyan-500' },
  { emoji: '🚀', color: 'from-violet-500 via-fuchsia-500 to-cyan-400' },
];

interface Props {
  open: boolean;
  activeProfileId: string;
  onSelectProfile: (profile: WorldProfile, navigateToFocus: boolean) => void;
  onClose?: () => void;
}

export const ProfileGateModal: React.FC<Props> = ({
  open,
  activeProfileId,
  onSelectProfile,
  onClose,
}) => {
  const [profiles, setProfiles] = useState<WorldProfile[]>(() => loadWorldProfiles());
  const [focusedIdx, setFocusedIdx] = useState(() => {
    const idx = loadWorldProfiles().findIndex((p) => p.id === activeProfileId);
    return idx >= 0 ? idx : 0;
  });
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPresetIdx, setNewPresetIdx] = useState(0);
  const [newIsKids, setNewIsKids] = useState(false);
  const [newFocusTab, setNewFocusTab] = useState<TabId>('catalog');

  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch {
      // ignore
    }
  }, [profiles]);

  // TV Remote / Keyboard Up-Down-Enter navigation
  useEffect(() => {
    if (!open || creating) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx((i) => (i + 1) % profiles.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx((i) => (i - 1 + profiles.length) % profiles.length);
      } else if (e.key === 'Enter') {
        const chosen = profiles[focusedIdx];
        if (chosen) onSelectProfile(chosen, true);
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, creating, profiles, focusedIdx, onSelectProfile, onClose]);

  if (!open) return null;

  const focused = profiles[focusedIdx] || profiles[0];

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) return;
    const preset = AVATAR_PRESETS[newPresetIdx % AVATAR_PRESETS.length];
    const created: WorldProfile = {
      id: `profile-${Date.now()}`,
      name: clean.slice(0, 22),
      avatarEmoji: preset.emoji,
      avatarColor: preset.color,
      subtitle: newIsKids
        ? 'Perfil Infantil · Diversão segura para toda a família'
        : 'Perfil Personalizado · Sem login e sem cadastro',
      tags: newIsKids ? ['Infantil', 'Família'] : ['Músicas', 'Clipes', 'Cinema'],
      isKids: newIsKids,
      heroImg: newFocusTab === 'movies' ? '/covers/track-05.jpg' : '/covers/icon-512.png',
      focusTab: newFocusTab,
    };
    const next = [...profiles, created];
    setProfiles(next);
    setFocusedIdx(next.length - 1);
    setCreating(false);
    setNewName('');
    onSelectProfile(created, true);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    setFocusedIdx(0);
  };

  return (
    <div className="fixed inset-0 z-[9992] bg-[#04010c] text-white overflow-y-auto overscroll-contain flex flex-col">
      {/* Dynamic Hero Artwork Background (Desktop & TV Showcase) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <img
          key={focused.heroImg}
          src={focused.heroImg}
          alt={focused.name}
          className="w-full h-full object-cover opacity-35 scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#04010c] via-[#04010c]/85 to-[#04010c]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04010c] via-transparent to-[#04010c]/80" />
      </div>

      {/* Main Split Stage */}
      <div className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-5 sm:px-10 py-8 sm:py-12 flex flex-col lg:flex-row items-center lg:items-stretch justify-between gap-8">
        {/* Left Column: Profile Selector Rail (Inspired by Smart TV selector, 100% LENKYX!) */}
        <div className="w-full max-w-sm flex flex-col justify-center space-y-5">
          <div>
            <div className="font-display text-2xl sm:text-3xl font-black tracking-widest text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-cyan-300">
                LENKYX
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-300 mt-1">
              Escolha um perfil · Acesso livre sem login
            </p>
          </div>

          {!creating ? (
            <div className="space-y-2.5">
              {profiles.map((p, idx) => {
                const isFocused = idx === focusedIdx;
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setFocusedIdx(idx)}
                    onClick={() => onSelectProfile(p, true)}
                    className={`group relative flex items-center gap-3.5 p-2.5 rounded-2xl cursor-pointer transition-all ${
                      isFocused
                        ? 'bg-white/15 border-2 border-white shadow-[0_0_32px_rgba(236,72,153,0.35)] scale-[1.02]'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${p.avatarColor} flex items-center justify-center text-2xl sm:text-3xl shadow-lg shrink-0 relative`}
                    >
                      <span>{p.avatarEmoji}</span>
                      {p.isKids && (
                        <span className="absolute -bottom-1 inset-x-1 py-0.5 rounded bg-black/80 text-[8px] font-black text-emerald-300 text-center uppercase tracking-wider">
                          Infantil
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base font-black text-white truncate">{p.name}</div>
                      <div className="text-[11px] text-cyan-200/80 truncate">{p.tags.join(' · ')}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {profiles.length > 1 && idx >= 4 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(p.id);
                          }}
                          className="p-1.5 rounded-lg bg-black/50 hover:bg-rose-600 text-slate-300 hover:text-white"
                          title="Excluir perfil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ArrowRight
                        className={`w-4 h-4 transition ${
                          isFocused ? 'text-white translate-x-0.5' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Add New Profile Button */}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full p-3 rounded-2xl border border-dashed border-white/25 bg-white/[0.03] hover:bg-white/[0.09] text-slate-200 text-xs font-extrabold flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4 text-cyan-300" />
                <span>Criar Novo Perfil (Grátis)</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCreateProfile}
              className="rounded-3xl bg-black/70 backdrop-blur-xl border border-white/15 p-4 space-y-3.5"
            >
              <div className="text-sm font-black text-white">Novo Perfil no LENKYX</div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do perfil (ex: Família, Casa, Carro...)"
                maxLength={22}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />

              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_PRESETS.map((av, i) => (
                  <button
                    key={av.emoji}
                    type="button"
                    onClick={() => setNewPresetIdx(i)}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${av.color} text-lg flex items-center justify-center border-2 transition ${
                      newPresetIdx === i ? 'border-white scale-110' : 'border-transparent opacity-60'
                    }`}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'catalog' as TabId, label: 'Músicas', icon: <Music2 className="w-3 h-3" /> },
                  { id: 'movies' as TabId, label: 'Cinema', icon: <Film className="w-3 h-3" /> },
                  { id: 'explore' as TabId, label: 'Artistas', icon: <Flame className="w-3 h-3" /> },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewFocusTab(opt.id)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 ${
                      newFocusTab === opt.id
                        ? 'bg-cyan-400 text-black border-cyan-300'
                        : 'bg-white/5 text-slate-200 border-white/10'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsKids}
                  onChange={(e) => setNewIsKids(e.target.checked)}
                  className="accent-emerald-400"
                />
                <Baby className="w-4 h-4" /> Perfil Infantil (conteúdo livre para crianças)
              </label>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-cyan-400 text-black text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar & Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Live Featured Showcase for Hovered/Focused Profile */}
        <div className="hidden lg:flex flex-1 flex-col justify-end pb-8 pl-8 space-y-4">
          <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black text-cyan-200">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> {focused.name}
          </div>
          <h2 className="font-display text-4xl xl:text-5xl font-black text-white leading-tight max-w-xl drop-shadow-2xl">
            {focused.isKids
              ? 'DIVERSÃO & ANIMAÇÕES PARA A FAMÍLIA'
              : focused.focusTab === 'movies'
                ? 'CINEMA, SÉRIES & ANIMES EM HD'
                : focused.focusTab === 'explore'
                  ? 'MÚSICAS & CLIPES SEM ANÚNCIOS'
                  : 'MÚSICAS ORIGINAIS LENKYX & LAZER'}
          </h2>
          <p className="text-sm text-slate-200/90 max-w-lg leading-relaxed">{focused.subtitle}</p>
          <div className="flex flex-wrap gap-2">
            {focused.tags.map((tg) => (
              <span
                key={tg}
                className="px-3 py-1 rounded-full bg-black/55 border border-white/15 text-xs font-bold text-slate-200"
              >
                • {tg}
              </span>
            ))}
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelectProfile(focused, true)}
              className="px-7 py-3.5 rounded-full bg-white hover:bg-cyan-100 text-black font-black text-sm flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.28)] transition active:scale-95"
            >
              <span>Entrar como {focused.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  SkipForward,
  SkipBack,
  Radio,
  Crown,
  Music4,
  Search,
  MoreVertical,
  Download,
  ListPlus,
  X,
  Maximize2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { fetchWorldShorts } from '../utils/communityApi';

/**
 * 📻 RÁDIO DO MORRO — MORRO GOLD (24k)
 * TUDO DENTRO DA RÁDIO: hits da favela, pesquisa, ⋮ (baixar/criar playlist),
 * clipes em tela cheia com setinha dourada, media player completo 24k.
 */

type RadioTrack = {
  id: string;
  title: string;
  artist?: string;
  coverUrl?: string;
  audioUrl?: string;
};

interface Props {
  tracks: RadioTrack[];
  currentTrack: RadioTrack | null;
  isPlaying: boolean;
  onPlayTrack: (t: RadioTrack, queue: RadioTrack[]) => void;
}

type Playlist = { id: string; name: string; tracks: RadioTrack[] };

const EQ_BARS = [0.55, 0.9, 0.4, 0.75, 1, 0.5, 0.85, 0.35, 0.7, 0.95, 0.45, 0.8];
const PLAYLISTS_KEY = 'mg_radio_playlists_v1';

function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    return raw ? (JSON.parse(raw) as Playlist[]) : [];
  } catch {
    return [];
  }
}
function savePlaylists(list: Playlist[]) {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(list));
  } catch {
    /* ok */
  }
}

export default function MorroRadioView({ tracks, currentTrack, isPlaying, onPlayTrack }: Props) {
  const queue = tracks.length ? tracks : [];
  const currentIndex = currentTrack ? queue.findIndex((t) => t.id === currentTrack.id) : -1;
  const nextTrack = queue.length ? queue[(currentIndex + 1 + queue.length) % queue.length] : null;
  const prevTrack = queue.length ? queue[(currentIndex - 1 + queue.length) % queue.length] : null;

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistsOpen, setPlaylistsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>(loadPlaylists);
  const [clip, setClip] = useState<{ yt: string; title: string } | null>(null);
  const [clipLoading, setClipLoading] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 🔄 ATUALIZAÇÃO AUTOMÁTICA: os hits se renovam sozinhos!
  useEffect(() => {
    const iv = window.setInterval(() => setRefreshTick((t) => t + 1), 7 * 60 * 1000);
    return () => window.clearInterval(iv);
  }, []);

  // fecha o menu ⋮ ao tocar fora (e ele já fecha ao escolher!)
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  // 🔥 HITS DA FAVELA — ordem que se atualiza sozinha (rotaciona!)
  const hits = useMemo(() => {
    const seed = Math.floor(refreshTick / 1) + new Date().getMinutes();
    const arr = [...queue];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (i * 7 + seed * 13) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length, refreshTick]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hits;
    return hits.filter((t) =>
      (t.title + ' ' + (t.artist || '')).toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, search]);

  const handleLigar = () => {
    if (!queue.length) return;
    const t = currentIndex >= 0 ? queue[currentIndex] : queue[0];
    onPlayTrack(t, queue);
  };
  const handleProxima = () => {
    if (!queue.length) return;
    onPlayTrack(nextTrack || queue[0], queue);
  };
  const handleAnterior = () => {
    if (!queue.length) return;
    onPlayTrack(prevTrack || queue[queue.length - 1], queue);
  };

  // ⬇️ BAIXAR MÚSICA (arquivo real da faixa!)
  const handleBaixar = (t: RadioTrack) => {
    const url = t.audioUrl || '';
    if (!url) {
      window.alert('Essa faixa não tem arquivo pra download ainda! 👑');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(t.artist || 'MORRO GOLD')} - ${t.title}.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ⬇️ BAIXAR PLAYLIST (arquivo .m3u com todas as faixas!)
  const handleBaixarPlaylist = (name: string, list: RadioTrack[]) => {
    const lines = ['#EXTM3U', ...list.flatMap((t) => [`#EXTINF:-1,${t.artist || 'MORRO GOLD'} - ${t.title}`, t.audioUrl || ''])];
    const blob = new Blob([lines.join('\n')], { type: 'audio/x-mpegurl' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `PLAYLIST ${name}.m3u`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // 📋 CRIAR PLAYLIST (com os artistas que o pessoal mais curte!)
  const handleCriarPlaylist = () => {
    const nome = window.prompt('Nome da playlist:', 'Hits da Quebrada');
    if (!nome) return;
    const fonte = currentTrack ? [currentTrack, ...queue.filter((t) => t.id !== currentTrack!.id)] : queue;
    const nova: Playlist = { id: String(Date.now()), name: nome.trim(), tracks: fonte.slice(0, 30) };
    const next = [nova, ...playlists];
    setPlaylists(next);
    savePlaylists(next);
  };

  const handleExcluirPlaylist = (id: string) => {
    const next = playlists.filter((p) => p.id !== id);
    setPlaylists(next);
    savePlaylists(next);
  };

  // 🎬 CLIPE EM TELA CHEIA (busca o clipe oficial no YouTube!)
  const abrirClipe = async (t: RadioTrack) => {
    const q = `${t.artist || ''} ${t.title} clipe oficial`.trim();
    setClipLoading(t.id);
    try {
      const items = await fetchWorldShorts('all', q, new Set(), true);
      const it: any = Array.isArray(items) ? items[0] : null;
      const yt = it ? it.youtube_id || it.youtubeId || it.id || '' : '';
      if (yt && typeof yt === 'string' && yt.length >= 6) {
        setClip({ yt, title: `${t.artist || 'MORRO GOLD'} — ${t.title}` });
      } else {
        window.alert('Não achei o clipe dessa faixa agora! Tenta outra 👑');
      }
    } catch {
      window.alert('Sem conexão pra buscar o clipe agora! 📶');
    } finally {
      setClipLoading('');
    }
  };

  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      {/* FUNDO DOURADO */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(245,190,60,0.16),transparent_60%),radial-gradient(110%_80%_at_80%_110%,rgba(120,60,200,0.18),transparent_60%),linear-gradient(180deg,#120a04,#0b0510_55%,#07030f)]" />

      <div className="max-w-2xl mx-auto px-3 sm:px-5 py-5 space-y-4">
        {/* CABEÇALHO + LUPINHA 24k + ⋮ */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 flex items-center justify-center shadow-[0_10px_26px_rgba(245,200,76,0.45)]">
              <Radio className="w-5 h-5 text-black" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-white truncate flex items-center gap-1.5">
                RÁDIO DO MORRO <Crown className="w-4 h-4 text-amber-300" />
              </h1>
              <div className="text-[10px] text-amber-200/90 font-bold tracking-[0.18em] uppercase">
                Hits da favela · atualiza sozinho · 24k
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2" ref={menuRef}>
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] shadow-[0_4px_16px_rgba(255,190,50,0.55)] border border-amber-100/70 active:scale-90"
              title="Pesquisar músicas"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] shadow-[0_4px_16px_rgba(255,190,50,0.55)] border border-amber-100/70 active:scale-90"
              title="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* MENU ⋮ TRANSPARENTE — fecha sozinho ao escolher! */}
            {menuOpen && (
              <div className="absolute top-full right-0 mt-2 z-50 min-w-[230px] rounded-2xl border border-amber-300/35 bg-black/25 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.55)] p-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (currentTrack) handleBaixar(currentTrack);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-extrabold text-amber-100 hover:bg-white/10 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-amber-300" /> ⬇️ Baixar música atual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleCriarPlaylist();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-extrabold text-amber-100 hover:bg-white/10 flex items-center gap-2"
                >
                  <ListPlus className="w-4 h-4 text-amber-300" /> 📋 Criar playlist
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setPlaylistsOpen((v) => !v);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-extrabold text-amber-100 hover:bg-white/10 flex items-center gap-2"
                >
                  <Music4 className="w-4 h-4 text-amber-300" /> 🎧 Minhas playlists
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setRefreshTick((t) => t + 1);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-extrabold text-amber-100 hover:bg-white/10 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" /> 🔄 Atualizar agora
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LUPINHA: campo de busca 24k */}
        {searchOpen && (
          <div className="relative">
            <Search className="w-4 h-4 text-amber-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar música ou artista..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-black/30 border border-amber-300/40 text-sm text-amber-50 focus:outline-none focus:border-amber-300"
              autoFocus
            />
          </div>
        )}

        {/* DISCO + EQUALIZADOR */}
        <section className="rounded-3xl border border-amber-400/25 bg-white/[0.05] backdrop-blur-md p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* DISCO GIRANDO */}
            <div className={`relative w-40 h-40 shrink-0 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '9s' }}>
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#f6c324,#8a5f10,#f6c324,#fff3c4,#f6c324)] shadow-[0_18px_50px_rgba(245,200,76,0.35)]" />
              <div className="absolute inset-[10px] rounded-full overflow-hidden border-4 border-black/60">
                <img
                  src={currentTrack?.coverUrl || '/covers/album-official.jpg'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-black border-4 border-amber-300/70" />
            </div>

            {/* EQUALIZADOR DOURADO */}
            <div className="flex-1 w-full">
              <div className="flex items-end gap-1 h-16 justify-center sm:justify-start">
                {EQ_BARS.map((h, i) => (
                  <div
                    key={i}
                    className="w-2.5 rounded-t bg-gradient-to-t from-amber-600 via-yellow-400 to-amber-200 transition-all duration-300"
                    style={{ height: `${(isPlaying ? h : 0.18) * 100}%` }}
                  />
                ))}
              </div>

              {/* TOCANDO AGORA */}
              <div className="mt-3 text-center sm:text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300"> tocando agora</div>
                <div className="text-sm font-black text-white truncate">
                  {currentTrack ? currentTrack.title : 'Aperta LIGAR e o rádio não para!'}
                </div>
                <div className="text-[11px] text-slate-300 truncate">{currentTrack?.artist || 'MORRO GOLD'}</div>
              </div>

              {/* BOTÕES 24k (media player DENTRO da rádio!) */}
              <div className="flex flex-wrap gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={handleAnterior}
                  className="px-4 py-3 rounded-2xl border border-amber-400/45 bg-white/[0.07] hover:bg-amber-400/20 text-amber-100 font-black text-sm flex items-center gap-2 active:scale-95 transition"
                >
                  <SkipBack className="w-4 h-4" /> ANTERIOR
                </button>
                <button
                  type="button"
                  onClick={handleLigar}
                  className="flex-1 min-w-[140px] py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(245,200,76,0.4)] hover:brightness-110 active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-black" /> {isPlaying ? 'TOCANDO 🔊' : 'LIGAR O RÁDIO'}
                </button>
                <button
                  type="button"
                  onClick={handleProxima}
                  className="px-4 py-3 rounded-2xl border border-amber-400/45 bg-white/[0.07] hover:bg-amber-400/20 text-amber-100 font-black text-sm flex items-center gap-2 active:scale-95 transition"
                >
                  <SkipForward className="w-4 h-4" /> PRÓXIMA
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PLAYLISTS */}
        {playlistsOpen && (
          <section className="rounded-3xl border border-amber-400/25 bg-white/[0.05] backdrop-blur-md p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">🎧 Minhas playlists</div>
              <button
                type="button"
                onClick={() => setPlaylistsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {playlists.length === 0 ? (
              <div className="text-xs text-slate-300 text-center py-3">
                Nada ainda! Abre o menu ⋮ e cria a primeira playlist 👑
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 border border-amber-400/20 bg-black/20">
                    <button
                      type="button"
                      onClick={() => p.tracks[0] && onPlayTrack(p.tracks[0], p.tracks)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="text-xs font-black text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-amber-200/80">{p.tracks.length} faixas · tocar ▶</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBaixarPlaylist(p.name, p.tracks)}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] flex items-center justify-center active:scale-90"
                      title="Baixar playlist"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluirPlaylist(p.id)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-400/25 text-white/80 flex items-center justify-center active:scale-90"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 🔥 HITS DA FAVELA (atualiza sozinho!) */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
              🔥 Hits da favela
            </div>
            <div className="text-[9px] text-amber-200/70 font-bold uppercase tracking-[0.14em]">
              🔄 atualiza sozinho
            </div>
          </div>
          <div className="space-y-2">
            {filtered.slice(0, 12).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/25 transition"
              >
                <button
                  type="button"
                  onClick={() => onPlayTrack(t, filtered)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <img src={t.coverUrl || '/covers/album-official.jpg'} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/15" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-white truncate">{t.title}</div>
                    <div className="text-[10px] text-slate-300 truncate">{t.artist || 'MORRO GOLD'}</div>
                  </div>
                  <Play className="w-4 h-4 text-amber-300 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => void abrirClipe(t)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] flex items-center justify-center active:scale-90 shrink-0"
                  title="Assistir clipe em tela cheia"
                >
                  {clipLoading === t.id ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleBaixar(t)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-amber-400/25 text-amber-100 flex items-center justify-center active:scale-90 shrink-0"
                  title="Baixar música"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-xs text-slate-300 text-center py-3">
                Nada por aqui, parça! Tenta outra busca 🔍
              </div>
            )}
          </div>
        </section>

        <div className="text-center text-[10px] text-slate-400 pb-4">
          📻 Rádio do Morro · fechado com a comunidade 🖤👑
        </div>
      </div>

      {/* 🎬 CLIPE EM TELA CHEIA + setinha dourada do lado direito em cima */}
      {clip && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          <div className="relative flex-1">
            <iframe
              src={`https://www.youtube.com/embed/${clip.yt}?autoplay=1&playsinline=1&rel=0`}
              title={clip.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
            {/* SETINHA ESTILO MORRO GOLD — lado direito em cima */}
            <button
              type="button"
              onClick={() => setClip(null)}
              className="absolute top-3 right-3 z-[210] w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] shadow-[0_4px_16px_rgba(255,190,50,0.6)] border border-amber-100/70"
              title="Voltar"
            >
              <span className="text-[15px] leading-none select-none">←</span>
            </button>
          </div>
          <div className="px-4 py-2.5 bg-black/80 border-t border-amber-400/25 text-[11px] font-bold text-amber-100 truncate">
            🎬 {clip.title}
          </div>
        </div>
      )}
    </div>
  );
}

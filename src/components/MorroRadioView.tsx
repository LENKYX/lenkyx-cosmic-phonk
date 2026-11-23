import React from 'react';
import { Play, SkipForward, Radio, Crown, Music4 } from 'lucide-react';

/**
 * 📻 RÁDIO DO MORRO — MORRO GOLD
 * Página raiz de estética dourada: rádio 24h sem parar, disco girando,
 * equalizador dourado e fila "Em seguida". Tudo toca sozinho tipo rádio!
 */

type RadioTrack = {
  id: string;
  title: string;
  artist?: string;
  coverUrl?: string;
};

interface Props {
  tracks: RadioTrack[];
  currentTrack: RadioTrack | null;
  isPlaying: boolean;
  onPlayTrack: (t: RadioTrack, queue: RadioTrack[]) => void;
}

const EQ_BARS = [0.55, 0.9, 0.4, 0.75, 1, 0.5, 0.85, 0.35, 0.7, 0.95, 0.45, 0.8];

export default function MorroRadioView({ tracks, currentTrack, isPlaying, onPlayTrack }: Props) {
  const queue = tracks.length ? tracks : [];
  const currentIndex = currentTrack ? queue.findIndex((t) => t.id === currentTrack.id) : -1;
  const nextTrack = queue.length ? queue[(currentIndex + 1 + queue.length) % queue.length] : null;
  const upNext = queue.slice(0, 4);

  const handleLigar = () => {
    if (!queue.length) return;
    const t = currentIndex >= 0 ? queue[currentIndex] : queue[0];
    onPlayTrack(t, queue);
  };

  const handleProxima = () => {
    if (!queue.length) return;
    onPlayTrack(nextTrack || queue[0], queue);
  };

  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      {/* FUNDO DOURADO */}
      <div className="absolute inset-0 bg-[#0a0512]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,200,76,0.22),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(120,60,180,0.18),transparent_50%)]" />

      <div className="relative max-w-[900px] mx-auto px-4 py-6 space-y-6">
        {/* CABEÇALHO */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/45 bg-amber-400/10">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[11px] font-black text-amber-200">24 HORAS SEM PARAR</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-3">
            <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
            RÁDIO DO MORRO
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/90 font-semibold">
            Liga e deixa tocando — igualzinho rádio de verdade! 📻👑
          </p>
        </div>

        {/* DISCO + EQUALIZADOR */}
        <div className="flex flex-col items-center gap-5">
          {/* DISCO GIRANDO */}
          <div className="relative w-52 h-52 sm:w-64 sm:h-64">
            <div className={`absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#1a0f2e,#3a2410,#c9a227,#3a2410,#1a0f2e)] shadow-[0_0_60px_rgba(245,200,76,0.35)] ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
              <div className="absolute inset-[10px] rounded-full bg-[#0d0620] border border-amber-400/30" />
              <div className="absolute inset-[26px] rounded-full overflow-hidden border-2 border-amber-300/50 shadow-inner">
                <img
                  src={currentTrack?.coverUrl || '/covers/album-official.jpg'}
                  alt="Capa tocando agora"
                  className={`w-full h-full object-cover ${isPlaying ? '' : 'grayscale-[0.35]'}`}
                />
              </div>
              <div className="absolute inset-0 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 border-4 border-[#0d0620] shadow-lg flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-black" />
                </div>
              </div>
            </div>
            {!isPlaying && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/35">
                <button
                  type="button"
                  onClick={handleLigar}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-black flex items-center justify-center shadow-[0_10px_30px_rgba(245,200,76,0.5)] hover:brightness-110 active:scale-95 transition"
                  aria-label="Ligar o rádio"
                >
                  <Play className="w-7 h-7 fill-black ml-1" />
                </button>
              </div>
            )}
          </div>

          {/* EQUALIZADOR DOURADO */}
          <div className="flex items-end justify-center gap-1.5 h-14">
            {EQ_BARS.map((h, i) => (
              <div
                key={i}
                className={`w-2 rounded-full bg-gradient-to-t from-amber-700 via-yellow-400 to-amber-200 ${isPlaying ? 'animate-bounce' : 'opacity-40'}`}
                style={{ height: `${Math.round(h * 100)}%`, animationDelay: `${i * 120}ms`, animationDuration: `${700 + (i % 4) * 220}ms` }}
              />
            ))}
          </div>
        </div>

        {/* TOCANDO AGORA */}
        <section className="rounded-3xl border border-amber-400/35 bg-white/[0.06] backdrop-blur-md p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
              {isPlaying ? 'Tocando agora' : 'Rádio parado'}
            </span>
          </div>
          {currentTrack ? (
            <div className="flex items-center gap-3">
              <img
                src={currentTrack.coverUrl || '/covers/album-official.jpg'}
                alt="Capa"
                className="w-14 h-14 rounded-2xl object-cover border border-amber-400/40 shadow"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white truncate">{currentTrack.title}</div>
                <div className="text-[11px] text-amber-200/90 truncate">{currentTrack.artist || 'MORRO GOLD'}</div>
              </div>
              <Music4 className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
            </div>
          ) : (
            <div className="text-xs text-slate-300 font-semibold">
              Toca no ▶ pra sintonizar o rádio do morro!
            </div>
          )}

          {/* BOTÕES */}
          <div className="flex flex-wrap gap-2.5 mt-4">
            <button
              type="button"
              onClick={handleLigar}
              className="flex-1 min-w-[150px] py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(245,200,76,0.4)] hover:brightness-110 active:scale-95 transition"
            >
              <Play className="w-4 h-4 fill-black" /> {isPlaying ? 'TOCANDO 🔊' : 'LIGAR O RÁDIO'}
            </button>
            <button
              type="button"
              onClick={handleProxima}
              className="px-5 py-3 rounded-2xl border border-amber-400/45 bg-white/[0.07] hover:bg-amber-400/20 text-amber-100 font-black text-sm flex items-center gap-2 active:scale-95 transition"
            >
              <SkipForward className="w-4 h-4" /> PRÓXIMA
            </button>
          </div>
        </section>

        {/* EM SEGUIDA */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4 sm:p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300 mb-3">📻 Em seguida na fila</div>
          <div className="space-y-2">
            {(nextTrack ? [nextTrack, ...upNext.filter((t) => t.id !== nextTrack.id)] : upNext).slice(0, 4).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onPlayTrack(t, queue)}
                className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-amber-400/12 border border-transparent hover:border-amber-400/25 transition active:scale-[0.98] text-left"
              >
                <img src={t.coverUrl || '/covers/album-official.jpg'} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/15" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-300 truncate">{t.artist || 'MORRO GOLD'}</div>
                </div>
                <Play className="w-4 h-4 text-amber-300 shrink-0" />
              </button>
            ))}
          </div>
        </section>

        <div className="text-center text-[10px] text-slate-400 pb-4">
          📻 Rádio do Morro · fechado com a comunidade 🖤👑
        </div>
      </div>
    </div>
  );
}

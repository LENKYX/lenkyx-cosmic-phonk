import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Mic2, Play, Loader2, Sparkles } from 'lucide-react';
import { Track } from '../types';

interface Props {
  track: Track | null;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (sec: number) => void;
  onClose: () => void;
}

interface LrcLine {
  time: number;
  text: string;
}

function parseLrc(lrc: string): LrcLine[] {
  const out: LrcLine[] = [];
  for (const rawLine of lrc.split('\n')) {
    const matches = [...rawLine.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    if (!matches.length) continue;
    const text = rawLine.replace(/\[[^\]]+\]/g, '').trim();
    if (!text) continue;
    for (const m of matches) {
      const min = parseInt(m[1], 10) || 0;
      const sec = parseInt(m[2], 10) || 0;
      const msRaw = (m[3] || '0').padEnd(3, '0').slice(0, 3);
      const ms = parseInt(msRaw, 10) || 0;
      out.push({ time: min * 60 + sec + ms / 1000, text });
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

export const LyricsKaraokeModal: React.FC<Props> = ({
  track,
  currentTime,
  isPlaying,
  onSeek,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [syncedRaw, setSyncedRaw] = useState('');
  const [plainRaw, setPlainRaw] = useState('');
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!track) return;
    setSyncedRaw('');
    setPlainRaw(track.lyrics || '');
    setLoading(true);
    let cancelled = false;
    fetch(
      `/api/lyrics?artist=${encodeURIComponent(track.artist || '')}&title=${encodeURIComponent(
        track.title || ''
      )}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        if (d.syncedLyrics) setSyncedRaw(String(d.syncedLyrics));
        if (d.plainLyrics && !track.lyrics) setPlainRaw(String(d.plainLyrics));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [track?.id, track?.title, track?.artist, track?.lyrics]);

  const lrcLines = useMemo(() => parseLrc(syncedRaw), [syncedRaw]);

  const activeIdx = useMemo(() => {
    if (!lrcLines.length) return -1;
    let idx = 0;
    for (let i = 0; i < lrcLines.length; i++) {
      if (currentTime >= lrcLines[i].time - 0.25) idx = i;
      else break;
    }
    return idx;
  }, [lrcLines, currentTime]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIdx]);

  if (!track) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-black/82 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl glass-panel border border-cyan-400/40 p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,245,255,0.22)]">
        <div className="flex items-center justify-between gap-3 border-b border-cyan-400/20 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-11 h-11 rounded-xl object-cover border border-cyan-400/40 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 flex items-center gap-1">
                <Mic2 className="w-3 h-3" /> MODO KARAOKÊ · LETRA SINCRONIZADA
              </div>
              <h3 className="font-display text-sm sm:text-base font-black text-white truncate">
                {track.title}
              </h3>
              <p className="text-[11px] text-slate-300 truncate">{track.artist}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {loading && !lrcLines.length && !plainRaw ? (
            <div className="py-12 flex flex-col items-center gap-2 text-cyan-200 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Sincronizando letra em tempo real...</span>
            </div>
          ) : lrcLines.length > 0 ? (
            <div className="space-y-1.5 py-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-[10px] font-black text-cyan-300 mb-2">
                <Sparkles className="w-3 h-3" /> Toque em qualquer verso para pular para essa parte!
              </div>
              {lrcLines.map((line, i) => {
                const active = i === activeIdx;
                return (
                  <button
                    key={`${line.time}-${i}`}
                    ref={active ? activeRef : undefined}
                    type="button"
                    onClick={() => onSeek(line.time)}
                    className={`w-full text-left px-3.5 py-2 rounded-2xl transition flex items-center justify-between gap-3 ${
                      active
                        ? 'bg-gradient-to-r from-cyan-400/25 via-sky-500/20 to-transparent border border-cyan-400/60 text-white scale-[1.01] shadow-[0_0_24px_rgba(34,211,238,0.2)]'
                        : i < activeIdx
                        ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        : 'text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`text-sm sm:text-base leading-snug ${
                        active ? 'font-black text-cyan-100' : 'font-semibold'
                      }`}
                    >
                      {line.text}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300/70 shrink-0 flex items-center gap-1">
                      {active && isPlaying && <Play className="w-2.5 h-2.5 fill-cyan-300" />}
                      {Math.floor(line.time / 60)}:{String(Math.floor(line.time % 60)).padStart(2, '0')}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : plainRaw ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-100 leading-relaxed bg-black/35 rounded-2xl p-4 border border-white/10">
              {plainRaw}
            </pre>
          ) : (
            <div className="py-10 text-center space-y-2 text-xs text-slate-300">
              <p>Letra sincronizada ainda não disponível para esta faixa.</p>
              <p className="text-[11px] text-cyan-300/80">
                Dica: toque em outro sucesso brasileiro em Explorar para cantar junto com o Karaokê!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Mic,
  Radio,
  Trophy,
  Handshake,
  Play,
  Copy,
  Send,
  Share2,
  ExternalLink,
  Mail,
  MessageCircle,
  Loader2,
  Sparkles,
  Users,
  Plus,
  History,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { Track, UserProfile } from '../types';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';
import { copyTextReliable } from '../utils/androidBridge';

export type FuturisticTab = 'shazam' | 'jam' | 'wrapped' | 'partners';

export interface PlayHistoryEntry {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  playedAt: string;
  count: number;
}

const LS_PLAY_HISTORY = 'lenkyx_play_history_v1';

export function recordPlayHistoryItem(track: Track): void {
  try {
    const raw = localStorage.getItem(LS_PLAY_HISTORY);
    const list: PlayHistoryEntry[] = raw ? JSON.parse(raw) : [];
    const existing = list.find((x) => x.id === track.id || (x.title === track.title && x.artist === track.artist));
    const updated: PlayHistoryEntry = existing
      ? { ...existing, count: existing.count + 1, playedAt: new Date().toISOString(), coverUrl: track.coverUrl || existing.coverUrl }
      : {
          id: track.id,
          title: track.title,
          artist: track.artist || 'LENKYX',
          coverUrl: track.coverUrl,
          playedAt: new Date().toISOString(),
          count: 1,
        };
    const next = [updated, ...list.filter((x) => x !== existing)].slice(0, 60);
    localStorage.setItem(LS_PLAY_HISTORY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

export function loadPlayHistory(): PlayHistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_PLAY_HISTORY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface BrCreatorItem {
  id: string;
  name: string;
  handle: string;
  category: string;
  badge: string;
  subscribersText: string;
  youtubeUrl: string;
  shortsQuery: string;
  votes: number;
}

interface JamRoomData {
  code: string;
  hostName: string;
  track: Track | null;
  isPlaying: boolean;
  positionSec: number;
  queue: Track[];
  members: string[];
  messages: { id: string; author: string; text: string; ts: string }[];
}

interface Props {
  open: boolean;
  initialTab?: FuturisticTab;
  initialJamCode?: string;
  user: UserProfile | null;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  officialSiteUrl: string;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onSearchWorld: (query: string) => void;
  onOpenBrCreatorShorts: (query: string, label: string) => void;
  onToast: (msg: string) => void;
}

export const FuturisticFeaturesModal: React.FC<Props> = ({
  open,
  initialTab = 'shazam',
  initialJamCode = '',
  user,
  tracks,
  currentTrack,
  isPlaying,
  officialSiteUrl,
  onClose,
  onPlayTrack,
  onSearchWorld,
  onOpenBrCreatorShorts,
  onToast,
}) => {
  const [tab, setTab] = useState<FuturisticTab>(initialTab);

  // 1) SHAZAM AUDIO RECOGNITION
  const [listening, setListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recognizedQuery, setRecognizedQuery] = useState('');
  const [matchedTracks, setMatchedTracks] = useState<Track[]>([]);
  const [shazamStatus, setShazamStatus] = useState('Toque no radar robótico para identificar a música tocando perto!');
  const micStreamRef = useRef<MediaStream | null>(null);

  // 2) OUVIR JUNTO (JAM)
  const [jamCodeInput, setJamCodeInput] = useState(initialJamCode || '');
  const [jamRoom, setJamRoom] = useState<JamRoomData | null>(null);
  const [jamChatInput, setJamChatInput] = useState('');
  const [jamBusy, setJamBusy] = useState(false);

  // 3) WRAPPED / HISTÓRICO
  const [historyList, setHistoryList] = useState<PlayHistoryEntry[]>([]);

  // 4) PARTNERS / YOUTUBERS / EMPRESÁRIOS
  const [brCreators, setBrCreators] = useState<BrCreatorItem[]>([]);
  const [sponsorBrandName, setSponsorBrandName] = useState('');
  const [sponsorEmail, setSponsorEmail] = useState('');

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setHistoryList(loadPlayHistory());
    fetch('/api/community/br-creators')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.allCreators)) setBrCreators(d.allCreators);
      })
      .catch(() => {});
  }, [open, initialTab]);

  useEffect(() => {
    if (open && initialJamCode) {
      setTab('jam');
      setJamCodeInput(initialJamCode);
      void handleJoinJam(initialJamCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialJamCode]);

  useEffect(() => {
    if (!open || tab !== 'jam' || !jamRoom?.code) return;
    const iv = window.setInterval(() => {
      fetch(`/api/jam/${encodeURIComponent(jamRoom.code)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.code) setJamRoom(d);
        })
        .catch(() => {});
    }, 3500);
    return () => window.clearInterval(iv);
  }, [open, tab, jamRoom?.code]);

  useEffect(() => {
    return () => {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    };
  }, []);

  const stopListening = () => {
    setListening(false);
    setAudioLevel(0);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
  };

  const handleStartShazam = async () => {
    if (listening) {
      stopListening();
      return;
    }
    setListening(true);
    setMatchedTracks([]);
    setShazamStatus('🤖 Captando som ambiente e analisando frequência...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!micStreamRef.current) {
          void ctx.close().catch(() => {});
          return;
        }
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, Math.round(avg * 1.4)));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      // Speech recognition can still work or user can type
    }

    const SR =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SR) {
      const rec = new SR();
      rec.lang = 'pt-BR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (ev: any) => {
        const transcript = String(ev?.results?.[0]?.[0]?.transcript || '').trim();
        stopListening();
        if (transcript) {
          setRecognizedQuery(transcript);
          void runMatchLookup(transcript);
        }
      };
      rec.onerror = () => {
        stopListening();
        setShazamStatus('Cante um trecho ou digite o nome abaixo que eu acho na hora!');
      };
      rec.onend = () => {
        stopListening();
      };
      try {
        rec.start();
      } catch {
        stopListening();
      }
    } else {
      window.setTimeout(() => {
        stopListening();
        setShazamStatus('Microfone analisado! Digite um trecho da letra ou nome para buscar na hora:');
      }, 3200);
    }
  };

  const runMatchLookup = async (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setShazamStatus(`🔎 Buscando "${clean}" no catálogo e clipes oficiais...`);
    const low = clean.toLowerCase();
    const localHits = tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(low) ||
        t.artist.toLowerCase().includes(low) ||
        (t.lyrics || '').toLowerCase().includes(low)
    );
    try {
      const r = await fetch(`/api/world-music/search?q=${encodeURIComponent(clean)}`);
      const d = r.ok ? await r.json() : null;
      const worldHits: Track[] = Array.isArray(d?.tracks) ? d.tracks.slice(0, 6) : [];
      const merged = [...localHits.slice(0, 3), ...worldHits];
      setMatchedTracks(merged);
      setShazamStatus(
        merged.length
          ? `✅ Encontrei ${merged.length} músicas parecidas com "${clean}"!`
          : `Nenhuma correspondência exata; tente buscar em Explorar.`
      );
    } catch {
      setMatchedTracks(localHits.slice(0, 6));
    }
  };

  const handleCreateJam = async () => {
    setJamBusy(true);
    try {
      const r = await fetch('/api/jam/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: user?.name || 'Anfitrião Brasil',
          track: currentTrack,
          positionSec: 0,
        }),
      });
      const data = await r.json();
      if (data?.code) {
        setJamRoom(data);
        setJamCodeInput(data.code);
        onToast(`🎧 Sala Jam ${data.code} criada! Convide seus amigos.`);
      }
    } catch {
      onToast('Erro ao criar sala Ouvir Junto.');
    } finally {
      setJamBusy(false);
    }
  };

  const handleJoinJam = async (codeOverride?: string) => {
    const code = (codeOverride || jamCodeInput).trim().toUpperCase();
    if (!code) return;
    setJamBusy(true);
    try {
      const r = await fetch(`/api/jam/${encodeURIComponent(code)}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberName: user?.name || 'Convidado BR' }),
      });
      if (!r.ok) {
        onToast('Sala não encontrada. Confira o código!');
        return;
      }
      const data = await r.json();
      setJamRoom(data);
      if (data?.track && (!currentTrack || currentTrack.id !== data.track.id)) {
        onPlayTrack(data.track);
      }
      onToast(`✅ Conectado à sala ${code}!`);
    } catch {
      onToast('Erro ao entrar na sala.');
    } finally {
      setJamBusy(false);
    }
  };

  const handleSendJamChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jamRoom?.code || !jamChatInput.trim()) return;
    const text = jamChatInput.trim();
    setJamChatInput('');
    const r = await fetch(`/api/jam/${encodeURIComponent(jamRoom.code)}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberName: user?.name || 'Ouvinte BR',
        chatText: text,
        track: currentTrack,
        isPlaying,
      }),
    });
    if (r.ok) setJamRoom(await r.json());
  };

  const topHistory = useMemo(
    () => [...historyList].sort((a, b) => b.count - a.count).slice(0, 5),
    [historyList]
  );

  const topArtistsSummary = useMemo(() => {
    const map = new Map<string, number>();
    historyList.forEach((h) => {
      map.set(h.artist, (map.get(h.artist) || 0) + h.count);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [historyList]);

  const sponsorPitchText = useMemo(() => {
    const marca = sponsorBrandName.trim() || 'sua empresa/marca';
    return (
      `Olá, equipe de ${marca}! Tudo bem?\n\n` +
      `Sou criador do aplicativo brasileiro MORRO GOLD (${officialSiteUrl}) — uma plataforma gratuita e ultra-moderna de Músicas, Vídeos Clipes HD, Vibes de Criadores Brasileiros, Cinema e Futebol Ao Vivo, sem anúncios intrusivos.\n\n` +
      `Estamos abrindo cotas oficiais de Patrocínio e Parceria Comercial no Brasil (banner no app, destaque no Vibe & Ranking Top 5 de Criadores e ações exclusivas).\n\n` +
      `Gostaria de apresentar os planos de patrocínio para ${marca} crescer junto com o MORRO GOLD. Podemos conversar?\n\n` +
      `Acesse o app ao vivo: ${officialSiteUrl}`
    );
  }, [sponsorBrandName, officialSiteUrl]);

  const buildCreatorInviteText = (c: BrCreatorItem) =>
    `Fala, ${c.name}! 🇧🇷🔥 Você já está em destaque no Ranking Top Criadores do MORRO GOLD (${c.badge})! ` +
    `Estamos reunindo os melhores canais brasileiros de humor, memes e pegadinhas dentro do nosso app gratuito (Músicas, Clipes, Vibe e Lives). ` +
    `Venha conhecer e compartilhar seu canal com a galera do Brasil: ${officialSiteUrl}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-black/82 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl glass-panel border border-cyan-400/45 shadow-[0_0_60px_rgba(0,245,255,0.22)] flex flex-col overflow-hidden">
        {/* Robotic HUD Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/15 via-blue-600/10 to-purple-500/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <LenkyxEdgeLogo size="sm" className="shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" /> MORRO GOLD CORE HUD · MODO FUTURISTA BRASIL
              </div>
              <h2 className="font-display text-sm sm:text-base font-black text-white truncate">
                Radar Musical · Ouvir Junto · Top Brasil · Parceiros
              </h2>
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

        {/* 4 Feature Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'shazam', label: '🎙️ Identificar Som' },
              { id: 'jam', label: '🎧 Ouvir Junto' },
              { id: 'wrapped', label: '📊 Seu Top Brasil' },
              { id: 'partners', label: '🤝 Criadores & Patrocínio' },
            ] as { id: FuturisticTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition ${
                tab === t.id
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                  : 'bg-white/[0.06] text-slate-200 hover:bg-white/15'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: SHAZAM STYLE */}
          {tab === 'shazam' && (
            <div className="space-y-4">
              <div className="rounded-3xl cosmic-card-3d p-5 text-center space-y-4">
                <button
                  type="button"
                  onClick={() => void handleStartShazam()}
                  className={`mx-auto w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1.5 border-2 transition ${
                    listening
                      ? 'bg-cyan-400 text-black border-white animate-pulse shadow-[0_0_45px_rgba(0,245,255,0.85)]'
                      : 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-200 border-cyan-400/60 hover:scale-105'
                  }`}
                >
                  <Mic className="w-9 h-9" />
                  <span className="text-[10px] font-black uppercase">
                    {listening ? 'Ouvindo...' : 'Ouvir Agora'}
                  </span>
                </button>

                {listening && (
                  <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                      style={{ width: `${Math.max(12, audioLevel)}%` }}
                    />
                  </div>
                )}

                <p className="text-xs text-cyan-100 font-semibold">{shazamStatus}</p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runMatchLookup(recognizedQuery);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={recognizedQuery}
                    onChange={(e) => setRecognizedQuery(e.target.value)}
                    placeholder="Ou digite/cante um trecho da música..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-cyan-400/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 text-black text-xs font-black"
                  >
                    Achar
                  </button>
                </form>
              </div>

              {matchedTracks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-cyan-300">Músicas Encontradas:</div>
                  {matchedTracks.map((tr) => (
                    <div
                      key={tr.id}
                      className="rounded-2xl bg-white/[0.05] border border-cyan-400/25 p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={tr.coverUrl}
                          alt={tr.title}
                          className="w-11 h-11 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">{tr.title}</div>
                          <div className="text-[11px] text-cyan-200/80 truncate">{tr.artist}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onPlayTrack(tr);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-400 text-black text-xs font-black flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" /> Tocar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OUVIR JUNTO (JAM) */}
          {tab === 'jam' && (
            <div className="space-y-4">
              {!jamRoom ? (
                <div className="rounded-3xl cosmic-card-3d p-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-black text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" /> Sala Festa · Ouvir Junto em Tempo Real
                    </h3>
                    <p className="text-xs text-slate-300">
                      Crie uma sala e mande o link no WhatsApp para seus amigos ouvirem a mesma música sincronizada!
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={jamBusy}
                    onClick={() => void handleCreateJam()}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    {jamBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Criar Sala Festa Agora
                  </button>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      value={jamCodeInput}
                      onChange={(e) => setJamCodeInput(e.target.value.toUpperCase())}
                      placeholder="Código da sala (ex: LX-A4F9)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white"
                    />
                    <button
                      type="button"
                      onClick={() => void handleJoinJam()}
                      className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-cyan-500/15 border border-cyan-400/40 p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-black uppercase text-cyan-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Sala {jamRoom.code} · {jamRoom.members.length} ouvindo
                      </div>
                      <div className="text-xs font-bold text-white">
                        Tocando: {jamRoom.track?.title || currentTrack?.title || 'Escolha uma faixa'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const link = `${officialSiteUrl}/?jam=${jamRoom.code}`;
                          void copyTextReliable(link).then((ok) => {
                            if (ok) onToast('Link da Sala Jam copiado!');
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/15 text-white text-[11px] font-bold flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Entra na minha sala Ouvir Junto no MORRO GOLD! Código: ${jamRoom.code} 🎧🔥 ${officialSiteUrl}/?jam=${jamRoom.code}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-400 text-black text-[11px] font-black flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/40 border border-white/10 p-3 h-48 overflow-y-auto space-y-1.5">
                    {jamRoom.messages.map((m) => (
                      <div key={m.id} className="text-xs text-slate-200">
                        <strong className="text-cyan-300">{m.author}: </strong>
                        <span>{m.text}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={(e) => void handleSendJamChat(e)} className="flex gap-2">
                    <input
                      type="text"
                      value={jamChatInput}
                      onChange={(e) => setJamChatInput(e.target.value)}
                      placeholder="Conversar na sala ou pedir música..."
                      className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-black flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" /> Enviar
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WRAPPED / RETROSPECTIVA & HISTÓRICO */}
          {tab === 'wrapped' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-emerald-500/15 border border-cyan-400/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-black uppercase text-cyan-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> SEU TOP BRASIL · RETROSPECTIVA
                    </div>
                    <h3 className="font-display text-base font-black text-white">
                      {user?.name ? `${user.name} no MORRO GOLD` : 'Suas Mais Tocadas no MORRO GOLD'}
                    </h3>
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `🔥 Meu Top no MORRO GOLD Brasil:\n${
                        topHistory.length
                          ? topHistory.map((h, i) => `${i + 1}. ${h.title} — ${h.artist} (${h.count}x)`).join('\n')
                          : 'Ouvindo músicas, clipes e Vibe sem anúncios!'
                      }\n\nOuça grátis também: ${officialSiteUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-400 text-black text-xs font-black flex items-center gap-1.5 shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Postar Top
                  </a>
                </div>

                {topArtistsSummary.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {topArtistsSummary.map(([art, cnt]) => (
                      <button
                        key={art}
                        type="button"
                        onClick={() => {
                          onSearchWorld(art);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-cyan-400 hover:text-black text-[11px] font-bold text-cyan-100 transition"
                      >
                        🎤 {art} ({cnt}x)
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-300 space-y-2 rounded-2xl bg-white/[0.03] border border-white/10">
                  <History className="w-8 h-8 text-cyan-300/60 mx-auto" />
                  <p>Seu histórico aparece automaticamente conforme você toca músicas e clipes!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-black text-cyan-300">Histórico Recente ({historyList.length})</div>
                  {historyList.slice(0, 15).map((h) => (
                    <div
                      key={`${h.id}-${h.playedAt}`}
                      className="rounded-2xl bg-white/[0.04] border border-white/10 p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={h.coverUrl}
                          alt={h.title}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{h.title}</div>
                          <div className="text-[10px] text-slate-300 truncate">
                            {h.artist} · {h.count}x reproduzida
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const found = tracks.find((t) => t.id === h.id);
                          if (found) {
                            onPlayTrack(found);
                            onClose();
                          } else {
                            onSearchWorld(`${h.artist} ${h.title}`);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-400/20 hover:bg-cyan-400 hover:text-black text-cyan-200 text-[11px] font-black shrink-0"
                      >
                        Tocar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONVITES PARA YOUTUBERS DO BRASIL & EMPRESÁRIOS PATROCINADORES */}
          {tab === 'partners' && (
            <div className="space-y-4">
              {/* MÍDIA KIT · TABELA OFICIAL DE PATROCÍNIO */}
              <div className="rounded-3xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-black border border-amber-400/45 p-4 space-y-3">
                <div className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                  👑 MÍDIA KIT MORRO GOLD · SUA MARCA NA REALEZA DA FAVELA VIP
                </div>
                <p className="text-[11px] text-slate-200">
                  Tabela oficial de patrocínio. Sua marca aparece pros cria em todo o Brasil — na loja, no feed e no chat.
                  Escolhe o plano e manda a proposta na hora!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {([
                    { name: '🥉 BRONZE', price: 'R$ 197/mês', perks: ['Banner no topo da Loja', '1 destaque no chat por semana', 'Link com seu WhatsApp'] },
                    { name: '🥈 PRATA', price: 'R$ 497/mês', perks: ['Tudo do Bronze', 'Vitrine de produtos com fotos', 'Menção no feed & stories', 'Link de afiliado próprio'] },
                    { name: '🥇 OURO 24K', price: 'R$ 997/mês', perks: ['Tudo do Prata', 'ANÚNCIO oficial fixo do app', 'Campanha em vídeo no feed', 'Espaço no Ranking VIP'] },
                  ]).map((plan) => (
                    <div key={plan.name} className="rounded-2xl bg-black/50 border border-amber-400/25 p-3 space-y-1.5 flex flex-col">
                      <div className="text-[11px] font-black text-amber-300">{plan.name}</div>
                      <div className="text-base font-black lux-gold-text">{plan.price}</div>
                      <div className="space-y-1 flex-1">
                        {plan.perks.map((perk) => (
                          <div key={perk} className="text-[9.5px] text-slate-200">✓ {perk}</div>
                        ))}
                      </div>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Fala, MORRO GOLD! Quero o plano ${plan.name} (${plan.price}) de patrocínio pro meu negócio. Me manda os detalhes!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 w-full py-1.5 rounded-full bg-emerald-400 text-black text-[10px] font-black text-center block"
                      >
                        Quero este plano →
                      </a>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-slate-400">
                  Valores do mídia kit · pagamento via PIX · contrato e nota mediante acordo · atendimento por WhatsApp.
                </div>
              </div>

              {/* Business Sponsors Pitch */}
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-amber-500/10 border border-emerald-400/40 p-4 space-y-3">
                <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <Handshake className="w-4 h-4" /> CONVITES PARA EMPRESÁRIOS PATROCINAREM O MORRO GOLD
                </div>
                <p className="text-[11px] text-slate-200">
                  Gere e envie na hora uma proposta comercial profissional pelo seu <strong>Gmail</strong> ou{' '}
                  <strong>WhatsApp</strong> para marcas e empresários apoiarem o aplicativo no Brasil!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={sponsorBrandName}
                    onChange={(e) => setSponsorBrandName(e.target.value)}
                    placeholder="Nome da Empresa / Empresário"
                    className="px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                  />
                  <input
                    type="email"
                    value={sponsorEmail}
                    onChange={(e) => setSponsorEmail(e.target.value)}
                    placeholder="E-mail do Empresário (opcional)"
                    className="px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`mailto:${encodeURIComponent(sponsorEmail.trim())}?subject=${encodeURIComponent(
                      `Proposta de Patrocínio Oficial · App MORRO GOLD Brasil`
                    )}&body=${encodeURIComponent(sponsorPitchText)}`}
                    className="px-3.5 py-2 rounded-xl bg-cyan-400 text-black text-xs font-black flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" /> Enviar via Gmail / E-mail
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(sponsorPitchText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-400 text-black text-xs font-black flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Enviar no WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      void copyTextReliable(sponsorPitchText).then((ok) => {
                        if (ok) onToast('Proposta de Patrocínio copiada!');
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar Proposta
                  </button>
                </div>
              </div>

              {/* Brazilian YouTubers Invites */}
              <div className="space-y-2">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" /> CONVIDAR CANAIS DO YOUTUBE BRASIL (MEMES & PEGADINHAS)
                </div>
                {brCreators.map((c, idx) => (
                  <div
                    key={c.id}
                    className="rounded-2xl bg-white/[0.04] border border-cyan-400/20 p-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span className="text-amber-300">#{idx + 1}</span>
                        <span className="truncate">{c.name}</span>
                        <span className="text-[10px] text-cyan-300 font-mono">{c.handle}</span>
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {c.category} · {c.subscribersText}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBrCreatorShorts(c.shortsQuery, `${c.name} · Memes & Vibe`);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-400/20 hover:bg-cyan-400 hover:text-black text-cyan-200 text-[10px] font-black"
                      >
                        ▶ Ver Vibe
                      </button>
                      <a
                        href={c.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-red-200 text-[10px] font-bold flex items-center gap-1"
                      >
                        Canal <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          void copyTextReliable(buildCreatorInviteText(c)).then((ok) => {
                            if (ok) onToast(`Convite oficial para ${c.name} copiado!`);
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-400 text-black text-[10px] font-black flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Copiar Convite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Play,
  Square,
  Radio,
  Save,
  Shuffle,
  Rocket,
  ShieldAlert,
  CheckCircle2,
  Wand2,
  Music2,
  Target,
  Download,
  RefreshCw,
} from 'lucide-react';
import { AppSettings, Track } from '../types';
import { CosmicTheme, generateSunoBlueprint, LyricLanguage } from '../utils/sunoGenerator';
import { beatEngine, BEAT_PRESETS, BeatPattern } from '../audio/beatEngine';
import { authFetch } from '../utils/api';
import { copyTextReliable, downloadBlobReliable } from '../utils/androidBridge';

interface Props {
  tracks: Track[];
  settings: AppSettings;
  onTrackCreated: (track: Track) => void;
  onToggleTrackStatus: (track: Track, field: keyof Track['status']) => Promise<void>;
  onPauseCatalogPlayer: () => void;
  onSyncSuno?: () => Promise<void>;
  onToast: (msg: string) => void;
}

const COWBELL_SCALE_LABELS = ['OFF', 'R', 'b2', 'm3', '4', '5', 'b6', '7', '8va', 'm10', '11', '12'];
const COWBELL_SEMITONES = [0, 1, 2, 4, 6, 8, 9, 11, 13, 16, 18, 20];

export const StudioCreateView: React.FC<Props> = ({
  tracks,
  settings,
  onTrackCreated,
  onToggleTrackStatus,
  onPauseCatalogPlayer,
  onSyncSuno,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<'suno' | 'distrokid' | 'beatmaker' | 'plan1000'>('suno');
  const [dkTrackId, setDkTrackId] = useState<string>(() => tracks[0]?.id || '');
  const [exportingCover, setExportingCover] = useState(false);
  const [syncingHub, setSyncingHub] = useState(false);

  const dkTrack = tracks.find((t) => t.id === dkTrackId) || tracks[0];

  const handleExportDistroKidCover = async () => {
    if (!dkTrack) return;
    setExportingCover(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao carregar capa'));
        img.src = dkTrack.coverUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 3000;
      canvas.height = 3000;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas indisponível');
      ctx.fillStyle = '#070412';
      ctx.fillRect(0, 0, 3000, 3000);
      ctx.drawImage(img, 0, 0, 3000, 3000);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/jpeg', 0.96));
      if (!blob) throw new Error('Falha ao gerar JPEG 3000x3000');
      const slug = dkTrack.title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      await downloadBlobReliable(blob, `LENKYX_${String(dkTrack.number).padStart(2, '0')}_${slug}_DistroKid_3000x3000.jpg`);
      onToast('✅ Capa 3000×3000 px RGB pronta pro DistroKid baixada!');
    } catch {
      onToast('Erro ao gerar capa 3000×3000 px.');
    } finally {
      setExportingCover(false);
    }
  };

  const handleCopyDistroKidSheet = async () => {
    if (!dkTrack) return;
    // DistroKid forbids emojis in song titles
    const cleanTitle = dkTrack.title.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    const sheet = [
      `=== FICHA DISTROKID — LENKYX ===`,
      `Artista / Banda: LENKYX`,
      `Título da Faixa (sem emoji): ${cleanTitle}`,
      `Álbum / Projeto: ${dkTrack.album}`,
      `Gênero Principal: Electronic`,
      `Gênero Secundário: Dance`,
      `Idioma da Letra: English`,
      `Compositor / Produtor: LENKYX`,
      `BPM: ${dkTrack.bpm} BPM | Tom: ${dkTrack.key}`,
      `Conteúdo Explícito: Não (Clean)`,
      `Capa: 3000x3000 px JPG (sem texto, sem logo, 100% original LENKYX)`,
      ``,
      `=== LETRA OFICIAL ===`,
      dkTrack.lyrics || '(Instrumental / cadastrar letra)',
    ].join('\n');
    const ok = await copyTextReliable(sheet);
    onToast(ok ? '📋 Ficha técnica limpa pro DistroKid copiada!' : 'Não foi possível copiar.');
  };

  // --- TAB 1: SUNO GENERATOR STATE ---
  const [genTitle, setGenTitle] = useState('Supernova Drift');
  const [genEmoji, setGenEmoji] = useState('☄️');
  const [genAlbum, setGenAlbum] = useState('Cosmic Phonk Vol. 2');
  const [genTheme, setGenTheme] = useState<CosmicTheme>('space_odyssey');
  const [genBpm, setGenBpm] = useState(134);
  const [genLang, setGenLang] = useState<LyricLanguage>('en_pt_chops');
  const [genVocal, setGenVocal] = useState<'emotional_male' | 'aggressive_male' | 'female_ethereal' | 'instrumental'>('emotional_male');
  const [genEnergy, setGenEnergy] = useState<'chill_hypnotic' | 'high_festival' | 'extreme_drift'>('high_festival');
  const [generated, setGenerated] = useState(() =>
    generateSunoBlueprint({
      title: 'Supernova Drift',
      theme: 'space_odyssey',
      bpm: 134,
      language: 'en_pt_chops',
      vocalStyle: 'emotional_male',
      energy: 'high_festival',
    })
  );
  const [copiedField, setCopiedField] = useState<'prompt' | 'lyrics' | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  // --- TAB 2: BEATMAKER STATE ---
  const [beatPresetKey, setBeatPresetKey] = useState('lostSpaceship');
  const [beatBpm, setBeatBpm] = useState(132);
  const [beatRoot, setBeatRoot] = useState(41);
  const [beatTitle, setBeatTitle] = useState('Meu Beat Cosmic Phonk #1');
  const [pattern, setPattern] = useState<BeatPattern>(() => structuredClone(BEAT_PRESETS.lostSpaceship.pattern));
  const [beatPlaying, setBeatPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [beatRecording, setBeatRecording] = useState(false);
  const [recordedBeatBlob, setRecordedBeatBlob] = useState<Blob | null>(null);
  const [recordedBeatUrl, setRecordedBeatUrl] = useState('');
  const [savingBeat, setSavingBeat] = useState(false);

  useEffect(() => {
    beatEngine.updateConfig(pattern, beatBpm, beatRoot);
  }, [pattern, beatBpm, beatRoot]);

  useEffect(() => {
    return () => {
      beatEngine.stop();
    };
  }, []);

  const handleGenerateSuno = () => {
    const bp = generateSunoBlueprint({
      title: genTitle,
      theme: genTheme,
      bpm: genBpm,
      language: genLang,
      vocalStyle: genVocal,
      energy: genEnergy,
    });
    setGenerated(bp);
    onToast(`Prompt + Letra criados para "${genTitle}"!`);
  };

  const handleCopy = async (field: 'prompt' | 'lyrics', text: string) => {
    const ok = await copyTextReliable(text);
    if (ok) {
      setCopiedField(field);
      onToast(field === 'prompt' ? 'Prompt do Suno copiado!' : 'Letra copiada para colar no Suno!');
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      onToast('Selecione e copie o texto.');
    }
  };

  const handleSaveBlueprintToCatalog = async () => {
    if (!genTitle.trim()) return;
    setSavingDraft(true);
    try {
      const fd = new FormData();
      fd.append('title', genTitle.trim());
      fd.append('emoji', genEmoji || '🚀');
      fd.append('album', genAlbum || 'Cosmic Phonk Vol. 2');
      fd.append('bpm', String(genBpm));
      fd.append('sunoPrompt', generated.prompt);
      fd.append('lyrics', generated.lyrics);
      fd.append('status', JSON.stringify({ suno: false, cover: false, app: true, youtube: false, distrokid: false }));
      const res = await authFetch('/api/tracks', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const saved: Track = await res.json();
      onTrackCreated(saved);
      onToast(`"${saved.title}" salva no cofre! Agora gere o áudio no Suno e suba o MP3 nela.`);
    } catch {
      onToast('Erro ao salvar rascunho.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Beatmaker handlers
  const handleToggleBeatPlay = () => {
    if (beatPlaying) {
      beatEngine.stop();
      setBeatPlaying(false);
      setActiveStep(-1);
    } else {
      onPauseCatalogPlayer();
      beatEngine.updateConfig(pattern, beatBpm, beatRoot);
      beatEngine.start((s) => setActiveStep(s));
      setBeatPlaying(true);
    }
  };

  const handleLoadPreset = (key: string) => {
    const p = BEAT_PRESETS[key];
    if (!p) return;
    setBeatPresetKey(key);
    setBeatBpm(p.bpm);
    setPattern(structuredClone(p.pattern));
  };

  const handleRandomizePattern = () => {
    const scale = [0, 0, 1, 4, 6, 8, 11, 13];
    const next: BeatPattern = {
      kick: Array.from({ length: 16 }, (_, i) => i % 4 === 0 || (i === 14 && Math.random() > 0.4)),
      snare: Array.from({ length: 16 }, (_, i) => i === 4 || i === 12),
      hat: Array.from({ length: 16 }, (_, i) => i % 2 === 0 || Math.random() > 0.65),
      bass808: Array.from({ length: 16 }, (_, i) => i === 0 || i === 3 || i === 8 || (i === 11 && Math.random() > 0.3)),
      cowbell: Array.from({ length: 16 }, () => scale[Math.floor(Math.random() * scale.length)]),
      synth: Array.from({ length: 16 }, (_, i) => i === 0 || i === 8),
    };
    setPattern(next);
    onToast('Novo padrão Cosmic Phonk sorteado!');
  };

  const handleToggleBeatRecord = async () => {
    if (!beatRecording) {
      setRecordedBeatBlob(null);
      setRecordedBeatUrl('');
      beatEngine.startRecording();
      if (!beatPlaying) {
        onPauseCatalogPlayer();
        beatEngine.updateConfig(pattern, beatBpm, beatRoot);
        beatEngine.start((s) => setActiveStep(s));
        setBeatPlaying(true);
      }
      setBeatRecording(true);
      onToast('🔴 Gravando seu beat ao vivo! Clique novamente para finalizar.');
    } else {
      const blob = await beatEngine.stopRecording();
      setBeatRecording(false);
      if (blob) {
        setRecordedBeatBlob(blob);
        setRecordedBeatUrl(URL.createObjectURL(blob));
        onToast('🎹 Beat gravado! Você pode salvar direto no seu App como uma música.');
      }
    }
  };

  const handleSaveBeatAsTrack = async () => {
    if (!recordedBeatBlob) return;
    setSavingBeat(true);
    try {
      const fd = new FormData();
      fd.append('title', beatTitle.trim() || 'Beat Original LENKYX');
      fd.append('emoji', '🎹');
      fd.append('album', 'LENKYX Original Beats');
      fd.append('bpm', String(beatBpm));
      fd.append('audio', new File([recordedBeatBlob], `lenkyx-beat-${Date.now()}.webm`, { type: recordedBeatBlob.type }));
      fd.append('status', JSON.stringify({ suno: true, cover: false, app: true, youtube: false, distrokid: false }));
      const res = await authFetch('/api/tracks', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const saved: Track = await res.json();
      onTrackCreated(saved);
      onToast(`Beat "${saved.title}" salvo no catálogo do App! Já pode mixar no DJ ou fazer vídeo!`);
    } catch {
      onToast('Erro ao salvar beat.');
    } finally {
      setSavingBeat(false);
    }
  };

  const toggleBoolStep = (lane: 'kick' | 'snare' | 'hat' | 'bass808' | 'synth', idx: number) => {
    setPattern((prev) => {
      const copy = structuredClone(prev);
      copy[lane][idx] = !copy[lane][idx];
      return copy;
    });
  };

  const cycleCowbellStep = (idx: number) => {
    setPattern((prev) => {
      const copy = structuredClone(prev);
      const cur = copy.cowbell[idx];
      const pos = COWBELL_SEMITONES.indexOf(cur);
      const next = COWBELL_SEMITONES[(pos + 1) % COWBELL_SEMITONES.length];
      copy.cowbell[idx] = next;
      return copy;
    });
  };

  const pct1000 = Math.min(100, (tracks.length / settings.totalGoal) * 100);
  const daysAt10 = Math.ceil(Math.max(0, settings.totalGoal - tracks.length) / Math.max(1, settings.dailyGoal));

  return (
    <div className="space-y-5 pb-36 md:pb-24">
      {/* Studio Header */}
      <div className="rounded-3xl glass-panel neon-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-2xl font-black text-white">
              ESTÚDIO <span className="neon-text">FÁBRICA 1.000 MÚSICAS</span>
            </h1>
            <p className="text-xs text-purple-200/80">
              Crie letras + prompts pro Suno, monte batidas Cosmic Phonk ao vivo e controle sua meta diária!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['suno', '✍️ Letras & Suno', Sparkles],
              ['distrokid', '🚀 Hub Suno × DistroKid', Rocket],
              ['beatmaker', '🎹 Criar Beat Aqui', Music2],
              ['plan1000', '🎯 Meta 1.000', Target],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                subTab === id
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow'
                  : 'bg-white/8 hover:bg-white/15 text-purple-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* === SUBTAB: HUB SUNO x DISTROKID === */}
      {subTab === 'distrokid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Suno Studio Connector */}
          <div className="lg:col-span-5 rounded-2xl glass-panel border border-pink-500/30 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-pink-300">Etapa 1 · Criação Musical</div>
                <h2 className="font-display text-base font-black text-white">🎵 SUNO STUDIO (@lenkyx)</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-300">
                CONECTADO
              </span>
            </div>

            <p className="text-xs text-purple-200/85 leading-relaxed">
              Seu fluxo oficial: <b>1) Gere a letra</b> na aba anterior → <b>2) Crie no Suno</b> com seu Prompt Master fixo → <b>3) Sincronize aqui</b> para importar automaticamente V1 + V2 mantendo 100% suas capas exclusivas LENKYX!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="https://suno.com/create"
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir Suno Create
              </a>
              <a
                href="https://suno.com/@lenkyx"
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-300" /> Meu Perfil @lenkyx
              </a>
            </div>

            {onSyncSuno && (
              <button
                onClick={async () => {
                  setSyncingHub(true);
                  try {
                    await onSyncSuno();
                  } finally {
                    setSyncingHub(false);
                  }
                }}
                disabled={syncingHub}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/45 text-cyan-200 font-extrabold text-xs flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className={`w-4 h-4 ${syncingHub ? 'animate-spin' : ''}`} />
                {syncingHub ? 'Sincronizando playlist @lenkyx...' : '🔄 Sincronizar Novas Faixas do Suno (Mantém Capas LENKYX)'}
              </button>
            )}

            <div className="rounded-xl bg-black/45 border border-white/10 p-3 text-[11px] text-purple-200/80 space-y-1">
              <div className="font-bold text-cyan-300">⚡ Regra de Ouro LENKYX:</div>
              <div>• Nunca usamos capas geradas pelo Suno.</div>
              <div>• Todas as 20 faixas usam exclusivamente nossas capas limpas (sem texto, sem logo).</div>
              <div>• Baixe sempre o arquivo <b>WAV</b> da melhor versão (V1 ou V2) no Suno para enviar ao DistroKid!</div>
            </div>
          </div>

          {/* Right: DistroKid Release Launchpad */}
          <div className="lg:col-span-7 rounded-2xl glass-panel border border-cyan-400/35 p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Etapa 2 · Lançamento Mundial (Spotify, Apple, TikTok, YouTube Music)
                </div>
                <h2 className="font-display text-base font-black text-white">🚀 DISTROKID LAUNCHPAD</h2>
              </div>
              <a
                href="https://distrokid.com/new/"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir Upload DistroKid
              </a>
            </div>

            {/* Track selector */}
            <div className="flex flex-col sm:flex-row gap-3 items-center rounded-xl bg-black/45 border border-white/10 p-3">
              {dkTrack && (
                <img
                  src={dkTrack.coverUrl}
                  alt={dkTrack.title}
                  className="w-20 h-20 rounded-xl object-cover border border-pink-400/40 shrink-0"
                />
              )}
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[10px] font-bold uppercase text-purple-300">
                  Selecione a faixa para preparar pro DistroKid:
                </label>
                <select
                  value={dkTrack?.id || ''}
                  onChange={(e) => setDkTrackId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-purple-500/35 text-xs font-bold text-white"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0e0720]">
                      #{String(t.number).padStart(2, '0')} · {t.title} ({t.status.distrokid ? '✅ No DistroKid' : '⏳ Pendente'})
                    </option>
                  ))}
                </select>
                {dkTrack && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-purple-200/80">
                    <span>Título limpo (sem emoji):</span>
                    <b className="text-white">
                      {dkTrack.title.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()}
                    </b>
                    <span>· {dkTrack.bpm} BPM</span>
                  </div>
                )}
              </div>
            </div>

            {/* 1-Click DistroKid Export Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => void handleExportDistroKidCover()}
                disabled={exportingCover || !dkTrack}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                {exportingCover ? 'Renderizando 3000×3000...' : '🖼️ Baixar Capa 3000×3000 px (DistroKid)'}
              </button>
              <button
                onClick={() => void handleCopyDistroKidSheet()}
                disabled={!dkTrack}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-cyan-400/40 text-cyan-200 font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> 📋 Copiar Ficha + Letra Limpa
              </button>
            </div>

            {dkTrack && (
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-3.5 py-2.5">
                <div className="text-xs text-emerald-100">
                  <b>Status DistroKid desta faixa:</b>{' '}
                  {dkTrack.status.distrokid ? '✅ Já enviada para as plataformas!' : '⏳ Aguardando upload'}
                </div>
                <button
                  onClick={() => void onToggleTrackStatus(dkTrack, 'distrokid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    dkTrack.status.distrokid
                      ? 'bg-emerald-400 text-black'
                      : 'bg-white/10 hover:bg-emerald-500/30 text-white'
                  }`}
                >
                  {dkTrack.status.distrokid ? '✅ Publicada' : 'Marcar como Enviada'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === SUBTAB 1: SUNO PROMPT & LYRICS FACTORY === */}
      {subTab === 'suno' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 rounded-3xl glass-panel p-5 space-y-4">
            <div className="font-display text-sm font-extrabold text-cyan-300">CONFIGURAR NOVA FAIXA LENKYX</div>

            <div className="grid grid-cols-12 gap-2.5">
              <div className="col-span-3">
                <label className="block text-[11px] font-bold text-purple-200 mb-1">Emoji</label>
                <input
                  value={genEmoji}
                  onChange={(e) => setGenEmoji(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-center"
                />
              </div>
              <div className="col-span-9">
                <label className="block text-[11px] font-bold text-purple-200 mb-1">Nome da Música</label>
                <input
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="Ex: Supernova Drift"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">Álbum / Lote</label>
                <input
                  value={genAlbum}
                  onChange={(e) => setGenAlbum(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">BPM ({genBpm})</label>
                <input
                  type="range"
                  min={120}
                  max={148}
                  value={genBpm}
                  onChange={(e) => setGenBpm(Number(e.target.value))}
                  className="dj-slider h-2 w-full mt-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-200 mb-1">Atmosfera / Tema</label>
              <select
                value={genTheme}
                onChange={(e) => setGenTheme(e.target.value as CosmicTheme)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-purple-500/35 text-xs font-bold text-white"
              >
                <option value="space_odyssey" className="bg-[#0f0824]">🚀 Space Odyssey (Nave / Galáxia)</option>
                <option value="drift_racing" className="bg-[#0f0824]">🚗 Drift Racing (Supercar / Velocidade)</option>
                <option value="cyber_love" className="bg-[#0f0824]">💙 Cyber Love (Emocional / Funk Melody)</option>
                <option value="dark_nebula" className="bg-[#0f0824]">🌑 Dark Nebula (Misterioso / Pesado)</option>
                <option value="festival_finale" className="bg-[#0f0824]">🛰️ Festival Finale (Épico / Refrão Gigante)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">Idioma da Letra</label>
                <select
                  value={genLang}
                  onChange={(e) => setGenLang(e.target.value as LyricLanguage)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/35 text-xs font-bold text-white"
                >
                  <option value="en_pt_chops" className="bg-[#0f0824]">Inglês + Chops PT</option>
                  <option value="bilingual" className="bg-[#0f0824]">Bilíngue EN + PT</option>
                  <option value="pt_br" className="bg-[#0f0824]">100% Português</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">Vocal</label>
                <select
                  value={genVocal}
                  onChange={(e) => setGenVocal(e.target.value as typeof genVocal)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/35 text-xs font-bold text-white"
                >
                  <option value="emotional_male" className="bg-[#0f0824]">Masculino Emocional</option>
                  <option value="aggressive_male" className="bg-[#0f0824]">Masculino Agressivo</option>
                  <option value="female_ethereal" className="bg-[#0f0824]">Feminino Etéreo</option>
                  <option value="instrumental" className="bg-[#0f0824]">Instrumental + Chops</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-200 mb-1">Intensidade do Drop</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['chill_hypnotic', 'Hipnótico'],
                    ['high_festival', 'Festival Drop'],
                    ['extreme_drift', 'Drift Extremo'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setGenEnergy(id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      genEnergy === id
                        ? 'bg-pink-500/30 border-pink-400 text-white'
                        : 'bg-white/5 border-white/10 text-purple-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateSuno}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> Gerar Prompt + Letra Pro Suno
            </button>
          </div>

          <div className="lg:col-span-7 rounded-3xl glass-panel neon-border p-5 space-y-4">
            {/* Prompt Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                  1. Style Prompt (Colar no campo "Style of Music" do Suno)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-purple-300">{generated.prompt.length} chars</span>
                  <button
                    onClick={() => handleCopy('prompt', generated.prompt)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 text-xs font-bold flex items-center gap-1"
                  >
                    {copiedField === 'prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar Prompt
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={generated.prompt}
                onChange={(e) => setGenerated((g) => ({ ...g, prompt: e.target.value }))}
                className="w-full p-3.5 rounded-2xl bg-black/55 border border-cyan-500/30 text-xs text-purple-100 leading-relaxed focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Lyrics Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-pink-300">
                  2. Letra Estruturada com Metatags (Colar em "Lyrics" no Suno)
                </span>
                <button
                  onClick={() => handleCopy('lyrics', generated.lyrics)}
                  className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 text-pink-200 text-xs font-bold flex items-center gap-1"
                >
                  {copiedField === 'lyrics' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar Letra
                </button>
              </div>
              <textarea
                rows={12}
                value={generated.lyrics}
                onChange={(e) => setGenerated((g) => ({ ...g, lyrics: e.target.value }))}
                className="w-full p-3.5 rounded-2xl bg-black/55 border border-pink-500/30 text-xs font-mono text-purple-50 leading-relaxed focus:outline-none focus:border-pink-400"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={handleSaveBlueprintToCatalog}
                disabled={savingDraft}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> {savingDraft ? 'Salvando...' : 'Salvar Faixa no Cofre das 1.000'}
              </button>
              <a
                href="https://suno.com/create"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Abrir Suno.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* === SUBTAB 2: IN-APP COSMIC PHONK BEATMAKER === */}
      {subTab === 'beatmaker' && (
        <div className="rounded-3xl glass-panel neon-border p-4 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-white">
                🎹 BEATMAKER COSMIC PHONK (SEQUENCIADOR AO VIVO)
              </h2>
              <p className="text-xs text-purple-300">
                Monte batidas 100% suas dentro do app, clique nos blocos do Cowbell para mudar as notas musicais e grave direto pro catálogo!
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleBeatPlay}
                className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 shadow ${
                  beatPlaying ? 'bg-emerald-500 text-black' : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                }`}
              >
                {beatPlaying ? <Square className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-white" />}
                {beatPlaying ? 'PARAR' : 'TOCAR BEAT'}
              </button>
              <button
                onClick={handleRandomizePattern}
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-purple-100 text-xs font-bold flex items-center gap-1.5"
              >
                <Shuffle className="w-4 h-4" /> Sortear Phonk
              </button>
              <button
                onClick={handleToggleBeatRecord}
                className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 ${
                  beatRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-red-500/20 hover:bg-red-500/35 border border-red-400/40 text-red-200'
                }`}
              >
                <Radio className="w-4 h-4" /> {beatRecording ? 'PARAR GRAVAÇÃO' : '🔴 Gravar Beat'}
              </button>
            </div>
          </div>

          {/* Preset + BPM + Root Key Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 p-3.5 rounded-2xl border border-white/10">
            <div>
              <label className="block text-[10px] font-bold text-purple-300 mb-1">PRESET COSMIC PHONK</label>
              <select
                value={beatPresetKey}
                onChange={(e) => handleLoadPreset(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0d0622] border border-purple-500/35 text-xs font-bold text-white"
              >
                {Object.entries(BEAT_PRESETS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-purple-300 mb-1">VELOCIDADE: {beatBpm} BPM</label>
              <input
                type="range"
                min={110}
                max={156}
                value={beatBpm}
                onChange={(e) => setBeatBpm(Number(e.target.value))}
                className="dj-slider h-2 w-full mt-2"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-purple-300 mb-1">TOM DO 808 & COWBELL</label>
              <select
                value={beatRoot}
                onChange={(e) => setBeatRoot(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#0d0622] border border-purple-500/35 text-xs font-bold text-white"
              >
                <option value={38}>D Minor (Sombrio)</option>
                <option value={40}>E Minor (Clássico)</option>
                <option value={41}>F Minor (Drift Phonk)</option>
                <option value={43}>G Minor (Cosmic Driver)</option>
                <option value={45}>A Minor (Eufórico)</option>
              </select>
            </div>
          </div>

          {/* 16-Step Neon Grid */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[680px] space-y-2">
              {/* Cowbell Melodic Row */}
              <div className="grid grid-cols-[96px_repeat(16,minmax(0,1fr))] gap-1.5 items-center">
                <div className="text-xs font-extrabold text-pink-400">🔔 COWBELL</div>
                {pattern.cowbell.map((val, i) => {
                  const idx = COWBELL_SEMITONES.indexOf(val);
                  const lbl = idx > 0 ? COWBELL_SCALE_LABELS[idx] : '';
                  const isCur = activeStep === i;
                  return (
                    <button
                      key={i}
                      onClick={() => cycleCowbellStep(i)}
                      className={`h-10 rounded-lg text-[10px] font-black transition border ${
                        val > 0
                          ? 'bg-gradient-to-b from-pink-500 to-fuchsia-600 text-white border-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                          : i % 4 === 0
                          ? 'bg-white/10 border-white/15 text-purple-300/40'
                          : 'bg-white/5 border-white/10 text-purple-300/30'
                      } ${isCur ? 'ring-2 ring-white scale-105' : ''}`}
                      title="Clique repetidamente para trocar a nota do Cowbell"
                    >
                      {lbl || '·'}
                    </button>
                  );
                })}
              </div>

              {(
                [
                  ['kick', '🥁 KICK', 'bg-cyan-400 border-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.55)]'],
                  ['bass808', '🔊 808 SUB', 'bg-purple-500 border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.55)]'],
                  ['snare', '💥 SNARE', 'bg-amber-400 border-amber-200'],
                  ['hat', '⚡ HI-HAT', 'bg-emerald-400 border-emerald-200'],
                  ['synth', '🌌 SYNTH', 'bg-indigo-500 border-indigo-300'],
                ] as const
              ).map(([lane, label, activeCls]) => (
                <div key={lane} className="grid grid-cols-[96px_repeat(16,minmax(0,1fr))] gap-1.5 items-center">
                  <div className="text-xs font-bold text-purple-100">{label}</div>
                  {pattern[lane].map((on, i) => {
                    const isCur = activeStep === i;
                    return (
                      <button
                        key={i}
                        onClick={() => toggleBoolStep(lane, i)}
                        className={`h-9 rounded-lg transition border ${
                          on
                            ? activeCls
                            : i % 4 === 0
                            ? 'bg-white/10 border-white/15 hover:bg-white/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/15'
                        } ${isCur ? 'ring-2 ring-white scale-105' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {recordedBeatBlob && recordedBeatUrl && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/45 p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <input
                  value={beatTitle}
                  onChange={(e) => setBeatTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/50 border border-emerald-400/40 text-xs font-bold text-white w-full sm:w-52"
                  placeholder="Nome do seu beat"
                />
                <audio controls src={recordedBeatUrl} className="h-9 w-full sm:w-56" />
              </div>
              <button
                onClick={handleSaveBeatAsTrack}
                disabled={savingBeat}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 shrink-0"
              >
                <Save className="w-4 h-4" /> {savingBeat ? 'Salvando...' : 'Publicar Beat no Meu App'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* === SUBTAB 3: PLANO 1.000 MÚSICAS + GUIA DISTROKID === */}
      {subTab === 'plan1000' && (
        <div className="space-y-5">
          {/* Progress Card */}
          <div className="rounded-3xl glass-panel neon-border p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                  <Rocket className="w-4 h-4" /> MISSÃO {settings.totalGoal} MÚSICAS · RITMO {settings.dailyGoal}/DIA
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
                  {tracks.length} <span className="text-purple-400 text-lg">/ {settings.totalGoal} FAIXAS NO COFRE</span>
                </h2>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-300">Estimativa no ritmo de {settings.dailyGoal}/dia:</div>
                <div className="font-display text-xl font-extrabold text-cyan-300">{daysAt10} dias restantes</div>
              </div>
            </div>

            <div className="h-4 rounded-full bg-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all"
                style={{ width: `${Math.max(2.5, pct1000)}%` }}
              />
            </div>

            {/* Strategic Safety Alert for 10/day + DistroKid */}
            <div className="rounded-2xl bg-amber-500/12 border border-amber-400/35 p-4 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-100/90 space-y-1.5 leading-relaxed">
                <div className="font-extrabold text-amber-200 text-sm">
                  Dica de Ouro para proteger sua conta na DistroKid com 1.000 músicas (10/dia):
                </div>
                <p>
                  <strong>1. No seu App LENKYX e no YouTube:</strong> você pode soltar <strong>10 faixas por dia</strong> sem medo (ou 1 vídeo longo "Full Mix 10 faixas" + 3 Shorts por dia). Aqui a casa é 100% sua!
                </p>
                <p>
                  <strong>2. Na DistroKid / Spotify / Apple Music:</strong> subir 10 singles de IA todo santo dia costuma disparar filtros anti-spam das plataformas e pode bloquear a conta. A estratégia mais inteligente é agrupar em <strong>Álbuns de 10 a 20 faixas</strong> (1 álbum por semana) ou subir lá apenas as <strong>faixas campeãs que bombarem primeiro no seu App, WhatsApp e YouTube</strong> — sempre geradas com plano pago do Suno para ter direito comercial.
                </p>
              </div>
            </div>
          </div>

          {/* Production Checklist Table */}
          <div className="rounded-3xl glass-panel p-5 overflow-x-auto">
            <h3 className="font-display text-sm font-extrabold text-white mb-3">
              ESTEIRA DE PRODUÇÃO — CLIQUE PARA MARCAR ETAPAS CONCLUÍDAS
            </h3>
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 text-purple-300">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Música</th>
                  <th className="py-2 pr-3">Lote</th>
                  <th className="py-2 text-center">Suno Áudio</th>
                  <th className="py-2 text-center">Capa</th>
                  <th className="py-2 text-center">No App</th>
                  <th className="py-2 text-center">YouTube</th>
                  <th className="py-2 text-center">DistroKid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tracks.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5">
                    <td className="py-2.5 pr-3 font-mono text-purple-300">#{String(t.number).padStart(2, '0')}</td>
                    <td className="py-2.5 pr-3 font-bold text-white">
                      {t.emoji} {t.title}{' '}
                      <span className="text-[10px] text-purple-300/70 font-normal">({t.bpm} BPM)</span>
                    </td>
                    <td className="py-2.5 pr-3 text-cyan-300 font-mono">Dia {t.releaseBatch}</td>
                    {(['suno', 'cover', 'app', 'youtube', 'distrokid'] as const).map((field) => (
                      <td key={field} className="py-2.5 text-center">
                        <button
                          onClick={() => onToggleTrackStatus(t, field)}
                          className={`p-1.5 rounded-lg transition ${
                            t.status[field]
                              ? 'bg-emerald-500/25 text-emerald-300'
                              : 'bg-white/5 text-purple-400/40 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

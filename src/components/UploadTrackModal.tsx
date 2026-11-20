import React, { useEffect, useState } from 'react';
import { X, Upload, Music, Image as ImageIcon, Save, CheckCircle2, Trash2, ExternalLink } from 'lucide-react';
import { Track } from '../types';
import { authFetch } from '../utils/api';

interface Props {
  open: boolean;
  onClose: () => void;
  editingTrack?: Track | null;
  onSaved: (track: Track, isNew: boolean) => void;
  onDeleted?: (trackId: string) => void;
  onToast: (msg: string) => void;
}

export const UploadTrackModal: React.FC<Props> = ({ open, onClose, editingTrack, onSaved, onDeleted, onToast }) => {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🚀');
  const [album, setAlbum] = useState('Cosmic Phonk Vol. 1 (Parte 2)');
  const [bpm, setBpm] = useState(132);
  const [keySig, setKeySig] = useState('Fm');
  const [sunoPrompt, setSunoPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioV2File, setAudioV2File] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [status, setStatus] = useState({ suno: false, cover: false, app: true, youtube: false, distrokid: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTrack) {
      setTitle(editingTrack.title);
      setEmoji(editingTrack.emoji || '🎵');
      setAlbum(editingTrack.album);
      setBpm(editingTrack.bpm);
      setKeySig(editingTrack.key || 'Fm');
      setSunoPrompt(editingTrack.sunoPrompt || '');
      setLyrics(editingTrack.lyrics || '');
      setCoverPreview(editingTrack.coverUrl);
      setStatus(editingTrack.status);
    } else {
      setTitle('');
      setEmoji('🚀');
      setAlbum('Cosmic Phonk Vol. 2');
      setBpm(132);
      setKeySig('Fm');
      setSunoPrompt(
        'Futuristic Funk Melody x Brazilian Drift Phonk Fusion, cinematic sci-fi intro, catchy English male vocals, viral sing-along chorus, uplifting futuristic synths, cyberpunk atmosphere, aggressive cowbell melody, distorted 808 bass, heavy sub bass, punchy house kick, dark futuristic synths, hypnotic bassline, Portuguese phonk vocal chops, reverb, nightclub energy, intergalactic dance anthem, festival atmosphere, TikTok viral potential, powerful drops, cinematic sound design, 132 BPM, professional mix and master, Produced by LENKYX.'
      );
      setLyrics('');
      setCoverPreview('');
      setStatus({ suno: false, cover: false, app: true, youtube: false, distrokid: false });
    }
    setAudioFile(null);
    setAudioV2File(null);
    setCoverFile(null);
  }, [editingTrack, open]);

  if (!open) return null;

  const handleCoverPick = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('emoji', emoji.trim() || '🎵');
      fd.append('album', album.trim() || 'MORRO GOLD Singles');
      fd.append('bpm', String(bpm));
      fd.append('key', keySig);
      fd.append('sunoPrompt', sunoPrompt);
      fd.append('lyrics', lyrics);
      fd.append('status', JSON.stringify(status));
      if (audioFile) fd.append('audio', audioFile);
      if (audioV2File) fd.append('audioV2', audioV2File);
      if (coverFile) fd.append('cover', coverFile);

      const url = editingTrack ? `/api/tracks/${editingTrack.id}` : '/api/tracks';
      const method = editingTrack ? 'PUT' : 'POST';

      const res = await authFetch(url, { method, body: fd });
      if (res.status === 401) {
        onToast('Sessão expirada. Faça login como Criador novamente.');
        return;
      }
      if (!res.ok) throw new Error('Erro ao salvar faixa');
      const saved: Track = await res.json();
      onSaved(saved, !editingTrack);
      onToast(editingTrack ? `Faixa "${saved.title}" atualizada!` : `Faixa "${saved.title}" adicionada ao catálogo!`);
      onClose();
    } catch {
      onToast('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTrack) return;
    if (!window.confirm(`Tem certeza que deseja excluir "${editingTrack.title}" do catálogo?`)) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/tracks/${editingTrack.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      onDeleted?.(editingTrack.id);
      onToast(`Faixa "${editingTrack.title}" removida do catálogo.`);
      onClose();
    } catch {
      onToast('Erro ao excluir faixa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel neon-border overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shrink-0" />
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-white">
                {editingTrack ? `EDITAR / SUBIR SUNO: ${editingTrack.title}` : 'ADICIONAR NOVA MÚSICA AO COFRE'}
              </h2>
              <p className="text-xs text-purple-300">Suba seu MP3/WAV gerado no Suno + capa e letra</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-purple-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {editingTrack?.sunoUrl && (
            <div className="rounded-2xl bg-purple-950/60 border border-purple-500/35 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
              <span className="text-purple-100">
                {editingTrack.sunoPrivate
                  ? 'Esta música ainda está Privada no Suno — torne pública lá (e clique em Sincronizar) ou suba o WAV abaixo!'
                  : 'Conectada ao seu Suno oficial (@lenkyx). Você pode substituir pelo WAV Master ou adicionar a Versão 2!'}
              </span>
              <a
                href={editingTrack.sunoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 font-bold flex items-center gap-1 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir no Suno
              </a>
            </div>
          )}

          {/* Audio V1 + Audio V2 + Cover pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="cursor-pointer rounded-2xl border-2 border-dashed border-pink-500/40 hover:border-pink-400 bg-pink-500/5 p-3.5 flex flex-col items-center justify-center text-center gap-1.5 transition">
              <Music className="w-6 h-6 text-pink-400" />
              <div className="text-xs font-bold text-white truncate max-w-full">
                {audioFile ? audioFile.name : 'Versão 1 — Principal (WAV / MP3)'}
              </div>
              <div className="text-[11px] text-purple-300/75">
                {audioFile
                  ? `${(audioFile.size / 1024 / 1024).toFixed(1)} MB pronto!`
                  : editingTrack?.isDemoAudio
                  ? 'Subir WAV / MP3 real (até 150 MB)'
                  : 'Opcional: trocar V1 pelo WAV Master'}
              </div>
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.m4a"
                className="hidden"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
            </label>

            <label className="cursor-pointer rounded-2xl border-2 border-dashed border-purple-500/45 hover:border-purple-400 bg-purple-500/5 p-3.5 flex flex-col items-center justify-center text-center gap-1.5 transition">
              <Music className="w-6 h-6 text-purple-300" />
              <div className="text-xs font-bold text-white truncate max-w-full">
                {audioV2File ? audioV2File.name : 'Versão 2 — Alternativa (WAV / MP3)'}
              </div>
              <div className="text-[11px] text-purple-300/75">
                {audioV2File
                  ? `${(audioV2File.size / 1024 / 1024).toFixed(1)} MB pronto!`
                  : editingTrack?.audioUrlV2
                  ? '✓ V2 carregada! Clique para trocar'
                  : 'Suba a 2ª versão do Suno pra comparar V1/V2'}
              </div>
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.m4a"
                className="hidden"
                onChange={(e) => setAudioV2File(e.target.files?.[0] || null)}
              />
            </label>

            <label className="cursor-pointer rounded-2xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/5 p-3.5 flex items-center gap-3 transition">
              {coverPreview ? (
                <img src={coverPreview} alt="Capa" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/20" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-6 h-6 text-cyan-400" />
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {coverFile ? coverFile.name : 'Capa (PNG / JPG)'}
                </div>
                <div className="text-[11px] text-purple-300/75">1:1 (3000×3000 DistroKid)</div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleCoverPick(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-purple-200 mb-1">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-center text-base"
              />
            </div>
            <div className="col-span-10 sm:col-span-6">
              <label className="block text-xs font-semibold text-purple-200 mb-1">Nome da Música</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Supernova Drift"
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <label className="block text-xs font-semibold text-purple-200 mb-1">BPM</label>
              <input
                type="number"
                min={70}
                max={200}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white"
              />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <label className="block text-xs font-semibold text-purple-200 mb-1">Tom</label>
              <input
                type="text"
                value={keySig}
                onChange={(e) => setKeySig(e.target.value)}
                placeholder="Fm"
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Álbum / Coleção</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Status checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5">Checklist de Lançamento</label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['suno', 'Áudio Suno'],
                  ['cover', 'Capa Pronta'],
                  ['app', 'No App MORRO GOLD'],
                  ['youtube', 'No YouTube'],
                  ['distrokid', 'Na DistroKid'],
                ] as const
              ).map(([field, label]) => (
                <button
                  type="button"
                  key={field}
                  onClick={() => setStatus((s) => ({ ...s, [field]: !s[field] }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                    status[field]
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-purple-300/70'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Prompt do Suno</label>
            <textarea
              rows={2}
              value={sunoPrompt}
              onChange={(e) => setSunoPrompt(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Letra da Música</label>
            <textarea
              rows={4}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="[Intro]&#10;..."
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-xs font-mono text-purple-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {editingTrack && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-3.5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-400/35 text-xs font-bold text-red-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Excluir Faixa
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-purple-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-sm font-extrabold text-white flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Enviando...' : editingTrack ? 'Salvar Alterações' : 'Guardar Música no App'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

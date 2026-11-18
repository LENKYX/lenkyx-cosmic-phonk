import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  Play,
  Pause,
  Trash2,
  Upload,
  Music,
  Image as ImageIcon,
  Video,
  Heart,
  Sparkles,
  User,
} from 'lucide-react';
import { Track, UserPlaylist, UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
  playlists: UserPlaylist[];
  allCatalogTracks: Track[];
  userTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onSendToVideo?: (track: Track) => void;
  onCreatePlaylist: (name: string, description: string, emoji: string) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveFromPlaylist: (playlistId: string, trackId: string) => void;
  onUploadUserTrack: (params: {
    title: string;
    artist: string;
    bpm: number;
    audioFile: File;
    coverFile?: File | null;
    targetPlaylistId?: string;
  }) => Promise<void>;
  onDeleteUserTrack: (id: string) => void;
  onOpenUserAuth?: () => void;
}

const EMOJIS = ['🚀', '🔥', '🎧', '💜', '🌌', '⚡', '🚗', '🌙'];

export const PlaylistsView: React.FC<Props> = ({
  user,
  playlists,
  allCatalogTracks,
  userTracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onSendToVideo,
  onCreatePlaylist,
  onDeletePlaylist,
  onRemoveFromPlaylist,
  onUploadUserTrack,
  onDeleteUserTrack,
  onOpenUserAuth,
}) => {
  const [selectedId, setSelectedId] = useState<string>(playlists[0]?.id || 'USER_UPLOADS');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEmoji, setNewEmoji] = useState('🚀');

  // Upload user personal track modal state
  const [uploading, setUploading] = useState(false);
  const [upTitle, setUpTitle] = useState('');
  const [upArtist, setUpArtist] = useState(user?.name || '');
  const [upBpm, setUpBpm] = useState(128);
  const [upAudio, setUpAudio] = useState<File | null>(null);
  const [upCover, setUpCover] = useState<File | null>(null);
  const [upPlaylistId, setUpPlaylistId] = useState<string>(playlists[0]?.id || '');
  const [savingTrack, setSavingTrack] = useState(false);

  const selectedPlaylist = playlists.find((p) => p.id === selectedId) || null;
  const trackMap = new Map<string, Track>();
  allCatalogTracks.forEach((t) => trackMap.set(t.id, t));
  userTracks.forEach((t) => trackMap.set(t.id, t));

  const resolvedTracks: Track[] =
    selectedId === 'USER_UPLOADS'
      ? userTracks
      : selectedId === 'FAVORITES'
      ? allCatalogTracks.filter((t) => t.favorite)
      : selectedPlaylist
      ? selectedPlaylist.trackIds
          .map((id) => trackMap.get(id) || selectedPlaylist.savedExternalTracks?.[id])
          .filter((x): x is Track => Boolean(x))
      : [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreatePlaylist(newName.trim(), newDesc.trim() || 'Playlist personalizada no app LENKYX', newEmoji);
    setNewName('');
    setNewDesc('');
    setCreating(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upAudio) return;
    setSavingTrack(true);
    try {
      await onUploadUserTrack({
        title: upTitle.trim() || upAudio.name.replace(/\.[^.]+$/, ''),
        artist: upArtist.trim() || user?.name || 'Minha Música',
        bpm: upBpm,
        audioFile: upAudio,
        coverFile: upCover,
        targetPlaylistId: upPlaylistId || undefined,
      });
      setUpTitle('');
      setUpAudio(null);
      setUpCover(null);
      setUploading(false);
      setSelectedId(upPlaylistId || 'USER_UPLOADS');
    } finally {
      setSavingTrack(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 md:pb-24">
      {/* Header */}
      <div className="rounded-3xl cosmic-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <ListMusic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-black text-white">
              SUA BIBLIOTECA <span className="neon-text">& PLAYLISTS</span>
            </h1>
            <p className="text-xs text-purple-200/75">
              Crie playlists, misture músicas da LENKYX com músicas do mundo e suba seus próprios áudios MP3/WAV!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!user && onOpenUserAuth && (
            <button
              onClick={onOpenUserAuth}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-cyan-300" /> Criar Perfil Grátis
            </button>
          )}
          <button
            onClick={() => setUploading(true)}
            className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-100 text-xs font-extrabold flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Colocar Minha Música
          </button>
          <button
            onClick={() => setCreating(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Playlist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Playlists Selector */}
        <div className="lg:col-span-4 space-y-2">
          <button
            onClick={() => setSelectedId('FAVORITES')}
            className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition ${
              selectedId === 'FAVORITES'
                ? 'bg-pink-500/20 border-pink-400/50 text-white'
                : 'bg-white/[0.03] border-white/10 text-purple-200 hover:bg-white/[0.07]'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">Músicas Curtidas</div>
              <div className="text-[11px] opacity-75">
                {allCatalogTracks.filter((t) => t.favorite).length} faixas favoritas
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedId('USER_UPLOADS')}
            className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition ${
              selectedId === 'USER_UPLOADS'
                ? 'bg-cyan-500/20 border-cyan-400/50 text-white'
                : 'bg-white/[0.03] border-white/10 text-purple-200 hover:bg-white/[0.07]'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">Minhas Músicas Enviadas</div>
              <div className="text-[11px] opacity-75">{userTracks.length} arquivos pessoais</div>
            </div>
          </button>

          <div className="pt-1 text-[10px] font-bold uppercase tracking-wider text-purple-300/60 px-1">
            Suas Playlists ({playlists.length})
          </div>

          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setSelectedId(pl.id)}
              className={`w-full p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
                selectedId === pl.id
                  ? 'bg-purple-500/25 border-purple-400/55 text-white'
                  : 'bg-white/[0.03] border-white/10 text-purple-200 hover:bg-white/[0.07]'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${pl.accentColor} flex items-center justify-center text-lg shrink-0`}>
                {pl.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate">{pl.name}</div>
                <div className="text-[11px] opacity-75 truncate">{pl.trackIds.length} músicas</div>
              </div>
              {playlists.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePlaylist(pl.id);
                    if (selectedId === pl.id) setSelectedId('FAVORITES');
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500/25 text-purple-300 hover:text-red-300"
                  title="Excluir playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Right: Active Playlist Tracks */}
        <div className="lg:col-span-8 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-purple-950/60 to-transparent">
            <div>
              <h2 className="font-display text-base font-extrabold text-white">
                {selectedId === 'FAVORITES'
                  ? '❤️ Músicas Curtidas'
                  : selectedId === 'USER_UPLOADS'
                  ? '🎵 Minhas Músicas Enviadas'
                  : `${selectedPlaylist?.emoji || '🎵'} ${selectedPlaylist?.name || 'Playlist'}`}
              </h2>
              <p className="text-xs text-purple-200/75">
                {selectedId === 'USER_UPLOADS'
                  ? 'Arquivos MP3/WAV salvos no seu aparelho — toque ou crie vídeos incríveis com eles!'
                  : selectedPlaylist?.description || `${resolvedTracks.length} músicas`}
              </p>
            </div>
            {resolvedTracks[0] && (
              <button
                onClick={() => onPlayTrack(resolvedTracks[0], resolvedTracks)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Tocar
              </button>
            )}
          </div>

          {resolvedTracks.length === 0 ? (
            <div className="p-10 text-center space-y-2.5 text-purple-300/80 text-xs">
              <Sparkles className="w-7 h-7 mx-auto text-pink-400 opacity-75" />
              <div className="font-bold text-white">Esta lista ainda está vazia!</div>
              <p className="max-w-sm mx-auto opacity-80">
                Clique no ícone <strong>+ Playlist</strong> em qualquer música da LENKYX ou da aba{' '}
                <strong>Explorar Mundo</strong>, ou clique em <strong>Colocar Minha Música</strong> para subir seus
                arquivos MP3/WAV!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {resolvedTracks.map((t, idx) => {
                const active = currentTrack?.id === t.id;
                return (
                  <div
                    key={`${t.id}-${idx}`}
                    className={`flex items-center gap-3 px-3 py-2 hover:bg-white/[0.05] transition ${
                      active ? 'bg-pink-500/12' : ''
                    }`}
                  >
                    <span className="w-5 text-right text-[11px] font-mono text-purple-300/60">{idx + 1}</span>
                    <button
                      onClick={() => onPlayTrack(t, resolvedTracks)}
                      className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black"
                    >
                      <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        {active && isPlaying ? (
                          <Pause className="w-4 h-4 text-pink-400 fill-pink-400" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </button>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlayTrack(t, resolvedTracks)}>
                      <div className={`text-xs sm:text-sm font-bold truncate ${active ? 'text-pink-400' : 'text-white'}`}>
                        {t.title}
                      </div>
                      <div className="text-[11px] text-purple-300/75 truncate">
                        {t.artist} · {t.album}
                      </div>
                    </div>
                    {onSendToVideo && (
                      <button
                        onClick={() => onSendToVideo(t)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/25 text-cyan-300"
                        title="Criar Vídeo com esta Música"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    )}
                    {selectedId === 'USER_UPLOADS' && (
                      <button
                        onClick={() => onDeleteUserTrack(t.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/25 text-red-300"
                        title="Remover arquivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {selectedPlaylist && (
                      <button
                        onClick={() => onRemoveFromPlaylist(selectedPlaylist.id, t.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/25 text-purple-300 hover:text-red-300"
                        title="Tirar da playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
          <form onSubmit={handleCreate} className="w-full max-w-sm rounded-2xl glass-panel neon-border p-5 space-y-3.5">
            <h3 className="font-display text-base font-extrabold text-white">NOVA PLAYLIST</h3>
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Nome da Playlist</label>
              <input
                type="text"
                required
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Treino Pesado, Carro à Noite, Mix Phonk..."
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Só as brabas..."
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setNewEmoji(em)}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center ${
                    newEmoji === em ? 'bg-pink-500' : 'bg-white/10'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 rounded-xl bg-white/10 text-xs font-bold">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-extrabold text-white">
                Criar Playlist
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload User Personal Track Modal */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
          <form onSubmit={handleUploadSubmit} className="w-full max-w-md rounded-2xl glass-panel neon-border p-5 space-y-3.5">
            <h3 className="font-display text-base font-extrabold text-white">COLOCAR MINHA MÚSICA NO APP</h3>
            <p className="text-[11px] text-purple-200/80">
              Suba qualquer música MP3 / WAV / M4A do seu celular ou PC para ouvir no player com Grave Turbinado ou
              salvar nas suas playlists pessoais!
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="cursor-pointer rounded-xl border-2 border-dashed border-pink-500/45 bg-pink-500/5 p-3 text-center flex flex-col items-center gap-1">
                <Music className="w-5 h-5 text-pink-400" />
                <span className="text-[11px] font-bold text-white truncate max-w-full">
                  {upAudio ? upAudio.name : 'Escolher Áudio *'}
                </span>
                <input type="file" accept="audio/*,.mp3,.wav,.m4a" className="hidden" onChange={(e) => setUpAudio(e.target.files?.[0] || null)} />
              </label>
              <label className="cursor-pointer rounded-xl border-2 border-dashed border-cyan-500/45 bg-cyan-500/5 p-3 text-center flex flex-col items-center gap-1">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <span className="text-[11px] font-bold text-white truncate max-w-full">
                  {upCover ? upCover.name : 'Capa (opcional)'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setUpCover(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={upTitle}
                onChange={(e) => setUpTitle(e.target.value)}
                placeholder="Nome da música"
                className="px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-xs text-white"
              />
              <input
                type="text"
                value={upArtist}
                onChange={(e) => setUpArtist(e.target.value)}
                placeholder="Artista"
                className="px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={60}
                max={200}
                value={upBpm}
                onChange={(e) => setUpBpm(Number(e.target.value))}
                placeholder="BPM"
                className="px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-xs text-white"
              />
              <select
                value={upPlaylistId}
                onChange={(e) => setUpPlaylistId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-xs text-white"
              >
                <option value="">Só em Minhas Músicas</option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    Adicionar em: {pl.emoji} {pl.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setUploading(false)} className="px-3 py-2 rounded-xl bg-white/10 text-xs font-bold">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!upAudio || savingTrack}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-xs font-extrabold disabled:opacity-40"
              >
                {savingTrack ? 'Salvando...' : 'Adicionar Música'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

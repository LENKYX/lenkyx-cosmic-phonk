import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  WifiOff,
  Wifi,
  FolderDown,
  Play,
  Pause,
  DownloadCloud,
  CheckCircle2,
  Loader2,
  FolderPlus,
  Car,
  Film,
  Music,
  ArrowLeft,
  Trash2,
  X,
  HardDrive,
} from 'lucide-react';
import { Track } from '../types';
import {
  DEFAULT_OFFLINE_FOLDERS,
  downloadTrackOffline,
  downloadVideoOffline,
  getOfflineStorageSummary,
  getOfflineTrackIds,
  importLocalMediaToFolder,
  loadSavedOfflineFolders,
  OfflineFolderMeta,
  OfflineMediaItem,
  removeTrackOffline,
  resolvePlayableVideoUrl,
  SavedOfflineFolderState,
  upsertOfflineFolderItems,
} from '../utils/offlineCache';
import { syncBackgroundMediaSession } from '../utils/backgroundAudioGuard';

interface Props {
  currentTrack: Track | null;
  isPlaying: boolean;
  offlineTrackIds: Set<string>;
  onRefreshOfflineIds: () => void;
  onPlayTrack: (track: Track, queue: Track[]) => void;
  onPauseMusic: () => void;
  onToast: (msg: string) => void;
}

export const OfflineTravelView: React.FC<Props> = ({
  currentTrack,
  isPlaying,
  offlineTrackIds,
  onRefreshOfflineIds,
  onPlayTrack,
  onPauseMusic,
  onToast,
}) => {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [folders, setFolders] = useState<OfflineFolderMeta[]>(DEFAULT_OFFLINE_FOLDERS);
  const [savedFolders, setSavedFolders] = useState<Record<string, SavedOfflineFolderState>>(() =>
    loadSavedOfflineFolders()
  );
  const [activeFolder, setActiveFolder] = useState<OfflineFolderMeta | null>(null);
  const [folderItems, setFolderItems] = useState<OfflineMediaItem[]>([]);
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [targetLimit, setTargetLimit] = useState<number>(100);
  const [batchProgress, setBatchProgress] = useState<{
    running: boolean;
    done: number;
    total: number;
    currentTitle: string;
  } | null>(null);
  const cancelBatchRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [playingVideo, setPlayingVideo] = useState<{ item: OfflineMediaItem; src: string; offline: boolean } | null>(
    null
  );

  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    fetch('/api/offline-folders')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.folders?.length) setFolders(d.folders);
      })
      .catch(() => {});
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
    };
  }, []);

  const storageSummary = useMemo(() => {
    // touch offlineTrackIds so summary refreshes after downloads
    void offlineTrackIds.size;
    return getOfflineStorageSummary();
  }, [offlineTrackIds]);

  const openFolder = async (folder: OfflineFolderMeta, limit = targetLimit) => {
    setActiveFolder(folder);
    const saved = loadSavedOfflineFolders()[folder.id];
    if (saved?.items?.length) {
      setFolderItems(saved.items);
    } else {
      setFolderItems([]);
    }
    if (!navigator.onLine) return;

    setLoadingFolder(true);
    try {
      const res = await fetch(`/api/offline-folders/${encodeURIComponent(folder.id)}?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        const remoteItems: OfflineMediaItem[] = data.items || [];
        const merged = upsertOfflineFolderItems(folder, remoteItems);
        setFolderItems(merged.items);
        setSavedFolders(loadSavedOfflineFolders());
      }
    } catch {
      // keep cached offline items
    } finally {
      setLoadingFolder(false);
    }
  };

  const handleDownloadSingle = async (folder: OfflineFolderMeta, item: OfflineMediaItem) => {
    try {
      if (folder.mediaKind === 'video' || item.mediaKind === 'video') {
        await downloadVideoOffline(item);
      } else {
        await downloadTrackOffline(item);
      }
      upsertOfflineFolderItems(folder, [item], item.id);
      setSavedFolders(loadSavedOfflineFolders());
      onRefreshOfflineIds();
      onToast(`✅ Salvo offline: ${item.title}`);
    } catch {
      onToast(`Não foi possível baixar "${item.title}".`);
    }
  };

  const handleDownloadBatch = async (folder: OfflineFolderMeta, count: number) => {
    if (batchProgress?.running) return;
    cancelBatchRef.current = false;

    let pool = folderItems;
    if (pool.length < count && navigator.onLine) {
      setLoadingFolder(true);
      try {
        const res = await fetch(`/api/offline-folders/${encodeURIComponent(folder.id)}?limit=${count}`);
        if (res.ok) {
          const data = await res.json();
          const merged = upsertOfflineFolderItems(folder, data.items || []);
          pool = merged.items;
          setFolderItems(pool);
        }
      } catch {
        // use existing pool
      } finally {
        setLoadingFolder(false);
      }
    }

    const ownedIds = getOfflineTrackIds();
    const toDownload = pool.filter((x) => !ownedIds.has(x.id)).slice(0, count);
    if (toDownload.length === 0) {
      onToast('✅ Todas essas faixas/vídeos já estão salvos offline no aparelho!');
      return;
    }

    setBatchProgress({ running: true, done: 0, total: toDownload.length, currentTitle: toDownload[0].title });
    let completed = 0;

    // Download 2 concurrently so mobile & desktop stay responsive without stalling
    let cursor = 0;
    const worker = async () => {
      while (cursor < toDownload.length && !cancelBatchRef.current) {
        const item = toDownload[cursor++];
        setBatchProgress({ running: true, done: completed, total: toDownload.length, currentTitle: item.title });
        try {
          if (folder.mediaKind === 'video' || item.mediaKind === 'video') {
            await downloadVideoOffline(item);
          } else {
            await downloadTrackOffline(item);
          }
          upsertOfflineFolderItems(folder, [item], item.id);
        } catch {
          // skip failed stream and keep rolling
        }
        completed++;
        setBatchProgress({ running: true, done: completed, total: toDownload.length, currentTitle: item.title });
        if (completed % 4 === 0) {
          onRefreshOfflineIds();
          setSavedFolders(loadSavedOfflineFolders());
        }
      }
    };

    await Promise.all([worker(), worker()]);
    onRefreshOfflineIds();
    setSavedFolders(loadSavedOfflineFolders());
    setBatchProgress(null);
    onToast(
      cancelBatchRef.current
        ? `Download pausado (${completed} itens salvos offline para viagem!)`
        : `🚗 Pronto! ${completed} itens salvos offline na pasta "${folder.title}"!`
    );
  };

  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !activeFolder) return;
    try {
      const added = await importLocalMediaToFolder(activeFolder, files);
      const updated = loadSavedOfflineFolders()[activeFolder.id];
      if (updated) setFolderItems(updated.items);
      setSavedFolders(loadSavedOfflineFolders());
      onRefreshOfflineIds();
      onToast(`📁 ${added.length} arquivo(s) do seu aparelho salvos offline em "${activeFolder.title}"!`);
    } catch {
      onToast('Erro ao importar arquivos do aparelho.');
    } finally {
      e.target.value = '';
    }
  };

  const handlePlayItem = async (item: OfflineMediaItem) => {
    if (item.mediaKind === 'video' || item.videoUrl) {
      onPauseMusic();
      const resolved = await resolvePlayableVideoUrl(item);
      if (!resolved.url) {
        onToast('Vídeo indisponível offline. Baixe primeiro enquanto estiver com internet.');
        return;
      }
      setPlayingVideo({ item, src: resolved.url, offline: resolved.fromOffline });
      syncBackgroundMediaSession({
        title: item.title,
        artist: item.artist || 'Vídeo Offline',
        album: activeFolder?.title || 'Viagem Offline',
        artworkUrl: item.coverUrl,
        isPlaying: true,
      });
      return;
    }

    // Play audio item (filter to offline items when offline!)
    const queue = navigator.onLine
      ? folderItems.filter((x) => x.mediaKind !== 'video')
      : folderItems.filter((x) => x.mediaKind !== 'video' && offlineTrackIds.has(x.id));
    onPlayTrack(item, queue.length ? queue : [item]);
  };

  const handlePlayOfflineFolderAll = () => {
    const offlineAudio = folderItems.filter((x) => x.mediaKind !== 'video' && offlineTrackIds.has(x.id));
    if (offlineAudio.length > 0) {
      onPlayTrack(offlineAudio[0], offlineAudio);
      onToast(`🚗 Tocando ${offlineAudio.length} músicas offline da pasta "${activeFolder?.title}"!`);
    } else if (folderItems.length > 0 && navigator.onLine) {
      const audioOnly = folderItems.filter((x) => x.mediaKind !== 'video');
      if (audioOnly.length) onPlayTrack(audioOnly[0], audioOnly);
    } else {
      onToast('Baixe pelo menos 1 música ou importe do aparelho para tocar sem internet.');
    }
  };

  return (
    <div className="space-y-5 pb-32 md:pb-24">
      {/* TRAVEL / OFFLINE HERO STATUS */}
      <section className="rounded-3xl glass-panel border border-emerald-400/30 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-600 flex items-center justify-center text-black shadow-[0_0_24px_rgba(52,211,153,0.45)] shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl font-black text-white">
                MODO VIAGEM & PASTAS OFFLINE
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border ${
                  online
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : 'bg-amber-500/25 border-amber-400/50 text-amber-200'
                }`}
              >
                {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {online ? 'ONLINE · PRONTO P/ BAIXAR' : 'SEM INTERNET · MODO OFFLINE ATIVO'}
              </span>
            </div>
            <p className="text-xs text-purple-100/80 mt-1">
              Pastas por gênero (até <b>500 músicas ou vídeos por pasta</b>) + suas próprias músicas do celular para ouvir no carro/viagem <b>100% sem internet</b>!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/45 border border-white/10 shrink-0">
          <HardDrive className="w-5 h-5 text-cyan-300" />
          <div className="text-xs">
            <div className="font-black text-white">{storageSummary.count} arquivos salvos</div>
            <div className="text-[10px] text-emerald-300 font-mono">{storageSummary.totalMb} MB no aparelho</div>
          </div>
        </div>
      </section>

      {!activeFolder ? (
        /* FOLDERS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {folders.map((folder) => {
            const state = savedFolders[folder.id];
            const offlineCount = (state?.items || []).filter((x) => offlineTrackIds.has(x.id)).length;
            const totalLoaded = state?.items?.length || 0;
            return (
              <div
                key={folder.id}
                onClick={() => void openFolder(folder)}
                className="group cursor-pointer rounded-3xl cosmic-card-3d border border-white/12 hover:border-cyan-400/50 p-4 flex flex-col justify-between gap-3 transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${folder.accent} flex items-center justify-center text-2xl shadow-lg shrink-0`}
                  >
                    {folder.emoji}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-black text-cyan-200">
                      {folder.mediaKind === 'video' ? '🎬 VÍDEOS MP4' : '🎵 ATÉ 500 MÚSICAS'}
                    </span>
                    {offlineCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-black text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {offlineCount} offline
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-sm sm:text-base font-black text-white group-hover:text-cyan-300 transition">
                    {folder.title}
                  </h2>
                  <p className="text-[11px] text-slate-300/80 mt-0.5 line-clamp-2">{folder.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-bold">
                  <span className="text-purple-200/80">
                    {totalLoaded > 0 ? `${totalLoaded} carregadas na pasta` : 'Toque para abrir e baixar'}
                  </span>
                  <span className="text-emerald-300 flex items-center gap-1 font-black">
                    <FolderDown className="w-3.5 h-3.5" /> Abrir Pasta
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* OPEN GENRE FOLDER VIEW */
        <div className="space-y-4">
          <div className="rounded-3xl cosmic-card-3d border border-cyan-400/30 p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveFolder(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                  title="Voltar às pastas"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeFolder.accent} flex items-center justify-center text-xl`}
                >
                  {activeFolder.emoji}
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-black text-white">{activeFolder.title}</h2>
                  <div className="text-[11px] text-emerald-300 font-bold">
                    {folderItems.filter((x) => offlineTrackIds.has(x.id)).length} salvas offline · {folderItems.length} na lista
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={targetLimit}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setTargetLimit(next);
                    void openFolder(activeFolder, next);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#0d0622] border border-cyan-400/35 text-xs font-black text-cyan-200 cursor-pointer"
                >
                  <option value={50}>Carregar 50</option>
                  <option value={100}>Carregar 100</option>
                  <option value={250}>Carregar 250</option>
                  <option value={500}>Carregar 500 (Máximo)</option>
                </select>

                <button
                  onClick={handlePlayOfflineFolderAll}
                  className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-black" /> Tocar Pasta Offline
                </button>
              </div>
            </div>

            {/* Batch Download + Import Local Files */}
            <div className="flex flex-wrap items-center gap-2">
              {online && (
                <>
                  <button
                    onClick={() => void handleDownloadBatch(activeFolder, 50)}
                    disabled={Boolean(batchProgress?.running)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 disabled:opacity-50 text-black text-xs font-black flex items-center gap-1.5"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" /> Baixar 50 Offline
                  </button>
                  <button
                    onClick={() => void handleDownloadBatch(activeFolder, targetLimit)}
                    disabled={Boolean(batchProgress?.running)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5"
                  >
                    <FolderDown className="w-3.5 h-3.5" /> Baixar Tudo ({targetLimit} itens) p/ Viagem
                  </button>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,video/*"
                onChange={(e) => void handleImportFiles(e)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-300" /> Importar Minhas Músicas / Vídeos do Aparelho
              </button>
            </div>

            {batchProgress?.running && (
              <div className="rounded-2xl bg-black/55 border border-cyan-400/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-black text-cyan-300 flex items-center gap-1.5 truncate">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    Baixando {batchProgress.done} / {batchProgress.total}: {batchProgress.currentTitle}
                  </span>
                  <button
                    onClick={() => {
                      cancelBatchRef.current = true;
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/30 text-rose-200 text-[10px] font-black shrink-0"
                  >
                    Pausar
                  </button>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                    style={{
                      width: `${Math.round((batchProgress.done / Math.max(1, batchProgress.total)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          {loadingFolder && folderItems.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-8 h-8 mx-auto text-cyan-400 animate-spin" />
              <div className="text-xs font-bold text-purple-200">
                Carregando pasta "{activeFolder.title}" (até {targetLimit} faixas)...
              </div>
            </div>
          ) : folderItems.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-3xl cosmic-card-3d space-y-2">
              <WifiOff className="w-8 h-8 mx-auto text-amber-300" />
              <div className="text-sm font-bold text-white">Pasta vazia no aparelho</div>
              <p className="text-xs text-purple-200/75">
                Conecte na internet para baixar até 500 músicas/vídeos ou toque em "Importar Minhas Músicas / Vídeos" acima!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {folderItems.slice(0, 500).map((item, idx) => {
                const isSaved = offlineTrackIds.has(item.id);
                const active = currentTrack?.id === item.id;
                const isVideo = item.mediaKind === 'video' || Boolean(item.videoUrl);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border transition ${
                      active
                        ? 'bg-pink-500/15 border-pink-400/50'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                    }`}
                  >
                    <button
                      onClick={() => void handlePlayItem(item)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      <span className="w-6 text-[10px] font-mono text-slate-400 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-black shrink-0">
                        <img
                          src={item.coverUrl || '/covers/album-official.jpg'}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                          {active && isPlaying ? (
                            <Pause className="w-4 h-4 fill-white" />
                          ) : isVideo ? (
                            <Film className="w-4 h-4 text-amber-300" />
                          ) : (
                            <Play className="w-4 h-4 fill-white" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {isVideo ? <Film className="w-3 h-3 text-amber-300 shrink-0" /> : <Music className="w-3 h-3 text-cyan-300 shrink-0" />}
                          <span className="truncate">{item.title}</span>
                        </div>
                        <div className="text-[10px] text-purple-200/75 truncate">
                          {item.artist} {isSaved ? '· ✅ Offline no aparelho' : ''}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSaved ? (
                        <button
                          onClick={async () => {
                            await removeTrackOffline(item.id);
                            onRefreshOfflineIds();
                            onToast('Removido do armazenamento offline');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-rose-500/25 border border-emerald-400/40 text-emerald-300 hover:text-rose-200 text-[10px] font-black flex items-center gap-1"
                          title="Salvo offline (clique para remover)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Offline</span>
                          <Trash2 className="w-3 h-3 opacity-60" />
                        </button>
                      ) : (
                        <button
                          onClick={() => void handleDownloadSingle(activeFolder, item)}
                          disabled={!online}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-cyan-500/25 border border-white/15 text-cyan-200 text-[10px] font-bold flex items-center gap-1 disabled:opacity-40"
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Baixar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OFFLINE VIDEO PLAYER MODAL */}
      {playingVideo && (
        <div
          onClick={() => setPlayingVideo(null)}
          className="fixed inset-0 z-[9996] bg-black/95 flex items-center justify-center p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-3xl overflow-hidden bg-[#090418] border border-emerald-400/40 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-black/70 border-b border-white/10">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-white truncate">{playingVideo.item.title}</div>
                <div className="text-[10px] text-emerald-300 font-bold">
                  {playingVideo.offline ? '✅ Reproduzindo Offline do Aparelho (Zero Internet)' : 'Stream Direto'}
                </div>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-black flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Fechar
              </button>
            </div>
            <video
              src={playingVideo.src}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[75vh] bg-black object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

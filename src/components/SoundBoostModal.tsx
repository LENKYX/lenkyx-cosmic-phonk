import React from 'react';
import { createPortal } from 'react-dom';
import { Volume2, VolumeX, Zap, Sliders, X, RotateCcw } from 'lucide-react';
import { AudioSoundProfile, DEFAULT_SOUND_PROFILE } from '../utils/audioBoostEngine';

interface Props {
  open: boolean;
  onClose: () => void;
  volume: number;
  muted: boolean;
  profile: AudioSoundProfile;
  isYoutubeStream: boolean;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onChangeProfile: (next: AudioSoundProfile) => void;
}

export const SoundBoostModal: React.FC<Props> = ({
  open,
  onClose,
  volume,
  muted,
  profile,
  isYoutubeStream,
  onVolume,
  onToggleMute,
  onChangeProfile,
}) => {
  if (!open) return null;

  const applyPreset = (preset: AudioSoundProfile['presetName']) => {
    if (preset === 'normal') {
      onChangeProfile({ ...DEFAULT_SOUND_PROFILE });
    } else if (preset === 'max') {
      onVolume(1);
      onChangeProfile({
        turboEnabled: true,
        boostPercent: 200,
        bassDb: 4,
        midDb: 2,
        trebleDb: 3,
        presetName: 'max',
      });
    } else if (preset === 'bass') {
      onChangeProfile({
        turboEnabled: true,
        boostPercent: 165,
        bassDb: 8,
        midDb: 0,
        trebleDb: 2,
        presetName: 'bass',
      });
    } else if (preset === 'vocal') {
      onChangeProfile({
        turboEnabled: true,
        boostPercent: 150,
        bassDb: 1,
        midDb: 6,
        trebleDb: 5,
        presetName: 'vocal',
      });
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9995] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-[#0d0520]/95 border border-cyan-400/40 p-5 space-y-4 shadow-[0_0_60px_rgba(34,211,238,0.3)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center shadow">
              <Sliders className="w-4 h-4 text-white" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white">Volume, Limiter & Equalizador</h3>
              <p className="text-[10px] text-cyan-300">Som mais alto sem distorção (qualidade estúdio)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Volume */}
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-purple-100">Volume Principal</span>
            <span className="text-cyan-300 font-mono">{muted ? 'Mudo' : `${Math.round(volume * 100)}%`}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              title={muted ? 'Ativar Som' : 'Silenciar'}
            >
              {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Optional Max Volume Turbo Button */}
        <div className="rounded-2xl bg-gradient-to-r from-pink-500/15 via-purple-600/15 to-cyan-500/15 border border-pink-400/35 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Modo Volume Máximo Limpo (Opcional)
              </div>
              <div className="text-[10px] text-purple-200/80">
                Amplifica até 220% com Limiter anti-chiado para manter a qualidade alta
              </div>
            </div>
            <button
              onClick={() =>
                onChangeProfile({
                  ...profile,
                  turboEnabled: !profile.turboEnabled,
                  boostPercent: !profile.turboEnabled && profile.boostPercent <= 105 ? 185 : profile.boostPercent,
                  presetName: 'custom',
                })
              }
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition shrink-0 ${
                profile.turboEnabled
                  ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-black shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20 border border-white/15'
              }`}
            >
              {profile.turboEnabled ? 'TURBO ON 🔥' : 'Ativar Turbo'}
            </button>
          </div>

          {profile.turboEnabled && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-amber-200">Ganho Extra (Amplificação Limpa)</span>
                <span className="text-amber-300 font-mono">{profile.boostPercent}%</span>
              </div>
              <input
                type="range"
                min={100}
                max={220}
                step={5}
                value={profile.boostPercent}
                onChange={(e) =>
                  onChangeProfile({ ...profile, boostPercent: Number(e.target.value), presetName: 'custom' })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          )}

          {isYoutubeStream && (
            <div className="text-[10px] text-cyan-200/85 bg-black/30 rounded-xl px-2.5 py-1.5 border border-white/10">
              💡 Em faixas do Catálogo LENKYX, Offline e Audius MP3 o ganho extra até 220% e o EQ agem direto no áudio; em clipes do YouTube o navegador limita o iframe em 100%.
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {(
            [
              { id: 'normal', label: 'Normal' },
              { id: 'max', label: '🚀 Máximo' },
              { id: 'bass', label: '🔊 Grave JBL' },
              { id: 'vocal', label: '🎤 Voz HD' },
            ] as { id: AudioSoundProfile['presetName']; label: string }[]
          ).map((pr) => (
            <button
              key={pr.id}
              onClick={() => applyPreset(pr.id)}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold border transition ${
                profile.presetName === pr.id
                  ? 'bg-cyan-500/30 border-cyan-400 text-white'
                  : 'bg-white/[0.05] border-white/10 text-purple-200 hover:bg-white/10'
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>

        {/* 3-Band EQ Sliders */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              Personalizar Equalizador (EQ)
            </span>
            <button
              onClick={() => applyPreset('normal')}
              className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Resetar
            </button>
          </div>
          {[
            { label: 'Graves (Sub / Phonk)', key: 'bassDb' as const, min: -6, max: 10, color: 'accent-pink-500' },
            { label: 'Médios (Voz / Guitarra)', key: 'midDb' as const, min: -6, max: 8, color: 'accent-purple-400' },
            { label: 'Agudos (Brilho HD)', key: 'trebleDb' as const, min: -6, max: 8, color: 'accent-cyan-400' },
          ].map((band) => (
            <div key={band.key} className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-bold text-purple-100">
                <span>{band.label}</span>
                <span className="font-mono text-cyan-300">
                  {profile[band.key] > 0 ? `+${profile[band.key]}` : profile[band.key]} dB
                </span>
              </div>
              <input
                type="range"
                min={band.min}
                max={band.max}
                step={1}
                value={profile[band.key]}
                onChange={(e) =>
                  onChangeProfile({ ...profile, [band.key]: Number(e.target.value), presetName: 'custom' })
                }
                className={`w-full ${band.color} cursor-pointer`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

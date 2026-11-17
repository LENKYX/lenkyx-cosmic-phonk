import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Sparkles,
  Volume1,
  Film,
  X,
  Upload,
  Trash2,
  Check,
  LayoutGrid,
  Waves,
  Zap,
} from 'lucide-react';
import { Track } from '../types';
import { lenkyxAudioEngine } from '../utils/audioBoostEngine';

interface GenreVisualProfile {
  label: string;
  palette: { c1: string; c2: string; amp: number; freq: number; speed: number; offset: number; alpha: number }[];
  sharpness: number;
  kickPower: number;
  defaultBpm: number;
}

function detectGenreVisualProfile(track: Track | null): GenreVisualProfile {
  const hay = `${track?.genre || ''} ${track?.album || ''} ${track?.title || ''} ${track?.artist || ''}`.toLowerCase();
  if (/(rock|metal|metallica|queen|linkin|nirvana|legiao|legião|ac\/dc|iron|guitar)/.test(hay)) {
    return {
      label: 'Rock / Metal · Guitarra Elétrica',
      defaultBpm: track?.bpm || 136,
      sharpness: 1.45,
      kickPower: 1.25,
      palette: [
        { c1: '#ef4444', c2: '#f97316', amp: 0.22, freq: 3.4, speed: 1.6, offset: 0, alpha: 0.85 },
        { c1: '#a855f7', c2: '#ec4899', amp: 0.19, freq: 4.2, speed: -1.8, offset: 1.3, alpha: 0.85 },
        { c1: '#fbbf24', c2: '#ef4444', amp: 0.15, freq: 5.1, speed: 2.1, offset: 2.4, alpha: 0.78 },
        { c1: '#38bdf8', c2: '#8b5cf6', amp: 0.17, freq: 2.6, speed: -1.2, offset: 3.8, alpha: 0.72 },
        { c1: '#f43f5e', c2: '#facc15', amp: 0.13, freq: 6.0, speed: 2.4, offset: 4.9, alpha: 0.7 },
      ],
    };
  }
  if (/(sertanejo|sofrencia|sofrência|marilia|henrique|gusttavo|jorge|luan|pagode|mpb|pop)/.test(hay)) {
    return {
      label: 'Melódico / Sertanejo & Pop',
      defaultBpm: track?.bpm || 108,
      sharpness: 0.82,
      kickPower: 0.92,
      palette: [
        { c1: '#fbbf24', c2: '#f472b6', amp: 0.16, freq: 1.9, speed: 0.9, offset: 0, alpha: 0.82 },
        { c1: '#34d399', c2: '#22d3ee', amp: 0.18, freq: 2.3, speed: -1.05, offset: 1.4, alpha: 0.78 },
        { c1: '#ec4899', c2: '#a855f7', amp: 0.14, freq: 2.9, speed: 1.25, offset: 2.6, alpha: 0.75 },
        { c1: '#f59e0b', c2: '#38bdf8', amp: 0.12, freq: 1.6, speed: -0.8, offset: 3.9, alpha: 0.68 },
        { c1: '#c084fc', c2: '#f472b6', amp: 0.15, freq: 2.5, speed: 1.1, offset: 4.7, alpha: 0.74 },
      ],
    };
  }
  if (/(espaco|espaço|galaxia|galáxia|nasa|voyager|alien|ambient|cosmic)/.test(hay) && !/phonk/.test(hay)) {
    return {
      label: 'Galáxia & Frequência Cósmica',
      defaultBpm: track?.bpm || 96,
      sharpness: 0.75,
      kickPower: 0.85,
      palette: [
        { c1: '#22d3ee', c2: '#6366f1', amp: 0.15, freq: 1.5, speed: 0.65, offset: 0, alpha: 0.85 },
        { c1: '#34d399', c2: '#06b6d4', amp: 0.17, freq: 2.1, speed: -0.75, offset: 1.5, alpha: 0.78 },
        { c1: '#a855f7', c2: '#38bdf8', amp: 0.14, freq: 2.6, speed: 0.9, offset: 2.8, alpha: 0.75 },
        { c1: '#818cf8', c2: '#c084fc', amp: 0.12, freq: 1.8, speed: -0.55, offset: 4.1, alpha: 0.68 },
        { c1: '#2dd4bf', c2: '#ec4899', amp: 0.11, freq: 3.0, speed: 0.85, offset: 5.0, alpha: 0.65 },
      ],
    };
  }
  if (/(eletron|house|alok|vintage|edm|techno|dance)/.test(hay)) {
    return {
      label: 'Eletrônica / Club Laser',
      defaultBpm: track?.bpm || 126,
      sharpness: 1.2,
      kickPower: 1.3,
      palette: [
        { c1: '#06b6d4', c2: '#3b82f6', amp: 0.18, freq: 2.6, speed: 1.4, offset: 0, alpha: 0.88 },
        { c1: '#ec4899', c2: '#22d3ee', amp: 0.21, freq: 3.2, speed: -1.6, offset: 1.1, alpha: 0.88 },
        { c1: '#a855f7', c2: '#f472b6', amp: 0.16, freq: 4.0, speed: 1.9, offset: 2.3, alpha: 0.8 },
        { c1: '#38bdf8', c2: '#34d399', amp: 0.14, freq: 2.2, speed: -1.2, offset: 3.5, alpha: 0.75 },
        { c1: '#f472b6', c2: '#6366f1', amp: 0.17, freq: 3.5, speed: 1.5, offset: 4.6, alpha: 0.82 },
      ],
    };
  }
  // Default: Cosmic Phonk / Drift / Bass
  return {
    label: 'Cosmic Phonk · Grave Forte',
    defaultBpm: track?.bpm || 138,
    sharpness: 1.32,
    kickPower: 1.35,
    palette: [
      { c1: '#06b6d4', c2: '#3b82f6', amp: 0.18, freq: 2.3, speed: 1.15, offset: 0, alpha: 0.82 },
      { c1: '#ec4899', c2: '#a855f7', amp: 0.23, freq: 3.0, speed: -1.45, offset: 1.2, alpha: 0.9 },
      { c1: '#22d3ee', c2: '#f472b6', amp: 0.15, freq: 3.9, speed: 1.75, offset: 2.5, alpha: 0.82 },
      { c1: '#fbbf24', c2: '#ec4899', amp: 0.12, freq: 4.6, speed: -1.0, offset: 3.7, alpha: 0.72 },
      { c1: '#c084fc', c2: '#38bdf8', amp: 0.19, freq: 1.9, speed: 1.3, offset: 4.8, alpha: 0.9 },
    ],
  };
}

export type ExperienceMode = 'audio' | 'screensaver' | 'video';
export type VisualizerStyle = 'waves3d' | 'cosmic_portal' | 'jbl_spectrum' | 'gallery_waves';

export interface CustomScreensaverImage {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  isCustom?: boolean;
}

const STORAGE_CUSTOM_IMAGES_KEY = 'lenkyx_screensaver_custom_images_v1';
const STORAGE_PREFS_KEY = 'lenkyx_screensaver_prefs_v1';

const PRESET_COVERS: { id: string; label: string; url: string }[] = [
  { id: 'preset-album', label: 'Capa Oficial Cosmic Phonk', url: '/covers/album-official.jpg' },
  { id: 'preset-avatar', label: 'LENKYX Portal', url: '/covers/avatar.jpg' },
  { id: 'preset-01', label: 'Faixa 01 · Nebulosa', url: '/covers/track-01.jpg' },
  { id: 'preset-02', label: 'Faixa 02 · Drift', url: '/covers/track-02.jpg' },
  { id: 'preset-05', label: 'Faixa 05 · Órbita', url: '/covers/track-05.jpg' },
  { id: 'preset-09', label: 'Faixa 09 · Supernova', url: '/covers/track-09.jpg' },
  { id: 'preset-12', label: 'Faixa 12 · Galáxia', url: '/covers/track-12.jpg' },
  { id: 'preset-16', label: 'Faixa 16 · Eclipse', url: '/covers/track-16.jpg' },
  { id: 'preset-20', label: 'Faixa 20 · Infinito', url: '/covers/track-20.jpg' },
];

interface ScreensaverPrefs {
  imageSource: 'none' | 'current_cover' | 'lenkyx_gallery' | 'custom_mix';
  enabledPresetIds: string[];
  style: VisualizerStyle;
  imageOpacity: number;
  slideSeconds: number;
}

const DEFAULT_PREFS: ScreensaverPrefs = {
  imageSource: 'current_cover',
  enabledPresetIds: ['preset-album', 'preset-01', 'preset-05', 'preset-12'],
  style: 'waves3d',
  imageOpacity: 0.42,
  slideSeconds: 10,
};

function loadPrefs(): ScreensaverPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function loadCustomImages(): CustomScreensaverImage[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_IMAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.onload = () => {
        const maxSide = 1440;
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Props {
  open: boolean;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  autoOnPlay: boolean;
  turboEnabled?: boolean;
  audioElement: HTMLAudioElement | null;
  hasVideo: boolean;
  onToggleAutoOnPlay: () => void;
  onOpenSoundBoost?: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (t: number) => void;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onSelectMode: (mode: ExperienceMode) => void;
  onClose: () => void;
}

export const CosmicScreensaver3D: React.FC<Props> = ({
  open,
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  autoOnPlay,
  turboEnabled,
  audioElement,
  hasVideo,
  onToggleAutoOnPlay,
  onOpenSoundBoost,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolume,
  onToggleMute,
  onSelectMode,
  onClose,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const genreProfile = useMemo(() => detectGenreVisualProfile(track), [track]);

  const [prefs, setPrefs] = useState<ScreensaverPrefs>(() => loadPrefs());
  const [customImages, setCustomImages] = useState<CustomScreensaverImage[]>(() => loadCustomImages());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const hudTimerRef = useRef<number | null>(null);

  // Persist prefs & custom images
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore quota
    }
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_IMAGES_KEY, JSON.stringify(customImages));
    } catch {
      // ignore quota
    }
  }, [customImages]);

  // Ensure shared studio Web Audio engine is attached when open
  useEffect(() => {
    if (!open || !audioElement) return;
    lenkyxAudioEngine.attachAudioElement(audioElement);
  }, [open, audioElement, track?.id]);

  // Build active slideshow image list
  const activeImages = useMemo<string[]>(() => {
    if (prefs.imageSource === 'none') return [];
    if (prefs.imageSource === 'current_cover') {
      return [track?.coverUrl || '/covers/album-official.jpg'];
    }
    if (prefs.imageSource === 'lenkyx_gallery') {
      const selected = PRESET_COVERS.filter((p) => prefs.enabledPresetIds.includes(p.id)).map((p) => p.url);
      return selected.length > 0 ? selected : [track?.coverUrl || '/covers/album-official.jpg'];
    }
    // custom_mix
    const customOn = customImages.filter((c) => c.enabled).map((c) => c.url);
    const presetsOn = PRESET_COVERS.filter((p) => prefs.enabledPresetIds.includes(p.id)).map((p) => p.url);
    const merged = [...customOn, ...presetsOn];
    return merged.length > 0 ? merged : [track?.coverUrl || '/covers/album-official.jpg'];
  }, [prefs.imageSource, prefs.enabledPresetIds, customImages, track?.coverUrl]);

  // Slideshow timer
  useEffect(() => {
    if (!open || activeImages.length <= 1 || prefs.slideSeconds <= 0) {
      setSlideIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % activeImages.length);
    }, prefs.slideSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [open, activeImages.length, prefs.slideSeconds]);

  // Screensaver HUD auto-hide when playing
  const bumpHud = () => {
    setHudVisible(true);
    if (hudTimerRef.current) window.clearTimeout(hudTimerRef.current);
    if (isPlaying && !drawerOpen) {
      hudTimerRef.current = window.setTimeout(() => {
        setHudVisible(false);
      }, 4500);
    }
  };

  useEffect(() => {
    if (!open) return;
    bumpHud();
    return () => {
      if (hudTimerRef.current) window.clearTimeout(hudTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isPlaying, drawerOpen]);

  // Fullscreen listener
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const el = rootRef.current || document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // APK WebViews stay full-viewport even without native Fullscreen API
    }
  };

  // === 60 FPS 3D NEON SOUNDWAVE + MIRROR REFLECTION + COSMIC PARTICLES CANVAS ===
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    const bpm = genreProfile.defaultBpm;

    // Cosmic star particles
    const stars = Array.from({ length: 130 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.68,
      z: 0.3 + Math.random() * 1.4,
      r: 0.6 + Math.random() * 1.9,
      hue: Math.random() > 0.5 ? genreProfile.palette[0].c1 : genreProfile.palette[1].c1,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    };
    resize();
    window.addEventListener('resize', resize);

    const sampleEnergy = (
      i: number,
      total: number,
      t: number,
      liveSpectrum: Uint8Array | null,
      liveBass: number
    ): number => {
      if (liveSpectrum && isPlaying && audioElement && !audioElement.paused) {
        const idx = Math.min(liveSpectrum.length - 1, Math.floor((i / total) * (liveSpectrum.length * 0.78)));
        const v = liveSpectrum[idx] / 255;
        if (v > 0.01) return Math.min(1.15, v * (0.95 + liveBass * 0.35));
      }
      if (!isPlaying) {
        return 0.08 + 0.04 * Math.sin(t * 1.5 + i * 0.25);
      }
      // Genre + BPM-locked rhythmic beat motion (syncs with YouTube, Audius & live streams!)
      const beatHz = bpm / 60;
      const beatPulse =
        Math.pow(Math.abs(Math.sin(t * Math.PI * beatHz * 0.5)), 2.0 * genreProfile.sharpness) *
        genreProfile.kickPower;
      const waveA = Math.sin(i * 0.24 * genreProfile.sharpness + t * 3.1) * 0.3;
      const waveB = Math.cos(i * 0.14 - t * 2.2) * 0.24;
      const waveC = Math.sin(i * 0.45 + t * 4.6) * 0.16;
      return Math.max(0.08, Math.min(1.1, 0.32 + beatPulse * 0.48 + waveA + waveB + waveC));
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { bass: liveBass, spectrum: liveSpectrum } = lenkyxAudioEngine.sampleBands();
      const beatStep = isPlaying ? 0.026 + (bpm / 128) * 0.008 + liveBass * 0.014 : 0.008;
      phase += beatStep;

      ctx.clearRect(0, 0, w, h);

      // Subtle dark radial vignette so neon ribbons pop over any photo
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.05, w * 0.5, h * 0.5, w * 0.72);
      bgGrad.addColorStop(0, 'rgba(24, 6, 56, 0.32)');
      bgGrad.addColorStop(0.6, 'rgba(8, 2, 24, 0.58)');
      bgGrad.addColorStop(1, 'rgba(2, 0, 10, 0.85)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Floating Cosmic Stars accelerating on the beat
      for (const s of stars) {
        s.x -= (isPlaying ? 0.0005 + liveBass * 0.0009 : 0.00012) * s.z;
        if (s.x < 0) s.x = 1;
        const pulse = isPlaying ? 0.55 + 0.45 * Math.sin(phase * 3 + s.x * 20) : 0.4;
        ctx.fillStyle = s.hue;
        ctx.globalAlpha = pulse * 0.78;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, (s.r + liveBass * 0.9) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const horizonY = prefs.style === 'gallery_waves' ? h * 0.78 : h * 0.54;
      const bass = Math.max(liveBass, sampleEnergy(2, 64, phase, liveSpectrum, liveBass));

      if (prefs.style === 'waves3d' || prefs.style === 'gallery_waves') {
        // Perspective cosmic floor grid (gives true 3D depth like image-33.png)
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.lineWidth = 1 * dpr;
        const lines = 12;
        for (let i = -lines; i <= lines; i++) {
          ctx.beginPath();
          ctx.moveTo(w * 0.5 + i * w * 0.035, horizonY);
          ctx.lineTo(w * 0.5 + i * w * 0.18, h);
          ctx.stroke();
        }
        for (let row = 1; row <= 6; row++) {
          const y = horizonY + Math.pow(row / 6, 1.7) * (h - horizonY);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.restore();

        // 5 Genre-Synced 3D Neon Mesh Ribbons + Mirror Reflection
        const ribbonConfigs = genreProfile.palette;

        const activeRibbons = prefs.style === 'gallery_waves' ? ribbonConfigs.slice(0, 3) : ribbonConfigs;
        const steps = 96;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (const rb of activeRibbons) {
          const grad = ctx.createLinearGradient(0, 0, w, 0);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.15, rb.c1);
          grad.addColorStop(0.5, rb.c2);
          grad.addColorStop(0.85, rb.c1);
          grad.addColorStop(1, 'rgba(0,0,0,0)');

          // Upper main 3D ribbon + subtle glowing fill
          const pts: { x: number; y: number }[] = [];
          for (let i = 0; i <= steps; i++) {
            const p = i / steps;
            const envelope = Math.sin(p * Math.PI); // taper edges smoothly
            const e = sampleEnergy(i, steps, phase + rb.offset * 0.2, liveSpectrum, liveBass);
            const wave =
              Math.sin(p * Math.PI * rb.freq + phase * rb.speed + rb.offset) *
              (0.45 + e * 0.95) *
              envelope;
            const y = horizonY - Math.abs(wave) * h * rb.amp - e * h * 0.04 * envelope;
            pts.push({ x: p * w, y });
          }

          // Mesh fill
          const fillGrad = ctx.createLinearGradient(0, horizonY - h * 0.28, 0, horizonY);
          fillGrad.addColorStop(0, rb.c2 + '55');
          fillGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = fillGrad;
          ctx.beginPath();
          ctx.moveTo(0, horizonY);
          for (const pt of pts) ctx.lineTo(pt.x, pt.y);
          ctx.lineTo(w, horizonY);
          ctx.closePath();
          ctx.fill();

          // Glowing Neon Crest
          ctx.strokeStyle = grad;
          ctx.lineWidth = (2.4 + bass * 1.6) * dpr;
          ctx.shadowColor = rb.c2;
          ctx.shadowBlur = 18 * dpr;
          ctx.globalAlpha = rb.alpha;
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
            else ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.stroke();

          // Glossy Water / Glass Mirror Reflection below horizon!
          ctx.globalAlpha = rb.alpha * 0.34;
          ctx.shadowBlur = 10 * dpr;
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const dist = horizonY - pts[i].y;
            const ry = horizonY + dist * 0.62 + Math.sin(phase * 3 + i * 0.4) * 2 * dpr;
            if (i === 0) ctx.moveTo(pts[i].x, ry);
            else ctx.lineTo(pts[i].x, ry);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (prefs.style === 'cosmic_portal') {
        // Concentric 3D Cosmic Portal Rings + Radial Soundwaves
        const cx = w * 0.5;
        const cy = h * 0.48;
        const baseR = Math.min(w, h) * 0.18;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let ring = 0; ring < 5; ring++) {
          const pts = 84;
          const ringR = baseR * (0.7 + ring * 0.32 + bass * 0.14);
          const rc = genreProfile.palette[ring % genreProfile.palette.length];
          ctx.strokeStyle = rc.c1;
          ctx.lineWidth = (2.2 + bass * 1.4) * dpr;
          ctx.shadowColor = rc.c2;
          ctx.shadowBlur = 16 * dpr;
          ctx.globalAlpha = 0.85 - ring * 0.1;
          ctx.beginPath();
          for (let i = 0; i <= pts; i++) {
            const a = (i / pts) * Math.PI * 2;
            const e = sampleEnergy(i, pts, phase + ring * 0.4, liveSpectrum, liveBass);
            const rad =
              ringR +
              e * baseR * 0.45 * genreProfile.kickPower * Math.sin(a * 6 + phase * (ring % 2 === 0 ? 2 : -2));
            const x = cx + Math.cos(a) * rad * (1 + ring * 0.04);
            const y = cy + Math.sin(a) * rad * (0.72 + Math.sin(phase * 0.7) * 0.12);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      } else if (prefs.style === 'jbl_spectrum') {
        // 3D Symmetrical JBL PartyBox Spectrum Bars + Reflection
        const bars = 48;
        const usableW = w * 0.82;
        const startX = (w - usableW) * 0.5;
        const step = usableW / bars;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < bars; i++) {
          const e = sampleEnergy(i, bars, phase, liveSpectrum, liveBass);
          const bh = Math.max(8 * dpr, e * h * 0.34 * genreProfile.kickPower);
          const x = startX + i * step + step * 0.15;
          const bw = Math.max(3 * dpr, step * 0.7);
          const p0 = genreProfile.palette[0];
          const p1 = genreProfile.palette[1];
          const g = ctx.createLinearGradient(0, horizonY - bh, 0, horizonY);
          g.addColorStop(0, p0.c1);
          g.addColorStop(0.5, p1.c2);
          g.addColorStop(1, p1.c1);
          ctx.fillStyle = g;
          ctx.shadowColor = i % 2 === 0 ? p0.c1 : p1.c1;
          ctx.shadowBlur = 14 * dpr;
          ctx.globalAlpha = 0.9;
          ctx.fillRect(x, horizonY - bh, bw, bh);

          // Mirror reflection
          ctx.globalAlpha = 0.25;
          ctx.fillRect(x, horizonY + 3 * dpr, bw, bh * 0.5);
        }
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [open, isPlaying, prefs.style, genreProfile, audioElement]);

  if (!open) return null;

  const currentImg = activeImages.length > 0 ? activeImages[slideIndex % activeImages.length] : null;
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const added: CustomScreensaverImage[] = [];
    for (const f of files.slice(0, 8)) {
      try {
        const url = await compressImageToDataUrl(f);
        added.push({
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: f.name.replace(/\.[^.]+$/, '').slice(0, 28) || 'Minha Foto',
          url,
          enabled: true,
          isCustom: true,
        });
      } catch {
        // skip unreadable image
      }
    }
    if (added.length > 0) {
      setCustomImages((prev) => [...added, ...prev].slice(0, 16));
      setPrefs((p) => ({ ...p, imageSource: 'custom_mix' }));
      setSlideIndex(0);
    }
    e.target.value = '';
  };

  const togglePreset = (id: string) => {
    setPrefs((p) => {
      const exists = p.enabledPresetIds.includes(id);
      const next = exists ? p.enabledPresetIds.filter((x) => x !== id) : [...p.enabledPresetIds, id];
      return { ...p, enabledPresetIds: next };
    });
  };

  return createPortal(
    <div
      ref={rootRef}
      onMouseMove={bumpHud}
      onTouchStart={bumpHud}
      onClick={bumpHud}
      className="fixed inset-0 z-[9990] bg-[#03000a] text-white overflow-hidden select-none animate-fade-in"
    >
      {/* BACKGROUND CHOSEN IMAGE / SLIDESHOW LAYER */}
      {currentImg && (
        <img
          key={currentImg}
          src={currentImg}
          alt={track?.title || 'Cosmic Phonk Screensaver'}
          style={{ opacity: prefs.imageOpacity }}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
            isPlaying ? 'scale-105' : 'scale-100'
          }`}
        />
      )}

      {/* 3D NEON SOUNDWAVE + COSMIC PARTICLES CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* FLOATING MINIMAL SONG BADGE (ALWAYS SUBTLY VISIBLE EVEN WHEN HUD HIDES) */}
      <div
        className={`absolute left-4 sm:left-8 transition-all duration-500 pointer-events-none ${
          hudVisible ? 'bottom-36 sm:bottom-32 opacity-0' : 'bottom-6 opacity-85'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10">
          <img
            src={track?.coverUrl || '/covers/album-official.jpg'}
            alt={track?.title || ''}
            className={`w-10 h-10 rounded-xl object-cover border border-cyan-400/50 ${
              isPlaying ? 'animate-pulse' : ''
            }`}
          />
          <div className="min-w-0">
            <div className="text-xs font-black text-white truncate max-w-[240px]">
              {track?.title || 'LENKYX Cosmic Phonk'}
            </div>
            <div className="text-[10px] font-bold text-cyan-300 truncate max-w-[240px]">
              {track?.artist || 'Modo Protetor de Tela 3D'} · Toque para controles
            </div>
          </div>
        </div>
      </div>

      {/* TOP BAR (AUTO-HIDES LIKE REAL SCREENSAVER) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 inset-x-0 z-20 p-3 sm:p-5 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-all duration-500 ${
          hudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={track?.coverUrl || '/covers/album-official.jpg'}
            alt={track?.title || 'LENKYX'}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.45)] shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-pink-400" />
              Protetor de Tela 3D · LENKYX Cosmic Phonk
            </div>
            <div className="text-sm sm:text-base font-black text-white truncate max-w-[220px] sm:max-w-md">
              {track?.title || 'Escolha uma música para tocar'}
            </div>
            <div className="text-[11px] text-purple-200/80 truncate flex items-center gap-2">
              <span className="truncate">{track?.artist || 'LENKYX'}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 border border-cyan-400/35 text-[9px] font-bold text-cyan-200 shrink-0">
                ⚡ {genreProfile.label} · {genreProfile.defaultBpm} BPM
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={onToggleAutoOnPlay}
            className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold border transition flex items-center gap-1.5 ${
              autoOnPlay
                ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200'
                : 'bg-white/10 border-white/15 text-purple-200 hover:bg-white/20'
            }`}
            title="Ativar automaticamente este Protetor 3D sempre que uma música começar"
          >
            <Waves className="w-3.5 h-3.5" />
            <span>{autoOnPlay ? 'Auto ao Tocar: ON' : 'Auto ao Tocar: OFF'}</span>
          </button>

          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold border transition flex items-center gap-1.5 ${
              drawerOpen
                ? 'bg-pink-500 text-white border-pink-300'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-300" />
            <span>Escolher Imagens & Efeitos</span>
          </button>

          <button
            onClick={() => void toggleFullscreen()}
            className="px-3 py-1.5 rounded-full bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-[11px] font-extrabold flex items-center gap-1"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-pink-600 text-white text-[11px] font-black flex items-center gap-1 transition"
            title="Voltar para os Menus"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Mostrar Menus</span>
          </button>
        </div>
      </div>

      {/* IMAGE & VISUALIZER CUSTOMIZER DRAWER */}
      {drawerOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 sm:right-5 top-20 z-30 w-[calc(100vw-1.5rem)] max-w-md max-h-[68vh] overflow-y-auto rounded-3xl bg-[#0a0418]/95 backdrop-blur-2xl border border-cyan-400/35 p-4 space-y-4 shadow-[0_0_50px_rgba(34,211,238,0.28)]"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" /> Personalizar Protetor de Tela 3D
            </h3>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Effect Style */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              1. Estilo do Efeito Visual 3D
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'waves3d', label: '🌊 Ondas Neon 3D' },
                  { id: 'cosmic_portal', label: '🪐 Portal Espacial' },
                  { id: 'jbl_spectrum', label: '🔊 Espectro JBL 3D' },
                  { id: 'gallery_waves', label: '🖼️ Fotos + Ondas' },
                ] as { id: VisualizerStyle; label: string }[]
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setPrefs((p) => ({ ...p, style: st.id }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition ${
                    prefs.style === st.id
                      ? 'bg-gradient-to-r from-pink-500/40 to-cyan-500/40 border-cyan-400 text-white'
                      : 'bg-white/[0.05] border-white/10 text-purple-200 hover:bg-white/10'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Image Source */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              2. Imagens ao Fundo Durante a Música
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'none', label: '🌌 Só Efeito 3D (Sem Foto)' },
                  { id: 'current_cover', label: '🎵 Capa da Música' },
                  { id: 'lenkyx_gallery', label: '💿 Capas LENKYX' },
                  { id: 'custom_mix', label: '📸 Minhas Fotos / Mix' },
                ] as { id: ScreensaverPrefs['imageSource']; label: string }[]
              ).map((srcOpt) => (
                <button
                  key={srcOpt.id}
                  onClick={() => setPrefs((p) => ({ ...p, imageSource: srcOpt.id }))}
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border text-left transition ${
                    prefs.imageSource === srcOpt.id
                      ? 'bg-pink-500/35 border-pink-400 text-white'
                      : 'bg-white/[0.05] border-white/10 text-purple-200 hover:bg-white/10'
                  }`}
                >
                  {srcOpt.label}
                </button>
              ))}
            </div>

            {/* Upload custom photos */}
            <label className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 hover:brightness-110 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow">
              <Upload className="w-4 h-4" />
              <span>Escolher Fotos do Celular / PC</span>
              <input type="file" accept="image/*" multiple onChange={handleUploadFiles} className="hidden" />
            </label>

            {/* User uploaded thumbnails */}
            {customImages.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-purple-200/80">
                  Suas Imagens Salvas ({customImages.filter((c) => c.enabled).length} ativas)
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {customImages.map((img) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square border border-white/15">
                      <img
                        src={img.url}
                        alt={img.label}
                        onClick={() =>
                          setCustomImages((prev) =>
                            prev.map((c) => (c.id === img.id ? { ...c, enabled: !c.enabled } : c))
                          )
                        }
                        className={`w-full h-full object-cover cursor-pointer transition ${
                          img.enabled ? 'opacity-100' : 'opacity-35 grayscale'
                        }`}
                      />
                      {img.enabled && (
                        <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center pointer-events-none">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                      <button
                        onClick={() => setCustomImages((prev) => prev.filter((c) => c.id !== img.id))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-rose-300 hover:text-white"
                        title="Remover foto"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preset gallery thumbnails */}
            {(prefs.imageSource === 'lenkyx_gallery' || prefs.imageSource === 'custom_mix') && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-purple-200/80">
                  Capas Cósmicas LENKYX (toque para marcar/desmarcar)
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_COVERS.map((p) => {
                    const on = prefs.enabledPresetIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePreset(p.id)}
                        className={`relative rounded-lg overflow-hidden aspect-square border transition ${
                          on ? 'border-cyan-400 ring-1 ring-cyan-400' : 'border-white/10 opacity-45'
                        }`}
                        title={p.label}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Opacity & Slideshow Speed */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
            <div>
              <div className="flex justify-between text-[10px] font-bold text-purple-200 mb-1">
                <span>Brilho da Imagem</span>
                <span>{Math.round(prefs.imageOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.95}
                step={0.05}
                value={prefs.imageOpacity}
                onChange={(e) => setPrefs((p) => ({ ...p, imageOpacity: Number(e.target.value) }))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-purple-200 mb-1">
                <span>Trocar Foto</span>
                <span>{prefs.slideSeconds === 0 ? 'Fixa' : `${prefs.slideSeconds}s`}</span>
              </div>
              <select
                value={prefs.slideSeconds}
                onChange={(e) => setPrefs((p) => ({ ...p, slideSeconds: Number(e.target.value) }))}
                className="w-full px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
              >
                <option value={6}>A cada 6s</option>
                <option value={10}>A cada 10s</option>
                <option value={20}>A cada 20s</option>
                <option value={0}>Imagem Fixa</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM FLOATING CONTROL DECK (AUTO-HIDES LIKE SCREENSAVER) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 z-20 p-3 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-500 ${
          hudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="max-w-4xl mx-auto rounded-3xl bg-black/55 backdrop-blur-xl border border-white/15 p-3 sm:p-4 space-y-3 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          {/* Seek Bar */}
          <div className="flex items-center gap-2.5 text-[11px] font-mono text-purple-200/80">
            <span className="w-10 text-right">{fmt(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 180}
              step={0.5}
              value={Math.min(currentTime, duration || 180)}
              onChange={(e) => onSeek(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #22d3ee ${pct}%, rgba(255,255,255,0.16) ${pct}%)`,
              }}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-pink-500"
            />
            <span className="w-10">{fmt(duration || track?.durationSec || 180)}</span>
          </div>

          {/* Main Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Mode Switcher: Só Som | Efeito 3D | Vídeo */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.07] border border-white/10">
              <button
                onClick={() => onSelectMode('audio')}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold text-purple-100 hover:bg-white/10 flex items-center gap-1"
                title="Voltar aos menus tocando somente o áudio"
              >
                <Volume1 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Só Som</span>
              </button>
              <button
                onClick={() => onSelectMode('screensaver')}
                className="px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-cyan-500 to-pink-500 text-white flex items-center gap-1 shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Efeito 3D</span>
              </button>
              {hasVideo && (
                <button
                  onClick={() => onSelectMode('video')}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold text-purple-100 hover:bg-white/10 flex items-center gap-1"
                  title="Assistir o clipe/vídeo da música"
                >
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  <span>Vídeo</span>
                </button>
              )}
            </div>

            {/* Transport */}
            <div className="flex items-center gap-3">
              <button
                onClick={onPrev}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="Música Anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={onTogglePlay}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:brightness-110 text-white flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.6)] transition"
                title={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button
                onClick={onNext}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="Próxima Música"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume + Optional Max Turbo EQ */}
            <div className="flex items-center gap-2">
              {onOpenSoundBoost && (
                <button
                  onClick={onOpenSoundBoost}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-black border flex items-center gap-1 transition ${
                    turboEnabled
                      ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-amber-200'
                  }`}
                  title="Volume Máximo Limpo + Equalizador (EQ)"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{turboEnabled ? 'Turbo ON' : 'Máximo / EQ'}</span>
                </button>
              )}
              <button
                onClick={onToggleMute}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-cyan-300"
                title={muted ? 'Ativar Som' : 'Silenciar'}
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={muted ? 0 : volume}
                onChange={(e) => onVolume(Number(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-purple-200 w-8">
                {Math.round((muted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

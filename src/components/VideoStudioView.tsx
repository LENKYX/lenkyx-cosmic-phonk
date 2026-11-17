import React, { useEffect, useRef, useState } from 'react';
import {
  Video,
  Play,
  Square,
  Download,
  Sparkles,
  Smartphone,
  Monitor,
  Disc3,
  BarChart3,
  Orbit,
  Film,
  Zap,
  Speaker,
  Tv,
  Upload,
} from 'lucide-react';
import { Track } from '../types';
import { downloadBlobReliable } from '../utils/androidBridge';

interface Props {
  tracks: Track[];
  initialTrack?: Track | null;
  onPauseCatalogPlayer: () => void;
  onToast: (msg: string) => void;
}

type FormatId = 'shorts_9_16' | 'youtube_16_9';
type StyleId = 'jbl_pulse' | 'glitch_vhs' | 'orbit' | 'lightning' | 'bars' | 'vinyl';

interface Star {
  x: number;
  y: number;
  z: number;
  hue: number;
}

export const VideoStudioView: React.FC<Props> = ({ tracks, initialTrack, onPauseCatalogPlayer, onToast }) => {
  const [customTrack, setCustomTrack] = useState<Track | null>(null);
  const allSelectableTracks = React.useMemo(() => {
    const base = customTrack ? [customTrack, ...tracks] : tracks;
    const seen = new Set<string>();
    return base.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return Boolean(t.audioUrl);
    });
  }, [tracks, customTrack]);

  const [selectedTrackId, setSelectedTrackId] = useState<string>(initialTrack?.id || tracks[0]?.id || '');
  const [format, setFormat] = useState<FormatId>('shorts_9_16');
  const [visualStyle, setVisualStyle] = useState<StyleId>('jbl_pulse');
  const [hookText, setHookText] = useState('AUMENTA O SOM NO MÁXIMO 🚀🔥');
  const [showCta, setShowCta] = useState(true);
  const [clipDuration, setClipDuration] = useState<number>(15);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recElapsed, setRecElapsed] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string>('');
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const coverImgRef = useRef<HTMLImageElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);

  const track = allSelectableTracks.find((t) => t.id === selectedTrackId) || allSelectableTracks[0];

  useEffect(() => {
    if (initialTrack?.id) {
      if (initialTrack.audioUrl) {
        setSelectedTrackId(initialTrack.id);
      } else {
        onToast('Esta faixa usa stream do YouTube; escolha uma música com áudio direto ou envie seu MP3/WAV!');
      }
    }
  }, [initialTrack, onToast]);

  useEffect(() => {
    starsRef.current = Array.from({ length: 110 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
      hue: Math.random() > 0.5 ? 320 : 195,
    }));
  }, []);

  useEffect(() => {
    if (!track) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = track.coverUrl || '/covers/album-official.jpg';
    img.onload = () => {
      coverImgRef.current = img;
    };
  }, [track]);

  const width = format === 'youtube_16_9' ? 1280 : 720;
  const height = format === 'youtube_16_9' ? 720 : 1280;

  const ensureAudioGraph = () => {
    if (!audioElRef.current) {
      const el = new Audio();
      el.crossOrigin = 'anonymous';
      el.loop = true;
      audioElRef.current = el;
    }
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const src = ctx.createMediaElementSource(audioElRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      const dest = ctx.createMediaStreamDestination();

      src.connect(analyser);
      analyser.connect(ctx.destination);
      analyser.connect(dest);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      streamDestRef.current = dest;
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !track) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const freqData = new Uint8Array(128);
    let tPhase = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const isPortrait = h > w;
      tPhase += 0.032;

      let bass = 0.14;
      let mid = 0.12;
      if (analyserRef.current && (isPreviewing || isRecording)) {
        analyserRef.current.getByteFrequencyData(freqData);
        let bSum = 0;
        for (let i = 0; i < 10; i++) bSum += freqData[i];
        bass = bSum / (10 * 255);
        let mSum = 0;
        for (let i = 10; i < 40; i++) mSum += freqData[i];
        mid = mSum / (30 * 255);
      } else {
        for (let i = 0; i < 128; i++) {
          freqData[i] = Math.floor((Math.sin(tPhase * 2.2 + i * 0.25) * 0.5 + 0.5) * 105 + 30);
        }
        bass = (Math.sin(tPhase * 2.5) * 0.5 + 0.5) * 0.36;
        mid = 0.24;
      }

      // Glitch camera shake on strong bass
      const shakeX = visualStyle === 'glitch_vhs' && bass > 0.45 ? (Math.random() - 0.5) * 14 * bass : 0;
      const shakeY = visualStyle === 'glitch_vhs' && bass > 0.45 ? (Math.random() - 0.5) * 10 * bass : 0;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      ctx.fillStyle = '#04010c';
      ctx.fillRect(-20, -20, w + 40, h + 40);

      const img = coverImgRef.current;
      if (img) {
        ctx.save();
        ctx.globalAlpha = 0.28 + bass * 0.16;
        ctx.filter = 'blur(26px)';
        const scale = Math.max(w / img.width, h / img.height) * (1.08 + bass * 0.08);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        ctx.restore();
      }

      const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.78);
      vig.addColorStop(0, 'rgba(12, 4, 30, 0.2)');
      vig.addColorStop(1, 'rgba(4, 1, 12, 0.9)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // Starfield
      const speed = 0.006 + bass * 0.04;
      starsRef.current.forEach((s) => {
        s.z -= speed;
        if (s.z <= 0.02) {
          s.x = (Math.random() - 0.5) * 2;
          s.y = (Math.random() - 0.5) * 2;
          s.z = 1;
        }
        const sx = w / 2 + (s.x / s.z) * (w * 0.55);
        const sy = h / 2 + (s.y / s.z) * (h * 0.55);
        const r = Math.max(0.8, (1 - s.z) * (3.8 + bass * 4.5));
        if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) {
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue}, 95%, 72%, ${0.35 + (1 - s.z) * 0.65})`;
          ctx.fill();
        }
      });

      const centerY = isPortrait ? h * 0.42 : h * 0.45;
      const centerX = w / 2;

      if (visualStyle === 'jbl_pulse') {
        // JBL PartyBox / Pulse 5 Reactive LED Rings
        const baseR = (isPortrait ? 148 : 132) + bass * 26;
        for (let ring = 3; ring >= 1; ring--) {
          const rr = baseR + ring * (24 + bass * 26);
          const hue = (tPhase * 45 + ring * 85) % 360;
          ctx.beginPath();
          ctx.arc(centerX, centerY, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue}, 95%, 62%, ${0.28 + bass * 0.45})`;
          ctx.lineWidth = 6 + bass * 8;
          ctx.stroke();
        }

        // Edge JBL Neon Tube Light
        const edgeHue = (tPhase * 55) % 360;
        ctx.strokeStyle = `hsla(${edgeHue}, 98%, 60%, ${0.55 + bass * 0.45})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(14, 14, w - 28, h - 28);

        // Circular cover
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
        ctx.clip();
        if (img) ctx.drawImage(img, centerX - baseR, centerY - baseR, baseR * 2, baseR * 2);
        ctx.restore();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
        ctx.stroke();
      } else if (visualStyle === 'glitch_vhs') {
        const size = (isPortrait ? 340 : 270) + bass * 22;
        const x0 = centerX - size / 2;
        const y0 = centerY - size / 2;
        const split = 8 + bass * 24;

        // Chromatic RGB ghost layers
        if (img) {
          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.drawImage(img, x0 - split, y0, size, size);
          ctx.fillStyle = 'rgba(255, 0, 128, 0.35)';
          ctx.fillRect(x0 - split, y0, size, size);

          ctx.drawImage(img, x0 + split, y0, size, size);
          ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
          ctx.fillRect(x0 + split, y0, size, size);
          ctx.restore();

          ctx.drawImage(img, x0, y0, size, size);
        }
        ctx.strokeStyle = '#ff2ea6';
        ctx.lineWidth = 4;
        ctx.strokeRect(x0, y0, size, size);

        // VHS Scanlines
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let sy = 0; sy < h; sy += 6) {
          ctx.fillRect(0, sy, w, 2);
        }
      } else if (visualStyle === 'lightning') {
        const baseR = (isPortrait ? 145 : 130) + bass * 22;
        // Cosmic Lightning Bolts radiating outward
        const bolts = 14;
        for (let b = 0; b < bolts; b++) {
          const ang = (b / bolts) * Math.PI * 2 + tPhase * 0.4;
          const v = freqData[(b * 4) % 64] / 255;
          ctx.beginPath();
          let rx = centerX + Math.cos(ang) * baseR;
          let ry = centerY + Math.sin(ang) * baseR;
          ctx.moveTo(rx, ry);
          const steps = 4;
          for (let st = 1; st <= steps; st++) {
            const dist = baseR + st * (22 + v * 36);
            const jitter = (Math.random() - 0.5) * 0.25;
            rx = centerX + Math.cos(ang + jitter) * dist;
            ry = centerY + Math.sin(ang + jitter) * dist;
            ctx.lineTo(rx, ry);
          }
          ctx.strokeStyle = b % 2 === 0 ? '#38bdf8' : '#ff2ea6';
          ctx.lineWidth = 2.5 + bass * 3;
          ctx.stroke();
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
        ctx.clip();
        if (img) ctx.drawImage(img, centerX - baseR, centerY - baseR, baseR * 2, baseR * 2);
        ctx.restore();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
        ctx.stroke();
      } else if (visualStyle === 'orbit') {
        const baseR = (isPortrait ? 155 : 138) + bass * 24;
        const count = 72;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const v = freqData[i % 64] / 255;
          const barLen = 14 + v * (isPortrait ? 125 : 105);
          ctx.strokeStyle = i % 2 === 0 ? '#ff2ea6' : '#38bdf8';
          ctx.lineWidth = isPortrait ? 5.5 : 4.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * (baseR + 8), centerY + Math.sin(angle) * (baseR + 8));
          ctx.lineTo(
            centerX + Math.cos(angle) * (baseR + 8 + barLen),
            centerY + Math.sin(angle) * (baseR + 8 + barLen)
          );
          ctx.stroke();
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
        ctx.clip();
        if (img) ctx.drawImage(img, centerX - baseR, centerY - baseR, baseR * 2, baseR * 2);
        ctx.restore();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
        ctx.stroke();
      } else if (visualStyle === 'bars') {
        const cardSize = (isPortrait ? 320 : 250) + bass * 18;
        const cardY = isPortrait ? h * 0.2 : h * 0.15;
        ctx.save();
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 35 + bass * 30;
        if (img) ctx.drawImage(img, centerX - cardSize / 2, cardY, cardSize, cardSize);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(centerX - cardSize / 2, cardY, cardSize, cardSize);
        ctx.restore();

        const barAreaW = isPortrait ? w * 0.86 : w * 0.72;
        const startX = (w - barAreaW) / 2;
        const baseY = isPortrait ? h * 0.65 : h * 0.74;
        const bars = 44;
        const bw = barAreaW / bars;
        for (let i = 0; i < bars; i++) {
          const val = freqData[(i * 2) % 64] / 255;
          const bh = 10 + val * (isPortrait ? 150 : 120);
          const grad = ctx.createLinearGradient(0, baseY - bh, 0, baseY + bh * 0.35);
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(0.5, '#a855f7');
          grad.addColorStop(1, '#ff2ea6');
          ctx.fillStyle = grad;
          ctx.fillRect(startX + i * bw + 2, baseY - bh, bw - 4, bh);
        }
      } else {
        // Vinyl Drift
        const horizonY = isPortrait ? h * 0.64 : h * 0.68;
        ctx.save();
        ctx.strokeStyle = `rgba(236, 72, 153, ${0.35 + bass * 0.4})`;
        ctx.lineWidth = 2;
        for (let i = -8; i <= 8; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX + i * 25, horizonY);
          ctx.lineTo(centerX + i * 190, h);
          ctx.stroke();
        }
        ctx.restore();

        rotationRef.current += isPreviewing || isRecording ? 0.03 + bass * 0.03 : 0.008;
        const r = (isPortrait ? 175 : 150) + bass * 14;
        ctx.save();
        ctx.translate(centerX, isPortrait ? h * 0.4 : h * 0.42);
        ctx.rotate(rotationRef.current);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#090416';
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ff2ea6';
        ctx.stroke();
        const lr = r * 0.56;
        ctx.beginPath();
        ctx.arc(0, 0, lr, 0, Math.PI * 2);
        ctx.clip();
        if (img) ctx.drawImage(img, -lr, -lr, lr * 2, lr * 2);
        ctx.restore();
      }

      // Title + Hook Caption + CTA
      ctx.save();
      ctx.textAlign = 'center';
      const titleY = isPortrait ? h * 0.78 : h * 0.82;
      const gradTxt = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
      gradTxt.addColorStop(0, '#ff2ea6');
      gradTxt.addColorStop(0.5, '#ffffff');
      gradTxt.addColorStop(1, '#38bdf8');
      ctx.fillStyle = gradTxt;
      ctx.shadowColor = 'rgba(236, 72, 153, 0.8)';
      ctx.shadowBlur = 18;
      ctx.font = `900 ${isPortrait ? 40 : 38}px Orbitron, sans-serif`;
      ctx.fillText(track.title.slice(0, 26).toUpperCase(), w / 2, titleY);

      if (hookText.trim()) {
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#e0f2fe';
        ctx.font = `700 ${isPortrait ? 23 : 21}px Inter, sans-serif`;
        ctx.fillText(hookText.trim(), w / 2, titleY + (isPortrait ? 46 : 38));
      }

      if (showCta) {
        const pillY = isPortrait ? h - 100 : h - 46;
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
        const pillW = isPortrait ? 510 : 530;
        const pillH = 42;
        ctx.beginPath();
        ctx.roundRect(w / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 21);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 17px Inter, sans-serif';
        ctx.fillText(`🎧 ${track.artist.toUpperCase()} · FEITO NO APP LENKYX`, w / 2, pillY + 6);
      }
      ctx.restore();
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [track, format, visualStyle, hookText, showCta, isPreviewing, isRecording]);

  useEffect(() => {
    return () => {
      audioElRef.current?.pause();
    };
  }, []);

  const stopAll = () => {
    audioElRef.current?.pause();
    setIsPreviewing(false);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleLocalAudioPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();
    const objUrl = URL.createObjectURL(file);
    const localT: Track = {
      id: 'studio-local-' + Date.now(),
      number: 0,
      title: file.name.replace(/\.[^.]+$/, ''),
      emoji: '🎵',
      artist: 'Minha Música',
      album: 'Estúdio LENKYX',
      bpm: 128,
      key: 'Am',
      coverUrl: '/covers/album-official.jpg',
      audioUrl: objUrl,
      plays: 0,
      likes: 0,
      favorite: false,
      releaseBatch: 0,
      status: { suno: false, cover: false, app: true, youtube: false, distrokid: false },
      sunoPrompt: '',
      lyrics: '',
      createdAt: new Date().toISOString(),
    };
    setCustomTrack(localT);
    setSelectedTrackId(localT.id);
    onToast(`🎵 "${localT.title}" carregada no Estúdio de Vídeos!`);
  };

  const handleTogglePreview = async () => {
    if (!track) return;
    if (isPreviewing) {
      stopAll();
      return;
    }
    onPauseCatalogPlayer();
    ensureAudioGraph();
    const audio = audioElRef.current!;
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    await audio.play();
    setIsPreviewing(true);
  };

  const handleStartRenderVideo = async () => {
    if (!track || !canvasRef.current) return;
    onPauseCatalogPlayer();
    setExportedVideoUrl('');
    ensureAudioGraph();

    const audio = audioElRef.current!;
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    audio.loop = clipDuration > 0;
    await audio.play();

    const canvasStream = canvasRef.current.captureStream(30);
    const audioTracks = streamDestRef.current?.stream.getAudioTracks() || [];
    const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm';

    chunksRef.current = [];
    const rec = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 4_500_000 });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const suffix = format === 'youtube_16_9' ? 'YOUTUBE-16x9' : 'REELS-SHORTS-9x16';
      const cleanTitle = track.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setExportedVideoBlob(blob);
      setExportedVideoUrl(url);
      setExportedFilename(`LENKYX-${cleanTitle}-${suffix}.webm`);
      setIsRecording(false);
      setIsPreviewing(false);
      audio.pause();
      onToast('🎬 Vídeo pronto! Baixe e poste no TikTok, Reels, Status ou YouTube.');
    };

    recorderRef.current = rec;
    rec.start(250);
    setIsRecording(true);
    setIsPreviewing(true);
    setRecElapsed(0);

    const targetDur = clipDuration > 0 ? clipDuration : Math.ceil(audio.duration || 15);
    const startTs = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startTs) / 1000;
      setRecElapsed(elapsed);
      if (elapsed >= targetDur || (clipDuration === 0 && audio.ended)) {
        window.clearInterval(timer);
        if (rec.state !== 'inactive') rec.stop();
      }
    }, 150);

    rec.addEventListener('stop', () => window.clearInterval(timer), { once: true });
  };

  if (!track) return null;

  const targetSec = clipDuration > 0 ? clipDuration : 15;
  const pct = Math.min(100, (recElapsed / targetSec) * 100);

  return (
    <div className="space-y-5 pb-36 md:pb-28">
      <div className="rounded-3xl cosmic-card-3d p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-black text-white">
              CRIAR VÍDEOS <span className="neon-text">REELS, TIKTOK & YOUTUBE</span>
            </h1>
            <p className="text-xs text-purple-200/80">
              Use qualquer música do app ou do seu aparelho para fazer vídeos curtos e longos com efeitos modernos!
            </p>
          </div>
        </div>

        <label className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-cyan-200 flex items-center gap-1.5 cursor-pointer shrink-0 transition">
          <Upload className="w-3.5 h-3.5" /> Subir MP3 / WAV do Celular
          <input type="file" accept="audio/*" onChange={handleLocalAudioPick} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 rounded-3xl cosmic-card-3d p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">1. Escolha a Música</label>
            <select
              value={selectedTrackId}
              onChange={(e) => {
                stopAll();
                setSelectedTrackId(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-purple-500/35 text-sm font-bold text-white focus:outline-none focus:border-pink-500"
            >
              {allSelectableTracks.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0f0824]">
                  {t.emoji} {t.title} — {t.artist}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">2. Formato (Curto ou Longo)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('shorts_9_16')}
                disabled={isRecording}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                  format === 'shorts_9_16'
                    ? 'bg-pink-500/25 border-pink-400 text-white'
                    : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10'
                }`}
              >
                <Smartphone className="w-5 h-5 text-pink-400 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold">Reels / TikTok</div>
                  <div className="text-[10px] text-purple-300">Vertical 9:16</div>
                </div>
              </button>
              <button
                onClick={() => setFormat('youtube_16_9')}
                disabled={isRecording}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                  format === 'youtube_16_9'
                    ? 'bg-cyan-500/25 border-cyan-400 text-white'
                    : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10'
                }`}
              >
                <Monitor className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold">YouTube Longo</div>
                  <div className="text-[10px] text-purple-300">Horizontal 16:9</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">3. Efeitos Modernos Atuais</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['jbl_pulse', 'JBL Pulse', Speaker],
                  ['glitch_vhs', 'VHS Glitch', Tv],
                  ['lightning', 'Raios Neon', Zap],
                  ['orbit', '3D Espaço', Orbit],
                  ['bars', 'Cyber Som', BarChart3],
                  ['vinyl', 'Disco Vinil', Disc3],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setVisualStyle(id)}
                  className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                    visualStyle === id
                      ? 'bg-gradient-to-br from-pink-600/45 to-cyan-600/45 border-pink-400 text-white'
                      : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1">4. Texto / Legenda no Vídeo</label>
            <input
              type="text"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              placeholder="Ex: SENTE O GRAVE 🚀"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1">5. Duração</label>
              <select
                value={clipDuration}
                onChange={(e) => setClipDuration(Number(e.target.value))}
                disabled={isRecording}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/35 text-xs font-bold text-white"
              >
                <option value={15} className="bg-[#0f0824]">15 seg (Status / Shorts)</option>
                <option value={30} className="bg-[#0f0824]">30 seg (Reels / TikTok)</option>
                <option value={60} className="bg-[#0f0824]">60 seg (Shorts Longo)</option>
                <option value={0} className="bg-[#0f0824]">Música Completa (Longo)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-xs text-purple-100">
              <input
                type="checkbox"
                checked={showCta}
                onChange={(e) => setShowCta(e.target.checked)}
                className="accent-pink-500"
              />
              Mostrar assinatura
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleTogglePreview}
              disabled={isRecording}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              {isPreviewing && !isRecording ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              {isPreviewing && !isRecording ? 'Parar' : 'Testar Preview'}
            </button>
            <button
              onClick={isRecording ? stopAll : handleStartRenderVideo}
              className={`py-3 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white'
              }`}
            >
              {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Video className="w-4 h-4" />}
              {isRecording ? 'Parar Gravação' : 'Gerar Vídeo'}
            </button>
          </div>

          {isRecording && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-pink-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Gerando vídeo com áudio...
                </span>
                <span className="font-mono">{recElapsed.toFixed(1)}s / {targetSec}s</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {exportedVideoUrl && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/45 p-3.5 space-y-2.5">
              <div className="text-xs font-extrabold text-emerald-200">✅ Vídeo pronto para postar em qualquer app!</div>
              <video controls src={exportedVideoUrl} className="w-full max-h-52 rounded-xl bg-black" />
              <button
                type="button"
                onClick={() => exportedVideoBlob && downloadBlobReliable(exportedVideoBlob, exportedFilename)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Salvar Vídeo ({exportedFilename})
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 rounded-3xl cosmic-card-3d p-4 sm:p-5 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-purple-300">
            <span className="font-bold">PREVIEW AO VIVO ({width} × {height})</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-cyan-300 font-mono text-[10px]">
              30 FPS · REATIVO AO SOM
            </span>
          </div>
          <div className="w-full flex justify-center bg-black/60 rounded-2xl p-3 border border-white/10">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className={`rounded-xl shadow-2xl border border-purple-500/35 ${
                format === 'shorts_9_16' ? 'max-h-[540px] w-auto aspect-[9/16]' : 'w-full max-w-[680px] aspect-video'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

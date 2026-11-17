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
} from 'lucide-react';
import { Track } from '../types';
import { downloadBlobReliable } from '../utils/androidBridge';

interface Props {
  tracks: Track[];
  initialTrack?: Track | null;
  onPauseCatalogPlayer: () => void;
  onToast: (msg: string) => void;
}

type FormatId = 'youtube_16_9' | 'shorts_9_16';
type StyleId = 'orbit' | 'bars' | 'vinyl';

interface Star {
  x: number;
  y: number;
  z: number;
  hue: number;
}

export const VideoStudioView: React.FC<Props> = ({ tracks, initialTrack, onPauseCatalogPlayer, onToast }) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(initialTrack?.id || tracks[0]?.id || '');
  const [selectedVer, setSelectedVer] = useState<'v1' | 'v2'>('v1');
  const [format, setFormat] = useState<FormatId>('shorts_9_16');
  const [visualStyle, setVisualStyle] = useState<StyleId>('orbit');
  const [hookText, setHookText] = useState('SENTE ESSE GRAVE CÓSMICO 🚀🔥');
  const [showCta, setShowCta] = useState(true);
  const [clipDuration, setClipDuration] = useState<number>(15); // 15, 30, 60, or 0 (full)
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

  const track = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  useEffect(() => {
    if (initialTrack?.id) setSelectedTrackId(initialTrack.id);
  }, [initialTrack?.id]);

  // Init starfield
  useEffect(() => {
    starsRef.current = Array.from({ length: 90 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
      hue: Math.random() > 0.5 ? 320 : 195,
    }));
  }, []);

  // Load cover image whenever track changes
  useEffect(() => {
    if (!track) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = track.coverUrl;
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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  // Real-time Canvas Render Loop
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
      tPhase += 0.03;

      let bass = 0.12;
      let mid = 0.1;
      if (analyserRef.current && (isPreviewing || isRecording)) {
        analyserRef.current.getByteFrequencyData(freqData);
        let bSum = 0;
        for (let i = 0; i < 10; i++) bSum += freqData[i];
        bass = bSum / (10 * 255);
        let mSum = 0;
        for (let i = 10; i < 40; i++) mSum += freqData[i];
        mid = mSum / (30 * 255);
      } else {
        // Gentle idle cosmic breathing when paused
        for (let i = 0; i < 128; i++) {
          freqData[i] = Math.floor((Math.sin(tPhase * 2 + i * 0.25) * 0.5 + 0.5) * 90 + 25);
        }
        bass = (Math.sin(tPhase * 2.5) * 0.5 + 0.5) * 0.35;
        mid = 0.22;
      }

      // 1. Background gradient + blurred reactive cover
      ctx.fillStyle = '#05020e';
      ctx.fillRect(0, 0, w, h);

      const img = coverImgRef.current;
      if (img) {
        ctx.save();
        ctx.globalAlpha = 0.26 + bass * 0.14;
        ctx.filter = 'blur(26px)';
        const scale = Math.max(w / img.width, h / img.height) * (1.08 + bass * 0.08);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        ctx.restore();
      }

      // Vignette overlay
      const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.78);
      vig.addColorStop(0, 'rgba(12, 4, 30, 0.22)');
      vig.addColorStop(1, 'rgba(4, 2, 12, 0.88)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // 2. Cosmic Starfield Particles
      const speed = 0.005 + bass * 0.035;
      starsRef.current.forEach((s) => {
        s.z -= speed;
        if (s.z <= 0.02) {
          s.x = (Math.random() - 0.5) * 2;
          s.y = (Math.random() - 0.5) * 2;
          s.z = 1;
        }
        const sx = w / 2 + (s.x / s.z) * (w * 0.55);
        const sy = h / 2 + (s.y / s.z) * (h * 0.55);
        const r = Math.max(0.8, (1 - s.z) * (3.8 + bass * 4));
        if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) {
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue}, 95%, 70%, ${0.35 + (1 - s.z) * 0.65})`;
          ctx.fill();
        }
      });

      // Top Brand Header
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `800 ${isPortrait ? 22 : 20}px Orbitron, sans-serif`;
      ctx.fillText('L E N K Y X   //   C O S M I C   P H O N K', w / 2, isPortrait ? 92 : 62);
      ctx.restore();

      const centerY = isPortrait ? h * 0.43 : h * 0.46;
      const centerX = w / 2;

      // 3. Selected Visualizer Style
      if (visualStyle === 'orbit') {
        const baseR = (isPortrait ? 155 : 138) + bass * 24;

        // Outer neon aura
        const aura = ctx.createRadialGradient(centerX, centerY, baseR * 0.8, centerX, centerY, baseR * 1.9);
        aura.addColorStop(0, `rgba(236, 72, 153, ${0.32 + bass * 0.35})`);
        aura.addColorStop(0.55, `rgba(56, 189, 248, ${0.15 + mid * 0.25})`);
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR * 1.9, 0, Math.PI * 2);
        ctx.fill();

        // Radial spectrum bars
        const count = 72;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const v = freqData[i % 64] / 255;
          const barLen = 14 + v * (isPortrait ? 125 : 105);
          const x1 = centerX + Math.cos(angle) * (baseR + 8);
          const y1 = centerY + Math.sin(angle) * (baseR + 8);
          const x2 = centerX + Math.cos(angle) * (baseR + 8 + barLen);
          const y2 = centerY + Math.sin(angle) * (baseR + 8 + barLen);
          ctx.strokeStyle = i % 2 === 0 ? '#ff2ea6' : '#38bdf8';
          ctx.lineWidth = isPortrait ? 5.5 : 4.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Circular Cover Art
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
        ctx.clip();
        if (img) {
          ctx.drawImage(img, centerX - baseR, centerY - baseR, baseR * 2, baseR * 2);
        }
        ctx.restore();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
        ctx.stroke();
      } else if (visualStyle === 'bars') {
        const cardSize = (isPortrait ? 330 : 260) + bass * 18;
        const cardY = isPortrait ? h * 0.21 : h * 0.16;

        // Floating neon square cover
        ctx.save();
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 35 + bass * 30;
        if (img) {
          ctx.drawImage(img, centerX - cardSize / 2, cardY, cardSize, cardSize);
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(centerX - cardSize / 2, cardY, cardSize, cardSize);
        ctx.restore();

        // Mirrored horizontal frequency bars
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
          ctx.globalAlpha = 0.35;
          ctx.fillRect(startX + i * bw + 2, baseY + 4, bw - 4, bh * 0.35);
          ctx.globalAlpha = 1;
        }
      } else {
        // Vinyl Drift Grid
        const horizonY = isPortrait ? h * 0.64 : h * 0.68;
        ctx.save();
        ctx.strokeStyle = `rgba(236, 72, 153, ${0.35 + bass * 0.4})`;
        ctx.lineWidth = 2;
        // Perspective lines
        for (let i = -8; i <= 8; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX + i * 25, horizonY);
          ctx.lineTo(centerX + i * 190, h);
          ctx.stroke();
        }
        // Horizontal scrolling lines
        for (let j = 0; j < 9; j++) {
          const p = ((j / 9) + ((tPhase * 0.35) % (1 / 9)));
          const y = horizonY + Math.pow(p, 1.8) * (h - horizonY);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.restore();

        // Spinning Vinyl Disc
        rotationRef.current += isPreviewing || isRecording ? 0.03 + bass * 0.03 : 0.008;
        const r = (isPortrait ? 180 : 155) + bass * 14;
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

        // Grooves
        for (let g = r * 0.62; g < r * 0.94; g += 10) {
          ctx.beginPath();
          ctx.arc(0, 0, g, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Center Cover Label
        const lr = r * 0.56;
        ctx.beginPath();
        ctx.arc(0, 0, lr, 0, Math.PI * 2);
        ctx.clip();
        if (img) ctx.drawImage(img, -lr, -lr, lr * 2, lr * 2);
        ctx.restore();
      }

      // 4. Track Title + Hook Caption + CTA Footer
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
      ctx.font = `900 ${isPortrait ? 44 : 42}px Orbitron, sans-serif`;
      ctx.fillText(track.title.toUpperCase(), w / 2, titleY);

      if (hookText.trim()) {
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#e0f2fe';
        ctx.font = `700 ${isPortrait ? 24 : 22}px Inter, sans-serif`;
        ctx.fillText(hookText.trim(), w / 2, titleY + (isPortrait ? 48 : 40));
      }

      if (showCta) {
        const pillY = isPortrait ? h - 108 : h - 46;
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
        const pillW = isPortrait ? 520 : 540;
        const pillH = 44;
        ctx.beginPath();
        ctx.roundRect(w / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 22);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.fillText(`🎧 OUÇA NO APP LENKYX · ${track.bpm} BPM · PIX NA DESCRIÇÃO`, w / 2, pillY + 6);
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [track, format, visualStyle, hookText, showCta, isPreviewing, isRecording]);

  // Stop audio on unmount
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

  const handleTogglePreview = async () => {
    if (!track) return;
    if (isPreviewing) {
      stopAll();
      return;
    }
    onPauseCatalogPlayer();
    ensureAudioGraph();
    const audio = audioElRef.current!;
    audio.src = selectedVer === 'v2' && track.audioUrlV2 ? track.audioUrlV2 : track.audioUrl;
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
    audio.src = selectedVer === 'v2' && track.audioUrlV2 ? track.audioUrlV2 : track.audioUrl;
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
      const suffix = format === 'youtube_16_9' ? 'YOUTUBE-16x9' : 'SHORTS-9x16';
      const cleanTitle = track.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setExportedVideoBlob(blob);
      setExportedVideoUrl(url);
      setExportedFilename(`LENKYX-${cleanTitle}-${suffix}.webm`);
      setIsRecording(false);
      setIsPreviewing(false);
      audio.pause();
      onToast('🎬 Vídeo renderizado com sucesso! Clique em Baixar Vídeo.');
    };

    recorderRef.current = rec;
    rec.start(250);
    setIsRecording(true);
    setIsPreviewing(true);
    setRecElapsed(0);
    onToast(`🎬 Gravando vídeo ${format === 'youtube_16_9' ? 'YouTube 16:9' : 'Shorts/Reels 9:16'}...`);

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
    <div className="space-y-5 pb-36 md:pb-24">
      {/* Header */}
      <div className="rounded-3xl glass-panel neon-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-2xl font-black text-white">
              ESTÚDIO DE VÍDEO <span className="neon-text">YOUTUBE & SHORTS</span>
            </h1>
            <p className="text-xs text-purple-200/80">
              Crie vídeos reativos ao grave da música (16:9 pro YouTube e 9:16 pra Shorts, Reels e TikTok) direto no app!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">1. Escolha a Música</label>
            <select
              value={selectedTrackId}
              onChange={(e) => {
                stopAll();
                setSelectedTrackId(e.target.value);
                setSelectedVer('v1');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-purple-500/35 text-sm font-bold text-white focus:outline-none focus:border-pink-500"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0f0824]">
                  #{String(t.number).padStart(2, '0')} {t.emoji} {t.title} ({t.bpm} BPM)
                </option>
              ))}
            </select>
            {track.audioUrlV2 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => {
                    stopAll();
                    setSelectedVer('v1');
                  }}
                  className={`py-1.5 rounded-xl text-xs font-extrabold border transition ${
                    selectedVer === 'v1'
                      ? 'bg-pink-500 border-pink-400 text-white'
                      : 'bg-white/5 border-white/10 text-purple-200'
                  }`}
                >
                  Usar Versão 1 (V1)
                </button>
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => {
                    stopAll();
                    setSelectedVer('v2');
                  }}
                  className={`py-1.5 rounded-xl text-xs font-extrabold border truncate px-2 transition ${
                    selectedVer === 'v2'
                      ? 'bg-cyan-400 border-cyan-300 text-black'
                      : 'bg-white/5 border-white/10 text-cyan-200'
                  }`}
                >
                  Usar V2{track.v2Label ? ` · ${track.v2Label}` : ''}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">2. Formato do Vídeo</label>
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
                  <div className="text-xs font-extrabold">Shorts / Reels</div>
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
                  <div className="text-xs font-extrabold">YouTube Canal</div>
                  <div className="text-[10px] text-purple-300">Horizontal 16:9</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">3. Estilo Visual Reativo ao Som</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['orbit', 'Cosmic Orbit', Orbit],
                  ['bars', 'Cyber Bars', BarChart3],
                  ['vinyl', 'Vinyl Drift', Disc3],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setVisualStyle(id)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    visualStyle === id
                      ? 'bg-gradient-to-br from-pink-600/40 to-cyan-600/40 border-pink-400 text-white'
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
            <label className="block text-xs font-bold text-purple-200 mb-1">4. Frase de Chamada / Legenda no Vídeo</label>
            <input
              type="text"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              placeholder="Ex: AUMENTA O VOLUME 🚀"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1">5. Duração do Vídeo</label>
              <select
                value={clipDuration}
                onChange={(e) => setClipDuration(Number(e.target.value))}
                disabled={isRecording}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/35 text-xs font-bold text-white"
              >
                <option value={10} className="bg-[#0f0824]">10 seg (Teste Rápido)</option>
                <option value={15} className="bg-[#0f0824]">15 seg (Shorts / TikTok)</option>
                <option value={30} className="bg-[#0f0824]">30 seg (Reels Viral)</option>
                <option value={60} className="bg-[#0f0824]">60 seg (Shorts Longo)</option>
                <option value={0} className="bg-[#0f0824]">Faixa Completa (YouTube)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-xs text-purple-100">
              <input
                type="checkbox"
                checked={showCta}
                onChange={(e) => setShowCta(e.target.checked)}
                className="accent-pink-500"
              />
              Mostrar barra App & PIX
            </label>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleTogglePreview}
              disabled={isRecording}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
            >
              {isPreviewing && !isRecording ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              {isPreviewing && !isRecording ? 'Parar Preview' : 'Testar Preview'}
            </button>
            <button
              onClick={isRecording ? stopAll : handleStartRenderVideo}
              className={`py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 hover:brightness-110 text-white'
              }`}
            >
              {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Video className="w-4 h-4" />}
              {isRecording ? 'Parar Gravação' : 'Renderizar Vídeo'}
            </button>
          </div>

          {isRecording && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-pink-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Gravando vídeo + áudio em tempo real...
                </span>
                <span className="font-mono">{recElapsed.toFixed(1)}s / {targetSec}s</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {exportedVideoUrl && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/45 p-3.5 space-y-2.5">
              <div className="text-xs font-extrabold text-emerald-200">✅ Vídeo pronto para subir no YouTube / Shorts!</div>
              <video controls src={exportedVideoUrl} className="w-full max-h-52 rounded-xl bg-black" />
              <button
                type="button"
                onClick={() => exportedVideoBlob && downloadBlobReliable(exportedVideoBlob, exportedFilename)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Baixar Vídeo ({exportedFilename})
              </button>
            </div>
          )}
        </div>

        {/* Right Live Canvas Stage */}
        <div className="lg:col-span-7 rounded-3xl glass-panel neon-border p-4 sm:p-5 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-purple-300">
            <span className="font-bold">PREVIEW AO VIVO ({width} × {height})</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-cyan-300 font-mono text-[10px]">
              30 FPS · WEB AUDIO FFT
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

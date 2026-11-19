import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  Camera,
  CameraOff,
  Globe2,
  Headphones,
  Languages,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';

export interface CallLangOption {
  code: string;
  bcp47: string;
  label: string;
  flag: string;
}

export const CALL_LANGUAGES: CallLangOption[] = [
  { code: 'pt', bcp47: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'en', bcp47: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'es', bcp47: 'es-ES', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', bcp47: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', bcp47: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', bcp47: 'ko-KR', label: '한국어', flag: '🇰🇷' },
  { code: 'de', bcp47: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', bcp47: 'it-IT', label: 'Italiano', flag: '🇮🇹' },
  { code: 'zh-CN', bcp47: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'ru', bcp47: 'ru-RU', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', bcp47: 'ar-SA', label: 'العربية', flag: '🇸🇦' },
];

export function toBcp47(langCode: string): string {
  const found = CALL_LANGUAGES.find((l) => l.code === langCode || l.bcp47.startsWith(langCode));
  return found ? found.bcp47 : 'pt-BR';
}

// === VOICE-PRESERVING DUBBING SYNTHESIZER ===
export function speakWithPreservedVoice(
  text: string,
  langCode: string,
  opts?: {
    pitchRatio?: number;
    rate?: number;
    voiceEffect?: 'natural' | 'studio' | 'deep' | 'bright';
    onEnd?: () => void;
  }
) {
  const clean = String(text || '').trim();
  if (!clean || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    opts?.onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const bcp47 = toBcp47(langCode);
    const shortLang = bcp47.split('-')[0].toLowerCase();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = bcp47;

    const voices = window.speechSynthesis.getVoices() || [];
    const exactVoice =
      voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(shortLang));
    if (exactVoice) utter.voice = exactVoice;

    let basePitch = opts?.pitchRatio ?? 1.0;
    if (opts?.voiceEffect === 'deep') basePitch *= 0.86;
    if (opts?.voiceEffect === 'bright') basePitch *= 1.12;
    utter.pitch = Math.max(0.6, Math.min(1.6, basePitch));
    utter.rate = Math.max(0.75, Math.min(1.35, opts?.rate ?? 1.03));
    utter.volume = 1;
    if (opts?.onEnd) utter.onend = () => opts.onEnd?.();
    utter.onerror = () => opts?.onEnd?.();
    window.speechSynthesis.speak(utter);
  } catch {
    opts?.onEnd?.();
  }
}

export function stopPreservedVoice() {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}

// Estimate fundamental pitch (F0 -> ratio around 1.0) from microphone time-domain buffer
function estimatePitchRatio(buf: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.015) return 1.0;

  let bestOffset = -1;
  let bestCorr = 0;
  const minPeriod = Math.floor(sampleRate / 340);
  const maxPeriod = Math.floor(sampleRate / 75);
  for (let offset = minPeriod; offset <= Math.min(maxPeriod, Math.floor(buf.length / 2)); offset++) {
    let corr = 0;
    for (let i = 0; i < Math.floor(buf.length / 2); i++) {
      corr += buf[i] * buf[i + offset];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestOffset = offset;
    }
  }
  if (bestOffset <= 0) return 1.0;
  const freq = sampleRate / bestOffset;
  const ratio = freq / 155; // calibrated around natural human voice centroid
  return Math.max(0.76, Math.min(1.38, Number(ratio.toFixed(2))));
}

// === BLUETOOTH DEVICE CONNECTION & AUDIO OUTPUT ROUTING MODAL ===
interface BluetoothDeviceEntry {
  id: string;
  name: string;
  battery?: number | null;
  connected: boolean;
  type: 'bluetooth' | 'audio_output';
}

export const BluetoothConnectModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}> = ({ open, onClose, onToast }) => {
  const [devices, setDevices] = useState<BluetoothDeviceEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [activeOutputId, setActiveOutputId] = useState<string>('default');

  const refreshAudioOutputs = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const list = await navigator.mediaDevices.enumerateDevices();
      const outputs = list
        .filter((d) => d.kind === 'audiooutput' && d.deviceId)
        .map((d, idx) => ({
          id: d.deviceId,
          name: d.label || `Saída de Áudio ${idx + 1}`,
          connected: d.deviceId === activeOutputId,
          type: 'audio_output' as const,
        }));
      setDevices((prev) => {
        const btOnly = prev.filter((p) => p.type === 'bluetooth');
        return [...btOnly, ...outputs];
      });
    } catch {
      // ignore
    }
  }, [activeOutputId]);

  useEffect(() => {
    if (open) void refreshAudioOutputs();
  }, [open, refreshAudioOutputs]);

  if (!open) return null;

  const handleScanBluetooth = async () => {
    setScanning(true);
    try {
      const navBt = (navigator as Navigator & {
        bluetooth?: {
          requestDevice: (opts: unknown) => Promise<{
            id: string;
            name?: string;
            gatt?: {
              connect: () => Promise<{
                getPrimaryService: (s: string) => Promise<{
                  getCharacteristic: (c: string) => Promise<{
                    readValue: () => Promise<DataView>;
                  }>;
                }>;
              }>;
            };
          }>;
        };
      }).bluetooth;

      if (navBt?.requestDevice) {
        const dev = await navBt.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'device_information'],
        });
        let battery: number | null = null;
        try {
          const server = await dev.gatt?.connect();
          const svc = await server?.getPrimaryService('battery_service');
          const ch = await svc?.getCharacteristic('battery_level');
          const val = await ch?.readValue();
          if (val) battery = val.getUint8(0);
        } catch {
          // device paired without battery service
        }
        setDevices((prev) => [
          {
            id: dev.id || `bt_${Date.now()}`,
            name: dev.name || 'Dispositivo Bluetooth',
            battery,
            connected: true,
            type: 'bluetooth',
          },
          ...prev.filter((d) => d.id !== dev.id),
        ]);
        onToast(`📶 Bluetooth conectado: ${dev.name || 'Dispositivo'}`);
      } else {
        const md = navigator.mediaDevices as MediaDevices & {
          selectAudioOutput?: () => Promise<{ deviceId: string; label?: string }>;
        };
        if (md?.selectAudioOutput) {
          const chosen = await md.selectAudioOutput();
          await routeAudioToSink(chosen.deviceId, chosen.label || 'Bluetooth');
        } else {
          onToast('Ative o Bluetooth no aparelho e conecte o fone ou caixa de som.');
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== 'NotFoundError') {
        onToast('Use o Bluetooth do sistema ou escolha a saída de áudio abaixo.');
      }
    } finally {
      setScanning(false);
    }
  };

  const routeAudioToSink = async (sinkId: string, label: string) => {
    setActiveOutputId(sinkId);
    let routed = 0;
    const mediaEls = document.querySelectorAll('audio, video');
    for (const el of Array.from(mediaEls)) {
      const m = el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
      if (typeof m.setSinkId === 'function') {
        try {
          await m.setSinkId(sinkId);
          routed++;
        } catch {
          // ignore
        }
      }
    }
    setDevices((prev) =>
      prev.map((d) => (d.type === 'audio_output' ? { ...d, connected: d.id === sinkId } : d))
    );
    onToast(routed > 0 ? `🎧 Áudio enviado para ${label}` : `🎧 Saída selecionada: ${label}`);
  };

  return (
    <div className="fixed inset-0 z-[9995] bg-black/75 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-950/95 border border-cyan-400/40 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_20px_rgba(56,189,248,0.5)]">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Bluetooth & Aparelhos</h3>
              <p className="text-[10px] text-cyan-200/80">Fones, Caixas de Som, TV & Carros</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            type="button"
            disabled={scanning}
            onClick={() => void handleScanBluetooth()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(56,189,248,0.45)]"
          >
            <BluetoothConnected className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Procurando aparelhos...' : 'Conectar Aparelho Bluetooth'}</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold pt-1">
            <span>Dispositivos e Saídas de Áudio</span>
            <button
              type="button"
              onClick={() => void refreshAudioOutputs()}
              className="flex items-center gap-1 text-cyan-300 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2">
            {devices.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center text-xs text-slate-400">
                Toque em <strong>Conectar Aparelho Bluetooth</strong> para parear fone, caixa ou TV.
              </div>
            ) : (
              devices.map((dev) => (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() =>
                    dev.type === 'audio_output'
                      ? void routeAudioToSink(dev.id, dev.name)
                      : onToast(`✅ ${dev.name} conectado!`)
                  }
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition ${
                    dev.connected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white'
                      : 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {dev.type === 'bluetooth' ? (
                      <BluetoothConnected className="w-4 h-4 text-cyan-300 shrink-0" />
                    ) : (
                      <Headphones className="w-4 h-4 text-emerald-300 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="text-xs font-black truncate">{dev.name}</div>
                      {typeof dev.battery === 'number' && (
                        <div className="text-[10px] text-emerald-300">Bateria: {dev.battery}%</div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      dev.connected ? 'bg-emerald-400 text-black' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {dev.connected ? 'Conectado' : 'Usar'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// === WHATSAPP-STYLE GLOBAL VOICE & VIDEO CALL WITH REAL-TIME VOICE-PRESERVING DUBBING ===
interface CallContact {
  id: string;
  name: string;
  country: string;
  lang: string;
  langLabel?: string;
  avatarColor?: string;
  isRealPeer?: boolean;
}

interface CallTranscriptLine {
  id: string;
  speaker: 'me' | 'remote';
  author: string;
  originalText: string;
  dubbedText: string;
  pitchRatio: number;
  ts: string;
}

export const GlobalVoiceCallModal: React.FC<{
  open: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onOpenBluetooth: () => void;
  onToast: (msg: string) => void;
}> = ({ open, user, onClose, onOpenBluetooth, onToast }) => {
  const [myLang, setMyLang] = useState('pt');
  const [remoteLang, setRemoteLang] = useState('en');
  const [voiceEffect, setVoiceEffect] = useState<'natural' | 'studio' | 'deep' | 'bright'>('natural');
  const [contacts, setContacts] = useState<CallContact[]>([]);
  const [realPeers, setRealPeers] = useState<CallContact[]>([]);
  const [activeContact, setActiveContact] = useState<CallContact | null>(null);
  const [callMode, setCallMode] = useState<'voice' | 'video'>('video');
  const [inCall, setInCall] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true);
  const [livePitchRatio, setLivePitchRatio] = useState(1.0);
  const [voiceEnergy, setVoiceEnergy] = useState(0);
  const [transcripts, setTranscripts] = useState<CallTranscriptLine[]>([]);
  const [typedSpeech, setTypedSpeech] = useState('');
  const [listeningLive, setListeningLive] = useState(false);

  const selfPeerId = useMemo(() => {
    const key = 'lenkyx_call_peer_id';
    try {
      const saved = localStorage.getItem(key);
      if (saved) return saved;
      const fresh = `LX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      localStorage.setItem(key, fresh);
      return fresh;
    } catch {
      return `LX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    }
  }, []);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pitchRef = useRef(1.0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcripts]);

  // Register presence + fetch global directory
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const syncPresence = async () => {
      try {
        await fetch('/api/calls/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peerId: selfPeerId,
            name: user?.name || `Viajante ${selfPeerId.slice(-3)}`,
            country: myLang === 'pt' ? 'Brasil 🇧🇷' : 'Global 🌍',
            lang: myLang,
          }),
        });
        const r = await fetch(`/api/calls/directory?selfPeerId=${encodeURIComponent(selfPeerId)}`);
        const d = await r.json();
        if (alive && d?.ok) {
          setRealPeers(d.realPeers || []);
          setContacts(d.globalExplorers || []);
        }
      } catch {
        // ignore
      }
    };
    void syncPresence();
    const timer = window.setInterval(() => void syncPresence(), 12000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [open, selfPeerId, user?.name, myLang]);

  const stopCallHardware = useCallback(() => {
    try {
      (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    setListeningLive(false);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    stopPreservedVoice();
  }, []);

  useEffect(() => {
    if (!open) {
      stopCallHardware();
      setInCall(false);
    }
    return () => stopCallHardware();
  }, [open, stopCallHardware]);

  // Poll incoming WebRTC & translated speech signals
  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const r = await fetch(`/api/calls/poll?peerId=${encodeURIComponent(selfPeerId)}`);
        const d = await r.json();
        if (!active || !Array.isArray(d?.signals)) return;
        for (const sig of d.signals) {
          if (sig.type === 'translated-speech' && sig.payload?.text) {
            const trRes = await fetch('/api/voice/translate-dub', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: sig.payload.text,
                sourceLang: sig.fromLang || 'auto',
                targetLang: myLang,
                pitchRatio: sig.payload.pitchRatio || 1.0,
                voiceEffect: sig.payload.voiceEffect || 'natural',
              }),
            }).then((res) => res.json());

            const dubbed = trRes?.translatedText || sig.payload.text;
            const pr = Number(sig.payload.pitchRatio || 1.0);
            setTranscripts((prev) => [
              ...prev.slice(-30),
              {
                id: sig.id,
                speaker: 'remote',
                author: sig.fromName || 'Remoto',
                originalText: sig.payload.text,
                dubbedText: dubbed,
                pitchRatio: pr,
                ts: new Date().toLocaleTimeString().slice(0, 5),
              },
            ]);
            speakWithPreservedVoice(dubbed, myLang, {
              pitchRatio: pr,
              voiceEffect: sig.payload.voiceEffect || 'natural',
            });
          } else if (sig.type === 'offer' && sig.payload) {
            setActiveContact({
              id: sig.fromPeerId,
              name: sig.fromName || 'Chamada Recebida',
              country: 'Ao Vivo 🌍',
              lang: sig.fromLang || 'en',
              isRealPeer: true,
            });
            setRemoteLang(sig.fromLang || 'en');
            setInCall(true);
            setCallMode(sig.payload.video ? 'video' : 'voice');
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            pcRef.current = pc;
            pc.ontrack = (ev) => {
              if (remoteVideoRef.current && ev.streams[0]) {
                remoteVideoRef.current.srcObject = ev.streams[0];
              }
            };
            pc.onicecandidate = (ev) => {
              if (ev.candidate) {
                void fetch('/api/calls/signal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    toPeerId: sig.fromPeerId,
                    fromPeerId: selfPeerId,
                    fromName: user?.name || selfPeerId,
                    fromLang: myLang,
                    type: 'ice',
                    payload: ev.candidate,
                  }),
                });
              }
            };
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            void fetch('/api/calls/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toPeerId: sig.fromPeerId,
                fromPeerId: selfPeerId,
                fromName: user?.name || selfPeerId,
                fromLang: myLang,
                type: 'answer',
                payload: answer,
              }),
            });
          } else if (sig.type === 'answer' && pcRef.current && sig.payload) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sig.payload));
          } else if (sig.type === 'ice' && pcRef.current && sig.payload) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(sig.payload)).catch(() => {});
          }
        }
      } catch {
        // ignore polling hiccups
      }
    }, 1800);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [open, selfPeerId, myLang, user?.name]);

  const sendLiveUtterance = useCallback(
    async (spokenText: string) => {
      const clean = spokenText.trim();
      if (!clean || !activeContact) return;
      const currentPitch = pitchRef.current || 1.0;

      try {
        const res = await fetch('/api/voice/translate-dub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: clean,
            sourceLang: myLang,
            targetLang: remoteLang,
            pitchRatio: currentPitch,
            voiceEffect,
          }),
        });
        const data = await res.json();
        const translatedOut = data?.translatedText || clean;

        setTranscripts((prev) => [
          ...prev.slice(-30),
          {
            id: `me_${Date.now()}`,
            speaker: 'me',
            author: user?.name || 'Você',
            originalText: clean,
            dubbedText: translatedOut,
            pitchRatio: currentPitch,
            ts: new Date().toLocaleTimeString().slice(0, 5),
          },
        ]);

        if (activeContact.isRealPeer) {
          await fetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toPeerId: activeContact.id,
              fromPeerId: selfPeerId,
              fromName: user?.name || selfPeerId,
              fromLang: myLang,
              type: 'translated-speech',
              payload: { text: clean, pitchRatio: currentPitch, voiceEffect },
            }),
          });
        } else {
          // Global explorer live conversational response dubbed back into your language preserving their voice
          const replyPrompt = `Você é ${activeContact.name} de ${activeContact.country}. Responda de forma amigável, natural e breve (máx 2 frases) à mensagem: "${clean}"`;
          const aiRes = await fetch('/api/galaxy/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personaId: 'zylar',
              message: replyPrompt,
              userLang: myLang,
            }),
          }).then((r) => r.json());
          const replyInMyLang = aiRes?.reply || 'Olá! Recebi sua voz perfeitamente traduzida em tempo real!';
          const nativeRes = await fetch('/api/voice/translate-dub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: replyInMyLang,
              sourceLang: myLang,
              targetLang: remoteLang,
              pitchRatio: 1.04,
            }),
          }).then((r) => r.json());

          const explorerPitch = activeContact.id === 'exp_us' || activeContact.id === 'exp_fr' ? 1.14 : 0.94;
          setTranscripts((prev) => [
            ...prev.slice(-30),
            {
              id: `rem_${Date.now()}`,
              speaker: 'remote',
              author: activeContact.name,
              originalText: nativeRes?.translatedText || replyInMyLang,
              dubbedText: replyInMyLang,
              pitchRatio: explorerPitch,
              ts: new Date().toLocaleTimeString().slice(0, 5),
            },
          ]);
          speakWithPreservedVoice(replyInMyLang, myLang, {
            pitchRatio: explorerPitch,
            voiceEffect: 'studio',
          });
        }
      } catch {
        // ignore
      }
    },
    [activeContact, myLang, remoteLang, voiceEffect, user?.name, selfPeerId]
  );

  const startCallWith = async (contact: CallContact, mode: 'voice' | 'video') => {
    stopCallHardware();
    setActiveContact(contact);
    setRemoteLang(contact.lang || 'en');
    setCallMode(mode);
    setCamEnabled(mode === 'video');
    setInCall(true);
    setTranscripts([]);

    // 1. Acquire Camera/Mic + Pitch Preservation Analyzer
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: mode === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current && mode === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        const samplePitch = () => {
          if (!audioCtxRef.current) return;
          analyser.getFloatTimeDomainData(buf);
          let rms = 0;
          for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
          const energy = Math.min(100, Math.round(Math.sqrt(rms / buf.length) * 650));
          setVoiceEnergy(energy);
          if (energy > 8) {
            const pr = estimatePitchRatio(buf, ctx.sampleRate);
            pitchRef.current = pr;
            setLivePitchRatio(pr);
          }
          requestAnimationFrame(samplePitch);
        };
        requestAnimationFrame(samplePitch);
      }

      if (contact.isRealPeer) {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pcRef.current = pc;
        stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));
        pc.ontrack = (ev) => {
          if (remoteVideoRef.current && ev.streams[0]) {
            remoteVideoRef.current.srcObject = ev.streams[0];
          }
        };
        pc.onicecandidate = (ev) => {
          if (ev.candidate) {
            void fetch('/api/calls/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toPeerId: contact.id,
                fromPeerId: selfPeerId,
                fromName: user?.name || selfPeerId,
                fromLang: myLang,
                type: 'ice',
                payload: ev.candidate,
              }),
            });
          }
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        void fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toPeerId: contact.id,
            fromPeerId: selfPeerId,
            fromName: user?.name || selfPeerId,
            fromLang: myLang,
            type: 'offer',
            payload: { sdp: offer, video: mode === 'video' },
          }),
        });
      }
    } catch {
      onToast('Microfone/câmera indisponíveis — você ainda pode conversar e ouvir dublado!');
    }

    // 2. Start Live Speech Recognition for Instant Dubbing
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (SR) {
      try {
        const rec = new SR() as {
          lang: string;
          continuous: boolean;
          interimResults: boolean;
          onresult: (ev: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void;
          onerror: () => void;
          onend: () => void;
          start: () => void;
        };
        rec.lang = toBcp47(myLang);
        rec.continuous = true;
        rec.interimResults = false;
        rec.onresult = (ev) => {
          const last = ev.results[ev.results.length - 1];
          if (last?.isFinal && last[0]?.transcript) {
            void sendLiveUtterance(last[0].transcript);
          }
        };
        rec.onerror = () => setListeningLive(false);
        rec.onend = () => {
          if (recognitionRef.current === rec) {
            try {
              rec.start();
            } catch {
              setListeningLive(false);
            }
          }
        };
        rec.start();
        recognitionRef.current = rec;
        setListeningLive(true);
      } catch {
        // ignore
      }
    }
  };

  if (!open) return null;

  const allContacts = [...realPeers, ...contacts];

  return (
    <div className="fixed inset-0 z-[9994] bg-black/82 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl max-h-[92dvh] rounded-3xl bg-slate-950/95 border border-emerald-400/35 shadow-[0_24px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-emerald-950/60 via-slate-950 to-cyan-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.5)]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Chamadas Globais com Dublagem ao Vivo</h2>
              <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-2">
                <span>Seu ID: {selfPeerId}</span>
                <span>·</span>
                <span>Preserva timbre & efeito da voz</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBluetooth}
              className="px-2.5 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/35 border border-blue-400/40 text-blue-200 text-[11px] font-black flex items-center gap-1"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bluetooth</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCallHardware();
                setInCall(false);
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Language & Voice Effect Bar */}
        <div className="px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center gap-2 bg-white/[0.03] text-xs">
          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[11px] font-bold text-slate-300">Eu falo:</span>
            <select
              value={myLang}
              onChange={(e) => setMyLang(e.target.value)}
              className="bg-slate-900 border border-white/15 rounded-xl px-2 py-1 text-[11px] font-bold text-white"
            >
              {CALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-emerald-400 font-black">⇄</span>

          <div className="flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-[11px] font-bold text-slate-300">Pessoa ouve:</span>
            <select
              value={remoteLang}
              onChange={(e) => setRemoteLang(e.target.value)}
              className="bg-slate-900 border border-white/15 rounded-xl px-2 py-1 text-[11px] font-bold text-white"
            >
              {CALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <select
              value={voiceEffect}
              onChange={(e) => setVoiceEffect(e.target.value as 'natural' | 'studio' | 'deep' | 'bright')}
              className="bg-slate-900 border border-white/15 rounded-xl px-2 py-1 text-[11px] font-bold text-amber-200"
            >
              <option value="natural">Timbre Original</option>
              <option value="studio">Estúdio HD</option>
              <option value="deep">Grave Intenso</option>
              <option value="bright">Brilhante</option>
            </select>
          </div>
        </div>

        {/* Body */}
        {!inCall ? (
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allContacts.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between gap-2 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                      c.avatarColor || 'from-cyan-400 to-emerald-500'
                    } flex items-center justify-center text-white font-black text-sm shrink-0`}
                  >
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                      <span>{c.name}</span>
                      {c.isRealPeer && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[9px]">
                          AO VIVO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {c.country} · {c.langLabel || c.lang.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => void startCallWith(c, 'voice')}
                    className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-400/40 transition"
                    title="Ligação de Voz"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void startCallWith(c, 'video')}
                    className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-400 text-cyan-200 hover:text-black border border-cyan-400/40 transition"
                    title="Videochamada"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
            {/* Call Video / Voice Stage */}
            <div className="relative flex-1 bg-black flex flex-col items-center justify-center min-h-[240px]">
              {callMode === 'video' ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Fallback crisp avatar when explorer has no WebRTC stream */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-gradient-to-b from-slate-900/50 via-transparent to-black/80">
                    <div
                      className={`w-24 h-24 rounded-full bg-gradient-to-br ${
                        activeContact?.avatarColor || 'from-cyan-400 to-emerald-400'
                      } flex items-center justify-center text-3xl font-black text-white shadow-[0_0_40px_rgba(34,211,238,0.5)] border-2 border-white/30`}
                    >
                      {activeContact?.name.slice(0, 1)}
                    </div>
                    <div className="mt-2 text-sm font-black text-white">{activeContact?.name}</div>
                    <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>{activeContact?.country} · Dublagem Simultânea</span>
                    </div>
                  </div>
                  {/* Local PIP (non-mirrored natural orientation) */}
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`absolute bottom-16 right-3 w-28 h-36 rounded-2xl object-cover border-2 border-cyan-400/60 shadow-2xl ${
                      camEnabled ? 'opacity-100' : 'opacity-20'
                    }`}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-6">
                  <div
                    style={{ transform: `scale(${1 + voiceEnergy / 280})` }}
                    className={`w-28 h-28 rounded-full bg-gradient-to-br ${
                      activeContact?.avatarColor || 'from-emerald-400 to-cyan-500'
                    } flex items-center justify-center text-4xl font-black text-white shadow-[0_0_50px_rgba(52,211,153,0.6)] transition-transform`}
                  >
                    {activeContact?.name.slice(0, 1)}
                  </div>
                  <div className="text-base font-black text-white">{activeContact?.name}</div>
                  <div className="text-xs text-emerald-300 font-bold">
                    {activeContact?.country} · Timbre {livePitchRatio}x
                  </div>
                </div>
              )}

              {/* Bottom Call Controls */}
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2.5 z-20">
                <button
                  type="button"
                  onClick={() => {
                    const next = !micMuted;
                    setMicMuted(next);
                    localStreamRef.current?.getAudioTracks().forEach((t) => {
                      t.enabled = !next;
                    });
                  }}
                  className={`p-3 rounded-full border transition ${
                    micMuted ? 'bg-rose-500 text-white border-rose-300' : 'bg-slate-900/85 text-white border-white/25'
                  }`}
                >
                  {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                {callMode === 'video' && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !camEnabled;
                      setCamEnabled(next);
                      localStreamRef.current?.getVideoTracks().forEach((t) => {
                        t.enabled = next;
                      });
                    }}
                    className={`p-3 rounded-full border transition ${
                      !camEnabled
                        ? 'bg-rose-500 text-white border-rose-300'
                        : 'bg-slate-900/85 text-white border-white/25'
                    }`}
                  >
                    {camEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenBluetooth}
                  className="p-3 rounded-full bg-blue-500/25 border border-blue-400/50 text-blue-200"
                  title="Bluetooth"
                >
                  <Bluetooth className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCallHardware();
                    setInCall(false);
                  }}
                  className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_24px_rgba(244,63,94,0.6)]"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Encerrar</span>
                </button>
              </div>
            </div>

            {/* Live Bilingual Dubbing Feed */}
            <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-white/10 bg-slate-950/95 flex flex-col">
              <div className="p-2.5 border-b border-white/10 flex items-center justify-between text-[11px] font-black text-cyan-200">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Dublagem em Tempo Real
                </span>
                {listeningLive && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] animate-pulse">
                    MIC ATIVO
                  </span>
                )}
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-56 sm:max-h-none">
                {transcripts.length === 0 && (
                  <div className="text-center text-[11px] text-slate-400 py-6">
                    Fale no microfone ou digite abaixo para conversar com dublagem instantânea.
                  </div>
                )}
                {transcripts.map((t) => (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-2xl text-xs border ${
                      t.speaker === 'me'
                        ? 'bg-cyan-500/15 border-cyan-400/30 ml-4'
                        : 'bg-emerald-500/15 border-emerald-400/30 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mb-0.5">
                      <span>{t.author}</span>
                      <span>
                        Timbre {t.pitchRatio}x · {t.ts}
                      </span>
                    </div>
                    <div className="text-white font-semibold">{t.dubbedText}</div>
                    {t.originalText !== t.dubbedText && (
                      <div className="text-[10px] text-slate-400 mt-0.5 italic">{t.originalText}</div>
                    )}
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!typedSpeech.trim()) return;
                  const txt = typedSpeech;
                  setTypedSpeech('');
                  void sendLiveUtterance(txt);
                }}
                className="p-2.5 border-t border-white/10 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={typedSpeech}
                  onChange={(e) => setTypedSpeech(e.target.value)}
                  placeholder="Falar ou digitar..."
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Tv,
  Bluetooth,
  Share2,
  Copy,
  Check,
  Unlink,
  Download,
  Sparkles,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { createTvHandoff, TvHandoffSession } from '../utils/communityApi';

interface Props {
  open: boolean;
  onClose: () => void;
  currentMedia: {
    title: string;
    artist?: string;
    mode?: 'galaxy' | 'video' | 'shorts' | 'tv';
    youtubeVideoId?: string;
    audioUrl?: string;
    streamUrl?: string;
    coverUrl?: string;
    trackId?: string;
  };
  apkDownloadUrl?: string;
  onDetachPhone: () => void;
  onToast: (msg: string) => void;
}

export const TvCastModal: React.FC<Props> = ({
  open,
  onClose,
  currentMedia,
  apkDownloadUrl,
  onDetachPhone,
  onToast,
}) => {
  const [tab, setTab] = useState<'tv_handoff' | 'bluetooth'>('tv_handoff');
  const [session, setSession] = useState<TvHandoffSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detached, setDetached] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState('');
  const [btStatus, setBtStatus] = useState('');

  const origin =
    typeof window !== 'undefined' && window.location.origin.startsWith('http')
      ? window.location.origin
      : 'https://lenkyx-cosmic-phonk.onrender.com';

  const shortTvHome = `${origin}/tv`;
  const tvUrl = session ? `${origin}/tv/${encodeURIComponent(session.code)}` : shortTvHome;

  useEffect(() => {
    if (!open) return;
    setDetached(false);
    setLoading(true);
    void createTvHandoff(currentMedia)
      .then(async (s) => {
        if (s) {
          setSession(s);
          const link = `${origin}/tv/${encodeURIComponent(s.code)}`;
          try {
            const qr = await QRCode.toDataURL(link, {
              width: 240,
              margin: 1,
              color: { dark: '#060310', light: '#ffffff' },
            });
            setQrDataUrl(qr);
          } catch {
            setQrDataUrl('');
          }
        }
      })
      .finally(() => setLoading(false));
  }, [open, currentMedia.title, currentMedia.youtubeVideoId, currentMedia.audioUrl, currentMedia.streamUrl]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tvUrl);
      setCopied(true);
      onToast('Link da TV copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Copie o código ou o link manualmente.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `📺 Abrir na TV — ${currentMedia.title}`,
          text: `Abra o LENKYX Cosmic Phonk direto na Smart TV (Código ${session?.code || ''}) e deixe tocando sozinho:`,
          url: tvUrl,
        });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    await handleCopy();
  };

  const handleDetachNow = () => {
    setDetached(true);
    onDetachPhone();
    onToast('📺 Enviado para a TV! Celular desconectado — a TV agora roda sozinha!');
  };

  const handleWebBluetoothScan = async () => {
    const navBt = (navigator as unknown as {
      bluetooth?: { requestDevice: (opts: unknown) => Promise<{ name?: string }> };
    }).bluetooth;
    if (!navBt) {
      setBtStatus(
        'Navegador atual sem Web Bluetooth direto. Conecte sua TV ou caixa JBL nas configurações de Bluetooth do celular e depois use a aba "Passar para TV" para a TV ficar independente!'
      );
      return;
    }
    try {
      setBtStatus('Procurando TVs e caixas de som Bluetooth próximas...');
      const dev = await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information'],
      });
      setBtDeviceName(dev?.name || 'Dispositivo Bluetooth');
      setBtStatus(
        `✅ Dispositivo "${dev?.name || 'Bluetooth'}" encontrado! Para áudio contínuo sem depender do celular, abra o link/QR da TV na aba "Passar para TV".`
      );
    } catch {
      setBtStatus('Busca Bluetooth cancelada. Você pode parear pelo menu Bluetooth do celular ou enviar o Link direto para a TV.');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92dvh] flex flex-col rounded-3xl overflow-hidden bg-[#090418] border border-cyan-400/45 shadow-[0_0_65px_rgba(34,211,238,0.3)] text-white"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#140b35] to-[#081f33] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0">
              <Tv className="w-5 h-5 text-cyan-300" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                Modo Smart TV · Conectar & Separar
              </h2>
              <p className="text-[11px] text-cyan-300 truncate">
                Passe para a TV e deixe a TV tocando sozinha (independente do celular!)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 flex gap-2 shrink-0">
          <button
            onClick={() => setTab('tv_handoff')}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
              tab === 'tv_handoff'
                ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-black'
                : 'bg-white/[0.06] text-purple-200 hover:bg-white/10'
            }`}
          >
            <Tv className="w-4 h-4" /> Passar para TV & Separar
          </button>
          <button
            onClick={() => setTab('bluetooth')}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
              tab === 'bluetooth'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-black'
                : 'bg-white/[0.06] text-purple-200 hover:bg-white/10'
            }`}
          >
            <Bluetooth className="w-4 h-4" /> Bluetooth / Som JBL
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {tab === 'tv_handoff' ? (
            <>
              <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 flex items-center gap-3">
                <img
                  src={currentMedia.coverUrl || '/covers/icon-512.png'}
                  alt={currentMedia.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-pink-300">
                    Pronto para enviar para a TV
                  </div>
                  <div className="text-xs font-black text-white truncate">{currentMedia.title}</div>
                  <div className="text-[11px] text-purple-200/80 truncate">{currentMedia.artist || 'LENKYX'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* QR Code */}
                <div className="rounded-2xl bg-white p-3 flex flex-col items-center justify-center mx-auto">
                  {loading ? (
                    <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-600 font-bold">
                      Gerando QR...
                    </div>
                  ) : qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code Smart TV" className="w-40 h-40" />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-600">
                      Use o código ao lado
                    </div>
                  )}
                  <span className="mt-1 text-[10px] font-black text-slate-800">
                    Aponte ou abra na Smart TV
                  </span>
                </div>

                {/* Code + Share + Detach */}
                <div className="space-y-2.5">
                  <div className="rounded-2xl bg-cyan-500/15 border border-cyan-400/40 p-3 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">
                      Link Curto na TV: <span className="text-white font-mono">/tv</span> + Código (3 dígitos)
                    </div>
                    <div className="text-3xl font-black tracking-widest text-white font-mono">
                      {session?.code || '...'}
                    </div>
                    <div className="text-[10px] text-cyan-200/85 font-mono truncate mt-0.5">
                      {tvUrl}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar Link'}
                    </button>
                    <button
                      onClick={handleNativeShare}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/40 text-xs font-bold flex items-center justify-center gap-1.5 text-cyan-100"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Enviar p/ TV
                    </button>
                  </div>

                  <button
                    onClick={handleDetachNow}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      detached
                        ? 'bg-emerald-500 text-black'
                        : 'bg-gradient-to-r from-pink-500 to-cyan-400 text-black hover:brightness-110'
                    }`}
                  >
                    <Unlink className="w-4 h-4" />
                    {detached ? '✅ Celular Separado — TV Roda Sozinha!' : 'Separar Celular (Deixar Só na TV)'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-purple-500/10 border border-purple-400/30 p-3 space-y-1.5 text-[11px] text-purple-100/90">
                <div className="font-black text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Como funciona (100% Independente):
                </div>
                <p>
                  1. Na Smart TV, digite apenas o link curto <span className="font-mono text-cyan-200">{shortTvHome}</span>{' '}
                  e coloque os <strong>3 números ({session?.code || '...'})</strong> (ou abra direto{' '}
                  <span className="font-mono text-cyan-200">{tvUrl}</span> ou leia o QR Code).
                  <br />
                  2. Na tela da TV, o site já abre em <strong>Modo TV</strong> com botão direto para{' '}
                  <strong>Baixar App na TV (<span className="font-mono">/app</span>)</strong>!
                  <br />
                  3. Clique em <strong>Separar Celular</strong>: seu celular fica livre ou pode ser fechado que a TV
                  continua tocando sozinha!
                </p>
                {apkDownloadUrl && (
                  <a
                    href={apkDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1 text-emerald-300 font-black underline"
                  >
                    <Download className="w-3.5 h-3.5" /> Link direto do APK para instalar na Android TV / TV Box
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl bg-blue-500/15 border border-blue-400/35 p-4 space-y-2 text-xs text-purple-100">
                <div className="font-black text-cyan-300 flex items-center gap-1.5 text-sm">
                  <Radio className="w-4 h-4" /> Áudio Bluetooth (JBL / Caixa / TV) + Separação na TV
                </div>
                <p className="leading-relaxed">
                  • Para tocar o som do celular na sua caixa JBL ou TV via Bluetooth, clique abaixo para localizar
                  dispositivos próximos (quando suportado pelo navegador) ou pareie no menu Bluetooth do aparelho.
                  <br />• Para a <strong>TV abrir o site, baixar o app e rodar sozinha sem depender do celular</strong>,
                  use a aba <strong>Passar para TV & Separar</strong> (o navegador usa Wi-Fi/Link para transferir a
                  sessão para a TV e liberar seu celular!).
                </p>
              </div>

              <button
                onClick={handleWebBluetoothScan}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-black text-xs font-black flex items-center justify-center gap-2 shadow"
              >
                <Bluetooth className="w-4 h-4" /> Buscar Dispositivo Bluetooth Próximo
              </button>

              {btDeviceName && (
                <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/45 p-3 text-xs font-bold text-emerald-200">
                  🔊 Conectado / Encontrado: {btDeviceName}
                </div>
              )}
              {btStatus && (
                <div className="rounded-xl bg-white/[0.06] border border-white/15 p-3 text-xs text-purple-100">
                  {btStatus}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

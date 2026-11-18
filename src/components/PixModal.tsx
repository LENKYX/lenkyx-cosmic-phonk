import React, { useEffect, useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Heart,
  Settings,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { AppSettings, AppMode, LiveStats } from '../types';
import { generatePixPayload, generatePixQrDataUrl } from '../utils/pix';
import { copyTextReliable } from '../utils/androidBridge';
import { authFetch } from '../utils/api';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: 'donate' | 'config';
  settings: AppSettings;
  mode: AppMode;
  liveStats?: LiveStats;
  onLiveStatsUpdated?: (stats: LiveStats) => void;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onToast: (msg: string) => void;
}

const PRESET_AMOUNTS = [
  { label: 'Livre', value: null },
  { label: 'R$ 5', value: 5 },
  { label: 'R$ 10', value: 10 },
  { label: 'R$ 25', value: 25 },
  { label: 'R$ 50', value: 50 },
  { label: 'R$ 100', value: 100 },
];

export const PixModal: React.FC<Props> = ({
  open,
  onClose,
  initialTab = 'donate',
  settings,
  mode,
  liveStats,
  onLiveStatsUpdated,
  onSaveSettings,
  onToast,
}) => {
  const [tab, setTab] = useState<'donate' | 'config'>(initialTab);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [payload, setPayload] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [pledging, setPledging] = useState(false);

  const [pixKey, setPixKey] = useState(settings.pixKey || '41651191808');
  const [pixName, setPixName] = useState(settings.pixName);
  const [pixCity, setPixCity] = useState(settings.pixCity);
  const [pixMessage, setPixMessage] = useState(settings.pixMessage);
  const [dailyGoalInput, setDailyGoalInput] = useState(String(liveStats?.dailyGoalBrl || 50));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(mode === 'creator' ? initialTab : 'donate');
    }
  }, [open, initialTab, mode]);

  useEffect(() => {
    setPixKey(settings.pixKey || '41651191808');
    setPixName(settings.pixName);
    setPixCity(settings.pixCity);
    setPixMessage(settings.pixMessage);
  }, [settings]);

  useEffect(() => {
    if (liveStats?.dailyGoalBrl) {
      setDailyGoalInput(String(liveStats.dailyGoalBrl));
    }
  }, [liveStats?.dailyGoalBrl]);

  const effectiveAmount = customAmount
    ? parseFloat(customAmount.replace(',', '.')) || null
    : selectedAmount;

  useEffect(() => {
    if (!open) return;
    const code = generatePixPayload({
      key: settings.pixKey || '41651191808',
      name: settings.pixName || 'LENKYX COSMIC PHONK',
      city: settings.pixCity || 'CAMPO GRANDE',
      amount: effectiveAmount && effectiveAmount > 0 ? effectiveAmount : null,
      txid: 'LENKYXPIX',
      description: 'APOIO VOLUNTARIO PIX LENKYX',
    });
    setPayload(code);
    generatePixQrDataUrl(code).then(setQrUrl).catch(() => {});
  }, [open, settings.pixKey, settings.pixName, settings.pixCity, effectiveAmount]);

  if (!open) return null;

  const goalBrl = liveStats?.dailyGoalBrl || 50;
  const collectedBrl = liveStats?.dailyCollectedBrl || 0;
  const goalPct = goalBrl > 0 ? Math.min(100, Math.round((collectedBrl / goalBrl) * 100)) : 0;

  const copyValue = async () => {
    const ok = await copyTextReliable(payload);
    if (ok) {
      setCopied(true);
      onToast('Código PIX (PicPay) copiado! Cole no seu banco.');
      setTimeout(() => setCopied(false), 2600);
    } else {
      onToast('Copie o código PIX exibido na tela.');
    }
  };

  const handleConfirmPixPledge = async () => {
    const amountVal = effectiveAmount && effectiveAmount > 0 ? effectiveAmount : 5;
    setPledging(true);
    try {
      const r = await fetch('/api/live-stats/pix-pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountVal,
          donorName: donorName.trim() || 'Apoiador LENKYX',
        }),
      });
      if (r.ok) {
        const updated: LiveStats = await r.json();
        onLiveStatsUpdated?.(updated);
        onToast(`Obrigado pelo apoio via PIX (R$ ${amountVal.toFixed(2)})! Meta diária atualizada.`);
      }
    } catch {
      onToast('Não foi possível registrar agora, mas seu PIX foi copiado!');
    } finally {
      setPledging(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) return;
    setSaving(true);
    try {
      await onSaveSettings({
        pixKey: pixKey.trim(),
        pixKeyConfigured: true,
        pixName: pixName.trim() || 'LENKYX COSMIC PHONK',
        pixCity: pixCity.trim() || 'CAMPO GRANDE',
        pixMessage: pixMessage.trim(),
      });
      const parsedGoal = Number(dailyGoalInput);
      if (Number.isFinite(parsedGoal) && parsedGoal >= 5) {
        const gr = await authFetch('/api/live-stats/pix-goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dailyGoalBrl: parsedGoal }),
        });
        if (gr.ok) {
          const st: LiveStats = await gr.json();
          onLiveStatsUpdated?.(st);
        }
      }
      onToast('Chave PIX e Meta Diária salvas!');
      setTab('donate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9996] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel neon-border overflow-hidden my-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500" />

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shrink-0">
                <QrCode className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-extrabold tracking-tight text-white">
                  APOIO EXCLUSIVO VIA PIX
                </h2>
                <p className="text-[11px] text-cyan-200/85">
                  Aceitamos somente PIX (PicPay) · 100% gratuito e sem anúncios
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {mode === 'creator' && (
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/5">
              <button
                onClick={() => setTab('donate')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  tab === 'donate'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'text-purple-200/70 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" /> Meta & QR Code PIX
              </button>
              <button
                onClick={() => setTab('config')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  tab === 'config'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'text-purple-200/70 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Configurar PIX & Meta
              </button>
            </div>
          )}

          {tab === 'donate' ? (
            <div className="space-y-3.5">
              {/* Real-Time Daily PIX Goal Card */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-950/55 via-[#0e0a24] to-pink-950/45 border border-emerald-400/35 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-emerald-300 flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> Meta Diária via PIX
                  </span>
                  <span className="font-mono text-white">
                    R$ {collectedBrl.toFixed(2)} / R$ {goalBrl.toFixed(2)} ({goalPct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/55 overflow-hidden border border-white/10">
                  <div
                    style={{ width: `${goalPct}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 transition-all duration-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>{liveStats?.dailyContributors || 0} apoios hoje</span>
                  <span>Reinicia automaticamente todo dia</span>
                </div>
              </div>

              <p className="text-xs text-slate-200/90 text-center leading-relaxed">
                {settings.pixMessage ||
                  'Este portal não exibe anúncios! Sua doação voluntária via PIX (PicPay) mantém o som, cinema e esportes ao vivo no ar.'}
              </p>

              {/* Preset Values */}
              <div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {PRESET_AMOUNTS.map((item) => {
                    const active = !customAmount && selectedAmount === item.value;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          setCustomAmount('');
                          setSelectedAmount(item.value);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          active
                            ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow-md'
                            : 'bg-white/8 hover:bg-white/15 text-slate-100 border border-white/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center gap-2 max-w-[210px] mx-auto">
                  <span className="text-xs text-cyan-300 font-semibold">Outro R$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.50"
                    placeholder="Ex: 15,00"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-500/35 text-sm text-white focus:outline-none focus:border-cyan-300"
                  />
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="p-2.5 rounded-2xl bg-white shadow-[0_0_35px_rgba(52,211,153,0.3)]">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Code PIX LENKYX" className="w-40 h-40 sm:w-44 sm:h-44 rounded-lg" />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-gray-500 text-xs">
                      Gerando QR...
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs font-bold text-white tracking-wide">
                    {settings.pixName} · PicPay (PIX)
                  </div>
                  <div className="text-[11px] text-emerald-300 font-mono font-bold">
                    Chave CPF: {settings.pixKey || '41651191808'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => void copyValue()}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'PIX Copiado! Cole no seu banco ou PicPay' : 'Copiar PIX Copia e Cola'}
              </button>

              {/* Register contribution in daily goal */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-200">
                  Já fez o PIX? Registre para somar na meta de hoje:
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Seu nome ou apelido (opcional)"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    disabled={pledging}
                    onClick={() => void handleConfirmPixPledge()}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1 shrink-0 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {pledging ? '...' : 'Confirmar PIX'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Chave PIX Oficial (PicPay / CPF)
                </label>
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Nome</label>
                  <input
                    type="text"
                    maxLength={25}
                    value={pixName}
                    onChange={(e) => setPixName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Cidade</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={pixCity}
                    onChange={(e) => setPixCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">Meta Diária (R$)</label>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    value={dailyGoalInput}
                    onChange={(e) => setDailyGoalInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-emerald-400/40 text-sm text-white focus:outline-none focus:border-emerald-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Mensagem de Apoio</label>
                <textarea
                  rows={2}
                  value={pixMessage}
                  onChange={(e) => setPixMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar PIX & Meta Diária'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

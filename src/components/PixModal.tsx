import React, { useEffect, useState } from 'react';
import { X, Copy, Check, QrCode, Heart, Settings, Sparkles, AlertTriangle } from 'lucide-react';
import { AppSettings, AppMode } from '../types';
import { generatePixPayload, generatePixQrDataUrl } from '../utils/pix';
import { copyTextReliable } from '../utils/androidBridge';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: 'donate' | 'config';
  settings: AppSettings;
  mode: AppMode;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onToast: (msg: string) => void;
}

const PRESET_AMOUNTS = [
  { label: 'Livre', value: null },
  { label: 'R$ 5', value: 5 },
  { label: 'R$ 10', value: 10 },
  { label: 'R$ 20', value: 20 },
  { label: 'R$ 50', value: 50 },
];

export const PixModal: React.FC<Props> = ({ open, onClose, initialTab = 'donate', settings, mode, onSaveSettings, onToast }) => {
  const [tab, setTab] = useState<'donate' | 'config'>(initialTab);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [payload, setPayload] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(mode === 'creator' ? initialTab : 'donate');
    }
  }, [open, initialTab, mode]);

  // Config form state
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [pixName, setPixName] = useState(settings.pixName);
  const [pixCity, setPixCity] = useState(settings.pixCity);
  const [pixMessage, setPixMessage] = useState(settings.pixMessage);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPixKey(settings.pixKey);
    setPixName(settings.pixName);
    setPixCity(settings.pixCity);
    setPixMessage(settings.pixMessage);
  }, [settings]);

  const effectiveAmount = customAmount ? parseFloat(customAmount.replace(',', '.')) || null : selectedAmount;

  useEffect(() => {
    if (!open) return;
    const code = generatePixPayload({
      key: settings.pixKey || 'lenkyx@pix.exemplo.com',
      name: settings.pixName || 'LENKYX',
      city: settings.pixCity || 'CAMPO GRANDE',
      amount: effectiveAmount && effectiveAmount > 0 ? effectiveAmount : null,
      txid: 'LENKYXAPP',
      description: 'APOIO LENKYX',
    });
    setPayload(code);
    generatePixQrDataUrl(code).then(setQrUrl).catch(() => {});
  }, [open, settings.pixKey, settings.pixName, settings.pixCity, effectiveAmount]);

  if (!open) return null;

  const handleCopy = async () => {
    const ok = await copyTextReliable(payload);
    if (ok) {
      setCopied(true);
      onToast('Código PIX Copia e Cola copiado!');
      setTimeout(() => setCopied(false), 2400);
    } else {
      onToast('Selecione e copie o código PIX abaixo.');
    }
  };

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) return;
    setSaving(true);
    try {
      await onSaveSettings({
        pixKey: pixKey.trim(),
        pixKeyConfigured: true,
        pixName: pixName.trim() || 'LENKYX',
        pixCity: pixCity.trim() || 'CAMPO GRANDE',
        pixMessage: pixMessage.trim(),
      });
      onToast('Chave PIX oficial salva! QR Code atualizado.');
      setTab('donate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl glass-panel neon-border overflow-hidden my-auto">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center shadow-lg neon-glow-pink">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-display text-lg font-extrabold tracking-wide neon-text">APOIE O LENKYX</h2>
                <p className="text-xs text-purple-200/75">Doação instantânea via PIX Oficial</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-purple-200 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {mode === 'creator' && (
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/5 mb-4">
              <button
                onClick={() => setTab('donate')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  tab === 'donate' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-purple-200/70 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" /> Ver QR Code PIX
              </button>
              <button
                onClick={() => setTab('config')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  tab === 'config' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-purple-200/70 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Configurar Minha Chave
              </button>
            </div>
          )}

          {tab === 'donate' ? (
            <div className="space-y-4">
              {!settings.pixKeyConfigured && mode === 'creator' && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-400/35 p-3 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong className="text-amber-100">Chave de demonstração ativa.</strong> Clique em{' '}
                    <button onClick={() => setTab('config')} className="underline font-bold text-white">
                      Configurar Minha Chave
                    </button>{' '}
                    para colocar seu PIX real (CPF, telefone, e-mail ou chave aleatória).
                  </div>
                </div>
              )}

              <p className="text-sm text-purple-100/90 text-center leading-relaxed">{settings.pixMessage}</p>

              {/* Amount selector */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-purple-300/70 mb-2 font-semibold text-center">
                  Escolha um valor de apoio
                </div>
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
                            ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-md'
                            : 'bg-white/8 hover:bg-white/15 text-purple-100 border border-white/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center gap-2 max-w-[200px] mx-auto">
                  <span className="text-xs text-purple-300 font-semibold">Outro R$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.50"
                    placeholder="Ex: 15,00"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* QR Code display */}
              <div className="flex flex-col items-center">
                <div className="p-3 rounded-2xl bg-white shadow-[0_0_35px_rgba(236,72,153,0.35)]">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Code PIX LENKYX" className="w-52 h-52 sm:w-56 sm:h-56 rounded-lg" />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-gray-500 text-xs">Gerando QR...</div>
                  )}
                </div>
                <div className="mt-2.5 text-center">
                  <div className="text-xs font-bold text-white tracking-wide">{settings.pixName}</div>
                  <div className="text-[11px] text-cyan-300 font-mono">{settings.pixKey}</div>
                </div>
              </div>

              {/* Copy PIX Copia e Cola */}
              <div className="space-y-2">
                <button
                  onClick={handleCopy}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'PIX Copiado! Cole no app do seu banco' : 'Copiar PIX Copia e Cola'}
                </button>
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[10px] font-mono text-purple-200/75 break-all max-h-16 overflow-y-auto">
                  {payload}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSavePix} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Sua Chave PIX Real (CPF, E-mail, Celular +55... ou Aleatória)
                </label>
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Ex: +5567999999999 ou seuemail@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Nome do Recebedor</label>
                  <input
                    type="text"
                    maxLength={25}
                    value={pixName}
                    onChange={(e) => setPixName(e.target.value)}
                    placeholder="LENKYX"
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
                    placeholder="CAMPO GRANDE"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Mensagem para os fãs</label>
                <textarea
                  rows={3}
                  value={pixMessage}
                  onChange={(e) => setPixMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Meu PIX & Gerar QR Oficial'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

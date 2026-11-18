import React, { useEffect, useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Heart,
  Settings,
  Sparkles,
  AlertTriangle,
  Coins,
  CreditCard,
  Bitcoin,
  Globe2,
  ArrowLeft,
} from 'lucide-react';
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

type PayMethod = 'pix' | 'crypto' | 'intl' | 'tokens';

const PRESET_AMOUNTS = [
  { label: 'Livre', value: null },
  { label: 'R$ 5', value: 5 },
  { label: 'R$ 10', value: 10 },
  { label: 'R$ 25', value: 25 },
  { label: 'R$ 50', value: 50 },
  { label: 'R$ 100', value: 100 },
];

const TOKEN_PACKS = [
  { tokens: 100, brl: 5, label: '100 Tokens Cósmicos' },
  { tokens: 500, brl: 20, label: '500 Tokens Supernova' },
  { tokens: 1200, brl: 45, label: '1.200 Tokens Galáxia' },
  { tokens: 3000, brl: 100, label: '3.000 Tokens Buraco Negro' },
];

export const PixModal: React.FC<Props> = ({
  open,
  onClose,
  initialTab = 'donate',
  settings,
  mode,
  onSaveSettings,
  onToast,
}) => {
  const [tab, setTab] = useState<'donate' | 'config'>(initialTab);
  const [method, setMethod] = useState<PayMethod>('pix');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedTokens, setSelectedTokens] = useState(TOKEN_PACKS[1]);
  const [payload, setPayload] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (open) {
      setTab(mode === 'creator' ? initialTab : 'donate');
    }
  }, [open, initialTab, mode]);

  // Creator Config form state (PIX/PicPay + Crypto + International)
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [pixName, setPixName] = useState(settings.pixName);
  const [pixCity, setPixCity] = useState(settings.pixCity);
  const [pixMessage, setPixMessage] = useState(settings.pixMessage);
  const [cryptoWallet, setCryptoWallet] = useState(settings.cryptoWallet || '');
  const [cryptoNetwork, setCryptoNetwork] = useState(settings.cryptoNetwork || 'USDT (TRC20 / BEP20 / Polygon) · BTC · SOL');
  const [intlPayUrl, setIntlPayUrl] = useState(settings.intlPayUrl || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPixKey(settings.pixKey);
    setPixName(settings.pixName);
    setPixCity(settings.pixCity);
    setPixMessage(settings.pixMessage);
    setCryptoWallet(settings.cryptoWallet || '');
    setCryptoNetwork(settings.cryptoNetwork || 'USDT (TRC20 / BEP20 / Polygon) · BTC · SOL');
    setIntlPayUrl(settings.intlPayUrl || '');
  }, [settings]);

  const effectiveAmount =
    method === 'tokens'
      ? selectedTokens.brl
      : customAmount
        ? parseFloat(customAmount.replace(',', '.')) || null
        : selectedAmount;

  useEffect(() => {
    if (!open) return;
    const code = generatePixPayload({
      key: settings.pixKey || 'lenkyx@pix.exemplo.com',
      name: settings.pixName || 'LENKYX',
      city: settings.pixCity || 'CAMPO GRANDE',
      amount: effectiveAmount && effectiveAmount > 0 ? effectiveAmount : null,
      txid: method === 'tokens' ? `LNX${selectedTokens.tokens}` : 'LENKYXAPP',
      description: method === 'tokens' ? `DOACAO ${selectedTokens.tokens} TOKENS` : 'DOACAO VOLUNTARIA LENKYX',
    });
    setPayload(code);
    generatePixQrDataUrl(code).then(setQrUrl).catch(() => {});
  }, [open, settings.pixKey, settings.pixName, settings.pixCity, effectiveAmount, method, selectedTokens.tokens]);

  if (!open) return null;

  const copyValue = async (val: string, key: string, msg: string) => {
    const ok = await copyTextReliable(val);
    if (ok) {
      setCopied(key);
      onToast(msg);
      setTimeout(() => setCopied(''), 2400);
    } else {
      onToast('Copie o código exibido na tela.');
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
        pixName: pixName.trim() || 'LENKYX',
        pixCity: pixCity.trim() || 'CAMPO GRANDE',
        pixMessage: pixMessage.trim(),
        cryptoWallet: cryptoWallet.trim(),
        cryptoNetwork: cryptoNetwork.trim(),
        intlPayUrl: intlPayUrl.trim(),
      });
      onToast('✅ PicPay / PIX, Cripto & Pagamento Global salvos!');
      setTab('donate');
    } finally {
      setSaving(false);
    }
  };

  const platformFeePct = 5;
  const amountNum = Number(effectiveAmount || 0);
  const feeValue = amountNum > 0 ? (amountNum * platformFeePct) / 100 : 0;

  return (
    <div className="fixed inset-0 z-[9996] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel neon-border overflow-hidden my-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />

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
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center shadow-lg neon-glow-pink shrink-0">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-extrabold tracking-wide neon-text">
                  APOIE O UNIVERSO LENKYX
                </h2>
                <p className="text-[11px] text-purple-200/80">
                  Doação voluntária e legal via PIX (PicPay), Cripto, Cartão Global ou Tokens
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
                <Heart className="w-3.5 h-3.5" /> Receber Doações
              </button>
              <button
                onClick={() => setTab('config')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  tab === 'config'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'text-purple-200/70 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Configurar PicPay / Cripto
              </button>
            </div>
          )}

          {tab === 'donate' ? (
            <div className="space-y-4">
              {!settings.pixKeyConfigured && mode === 'creator' && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-400/35 p-3 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong>Configure sua chave PicPay / PIX:</strong> Clique em{' '}
                    <button onClick={() => setTab('config')} className="underline font-bold text-white">
                      Configurar PicPay / Cripto
                    </button>{' '}
                    para colocar sua chave PIX real do PicPay, carteira Cripto e link internacional.
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'pix', label: 'PIX / PicPay', icon: <QrCode className="w-3.5 h-3.5" /> },
                    { id: 'tokens', label: 'Tokens', icon: <Coins className="w-3.5 h-3.5" /> },
                    { id: 'crypto', label: 'Cripto', icon: <Bitcoin className="w-3.5 h-3.5" /> },
                    { id: 'intl', label: 'Cartão/Global', icon: <CreditCard className="w-3.5 h-3.5" /> },
                  ] as { id: PayMethod; label: string; icon: React.ReactNode }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-black flex flex-col items-center gap-1 border transition ${
                      method === m.id
                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 border-emerald-200 text-black shadow'
                        : 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-purple-100'
                    }`}
                  >
                    {m.icon}
                    <span className="truncate max-w-full">{m.label}</span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-purple-100/90 text-center leading-relaxed">
                {settings.pixMessage ||
                  '100% gratuito e sem anúncios! Sua doação voluntária via PicPay (PIX) ajuda na manutenção do site e dos servidores.'}
              </p>

              {/* PIX / PicPay OR Tokens QR */}
              {(method === 'pix' || method === 'tokens') && (
                <div className="space-y-3">
                  {method === 'tokens' ? (
                    <div className="grid grid-cols-2 gap-2">
                      {TOKEN_PACKS.map((pk) => (
                        <button
                          key={pk.tokens}
                          onClick={() => setSelectedTokens(pk)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            selectedTokens.tokens === pk.tokens
                              ? 'bg-amber-500/25 border-amber-400 text-white'
                              : 'bg-white/[0.04] border-white/10 text-purple-200 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-xs font-black text-amber-300">🪙 {pk.label}</div>
                          <div className="text-[11px] font-bold text-white">Doação R$ {pk.brl},00</div>
                        </button>
                      ))}
                    </div>
                  ) : (
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
                                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-md'
                                  : 'bg-white/8 hover:bg-white/15 text-purple-100 border border-white/10'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 max-w-[210px] mx-auto">
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
                  )}

                  <div className="flex flex-col items-center">
                    <div className="p-2.5 rounded-2xl bg-white shadow-[0_0_35px_rgba(236,72,153,0.35)]">
                      {qrUrl ? (
                        <img src={qrUrl} alt="QR Code PIX LENKYX" className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg" />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-gray-500 text-xs">
                          Gerando QR...
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-xs font-bold text-white tracking-wide">
                        {settings.pixName} · PicPay / PIX
                      </div>
                      <div className="text-[11px] text-cyan-300 font-mono">{settings.pixKey}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => void copyValue(payload, 'pix', 'Código PIX / PicPay copiado!')}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
                  >
                    {copied === 'pix' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === 'pix' ? 'PIX Copiado! Cole no PicPay ou seu banco' : 'Copiar PIX Copia e Cola'}
                  </button>
                </div>
              )}

              {/* CRYPTO DONATION TAB */}
              {method === 'crypto' && (
                <div className="rounded-2xl bg-white/[0.05] border border-amber-400/30 p-4 space-y-3">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Bitcoin className="w-4 h-4" /> Doação via Criptomoeda (Global / Sem Fronteiras)
                  </div>
                  <p className="text-[11px] text-purple-200/80">{cryptoNetwork}</p>
                  {settings.cryptoWallet ? (
                    <>
                      <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-cyan-200 break-all">
                        {settings.cryptoWallet}
                      </div>
                      <button
                        onClick={() => void copyValue(settings.cryptoWallet!, 'crypto', 'Carteira Cripto copiada!')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-black flex items-center justify-center gap-1.5"
                      >
                        {copied === 'crypto' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied === 'crypto' ? 'Endereço Copiado!' : 'Copiar Carteira Cripto'}
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-purple-200/75 space-y-2">
                      <p>
                        O criador ainda não cadastrou a carteira Cripto.{' '}
                        {mode === 'creator'
                          ? 'Clique em "Configurar PicPay / Cripto" acima para inserir sua carteira USDT/BTC/SOL.'
                          : 'Use o PIX / PicPay na aba ao lado enquanto isso!'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* INTERNATIONAL CARD / PAYPAL / STRIPE TAB */}
              {method === 'intl' && (
                <div className="rounded-2xl bg-white/[0.05] border border-cyan-400/30 p-4 space-y-3">
                  <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4" /> Doação Internacional (Cartão, Apple Pay, PayPal)
                  </div>
                  {settings.intlPayUrl ? (
                    <a
                      href={settings.intlPayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-black flex items-center justify-center gap-2 shadow"
                    >
                      <CreditCard className="w-4 h-4" /> Abrir Link Oficial de Apoio Internacional
                    </a>
                  ) : (
                    <p className="text-xs text-purple-200/75">
                      {mode === 'creator'
                        ? 'Configure seu link oficial do PayPal / Stripe / Ko-fi / PicPay Internacional em "Configurar PicPay / Cripto".'
                        : 'No Brasil use a aba PIX / PicPay ou Cripto para apoiar instantaneamente.'}
                    </p>
                  )}
                </div>
              )}

              {/* Transparent 5% Platform Maintenance Notice */}
              <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-[10px] text-purple-200/75 leading-relaxed">
                💜 <strong>Doação 100% Voluntária & Transparente:</strong> Conforme os Termos da plataforma, repasses e apoios via tokens/plataformas destinam no mínimo <strong>5% ({amountNum > 0 ? `R$ ${feeValue.toFixed(2)}` : '5%'})</strong> para manutenção do servidor, banco de dados e desenvolvimento do app LENKYX.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Sua Chave PIX Oficial (PicPay, CPF, E-mail, Celular ou Aleatória)
                </label>
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Cole aqui sua chave PIX do PicPay"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-500/35 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Nome / Banco</label>
                  <input
                    type="text"
                    maxLength={25}
                    value={pixName}
                    onChange={(e) => setPixName(e.target.value)}
                    placeholder="LENKYX PICPAY"
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
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Carteira Cripto (USDT / BTC / ETH / SOL — opcional)
                </label>
                <input
                  type="text"
                  value={cryptoWallet}
                  onChange={(e) => setCryptoWallet(e.target.value)}
                  placeholder="Endereço da sua carteira cripto (ex: 0x... ou T...)"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-400/30 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Link Internacional (PayPal.me / Stripe / Ko-fi — opcional)
                </label>
                <input
                  type="url"
                  value={intlPayUrl}
                  onChange={(e) => setIntlPayUrl(e.target.value)}
                  placeholder="https://paypal.me/seunome ou link de pagamento global"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-cyan-400/30 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
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
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar PicPay, Cripto & Links Globais'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

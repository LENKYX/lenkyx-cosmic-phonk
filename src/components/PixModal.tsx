import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  HeartHandshake,
  Save,
  Target,
  Trophy,
  Crown,
  Heart,
  ShieldCheck,
  Clock,
  Upload,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AppMode, AppSettings, LiveStats } from '../types';
import { generatePixPayload, generatePixQrDataUrl } from '../utils/pix';
import { getLocalSupporterId } from '../utils/alienCollection';

interface PixModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'vip' | 'donate' | 'ranking' | 'config';
  settings: AppSettings;
  mode: AppMode;
  liveStats?: LiveStats;
  onLiveStatsUpdated?: (stats: LiveStats) => void;
  onSaveSettings: (patch: Partial<AppSettings>) => Promise<void>;
  onToast: (msg: string) => void;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];
const LS_DONOR_NAME = 'lenkyx_supporter_name_v1';

export const PixModal: React.FC<PixModalProps> = ({
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
  const [tab, setTab] = useState<'vip' | 'donate' | 'ranking' | 'config'>(initialTab);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState(() => {
    try {
      return localStorage.getItem(LS_DONOR_NAME) || '';
    } catch {
      return '';
    }
  });
  const [pledging, setPledging] = useState(false);
  const [e2eId, setE2eId] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [pendingPledges, setPendingPledges] = useState<
    { id: string; amount: number; donorName: string; e2eId?: string; createdAt: string }[]
  >([]);
  const [creatorPendingList, setCreatorPendingList] = useState<
    {
      id: string;
      amount: number;
      donorName: string;
      e2eId?: string;
      txid?: string;
      receiptDataUrl?: string;
      createdAt: string;
    }[]
  >([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [sessionTxid] = useState(() => `LX${Date.now().toString(36).toUpperCase().slice(-10)}`);
  const [pledgedFeedback, setPledgedFeedback] = useState<{
    amount: number;
    donorName: string;
  } | null>(null);

  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Creator daily goal settings
  const [dailyGoalInput, setDailyGoalInput] = useState(String(liveStats?.dailyGoalBrl || 50));
  const [dailyCollectedInput, setDailyCollectedInput] = useState(String(liveStats?.dailyCollectedBrl || 0));
  const [pixKey, setPixKey] = useState(settings.pixKey || '41651191808');
  const [pixName, setPixName] = useState(settings.pixName || 'LENKYX COSMIC PHONK');
  const [pixCity, setPixCity] = useState(settings.pixCity || 'CAMPO GRANDE');
  const [pixMessage, setPixMessage] = useState(settings.pixMessage);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    setPixKey(settings.pixKey || '41651191808');
    setPixName(settings.pixName || 'LENKYX COSMIC PHONK');
    setPixCity(settings.pixCity || 'CAMPO GRANDE');
    setPixMessage(settings.pixMessage);
  }, [settings]);

  useEffect(() => {
    if (liveStats) {
      setDailyGoalInput(String(liveStats.dailyGoalBrl));
      setDailyCollectedInput(String(liveStats.dailyCollectedBrl));
    }
  }, [liveStats]);

  useEffect(() => {
    if (donorName.trim()) {
      try {
        localStorage.setItem(LS_DONOR_NAME, donorName.trim());
      } catch {
        // ignore
      }
    }
  }, [donorName]);

  const effectiveAmount = useMemo(() => {
    if (customAmount.trim()) {
      const n = parseFloat(customAmount.replace(',', '.'));
      return Number.isFinite(n) && n > 0 ? Math.min(n, 50000) : null;
    }
    return selectedAmount;
  }, [customAmount, selectedAmount]);

  const effectivePixKey = (settings.pixKey || '41651191808').trim();

  // ===== VIP MORRO GOLD · assinatura via PIX (receita recorrente) =====
  const [vipPlanSel, setVipPlanSel] = useState<'mensal' | 'anual'>('anual');
  const [vipQrUrl, setVipQrUrl] = useState('');
  const [vipCopied, setVipCopied] = useState(false);
  const [vipPaid, setVipPaid] = useState(false);
  const [vipEmail, setVipEmail] = useState(() => localStorage.getItem('mg_vip_email') || '');
  const [vipAutoBusy, setVipAutoBusy] = useState(false);
  const [mpTokenDraft, setMpTokenDraft] = useState(settings.mpAccessToken || '');
  const [mural, setMural] = useState<Array<{ ref: string; name: string; since: string }>>([]);
  useEffect(() => {
    fetch('/api/payments/supporters')
      .then((r) => r.json())
      .then((d) => setMural(Array.isArray(d?.supporters) ? d.supporters : []))
      .catch(() => {});
  }, []);
  const [sbUrlDraft, setSbUrlDraft] = useState(settings.supabaseUrl || '');
  const [sbKeyDraft, setSbKeyDraft] = useState(settings.supabaseAnonKey || '');
  const vipAmount = vipPlanSel === 'anual' ? 99.9 : 14.9;
  const vipPayload = useMemo(() => {
    return generatePixPayload({
      key: effectivePixKey,
      name: settings.pixName || 'MORRO GOLD',
      city: settings.pixCity || 'CAMPO GRANDE',
      amount: vipAmount,
      txid: 'VIP' + sessionTxid,
      description: 'MORRO GOLD VIP',
    });
  }, [effectivePixKey, settings.pixName, settings.pixCity, vipAmount, sessionTxid]);

  useEffect(() => {
    if (!open || tab !== 'vip' || !vipPayload) {
      setVipQrUrl('');
      return;
    }
    let cancelled = false;
    void generatePixQrDataUrl(vipPayload).then((url) => {
      if (!cancelled) setVipQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, tab, vipPayload]);

  // Confere no servidor se a assinatura automática (Mercado Pago) já está ativa
  useEffect(() => {
    if (!open) return;
    let ref = 'guest';
    try {
      ref = localStorage.getItem('mg_device_id') || 'guest';
    } catch {
      /* ignore */
    }
    fetch(`/api/payments/vip-status?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.active && !settings.vipActive) {
          void onSaveSettings({
            vipActive: true,
            vipPlan: d.plan === 'anual' ? 'anual' : 'mensal',
            vipUntil: d.until,
          });
          onToast('👑 VIP ativo na sua conta!');
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const vipActiveNow = Boolean(settings.vipActive && settings.vipUntil && new Date(settings.vipUntil).getTime() > Date.now());

  // Discreet description for the bank PIX receipt ("Apoio Social LENKYX")
  const pixPayload = useMemo(() => {
    return generatePixPayload({
      key: effectivePixKey,
      name: settings.pixName || 'LENKYX',
      city: settings.pixCity || 'CAMPO GRANDE',
      amount: effectiveAmount,
      txid: sessionTxid,
      description: 'Apoio Social LENKYX',
    });
  }, [effectivePixKey, settings.pixName, settings.pixCity, effectiveAmount, sessionTxid]);

  // Poll supporter verification status when PIX is confirmed
  useEffect(() => {
    if (!open) return;
    const supporterId = getLocalSupporterId();
    const checkStatus = async () => {
      try {
        const r = await fetch(`/api/live-stats/pix-status?supporterId=${encodeURIComponent(supporterId)}`);
        if (!r.ok) return;
        const d = await r.json();
        if (Array.isArray(d.pending)) setPendingPledges(d.pending);
        if (Array.isArray(d.approved) && d.approved.length > 0 && !pledgedFeedback) {
          const latest = d.approved[0];
          setPledgedFeedback({
            amount: Number(latest.amount || 10),
            donorName: String(latest.donorName || donorName || 'Apoiador'),
          });
        }
      } catch {
        // ignore
      }
    };
    void checkStatus();
    const iv = window.setInterval(() => void checkStatus(), 5000);
    return () => window.clearInterval(iv);
  }, [open, donorName, pledgedFeedback]);

  // Load creator pending PIX queue
  useEffect(() => {
    if (!open || mode !== 'creator') return;
    const loadPending = async () => {
      try {
        const r = await fetch('/api/live-stats/pix-pending');
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d.pending)) setCreatorPendingList(d.pending);
        }
      } catch {
        // ignore
      }
    };
    void loadPending();
  }, [open, mode, tab]);

  useEffect(() => {
    if (!open || !pixPayload) {
      setQrUrl('');
      return;
    }
    let cancelled = false;
    void generatePixQrDataUrl(pixPayload).then((url) => {
      if (!cancelled) setQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, pixPayload]);

  if (!open) return null;

  const dailyGoal = liveStats?.dailyGoalBrl || 50;
  const dailyCollected = liveStats?.dailyCollectedBrl || 0;
  const pct = dailyGoal > 0 ? Math.min(100, Math.round((dailyCollected / dailyGoal) * 100)) : 0;
  const leaderboard = liveStats?.leaderboard || [];

  const handleCopy = async (text: string, which: 'key' | 'payload') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
        onToast('Chave PIX PicPay copiada!');
      } else {
        setCopiedPayload(true);
        setTimeout(() => setCopiedPayload(false), 2000);
        onToast('Código PIX Copia e Cola copiado!');
      }
    } catch {
      onToast('Copie manualmente o código exibido.');
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      onToast('Escolha uma imagem de comprovante menor que 1,5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptDataUrl(reader.result);
        setReceiptFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPledge = async () => {
    const val = effectiveAmount || 10;
    const cleanName = donorName.trim() || 'Apoiador Anônimo';
    const cleanE2e = e2eId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^E[A-Z0-9]{20,40}$/.test(cleanE2e) && !receiptDataUrl) {
      onToast('Faça o PIX primeiro e informe o ID da Transação (E...) ou anexe o comprovante!');
      return;
    }
    setPledging(true);
    try {
      const r = await fetch('/api/live-stats/pix-pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          donorName: cleanName,
          supporterId: getLocalSupporterId(),
          e2eId: cleanE2e,
          txid: sessionTxid,
          receiptDataUrl,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro ao registrar comprovante PIX');

      setPendingPledges((prev) => [
        { id: data.pledgeId, amount: val, donorName: cleanName, e2eId: cleanE2e, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setE2eId('');
      setReceiptDataUrl('');
      setReceiptFileName('');
      onToast('⏳ Comprovante enviado! O apoio será confirmado após a conferência do PIX.');
    } catch (e) {
      onToast(String(e instanceof Error ? e.message : e));
    } finally {
      setPledging(false);
    }
  };

  const handleVerifyPix = async (pledgeId: string, action: 'approve' | 'reject') => {
    setVerifyingId(pledgeId);
    try {
      const r = await fetch('/api/live-stats/pix-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pledgeId, action }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro na verificação');
      setCreatorPendingList(Array.isArray(data.pending) ? data.pending : []);
      onLiveStatsUpdated?.(data);
      onToast(action === 'approve' ? '✅ PIX confirmado no ranking!' : '❌ Comprovante recusado.');
    } catch (e) {
      onToast(String(e instanceof Error ? e.message : e));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings({
        pixKey: pixKey.trim() || '41651191808',
        pixName: pixName.trim() || 'LENKYX COSMIC PHONK',
        pixCity: pixCity.trim() || 'CAMPO GRANDE',
        pixMessage: pixMessage.trim(),
      });
      const r = await fetch('/api/live-stats/pix-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyGoalBrl: Number(dailyGoalInput) || 50,
          dailyCollectedBrl: Number(dailyCollectedInput) || 0,
        }),
      });
      if (r.ok) {
        const st = await r.json();
        onLiveStatsUpdated?.(st);
      }
      onToast('Meta diária e chave PIX atualizadas!');
      setTab('donate');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto rounded-[28px] cosmic-card-3d neon-border overflow-hidden bg-[#0a051a]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/15 via-pink-500/15 to-cyan-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-black flex items-center justify-center shadow">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-sm sm:text-base font-black text-white">
                PIX Solidário · LENKYX Sem Anúncios
              </h2>
              <p className="text-[11px] text-emerald-300 font-bold">
                Exclusivamente PIX (PicPay) · Apoio Solidário Brasil & Plataforma Gratuita
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-3 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setTab('vip')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition ${
              tab === 'vip'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow'
                : 'bg-white/[0.06] text-slate-200 hover:bg-white/15'
            }`}
          >
            👑 Seja VIP
          </button>
          <button
            onClick={() => setTab('donate')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition ${
              tab === 'donate'
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow'
                : 'bg-white/[0.06] text-slate-200 hover:bg-white/15'
            }`}
          >
            💚 Doar PIX (QR)
          </button>
          <button
            onClick={() => setTab('ranking')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition flex items-center gap-1 ${
              tab === 'ranking'
                ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-black shadow'
                : 'bg-white/[0.06] text-slate-200 hover:bg-white/15'
            }`}
          >
            <Trophy className="w-3 h-3" /> Ranking ({leaderboard.length})
          </button>
          {mode === 'creator' && (
            <button
              onClick={() => setTab('config')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition ${
                tab === 'config'
                  ? 'bg-pink-500 text-white shadow'
                  : 'bg-white/[0.06] text-slate-200 hover:bg-white/15'
              }`}
            >
              ⚙️ Meta {creatorPendingList.length > 0 ? `(${creatorPendingList.length} PIX)` : ''}
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[78dvh] overflow-y-auto">
          {tab === 'vip' && (
            <div className="space-y-3.5">
              {vipActiveNow ? (
                <div className="rounded-2xl bg-gradient-to-r from-amber-400/20 via-yellow-500/10 to-black border border-amber-400/50 p-4 space-y-1.5">
                  <div className="text-sm font-black lux-gold-text">👑 VOCÊ É DA REALEZA · VIP MORRO GOLD</div>
                  <div className="text-[11px] text-amber-100">
                    Plano {settings.vipPlan === 'anual' ? 'Anual' : 'Mensal'} ativo até{' '}
                    {settings.vipUntil ? new Date(settings.vipUntil).toLocaleDateString('pt-BR') : ''}.
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Zero anúncios · selo dourado · suporte prioritário · sorteios VIP. Valeu por fortalecer o MORRO GOLD! 💛
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-black border border-amber-400/50 p-3.5 space-y-1.5">
                    <div className="text-xs font-black text-amber-200">👑 SEJA VIP MORRO GOLD</div>
                    <p className="text-[11px] text-slate-200">
                      Entra pra realeza da favela VIP: sem anúncios, selo dourado, suporte prioritário e participação nos
                      sorteios. Pagamento único no PIX, sem cartão e sem burocracia.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['mensal', 'MENSAL', 'R$ 14,90', 'por mês', 'Cancele quando quiser'],
                      ['anual', 'ANUAL', 'R$ 99,90', 'por ano', 'Economize 44% (R$ 8,32/mês)'],
                    ] as const).map(([id, name, price, per, note]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setVipPlanSel(id)}
                        className={`rounded-2xl p-3 text-left border transition ${
                          vipPlanSel === id
                            ? 'border-amber-400 bg-amber-400/15 shadow-[0_0_18px_rgba(251,191,36,0.25)]'
                            : 'border-white/10 bg-white/[0.04]'
                        }`}
                      >
                        <div className="text-[9px] font-black tracking-[0.2em] text-amber-300">{name}</div>
                        <div className="text-lg font-black lux-gold-text leading-tight">{price}</div>
                        <div className="text-[9px] text-slate-300">{per}</div>
                        <div className="text-[9px] text-emerald-300 font-bold mt-1">{note}</div>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-black/40 border border-white/10 p-3 grid grid-cols-2 gap-1.5 text-[10px] text-slate-100">
                    {mural.length > 0 && (
                      <div className="rounded-2xl border border-amber-400/30 bg-black/40 p-3">
                        <div className="text-[10px] font-black text-amber-300 mb-1.5">🏆 MURAL DOS APOIADORES · A REALEZA DO MORRO GOLD</div>
                        <div className="flex flex-wrap gap-1.5">
                          {mural.slice(0, 24).map((m) => (
                            <span key={m.ref || m.name} className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-200 text-[9px] font-bold">👑 {m.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {['🚫 Zero anúncios pra sempre', '👑 Selo VIP dourado', '🎵 Música exclusiva VIP', '⚡ Acesso antecipado', '🏆 Ranking VIP & Mural dos Apoiadores', '🎁 Sorteios do Morro Gold'].map((b) => (
                      <div key={b}>{b}</div>
                    ))}
                  </div>

                  {Boolean(settings.mpAccessToken) && (
                    <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/40 p-3 space-y-2">
                      <div className="text-[10px] font-black text-emerald-300">
                        💳 ASSINATURA AUTOMÁTICA · CARTÃO OU PIX · RENOVA SOZINHO
                      </div>
                      <input
                        value={vipEmail}
                        onChange={(e) => setVipEmail(e.target.value)}
                        placeholder="Seu e-mail pra receber o comprovante"
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-400"
                      />
                      <button
                        type="button"
                        disabled={vipAutoBusy || !vipEmail.trim()}
                        onClick={async () => {
                          setVipAutoBusy(true);
                          try {
                            localStorage.setItem('mg_vip_email', vipEmail.trim());
                            let ref = 'guest';
                            try {
                              ref = localStorage.getItem('mg_device_id') || 'guest';
                            } catch {
                              /* ignore */
                            }
                            const r = await fetch('/api/payments/preapproval', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ plan: vipPlanSel, amount: vipAmount, email: vipEmail.trim(), ref }),
                            });
                            const d = await r.json();
                            if (d?.init_point) {
                              window.location.href = d.init_point;
                              return;
                            }
                            onToast('⚠️ Não deu pra abrir a cobrança automática — use o PIX manual abaixo.');
                          } catch {
                            onToast('⚠️ Erro ao contactar o Mercado Pago.');
                          }
                          setVipAutoBusy(false);
                        }}
                        className="w-full py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black disabled:opacity-50"
                      >
                        {vipAutoBusy ? 'Abrindo...' : '💳 Assinar agora (renova sozinho)'}
                      </button>
                      <div className="text-[8px] text-slate-400">
                        Processado pelo Mercado Pago · cancele quando quiser · o VIP ativa sozinho após o pagamento.
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl bg-white/[0.04] border border-amber-400/30 p-3 space-y-2">
                    <div className="text-[10px] font-black text-amber-200">
                      PIX Copia e Cola · {vipPlanSel === 'anual' ? 'R$ 99,90/ano' : 'R$ 14,90/mês'}
                    </div>
                    <div className="flex gap-2">
                      {vipQrUrl ? (
                        <img src={vipQrUrl} alt="QR PIX VIP" className="w-24 h-24 rounded-xl bg-white p-1" />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-white/10 animate-pulse" />
                      )}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="text-[9px] text-slate-300 break-all line-clamp-3">{vipPayload}</div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(vipPayload);
                            } catch {
                              /* ignore */
                            }
                            setVipCopied(true);
                            onToast('📋 Código PIX copiado!');
                            window.setTimeout(() => setVipCopied(false), 2500);
                          }}
                          className="w-full py-2 rounded-full lux-btn-gold text-[11px] font-black"
                        >
                          {vipCopied ? '✓ Copiado!' : '📋 Copiar código PIX'}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void onSaveSettings({
                          vipActive: true,
                          vipPlan: vipPlanSel,
                          vipUntil: new Date(Date.now() + (vipPlanSel === 'anual' ? 365 : 30) * 86400000).toISOString(),
                        });
                        onToast('👑 BEM-VINDO À REALEZA! Seu VIP MORRO GOLD está ativo!');
                        setVipPaid(true);
                      }}
                      className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-black"
                    >
                      ✅ Já paguei — ativar meu VIP
                    </button>
                    {vipPaid && <div className="text-[9px] text-emerald-300">Pagamento registrado! Seu VIP já está valendo. 💛</div>}
                    <div className="text-[8px] text-slate-400 leading-relaxed">
                      Após o PIX, toque em ativar — o comprovante fica registrado no app (aba Ranking & Apoio). Renovação pelo
                      mesmo código quando o plano vencer.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {tab === 'donate' && (
            <>
              {/* Real-Time Daily PIX Goal Progress Card */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-pink-500/15 border border-emerald-400/35 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Target className="w-4 h-4" /> META DIÁRIA VIA PIX
                  </span>
                  <span className="font-mono text-white">
                    R$ {dailyCollected.toFixed(2).replace('.', ',')} / R$ {dailyGoal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-black/60 border border-white/10 overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 transition-all duration-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-200/85">
                  <span>{pct}% da meta diária alcançada</span>
                  <span>
                    {liveStats?.dailyContributors || 0}{' '}
                    {(liveStats?.dailyContributors || 0) === 1 ? 'apoio hoje' : 'apoios hoje'}
                  </span>
                </div>
              </div>

                  {/* Post-Donation Gratitude Screen */}
              {pledgedFeedback ? (
                <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 via-[#0d0724] to-amber-500/15 border border-emerald-400/50 p-5 space-y-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400 text-black text-[11px] font-black">
                    <Heart className="w-3.5 h-3.5 fill-black" /> DOAÇÃO CONFIRMADA · R$ {pledgedFeedback.amount.toFixed(2).replace('.', ',')}
                  </div>

                  <h3 className="font-display text-lg font-black text-white leading-snug">
                    Obrigado de coração, {pledgedFeedback.donorName}! 🙏
                  </h3>

                  <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed bg-black/35 rounded-2xl p-3.5 border border-emerald-400/25">
                    Sua ajuda fortalece a plataforma no Brasil e ajuda a apoiar ações solidárias e manter o LENKYX 100% gratuito e sem anúncios!
                    <br />
                    <span className="text-[11px] text-slate-300 block mt-1.5">
                      🔒 No comprovante enviado para o seu banco vai de uma forma bem discreta para sua privacidade.
                    </span>
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTab('ranking')}
                      className="py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4" /> Ver Ranking
                    </button>
                    <button
                      onClick={() => setPledgedFeedback(null)}
                      className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs"
                    >
                      Voltar ao QR PIX
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Value & Supporter Name */}
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-purple-200/80 block mb-1">
                          Seu nome no Ranking de Apoio
                        </label>
                        <input
                          type="text"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          placeholder="Seu nome ou apelido..."
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-purple-200/80 block mb-1">
                          Ou digite outro valor (R$)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Ex: 15,00"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {PRESET_AMOUNTS.map((val) => {
                        const active = !customAmount && selectedAmount === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setCustomAmount('');
                              setSelectedAmount(val);
                            }}
                            className={`py-2 rounded-xl text-xs font-extrabold transition ${
                              active
                                ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow-lg'
                                : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white'
                            }`}
                          >
                            R$ {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* QR Code + Key */}
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-40 h-40 rounded-2xl bg-white p-2 shadow-xl shrink-0 flex items-center justify-center">
                      {qrUrl ? (
                        <img src={qrUrl} alt="QR Code PIX LENKYX" className="w-full h-full object-contain" />
                      ) : (
                        <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2.5 text-center sm:text-left">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-[10px] font-black text-emerald-200">
                        <Heart className="w-3 h-3" /> Apoio Solidário · Ranking Brasil
                      </div>

                      <div className="rounded-xl bg-black/45 border border-white/10 p-2.5 space-y-1">
                        <div className="text-[10px] text-slate-300/75 font-bold uppercase">
                          Chave PIX (PicPay · CPF)
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-black text-emerald-300 select-all">
                            {effectivePixKey}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopy(effectivePixKey, 'key')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 text-[11px] font-bold flex items-center gap-1"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedKey ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleCopy(pixPayload, 'payload')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition"
                      >
                        {copiedPayload ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedPayload ? 'Código Copia e Cola Copiado!' : 'Copiar PIX Copia e Cola'}
                      </button>
                    </div>
                  </div>

                  {/* Verified PIX Proof Submission */}
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Confirmação Real de PIX
                      </span>
                      <span className="text-[9px] font-mono text-slate-300">TXID {sessionTxid}</span>
                    </div>

                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      🙏 Faça o PIX pelo QR Code ou Copia e Cola acima. Seu nome entra no Ranking{' '}
                      <strong>após enviar o ID E2E ou comprovante</strong> e o pagamento ser conferido.
                    </p>

                    {pendingPledges.length > 0 && (
                      <div className="rounded-xl bg-amber-500/15 border border-amber-400/40 p-2.5 space-y-1">
                        <div className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> PIX em conferência ({pendingPledges.length})
                        </div>
                        {pendingPledges.slice(0, 2).map((p) => (
                          <div key={p.id} className="text-[10px] text-amber-100 flex items-center justify-between">
                            <span>
                              R$ {p.amount.toFixed(2).replace('.', ',')} · {p.e2eId || 'Comprovante anexado'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 font-bold">
                              Aguardando
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-emerald-200 block mb-1">
                          ID da Transação PIX (começa com E...)
                        </label>
                        <input
                          type="text"
                          value={e2eId}
                          onChange={(e) => setE2eId(e.target.value)}
                          placeholder="Ex: E2289643120261119..."
                          className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/15 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-emerald-200 block mb-1">
                          Ou anexe o print do comprovante PIX
                        </label>
                        <label className="w-full px-3 py-2 rounded-xl bg-black/45 border border-dashed border-emerald-400/45 hover:border-emerald-300 text-xs text-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer truncate">
                          <Upload className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{receiptFileName || 'Enviar foto do comprovante'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReceiptUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={pledging || (!e2eId.trim() && !receiptDataUrl)}
                      onClick={() => void handleConfirmPledge()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      {pledging
                        ? 'Enviando comprovante...'
                        : `Enviar Comprovante PIX (R$ ${(effectiveAmount || 10).toFixed(0)})`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* RANKING DE APOIADORES */}
          {tab === 'ranking' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-cyan-500/15 border border-amber-400/30 p-3 text-center">
                <div className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5">
                  <Crown className="w-4 h-4" /> CLASSIFICAÇÃO OFICIAL DE APOIADORES
                </div>
                <p className="text-[11px] text-slate-200/80 mt-0.5">
                  Quem mais contribui aparece no topo com o valor apoiado!
                </p>
              </div>

              {leaderboard.length === 0 ? (
                <div className="py-10 text-center rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <Trophy className="w-10 h-10 text-amber-300/60 mx-auto" />
                  <p className="text-xs text-slate-300">
                    Seja o #1 no topo da classificação fazendo o primeiro apoio via PIX hoje!
                  </p>
                  <button
                    onClick={() => setTab('donate')}
                    className="px-4 py-2 rounded-full bg-emerald-400 text-black text-xs font-black"
                  >
                    Apoiar Agora
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((sup, idx) => (
                    <div
                      key={sup.id || `${sup.name}-${idx}`}
                      className={`rounded-2xl p-3 border flex items-center justify-between gap-3 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-400/50'
                          : idx === 1
                            ? 'bg-white/[0.07] border-slate-300/35'
                            : idx === 2
                              ? 'bg-orange-500/10 border-orange-400/35'
                              : 'bg-white/[0.04] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-black'
                              : idx === 1
                                ? 'bg-slate-200 text-black'
                                : idx === 2
                                  ? 'bg-orange-400 text-black'
                                  : 'bg-white/10 text-white'
                          }`}
                        >
                          {idx === 0 ? '👑' : `#${idx + 1}`}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">{sup.name}</div>
                          <div className="text-[10px] text-slate-300/75">
                            {sup.donationsCount} {sup.donationsCount === 1 ? 'apoio' : 'apoios'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 font-mono text-xs font-black text-emerald-300">
                          R$ {Number(sup.totalBrl || 0).toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREATOR PIX CONFIG & REAL PAYMENT VERIFICATION QUEUE */}
          {tab === 'config' && mode === 'creator' && (
            <div className="space-y-4">
              {/* COBRANÇA AUTOMÁTICA + NUVEM */}
              <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/35 p-3 space-y-2.5">
                <div className="text-xs font-black text-cyan-200">
                  💳 Cobrança Automática (Mercado Pago) · ☁️ Nuvem (Supabase)
                </div>
                <p className="text-[10px] text-slate-300">
                  Cole as credenciais das suas contas. O passo a passo está no arquivo GUIA-CONFIGURACAO-PAGAMENTOS-NUVEM.md.
                </p>
                <input
                  value={mpTokenDraft}
                  onChange={(e) => setMpTokenDraft(e.target.value)}
                  placeholder="Mercado Pago · Access Token (APP_USR-...)"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-400"
                />
                <input
                  value={sbUrlDraft}
                  onChange={(e) => setSbUrlDraft(e.target.value)}
                  placeholder="Supabase · Project URL (https://xxxx.supabase.co)"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-400"
                />
                <input
                  value={sbKeyDraft}
                  onChange={(e) => setSbKeyDraft(e.target.value)}
                  placeholder="Supabase · anon public key"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await onSaveSettings({
                      mpAccessToken: mpTokenDraft.trim(),
                      supabaseUrl: sbUrlDraft.trim(),
                      supabaseAnonKey: sbKeyDraft.trim(),
                    });
                    onToast('💳☁️ Credenciais salvas! Cobrança automática e nuvem liberadas.');
                  }}
                  className="w-full py-2 rounded-full lux-btn-gold text-xs font-black"
                >
                  Salvar credenciais
                </button>
              </div>
              <div className="rounded-2xl bg-amber-500/10 border border-amber-400/35 p-3 space-y-2.5">
                <div className="text-xs font-black text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Conferir PIX Recebidos ({creatorPendingList.length})
                  </span>
                </div>
                {creatorPendingList.length === 0 ? (
                  <p className="text-[11px] text-slate-300">
                    Nenhum comprovante PIX pendente no momento.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {creatorPendingList.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-black/45 border border-white/15 p-2.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="font-black text-white">
                              {item.donorName} · R$ {Number(item.amount).toFixed(2).replace('.', ',')}
                            </div>
                            <div className="text-[10px] font-mono text-cyan-300">
                              {item.e2eId || 'Sem E2E (ver imagem)'} · TX {item.txid || '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={verifyingId === item.id}
                              onClick={() => void handleVerifyPix(item.id, 'approve')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black text-[10px] font-black flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                            </button>
                            <button
                              type="button"
                              disabled={verifyingId === item.id}
                              onClick={() => void handleVerifyPix(item.id, 'reject')}
                              className="px-2 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500 text-rose-200 hover:text-white text-[10px] font-black flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Recusar
                            </button>
                          </div>
                        </div>
                        {item.receiptDataUrl && (
                          <img
                            src={item.receiptDataUrl}
                            alt="Comprovante PIX"
                            className="w-full max-h-36 object-contain rounded-lg bg-black border border-white/10"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-emerald-300 block mb-1">Meta Diária (R$)</label>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    value={dailyGoalInput}
                    onChange={(e) => setDailyGoalInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-cyan-300 block mb-1">Arrecadado Hoje (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={dailyCollectedInput}
                    onChange={(e) => setDailyCollectedInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-purple-200 block mb-1">Chave PIX (PicPay CPF)</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-purple-200 block mb-1">Recebedor</label>
                  <input
                    type="text"
                    value={pixName}
                    onChange={(e) => setPixName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-purple-200 block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={pixCity}
                    onChange={(e) => setPixCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Meta & Chave PIX'}
              </button>
            </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

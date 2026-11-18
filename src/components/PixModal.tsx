import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  HeartHandshake,
  Save,
  Target,
  Sparkles,
  Trophy,
  Crown,
  Gift,
  Heart,
} from 'lucide-react';
import { AppMode, AppSettings, LiveStats } from '../types';
import { generatePixPayload, generatePixQrDataUrl } from '../utils/pix';
import {
  getCosmicMascotById,
  getLocalSupporterId,
  loadOwnedMascotIds,
  saveOwnedMascotIds,
} from '../utils/alienCollection';
import { CosmicMascotBadge } from './CosmicMascotBadge';

interface PixModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'donate' | 'ranking' | 'collection' | 'config';
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
  const [tab, setTab] = useState<'donate' | 'ranking' | 'collection' | 'config'>(initialTab);
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
  const [pledgedFeedback, setPledgedFeedback] = useState<{
    amount: number;
    mascotId: number;
    donorName: string;
  } | null>(null);
  const [ownedMascots, setOwnedMascots] = useState<number[]>(() => loadOwnedMascotIds());

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

  // Discreet description for the bank PIX receipt ("Apoio Social LENKYX")
  const pixPayload = useMemo(() => {
    return generatePixPayload({
      key: effectivePixKey,
      name: settings.pixName || 'LENKYX',
      city: settings.pixCity || 'CAMPO GRANDE',
      amount: effectiveAmount,
      txid: 'LENKYXSOCIAL',
      description: 'Apoio Social LENKYX',
    });
  }, [effectivePixKey, settings.pixName, settings.pixCity, effectiveAmount]);

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

  const handleConfirmPledge = async () => {
    const val = effectiveAmount || 10;
    const cleanName = donorName.trim() || 'Apoiador Anônimo';
    setPledging(true);
    try {
      const r = await fetch('/api/live-stats/pix-pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          donorName: cleanName,
          supporterId: getLocalSupporterId(),
          ownedMascots,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro ao registrar apoio');

      const unlockedId = Number(data.unlockedMascotId || Math.floor(Math.random() * 1000) + 1);
      const nextOwned = saveOwnedMascotIds([...ownedMascots, unlockedId]);
      setOwnedMascots(nextOwned);
      onLiveStatsUpdated?.(data);
      setPledgedFeedback({
        amount: val,
        mascotId: unlockedId,
        donorName: cleanName,
      });
      const mascot = getCosmicMascotById(unlockedId);
      onToast(`👾 Você ganhou o bonequinho ${mascot.name} (${mascot.code})!`);
    } catch (e) {
      onToast(String(e instanceof Error ? e.message : e));
    } finally {
      setPledging(false);
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

  const unlockedMascotInfo = pledgedFeedback ? getCosmicMascotById(pledgedFeedback.mascotId) : null;

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
                Exclusivamente PIX (PicPay) · Ajuda em Igrejas, Combate à Fome & Bonequinho Colecionável
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
          <button
            onClick={() => setTab('collection')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition ${
              tab === 'collection'
                ? 'bg-gradient-to-r from-purple-400 to-cyan-400 text-black shadow'
                : 'bg-white/[0.06] text-slate-200 hover:bg-white/15'
            }`}
          >
            👾 Meus Bonequinhos ({ownedMascots.length}/1000)
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
              ⚙️ Meta
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[78dvh] overflow-y-auto">
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

              {/* Post-Donation Gratitude Screen + Unlocked Alien Mascot */}
              {pledgedFeedback && unlockedMascotInfo ? (
                <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 via-[#0d0724] to-amber-500/15 border border-emerald-400/50 p-5 space-y-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400 text-black text-[11px] font-black">
                    <Heart className="w-3.5 h-3.5 fill-black" /> DOAÇÃO CONFIRMADA · R$ {pledgedFeedback.amount.toFixed(2).replace('.', ',')}
                  </div>

                  <h3 className="font-display text-lg font-black text-white leading-snug">
                    Obrigado de coração, {pledgedFeedback.donorName}! 🙏
                  </h3>

                  <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed bg-black/35 rounded-2xl p-3.5 border border-emerald-400/25">
                    Sua ajuda foi destinada para fazer <strong>doações nas igrejas</strong> e ajudar a{' '}
                    <strong>matar a fome do Brasil — e quem sabe do mundo!</strong>
                    <br />
                    <span className="text-[11px] text-slate-300 block mt-1.5">
                      🔒 No comprovante enviado para o seu banco vai de uma forma bem discreta para sua privacidade.
                    </span>
                  </p>

                  {/* Unlocked Alien Mascot Reveal */}
                  <div className="rounded-2xl bg-white/[0.05] border border-cyan-400/40 p-4 flex flex-col items-center gap-2.5">
                    <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                      <Gift className="w-3.5 h-3.5" /> Recompensa Automática Desbloqueada!
                    </div>
                    <CosmicMascotBadge id={pledgedFeedback.mascotId} size="lg" showLabel />
                    <div className="text-[11px] text-purple-200">
                      {unlockedMascotInfo.trackTheme} · Equipamento: <strong>{unlockedMascotInfo.accessoryLabel}</strong>
                    </div>
                    <div className="text-[10px] text-slate-300/80">
                      Esse bonequinho exclusivo já foi salvo na sua coleção e aparece ao lado do seu nome no Ranking de Apoio!
                    </div>
                  </div>

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
                        <Sparkles className="w-3 h-3" /> Ganhe +1 Bonequinho Alienígena Musical (1 de 1.000)
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

                  {/* Discreet Note + Confirm Reward Button */}
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-3 space-y-2.5">
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed text-center">
                      🙏 Cada ajuda fortalece nossas doações para <strong>igrejas e combate à fome</strong> — no
                      comprovante bancário aparece de forma discreta. Após fazer o PIX no seu banco, confirme abaixo
                      para entrar no topo do Ranking e ganhar seu <strong>bonequinho exclusivo</strong>!
                    </p>
                    <button
                      type="button"
                      disabled={pledging}
                      onClick={() => void handleConfirmPledge()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 hover:brightness-110 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      {pledging
                        ? 'Registrando apoio & gerando bonequinho...'
                        : `Já fiz o PIX (R$ ${(effectiveAmount || 10).toFixed(0)}) · Receber Bonequinho`}
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
                  Quem mais contribui aparece no topo com o valor apoiado e sua coleção de bonequinhos alienígenas!
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
                            {sup.donationsCount} {sup.donationsCount === 1 ? 'apoio' : 'apoios'} ·{' '}
                            {(sup.mascots || []).length} bonequinhos
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex -space-x-1.5">
                          {(sup.mascots || []).slice(-3).map((mid) => (
                            <CosmicMascotBadge key={mid} id={mid} size="xs" />
                          ))}
                        </div>
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

          {/* COLEÇÃO DE BONEQUINHOS (1.000 MÚSICAS CÓSMICAS) */}
          {tab === 'collection' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/15 to-emerald-500/15 border border-cyan-400/35 p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-cyan-300">
                    👾 COLEÇÃO CÓSMICA LENKYX ({ownedMascots.length} / 1.000)
                  </div>
                  <p className="text-[11px] text-slate-200/80 mt-0.5">
                    Cada bonequinho representa 1 das 1.000 faixas do universo musical LENKYX. Toda doação libera 1 inédito!
                  </p>
                </div>
                <button
                  onClick={() => setTab('donate')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-400 text-black text-[11px] font-black shrink-0"
                >
                  + Ganhar 1
                </button>
              </div>

              {ownedMascots.length === 0 ? (
                <div className="py-10 text-center rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                  <div className="text-3xl">🛸</div>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Você ainda não desbloqueou nenhum bonequinho alienígena. Faça um apoio solidário via PIX para
                    ganhar o primeiro automaticamente!
                  </p>
                  <button
                    onClick={() => setTab('donate')}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-xs font-black"
                  >
                    Fazer PIX & Ganhar Bonequinho
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {ownedMascots.map((id) => (
                    <div
                      key={id}
                      className="rounded-2xl bg-white/[0.04] border border-white/10 p-2.5 flex flex-col items-center text-center"
                    >
                      <CosmicMascotBadge id={id} size="md" showLabel />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREATOR PIX CONFIG */}
          {tab === 'config' && mode === 'creator' && (
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
          )}
        </div>
      </div>
    </div>
  );
};

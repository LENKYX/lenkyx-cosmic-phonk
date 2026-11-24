import React, { useCallback, useEffect, useState } from 'react';
import {
  Gift,
  Heart,
  Sparkles,
  Trophy,
  Target,
  CheckCircle2,
  Users,
  Ticket,
  Coins,
  Plus,
  Dices,
  ShieldCheck,
  QrCode,
  Rocket,
  Award,
} from 'lucide-react';
import { AppMode, AppSettings, UserProfile } from '../types';
import { authFetch } from '../utils/api';

interface GiveawayEntryPreview {
  userName: string;
  ticketNumber: string;
  joinedAt: string;
}

interface CosmicGiveaway {
  id: string;
  title: string;
  description: string;
  prizeSummary: string;
  minParticipants: number;
  maxParticipants: number;
  participantCount: number;
  status: 'open' | 'drawn';
  myTicket: string | null;
  recentParticipants: GiveawayEntryPreview[];
  winner: {
    ticketNumber: string;
    userName: string;
    userId: string;
    drawnAt: string;
  } | null;
  createdAt: string;
}

interface GoalSupporter {
  id: string;
  name: string;
  amount: number;
  method: string;
  message: string;
  platformFee: number;
  netAmount: number;
  createdAt: string;
}

interface SupportGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  perkGuaranteed: string;
  supporters: GoalSupporter[];
  createdAt: string;
}

interface CosmicMission {
  id: string;
  title: string;
  description: string;
  rewardTokens: number;
  rewardSpins: number;
  emoji: string;
  claimedToday: boolean;
}

interface WheelSlice {
  id: string;
  label: string;
  tokens: number;
  extraSpin: number;
  badge: string;
  color: string;
}

interface CosmicWallet {
  userId: string;
  userName: string;
  tokens: number;
  bonusSpins: number;
  freeSpinReady: boolean;
  availableSpins: number;
  badges: string[];
}

interface HubOverviewPayload {
  giveaways: CosmicGiveaway[];
  goals: SupportGoal[];
  missions: CosmicMission[];
  wheelSlices: WheelSlice[];
  recentWheelWins: { id: string; userName: string; prizeLabel: string; createdAt: string }[];
  wallet: CosmicWallet;
}

interface Props {
  user: UserProfile | null;
  mode: AppMode;
  settings: AppSettings;
  onOpenUserAuth: () => void;
  onOpenPix: () => void;
  onToast: (msg: string) => void;
}

type HubSection = 'giveaways' | 'goals' | 'wheel';

export const CosmicHubView: React.FC<Props> = ({
  user,
  mode,
  settings,
  onOpenUserAuth,
  onOpenPix,
  onToast,
}) => {
  const [section, setSection] = useState<HubSection>('giveaways');
  const [data, setData] = useState<HubOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Wheel animation state
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastSpinWin, setLastSpinWin] = useState<string | null>(null);

  // Support goal form state
  const [supportGoalId, setSupportGoalId] = useState<string | null>(null);
  const [supportAmount, setSupportAmount] = useState('20');
  const [supportMethod, setSupportMethod] = useState('PIX / PicPay');
  const [supportMessage, setSupportMessage] = useState('');

  // Creator forms
  const [newGiveawayOpen, setNewGiveawayOpen] = useState(false);
  const [gTitle, setGTitle] = useState('');
  const [gPrize, setGPrize] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gMin, setGMin] = useState('5');
  const [gMax, setGMax] = useState('100');

  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('1000');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalPerk, setGoalPerk] = useState('Nome nos créditos + Badge Apoiador + Acesso Antecipado');

  const loadOverview = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (user?.id) qs.set('userId', user.id);
      if (user?.name) qs.set('userName', user.name);
      const res = await fetch(`/api/hub/overview?${qs.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar Central Prêmios & Metas');
      const json: HubOverviewPayload = await res.json();
      setData(json);
    } catch {
      onToast('Não foi possível atualizar os dados agora.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.name, onToast]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleJoinGiveaway = async (giveawayId: string) => {
    if (!user) {
      onToast('Entre com sua conta gratuita para receber seu número da sorte!');
      onOpenUserAuth();
      return;
    }
    setBusyId(giveawayId);
    try {
      const res = await fetch('/api/hub/giveaways/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giveawayId,
          userId: user.id,
          userName: user.name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao participar');
      if (json.autoDrawnWinner) {
        onToast(
          `🏆 Meta máxima atingida! Vencedor sorteado: ${json.autoDrawnWinner.userName} (${json.autoDrawnWinner.ticketNumber})`
        );
      } else if (json.alreadyJoined) {
        onToast(`🎟️ Você já está participando com o número ${json.ticketNumber}!`);
      } else {
        onToast(`🎉 Participação gratuita confirmada! Seu número da sorte: ${json.ticketNumber}`);
      }
      await loadOverview();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Erro ao participar do sorteio.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDrawGiveaway = async (giveawayId: string) => {
    setBusyId(giveawayId);
    try {
      const res = await authFetch(`/api/hub/giveaways/${encodeURIComponent(giveawayId)}/draw`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao realizar sorteio');
      onToast(`🏆 Vencedor sorteado aleatoriamente: ${json.winner.userName} (${json.winner.ticketNumber})!`);
      await loadOverview();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Erro ao sortear.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/hub/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: gTitle,
          prizeSummary: gPrize,
          description: gDesc,
          minParticipants: Number(gMin) || 5,
          maxParticipants: Number(gMax) || 100,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao criar sorteio');
      setGTitle('');
      setGPrize('');
      setGDesc('');
      setNewGiveawayOpen(false);
      onToast('🎁 Novo sorteio gratuito publicado!');
      await loadOverview();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Erro ao criar sorteio.');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/hub/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goalTitle,
          targetAmount: Number(goalTarget) || 500,
          description: goalDesc,
          perkGuaranteed: goalPerk,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao criar meta');
      setGoalTitle('');
      setGoalDesc('');
      setNewGoalOpen(false);
      onToast('🎯 Nova meta de apoio publicada!');
      await loadOverview();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Erro ao criar meta.');
    }
  };

  const handleRecordSupport = async (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    setBusyId(goalId);
    try {
      const res = await fetch(`/api/hub/goals/${encodeURIComponent(goalId)}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supporterName: user?.name || 'Apoiador Cósmico',
          amount: Number(supportAmount) || 20,
          method: supportMethod,
          message: supportMessage,
          userId: user?.id || '',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao registrar apoio');
      setSupportMessage('');
      setSupportGoalId(null);
      onToast(
        `💜 Apoio registrado! Taxa transparente 5% (${json.entry.platformFee.toFixed(2)}) · Agora conclua via PIX/Cartão/Cripto.`
      );
      await loadOverview();
      onOpenPix();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Erro ao registrar apoio.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSpinWheel = async () => {
    if (!user) {
      onToast('Entre com sua conta gratuita para girar a Roleta Cósmica!');
      onOpenUserAuth();
      return;
    }
    if (spinning) return;
    setSpinning(true);
    setLastSpinWin(null);
    try {
      const res = await fetch('/api/hub/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSpinning(false);
        onToast(json.error || 'Sem giros disponíveis no momento.');
        return;
      }

      const sliceCount = data?.wheelSlices.length || 8;
      const sliceDeg = 360 / sliceCount;
      const targetAngle = 360 - (json.sliceIndex * sliceDeg + sliceDeg / 2);
      setWheelRotation((prev) => prev + 360 * 5 + (targetAngle - (prev % 360)));

      setTimeout(() => {
        setSpinning(false);
        setLastSpinWin(`🎉 Você ganhou ${json.prize.label}!`);
        onToast(`🎡 Roleta Cósmica: +${json.prize.tokens} Tokens Cósmicos (${json.prize.label})!`);
        void loadOverview();
      }, 3600);
    } catch {
      setSpinning(false);
      onToast('Erro ao girar a roleta.');
    }
  };

  const handleClaimMission = async (missionId: string) => {
    if (!user) {
      onToast('Entre com sua conta gratuita para resgatar missões!');
      onOpenUserAuth();
      return;
    }
    setBusyId(missionId);
    try {
      const res = await fetch('/api/hub/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name, missionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao resgatar');
      onToast(`✅ +${json.tokensAdded} Tokens e +${json.spinsAdded} Giro Extra na Roleta!`);
      await loadOverview();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Missão já resgatada hoje.');
    } finally {
      setBusyId(null);
    }
  };

  const slices = data?.wheelSlices || [];
  const sliceDeg = slices.length ? 360 / slices.length : 45;
  const conicGradient = slices.length
    ? `conic-gradient(${slices
        .map((s, idx) => `${s.color} ${idx * sliceDeg}deg ${(idx + 1) * sliceDeg}deg`)
        .join(', ')})`
    : 'conic-gradient(#06b6d4, #ec4899)';

  return (
    <div className="space-y-5 pb-28">
      {/* 💛 TRANSPARÊNCIA DAS DOAÇÕES (documento de execução!) */}
      <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-[11px] text-amber-100 leading-relaxed">
        <strong className="text-amber-300">💛 Transparência:</strong> todo valor vai <strong>direto ao PIX do beneficiário</strong> (igreja/campanha) — o app <strong>não cobra taxa</strong>. Peça e guarde seu <strong>comprovante</strong>! Campanhas passam por <strong>moderação</strong> antes de aparecer. Dúvidas? Fale com o organizador pelo WhatsApp oficial.
      </div>
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#190935]/95 via-[#0f172a]/95 to-[#2b0c2b]/95 border border-pink-400/35 p-5 sm:p-6 shadow-[0_0_50px_rgba(236,72,153,0.18)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-black">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Legal · Participação Grátis & Apoio Voluntário
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-black text-white">
              🎁 Prêmios Grátis, Metas de Apoio & Roleta Cósmica
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/85 max-w-2xl">
              Participe de sorteios 100% gratuitos sem depósito e sem expor CPF, apoie metas criativas voluntariamente
              com transparência (5% manutenção) e gire a Roleta para ganhar Tokens Cósmicos!
            </p>
          </div>

          {/* Wallet Pill */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-black/45 border border-amber-400/40 flex items-center gap-2.5">
              <Coins className="w-5 h-5 text-amber-300" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-amber-200/75 font-bold">
                  Seus Tokens Cósmicos
                </div>
                <div className="text-base font-black text-white">
                  {user ? data?.wallet.tokens ?? 100 : 'Entre p/ ver'}
                </div>
              </div>
            </div>
            <button
              onClick={onOpenPix}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-amber-500 hover:brightness-110 text-white text-xs font-black flex items-center gap-1.5 shadow-lg transition"
            >
              <QrCode className="w-4 h-4" /> Apoiar via PIX / Cartão
            </button>
          </div>
        </div>

        {/* Section Switcher */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSection('giveaways')}
            className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition ${
              section === 'giveaways'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-300 shadow-lg'
                : 'bg-white/[0.06] text-purple-200 border-white/10 hover:bg-white/10'
            }`}
          >
            <Gift className="w-4 h-4" /> Sorteios 100% Grátis ({data?.giveaways.length ?? 0})
          </button>
          <button
            onClick={() => setSection('goals')}
            className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition ${
              section === 'goals'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black border-emerald-200 shadow-lg'
                : 'bg-white/[0.06] text-purple-200 border-white/10 hover:bg-white/10'
            }`}
          >
            <Target className="w-4 h-4" /> Metas de Apoio ({data?.goals.length ?? 0})
          </button>
          <button
            onClick={() => setSection('wheel')}
            className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition ${
              section === 'wheel'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black border-amber-200 shadow-lg'
                : 'bg-white/[0.06] text-purple-200 border-white/10 hover:bg-white/10'
            }`}
          >
            <Dices className="w-4 h-4" /> Roleta & Missões ({data?.wallet.availableSpins ?? 0} giros)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-14 text-center text-xs text-purple-300 font-bold">
          Carregando Central de Prêmios, Metas e Tokens...
        </div>
      ) : (
        <>
          {/* === 1. FREE FAN GIVEAWAYS === */}
          {section === 'giveaways' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-300" /> Sorteios Gratuitos para Fãs
                  </h2>
                  <p className="text-xs text-purple-200/75">
                    Entrada grátis (R$ 0,00) com número da sorte aleatório. Sorteio automático ao atingir o limite máximo
                    ou liberação do criador após atingir o mínimo!
                  </p>
                </div>
                {mode === 'creator' && (
                  <button
                    onClick={() => setNewGiveawayOpen((v) => !v)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/45 text-cyan-100 text-xs font-black flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Novo Sorteio Grátis
                  </button>
                )}
              </div>

              {mode === 'creator' && newGiveawayOpen && (
                <form
                  onSubmit={(e) => void handleCreateGiveaway(e)}
                  className="rounded-2xl bg-black/50 border border-cyan-400/40 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <input
                    required
                    value={gTitle}
                    onChange={(e) => setGTitle(e.target.value)}
                    placeholder="Título (ex: Sorteio Grátis — Fone ou Pack VIP)"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                  <input
                    required
                    value={gPrize}
                    onChange={(e) => setGPrize(e.target.value)}
                    placeholder="Prêmio (ex: Badge VIP + 500 Tokens + Faixa Inédita)"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                  <input
                    value={gDesc}
                    onChange={(e) => setGDesc(e.target.value)}
                    placeholder="Descrição curta das regras gratuitas"
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-purple-200">Mínimo:</label>
                    <input
                      type="number"
                      min={2}
                      value={gMin}
                      onChange={(e) => setGMin(e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                    />
                    <label className="text-[11px] text-purple-200 ml-2">Máximo:</label>
                    <input
                      type="number"
                      min={2}
                      value={gMax}
                      onChange={(e) => setGMax(e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNewGiveawayOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-purple-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-cyan-400 text-black text-xs font-black"
                    >
                      Publicar Grátis
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(data?.giveaways || []).map((g) => {
                  const pct = Math.min(100, Math.round((g.participantCount / Math.max(1, g.maxParticipants)) * 100));
                  return (
                    <div
                      key={g.id}
                      className="rounded-3xl bg-white/[0.04] border border-white/12 p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-black text-white">{g.title}</h3>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                              g.status === 'open'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                : 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                            }`}
                          >
                            {g.status === 'open' ? 'ABERTO · GRÁTIS' : 'SORTEADO'}
                          </span>
                        </div>
                        <p className="text-xs text-purple-200/80">{g.description}</p>
                        <div className="px-3 py-2 rounded-2xl bg-pink-500/15 border border-pink-400/30 text-xs font-bold text-pink-100 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>Prêmio: {g.prizeSummary}</span>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-purple-200">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-cyan-300" />
                              {g.participantCount} / {g.maxParticipants} participantes
                            </span>
                            <span className="text-cyan-300">Mínimo p/ sortear: {g.minParticipants}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-black/50 overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* My Ticket or Winner */}
                        {g.winner ? (
                          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/25 to-emerald-500/25 border border-amber-400/50 text-xs text-white">
                            <div className="font-black flex items-center gap-1.5 text-amber-200">
                              <Trophy className="w-4 h-4" /> Vencedor Aleatório Confirmado!
                            </div>
                            <div className="mt-1 font-bold">
                              🏆 {g.winner.userName} · Ticket <span className="font-mono text-cyan-200">{g.winner.ticketNumber}</span>
                            </div>
                          </div>
                        ) : g.myTicket ? (
                          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-xs text-emerald-100 flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Você já está concorrendo!
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-black/50 font-mono font-black text-cyan-300">
                              {g.myTicket}
                            </span>
                          </div>
                        ) : null}

                        {g.recentParticipants.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {g.recentParticipants.slice(0, 6).map((p) => (
                              <span
                                key={p.ticketNumber}
                                className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-purple-200"
                              >
                                {p.userName} ({p.ticketNumber})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {g.status === 'open' && !g.myTicket && (
                          <button
                            disabled={busyId === g.id}
                            onClick={() => void handleJoinGiveaway(g.id)}
                            className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:brightness-110 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg transition disabled:opacity-60"
                          >
                            <Ticket className="w-4 h-4" />
                            {busyId === g.id ? 'Gerando Número...' : 'Participar Grátis (1 Clique)'}
                          </button>
                        )}
                        {mode === 'creator' && g.status === 'open' && (
                          <button
                            disabled={busyId === g.id || g.participantCount < g.minParticipants}
                            onClick={() => void handleDrawGiveaway(g.id)}
                            className="py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-45 text-black text-xs font-black flex items-center gap-1.5 transition"
                            title={
                              g.participantCount < g.minParticipants
                                ? `Aguardando mínimo de ${g.minParticipants} participantes`
                                : 'Sortear aleatoriamente agora'
                            }
                          >
                            <Sparkles className="w-4 h-4" /> Sortear Agora
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === 2. TRANSPARENT VOLUNTARY SUPPORT GOALS === */}
          {section === 'goals' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" /> Metas de Apoio Voluntário (Crowdfunding)
                  </h2>
                  <p className="text-xs text-purple-200/75">
                    Doações 100% voluntárias com recompensas garantidas para fãs. Transparência total: taxa mínima de 5%
                    para servidores e manutenção.
                  </p>
                </div>
                {mode === 'creator' && (
                  <button
                    onClick={() => setNewGoalOpen((v) => !v)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/45 text-emerald-100 text-xs font-black flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Nova Meta
                  </button>
                )}
              </div>

              {mode === 'creator' && newGoalOpen && (
                <form
                  onSubmit={(e) => void handleCreateGoal(e)}
                  className="rounded-2xl bg-black/50 border border-emerald-400/40 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <input
                    required
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Título da Meta (ex: Novo Álbum Cosmic Phonk)"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                  <input
                    required
                    type="number"
                    min={50}
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="Valor Alvo em R$ (ex: 1000)"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                  <input
                    value={goalDesc}
                    onChange={(e) => setGoalDesc(e.target.value)}
                    placeholder="Para que será usado esse apoio"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                  <input
                    value={goalPerk}
                    onChange={(e) => setGoalPerk(e.target.value)}
                    placeholder="Recompensa garantida aos apoiadores"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                  />
                  <div className="sm:col-span-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNewGoalOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-purple-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-400 text-black text-xs font-black"
                    >
                      Publicar Meta
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(data?.goals || []).map((goal) => {
                  const pct = Math.min(100, Math.round((goal.currentAmount / Math.max(1, goal.targetAmount)) * 100));
                  const isSupporting = supportGoalId === goal.id;
                  return (
                    <div
                      key={goal.id}
                      className="rounded-3xl bg-white/[0.04] border border-white/12 p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-black text-white">{goal.title}</h3>
                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-[11px] font-black shrink-0">
                            {pct}%
                          </span>
                        </div>
                        <p className="text-xs text-purple-200/80">{goal.description}</p>
                        <div className="px-3 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 text-xs text-emerald-100 font-bold">
                          🎁 Recompensa garantida: {goal.perkGuaranteed}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-black">
                            <span className="text-emerald-300">
                              R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} arrecadados
                            </span>
                            <span className="text-purple-200/80">
                              Meta: R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-black/50 overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {goal.supporters.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300/75">
                              Mural de Apoiadores Recentes
                            </div>
                            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                              {goal.supporters.slice(0, 4).map((s) => (
                                <div
                                  key={s.id}
                                  className="px-2.5 py-1.5 rounded-xl bg-black/35 border border-white/10 flex items-center justify-between text-[11px]"
                                >
                                  <span className="text-white font-bold truncate">
                                    💜 {s.name} {s.message ? `— "${s.message}"` : ''}
                                  </span>
                                  <span className="text-emerald-300 font-black shrink-0 ml-2">
                                    R$ {s.amount.toFixed(0)} ({s.method})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {isSupporting ? (
                        <form
                          onSubmit={(e) => void handleRecordSupport(e, goal.id)}
                          className="rounded-2xl bg-black/55 border border-pink-400/45 p-3.5 space-y-2.5"
                        >
                          <div className="text-xs font-black text-pink-200">
                            Apoiar voluntariamente (5% manutenção · PIX {settings.pixKeyConfigured ? 'ativo' : 'configurável'})
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min={1}
                              required
                              value={supportAmount}
                              onChange={(e) => setSupportAmount(e.target.value)}
                              placeholder="Valor (R$)"
                              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                            />
                            <select
                              value={supportMethod}
                              onChange={(e) => setSupportMethod(e.target.value)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#130b29] border border-white/15 text-xs text-white"
                            >
                              <option value="PIX / PicPay">PIX / PicPay</option>
                              <option value="Cartão / Global">Cartão / Global</option>
                              <option value="Cripto">Cripto (USDT/BTC)</option>
                            </select>
                          </div>
                          <input
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            placeholder="Mensagem opcional para o mural do artista"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSupportGoalId(null)}
                              className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-purple-200"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={busyId === goal.id}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 text-white text-xs font-black"
                            >
                              Registrar & Abrir PIX/Cartão
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSupportGoalId(goal.id)}
                            className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black text-xs font-black flex items-center justify-center gap-1.5 transition"
                          >
                            <Heart className="w-4 h-4" /> Apoiar esta Meta
                          </button>
                          <button
                            onClick={onOpenPix}
                            className="py-2.5 px-3.5 rounded-2xl bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/40 text-pink-100 text-xs font-black flex items-center gap-1"
                            title="Abrir Central PIX / PicPay / Cripto / Cartão"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === 3. FREE COSMIC WHEEL & MISSIONS === */}
          {section === 'wheel' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Animated Prize Wheel */}
              <div className="lg:col-span-6 rounded-3xl bg-white/[0.04] border border-amber-400/35 p-5 flex flex-col items-center justify-center space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center justify-center gap-2">
                    <Dices className="w-5 h-5 text-amber-300" /> Roleta Cósmica Gratuita
                  </h2>
                  <p className="text-xs text-purple-200/80">
                    1 giro grátis a cada 12h + giros extras nas Missões. 100% gratuito, sem dinheiro real!
                  </p>
                </div>

                {/* Pointer + Spinning Wheel */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                  <div className="absolute -top-2 z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                  <div
                    className="w-full h-full rounded-full border-4 border-amber-300/80 shadow-[0_0_45px_rgba(236,72,153,0.4)] relative overflow-hidden"
                    style={{
                      background: conicGradient,
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: 'transform 3.5s cubic-bezier(0.12, 0.88, 0.18, 1)',
                    }}
                  >
                    {slices.map((s, idx) => {
                      const angle = idx * sliceDeg + sliceDeg / 2;
                      return (
                        <div
                          key={s.id}
                          className="absolute inset-0 flex items-start justify-center pt-4 pointer-events-none"
                          style={{ transform: `rotate(${angle}deg)` }}
                        >
                          <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-center leading-tight max-w-[68px]">
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                    <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#090418] border-2 border-amber-300 flex items-center justify-center shadow-inner">
                      <Sparkles className="w-6 h-6 text-amber-300" />
                    </div>
                  </div>
                </div>

                {lastSpinWin && (
                  <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/45 text-emerald-200 text-xs font-black animate-pulse">
                    {lastSpinWin}
                  </div>
                )}

                <button
                  disabled={spinning}
                  onClick={() => void handleSpinWheel()}
                  className="w-full max-w-xs py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-60 text-white font-black text-sm shadow-xl transition"
                >
                  {spinning
                    ? 'Girando a Galáxia...'
                    : `🎡 Girar Roleta (${data?.wallet.availableSpins ?? 0} disponíveis)`}
                </button>

                {data?.wallet.badges && data.wallet.badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                    {data.wallet.badges.map((b) => (
                      <span
                        key={b}
                        className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/45 text-amber-200 text-[10px] font-black"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Daily Free Missions + Recent Winners */}
              <div className="lg:col-span-6 space-y-4">
                <div className="rounded-3xl bg-white/[0.04] border border-white/12 p-5 space-y-3">
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-cyan-300" /> Missões Diárias Gratuitas
                  </h3>
                  <div className="space-y-2.5">
                    {(data?.missions || []).map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-white">
                            {m.emoji} {m.title}
                          </div>
                          <div className="text-[11px] text-purple-200/75">{m.description}</div>
                          <div className="text-[10px] font-bold text-amber-300">
                            Recompensa: +{m.rewardTokens} Tokens + {m.rewardSpins} Giro Extra
                          </div>
                        </div>
                        <button
                          disabled={m.claimedToday || busyId === m.id}
                          onClick={() => void handleClaimMission(m.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition ${
                            m.claimedToday
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                              : 'bg-cyan-400 hover:bg-cyan-300 text-black'
                          }`}
                        >
                          {m.claimedToday ? '✓ Resgatado Hoje' : 'Resgatar Grátis'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {data?.recentWheelWins && data.recentWheelWins.length > 0 && (
                  <div className="rounded-3xl bg-white/[0.04] border border-white/12 p-4 space-y-2">
                    <div className="text-xs font-black text-purple-200">Últimos Prêmios da Roleta</div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.recentWheelWins.slice(0, 8).map((w) => (
                        <span
                          key={w.id}
                          className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] text-cyan-100"
                        >
                          ✨ {w.userName}: <strong>{w.prizeLabel}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

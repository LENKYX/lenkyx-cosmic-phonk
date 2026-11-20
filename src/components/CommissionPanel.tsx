import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Save,
  Trash2,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  ShoppingBag,
  EyeOff,
  Download,
} from 'lucide-react';
import {
  fetchCommissionLedger,
  saveCommissionConfig,
  setSaleStatus,
  removeSale,
} from '../utils/commissionApi';
import type { CommissionLedger, CommissionConfig, SaleOrder } from '../utils/commissionApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const STATUS_LABEL: Record<SaleOrder['status'], string> = {
  pendente: '⏳ Pendente',
  confirmada: '✅ Confirmada',
  paga: '💰 Paga',
  cancelada: '🚫 Cancelada',
};

const brl = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const emptyConfig: CommissionConfig = {
  enabled: true,
  ratePct: 10,
  pixKey: '',
  pixName: 'MORRO GOLD VIP',
  pixCity: 'CAMPO GRANDE',
  privateNote: '',
  updatedAt: null,
};

export const CommissionPanel: React.FC<Props> = ({ open, onClose, onToast }) => {
  const [ledger, setLedger] = useState<CommissionLedger | null>(null);
  const [config, setConfig] = useState<CommissionConfig>(emptyConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchCommissionLedger();
    if (data) {
      setLedger(data);
      setConfig(data.config);
    } else {
      onToast('🔒 Só o dono (modo criador) consegue abrir as comissões.');
    }
    setLoading(false);
  }, [onToast]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const totals = ledger?.totals;

  const csv = useMemo(() => {
    if (!ledger) return '';
    const head = 'data;venda;itens;comprador;contato;total;comissao_pct;comissao;status\n';
    const rows = ledger.orders
      .map((o) =>
        [
          o.createdAt,
          o.id,
          o.items.map((i) => `${i.qty}x ${i.name}`).join(' | ').replace(/;/g, ','),
          (o.buyerName || '-').replace(/;/g, ','),
          (o.buyerContact || '-').replace(/;/g, ','),
          o.totalBrl.toFixed(2),
          o.commissionRatePct,
          o.commissionBrl.toFixed(2),
          o.status,
        ].join(';')
      )
      .join('\n');
    return head + rows;
  }, [ledger]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveCommissionConfig(config);
    setSaving(false);
    if (ok) {
      onToast(
        config.enabled
          ? `💰 Comissões ativadas em ${config.ratePct}% — essa informação fica só com você.`
          : '⏸️ Comissões pausadas (nada é registrado até você reativar).'
      );
      void load();
    } else {
      onToast('❌ Não consegui salvar a configuração de comissão.');
    }
  };

  const handleStatus = async (id: string, status: SaleOrder['status']) => {
    setBusyId(id);
    const ok = await setSaleStatus(id, status);
    setBusyId('');
    if (ok) {
      onToast(status === 'paga' ? '💰 Comissão marcada como paga.' : '✔️ Status da venda atualizado.');
      void load();
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    const ok = await removeSale(id);
    setBusyId('');
    if (ok) {
      onToast('🗑️ Venda removida do seu painel privado.');
      void load();
    }
  };

  const copyPix = async () => {
    if (!config.pixKey) return;
    try {
      await navigator.clipboard.writeText(config.pixKey);
      setCopied('pix');
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      onToast('Não consegui copiar a chave. Copie manualmente.');
    }
  };

  const downloadCsv = () => {
    if (!csv) return;
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morro-gold-comissoes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-[#0b0716] border border-amber-400/35 shadow-[0_0_90px_rgba(245,200,76,0.18)] max-h-[92dvh] overflow-y-auto"
      >
        {/* HEADER PRIVADO */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-white/10 sticky top-0 bg-[#0b0716]/95 backdrop-blur z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-amber-300 text-[10px] font-black uppercase tracking-[0.2em]">
              <Lock className="w-3.5 h-3.5" /> Painel privado do dono
            </div>
            <h2 className="font-display text-lg sm:text-xl font-black text-white flex items-center gap-2 mt-1">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Minhas Comissões nas Vendas
            </h2>
            <p className="text-[11px] text-slate-300/85 mt-1 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-amber-300" />
              Taxa, comissões, dados dos compradores e chave PIX ficam escondidos de todos os
              usuários — só aparecem com o Modo Criador aberto.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
            aria-label="Fechar painel de comissões"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-sm text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando seu painel...
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4">
            {/* TOTAIS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { icon: ShoppingBag, label: 'Vendas', value: String(totals?.sales ?? 0), tone: 'text-cyan-300' },
                { icon: Wallet, label: 'Comissão total', value: brl(totals?.commission ?? 0), tone: 'text-emerald-300' },
                { icon: TrendingUp, label: 'A receber', value: brl(totals?.pending ?? 0), tone: 'text-amber-300' },
                { icon: Check, label: 'Já recebido', value: brl(totals?.paid ?? 0), tone: 'text-emerald-400' },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl bg-white/[0.05] border border-white/10 p-3">
                  <c.icon className={`w-4 h-4 ${c.tone}`} />
                  <div className={`text-base sm:text-lg font-black mt-1 ${c.tone}`}>{c.value}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</div>
                </div>
              ))}
            </div>

            {/* CONFIGURAÇÃO */}
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Ativar minhas comissões nas vendas
                  </div>
                  <div className="text-[10px] text-slate-300/80 mt-0.5">
                    Quando ligado, toda venda registrada na loja gera sua comissão automaticamente.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
                  className={`shrink-0 w-14 h-8 rounded-full p-1 flex items-center transition ${
                    config.enabled ? 'bg-emerald-500/80' : 'bg-white/20'
                  }`}
                  aria-label="Ativar ou pausar comissões"
                >
                  <span
                    className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      config.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Taxa (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    step={0.5}
                    value={config.ratePct}
                    onChange={(e) => setConfig((c) => ({ ...c, ratePct: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/60"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Nome no PIX</span>
                  <input
                    type="text"
                    value={config.pixName}
                    onChange={(e) => setConfig((c) => ({ ...c, pixName: e.target.value }))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/60"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Cidade</span>
                  <input
                    type="text"
                    value={config.pixCity}
                    onChange={(e) => setConfig((c) => ({ ...c, pixCity: e.target.value }))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/60"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
                  Chave PIX de recebimento (privada)
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={config.pixKey}
                    placeholder="ex.: 41651191808"
                    onChange={(e) => setConfig((c) => ({ ...c, pixKey: e.target.value }))}
                    className="flex-1 rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/60"
                  />
                  <button
                    type="button"
                    onClick={copyPix}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 flex items-center gap-1.5 text-xs font-black shrink-0"
                  >
                    {copied === 'pix' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === 'pix' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
                  Anotação privada (só você)
                </span>
                <textarea
                  value={config.privateNote}
                  rows={2}
                  placeholder="Ex.: acertar repasse do pigmentation do cricão dia 10..."
                  onChange={(e) => setConfig((c) => ({ ...c, privateNote: e.target.value }))}
                  className="mt-1 w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/60 resize-none"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl lux-btn-gold text-xs font-black flex items-center gap-1.5 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar configuração
                </button>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black text-slate-100 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Atualizar
                </button>
                <button
                  type="button"
                  onClick={downloadCsv}
                  disabled={!ledger?.orders.length}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black text-slate-100 flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Download className="w-4 h-4" /> Exportar CSV
                </button>
              </div>
            </div>

            {/* LISTA DE VENDAS */}
            <div className="space-y-2">
              <div className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-300" /> Vendas registradas (visível só pra você)
              </div>

              {!ledger?.orders.length ? (
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 text-center text-xs text-slate-400">
                  Nenhuma venda registrada ainda. Quando alguém finalizar uma compra na Loja dos Cria,
                  ela aparece aqui com a sua comissão.
                </div>
              ) : (
                ledger.orders.map((o) => (
                  <div key={o.id} className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-white truncate">
                          {o.items.map((i) => `${i.qty}x ${i.name}`).join(' · ')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(o.createdAt).toLocaleString('pt-BR')} · {o.id}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-300">{brl(o.commissionBrl)}</div>
                        <div className="text-[10px] text-slate-400">venda {brl(o.totalBrl)}</div>
                      </div>
                    </div>

                    {(o.buyerName || o.buyerContact) && (
                      <div className="text-[11px] text-slate-300 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
                        👤 {o.buyerName || 'Sem nome'}
                        {o.buyerContact ? <span className="text-slate-400"> · {o.buyerContact}</span> : null}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={o.status}
                        onChange={(e) => void handleStatus(o.id, e.target.value as SaleOrder['status'])}
                        disabled={busyId === o.id}
                        className="rounded-lg bg-black/60 border border-white/15 px-2 py-1.5 text-[11px] font-bold text-white focus:outline-none"
                      >
                        {Object.entries(STATUS_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] font-black text-amber-300/90">
                        comissão {o.commissionRatePct}%
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleDelete(o.id)}
                        disabled={busyId === o.id}
                        className="ml-auto p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 disabled:opacity-50"
                        title="Remover venda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

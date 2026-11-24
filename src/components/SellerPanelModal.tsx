import React, { useState } from 'react';
import { X, Store, CheckCircle2, Clock, ExternalLink, Save, Package, Wallet } from 'lucide-react';

/**
 * 👥 PAINEL DO VENDEDOR — estrutura pronta (documento de execução §7/§13).
 * SEM dados fictícios: mostra o status REAL das integrações e o que falta!
 * Pré-cadastro salva no aparelho (dado real do usuário).
 */

interface Props {
  open: boolean;
  onClose: () => void;
}

const LS_KEY = 'mg_seller_pre_cadastro_v1';

export default function SellerPanelModal({ open, onClose }: Props) {
  const [nome, setNome] = useState('');
  const [whats, setWhats] = useState('');
  const [tipo, setTipo] = useState('');
  const [cidade, setCidade] = useState('');
  const [salvo, setSalvo] = useState(false);

  if (!open) return null;

  const salvar = () => {
    if (!nome.trim() || !whats.trim()) {
      window.alert('Preenche nome e WhatsApp pra salvar o pré-cadastro! 📱');
      return;
    }
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ nome, whats, tipo, cidade, em: new Date().toISOString() }),
      );
      setSalvo(true);
    } catch {
      window.alert('Não consegui salvar neste aparelho! 😕');
    }
  };

  const StatusRow = ({ icon, title, status, ok, note }: { icon: React.ReactNode; title: string; status: string; ok: boolean; note: string }) => (
    <div className="rounded-2xl border border-amber-300/25 bg-white/[0.05] p-3.5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-black text-white flex items-center gap-2 flex-wrap">
          {title}
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${ok ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}`}>
            {ok ? '✅ ATIVO' : '⏳ PENDENTE'}
          </span>
        </div>
        <div className="text-[11px] text-slate-300 mt-1">{status}</div>
        <div className="text-[10px] text-amber-200/80 mt-0.5">{note}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[160] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto no-scrollbar rounded-3xl border border-amber-300/40 bg-[#120a1e]/96 shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <Store className="w-5 h-5 text-amber-300" /> Painel do Vendedor
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-amber-200/80 font-bold uppercase tracking-[0.14em]">
          Estrutura pronta · sem dados fictícios · o que falta = configurado por você!
        </div>

        {/* STATUS REAL DAS INTEGRAÇÕES */}
        <div className="space-y-2">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">📊 Status das integrações</div>
          <StatusRow
            icon={<Wallet className="w-4 h-4" />}
            title="Mercado Pago (checkout + comissão)"
            status="Link de afiliado já funciona! O checkout automático com comissão precisa da sua Access Token no servidor."
            ok={false}
            note="O que falta: você configurar a Access Token MP (eu deixo tudo pronto no servidor!) + aprovação de marketplace para split entre vendedores."
          />
          <StatusRow
            icon={<ExternalLink className="w-4 h-4" />}
            title="Mercado Livre · Shopee · Amazon"
            status="Links de afiliado ATIVOS na loja! Compra redireciona pro parceiro com transparência."
            ok
            note="Para APIs oficiais (catálogo automático): cadastro de desenvolvedor/afiliado em cada plataforma."
          />
          <StatusRow
            icon={<Package className="w-4 h-4" />}
            title="Pedidos · comissões · repasses"
            status="O resumo financeiro aparece aqui assim que o checkout for ativado."
            ok={false}
            note="Depende da ativação do Mercado Pago. Nada de números inventados!"
          />
        </div>

        {/* 🔗 COMO LIGAR AGORA (passo a passo real!) */}
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-3.5 space-y-2">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">🔗 Como LIGAR agora (1 minuto cada!)</div>
          <div className="text-[11px] text-emerald-50 leading-relaxed space-y-1.5">
            <p><strong>💳 Mercado Pago:</strong> painel do Mercado Pago → Seu Negócio → <strong>Credenciais</strong> → copie a <strong>Access Token (produção)</strong> → cole no app em <strong>Configurações → PIX/Pagamentos</strong> (ou no Render em MP_ACCESS_TOKEN). Pronto: doações e assinaturas passam a confirmar sozinhas!</p>
            <p><strong>🛒 Amazon:</strong> cadastre-se em <strong>amazon.com.br/associates</strong> → copie seu código de afiliado (<strong>tag xxx-21</strong>) → na Loja, botão <strong>Ativar Comissões</strong> → cole seu link da Amazon!</p>
            <p><strong>🛍️ Shopee:</strong> entre em <strong>afiliados.shopee.com.br</strong> → copie seu código de afiliado → na Loja, <strong>Ativar Comissões</strong> → cole seu link da Shopee!</p>
            <p><strong>📦 Mercado Livre:</strong> <strong>mercadolivre.com.br/l/afiliados-home</strong> → gere seu link → cole em Ativar Comissões!</p>
          </div>
        </div>

        {/* PRÉ-CADASTRO REAL (salvo no aparelho!) */}
        <div className="rounded-2xl border border-amber-300/25 bg-white/[0.05] p-3.5 space-y-2.5">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">📝 Meu pré-cadastro de vendedor</div>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-amber-300/35 text-xs text-amber-50 focus:outline-none focus:border-amber-300" />
          <input value={whats} onChange={(e) => setWhats(e.target.value)} placeholder="WhatsApp com DDD" className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-amber-300/35 text-xs text-amber-50 focus:outline-none focus:border-amber-300" />
          <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="O que você vende? (ex: roupas, doces, acessórios)" className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-amber-300/35 text-xs text-amber-50 focus:outline-none focus:border-amber-300" />
          <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade / estado" className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-amber-300/35 text-xs text-amber-50 focus:outline-none focus:border-amber-300" />
          <button
            type="button"
            onClick={salvar}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-black font-black text-xs flex items-center justify-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" /> {salvo ? 'SALVO NESTE APARELHO! ✅' : 'SALVAR PRÉ-CADASTRO'}
          </button>
          <div className="text-[10px] text-slate-300 leading-relaxed">
            Fica salvo <strong>no seu aparelho</strong>. O cadastro oficial ativa quando o checkout do Mercado Pago for liberado — aí você recebe pedidos e comissões por aqui!
          </div>
        </div>

        {/* MEUS PRODUTOS (estado honesto!) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300 mb-2">📦 Meus produtos</div>
          <div className="text-[11px] text-slate-300 text-center py-3">
            Nenhum produto ainda — o cadastro de produtos abre junto com o checkout! 👑
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl border border-amber-400/45 bg-white/[0.07] text-amber-100 font-black text-sm active:scale-95"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

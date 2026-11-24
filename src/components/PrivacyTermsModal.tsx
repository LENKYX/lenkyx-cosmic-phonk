import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyTermsModal({ open, onClose }: Props) {
  if (!open) return null;
  const S = (t: string, d: React.ReactNode) => (
    <div className="rounded-2xl border border-amber-300/25 bg-white/[0.05] p-3.5">
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-300 mb-1.5">{t}</div>
      <div className="text-xs text-slate-200 leading-relaxed space-y-1.5">{d}</div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[160] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[86vh] overflow-y-auto no-scrollbar rounded-3xl border border-amber-300/40 bg-[#120a1e]/96 shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <ShieldCheck className="w-5 h-5 text-amber-300" /> Privacidade & Termos
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-amber-200/80 font-bold uppercase tracking-[0.14em]">
          Linguagem simples · Lei Geral de Proteção de Dados (LGPD)
        </div>

        {S('📱 O que coletamos', (
          <>
            <p>• O que você digita na busca, suas preferências (tema, idioma, canais) e músicas favoritas — guardados no seu aparelho.</p>
            <p>• Para compras e doações: apenas o necessário pra concluir com o parceiro (site do Mercado Livre, Shopee, Amazon ou o PIX da igreja).</p>
            <p>• NÃO guardamos número de cartão, senha ou dados de banco!</p>
          </>
        ))}
        {S('🎯 Para que usamos', (
          <>
            <p>• Mostrar músicas, vídeos e produtos do seu gosto e manter suas playlists salvas.</p>
            <p>• Nunca vendemos seus dados pra ninguém.</p>
          </>
        ))}
        {S('🛒 Compras com parceiros', (
          <>
            <p>• Ao comprar, você é direcionado ao site do parceiro (Mercado Livre, Shopee ou Amazon). Quem cuida do pagamento e da entrega é o parceiro.</p>
            <p>• Podemos receber comissão de afiliado — sem custo extra pra você.</p>
          </>
        ))}
        {S('💛 Doações e vaquinhas', (
          <>
            <p>• Doações vão direto ao PIX do beneficiário (igreja/campanha). O app não cobra taxa.</p>
            <p>• Guarde seu comprovante! Peça o comprovante ao enviar.</p>
            <p>• Campanhas passam por moderação antes de aparecer.</p>
          </>
        ))}
        {S('⚖️ Seus direitos (LGPD)', (
          <>
            <p>• Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento.</p>
            <p>• Canal de privacidade: pelos canais oficiais do MORRO GOLD (Instagram/WhatsApp do suporte).</p>
          </>
        ))}
        {S('📜 Termos de uso (resumo)', (
          <>
            <p>• Use o app com respeito. Nada de conteúdo ilegal, golpes ou enganação.</p>
            <p>• Conteúdos de música e vídeo vêm de fontes públicas (YouTube) — direitos autorais são dos artistas.</p>
            <p>• Este texto é informativo e não substitui aconselhamento jurídico profissional.</p>
          </>
        ))}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-black font-black text-sm active:scale-95"
        >
          Entendi! 👑
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { X, ShieldCheck, Music2, Globe2, Mail, Scale, QrCode, Lock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  creatorEmail?: string;
}

export const LegalTermsModal: React.FC<Props> = ({ open, onClose, creatorEmail }) => {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-3xl overflow-hidden bg-[#0a0418] border border-cyan-400/40 shadow-[0_0_60px_rgba(34,211,238,0.25)] text-white"
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1a0b38] to-[#0a1b2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-cyan-300" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                Termos de Uso, Direitos Autorais & Lei da Favela (MORRO GOLD)
              </h2>
              <p className="text-[11px] text-cyan-300/85">
                Plataforma Voltada Para a Favela · Código Original & Conformidade Legal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-100/90 leading-relaxed">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/35 p-4 space-y-1.5">
            <div className="font-black text-emerald-300 flex items-center gap-1.5 text-sm">
              <Music2 className="w-4 h-4" /> 1. Plataforma Voltada Para a Favela · Não-Plágio (Lei 9.610/98, Art. 8º)
            </div>
            <p>
              O <strong>MORRO GOLD</strong> é um aplicativo cultural independente{' '}
              <strong>voltado para a favela, os bailes, criadores e artistas da comunidade</strong>. Nos termos do{' '}
              <strong>Art. 8º da Lei nº 9.610/1998</strong>, layouts, menus, sistemas de canais, playlists e feeds
              funcionais são livres e <strong>não configuram plágio</strong>. A marca <strong>MORRO GOLD</strong>,
              emblema 24K, identidade Favela Ostentação e código-fonte são 100% originais.
            </p>
          </div>

          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/35 p-4 space-y-1.5">
            <div className="font-black text-cyan-300 flex items-center gap-1.5 text-sm">
              <Globe2 className="w-4 h-4" /> 2. Licenças do YouTube, Canais Próprios & Players Oficiais
            </div>
            <p>
              Os Canais criados pelos usuários dentro do <strong>MORRO GOLD</strong> seguem a{' '}
              <strong>Lei Soberana MORRO GOLD</strong> (o criador mantém 100% da autoria). Conteúdos externos do
              YouTube rodam exclusivamente pelo <strong>Player Oficial IFrame API do YouTube</strong>, sem cópia ou
              download indevido de arquivos (respeitando os Termos de Serviço e Políticas de Desenvolvedores do YouTube).
            </p>
          </div>

          <div className="rounded-2xl bg-purple-500/10 border border-purple-400/35 p-4 space-y-1.5">
            <div className="font-black text-purple-200 flex items-center gap-1.5 text-sm">
              <Lock className="w-4 h-4 text-purple-300" /> 3. Acesso Livre & Privacidade Local
            </div>
            <p>
              O MORRO GOLD prioriza acesso rápido e privacidade: playlists personalizadas e faixas offline ficam salvas
              no próprio aparelho, com canais e comentários protegidos contra plágio.
            </p>
          </div>

          <div className="rounded-2xl bg-pink-500/10 border border-pink-400/35 p-4 space-y-1.5">
            <div className="font-black text-pink-300 flex items-center gap-1.5 text-sm">
              <QrCode className="w-4 h-4" /> 4. Plataforma Gratuita, Sem Anúncios & Apoio Exclusivo via PIX
            </div>
            <p>
              O acesso a todas as seções do site e aplicativo é totalmente gratuito e livre de propagandas. O projeto
              aceita <strong>exclusivamente doações voluntárias via PIX (PicPay)</strong> para custear servidores,
              hospedagem e atualizações diárias, sem cobrança de assinatura, cartão, criptomoedas ou taxas ocultas.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.05] border border-white/15 p-4 space-y-1.5">
            <div className="font-black text-white flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-300" /> 5. Cláusula Safe Harbor (DMCA / Marco Civil) & Contato
            </div>
            <p>
              Em conformidade com as normas de Safe Harbor (DMCA e Marco Civil da Internet), titulares legítimos de
              direitos autorais podem solicitar revisão ou remoção imediata de qualquer link indexado indicando o título
              específico:
              <br />
              <span className="inline-flex items-center gap-1 mt-1 text-cyan-300 font-bold">
                <Mail className="w-3.5 h-3.5" /> {creatorEmail || 'Contato oficial via Portal MORRO GOLD'}
              </span>
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 bg-[#070212] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 text-black text-xs font-black"
          >
            Entendi & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

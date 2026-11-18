import React from 'react';
import { X, ShieldCheck, Music2, Globe2, Mail, Scale } from 'lucide-react';

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
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1a0b38] to-[#0a1b2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-cyan-300" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                Direitos Autorais, Termos & Proteção DMCA (Safe Harbor)
              </h2>
              <p className="text-[11px] text-cyan-300/85">
                LENKYX Cosmic Phonk · Transparência Legal e Autoria Original
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

        {/* Scrollable Legal Clauses */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-purple-100/90 leading-relaxed">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/35 p-4 space-y-1.5">
            <div className="font-black text-emerald-300 flex items-center gap-1.5 text-sm">
              <Music2 className="w-4 h-4" /> 1. Autoria Original LENKYX Cosmic Phonk
            </div>
            <p>
              Todas as faixas oficiais do álbum <strong>Cosmic Phonk</strong> (versões V1 e V2), capas visuais exclusivas,
              visualizadores 3D/WebGL2, código-fonte e identidade visual da marca <strong>LENKYX</strong> são obras
              originais criadas e publicadas pelo criador titular deste portal.
            </p>
          </div>

          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/35 p-4 space-y-1.5">
            <div className="font-black text-cyan-300 flex items-center gap-1.5 text-sm">
              <Globe2 className="w-4 h-4" /> 2. Reprodução de Fontes Públicas Oficiais (Embeds & Streams Abertos)
            </div>
            <p>
              Os conteúdos de busca mundial (clipes musicais oficiais, vídeos curtos, cinema em domínio público no
              Archive.org e canais de TV abertos) são reproduzidos diretamente por meio de players oficiais incorporados
              (<em>YouTube IFrame Player API</em>) ou links públicos abertos, sem hospedagem, pirataria ou comercialização de
              arquivos protegidos de terceiros nos servidores do LENKYX.
            </p>
          </div>

          <div className="rounded-2xl bg-pink-500/10 border border-pink-400/35 p-4 space-y-1.5">
            <div className="font-black text-pink-300 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4" /> 3. Conteúdo da Comunidade & Cláusula DMCA Safe Harbor
            </div>
            <p>
              Vídeos curtos, transmissões ao vivo, comentários e mensagens enviados por usuários são de responsabilidade
              exclusiva de seus respectivos autores. Em conformidade com as normas internacionais de <strong>Safe Harbor
              (DMCA / Marco Civil da Internet)</strong>, o portal mantém canal direto de atendimento para análise e
              remoção imediata de qualquer conteúdo contestado por titulares legítimos, protegendo a continuidade
              regular do aplicativo e do site no ar.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.05] border border-white/15 p-4 space-y-1.5">
            <div className="font-black text-white flex items-center gap-1.5 text-sm">
              <Mail className="w-4 h-4 text-amber-300" /> 4. Canal Oficial para Notificações & Contato
            </div>
            <p>
              Titulares de direitos autorais podem enviar notificação formal indicando a URL/título específico para
              revisão prioritária em até 24 horas:
              <br />
              <strong>Responsável:</strong> LENKYX Productions ·{' '}
              <span className="text-cyan-300">{creatorEmail || 'Contato oficial via Painel Criador / App LENKYX'}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
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

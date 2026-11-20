import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Scale,
  ShieldCheck,
  Crown,
  CheckCircle2,
  FileText,
  Youtube,
  AlertTriangle,
  Send,
  Sparkles,
} from 'lucide-react';
import { submitCopyrightReport } from '../utils/communityApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onToast?: (msg: string) => void;
  initialTab?: 'charter' | 'youtube' | 'report';
  initialTargetTitle?: string;
}

export const LegalCharterModal: React.FC<Props> = ({
  open,
  onClose,
  onToast,
  initialTab = 'charter',
  initialTargetTitle = '',
}) => {
  const [tab, setTab] = useState<'charter' | 'youtube' | 'report'>(initialTab);
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [targetTitle, setTargetTitle] = useState(initialTargetTitle);
  const [reason, setReason] = useState('Solicitação de Crédito / Remoção (Lei 9.610/98)');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  if (!open) return null;

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !details.trim()) {
      onToast?.('Preencha seu nome e os detalhes da notificação.');
      return;
    }
    setSending(true);
    const ok = await submitCopyrightReport({
      targetTitle: targetTitle.trim() || 'Conteúdo no MORRO GOLD',
      reporterName: reporterName.trim(),
      reporterEmail: reporterEmail.trim(),
      reason,
      details: details.trim(),
    });
    setSending(false);
    if (ok) {
      setSentOk(true);
      onToast?.('⚖️ Notificação registrada no protocolo Marco Civil Art. 19 / Anti-Plágio!');
    } else {
      onToast?.('Erro ao registrar protocolo. Tente novamente.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-[#0c0718] border border-amber-400/40 shadow-[0_0_80px_rgba(251,191,36,0.28)] overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/20 via-[#150c2b] to-emerald-500/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black flex items-center justify-center shrink-0 shadow-lg">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                Lei da Favela, Licenças & Blindagem Anti-Plágio · MORRO GOLD
              </h2>
              <p className="text-[11px] text-amber-200/90 truncate">
                Plataforma 100% voltada para a Favela · Código próprio & conformidade legal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-600 text-white text-xs font-black flex items-center gap-1 shrink-0 transition"
          >
            <X className="w-4 h-4" /> Fechar
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-white/10 flex flex-wrap gap-2 bg-black/30 shrink-0">
          <button
            type="button"
            onClick={() => setTab('charter')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition ${
              tab === 'charter'
                ? 'bg-amber-400 text-black shadow'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> Lei MORRO GOLD & Não-Plágio
          </button>
          <button
            type="button"
            onClick={() => setTab('youtube')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition ${
              tab === 'youtube'
                ? 'bg-red-500 text-white shadow'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" /> Licenças YouTube & APIs
          </button>
          <button
            type="button"
            onClick={() => setTab('report')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition ${
              tab === 'report'
                ? 'bg-cyan-400 text-black shadow'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Canal Anti-Plágio / Direitos
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
          {tab === 'charter' && (
            <>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-yellow-500/5 border border-amber-400/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>POR QUE O MORRO GOLD NÃO É PLÁGIO</span>
                </div>
                <p>
                  O <strong>MORRO GOLD</strong> é uma plataforma cultural brasileira{' '}
                  <strong>voltada para a favela, os bailes, a música periférica e os criadores da quebrada</strong>.
                  Ter barra lateral, canais de criadores, Shorts, playlists e botão de inscrição{' '}
                  <strong>NÃO constitui plágio</strong>:
                </p>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Art. 8º, I, II e VI da Lei nº 9.610/1998 (Lei de Direitos Autorais do Brasil):</strong>{' '}
                      ideias, sistemas, layouts funcionais, fluxos de canais, listas e conceitos de rede social{' '}
                      <strong>não são protegidos por direitos autorais</strong> e são livres para criação.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Identidade & Código 100% Próprios:</strong> Marca <strong>MORRO GOLD</strong>, emblema 24K
                      original, visual Favela Ostentação, curadoria de Bailes, Loja de Cria, Barbearias e código-fonte
                      independente protegido pela <strong>Lei do Software (Lei nº 9.609/1998)</strong>.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-black text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>LEI SOBERANA INTERNA DO MORRO GOLD (CANAIS & CRIADORES)</span>
                </div>
                <p>
                  Dentro do ecossistema <strong>MORRO GOLD</strong>, vigora a{' '}
                  <strong>Carta Cultural da Favela MORRO GOLD</strong> para todos os canais, vídeos, músicas e
                  comunidades criados pelos nossos usuários:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>
                    <strong>Autoria 100% do Cria:</strong> Todo artista, MC, DJ, barbeiro ou criador que cria seu Canal
                    no MORRO GOLD permanece dono absoluto de suas obras originais.
                  </li>
                  <li>
                    <strong>Direito de Divulgação na Comunidade:</strong> Ao publicar em seu Canal MORRO GOLD, o criador
                    autoriza a exibição dentro do app e nos Shorts da plataforma com crédito automático ao seu{' '}
                    <code>@handle</code>.
                  </li>
                  <li>
                    <strong>Proibição de Plágio Interno:</strong> Nenhum usuário pode subir obra de outro artista
                    fingindo ser sua. Todo upload exige declaração de originalidade e pode ser contestado pelo Canal
                    Anti-Plágio (Marco Civil da Internet, Art. 19).
                  </li>
                </ol>
              </div>
            </>
          )}

          {tab === 'youtube' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/30 space-y-2">
                <div className="flex items-center gap-2 text-red-300 font-black text-sm">
                  <Youtube className="w-4 h-4" />
                  <span>VERIFICAÇÃO DE LICENÇAS DO YOUTUBE & API SERVICES</span>
                </div>
                <ul className="space-y-2 text-slate-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Player Oficial IFrame API:</strong> Os vídeos públicos do YouTube exibidos em busca,
                      shorts externos ou clipes rodam exclusivamente pelo{' '}
                      <strong>Player Oficial Incorporado do YouTube</strong> (<code>youtube.com/embed</code>),
                      permitido pelos Termos de Serviço do YouTube e pelas Políticas de Desenvolvedores (Seção III.D).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Zero Pirataria / Zero Download Indevido:</strong> Em respeito à Seção III.E.1 das
                      Políticas do YouTube, o MORRO GOLD <strong>não copia, não baixa nem re-hospeda</strong> arquivos
                      audiovisuais do YouTube em servidores próprios — apenas reproduz via player oficial com crédito ao
                      canal original.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Canais Próprios MORRO GOLD:</strong> Os Canais criados pelos usuários dentro do MORRO GOLD
                      são hospedagem cultural própria da favela — totalmente independente de qualquer exclusividade de
                      terceiros.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <strong>Base Legal Completa:</strong> Lei Federal nº 9.610/1998 (Direitos Autorais, Art. 8º), Lei nº
                  9.609/1998 (Programa de Computador), Marco Civil da Internet (Lei nº 12.965/2014, Art. 19) e YouTube
                  API Services Developer Policies.
                </div>
              </div>
            </div>
          )}

          {tab === 'report' && (
            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-xs text-cyan-100">
                <strong>Proteção Jurídica Ativa (Marco Civil Art. 19 & DMCA):</strong> Se você é titular de uma obra ou
                identificou plágio em algum canal/upload de usuário, registre abaixo para revisão e atribuição/remoção
                imediata.
              </div>

              {sentOk ? (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="font-black text-white">Protocolo registrado com sucesso!</div>
                  <p className="text-xs text-emerald-100/80">
                    Nossa moderação cultural analisa pedidos de crédito ou remoção com prioridade.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSentOk(false);
                      setDetails('');
                    }}
                    className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold text-white"
                  >
                    Enviar outra notificação
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Seu nome completo ou nome artístico"
                      className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="E-mail para resposta (opcional)"
                      className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <input
                    type="text"
                    value={targetTitle}
                    onChange={(e) => setTargetTitle(e.target.value)}
                    placeholder="Nome do canal, vídeo ou música referente"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#120b24] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Solicitação de Crédito / Remoção (Lei 9.610/98)">
                      Solicitação de Crédito / Remoção (Lei 9.610/98)
                    </option>
                    <option value="Denúncia de Plágio de Canal ou Beat">Denúncia de Plágio de Canal ou Beat</option>
                    <option value="Uso Indevido de Imagem / Marca">Uso Indevido de Imagem / Marca</option>
                  </select>
                  <textarea
                    rows={3}
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Descreva a obra original, link ou comprovante de autoria..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? 'Registrando...' : 'Registrar Notificação Legal'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

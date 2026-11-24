import React, { useState } from 'react';
import { X, LifeBuoy, Copy, Send, FileText, AlertTriangle } from 'lucide-react';

/**
 * 🆘 SUPORTE & DENÚNCIA — fluxo real (documento de execução §13 e §6).
 * Protocolo gerado de verdade, salvo no aparelho, envio por WhatsApp.
 */

interface Props {
  open: boolean;
  onClose: () => void;
}

type Relato = { protocolo: string; tipo: string; texto: string; em: string };

const LS_KEY = 'mg_support_reports_v1';

function loadRelatos(): Relato[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Relato[]) : [];
  } catch {
    return [];
  }
}

export default function SupportReportModal({ open, onClose }: Props) {
  const [tipo, setTipo] = useState('reclamacao');
  const [texto, setTexto] = useState('');
  const [relatos, setRelatos] = useState<Relato[]>(loadRelatos);
  const [ultimo, setUltimo] = useState<Relato | null>(null);

  if (!open) return null;

  const TIPOS = [
    { id: 'reclamacao', label: '😤 Reclamação' },
    { id: 'denuncia', label: '🚨 Denúncia de conteúdo' },
    { id: 'doacao', label: '💛 Questão de doação' },
    { id: 'compra', label: '🛒 Questão de compra' },
    { id: 'lgpd', label: '🛡️ Privacidade / LGPD' },
    { id: 'outro', label: '📌 Outro assunto' },
  ];

  const gerar = () => {
    if (texto.trim().length < 10) {
      window.alert('Descreve melhor o que aconteceu (mínimo 10 letras)! ✍️');
      return;
    }
    const proto = 'MG-' + Date.now().toString(36).toUpperCase();
    const relato: Relato = {
      protocolo: proto,
      tipo: TIPOS.find((t) => t.id === tipo)?.label || tipo,
      texto: texto.trim(),
      em: new Date().toLocaleString('pt-BR'),
    };
    const next = [relato, ...relatos].slice(0, 30);
    setRelatos(next);
    setUltimo(relato);
    setTexto('');
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* ok */
    }
  };

  const msgWhats = (r: Relato) =>
    `MORRO GOLD — Atendimento\nProtocolo: ${r.protocolo}\nTipo: ${r.tipo}\nData: ${r.em}\nRelato: ${r.texto}`;

  return (
    <div className="fixed inset-0 z-[160] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto no-scrollbar rounded-3xl border border-amber-300/40 bg-[#120a1e]/96 shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <LifeBuoy className="w-5 h-5 text-amber-300" /> Suporte & Denúncia
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-amber-200/80 font-bold uppercase tracking-[0.14em]">
          Protocolo real · resposta pelos canais oficiais · moderação de conteúdo
        </div>

        {/* TIPO */}
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipo(t.id)}
              className={`rounded-2xl px-3 py-2.5 text-[11px] font-bold border transition active:scale-95 ${
                tipo === t.id
                  ? 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 text-[#2a1d05] border-amber-100/70'
                  : 'bg-white/[0.06] text-amber-100 border-amber-300/25 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* RELATO */}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder="Conta o que aconteceu (com detalhes, links, horários)..."
          className="w-full px-3 py-2.5 rounded-2xl bg-black/30 border border-amber-300/35 text-xs text-amber-50 focus:outline-none focus:border-amber-300 resize-none"
        />
        <button
          type="button"
          onClick={gerar}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-black font-black text-sm flex items-center justify-center gap-2 active:scale-95"
        >
          <FileText className="w-4 h-4" /> GERAR PROTOCOLO
        </button>

        {/* ÚLTIMO RELATO + AÇÕES */}
        {ultimo && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3.5 space-y-2">
            <div className="text-[11px] font-black text-amber-200">
              ✅ Protocolo <strong>{ultimo.protocolo}</strong> aberto!
            </div>
            <div className="flex gap-2">
              <a
                href={'https://wa.me/?text=' + encodeURIComponent(msgWhats(ultimo))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-black text-[11px] flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Enviar por WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(msgWhats(ultimo));
                  window.alert('Relato copiado! 📋');
                }}
                className="px-4 py-2.5 rounded-xl border border-amber-400/45 bg-white/[0.07] text-amber-100 font-black text-[11px] flex items-center gap-1.5 active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar
              </button>
            </div>
          </div>
        )}

        {/* HISTÓRICO */}
        {relatos.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 space-y-2">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-300">📜 Meus protocolos</div>
            {relatos.slice(0, 5).map((r) => (
              <div key={r.protocolo} className="rounded-xl bg-black/25 px-3 py-2">
                <div className="text-[10px] font-black text-amber-200">
                  {r.protocolo} · {r.tipo} · {r.em}
                </div>
                <div className="text-[10px] text-slate-300 line-clamp-2">{r.texto}</div>
              </div>
            ))}
          </div>
        )}

        {/* MODERAÇÃO (documento §6!) */}
        <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 p-3 text-[10px] text-rose-100 leading-relaxed flex gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          <span>
            <strong>Moderação:</strong> denúncias de conteúdo são analisadas e o conteúdo pode ser removido. Golpes, falsificações e conteúdo ilegal são proibidos e serão reportados às autoridades quando necessário.
          </span>
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

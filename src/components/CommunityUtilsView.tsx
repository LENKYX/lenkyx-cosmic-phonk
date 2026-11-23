import React from 'react';
import { Heart, MapPin, Phone, BookOpen, Briefcase, Church, ExternalLink, Sparkles } from 'lucide-react';

/**
 * 🛠️ UTILIDADES DA COMUNIDADE — MORRO GOLD
 * Tela de uso DIÁRIO: emergências com 1 toque, igrejas, trabalho/documentos e estudo.
 * Tudo organizado, só pt-BR, só Brasil. Sem cobranças — só utilidade real.
 */

interface Props {
  onOpenPix?: (origin?: string) => void;
}

const EMERGENCIAS: { num: string; label: string; desc: string; tone: 'red' | 'amber' | 'emerald' | 'sky' }[] = [
  { num: '192', label: 'SAMU', desc: 'Emergência médica', tone: 'red' },
  { num: '193', label: 'Bombeiros', desc: 'Incêndio e resgate', tone: 'red' },
  { num: '190', label: 'Polícia Militar', desc: 'Emergência policial', tone: 'sky' },
  { num: '199', label: 'Defesa Civil', desc: 'Desabamento, enchente', tone: 'amber' },
  { num: '181', label: 'Disque-Denúncia', desc: 'Denúncia anônima', tone: 'sky' },
  { num: '100', label: 'Disque 100', desc: 'Direitos humanos', tone: 'emerald' },
  { num: '180', label: 'Central da Mulher', desc: 'Apoio e denúncia', tone: 'emerald' },
  { num: '188', label: 'CVV · Precisa conversar?', desc: 'Apoio emocional 24h', tone: 'emerald' },
];

const IGREJAS = [
  'Igreja Batista Ministério de Fé (São Pedro)',
  'Igreja Evangélica Comunidade da Graça (Jardim dos Estados)',
  'Igreja Universal do Reino de Deus (Centro)',
  'Igreja Adventista do Sétimo Dia (Nova Lima)',
  'Igreja Católica Nossa Senhora Aparecida (Vila Sobrinho)',
];

const SERVICOS: { icon: string; label: string; desc: string; url: string }[] = [
  { icon: '🪪', label: 'Carteira de Trabalho', desc: 'CTPS digital e gov.br', url: 'https://www.gov.br/pt-br' },
  { icon: '🏦', label: 'FGTS e Caixa', desc: 'Saldo, saque e benefícios', url: 'https://www.caixa.gov.br' },
  { icon: '🧾', label: 'Consulta CPF', desc: 'Receita Federal', url: 'https://servicos.receita.fazenda.gov.br' },
  { icon: '👴', label: 'Meu INSS', desc: 'Aposentadoria e benefícios', url: 'https://meu.inss.gov.br' },
  { icon: '⚡', label: 'Energisa (energia)', desc: '2ª via e faturas', url: 'https://www.energisa.com.br' },
  { icon: '📋', label: 'Bolsa Família e benefícios', desc: 'Consultar no gov.br', url: 'https://www.gov.br/pt-br' },
];

const APRENDER: { icon: string; label: string; desc: string; url: string }[] = [
  { icon: '📚', label: 'Khan Academy', desc: 'Matéria da escola grátis', url: 'https://pt.khanacademy.org' },
  { icon: '🎓', label: 'EJA e cursos grátis', desc: 'Terminar os estudos (gov.br)', url: 'https://www.gov.br/pt-br' },
  { icon: '💻', label: 'Informática básica', desc: 'Aprender no próprio celular', url: 'https://pt.khanacademy.org' },
];

const toneClasses: Record<string, string> = {
  red: 'border-rose-400/45 bg-rose-500/15 hover:bg-rose-500/25',
  amber: 'border-amber-400/45 bg-amber-500/15 hover:bg-amber-500/25',
  emerald: 'border-emerald-400/45 bg-emerald-500/15 hover:bg-emerald-500/25',
  sky: 'border-sky-400/45 bg-sky-500/15 hover:bg-sky-500/25',
};

const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <h2 className="text-sm sm:text-base font-black text-amber-200 flex items-center gap-2 mb-3">
    {icon}
    {children}
  </h2>
);

export default function CommunityUtilsView({ onOpenPix }: Props) {
  return (
    <div className="max-w-[1100px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-5">
      {/* CABEÇALHO */}
      <section className="rounded-3xl cosmic-card-3d p-5 text-center">
        <div className="text-3xl mb-1">🛠️</div>
        <h1 className="text-lg sm:text-2xl font-black text-white">UTILIDADES DA COMUNIDADE</h1>
        <p className="text-[11px] sm:text-xs text-amber-200/90 font-semibold mt-1">
          Tudo que ajuda o dia a dia do morro — emergência, igreja, trabalho e estudo num toque só!
        </p>
      </section>

      {/* 🆘 EMERGÊNCIAS */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5">
        <SectionTitle icon={<Phone className="w-4 h-4 text-rose-300" />}>🆘 EMERGÊNCIAS · É SÓ TOCAR</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {EMERGENCIAS.map((e) => (
            <a
              key={e.num}
              href={`tel:${e.num}`}
              className={`rounded-2xl border p-3 flex flex-col items-center text-center transition active:scale-95 ${toneClasses[e.tone]}`}
            >
              <span className="text-xl sm:text-2xl font-black text-white leading-none">{e.num}</span>
              <span className="text-[11px] font-black text-white mt-1 leading-tight">{e.label}</span>
              <span className="text-[9px] text-slate-200/85 leading-tight">{e.desc}</span>
            </a>
          ))}
        </div>
      </section>

      {/* 🙏 IGREJAS */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5">
        <SectionTitle icon={<Church className="w-4 h-4 text-amber-300" />}>🙏 IGREJAS DAS COMUNIDADES</SectionTitle>
        <div className="space-y-2">
          {IGREJAS.map((nome) => (
            <div
              key={nome}
              className="flex items-center gap-2.5 rounded-2xl border border-amber-400/25 bg-white/[0.05] px-3 py-2.5"
            >
              <span className="text-base">⛪</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] sm:text-xs font-black text-white leading-tight">{nome}</div>
                <div className="text-[9px] text-slate-300">Horários: confirme direto na igreja · Todos os dias abertas pra você</div>
              </div>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(nome)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-amber-400/25 border border-amber-400/40 text-[10px] font-black text-amber-100 flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" /> Como chegar
              </a>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onOpenPix?.('utilidades')}
          className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_10px_26px_rgba(245,200,76,0.35)] hover:brightness-110 transition active:scale-95"
        >
          <Heart className="w-4 h-4" /> 🙏 Doar pras igrejas das comunidades (PIX)
        </button>
      </section>

      {/* 💼 TRABALHO & DOCUMENTOS */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5">
        <SectionTitle icon={<Briefcase className="w-4 h-4 text-emerald-300" />}>💼 TRABALHO &amp; DOCUMENTOS</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SERVICOS.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-emerald-400/25 bg-white/[0.05] hover:bg-emerald-500/15 px-3 py-2.5 flex items-center gap-2.5 transition active:scale-95"
            >
              <span className="text-lg">{s.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] sm:text-xs font-black text-white leading-tight">{s.label}</div>
                <div className="text-[9px] text-slate-300">{s.desc}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* 📚 APRENDER */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5">
        <SectionTitle icon={<BookOpen className="w-4 h-4 text-sky-300" />}>📚 APRENDER DE GRAÇA</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {APRENDER.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-sky-400/25 bg-white/[0.05] hover:bg-sky-500/15 px-3 py-2.5 flex items-center gap-2.5 transition active:scale-95"
            >
              <span className="text-lg">{s.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-white leading-tight">{s.label}</div>
                <div className="text-[9px] text-slate-300">{s.desc}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* RODAPÉ */}
      <div className="text-center text-[10px] text-slate-300 pb-2 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3 text-amber-300" />
        Fechado com o morro 🖤👑 · Só utilidade real, sem cobrança nenhuma
      </div>
    </div>
  );
}

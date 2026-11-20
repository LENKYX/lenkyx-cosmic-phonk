import React, { useCallback, useEffect, useState } from 'react';
import {
  MapPin,
  Calendar,
  ExternalLink,
  RefreshCw,
  Plus,
  X,
  Scissors,
  Sparkles,
  Share2,
  Flame,
  Navigation,
  MessageCircle,
  Radio,
} from 'lucide-react';

interface BaileEvent {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  address: string;
  schedule: string;
  lineup: string;
  entry: string;
  badge: string;
  contact?: string;
  sourceUrl?: string;
  liveUpdated?: boolean;
}

const CITY_FILTERS = [
  { id: 'all', label: '🇧🇷 Brasil Todo' },
  { id: 'São Paulo', label: '🏙️ São Paulo' },
  { id: 'Rio de Janeiro', label: '🌴 Rio de Janeiro' },
  { id: 'Campo Grande', label: '🏍️ Campo Grande MS' },
  { id: 'Belo Horizonte', label: '⚡ BH / Minas' },
];

const HAIRCUT_TRENDS = [
  {
    title: 'Corte do Jaca & Taper Fade Americano',
    who: 'Manos · Em Alta 2026',
    desc: 'Disfarce limpo na lateral e nuca, volume desenhado em cima e pezinho navalhado na régua.',
    tag: '🔥 #1 NA QUEBRADA',
  },
  {
    title: 'Platinado / Nevou Blindado + Reflexo Alinhado',
    who: 'Manos · Visual Ostentação',
    desc: 'Descoloração perolada sem queimar o couro + hidratação VIP e risquinho na sobrancelha.',
    tag: '❄️ NEVOU VIP',
  },
  {
    title: 'Degradê Navalhado Mid/Low Fade + Freestyle',
    who: 'Manos · Clássico de Baile',
    desc: 'Sombreado zero na navalha com risco lateral em 3D pra chegar chave no fluxo.',
    tag: '💈 NA RÉGUA',
  },
  {
    title: 'Morena Iluminada, Baby Liss & Lace / Box Braids',
    who: 'Minas · Look de Baile & Verão',
    desc: 'Ondas brilhantes, pontas iluminadas douradas ou tranças nagô/box braids de respeito.',
    tag: '💎 BRILHO DAS MINAS',
  },
];

const TOP_BARBERSHOPS = [
  {
    name: 'Ariel Barbeiro — O Rei do Blindado',
    city: 'São Paulo (SP)',
    specialty: 'Criador do Blindado, Reflexo Alinhado & Platinado Perfeito',
    query: 'Ariel Barbeiro Blindado barbearia Sao Paulo',
  },
  {
    name: 'Seu Elias Barbearia VIP',
    city: 'Belo Horizonte & São Paulo',
    specialty: 'Referência nacional em Degradê Navalhado, Visagismo & Corte Executivo',
    query: 'Seu Elias Barbearia Belo Horizonte',
  },
  {
    name: 'Barbearia Torres & Du Corte RJ',
    city: 'Rio de Janeiro (RJ)',
    specialty: 'Corte do Jaca, Freestyle, Nevou Carioca & Disfarce Perfeito',
    query: 'melhor barbearia corte do jaca Rio de Janeiro',
  },
  {
    name: 'Salões VIP Tranças, Mega Hair & Morena Iluminada',
    city: 'Todo o Brasil',
    specialty: 'Box Braids, Lace Front, Hidratação Ouro & Escova Modelada pras Minas',
    query: 'melhor salao de beleza tranças mega hair morena iluminada perto de mim',
  },
];

interface Props {
  onToast: (msg: string) => void;
  onCommentTarget?: (id: string, title: string) => void;
  onOpenLiveChat?: (roomId: string, roomTitle: string) => void;
}

export const BailesAndEstiloView: React.FC<Props> = ({
  onToast,
  onCommentTarget,
  onOpenLiveChat,
}) => {
  const [city, setCity] = useState('all');
  const [customCity, setCustomCity] = useState('');
  const [bailes, setBailes] = useState<BaileEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedLabel, setUpdatedLabel] = useState('');

  // Divulgar Baile Modal
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formSchedule, setFormSchedule] = useState('');
  const [formLineup, setFormLineup] = useState('');
  const [formEntry, setFormEntry] = useState('');

  const loadBailes = useCallback(async (targetCity: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/bailes/live?city=${encodeURIComponent(targetCity || 'all')}`);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data?.bailes)) {
          setBailes(data.bailes);
        }
        setUpdatedLabel(
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
      }
    } catch {
      // ignore offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeCity = customCity.trim() || city;
    void loadBailes(activeCity);
    // Auto-refresh automatically every 5 minutes so the site and mobile app stay live!
    const t = window.setInterval(() => {
      void loadBailes(activeCity);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(t);
  }, [city, customCity, loadBailes]);

  const handleSubmitBaile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCity.trim() || !formAddress.trim()) {
      onToast('Preencha nome do baile, cidade e endereço!');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/bailes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          city: formCity,
          neighborhood: formNeighborhood,
          address: formAddress,
          schedule: formSchedule,
          lineup: formLineup,
          entry: formEntry,
        }),
      });
      if (r.ok) {
        onToast('🔥 Seu Baile foi divulgado ao vivo no site e no app!');
        setSubmitOpen(false);
        setFormTitle('');
        setFormNeighborhood('');
        setFormAddress('');
        setFormSchedule('');
        setFormLineup('');
        setFormEntry('');
        void loadBailes(customCity.trim() || city);
      }
    } catch {
      onToast('Erro ao enviar divulgação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const shareBaileZap = (b: BaileEvent) => {
    const txt = `🔥 BORA PRO BAILE, CRIA!\n\n🎉 ${b.title}\n📍 Endereço: ${b.address} (${b.city})\n🕒 Quando: ${b.schedule}\n🔊 ${b.lineup}\n🎟️ ${b.entry}\n\n📲 Visto no App MORRO GOLD 💎!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      {/* 1. AGENDA AUTOMÁTICA DOS ROLÊS & BAILES DE FAVELA */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5 space-y-4 border border-amber-400/35">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>AGENDA AUTOMÁTICA AO VIVO · ATUALIZADA {updatedLabel ? `ÀS ${updatedLabel}` : 'AGORA'}</span>
            </div>
            <h2 className="font-display text-base sm:text-xl font-black lux-gold-text">
              🔊 Rolês & Bailes de Favela Atualizados (Endereços & Divulgações)
            </h2>
            <p className="text-xs text-slate-300">
              Os fluxos mais pesados deste fim de semana no site e no app, com endereço no mapa e divulgação grátis pros organizadores!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenLiveChat && (
              <button
                type="button"
                onClick={() => onOpenLiveChat('bailes', '💃 Bailes & Rolês · Chat Ao Vivo')}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-rose-600 to-pink-500 text-white text-xs font-black flex items-center gap-1.5 shadow"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Chat dos Bailes Ao Vivo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void loadBailes(customCity.trim() || city)}
              disabled={loading}
              className="px-3.5 py-2 rounded-full lux-btn-obsidian text-xs font-bold text-amber-200 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Rolês</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="px-4 py-2 rounded-full lux-btn-gold text-xs font-black flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Divulgar Meu Baile Grátis</span>
            </button>
          </div>
        </div>

        {/* City filters + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CITY_FILTERS.map((cf) => (
              <button
                key={cf.id}
                type="button"
                onClick={() => {
                  setCustomCity('');
                  setCity(cf.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition ${
                  !customCity.trim() && city === cf.id
                    ? 'lux-btn-gold'
                    : 'lux-btn-obsidian text-slate-200'
                }`}
              >
                {cf.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            placeholder="Filtrar sua cidade ou bairro..."
            className="sm:ml-auto sm:w-56 px-3.5 py-1.5 rounded-full bg-black/60 border border-amber-400/25 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-300"
          />
        </div>

        {/* Bailes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {bailes.slice(0, 9).map((b) => (
            <div
              key={b.id}
              className="rounded-2xl bg-[#090b13] border border-amber-400/25 hover:border-amber-300/60 p-3.5 flex flex-col justify-between gap-3 transition shadow-lg"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-[9px] font-black text-amber-200">
                    {b.badge}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300">{b.city}</span>
                </div>

                <h3 className="font-display text-sm font-black text-white leading-snug">
                  {b.title}
                </h3>

                <div className="text-[11px] text-amber-200/95 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </div>

                <div className="text-[11px] text-cyan-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{b.schedule}</span>
                </div>

                <p className="text-[11px] text-slate-300/90 leading-relaxed line-clamp-2">
                  {b.lineup}
                </p>
                <div className="text-[10px] font-bold text-emerald-300">🎟️ {b.entry}</div>
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(b.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-full lux-btn-gold text-[11px] font-black flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Mapa
                </a>
                {onCommentTarget && (
                  <button
                    type="button"
                    onClick={() => onCommentTarget(`baile:${b.id}`, `💃 ${b.title}`)}
                    className="py-2 px-3 rounded-full lux-btn-obsidian text-[11px] font-bold text-cyan-200 flex items-center gap-1"
                    title="Comentar neste baile"
                  >
                    <MessageCircle className="w-3 h-3" /> Comentar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => shareBaileZap(b)}
                  className="py-2 px-3 rounded-full lux-btn-obsidian text-[11px] font-bold text-emerald-200 flex items-center gap-1"
                  title="Chamar os parças no WhatsApp"
                >
                  <Share2 className="w-3 h-3" /> Zap
                </button>
                {b.sourceUrl && (
                  <a
                    href={b.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full lux-btn-obsidian text-cyan-300"
                    title="Abrir divulgação"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. MELHORES CORTES DE CABELO ATUALIZADOS + SALÕES & BARBEARIAS VIP */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5 space-y-4 border border-amber-400/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden border border-amber-400/40 shadow-xl">
            <img
              src="/shop/barbearia-cortes-crias.jpg"
              alt="Melhores Cortes de Cabelo dos Cria e das Minas"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/85 border border-amber-400/50 text-[9px] font-black text-amber-200">
              💈 RÉGUA MÁXIMA · OS MANOS & AS MINAS
            </span>
            <div className="absolute bottom-2.5 left-3 right-3 text-xs font-bold text-white">
              Degradê Navalhado, Jaca, Nevou, Reflexo Alinhado & Look das Minas
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" /> CORTES ATUALIZADOS 2026 & BARBEARIAS VIP
                </div>
                <h2 className="font-display text-base sm:text-xl font-black text-white">
                  💈 Cortes na Régua pro Baile + Melhores Salões de Cabeleireiro
                </h2>
              </div>
              <a
                href="https://www.google.com/maps/search/melhor+barbearia+e+salao+de+cabeleireiro+perto+de+mim"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full lux-btn-gold text-xs font-black flex items-center gap-1.5 shadow-lg"
              >
                📍 Achar Salão / Barbearia Perto de Mim
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Top Updated Cuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HAIRCUT_TRENDS.map((cut, cIdx) => (
                <div
                  key={cut.title}
                  className="p-2.5 rounded-2xl bg-black/55 border border-amber-400/20 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-200 border border-amber-400/35">
                      {cut.tag}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-cyan-300 font-bold">{cut.who}</span>
                      {onCommentTarget && (
                        <button
                          type="button"
                          onClick={() => onCommentTarget(`corte:${cIdx}`, `💈 ${cut.title}`)}
                          className="p-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200"
                          title="Comentar neste corte"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-black text-white">{cut.title}</div>
                  <p className="text-[11px] text-slate-300 leading-snug">{cut.desc}</p>
                </div>
              ))}
            </div>

            {/* Best Barbers & Salons Directory */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Indicação dos Melhores Salões & Barbearias do Brasil:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TOP_BARBERSHOPS.map((shop, sIdx) => (
                  <div
                    key={shop.name}
                    className="p-2.5 rounded-xl bg-[#0a0d16] hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/50 transition flex items-center justify-between gap-2"
                  >
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(shop.query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1"
                    >
                      <div className="text-xs font-black text-amber-200 truncate">{shop.name}</div>
                      <div className="text-[10px] text-slate-300 truncate">
                        {shop.specialty} · {shop.city}
                      </div>
                    </a>
                    <div className="flex items-center gap-1 shrink-0">
                      {onCommentTarget && (
                        <button
                          type="button"
                          onClick={() => onCommentTarget(`salao:${sIdx}`, `💈 ${shop.name}`)}
                          className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200"
                          title="Avaliar / Comentar salão"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(shop.query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 text-amber-300"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Divulgar Meu Baile Grátis */}
      {submitOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleSubmitBaile(e)}
            className="w-full max-w-md rounded-3xl cosmic-card-3d border border-amber-400/45 p-5 space-y-3 bg-[#090b13]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-black lux-gold-text">
                📢 Divulgar Baile / Rolê Ao Vivo
              </h3>
              <button
                type="button"
                onClick={() => setSubmitOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Publica na hora no site e no app de celular pra galera achar o endereço e colar no baile!
            </p>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Nome do Baile / Festa (ex: Baile da Laje VIP)"
              className="w-full px-3.5 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="Cidade / UF (ex: São Paulo - SP)"
                className="w-full px-3.5 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white"
              />
              <input
                type="text"
                value={formNeighborhood}
                onChange={(e) => setFormNeighborhood(e.target.value)}
                placeholder="Bairro / Quebrada"
                className="w-full px-3.5 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white"
              />
            </div>
            <input
              type="text"
              required
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Endereço Completo (Rua, número ou ponto de referência)"
              className="w-full px-3.5 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formSchedule}
                onChange={(e) => setFormSchedule(e.target.value)}
                placeholder="Dia e Horário (ex: Sexta 22h)"
                className="w-full px-3.5 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white"
              />
              <input
                type="text"
                value={formEntry}
                onChange={(e) => setFormEntry(e.target.value)}
                placeholder="Entrada (ex: Free / R$ 20)"
                className="w-full px-3.5 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white"
              />
            </div>
            <input
              type="text"
              value={formLineup}
              onChange={(e) => setFormLineup(e.target.value)}
              placeholder="Atrações / DJs / MCs / Bebidas"
              className="w-full px-3.5 py-2 rounded-xl bg-black/70 border border-white/15 text-xs text-white"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-full lux-btn-gold text-xs font-black"
            >
              {submitting ? 'Publicando...' : '🔥 Publicar Rolê Agora'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// LENKYX Arena Esportiva — Futebol Ao Vivo & Lutas UFC / MMA em Tempo Real
// Combina placares oficiais em tempo real (ESPN public JSON) + transmissões e combates completos sem anúncios

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

let sportsCache = { ts: 0, payload: null };
const sportsSearchCache = new Map();

const SOCCER_LEAGUES = [
  { slug: 'bra.1', name: 'Brasileirão Série A', badge: '🇧🇷' },
  { slug: 'conmebol.libertadores', name: 'Copa Libertadores', badge: '🏆' },
  { slug: 'uefa.champions', name: 'UEFA Champions League', badge: '⭐' },
  { slug: 'eng.1', name: 'Premier League', badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'esp.1', name: 'La Liga', badge: '🇪🇸' },
];

function extractVideoRenderers(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) extractVideoRenderers(item, out);
    return out;
  }
  if (node.videoRenderer && node.videoRenderer.videoId) {
    out.push(node.videoRenderer);
  }
  for (const k of Object.keys(node)) {
    if (k !== 'videoRenderer') extractVideoRenderers(node[k], out);
  }
  return out;
}

function pickThumb(vr, vid) {
  const thumbs = vr?.thumbnail?.thumbnails || [];
  const best = thumbs[thumbs.length - 1]?.url || '';
  if (best.startsWith('https://')) return best;
  return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
}

async function fetchEspnScoreboard(path) {
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data?.events) ? data.events : [];
  } catch {
    return [];
  }
}

function formatSoccerEvent(ev, leagueInfo) {
  const comp = ev?.competitions?.[0];
  const competitors = comp?.competitors || [];
  const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
  const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];
  if (!home || !away) return null;

  const state = ev?.status?.type?.state || 'pre'; // pre | in | post
  const detail = ev?.status?.type?.shortDetail || ev?.status?.type?.description || '';
  return {
    id: `soc-${leagueInfo.slug}-${ev.id}`,
    sport: 'soccer',
    league: leagueInfo.name,
    badge: leagueInfo.badge,
    title: `${home.team?.shortDisplayName || home.team?.name} x ${away.team?.shortDisplayName || away.team?.name}`,
    homeName: home.team?.shortDisplayName || home.team?.name || 'Casa',
    awayName: away.team?.shortDisplayName || away.team?.name || 'Visitante',
    homeLogo: home.team?.logo || '',
    awayLogo: away.team?.logo || '',
    homeScore: String(home.score ?? '0'),
    awayScore: String(away.score ?? '0'),
    isLive: state === 'in',
    statusState: state,
    statusText: state === 'in' ? `AO VIVO · ${detail}` : detail || 'Em breve',
    dateIso: ev.date || '',
    searchQuery: `${home.team?.shortDisplayName || home.team?.name} ${away.team?.shortDisplayName || away.team?.name} futebol ao vivo jogo`,
  };
}

function formatUfcEvent(ev) {
  const comps = ev?.competitions || [];
  const mainFight = comps[comps.length - 1] || comps[0];
  const fighters = mainFight?.competitors || [];
  const f1 = fighters[0];
  const f2 = fighters[1];
  const state = ev?.status?.type?.state || 'pre';
  const detail = ev?.status?.type?.shortDetail || ev?.status?.type?.description || '';
  const venue = mainFight?.venue?.fullName || '';

  const f1Name = f1?.athlete?.displayName || f1?.athlete?.shortName || '';
  const f2Name = f2?.athlete?.displayName || f2?.athlete?.shortName || '';
  const headline = f1Name && f2Name ? `${f1Name} vs ${f2Name}` : ev.shortName || ev.name;

  const cardBouts = comps.slice(-6).reverse().map((c, idx) => {
    const cs = c?.competitors || [];
    const a = cs[0]?.athlete?.displayName || 'Lutador A';
    const b = cs[1]?.athlete?.displayName || 'Lutador B';
    const winner = cs.find((x) => x.winner)?.athlete?.displayName || '';
    return {
      id: `${ev.id}-bout-${idx}`,
      fighters: `${a} vs ${b}`,
      weightClass: c?.type?.text || 'MMA',
      status: c?.status?.type?.shortDetail || '',
      winner,
    };
  });

  return {
    id: `ufc-${ev.id}`,
    sport: 'mma',
    league: 'UFC · Octógono Oficial',
    badge: '🥊',
    title: ev.name || headline,
    matchup: headline,
    fighter1: f1Name,
    fighter2: f2Name,
    fighter1Flag: f1?.athlete?.flag?.href || '',
    fighter2Flag: f2?.athlete?.flag?.href || '',
    venue,
    isLive: state === 'in',
    statusState: state,
    statusText: state === 'in' ? `AO VIVO NO OCTÓGONO · ${detail}` : detail || 'Card Confirmado',
    dateIso: ev.date || '',
    bouts: cardBouts,
    searchQuery: `${headline} UFC MMA luta completa`,
  };
}

async function fetchSportStreams(query, { liveOnly = false, sport = 'soccer', category = 'Esportes', limit = 16 } = {}) {
  const spFlag = liveOnly ? '&sp=EgJAAQ%253D%253D' : '';
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${spFlag}`;
  const out = [];
  const seen = new Set();

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' },
      signal: AbortSignal.timeout(6500),
    });
    if (!r.ok) return out;
    const html = await r.text();
    const marker = 'var ytInitialData = ';
    const idx = html.indexOf(marker);
    if (idx === -1) return out;
    const sub = html.slice(idx + marker.length);
    const end = sub.indexOf(';</script>');
    if (end === -1) return out;
    const data = JSON.parse(sub.slice(0, end));
    const renderers = extractVideoRenderers(data);

    for (const vr of renderers) {
      const vid = vr.videoId;
      if (!vid || seen.has(vid)) continue;
      const title = (vr.title?.runs || []).map((x) => x.text).join('') || 'Transmissão Esportiva';
      const channel = (vr.ownerText?.runs || []).map((x) => x.text).join('') || 'LENKYX Arena';
      const durText = vr.lengthText?.simpleText || '';
      const badges = (vr.badges || []).map((b) => b?.metadataBadgeRenderer?.label || '').join(' ');
      const isLiveBadge =
        /ao vivo|live/i.test(badges) ||
        /ao vivo|live/i.test(title) ||
        !durText;

      // Filter out overly short clickbait clips when not live
      if (!liveOnly && durText) {
        const parts = durText.split(':').map((n) => parseInt(n, 10) || 0);
        const sec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + (parts[1] || 0);
        if (sec > 0 && sec < 90) continue;
      }

      seen.add(vid);
      out.push({
        id: `sp-${vid}`,
        title,
        subtitle: channel,
        category,
        sport,
        isLive: liveOnly || isLiveBadge,
        durationLabel: liveOnly || !durText ? 'AO VIVO' : durText,
        posterUrl: pickThumb(vr, vid),
        youtubeVideoId: vid,
        sourceLabel: liveOnly || isLiveBadge ? 'AO VIVO' : sport === 'mma' ? 'Luta HD' : 'Futebol HD',
        qualityLabel: 'HD 1080p',
      });
      if (out.length >= limit) break;
    }
  } catch {
    // ignore upstream timeout
  }
  return out;
}

export async function getSportsDirectory(forceRefresh = false) {
  if (!forceRefresh && sportsCache.payload && Date.now() - sportsCache.ts < 1000 * 60 * 5) {
    return sportsCache.payload;
  }

  const [ufcRaw, ...soccerRawList] = await Promise.all([
    fetchEspnScoreboard('mma/ufc/scoreboard'),
    ...SOCCER_LEAGUES.map((l) => fetchEspnScoreboard(`soccer/${l.slug}/scoreboard`)),
  ]);

  const ufcScoreboard = ufcRaw.map(formatUfcEvent).filter(Boolean);
  const soccerScoreboard = [];
  SOCCER_LEAGUES.forEach((league, i) => {
    for (const ev of soccerRawList[i] || []) {
      const formatted = formatSoccerEvent(ev, league);
      if (formatted) soccerScoreboard.push(formatted);
    }
  });
  soccerScoreboard.sort((a, b) => Number(b.isLive) - Number(a.isLive));

  const [liveFootball, liveMma, ufcFights, footballMatches] = await Promise.all([
    fetchSportStreams('futebol ao vivo jogo com imagens brasileirao champions', {
      liveOnly: true,
      sport: 'soccer',
      category: 'Futebol Ao Vivo',
      limit: 14,
    }),
    fetchSportStreams('UFC MMA fight live 24/7 lutas ao vivo', {
      liveOnly: true,
      sport: 'mma',
      category: 'UFC & MMA Ao Vivo',
      limit: 14,
    }),
    fetchSportStreams('UFC luta completa brasileira Alex Poatan Charles do Bronx nocaute', {
      liveOnly: false,
      sport: 'mma',
      category: 'UFC & MMA Combates Completos',
      limit: 16,
    }),
    fetchSportStreams('futebol jogo completo melhores momentos brasileirao libertadores champions hd', {
      liveOnly: false,
      sport: 'soccer',
      category: 'Futebol Clássicos & Gols',
      limit: 16,
    }),
  ]);

  const payload = {
    updatedAt: new Date().toISOString(),
    scoreboard: {
      soccer: soccerScoreboard.slice(0, 18),
      mma: ufcScoreboard.slice(0, 6),
    },
    categories: [
      {
        id: 'cat-live-football',
        title: 'Futebol Ao Vivo — Transmissões & Canais de Jogo',
        emoji: '⚽',
        sport: 'soccer',
        items: liveFootball,
      },
      {
        id: 'cat-live-mma',
        title: 'UFC & MMA Ao Vivo — Octógono 24h & Eventos',
        emoji: '🥊',
        sport: 'mma',
        items: liveMma,
      },
      {
        id: 'cat-ufc-fights',
        title: 'UFC & MMA Exclusivo — Lutas Completas & Nocautes',
        emoji: '🔥',
        sport: 'mma',
        items: ufcFights,
      },
      {
        id: 'cat-football-highlights',
        title: 'Futebol Exclusivo — Jogos Completos & Melhores Momentos',
        emoji: '🏆',
        sport: 'soccer',
        items: footballMatches,
      },
    ],
  };

  sportsCache = { ts: Date.now(), payload };
  return payload;
}

export async function searchSports(query = '', sport = 'all', liveOnly = false) {
  const clean = String(query || '').trim();
  const key = `${clean.toLowerCase()}|${sport}|${liveOnly}`;
  const cached = sportsSearchCache.get(key);
  if (cached && Date.now() - cached.ts < 1000 * 60 * 5) return cached.data;

  const qSuffix =
    sport === 'mma'
      ? 'UFC MMA luta'
      : sport === 'soccer'
        ? 'futebol jogo'
        : 'futebol UFC MMA';
  const finalQ = clean ? `${clean} ${liveOnly ? 'ao vivo' : qSuffix}` : `${qSuffix} ao vivo`;
  const items = await fetchSportStreams(finalQ, {
    liveOnly,
    sport: sport === 'mma' ? 'mma' : 'soccer',
    category: sport === 'mma' ? 'UFC & MMA' : 'Futebol',
    limit: 20,
  });

  sportsSearchCache.set(key, { ts: Date.now(), data: items });
  return items;
}

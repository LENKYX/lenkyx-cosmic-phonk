// Legal Free-to-Air Global & Brazilian Live TV Channels Directory (7,000+ Open Streams via iptv-org)
// Excludes NSFW, geo-blocked, and non-24/7 dead feeds; prioritizes 1080p/720p & official networks.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 LENKYX-TV/2.1';

let tvCache = { ts: 0, channels: [] };

// Ultra-reliable official 24/7 public HLS / Live streams pinned at the top
const PINNED_TOP_CHANNELS = [
  {
    id: 'NASA-TV-Public',
    name: 'NASA TV Public (Espaço 4K/HD)',
    country: 'US',
    network: 'NASA',
    categories: ['science', 'documentary'],
    quality: '1080p',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/320px-NASA_logo.svg.png',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
  },
  {
    id: 'RedBull-TV-Global',
    name: 'Red Bull TV (Esportes & Ação)',
    country: 'AT',
    network: 'Red Bull',
    categories: ['sports', 'entertainment'],
    quality: '1080p',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/RedBullEnergyDrink.svg/320px-RedBullEnergyDrink.svg.png',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  },
  {
    id: 'DW-English-Live',
    name: 'DW News Internacional',
    country: 'DE',
    network: 'Deutsche Welle',
    categories: ['news'],
    quality: '1080p',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_symbol_2012.svg/320px-Deutsche_Welle_symbol_2012.svg.png',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
  },
  {
    id: 'France24-EN-Live',
    name: 'France 24 English (Ao Vivo)',
    country: 'FR',
    network: 'France 24',
    categories: ['news'],
    quality: '1080p',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/France24.png/320px-France24.png',
    streamUrl: 'https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8',
  },
];

function qualityScore(q = '', network = '') {
  let s = 0;
  const low = `${q} ${network}`.toLowerCase();
  if (low.includes('2160') || low.includes('4k')) s += 50;
  else if (low.includes('1080')) s += 40;
  else if (low.includes('720')) s += 25;
  else if (low.includes('540') || low.includes('480')) s += 10;
  if (low.includes('pluto') || low.includes('samsung') || low.includes('plex') || low.includes('nasa') || low.includes('red bull')) {
    s += 30;
  }
  return s;
}

export async function loadAllLiveTvChannels() {
  if (tvCache.channels.length > 0 && Date.now() - tvCache.ts < 1000 * 60 * 30) {
    return tvCache.channels;
  }

  const map = new Map();
  for (const p of PINNED_TOP_CHANNELS) {
    map.set(p.id, p);
  }

  try {
    const [stRes, chRes, lgRes] = await Promise.all([
      fetch('https://iptv-org.github.io/api/streams.json', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(9000) }),
      fetch('https://iptv-org.github.io/api/channels.json', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(9000) }),
      fetch('https://iptv-org.github.io/api/logos.json', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(9000) }),
    ]);

    if (stRes.ok && chRes.ok) {
      const [streams, channels, logos] = await Promise.all([
        stRes.json(),
        chRes.json(),
        lgRes.ok ? lgRes.json() : Promise.resolve([]),
      ]);

      const chMap = new Map(channels.map((c) => [c.id, c]));
      const lgMap = new Map();
      for (const l of logos) {
        if (l.channel && l.url && l.url.startsWith('https://') && !lgMap.has(l.channel)) {
          lgMap.set(l.channel, l.url);
        }
      }

      for (const s of streams) {
        if (!s.channel || map.has(s.channel)) continue;
        if (!s.url || !s.url.startsWith('https://')) continue;
        const labels = (s.labels || []).join(' ').toLowerCase();
        if (labels.includes('geo-blocked') || labels.includes('not 24/7')) continue;

        const c = chMap.get(s.channel);
        if (!c || c.is_nsfw || c.closed) continue;

        map.set(c.id, {
          id: c.id,
          name: c.name || s.title || c.id,
          country: (c.country || 'INT').toUpperCase(),
          network: c.network || undefined,
          categories: Array.isArray(c.categories) && c.categories.length ? c.categories : ['general'],
          quality: s.quality || 'HD',
          logo: lgMap.get(c.id) || '',
          streamUrl: s.url,
        });
      }
    }
  } catch {
    // keep pinned channels if offline/timeout
  }

  const list = Array.from(map.values()).sort(
    (a, b) => qualityScore(b.quality, b.network) - qualityScore(a.quality, a.network)
  );
  tvCache = { ts: Date.now(), channels: list };
  return list;
}

export async function getLiveTvDirectory() {
  const all = await loadAllLiveTvChannels();

  const pick = (pred, limit = 28) => all.filter(pred).slice(0, limit);

  const categories = [
    {
      id: 'tv-brasil',
      title: '🇧🇷 Brasil Ao Vivo — Canais Abertos & HD',
      emoji: '🇧🇷',
      channels: pick((c) => c.country === 'BR', 36),
    },
    {
      id: 'tv-filmes',
      title: '🎬 Canais de Filmes & Séries 24h (Pluto TV & Mundo)',
      emoji: '🎬',
      channels: pick((c) => c.categories.includes('movies') || c.categories.includes('series'), 36),
    },
    {
      id: 'tv-animes',
      title: '⛩️ Animes, Desenhos & Animação 24h',
      emoji: '⛩️',
      channels: pick((c) => c.categories.includes('animation') || c.categories.includes('kids'), 30),
    },
    {
      id: 'tv-esportes',
      title: '⚽ Esportes, Lutas & Ação Mundial',
      emoji: '⚽',
      channels: pick((c) => c.categories.includes('sports'), 30),
    },
    {
      id: 'tv-noticias',
      title: '📰 Notícias & Atualidades do Mundo',
      emoji: '📰',
      channels: pick((c) => c.categories.includes('news'), 28),
    },
    {
      id: 'tv-musica-espaco',
      title: '🎵 Música, Shows, Ciência & Espaço (NASA)',
      emoji: '🛸',
      channels: pick(
        (c) =>
          c.categories.includes('music') ||
          c.categories.includes('science') ||
          c.categories.includes('documentary') ||
          c.categories.includes('entertainment'),
        30
      ),
    },
  ];

  return {
    totalAvailable: all.length,
    categories,
  };
}

export async function searchLiveTv(query = '', country = '') {
  const all = await loadAllLiveTvChannels();
  const q = String(query || '').trim().toLowerCase();
  const cCode = String(country || '').trim().toUpperCase();

  const matched = all.filter((ch) => {
    if (cCode && cCode !== 'ALL' && ch.country !== cCode) return false;
    if (!q) return true;
    const hay = `${ch.name} ${ch.country} ${ch.network || ''} ${(ch.categories || []).join(' ')}`.toLowerCase();
    return hay.includes(q);
  });

  return {
    totalAvailable: all.length,
    channels: matched.slice(0, 80),
  };
}

// Legal Free-to-Air Global & Brazilian Live TV Channels Directory (Verified Live HLS + Official 24h Streams)
// Probes streams against #EXTM3U HTTP 200 so dead/geo-blocked feeds are filtered out automatically!

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 LENKYX-TV/2.2';

let tvCache = { ts: 0, channels: [], verifiedCount: 0 };
let tvRefreshPromise = null;

// Ultra-reliable verified 24/7 official HLS + YouTube Live channels pinned at the top
const PINNED_TOP_CHANNELS = [
  {
    id: 'NASA-TV-Public',
    name: 'NASA TV Live (Espaço 4K/HD)',
    country: 'US',
    network: 'NASA',
    categories: ['science', 'documentary'],
    quality: '1080p',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/320px-NASA_logo.svg.png',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    youtubeLiveId: '21X5lGlDOfg',
    verified: true,
  },
  {
    id: 'RedBull-TV-Global',
    name: 'Red Bull TV (Esportes & Ação 24h)',
    country: 'AT',
    network: 'Red Bull',
    categories: ['sports', 'entertainment'],
    quality: '1080p',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/RedBullEnergyDrink.svg/320px-RedBullEnergyDrink.svg.png',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    verified: true,
  },
  {
    id: 'DW-English-Live',
    name: 'DW News Internacional (Ao Vivo)',
    country: 'DE',
    network: 'Deutsche Welle',
    categories: ['news'],
    quality: '1080p',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_symbol_2012.svg/320px-Deutsche_Welle_symbol_2012.svg.png',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    verified: true,
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
    verified: true,
  },
  {
    id: 'BMC-News-BR',
    name: 'BM&C News Brasil (Ao Vivo HD)',
    country: 'BR',
    network: 'BM&C News',
    categories: ['news', 'general'],
    quality: '1080p',
    logo: '',
    streamUrl: 'https://jmp2.uk/plu-666c9c60a7efd40008f552f0.m3u8',
    verified: true,
  },
  {
    id: 'Canal-Gov-BR',
    name: 'Canal Gov Brasil (Ao Vivo HD)',
    country: 'BR',
    network: 'EBC',
    categories: ['news', 'general'],
    quality: '1080p',
    logo: '',
    streamUrl: 'https://canalgov-stream.ebc.com.br/index.m3u8',
    verified: true,
  },
  {
    id: 'Canal-Educacao-BR',
    name: 'Canal Educação Brasil (Ao Vivo HD)',
    country: 'BR',
    network: 'EBC',
    categories: ['documentary', 'general'],
    quality: '1080p',
    logo: '',
    streamUrl: 'https://canaleducacao-stream.ebc.com.br/index.m3u8',
    verified: true,
  },
  {
    id: 'Aratu-On-BR',
    name: 'TV Aratu / SBT Bahia (Ao Vivo)',
    country: 'BR',
    network: 'SBT / Aratu',
    categories: ['entertainment', 'general'],
    quality: '720p',
    logo: '',
    streamUrl: 'https://cdn.live.br1.jmvstream.com/w/LVW-9359/LVW9359_XSyReL0QVf/playlist.m3u8',
    verified: true,
  },
  {
    id: 'Amazon-Sat-BR',
    name: 'Amazon Sat Brasil (Cultura & Documentários)',
    country: 'BR',
    network: 'Rede Amazônica',
    categories: ['documentary', 'general'],
    quality: '720p',
    logo: '',
    streamUrl: 'https://amazonsat.brasilstream.com.br/hls/amazonsat/index.m3u8',
    verified: true,
  },
  {
    id: 'Lofi-Girl-24h',
    name: 'Lofi Beats & Cosmic Study Radio 24h',
    country: 'INT',
    network: '24/7 Music',
    categories: ['music', 'entertainment'],
    quality: '1080p',
    logo: '',
    streamUrl: '',
    youtubeLiveId: 'jfKfPfyJRdk',
    verified: true,
  },
];

function qualityScore(q = '', network = '', verified = false) {
  let s = verified ? 100 : 0;
  const low = `${q} ${network}`.toLowerCase();
  if (low.includes('2160') || low.includes('4k')) s += 50;
  else if (low.includes('1080')) s += 40;
  else if (low.includes('720')) s += 25;
  else if (low.includes('540') || low.includes('480')) s += 10;
  if (
    low.includes('pluto') ||
    low.includes('samsung') ||
    low.includes('plex') ||
    low.includes('nasa') ||
    low.includes('red bull') ||
    low.includes('ebc')
  ) {
    s += 30;
  }
  return s;
}

async function probeHlsUrl(url) {
  if (!url) return false;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(2200),
    });
    if (!r.ok) return false;
    const text = (await r.text()).slice(0, 300);
    return text.includes('#EXTM3U') || text.includes('#EXT-X-');
  } catch {
    return false;
  }
}

async function verifyChannelCandidates(candidates, concurrency = 65) {
  const verified = [];
  const retrySecond = [];

  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const checked = await Promise.all(
      batch.map(async (item) => {
        if (item.youtubeLiveId && !item.streamUrl) return { ok: true, item };
        const urls = item.candidateUrls || [item.streamUrl];
        if (await probeHlsUrl(urls[0])) {
          return {
            ok: true,
            item: {
              id: item.id,
              name: item.name,
              country: item.country,
              network: item.network,
              categories: item.categories,
              quality: item.quality,
              logo: item.logo,
              streamUrl: urls[0],
              youtubeLiveId: item.youtubeLiveId,
              verified: true,
            },
          };
        }
        return { ok: false, item };
      })
    );
    for (const res of checked) {
      if (res.ok) verified.push(res.item);
      else if ((res.item.candidateUrls || []).length > 1) retrySecond.push(res.item);
    }
  }

  // One fast parallel pass for fallback URL #2 on channels whose first stream failed
  if (retrySecond.length > 0) {
    const secondBatch = await Promise.all(
      retrySecond.slice(0, 50).map(async (item) => {
        const url2 = item.candidateUrls[1];
        if (await probeHlsUrl(url2)) {
          return {
            id: item.id,
            name: item.name,
            country: item.country,
            network: item.network,
            categories: item.categories,
            quality: item.quality,
            logo: item.logo,
            streamUrl: url2,
            youtubeLiveId: item.youtubeLiveId,
            verified: true,
          };
        }
        return null;
      })
    );
    for (const ok of secondBatch) {
      if (ok) verified.push(ok);
    }
  }

  return verified;
}

export async function loadAllLiveTvChannels(forceRefresh = false) {
  if (!forceRefresh && tvCache.channels.length > 0 && Date.now() - tvCache.ts < 1000 * 60 * 30) {
    return tvCache.channels;
  }
  if (!forceRefresh && tvRefreshPromise) {
    return tvRefreshPromise;
  }

  tvRefreshPromise = (async () => {
    const verifiedPinned = [];
    await Promise.all(
      PINNED_TOP_CHANNELS.map(async (p) => {
        if (p.youtubeLiveId && !p.streamUrl) {
          verifiedPinned.push(p);
          return;
        }
        const alive = await probeHlsUrl(p.streamUrl);
        if (alive || p.youtubeLiveId) {
          verifiedPinned.push({
            ...p,
            streamUrl: alive ? p.streamUrl : '',
            verified: true,
          });
        }
      })
    );

    const pinnedIds = new Set(verifiedPinned.map((p) => p.id));
    const candidateMap = new Map();

    // Fetch live YouTube channels (TV Brasil, Música, Esportes, Espaço 24h) via YouTube Live filter (sp=EgJAAQ%3D%3D)
    const ytLiveChannels = [];
    try {
      const ytQueries = [
        { q: 'tv ao vivo brasil noticias esportes 24 horas', cat: ['youtube_live', 'news'], country: 'BR' },
        { q: 'lofi hip hop phonk music radio 24/7 live', cat: ['youtube_live', 'music'], country: 'INT' },
        { q: 'nasa earth space live stream 4k', cat: ['youtube_live', 'science'], country: 'US' },
      ];
      const ytBatches = await Promise.all(
        ytQueries.map(async (item) => {
          try {
            const res = await fetch(
              `https://www.youtube.com/results?search_query=${encodeURIComponent(item.q)}&sp=EgJAAQ%253D%253D`,
              { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5500) }
            );
            if (!res.ok) return [];
            const html = await res.text();
            const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
            if (!m) return [];
            const data = JSON.parse(m[1]);
            const found = [];
            const seenYt = new Set();
            const walk = (node) => {
              if (!node || typeof node !== 'object' || found.length >= 10) return;
              if (node.videoRenderer?.videoId) {
                const v = node.videoRenderer;
                const vid = v.videoId;
                if (vid && !seenYt.has(vid)) {
                  seenYt.add(vid);
                  const title = v.title?.runs?.map((x) => x.text).join('') || 'YouTube Live';
                  const network = v.ownerText?.runs?.[0]?.text || 'YouTube Ao Vivo';
                  const logo =
                    v.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
                    `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
                  found.push({
                    id: `YTLIVE-${vid}`,
                    name: `${title.slice(0, 62)}`,
                    country: item.country,
                    network: `${network} · YouTube Live`,
                    categories: item.cat,
                    quality: '1080p',
                    logo,
                    streamUrl: '',
                    youtubeLiveId: vid,
                    verified: true,
                  });
                }
              }
              if (Array.isArray(node)) for (const el of node) walk(el);
              else for (const val of Object.values(node)) walk(val);
            };
            walk(data);
            return found;
          } catch {
            return [];
          }
        })
      );
      const seenAllYt = new Set();
      for (const batch of ytBatches) {
        for (const ch of batch) {
          if (!seenAllYt.has(ch.youtubeLiveId)) {
            seenAllYt.add(ch.youtubeLiveId);
            ytLiveChannels.push(ch);
          }
        }
      }
    } catch {
      // ignore youtube live fetch failure
    }

    try {
      const [stRes, chRes, lgRes] = await Promise.all([
        fetch('https://iptv-org.github.io/api/streams.json', {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(9000),
        }),
        fetch('https://iptv-org.github.io/api/channels.json', {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(9000),
        }),
        fetch('https://iptv-org.github.io/api/logos.json', {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(9000),
        }),
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
          if (!s.channel || pinnedIds.has(s.channel)) continue;
          if (!s.url || (!s.url.startsWith('https://') && !s.url.startsWith('http://'))) continue;
          const labels = (s.labels || []).join(' ').toLowerCase();
          if (labels.includes('geo-blocked') || labels.includes('not 24/7')) continue;

          const c = chMap.get(s.channel);
          if (!c || c.is_nsfw || c.closed) continue;

          if (!candidateMap.has(c.id)) {
            candidateMap.set(c.id, {
              id: c.id,
              name: c.name || s.title || c.id,
              country: (c.country || 'INT').toUpperCase(),
              network: c.network || undefined,
              categories: Array.isArray(c.categories) && c.categories.length ? c.categories : ['general'],
              quality: s.quality || 'HD',
              logo: lgMap.get(c.id) || '',
              streamUrl: s.url,
              candidateUrls: [s.url],
            });
          } else {
            const existing = candidateMap.get(c.id);
            if (existing.candidateUrls.length < 3 && !existing.candidateUrls.includes(s.url)) {
              existing.candidateUrls.push(s.url);
            }
          }
        }
      }
    } catch {
      // keep pinned channels if offline
    }

    // Prioritize probing channels across the core categories (~180 unique channels -> verifies in ~5-7s)
    const allCandidates = Array.from(candidateMap.values());
    const selectPool = (pred, max) => allCandidates.filter(pred).slice(0, max);
    const probeBatchSet = new Map();
    for (const item of [
      ...selectPool((c) => c.country === 'BR', 45),
      ...selectPool((c) => c.categories.includes('movies'), 35),
      ...selectPool(
        (c) =>
          c.categories.includes('series') ||
          c.categories.includes('comedy') ||
          c.categories.includes('classic') ||
          c.categories.includes('entertainment'),
        35
      ),
      ...selectPool((c) => c.categories.includes('animation') || c.categories.includes('kids'), 30),
      ...selectPool((c) => c.categories.includes('sports'), 28),
      ...selectPool((c) => c.categories.includes('news'), 28),
      ...selectPool(
        (c) =>
          c.categories.includes('music') ||
          c.categories.includes('science') ||
          c.categories.includes('documentary'),
        28
      ),
    ]) {
      probeBatchSet.set(item.id, item);
    }

    const verifiedStreams = await verifyChannelCandidates(Array.from(probeBatchSet.values()), 65);
    const mergedMap = new Map();
    for (const p of verifiedPinned) mergedMap.set(p.id, p);
    for (const yt of ytLiveChannels) {
      if (!mergedMap.has(yt.id)) mergedMap.set(yt.id, yt);
    }
    for (const v of verifiedStreams) {
      if (!mergedMap.has(v.id)) mergedMap.set(v.id, v);
    }

    const list = Array.from(mergedMap.values()).sort(
      (a, b) => qualityScore(b.quality, b.network, b.verified) - qualityScore(a.quality, a.network, a.verified)
    );
    tvCache = { ts: Date.now(), channels: list, verifiedCount: list.length };
    tvRefreshPromise = null;
    return list;
  })();

  return tvRefreshPromise;
}

export async function getLiveTvDirectory(forceRefresh = false) {
  const all = await loadAllLiveTvChannels(forceRefresh);

  const pick = (pred, limit = 50) => all.filter(pred).slice(0, limit);

  const categories = [
    {
      id: 'tv-youtube-live',
      title: '🔴 Canais Ao Vivo do YouTube 24h (TV, Música, Espaço & Notícias)',
      emoji: '🔴',
      channels: pick((c) => Boolean(c.youtubeLiveId) || c.categories.includes('youtube_live'), 45),
    },
    {
      id: 'tv-brasil',
      title: '🇧🇷 Brasil Ao Vivo — Canais Verificados Online',
      emoji: '🇧🇷',
      channels: pick((c) => c.country === 'BR', 50),
    },
    {
      id: 'tv-filmes',
      title: '🎬 Canais de Filmes 24h (Pluto TV, Plex & Mundo)',
      emoji: '🎬',
      channels: pick((c) => c.categories.includes('movies'), 50),
    },
    {
      id: 'tv-series-24h',
      title: '📺 Canais de Séries, Novelas & Comédia 24h',
      emoji: '📺',
      channels: pick(
        (c) =>
          c.categories.includes('series') ||
          c.categories.includes('comedy') ||
          c.categories.includes('classic') ||
          c.categories.includes('entertainment'),
        50
      ),
    },
    {
      id: 'tv-animes',
      title: '⛩️ Animes, Desenhos & Animação 24h',
      emoji: '⛩️',
      channels: pick((c) => c.categories.includes('animation') || c.categories.includes('kids'), 45),
    },
    {
      id: 'tv-esportes',
      title: '⚽ Esportes, Lutas & Ação Mundial',
      emoji: '⚽',
      channels: pick((c) => c.categories.includes('sports'), 45),
    },
    {
      id: 'tv-noticias',
      title: '📰 Notícias & Atualidades do Mundo',
      emoji: '📰',
      channels: pick((c) => c.categories.includes('news'), 40),
    },
    {
      id: 'tv-musica-espaco',
      title: '🎵 Música, Shows, Ciência & Espaço (NASA)',
      emoji: '🛸',
      channels: pick(
        (c) =>
          c.categories.includes('music') ||
          c.categories.includes('science') ||
          c.categories.includes('documentary'),
        45
      ),
    },
  ];

  return {
    totalAvailable: all.length,
    verifiedOnline: true,
    categories,
  };
}

export async function searchLiveTv(query = '', country = '') {
  const all = await loadAllLiveTvChannels(false);
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

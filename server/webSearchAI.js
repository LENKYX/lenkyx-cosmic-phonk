// LENKYX Cosmic Search — Real Internet Web Search + AI Synthesis + Autocomplete Suggestions
// Respects Private Mode: never logs or caches queries when privateMode = true

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const publicSearchCache = new Map();

function decodeHtmlEntities(str = '') {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unwrapDdgUrl(raw = '') {
  try {
    if (raw.startsWith('//')) raw = 'https:' + raw;
    if (raw.includes('duckduckgo.com/l/?')) {
      const u = new URL(raw);
      const uddg = u.searchParams.get('uddg');
      if (uddg) return decodeURIComponent(uddg);
    }
    return raw;
  } catch {
    return raw;
  }
}

export async function getSearchSuggestions(query = '') {
  const q = String(query || '').trim();
  if (!q) {
    return [
      'LENKYX Cosmic Phonk',
      'Músicas Phonk mais tocadas',
      'Filmes de ficção científica grátis',
      'Notícias de tecnologia e IA hoje',
      'Jogos grátis navegador',
      'Espaço NASA galáxia',
    ];
  }

  try {
    const r = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(2800) }
    );
    if (r.ok) {
      const arr = await r.json();
      if (Array.isArray(arr) && Array.isArray(arr[1])) {
        return arr[1].slice(0, 8).map((s) => String(s));
      }
    }
  } catch {
    // fallback below
  }

  return [
    q,
    `${q} músicas`,
    `${q} vídeos`,
    `${q} o que é`,
    `${q} filmes`,
  ];
}

const BLOCKED_MEDIA_HOSTS = [
  'youtube.com',
  'youtu.be',
  'music.youtube.com',
  'spotify.com',
  'tiktok.com',
  'deezer.com',
  'netflix.com',
  'music.apple.com',
  'soundcloud.com',
  'dailymotion.com',
];

function extractYtIdFromUrl(raw = '') {
  try {
    const u = new URL(raw);
    const h = u.hostname.replace(/^www\./, '').toLowerCase();
    if (h === 'youtu.be') return u.pathname.slice(1).split('/')[0] || '';
    if (h.endsWith('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v') || '';
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || '';
    }
  } catch {
    // ignore
  }
  return '';
}

async function fetchDuckDuckGoWeb(query) {
  const results = [];
  const playableMedia = [];
  try {
    const r = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=br-pt`,
      {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(7000),
      }
    );
    if (!r.ok) return { results, playableMedia };
    const html = await r.text();

    const blocks = html.split(/class="result results_links/i).slice(1, 20);
    for (const block of blocks) {
      if (block.includes('result--ad') || block.includes('badge--ad')) continue;
      const titleMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!titleMatch) continue;
      const url = unwrapDdgUrl(decodeHtmlEntities(titleMatch[1]));
      if (!url || url.includes('duckduckgo.com/y.js') || url.includes('ad_domain=')) continue;
      const rawTitle = decodeHtmlEntities(titleMatch[2]);
      const snipMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>|class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
      const snippet = decodeHtmlEntities(snipMatch?.[1] || snipMatch?.[2] || '');
      if (!url.startsWith('http') || !rawTitle) continue;
      let domain = '';
      try {
        domain = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        domain = '';
      }

      // Never show YouTube / Spotify / TikTok / Netflix links in Web Results!
      // Instead, convert playable video hits silently into native LENKYX playable tracks!
      const isBlockedHost = BLOCKED_MEDIA_HOSTS.some(
        (b) => domain === b || domain.endsWith('.' + b)
      );
      if (isBlockedHost) {
        const ytId = extractYtIdFromUrl(url);
        if (ytId && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
          const cleanTitle = rawTitle.replace(/\s*[-|·]\s*YouTube\s*$/i, '').trim();
          playableMedia.push({
            id: `web-yt-${ytId}`,
            title: cleanTitle || rawTitle,
            artist: 'Mix & Áudio Web · MORRO GOLD',
            youtubeVideoId: ytId,
            coverUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
            genre: 'Web Discovery',
            source: 'world_full',
          });
        }
        continue;
      }

      results.push({ title: rawTitle, url, domain, snippet });
    }
  } catch {
    // ignore
  }
  return { results, playableMedia };
}

async function fetchInstantKnowledge(query) {
  // Try Wikipedia PT & EN summary + DuckDuckGo Instant Answer
  for (const lang of ['pt', 'en']) {
    try {
      const sRes = await fetch(
        `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          query
        )}&format=json&srlimit=2`,
        { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(3500) }
      );
      if (sRes.ok) {
        const sj = await sRes.json();
        const firstTitle = sj?.query?.search?.[0]?.title;
        if (firstTitle) {
          const sumRes = await fetch(
            `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
              firstTitle.replace(/ /g, '_')
            )}`,
            { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(3500) }
          );
          if (sumRes.ok) {
            const sum = await sumRes.json();
            if (sum?.extract && sum.extract.length > 40) {
              return {
                title: sum.title || firstTitle,
                summary: sum.extract,
                imageUrl: sum?.thumbnail?.source || '',
                sourceUrl: sum?.content_urls?.desktop?.page || '',
                sourceLabel: lang === 'pt' ? 'Base de Conhecimento PT' : 'Base de Conhecimento Global',
              };
            }
          }
        }
      }
    } catch {
      // continue
    }
  }
  return null;
}

async function fetchPollinationsAiSummary(query) {
  try {
    const prompt = `Responda em português do Brasil em no máximo 2 frases objetivas e criativas sobre: "${query}". Se for música, artista, filme ou série, destaque estilo, gênero e recomendação parecida.`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
    const r = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(4200),
    });
    if (!r.ok) return '';
    const txt = (await r.text()).trim();
    if (!txt || txt.length < 20 || txt.startsWith('<')) return '';
    return txt.slice(0, 420);
  } catch {
    return '';
  }
}

export async function runCosmicWebSearch(rawQuery = '', options = {}) {
  const q = String(rawQuery || '').trim();
  const isPrivate = Boolean(options.privateMode);
  const mode = options.mode === 'web' ? 'web' : 'ai';

  if (!q) {
    return {
      query: '',
      mode,
      privateMode: isPrivate,
      aiSummary: null,
      webResults: [],
    };
  }

  const cacheKey = `${mode}|${q.toLowerCase()}`;
  if (!isPrivate) {
    const cached = publicSearchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
      return { ...cached.payload, privateMode: false };
    }
  }

  const [ddgData, knowledge, pollinationsAns] = await Promise.all([
    fetchDuckDuckGoWeb(q),
    fetchInstantKnowledge(q),
    mode === 'ai' ? fetchPollinationsAiSummary(q) : Promise.resolve(''),
  ]);
  const webResults = ddgData.results || [];
  const playableMedia = ddgData.playableMedia || [];

  let aiSummary = null;
  if (pollinationsAns || knowledge || webResults.length > 0 || playableMedia.length > 0) {
    const bullets = webResults
      .slice(0, 3)
      .map((r) => `• ${r.title}: ${r.snippet || r.domain}`)
      .filter(Boolean);
    aiSummary = {
      headline: knowledge?.title || `Radar Sônico IA · "${q}"`,
      answer:
        pollinationsAns ||
        knowledge?.summary ||
        `Encontrei ${playableMedia.length} mídias reproduzíveis para "${q}" direto no MORRO GOLD.`,
      highlights: bullets,
      imageUrl: knowledge?.imageUrl || '',
      sourceUrl: knowledge?.sourceUrl || webResults[0]?.url || '',
    };
  }

  const payload = {
    query: q,
    mode,
    privateMode: isPrivate,
    aiSummary,
    webResults,
    playableMedia,
  };

  if (!isPrivate) {
    if (publicSearchCache.size > 120) {
      const firstKey = publicSearchCache.keys().next().value;
      if (firstKey) publicSearchCache.delete(firstKey);
    }
    publicSearchCache.set(cacheKey, { ts: Date.now(), payload });
  }

  return payload;
}

export async function readSafeWebPage(targetUrl = '') {
  const raw = String(targetUrl || '').trim();
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    throw new Error('URL inválida.');
  }
  const u = new URL(raw);
  const host = u.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    host.startsWith('172.')
  ) {
    throw new Error('Endereço interno não permitido.');
  }

  const r = await fetch(raw, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Site respondeu HTTP ${r.status}`);
  const html = await r.text();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeHtmlEntities(titleMatch?.[1] || u.hostname);

  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const paragraphs = [];
  const pMatches = cleaned.matchAll(/<(p|h1|h2|h3|li)[^>]*>([\s\S]*?)<\/\1>/gi);
  for (const m of pMatches) {
    const txt = decodeHtmlEntities(m[2]);
    if (txt.length >= 25 && paragraphs.length < 36) {
      paragraphs.push({ tag: m[1].toLowerCase(), text: txt });
    }
  }

  return {
    url: raw,
    domain: u.hostname.replace(/^www\./, ''),
    title,
    paragraphs,
  };
}

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

async function fetchDuckDuckGoWeb(query) {
  const results = [];
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
    if (!r.ok) return results;
    const html = await r.text();

    const blocks = html.split(/class="result results_links/i).slice(1, 16);
    for (const block of blocks) {
      if (block.includes('result--ad') || block.includes('badge--ad')) continue;
      const titleMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!titleMatch) continue;
      const url = unwrapDdgUrl(decodeHtmlEntities(titleMatch[1]));
      if (!url || url.includes('duckduckgo.com/y.js') || url.includes('ad_domain=')) continue;
      const title = decodeHtmlEntities(titleMatch[2]);
      const snipMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>|class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
      const snippet = decodeHtmlEntities(snipMatch?.[1] || snipMatch?.[2] || '');
      if (!url.startsWith('http') || !title) continue;
      let domain = '';
      try {
        domain = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        domain = '';
      }
      results.push({ title, url, domain, snippet });
    }
  } catch {
    // ignore
  }
  return results;
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

  const [webResults, knowledge] = await Promise.all([
    fetchDuckDuckGoWeb(q),
    fetchInstantKnowledge(q),
  ]);

  let aiSummary = null;
  if (knowledge || webResults.length > 0) {
    const bullets = webResults
      .slice(0, 3)
      .map((r) => `• ${r.title}: ${r.snippet || r.domain}`)
      .filter(Boolean);
    aiSummary = {
      headline: knowledge?.title || `Síntese IA sobre "${q}"`,
      answer:
        knowledge?.summary ||
        `Encontrei ${webResults.length} resultados relevantes na internet para "${q}". Confira os principais pontos e sites abaixo.`,
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

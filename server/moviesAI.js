// Legal Full-Length Free Movies, International Hits (Dubbed PT-BR), Series & Animes in HD/4K
// Sources: YouTube HD Filter (&sp=EgIgAQ%3D%3D) + Internet Archive Open Cinema

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CURRENT_YEAR = new Date().getFullYear();

export const MOVIE_CATEGORIES = [
  {
    id: 'cat-novidades-completos',
    title: `Filmes Completos ${CURRENT_YEAR} (Dublados HD)`,
    emoji: '✨',
    mediaType: 'movie',
    query: `filme completo dublado portugues ${CURRENT_YEAR} full hd`,
  },
  {
    id: 'cat-internacionais-dub',
    title: 'Top Internacionais Completos (Full HD)',
    emoji: '🌍',
    mediaType: 'movie',
    query: 'melhores filmes internacionais completos dublados portugues full hd 1080p',
  },
  {
    id: 'cat-series-temporadas',
    title: 'Séries Completas por Temporadas (T1 · T2 · T3)',
    emoji: '📺',
    mediaType: 'series',
    query: 'serie completa temporada 1 temporada 2 todos episodios dublado hd',
  },
  {
    id: 'cat-series',
    title: 'Séries Internacionais Completas (Dublado HD)',
    emoji: '🎞️',
    mediaType: 'series',
    query: 'serie internacional completa dublado portugues todos episodios hd',
  },
  {
    id: 'cat-animes',
    title: 'Animes Completos & Filmes Anime Dublados (HD)',
    emoji: '⛩️',
    mediaType: 'anime',
    query: 'anime completo dublado portugues filme episodio full hd',
  },
  {
    id: 'cat-acao',
    title: 'Ação, Policial & Luta (Internacionais Dublados)',
    emoji: '🔥',
    mediaType: 'movie',
    query: 'filme de acao internacional completo dublado 1080p hd',
  },
  {
    id: 'cat-scifi',
    title: 'Ficção Científica & Espaço (Dublados HD)',
    emoji: '🚀',
    mediaType: 'movie',
    query: 'filme completo ficcao cientifica espaco dublado full hd',
  },
  {
    id: 'cat-terror',
    title: 'Terror, Suspense & Mistério (Dublados HD)',
    emoji: '👻',
    mediaType: 'movie',
    query: 'filme completo terror suspense internacional dublado hd',
  },
  {
    id: 'cat-comedia',
    title: 'Comédia, Aventura & Diversão (Dublados HD)',
    emoji: '😂',
    mediaType: 'movie',
    query: 'filme de comedia aventura completo dublado portugues full hd',
  },
  {
    id: 'cat-drama',
    title: 'Drama, Romance & Emoção (Dublados HD)',
    emoji: '🎭',
    mediaType: 'movie',
    query: 'filme de drama romance internacional completo dublado hd',
  },
  {
    id: 'cat-artes-marciais',
    title: 'Artes Marciais, Kung Fu & Lutas (Dublados HD)',
    emoji: '🥋',
    mediaType: 'movie',
    query: 'filme kung fu artes marciais luta completo dublado hd',
  },
  {
    id: 'cat-drift-carros',
    title: 'Velozes, Drift, Corrida & Phonk Cinema (Dublados HD)',
    emoji: '🏎️',
    mediaType: 'movie',
    query: 'filme de corrida carros drift acao completo dublado full hd',
  },
  {
    id: 'cat-guerra-faroeste',
    title: 'Guerra, Faroeste & Épicos Históricos (Dublados HD)',
    emoji: '⚔️',
    mediaType: 'movie',
    query: 'filme de guerra faroeste epico completo dublado portugues hd',
  },
  {
    id: 'cat-misterio-policial',
    title: 'Investigação, Crime & Máfia (Dublados Full HD)',
    emoji: '🕵️',
    mediaType: 'movie',
    query: 'filme policial suspense investigacao completo dublado 1080p',
  },
  {
    id: 'cat-cult-aventura',
    title: 'Aventura, Fantasia & Sobrevivência (Dublados HD)',
    emoji: '🧭',
    mediaType: 'movie',
    query: 'filme aventura fantasia sobrevivencia completo dublado hd',
  },
  {
    id: 'cat-classicos-dublados',
    title: 'Filmes Clássicos, Guerra & Épicos (Dublados HD)',
    emoji: '⚔️',
    mediaType: 'movie',
    query: 'filme guerra epico historico completo dublado hd',
  },
  {
    id: 'cat-animes-isekai',
    title: 'Animes Isekai, Fantasia & Clássicos (Dublados PT-BR)',
    emoji: '🐉',
    mediaType: 'anime',
    query: 'anime fantasia isekai episodio completo dublado portugues',
  },
  {
    id: 'cat-brasil-cinema',
    title: 'Cinema Nacional & Sucessos Brasileiros (Completos HD)',
    emoji: '🇧🇷',
    mediaType: 'movie',
    query: 'filme brasileiro nacional completo comedia acao drama full hd',
  },
  {
    id: 'cat-series-acao',
    title: 'Séries de Ação, Policial & Suspense (Episódios Dublados)',
    emoji: '🚨',
    mediaType: 'series',
    query: 'serie de acao suspense crime completa dublado episodio hd',
  },
  {
    id: 'cat-series-terror',
    title: 'Séries de Terror, Sobrenatural & Mistério (Dubladas)',
    emoji: '🕯️',
    mediaType: 'series',
    query: 'serie terror sobrenatural suspense completo dublado episodio',
  },
  {
    id: 'cat-series-brasil',
    title: 'Séries Brasileiras, Humor & Novelas (Episódios HD)',
    emoji: '🇧🇷',
    mediaType: 'series',
    query: 'serie brasileira humor novela episodio completo hd',
  },
  {
    id: 'cat-series-scifi',
    title: 'Séries de Ficção Científica, Espaço & Mistério (HD)',
    emoji: '🛸',
    mediaType: 'series',
    query: 'serie ficcao cientifica espaco misterio dublado episodio completo',
  },
  {
    id: 'cat-doramas',
    title: 'Doramas & Séries Asiáticas Completas Dubladas (Full HD)',
    emoji: '🌸',
    mediaType: 'series',
    query: 'dorama completo dublado portugues serie coreana episodio hd',
  },
  {
    id: 'cat-series-comedia',
    title: 'Séries de Comédia, Drama & Clássicas (Dubladas)',
    emoji: '🍿',
    mediaType: 'series',
    query: 'serie comedia drama dublado portugues temporada completa',
  },
  {
    id: 'cat-animes-acao',
    title: 'Animes Shonen, Luta & Aventura Dublados (Full HD)',
    emoji: '⚔️',
    mediaType: 'anime',
    query: 'anime acao luta aventura completo dublado portugues hd',
  },
  {
    id: 'cat-familia',
    title: 'Animações, Desenhos & Família Completos (HD)',
    emoji: '🦁',
    mediaType: 'anime',
    query: 'filme desenho animacao familia completo dublado portugues hd',
  },
  {
    id: 'cat-classicos',
    title: 'Documentários Espaciais Completos 4K/HD',
    emoji: '🌌',
    mediaType: 'movie',
    query: 'documentario universo nasa completo dublado 4k hd',
  },
  {
    id: 'cat-archive-cinema',
    title: 'Acervo Clássico Archive.org — Ficção, Ação & Terror (Direto)',
    emoji: '🏛️',
    mediaType: 'movie',
    isArchiveOnly: true,
    query: 'feature_films OR sci_fi_and_horror',
  },
  {
    id: 'cat-archive-series',
    title: 'Acervo Clássico Archive.org — Comédia, Aventura & Séries',
    emoji: '📼',
    mediaType: 'movie',
    isArchiveOnly: true,
    query: 'comedy_films OR Classic_TV',
  },
];

const movieCache = new Map();

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

function parseDurSec(txt = '') {
  const parts = String(txt).trim().split(':').map((n) => parseInt(n, 10));
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function pickBestThumbnail(vr, vid) {
  const thumbs = vr?.thumbnail?.thumbnails;
  if (Array.isArray(thumbs) && thumbs.length > 0) {
    const sorted = [...thumbs].sort((a, b) => (b.width || 0) - (a.width || 0));
    if (sorted[0]?.url) return sorted[0].url;
  }
  return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
}

function detectQualityAndDub(title, badges, queryHint) {
  const t = `${title} ${badges.join(' ')}`.toLowerCase();
  let qualityLabel = 'HD 720p+';
  let score = 10;

  if (t.includes('4k') || t.includes('2160p') || t.includes('ultra hd')) {
    qualityLabel = '4K Ultra HD';
    score += 40;
  } else if (t.includes('1080') || t.includes('full hd') || t.includes('fhd')) {
    qualityLabel = 'Full HD 1080p';
    score += 30;
  } else if (badges.some((b) => b.toLowerCase().includes('hd')) || t.includes('hd')) {
    qualityLabel = 'HD 720p+';
    score += 18;
  }

  const isDubbed =
    t.includes('dublado') ||
    t.includes('dub ') ||
    t.includes('pt-br') ||
    t.includes('pt br') ||
    t.includes('em português') ||
    t.includes('em portugues') ||
    t.includes('áudio português') ||
    t.includes('audio portugues') ||
    queryHint.toLowerCase().includes('dublado');

  if (isDubbed) score += 25;
  if (t.includes('completo') || t.includes('episódio') || t.includes('episodio') || t.includes('temporada')) {
    score += 10;
  }

  return { qualityLabel, isDubbed, score };
}

function inferMediaType(explicitType, title, isTrailerCategory) {
  if (isTrailerCategory || explicitType === 'trailer') return 'trailer';
  const t = title.toLowerCase();
  if (explicitType === 'anime' || t.includes('anime') || t.includes('episódio') || t.includes('episodio')) {
    if (t.includes('anime') || explicitType === 'anime') return 'anime';
  }
  if (
    explicitType === 'series' ||
    t.includes('série') ||
    t.includes('serie') ||
    t.includes('temporada') ||
    t.includes('ep.') ||
    t.includes('episódio') ||
    t.includes('episodio')
  ) {
    return 'series';
  }
  return explicitType || 'movie';
}

function extractPlaylistLockups(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) extractPlaylistLockups(item, out);
    return out;
  }
  if (node.playlistRenderer && node.playlistRenderer.playlistId) {
    out.push({ type: 'pr', data: node.playlistRenderer });
  } else if (node.lockupViewModel && node.lockupViewModel.contentId && node.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST') {
    out.push({ type: 'lockup', data: node.lockupViewModel });
  }
  for (const k of Object.keys(node)) {
    if (k !== 'playlistRenderer' && k !== 'lockupViewModel') extractPlaylistLockups(node[k], out);
  }
  return out;
}

async function fetchArchiveCinema(cleanQ, category, limit = 14) {
  const out = [];
  const seen = new Set();
  try {
    const qExpr =
      cleanQ.includes('feature_films')
        ? '(collection:feature_films OR collection:sci_fi_and_horror) AND mediatype:movies'
        : `(${cleanQ.split(' ').slice(0, 3).join(' ')}) AND mediatype:movies`;
    const arcUrl =
      'https://archive.org/advancedsearch.php?q=' +
      encodeURIComponent(qExpr) +
      `&fl[]=identifier,title,creator,year&sort[]=downloads+desc&rows=${limit}&output=json`;
    const ar = await fetch(arcUrl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
    if (ar.ok) {
      const aj = await ar.json();
      const docs = aj?.response?.docs || [];
      for (const d of docs) {
        if (!d.identifier || seen.has(d.identifier)) continue;
        seen.add(d.identifier);
        out.push({
          id: `arcmov-${d.identifier}`,
          title: d.title || d.identifier,
          subtitle: Array.isArray(d.creator) ? d.creator[0] : d.creator || 'Acervo Cinema Livre',
          category,
          year: d.year ? String(d.year) : undefined,
          durationLabel: d.year ? `${d.year} · Completo` : 'Filme Completo',
          posterUrl: `https://archive.org/services/img/${d.identifier}`,
          externalUrl: `https://archive.org/details/${d.identifier}`,
          videoStreamUrl: `https://archive.org/embed/${d.identifier}`,
          isTrailer: false,
          sourceLabel: 'Acervo Direto',
          qualityLabel: 'HD Archive',
          isDubbed: false,
          mediaType: 'movie',
        });
      }
    }
  } catch {
    // ignore
  }
  return out;
}

export async function searchMovies(
  query,
  category = 'Filmes Completos',
  isTrailerCategory = false,
  mediaType = 'movie',
  isArchiveOnly = false
) {
  const cleanQ = (query || 'filme internacional completo dublado full hd').trim();
  const key = `${cleanQ.toLowerCase()}|${isTrailerCategory}|${mediaType}|${isArchiveOnly}`;
  const cached = movieCache.get(key);
  if (cached && Date.now() - cached.ts < 1000 * 60 * 12) return cached.data;

  if (isArchiveOnly) {
    const arcItems = await fetchArchiveCinema(cleanQ, category, 30);
    movieCache.set(key, { ts: Date.now(), data: arcItems });
    return arcItems;
  }

  const scoredItems = [];
  const seen = new Set();

  // For series/anime, also fetch full season playlists (&sp=EgIQAw%253D%253D) so users can binge all episodes in order!
  if (!isTrailerCategory && (mediaType === 'series' || mediaType === 'anime')) {
    try {
      const plUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        cleanQ + ' temporada completa'
      )}&sp=EgIQAw%253D%253D`;
      const res = await fetch(plUrl, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' },
        signal: AbortSignal.timeout(6500),
      });
      if (res.ok) {
        const html = await res.text();
        const marker = 'var ytInitialData = ';
        const idx = html.indexOf(marker);
        if (idx !== -1) {
          const sub = html.slice(idx + marker.length);
          const end = sub.indexOf(';</script>');
          if (end !== -1) {
            const data = JSON.parse(sub.slice(0, end));
            const pls = extractPlaylistLockups(data);
            for (const p of pls.slice(0, 8)) {
              let pid = '';
              let title = '';
              let channel = mediaType === 'anime' ? 'Anime Completo' : 'Série Completa';
              let posterUrl = '';
              let epLabel = 'Temporada Completa';

              if (p.type === 'pr') {
                pid = p.data.playlistId;
                title = (p.data.title?.runs || []).map((r) => r.text).join('') || p.data.title?.simpleText || '';
                channel = (p.data.shortBylineText?.runs || []).map((r) => r.text).join('') || channel;
                const thumbs = p.data.thumbnails?.[0]?.thumbnails || [];
                posterUrl = thumbs[thumbs.length - 1]?.url || '';
                if (p.data.videoCount) epLabel = `${p.data.videoCount} Episódios`;
              } else {
                pid = p.data.contentId;
                const meta = p.data.metadata?.lockupMetadataViewModel;
                title = meta?.title?.content || '';
                const sources =
                  p.data.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources || [];
                posterUrl = sources[sources.length - 1]?.url || '';
              }

              if (!pid || !title || seen.has(`pl-${pid}`)) continue;
              seen.add(`pl-${pid}`);
              const { qualityLabel, isDubbed, score } = detectQualityAndDub(title, ['HD'], cleanQ);
              scoredItems.push({
                score: score + 35, // boost complete seasons!
                item: {
                  id: `ytpl-${pid}`,
                  title,
                  subtitle: `${channel} · Todos os Episódios`,
                  category,
                  durationLabel: epLabel,
                  posterUrl: posterUrl || 'https://i.ytimg.com/vi/default.jpg',
                  youtubePlaylistId: pid,
                  externalUrl: `https://www.youtube.com/playlist?list=${pid}`,
                  isTrailer: false,
                  sourceLabel: mediaType === 'anime' ? 'Temporada Anime' : 'Temporada Série',
                  qualityLabel,
                  isDubbed,
                  mediaType,
                },
              });
            }
          }
        }
      }
    } catch {
      // ignore playlist error and continue
    }
  }

  // &sp=EgIgAQ%253D%253D enforces YouTube HD quality filter!
  const searchUrls = [
    `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQ)}&sp=EgIgAQ%253D%253D`,
    `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQ)}`,
  ];

  for (const ytUrl of searchUrls) {
    if (scoredItems.length >= 16) break;
    try {
      const res = await fetch(ytUrl, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const marker = 'var ytInitialData = ';
      const idx = html.indexOf(marker);
      if (idx === -1) continue;
      const sub = html.slice(idx + marker.length);
      const end = sub.indexOf(';</script>');
      if (end === -1) continue;
      const data = JSON.parse(sub.slice(0, end));
      const renderers = extractVideoRenderers(data);

      // STRICT COMPLETE-ONLY POLICY: Movies >= 50 min (3000s); Series/Anime >= 18 min (1080s). Reject trailers/clips/summaries!
      const minDurSec = mediaType === 'series' || mediaType === 'anime' ? 1080 : 3000;
      const incompleteRe = /\b(trailer|teaser|cortes?|trechos?|cena|cenas|resumo|review|react|explica(?:do|cao|ção)?|bastidores|making\s*of|preview|spoiler|shorts?|clipe|music\s*video|abertura|opening|ending)\b/i;

      for (const vr of renderers) {
        const vid = vr.videoId;
        if (!vid || seen.has(vid)) continue;
        const durText = vr.lengthText?.simpleText || '';
        const durSec = parseDurSec(durText);
        if (durSec <= 0 || durSec < minDurSec) continue;

        const title = (vr.title?.runs || []).map((r) => r.text).join('') || 'Filme Completo HD';
        if (incompleteRe.test(title)) continue;
        const channel = (vr.ownerText?.runs || []).map((r) => r.text).join('') || 'Cinema HD';
        const badges = (vr.badges || [])
          .map((b) => b?.metadataBadgeRenderer?.label || '')
          .filter(Boolean);

        const { qualityLabel, isDubbed, score } = detectQualityAndDub(title, badges, cleanQ);
        const resolvedType = inferMediaType(mediaType, title, isTrailerCategory);
        const sourceLabel =
          resolvedType === 'trailer'
            ? 'Trailer Oficial'
            : resolvedType === 'anime'
              ? 'Anime HD'
              : resolvedType === 'series'
                ? 'Série HD'
                : 'Filme Completo';

        seen.add(vid);
        scoredItems.push({
          score,
          item: {
            id: `ytmov-${vid}`,
            title,
            subtitle: channel,
            category,
            durationLabel: durText || (isTrailerCategory ? 'Trailer HD' : 'Completo HD'),
            posterUrl: pickBestThumbnail(vr, vid),
            youtubeVideoId: vid,
            externalUrl: `https://www.youtube.com/watch?v=${vid}`,
            isTrailer: Boolean(isTrailerCategory),
            sourceLabel,
            qualityLabel,
            isDubbed,
            mediaType: resolvedType,
          },
        });
        if (scoredItems.length >= 34) break;
      }
    } catch {
      // continue to fallback url or Archive
    }
  }

  // Prioritize highest quality (4K / 1080p) and Dublado PT-BR at the top
  scoredItems.sort((a, b) => b.score - a.score);
  const items = scoredItems.slice(0, 30).map((x) => x.item);

  // Append Internet Archive open feature films only when YouTube returned too few results
  if (!isTrailerCategory && items.length < 10) {
    try {
      const arcUrl =
        'https://archive.org/advancedsearch.php?q=' +
        encodeURIComponent(`(${cleanQ.split(' ').slice(0, 3).join(' ')}) AND mediatype:movies`) +
        '&fl[]=identifier,title,creator,year&rows=6&output=json';
      const ar = await fetch(arcUrl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000) });
      if (ar.ok) {
        const aj = await ar.json();
        const docs = aj?.response?.docs || [];
        for (const d of docs) {
          if (!d.identifier || seen.has(d.identifier)) continue;
          seen.add(d.identifier);
          items.push({
            id: `arcmov-${d.identifier}`,
            title: d.title || d.identifier,
            subtitle: Array.isArray(d.creator) ? d.creator[0] : d.creator || 'Arquivo Público',
            category,
            year: d.year ? String(d.year) : undefined,
            durationLabel: 'Filme Completo',
            posterUrl: `https://archive.org/services/img/${d.identifier}`,
            externalUrl: `https://archive.org/details/${d.identifier}`,
            videoStreamUrl: `https://archive.org/embed/${d.identifier}`,
            isTrailer: false,
            sourceLabel: 'Acervo Aberto',
            qualityLabel: 'HD Archive',
            isDubbed: false,
            mediaType: 'movie',
          });
        }
      }
    } catch {
      // ignore
    }
  }

  movieCache.set(key, { ts: Date.now(), data: items });
  return items;
}

let directoryCache = { ts: 0, payload: null };

export async function getMoviesDirectory(forceRefresh = false) {
  if (!forceRefresh && directoryCache.payload && Date.now() - directoryCache.ts < 1000 * 60 * 30) {
    return directoryCache.payload;
  }

  if (forceRefresh) {
    movieCache.clear();
  }

  const settled = [];
  const batchSize = 6;
  for (let i = 0; i < MOVIE_CATEGORIES.length; i += batchSize) {
    const chunk = MOVIE_CATEGORIES.slice(i, i + batchSize);
    const res = await Promise.all(
      chunk.map(async (cat) => ({
        ...cat,
        movies: await searchMovies(
          cat.query,
          cat.title,
          Boolean(cat.isTrailerCategory),
          cat.mediaType || 'movie',
          Boolean(cat.isArchiveOnly)
        ),
      }))
    );
    settled.push(...res);
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    categories: settled,
  };
  if (settled.some((c) => c.movies.length > 0)) {
    directoryCache = { ts: Date.now(), payload };
  }
  return payload;
}

function extractPlaylistVideoRenderers(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) extractPlaylistVideoRenderers(item, out);
    return out;
  }
  if (node.playlistVideoRenderer && node.playlistVideoRenderer.videoId) {
    out.push(node.playlistVideoRenderer);
  }
  for (const k of Object.keys(node)) {
    if (k !== 'playlistVideoRenderer') extractPlaylistVideoRenderers(node[k], out);
  }
  return out;
}

const seriesSeasonCache = new Map();

function sanitizeSeriesSearchTitle(raw = '') {
  return String(raw || '')
    .replace(/\b(temporada|season|epis[oó]dio|ep\.?|completo|completa|dublado|legendado|full\s*hd|1080p|720p|4k|hd|pt-br|parte\s*\d+)\b/gi, ' ')
    .replace(/[\[\]()|#–—-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 5)
    .join(' ');
}

export async function getSeriesSeasonsAndEpisodes({
  title = '',
  season = 1,
  playlistId = '',
  mediaType = 'series',
} = {}) {
  const cleanTitle = sanitizeSeriesSearchTitle(title) || 'Série Dublada';
  const targetSeason = Math.max(1, Math.min(20, Number(season) || 1));
  const pid = String(playlistId || '').trim();
  const key = `${cleanTitle.toLowerCase()}|${targetSeason}|${pid}|${mediaType}`;
  const cached = seriesSeasonCache.get(key);
  if (cached && Date.now() - cached.ts < 1000 * 60 * 20) return cached.data;

  let seasons = [{ number: 1, name: 'Temporada 1', episodeCount: 0 }];
  let showSummary = '';
  let showPoster = '';
  let tvmazeEpisodes = [];

  // 1. Free TVMaze / Jikan Open Metadata API for official Seasons & Episode Titles
  if (mediaType === 'anime') {
    try {
      const jr = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`,
        { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000) }
      );
      if (jr.ok) {
        const jj = await jr.json();
        const item = jj?.data?.[0];
        if (item) {
          showPoster = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '';
          showSummary = item.synopsis ? String(item.synopsis).slice(0, 220) : '';
          const totalEps = Number(item.episodes) || 12;
          const numSeasons = Math.max(1, Math.min(6, Math.ceil(totalEps / 24)));
          seasons = Array.from({ length: numSeasons }, (_, i) => ({
            number: i + 1,
            name: `Temporada ${i + 1}`,
            episodeCount: i === 0 ? Math.min(24, totalEps) : 24,
          }));
        }
      }
    } catch {
      // ignore
    }
  } else {
    try {
      const tr = await fetch(
        `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(cleanTitle)}&embed[]=seasons&embed[]=episodes`,
        { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4500) }
      );
      if (tr.ok) {
        const tj = await tr.json();
        showPoster = tj?.image?.medium || tj?.image?.original || '';
        showSummary = tj?.summary ? String(tj.summary).replace(/<[^>]+>/g, '').slice(0, 220) : '';
        const rawSeasons = tj?._embedded?.seasons;
        if (Array.isArray(rawSeasons) && rawSeasons.length > 0) {
          seasons = rawSeasons
            .filter((s) => Number(s.number) > 0)
            .slice(0, 12)
            .map((s) => ({
              number: Number(s.number),
              name: `Temporada ${s.number}`,
              episodeCount: Number(s.episodeOrder) || 0,
            }));
        }
        const rawEps = tj?._embedded?.episodes;
        if (Array.isArray(rawEps)) {
          tvmazeEpisodes = rawEps.filter((e) => Number(e.season) === targetSeason);
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Fetch real playable episodes (from Playlist on Season 1 or YouTube episode search for the requested season)
  const episodes = [];
  const seenVid = new Set();

  if (pid && targetSeason === 1) {
    try {
      const plRes = await fetch(`https://www.youtube.com/playlist?list=${encodeURIComponent(pid)}`, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9' },
        signal: AbortSignal.timeout(6500),
      });
      if (plRes.ok) {
        const html = await plRes.text();
        const marker = 'var ytInitialData = ';
        const idx = html.indexOf(marker);
        if (idx !== -1) {
          const sub = html.slice(idx + marker.length);
          const end = sub.indexOf(';</script>');
          if (end !== -1) {
            const data = JSON.parse(sub.slice(0, end));
            const pvs = extractPlaylistVideoRenderers(data);
            for (const pv of pvs.slice(0, 24)) {
              const vid = pv.videoId;
              if (!vid || seenVid.has(vid)) continue;
              seenVid.add(vid);
              const epTitle = (pv.title?.runs || []).map((r) => r.text).join('') || `Episódio ${episodes.length + 1}`;
              const durText = pv.lengthText?.simpleText || 'Episódio HD';
              episodes.push({
                id: `ep-${vid}`,
                episodeNumber: episodes.length + 1,
                seasonNumber: targetSeason,
                title: epTitle,
                subtitle: `${cleanTitle} · T${targetSeason} E${episodes.length + 1}`,
                durationLabel: durText,
                posterUrl: pickBestThumbnail(pv, vid),
                youtubeVideoId: vid,
                isDubbed: /dublad/i.test(epTitle),
                qualityLabel: 'HD 720p+',
                mediaType,
                sourceLabel: `T${targetSeason} · Ep ${episodes.length + 1}`,
              });
            }
          }
        }
      }
    } catch {
      // fallback to search below
    }
  }

  if (episodes.length === 0) {
    const epQuery = `${cleanTitle} temporada ${targetSeason} episodio dublado`;
    const found = await searchMovies(epQuery, `${cleanTitle} · T${targetSeason}`, false, mediaType, false);

    // If search returned a complete season playlist, unpack its real episodes automatically
    const plItem = found.find((x) => x.youtubePlaylistId);
    if (plItem?.youtubePlaylistId) {
      try {
        const plRes = await fetch(`https://www.youtube.com/playlist?list=${encodeURIComponent(plItem.youtubePlaylistId)}`, {
          headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9' },
          signal: AbortSignal.timeout(6000),
        });
        if (plRes.ok) {
          const html = await plRes.text();
          const marker = 'var ytInitialData = ';
          const idx = html.indexOf(marker);
          if (idx !== -1) {
            const sub = html.slice(idx + marker.length);
            const end = sub.indexOf(';</script>');
            if (end !== -1) {
              const data = JSON.parse(sub.slice(0, end));
              const pvs = extractPlaylistVideoRenderers(data);
              for (const pv of pvs.slice(0, 24)) {
                const vid = pv.videoId;
                if (!vid || seenVid.has(vid)) continue;
                seenVid.add(vid);
                const epMeta = tvmazeEpisodes[episodes.length];
                const epTitle =
                  epMeta?.name
                    ? `Ep ${episodes.length + 1}: ${epMeta.name}`
                    : (pv.title?.runs || []).map((r) => r.text).join('') || `Episódio ${episodes.length + 1}`;
                episodes.push({
                  id: `ep-${targetSeason}-${vid}`,
                  episodeNumber: episodes.length + 1,
                  seasonNumber: targetSeason,
                  title: epTitle,
                  subtitle: `${cleanTitle} · T${targetSeason} E${episodes.length + 1}`,
                  durationLabel: pv.lengthText?.simpleText || 'Episódio HD',
                  posterUrl: pickBestThumbnail(pv, vid) || epMeta?.image?.medium || showPoster,
                  youtubeVideoId: vid,
                  isDubbed: /dublad/i.test(epTitle),
                  qualityLabel: 'HD 720p+',
                  mediaType,
                  sourceLabel: `T${targetSeason} · Ep ${episodes.length + 1}`,
                });
              }
            }
          }
        }
      } catch {
        // fallback below
      }
    }

    if (episodes.length === 0) {
      let fallbackList = found;
      if (!fallbackList.some((x) => x.youtubeVideoId)) {
        fallbackList = await searchMovies(
          `${cleanTitle} temporada ${targetSeason} episodio`,
          `${cleanTitle} · T${targetSeason}`,
          true,
          'trailer',
          false
        );
      }
      for (const item of fallbackList.slice(0, 18)) {
        const vid = item.youtubeVideoId;
        if (!vid || seenVid.has(vid)) continue;
        seenVid.add(vid);
        const epMeta = tvmazeEpisodes[episodes.length];
        episodes.push({
          id: `ep-${targetSeason}-${vid}`,
          episodeNumber: episodes.length + 1,
          seasonNumber: targetSeason,
          title: epMeta?.name ? `Ep ${episodes.length + 1}: ${epMeta.name}` : item.title,
          subtitle: item.subtitle || `${cleanTitle} · Temporada ${targetSeason}`,
          durationLabel: item.durationLabel || 'Episódio HD',
          posterUrl: item.posterUrl || epMeta?.image?.medium || showPoster,
          youtubeVideoId: vid,
          isDubbed: item.isDubbed,
          qualityLabel: item.qualityLabel || 'HD 720p+',
          mediaType,
          sourceLabel: `T${targetSeason} · Ep ${episodes.length + 1}`,
        });
      }
    }
  }

  // Ensure at least Season 1 & 2 buttons exist cleanly when relevant
  if (seasons.length === 0) {
    seasons = [{ number: 1, name: 'Temporada 1', episodeCount: episodes.length }];
  }

  const result = {
    seriesTitle: cleanTitle,
    season: targetSeason,
    showPoster,
    showSummary,
    seasons,
    episodes,
  };
  seriesSeasonCache.set(key, { ts: Date.now(), data: result });
  return result;
}

// Legal Full-Length Free Movies, International Hits (Dubbed PT-BR), Series & Animes in HD/4K
// Sources: YouTube HD Filter (&sp=EgIgAQ%3D%3D) + Internet Archive Open Cinema

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export const MOVIE_CATEGORIES = [
  {
    id: 'cat-internacionais-dub',
    title: 'Top Internacionais Dublados (Full HD)',
    emoji: '🌍',
    mediaType: 'movie',
    query: 'melhores filmes internacionais completos dublados portugues full hd 1080p',
  },
  {
    id: 'cat-sequencias',
    title: 'Sagas, Sequências & Continuações (Parte 1, 2, 3...)',
    emoji: '🎞️',
    mediaType: 'movie',
    query: 'filme completo parte 1 parte 2 saga sequencia dublado hd',
  },
  {
    id: 'cat-series',
    title: 'Séries Internacionais & Episódios Dublados (HD)',
    emoji: '📺',
    mediaType: 'series',
    query: 'serie internacional completa dublado portugues episodio hd',
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
    id: 'cat-trailers',
    title: 'Lançamentos Cinema — Trailers Oficiais 4K/HD',
    emoji: '🎬',
    mediaType: 'trailer',
    isTrailerCategory: true,
    query: 'trailer oficial lancamento cinema 2026 dublado 4k hd',
  },
  {
    id: 'cat-classicos',
    title: 'Documentários Espaciais & Clássicos 4K/HD',
    emoji: '🛸',
    mediaType: 'movie',
    query: 'documentario universo nasa completo dublado 4k hd',
  },
  {
    id: 'cat-archive-cinema',
    title: 'Acervo Cinema & Séries Clássicas (Fonte Direta Archive.org)',
    emoji: '🏛️',
    mediaType: 'movie',
    isArchiveOnly: true,
    query: 'feature_films OR sci_fi_and_horror',
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
    const arcItems = await fetchArchiveCinema(cleanQ, category, 16);
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

      // Series & animes can have 15-24 min episodes; full movies require >= 28 min
      const minDurSec = isTrailerCategory
        ? 0
        : mediaType === 'series' || mediaType === 'anime'
          ? 720
          : 1500;

      for (const vr of renderers) {
        const vid = vr.videoId;
        if (!vid || seen.has(vid)) continue;
        const durText = vr.lengthText?.simpleText || '';
        const durSec = parseDurSec(durText);
        if (!isTrailerCategory && durSec > 0 && durSec < minDurSec) continue;
        if (isTrailerCategory && durSec > 480) continue;

        const title = (vr.title?.runs || []).map((r) => r.text).join('') || 'Filme HD';
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
        if (scoredItems.length >= 24) break;
      }
    } catch {
      // continue to fallback url or Archive
    }
  }

  // Prioritize highest quality (4K / 1080p) and Dublado PT-BR at the top
  scoredItems.sort((a, b) => b.score - a.score);
  const items = scoredItems.slice(0, 18).map((x) => x.item);

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

export async function getMoviesDirectory() {
  const settled = await Promise.all(
    MOVIE_CATEGORIES.map(async (cat) => ({
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
  return { categories: settled };
}

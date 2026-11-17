// AI-assisted Multi-Source Full-Length Music Discovery Engine for LENKYX Cosmic Phonk
// Combines: YouTube Full Official Audio/Playlists + iTunes Metadata/Covers + Wikipedia Artist Photos + Audius Full MP3 + NASA/Archive.org Deep Space & ET Audio

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export const FAMOUS_ARTISTS_DIRECTORY = [
  // Internacionais — Estrelas Globais (Pop, Hip-Hop, R&B, Rock, Eletrônica)
  { name: 'The Weeknd', genre: 'Pop / Synthwave', era: 'Global Top', wiki: 'The_Weeknd', lang: 'en', query: 'The Weeknd official audio' },
  { name: 'Taylor Swift', genre: 'Pop Global', era: 'Global Top', wiki: 'Taylor_Swift', lang: 'en', query: 'Taylor Swift official music' },
  { name: 'Billie Eilish', genre: 'Alt Pop', era: 'Global Top', wiki: 'Billie_Eilish', lang: 'en', query: 'Billie Eilish official audio' },
  { name: 'Bruno Mars', genre: 'Pop / R&B', era: 'Global Top', wiki: 'Bruno_Mars', lang: 'en', query: 'Bruno Mars official audio' },
  { name: 'Dua Lipa', genre: 'Pop / Dance', era: 'Global Top', wiki: 'Dua_Lipa', lang: 'en', query: 'Dua Lipa official music' },
  { name: 'Drake', genre: 'Hip-Hop / R&B', era: 'Global Top', wiki: 'Drake_(musician)', lang: 'en', query: 'Drake official audio' },
  { name: 'Bad Bunny', genre: 'Reggaeton / Trap', era: 'Latina Global', wiki: 'Bad_Bunny', lang: 'en', query: 'Bad Bunny official audio' },
  { name: 'Travis Scott', genre: 'Trap / Hip-Hop', era: 'Global Top', wiki: 'Travis_Scott', lang: 'en', query: 'Travis Scott official audio' },
  { name: 'Eminem', genre: 'Hip-Hop / Rap', era: 'Lenda Global', wiki: 'Eminem', lang: 'en', query: 'Eminem official audio' },
  { name: 'Rihanna', genre: 'Pop / R&B', era: 'Ícone Global', wiki: 'Rihanna', lang: 'en', query: 'Rihanna official music' },
  { name: 'Post Malone', genre: 'Pop / Hip-Hop', era: 'Global Top', wiki: 'Post_Malone', lang: 'en', query: 'Post Malone official audio' },
  { name: 'Ariana Grande', genre: 'Pop / R&B', era: 'Global Top', wiki: 'Ariana_Grande', lang: 'en', query: 'Ariana Grande official audio' },
  { name: 'Coldplay', genre: 'Pop Rock', era: 'Global Top', wiki: 'Coldplay', lang: 'en', query: 'Coldplay official music' },
  { name: 'Imagine Dragons', genre: 'Rock / Pop', era: 'Global Top', wiki: 'Imagine_Dragons', lang: 'en', query: 'Imagine Dragons official audio' },
  { name: 'Daft Punk', genre: 'Eletrônica / Espacial', era: 'Lenda Global', wiki: 'Daft_Punk', lang: 'en', query: 'Daft Punk official audio' },
  { name: 'Michael Jackson', genre: 'Rei do Pop', era: 'Anos 70/80/90', wiki: 'Michael_Jackson', lang: 'en', query: 'Michael Jackson official audio' },
  { name: 'Queen', genre: 'Rock Clássico', era: 'Anos 70/80', wiki: 'Queen_(band)', lang: 'en', query: 'Queen official audio' },
  { name: 'Linkin Park', genre: 'Rock / Nu Metal', era: 'Anos 2000/2020', wiki: 'Linkin_Park', lang: 'en', query: 'Linkin Park official' },
  { name: 'Metallica', genre: 'Heavy Metal', era: 'Lenda Global', wiki: 'Metallica', lang: 'en', query: 'Metallica official audio' },
  { name: 'Kordhell', genre: 'Phonk Mundial', era: 'Nova Geração', wiki: 'Phonk', lang: 'en', query: 'Kordhell phonk' },
  // Brasil — Sertanejo, Pop, Eletrônica, Rap, Rock
  { name: 'Henrique & Juliano', genre: 'Sertanejo', era: 'Brasil', wiki: 'Henrique_&_Juliano', lang: 'pt', query: 'Henrique e Juliano musica oficial' },
  { name: 'Marília Mendonça', genre: 'Sertanejo', era: 'Rainha da Sofrência', wiki: 'Marília_Mendonça', lang: 'pt', query: 'Marilia Mendonca melhores musicas' },
  { name: 'Gusttavo Lima', genre: 'Sertanejo', era: 'Embaixador', wiki: 'Gusttavo_Lima', lang: 'pt', query: 'Gusttavo Lima oficial audio' },
  { name: 'Jorge & Mateus', genre: 'Sertanejo', era: 'Brasil', wiki: 'Jorge_&_Mateus', lang: 'pt', query: 'Jorge e Mateus sucessos' },
  { name: 'Luan Santana', genre: 'Sertanejo / Pop', era: 'Brasil', wiki: 'Luan_Santana', lang: 'pt', query: 'Luan Santana oficial' },
  { name: 'Alok', genre: 'Eletrônica / House', era: 'Brasil & Mundo', wiki: 'Alok', lang: 'pt', query: 'Alok official music' },
  { name: 'Vintage Culture', genre: 'House / Eletrônica', era: 'Brasil & Mundo', wiki: 'Vintage_Culture', lang: 'pt', query: 'Vintage Culture official' },
  { name: 'Anitta', genre: 'Pop / Funk Brasil', era: 'Brasil & Mundo', wiki: 'Anitta', lang: 'pt', query: 'Anitta official audio' },
  { name: "Racionais MC's", genre: 'Rap Nacional', era: 'Anos 90/2000', wiki: "Racionais_MC's", lang: 'pt', query: 'Racionais MCs musicas' },
  { name: 'Legião Urbana', genre: 'Rock Nacional', era: 'Anos 80/90', wiki: 'Legião_Urbana', lang: 'pt', query: 'Legiao Urbana sucessos' },
];

export const CURATED_PLAYLISTS = [
  {
    id: 'pl-clips-oficiais',
    title: 'Melhores Clipes Oficiais & DVDs Completos',
    subtitle: 'Henrique & Juliano, Marília Mendonça, Gusttavo Lima, Queen, Michael Jackson, Alok',
    emoji: '🎬',
    era: 'Cinema & Clipes HD',
    searchQuery: 'Henrique e Juliano Marilia Mendonca Queen Michael Jackson The Weeknd clipe oficial official music video',
    gradient: 'from-rose-600/40 via-purple-600/25 to-cyan-500/25',
  },
  {
    id: 'pl-sertanejo-top',
    title: 'Sertanejo Gigantes & Sofrência',
    subtitle: 'Henrique & Juliano, Marília Mendonça, Gusttavo Lima, Jorge & Mateus',
    emoji: '🤠',
    era: 'Brasil Atual & Clássicos',
    searchQuery: 'Henrique e Juliano Marilia Mendonca Gusttavo Lima Jorge e Mateus musicas completas',
    gradient: 'from-amber-500/35 via-orange-600/20 to-pink-600/25',
  },
  {
    id: 'pl-brasil-lendas',
    title: 'Brasil Todos os Tempos (MPB, Rap, Funk & Rock)',
    subtitle: "Racionais MC's, Legião Urbana, Alok, Anitta, Tim Maia, Exaltasamba",
    emoji: '🇧🇷',
    era: 'Todas as Gerações BR',
    searchQuery: 'melhores musicas brasileiras pop rock rap pagode Alok Legiao Urbana Racionais',
    gradient: 'from-emerald-500/30 via-yellow-500/20 to-cyan-500/25',
  },
  {
    id: 'pl-golden-eras',
    title: 'Lendas Mundiais — Anos 60, 70, 80 & 90',
    subtitle: 'Queen, Michael Jackson, Nirvana, Elton John, Bee Gees, Tears For Fears',
    emoji: '🕰️',
    era: 'Anos 60 / 70 / 80 / 90',
    searchQuery: 'Queen Michael Jackson Nirvana 80s 90s greatest hits official audio',
    gradient: 'from-purple-600/35 via-fuchsia-500/20 to-amber-500/25',
  },
  {
    id: 'pl-2000-2026',
    title: 'Hits Globais — Anos 2000 até Hoje',
    subtitle: 'The Weeknd, Bruno Mars, Eminem, Coldplay, Linkin Park, Billie Eilish',
    emoji: '🌍',
    era: 'Anos 2000 – 2026',
    searchQuery: 'The Weeknd Bruno Mars Coldplay Eminem Linkin Park official audio hits',
    gradient: 'from-cyan-500/35 via-blue-600/25 to-pink-500/25',
  },
  {
    id: 'pl-phonk-drift',
    title: 'Phonk & Drift Mundial (Full Tracks)',
    subtitle: 'Brazilian Phonk, Kordhell, DVRST, Ghostface Playa & Cosmic Bass',
    emoji: '😈',
    era: 'Geração Phonk',
    searchQuery: 'brazilian phonk Kordhell DVRST drift phonk full track',
    gradient: 'from-pink-600/40 via-purple-700/25 to-red-600/25',
  },
  {
    id: 'pl-space-et',
    title: 'Galáxia, Espaço & Frequências E.T.',
    subtitle: 'NASA Voyager Golden Record, Ondas de Saturno, Sinais Alienígenas & Synth Cósmico',
    emoji: '🛸',
    era: 'Espaço & Outras Galáxias',
    searchQuery: 'NASA space sounds voyager cosmic ambient alien synthwave music',
    gradient: 'from-indigo-600/45 via-cyan-500/30 to-emerald-500/25',
    includeArchiveSpace: true,
  },
];

const wikiCache = new Map();
const searchCache = new Map();

function parseDurationText(txt = '') {
  const parts = String(txt).trim().split(':').map((n) => parseInt(n, 10));
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function buildAiInsight(rawQuery, expandedQuery, artistProfile, trackCount, isCosmic) {
  const q = rawQuery.trim();
  if (!q) {
    return {
      title: 'IA Musical LENKYX — Planeta Terra & Espaço Sideral',
      summary:
        'Seleção inteligente gratuita com versões completas (sem cortes de 30s) dos maiores sucessos do Brasil, do mundo, de todas as gerações e sinais cósmicos do espaço.',
      tags: ['100% Completo', 'Brasil & Mundo', 'Todas as Gerações', 'Espaço & E.T.'],
    };
  }
  if (isCosmic) {
    return {
      title: `IA Cósmica ativada para "${q}"`,
      summary: `Busquei na Terra e fora dela: combinei registros reais da NASA (Voyager / ondas eletromagnéticas planetárias), paisagens sonoras alienígenas e música cósmica completa (${trackCount} faixas encontradas).`,
      tags: ['NASA & Espaço', 'Frequências E.T.', 'Versões Completas', 'Sem 30s'],
    };
  }
  if (artistProfile) {
    return {
      title: `IA Musical encontrou ${artistProfile.name}`,
      summary: `Carreguei a foto oficial, perfil e ${trackCount} faixas/shows completos gratuitos de ${artistProfile.name}${expandedQuery !== q ? ` (expansão IA: "${expandedQuery}")` : ''}. Avance na fila para ouvir na sequência!`,
      tags: [artistProfile.genre || 'Artista Famoso', 'Foto Oficial', 'Faixas Completas', 'Playlist Automática'],
    };
  }
  return {
    title: `Busca IA para "${q}"`,
    summary: `Analisei seu pedido e reuni ${trackCount} faixas completas gratuitas entre Brasil, hits internacionais e acervos digitais (${expandedQuery !== q ? `busca otimizada: "${expandedQuery}"` : 'correspondência direta'}).`,
    tags: ['IA Musical', 'Versões Completas', 'Grátis', 'Sequência na Fila'],
  };
}

function interpretQueryWithAI(rawQuery) {
  const q = String(rawQuery || '').trim();
  const low = q.toLowerCase();
  const isCosmic =
    /(et|e\.t|alien|alienigena|alienígena|espaco|espaço|galaxia|galáxia|universo|nasa|voyager|ovini|ufo|orbita|órbita|planeta|cosmic|saturno|jupiter)/.test(
      low
    );

  // Check if matches any directory famous artist
  const matchedArtist = FAMOUS_ARTISTS_DIRECTORY.find(
    (a) =>
      low.includes(a.name.toLowerCase()) ||
      low.includes(a.name.toLowerCase().replace(/&/g, 'e').replace(/'/g, '')) ||
      (a.name === 'Henrique & Juliano' && low.includes('henrique') && low.includes('juliano')) ||
      (a.name === 'Jorge & Mateus' && low.includes('jorge') && low.includes('mateus')) ||
      (a.name === 'Zé Neto & Cristiano' && low.includes('ze neto')) ||
      (a.name === 'Marília Mendonça' && low.includes('marilia'))
  );

  let expanded = q;
  if (isCosmic) {
    expanded = `${q} NASA Voyager space sounds cosmic ambient alien music`;
  } else if (/(clipe|clipes|clip|clips|dvd|video|ao vivo)/.test(low)) {
    expanded = `${q} clipe oficial official music video`;
  } else if (/(anos 60|anos 70|anos 80|anos 90|flashback|antigas)/.test(low)) {
    expanded = `${q} maiores sucessos classicos musica completa`;
  } else if (/(sertanejo|sofrência|sofrencia|modão|modao)/.test(low) && !matchedArtist) {
    expanded = `${q} Henrique e Juliano Marilia Mendonca Gusttavo Lima musica`;
  } else if (matchedArtist) {
    expanded = `${matchedArtist.name} musica oficial`;
  }

  return { raw: q, expanded, isCosmic, matchedArtist };
}

export async function fetchArtistPhotoAndBio(artistName, lang = 'pt', explicitWikiSlug = '') {
  const key = `${lang}:${explicitWikiSlug || artistName.toLowerCase()}`;
  if (wikiCache.has(key)) return wikiCache.get(key);

  const tryWikiSummary = async (l, slug) => {
    try {
      const r = await fetch(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(3500),
      });
      if (!r.ok) return null;
      const d = await r.json();
      const photo = d?.originalimage?.source || d?.thumbnail?.source || '';
      if (!photo && !d?.extract) return null;
      return {
        name: d.title || artistName,
        photoUrl: photo,
        bio: (d.extract || '').slice(0, 220),
        wikiUrl: d?.content_urls?.desktop?.page || '',
      };
    } catch {
      return null;
    }
  };

  if (explicitWikiSlug) {
    const direct = await tryWikiSummary(lang, explicitWikiSlug);
    if (direct) {
      wikiCache.set(key, direct);
      return direct;
    }
  }

  for (const l of [lang, lang === 'pt' ? 'en' : 'pt']) {
    try {
      const sRes = await fetch(
        `https://${l}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          artistName + (l === 'pt' ? ' cantor OR cantora OR dupla OR banda' : ' musician OR band OR singer')
        )}&format=json&srlimit=3`,
        { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(3500) }
      );
      if (sRes.ok) {
        const sj = await sRes.json();
        const hits = sj?.query?.search || [];
        for (const h of hits) {
          const got = await tryWikiSummary(l, h.title.replace(/ /g, '_'));
          if (got && got.photoUrl) {
            wikiCache.set(key, got);
            return got;
          }
        }
      }
    } catch {
      // continue
    }
  }

  // Fallback: high-res 600x600 artist/album artwork from iTunes
  try {
    const itRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=1&country=${lang === 'pt' ? 'BR' : 'US'}`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (itRes.ok) {
      const itJson = await itRes.json();
      const first = itJson?.results?.[0];
      if (first?.artworkUrl100) {
        const resObj = {
          name: first.artistName || artistName,
          photoUrl: first.artworkUrl100.replace('100x100bb', '600x600bb'),
          bio: `${first.artistName || artistName} · ${first.primaryGenreName || 'Música'}`,
          wikiUrl: '',
        };
        wikiCache.set(key, resObj);
        return resObj;
      }
    }
  } catch {
    // ignore
  }

  wikiCache.set(key, null);
  return null;
}

async function searchYouTubeMusic(query, limit = 18) {
  try {
    const r = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return [];
    const html = await r.text();
    const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
    if (!m) return [];
    const data = JSON.parse(m[1]);

    const videoRenderers = [];
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.videoRenderer?.videoId) {
        videoRenderers.push(node.videoRenderer);
      }
      if (Array.isArray(node)) {
        for (const el of node) walk(el);
      } else {
        for (const val of Object.values(node)) walk(val);
      }
    };
    walk(data);

    const out = [];
    const seen = new Set();
    for (const v of videoRenderers) {
      if (!v?.videoId || seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      const title = v.title?.runs?.map((x) => x.text).join('') || '';
      const channel = v.ownerText?.runs?.[0]?.text || 'Artista';
      const durSec = parseDurationText(v.lengthText?.simpleText || '');
      if (durSec > 0 && durSec < 65) continue;
      if (durSec > 7200) continue;

      const thumb =
        v.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
        `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

      out.push({
        id: `yt-${v.videoId}`,
        number: out.length + 1,
        title,
        artist: channel.replace(/ - Topic$/i, '').trim(),
        emoji: durSec > 1200 ? '📀' : '🎵',
        bpm: 120,
        genre: durSec > 1200 ? 'Show / Álbum Completo' : 'Versão Completa',
        youtubeVideoId: v.videoId,
        audioUrl: '',
        coverUrl: thumb,
        externalUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        durationSec: durSec || 210,
        source: 'world_full',
        sourceLabel: 'Completa (YouTube)',
        plays: 0,
        favorite: false,
        status: { recorded: true, finalized: true, spotify: true, youtube: true },
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function searchAudiusFull(query, limit = 8) {
  try {
    const url = query.trim()
      ? `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=LENKYX`
      : `https://discoveryprovider.audius.co/v1/tracks/trending?limit=${limit}&app_name=LENKYX`;
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return [];
    const json = await r.json();
    const list = (json.data || []).filter((item) => item?.id && Number(item.duration || 0) >= 60);
    return list.slice(0, limit).map((item, idx) => ({
      id: `audius-${item.id}`,
      number: idx + 1,
      title: item.title || 'Faixa Audius',
      artist: item.user?.name || 'Artista Independente',
      emoji: '🎧',
      bpm: 128,
      genre: item.genre || 'Eletrônica / Remix',
      audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${item.id}/stream?app_name=LENKYX`,
      coverUrl:
        item.artwork?.['480x480'] ||
        item.artwork?.['150x150'] ||
        '/covers/album-official.jpg',
      externalUrl: item.permalink ? `https://audius.co${item.permalink}` : 'https://audius.co',
      durationSec: Math.round(Number(item.duration || 180)),
      source: 'world_full',
      sourceLabel: 'MP3 Completo (Audius)',
      plays: item.play_count || 0,
      favorite: false,
      status: { recorded: true, finalized: true, spotify: false, youtube: false },
    }));
  } catch {
    return [];
  }
}

async function searchArchiveSpaceAudio(_query, limit = 8) {
  try {
    const q = `mediatype:audio AND (title:(voyager OR saturn OR jupiter OR "deep space" OR "golden record" OR "space sounds")) AND NOT title:(podcast OR degens OR crypto OR news)`;
    const r = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator&rows=${limit}&output=json`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return [];
    const data = await r.json();
    const docs = data?.response?.docs || [];
    const results = [];
    for (const doc of docs.slice(0, 5)) {
      try {
        const metaR = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`, {
          signal: AbortSignal.timeout(3500),
        });
        if (!metaR.ok) continue;
        const meta = await metaR.json();
        const mp3 = (meta.result || []).find(
          (f) => f.name && f.name.toLowerCase().endsWith('.mp3') && Number(f.size || 0) > 100000
        );
        if (!mp3) continue;
        const dur = Math.round(parseFloat(mp3.length || '180')) || 180;
        results.push({
          id: `arch-${doc.identifier}`,
          number: results.length + 1,
          title: Array.isArray(doc.title) ? doc.title[0] : doc.title || doc.identifier,
          artist: (Array.isArray(doc.creator) ? doc.creator[0] : doc.creator) || 'NASA / Espaço Sideral',
          emoji: '🛸',
          bpm: 100,
          genre: 'Espaço & Galáxia',
          audioUrl: `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(mp3.name)}`,
          coverUrl: '/covers/album-official.jpg',
          externalUrl: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
          durationSec: dur,
          source: 'world_full',
          sourceLabel: 'Arquivo Cósmico (MP3)',
          plays: 0,
          favorite: false,
          status: { recorded: true, finalized: true, spotify: false, youtube: false },
        });
      } catch {
        // skip item
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function runSmartWorldSearch(rawQuery, options = {}) {
  const q = String(rawQuery || '').trim();
  const cacheKey = `${q.toLowerCase()}|${Boolean(options.includeArchiveSpace)}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
    return cached.payload;
  }

  const ai = interpretQueryWithAI(q);
  const queryForYt = q ? ai.expanded : 'Henrique e Juliano Marilia Mendonca The Weeknd Queen Alok official audio';

  const promises = [
    searchYouTubeMusic(queryForYt, 16),
    searchAudiusFull(q || 'phonk cosmic', 6),
    ai.isCosmic || options.includeArchiveSpace
      ? searchArchiveSpaceAudio('nasa voyager space electromagnetic alien', 6)
      : Promise.resolve([]),
  ];

  if (q.length >= 2) {
    const artistTarget = ai.matchedArtist ? ai.matchedArtist.name : q;
    promises.push(
      fetchArtistPhotoAndBio(
        artistTarget,
        ai.matchedArtist?.lang || 'pt',
        ai.matchedArtist?.wiki || ''
      )
    );
  } else {
    promises.push(Promise.resolve(null));
  }

  const [ytTracks, audiusTracks, archiveTracks, wikiArtist] = await Promise.all(promises);

  // Merge: NASA/Archive space first if cosmic, then YouTube Official, then Audius
  const combined = [];
  const seenIds = new Set();
  const pushUnique = (arr) => {
    for (const t of arr) {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        combined.push({ ...t, number: combined.length + 1 });
      }
    }
  };

  if (ai.isCosmic || options.includeArchiveSpace) {
    pushUnique(archiveTracks);
    pushUnique(ytTracks);
    pushUnique(audiusTracks);
  } else {
    pushUnique(ytTracks);
    pushUnique(audiusTracks);
    pushUnique(archiveTracks);
  }

  const artistProfile =
    wikiArtist || ai.matchedArtist
      ? {
          name: wikiArtist?.name || ai.matchedArtist?.name || q,
          photoUrl: wikiArtist?.photoUrl || ytTracks[0]?.coverUrl || '/covers/album-official.jpg',
          bio: wikiArtist?.bio || '',
          genre: ai.matchedArtist?.genre || (ai.isCosmic ? 'Espaço & Galáxia' : 'Artista Mundial'),
          era: ai.matchedArtist?.era || '',
          wikiUrl: wikiArtist?.wikiUrl || '',
        }
      : null;

  const payload = {
    query: q,
    aiInsight: buildAiInsight(q, ai.expanded, artistProfile, combined.length, ai.isCosmic),
    artistProfile,
    tracks: combined,
    playlists: CURATED_PLAYLISTS,
  };

  searchCache.set(cacheKey, { ts: Date.now(), payload });
  return payload;
}

let cachedArtistsDirectory = null;
let cachedArtistsTs = 0;

export async function getFamousArtistsWithPhotos() {
  if (cachedArtistsDirectory && Date.now() - cachedArtistsTs < 6 * 3600 * 1000) {
    return cachedArtistsDirectory;
  }
  const enriched = await Promise.all(
    FAMOUS_ARTISTS_DIRECTORY.map(async (a) => {
      const info = await fetchArtistPhotoAndBio(a.name, a.lang, a.wiki);
      return {
        ...a,
        photoUrl: info?.photoUrl || '/covers/album-official.jpg',
        bio: info?.bio || '',
      };
    })
  );
  cachedArtistsDirectory = enriched;
  cachedArtistsTs = Date.now();
  return enriched;
}

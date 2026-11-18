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
  { name: 'Ana Castela', genre: 'Agronejo / Sertanejo', era: 'Brasil Top', wiki: 'Ana_Castela', lang: 'pt', query: 'Ana Castela musica oficial' },
  { name: 'Zé Neto & Cristiano', genre: 'Sertanejo', era: 'Brasil Top', wiki: 'Zé_Neto_&_Cristiano', lang: 'pt', query: 'Ze Neto e Cristiano oficial' },
  { name: 'Simone Mendes', genre: 'Sertanejo', era: 'Brasil Top', wiki: 'Simone_Mendes', lang: 'pt', query: 'Simone Mendes oficial' },
  { name: 'Matuê', genre: 'Trap Nacional', era: 'Brasil Top', wiki: 'Matuê', lang: 'pt', query: 'Matue oficial audio' },
  { name: 'MC Ryan SP', genre: 'Funk Brasil', era: 'Brasil Top', wiki: 'MC_Ryan_SP', lang: 'pt', query: 'MC Ryan SP oficial' },
  { name: 'MC Hariel', genre: 'Funk Consciente', era: 'Brasil Top', wiki: 'MC_Hariel', lang: 'pt', query: 'MC Hariel oficial' },
  { name: 'Shakira', genre: 'Pop Latino', era: 'Global Top', wiki: 'Shakira', lang: 'en', query: 'Shakira official music' },
  { name: 'Karol G', genre: 'Reggaeton / Pop', era: 'Global Top', wiki: 'Karol_G', lang: 'en', query: 'Karol G official audio' },
  { name: 'Kendrick Lamar', genre: 'Hip-Hop / Rap', era: 'Global Top', wiki: 'Kendrick_Lamar', lang: 'en', query: 'Kendrick Lamar official audio' },
  { name: 'SZA', genre: 'R&B / Soul', era: 'Global Top', wiki: 'SZA', lang: 'en', query: 'SZA official audio' },
  { name: 'Sabrina Carpenter', genre: 'Pop Global', era: 'Global Top', wiki: 'Sabrina_Carpenter', lang: 'en', query: 'Sabrina Carpenter official' },
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

const SPELL_ALIASES = new Map([
  ['metalica', 'Metallica'],
  ['metallika', 'Metallica'],
  ['mettalica', 'Metallica'],
  ['acdc', 'AC/DC'],
  ['ac dc', 'AC/DC'],
  ['guns', "Guns N' Roses"],
  ['gunz', "Guns N' Roses"],
  ['guns n roses', "Guns N' Roses"],
  ['guns and roses', "Guns N' Roses"],
  ['michael jakson', 'Michael Jackson'],
  ['maicon jackson', 'Michael Jackson'],
  ['maicol jackson', 'Michael Jackson'],
  ['nirvanna', 'Nirvana'],
  ['link park', 'Linkin Park'],
  ['linkin', 'Linkin Park'],
  ['sistem of a down', 'System Of A Down'],
  ['system of down', 'System Of A Down'],
  ['airon maiden', 'Iron Maiden'],
  ['iron maidem', 'Iron Maiden'],
  ['slipnot', 'Slipknot'],
  ['pink floid', 'Pink Floyd'],
  ['led zepelin', 'Led Zeppelin'],
  ['cold play', 'Coldplay'],
  ['bitols', 'The Beatles'],
  ['beatles', 'The Beatles'],
  ['marilia mendonsa', 'Marília Mendonça'],
  ['gustavo lima', 'Gusttavo Lima'],
  ['henrique juliano', 'Henrique & Juliano'],
  ['jorge mateus', 'Jorge & Mateus'],
  ['ze neto', 'Zé Neto & Cristiano'],
  ['legiao', 'Legião Urbana'],
  ['racionais', "Racionais MC's"],
  ['red hot', 'Red Hot Chili Peppers'],
  ['foo figthers', 'Foo Fighters'],
  ['evanescense', 'Evanescence'],
  ['weeknd', 'The Weeknd'],
  ['the weekend', 'The Weeknd'],
  ['bille eilish', 'Billie Eilish'],
  ['billy eilish', 'Billie Eilish'],
  ['eminen', 'Eminem'],
  ['rihana', 'Rihanna'],
  ['travis scot', 'Travis Scott'],
]);

function stripAccents(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function interpretQueryWithAI(rawQuery) {
  const q = String(rawQuery || '').trim();
  const clean = stripAccents(q).replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1) Spell-correction / alias resolution (handles typos like "metalica" -> "Metallica")
  let corrected = q;
  if (SPELL_ALIASES.has(clean)) {
    corrected = SPELL_ALIASES.get(clean);
  } else {
    // Check fuzzy match against famous artists directory (only for single/short artist queries)
    const words = clean.split(' ');
    if (clean.length >= 4 && words.length <= 3) {
      let best = null;
      let bestDist = 3;
      for (const a of FAMOUS_ARTISTS_DIRECTORY) {
        const an = stripAccents(a.name).replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const dist = levenshtein(clean, an);
        if (dist <= 2 && dist < bestDist) {
          bestDist = dist;
          best = a.name;
        }
      }
      if (best) corrected = best;
    }
  }

  const low = stripAccents(corrected);
  const isCosmic =
    /(\b(et|e\.t\.?|ufo|ovini|orbita|planeta|saturno|jupiter|espaco|galaxia|universo|nasa|voyager|cosmic)\b|alienigena|\balien\b)/.test(
      low
    );

  // Check if matches any directory famous artist
  const matchedArtist = FAMOUS_ARTISTS_DIRECTORY.find((a) => {
    const an = stripAccents(a.name);
    const anClean = an.replace(/&/g, 'e').replace(/'/g, '');
    return (
      low.includes(an) ||
      low.includes(anClean) ||
      (a.name === 'Henrique & Juliano' && low.includes('henrique') && low.includes('juliano')) ||
      (a.name === 'Jorge & Mateus' && low.includes('jorge') && low.includes('mateus')) ||
      (a.name === 'Zé Neto & Cristiano' && low.includes('ze neto')) ||
      (a.name === 'Marília Mendonça' && low.includes('marilia'))
    );
  });

  let expanded = corrected;
  if (isCosmic) {
    expanded = `${corrected} NASA Voyager space sounds cosmic ambient alien music`;
  } else if (/(clipe|clipes|clip|clips|dvd|video|ao vivo)/.test(low)) {
    expanded = `${corrected} clipe oficial official music video`;
  } else if (/(anos 60|anos 70|anos 80|anos 90|flashback|antigas)/.test(low)) {
    expanded = `${corrected} maiores sucessos classicos musica completa`;
  } else if (/(sertanejo|sofrencia|modao)/.test(low) && !matchedArtist) {
    expanded = `${corrected} Henrique e Juliano Marilia Mendonca Gusttavo Lima musica`;
  } else if (matchedArtist) {
    expanded = `${matchedArtist.name} official audio music`;
  }

  return { raw: q, corrected, expanded, isCosmic, matchedArtist };
}

function isUsablePortraitUrl(url = '') {
  const low = String(url || '').toLowerCase();
  if (!low.startsWith('http')) return false;
  if (low.includes('.svg') || low.includes('_sig') || low.includes('signature') || low.includes('flag_of')) {
    return false;
  }
  return true;
}

function wrapArtistPhotoUrl(rawUrl = '') {
  if (!rawUrl) return '';
  if (rawUrl.includes('wikimedia.org') || rawUrl.includes('wikipedia.org')) {
    return `/api/artist-photo?u=${encodeURIComponent(rawUrl)}`;
  }
  return rawUrl;
}

export async function fetchArtistPhotoAndBio(artistName, lang = 'pt', explicitWikiSlug = '') {
  const key = `${lang}:${explicitWikiSlug || artistName.toLowerCase()}`;
  if (wikiCache.has(key)) return wikiCache.get(key);

  const tryWikiSummary = async (l, slug) => {
    try {
      const r = await fetch(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) return null;
      const d = await r.json();
      const thumb = isUsablePortraitUrl(d?.thumbnail?.source) ? d.thumbnail.source : '';
      const orig = isUsablePortraitUrl(d?.originalimage?.source) ? d.originalimage.source : '';
      const photo = thumb || orig;
      return {
        name: d.title || artistName,
        photoUrl: photo ? wrapArtistPhotoUrl(photo) : '',
        bio: (d.extract || '').slice(0, 220),
        wikiUrl: d?.content_urls?.desktop?.page || '',
      };
    } catch {
      return null;
    }
  };

  let fallbackBio = '';
  if (explicitWikiSlug) {
    const direct = await tryWikiSummary(lang, explicitWikiSlug);
    if (direct?.photoUrl) {
      wikiCache.set(key, direct);
      return direct;
    }
    if (direct?.bio) fallbackBio = direct.bio;
  }

  if (!fallbackBio) {
    for (const l of [lang, lang === 'pt' ? 'en' : 'pt']) {
      try {
        const sRes = await fetch(
          `https://${l}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            artistName + (l === 'pt' ? ' cantor OR cantora OR dupla OR banda' : ' musician OR band OR singer')
          )}&format=json&srlimit=3`,
          { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4500) }
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
  }

  // Fallback: high-res 600x600 artist/album artwork from iTunes
  try {
    const itRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=1&country=${lang === 'pt' ? 'BR' : 'US'}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (itRes.ok) {
      const itJson = await itRes.json();
      const first = itJson?.results?.[0];
      if (first?.artworkUrl100) {
        const resObj = {
          name: first.artistName || artistName,
          photoUrl: wrapArtistPhotoUrl(first.artworkUrl100.replace('100x100bb', '600x600bb')),
          bio: fallbackBio || `${first.artistName || artistName} · ${first.primaryGenreName || 'Música'}`,
          wikiUrl: '',
        };
        wikiCache.set(key, resObj);
        return resObj;
      }
    }
  } catch {
    // ignore
  }

  // Never cache failures permanently so transient rate limits recover cleanly
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
        sourceLabel: 'Completa HD',
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
  const effectiveQuery = ai.corrected || q;
  const queryForYt = effectiveQuery ? ai.expanded : 'Henrique e Juliano Marilia Mendonca The Weeknd Queen Alok official audio';

  const promises = [
    searchYouTubeMusic(queryForYt, 18),
    searchAudiusFull(effectiveQuery || 'phonk cosmic', 6),
    ai.isCosmic || options.includeArchiveSpace
      ? searchArchiveSpaceAudio('nasa voyager space electromagnetic alien', 6)
      : Promise.resolve([]),
  ];

  if (effectiveQuery.length >= 2) {
    const artistTarget = ai.matchedArtist ? ai.matchedArtist.name : effectiveQuery;
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
          photoUrl: wikiArtist?.photoUrl || ytTracks[0]?.coverUrl || '',
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

const worldShortsCache = new Map();

const WORLD_SHORTS_QUERIES = {
  all: 'cosmic phonk drift edits dance music shorts',
  live: 'music radio dj phonk lofi chill live 24/7 ao vivo',
  phonk: 'phonk drift edits brazilian phonk shorts',
  brazil: 'funk sertanejo brasil music dance shorts',
  djs: 'dj live set electronic club festival shorts',
  space: 'nasa space galaxy stars planets cosmic shorts',
  dance: 'viral dance music challenge hip hop shorts',
  rock: 'electric guitar solo rock metal live shorts',
};

export async function searchWorldShorts(category = 'all', customQuery = '') {
  const cat = WORLD_SHORTS_QUERIES[category] ? category : 'all';
  const isLiveMode = cat === 'live' || /\b(ao vivo|live)\b/i.test(customQuery);
  const q = customQuery.trim()
    ? isLiveMode
      ? customQuery.trim()
      : `${customQuery.trim()} #shorts`
    : WORLD_SHORTS_QUERIES[cat];
  const key = `${cat}|${q.toLowerCase()}|${isLiveMode ? 'live' : 'shorts'}`;
  const cached = worldShortsCache.get(key);
  if (cached && Date.now() - cached.ts < (isLiveMode ? 3 * 60 * 1000 : 10 * 60 * 1000)) {
    return cached.items;
  }

  try {
    const spParam = isLiveMode ? '&sp=EgJAAQ%253D%253D' : '';
    const r = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}${spParam}`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return [];
    const html = await r.text();
    const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
    if (!m) return [];
    const data = JSON.parse(m[1]);

    const items = [];
    const seen = new Set();

    const walk = (node) => {
      if (!node || typeof node !== 'object' || items.length >= 24) return;
      if (node.shortsLockupViewModel) {
        const s = node.shortsLockupViewModel;
        const vid =
          s?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ||
          s?.inlinePlayerData?.onVisible?.innertubeCommand?.watchEndpoint?.videoId ||
          '';
        const title =
          s?.overlayMetadata?.primaryText?.content ||
          s?.accessibilityText ||
          'Global Short';
        if (vid && !seen.has(vid)) {
          seen.add(vid);
          items.push({
            id: `wshort-${vid}`,
            title: String(title).slice(0, 110),
            creator_name: 'Criador Global',
            creator_color: 'from-cyan-400 to-pink-500',
            description: `Toque para assistir em tela cheia · ⬆️⬇️`,
            media_type: 'youtube_short',
            video_url: '',
            youtube_id: vid,
            poster_url: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
            audio_title: 'Mundo Inteiro · Shorts',
            category: cat,
            likes: 120 + items.length * 17,
            created_at: new Date().toISOString(),
          });
        }
      }
      if (node.videoRenderer?.videoId) {
        const v = node.videoRenderer;
        const vid = v.videoId;
        const durSec = parseDurationText(v.lengthText?.simpleText || '');
        if (vid && !seen.has(vid) && (isLiveMode || durSec === 0 || durSec <= 120)) {
          seen.add(vid);
          const title = v.title?.runs?.map((x) => x.text).join('') || 'Global Music Short';
          const channel = v.ownerText?.runs?.[0]?.text || 'Criador Global';
          const thumb =
            v.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
            `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
          items.push({
            id: `wshort-${vid}`,
            title: isLiveMode ? `🔴 AO VIVO · ${String(title).slice(0, 100)}` : String(title).slice(0, 110),
            creator_name: String(channel).replace(/ - Topic$/i, '').slice(0, 36),
            creator_color: isLiveMode ? 'from-rose-500 to-amber-500' : 'from-pink-500 to-purple-500',
            description: isLiveMode
              ? `Transmissão Ao Vivo agora · ${channel}`
              : `Vídeo curto mundial · Categoria ${cat.toUpperCase()}`,
            media_type: 'youtube_short',
            video_url: '',
            youtube_id: vid,
            poster_url: thumb,
            audio_title: isLiveMode ? '🔴 Ao Vivo' : channel,
            category: cat,
            likes: 85 + items.length * 13,
            created_at: new Date().toISOString(),
          });
        }
      }
      if (Array.isArray(node)) {
        for (const el of node) walk(el);
      } else {
        for (const val of Object.values(node)) walk(val);
      }
    };
    walk(data);

    // Filter out YouTube videos/lives that disable third-party embedding ("Vídeo indisponível")
    const embeddable = [];
    for (let i = 0; i < items.length; i += 8) {
      const batch = items.slice(i, i + 8);
      const checked = await Promise.all(
        batch.map(async (it) => {
          if (!it.youtube_id) return it;
          try {
            const oe = await fetch(
              `https://www.youtube.com/oembed?url=${encodeURIComponent(
                `https://www.youtube.com/watch?v=${it.youtube_id}`
              )}&format=json`,
              { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(3500) }
            );
            if (!oe.ok) return null;
            const info = await oe.json().catch(() => null);
            return {
              ...it,
              creator_name:
                it.creator_name === 'Criador Global' && info?.author_name
                  ? String(info.author_name).slice(0, 36)
                  : it.creator_name,
              poster_url: info?.thumbnail_url || it.poster_url,
            };
          } catch {
            return null;
          }
        })
      );
      for (const x of checked) {
        if (x) embeddable.push(x);
      }
    }

    const finalList = embeddable.length > 0 ? embeddable : items.slice(0, 12);
    worldShortsCache.set(key, { ts: Date.now(), items: finalList });
    return finalList;
  } catch {
    return [];
  }
}

export async function getFamousArtistsWithPhotos() {
  if (
    cachedArtistsDirectory &&
    cachedArtistsDirectory.every((a) => a.photoUrl && !a.photoUrl.includes('album-official.jpg')) &&
    Date.now() - cachedArtistsTs < 6 * 3600 * 1000
  ) {
    return cachedArtistsDirectory;
  }

  // Throttled batches of 6 so Wikipedia/iTunes never rate-limit (429) on 40 parallel calls
  const enriched = [];
  const batchSize = 6;
  for (let i = 0; i < FAMOUS_ARTISTS_DIRECTORY.length; i += batchSize) {
    const chunk = FAMOUS_ARTISTS_DIRECTORY.slice(i, i + batchSize);
    const resolved = await Promise.all(
      chunk.map(async (a) => {
        const info = await fetchArtistPhotoAndBio(a.name, a.lang, a.wiki);
        return {
          ...a,
          photoUrl: info?.photoUrl || '',
          bio: info?.bio || '',
        };
      })
    );
    enriched.push(...resolved);
  }
  cachedArtistsDirectory = enriched;
  cachedArtistsTs = Date.now();
  return enriched;
}

let newReleasesCache = { ts: 0, tracks: [], year: 0 };

export async function getWorldNewReleases(forceRefresh = false) {
  const CURRENT_YEAR = new Date().getFullYear();
  if (
    !forceRefresh &&
    newReleasesCache.tracks.length > 0 &&
    newReleasesCache.year === CURRENT_YEAR &&
    Date.now() - newReleasesCache.ts < 30 * 60 * 1000
  ) {
    return {
      updatedAt: new Date(newReleasesCache.ts).toISOString(),
      year: CURRENT_YEAR,
      tracks: newReleasesCache.tracks,
    };
  }

  const queries = [
    `lancamentos musicas novas brasil ${CURRENT_YEAR} clipe oficial sertanejo funk trap`,
    `new music releases ${CURRENT_YEAR} official audio pop hip hop phonk`,
    `The Weeknd Bruno Mars Sabrina Carpenter Ana Castela Matue ${CURRENT_YEAR} oficial`,
  ];

  const batches = await Promise.all([
    ...queries.map((q) => searchYouTubeMusic(q, 12)),
    searchAudiusFull(`phonk ${CURRENT_YEAR}`, 6),
  ]);

  const seen = new Set();
  const merged = [];
  for (const list of batches) {
    for (const t of list) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        merged.push({
          ...t,
          number: merged.length + 1,
          sourceLabel: `Novo ${CURRENT_YEAR}`,
        });
      }
    }
  }

  newReleasesCache = { ts: Date.now(), tracks: merged, year: CURRENT_YEAR };
  return {
    updatedAt: new Date(newReleasesCache.ts).toISOString(),
    year: CURRENT_YEAR,
    tracks: merged,
  };
}

const bgAudioCache = new Map();

export async function resolveBackgroundAudioStream(rawTitle = '', rawArtist = '') {
  const cleanTitle = String(rawTitle || '')
    .replace(/\[.*?\]|\(.*?\)/g, ' ')
    .replace(/official\s*(music\s*)?video|clipe\s*oficial|ao\s*vivo|lyrics?|hd|4k|audio/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanArtist = String(rawArtist || '').replace(/ - Topic$/i, '').trim();
  const query = [cleanArtist, cleanTitle].filter(Boolean).join(' ').trim();
  if (!query) return { audioUrl: '', title: '', artist: '' };

  const key = query.toLowerCase();
  const cached = bgAudioCache.get(key);
  if (cached && Date.now() - cached.ts < 30 * 60 * 1000) return cached.data;

  try {
    const audius = await searchAudiusFull(query, 4);
    const best = audius.find((t) => t.audioUrl);
    if (best) {
      const data = { audioUrl: best.audioUrl, title: best.title, artist: best.artist, source: 'audius' };
      bgAudioCache.set(key, { ts: Date.now(), data });
      return data;
    }
  } catch {
    // ignore
  }

  try {
    const r = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=3&country=BR`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4500) }
    );
    if (r.ok) {
      const j = await r.json();
      const hit = (j.results || []).find((x) => x.previewUrl);
      if (hit?.previewUrl) {
        const data = {
          audioUrl: hit.previewUrl,
          title: hit.trackName || cleanTitle,
          artist: hit.artistName || cleanArtist,
          source: 'itunes',
        };
        bgAudioCache.set(key, { ts: Date.now(), data });
        return data;
      }
    }
  } catch {
    // ignore
  }

  return { audioUrl: '', title: cleanTitle, artist: cleanArtist };
}

let sunoDiscoverCache = { ts: 0, data: null };

export async function getSunoDiscoverHub(forceRefresh = false) {
  if (!forceRefresh && sunoDiscoverCache.data && Date.now() - sunoDiscoverCache.ts < 20 * 60 * 1000) {
    return sunoDiscoverCache.data;
  }
  try {
    const r = await fetch('https://studio-api.prod.suno.com/api/discover/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA,
      },
      body: JSON.stringify({ page: 0, page_size: 25 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();

    const rawClips = [];
    const seenClipIds = new Set();
    for (const sec of j.sections || []) {
      const items = Array.isArray(sec.items) ? sec.items : [];
      for (const it of items) {
        const clip = it?.clip || it;
        if (!clip?.id || !clip?.title || seenClipIds.has(clip.id)) continue;
        if (!clip.display_name && !clip.handle) continue;
        seenClipIds.add(clip.id);
        rawClips.push(clip);
      }
      if (Array.isArray(sec.items)) {
        for (const pl of sec.items) {
          for (const pc of pl?.playlist_clips || []) {
            const clip = pc?.clip;
            if (!clip?.id || !clip?.title || seenClipIds.has(clip.id)) continue;
            seenClipIds.add(clip.id);
            rawClips.push(clip);
          }
        }
      }
    }

    const tracks = [];
    const artistMap = new Map();

    for (const clip of rawClips) {
      const id = String(clip.id);
      const artistName = String(clip.display_name || clip.handle || 'Suno AI Artist').trim();
      const handle = String(clip.handle || '').trim();
      const avatarUrl = String(clip.avatar_image_url || clip.image_url || '/covers/icon-512.png');
      const coverUrl = String(clip.image_large_url || clip.image_url || '/covers/icon-512.png');
      const audioUrl = `https://cdn1.suno.ai/${id}.mp4`;
      const plays = Number(clip.play_count || 0);
      const likes = Number(clip.upvote_count || 0);
      const tags = String(clip.display_tags || clip.metadata?.tags || 'AI Music · Suno').slice(0, 45);
      const dur = Math.round(Number(clip.metadata?.duration || 180));

      const trackObj = {
        id: `suno-ai-${id}`,
        number: tracks.length + 1,
        title: String(clip.title).slice(0, 90),
        emoji: '🤖',
        artist: artistName,
        album: handle ? `@${handle} · Suno IA` : 'Suno IA Mundial',
        genre: tags || 'AI Music',
        bpm: 130,
        key: 'Am',
        coverUrl,
        audioUrl,
        durationSec: dur > 10 ? dur : 180,
        plays,
        likes,
        source: 'world_full',
        sourceLabel: 'Suno IA',
        externalUrl: `https://suno.com/song/${id}`,
      };
      tracks.push(trackObj);

      const artKey = (handle || artistName).toLowerCase();
      const existing = artistMap.get(artKey);
      if (existing) {
        existing.playsCount += plays + likes * 3;
        if (existing.tracks.length < 8) existing.tracks.push(trackObj);
      } else {
        artistMap.set(artKey, {
          id: `suno-artist-${artKey}`,
          name: artistName,
          handle,
          avatarUrl,
          genre: tags || 'Criador IA',
          playsCount: plays + likes * 3,
          profileUrl: handle ? `https://suno.com/@${handle}` : 'https://suno.com',
          tracks: [trackObj],
        });
      }
    }

    const artists = [...artistMap.values()]
      .sort((a, b) => b.playsCount - a.playsCount)
      .slice(0, 32);

    const payload = {
      updatedAt: new Date().toISOString(),
      artists,
      tracks: tracks.slice(0, 60),
    };
    sunoDiscoverCache = { ts: Date.now(), data: payload };
    return payload;
  } catch {
    return sunoDiscoverCache.data || { updatedAt: new Date().toISOString(), artists: [], tracks: [] };
  }
}

export const OFFLINE_GENRE_FOLDERS = [
  {
    id: 'phonk',
    title: 'Phonk & Drift Automotivo',
    emoji: '⚡',
    description: 'Graves pesados e cowbells pra viagem de carro sem internet',
    audiusGenres: ['Electronic'],
    queries: ['phonk', 'brazilian phonk', 'drift phonk', 'cosmic phonk', 'kordhell'],
    mediaKind: 'audio',
    accent: 'from-pink-500 to-purple-600',
  },
  {
    id: 'funk_brasil',
    title: 'Funk, Dance & Pancadão',
    emoji: '🇧🇷',
    description: 'Batidão brasileiro, baile funk e dance pra animar a estrada',
    audiusGenres: ['Dance & EDM'],
    queries: ['baile funk', 'brazilian funk', 'funk brasil', 'mandelao', 'brazil dance'],
    mediaKind: 'audio',
    accent: 'from-emerald-400 to-cyan-500',
  },
  {
    id: 'electronic',
    title: 'Eletrônica, House & Bass',
    emoji: '🎧',
    description: 'Sets eletrônicos, bass house, techno e EDM completos offline',
    audiusGenres: ['Electronic', 'House', 'Techno', 'Dance & EDM'],
    queries: ['house music', 'bass house', 'techno', 'progressive house', 'edm'],
    mediaKind: 'audio',
    accent: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'hiphop_trap',
    title: 'Trap, Rap & Hip-Hop',
    emoji: '🔥',
    description: 'Beats de trap, hip-hop e rap mundial sem depender de 4G',
    audiusGenres: ['Hip-Hop/Rap', 'Trap'],
    queries: ['trap beat', 'hip hop', 'rap', 'boom bap', 'drill'],
    mediaKind: 'audio',
    accent: 'from-orange-400 to-rose-600',
  },
  {
    id: 'sertanejo_country',
    title: 'Sertanejo, Country & Estrada',
    emoji: '🤠',
    description: 'Viola, country, acústico e modão perfeito pra rodovia',
    audiusGenres: ['Country', 'Folk', 'Acoustic'],
    queries: ['sertanejo', 'country road', 'acoustic guitar', 'folk', 'viola'],
    mediaKind: 'audio',
    accent: 'from-amber-400 to-orange-600',
  },
  {
    id: 'rock_classics',
    title: 'Rock, Metal & Clássicos',
    emoji: '🎸',
    description: 'Guitarras pesadas, rock clássico e alternativo offline',
    audiusGenres: ['Rock', 'Metal', 'Alternative'],
    queries: ['rock', 'metal', 'hard rock', 'indie rock', 'punk'],
    mediaKind: 'audio',
    accent: 'from-rose-500 to-red-700',
  },
  {
    id: 'lofi_chill',
    title: 'Lo-Fi, Synthwave & Noite',
    emoji: '🌙',
    description: 'Vibe relaxante, synthwave espacial e lo-fi pra dirigir à noite',
    audiusGenres: ['Lo-Fi', 'Ambient', 'Deep House'],
    queries: ['lofi chill', 'synthwave', 'retrowave', 'night drive', 'ambient'],
    mediaKind: 'audio',
    accent: 'from-indigo-400 to-violet-600',
  },
  {
    id: 'gospel_peace',
    title: 'Gospel, Louvor & Paz',
    emoji: '🙏',
    description: 'Louvores, instrumental de paz e adoração pra toda a família',
    audiusGenres: ['Devotional', 'Classical', 'Ambient'],
    queries: ['gospel', 'worship', 'christian', 'louvor', 'peaceful piano'],
    mediaKind: 'audio',
    accent: 'from-sky-400 to-teal-500',
  },
  {
    id: 'suno_ai',
    title: 'Músicas IA (Suno Mundial)',
    emoji: '🤖',
    description: 'Faixas futuristas geradas por IA prontas pra salvar offline',
    audiusGenres: ['Experimental', 'Electronic'],
    queries: ['ai music', 'future bass', 'cyberpunk', 'cyber'],
    mediaKind: 'audio',
    accent: 'from-fuchsia-500 to-cyan-400',
  },
  {
    id: 'videos_offline',
    title: 'Vídeos & Clipes Offline (MP4)',
    emoji: '🎬',
    description: 'Clipes musicais e animações em MP4 pra assistir sem internet na viagem',
    audiusGenres: [],
    queries: ['animation', 'music video', 'synthwave', 'cartoon', 'space'],
    mediaKind: 'video',
    accent: 'from-rose-500 to-amber-500',
  },
];

const offlinePackCache = new Map();

async function fetchAudiusTrendingBatch(genre, limit = 100, offset = 0) {
  try {
    const url = genre
      ? `https://discoveryprovider.audius.co/v1/tracks/trending?genre=${encodeURIComponent(genre)}&limit=${limit}&offset=${offset}&app_name=LENKYX`
      : `https://discoveryprovider.audius.co/v1/tracks/trending?limit=${limit}&offset=${offset}&app_name=LENKYX`;
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(7000) });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.data || [])
      .filter((item) => item?.id && item?.title)
      .map((item) => ({
        id: `audius-${item.id}`,
        number: 0,
        title: String(item.title).slice(0, 90),
        emoji: '🎧',
        artist: String(item.user?.name || 'Artista Independente').slice(0, 50),
        album: item.genre || 'Viagem Offline',
        genre: item.genre || 'Music',
        bpm: 128,
        key: 'Am',
        coverUrl: item.artwork?.['480x480'] || item.artwork?.['150x150'] || '/covers/album-official.jpg',
        audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${item.id}/stream?app_name=LENKYX`,
        durationSec: Number(item.duration) || 190,
        plays: Number(item.play_count) || 0,
        likes: Number(item.favorite_count) || 0,
        source: 'world_full',
        sourceLabel: 'Offline HD',
      }));
  } catch {
    return [];
  }
}

async function fetchArchiveMp4Videos(limit = 60) {
  try {
    const q = 'mediatype:movies AND format:"MPEG4" AND (animation OR synthwave OR concert OR cartoon OR cosmic)';
    const r = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator&rows=${Math.min(100, limit)}&output=json`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(7000) }
    );
    if (!r.ok) return [];
    const j = await r.json();
    const docs = j.response?.docs || [];
    const out = [];
    for (let i = 0; i < Math.min(docs.length, 30); i += 6) {
      const chunk = docs.slice(i, i + 6);
      const resolved = await Promise.all(
        chunk.map(async (doc) => {
          try {
            const mr = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`, {
              headers: { 'User-Agent': UA },
              signal: AbortSignal.timeout(4500),
            });
            if (!mr.ok) return null;
            const mj = await mr.json();
            const mp4 = (mj.result || []).find(
              (f) => f.name && f.name.toLowerCase().endsWith('.mp4') && Number(f.size || 0) < 45 * 1024 * 1024
            );
            if (!mp4) return null;
            return {
              id: `vid-arc-${doc.identifier}`,
              title: String(doc.title || doc.identifier).slice(0, 85),
              artist: String(Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || 'Arquivo Cinema').slice(0, 45),
              genre: 'Vídeo MP4 Offline',
              coverUrl: `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`,
              videoUrl: `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(mp4.name)}`,
              mediaKind: 'video',
              durationSec: 180,
            };
          } catch {
            return null;
          }
        })
      );
      out.push(...resolved.filter(Boolean));
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

export async function getOfflineGenrePack(genreId = 'phonk', requestedLimit = 100, localCatalogTracks = []) {
  const folder = OFFLINE_GENRE_FOLDERS.find((f) => f.id === genreId) || OFFLINE_GENRE_FOLDERS[0];
  const targetLimit = Math.max(20, Math.min(500, Number(requestedLimit) || 100));
  const cacheKey = `${folder.id}:${targetLimit}`;
  const cached = offlinePackCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
    return cached.data;
  }

  const seen = new Set();
  const items = [];
  const pushUnique = (list, mediaKind = folder.mediaKind) => {
    for (const it of list || []) {
      if (!it?.id || seen.has(it.id)) continue;
      const mediaUrl = mediaKind === 'video' ? it.videoUrl || it.audioUrl : it.audioUrl;
      if (!mediaUrl) continue;
      seen.add(it.id);
      items.push({
        ...it,
        number: items.length + 1,
        mediaKind,
        videoUrl: mediaKind === 'video' ? mediaUrl : undefined,
      });
      if (items.length >= targetLimit) break;
    }
  };

  if (folder.mediaKind === 'video') {
    const [sunoHub, archiveVids] = await Promise.all([
      getSunoDiscoverHub(false),
      fetchArchiveMp4Videos(Math.min(80, targetLimit)),
    ]);
    pushUnique(archiveVids, 'video');
    pushUnique(
      (sunoHub.tracks || []).map((t) => ({
        ...t,
        id: `vid-${t.id}`,
        videoUrl: t.audioUrl,
        mediaKind: 'video',
      })),
      'video'
    );
    pushUnique(
      (localCatalogTracks || []).map((t) => ({
        ...t,
        id: `vid-${t.id}`,
        videoUrl: t.audioUrl,
        mediaKind: 'video',
      })),
      'video'
    );
  } else {
    if (folder.id === 'phonk' || folder.id === 'suno_ai') {
      pushUnique(localCatalogTracks, 'audio');
      const sunoHub = await getSunoDiscoverHub(false);
      pushUnique(sunoHub.tracks || [], 'audio');
    }

    // Parallel search queries + paginated genre trending up to 500
    const queryBatches = await Promise.all(folder.queries.map((q) => searchAudiusFull(q, 50)));
    for (const batch of queryBatches) pushUnique(batch, 'audio');

    let offset = 0;
    while (items.length < targetLimit && offset <= 400) {
      const genresToFetch = folder.audiusGenres.length ? folder.audiusGenres : [''];
      const batches = await Promise.all(
        genresToFetch.map((g) => fetchAudiusTrendingBatch(g, 100, offset))
      );
      let addedAny = false;
      for (const b of batches) {
        if (b.length > 0) addedAny = true;
        pushUnique(b, 'audio');
      }
      if (!addedAny) break;
      offset += 100;
    }

    // If still below targetLimit, fill with general Audius trending pages
    let extraOffset = 0;
    while (items.length < targetLimit && extraOffset <= 300) {
      const extra = await fetchAudiusTrendingBatch('', 100, extraOffset);
      if (extra.length === 0) break;
      pushUnique(extra, 'audio');
      extraOffset += 100;
    }
  }

  const payload = {
    folder,
    totalAvailable: items.length,
    maxSupported: 500,
    updatedAt: new Date().toISOString(),
    items: items.slice(0, targetLimit),
  };
  offlinePackCache.set(cacheKey, { ts: Date.now(), data: payload });
  return payload;
}





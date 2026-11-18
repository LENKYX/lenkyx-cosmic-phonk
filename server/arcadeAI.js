import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const WORLD_FILE = path.join(DATA_DIR, 'cosmic-world.json');

const directoryCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 min cache for external APIs
const livePlayers = new Map(); // Online co-op presence in Nova Aetheris

export const GALAXY_WEAPONS = [
  {
    id: 'solar_blaster',
    name: 'Blaster Solar Mk-I',
    rarity: 'Inicial',
    costShards: 0,
    damage: 22,
    cooldownMs: 210,
    color: '#22d3ee',
    description: 'Tiros rápidos de plasma ciano ideais para explorar o Vale Neon.',
  },
  {
    id: 'phonk_sonic',
    name: 'Canhão Sônico Phonk',
    rarity: 'Raro',
    costShards: 120,
    damage: 38,
    cooldownMs: 360,
    color: '#ec4899',
    description: 'Dispara ondas graves expansivas que atingem vários inimigos juntos.',
  },
  {
    id: 'antimatter_rail',
    name: 'Rifle de Antimatéria',
    rarity: 'Épico',
    costShards: 280,
    damage: 65,
    cooldownMs: 420,
    color: '#a855f7',
    description: 'Feixe perfurante de alta velocidade capaz de atravessar blindagens.',
  },
  {
    id: 'supernova_tri',
    name: 'Lança-Supernova Tri-Laser',
    rarity: 'Lendário',
    costShards: 520,
    damage: 42,
    cooldownMs: 250,
    color: '#f59e0b',
    description: 'Dispara 3 projéteis estelares simultâneos em leque super veloz.',
  },
  {
    id: 'blackhole_scepter',
    name: 'Cetro do Buraco Negro',
    rarity: 'Mítico',
    costShards: 900,
    damage: 110,
    cooldownMs: 560,
    color: '#f43f5e',
    description: 'Cria um vórtice gravitacional giratório que explode em energia cósmica.',
  },
];

export const COLLECTOR_RELICS = [
  { id: 'ether_crystal', name: 'Cristal de Éter Puro', rarity: 'Comum', emoji: '💎', biome: 'Vale Neon', value: 40 },
  { id: 'stardust_compass', name: 'Bússola Estelar Antiga', rarity: 'Comum', emoji: '🧭', biome: 'Vale Neon', value: 55 },
  { id: 'phonk_core', name: 'Núcleo de Phonk Cósmico', rarity: 'Raro', emoji: '🔊', biome: 'Deserto Plasma', value: 110 },
  { id: 'solar_prism', name: 'Prisma dos Sóis Gêmeos', rarity: 'Raro', emoji: '🌞', biome: 'Deserto Plasma', value: 135 },
  { id: 'lost_spaceship_key', name: 'Chave da Nave Perdida', rarity: 'Épico', emoji: '🚀', biome: 'Abismo Negro', value: 240 },
  { id: 'event_horizon_shard', name: 'Fragmento Horizonte de Eventos', rarity: 'Épico', emoji: '🌀', biome: 'Abismo Negro', value: 290 },
  { id: 'quantum_katana', name: 'Katana Quântica Holográfica', rarity: 'Lendário', emoji: '⚔️', biome: 'Cidadela LENKYX', value: 480 },
  { id: 'golden_vinyl', name: 'Disco Dourado LENKYX 3026', rarity: 'Lendário', emoji: '💿', biome: 'Cidadela LENKYX', value: 550 },
  { id: 'supernova_crown', name: 'Coroa da Supernova Eterna', rarity: 'Mítico', emoji: '👑', biome: 'Chefão Galáctico', value: 950 },
  { id: 'void_phoenix', name: 'Orbe da Fênix Cósmica', rarity: 'Mítico', emoji: '🔥', biome: 'Chefão Galáctico', value: 1200 },
];

export const WORLD_QUESTS = [
  {
    id: 'q_discover_biomes',
    title: 'Desbravador do Novo Mundo',
    description: 'Atravesse os portais e visite os 4 biomas do planeta Nova Aetheris.',
    target: 4,
    rewardShards: 180,
    rewardXp: 250,
    rewardBadge: '🌍 Desbravador de Mundos',
  },
  {
    id: 'q_defeat_enemies',
    title: 'Guardião da Fronteira Galáctica',
    description: 'Derrote 15 sentinelas, drones ou criaturas hostis no planeta.',
    target: 15,
    rewardShards: 220,
    rewardXp: 320,
    rewardBadge: '⚡ Caçador Estelar',
  },
  {
    id: 'q_open_chests',
    title: 'Caçador de Relíquias Raras',
    description: 'Abra 5 Cápsulas Cósmicas espalhadas pelo novo mundo.',
    target: 5,
    rewardShards: 260,
    rewardXp: 350,
    rewardBadge: '🎁 Colecionador Galáctico',
  },
  {
    id: 'q_defeat_boss',
    title: 'Queda do Titã do Buraco Negro',
    description: 'Derrote 1 Chefão Mundial de Setor sozinho ou com aliados online.',
    target: 1,
    rewardShards: 450,
    rewardXp: 600,
    rewardBadge: '👑 Lenda de Nova Aetheris',
  },
];

function readWorldStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(WORLD_FILE)) {
      const seed = {
        explorers: {},
        discoveries: [
          {
            id: 'disc-seed-1',
            playerName: 'LENKYX Comandante',
            message: 'descobriu o portal para Nova Aetheris & equipou o Cetro do Buraco Negro!',
            rarity: 'Mítico',
            createdAt: new Date().toISOString(),
          },
        ],
        sectorChat: [
          {
            id: 'sc-1',
            playerName: 'LENKYX Comandante',
            message: '🌌 Bem-vindos a Nova Aetheris! Explorem os portais, abram cápsulas e juntem-se contra os chefões!',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      fs.writeFileSync(WORLD_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const parsed = JSON.parse(fs.readFileSync(WORLD_FILE, 'utf-8'));
    parsed.explorers = parsed.explorers || {};
    parsed.discoveries = Array.isArray(parsed.discoveries) ? parsed.discoveries : [];
    parsed.sectorChat = Array.isArray(parsed.sectorChat) ? parsed.sectorChat : [];
    return parsed;
  } catch {
    return { explorers: {}, discoveries: [], sectorChat: [] };
  }
}

function writeWorldStore(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${WORLD_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, WORLD_FILE);
}

function ensureExplorer(store, playerId, playerName) {
  const id = String(playerId || '').trim().slice(0, 64) || 'guest-explorer';
  const name = String(playerName || 'Viajante Cósmico').trim().slice(0, 40) || 'Viajante Cósmico';
  if (!store.explorers[id]) {
    store.explorers[id] = {
      playerId: id,
      playerName: name,
      level: 1,
      xp: 0,
      shards: 100,
      unlockedWeapons: ['solar_blaster'],
      equippedWeapon: 'solar_blaster',
      relics: [], // [{ id, count, firstFoundAt }]
      badges: ['🚀 Explorador Recém-Chegado'],
      stats: {
        enemiesDefeated: 0,
        chestsOpened: 0,
        bossesDefeated: 0,
        biomesVisited: ['vale_neon'],
      },
      claimedQuests: [],
      updatedAt: new Date().toISOString(),
    };
  } else if (playerName) {
    store.explorers[id].playerName = name;
  }
  return store.explorers[id];
}

function applyLevelFromXp(explorer) {
  let lvl = 1;
  let needed = 150;
  let remaining = explorer.xp || 0;
  while (remaining >= needed && lvl < 99) {
    remaining -= needed;
    lvl++;
    needed = Math.round(needed * 1.25);
  }
  explorer.level = lvl;
}

export function getWorldBootstrap(playerId, playerName) {
  const store = readWorldStore();
  const explorer = ensureExplorer(store, playerId, playerName);
  writeWorldStore(store);

  const leaderboard = Object.values(store.explorers)
    .sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp))
    .slice(0, 10)
    .map((e) => ({
      playerId: e.playerId,
      playerName: e.playerName,
      level: e.level,
      xp: e.xp,
      relicCount: (e.relics || []).length,
      weaponCount: (e.unlockedWeapons || []).length,
    }));

  return {
    explorer,
    weapons: GALAXY_WEAPONS,
    relicCatalog: COLLECTOR_RELICS,
    quests: WORLD_QUESTS,
    leaderboard,
    discoveries: store.discoveries.slice(0, 15),
    sectorChat: store.sectorChat.slice(-25),
  };
}

export function syncWorldPresence({
  playerId,
  playerName,
  avatarColor,
  biomeId,
  x,
  y,
  weaponId,
  level,
}) {
  const now = Date.now();
  const cleanId = String(playerId || '').trim().slice(0, 64);
  if (cleanId) {
    livePlayers.set(cleanId, {
      playerId: cleanId,
      playerName: String(playerName || 'Explorador').slice(0, 32),
      avatarColor: String(avatarColor || 'from-cyan-400 to-pink-500'),
      biomeId: String(biomeId || 'vale_neon'),
      x: Number(x) || 400,
      y: Number(y) || 300,
      weaponId: String(weaponId || 'solar_blaster'),
      level: Number(level) || 1,
      lastSeen: now,
    });
  }

  // Prune stale explorers (> 20s inactive)
  for (const [key, val] of livePlayers.entries()) {
    if (now - val.lastSeen > 20000) livePlayers.delete(key);
  }

  const store = readWorldStore();
  const peers = Array.from(livePlayers.values()).filter((p) => p.playerId !== cleanId);
  return {
    onlineCount: livePlayers.size,
    peers: peers.slice(0, 24),
    discoveries: store.discoveries.slice(0, 12),
    sectorChat: store.sectorChat.slice(-20),
  };
}

export function postWorldProgress({
  playerId,
  playerName,
  shardsDelta = 0,
  xpDelta = 0,
  enemiesDelta = 0,
  chestsDelta = 0,
  bossesDelta = 0,
  biomeVisited = '',
  equipWeaponId = '',
  unlockWeaponId = '',
  claimQuestId = '',
  rollRareDrop = false,
  dropRarityBoost = 0,
}) {
  const store = readWorldStore();
  const exp = ensureExplorer(store, playerId, playerName);

  exp.shards = Math.max(0, (exp.shards || 0) + Math.min(2000, Math.max(-2000, Number(shardsDelta) || 0)));
  exp.xp = Math.max(0, (exp.xp || 0) + Math.min(3000, Math.max(0, Number(xpDelta) || 0)));
  applyLevelFromXp(exp);

  exp.stats.enemiesDefeated = (exp.stats.enemiesDefeated || 0) + Math.max(0, Number(enemiesDelta) || 0);
  exp.stats.chestsOpened = (exp.stats.chestsOpened || 0) + Math.max(0, Number(chestsDelta) || 0);
  exp.stats.bossesDefeated = (exp.stats.bossesDefeated || 0) + Math.max(0, Number(bossesDelta) || 0);

  if (biomeVisited && !exp.stats.biomesVisited.includes(biomeVisited)) {
    exp.stats.biomesVisited.push(biomeVisited);
  }

  if (unlockWeaponId) {
    const w = GALAXY_WEAPONS.find((item) => item.id === unlockWeaponId);
    if (!w) throw new Error('Arma galáctica não encontrada.');
    if (!exp.unlockedWeapons.includes(w.id)) {
      if (exp.shards < w.costShards) {
        throw new Error(`Faltam Fragmentos Cósmicos! Precisa de ${w.costShards}, você tem ${exp.shards}.`);
      }
      exp.shards -= w.costShards;
      exp.unlockedWeapons.push(w.id);
      exp.equippedWeapon = w.id;
      store.discoveries.unshift({
        id: `disc-${Date.now().toString(36)}`,
        playerName: exp.playerName,
        message: `desbloqueou a arma galáctica ${w.name} (${w.rarity})!`,
        rarity: w.rarity,
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (equipWeaponId && exp.unlockedWeapons.includes(equipWeaponId)) {
    exp.equippedWeapon = equipWeaponId;
  }

  if (claimQuestId && !exp.claimedQuests.includes(claimQuestId)) {
    const q = WORLD_QUESTS.find((item) => item.id === claimQuestId);
    if (q) {
      let progress = 0;
      if (q.id === 'q_discover_biomes') progress = exp.stats.biomesVisited.length;
      if (q.id === 'q_defeat_enemies') progress = exp.stats.enemiesDefeated;
      if (q.id === 'q_open_chests') progress = exp.stats.chestsOpened;
      if (q.id === 'q_defeat_boss') progress = exp.stats.bossesDefeated;
      if (progress < q.target) throw new Error(`Missão incompleta (${progress}/${q.target}).`);
      exp.claimedQuests.push(q.id);
      exp.shards += q.rewardShards;
      exp.xp += q.rewardXp;
      applyLevelFromXp(exp);
      if (q.rewardBadge && !exp.badges.includes(q.rewardBadge)) {
        exp.badges.push(q.rewardBadge);
      }
      store.discoveries.unshift({
        id: `disc-${Date.now().toString(36)}`,
        playerName: exp.playerName,
        message: `completou a missão "${q.title}" e ganhou ${q.rewardBadge}!`,
        rarity: 'Lendário',
        createdAt: new Date().toISOString(),
      });
    }
  }

  let droppedRelic = null;
  if (rollRareDrop) {
    const roll = crypto.randomInt(0, 100) + Math.min(40, Number(dropRarityBoost) || 0);
    let pool = COLLECTOR_RELICS.filter((r) => r.rarity === 'Comum');
    if (roll >= 95) pool = COLLECTOR_RELICS.filter((r) => r.rarity === 'Mítico');
    else if (roll >= 82) pool = COLLECTOR_RELICS.filter((r) => r.rarity === 'Lendário');
    else if (roll >= 62) pool = COLLECTOR_RELICS.filter((r) => r.rarity === 'Épico');
    else if (roll >= 35) pool = COLLECTOR_RELICS.filter((r) => r.rarity === 'Raro');

    const picked = pool[crypto.randomInt(0, pool.length)] || COLLECTOR_RELICS[0];
    droppedRelic = picked;
    const existingRelic = exp.relics.find((r) => r.id === picked.id);
    if (existingRelic) existingRelic.count += 1;
    else exp.relics.push({ id: picked.id, count: 1, firstFoundAt: new Date().toISOString() });

    if (['Épico', 'Lendário', 'Mítico'].includes(picked.rarity)) {
      store.discoveries.unshift({
        id: `disc-${Date.now().toString(36)}`,
        playerName: exp.playerName,
        message: `encontrou item raro ${picked.emoji} ${picked.name} (${picked.rarity})!`,
        rarity: picked.rarity,
        createdAt: new Date().toISOString(),
      });
    }
  }

  exp.updatedAt = new Date().toISOString();
  store.discoveries = store.discoveries.slice(0, 30);
  writeWorldStore(store);

  return {
    explorer: exp,
    droppedRelic,
    discoveries: store.discoveries.slice(0, 12),
  };
}

export function postSectorChat({ playerName, message }) {
  const cleanMsg = String(message || '').trim().slice(0, 180);
  if (!cleanMsg) throw new Error('Mensagem vazia.');
  const store = readWorldStore();
  const entry = {
    id: `sc-${Date.now().toString(36)}`,
    playerName: String(playerName || 'Explorador').trim().slice(0, 32) || 'Explorador',
    message: cleanMsg,
    createdAt: new Date().toISOString(),
  };
  store.sectorChat.push(entry);
  store.sectorChat = store.sectorChat.slice(-40);
  writeWorldStore(store);
  return { entry, sectorChat: store.sectorChat.slice(-20) };
}

// === ALL-GENERATIONS FREE ARCADE & VIDEO GAME SEARCH (INTERNET ARCHIVE + FREETOGAME) ===
async function fetchJsonSafe(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'LENKYX-Cosmic-Arcade/1.0' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function mapArchiveDoc(doc, categoryLabel, generationLabel) {
  const id = String(doc.identifier || '').trim();
  if (!id) return null;
  return {
    id: `ia-${id}`,
    identifier: id,
    title: String(doc.title || id).slice(0, 110),
    developer: String(doc.creator || 'Clássico Arcade').slice(0, 60),
    year: String(doc.year || 'Clássico'),
    genre: categoryLabel,
    generation: generationLabel,
    platform: generationLabel,
    thumbnailUrl: `https://archive.org/services/img/${encodeURIComponent(id)}`,
    embedUrl: `https://archive.org/embed/${encodeURIComponent(id)}`,
    externalUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
    downloads: Number(doc.downloads || 0),
    isFree: true,
    playableInline: true,
    source: 'Internet Archive',
  };
}

async function fetchArchiveCollection(collection, categoryLabel, generationLabel, query = '', rows = 24) {
  const cleanQ = String(query || '').trim().replace(/[^\w\s-]/g, ' ');
  const qExpr = cleanQ
    ? `collection:(${collection}) AND mediatype:software AND (${cleanQ})`
    : `collection:(${collection}) AND mediatype:software`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
    qExpr
  )}&fl[]=identifier,title,creator,year,downloads&sort[]=downloads+desc&rows=${rows}&output=json`;
  const json = await fetchJsonSafe(url, 6500);
  const docs = json?.response?.docs || [];
  return docs.map((d) => mapArchiveDoc(d, categoryLabel, generationLabel)).filter(Boolean);
}

async function fetchFreeToGameList() {
  const cached = directoryCache.get('freetogame_all');
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
  const list = await fetchJsonSafe('https://www.freetogame.com/api/games', 6500);
  const mapped = Array.isArray(list)
    ? list.map((g) => ({
        id: `ftg-${g.id}`,
        title: String(g.title || ''),
        developer: String(g.developer || g.publisher || 'Estúdio Oficial'),
        year: String(g.release_date || 'Moderno').slice(0, 4),
        genre: String(g.genre || 'Free-to-Play'),
        generation: g.platform === 'Web Browser' ? 'Browser Moderno (Grátis)' : 'PC / Online Moderno (Grátis)',
        platform: String(g.platform || 'PC / Browser'),
        description: String(g.short_description || ''),
        thumbnailUrl: String(g.thumbnail || ''),
        embedUrl: '',
        externalUrl: String(g.game_url || g.freetogame_profile_url || ''),
        downloads: 0,
        isFree: true,
        playableInline: false,
        source: 'FreeToGame Oficial',
      }))
    : [];
  if (mapped.length > 0) directoryCache.set('freetogame_all', { ts: Date.now(), data: mapped });
  return mapped;
}

export async function getArcadeDirectory() {
  const cached = directoryCache.get('arcade_directory');
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const [fliperama, consoles, msdos, modern] = await Promise.all([
    fetchArchiveCollection('internetarcade', 'Fliperama / Arcade', 'Fliperama Clássico (1978–2000)', '', 28),
    fetchArchiveCollection('consolelivingroom', 'Console Retrô', 'Consoles Clássicos (Atari, NES, PS1, Mega)', '', 24),
    fetchArchiveCollection('softwarelibrary_msdos_games', 'MS-DOS / PC Retrô', 'PC Retrô MS-DOS (1985–1999)', '', 24),
    fetchFreeToGameList(),
  ]);

  const browserModern = modern.filter((g) => g.platform.includes('Web Browser')).slice(0, 24);
  const pcModern = modern.filter((g) => !g.platform.includes('Web Browser')).slice(0, 24);

  const payload = {
    updatedAt: new Date().toISOString(),
    totalIndexedEstimate: '36.000+ jogos gratuitos de todas as gerações',
    categories: [
      {
        id: 'arcade_classics',
        title: '🕹️ Fliperamas Clássicos (Internet Arcade — Jogue no Navegador)',
        subtitle: 'Máquinas reais de fliperama dos anos 70, 80 e 90 em emulador oficial 100% grátis',
        items: fliperama,
      },
      {
        id: 'retro_consoles',
        title: '📺 Consoles de Todas as Gerações (Console Living Room)',
        subtitle: 'Atari, Coleco, consoles 8/16/32-bit preservados legalmente em nuvem',
        items: consoles,
      },
      {
        id: 'msdos_pc',
        title: '💾 Clássicos PC & MS-DOS Retrô',
        subtitle: 'Jogos lendários de computador direto na tela sem instalar nada',
        items: msdos,
      },
      {
        id: 'modern_browser',
        title: '🌐 Jogos Online de Navegador (100% Free-to-Play)',
        subtitle: 'MMOs, Estratégia, RPG e Ação gratuitos para jogar direto no browser',
        items: browserModern,
      },
      {
        id: 'modern_pc',
        title: '🚀 Free-to-Play Modernos (PC / Multiplayer / E-Sports)',
        subtitle: 'Shooters, Battle Royale, Corrida, RPGs e Simuladores oficiais gratuitos',
        items: pcModern,
      },
    ],
  };

  directoryCache.set('arcade_directory', { ts: Date.now(), data: payload });
  return payload;
}

export async function searchAllGenerationsGames(query = '', generation = 'all') {
  const q = String(query || '').trim();
  const tasks = [];

  if (generation === 'all' || generation === 'arcade') {
    tasks.push(fetchArchiveCollection('internetarcade', 'Fliperama / Arcade', 'Fliperama Clássico', q, 18));
  }
  if (generation === 'all' || generation === 'console') {
    tasks.push(fetchArchiveCollection('consolelivingroom', 'Console Retrô', 'Consoles Clássicos', q, 18));
  }
  if (generation === 'all' || generation === 'dos') {
    tasks.push(fetchArchiveCollection('softwarelibrary_msdos_games', 'MS-DOS / PC Retrô', 'PC Retrô MS-DOS', q, 18));
  }
  if (generation === 'all' || generation === 'modern') {
    tasks.push(
      fetchFreeToGameList().then((list) => {
        if (!q) return list.slice(0, 24);
        const low = q.toLowerCase();
        return list
          .filter(
            (g) =>
              g.title.toLowerCase().includes(low) ||
              g.genre.toLowerCase().includes(low) ||
              g.description.toLowerCase().includes(low) ||
              g.platform.toLowerCase().includes(low)
          )
          .slice(0, 24);
      })
    );
  }

  const groups = await Promise.all(tasks);
  const merged = groups.flat();
  return {
    query: q,
    generation,
    total: merged.length,
    items: merged,
  };
}

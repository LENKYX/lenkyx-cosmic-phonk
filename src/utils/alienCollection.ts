// 1,000 Unique Collectible Cosmic Alien Music Mascots — Linked to LENKYX's 1,000-Track Universe

export type MascotRarity = 'Comum' | 'Raro' | 'Épico' | 'Mítico';

export interface CosmicAlienMascot {
  id: number; // 1..1000
  code: string; // e.g. "#0042"
  name: string;
  trackTheme: string;
  rarity: MascotRarity;
  skinPrimary: string;
  skinSecondary: string;
  visorColor: string;
  auraColor: string;
  accessory: 'headphones' | 'subwoofer' | 'keytar' | 'mic' | 'turntable';
  accessoryLabel: string;
}

const PREFIXES = [
  'Astro', 'Nebula', 'Kosmok', 'Zeta', 'Orbit', 'Phonk', 'Pulsar', 'Nova', 'Quasar', 'Vortex',
  'Xeno', 'Lumen', 'Cyber', 'Hyper', 'Galax', 'Orion', 'Draco', 'Lyra', 'Bass', 'Sub',
];

const SUFFIXES = [
  'Beat', 'Wave', 'Drop', 'Echo', 'Synth', 'Flow', 'Glow', 'Spark', 'Vibe', 'Flux',
  'Core', 'Tone', 'Sync', 'Drift', 'Star', 'Rift', 'Pulse', 'Loop', 'Sound', 'Ray',
];

const TRACK_THEMES = [
  'Faixa Cósmica · Grave Espacial',
  'Faixa Cósmica · Phonk Orbital',
  'Faixa Cósmica · Batida Estelar',
  'Faixa Cósmica · Via Láctea',
  'Faixa Cósmica · Horizonte Neon',
  'Faixa Cósmica · Pulso de Saturno',
  'Faixa Cósmica · Frequência Lunar',
  'Faixa Cósmica · Energia Solar',
  'Faixa Cósmica · Nave Sub-Grave',
  'Faixa Cósmica · Galáxia Infinita',
];

const PALETTES: [string, string, string, string][] = [
  ['#34d399', '#059669', '#22d3ee', '#10b981'],
  ['#a855f7', '#6d28d9', '#f472b6', '#c084fc'],
  ['#22d3ee', '#0284c7', '#fde047', '#38bdf8'],
  ['#f472b6', '#db2777', '#67e8f9', '#ec4899'],
  ['#fbbf24', '#d97706', '#22d3ee', '#f59e0b'],
  ['#60a5fa', '#2563eb', '#f472b6', '#818cf8'],
  ['#4ade80', '#16a34a', '#fde047', '#22c55e'],
  ['#fb7185', '#e11d48', '#2dd4bf', '#f43f5e'],
];

const ACCESSORIES: { id: CosmicAlienMascot['accessory']; label: string }[] = [
  { id: 'headphones', label: 'Fone Cósmico HD' },
  { id: 'subwoofer', label: 'Subwoofer Jet' },
  { id: 'keytar', label: 'Teclado Estelar' },
  { id: 'mic', label: 'Mic Galáctico' },
  { id: 'turntable', label: 'Pick-up Orbital' },
];

export function getCosmicMascotById(rawId: number): CosmicAlienMascot {
  const id = Math.max(1, Math.min(1000, Math.floor(rawId) || 1));
  const h1 = (id * 2654435761) >>> 0;
  const h2 = (id * 1597334677) >>> 0;

  const prefix = PREFIXES[h1 % PREFIXES.length];
  const suffix = SUFFIXES[Math.floor(h1 / 23) % SUFFIXES.length];
  const palette = PALETTES[h2 % PALETTES.length];
  const acc = ACCESSORIES[Math.floor(h2 / 11) % ACCESSORIES.length];
  const trackTheme = TRACK_THEMES[id % TRACK_THEMES.length];

  const mod100 = id % 100;
  let rarity: MascotRarity = 'Comum';
  if (mod100 === 0 || id <= 10) rarity = 'Mítico';
  else if (mod100 % 10 === 7) rarity = 'Épico';
  else if (mod100 % 3 === 0) rarity = 'Raro';

  return {
    id,
    code: `#${String(id).padStart(4, '0')}`,
    name: `${prefix} ${suffix}`,
    trackTheme: `${trackTheme} #${id}`,
    rarity,
    skinPrimary: palette[0],
    skinSecondary: palette[1],
    visorColor: palette[2],
    auraColor: palette[3],
    accessory: acc.id,
    accessoryLabel: acc.label,
  };
}

const LS_OWNED_MASCOTS = 'lenkyx_owned_mascots_v1';
const LS_SUPPORTER_ID = 'lenkyx_supporter_id_v1';

export function getLocalSupporterId(): string {
  try {
    const existing = localStorage.getItem(LS_SUPPORTER_ID);
    if (existing) return existing;
    const created = 'sup-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    localStorage.setItem(LS_SUPPORTER_ID, created);
    return created;
  } catch {
    return 'sup-' + Date.now().toString(36);
  }
}

export function loadOwnedMascotIds(): number[] {
  try {
    const raw = localStorage.getItem(LS_OWNED_MASCOTS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return Array.from(new Set(arr.map((n) => Number(n)).filter((n) => n >= 1 && n <= 1000)));
  } catch {
    return [];
  }
}

export function saveOwnedMascotIds(ids: number[]): number[] {
  const clean = Array.from(new Set(ids.map((n) => Number(n)).filter((n) => n >= 1 && n <= 1000)));
  try {
    localStorage.setItem(LS_OWNED_MASCOTS, JSON.stringify(clean));
  } catch {
    // ignore
  }
  return clean;
}

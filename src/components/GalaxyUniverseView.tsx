import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  AudioWaveform,
  Bitcoin,
  Bluetooth,
  Bot,
  Car,
  Clapperboard,
  Compass,
  Crown,
  Film,
  Gamepad2,
  Globe2,
  ListMusic,
  MessageCircle,
  Music,
  Newspaper,
  PhoneCall,
  Plane,
  Plus,
  Radio,
  RefreshCw,
  Satellite,
  Search,
  Send,
  ShoppingBag,
  Skull,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from 'lucide-react';
import { AppSettings, TabId, Track } from '../types';
import { GalaxyWorldsModal, CustomIdeaPlanet, SpecialWorldKind } from './GalaxyWorldsModal';
import { GlobalVoiceCallModal, BluetoothConnectModal } from './GlobalVoiceCallModal';
import { CosmicPhonkWorldGame } from './CosmicPhonkWorldGame';

export interface GalaxyAction {
  type: 'navigate' | 'play_track' | 'visualizer';
  tab?: TabId;
  trackId?: string;
}

interface PlanetSpec {
  id: string;
  tabId?: TabId;
  specialWorld?: SpecialWorldKind;
  isFreeCity?: boolean;
  customIdea?: CustomIdeaPlanet;
  label: string;
  planetName: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  orbitTilt: number;
  radius: number;
  spinSpeed: number;
  accentHex: string;
  atmosphereHex: string;
  hasRing?: boolean;
  ringColor?: string;
  hasClouds?: boolean;
  moons: number;
  hasSatellite?: boolean;
  style: 'earth' | 'neon' | 'emerald' | 'saturn' | 'mars' | 'ice' | 'cyber' | 'amethyst' | 'arcade' | 'inferno' | 'gold';
  icon: React.ReactNode;
}

const PLANET_SPECS: PlanetSpec[] = [
  {
    id: 'catalog',
    tabId: 'catalog',
    label: 'Músicas',
    planetName: 'Terra Sonora',
    orbitRadius: 15.5,
    orbitSpeed: 0.14,
    orbitPhase: 0.35,
    orbitTilt: 0.06,
    radius: 2.35,
    spinSpeed: 0.34,
    accentHex: '#38bdf8',
    atmosphereHex: '#60a5fa',
    hasClouds: true,
    moons: 1,
    hasSatellite: true,
    style: 'earth',
    icon: <Music className="w-3.5 h-3.5" />,
  },
  {
    id: 'reels',
    tabId: 'reels',
    label: 'Vibe & Lives',
    planetName: 'Nova Pulse',
    orbitRadius: 21.5,
    orbitSpeed: 0.11,
    orbitPhase: 1.5,
    orbitTilt: -0.09,
    radius: 2.15,
    spinSpeed: 0.52,
    accentHex: '#f472b6',
    atmosphereHex: '#ec4899',
    hasRing: true,
    ringColor: '#f472b6',
    moons: 0,
    style: 'neon',
    icon: <Film className="w-3.5 h-3.5" />,
  },
  {
    id: 'explore',
    tabId: 'explore',
    label: 'Artistas & Clipes',
    planetName: 'Aethelgard',
    orbitRadius: 28,
    orbitSpeed: 0.088,
    orbitPhase: 2.75,
    orbitTilt: 0.08,
    radius: 2.45,
    spinSpeed: 0.28,
    accentHex: '#34d399',
    atmosphereHex: '#10b981',
    hasClouds: true,
    moons: 1,
    style: 'emerald',
    icon: <Globe2 className="w-3.5 h-3.5" />,
  },
  {
    id: 'movies',
    tabId: 'movies',
    label: 'Cinema & Séries',
    planetName: 'Saturnia HD',
    orbitRadius: 35.5,
    orbitSpeed: 0.068,
    orbitPhase: 3.95,
    orbitTilt: -0.06,
    radius: 2.95,
    spinSpeed: 0.25,
    accentHex: '#fbbf24',
    atmosphereHex: '#f59e0b',
    hasRing: true,
    ringColor: '#fcd34d',
    moons: 1,
    style: 'saturn',
    icon: <Clapperboard className="w-3.5 h-3.5" />,
  },
  {
    id: 'sports',
    tabId: 'sports',
    label: 'Futebol & UFC',
    planetName: 'Ares Arena',
    orbitRadius: 43,
    orbitSpeed: 0.056,
    orbitPhase: 5.1,
    orbitTilt: 0.1,
    radius: 2.25,
    spinSpeed: 0.33,
    accentHex: '#fb7185',
    atmosphereHex: '#ef4444',
    moons: 2,
    style: 'mars',
    icon: <Trophy className="w-3.5 h-3.5" />,
  },
  {
    id: 'studio',
    tabId: 'studio',
    label: 'Criar IA',
    planetName: 'Genesis Forge',
    orbitRadius: 50,
    orbitSpeed: 0.047,
    orbitPhase: 0.9,
    orbitTilt: -0.07,
    radius: 2.4,
    spinSpeed: 0.4,
    accentHex: '#22d3ee',
    atmosphereHex: '#06b6d4',
    hasRing: true,
    ringColor: '#22d3ee',
    moons: 0,
    hasSatellite: true,
    style: 'cyber',
    icon: <Wand2 className="w-3.5 h-3.5" />,
  },
  {
    id: 'offline',
    tabId: 'offline',
    label: 'Viagem & Offline',
    planetName: 'Cryo Nova',
    orbitRadius: 56.5,
    orbitSpeed: 0.04,
    orbitPhase: 2.2,
    orbitTilt: 0.05,
    radius: 2.2,
    spinSpeed: 0.24,
    accentHex: '#7dd3fc',
    atmosphereHex: '#38bdf8',
    hasRing: true,
    ringColor: '#bae6fd',
    moons: 1,
    style: 'ice',
    icon: <Plane className="w-3.5 h-3.5" />,
  },
  {
    id: 'playlists',
    tabId: 'playlists',
    label: 'Playlists',
    planetName: 'Nebula Vault',
    orbitRadius: 63,
    orbitSpeed: 0.034,
    orbitPhase: 3.45,
    orbitTilt: -0.08,
    radius: 2.1,
    spinSpeed: 0.3,
    accentHex: '#c084fc',
    atmosphereHex: '#a855f7',
    moons: 1,
    style: 'amethyst',
    icon: <ListMusic className="w-3.5 h-3.5" />,
  },
  {
    id: 'arcade',
    tabId: 'arcade',
    label: 'Jogos',
    planetName: 'Cybertron',
    orbitRadius: 69.5,
    orbitSpeed: 0.029,
    orbitPhase: 4.7,
    orbitTilt: 0.07,
    radius: 2.25,
    spinSpeed: 0.45,
    accentHex: '#a3e635',
    atmosphereHex: '#22c55e',
    hasRing: true,
    ringColor: '#84cc16',
    moons: 0,
    hasSatellite: true,
    style: 'arcade',
    icon: <Gamepad2 className="w-3.5 h-3.5" />,
  },
  {
    id: 'shopping',
    specialWorld: 'shopping',
    label: 'Compras',
    planetName: 'Mercado Prime',
    orbitRadius: 76,
    orbitSpeed: 0.025,
    orbitPhase: 0.65,
    orbitTilt: -0.05,
    radius: 2.35,
    spinSpeed: 0.36,
    accentHex: '#fb923c',
    atmosphereHex: '#f97316',
    hasRing: true,
    ringColor: '#fdba74',
    moons: 1,
    style: 'gold',
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
  },
  {
    id: 'news',
    specialWorld: 'news',
    label: 'Notícias',
    planetName: 'Veritas Global',
    orbitRadius: 82.5,
    orbitSpeed: 0.022,
    orbitPhase: 2.05,
    orbitTilt: 0.06,
    radius: 2.25,
    spinSpeed: 0.3,
    accentHex: '#38bdf8',
    atmosphereHex: '#0284c7',
    hasClouds: true,
    moons: 1,
    hasSatellite: true,
    style: 'earth',
    icon: <Newspaper className="w-3.5 h-3.5" />,
  },
  {
    id: 'finance',
    specialWorld: 'finance',
    label: 'Bitcoin & Bolsa',
    planetName: 'Apex Quantum',
    orbitRadius: 89,
    orbitSpeed: 0.019,
    orbitPhase: 3.85,
    orbitTilt: -0.07,
    radius: 2.5,
    spinSpeed: 0.42,
    accentHex: '#facc15',
    atmosphereHex: '#10b981',
    hasRing: true,
    ringColor: '#34d399',
    moons: 2,
    style: 'gold',
    icon: <Bitcoin className="w-3.5 h-3.5" />,
  },
  {
    id: 'darkweb',
    specialWorld: 'darkweb',
    label: 'Dark Web',
    planetName: 'Abismo Inferno',
    orbitRadius: 96,
    orbitSpeed: 0.016,
    orbitPhase: 5.35,
    orbitTilt: 0.11,
    radius: 2.45,
    spinSpeed: 0.48,
    accentHex: '#ef4444',
    atmosphereHex: '#dc2626',
    hasRing: true,
    ringColor: '#991b1b',
    moons: 1,
    style: 'inferno',
    icon: <Skull className="w-3.5 h-3.5" />,
  },
  {
    id: 'freecity',
    isFreeCity: true,
    label: 'Free City · GTA 6',
    planetName: 'Oasis 6 · Mundo Vivo',
    orbitRadius: 18.5,
    orbitSpeed: 0.125,
    orbitPhase: 4.5,
    orbitTilt: 0.04,
    radius: 2.55,
    spinSpeed: 0.36,
    accentHex: '#22d3ee',
    atmosphereHex: '#34d399',
    hasClouds: true,
    hasRing: true,
    ringColor: '#38bdf8',
    moons: 1,
    hasSatellite: true,
    style: 'earth',
    icon: <Car className="w-3.5 h-3.5" />,
  },
  {
    id: 'satellites',
    specialWorld: 'satellites',
    label: 'Satélites · Brasil+',
    planetName: 'Órbita QGIS & Terra',
    orbitRadius: 31.5,
    orbitSpeed: 0.072,
    orbitPhase: 2.8,
    orbitTilt: -0.05,
    radius: 2.65,
    spinSpeed: 0.31,
    accentHex: '#10b981',
    atmosphereHex: '#22d3ee',
    hasClouds: true,
    hasRing: true,
    ringColor: '#34d399',
    moons: 1,
    hasSatellite: true,
    style: 'earth',
    icon: <Satellite className="w-3.5 h-3.5" />,
  },
];

interface PortalSpec {
  id: string;
  label: string;
  tabId: TabId | 'random';
  color1: string;
  color2: string;
  pos: [number, number, number];
  rotY: number;
}

const PORTAL_SPECS: PortalSpec[] = [
  {
    id: 'portal-multiverse',
    label: 'Portal Multiverso',
    tabId: 'movies',
    color1: '#fb923c',
    color2: '#fef08a',
    pos: [-24, 9.5, -18],
    rotY: 0.5,
  },
  {
    id: 'portal-quantum',
    label: 'Portal Quântico',
    tabId: 'studio',
    color1: '#22d3ee',
    color2: '#34d399',
    pos: [26, 8, -22],
    rotY: -0.55,
  },
  {
    id: 'portal-chaos',
    label: 'Portal Surpresa',
    tabId: 'random',
    color1: '#f43f5e',
    color2: '#fbbf24',
    pos: [2, 12.5, 29],
    rotY: 0.1,
  },
];

type PersonaId = 'zylar' | 'nova' | 'solis' | 'sentinel' | 'blackhole';

interface PersonaMeta {
  id: PersonaId;
  name: string;
  role: string;
  emoji: string;
  color: string;
  greeting: string;
  quickPrompts: string[];
}

const PERSONAS: Record<PersonaId, PersonaMeta> = {
  zylar: {
    id: 'zylar',
    name: 'Comandante Zylar',
    role: 'Nave Alienígena Alpha',
    emoji: '🛸',
    color: '#34d399',
    greeting: 'Saudações, viajante! Os propulsores quânticos estão quentes. Quer ouvir um som pesado ou saltar para algum planeta?',
    quickPrompts: ['Toca uma música', 'Abre Cinema', 'Abrir Jogos', 'Quero ver o Espectro'],
  },
  nova: {
    id: 'nova',
    name: 'N.O.V.A. Arcana',
    role: 'Guardiã dos Portais',
    emoji: '🔮',
    color: '#fb923c',
    greeting: 'Os anéis do Multiverso estão girando para você. Peça qualquer realidade e eu abro o portal agora mesmo!',
    quickPrompts: ['Abre um portal surpresa', 'Cinema & Séries', 'Vibe & Lives', 'Criar música IA'],
  },
  solis: {
    id: 'solis',
    name: 'Solis LENKYX',
    role: 'Coração Solar Vivo',
    emoji: '☀️',
    color: '#fbbf24',
    greeting: 'Eu pulso no ritmo de cada grave! Toque no Espectro ou peça uma música para iluminar toda a galáxia.',
    quickPrompts: ['Toca uma música', 'Abrir Espectro 3D', 'Artistas & Clipes'],
  },
  sentinel: {
    id: 'sentinel',
    name: 'Satélite S-7',
    role: 'Inteligência Orbital',
    emoji: '🛰️',
    color: '#38bdf8',
    greeting: 'Satélite S-7 online! Sinais de Futebol, UFC, downloads offline e áudio 4K sem anúncios prontos para você.',
    quickPrompts: ['Futebol & UFC ao vivo', 'Modo Offline', 'Toca uma música'],
  },
  blackhole: {
    id: 'blackhole',
    name: 'Oráculo Singular',
    role: 'Buraco Negro Gargantua',
    emoji: '🕳️',
    color: '#f59e0b',
    greeting: 'Aqui a gravidade dobra o tempo e abre caminhos para qualquer dimensão. Para qual universo deseja saltar?',
    quickPrompts: ['Me leva para outro universo', 'Abrir Cinema', 'Abrir Espectro'],
  },
};

/* === PHOTOREALISTIC PROCEDURAL TEXTURE & GLSL SHADERS === */
function createStarSpriteTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.45, 'rgba(186,230,253,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function createPlanetTextures(style: PlanetSpec['style']): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  const b = document.createElement('canvas');
  b.width = 512;
  b.height = 256;
  const btx = b.getContext('2d')!;
  btx.fillStyle = '#808080';
  btx.fillRect(0, 0, 512, 256);

  const palettes: Record<PlanetSpec['style'], [string, string, string, string]> = {
    earth: ['#062d5e', '#0d569e', '#226b3a', '#eaf4ff'],
    neon: ['#1f003d', '#6d28d9', '#f43f5e', '#22d3ee'],
    emerald: ['#042f36', '#0e7490', '#10b981', '#fef08a'],
    saturn: ['#7c4d21', '#ca8a3e', '#f4d38c', '#5c2b0e'],
    mars: ['#4a100a', '#992d17', '#d96236', '#f7b277'],
    ice: ['#0a2547', '#1d689e', '#7dd3fc', '#f8fafc'],
    cyber: ['#050e1f', '#0d2240', '#06b6d4', '#fde047'],
    amethyst: ['#1d0738', '#4c1d95', '#a855f7', '#5eead4'],
    arcade: ['#051912', '#0f3d2e', '#16a34a', '#a3e635'],
    inferno: ['#090103', '#2a0406', '#dc2626', '#fb923c'],
    gold: ['#1f1402', '#6b4706', '#f59e0b', '#fef08a'],
  };
  const [c1, c2, c3, c4] = palettes[style];

  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, c4);
  base.addColorStop(0.11, c1);
  base.addColorStop(0.5, c2);
  base.addColorStop(0.89, c1);
  base.addColorStop(1, c4);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);

  if (style === 'inferno') {
    // Cracked obsidian & glowing crimson magma rivers
    ctx.fillStyle = '#0a0204';
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 64; i++) {
      ctx.strokeStyle = i % 3 === 0 ? '#fef08a' : i % 2 === 0 ? '#fb923c' : '#ef4444';
      ctx.lineWidth = 1.5 + Math.random() * 3.5;
      ctx.globalAlpha = 0.78;
      let cx = Math.random() * 1024;
      let cy = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 7; s++) {
        cx += (Math.random() - 0.5) * 90;
        cy += (Math.random() - 0.5) * 65;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 36; i++) {
      const gx = Math.random() * 1024;
      const gy = 40 + Math.random() * 432;
      const gr = ctx.createRadialGradient(gx, gy, 2, gx, gy, 42);
      gr.addColorStop(0, 'rgba(239,68,68,0.85)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(gx, gy, 42, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'saturn' || style === 'neon' || style === 'ice' || style === 'amethyst') {
    for (let y = 18; y < 494; y += 7 + Math.random() * 11) {
      ctx.fillStyle = Math.random() > 0.45 ? c3 : c4;
      ctx.globalAlpha = 0.12 + Math.random() * 0.25;
      ctx.fillRect(0, y, 1024, 3 + Math.random() * 10);
      btx.fillStyle = Math.random() > 0.5 ? '#9c9c9c' : '#646464';
      btx.globalAlpha = 0.25;
      btx.fillRect(0, y * 0.5, 512, 2 + Math.random() * 5);
    }
    ctx.globalAlpha = 0.52;
    for (let i = 0; i < 12; i++) {
      const sx = Math.random() * 1024;
      const sy = 70 + Math.random() * 372;
      const g = ctx.createRadialGradient(sx, sy, 3, sx, sy, 48);
      g.addColorStop(0, c4);
      g.addColorStop(0.5, c3);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 52, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'cyber' || style === 'arcade' || style === 'gold') {
    ctx.strokeStyle = c3;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < 85; i++) {
      const x = Math.random() * 1024;
      const y = 50 + Math.random() * 412;
      ctx.fillStyle = i % 3 === 0 ? c4 : c3;
      const rw = 8 + Math.random() * 26;
      const rh = 3 + Math.random() * 7;
      ctx.fillRect(x, y, rw, rh);
      btx.fillStyle = '#d4d4d4';
      btx.fillRect(x * 0.5, y * 0.5, rw * 0.5, rh * 0.5);
    }
  } else {
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * 1024;
      const y = 44 + Math.random() * 424;
      const rx = 18 + Math.random() * 76;
      const ry = 12 + Math.random() * 38;
      const g = ctx.createRadialGradient(x, y, 2, x, y, rx);
      g.addColorStop(0, c3);
      g.addColorStop(0.68, c2);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();

      btx.fillStyle = Math.random() > 0.25 ? '#c8c8c8' : '#4a4a4a';
      btx.globalAlpha = 0.45;
      btx.beginPath();
      btx.ellipse(x * 0.5, y * 0.5, rx * 0.45, ry * 0.45, 0, 0, Math.PI * 2);
      btx.fill();
    }
  }
  ctx.globalAlpha = 1;
  btx.globalAlpha = 1;

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  const bump = new THREE.CanvasTexture(b);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.ClampToEdgeWrapping;
  return { map, bump };
}

function createCloudTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  for (let i = 0; i < 170; i++) {
    const x = Math.random() * 512;
    const y = 16 + Math.random() * 224;
    const rx = 14 + Math.random() * 42;
    const ry = 4 + Math.random() * 13;
    const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
    g.addColorStop(0, 'rgba(255,255,255,0.62)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function createMoonTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 85; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 128;
    const r = 2 + Math.random() * 11;
    ctx.fillStyle = 'rgba(51,65,85,0.52)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(248,250,252,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function createRingTexture(colorHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 32;
  const ctx = c.getContext('2d')!;
  for (let x = 0; x < 512; x++) {
    const n = x / 512;
    const band = Math.sin(n * 54) * 0.5 + 0.5;
    const edgeFade = Math.sin(n * Math.PI);
    const cassiniGap = n > 0.58 && n < 0.65 ? 0.08 : 1;
    ctx.fillStyle = colorHex;
    ctx.globalAlpha = Math.max(0.03, band * edgeFade * cassiniGap * 0.88);
    ctx.fillRect(x, 0, 1, 32);
  }
  return new THREE.CanvasTexture(c);
}

function createGlowSpriteTexture(innerColor: string, midColor: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 3, 128, 128, 128);
  g.addColorStop(0, innerColor);
  g.addColorStop(0.28, midColor);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function createArcaneMandalaTexture(c1: string, c2: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  // Fiery outer glow ring
  const bg = ctx.createRadialGradient(cx, cy, 80, cx, cy, 252);
  bg.addColorStop(0, 'rgba(0,0,0,0)');
  bg.addColorStop(0.62, `${c1}22`);
  bg.addColorStop(0.84, `${c1}bb`);
  bg.addColorStop(0.93, `${c2}ff`);
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);

  // Sacred geometry Doctor-Strange style concentric circles, squares, triangles & runes
  ctx.strokeStyle = c2;
  ctx.lineWidth = 3;
  [185, 210, 224, 240].forEach((r, idx) => {
    ctx.globalAlpha = idx === 2 ? 0.95 : 0.72;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Inscribed rotating polygons
  ctx.strokeStyle = c1;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.85;
  for (let rot = 0; rot < 2; rot++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rot * Math.PI) / 4);
    ctx.strokeRect(-146, -146, 292, 292);
    ctx.restore();
  }

  // Arcane rune ticks around perimeter
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r1 = 190;
    const r2 = i % 2 === 0 ? 208 : 200;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return new THREE.CanvasTexture(c);
}

function createSolarPanelTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#062145';
  ctx.fillRect(0, 0, 128, 64);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < 128; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 64);
    ctx.stroke();
  }
  for (let y = 0; y < 64; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

/* === CUSTOM GLSL SHADERS FOR REALISTIC SUN, NEBULA DOME, FRESNEL ATMOSPHERE & BLACK HOLE === */
function createNebulaSkyDomeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { u_time: { value: 0 } },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float u_time;
      varying vec3 vDir;
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z
        );
      }
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec3 d = normalize(vDir);
        float band = exp(-abs(d.y + d.x * 0.25) * 4.2);
        float n1 = fbm(d * 3.2 + vec3(u_time * 0.008));
        float n2 = fbm(d * 6.5 - vec3(u_time * 0.005));
        vec3 deep = vec3(0.015, 0.006, 0.055);
        vec3 cyanNeb = vec3(0.06, 0.34, 0.62) * smoothstep(0.35, 0.85, n1);
        vec3 magentaNeb = vec3(0.45, 0.12, 0.42) * smoothstep(0.42, 0.88, n2);
        vec3 goldDust = vec3(0.48, 0.28, 0.12) * band * smoothstep(0.5, 0.9, n1);
        vec3 col = deep + (cyanNeb + magentaNeb) * (0.45 + 0.75 * band) + goldDust * 0.4;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function createSunShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0 },
      u_pulse: { value: 1 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPos = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float u_time;
      uniform float u_pulse;
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vViewDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z
        );
      }
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.1;
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec3 p = normalize(vPos) * 3.4 + vec3(u_time * 0.18, -u_time * 0.12, u_time * 0.14);
        float n = fbm(p);
        float n2 = fbm(p * 2.2 - vec3(u_time * 0.25));
        float plasma = clamp(n * 0.65 + n2 * 0.45, 0.0, 1.0);
        float rim = 1.0 - max(0.0, dot(vNormal, vViewDir));
        vec3 deep = vec3(0.85, 0.22, 0.02);
        vec3 mid = vec3(1.0, 0.62, 0.08);
        vec3 hot = vec3(1.0, 0.96, 0.78);
        vec3 col = mix(deep, mid, smoothstep(0.2, 0.6, plasma));
        col = mix(col, hot, smoothstep(0.55, 0.92, plasma));
        col += vec3(1.0, 0.45, 0.08) * pow(rim, 2.2) * 0.95 * u_pulse;
        gl_FragColor = vec4(col * (0.95 + 0.15 * u_pulse), 1.0);
      }
    `,
  });
}

function createAtmosphereMaterial(colorHex: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { u_color: { value: new THREE.Color(colorHex) } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 u_color;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.2);
        gl_FragColor = vec4(u_color, fresnel * 0.85);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

function createAccretionDiskMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { u_time: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float u_time;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        if (r < 0.34 || r > 1.0) discard;
        float ang = atan(p.y, p.x);
        float swirl = sin(ang * 5.0 - u_time * 3.8 + r * 18.0) * 0.5 + 0.5;
        float bands = sin(r * 44.0 - u_time * 2.4) * 0.5 + 0.5;
        float intensity = smoothstep(0.34, 0.44, r) * (1.0 - smoothstep(0.68, 1.0, r));
        vec3 innerCol = vec3(1.0, 0.96, 0.82);
        vec3 outerCol = vec3(0.98, 0.38, 0.08);
        vec3 col = mix(innerCol, outerCol, smoothstep(0.38, 0.88, r));
        float alpha = intensity * (0.55 + 0.45 * swirl * bands);
        gl_FragColor = vec4(col * 1.4, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/* === 3D SPACECRAFT & CREATURE BUILDERS === */
function buildSatelliteMesh(solarTex: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.52, 6),
    new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.88, roughness: 0.2 })
  );
  body.rotation.z = Math.PI / 2;
  g.add(body);

  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.16, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.72, roughness: 0.28, side: THREE.DoubleSide })
  );
  dish.position.set(0, 0.22, 0);
  dish.rotation.x = Math.PI;
  g.add(dish);

  const wingMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    metalness: 0.55,
    roughness: 0.25,
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.28,
  });
  const wingGeo = new THREE.BoxGeometry(0.1, 0.03, 1.15);
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(0, 0, 0.82);
  g.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0, 0, -0.82);
  g.add(rightWing);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#22d3ee' })
  );
  beacon.position.set(0.3, 0, 0);
  beacon.name = 'beacon';
  g.add(beacon);

  // Optical Earth-observation scan cone (PlanetScope / Sentinel style)
  const scanCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.3, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: '#34d399',
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scanCone.position.set(0, -0.68, 0);
  scanCone.rotation.x = Math.PI;
  g.add(scanCone);

  return g;
}

function buildUfoMesh(beamColor: string): THREE.Group {
  const ufo = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 1.35, 0.32, 28),
    new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      metalness: 0.92,
      roughness: 0.16,
      emissive: new THREE.Color('#0f172a'),
      emissiveIntensity: 0.35,
    })
  );
  ufo.add(hull);

  const underHull = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 0.52, 0.24, 28),
    new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.85, roughness: 0.25 })
  );
  underHull.position.y = -0.26;
  ufo.add(underHull);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshPhysicalMaterial({
      color: '#67e8f9',
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.1,
    })
  );
  dome.position.y = 0.12;
  ufo.add(dome);

  const alienHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshBasicMaterial({ color: '#4ade80' })
  );
  alienHead.scale.set(0.85, 1.25, 0.85);
  alienHead.position.y = 0.32;
  ufo.add(alienHead);

  const rimLights = new THREE.Group();
  rimLights.name = 'rimLights';
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#34d399' : '#22d3ee' })
    );
    bulb.position.set(Math.cos(angle) * 1.26, -0.1, Math.sin(angle) * 1.26);
    rimLights.add(bulb);
  }
  ufo.add(rimLights);

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(1.25, 4.2, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: beamColor,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  beam.position.y = -2.35;
  ufo.add(beam);

  return ufo;
}

function buildSpaceLeviathan(colorHex: string): THREE.Group {
  const manta = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 2.2, 12),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 })
  );
  body.rotation.x = Math.PI / 2;
  manta.add(body);

  const wingGeo = new THREE.PlaneGeometry(2.8, 1.1, 8, 2);
  const wingMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.rotation.x = Math.PI / 2;
  wings.name = 'wings';
  manta.add(wings);
  return manta;
}

function playCosmicSound(kind: 'alien' | 'portal') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    if (kind === 'alien') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.34);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.45);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
    setTimeout(() => void ctx.close().catch(() => {}), 600);
  } catch {
    // ignore
  }
}

interface ProjectedTag {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  scale: number;
  depth: number;
}

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'entity' | 'person';
  author: string;
  text: string;
  color?: string;
}

interface Props {
  settings: AppSettings;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  userLang: string;
  onNavigateTab: (tab: TabId) => void;
  onOpenVisualizer: () => void;
  onPlayTrack: (track: Track) => void;
  onOpenSearch: (query?: string) => void;
  onOpenCreate: () => void;
  onOpenLang: () => void;
  onOpenPix: (tab?: 'donate' | 'ranking' | 'collection') => void;
  onOpenInstall: () => void;
  onOpenUpdates: () => void;
  onBrandTap: () => void;
  onToast: (msg: string) => void;
}

export const GalaxyUniverseView: React.FC<Props> = ({
  tracks,
  currentTrack,
  isPlaying,
  userLang,
  onNavigateTab,
  onOpenVisualizer,
  onPlayTrack,
  onOpenSearch,
  onOpenCreate,
  onOpenLang,
  onOpenPix,
  onOpenInstall,
  onOpenUpdates,
  onBrandTap,
  onToast,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [warpingMeta, setWarpingMeta] = useState<{ title: string; subtitle: string; portal?: boolean } | null>(null);
  const [tags, setTags] = useState<Record<string, ProjectedTag>>({});

  // Living Multiverse Comms Drawer (Talk to Entities OR Real People Online)
  const [commsOpen, setCommsOpen] = useState(false);
  const [commsMode, setCommsMode] = useState<'entity' | 'people'>('entity');
  const [activePersona, setActivePersona] = useState<PersonaId>('zylar');
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [entityChats, setEntityChats] = useState<Record<PersonaId, ChatMessageItem[]>>({
    zylar: [{ id: 'g-z', sender: 'entity', author: PERSONAS.zylar.name, text: PERSONAS.zylar.greeting }],
    nova: [{ id: 'g-n', sender: 'entity', author: PERSONAS.nova.name, text: PERSONAS.nova.greeting }],
    solis: [{ id: 'g-s', sender: 'entity', author: PERSONAS.solis.name, text: PERSONAS.solis.greeting }],
    sentinel: [{ id: 'g-se', sender: 'entity', author: PERSONAS.sentinel.name, text: PERSONAS.sentinel.greeting }],
    blackhole: [{ id: 'g-b', sender: 'entity', author: PERSONAS.blackhole.name, text: PERSONAS.blackhole.greeting }],
  });
  const [peopleMessages, setPeopleMessages] = useState<ChatMessageItem[]>([]);
  const [hubDrawerOpen, setHubDrawerOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [customPlanets, setCustomPlanets] = useState<CustomIdeaPlanet[]>([]);
  const [worldModal, setWorldModal] = useState<{
    open: boolean;
    world: SpecialWorldKind;
    ideaPlanet?: CustomIdeaPlanet | null;
  }>({ open: false, world: 'shopping', ideaPlanet: null });
  const [callsOpen, setCallsOpen] = useState(false);
  const [bluetoothOpen, setBluetoothOpen] = useState(false);
  const [freeCityOpen, setFreeCityOpen] = useState(false);
  const [robotsModalOpen, setRobotsModalOpen] = useState(false);
  const [galaxyRobots, setGalaxyRobots] = useState<{
    optimizationsCount: number;
    healthScore: number;
    memoryMb: number;
    lastSweepMs: number;
    bots: { id: string; name: string; color: string; status: string; currentTask: string }[];
  } | null>(null);
  const [liveDecision, setLiveDecision] = useState<string>(
    'Ecossistema vivo: bactérias, flores, insetos e carros autônomos em harmonia em Free City.'
  );
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/galaxy/planets')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.planets)) setCustomPlanets(d.planets);
      })
      .catch(() => {});

    const pollConsciousness = () => {
      const localLang = encodeURIComponent(navigator.language || 'pt');
      fetch(`/api/galaxy/consciousness?lang=${localLang}`)
        .then((r) => r.json())
        .then((d) => {
          const latest = d?.ecosystem?.decisions?.[0];
          if (latest?.decision) {
            setLiveDecision(`${latest.domain}: ${latest.decision}`);
          }
        })
        .catch(() => {});
      fetch(`/api/robots/status?lang=${localLang}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok && d.fleet) setGalaxyRobots(d.fleet);
        })
        .catch(() => {});
    };
    pollConsciousness();
    const t = window.setInterval(pollConsciousness, 7000);
    return () => window.clearInterval(t);
  }, []);

  const allPlanets = useMemo<PlanetSpec[]>(() => {
    const customSpecs: PlanetSpec[] = customPlanets.map((cp, idx) => ({
      id: cp.id,
      specialWorld: 'idea',
      customIdea: cp,
      label: cp.name,
      planetName: cp.topic || cp.name,
      orbitRadius: 103 + idx * 6.5,
      orbitSpeed: Math.max(0.008, 0.014 - idx * 0.001),
      orbitPhase: (idx * 1.75) % (Math.PI * 2),
      orbitTilt: idx % 2 === 0 ? 0.08 : -0.07,
      radius: 2.15,
      spinSpeed: 0.35,
      accentHex: cp.accentHex || '#38bdf8',
      atmosphereHex: cp.accentHex || '#38bdf8',
      hasRing: cp.hasRing ?? true,
      ringColor: cp.accentHex || '#38bdf8',
      moons: 1,
      style: 'cyber',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    }));
    return [...PLANET_SPECS, ...customSpecs];
  }, [customPlanets]);

  const hoveredRef = useRef<string | null>(null);
  hoveredRef.current = hoveredId;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const camControlRef = useRef({
    theta: 0.45,
    phi: 1.06,
    radius: 54,
    targetTheta: 0.45,
    targetPhi: 1.06,
    targetRadius: 54,
    lookTarget: new THREE.Vector3(0, 0, 0),
    desiredLook: new THREE.Vector3(0, 0, 0),
    warpActive: false,
    warpTargetPos: new THREE.Vector3(0, 0, 0),
    reset: () => {
      camControlRef.current.targetTheta = 0.45;
      camControlRef.current.targetPhi = 1.06;
      camControlRef.current.targetRadius = window.innerWidth < 768 ? 68 : 52;
      camControlRef.current.desiredLook.set(0, 0, 0);
    },
  });

  const triggerWarpRef = useRef<(spec: PlanetSpec) => void>(() => {});
  const triggerPortalRef = useRef<(portal: PortalSpec) => void>(() => {});
  const openCommsForRef = useRef<(persona: PersonaId) => void>(() => {});

  openCommsForRef.current = (persona: PersonaId) => {
    setActivePersona(persona);
    setCommsMode('entity');
    setCommsOpen(true);
  };

  // Load real online people chat when switching to People tab
  const loadPeopleChat = useCallback(async () => {
    try {
      const res = await fetch('/api/community/chat?room=global');
      if (!res.ok) return;
      const data = await res.json();
      const rows = Array.isArray(data?.messages) ? data.messages : [];
      setPeopleMessages(
        rows.map((m: { id?: string; authorName?: string; message?: string; authorColor?: string }) => ({
          id: m.id || String(Math.random()),
          sender: 'person',
          author: m.authorName || 'Viajante',
          text: m.message || '',
          color: m.authorColor,
        }))
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!commsOpen || commsMode !== 'people') return;
    void loadPeopleChat();
    const t = setInterval(() => void loadPeopleChat(), 5000);
    return () => clearInterval(t);
  }, [commsOpen, commsMode, loadPeopleChat]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [entityChats, peopleMessages, commsMode, activePersona, commsOpen]);

  const speakText = useCallback(
    (text: string) => {
      if (!voiceReplyEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = userLang === 'en' ? 'en-US' : userLang === 'es' ? 'es-ES' : 'pt-BR';
        utt.rate = 1.05;
        utt.pitch = 1.0;
        window.speechSynthesis.speak(utt);
      } catch {
        // ignore
      }
    },
    [voiceReplyEnabled, userLang]
  );

  const executeGalaxyAction = useCallback(
    (action?: GalaxyAction | null) => {
      if (!action) return;
      if (action.type === 'visualizer') {
        setTimeout(() => onOpenVisualizer(), 350);
      } else if (action.type === 'play_track') {
        const found = tracks.find((t) => t.id === action.trackId) || tracks[0];
        if (found) onPlayTrack(found);
      } else if (action.type === 'navigate' && action.tab) {
        const spec = PLANET_SPECS.find((p) => p.tabId === action.tab);
        if (spec) {
          setTimeout(() => triggerWarpRef.current(spec), 450);
        } else {
          setTimeout(() => onNavigateTab(action.tab!), 450);
        }
      }
    },
    [onNavigateTab, onOpenVisualizer, onPlayTrack, tracks]
  );

  const handleSendComms = async (customText?: string) => {
    const text = (customText ?? chatInput).trim();
    if (!text || sendingChat) return;
    setChatInput('');

    if (commsMode === 'people') {
      setSendingChat(true);
      try {
        const authorName = localStorage.getItem('lenkyx_user_name') || 'Viajante Cósmico';
        const res = await fetch('/api/community/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: 'global', authorName, authorColor: '#22d3ee', message: text }),
        });
        if (res.ok) {
          await loadPeopleChat();
        }
      } catch {
        onToast('Sem conexão no momento.');
      } finally {
        setSendingChat(false);
      }
      return;
    }

    const pId = activePersona;
    setEntityChats((prev) => ({
      ...prev,
      [pId]: [...(prev[pId] || []), { id: `u-${Date.now()}`, sender: 'user', author: 'Você', text }],
    }));
    setSendingChat(true);

    try {
      const res = await fetch('/api/galaxy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: pId,
          message: text,
          userLang,
          currentTrackTitle: currentTrack?.title || '',
        }),
      });
      if (!res.ok) throw new Error('fallback');
      const data = await res.json();
      const replyText = String(data?.reply || PERSONAS[pId].greeting);
      setEntityChats((prev) => ({
        ...prev,
        [pId]: [...(prev[pId] || []), { id: `e-${Date.now()}`, sender: 'entity', author: PERSONAS[pId].name, text: replyText }],
      }));
      speakText(replyText);
      if (data?.action) executeGalaxyAction(data.action as GalaxyAction);
    } catch {
      const fallback = PERSONAS[pId].greeting;
      setEntityChats((prev) => ({
        ...prev,
        [pId]: [...(prev[pId] || []), { id: `e-${Date.now()}`, sender: 'entity', author: PERSONAS[pId].name, text: fallback }],
      }));
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    camControlRef.current.targetRadius = width < 768 ? 68 : 52;
    camControlRef.current.radius = camControlRef.current.targetRadius;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#050214', 0.0024);

    const camera = new THREE.PerspectiveCamera(56, width / height, 0.2, 700);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    container.appendChild(renderer.domElement);

    /* === REALISTIC SPACE ILLUMINATION === */
    const sunLight = new THREE.PointLight('#fff6db', 5.2, 280, 0.3);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight('#bae6fd', '#3b0764', 1.25);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight('#c084fc', 0.9);
    rimLight.position.set(-45, 35, -35);
    scene.add(rimLight);

    const disposables: { dispose: () => void }[] = [];
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      disposables.push(t);
      return t;
    };

    /* === GLSL VOLUMETRIC MILKY WAY NEBULA SKY DOME === */
    const nebulaDomeMat = createNebulaSkyDomeMaterial();
    const nebulaDomeGeo = new THREE.SphereGeometry(320, 48, 32);
    disposables.push(nebulaDomeGeo, nebulaDomeMat);
    const nebulaDome = new THREE.Mesh(nebulaDomeGeo, nebulaDomeMat);
    scene.add(nebulaDome);

    /* === CENTRAL PHOTOREALISTIC GLSL PLASMA SUN === */
    const sunGroup = new THREE.Group();
    const sunMat = createSunShaderMaterial();
    const sunGeo = new THREE.SphereGeometry(5.6, 52, 52);
    disposables.push(sunGeo, sunMat);
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.userData = { kind: 'sun' };
    sunGroup.add(sunMesh);

    const coronaTex1 = trackTex(createGlowSpriteTexture('rgba(255,250,210,0.95)', 'rgba(251,146,60,0.5)'));
    const coronaSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: coronaTex1, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
    );
    coronaSprite.scale.set(24, 24, 1);
    sunGroup.add(coronaSprite);

    const coronaTex2 = trackTex(createGlowSpriteTexture('rgba(103,232,249,0.45)', 'rgba(236,72,153,0.18)'));
    const coronaOuter = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: coronaTex2, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
    );
    coronaOuter.scale.set(38, 38, 1);
    sunGroup.add(coronaOuter);
    scene.add(sunGroup);

    /* === ROUND OPTICAL STAR SPRITE FIELD (ZERO SQUARE PIXELS!) === */
    const starSpriteTex = trackTex(createStarSpriteTexture());
    const starCount = 5200;
    const starPos = new Float32Array(starCount * 3);
    const starCols = new Float32Array(starCount * 3);
    const starPalette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#bae6fd'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#fbcfe8'),
      new THREE.Color('#ddd6fe'),
    ];
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      if (i < 2900) {
        const arm = i % 3;
        const r = 18 + Math.pow(Math.random(), 0.85) * 190;
        const angle = arm * ((Math.PI * 2) / 3) + r * 0.036 + (Math.random() - 0.5) * 0.9;
        starPos[i3] = Math.cos(angle) * r;
        starPos[i3 + 1] = (Math.random() - 0.5) * (10 + r * 0.14);
        starPos[i3 + 2] = Math.sin(angle) * r;
      } else {
        const r = 95 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPos[i3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i3 + 1] = r * Math.cos(phi);
        starPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      const c = starPalette[i % starPalette.length];
      starCols[i3] = c.r;
      starCols[i3 + 1] = c.g;
      starCols[i3 + 2] = c.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.35,
      map: starSpriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      alphaTest: 0.01,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push(starGeo, starMat);
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Volumetric Nebula Glows
    const nebTexPink = trackTex(createGlowSpriteTexture('rgba(236,72,153,0.22)', 'rgba(139,92,246,0.08)'));
    const nebTexCyan = trackTex(createGlowSpriteTexture('rgba(56,189,248,0.22)', 'rgba(16,185,129,0.08)'));
    for (let i = 0; i < 20; i++) {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: i % 2 === 0 ? nebTexPink : nebTexCyan,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        })
      );
      const a = (i / 20) * Math.PI * 2;
      const dist = 48 + (i % 3) * 28;
      sp.position.set(Math.cos(a) * dist, ((i % 5) - 2) * 5, Math.sin(a) * dist);
      const sz = 46 + (i % 4) * 14;
      sp.scale.set(sz, sz, 1);
      scene.add(sp);
    }

    /* === SOFT ROUND ASTEROID DUST BELT === */
    const asteroidCount = 460;
    const astPos = new Float32Array(asteroidCount * 3);
    for (let i = 0; i < asteroidCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 31.2 + (Math.random() - 0.5) * 3.6;
      astPos[i * 3] = Math.cos(a) * r;
      astPos[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
      astPos[i * 3 + 2] = Math.sin(a) * r;
    }
    const astGeo = new THREE.BufferGeometry();
    astGeo.setAttribute('position', new THREE.BufferAttribute(astPos, 3));
    const astMat = new THREE.PointsMaterial({
      color: '#e2e8f0',
      size: 0.52,
      map: starSpriteTex,
      transparent: true,
      opacity: 0.72,
      alphaTest: 0.01,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push(astGeo, astMat);
    const asteroidBelt = new THREE.Points(astGeo, astMat);
    scene.add(asteroidBelt);

    /* === GARGANTUA 3D BLACK HOLE WITH GLSL ACCRETION DISK === */
    const blackHoleGroup = new THREE.Group();
    blackHoleGroup.position.set(-34, -4, 24);
    const bhHorizon = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 36, 36),
      new THREE.MeshBasicMaterial({ color: '#000000' })
    );
    bhHorizon.userData = { kind: 'blackhole' };
    blackHoleGroup.add(bhHorizon);

    const diskMat = createAccretionDiskMaterial();
    disposables.push(diskMat);
    const bhDisk = new THREE.Mesh(new THREE.PlaneGeometry(15.5, 15.5), diskMat);
    bhDisk.rotation.x = Math.PI / 2 - 0.25;
    bhDisk.userData = { kind: 'blackhole' };
    blackHoleGroup.add(bhDisk);

    // Gravitational lensing vertical photon ring
    const lensRing = new THREE.Mesh(
      new THREE.RingGeometry(2.68, 3.65, 64),
      new THREE.MeshBasicMaterial({
        color: '#fb923c',
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    blackHoleGroup.add(lensRing);

    const bhHaloTex = trackTex(createGlowSpriteTexture('rgba(251,146,60,0.45)', 'rgba(249,115,22,0.12)'));
    const bhHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: bhHaloTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
    );
    bhHalo.scale.set(17, 17, 1);
    blackHoleGroup.add(bhHalo);
    scene.add(blackHoleGroup);

    /* === DOCTOR STRANGE ARCANE MULTIVERSE PORTALS + SHATTERED SHARDS === */
    interface PortalRuntime {
      spec: PortalSpec;
      group: THREE.Group;
      outerMandala: THREE.Mesh;
      innerMandala: THREE.Mesh;
      shards: THREE.Group;
    }
    const portalRuntimes: PortalRuntime[] = [];
    const clickableObjects: THREE.Object3D[] = [sunMesh, bhHorizon, bhDisk];

    PORTAL_SPECS.forEach((pSpec) => {
      const pg = new THREE.Group();
      pg.position.set(...pSpec.pos);
      pg.rotation.y = pSpec.rotY;

      const mandalaTex = trackTex(createArcaneMandalaTexture(pSpec.color1, pSpec.color2));
      const outerMat = new THREE.MeshBasicMaterial({
        map: mandalaTex,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const outerGeo = new THREE.PlaneGeometry(8.5, 8.5);
      disposables.push(outerGeo, outerMat);
      const outerMandala = new THREE.Mesh(outerGeo, outerMat);
      outerMandala.userData = { kind: 'portal', portal: pSpec };
      pg.add(outerMandala);

      const innerMat = new THREE.MeshBasicMaterial({
        map: mandalaTex,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const innerGeo = new THREE.PlaneGeometry(6.2, 6.2);
      disposables.push(innerGeo, innerMat);
      const innerMandala = new THREE.Mesh(innerGeo, innerMat);
      innerMandala.position.z = 0.08;
      pg.add(innerMandala);

      const coreTex = trackTex(createGlowSpriteTexture(`${pSpec.color2}66`, `${pSpec.color1}22`));
      const coreSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: coreTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
      );
      coreSprite.scale.set(7.5, 7.5, 1);
      pg.add(coreSprite);

      // Shattered Multiverse Mirror Shards floating around portal (Doctor Strange style!)
      const shards = new THREE.Group();
      const shardGeo = new THREE.TetrahedronGeometry(0.45, 0);
      const shardMat = new THREE.MeshPhysicalMaterial({
        color: pSpec.color2,
        emissive: new THREE.Color(pSpec.color1),
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.72,
        roughness: 0.08,
        metalness: 0.35,
      });
      disposables.push(shardGeo, shardMat);
      for (let s = 0; s < 12; s++) {
        const a = (s / 12) * Math.PI * 2;
        const shard = new THREE.Mesh(shardGeo, shardMat);
        shard.position.set(Math.cos(a) * (4.1 + (s % 3) * 0.5), Math.sin(a) * (4.1 + (s % 2) * 0.5), ((s % 3) - 1) * 0.6);
        shard.scale.set(1.3, 0.6, 0.35);
        shard.rotation.set(s, s * 0.7, s * 1.2);
        shards.add(shard);
      }
      pg.add(shards);

      scene.add(pg);
      clickableObjects.push(outerMandala);
      portalRuntimes.push({ spec: pSpec, group: pg, outerMandala, innerMandala, shards });
    });

    /* === ALL 9 PLANETS WITH BUMP RELIEF + GLSL FRESNEL ATMOSPHERE === */
    const moonTex = trackTex(createMoonTexture());
    const cloudTex = trackTex(createCloudTexture());
    const solarPanelTex = trackTex(createSolarPanelTexture());
    const sphereGeoShared = new THREE.SphereGeometry(1, 44, 44);
    disposables.push(sphereGeoShared);

    interface PlanetRuntime {
      spec: PlanetSpec;
      pivot: THREE.Group;
      surface: THREE.Mesh;
      clouds?: THREE.Mesh;
      moons: THREE.Group[];
      satellite?: THREE.Group;
    }

    const planetRuntimes: PlanetRuntime[] = [];

    allPlanets.forEach((spec) => {
      const orbitPts: THREE.Vector3[] = [];
      for (let s = 0; s <= 128; s++) {
        const ang = (s / 128) * Math.PI * 2;
        orbitPts.push(
          new THREE.Vector3(
            Math.cos(ang) * spec.orbitRadius,
            Math.sin(ang) * spec.orbitRadius * Math.sin(spec.orbitTilt),
            Math.sin(ang) * spec.orbitRadius
          )
        );
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
      const orbitMat = new THREE.LineBasicMaterial({ color: spec.accentHex, transparent: true, opacity: 0.22 });
      disposables.push(orbitGeo, orbitMat);
      scene.add(new THREE.Line(orbitGeo, orbitMat));

      const pivot = new THREE.Group();
      scene.add(pivot);

      const { map: pTex, bump: pBump } = createPlanetTextures(spec.style);
      trackTex(pTex);
      trackTex(pBump);
      const pMat = new THREE.MeshStandardMaterial({
        map: pTex,
        bumpMap: pBump,
        bumpScale: 0.14,
        roughness: spec.style === 'ice' || spec.style === 'cyber' ? 0.32 : 0.62,
        metalness: spec.style === 'cyber' || spec.style === 'arcade' ? 0.45 : 0.12,
        emissive: new THREE.Color(spec.accentHex),
        emissiveIntensity: 0.12,
      });
      disposables.push(pMat);
      const surface = new THREE.Mesh(sphereGeoShared, pMat);
      surface.scale.setScalar(spec.radius);
      surface.userData = { kind: 'planet', spec };
      pivot.add(surface);
      clickableObjects.push(surface);

      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      disposables.push(hitMat);
      const hitTarget = new THREE.Mesh(sphereGeoShared, hitMat);
      hitTarget.scale.setScalar(spec.radius * 1.55);
      hitTarget.userData = { kind: 'planet', spec };
      pivot.add(hitTarget);
      clickableObjects.push(hitTarget);

      // GLSL Fresnel Atmospheric Rim
      const atmoMat = createAtmosphereMaterial(spec.atmosphereHex);
      disposables.push(atmoMat);
      const atmoMesh = new THREE.Mesh(sphereGeoShared, atmoMat);
      atmoMesh.scale.setScalar(spec.radius * 1.14);
      pivot.add(atmoMesh);

      let clouds: THREE.Mesh | undefined;
      if (spec.hasClouds) {
        const cMat = new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, opacity: 0.68, depthWrite: false });
        disposables.push(cMat);
        clouds = new THREE.Mesh(sphereGeoShared, cMat);
        clouds.scale.setScalar(spec.radius * 1.03);
        pivot.add(clouds);
      }

      if (spec.hasRing) {
        const rGeo = new THREE.RingGeometry(spec.radius * 1.38, spec.radius * 2.32, 84);
        const rTex = trackTex(createRingTexture(spec.ringColor || spec.accentHex));
        const rMat = new THREE.MeshBasicMaterial({
          map: rTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
        });
        disposables.push(rGeo, rMat);
        const ring = new THREE.Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 2 - 0.35;
        ring.rotation.y = 0.25;
        pivot.add(ring);
      }

      const moons: THREE.Group[] = [];
      for (let m = 0; m < spec.moons; m++) {
        const moonPivot = new THREE.Group();
        const mMat = new THREE.MeshStandardMaterial({ map: moonTex, bumpMap: moonTex, bumpScale: 0.06, roughness: 0.85 });
        disposables.push(mMat);
        const moonMesh = new THREE.Mesh(sphereGeoShared, mMat);
        moonMesh.scale.setScalar(0.34 + m * 0.08);
        moonMesh.position.set(spec.radius * (1.72 + m * 0.68), 0.25 * (m === 0 ? 1 : -1), 0);
        moonPivot.add(moonMesh);
        moonPivot.rotation.z = 0.2 * (m + 1);
        pivot.add(moonPivot);
        moons.push(moonPivot);
      }

      let satellite: THREE.Group | undefined;
      if (spec.hasSatellite) {
        satellite = buildSatelliteMesh(solarPanelTex);
        satellite.scale.setScalar(0.78);
        satellite.userData = { kind: 'satellite', persona: 'sentinel' as PersonaId };
        pivot.add(satellite);
        clickableObjects.push(satellite);
      }

      planetRuntimes.push({ spec, pivot, surface, clouds, moons, satellite });
    });

    /* === LIVING ALIEN UFOS & COSMIC LEVIATHANS === */
    const ufo1 = buildUfoMesh('#34d399');
    ufo1.scale.setScalar(1.35);
    ufo1.userData = { kind: 'ufo', persona: 'zylar' as PersonaId };
    scene.add(ufo1);
    clickableObjects.push(ufo1);

    const ufo2 = buildUfoMesh('#22d3ee');
    ufo2.scale.setScalar(1.1);
    ufo2.userData = { kind: 'ufo', persona: 'zylar' as PersonaId };
    scene.add(ufo2);
    clickableObjects.push(ufo2);

    const manta1 = buildSpaceLeviathan('#38bdf8');
    scene.add(manta1);
    const manta2 = buildSpaceLeviathan('#f472b6');
    scene.add(manta2);

    /* === QUANTUM HYPER-BRIDGE LINES (ALL UNIVERSES CONNECTED) === */
    const bridgeGeo = new THREE.BufferGeometry();
    const bridgeMat = new THREE.LineBasicMaterial({
      color: '#22d3ee',
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
    });
    const bridgeLines = new THREE.LineSegments(bridgeGeo, bridgeMat);
    scene.add(bridgeLines);
    disposables.push(bridgeGeo, bridgeMat);

    /* === SHOOTING STARS === */
    const meteorGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(5.2, -1.8, 1.4),
    ]);
    const meteorMat = new THREE.LineBasicMaterial({ color: '#f0f9ff', transparent: true, opacity: 0.9 });
    disposables.push(meteorGeo, meteorMat);
    const meteors = Array.from({ length: 5 }, (_, idx) => {
      const line = new THREE.Line(meteorGeo, meteorMat);
      scene.add(line);
      return { line, phase: idx * 1.9 };
    });

    /* === INTERACTION & WARP === */
    let dragging = false;
    let pointerDownPos = { x: 0, y: 0 };
    let lastPointer = { x: 0, y: 0 };
    let movedDist = 0;
    let pinchDist = 0;
    const mouseNdc = new THREE.Vector2(-99, -99);
    const raycaster = new THREE.Raycaster();

    const triggerWarp = (spec: PlanetSpec) => {
      const rt = planetRuntimes.find((p) => p.spec.id === spec.id);
      if (rt) {
        camControlRef.current.warpActive = true;
        camControlRef.current.warpTargetPos.copy(rt.pivot.position);
      }
      setWarpingMeta({ title: spec.label, subtitle: spec.planetName });
      if (spec.isFreeCity) {
        setTimeout(() => {
          camControlRef.current.warpActive = false;
          camera.fov = 56;
          camera.updateProjectionMatrix();
          setWarpingMeta(null);
          setFreeCityOpen(true);
        }, 420);
      } else if (spec.specialWorld) {
        setTimeout(() => {
          camControlRef.current.warpActive = false;
          camera.fov = 56;
          camera.updateProjectionMatrix();
          setWarpingMeta(null);
          setWorldModal({
            open: true,
            world: spec.specialWorld!,
            ideaPlanet: spec.customIdea || null,
          });
        }, 420);
      } else if (spec.tabId) {
        setTimeout(() => onNavigateTab(spec.tabId!), 560);
      }
    };
    triggerWarpRef.current = triggerWarp;

    const triggerPortal = (portal: PortalSpec) => {
      playCosmicSound('portal');
      const rt = portalRuntimes.find((p) => p.spec.id === portal.id);
      if (rt) {
        camControlRef.current.warpActive = true;
        camControlRef.current.warpTargetPos.copy(rt.group.position);
      }
      const tabPlanets = PLANET_SPECS.filter((p) => Boolean(p.tabId));
      const nextTab: TabId =
        portal.tabId === 'random'
          ? tabPlanets[Math.floor(Math.random() * tabPlanets.length)].tabId!
          : portal.tabId;
      setWarpingMeta({ title: portal.label, subtitle: 'MULTIVERSO LENKYX', portal: true });
      setTimeout(() => onNavigateTab(nextTab), 600);
    };
    triggerPortalRef.current = triggerPortal;

    const handlePointerDown = (e: PointerEvent) => {
      dragging = true;
      movedDist = 0;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      lastPointer = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (!dragging) return;
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      movedDist += Math.hypot(dx, dy);
      lastPointer = { x: e.clientX, y: e.clientY };
      camControlRef.current.targetTheta -= dx * 0.0065;
      camControlRef.current.targetPhi = Math.max(0.28, Math.min(2.65, camControlRef.current.targetPhi - dy * 0.0055));
    };

    const handlePointerUp = (e: PointerEvent) => {
      dragging = false;
      if (movedDist > 10 || Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 10) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(clickableObjects, true);
      if (!hits.length) return;
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !obj.userData?.kind) obj = obj.parent;
      if (!obj) return;
      const { kind, spec, portal, persona } = obj.userData as {
        kind?: string;
        spec?: PlanetSpec;
        portal?: PortalSpec;
        persona?: PersonaId;
      };
      if (kind === 'planet' && spec) triggerWarp(spec);
      else if (kind === 'portal' && portal) triggerPortal(portal);
      else if (kind === 'sun') onOpenVisualizer();
      else if (kind === 'ufo') {
        playCosmicSound('alien');
        openCommsForRef.current(persona || 'zylar');
      } else if (kind === 'satellite') {
        setWorldModal({ open: true, world: 'satellites', ideaPlanet: null });
      } else if (kind === 'blackhole') {
        playCosmicSound('portal');
        openCommsForRef.current('blackhole');
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camControlRef.current.targetRadius = Math.max(
        18,
        Math.min(110, camControlRef.current.targetRadius + e.deltaY * 0.045)
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (pinchDist > 0) {
          camControlRef.current.targetRadius = Math.max(
            18,
            Math.min(110, camControlRef.current.targetRadius - (d - pinchDist) * 0.14)
          );
        }
        pinchDist = d;
      }
    };
    const handleTouchEnd = () => {
      pinchDist = 0;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });
    domEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    domEl.addEventListener('touchend', handleTouchEnd);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    /* === 60FPS COSMIC SIMULATION LOOP === */
    let raf = 0;
    let simTime = 0;
    let lastNow = performance.now();
    let tagFrameSkip = 0;
    const tempVec = new THREE.Vector3();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      simTime += dt;

      // GLSL Nebula Sky + Sun plasma & beat pulse
      nebulaDomeMat.uniforms.u_time.value = simTime;
      sunMat.uniforms.u_time.value = simTime;
      const pulse = isPlayingRef.current ? 1 + Math.sin(simTime * 7.5) * 0.14 : 1 + Math.sin(simTime * 2) * 0.04;
      sunMat.uniforms.u_pulse.value = pulse;
      coronaSprite.scale.set(24 * pulse, 24 * pulse, 1);
      coronaOuter.scale.set(38 * pulse, 38 * pulse, 1);

      // Black Hole swirl + gravitational billboard ring
      diskMat.uniforms.u_time.value = simTime;
      lensRing.lookAt(camera.position);

      // Arcane Portals + shattered glass shards
      for (const pr of portalRuntimes) {
        pr.outerMandala.rotation.z += dt * 0.55;
        pr.innerMandala.rotation.z -= dt * 0.85;
        pr.shards.rotation.z += dt * 0.25;
        pr.shards.children.forEach((sh, i) => {
          sh.rotation.x += dt * (0.4 + i * 0.04);
          sh.rotation.y += dt * 0.5;
        });
      }

      starField.rotation.y += dt * 0.007;
      asteroidBelt.rotation.y += dt * 0.032;

      // Orbiting Planets, Clouds, Moons & Satellites
      for (const rt of planetRuntimes) {
        const ang = rt.spec.orbitPhase + simTime * rt.spec.orbitSpeed;
        rt.pivot.position.set(
          Math.cos(ang) * rt.spec.orbitRadius,
          Math.sin(ang) * rt.spec.orbitRadius * Math.sin(rt.spec.orbitTilt),
          Math.sin(ang) * rt.spec.orbitRadius
        );
        const isHov = hoveredRef.current === rt.spec.id;
        const targetScale = isHov ? 1.14 : 1;
        rt.surface.scale.lerp(
          new THREE.Vector3(rt.spec.radius * targetScale, rt.spec.radius * targetScale, rt.spec.radius * targetScale),
          0.12
        );
        rt.surface.rotation.y += dt * rt.spec.spinSpeed;
        if (rt.clouds) {
          rt.clouds.rotation.y += dt * (rt.spec.spinSpeed * 1.28);
          rt.clouds.scale.copy(rt.surface.scale).multiplyScalar(1.03);
        }
        rt.moons.forEach((m, idx) => {
          m.rotation.y += dt * (1.1 + idx * 0.45);
        });
        if (rt.satellite) {
          const satAng = simTime * 1.55;
          const sr = rt.spec.radius * 1.65;
          rt.satellite.position.set(Math.cos(satAng) * sr, Math.sin(satAng * 0.7) * 1.1, Math.sin(satAng) * sr);
          rt.satellite.lookAt(rt.pivot.position);
        }
      }

      // Connect all universes & planets dynamically with live quantum bridges
      if (planetRuntimes.length > 1) {
        const pts: number[] = [];
        for (let idx = 0; idx < planetRuntimes.length; idx++) {
          const a = planetRuntimes[idx].pivot.position;
          const b = planetRuntimes[(idx + 1) % planetRuntimes.length].pivot.position;
          pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
        bridgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      }

      // Alien UFOs + Cosmic Leviathans
      const u1t = simTime * 0.34;
      ufo1.position.set(Math.cos(u1t) * 25, Math.sin(u1t * 2.1) * 7.5 + 3.5, Math.sin(u1t * 0.8) * 23);
      ufo1.rotation.y += dt * 1.4;
      ufo1.rotation.z = Math.sin(u1t * 2) * 0.12;
      const rim1 = ufo1.getObjectByName('rimLights');
      if (rim1) rim1.rotation.y -= dt * 3.5;

      const u2t = simTime * 0.24 + 2.5;
      ufo2.position.set(Math.sin(u2t) * 43, Math.cos(u2t * 1.7) * 9 - 2, Math.cos(u2t * 0.9) * 39);
      ufo2.rotation.y -= dt * 1.7;
      const rim2 = ufo2.getObjectByName('rimLights');
      if (rim2) rim2.rotation.y += dt * 3.8;

      const m1t = simTime * 0.19;
      manta1.position.set(Math.cos(m1t) * 38, Math.sin(m1t * 1.5) * 9 + 6, Math.sin(m1t * 1.2) * 32);
      manta1.lookAt(
        Math.cos(m1t + 0.1) * 38,
        Math.sin((m1t + 0.1) * 1.5) * 9 + 6,
        Math.sin((m1t + 0.1) * 1.2) * 32
      );
      const w1 = manta1.getObjectByName('wings');
      if (w1) w1.rotation.z = Math.sin(simTime * 5) * 0.25;

      const m2t = simTime * 0.15 + 3.1;
      manta2.position.set(Math.sin(m2t) * 52, Math.cos(m2t * 1.4) * 11 - 5, Math.cos(m2t) * 46);
      manta2.lookAt(
        Math.sin(m2t + 0.1) * 52,
        Math.cos((m2t + 0.1) * 1.4) * 11 - 5,
        Math.cos(m2t + 0.1) * 46
      );
      const w2 = manta2.getObjectByName('wings');
      if (w2) w2.rotation.z = Math.sin(simTime * 4.5 + 1) * 0.28;

      meteors.forEach((m) => {
        const cycle = ((simTime + m.phase) % 5.5) / 5.5;
        m.line.position.x = -80 + cycle * 165;
        m.line.position.y = 35 - cycle * 48;
        m.line.position.z = -35 + cycle * 20;
        m.line.visible = cycle < 0.25;
      });

      const ctrl = camControlRef.current;
      if (ctrl.warpActive) {
        camera.position.lerp(ctrl.warpTargetPos, 0.12);
        camera.fov = THREE.MathUtils.lerp(camera.fov, 94, 0.12);
        camera.updateProjectionMatrix();
        camera.lookAt(ctrl.warpTargetPos);
      } else {
        if (!dragging) ctrl.targetTheta += dt * 0.022;
        ctrl.theta = THREE.MathUtils.lerp(ctrl.theta, ctrl.targetTheta, 0.085);
        ctrl.phi = THREE.MathUtils.lerp(ctrl.phi, ctrl.targetPhi, 0.085);
        ctrl.radius = THREE.MathUtils.lerp(ctrl.radius, ctrl.targetRadius, 0.085);
        ctrl.lookTarget.lerp(ctrl.desiredLook, 0.085);
        camera.position.set(
          ctrl.lookTarget.x + ctrl.radius * Math.sin(ctrl.phi) * Math.cos(ctrl.theta),
          ctrl.lookTarget.y + ctrl.radius * Math.cos(ctrl.phi),
          ctrl.lookTarget.z + ctrl.radius * Math.sin(ctrl.phi) * Math.sin(ctrl.theta)
        );
        camera.lookAt(ctrl.lookTarget);
      }

      if (!dragging && mouseNdc.x > -2) {
        raycaster.setFromCamera(mouseNdc, camera);
        const hits = raycaster.intersectObjects(clickableObjects, true);
        let foundId: string | null = null;
        if (hits.length) {
          let obj: THREE.Object3D | null = hits[0].object;
          while (obj && !obj.userData?.kind) obj = obj.parent;
          if (obj?.userData?.kind === 'planet' && obj.userData.spec) {
            foundId = (obj.userData.spec as PlanetSpec).id;
          }
        }
        if (foundId !== hoveredRef.current) {
          setHoveredId(foundId);
          domEl.style.cursor = hits.length ? 'pointer' : 'grab';
        }
      }

      renderer.render(scene, camera);

      tagFrameSkip = (tagFrameSkip + 1) % 2;
      if (tagFrameSkip === 0) {
        const w = domEl.clientWidth || width;
        const h = domEl.clientHeight || height;
        const nextTags: Record<string, ProjectedTag> = {};

        const projectItem = (id: string, pos: THREE.Vector3, yOffset: number) => {
          tempVec.copy(pos);
          tempVec.y += yOffset;
          const dist = camera.position.distanceTo(pos);
          tempVec.project(camera);
          const onScreen =
            tempVec.z < 1 &&
            tempVec.z > -1 &&
            tempVec.x >= -0.94 &&
            tempVec.x <= 0.94 &&
            tempVec.y >= -0.92 &&
            tempVec.y <= 0.92;
          nextTags[id] = {
            id,
            x: (tempVec.x * 0.5 + 0.5) * w,
            y: (-tempVec.y * 0.5 + 0.5) * h,
            visible: onScreen,
            scale: Math.max(0.75, Math.min(1.12, 48 / Math.max(20, dist))),
            depth: dist,
          };
        };

        projectItem('sun', new THREE.Vector3(0, 0, 0), 6.8);
        projectItem('blackhole', blackHoleGroup.position, 4.8);
        projectItem('ufo1', ufo1.position, 2.2);
        portalRuntimes.forEach((pr) => projectItem(pr.spec.id, pr.group.position, 4.9));
        planetRuntimes.forEach((rt) => projectItem(rt.spec.id, rt.pivot.position, rt.spec.radius + 1.35));

        setTags(nextTags);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domEl.removeEventListener('wheel', handleWheel);
      domEl.removeEventListener('touchmove', handleTouchMove);
      domEl.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (domEl.parentElement === container) {
        container.removeChild(domEl);
      }
    };
  }, [allPlanets, onNavigateTab, onOpenVisualizer]);

  const activePersonaMeta = PERSONAS[activePersona];
  const activeMessages = commsMode === 'people' ? peopleMessages : entityChats[activePersona] || [];

  return (
    <div className="fixed inset-0 z-20 overflow-hidden bg-[#040112] select-none">
      {/* FULLSCREEN 3D REALISTIC GALAXY */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full touch-none" />

      {/* 3D PROJECTED HOLOGRAPHIC LABELS INSIDE SPACE */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {tags['sun']?.visible && (
          <button
            type="button"
            onClick={onOpenVisualizer}
            style={{ transform: `translate(-50%, -50%) translate3d(${tags['sun'].x}px, ${tags['sun'].y}px, 0)` }}
            className="pointer-events-auto absolute top-0 left-0 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-400/35 border border-amber-300/60 backdrop-blur-md text-[10px] font-black text-amber-100 flex items-center gap-1.5 shadow-[0_0_22px_rgba(251,191,36,0.5)]"
          >
            <AudioWaveform className={`w-3 h-3 text-amber-300 ${isPlaying ? 'animate-pulse' : ''}`} />
            <span>{isPlaying && currentTrack ? currentTrack.title : 'Sol LENKYX'}</span>
          </button>
        )}

        {tags['blackhole']?.visible && (
          <button
            type="button"
            onClick={() => openCommsForRef.current('blackhole')}
            style={{
              transform: `translate(-50%, -50%) translate3d(${tags['blackhole'].x}px, ${tags['blackhole'].y}px, 0) scale(${tags['blackhole'].scale})`,
            }}
            className="pointer-events-auto absolute top-0 left-0 px-2.5 py-1 rounded-full bg-orange-950/70 hover:bg-orange-500/30 border border-orange-400/55 backdrop-blur-md text-[10px] font-black text-orange-100 flex items-center gap-1 shadow-[0_0_18px_rgba(251,146,60,0.4)]"
          >
            <span>🕳️ Buraco Negro</span>
          </button>
        )}

        {tags['ufo1']?.visible && (
          <button
            type="button"
            onClick={() => {
              playCosmicSound('alien');
              openCommsForRef.current('zylar');
            }}
            style={{
              transform: `translate(-50%, -50%) translate3d(${tags['ufo1'].x}px, ${tags['ufo1'].y}px, 0) scale(${tags['ufo1'].scale})`,
            }}
            className="pointer-events-auto absolute top-0 left-0 px-2.5 py-1 rounded-full bg-emerald-950/75 hover:bg-emerald-500/35 border border-emerald-400/65 backdrop-blur-md text-[10px] font-black text-emerald-100 flex items-center gap-1 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
          >
            <span>🛸 Conversar</span>
          </button>
        )}

        {PORTAL_SPECS.map((portal) => {
          const tag = tags[portal.id];
          if (!tag?.visible) return null;
          return (
            <button
              key={portal.id}
              type="button"
              onClick={() => triggerPortalRef.current(portal)}
              style={{
                transform: `translate(-50%, -50%) translate3d(${tag.x}px, ${tag.y}px, 0) scale(${tag.scale})`,
              }}
              className="pointer-events-auto absolute top-0 left-0 px-2.5 py-1 rounded-full bg-amber-950/70 hover:bg-amber-400 hover:text-black border border-amber-400/70 backdrop-blur-md text-[10px] font-black text-amber-100 flex items-center gap-1 shadow-[0_0_20px_rgba(251,146,60,0.5)] transition"
            >
              <span>✨ {portal.label}</span>
            </button>
          );
        })}

        {allPlanets.map((spec) => {
          const tag = tags[spec.id];
          if (!tag?.visible) return null;
          const isHov = hoveredId === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => triggerWarpRef.current(spec)}
              onMouseEnter={() => setHoveredId(spec.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                transform: `translate(-50%, -50%) translate3d(${tag.x}px, ${tag.y}px, 0) scale(${tag.scale})`,
                zIndex: Math.round(1000 - tag.depth),
              }}
              className={`pointer-events-auto absolute top-0 left-0 px-2.5 py-1 rounded-full backdrop-blur-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-lg ${
                isHov
                  ? 'bg-white text-black border-white shadow-[0_0_22px_rgba(255,255,255,0.6)]'
                  : 'bg-slate-950/60 hover:bg-slate-900/85 text-white border-white/25'
              }`}
            >
              <span style={{ color: isHov ? '#000' : spec.accentHex }}>{spec.icon}</span>
              <span className="text-[11px] font-black tracking-wide">{spec.label}</span>
            </button>
          );
        })}
      </div>

      {/* FLOATING INSIDE-SPACE HOLOGRAPHIC TOP BAR (NO OUTER FRAME!) */}
      <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div
          onClick={onBrandTap}
          className="pointer-events-auto flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-950/55 border border-white/15 backdrop-blur-xl cursor-pointer shrink-0"
        >
          <img src="/covers/icon-192.png?v=43" alt="LENKYX" className="w-7 h-7 object-contain lenkyx-logo-3d" />
          <span className="font-display text-xs font-black tracking-widest text-white hidden sm:inline">LENKYX</span>
        </div>

        {/* Floating Space Search Pill */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onOpenSearch(searchDraft);
          }}
          className="pointer-events-auto flex-1 max-w-md flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/55 border border-white/15 focus-within:border-cyan-400/70 backdrop-blur-xl"
        >
          <Search className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Buscar na galáxia..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </form>

        {/* Compact Action Orbs */}
        <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setWorldModal({ open: true, world: 'create_planet', ideaPlanet: null })}
            className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-[11px] font-black flex items-center gap-1 shadow-[0_0_16px_rgba(56,189,248,0.45)]"
            title="Novo Planeta / Nova Ideia"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Planeta</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-black flex items-center gap-1 shadow-[0_0_16px_rgba(236,72,153,0.45)]"
            title="Criar Vídeo / Música"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Criar</span>
          </button>

          <button
            type="button"
            onClick={() => setCallsOpen(true)}
            className="px-2.5 py-1.5 rounded-full bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/55 backdrop-blur-xl text-emerald-100 text-[11px] font-black flex items-center gap-1"
            title="Chamada de Voz / Vídeo com Dublagem"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">Chamadas</span>
          </button>

          <button
            type="button"
            onClick={() => setBluetoothOpen(true)}
            className="p-2 rounded-full bg-blue-500/25 hover:bg-blue-500/40 border border-blue-400/50 backdrop-blur-xl text-blue-200"
            title="Bluetooth"
          >
            <Bluetooth className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCommsOpen((v) => !v)}
            className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 backdrop-blur-xl text-cyan-200"
            title="Conversar com Seres & Pessoas"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setHubDrawerOpen((v) => !v)}
            className="p-2 rounded-full bg-slate-950/55 hover:bg-white/15 border border-white/20 backdrop-blur-xl text-amber-300"
            title="Estação Cósmica"
          >
            <Crown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => camControlRef.current.reset()}
            className="p-2 rounded-full bg-slate-950/55 hover:bg-white/15 border border-white/20 backdrop-blur-xl text-cyan-200"
            title="Centralizar"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* COSMIC STATION MINI POPOVER (PIX · Ranking · Bonequinhos · Idioma · Atualizar · App) */}
      {hubDrawerOpen && (
        <div className="absolute top-16 right-3 z-30 w-64 rounded-2xl bg-slate-950/85 border border-white/20 backdrop-blur-2xl p-3 space-y-2 shadow-[0_12px_40px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between text-xs font-black text-white pb-1 border-b border-white/10">
            <span>Estação LENKYX</span>
            <button type="button" onClick={() => setHubDrawerOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                onOpenPix('donate');
              }}
              className="py-2 px-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100"
            >
              💚 PIX QR
            </button>
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                onOpenPix('ranking');
              }}
              className="py-2 px-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-100"
            >
              👑 Ranking
            </button>
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                onOpenPix('collection');
              }}
              className="py-2 px-2 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-100 col-span-2"
            >
              👾 Meus Bonequinhos (1.000)
            </button>
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                onOpenUpdates();
              }}
              className="py-2 px-2 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-300" /> Atualizar
            </button>
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                onOpenInstall();
              }}
              className="py-2 px-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-black col-span-2"
            >
              📲 Baixar App PC / Celular / TV
            </button>
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                setWorldModal({ open: true, world: 'shopping', ideaPlanet: null });
              }}
              className="py-2 px-2 rounded-xl bg-orange-500/20 border border-orange-400/40 text-orange-200"
            >
              🛍️ Compras
            </button>
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                setWorldModal({ open: true, world: 'news', ideaPlanet: null });
              }}
              className="py-2 px-2 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-200"
            >
              📰 Notícias
            </button>
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                setWorldModal({ open: true, world: 'finance', ideaPlanet: null });
              }}
              className="py-2 px-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200"
            >
              ₿ Bitcoin & Bolsa
            </button>
            <button
              type="button"
              onClick={() => {
                setHubDrawerOpen(false);
                setWorldModal({ open: true, world: 'darkweb', ideaPlanet: null });
              }}
              className="py-2 px-2 rounded-xl bg-red-600/25 border border-red-500/50 text-red-200"
            >
              💀 Dark Web
            </button>
          </div>
        </div>
      )}

      {/* LIVING MULTIVERSE CONVERSATION DRAWER (AI ENTITIES + REAL USERS ONLINE) */}
      {commsOpen && (
        <div className="absolute bottom-4 right-3 left-3 sm:left-auto sm:w-[370px] z-30 rounded-3xl bg-slate-950/82 border border-cyan-400/40 backdrop-blur-2xl shadow-[0_16px_55px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[68dvh]">
          {/* Header + Mode Switch */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCommsMode('entity')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1 transition ${
                  commsMode === 'entity' ? 'bg-cyan-400 text-black' : 'bg-white/10 text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" /> Seres Vivos
              </button>
              <button
                type="button"
                onClick={() => setCommsMode('people')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1 transition ${
                  commsMode === 'people' ? 'bg-emerald-400 text-black' : 'bg-white/10 text-slate-200'
                }`}
              >
                <Users className="w-3 h-3" /> Pessoas Online
              </button>
            </div>
            <div className="flex items-center gap-1">
              {commsMode === 'entity' && (
                <button
                  type="button"
                  onClick={() => setVoiceReplyEnabled((v) => !v)}
                  className={`p-1.5 rounded-full border ${
                    voiceReplyEnabled
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                      : 'bg-white/5 border-white/15 text-slate-400'
                  }`}
                  title="Voz"
                >
                  {voiceReplyEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCommsOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Entity Avatar Picker */}
          {commsMode === 'entity' && (
            <div className="px-3 py-2 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(Object.values(PERSONAS) as PersonaMeta[]).map((p) => {
                const active = activePersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePersona(p.id)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black whitespace-nowrap flex items-center gap-1 border transition ${
                      active
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat Feed */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[160px]">
            {commsMode === 'people' && activeMessages.length === 0 && (
              <div className="text-center text-[11px] text-slate-400 py-6">
                Conectando viajantes online na galáxia...
              </div>
            )}
            {activeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">{msg.author}</span>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-sm'
                      : 'bg-white/10 border border-white/10 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick-Action Chips for Entity */}
          {commsMode === 'entity' && (
            <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {activePersonaMeta.quickPrompts.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => void handleSendComms(qp)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-cyan-400 hover:text-black border border-white/15 text-[10px] font-bold text-cyan-200 whitespace-nowrap transition shrink-0"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendComms();
            }}
            className="p-2.5 border-t border-white/10 flex items-center gap-2 bg-black/35"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={commsMode === 'people' ? 'Falar com pessoas online...' : `Falar com ${activePersonaMeta.name}...`}
              className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={sendingChat || !chatInput.trim()}
              className="p-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* HYPER-WARP / MULTIVERSE PORTAL SHATTER TRANSITION */}
      {warpingMeta && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center backdrop-blur-[3px] pointer-events-none"
          style={{
            background: warpingMeta.portal
              ? 'radial-gradient(circle at 50% 50%, rgba(251,146,60,0.48), rgba(236,72,153,0.3) 45%, rgba(0,0,0,0.92))'
              : 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.42), rgba(30,27,75,0.75) 55%, rgba(0,0,0,0.92))',
          }}
        >
          <div className="text-center space-y-2 animate-pulse">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/35 text-xs font-black tracking-widest text-white">
              <Radio className="w-3.5 h-3.5 text-amber-300" />
              <span>{warpingMeta.subtitle.toUpperCase()}</span>
            </div>
            <div className="font-display text-xl sm:text-3xl font-black tracking-[0.2em] text-amber-200">
              {warpingMeta.title.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* SPECIALIZED WORLDS (SHOPPING · NEWS · DARK WEB · BITCOIN/STOCKS · SATELLITES BRASIL+ QGIS · IDEA PLANETS) */}
      <GalaxyWorldsModal
        open={worldModal.open}
        world={worldModal.world}
        ideaPlanet={worldModal.ideaPlanet}
        user={null}
        onClose={() => setWorldModal((w) => ({ ...w, open: false }))}
        onSwitchWorld={(nextWorld) => setWorldModal({ open: true, world: nextWorld, ideaPlanet: null })}
        onOpenFreeCity={() => setFreeCityOpen(true)}
        onPlanetCreated={(newPlanet) => {
          setCustomPlanets((prev) => [newPlanet, ...prev]);
        }}
        onToast={onToast}
      />

      {/* WHATSAPP-STYLE GLOBAL VOICE & VIDEO CALLS WITH LIVE DUBBING */}
      <GlobalVoiceCallModal
        open={callsOpen}
        user={null}
        onClose={() => setCallsOpen(false)}
        onOpenBluetooth={() => setBluetoothOpen(true)}
        onToast={onToast}
      />

      {/* BLUETOOTH DEVICE CONNECTION & AUDIO OUTPUT ROUTING */}
      <BluetoothConnectModal
        open={bluetoothOpen}
        onClose={() => setBluetoothOpen(false)}
        onToast={onToast}
      />

      {/* SUBTLE LIVE GALAXY CONSCIOUSNESS + INTELLIGENT ROBOTS STATUS */}
      {!commsOpen && !freeCityOpen && (
        <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 max-w-[92vw]">
          <button
            type="button"
            onClick={() => setFreeCityOpen(true)}
            className="max-w-[78vw] sm:max-w-sm px-3 py-1.5 rounded-full bg-slate-950/65 hover:bg-slate-900/90 border border-cyan-400/35 backdrop-blur-xl flex items-center gap-2 text-left transition shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-[10px] font-bold text-cyan-100 truncate">{liveDecision}</span>
          </button>

          <button
            type="button"
            onClick={() => setRobotsModalOpen((v) => !v)}
            className="px-2.5 py-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900/90 border border-emerald-400/40 backdrop-blur-xl flex items-center gap-1.5 text-[10px] font-black text-emerald-200 transition shadow-lg"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-300" />
            <span>
              Robôs IA {galaxyRobots ? `· ${galaxyRobots.optimizationsCount}` : ''}
            </span>
          </button>
        </div>
      )}

      {/* LIVE WORKER ROBOTS MONITOR POPUP */}
      {robotsModalOpen && galaxyRobots && !freeCityOpen && (
        <div className="absolute bottom-14 left-3 z-30 w-80 max-w-[92vw] rounded-2xl bg-slate-950/92 border border-cyan-400/45 backdrop-blur-2xl p-3 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-black text-cyan-200">
            <span className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-300" /> Frota de Robôs IA ({galaxyRobots.healthScore}%)
            </span>
            <button type="button" onClick={() => setRobotsModalOpen(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {galaxyRobots.bots.map((b) => (
              <div key={b.id} className="p-2 rounded-xl bg-white/[0.05] border border-white/10">
                <div className="flex items-center justify-between text-[10px] font-black">
                  <span style={{ color: b.color }}>{b.name}</span>
                  <span className="text-emerald-300">{b.status}</span>
                </div>
                <div className="text-[10px] text-slate-300 leading-snug">{b.currentTask}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const localLang = encodeURIComponent(navigator.language || 'pt');
              void fetch(`/api/robots/optimize?lang=${localLang}`, { method: 'POST' })
                .then((r) => r.json())
                .then((d) => {
                  if (d?.ok && d.fleet) {
                    setGalaxyRobots(d.fleet);
                    onToast(`🤖 Frota IA otimizou o app em ${d.fleet.lastSweepMs}ms!`);
                  }
                });
            }}
            className="w-full py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black text-[11px] font-black"
          >
            ⚡ Turbinar Robôs Agora
          </button>
        </div>
      )}

      {/* FULL 3D GTA 6 + FREE GUY + READY PLAYER ONE LIVING ECOSYSTEM WORLD */}
      {freeCityOpen && (
        <CosmicPhonkWorldGame
          user={null}
          onToast={onToast}
          onExit={() => setFreeCityOpen(false)}
        />
      )}
    </div>
  );
};

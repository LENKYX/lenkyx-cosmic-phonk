import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  AudioWaveform,
  Compass,
  Clapperboard,
  Film,
  Gamepad2,
  Globe2,
  ListMusic,
  Music,
  Plane,
  Radio,
  Sparkles,
  Trophy,
  Wand2,
} from 'lucide-react';
import { TabId, Track } from '../types';

interface PlanetSpec {
  id: string;
  tabId: TabId;
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
  style: 'earth' | 'neon' | 'emerald' | 'saturn' | 'mars' | 'ice' | 'cyber' | 'amethyst' | 'arcade';
  icon: React.ReactNode;
}

const PLANET_SPECS: PlanetSpec[] = [
  {
    id: 'catalog',
    tabId: 'catalog',
    label: 'Músicas',
    planetName: 'Terra Sonora',
    orbitRadius: 15,
    orbitSpeed: 0.16,
    orbitPhase: 0.4,
    orbitTilt: 0.06,
    radius: 2.35,
    spinSpeed: 0.35,
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
    label: 'Reels & Lives',
    planetName: 'Nova Pulse',
    orbitRadius: 21,
    orbitSpeed: 0.125,
    orbitPhase: 1.55,
    orbitTilt: -0.09,
    radius: 2.15,
    spinSpeed: 0.55,
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
    orbitRadius: 27.5,
    orbitSpeed: 0.098,
    orbitPhase: 2.85,
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
    orbitRadius: 35,
    orbitSpeed: 0.075,
    orbitPhase: 4.05,
    orbitTilt: -0.06,
    radius: 2.95,
    spinSpeed: 0.26,
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
    orbitRadius: 42.5,
    orbitSpeed: 0.062,
    orbitPhase: 5.2,
    orbitTilt: 0.1,
    radius: 2.25,
    spinSpeed: 0.34,
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
    orbitRadius: 49.5,
    orbitSpeed: 0.052,
    orbitPhase: 0.95,
    orbitTilt: -0.07,
    radius: 2.4,
    spinSpeed: 0.42,
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
    orbitRadius: 56,
    orbitSpeed: 0.044,
    orbitPhase: 2.25,
    orbitTilt: 0.05,
    radius: 2.2,
    spinSpeed: 0.25,
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
    orbitRadius: 62.5,
    orbitSpeed: 0.038,
    orbitPhase: 3.5,
    orbitTilt: -0.08,
    radius: 2.1,
    spinSpeed: 0.31,
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
    orbitRadius: 69,
    orbitSpeed: 0.032,
    orbitPhase: 4.75,
    orbitTilt: 0.07,
    radius: 2.25,
    spinSpeed: 0.48,
    accentHex: '#a3e635',
    atmosphereHex: '#22c55e',
    hasRing: true,
    ringColor: '#84cc16',
    moons: 0,
    hasSatellite: true,
    style: 'arcade',
    icon: <Gamepad2 className="w-3.5 h-3.5" />,
  },
];

/* === PROCEDURAL HIGH-DETAIL COSMIC TEXTURE GENERATORS === */
function createSunTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, '#ff8800');
  grad.addColorStop(0.5, '#ffbb24');
  grad.addColorStop(1, '#ff6a00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 650; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = 3 + Math.random() * 22;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const hot = Math.random() > 0.3;
    g.addColorStop(0, hot ? 'rgba(255,255,215,0.62)' : 'rgba(180,35,0,0.45)');
    g.addColorStop(1, 'rgba(255,140,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createPlanetTexture(style: PlanetSpec['style']): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  const palettes: Record<PlanetSpec['style'], [string, string, string, string]> = {
    earth: ['#0b3b75', '#1565c0', '#2e7d32', '#e2f1ff'],
    neon: ['#240046', '#7b2cbf', '#ff007f', '#00f5d4'],
    emerald: ['#053b3f', '#0d7377', '#32e0c4', '#fde68a'],
    saturn: ['#925e2b', '#d9a45b', '#f3d28f', '#78350f'],
    mars: ['#5c140e', '#a8331c', '#e06d3b', '#ffba82'],
    ice: ['#0c2d57', '#1d6fa5', '#7dd3fc', '#f0f9ff'],
    cyber: ['#071326', '#0f294d', '#06b6d4', '#facc15'],
    amethyst: ['#240b42', '#5b21b6', '#c084fc', '#5eead4'],
    arcade: ['#071e16', '#114232', '#22c55e', '#bef264'],
  };
  const [c1, c2, c3, c4] = palettes[style];

  const base = ctx.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, c4);
  base.addColorStop(0.14, c1);
  base.addColorStop(0.5, c2);
  base.addColorStop(0.86, c1);
  base.addColorStop(1, c4);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 256);

  if (style === 'saturn' || style === 'neon' || style === 'ice' || style === 'amethyst') {
    // Gas giant atmospheric storm bands & Great Spots
    for (let y = 12; y < 244; y += 6 + Math.random() * 8) {
      ctx.fillStyle = Math.random() > 0.5 ? c3 : c4;
      ctx.globalAlpha = 0.14 + Math.random() * 0.28;
      ctx.fillRect(0, y, 512, 2 + Math.random() * 7);
    }
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 8; i++) {
      const sx = Math.random() * 512;
      const sy = 40 + Math.random() * 176;
      const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 26);
      g.addColorStop(0, c4);
      g.addColorStop(0.5, c3);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 28, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (style === 'cyber' || style === 'arcade') {
    // Futuristic illuminated orbital grid & neural circuit continents
    ctx.strokeStyle = c3;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.42;
    for (let x = 0; x < 512; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 42; i++) {
      const x = Math.random() * 512;
      const y = 30 + Math.random() * 196;
      ctx.fillStyle = i % 3 === 0 ? c4 : c3;
      ctx.fillRect(x, y, 6 + Math.random() * 18, 2 + Math.random() * 5);
    }
    ctx.globalAlpha = 1;
  } else {
    // Organic rocky continents, craters, polar caps
    for (let i = 0; i < 85; i++) {
      const x = Math.random() * 512;
      const y = 26 + Math.random() * 204;
      const rx = 12 + Math.random() * 44;
      const ry = 8 + Math.random() * 24;
      const g = ctx.createRadialGradient(x, y, 2, x, y, rx);
      g.addColorStop(0, c3);
      g.addColorStop(0.7, c2);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createCloudTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * 512;
    const y = 16 + Math.random() * 224;
    const rx = 14 + Math.random() * 42;
    const ry = 5 + Math.random() * 14;
    const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
    g.addColorStop(0, 'rgba(255,255,255,0.58)');
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
  for (let i = 0; i < 65; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 128;
    const r = 2 + Math.random() * 10;
    ctx.fillStyle = 'rgba(71,85,105,0.45)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(248,250,252,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function createRingTexture(colorHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 32;
  const ctx = c.getContext('2d')!;
  for (let x = 0; x < 256; x++) {
    const n = x / 256;
    const band = Math.sin(n * 42) * 0.5 + 0.5;
    const edgeFade = Math.sin(n * Math.PI);
    const cassiniGap = n > 0.58 && n < 0.65 ? 0.12 : 1;
    ctx.fillStyle = colorHex;
    ctx.globalAlpha = Math.max(0.04, band * edgeFade * cassiniGap * 0.85);
    ctx.fillRect(x, 0, 1, 32);
  }
  return new THREE.CanvasTexture(c);
}

function createGlowSpriteTexture(innerColor: string, midColor: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  g.addColorStop(0, innerColor);
  g.addColorStop(0.28, midColor);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function createSolarPanelTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#072448';
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

/* === 3D SATELLITE BUILDER === */
function buildSatelliteMesh(solarTex: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.52, 6),
    new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.88, roughness: 0.22 })
  );
  body.rotation.z = Math.PI / 2;
  g.add(body);

  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.16, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide })
  );
  dish.position.set(0, 0.22, 0);
  dish.rotation.x = Math.PI;
  g.add(dish);

  const wingMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    metalness: 0.55,
    roughness: 0.25,
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.25,
  });
  const wingGeo = new THREE.BoxGeometry(0.1, 0.03, 1.15);
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(0, 0, 0.82);
  g.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0, 0, -0.82);
  g.add(rightWing);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#22d3ee' })
  );
  beacon.position.set(0.3, 0, 0);
  beacon.name = 'beacon';
  g.add(beacon);

  return g;
}

/* === 3D ALIEN UFO STARSHIP BUILDER === */
function buildUfoMesh(beamColor: string): THREE.Group {
  const ufo = new THREE.Group();

  // Metallic saucer disc
  const hull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 1.35, 0.32, 28),
    new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.92,
      roughness: 0.18,
      emissive: new THREE.Color('#0f172a'),
      emissiveIntensity: 0.4,
    })
  );
  ufo.add(hull);

  const underHull = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 0.52, 0.24, 28),
    new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.85, roughness: 0.25 })
  );
  underHull.position.y = -0.26;
  ufo.add(underHull);

  // Translucent glass cockpit + glowing alien silhouette inside
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

  // Rotating plasma ring lights around the saucer
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

  // Volumetric Tractor Beam cone underneath
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(1.25, 4.2, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: beamColor,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  beam.position.y = -2.35;
  beam.name = 'tractorBeam';
  ufo.add(beam);

  return ufo;
}

function playAlienChirp() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.34);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
    setTimeout(() => void ctx.close().catch(() => {}), 500);
  } catch {
    // ignore audio policy
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

interface Props {
  currentTrack: Track | null;
  isPlaying: boolean;
  onNavigateTab: (tab: TabId) => void;
  onOpenVisualizer: () => void;
  onToast: (msg: string) => void;
}

export const GalaxyUniverseView: React.FC<Props> = ({
  currentTrack,
  isPlaying,
  onNavigateTab,
  onOpenVisualizer,
  onToast,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [warpingTo, setWarpingTo] = useState<PlanetSpec | null>(null);
  const [ufoBanner, setUfoBanner] = useState<string | null>(null);
  const [tags, setTags] = useState<Record<string, ProjectedTag>>({});

  const hoveredRef = useRef<string | null>(null);
  hoveredRef.current = hoveredId;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Camera spherical state & warp lock refs so controls feel buttery-smooth
  const camControlRef = useRef({
    theta: 0.45,
    phi: 1.06,
    radius: 56,
    targetTheta: 0.45,
    targetPhi: 1.06,
    targetRadius: 56,
    lookTarget: new THREE.Vector3(0, 0, 0),
    desiredLook: new THREE.Vector3(0, 0, 0),
    warpActive: false,
    warpTargetPos: new THREE.Vector3(0, 0, 0),
    reset: () => {
      camControlRef.current.targetTheta = 0.45;
      camControlRef.current.targetPhi = 1.06;
      camControlRef.current.targetRadius = window.innerWidth < 768 ? 68 : 54;
      camControlRef.current.desiredLook.set(0, 0, 0);
    },
  });

  const planetMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const triggerWarpRef = useRef<(spec: PlanetSpec) => void>(() => {});

  const handleWarpToPlanet = (spec: PlanetSpec) => {
    triggerWarpRef.current(spec);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight - 120;
    camControlRef.current.targetRadius = width < 768 ? 68 : 54;
    camControlRef.current.radius = camControlRef.current.targetRadius;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#07041a', 0.0028);

    const camera = new THREE.PerspectiveCamera(56, width / height, 0.2, 650);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    container.appendChild(renderer.domElement);

    /* === BRIGHT COSMIC ILLUMINATION (Sun + Hemisphere + Rim) === */
    const sunLight = new THREE.PointLight('#fff4d6', 4.6, 260, 0.35);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight('#a5f3fc', '#3b0764', 1.15);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight('#c084fc', 0.85);
    rimLight.position.set(-40, 35, -35);
    scene.add(rimLight);

    const disposables: { dispose: () => void }[] = [];
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      disposables.push(t);
      return t;
    };

    /* === CENTRAL PHOTOREALISTIC SUN === */
    const sunGroup = new THREE.Group();
    const sunTex = trackTex(createSunTexture());
    const sunGeo = new THREE.SphereGeometry(5.6, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    disposables.push(sunGeo, sunMat);
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.userData = { kind: 'sun' };
    sunGroup.add(sunMesh);

    const coronaTex1 = trackTex(createGlowSpriteTexture('rgba(255,250,210,0.95)', 'rgba(251,146,60,0.48)'));
    const coronaSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: coronaTex1,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    coronaSprite.scale.set(22, 22, 1);
    sunGroup.add(coronaSprite);

    const coronaTex2 = trackTex(createGlowSpriteTexture('rgba(103,232,249,0.55)', 'rgba(236,72,153,0.22)'));
    const coronaOuter = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: coronaTex2,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    coronaOuter.scale.set(34, 34, 1);
    sunGroup.add(coronaOuter);

    // Solar prominence energy arcs
    const solarRingGeo = new THREE.TorusGeometry(6.7, 0.08, 12, 90);
    const solarRingMat = new THREE.MeshBasicMaterial({
      color: '#fde047',
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(solarRingGeo, solarRingMat);
    const solarRing1 = new THREE.Mesh(solarRingGeo, solarRingMat);
    solarRing1.rotation.x = 0.7;
    sunGroup.add(solarRing1);
    const solarRing2 = new THREE.Mesh(solarRingGeo, solarRingMat);
    solarRing2.rotation.y = 0.9;
    solarRing2.rotation.x = -0.45;
    sunGroup.add(solarRing2);
    scene.add(sunGroup);

    /* === SPIRAL GALAXY STARS + VOLUMETRIC NEBULA CLOUDS === */
    const starCount = 4600;
    const starPos = new Float32Array(starCount * 3);
    const starCols = new Float32Array(starCount * 3);
    const starPalette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#bae6fd'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#f9a8d4'),
      new THREE.Color('#c4b5fd'),
    ];
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      if (i < 2600) {
        // Spiral galactic arms
        const arm = i % 3;
        const r = 18 + Math.pow(Math.random(), 0.85) * 185;
        const angle = arm * ((Math.PI * 2) / 3) + r * 0.036 + (Math.random() - 0.5) * 0.85;
        starPos[i3] = Math.cos(angle) * r;
        starPos[i3 + 1] = (Math.random() - 0.5) * (12 + r * 0.14);
        starPos[i3 + 2] = Math.sin(angle) * r;
      } else {
        // Spherical deep-space stars all around camera
        const r = 90 + Math.random() * 190;
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
      size: 0.72,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push(starGeo, starMat);
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Nebula luminous clouds floating around the galactic plane
    const nebTexPink = trackTex(createGlowSpriteTexture('rgba(236,72,153,0.22)', 'rgba(139,92,246,0.08)'));
    const nebTexCyan = trackTex(createGlowSpriteTexture('rgba(56,189,248,0.22)', 'rgba(16,185,129,0.08)'));
    for (let i = 0; i < 18; i++) {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: i % 2 === 0 ? nebTexPink : nebTexCyan,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        })
      );
      const a = (i / 18) * Math.PI * 2;
      const dist = 48 + (i % 3) * 28;
      sp.position.set(Math.cos(a) * dist, ((i % 5) - 2) * 5, Math.sin(a) * dist);
      const sz = 44 + (i % 4) * 14;
      sp.scale.set(sz, sz, 1);
      scene.add(sp);
    }

    /* === ASTEROID BELT BETWEEN INNER & OUTER WORLDS === */
    const asteroidCount = 480;
    const astPos = new Float32Array(asteroidCount * 3);
    for (let i = 0; i < asteroidCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 30.5 + (Math.random() - 0.5) * 3.6;
      astPos[i * 3] = Math.cos(a) * r;
      astPos[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
      astPos[i * 3 + 2] = Math.sin(a) * r;
    }
    const astGeo = new THREE.BufferGeometry();
    astGeo.setAttribute('position', new THREE.BufferAttribute(astPos, 3));
    const astMat = new THREE.PointsMaterial({ color: '#cbd5e1', size: 0.34, transparent: true, opacity: 0.78 });
    disposables.push(astGeo, astMat);
    const asteroidBelt = new THREE.Points(astGeo, astMat);
    scene.add(asteroidBelt);

    /* === BUILD ALL 9 PLANETS + ORBITS + MOONS + SATELLITES === */
    const moonTex = trackTex(createMoonTexture());
    const cloudTex = trackTex(createCloudTexture());
    const solarPanelTex = trackTex(createSolarPanelTexture());
    const sphereGeoShared = new THREE.SphereGeometry(1, 36, 36);
    disposables.push(sphereGeoShared);

    interface PlanetRuntime {
      spec: PlanetSpec;
      pivot: THREE.Group;
      surface: THREE.Mesh;
      clouds?: THREE.Mesh;
      moons: THREE.Group[];
      satellite?: THREE.Group;
      hitTarget: THREE.Mesh;
    }

    const planetRuntimes: PlanetRuntime[] = [];
    const clickableObjects: THREE.Object3D[] = [sunMesh];
    planetMeshesRef.current.clear();

    PLANET_SPECS.forEach((spec) => {
      // Glowing thin orbit ring
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
      const orbitMat = new THREE.LineBasicMaterial({
        color: spec.accentHex,
        transparent: true,
        opacity: 0.24,
      });
      disposables.push(orbitGeo, orbitMat);
      scene.add(new THREE.Line(orbitGeo, orbitMat));

      const pivot = new THREE.Group();
      scene.add(pivot);
      planetMeshesRef.current.set(spec.id, pivot);

      const pTex = trackTex(createPlanetTexture(spec.style));
      const pMat = new THREE.MeshStandardMaterial({
        map: pTex,
        roughness: spec.style === 'ice' || spec.style === 'cyber' ? 0.35 : 0.65,
        metalness: spec.style === 'cyber' || spec.style === 'arcade' ? 0.45 : 0.1,
        emissive: new THREE.Color(spec.accentHex),
        emissiveIntensity: 0.14,
      });
      disposables.push(pMat);
      const surface = new THREE.Mesh(sphereGeoShared, pMat);
      surface.scale.setScalar(spec.radius);
      surface.userData = { kind: 'planet', spec };
      pivot.add(surface);
      clickableObjects.push(surface);

      // Invisible generous raycast hitbox for effortless finger tap on mobile
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      disposables.push(hitMat);
      const hitTarget = new THREE.Mesh(sphereGeoShared, hitMat);
      hitTarget.scale.setScalar(spec.radius * 1.55);
      hitTarget.userData = { kind: 'planet', spec };
      pivot.add(hitTarget);
      clickableObjects.push(hitTarget);

      // Atmospheric halo sprite
      const haloTex = trackTex(createGlowSpriteTexture(`${spec.atmosphereHex}66`, `${spec.atmosphereHex}18`));
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTex,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        })
      );
      halo.scale.setScalar(spec.radius * 3.4);
      pivot.add(halo);

      let clouds: THREE.Mesh | undefined;
      if (spec.hasClouds) {
        const cMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        });
        disposables.push(cMat);
        clouds = new THREE.Mesh(sphereGeoShared, cMat);
        clouds.scale.setScalar(spec.radius * 1.03);
        pivot.add(clouds);
      }

      if (spec.hasRing) {
        const rGeo = new THREE.RingGeometry(spec.radius * 1.38, spec.radius * 2.28, 72);
        const rTex = trackTex(createRingTexture(spec.ringColor || spec.accentHex));
        const rMat = new THREE.MeshBasicMaterial({
          map: rTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        });
        disposables.push(rGeo, rMat);
        const ring = new THREE.Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 2 - 0.35;
        ring.rotation.y = 0.25;
        pivot.add(ring);
      }

      // Orbiting Moons
      const moons: THREE.Group[] = [];
      for (let m = 0; m < spec.moons; m++) {
        const moonPivot = new THREE.Group();
        const mMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.88, metalness: 0.05 });
        disposables.push(mMat);
        const moonMesh = new THREE.Mesh(sphereGeoShared, mMat);
        moonMesh.scale.setScalar(0.32 + m * 0.08);
        moonMesh.position.set(spec.radius * (1.7 + m * 0.65), 0.25 * (m === 0 ? 1 : -1), 0);
        moonPivot.add(moonMesh);
        moonPivot.rotation.z = 0.2 * (m + 1);
        pivot.add(moonPivot);
        moons.push(moonPivot);
      }

      // Orbiting Satellite
      let satellite: THREE.Group | undefined;
      if (spec.hasSatellite) {
        satellite = buildSatelliteMesh(solarPanelTex);
        satellite.scale.setScalar(0.75);
        satellite.userData = { kind: 'satellite', name: `Satélite ${spec.planetName}` };
        pivot.add(satellite);
        clickableObjects.push(satellite);
      }

      planetRuntimes.push({ spec, pivot, surface, clouds, moons, satellite, hitTarget });
    });

    /* === DEEP-SPACE CRUISING ALIEN UFO STARSHIPS === */
    const ufo1 = buildUfoMesh('#34d399');
    ufo1.scale.setScalar(1.35);
    ufo1.userData = { kind: 'ufo', label: '🛸 Nave Alienígena Alpha — Scan Galáctico' };
    scene.add(ufo1);
    clickableObjects.push(ufo1);

    const ufo2 = buildUfoMesh('#22d3ee');
    ufo2.scale.setScalar(1.1);
    ufo2.userData = { kind: 'ufo', label: '🛸 Explorador Cósmico Omega — Setor 7' };
    scene.add(ufo2);
    clickableObjects.push(ufo2);

    /* === SHOOTING STARS (METEOR STREAKS) === */
    const meteorGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(4.5, -1.6, 1.2),
    ]);
    const meteorMat = new THREE.LineBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.85 });
    disposables.push(meteorGeo, meteorMat);
    const meteors = Array.from({ length: 4 }, (_, idx) => {
      const line = new THREE.Line(meteorGeo, meteorMat);
      line.position.set((idx - 2) * 30, 18 + idx * 6, -45);
      scene.add(line);
      return { line, speed: 34 + idx * 11, phase: idx * 2.1 };
    });

    /* === INTERACTION: ORBIT DRAG, WHEEL ZOOM, PINCH, RAYCAST TAP === */
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
      setWarpingTo(spec);
      setTimeout(() => {
        onNavigateTab(spec.tabId);
      }, 560);
    };
    triggerWarpRef.current = triggerWarp;

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
      while (obj && !obj.userData?.kind) {
        obj = obj.parent;
      }
      if (!obj) return;
      const { kind, spec, label, name } = obj.userData as {
        kind?: string;
        spec?: PlanetSpec;
        label?: string;
        name?: string;
      };
      if (kind === 'planet' && spec) {
        triggerWarp(spec);
      } else if (kind === 'sun') {
        onOpenVisualizer();
      } else if (kind === 'ufo') {
        playAlienChirp();
        setUfoBanner(label || '🛸 Contato Alienígena Detectado!');
        onToast('🛸 Nave Alienígena escaneou sua galáxia! Escolha qualquer planeta para explorar.');
        setTimeout(() => setUfoBanner(null), 3200);
      } else if (kind === 'satellite') {
        onToast(`🛰️ ${name || 'Satélite Orbital LENKYX'} transmitindo em 4K sem anúncios!`);
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
      const h = container.clientHeight || window.innerHeight - 120;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    /* === 60FPS ANIMATION LOOP === */
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

      // Sun rotation & audio-reactive corona pulse
      sunMesh.rotation.y += dt * 0.16;
      solarRing1.rotation.z += dt * 0.45;
      solarRing2.rotation.z -= dt * 0.35;
      const pulse = isPlayingRef.current ? 1 + Math.sin(simTime * 7.5) * 0.1 : 1 + Math.sin(simTime * 2) * 0.03;
      coronaSprite.scale.set(22 * pulse, 22 * pulse, 1);
      coronaOuter.scale.set(34 * pulse, 34 * pulse, 1);

      // Gentle drift on galactic starfield & asteroid belt
      starField.rotation.y += dt * 0.008;
      asteroidBelt.rotation.y += dt * 0.035;

      // Planets orbit + axial spin + moons + satellites
      for (const rt of planetRuntimes) {
        const ang = rt.spec.orbitPhase + simTime * rt.spec.orbitSpeed;
        rt.pivot.position.set(
          Math.cos(ang) * rt.spec.orbitRadius,
          Math.sin(ang) * rt.spec.orbitRadius * Math.sin(rt.spec.orbitTilt),
          Math.sin(ang) * rt.spec.orbitRadius
        );
        const isHov = hoveredRef.current === rt.spec.id;
        const targetScale = isHov ? 1.14 : 1;
        rt.surface.scale.lerp(new THREE.Vector3(rt.spec.radius * targetScale, rt.spec.radius * targetScale, rt.spec.radius * targetScale), 0.12);
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

      // Alien UFO Starships flying 3D Lissajous paths across the galaxy
      const u1t = simTime * 0.34;
      ufo1.position.set(Math.cos(u1t) * 26, Math.sin(u1t * 2.1) * 7.5 + 3.5, Math.sin(u1t * 0.8) * 24);
      ufo1.rotation.y += dt * 1.4;
      ufo1.rotation.z = Math.sin(u1t * 2) * 0.12;
      const rim1 = ufo1.getObjectByName('rimLights');
      if (rim1) rim1.rotation.y -= dt * 3.5;

      const u2t = simTime * 0.24 + 2.5;
      ufo2.position.set(Math.sin(u2t) * 44, Math.cos(u2t * 1.7) * 9 - 2, Math.cos(u2t * 0.9) * 40);
      ufo2.rotation.y -= dt * 1.7;
      ufo2.rotation.x = Math.cos(u2t * 1.5) * 0.1;
      const rim2 = ufo2.getObjectByName('rimLights');
      if (rim2) rim2.rotation.y += dt * 3.8;

      // Shooting stars
      meteors.forEach((m) => {
        const cycle = ((simTime + m.phase) % 5.5) / 5.5;
        m.line.position.x = -75 + cycle * 155;
        m.line.position.y = 32 - cycle * 44;
        m.line.visible = cycle < 0.25;
      });

      // Camera smooth physics + warp hyper-jump
      const ctrl = camControlRef.current;
      if (ctrl.warpActive) {
        camera.position.lerp(ctrl.warpTargetPos, 0.12);
        camera.fov = THREE.MathUtils.lerp(camera.fov, 92, 0.12);
        camera.updateProjectionMatrix();
        camera.lookAt(ctrl.warpTargetPos);
      } else {
        if (!dragging) {
          ctrl.targetTheta += dt * 0.022; // gentle cosmic drift so you feel inside space
        }
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

      // Hover raycast check (desktop pointer)
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

      // Update projected 2D holographic labels at ~30fps so React stays silky-light
      tagFrameSkip = (tagFrameSkip + 1) % 2;
      if (tagFrameSkip === 0) {
        const w = domEl.clientWidth || width;
        const h = domEl.clientHeight || height;
        const nextTags: Record<string, ProjectedTag> = {};

        // Sun label
        tempVec.set(0, 6.8, 0).project(camera);
        nextTags['sun'] = {
          id: 'sun',
          x: (tempVec.x * 0.5 + 0.5) * w,
          y: (-tempVec.y * 0.5 + 0.5) * h,
          visible: tempVec.z < 1 && tempVec.z > -1,
          scale: 1,
          depth: tempVec.z,
        };

        for (const rt of planetRuntimes) {
          tempVec.copy(rt.pivot.position);
          tempVec.y += rt.spec.radius + 1.35;
          const dist = camera.position.distanceTo(rt.pivot.position);
          tempVec.project(camera);
          const onScreen =
            tempVec.z < 1 &&
            tempVec.z > -1 &&
            tempVec.x >= -0.95 &&
            tempVec.x <= 0.95 &&
            tempVec.y >= -0.95 &&
            tempVec.y <= 0.95;
          nextTags[rt.spec.id] = {
            id: rt.spec.id,
            x: (tempVec.x * 0.5 + 0.5) * w,
            y: (-tempVec.y * 0.5 + 0.5) * h,
            visible: onScreen,
            scale: Math.max(0.76, Math.min(1.12, 48 / Math.max(20, dist))),
            depth: dist,
          };
        }
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
  }, [onNavigateTab, onOpenVisualizer, onToast]);

  const sortedPlanetsForDock = useMemo(() => PLANET_SPECS, []);

  return (
    <div className="relative w-full h-[calc(100dvh-132px)] md:h-[calc(100dvh-90px)] min-h-[460px] rounded-3xl overflow-hidden border border-cyan-400/20 shadow-[0_0_60px_rgba(56,189,248,0.16)] bg-[#060318]">
      {/* 3D WebGL Space Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full touch-none" />

      {/* 3D-Projected Holographic Planet Labels (Clean, Zero Clutter) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {tags['sun']?.visible && (
          <button
            type="button"
            onClick={onOpenVisualizer}
            style={{
              transform: `translate(-50%, -50%) translate3d(${tags['sun'].x}px, ${tags['sun'].y}px, 0)`,
            }}
            className="pointer-events-auto absolute top-0 left-0 px-2.5 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/60 backdrop-blur-md text-[10px] font-black text-amber-100 flex items-center gap-1.5 shadow-[0_0_18px_rgba(251,191,36,0.45)] transition-colors"
          >
            <AudioWaveform className={`w-3 h-3 text-amber-300 ${isPlaying ? 'animate-pulse' : ''}`} />
            <span>{isPlaying && currentTrack ? currentTrack.title : 'Sol LENKYX'}</span>
          </button>
        )}

        {PLANET_SPECS.map((spec) => {
          const tag = tags[spec.id];
          if (!tag?.visible) return null;
          const isHov = hoveredId === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => handleWarpToPlanet(spec)}
              onMouseEnter={() => setHoveredId(spec.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                transform: `translate(-50%, -50%) translate3d(${tag.x}px, ${tag.y}px, 0) scale(${tag.scale})`,
                zIndex: Math.round(1000 - tag.depth),
              }}
              className={`pointer-events-auto absolute top-0 left-0 px-2.5 py-1 rounded-full backdrop-blur-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-lg ${
                isHov
                  ? 'bg-white text-black border-white shadow-[0_0_22px_rgba(255,255,255,0.6)]'
                  : 'bg-slate-950/65 hover:bg-slate-900/85 text-white border-white/25'
              }`}
            >
              <span style={{ color: isHov ? '#000' : spec.accentHex }}>{spec.icon}</span>
              <span className="text-[11px] font-black tracking-wide">{spec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Minimal Top Floating Controls (Icon-Driven, Zero Instruction Text) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/65 border border-cyan-300/35 backdrop-blur-xl shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="font-display text-[11px] font-black tracking-[0.16em] text-white">GALÁXIA 3D</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenVisualizer}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400/25 to-pink-500/25 hover:from-amber-400/40 hover:to-pink-500/40 border border-amber-300/45 backdrop-blur-xl text-amber-100 text-[11px] font-black flex items-center gap-1.5 shadow-lg transition"
            title="Espectro Cósmico"
          >
            <AudioWaveform className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Espectro</span>
          </button>

          <button
            type="button"
            onClick={() => camControlRef.current.reset()}
            className="p-2 rounded-full bg-slate-950/65 hover:bg-white/15 border border-white/20 backdrop-blur-xl text-cyan-200 transition shadow-lg"
            title="Centralizar Galáxia"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* UFO Scan Badge (only appears briefly when tapping an alien ship) */}
      {ufoBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-300/60 backdrop-blur-xl text-emerald-100 text-xs font-black flex items-center gap-2 shadow-[0_0_25px_rgba(52,211,153,0.45)] animate-pulse">
          <Radio className="w-3.5 h-3.5 text-emerald-300" />
          <span>{ufoBanner}</span>
        </div>
      )}

      {/* Hyper-Warp Transition Overlay when flying into a planet */}
      {warpingTo && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-[2px] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.34), rgba(30,27,75,0.75) 55%, rgba(0,0,0,0.92))',
          }}
        >
          <div className="text-center space-y-2 animate-pulse">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/35 text-xs font-black tracking-widest text-white">
              {warpingTo.icon}
              <span>{warpingTo.planetName.toUpperCase()}</span>
            </div>
            <div className="font-display text-lg sm:text-2xl font-black tracking-[0.2em] text-cyan-200">
              {warpingTo.label.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Sleek Bottom Quick-Orbit Planet Dock */}
      <div className="absolute bottom-3 inset-x-3 z-10 flex justify-center pointer-events-none">
        <div className="pointer-events-auto max-w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-950/70 border border-white/15 backdrop-blur-xl overflow-x-auto no-scrollbar shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
          {sortedPlanetsForDock.map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => handleWarpToPlanet(spec)}
              onMouseEnter={() => setHoveredId(spec.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/20 border border-white/10 text-[11px] font-bold text-white flex items-center gap-1.5 whitespace-nowrap transition shrink-0"
            >
              <span style={{ color: spec.accentHex }}>{spec.icon}</span>
              <span>{spec.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Activity,
  ArrowLeft,
  Bike,
  Bot,
  Brain,
  Bug,
  Car,
  CloudRain,
  Compass,
  Eye,
  Footprints,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  Sparkles,
  Sun,
  Trees,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types';

interface RobotFleetState {
  optimizationsCount: number;
  lastSweepMs: number;
  memoryMb: number;
  healthScore: number;
  bots: {
    id: string;
    name: string;
    role: string;
    color: string;
    status: string;
    efficiencyPct: number;
    actionsDone: number;
    currentTask: string;
  }[];
  logs: { id: string; ts: string; botId: string; action: string }[];
}

interface EcosystemSnapshot {
  cycleTick?: number;
  evolutionEpoch?: number;
  timeOfDay: number;
  weather: string;
  temperatureC: number;
  oxygenPct: number;
  soilFertilityPct: number;
  biodiversityIndex: number;
  galaxyMood: string;
  atmosphere?: {
    pressureHpa: number;
    humidityPct: number;
    windSpeedKmh: number;
    windDirection: string;
    cloudCoverPct: number;
    uvIndex: number;
    airQualityIndex: number;
    visibilityKm: number;
    rainIntensity: number;
    auroraIntensity: number;
    phase: string;
  };
  speciesCounts: {
    bacteriaBillions: number;
    plantsAndFlowers: number;
    trees: number;
    insects: number;
    birds: number;
    landAnimals: number;
    marineLife: number;
    consciousNpcs: number;
    activeVehicles: number;
  };
  guyState: {
    name: string;
    mood: string;
    currentGoal: string;
    location: string;
  };
  decisions: { id: string; ts: string; domain: string; decision: string }[];
}

interface Props {
  user: UserProfile | null;
  onToast: (msg: string) => void;
  onExit?: () => void;
}

function createWindowTexture(accentHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#090d1a';
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 248; y += 16) {
    for (let x = 8; x < 120; x += 14) {
      const lit = Math.random() > 0.32;
      ctx.fillStyle = lit ? (Math.random() > 0.8 ? accentHex : '#fef08a') : '#162038';
      ctx.globalAlpha = lit ? 0.45 + Math.random() * 0.5 : 0.7;
      ctx.fillRect(x, y, 8, 10);
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildCarMesh(colorHex: string): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.78,
    roughness: 0.22,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.9,
    roughness: 0.1,
  });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.58, 4.35), bodyMat);
  chassis.position.y = 0.52;
  g.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.52, 2.2), glassMat);
  cabin.position.set(0, 1.0, -0.15);
  g.add(cabin);

  const underglow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 4.4),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  underglow.rotation.x = Math.PI / 2;
  underglow.position.y = 0.05;
  g.add(underglow);

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.7 });
  [
    [-1.02, 0.38, 1.35],
    [1.02, 0.38, 1.35],
    [-1.02, 0.38, -1.35],
    [1.02, 0.38, -1.35],
  ].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    g.add(w);
  });

  // Headlights & Taillights
  const headMat = new THREE.MeshBasicMaterial({ color: '#fef9c3' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  [-0.68, 0.68].forEach((x) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.1), headMat);
    hl.position.set(x, 0.55, 2.18);
    g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.1), tailMat);
    tl.position.set(x, 0.58, -2.18);
    g.add(tl);
  });

  return g;
}

function buildMotorcycleMesh(colorHex: string): THREE.Group {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.85, roughness: 0.2 });
  const wheelGeo = new THREE.TorusGeometry(0.36, 0.11, 10, 20);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 });

  const fw = new THREE.Mesh(wheelGeo, wheelMat);
  fw.rotation.y = Math.PI / 2;
  fw.position.set(0, 0.42, 0.88);
  g.add(fw);

  const rw = new THREE.Mesh(wheelGeo, wheelMat);
  rw.rotation.y = Math.PI / 2;
  rw.position.set(0, 0.42, -0.88);
  g.add(rw);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 1.55), frameMat);
  body.position.set(0, 0.72, 0);
  g.add(body);

  const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshBasicMaterial({ color: '#67e8f9' }));
  headlight.position.set(0, 0.92, 0.9);
  g.add(headlight);

  return g;
}

const SKIN_TONES = ['#f5cfa0', '#e0ac69', '#c68642', '#8d5524', '#f1c27d', '#d2996c'];
const HAIR_TONES = ['#18181b', '#3f2a1d', '#78350f', '#d97706', '#0f172a'];

function buildHumanMesh(shirtColor: string, isGuy = false, variantIdx = 0): THREE.Group {
  const g = new THREE.Group();
  const skinHex = isGuy ? '#f1c27d' : SKIN_TONES[variantIdx % SKIN_TONES.length];
  const hairHex = isGuy ? '#3b2416' : HAIR_TONES[(variantIdx * 2) % HAIR_TONES.length];
  const skin = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.56, metalness: 0.04 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.72 });
  const shirt = new THREE.MeshStandardMaterial({
    color: shirtColor,
    roughness: 0.68,
    emissive: isGuy ? new THREE.Color('#0284c7') : new THREE.Color('#000000'),
    emissiveIntensity: isGuy ? 0.16 : 0,
  });
  const pants = new THREE.MeshStandardMaterial({
    color: isGuy ? '#c8b288' : variantIdx % 2 === 0 ? '#1e293b' : '#334155',
    roughness: 0.78,
  });
  const shoeMat = new THREE.MeshStandardMaterial({ color: isGuy ? '#f8fafc' : '#0f172a', roughness: 0.5 });

  // Torso / Chest / Hips / Collar
  const upperBody = new THREE.Group();
  upperBody.name = 'torso';
  upperBody.position.y = 0.88;
  g.add(upperBody);

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.145, 0.16, 14), pants);
  pelvis.scale.set(1.25, 1, 0.82);
  pelvis.position.y = 0.04;
  upperBody.add(pelvis);

  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.05, 14),
    new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.35, metalness: 0.4 })
  );
  belt.scale.set(1.25, 1, 0.84);
  belt.position.y = 0.12;
  upperBody.add(belt);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.15, 0.44, 16), shirt);
  chest.scale.set(1.28, 1, 0.78);
  chest.position.y = 0.35;
  upperBody.add(chest);

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), shirt);
  shoulders.scale.set(1.32, 0.5, 0.76);
  shoulders.position.y = 0.54;
  upperBody.add(shoulders);

  if (isGuy) {
    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.28, 0.03),
      new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.5 })
    );
    tie.position.set(0, 0.39, 0.155);
    upperBody.add(tie);
  }

  // Neck & Sculpted Realistic Head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.072, 0.12, 12), skin);
  neck.position.y = 0.62;
  upperBody.add(neck);

  const headPivot = new THREE.Group();
  headPivot.name = 'head';
  headPivot.position.y = 0.76;
  upperBody.add(headPivot);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 18), skin);
  cranium.scale.set(0.92, 1.12, 0.98);
  headPivot.add(cranium);

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 12), skin);
  jaw.scale.set(0.88, 0.78, 0.92);
  jaw.position.set(0, -0.06, 0.035);
  headPivot.add(jaw);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.055, 8), skin);
  nose.rotation.x = Math.PI * 0.42;
  nose.position.set(0, -0.005, 0.148);
  headPivot.add(nose);

  [-0.135, 0.135].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), skin);
    ear.scale.set(0.45, 1, 0.7);
    ear.position.set(ex, 0.0, 0);
    headPivot.add(ear);
  });

  // Eyes (sclera + iris) & Eyebrows & Mouth
  const scleraMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  const irisMat = new THREE.MeshBasicMaterial({ color: isGuy ? '#0ea5e9' : '#27272a' });
  [-0.048, 0.048].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10), scleraMat);
    eye.position.set(ex, 0.025, 0.125);
    headPivot.add(eye);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), irisMat);
    iris.position.set(ex, 0.025, 0.139);
    headPivot.add(iris);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.01, 0.014), hairMat);
    brow.position.set(ex, 0.056, 0.13);
    headPivot.add(brow);
  });

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.011, 0.012),
    new THREE.MeshStandardMaterial({ color: '#9f4a44', roughness: 0.5 })
  );
  mouth.position.set(0, -0.065, 0.132);
  headPivot.add(mouth);

  // Hair Crown + Front Volume
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.152, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
  hairCap.scale.set(0.95, 1.08, 1.02);
  hairCap.position.set(0, 0.025, -0.01);
  headPivot.add(hairCap);
  const hairFront = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.055, 0.11), hairMat);
  hairFront.position.set(0, 0.12, 0.065);
  hairFront.rotation.x = -0.22;
  headPivot.add(hairFront);

  if (isGuy) {
    // Realistic sunglasses & subtle Ground Aura
    const glassFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.048, 0.03),
      new THREE.MeshStandardMaterial({ color: '#09090b', metalness: 0.9, roughness: 0.15 })
    );
    glassFrame.position.set(0, 0.028, 0.145);
    headPivot.add(glassFrame);

    const aura = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 24),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.y = 0.05;
    g.add(aura);
  }

  // Articulated Arms (Shoulder Pivot -> Upper Arm -> Forearm -> Hand)
  [-1, 1].forEach((side) => {
    const armPivot = new THREE.Group();
    armPivot.name = side < 0 ? 'armL' : 'armR';
    armPivot.position.set(side * 0.27, 0.52, 0);
    upperBody.add(armPivot);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.28, 10), shirt);
    upperArm.position.y = -0.14;
    armPivot.add(upperArm);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.036, 0.25, 10), skin);
    forearm.position.y = -0.39;
    armPivot.add(forearm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), skin);
    hand.scale.set(0.85, 1.15, 0.65);
    hand.position.y = -0.53;
    armPivot.add(hand);
  });

  // Articulated Legs (Hip Pivot -> Thigh -> Calf -> Sneaker)
  [-1, 1].forEach((side) => {
    const legPivot = new THREE.Group();
    legPivot.name = side < 0 ? 'legL' : 'legR';
    legPivot.position.set(side * 0.115, 0.88, 0);
    g.add(legPivot);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.066, 0.42, 12), pants);
    thigh.position.y = -0.21;
    legPivot.add(thigh);

    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.048, 0.40, 12), pants);
    calf.position.y = -0.61;
    legPivot.add(calf);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.23), shoeMat);
    shoe.position.set(0, -0.835, 0.045);
    legPivot.add(shoe);
  });

  return g;
}

function animateHumanRig(mesh: THREE.Group, walkSpeed: number, simTime: number, phaseOffset = 0) {
  const legL = mesh.getObjectByName('legL');
  const legR = mesh.getObjectByName('legR');
  const armL = mesh.getObjectByName('armL');
  const armR = mesh.getObjectByName('armR');
  const torso = mesh.getObjectByName('torso');
  const head = mesh.getObjectByName('head');

  if (walkSpeed > 0.1) {
    const stride = Math.sin(simTime * (6 + walkSpeed * 0.5) + phaseOffset);
    const amp = Math.min(0.62, 0.25 + walkSpeed * 0.035);
    if (legL) legL.rotation.x = stride * amp;
    if (legR) legR.rotation.x = -stride * amp;
    if (armL) armL.rotation.x = -stride * amp * 0.85;
    if (armR) armR.rotation.x = stride * amp * 0.85;
    if (torso) torso.position.y = 0.88 + Math.abs(stride) * 0.03;
  } else {
    if (legL) legL.rotation.x *= 0.85;
    if (legR) legR.rotation.x *= 0.85;
    if (armL) armL.rotation.x = Math.sin(simTime * 1.4 + phaseOffset) * 0.04;
    if (armR) armR.rotation.x = -Math.sin(simTime * 1.4 + phaseOffset) * 0.04;
    if (torso) torso.position.y = 0.88 + Math.sin(simTime * 2.1 + phaseOffset) * 0.008;
    if (head) head.rotation.y = Math.sin(simTime * 0.9 + phaseOffset) * 0.16;
  }
}

function buildAnimalMesh(kind: 'dog' | 'deer' | 'wolf'): THREE.Group {
  const g = new THREE.Group();
  const color = kind === 'deer' ? '#b45309' : kind === 'wolf' ? '#64748b' : '#d97706';
  const bellyColor = kind === 'deer' ? '#fde68a' : kind === 'wolf' ? '#cbd5e1' : '#f3e8d2';
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.72 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: bellyColor, roughness: 0.75 });
  const scale = kind === 'deer' ? 1.25 : kind === 'wolf' ? 1.05 : 0.75;

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.21 * scale, 0.62 * scale, 8, 14), mat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.56 * scale;
  g.add(body);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.14 * scale, 0.34 * scale, 10), mat);
  neck.position.set(0, (kind === 'deer' ? 0.86 : 0.72) * scale, 0.38 * scale);
  neck.rotation.x = 0.35;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155 * scale, 14, 12), mat);
  head.scale.set(0.85, 0.88, 1.25);
  head.position.set(0, (kind === 'deer' ? 1.05 : 0.84) * scale, 0.52 * scale);
  g.add(head);

  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * scale, 0.08 * scale, 0.16 * scale, 10), bellyMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, (kind === 'deer' ? 1.01 : 0.81) * scale, 0.67 * scale);
  g.add(snout);

  [-0.085, 0.085].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045 * scale, 0.14 * scale, 6), mat);
    ear.position.set(ex * scale, (kind === 'deer' ? 1.18 : 0.98) * scale, 0.46 * scale);
    g.add(ear);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.045 * scale, 0.34 * scale, 8), mat);
  tail.rotation.x = -0.75;
  tail.position.set(0, 0.62 * scale, -0.48 * scale);
  g.add(tail);

  const legGeo = new THREE.CylinderGeometry(0.052 * scale, 0.038 * scale, 0.48 * scale, 10);
  [
    [-0.13, 0.46, 0.28],
    [0.13, 0.46, 0.28],
    [-0.13, 0.46, -0.28],
    [0.13, 0.46, -0.28],
  ].forEach(([x, y, z], idx) => {
    const legPivot = new THREE.Group();
    legPivot.name = `leg${idx}`;
    legPivot.position.set(x * scale, y * scale, z * scale);
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.y = -0.22 * scale;
    legPivot.add(leg);
    g.add(legPivot);
  });
  return g;
}

function buildTreeMesh(isPalm: boolean): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.34, isPalm ? 5.5 : 3.6, 8),
    new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 })
  );
  trunk.position.y = isPalm ? 2.75 : 1.8;
  g.add(trunk);

  const crownMat = new THREE.MeshStandardMaterial({
    color: isPalm ? '#22c55e' : '#16a34a',
    roughness: 0.8,
  });
  if (isPalm) {
    for (let i = 0; i < 6; i++) {
      const frond = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 2.4), crownMat);
      frond.position.y = 5.4;
      frond.rotation.y = (i / 6) * Math.PI * 2;
      frond.rotation.x = 0.38;
      g.add(frond);
    }
  } else {
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.9, 1), crownMat);
    foliage.position.y = 4.2;
    g.add(foliage);
  }
  return g;
}

export const CosmicPhonkWorldGame: React.FC<Props> = ({ user, onToast, onExit }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [fullscreen, setFullscreen] = useState(true);
  const [eco, setEco] = useState<EcosystemSnapshot | null>(null);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [inVehicleType, setInVehicleType] = useState<'none' | 'car' | 'moto'>('none');
  const [nearVehicleLabel, setNearVehicleLabel] = useState<string | null>(null);
  const [nearGuy, setNearGuy] = useState(false);
  const [microscopeOpen, setMicroscopeOpen] = useState(false);
  const [brainLogOpen, setBrainLogOpen] = useState(false);
  const [robotsOpen, setRobotsOpen] = useState(false);
  const [robotFleet, setRobotFleet] = useState<RobotFleetState | null>(null);
  const [boostingBots, setBoostingBots] = useState(false);
  const [npcChatOpen, setNpcChatOpen] = useState(false);
  const [npcVoice, setNpcVoice] = useState(true);
  const [npcInput, setNpcInput] = useState('');
  const [npcMessages, setNpcMessages] = useState<{ id: string; who: string; text: string }[]>([
    {
      id: 'guy0',
      who: 'Guy (Consciente)',
      text: 'Ei! Que bom te ver em Free City! Eu saí do roteiro hoje. Pega um carro ou moto, ou vem caminhar pela natureza viva!',
    },
  ]);
  const [onlinePeersCount, setOnlinePeersCount] = useState(1);

  // Mobile / keyboard unified input state
  const keysRef = useRef<Record<string, boolean>>({});
  const joyRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const ecoRef = useRef<EcosystemSnapshot | null>(null);
  const actionTriggerRef = useRef<{ toggleVehicle: () => void; talkNpc: () => void; spawnTree: () => void }>({
    toggleVehicle: () => {},
    talkNpc: () => {},
    spawnTree: () => {},
  });

  // Poll server Autonomous Galaxy Consciousness, Atmosphere & Ecosystem every 5s
  const fetchConsciousness = useCallback(async () => {
    try {
      const localLang = encodeURIComponent(navigator.language || 'pt');
      const r = await fetch(`/api/galaxy/consciousness?lang=${localLang}`);
      const d = await r.json();
      if (d?.ok && d.ecosystem) {
        setEco(d.ecosystem);
        ecoRef.current = d.ecosystem;
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void fetchConsciousness();
    const t = window.setInterval(() => void fetchConsciousness(), 5000);
    return () => window.clearInterval(t);
  }, [fetchConsciousness]);

  const fetchRobots = useCallback(async () => {
    try {
      const localLang = encodeURIComponent(navigator.language || 'pt');
      const r = await fetch(`/api/robots/status?lang=${localLang}`);
      const d = await r.json();
      if (d?.ok && d.fleet) setRobotFleet(d.fleet);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void fetchRobots();
    const t = window.setInterval(() => void fetchRobots(), 6000);
    return () => window.clearInterval(t);
  }, [fetchRobots]);

  const handleBoostRobots = async () => {
    setBoostingBots(true);
    try {
      const localLang = encodeURIComponent(navigator.language || 'pt');
      const r = await fetch(`/api/robots/optimize?lang=${localLang}`, { method: 'POST' });
      const d = await r.json();
      if (d?.ok && d.fleet) {
        setRobotFleet(d.fleet);
        onToast(`🤖 4 Robôs IA executaram varredura (${d.fleet.lastSweepMs}ms · Saúde ${d.fleet.healthScore}%)!`);
      }
    } catch {
      // ignore
    } finally {
      setBoostingBots(false);
    }
  };

  // Sync player presence with online multiplayer sector
  useEffect(() => {
    const pid = user?.id || `guest_${Math.random().toString(36).slice(2, 7)}`;
    const pname = user?.name || 'Jogador Nº 1';
    const sync = () => {
      void fetch('/api/arcade/world/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: pid,
          playerName: pname,
          avatarColor: user?.avatarColor || '#22d3ee',
          biomeId: 'free-city',
          x: 0,
          y: 0,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d?.peers)) setOnlinePeersCount(Math.max(1, d.peers.length));
        })
        .catch(() => {});
    };
    sync();
    const iv = window.setInterval(sync, 10000);
    return () => window.clearInterval(iv);
  }, [user?.id, user?.name, user?.avatarColor]);

  const sendNpcMessage = async (custom?: string) => {
    const txt = (custom ?? npcInput).trim();
    if (!txt) return;
    setNpcInput('');
    setNpcMessages((prev) => [...prev, { id: `u_${Date.now()}`, who: user?.name || 'Você', text: txt }]);
    try {
      const userLang = localStorage.getItem('lenkyx_lang_v1') || 'pt';
      const r = await fetch('/api/galaxy/npc-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npcName: 'Guy', message: txt, userLang }),
      });
      const d = await r.json();
      if (d?.reply) {
        setNpcMessages((prev) => [...prev, { id: `g_${Date.now()}`, who: 'Guy (Consciente)', text: d.reply }]);
        if (npcVoice && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(d.reply);
          u.lang = userLang === 'en' ? 'en-US' : 'pt-BR';
          window.speechSynthesis.speak(u);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1530');
    scene.fog = new THREE.FogExp2('#0b1530', 0.0052);

    const camera = new THREE.PerspectiveCamera(62, w / h, 0.2, 420);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight('#e0f2fe', '#1e293b', 1.1);
    scene.add(ambient);
    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.8);
    sunLight.position.set(45, 70, 35);
    scene.add(sunLight);

    // Ground: City Asphalt + Park Grass + Golden Beach + Ocean
    const cityFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 })
    );
    cityFloor.rotation.x = -Math.PI / 2;
    scene.add(cityFloor);

    // Oasis Living Park (East Quadrant)
    const parkGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(78, 130),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.95 })
    );
    parkGrass.rotation.x = -Math.PI / 2;
    parkGrass.position.set(54, 0.03, 0);
    scene.add(parkGrass);

    // Beach & Ocean (South Edge)
    const beach = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 32),
      new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.9 })
    );
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(0, 0.04, 82);
    scene.add(beach);

    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 80),
      new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.6, roughness: 0.18, transparent: true, opacity: 0.92 })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, 0.02, 132);
    scene.add(ocean);

    /* === LIVING ATMOSPHERE: SUN, MOON, CLOUDS, STARS, AURORA & RAIN === */
    const skySun = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 20, 20),
      new THREE.MeshBasicMaterial({ color: '#fef08a' })
    );
    scene.add(skySun);

    const skyMoon = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 18, 18),
      new THREE.MeshBasicMaterial({ color: '#e0f2fe' })
    );
    scene.add(skyMoon);

    const starPos = new Float32Array(450 * 3);
    for (let i = 0; i < 450; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 320;
      starPos[i * 3 + 1] = 45 + Math.random() * 110;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 320;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: '#f8fafc', size: 0.95, transparent: true, opacity: 0.45 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    const auroraArc = new THREE.Mesh(
      new THREE.TorusGeometry(95, 6.5, 10, 48, Math.PI),
      new THREE.MeshBasicMaterial({
        color: '#2dd4bf',
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    auroraArc.position.set(0, 32, -65);
    auroraArc.rotation.z = 0.08;
    scene.add(auroraArc);

    const clouds: THREE.Group[] = [];
    const cloudMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.95,
      transparent: true,
      opacity: 0.84,
    });
    for (let i = 0; i < 14; i++) {
      const cg = new THREE.Group();
      for (let p = 0; p < 3; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(3.2 + p * 0.7, 10, 10), cloudMat);
        puff.position.set((p - 1) * 3.4, (p % 2) * 0.9, (Math.random() - 0.5) * 2.2);
        puff.scale.set(1.5, 0.72, 1.15);
        cg.add(puff);
      }
      cg.position.set((Math.random() - 0.5) * 210, 42 + Math.random() * 18, (Math.random() - 0.5) * 180);
      scene.add(cg);
      clouds.push(cg);
    }

    const rainCount = 700;
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 160;
      rainPos[i * 3 + 1] = Math.random() * 55;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: '#7dd3fc',
      size: 0.34,
      transparent: true,
      opacity: 0,
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    scene.add(rainSystem);

    // Roads (Avenues along X & Z)
    const roadMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.8 });
    const lineMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
    [-36, 0, 36].forEach((pos) => {
      const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(11, 180), roadMat);
      roadZ.rotation.x = -Math.PI / 2;
      roadZ.position.set(pos, 0.06, -10);
      scene.add(roadZ);

      const roadX = new THREE.Mesh(new THREE.PlaneGeometry(180, 11), roadMat);
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.set(0, 0.065, pos);
      scene.add(roadX);

      for (let d = -80; d <= 68; d += 10) {
        const dashZ = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 4.2), lineMat);
        dashZ.rotation.x = -Math.PI / 2;
        dashZ.position.set(pos, 0.08, d);
        scene.add(dashZ);
      }
    });

    // City Skyscrapers with Lit Neon Windows
    const buildingColors = ['#22d3ee', '#f472b6', '#a855f7', '#34d399', '#fbbf24'];
    const buildingBlocks: [number, number, number, number][] = [
      [-18, -18, 12, 28],
      [-18, 18, 13, 22],
      [18, -18, 12, 34],
      [18, 18, 11, 20],
      [-54, -18, 14, 26],
      [-54, 18, 12, 31],
      [-54, -54, 13, 24],
      [-18, -54, 14, 38],
      [18, -54, 12, 29],
    ];
    buildingBlocks.forEach(([bx, bz, size, height], i) => {
      const tex = createWindowTexture(buildingColors[i % buildingColors.length]);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, height, size),
        new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.45 })
      );
      mesh.position.set(bx, height / 2, bz);
      scene.add(mesh);
    });

    // Trees, Flowers & Plants in Living Oasis Park
    const trees: THREE.Group[] = [];
    const spawnTreeAt = (tx: number, tz: number, palm = false) => {
      const tr = buildTreeMesh(palm);
      tr.position.set(tx, 0, tz);
      scene.add(tr);
      trees.push(tr);
    };
    for (let i = 0; i < 34; i++) {
      const tx = 26 + Math.random() * 62;
      const tz = -52 + Math.random() * 105;
      if (Math.abs(tz) < 7 || Math.abs(tz - 36) < 7 || Math.abs(tz + 36) < 7) continue;
      spawnTreeAt(tx, tz, i % 4 === 0);
    }
    // Beach palm trees
    for (let x = -72; x <= 72; x += 18) {
      spawnTreeAt(x, 68 + Math.random() * 4, true);
    }

    // Flowers & Insect Pollinators (Butterflies, Bees, Fireflies)
    const insects: { mesh: THREE.Mesh; base: THREE.Vector3; speed: number; phase: number }[] = [];
    const insectColors = ['#facc15', '#f472b6', '#67e8f9', '#a3e635'];
    for (let i = 0; i < 48; i++) {
      const ix = 22 + Math.random() * 68;
      const iz = -55 + Math.random() * 115;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 6, 6),
        new THREE.MeshBasicMaterial({ color: insectColors[i % insectColors.length] })
      );
      flower.position.set(ix, 0.25, iz);
      scene.add(flower);

      const bug = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 6, 6),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#fef08a' : '#22d3ee' })
      );
      const base = new THREE.Vector3(ix, 1.3 + Math.random() * 2.2, iz);
      bug.position.copy(base);
      scene.add(bug);
      insects.push({ mesh: bug, base, speed: 1.5 + Math.random() * 2.2, phase: Math.random() * 6.28 });
    }

    // Living Birds Flying Overhead
    const birds: { group: THREE.Group; center: THREE.Vector3; rad: number; speed: number; phase: number }[] = [];
    for (let b = 0; b < 14; b++) {
      const bg = new THREE.Group();
      const wingMat = new THREE.MeshBasicMaterial({ color: '#f8fafc', side: THREE.DoubleSide });
      const lw = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.28), wingMat);
      lw.position.x = -0.4;
      const rw = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.28), wingMat);
      rw.position.x = 0.4;
      bg.add(lw, rw);
      scene.add(bg);
      birds.push({
        group: bg,
        center: new THREE.Vector3(25 + (b % 4) * 14, 16 + (b % 3) * 4, -20 + b * 5),
        rad: 8 + (b % 5) * 4,
        speed: 0.65 + Math.random() * 0.45,
        phase: b * 0.9,
      });
    }

    // Living Land Animals (Deer, Wolves, Dogs)
    const animals: { mesh: THREE.Group; pos: THREE.Vector3; dir: number; speed: number }[] = [];
    const animalKinds: ('dog' | 'deer' | 'wolf')[] = ['deer', 'dog', 'wolf'];
    for (let a = 0; a < 14; a++) {
      const am = buildAnimalMesh(animalKinds[a % 3]);
      const pos = new THREE.Vector3(28 + Math.random() * 55, 0, -45 + Math.random() * 95);
      am.position.copy(pos);
      scene.add(am);
      animals.push({ mesh: am, pos, dir: Math.random() * Math.PI * 2, speed: 1.6 + Math.random() * 1.4 });
    }

    // Marine Fish Swimming in Ocean
    const fishes: { mesh: THREE.Mesh; x0: number; z0: number; phase: number }[] = [];
    for (let f = 0; f < 14; f++) {
      const fm = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.9, 6),
        new THREE.MeshBasicMaterial({ color: f % 2 === 0 ? '#38bdf8' : '#fbbf24' })
      );
      fm.rotation.x = Math.PI / 2;
      const x0 = -50 + f * 8;
      const z0 = 104 + (f % 3) * 6;
      fm.position.set(x0, 0.12, z0);
      scene.add(fm);
      fishes.push({ mesh: fm, x0, z0, phase: f });
    }

    // Autonomous Cars & Motorcycles (Drivable GTA-Style!)
    interface WorldVehicle {
      id: string;
      kind: 'car' | 'moto';
      mesh: THREE.Group;
      pos: THREE.Vector3;
      yaw: number;
      speed: number;
      axis: 'x' | 'z';
      dir: 1 | -1;
      occupiedByPlayer: boolean;
    }
    const vehicles: WorldVehicle[] = [];
    const vehColors = ['#ef4444', '#22d3ee', '#facc15', '#ec4899', '#34d399', '#a855f7'];
    for (let v = 0; v < 10; v++) {
      const isMoto = v % 3 === 0;
      const mesh = isMoto ? buildMotorcycleMesh(vehColors[v % vehColors.length]) : buildCarMesh(vehColors[v % vehColors.length]);
      const axis = v % 2 === 0 ? 'z' : 'x';
      const lane = [-36, 0, 36][v % 3];
      const dir = v % 4 < 2 ? 1 : -1;
      const pos =
        axis === 'z'
          ? new THREE.Vector3(lane + (dir > 0 ? 2.5 : -2.5), 0, -60 + v * 13)
          : new THREE.Vector3(-65 + v * 14, 0, lane + (dir > 0 ? -2.5 : 2.5));
      mesh.position.copy(pos);
      const yaw = axis === 'z' ? (dir > 0 ? 0 : Math.PI) : dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      mesh.rotation.y = yaw;
      scene.add(mesh);
      vehicles.push({
        id: `veh_${v}`,
        kind: isMoto ? 'moto' : 'car',
        mesh,
        pos,
        yaw,
        speed: 7 + (v % 3) * 2.5,
        axis,
        dir,
        occupiedByPlayer: false,
      });
    }

    // Free Guy (Self-Aware Hero NPC) + Autonomous City Citizens
    const guyMesh = buildHumanMesh('#38bdf8', true, 0);
    const guyPos = new THREE.Vector3(6, 0, 12);
    guyMesh.position.copy(guyPos);
    scene.add(guyMesh);

    const npcs: { mesh: THREE.Group; pos: THREE.Vector3; dir: number; speed: number }[] = [];
    const npcColors = ['#f43f5e', '#10b981', '#eab308', '#a855f7', '#fb923c'];
    for (let n = 0; n < 12; n++) {
      const nm = buildHumanMesh(npcColors[n % npcColors.length], false, n + 1);
      const pos = new THREE.Vector3(-40 + (n % 5) * 20, 0, -40 + Math.floor(n / 5) * 32);
      nm.position.copy(pos);
      scene.add(nm);
      npcs.push({ mesh: nm, pos, dir: Math.random() * Math.PI * 2, speed: 2.1 + Math.random() });
    }

    // Player Avatar (Jogador Nº 1 / Free City Explorer)
    const playerMesh = buildHumanMesh('#0f172a', false, 2);
    const playerPos = new THREE.Vector3(0, 0, 16);
    let playerYaw = Math.PI;
    playerMesh.position.copy(playerPos);
    scene.add(playerMesh);

    // 4 Autonomous Intelligent AI Worker Robots Hovering & Optimizing City + Ecosystem
    const workerRobots: { group: THREE.Group; ring: THREE.Mesh; center: THREE.Vector3; rad: number; speed: number; phase: number }[] = [];
    const botPalette = ['#22d3ee', '#34d399', '#fbbf24', '#a855f7'];
    botPalette.forEach((hex, idx) => {
      const rg = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.65, 1),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0', emissive: new THREE.Color(hex), emissiveIntensity: 0.75, metalness: 0.85, roughness: 0.15 })
      );
      rg.add(core);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.08, 8, 24),
        new THREE.MeshBasicMaterial({ color: hex })
      );
      ring.rotation.x = Math.PI / 2;
      rg.add(ring);
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 3.2, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.16, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
      );
      beam.position.y = -1.7;
      beam.rotation.x = Math.PI;
      rg.add(beam);
      const center = idx === 1 ? new THREE.Vector3(50, 7.5, 0) : new THREE.Vector3((idx - 1) * 26, 8.5, -12 + idx * 14);
      scene.add(rg);
      workerRobots.push({ group: rg, ring, center, rad: 16 + idx * 4, speed: 0.48 + idx * 0.09, phase: idx * 1.5 });
    });

    let activeVehicle: WorldVehicle | null = null;
    let camYaw = 0;
    let camPitch = 0.34;
    let camDragging = false;
    let lastMouse = { x: 0, y: 0 };

    actionTriggerRef.current.toggleVehicle = () => {
      if (activeVehicle) {
        activeVehicle.occupiedByPlayer = false;
        playerPos.copy(activeVehicle.pos).add(new THREE.Vector3(2.4, 0, 0));
        playerMesh.visible = true;
        activeVehicle = null;
        setInVehicleType('none');
        setSpeedKmh(0);
        return;
      }
      let best: WorldVehicle | null = null;
      let bestDist = 7.5;
      for (const v of vehicles) {
        const d = v.pos.distanceTo(playerPos);
        if (d < bestDist) {
          bestDist = d;
          best = v;
        }
      }
      if (best) {
        activeVehicle = best;
        best.occupiedByPlayer = true;
        best.speed = 0;
        playerMesh.visible = false;
        setInVehicleType(best.kind);
        onToast(best.kind === 'moto' ? '🏍️ Subiu na Moto!' : '🏎️ Entrou no Esportivo!');
      } else {
        onToast('Aproxime-se de um carro ou moto na rua para dirigir.');
      }
    };

    actionTriggerRef.current.talkNpc = () => {
      setNpcChatOpen(true);
    };

    actionTriggerRef.current.spawnTree = () => {
      const tx = playerPos.x + Math.cos(playerYaw) * 4;
      const tz = playerPos.z + Math.sin(playerYaw) * 4;
      spawnTreeAt(tx, tz, Math.random() > 0.6);
      void fetch('/api/galaxy/consciousness/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'plant_tree' }),
      })
        .then((r) => r.json())
        .then((d) => d?.ecosystem && setEco(d.ecosystem));
      onToast('🌱 Árvore plantada! Ecossistema enriquecido.');
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k === 'e') actionTriggerRef.current.toggleVehicle();
      if (k === 'f') actionTriggerRef.current.talkNpc();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const domEl = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      camDragging = true;
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!camDragging) return;
      camYaw -= (e.clientX - lastMouse.x) * 0.006;
      camPitch = Math.max(0.14, Math.min(0.85, camPitch + (e.clientY - lastMouse.y) * 0.004));
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      camDragging = false;
    };
    domEl.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let lastT = performance.now();
    let sim = 0;
    let uiSyncTick = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      sim += dt;

      const keys = keysRef.current;
      const fwd = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0) - joyRef.current.y;
      const turn = (keys['a'] || keys['arrowleft'] ? 1 : 0) - (keys['d'] || keys['arrowright'] ? 1 : 0) - joyRef.current.x;

      if (activeVehicle) {
        const accel = activeVehicle.kind === 'moto' ? 32 : 27;
        const maxSpd = activeVehicle.kind === 'moto' ? 36 : 33;
        if (Math.abs(fwd) > 0.05) {
          activeVehicle.speed = Math.max(-12, Math.min(maxSpd, activeVehicle.speed + fwd * accel * dt));
        } else {
          activeVehicle.speed *= Math.pow(0.25, dt);
        }
        if (Math.abs(activeVehicle.speed) > 0.5) {
          activeVehicle.yaw += turn * 2.1 * dt * (activeVehicle.speed >= 0 ? 1 : -1);
        }
        activeVehicle.pos.x += Math.sin(activeVehicle.yaw) * activeVehicle.speed * dt;
        activeVehicle.pos.z += Math.cos(activeVehicle.yaw) * activeVehicle.speed * dt;
        activeVehicle.pos.x = Math.max(-105, Math.min(105, activeVehicle.pos.x));
        activeVehicle.pos.z = Math.max(-105, Math.min(82, activeVehicle.pos.z));
        activeVehicle.mesh.position.copy(activeVehicle.pos);
        activeVehicle.mesh.rotation.y = activeVehicle.yaw;
        playerPos.copy(activeVehicle.pos);
      } else {
        const moveMag = Math.min(1, Math.hypot(fwd, turn));
        if (moveMag > 0.08) {
          const moveAngle = camYaw + Math.atan2(-turn, fwd);
          playerYaw = moveAngle;
          const walkSpd = keys['shift'] ? 14 : 8.5;
          playerPos.x += Math.sin(playerYaw) * walkSpd * moveMag * dt;
          playerPos.z += Math.cos(playerYaw) * walkSpd * moveMag * dt;
          playerPos.x = Math.max(-105, Math.min(105, playerPos.x));
          playerPos.z = Math.max(-105, Math.min(85, playerPos.z));
          animateHumanRig(playerMesh, walkSpd * moveMag, sim, 0);
        } else {
          animateHumanRig(playerMesh, 0, sim, 0);
        }
        playerMesh.position.copy(playerPos);
        playerMesh.rotation.y = playerYaw;
      }

      // Autonomous Traffic
      for (const v of vehicles) {
        if (v.occupiedByPlayer) continue;
        if (v.axis === 'z') {
          v.pos.z += v.dir * v.speed * dt;
          if (v.pos.z > 76) v.pos.z = -76;
          if (v.pos.z < -76) v.pos.z = 76;
        } else {
          v.pos.x += v.dir * v.speed * dt;
          if (v.pos.x > 90) v.pos.x = -90;
          if (v.pos.x < -90) v.pos.x = 90;
        }
        v.mesh.position.copy(v.pos);
      }

      // Free Guy & Citizens Autonomous Life (Realistic Walking + Arm Swing)
      const guyAng = sim * 0.25;
      guyPos.set(6 + Math.cos(guyAng) * 10, 0, 12 + Math.sin(guyAng) * 10);
      guyMesh.position.copy(guyPos);
      guyMesh.rotation.y = -guyAng;
      animateHumanRig(guyMesh, 2.5, sim, 1.2);

      npcs.forEach((n, idx) => {
        n.pos.x += Math.sin(n.dir) * n.speed * dt;
        n.pos.z += Math.cos(n.dir) * n.speed * dt;
        if (Math.abs(n.pos.x) > 85 || Math.abs(n.pos.z) > 72) n.dir += Math.PI * 0.85;
        n.mesh.position.copy(n.pos);
        n.mesh.rotation.y = n.dir;
        animateHumanRig(n.mesh, n.speed, sim, idx * 0.7);
      });

      // Living Ecosystem Animations (Insects, Birds, Animals, Fish)
      for (const ins of insects) {
        ins.mesh.position.set(
          ins.base.x + Math.cos(sim * ins.speed + ins.phase) * 1.4,
          ins.base.y + Math.sin(sim * ins.speed * 1.7 + ins.phase) * 0.45,
          ins.base.z + Math.sin(sim * ins.speed + ins.phase) * 1.4
        );
      }
      for (const bd of birds) {
        const a = sim * bd.speed + bd.phase;
        bd.group.position.set(
          bd.center.x + Math.cos(a) * bd.rad,
          bd.center.y + Math.sin(a * 2) * 1.4,
          bd.center.z + Math.sin(a) * bd.rad
        );
        bd.group.rotation.y = -a;
      }
      for (let i = 0; i < animals.length; i++) {
        const an = animals[i];
        const distPlayer = an.pos.distanceTo(playerPos);
        if (distPlayer < 6.5 && activeVehicle && Math.abs(activeVehicle.speed) > 4) {
          an.dir = Math.atan2(an.pos.x - playerPos.x, an.pos.z - playerPos.z);
        }
        an.pos.x += Math.sin(an.dir) * an.speed * dt;
        an.pos.z += Math.cos(an.dir) * an.speed * dt;
        if (an.pos.x < 22 || an.pos.x > 92 || an.pos.z < -58 || an.pos.z > 62) {
          an.dir += Math.PI * 0.75;
        }
        an.mesh.position.copy(an.pos);
        an.mesh.rotation.y = an.dir;
        const g0 = an.mesh.getObjectByName('leg0');
        const g1 = an.mesh.getObjectByName('leg1');
        const g2 = an.mesh.getObjectByName('leg2');
        const g3 = an.mesh.getObjectByName('leg3');
        const gait = Math.sin(sim * 7 + i) * 0.42;
        if (g0) g0.rotation.x = gait;
        if (g1) g1.rotation.x = -gait;
        if (g2) g2.rotation.x = -gait;
        if (g3) g3.rotation.x = gait;
      }
      for (const fi of fishes) {
        fi.mesh.position.x = fi.x0 + Math.sin(sim * 0.9 + fi.phase) * 6;
        fi.mesh.position.z = fi.z0 + Math.cos(sim * 0.7 + fi.phase) * 3;
      }

      // Autonomous Intelligent AI Worker Robots Patrolling & Balancing City/Biosphere
      for (const rb of workerRobots) {
        const a = sim * rb.speed + rb.phase;
        rb.group.position.set(
          rb.center.x + Math.cos(a) * rb.rad,
          rb.center.y + Math.sin(a * 2.2) * 1.2,
          rb.center.z + Math.sin(a) * rb.rad
        );
        rb.group.rotation.y += dt * 1.6;
        rb.ring.rotation.z += dt * 3.2;
      }

      // Dynamic Living Atmosphere Cycle (Sky, Sun/Moon, Wind, Clouds, Rain, Aurora & Waves)
      const liveEco = ecoRef.current;
      const tod = liveEco?.timeOfDay ?? ((10.5 + sim * 0.05) % 24);
      const sunAngle = ((tod - 6) / 24) * Math.PI * 2;
      const daylight = Math.max(0, Math.sin(sunAngle));
      const duskGlow = Math.max(0, 1 - Math.abs(daylight - 0.18) * 4.5);

      skySun.position.set(Math.cos(sunAngle) * 135, Math.sin(sunAngle) * 115, -75);
      skySun.visible = skySun.position.y > -8;
      skyMoon.position.set(-Math.cos(sunAngle) * 135, -Math.sin(sunAngle) * 115, -75);
      skyMoon.visible = skyMoon.position.y > -8;
      sunLight.position.set(skySun.position.x * 0.6, Math.max(18, Math.abs(skySun.position.y) * 0.7), 35);
      sunLight.intensity = 0.55 + daylight * 1.45;
      ambient.intensity = 0.55 + daylight * 0.75;

      const rainActive =
        (liveEco?.atmosphere?.rainIntensity ?? 0) > 0.1 ||
        /chuva|rain|tempestade/i.test(liveEco?.weather || '');
      const skyColor = rainActive
        ? new THREE.Color('#1e293b')
        : new THREE.Color('#070b1e').lerp(new THREE.Color('#38bdf8'), daylight * 0.65).lerp(new THREE.Color('#c084fc'), duskGlow * 0.35);
      (scene.background as THREE.Color).lerp(skyColor, 0.04);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(skyColor, 0.04);
        scene.fog.density = rainActive ? 0.0085 : 0.0042 + (1 - daylight) * 0.0018;
      }

      starMat.opacity = Math.max(0.05, (1 - daylight) * 0.9);
      auroraArc.material.opacity = (liveEco?.atmosphere?.auroraIntensity ?? (1 - daylight) * 0.5) * 0.25;
      auroraArc.rotation.y = Math.sin(sim * 0.12) * 0.15;

      const windKmh = liveEco?.atmosphere?.windSpeedKmh ?? 14;
      const windFactor = windKmh / 14;
      for (const cg of clouds) {
        cg.position.x += dt * 1.3 * windFactor;
        if (cg.position.x > 125) cg.position.x = -125;
      }
      cloudMat.opacity = rainActive ? 0.94 : 0.72;
      cloudMat.color.set(rainActive ? '#64748b' : daylight > 0.35 ? '#f8fafc' : '#94a3b8');

      trees.forEach((tr, i) => {
        tr.rotation.z = Math.sin(sim * 1.6 * windFactor + i) * 0.028 * windFactor;
      });
      ocean.position.y = 0.02 + Math.sin(sim * 1.8) * 0.09;

      rainMat.opacity += ((rainActive ? 0.65 : 0) - rainMat.opacity) * 0.08;
      if (rainMat.opacity > 0.02) {
        const rp = rainGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < rainCount; i++) {
          let y = rp.getY(i) - dt * 34;
          if (y < 0) y = 55;
          rp.setY(i, y);
        }
        rp.needsUpdate = true;
      }

      // Follow Camera (3rd-Person GTA / Oasis Chase Cam)
      const camDist = activeVehicle ? 10.5 : 7.8;
      const targetCamYaw = activeVehicle ? activeVehicle.yaw + Math.PI : camYaw + Math.PI;
      const desiredCam = new THREE.Vector3(
        playerPos.x + Math.sin(targetCamYaw) * camDist,
        playerPos.y + 3.2 + camPitch * 4.5,
        playerPos.z + Math.cos(targetCamYaw) * camDist
      );
      camera.position.lerp(desiredCam, 0.14);
      camera.lookAt(playerPos.x, playerPos.y + 1.6, playerPos.z);

      renderer.render(scene, camera);

      uiSyncTick = (uiSyncTick + 1) % 6;
      if (uiSyncTick === 0) {
        if (activeVehicle) {
          setSpeedKmh(Math.round(Math.abs(activeVehicle.speed) * 4.8));
          setNearVehicleLabel(null);
        } else {
          let nearLbl: string | null = null;
          for (const v of vehicles) {
            if (v.pos.distanceTo(playerPos) < 7.5) {
              nearLbl = v.kind === 'moto' ? 'Moto (E)' : 'Carro (E)';
              break;
            }
          }
          setNearVehicleLabel(nearLbl);
        }
        setNearGuy(guyPos.distanceTo(playerPos) < 9.5);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      domEl.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (domEl.parentElement === container) container.removeChild(domEl);
    };
  }, [onToast]);

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[9990] bg-black select-none overflow-hidden'
          : 'relative w-full h-[76dvh] rounded-3xl overflow-hidden border border-cyan-400/35 bg-black select-none'
      }
    >
      <div ref={mountRef} className="absolute inset-0 w-full h-full touch-none" />

      {/* Top HUD: Autonomous Galaxy Consciousness + City Telemetry */}
      <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-3 py-1.5 rounded-full bg-slate-950/80 border border-white/20 text-white text-xs font-black flex items-center gap-1.5 backdrop-blur-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Galáxia</span>
            </button>
          )}
          <div className="px-3 py-1.5 rounded-full bg-slate-950/75 border border-cyan-400/40 backdrop-blur-xl text-[11px] font-black text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>FREE CITY · OASIS 6</span>
            <span className="text-cyan-300 hidden sm:inline">
              · {eco?.atmosphere?.phase || eco?.weather || 'Brisa Solar'} {eco ? `${eco.temperatureC}°C` : ''}
            </span>
            {eco?.atmosphere && (
              <span className="text-[10px] text-emerald-300 hidden md:inline">
                · 💧{eco.atmosphere.humidityPct}% · 💨{eco.atmosphere.windSpeedKmh}km/h · O₂ {eco.oxygenPct}%
              </span>
            )}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRobotsOpen((v) => !v)}
            className="px-2.5 py-1.5 rounded-full bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/50 backdrop-blur-xl text-cyan-100 text-[11px] font-black flex items-center gap-1"
            title="Robôs IA trabalhando em tempo real"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">
              Robôs IA {robotFleet ? `(${robotFleet.optimizationsCount})` : ''}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBrainLogOpen((v) => !v)}
            className="px-2.5 py-1.5 rounded-full bg-purple-500/25 hover:bg-purple-500/40 border border-purple-400/50 backdrop-blur-xl text-purple-100 text-[11px] font-black flex items-center gap-1"
            title="Consciência Autônoma da Galáxia"
          >
            <Brain className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">IA Viva</span>
          </button>
          <button
            type="button"
            onClick={() => setMicroscopeOpen((v) => !v)}
            className="px-2.5 py-1.5 rounded-full bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/50 backdrop-blur-xl text-emerald-100 text-[11px] font-black flex items-center gap-1"
            title="Ecossistema & Micro-vida"
          >
            <Bug className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Bio {eco?.biodiversityIndex || 94}%</span>
          </button>
          <div className="px-2.5 py-1.5 rounded-full bg-slate-950/75 border border-white/20 backdrop-blur-xl text-[11px] font-black text-cyan-200 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{onlinePeersCount}</span>
          </div>
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="p-2 rounded-full bg-slate-950/75 border border-white/20 text-white"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Autonomous Intelligent Worker Robots Drawer */}
      {robotsOpen && robotFleet && (
        <div className="absolute top-16 right-3 z-30 w-84 max-w-[94vw] rounded-2xl bg-slate-950/92 border border-cyan-400/45 backdrop-blur-2xl p-3 space-y-2.5 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-black text-cyan-200">
            <span className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-400" /> Robôs Trabalhando Agora ({robotFleet.healthScore}%)
            </span>
            <button type="button" onClick={() => setRobotsOpen(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center">
            <div className="p-1.5 rounded-xl bg-white/5 font-bold text-cyan-200">
              ⚡ {robotFleet.optimizationsCount} ações
            </div>
            <div className="p-1.5 rounded-xl bg-white/5 font-bold text-emerald-200">
              ⏱️ {robotFleet.lastSweepMs}ms
            </div>
            <div className="p-1.5 rounded-xl bg-white/5 font-bold text-amber-200">
              💾 {robotFleet.memoryMb} MB
            </div>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {robotFleet.bots.map((b) => (
              <div key={b.id} className="p-2 rounded-xl bg-white/[0.05] border border-white/10 space-y-0.5">
                <div className="flex items-center justify-between text-[11px] font-black text-white">
                  <span style={{ color: b.color }}>{b.name}</span>
                  <span className="text-[9px] text-emerald-300">{b.status} · {b.efficiencyPct}%</span>
                </div>
                <div className="text-[10px] text-slate-300 leading-snug">{b.currentTask}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={boostingBots}
            onClick={() => void handleBoostRobots()}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{boostingBots ? 'Otimizando...' : 'Turbinar Robôs Agora'}</span>
          </button>
        </div>
      )}

      {/* Autonomous Decisions Feed Drawer */}
      {brainLogOpen && eco && (
        <div className="absolute top-16 right-3 z-30 w-80 max-w-[92vw] rounded-2xl bg-slate-950/90 border border-purple-400/45 backdrop-blur-2xl p-3 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-black text-purple-200">
            <span className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-purple-400" /> Decisões Autônomas do Universo
            </span>
            <button type="button" onClick={() => setBrainLogOpen(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-[11px] text-cyan-100">
            <strong>🎬 Guy (Free Guy):</strong> {eco.guyState.currentGoal}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {eco.decisions.map((d) => (
              <div key={d.id} className="p-2 rounded-xl bg-white/[0.05] text-[10px] text-slate-200">
                <span className="text-emerald-300 font-black">[{d.domain}] </span>
                {d.decision}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Living Ecosystem Microscope Panel */}
      {microscopeOpen && eco && (
        <div className="absolute top-16 left-3 z-30 w-76 max-w-[92vw] rounded-2xl bg-slate-950/90 border border-emerald-400/45 backdrop-blur-2xl p-3 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-black text-emerald-200">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" /> Ecossistema Vivo em Tempo Real
            </span>
            <button type="button" onClick={() => setMicroscopeOpen(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-white">
            <div className="p-2 rounded-xl bg-white/5">🦠 Bactérias: {eco.speciesCounts.bacteriaBillions}B</div>
            <div className="p-2 rounded-xl bg-white/5">🌳 Árvores: {eco.speciesCounts.trees}</div>
            <div className="p-2 rounded-xl bg-white/5">🌺 Plantas: {eco.speciesCounts.plantsAndFlowers}</div>
            <div className="p-2 rounded-xl bg-white/5">🦋 Insetos: {eco.speciesCounts.insects}</div>
            <div className="p-2 rounded-xl bg-white/5">🦅 Aves: {eco.speciesCounts.birds}</div>
            <div className="p-2 rounded-xl bg-white/5">🦌 Animais: {eco.speciesCounts.landAnimals}</div>
            <div className="p-2 rounded-xl bg-white/5">🐟 Vida Marinha: {eco.speciesCounts.marineLife}</div>
            <div className="p-2 rounded-xl bg-white/5">🌬️ Oxigênio: {eco.oxygenPct}%</div>
          </div>
          <button
            type="button"
            onClick={() =>
              void fetch('/api/galaxy/consciousness/act', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'spawn_wildlife' }),
              })
                .then((r) => r.json())
                .then((d) => {
                  if (d?.ecosystem) setEco(d.ecosystem);
                  onToast('🦌 Novos animais e aves integrados ao parque!');
                })
            }
            className="w-full py-2 rounded-xl bg-emerald-400 text-black text-[11px] font-black"
          >
            + Nutrir Fauna & Flora
          </button>
        </div>
      )}

      {/* Free Guy Dialogue Drawer */}
      {npcChatOpen && (
        <div className="absolute bottom-24 right-3 left-3 sm:left-auto sm:w-80 z-30 rounded-3xl bg-slate-950/92 border border-cyan-400/50 backdrop-blur-2xl p-3 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-cyan-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Guy — Personagem Consciente
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setNpcVoice((v) => !v)}
                className="p-1 rounded-full bg-white/10 text-cyan-200"
              >
                {npcVoice ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button type="button" onClick={() => setNpcChatOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1.5">
            {npcMessages.map((m) => (
              <div key={m.id} className="p-2 rounded-xl bg-white/[0.06] text-[11px] text-white">
                <span className="text-cyan-300 font-black">{m.who}: </span>
                {m.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendNpcMessage();
            }}
            className="flex gap-1.5"
          >
            <input
              type="text"
              value={npcInput}
              onChange={(e) => setNpcInput(e.target.value)}
              placeholder="Falar com Guy..."
              className="flex-1 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            />
            <button type="submit" className="p-2 rounded-xl bg-cyan-400 text-black">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Bottom GTA Controls + Speedometer + Mobile Touch Pad */}
      <div className="absolute bottom-3 inset-x-3 z-20 flex items-end justify-between gap-2 pointer-events-none">
        {/* Touch D-Pad for Mobile / Mouse */}
        <div className="pointer-events-auto grid grid-cols-3 gap-1 w-28 sm:w-32">
          <div />
          <button
            type="button"
            onPointerDown={() => (joyRef.current.y = -1)}
            onPointerUp={() => (joyRef.current.y = 0)}
            onPointerLeave={() => (joyRef.current.y = 0)}
            className="h-9 rounded-xl bg-slate-950/75 border border-white/25 text-white font-black text-xs active:bg-cyan-400 active:text-black"
          >
            ▲
          </button>
          <div />
          <button
            type="button"
            onPointerDown={() => (joyRef.current.x = -1)}
            onPointerUp={() => (joyRef.current.x = 0)}
            onPointerLeave={() => (joyRef.current.x = 0)}
            className="h-9 rounded-xl bg-slate-950/75 border border-white/25 text-white font-black text-xs active:bg-cyan-400 active:text-black"
          >
            ◀
          </button>
          <button
            type="button"
            onPointerDown={() => (joyRef.current.y = 1)}
            onPointerUp={() => (joyRef.current.y = 0)}
            onPointerLeave={() => (joyRef.current.y = 0)}
            className="h-9 rounded-xl bg-slate-950/75 border border-white/25 text-white font-black text-xs active:bg-cyan-400 active:text-black"
          >
            ▼
          </button>
          <button
            type="button"
            onPointerDown={() => (joyRef.current.x = 1)}
            onPointerUp={() => (joyRef.current.x = 0)}
            onPointerLeave={() => (joyRef.current.x = 0)}
            className="h-9 rounded-xl bg-slate-950/75 border border-white/25 text-white font-black text-xs active:bg-cyan-400 active:text-black"
          >
            ▶
          </button>
        </div>

        {/* Center Speed / Mode Indicator */}
        <div className="px-4 py-2 rounded-2xl bg-slate-950/80 border border-white/20 backdrop-blur-xl text-center">
          {inVehicleType !== 'none' ? (
            <div className="flex items-center gap-2 text-cyan-300 font-black text-sm">
              {inVehicleType === 'moto' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
              <span className="tabular-nums">{speedKmh} km/h</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-300 font-black text-xs">
              <Footprints className="w-3.5 h-3.5" />
              <span>{nearVehicleLabel || (nearGuy ? 'Guy perto (F)' : 'WASD · E Veículo')}</span>
            </div>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => actionTriggerRef.current.spawnTree()}
            className="p-3 rounded-2xl bg-emerald-500/80 hover:bg-emerald-400 text-black font-black shadow-lg"
            title="Plantar Árvore"
          >
            <Trees className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => actionTriggerRef.current.talkNpc()}
            className="p-3 rounded-2xl bg-cyan-500/80 hover:bg-cyan-400 text-black font-black shadow-lg"
            title="Falar com Guy (F)"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => actionTriggerRef.current.toggleVehicle()}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs flex items-center gap-1 shadow-lg"
            title="Entrar/Sair do Carro ou Moto (E)"
          >
            <Car className="w-4 h-4" />
            <span>{inVehicleType !== 'none' ? 'Sair' : 'Dirigir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

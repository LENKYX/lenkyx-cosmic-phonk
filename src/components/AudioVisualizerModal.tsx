import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Flame,
  Droplets,
  Wind,
  Mountain,
  Sparkles,
  Shuffle,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import { Track } from '../types';

export type VisualizerThemeId =
  | 'galaxy_nebula'
  | 'galaxy_portal'
  | 'fire_solar'
  | 'fire_lava'
  | 'fire_plasma'
  | 'water_ocean'
  | 'water_rain'
  | 'water_storm'
  | 'wind_aurora'
  | 'wind_vortex'
  | 'wind_stream'
  | 'earth_crystal'
  | 'earth_forest'
  | 'earth_dunes';

interface ThemeDef {
  id: VisualizerThemeId;
  label: string;
  element: 'galaxy' | 'fire' | 'water' | 'wind' | 'earth';
  shaderMode: number; // 0=galaxy, 1=fire, 2=water, 3=wind, 4=earth
  variant: number; // 0, 1, 2
}

const THEMES: ThemeDef[] = [
  { id: 'galaxy_nebula', label: 'Nebulosa Quântica', element: 'galaxy', shaderMode: 0, variant: 0 },
  { id: 'galaxy_portal', label: 'Horizonte de Eventos 3D', element: 'galaxy', shaderMode: 0, variant: 1 },
  { id: 'fire_solar', label: 'Tempestade Solar', element: 'fire', shaderMode: 1, variant: 0 },
  { id: 'fire_lava', label: 'Magma Vulcânico', element: 'fire', shaderMode: 1, variant: 1 },
  { id: 'fire_plasma', label: 'Plasma Azul', element: 'fire', shaderMode: 1, variant: 2 },
  { id: 'water_ocean', label: 'Oceano Bioluminescente', element: 'water', shaderMode: 2, variant: 0 },
  { id: 'water_rain', label: 'Reflexo Chuva 4K', element: 'water', shaderMode: 2, variant: 1 },
  { id: 'water_storm', label: 'Tempestade Elétrica', element: 'water', shaderMode: 2, variant: 2 },
  { id: 'wind_aurora', label: 'Aurora Boreal 3D', element: 'wind', shaderMode: 3, variant: 0 },
  { id: 'wind_vortex', label: 'Túnel Aerodinâmico', element: 'wind', shaderMode: 3, variant: 1 },
  { id: 'wind_stream', label: 'Correntes Estratosféricas', element: 'wind', shaderMode: 3, variant: 2 },
  { id: 'earth_crystal', label: 'Prismas de Quartzo', element: 'earth', shaderMode: 4, variant: 0 },
  { id: 'earth_forest', label: 'Floresta Bioluminescente', element: 'earth', shaderMode: 4, variant: 1 },
  { id: 'earth_dunes', label: 'Dunas Douradas', element: 'earth', shaderMode: 4, variant: 2 },
];

const ELEMENTS: { id: ThemeDef['element']; label: string; icon: React.ReactNode }[] = [
  { id: 'galaxy', label: 'Galáxia', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'fire', label: 'Fogo', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'water', label: 'Água', icon: <Droplets className="w-3.5 h-3.5" /> },
  { id: 'wind', label: 'Vento', icon: <Wind className="w-3.5 h-3.5" /> },
  { id: 'earth', label: 'Terra', icon: <Mountain className="w-3.5 h-3.5" /> },
];

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Photorealistic High-Tech Procedural Volumetric & Fluid Shader (FBM, Caustics, Accretion Disk, Aurora, Refraction)
const FRAGMENT_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 v_uv;
uniform vec2 u_res;
uniform float u_time;
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;
uniform float u_mode;
uniform float u_variant;
uniform float u_hueShift;
uniform vec2 u_pointer;
uniform float u_pointerGlow;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.04 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 hsl2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

vec3 hueRotate(vec3 col, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  vec3 k = vec3(0.57735);
  return col * c + cross(k, col) * s + k * dot(k, col) * (1.0 - c);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  vec2 ptr = (u_pointer - vec2(0.5)) * (u_res / min(u_res.x, u_res.y));
  float pDist = length(uv - ptr);
  float ptrForce = exp(-pDist * 3.2) * u_pointerGlow;

  // Gravitational/acoustic warp from pointer + bass
  vec2 warpDir = normalize(uv - ptr + vec2(0.0001));
  vec2 p = uv - warpDir * ptrForce * 0.14;

  float t = u_time;
  float bass = u_bass;
  float mid = u_mid;
  float treble = u_treble;
  vec3 col = vec3(0.0);

  if (u_mode < 0.5) {
    // === 0: GALAXY NEBULA / QUANTUM BLACK HOLE ===
    float r = length(p);
    float ang = atan(p.y, p.x);
    float swirl = ang + (1.2 / (r + 0.25)) + t * (0.28 + bass * 0.35);
    vec2 q = vec2(cos(swirl), sin(swirl)) * r;
    float n1 = fbm(q * 2.8 - vec2(t * 0.22, 0.0));
    float n2 = fbm(p * 4.5 + vec2(n1 * 1.4, t * 0.18));
    float nebula = smoothstep(0.18, 0.88, n1 * 0.6 + n2 * 0.55);

    vec3 cA = vec3(0.05, 0.65, 0.98);
    vec3 cB = vec3(0.88, 0.18, 0.72);
    vec3 cC = vec3(0.22, 0.95, 0.78);
    col = mix(vec3(0.01, 0.01, 0.04), mix(cA, cB, n2), nebula * (0.65 + bass * 0.75));
    col += cC * pow(nebula, 3.0) * (0.4 + treble * 0.9);

    if (u_variant > 0.5) {
      // Event Horizon 3D Black Hole Ring
      float ringR = 0.24 + bass * 0.08 + ptrForce * 0.05;
      float ring = exp(-abs(r - ringR) * (24.0 - bass * 10.0));
      float hole = smoothstep(ringR * 0.75, ringR * 0.98, r);
      col *= hole;
      col += vec3(0.95, 0.68, 1.0) * ring * (1.2 + bass * 1.4);
      col += vec3(0.15, 0.85, 1.0) * exp(-abs(r - ringR * 1.35) * 18.0) * (0.5 + mid);
    }

    // Crisp Starfield + Spectral Rays
    float stars = pow(hash21(floor(uv * 180.0 + floor(t * 0.2))), 24.0);
    col += vec3(0.9, 0.95, 1.0) * stars * (0.8 + treble * 2.2);
    float ray = pow(max(0.0, sin(ang * 12.0 + t * 2.0)), 8.0) * exp(-r * 2.6);
    col += mix(cA, cB, 0.5) * ray * (0.25 + bass * 0.85);

  } else if (u_mode < 1.5) {
    // === 1: PHOTOREALISTIC TURBULENT FIRE / MAGMA / BLUE PLASMA ===
    vec2 fp = p * vec2(1.4, 0.85);
    fp.y += 0.35;
    float turb = fbm(fp * 3.2 - vec2(0.0, t * (1.35 + bass * 1.1)));
    float turb2 = fbm(fp * 6.4 - vec2(turb * 1.6, t * 2.1));
    float flame = clamp((1.15 - (fp.y + 0.45)) * 0.95 + (turb * 0.72 + turb2 * 0.48 - 0.55) + bass * 0.35, 0.0, 1.4);
    float core = smoothstep(0.45, 1.15, flame);
    float outer = smoothstep(0.15, 0.75, flame);

    if (u_variant > 1.5) {
      // Blue Ion Plasma Flame
      col = mix(vec3(0.01, 0.02, 0.06), vec3(0.05, 0.42, 0.98), outer);
      col = mix(col, vec3(0.38, 0.95, 1.0), core);
      col += vec3(0.92, 0.98, 1.0) * pow(core, 3.0) * (0.8 + bass);
    } else if (u_variant > 0.5) {
      // Volcanic Magma Cracks
      float crack = abs(turb - 0.5) * 2.0;
      float glow = exp(-crack * (8.0 - bass * 4.0));
      col = vec3(0.04, 0.01, 0.01) + vec3(1.0, 0.22, 0.02) * glow * (1.1 + bass * 1.2);
      col += vec3(1.0, 0.88, 0.35) * pow(glow, 3.0) * (0.6 + treble);
    } else {
      // Solar Fire Plume
      col = mix(vec3(0.04, 0.01, 0.01), vec3(0.95, 0.18, 0.02), outer);
      col = mix(col, vec3(1.0, 0.62, 0.08), core);
      col += vec3(1.0, 0.96, 0.75) * pow(core, 3.4) * (0.9 + bass * 1.1);
    }

    // Incandescent Rising Embers
    vec2 euv = uv * vec2(26.0, 14.0) - vec2(sin(t + uv.y * 4.0) * 0.6, t * 2.6);
    float ember = pow(hash21(floor(euv)), 18.0) * smoothstep(0.35, 0.0, length(fract(euv) - vec2(0.5)));
    col += vec3(1.0, 0.72, 0.25) * ember * (1.4 + treble * 2.5);

  } else if (u_mode < 2.5) {
    // === 2: REALISTIC WATER OCEAN / CAUSTICS / ELECTRIC STORM ===
    float horizon = 0.08 + sin(p.x * 1.6 + t * 0.4) * 0.02;
    if (p.y < horizon || u_variant > 0.5 && u_variant < 1.5) {
      // Deep realistic ocean caustics + reflective waves
      vec2 wp = vec2(p.x / (0.28 + abs(p.y - horizon)), 1.0 / (0.14 + abs(p.y - horizon)));
      float w1 = fbm(wp * 0.9 + vec2(t * 0.45, -t * 0.75));
      float w2 = fbm(wp * 1.9 - vec2(t * 0.62, t * 0.5));
      float caustic = pow(clamp(1.0 - abs(w1 - w2) * 3.2, 0.0, 1.0), 3.0);
      float spec = pow(max(0.0, 1.0 - abs(p.x) * 1.8), 4.0) * smoothstep(0.45, 0.95, w1);

      vec3 deepSea = vec3(0.01, 0.07, 0.16);
      vec3 cyanWave = vec3(0.04, 0.58, 0.82);
      col = mix(deepSea, cyanWave, w1 * 0.55 + bass * 0.25);
      col += vec3(0.38, 0.95, 1.0) * caustic * (0.65 + bass * 1.15);
      col += vec3(0.85, 0.97, 1.0) * spec * (0.55 + mid * 0.85);
    } else {
      // Bioluminescent Night Sky & Moonlit Atmosphere
      float skyN = fbm(p * 3.0 + vec2(t * 0.08, 0.0));
      col = mix(vec3(0.01, 0.03, 0.09), vec3(0.04, 0.16, 0.34), skyN);
      float moon = exp(-length(p - vec2(0.0, 0.26)) * (7.5 - bass * 2.0));
      col += vec3(0.45, 0.86, 1.0) * moon * (0.9 + bass * 0.8);
    }

    // Touch / Beat Water Ripples
    float ripple = sin(pDist * 42.0 - t * 9.0) * exp(-pDist * 4.5) * (0.25 + ptrForce + bass * 0.4);
    col += vec3(0.35, 0.92, 1.0) * max(0.0, ripple);

    if (u_variant > 1.5) {
      // Electric Storm Lightning Bolt Flash on Bass Drops
      float boltX = p.x + fbm(vec2(p.y * 5.0, floor(t * 6.0))) * 0.28 - 0.14;
      float bolt = exp(-abs(boltX) * 48.0) * smoothstep(0.42, 0.95, bass);
      col += vec3(0.75, 0.92, 1.0) * bolt * 1.8;
    }

  } else if (u_mode < 3.5) {
    // === 3: VOLUMETRIC WIND / AURORA BOREALIS / AERODYNAMIC STREAM ===
    if (u_variant < 0.5) {
      // Realistic 3D Volumetric Aurora Borealis Curtains
      vec3 sky = mix(vec3(0.01, 0.02, 0.06), vec3(0.02, 0.08, 0.14), p.y + 0.5);
      col = sky;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float curve = sin(p.x * (2.2 + fi * 0.5) + t * (0.45 + fi * 0.12)) * 0.22
                    + fbm(vec2(p.x * 2.0 + t * 0.18, fi * 3.1)) * 0.35;
        float dist = abs(p.y - (curve - 0.05 + fi * 0.06));
        float curtain = exp(-dist * (8.5 - bass * 3.2)) * smoothstep(-0.35, 0.45, p.y + 0.25);
        vec3 aurCol = mix(vec3(0.08, 0.95, 0.58), vec3(0.45, 0.35, 0.98), fi / 3.0 + mid * 0.4);
        col += aurCol * curtain * (0.48 + bass * 0.65);
      }
    } else {
      // High-Tech Aerodynamic Wind Tunnel / Vortex Ribbons
      float ang = atan(p.y, p.x);
      float r = length(p);
      float spiral = u_variant < 1.5
        ? sin(r * 18.0 - t * (3.5 + bass * 3.0) + ang * 3.0)
        : sin((p.y + fbm(p * 2.5 - vec2(t * 1.4, 0.0)) * 0.45) * 16.0);
      float ribbon = pow(max(0.0, spiral), 4.0);
      vec3 wCol = mix(vec3(0.05, 0.78, 0.85), vec3(0.65, 0.98, 0.85), treble);
      col = vec3(0.01, 0.04, 0.08) + wCol * ribbon * (0.6 + bass * 0.9);
      col += vec3(0.85, 0.45, 0.98) * exp(-r * 3.0) * (0.3 + bass * 0.7);
    }

  } else {
    // === 4: EARTH / QUARTZ CRYSTALS / BIOLUMINESCENT FOREST / GOLDEN DUNES ===
    if (u_variant < 0.5) {
      // Specular 3D Faceted Quartz Crystals
      vec2 cp = p * (3.2 - bass * 0.6);
      float cell = fbm(floor(cp * 2.0) * 0.7 + t * 0.08);
      float facet = abs(sin(cp.x * 3.1 + cell * 4.0) * cos(cp.y * 3.1 - t * 0.4));
      float edge = exp(-facet * 10.0);
      vec3 c1 = vec3(0.42, 0.14, 0.92);
      vec3 c2 = vec3(0.12, 0.88, 0.95);
      col = mix(vec3(0.03, 0.01, 0.08), mix(c1, c2, cell), 0.45 + bass * 0.45);
      col += vec3(0.95, 0.88, 1.0) * edge * (0.75 + treble * 1.2);
    } else if (u_variant < 1.5) {
      // Bioluminescent Light Forest + Volumetric God Rays
      float canopy = fbm(p * 3.5 + vec2(t * 0.15, 0.0));
      float rays = pow(max(0.0, sin((p.x + p.y * 0.45) * 9.0 + canopy * 2.5)), 5.0);
      col = mix(vec3(0.01, 0.05, 0.03), vec3(0.06, 0.48, 0.24), canopy);
      col += vec3(0.32, 0.98, 0.58) * rays * (0.45 + bass * 0.75);
      float spores = pow(hash21(floor(uv * 55.0 - vec2(0.0, t * 1.5))), 16.0);
      col += vec3(0.75, 1.0, 0.45) * spores * (1.2 + treble * 2.0);
    } else {
      // Sculpted Golden Desert Dunes
      float d1 = fbm(vec2(p.x * 2.2 - t * 0.25, p.y * 4.0));
      float ridge = smoothstep(0.42, 0.58, d1 + sin(p.x * 4.0 - t * 0.6) * 0.08);
      col = mix(vec3(0.12, 0.05, 0.02), vec3(0.96, 0.64, 0.18), ridge * (0.7 + bass * 0.45));
      col += vec3(1.0, 0.92, 0.65) * pow(ridge, 4.0) * (0.35 + treble * 0.65);
    }
  }

  // Interactive Pointer Energy Glow + Subtle Dynamic Color Shift
  col += hsl2rgb(vec3(fract(u_hueShift * 0.15), 0.9, 0.62)) * ptrForce * 0.85;
  col = hueRotate(col, u_hueShift * 0.35);

  // Cinematic Vignette + Tone Mapping
  float vig = 1.0 - dot(uv, uv) * 0.32;
  col *= clamp(vig, 0.35, 1.0);
  col = col / (1.0 + col * 0.35);
  gl_FragColor = vec4(col, 1.0);
}
`;

interface Props {
  open: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const AudioVisualizerModal: React.FC<Props> = ({
  open,
  onClose,
  track,
  isPlaying,
  analyser,
  onTogglePlay,
  onPrev,
  onNext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [themeId, setThemeId] = useState<VisualizerThemeId>('water_ocean');
  const [autoCycle, setAutoCycle] = useState(true);
  const [hudHidden, setHudHidden] = useState(false);

  const activeTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const themeRef = useRef(activeTheme);
  themeRef.current = activeTheme;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const analyserRef = useRef(analyser);
  analyserRef.current = analyser;
  const autoCycleRef = useRef(autoCycle);
  autoCycleRef.current = autoCycle;

  const pointerRef = useRef<{ x: number; y: number; glow: number }>({
    x: 0.5,
    y: 0.5,
    glow: 0,
  });

  // Smooth Auto-Cycle across effects & color harmonies when enabled
  useEffect(() => {
    if (!open || !autoCycle || !isPlaying) return;
    const timer = window.setInterval(() => {
      setThemeId((cur) => {
        const curObj = THEMES.find((t) => t.id === cur);
        const sameElement = THEMES.filter((t) => t.element === curObj?.element);
        if (sameElement.length > 1) {
          const i = sameElement.findIndex((t) => t.id === cur);
          return sameElement[(i + 1) % sameElement.length].id;
        }
        const idx = THEMES.findIndex((t) => t.id === cur);
        return THEMES[(idx + 1) % THEMES.length].id;
      });
    }, 10000);
    return () => window.clearInterval(timer);
  }, [open, autoCycle, isPlaying]);

  const handleSelectElement = (el: ThemeDef['element']) => {
    const group = THEMES.filter((t) => t.element === el);
    if (!group.length) return;
    if (activeTheme.element === el) {
      const idx = group.findIndex((t) => t.id === activeTheme.id);
      setThemeId(group[(idx + 1) % group.length].id);
    } else {
      setThemeId(group[0].id);
    }
  };

  const handleCycleVariant = () => {
    const group = THEMES.filter((t) => t.element === activeTheme.element);
    const idx = group.findIndex((t) => t.id === activeTheme.id);
    setThemeId(group[(idx + 1) % group.length].id);
  };

  // GPU WebGL Shader Render Loop (with smooth 2D fallback if WebGL context is unavailable)
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext('webgl2', { antialias: false, powerPreference: 'high-performance' }) ||
      canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' });

    let raf = 0;
    let timeAcc = 0;
    let hueAcc = 0;
    let smoothBass = 0;
    let smoothMid = 0;
    let smoothTreble = 0;
    const freqData = new Uint8Array(64);

    if (gl) {
      const compile = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          gl.deleteShader(s);
          return null;
        }
        return s;
      };

      const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      const prog = gl.createProgram();
      let linked = false;
      if (vs && fs && prog) {
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        linked = Boolean(gl.getProgramParameter(prog, gl.LINK_STATUS));
      }
      if (vs && fs && prog && linked) {
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );
        const aPos = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const uRes = gl.getUniformLocation(prog, 'u_res');
        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uBass = gl.getUniformLocation(prog, 'u_bass');
        const uMid = gl.getUniformLocation(prog, 'u_mid');
        const uTreble = gl.getUniformLocation(prog, 'u_treble');
        const uMode = gl.getUniformLocation(prog, 'u_mode');
        const uVariant = gl.getUniformLocation(prog, 'u_variant');
        const uHueShift = gl.getUniformLocation(prog, 'u_hueShift');
        const uPointer = gl.getUniformLocation(prog, 'u_pointer');
        const uPointerGlow = gl.getUniformLocation(prog, 'u_pointerGlow');

        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
          canvas.width = Math.floor(window.innerWidth * dpr);
          canvas.height = Math.floor(window.innerHeight * dpr);
          gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        const frame = () => {
          raf = requestAnimationFrame(frame);
          const playing = isPlayingRef.current;
          let b = 0;
          let m = 0;
          let tr = 0;
          const an = analyserRef.current;
          if (an && playing) {
            an.getByteFrequencyData(freqData);
            for (let i = 0; i < 8; i++) b += freqData[i];
            for (let i = 8; i < 24; i++) m += freqData[i];
            for (let i = 24; i < 48; i++) tr += freqData[i];
            b /= 8 * 255;
            m /= 16 * 255;
            tr /= 24 * 255;
          }
          if (playing && b < 0.03) {
            const pulse = Math.pow(Math.abs(Math.sin(timeAcc * 2.2)), 3);
            b = 0.25 + pulse * 0.65;
            m = 0.22 + Math.abs(Math.sin(timeAcc * 1.45 + 0.9)) * 0.5;
            tr = 0.18 + Math.abs(Math.cos(timeAcc * 3.1)) * 0.45;
          }

          smoothBass = smoothBass * 0.78 + b * 0.22;
          smoothMid = smoothMid * 0.8 + m * 0.2;
          smoothTreble = smoothTreble * 0.76 + tr * 0.24;

          timeAcc += playing ? 0.016 + smoothBass * 0.028 : 0.005;
          if (autoCycleRef.current && playing) {
            hueAcc += 0.006 + smoothBass * 0.014;
          }
          pointerRef.current.glow *= 0.94;

          const cur = themeRef.current;
          gl.uniform2f(uRes, canvas.width, canvas.height);
          gl.uniform1f(uTime, timeAcc);
          gl.uniform1f(uBass, smoothBass);
          gl.uniform1f(uMid, smoothMid);
          gl.uniform1f(uTreble, smoothTreble);
          gl.uniform1f(uMode, cur.shaderMode);
          gl.uniform1f(uVariant, cur.variant);
          gl.uniform1f(uHueShift, hueAcc);
          gl.uniform2f(uPointer, pointerRef.current.x, 1.0 - pointerRef.current.y);
          gl.uniform1f(uPointerGlow, pointerRef.current.glow);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        };

        raf = requestAnimationFrame(frame);
        return () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('resize', resize);
        };
      }
    }

    // Minimal 2D Fallback if WebGL disabled
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw2d = () => {
      raf = requestAnimationFrame(draw2d);
      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = window.innerHeight);
      timeAcc += 0.025;
      const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.6);
      g.addColorStop(0, `hsla(${(timeAcc * 40) % 360}, 90%, 52%, 0.45)`);
      g.addColorStop(1, '#04020e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(draw2d);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9995] bg-[#04020e] flex flex-col justify-between overflow-hidden select-none">
      {/* GPU High-Tech Shader Stage */}
      <canvas
        ref={canvasRef}
        onPointerMove={(e) => {
          pointerRef.current = {
            x: e.clientX / Math.max(1, window.innerWidth),
            y: e.clientY / Math.max(1, window.innerHeight),
            glow: 1.0,
          };
        }}
        onPointerDown={(e) => {
          pointerRef.current = {
            x: e.clientX / Math.max(1, window.innerWidth),
            y: e.clientY / Math.max(1, window.innerHeight),
            glow: 1.6,
          };
        }}
        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
      />

      {/* Minimal Top Bar */}
      <div className="relative z-10 p-3 sm:p-5 flex items-center justify-between gap-3">
        {!hudHidden && track ? (
          <div className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-2xl border border-white/15 shadow-xl min-w-0">
            <img
              src={track.coverUrl}
              alt={track.title}
              className={`w-8 h-8 rounded-full object-cover shrink-0 ${isPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '9s' }}
            />
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate max-w-[160px] sm:max-w-[260px]">
                {track.title}
              </div>
              <div className="text-[10px] font-semibold text-cyan-200/85 truncate">{track.artist}</div>
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {!hudHidden && (
            <button
              type="button"
              onClick={() => setAutoCycle((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 border backdrop-blur-2xl transition ${
                autoCycle
                  ? 'bg-emerald-400/20 border-emerald-400/55 text-emerald-200'
                  : 'bg-black/45 border-white/15 text-slate-200 hover:bg-white/10'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{autoCycle ? 'Auto: ON' : 'Auto'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setHudHidden((v) => !v)}
            className="p-2 rounded-full bg-black/45 hover:bg-white/15 backdrop-blur-2xl border border-white/15 text-white/90 transition"
            title={hudHidden ? 'Mostrar Menu' : 'Ocultar Menu'}
          >
            {hudHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 hover:bg-rose-500/80 backdrop-blur-2xl border border-white/20 text-white transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Realistic Glass Dock (Zero Scrollbars, Zero Stacked Clutter) */}
      {!hudHidden && (
        <div className="relative z-10 px-3 pb-4 sm:pb-6 flex justify-center">
          <div className="w-full max-w-2xl rounded-3xl bg-[#070514]/70 backdrop-blur-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] px-3.5 py-3 flex flex-col gap-3">
            {/* Row 1: 5 Clean Element Buttons + Active Preset Cycle */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {ELEMENTS.map((el) => {
                  const active = activeTheme.element === el.id;
                  return (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => handleSelectElement(el.id)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 transition ${
                        active
                          ? 'bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.4)]'
                          : 'bg-white/[0.07] hover:bg-white/15 text-slate-200 border border-white/10'
                      }`}
                    >
                      {el.icon}
                      <span>{el.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleCycleVariant}
                className="px-3 py-1.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 text-[11px] font-bold flex items-center gap-1 transition shrink-0"
                title="Trocar variação deste elemento"
              >
                <span>{activeTheme.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-cyan-300" />
              </button>
            </div>

            {/* Row 2: Sleek Centered Playback Controls */}
            <div className="flex items-center justify-center gap-5 pt-0.5 border-t border-white/10">
              <button
                type="button"
                onClick={onPrev}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="Anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onTogglePlay}
                className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.45)] hover:scale-105 transition"
                title={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={onNext}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="Próxima"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

import React, { useEffect, useRef } from 'react';
import { lenkyxAudioEngine } from '../utils/audioBoostEngine';

export type GpuShaderMode = 'shader_galaxy' | 'shader_nebula' | 'shader_blackhole';

interface Props {
  active: boolean;
  mode: GpuShaderMode;
  isPlaying: boolean;
  bpm: number;
  sharpness: number;
  kickPower: number;
  c1Hex: string;
  c2Hex: string;
  c3Hex: string;
  hasBackgroundImage: boolean;
  onFps?: (fps: number) => void;
}

function hexToVec3(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  if (Number.isNaN(n)) return [0.13, 0.83, 0.93];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const VERT_SRC = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_res;
uniform float u_time;
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;
uniform vec2 u_mouse;
uniform float u_mouseActive;
uniform vec2 u_shockPos;
uniform float u_shockTime;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform float u_mode; // 0.0 = Quantum Galaxy, 1.0 = Cosmic Planet & Rings, 2.0 = Gargantua Clockwise Black Hole
uniform float u_transparentBg;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p = rot * p * 2.05;
    amp *= 0.5;
  }
  return v;
}

vec3 starLayer(vec2 uv, float scale, float speed, float sparkle) {
  vec2 gv = fract(uv * scale) - 0.5;
  vec2 id = floor(uv * scale);
  vec3 col = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offs = vec2(float(x), float(y));
      float n = hash(id + offs);
      vec2 pos = offs + vec2(n, fract(n * 34.56)) - 0.5;
      float d = length(gv - pos);
      float size = (0.015 + 0.028 * fract(n * 71.3)) * (1.0 + sparkle * 0.85);
      float star = smoothstep(size, 0.0, d);
      float twinkle = 0.6 + 0.4 * sin(u_time * speed + n * 40.0);
      vec3 scol = mix(u_c1, u_c2, fract(n * 19.7));
      scol = mix(scol, vec3(1.0), 0.55);
      col += scol * star * twinkle;
    }
  }
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  vec2 mUv = (u_mouse - 0.5) * vec2(u_res.x / min(u_res.x, u_res.y), u_res.y / min(u_res.x, u_res.y));
  vec2 sUv = (u_shockPos - 0.5) * vec2(u_res.x / min(u_res.x, u_res.y), u_res.y / min(u_res.x, u_res.y));

  // Interactive Gravitational Warp toward pointer/touch
  vec2 toMouse = mUv - uv;
  float mDist = length(toMouse) + 0.001;
  float warp = u_mouseActive * 0.085 / (mDist * mDist + 0.14);
  uv += normalize(toMouse) * warp * (0.4 + u_bass * 0.9);

  // Interactive Supernova Shockwave on Click/Tap
  float sAge = u_time - u_shockTime;
  float shockRing = 0.0;
  if (sAge > 0.0 && sAge < 2.2) {
    float sRad = sAge * 1.15;
    float sDist = abs(length(uv - sUv) - sRad);
    shockRing = smoothstep(0.085, 0.0, sDist) * (1.0 - sAge / 2.2) * (1.1 + u_bass);
    uv += normalize(uv - sUv + 0.0001) * shockRing * 0.045;
  }

  vec3 col = vec3(0.01, 0.004, 0.03);
  float bhCoreMask = 0.0;

  if (u_mode > 1.5) {
    // === MODE 2: 3D GARGANTUA CLOCKWISE CLOSING BLACK HOLE (POPPING OUT OF SCREEN!) ===
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Event horizon radius tightens dynamically with bass & breathing inward cycle
    float pinch = 0.024 * sin(u_time * 2.1) + u_bass * 0.036;
    float horizonR = 0.205 - pinch * 0.35;

    // 3D Parallax Zoom Streaks rushing TOWARD the camera (pop-out-of-screen effect)
    vec2 zoomUv = uv / (1.0 + 0.12 * u_bass);
    float starZoom = 0.0;
    for (int z = 0; z < 3; z++) {
      float fz = float(z);
      float zPhase = fract(u_time * (0.28 + fz * 0.11) - fz * 0.33);
      float zScale = mix(14.0, 1.8, zPhase);
      vec2 zCoord = vec2(a * 6.0 / 3.14159, log(max(r, 0.02)) * 2.5 + zPhase * 5.0);
      float spark = pow(noise(zCoord * zScale * 0.15 + vec2(u_time * 0.4, 0.0)), 6.0);
      starZoom += spark * (1.0 - zPhase) * smoothstep(horizonR * 0.9, horizonR * 2.4, r);
    }

    // Clockwise inward spiraling coordinates (increasing u_time rotates CLOCKWISE & pulls inward!)
    float swirlSpeed = 1.65 + u_bass * 1.35 + u_mid * 0.65;
    float radialPull = r + u_time * (0.22 + u_bass * 0.18);
    float cwAngle = a + u_time * swirlSpeed + 5.2 * log(max(r, 0.03));

    // Luminous orange / molten gold filaments swirling clockwise into the dark core
    float filamentTex = fbm(vec2(cos(cwAngle) * 2.6 + radialPull * 3.0, sin(cwAngle) * 2.6 - radialPull * 3.0));
    float filamentFine = fbm(vec2(cwAngle * 1.4, radialPull * 9.5));
    float cwRibbons = pow(0.5 + 0.5 * sin(cwAngle * 3.0 + filamentTex * 3.4), 2.2);

    // 3D Gravitational Lensing Halo (bent luminous orange ring arching over & under the dark center)
    float ringDist = r - (horizonR + 0.032 + u_bass * 0.015);
    float photonRing = exp(-abs(ringDist) * (42.0 - u_treble * 10.0));
    float outerCorona = exp(-max(0.0, r - horizonR) * 6.2) * (0.55 + filamentTex * 0.95);

    // 3D Tilted Equatorial Accretion Disk passing IN FRONT of the black hole sphere
    vec2 diskUv = uv;
    float tilt = -0.22 + sin(u_time * 0.35) * 0.05;
    diskUv = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * diskUv;
    diskUv.y *= 3.85; // 3D foreshortening
    float dr = length(diskUv);
    float da = atan(diskUv.y, diskUv.x);
    float diskSwirl = da + u_time * (swirlSpeed * 1.35) + 4.2 * log(max(dr, 0.04));
    float diskFbm = fbm(vec2(cos(diskSwirl) * 3.2, sin(diskSwirl) * 3.2 + dr * 7.0));
    float diskBand = smoothstep(horizonR * 0.88, horizonR * 1.25, dr) * exp(-max(0.0, dr - horizonR * 1.15) * 3.4);
    // Front bottom arc passes IN FRONT of the black sphere; top back arc is gravitationally lensed around it
    float frontOcclusion = (r < horizonR && diskUv.y > 0.0) ? 0.15 : 1.0;
    float dopplerBoost = 0.78 + 0.45 * clamp(-diskUv.x * 1.6, -0.5, 0.9);
    float diskEnergy = diskBand * (0.45 + 0.95 * diskFbm) * frontOcclusion * dopplerBoost * (1.2 + u_bass * 1.1);

    // Hot Orange -> Amber -> White-Hot Core Palette
    vec3 orangeHot = vec3(1.0, 0.36, 0.02);
    vec3 goldBright = vec3(1.0, 0.68, 0.18);
    vec3 whiteCore = vec3(1.0, 0.94, 0.80);

    vec3 haloCol = mix(orangeHot, goldBright, clamp(filamentFine + cwRibbons * 0.45, 0.0, 1.0));
    vec3 photonCol = mix(goldBright, whiteCore, clamp(photonRing * 0.85 + u_treble * 0.25, 0.0, 1.0));
    vec3 diskCol = mix(orangeHot, whiteCore, clamp(diskFbm * 0.72 + u_bass * 0.25, 0.0, 1.0));

    // Deep dark cosmic space behind + subtle orange gravitational glow
    col = vec3(0.006, 0.002, 0.012);
    col += starLayer(uv * (1.0 + u_bass * 0.05) + vec2(u_time * 0.008, 0.0), 6.5, 2.5, u_treble) * 0.38 * smoothstep(horizonR, horizonR * 2.5, r);
    col += haloCol * outerCorona * (0.8 + cwRibbons * 0.95) * (1.0 + u_bass * 0.85);
    col += photonCol * photonRing * (2.1 + u_bass * 1.45);
    col += goldBright * starZoom * (1.3 + u_bass * 1.2);

    // Pure pitch-black Event Horizon Sphere inside! (Swallows light completely)
    float insideHole = smoothstep(horizonR + 0.012, horizonR - 0.008, r);
    bhCoreMask = insideHole;
    col *= (1.0 - insideHole);

    // Bright equatorial orange filament sweeping clockwise IN FRONT of the dark hole!
    float frontPass = (diskUv.y <= 0.0) ? 1.0 : (1.0 - insideHole * 0.88);
    col += diskCol * diskEnergy * frontPass * 1.45;
    // Ultra-crisp luminous orange filament ring hugging the closing edge
    float edgeThread = exp(-abs(r - horizonR) * 95.0) * (1.6 + u_treble * 1.4 + u_bass * 0.9);
    col += mix(orangeHot, whiteCore, 0.45) * edgeThread;
  } else if (u_mode < 0.5) {
    // === MODE 0: QUANTUM INTERACTIVE GALAXY (FBM Spiral Arms + 3-Layer Starfield + Pulsing Core) ===
    float zoom = 1.0 - u_bass * 0.14;
    vec2 gUv = uv * zoom;
    float r = length(gUv);
    float a = atan(gUv.y, gUv.x);

    // Galactic differential spiral twist driven by mid frequencies
    float spiral = a + 3.2 * log(r + 0.18) - u_time * (0.35 + u_mid * 0.25);
    float arms = pow(0.5 + 0.5 * sin(spiral * 2.0), 1.8);
    float neb = fbm(gUv * (2.6 + u_mid * 0.4) + vec2(cos(u_time * 0.12), sin(u_time * 0.1)) * 0.8);
    float neb2 = fbm(vec2(cos(spiral), sin(spiral)) * 1.9 + r * 2.5 - u_time * 0.18);

    float disk = exp(-r * 1.55) * (0.45 + arms * 0.95) * (0.55 + neb * 0.85);
    vec3 galCol = mix(u_c1, u_c2, clamp(neb2 + u_treble * 0.3, 0.0, 1.0));
    galCol = mix(galCol, u_c3, arms * 0.45);
    col += galCol * disk * (1.35 + u_bass * 1.25);

    // Super-bright Cosmic Core + Fresnel Rings
    float core = exp(-r * (6.2 - u_bass * 2.1));
    col += mix(vec3(1.0, 0.95, 1.0), u_c1, 0.35) * core * (1.8 + u_bass * 1.6);

    float pulseRing = smoothstep(0.035, 0.0, abs(r - (0.28 + u_bass * 0.22)));
    col += u_c2 * pulseRing * (0.55 + u_treble * 0.8);

    // Multi-depth Parallax Starfield
    col += starLayer(gUv + vec2(u_time * 0.018, 0.0), 5.5, 2.8, u_treble) * 0.65;
    col += starLayer(gUv * 1.4 - vec2(0.0, u_time * 0.012), 11.0, 4.1, u_treble) * 0.45;
  } else {
    // === MODE 1: RAY-SHADED COSMIC PLANET + AUDIO RINGS + AURORA ===
    float pRad = 0.28 + u_bass * 0.038;
    float d = length(uv);

    // Ambient Nebula Backdrop
    float neb = fbm(uv * 2.5 + vec2(u_time * 0.08, -u_time * 0.05));
    col += mix(u_c1, u_c2, neb) * pow(neb, 1.6) * (0.55 + u_mid * 0.7);
    col += starLayer(uv + vec2(u_time * 0.01, 0.0), 7.5, 3.0, u_treble) * 0.55;

    // Tilted Orbital Saturn Rings reacting to treble & mid
    vec2 rUv = uv;
    float rot = 0.32 + sin(u_time * 0.25) * 0.06;
    rUv = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * rUv;
    rUv.y *= 3.3;
    float ringD = length(rUv);
    float ringBand = smoothstep(0.025, 0.0, abs(ringD - (0.48 + u_mid * 0.06)))
                   + 0.7 * smoothstep(0.04, 0.0, abs(ringD - (0.62 + u_treble * 0.07)));
    float behindPlanet = (d < pRad && rUv.y > 0.0) ? 0.0 : 1.0;
    col += mix(u_c1, u_c3, 0.5 + 0.5 * sin(ringD * 18.0 + u_time)) * ringBand * behindPlanet * (0.95 + u_bass);

    // 3D Lit Planet Sphere
    if (d < pRad) {
      float z = sqrt(max(0.0, pRad * pRad - d * d));
      vec3 norm = normalize(vec3(uv, z));
      vec3 lightDir = normalize(vec3(cos(u_time * 0.4) * 0.8, 0.45, 0.7));
      float diff = max(0.08, dot(norm, lightDir));
      float fresnel = pow(1.0 - max(0.0, norm.z), 2.8);
      float surf = fbm(norm.xy * 4.5 + vec2(u_time * 0.14, 0.0) + u_mid * 0.4);
      vec3 pCol = mix(u_c2 * 0.45, u_c1, surf) * diff;
      pCol += mix(u_c1, u_c3, 0.5) * fresnel * (1.4 + u_bass * 1.4);
      col = pCol;
    } else {
      // Atmosphere Halo
      float halo = exp(-(d - pRad) * 9.5) * (0.85 + u_bass * 1.1);
      col += mix(u_c1, u_c2, 0.5) * halo;
    }
  }

  // Supernova shockwave & interactive pointer aura
  col += mix(u_c1, vec3(1.0), 0.4) * shockRing * 1.25;
  float pointerGlow = u_mouseActive * exp(-mDist * 7.5) * (0.35 + u_treble * 0.65);
  col += u_c3 * pointerGlow;

  // Filmic tone-mapping
  col = col / (1.0 + col * 0.35);
  float maxCh = max(col.r, max(col.g, col.b));
  float alpha = u_transparentBg > 0.5
    ? clamp(max(bhCoreMask, maxCh * 1.42 + 0.14), 0.0, 1.0)
    : 1.0;
  outColor = vec4(col, alpha);
}`;

export const QuantumGalaxyWebGL: React.FC<Props> = ({
  active,
  mode,
  isPlaying,
  bpm,
  sharpness,
  kickPower,
  c1Hex,
  c2Hex,
  c3Hex,
  hasBackgroundImage,
  onFps,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const interactionRef = useRef({
    mouseX: 0.5,
    mouseY: 0.5,
    mouseActive: 0,
    shockX: 0.5,
    shockY: 0.5,
    shockTime: -10,
    shaderTime: 0,
  });

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uBass = gl.getUniformLocation(prog, 'u_bass');
    const uMid = gl.getUniformLocation(prog, 'u_mid');
    const uTreble = gl.getUniformLocation(prog, 'u_treble');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uMouseActive = gl.getUniformLocation(prog, 'u_mouseActive');
    const uShockPos = gl.getUniformLocation(prog, 'u_shockPos');
    const uShockTime = gl.getUniformLocation(prog, 'u_shockTime');
    const uC1 = gl.getUniformLocation(prog, 'u_c1');
    const uC2 = gl.getUniformLocation(prog, 'u_c2');
    const uC3 = gl.getUniformLocation(prog, 'u_c3');
    const uMode = gl.getUniformLocation(prog, 'u_mode');
    const uTrans = gl.getUniformLocation(prog, 'u_transparentBg');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const vC1 = hexToVec3(c1Hex);
    const vC2 = hexToVec3(c2Hex);
    const vC3 = hexToVec3(c3Hex);

    let raf = 0;
    let lastTs = performance.now();
    let fpsCounter = 0;
    let fpsTimer = lastTs;

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      fpsCounter++;
      if (now - fpsTimer >= 600) {
        const measured = Math.round((fpsCounter * 1000) / (now - fpsTimer));
        onFps?.(measured);
        fpsCounter = 0;
        fpsTimer = now;
      }

      const bands = lenkyxAudioEngine.sampleBands();
      let bass = bands.bass;
      let mid = bands.mid;
      let treble = bands.treble;

      const t = interactionRef.current.shaderTime;
      if (bass < 0.01 && mid < 0.01) {
        if (isPlaying) {
          const beatHz = bpm / 60;
          bass = Math.pow(Math.abs(Math.sin(t * Math.PI * beatHz * 0.5)), 1.8 * sharpness) * 0.72 * kickPower;
          mid = 0.35 + 0.35 * Math.sin(t * 2.4);
          treble = 0.3 + 0.4 * Math.abs(Math.cos(t * 4.3));
        } else {
          bass = 0.08;
          mid = 0.12;
          treble = 0.1;
        }
      }

      interactionRef.current.shaderTime += dt * (isPlaying ? 1.0 + bass * 0.55 : 0.35);
      interactionRef.current.mouseActive *= 0.985;

      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, interactionRef.current.shaderTime);
      gl.uniform1f(uBass, Math.min(1.4, bass));
      gl.uniform1f(uMid, Math.min(1.4, mid));
      gl.uniform1f(uTreble, Math.min(1.4, treble));
      gl.uniform2f(uMouse, interactionRef.current.mouseX, 1.0 - interactionRef.current.mouseY);
      gl.uniform1f(uMouseActive, interactionRef.current.mouseActive);
      gl.uniform2f(uShockPos, interactionRef.current.shockX, 1.0 - interactionRef.current.shockY);
      gl.uniform1f(uShockTime, interactionRef.current.shockTime);
      gl.uniform3f(uC1, vC1[0], vC1[1], vC1[2]);
      gl.uniform3f(uC2, vC2[0], vC2[1], vC2[2]);
      gl.uniform3f(uC3, vC3[0], vC3[1], vC3[2]);
      gl.uniform1f(
        uMode,
        mode === 'shader_blackhole' ? 2.0 : mode === 'shader_nebula' ? 1.0 : 0.0
      );
      gl.uniform1f(uTrans, hasBackgroundImage ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [active, mode, isPlaying, bpm, sharpness, kickPower, c1Hex, c2Hex, c3Hex, hasBackgroundImage, onFps]);

  useEffect(() => {
    if (!active) return;
    const onMove = (x: number, y: number) => {
      interactionRef.current.mouseX = x / Math.max(1, window.innerWidth);
      interactionRef.current.mouseY = y / Math.max(1, window.innerHeight);
      interactionRef.current.mouseActive = 1.0;
    };
    const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onBurst = (x: number, y: number) => {
      interactionRef.current.shockX = x / Math.max(1, window.innerWidth);
      interactionRef.current.shockY = y / Math.max(1, window.innerHeight);
      interactionRef.current.shockTime = interactionRef.current.shaderTime;
    };
    const onClick = (e: MouseEvent) => onBurst(e.clientX, e.clientY);

    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mousedown', onClick, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mousedown', onClick);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

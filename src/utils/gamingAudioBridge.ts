// Universal Music-While-Gaming Engine (Mobile, PC, Console & Cloud Gaming)
// Enables continuous music playback inside/behind ALL games via:
// 1. Document Picture-in-Picture (PC Chrome/Edge floating HUD over Steam, Valorant, GTA, Roblox, etc.)
// 2. Canvas-Stream Video Picture-in-Picture (Mobile Android/iOS floating mini-HUD over Free Fire, PUBG, CODM, etc.)
// 3. Mobile AudioSession & Keepalive Guard (recovers automatically if a game ducks/steals audio focus)
// 4. Game FPS Boost Mode (pauses heavy background WebGL/blur effects inside LENKYX so games keep max FPS)

export interface GamingPipState {
  title: string;
  artist: string;
  coverUrl?: string;
  isPlaying: boolean;
}

export interface GamingPipHandlers {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const GAMING_MODE_KEY = 'lenkyx_gaming_mode_v1';
const GAMING_FPS_BOOST_KEY = 'lenkyx_gaming_fps_boost_v1';

let activeDocPipWindow: Window | null = null;
let activeCanvasPipVideo: HTMLVideoElement | null = null;
let activeCanvasPipTimer: number | null = null;
let currentPipMeta: GamingPipState = {
  title: 'LENKYX Cosmic Phonk',
  artist: 'LENKYX',
  coverUrl: '/covers/icon-512.png',
  isPlaying: false,
};
let currentHandlers: GamingPipHandlers | null = null;

export function isGamingModeStored(): boolean {
  try {
    return localStorage.getItem(GAMING_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isGamingFpsBoostStored(): boolean {
  try {
    return localStorage.getItem(GAMING_FPS_BOOST_KEY) === '1';
  } catch {
    return false;
  }
}

export function applyGamingFpsBoostClass(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  if (enabled) {
    document.documentElement.classList.add('lenkyx-gamer-fps-boost');
  } else {
    document.documentElement.classList.remove('lenkyx-gamer-fps-boost');
  }
  try {
    localStorage.setItem(GAMING_FPS_BOOST_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export function setGamingModeActive(enabled: boolean): void {
  try {
    localStorage.setItem(GAMING_MODE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
  // Configure browser AudioSession for persistent background playback alongside games (iOS Safari 17+ / modern Chrome)
  try {
    const navAny = navigator as unknown as { audioSession?: { type: string } };
    if (navAny.audioSession) {
      navAny.audioSession.type = enabled ? 'playback' : 'ambient';
    }
  } catch {
    // ignore unsupported
  }
}

export function updateGamingPipMetadata(meta: GamingPipState, handlers?: GamingPipHandlers): void {
  currentPipMeta = meta;
  if (handlers) currentHandlers = handlers;

  if (activeDocPipWindow && !activeDocPipWindow.closed) {
    const doc = activeDocPipWindow.document;
    const tEl = doc.getElementById('lx-pip-title');
    const aEl = doc.getElementById('lx-pip-artist');
    const pBtn = doc.getElementById('lx-pip-play');
    const imgEl = doc.getElementById('lx-pip-cover') as HTMLImageElement | null;
    if (tEl) tEl.textContent = meta.title || 'LENKYX';
    if (aEl) aEl.textContent = meta.artist || 'LENKYX';
    if (pBtn) pBtn.textContent = meta.isPlaying ? '⏸' : '▶';
    if (imgEl && meta.coverUrl) {
      try {
        imgEl.src = new URL(meta.coverUrl, window.location.origin).href;
      } catch {
        // ignore
      }
    }
  }
}

export function isGamingPipOpen(): boolean {
  const docOpen = Boolean(activeDocPipWindow && !activeDocPipWindow.closed);
  const vidOpen = Boolean(
    activeCanvasPipVideo && document.pictureInPictureElement === activeCanvasPipVideo
  );
  return docOpen || vidOpen;
}

export async function closeGamingFloatingPlayer(): Promise<void> {
  if (activeDocPipWindow && !activeDocPipWindow.closed) {
    try {
      activeDocPipWindow.close();
    } catch {
      // ignore
    }
  }
  activeDocPipWindow = null;

  if (activeCanvasPipTimer !== null) {
    window.clearInterval(activeCanvasPipTimer);
    activeCanvasPipTimer = null;
  }
  if (document.pictureInPictureElement) {
    try {
      await document.exitPictureInPicture();
    } catch {
      // ignore
    }
  }
  if (activeCanvasPipVideo) {
    try {
      activeCanvasPipVideo.pause();
      activeCanvasPipVideo.remove();
    } catch {
      // ignore
    }
    activeCanvasPipVideo = null;
  }
}

export async function openGamingFloatingPlayer(
  meta: GamingPipState,
  handlers: GamingPipHandlers
): Promise<'document-pip' | 'video-pip' | 'unsupported'> {
  currentPipMeta = meta;
  currentHandlers = handlers;

  // 1. Prefer Document Picture-in-Picture (Full interactive neon overlay on PC Games!)
  const docPipApi = (
    window as unknown as {
      documentPictureInPicture?: {
        requestWindow: (opts: { width: number; height: number }) => Promise<Window>;
      };
    }
  ).documentPictureInPicture;

  if (docPipApi?.requestWindow) {
    try {
      if (activeDocPipWindow && !activeDocPipWindow.closed) {
        activeDocPipWindow.focus();
        updateGamingPipMetadata(meta, handlers);
        return 'document-pip';
      }
      const pipWin = await docPipApi.requestWindow({ width: 340, height: 150 });
      activeDocPipWindow = pipWin;
      const doc = pipWin.document;
      const coverSrc = new URL(meta.coverUrl || '/covers/icon-512.png', window.location.origin).href;

      doc.body.style.cssText =
        'margin:0;padding:12px;background:linear-gradient(135deg,#070216,#16062c);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;justify-content:space-between;height:100vh;box-sizing:border-box;overflow:hidden;';

      doc.body.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <img id="lx-pip-cover" src="${coverSrc}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;border:1px solid rgba(56,189,248,0.6);flex-shrink:0;" />
          <div style="min-width:0;flex:1;">
            <div style="font-size:10px;font-weight:800;letter-spacing:0.14em;color:#67e8f9;text-transform:uppercase;">🎮 LENKYX GAMER HUD</div>
            <div id="lx-pip-title" style="font-size:13px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
            <div id="lx-pip-artist" style="font-size:11px;color:#e9d5ff;opacity:0.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:14px;padding-top:6px;">
          <button id="lx-pip-prev" style="border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;width:36px;height:36px;border-radius:999px;font-size:14px;cursor:pointer;">⏮</button>
          <button id="lx-pip-play" style="border:none;background:linear-gradient(135deg,#ec4899,#22d3ee);color:#000;width:44px;height:44px;border-radius:999px;font-size:16px;font-weight:900;cursor:pointer;">${meta.isPlaying ? '⏸' : '▶'}</button>
          <button id="lx-pip-next" style="border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;width:36px;height:36px;border-radius:999px;font-size:14px;cursor:pointer;">⏭</button>
        </div>
      `;

      const tEl = doc.getElementById('lx-pip-title');
      const aEl = doc.getElementById('lx-pip-artist');
      if (tEl) tEl.textContent = meta.title || 'LENKYX';
      if (aEl) aEl.textContent = meta.artist || 'LENKYX';

      doc.getElementById('lx-pip-prev')?.addEventListener('click', () => currentHandlers?.onPrev());
      doc.getElementById('lx-pip-play')?.addEventListener('click', () => currentHandlers?.onTogglePlay());
      doc.getElementById('lx-pip-next')?.addEventListener('click', () => currentHandlers?.onNext());

      pipWin.addEventListener('pagehide', () => {
        activeDocPipWindow = null;
      });
      return 'document-pip';
    } catch {
      // fall through to Canvas-Video PiP
    }
  }

  // 2. Canvas-Stream <video> PiP (Works on Mobile Android/iOS & all browsers!)
  if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled) {
    try {
      await closeGamingFloatingPlayer();

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      const coverImg = new Image();
      coverImg.crossOrigin = 'anonymous';
      coverImg.src = new URL(meta.coverUrl || '/covers/icon-512.png', window.location.origin).href;

      let frame = 0;
      const drawHud = () => {
        if (!ctx) return;
        frame++;
        const grad = ctx.createLinearGradient(0, 0, 480, 240);
        grad.addColorStop(0, '#050112');
        grad.addColorStop(1, '#190634');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 480, 240);

        // Animated neon glow ring
        ctx.strokeStyle = currentPipMeta.isPlaying ? '#22d3ee' : '#ec4899';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 460, 220);

        // Cover art
        try {
          if (coverImg.complete && coverImg.naturalWidth > 0) {
            ctx.drawImage(coverImg, 28, 45, 130, 130);
          }
        } catch {
          // ignore
        }

        // Gamer badge + text
        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('🎮 LENKYX · MODO JOGOS', 178, 66);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText((currentPipMeta.title || 'LENKYX').slice(0, 22), 178, 106);

        ctx.fillStyle = '#e9d5ff';
        ctx.font = '16px sans-serif';
        ctx.fillText((currentPipMeta.artist || 'LENKYX').slice(0, 26), 178, 136);

        // Equalizer bars
        for (let i = 0; i < 14; i++) {
          const h = currentPipMeta.isPlaying
            ? 10 + Math.abs(Math.sin(frame * 0.35 + i * 0.7)) * 34
            : 8;
          ctx.fillStyle = i % 2 === 0 ? '#ec4899' : '#22d3ee';
          ctx.fillRect(178 + i * 19, 196 - h, 11, h);
        }
      };

      drawHud();
      activeCanvasPipTimer = window.setInterval(drawHud, 180);

      const stream = canvas.captureStream ? canvas.captureStream(8) : null;
      if (!stream) return 'unsupported';

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0;';
      document.body.appendChild(video);
      activeCanvasPipVideo = video;

      await video.play();
      await video.requestPictureInPicture();
      video.addEventListener(
        'leavepictureinpicture',
        () => {
          void closeGamingFloatingPlayer();
        },
        { once: true }
      );
      return 'video-pip';
    } catch {
      return 'unsupported';
    }
  }

  return 'unsupported';
}

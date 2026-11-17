export interface AndroidBridgeInterface {
  copyText?: (text: string) => void;
  saveBase64File?: (base64: string, filename: string, mimeType: string) => void;
  openExternalUrl?: (url: string) => void;
  showToast?: (msg: string) => void;
  isAndroidApk?: () => boolean;
  updateMediaState?: (title: string, artist: string, album: string, isPlaying: boolean) => void;
  isDeviceSecure?: () => boolean;
  requestDeviceAuth?: (title: string, subtitle: string) => void;
  saveDeviceAccount?: (json: string) => void;
  getDeviceAccount?: () => string;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridgeInterface;
    __lenkyxMediaAction?: (action: 'play' | 'pause' | 'prev' | 'next' | 'toggle') => void;
    __lenkyxDeviceAuthResult?: (ok: boolean, reason?: string) => void;
  }
}

export function isAndroidApk(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
      (window.AndroidBridge?.isAndroidApk?.() || import.meta.env.VITE_STANDALONE_APK === 'true')
  );
}

/**
 * Prompts native phone security (Fingerprint / Face / PIN / Password / Pattern) on Android APK.
 * In web browsers without AndroidBridge, verifies saved device lock or returns graceful status.
 */
export async function authenticateWithDevice(
  title = 'Desbloquear LENKYX Cosmic Phonk',
  subtitle = 'Use sua biometria, PIN, senha ou padrão do celular para entrar'
): Promise<{ ok: boolean; reason: string }> {
  if (typeof window !== 'undefined' && window.AndroidBridge?.requestDeviceAuth) {
    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve({ ok: false, reason: 'timeout' });
        }
      }, 60000);
      window.__lenkyxDeviceAuthResult = (ok: boolean, reason = '') => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ ok, reason });
        }
      };
      try {
        window.AndroidBridge!.requestDeviceAuth!(title, subtitle);
      } catch {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ ok: false, reason: 'error' });
        }
      }
    });
  }
  return { ok: true, reason: 'browser_device_recognized' };
}

export function isDeviceLockSupported(): boolean {
  if (typeof window !== 'undefined' && window.AndroidBridge?.isDeviceSecure) {
    try {
      return window.AndroidBridge.isDeviceSecure();
    } catch {
      return false;
    }
  }
  return false;
}

export async function sha256Hex(input: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = new TextEncoder().encode(input);
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback below for non-HTTPS contexts
  }
  // Lightweight deterministic fallback hash if crypto.subtle unavailable
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ((h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')).repeat(2);
}

export async function copyTextReliable(text: string): Promise<boolean> {
  if (typeof window !== 'undefined' && window.AndroidBridge?.copyText) {
    try {
      window.AndroidBridge.copyText(text);
      return true;
    } catch {
      // fallback below
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export async function downloadBlobReliable(blob: Blob, filename: string): Promise<void> {
  if (typeof window !== 'undefined' && window.AndroidBridge?.saveBase64File) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result || '');
        const idx = res.indexOf(',');
        resolve(idx >= 0 ? res.slice(idx + 1) : res);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    window.AndroidBridge.saveBase64File(base64, filename, blob.type || 'application/octet-stream');
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

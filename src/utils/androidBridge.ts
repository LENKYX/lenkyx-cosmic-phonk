export interface AndroidBridgeInterface {
  copyText?: (text: string) => void;
  saveBase64File?: (base64: string, filename: string, mimeType: string) => void;
  openExternalUrl?: (url: string) => void;
  showToast?: (msg: string) => void;
  isAndroidApk?: () => boolean;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridgeInterface;
  }
}

export function isAndroidApk(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
      (window.AndroidBridge?.isAndroidApk?.() || import.meta.env.VITE_STANDALONE_APK === 'true')
  );
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

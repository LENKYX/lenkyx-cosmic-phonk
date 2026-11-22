import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * MORRO GOLD — VIDEO UX HELPERS
 *
 * 1) Proporção automática: detecta o formato real do vídeo (nativo) e mantém o
 *    quadro sempre na proporção certa, sem tarjas pretas laterais.
 * 2) Menus que somem: ao abrir o vídeo o menu some sozinho e volta ao tocar
 *    na tela (igual YouTube), com auto-hide após alguns segundos.
 */

export type AspectMode = 'auto' | '16/9' | '4/3' | '9/16';

export const ASPECT_PRESETS: {
  id: Exclude<AspectMode, 'auto'>;
  label: string;
  short: string;
  ratio: number;
}[] = [
  { id: '16/9', label: '16:9 · Widescreen', short: '16:9', ratio: 16 / 9 },
  { id: '4/3', label: '4:3 · Clássico', short: '4:3', ratio: 4 / 3 },
  { id: '9/16', label: '9:16 · Vertical (Vibe)', short: '9:16', ratio: 9 / 16 },
];

export const ASPECT_CYCLE: AspectMode[] = ['auto', '16/9', '4/3', '9/16'];

/** Ratio numérico final (auto usa o detectado; senão 16:9). */
export function aspectRatioValue(mode: AspectMode, detected?: number | null): number {
  if (mode === 'auto') return detected && detected > 0.15 && detected < 4 ? detected : 16 / 9;
  return ASPECT_PRESETS.find((p) => p.id === mode)?.ratio ?? 16 / 9;
}

export function aspectLabel(mode: AspectMode, detected?: number | null): string {
  if (mode === 'auto') {
    if (detected && detected > 0.15 && detected < 4) {
      const pct = Math.round(detected * 100) / 100;
      return `Auto · ${pct}:1`;
    }
    return 'Auto · 16:9';
  }
  return ASPECT_PRESETS.find((p) => p.id === mode)?.short ?? mode;
}

/** Hook de proporção: auto-detecção + troca manual (Auto → 16:9 → 4:3 → 9:16). */
export function useVideoAspect(initial: AspectMode = 'auto') {
  const [mode, setMode] = useState<AspectMode>(initial);
  const [detected, setDetected] = useState<number | null>(null);

  /** Chame no onLoadedMetadata de um <video> nativo. */
  const detect = useCallback((width?: number, height?: number) => {
    if (!width || !height) return;
    const r = width / height;
    if (!Number.isFinite(r) || r <= 0.15 || r >= 4) return;
    setDetected((prev) => (prev && Math.abs(prev - r) < 0.01 ? prev : r));
  }, []);

  const cycle = useCallback(() => {
    setMode((prev) => {
      const idx = ASPECT_CYCLE.indexOf(prev);
      return ASPECT_CYCLE[(idx + 1) % ASPECT_CYCLE.length];
    });
  }, []);

  const reset = useCallback(() => {
    setMode('auto');
    setDetected(null);
  }, []);

  return {
    mode,
    setMode,
    detected,
    detect,
    cycle,
    reset,
    ratio: aspectRatioValue(mode, detected),
    label: aspectLabel(mode, detected),
  };
}

/**
 * Calcula o tamanho exato de um quadro com proporção fixa dentro do espaço
 * disponível (evita tarjas pretas e mantém a proporção correta).
 */
export function useFittedSize(ref: RefObject<HTMLElement | null>, ratio: number) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!cw || !ch) return;
      const r = ratio > 0.15 && ratio < 4 ? ratio : 16 / 9;
      let w = cw;
      let h = cw / r;
      if (h > ch) {
        h = ch;
        w = ch * r;
      }
      const nextW = Math.max(1, Math.floor(w));
      const nextH = Math.max(1, Math.floor(h));
      setSize((prev) =>
        prev.width === nextW && prev.height === nextH ? prev : { width: nextW, height: nextH }
      );
    };

    update();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [ref, ratio]);

  return size;
}

/**
 * Menus de vídeo que se escondem sozinhos e voltam ao tocar na tela.
 * `visible` controla a opacidade/pointer-events dos controls.
 */
export function useAutoHideChrome({ enabled = true, delayMs = 3200 }: { enabled?: boolean; delayMs?: number } = {}) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const arm = useCallback(() => {
    clear();
    if (!enabledRef.current) return;
    timerRef.current = window.setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
    }, delayMs);
  }, [clear, delayMs]);

  const show = useCallback(() => {
    visibleRef.current = true;
    setVisible(true);
    arm();
  }, [arm]);

  const hide = useCallback(() => {
    clear();
    visibleRef.current = false;
    setVisible(false);
  }, [clear]);

  const toggle = useCallback(() => {
    if (visibleRef.current) hide();
    else show();
  }, [hide, show]);

  const keepAlive = useCallback(() => {
    if (visibleRef.current) arm();
  }, [arm]);

  useEffect(() => {
    if (!enabled) {
      clear();
      visibleRef.current = true;
      setVisible(true);
      return;
    }
    arm();
    return clear;
  }, [enabled, arm, clear]);

  return { visible, show, hide, toggle, keepAlive };
}

/** Classe de transição padrão para menus que somem/voltam. */
export const CHROME_HIDE_CLASS =
  'transition-all duration-300 ease-out';

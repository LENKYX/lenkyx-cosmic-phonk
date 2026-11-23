// Sentry — monitor de erros do app MORRO GOLD.
// Ativa SÓ quando o criador colar o DSN em ⚙️ (padrão das credenciais).
// Sem DSN = zero carregamento, zero custo, app normal.

import * as SentryLib from '@sentry/react';

let started = false;

export function initSentry(dsn: string): void {
  const clean = (dsn || '').trim();
  if (!clean || started) return;
  try {
    SentryLib.init({
      dsn: clean,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
    started = true;
  } catch {
    /* ignore */
  }
}

export function captureError(err: unknown, extra?: Record<string, unknown>): void {
  try {
    if (started) SentryLib.captureException(err, extra ? { extra } : undefined);
  } catch {
    /* ignore */
  }
}

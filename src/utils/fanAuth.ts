import { UserProfile } from '../types';
import { isAndroidApk, sha256Hex } from './androidBridge';

const DEVICE_ACCOUNTS_KEY = 'lenkyx_device_accounts_v1';
const CLOUD_API_BASE = 'https://lenkyx-cosmic-phonk.onrender.com';

interface StoredLocalAccount extends UserProfile {
  passwordHash?: string;
  resetCode?: string;
  resetExpiresMs?: number;
}

function normalizePhone(raw?: string): string {
  return raw ? raw.replace(/\D/g, '') : '';
}

function normalizeEmail(raw?: string): string {
  return raw ? raw.trim().toLowerCase() : '';
}

function apiTargets(): string[] {
  return isAndroidApk() ? [CLOUD_API_BASE] : ['', CLOUD_API_BASE];
}

async function postFanAuth<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  for (const base of apiTargets()) {
    try {
      const r = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4500),
      });
      if (r.ok || r.status === 401 || r.status === 404 || r.status === 400) {
        return (await r.json()) as T;
      }
    } catch {
      // try next target or local fallback
    }
  }
  return null;
}

export function loadDeviceAccounts(): StoredLocalAccount[] {
  const list: StoredLocalAccount[] = [];
  try {
    const raw = localStorage.getItem(DEVICE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list.push(...parsed);
    }
  } catch {
    // ignore
  }
  try {
    const nativeJson = window.AndroidBridge?.getDeviceAccount?.();
    if (nativeJson) {
      const nativeUser = JSON.parse(nativeJson) as StoredLocalAccount;
      if (nativeUser?.id && !list.some((u) => u.id === nativeUser.id)) {
        list.unshift(nativeUser);
      }
    }
  } catch {
    // ignore
  }
  return list;
}

export function saveDeviceAccount(account: StoredLocalAccount): void {
  const existing = loadDeviceAccounts().filter((u) => u.id !== account.id);
  const next = [account, ...existing].slice(0, 5);
  try {
    localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  try {
    window.AndroidBridge?.saveDeviceAccount?.(JSON.stringify(account));
  } catch {
    // ignore
  }
}

export function getPrimaryDeviceAccount(): StoredLocalAccount | null {
  const list = loadDeviceAccounts();
  return list[0] || null;
}

export async function registerFanAccount(params: {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatarColor: string;
  deviceUnlockEnabled: boolean;
  acceptedTermsAt: string;
  createdAt?: string;
}): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  const name = params.name.trim();
  const email = normalizeEmail(params.email);
  const phone = normalizePhone(params.phone);
  if (!name) return { ok: false, error: 'Informe seu nome ou apelido.' };
  if (!email && !phone) {
    return { ok: false, error: 'Informe seu número de celular (WhatsApp/SMS) ou e-mail.' };
  }

  const passwordHash = params.password ? await sha256Hex(params.password) : undefined;
  const localProfile: StoredLocalAccount = {
    id: params.id || 'fan-' + Date.now().toString(36),
    name,
    email: email || undefined,
    phone: phone || undefined,
    passwordHash,
    deviceUnlockEnabled: params.deviceUnlockEnabled,
    avatarColor: params.avatarColor,
    acceptedTermsAt: params.acceptedTermsAt,
    createdAt: params.createdAt || new Date().toISOString(),
  };

  saveDeviceAccount(localProfile);

  const cloud = await postFanAuth<{ ok?: boolean; user?: UserProfile; error?: string }>('/api/fan-auth/register', {
    ...localProfile,
    passwordHash,
  });

  if (cloud?.ok && cloud.user) {
    const merged: StoredLocalAccount = {
      ...cloud.user,
      passwordHash,
      deviceUnlockEnabled: params.deviceUnlockEnabled,
    };
    saveDeviceAccount(merged);
    return { ok: true, user: merged };
  }

  return { ok: true, user: localProfile };
}

export async function loginFanAccount(
  identifier: string,
  password: string
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  const cleanId = identifier.trim();
  if (!cleanId) return { ok: false, error: 'Informe seu número de celular ou e-mail.' };
  const passwordHash = password ? await sha256Hex(password) : '';

  const email = normalizeEmail(cleanId);
  const phone = normalizePhone(cleanId);

  // Check cloud backend first if online
  const cloud = await postFanAuth<{ ok?: boolean; user?: UserProfile; error?: string }>('/api/fan-auth/login', {
    identifier: cleanId,
    passwordHash,
  });
  if (cloud?.ok && cloud.user) {
    const merged: StoredLocalAccount = {
      ...cloud.user,
      passwordHash: passwordHash || undefined,
    };
    saveDeviceAccount(merged);
    return { ok: true, user: merged };
  }

  // Check saved accounts on this phone/browser
  const localList = loadDeviceAccounts();
  const localMatch = localList.find(
    (u) =>
      (email && email.includes('@') && normalizeEmail(u.email) === email) ||
      (phone && phone.length >= 8 && normalizePhone(u.phone) === phone)
  );
  if (localMatch) {
    if (localMatch.passwordHash && localMatch.passwordHash !== passwordHash) {
      return { ok: false, error: 'Senha incorreta. Tente novamente ou recupere sua senha.' };
    }
    saveDeviceAccount(localMatch);
    return { ok: true, user: localMatch };
  }

  return {
    ok: false,
    error: cloud?.error || 'Conta não encontrada com esse número ou e-mail. Crie seu cadastro grátis!',
  };
}

export async function requestFanPasswordRecovery(identifier: string): Promise<{
  ok: boolean;
  code?: string;
  name?: string;
  email?: string;
  phone?: string;
  error?: string;
}> {
  const cleanId = identifier.trim();
  if (!cleanId) return { ok: false, error: 'Digite seu celular/WhatsApp ou e-mail cadastrado.' };

  const cloud = await postFanAuth<{
    ok?: boolean;
    code?: string;
    name?: string;
    email?: string;
    phone?: string;
    error?: string;
  }>('/api/fan-auth/recover-request', { identifier: cleanId });

  if (cloud?.ok && cloud.code) {
    return {
      ok: true,
      code: cloud.code,
      name: cloud.name,
      email: cloud.email,
      phone: cloud.phone,
    };
  }

  // Local device fallback if offline
  const email = normalizeEmail(cleanId);
  const phone = normalizePhone(cleanId);
  const localList = loadDeviceAccounts();
  const match = localList.find(
    (u) =>
      (email && email.includes('@') && normalizeEmail(u.email) === email) ||
      (phone && phone.length >= 8 && normalizePhone(u.phone) === phone)
  );
  if (!match) {
    return { ok: false, error: cloud?.error || 'Conta não encontrada neste celular ou na nuvem.' };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  match.resetCode = code;
  match.resetExpiresMs = Date.now() + 15 * 60 * 1000;
  saveDeviceAccount(match);

  return {
    ok: true,
    code,
    name: match.name,
    email: match.email,
    phone: match.phone,
  };
}

export async function verifyFanPasswordRecovery(
  identifier: string,
  code: string,
  newPassword: string
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  if (!newPassword.trim() || newPassword.trim().length < 4) {
    return { ok: false, error: 'Escolha uma nova senha com pelo menos 4 caracteres.' };
  }
  const newPasswordHash = await sha256Hex(newPassword.trim());

  const cloud = await postFanAuth<{ ok?: boolean; user?: UserProfile; error?: string }>(
    '/api/fan-auth/recover-verify',
    {
      identifier: identifier.trim(),
      code: code.trim(),
      newPasswordHash,
    }
  );
  if (cloud?.ok && cloud.user) {
    const merged: StoredLocalAccount = { ...cloud.user, passwordHash: newPasswordHash };
    saveDeviceAccount(merged);
    return { ok: true, user: merged };
  }

  const email = normalizeEmail(identifier);
  const phone = normalizePhone(identifier);
  const match = loadDeviceAccounts().find(
    (u) =>
      (email && email.includes('@') && normalizeEmail(u.email) === email) ||
      (phone && phone.length >= 8 && normalizePhone(u.phone) === phone)
  );
  if (match && match.resetCode === code.trim() && (!match.resetExpiresMs || Date.now() <= match.resetExpiresMs)) {
    const updated: StoredLocalAccount = {
      ...match,
      passwordHash: newPasswordHash,
      resetCode: undefined,
      resetExpiresMs: undefined,
    };
    saveDeviceAccount(updated);
    return { ok: true, user: updated };
  }

  return { ok: false, error: cloud?.error || 'Código de recuperação inválido ou expirado.' };
}

// LGPD: remove a conta local do aparelho (por e-mail ou id).
export function deleteDeviceAccount(emailOrId: string): void {
  const target = (emailOrId || '').trim().toLowerCase();
  if (!target) return;
  const rest = loadDeviceAccounts().filter(
    (a) => (a.email || '').trim().toLowerCase() !== target && (a.id || '').trim().toLowerCase() !== target,
  );
  try {
    localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(rest));
  } catch {
    // ignore
  }
  try {
    window.AndroidBridge?.saveDeviceAccount?.(rest[0] ? JSON.stringify(rest[0]) : '');
  } catch {
    // ignore
  }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const FAN_USERS_PATH = path.join(DATA_DIR, 'fan_users.json');

function getSupaConfig() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;
  return { url, key };
}

function readLocalUsers() {
  try {
    if (fs.existsSync(FAN_USERS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(FAN_USERS_PATH, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function writeLocalUsers(users) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FAN_USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

function normalizePhone(raw) {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '');
}

function normalizeEmail(raw) {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

async function supaQuery(pathname, opts = {}) {
  const cfg = getSupaConfig();
  if (!cfg) return null;
  const r = await fetch(`${cfg.url}/rest/v1/${pathname}`, {
    ...opts,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation',
      ...(opts.headers || {}),
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) return null;
  return r.json();
}

function sanitizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email || undefined,
    phone: u.phone || undefined,
    avatarColor: u.avatar_color || u.avatarColor || 'from-pink-500 to-purple-600',
    deviceUnlockEnabled: u.device_unlock_enabled ?? u.deviceUnlockEnabled ?? true,
    acceptedTermsAt: u.accepted_terms_at || u.acceptedTermsAt || undefined,
    createdAt: u.created_at || u.createdAt || new Date().toISOString(),
  };
}

async function findByIdentifier(identifier) {
  const email = normalizeEmail(identifier);
  const phone = normalizePhone(identifier);
  const cfg = getSupaConfig();

  if (cfg) {
    if (email && email.includes('@')) {
      const rows = await supaQuery(`lenkyx_users?email=ilike.${encodeURIComponent(email)}&limit=1`);
      if (Array.isArray(rows) && rows[0]) return rows[0];
    }
    if (phone && phone.length >= 8) {
      const rows = await supaQuery(`lenkyx_users?phone=eq.${encodeURIComponent(phone)}&limit=1`);
      if (Array.isArray(rows) && rows[0]) return rows[0];
    }
  }

  const local = readLocalUsers();
  return (
    local.find(
      (u) =>
        (email && email.includes('@') && normalizeEmail(u.email) === email) ||
        (phone && phone.length >= 8 && normalizePhone(u.phone) === phone)
    ) || null
  );
}

export async function registerFanUser(payload) {
  const name = String(payload.name || '').trim();
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const passwordHash = String(payload.passwordHash || '').trim();
  const avatarColor = String(payload.avatarColor || 'from-pink-500 to-purple-600');
  const deviceUnlockEnabled = payload.deviceUnlockEnabled !== false;
  const acceptedTermsAt = payload.acceptedTermsAt || new Date().toISOString();

  if (!name) throw new Error('Informe seu nome.');
  if (!email && !phone) throw new Error('Informe seu número de celular ou e-mail.');

  const existing =
    (email ? await findByIdentifier(email) : null) ||
    (phone ? await findByIdentifier(phone) : null);

  const now = new Date().toISOString();
  const row = {
    id: existing?.id || payload.id || 'fan-' + Date.now().toString(36),
    name,
    email: email || existing?.email || null,
    phone: phone || existing?.phone || null,
    avatar_color: avatarColor,
    password_hash: passwordHash || existing?.password_hash || null,
    device_unlock_enabled: deviceUnlockEnabled,
    accepted_terms_at: acceptedTermsAt,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  const local = readLocalUsers().filter((u) => u.id !== row.id);
  local.unshift(row);
  writeLocalUsers(local);

  const cfg = getSupaConfig();
  if (cfg) {
    try {
      await supaQuery('lenkyx_users?on_conflict=id', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=representation',
        body: JSON.stringify(row),
      });
    } catch {
      // keep local copy
    }
  }

  return sanitizeUser(row);
}

export async function loginFanUser(identifier, passwordHash) {
  const user = await findByIdentifier(identifier);
  if (!user) return { ok: false, error: 'Conta não encontrada. Verifique o número/e-mail ou crie sua conta.' };
  const storedHash = user.password_hash || user.passwordHash || '';
  if (storedHash && passwordHash !== storedHash) {
    return { ok: false, error: 'Senha incorreta. Tente novamente ou recupere sua senha.' };
  }
  return { ok: true, user: sanitizeUser(user) };
}

export async function requestPasswordRecovery(identifier) {
  const user = await findByIdentifier(identifier);
  if (!user) {
    return { ok: false, error: 'Nenhuma conta encontrada com esse celular ou e-mail.' };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const local = readLocalUsers().map((u) =>
    u.id === user.id ? { ...u, reset_code: code, reset_expires: expires } : u
  );
  writeLocalUsers(local);

  const cfg = getSupaConfig();
  if (cfg) {
    try {
      await supaQuery(`lenkyx_users?id=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ reset_code: code, reset_expires: expires, updated_at: new Date().toISOString() }),
      });
    } catch {
      // ignore
    }
  }

  return {
    ok: true,
    code,
    name: user.name,
    email: user.email || undefined,
    phone: user.phone || undefined,
  };
}

export async function verifyPasswordRecovery(identifier, code, newPasswordHash) {
  const user = await findByIdentifier(identifier);
  if (!user) return { ok: false, error: 'Conta não encontrada.' };
  const storedCode = String(user.reset_code || '').trim();
  const expiresMs = user.reset_expires ? Date.parse(user.reset_expires) : 0;
  if (!storedCode || storedCode !== String(code).trim()) {
    return { ok: false, error: 'Código inválido.' };
  }
  if (expiresMs && Date.now() > expiresMs) {
    return { ok: false, error: 'Código expirado. Peça um novo código.' };
  }

  const local = readLocalUsers().map((u) =>
    u.id === user.id
      ? {
          ...u,
          password_hash: newPasswordHash,
          reset_code: null,
          reset_expires: null,
          updated_at: new Date().toISOString(),
        }
      : u
  );
  writeLocalUsers(local);

  const cfg = getSupaConfig();
  if (cfg) {
    try {
      await supaQuery(`lenkyx_users?id=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          password_hash: newPasswordHash,
          reset_code: null,
          reset_expires: null,
          updated_at: new Date().toISOString(),
        }),
      });
    } catch {
      // ignore
    }
  }

  return { ok: true, user: sanitizeUser(user) };
}

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'lenkyx2026';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 12;
const WINDOW_MS = 15 * 60 * 1000;

export function createAuthManager(dataDir) {
  const authPath = path.join(dataDir, 'auth.json');

  function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  function loadAuthConfig() {
    if (fs.existsSync(authPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
        // If ADMIN_PASSWORD env var is set in hosting (Render/Railway), sync it automatically unless user changed it via UI
        if (process.env.ADMIN_PASSWORD && !parsed.hasCustomPassword) {
          const newHash = hashPassword(process.env.ADMIN_PASSWORD, parsed.salt);
          if (newHash !== parsed.passwordHash) {
            parsed.passwordHash = newHash;
            parsed.hasCustomPassword = true;
            fs.writeFileSync(authPath, JSON.stringify(parsed, null, 2), 'utf-8');
          }
        }
        return parsed;
      } catch {
        // regenerate below
      }
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const secret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
    const cfg = {
      salt,
      secret,
      passwordHash: hashPassword(DEFAULT_PASSWORD, salt),
      hasCustomPassword: Boolean(process.env.ADMIN_PASSWORD),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(authPath, JSON.stringify(cfg, null, 2), 'utf-8');
    return cfg;
  }

  function saveAuthConfig(cfg) {
    fs.writeFileSync(authPath, JSON.stringify(cfg, null, 2), 'utf-8');
  }

  function verifyPassword(password) {
    const cfg = loadAuthConfig();
    const candidate = hashPassword(String(password || ''), cfg.salt);
    const a = Buffer.from(candidate, 'hex');
    const b = Buffer.from(cfg.passwordHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  function changePassword(newPassword) {
    const cfg = loadAuthConfig();
    const newSalt = crypto.randomBytes(16).toString('hex');
    cfg.salt = newSalt;
    cfg.passwordHash = hashPassword(newPassword, newSalt);
    cfg.hasCustomPassword = true;
    cfg.updatedAt = new Date().toISOString();
    // Rotate signing secret so old tokens get invalidated
    cfg.secret = crypto.randomBytes(32).toString('hex');
    saveAuthConfig(cfg);
    return signToken();
  }

  function signToken() {
    const cfg = loadAuthConfig();
    const payload = Buffer.from(
      JSON.stringify({
        role: 'creator',
        iat: Date.now(),
        exp: Date.now() + TOKEN_TTL_MS,
      })
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', cfg.secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  function verifyToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return false;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const cfg = loadAuthConfig();
    const expected = crypto.createHmac('sha256', cfg.secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
      return data.role === 'creator' && typeof data.exp === 'number' && data.exp > Date.now();
    } catch {
      return false;
    }
  }

  function extractToken(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) return header.slice(7).trim();
    return null;
  }

  function isAuthenticated(req) {
    return verifyToken(extractToken(req));
  }

  function requireCreator(req, res, next) {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Acesso restrito ao Criador LENKYX. Faça login com sua senha.' });
    }
    next();
  }

  function checkRateLimit(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
      return { allowed: true };
    }
    if (entry.count >= MAX_ATTEMPTS) {
      const mins = Math.ceil((entry.resetAt - now) / 60000);
      return { allowed: false, mins };
    }
    return { allowed: true };
  }

  function recordFailedAttempt(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
      loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count += 1;
    }
  }

  function clearAttempts(ip) {
    loginAttempts.delete(ip);
  }

  function getStatus(req) {
    const cfg = loadAuthConfig();
    return {
      authenticated: isAuthenticated(req),
      hasCustomPassword: Boolean(cfg.hasCustomPassword),
    };
  }

  // Ensure auth.json exists at startup
  loadAuthConfig();

  return {
    verifyPassword,
    changePassword,
    signToken,
    isAuthenticated,
    requireCreator,
    checkRateLimit,
    recordFailedAttempt,
    clearAttempts,
    getStatus,
  };
}

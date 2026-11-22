// Nuvem MORRO GOLD · Supabase via REST — login Google/e-mail + dados do cliente em qualquer aparelho.
// Sem dependências externas: usa fetch direto na API do Supabase.

export interface CloudSession {
  access_token: string;
  refresh_token?: string;
  user: { id: string; email?: string };
}

const LS_SESSION = 'mg_cloud_session';

const headersFor = (anon: string, token?: string): Record<string, string> => ({
  apikey: anon,
  Authorization: `Bearer ${token || anon}`,
  'Content-Type': 'application/json',
});

export function getCloudSession(): CloudSession | null {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    return raw ? (JSON.parse(raw) as CloudSession) : null;
  } catch {
    return null;
  }
}

export function saveCloudSession(s: CloudSession | null): void {
  try {
    if (s) localStorage.setItem(LS_SESSION, JSON.stringify(s));
    else localStorage.removeItem(LS_SESSION);
  } catch {
    /* ignore */
  }
}

export function cloudSignOut(): void {
  saveCloudSession(null);
}

export async function cloudSignIn(
  url: string,
  anon: string,
  email: string,
  password: string,
): Promise<{ session?: CloudSession; error?: string }> {
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: headersFor(anon),
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok || !d?.access_token) return { error: d?.error_description || d?.msg || 'Falha no login' };
    const session: CloudSession = { access_token: d.access_token, refresh_token: d.refresh_token, user: d.user };
    saveCloudSession(session);
    return { session };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function cloudSignUp(
  url: string,
  anon: string,
  email: string,
  password: string,
): Promise<{ session?: CloudSession; error?: string }> {
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/signup`, {
      method: 'POST',
      headers: headersFor(anon),
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) return { error: d?.error_description || d?.msg || 'Falha ao criar conta' };
    if (d?.access_token) {
      const session: CloudSession = { access_token: d.access_token, refresh_token: d.refresh_token, user: d.user };
      saveCloudSession(session);
      return { session };
    }
    // Supabase pode retornar só o usuário (confirmação por e-mail exigida)
    return { error: 'Conta criada! Confirme o e-mail enviado pelo Supabase e faça o login.' };
  } catch (e) {
    return { error: String(e) };
  }
}

export function cloudGoogleUrl(url: string, anon: string, redirectTo: string): string {
  const base = url.replace(/\/$/, '');
  return `${base}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}&apikey=${encodeURIComponent(anon)}`;
}

export function cloudSessionFromHash(): CloudSession | null {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash.includes('access_token=')) return null;
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const userRaw = params.get('user');
    if (!access_token) return null;
    let user: CloudSession['user'] = { id: '' };
    try {
      if (userRaw) user = JSON.parse(decodeURIComponent(userRaw));
    } catch {
      /* ignore */
    }
    if (!user.id) {
      // fallback: decode do JWT para pegar o sub (id do usuário)
      try {
        const payload = JSON.parse(atob(access_token.split('.')[1]));
        user = { id: String(payload.sub || ''), email: payload.email };
      } catch {
        /* ignore */
      }
    }
    if (!user.id) return null;
    const session: CloudSession = { access_token, refresh_token: params.get('refresh_token') || undefined, user };
    saveCloudSession(session);
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    return session;
  } catch {
    return null;
  }
}

export async function cloudGet(
  url: string,
  anon: string,
  token: string,
  table: string,
  userId: string,
): Promise<any[]> {
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${table}?user_id=eq.${encodeURIComponent(userId)}&limit=1`, {
      headers: headersFor(anon, token),
    });
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

export async function cloudUpsert(
  url: string,
  anon: string,
  token: string,
  table: string,
  row: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`${url.replace(/\/$/, '')}/rest/v1/${table}?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        ...headersFor(anon, token),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
    });
  } catch {
    /* ignore */
  }
}

// LGPD: o próprio usuário apaga a conta dele no Supabase Auth.
export async function cloudDeleteSelf(url: string, anon: string, s: CloudSession): Promise<{ error?: string }> {
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'DELETE',
      headers: headersFor(anon, s.access_token),
    });
    if (!r.ok && r.status !== 204 && r.status !== 200) {
      const j = await r.json().catch(() => ({}));
      return { error: j?.msg || j?.error_description || `Falha ao excluir (${r.status})` };
    }
    return {};
  } catch {
    return { error: 'Sem conexão com a nuvem.' };
  }
}

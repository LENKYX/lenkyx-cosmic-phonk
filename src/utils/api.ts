import { isAndroidApk } from './androidBridge';
import { handleStandaloneApi } from './standaloneApi';

const TOKEN_KEY = 'lenkyx_creator_token_v1';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  if (isAndroidApk()) {
    return handleStandaloneApi(input, init);
  }
  return fetch(input, init);
}

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const reqInit = { ...init, headers };
  if (isAndroidApk()) {
    return handleStandaloneApi(input, reqInit);
  }
  return fetch(input, reqInit);
}

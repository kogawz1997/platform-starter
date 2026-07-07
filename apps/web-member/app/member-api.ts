export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiOptions = RequestInit & { skipAuth?: boolean };

export async function memberApiFetch(path: string, options: ApiOptions = {}) {
  const token = window.localStorage.getItem('member_access_token');
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (!options.skipAuth && token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status !== 401 || options.skipAuth) return res;

  const refreshed = await refreshMemberToken();
  if (!refreshed) {
    clearMemberSession();
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.replace(`/login?next=${next}`);
    return res;
  }

  headers.set('Authorization', `Bearer ${refreshed}`);
  const retry = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (retry.status === 401) {
    clearMemberSession();
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.replace(`/login?next=${next}`);
  }
  return retry;
}

export async function refreshMemberToken() {
  const refreshToken = window.localStorage.getItem('member_refresh_token');
  if (!refreshToken) return '';
  const res = await fetch(`${API_URL}/member/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken, deviceId: 'web-member' }) });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.accessToken) return '';
  window.localStorage.setItem('member_access_token', data.accessToken);
  if (data.refreshToken) window.localStorage.setItem('member_refresh_token', data.refreshToken);
  return data.accessToken as string;
}

export function clearMemberSession() {
  window.localStorage.removeItem('member_access_token');
  window.localStorage.removeItem('member_refresh_token');
}

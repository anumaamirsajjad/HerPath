const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) { super(`API ${status}`); this.status = status; this.data = data; }
}

/** Fires "logout" when the session can no longer be refreshed, so the UI can drop the signed-in user. */
export const authEvents = new EventTarget();

const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export function setTokens(t: { access: string; refresh: string }) {
  try { localStorage.setItem("access", t.access); localStorage.setItem("refresh", t.refresh); } catch {}
}
export function clearTokens() { try { localStorage.removeItem("access"); localStorage.removeItem("refresh"); } catch {} }
export const hasToken = () => !!get("access");

/** Log out: revoke the refresh token on the server (best effort) and forget both tokens here. */
export function revokeSession() {
  const refresh = get("refresh");
  clearTokens();
  if (refresh) fetch(`${BASE}/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh }) }).catch(() => {});
}

// Refresh tokens are single-use (rotated and blacklisted), so parallel 401s must share one refresh.
let refreshing: Promise<boolean> | null = null;
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const r = get("refresh");
    if (!r) return false;
    const res = await fetch(`${BASE}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: r }) });
    if (!res.ok) { clearTokens(); authEvents.dispatchEvent(new Event("logout")); return false; }
    const data = await res.json();
    setTokens({ access: data.access, refresh: data.refresh ?? r });
    return true;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit & { lang?: string } = {}, retry = true): Promise<T> {
  const { lang, ...rest } = init;
  const url = new URL(`${BASE}/${path}`);
  if (lang) url.searchParams.set("lang", lang);
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(rest.headers as Record<string, string>) };
  const token = get("access");
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...rest, headers });
  if (res.status === 401 && retry && token && (await refresh())) return api<T>(path, init, false);
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

/** Flatten a DRF error body into one readable line. */
export function errorText(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError) || !err.data || typeof err.data !== "object") return fallback;
  const parts: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(err.data);
  return parts.join(" ") || fallback;
}

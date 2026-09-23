"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearTokens, hasToken } from "./api";
import type { User } from "./types";

type AuthState = { user: User | null; loading: boolean; refresh: () => Promise<void>; logout: () => void };
const Ctx = createContext<AuthState>({ user: null, loading: true, refresh: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!hasToken()) { setUser(null); setLoading(false); return; }
    try { setUser(await api<User>("auth/me")); } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const logout = () => { clearTokens(); setUser(null); };
  return <Ctx.Provider value={{ user, loading, refresh, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);

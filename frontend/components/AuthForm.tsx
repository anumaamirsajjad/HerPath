"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { api, errorText, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Link, useRouter } from "@/i18n/routing";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setBusy(true);
    try {
      const tokens = await api<{ access: string; refresh: string }>(`auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password }) });
      setTokens(tokens); await refresh();
      router.push(mode === "signup" ? "/profile" : "/results");
    } catch (err) {
      setError(errorText(err, c("error")));
    } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">{t(mode)}</h1>
      <label className="block">{t("email")}<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border p-2" dir="ltr" /></label>
      <label className="block">{t("password")}<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border p-2" dir="ltr" /></label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded bg-emerald-700 p-2 text-white disabled:opacity-60">{t(mode)}</button>
      <p className="text-sm">
        {mode === "login"
          ? <><Link href="/forgot-password" className="underline">{t("forgot")}</Link> · {t("noAccount")} <Link href="/signup" className="underline">{t("signup")}</Link></>
          : <>{t("haveAccount")} <Link href="/login" className="underline">{t("login")}</Link></>}
      </p>
    </form>
  );
}

"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import AuthShell from "@/components/AuthShell";
import { ErrorNote, btn, field } from "@/components/ui";
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
    <AuthShell title={t(mode)} lead={t(mode === "login" ? "loginLead" : "signupLead")}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block font-bold">{t("email")}<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} dir="ltr" /></label>
        <label className="block font-bold">{t("password")}<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={field} dir="ltr" /></label>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button disabled={busy} className={`${btn.primary} w-full`}>{t(mode)}</button>
        <p className="space-y-1 text-sm">
          {mode === "login"
            ? <><Link href="/forgot-password" className={btn.link}>{t("forgot")}</Link><span className="block">{t("noAccount")} <Link href="/signup" className={btn.link}>{t("signup")}</Link></span></>
            : <>{t("haveAccount")} <Link href="/login" className={btn.link}>{t("login")}</Link></>}
        </p>
      </form>
    </AuthShell>
  );
}

"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AuthShell from "@/components/AuthShell";
import { ErrorNote, btn, field } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { Link } from "@/i18n/routing";

function Form() {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const q = useSearchParams();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    try {
      await api("auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ uid: q.get("uid"), token: q.get("token"), password }) });
      setDone(true);
    } catch (err) { setError(errorText(err, c("error"))); }
  }
  return (
    <AuthShell title={t("reset")}>
      {done ? (
        <div className="space-y-4"><p className="pop rounded-xl bg-leaf-soft p-4 font-bold text-leaf">{t("resetDone")}</p><Link href="/login" className={btn.primary}>{t("login")}</Link></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block font-bold">{t("password")}<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} dir="ltr" /></label>
          {error && <ErrorNote>{error}</ErrorNote>}
          <button className={`${btn.primary} w-full`}>{t("reset")}</button>
        </form>
      )}
    </AuthShell>
  );
}
export default function Page() { return <Suspense><Form /></Suspense>; }

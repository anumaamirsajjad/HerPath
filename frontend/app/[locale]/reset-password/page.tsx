"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  if (done) return <p>{t("resetDone")} <Link href="/login" className="underline">{t("login")}</Link></p>;
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3">
      <label className="block">{t("reset")}<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border p-2" dir="ltr" /></label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button className="w-full rounded bg-emerald-700 p-2 text-white">{t("reset")}</button>
    </form>
  );
}
export default function Page() { return <Suspense><Form /></Suspense>; }

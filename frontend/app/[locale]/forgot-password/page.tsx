"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { api, errorText } from "@/lib/api";

export default function Page() {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    try { await api("auth/password-reset", { method: "POST", body: JSON.stringify({ email }) }); setSent(true); }
    catch (err) { setError(errorText(err, c("error"))); }
  }
  if (sent) return <p>{t("resetSent")}</p>;
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3">
      <label className="block">{t("email")}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border p-2" dir="ltr" /></label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button className="w-full rounded bg-emerald-700 p-2 text-white">{t("sendReset")}</button>
    </form>
  );
}

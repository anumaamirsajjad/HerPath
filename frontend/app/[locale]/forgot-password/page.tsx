"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import AuthShell from "@/components/AuthShell";
import { ErrorNote, btn, field } from "@/components/ui";
import { api, errorText } from "@/lib/api";

export default function Page() {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const lang = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    try { await api("auth/password-reset", { method: "POST", body: JSON.stringify({ email, lang }) }); setSent(true); }
    catch (err) { setError(errorText(err, c("error"))); }
  }
  return (
    <AuthShell title={t("reset")} lead={sent ? undefined : t("forgotLead")}>
      {sent ? <p className="pop rounded-xl bg-leaf-soft p-4 font-bold text-leaf">{t("resetSent")}</p> : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block font-bold">{t("email")}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} dir="ltr" /></label>
          {error && <ErrorNote>{error}</ErrorNote>}
          <button className={`${btn.primary} w-full`}>{t("sendReset")}</button>
        </form>
      )}
    </AuthShell>
  );
}

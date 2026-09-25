"use client";
import { BarChart3, Languages, LogOut, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import RequireAuth from "@/components/RequireAuth";
import { ErrorNote, PageTitle, btn, card } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import type { Profile } from "@/lib/types";

function Settings() {
  const t = useTranslations("settings");
  const n = useTranslations("nav");
  const c = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [optOut, setOptOut] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { api<Profile>("profile").then((p) => setOptOut(p.analytics_opt_out)).catch(() => setOptOut(null)); }, []);
  async function toggle(v: boolean) {
    const prev = optOut;
    setOptOut(v); setError(false);
    try { await api("profile", { method: "PATCH", body: JSON.stringify({ analytics_opt_out: v }) }); }
    catch { setOptOut(prev); setError(true); }
  }
  async function del() {
    if (!confirm(t("deleteConfirm"))) return;
    setError(false);
    try { await api("auth/me", { method: "DELETE" }); }
    catch { setError(true); return; }
    logout(); alert(t("deleted")); router.push("/");
  }
  const lang = (l: "en" | "ur", label: string) => (
    <Link href={pathname} locale={l} aria-current={locale === l ? "true" : undefined}
      className={`flex-1 rounded-xl border-2 px-4 py-3 text-center font-bold transition ${locale === l ? "border-indigo bg-indigo text-white" : "border-line hover:border-indigo"}`}>{label}</Link>
  );
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title={t("title")} lead={t("lead")} />
      <div className="space-y-4">
        {error && <ErrorNote>{c("error")}</ErrorNote>}
        <section className={`${card} p-5`}>
          <h2 className="mb-3 flex items-center gap-2 font-bold"><Languages className="h-5 w-5 text-rani" />{t("language")}</h2>
          <div className="flex gap-2">{lang("en", "English")}{lang("ur", "اردو")}</div>
        </section>
        {optOut !== null && (
          <section className={`${card} p-5`}>
            <h2 className="mb-3 flex items-center gap-2 font-bold"><BarChart3 className="h-5 w-5 text-rani" />{t("privacy")}</h2>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={!optOut} onChange={(e) => toggle(!e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#1f2a6b]" />
              <span>{t("counters")}</span>
            </label>
          </section>
        )}
        <section className={`${card} flex flex-wrap items-center justify-between gap-3 p-5`}>
          <div><h2 className="font-bold">{t("account")}</h2><p className="text-sm text-muted" dir="ltr">{user?.email}</p></div>
          <button onClick={logout} className={btn.ghost}><LogOut className="h-5 w-5" />{n("logout")}</button>
        </section>
        <section className="rounded-[var(--radius-card)] border-2 border-rani/30 bg-rani-soft p-5">
          <h2 className="font-bold text-rani">{t("danger")}</h2>
          <p className="mt-1 text-sm">{t("dangerLead")}</p>
          <button onClick={del} className="mt-3 inline-flex items-center gap-2 rounded-full bg-rani px-4 py-2.5 font-bold text-white hover:bg-[#b81d5d]">
            <Trash2 className="h-5 w-5" />{t("delete")}
          </button>
        </section>
      </div>
    </div>
  );
}
export default function Page() { return <RequireAuth><Settings /></RequireAuth>; }

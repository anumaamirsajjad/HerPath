"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import type { Profile } from "@/lib/types";

function Settings() {
  const t = useTranslations("settings");
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const c = useTranslations("common");
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
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p>{t("language")}: <Link href={pathname} locale="en" className="underline">English</Link> · <Link href={pathname} locale="ur" className="underline">اردو</Link></p>
      {optOut !== null && <label className="flex items-center gap-2"><input type="checkbox" checked={!optOut} onChange={(e) => toggle(!e.target.checked)} />{t("counters")}</label>}
      {error && <p role="alert" className="text-red-700">{c("error")}</p>}
      <button onClick={del} className="rounded border border-red-700 px-3 py-2 text-red-700">{t("delete")}</button>
    </div>
  );
}
export default function Page() { return <RequireAuth><Settings /></RequireAuth>; }

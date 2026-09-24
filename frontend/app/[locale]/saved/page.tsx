"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import RequireAuth from "@/components/RequireAuth";
import ScholarshipCard from "@/components/ScholarshipCard";
import { api } from "@/lib/api";
import { daysLeft } from "@/lib/dates";
import type { SavedList } from "@/lib/types";

function Saved() {
  const t = useTranslations("saved");
  const c = useTranslations("common");
  const lang = useLocale();
  const [s, setS] = useState<SavedList | null | "error">(null);
  const [removeError, setRemoveError] = useState(false);
  const load = useCallback(() => { api<SavedList>("saved", { lang }).then(setS).catch(() => setS("error")); }, [lang]);
  useEffect(() => { load(); }, [load]);
  if (s === "error") return <p role="alert">{c("error")}</p>;
  if (!s) return <p>{c("loading")}</p>;
  const name = (slug: string) => s.items.find((i) => i.slug === slug)?.name ?? slug;
  const items = [...s.items].sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      {removeError && <p role="alert" className="text-red-700">{c("error")}</p>}
      {s.conflicts.map(([a, b]) => <p key={a + b} className="rounded bg-yellow-100 p-2 text-sm">{t("conflict", { a: name(a), b: name(b) })}</p>)}
      {items.length === 0 && <p>{t("empty")}</p>}
      {items.map((r) => {
        const d = daysLeft(r.deadline);
        return (
          <ScholarshipCard key={r.slug} row={r} extra={
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className={d != null && d < 0 ? "text-red-700" : "font-medium"}>
                {d == null ? t("noDeadline") : d < 0 ? t("passed") : t("daysLeft", { count: d })}
              </span>
              <button onClick={async () => {
                setRemoveError(false);
                try { await api(`saved/${r.slug}`, { method: "DELETE" }); load(); } catch { setRemoveError(true); }
              }} className="underline">{t("remove")}</button>
            </div>} />
        );
      })}
    </div>
  );
}
export default function Page() { return <RequireAuth><Saved /></RequireAuth>; }

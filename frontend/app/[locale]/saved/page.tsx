"use client";
import { TriangleAlert, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import RequireAuth from "@/components/RequireAuth";
import ScholarshipCard from "@/components/ScholarshipCard";
import { Empty, ErrorNote, Loading, PageTitle, btn } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import { daysLeft } from "@/lib/dates";
import type { SavedList } from "@/lib/types";

function Countdown({ days }: { days: number | null }) {
  const t = useTranslations("saved");
  if (days == null) return <p className="text-sm text-muted">{t("noDeadline")}</p>;
  if (days < 0) return <p className="text-sm font-bold text-rani">{t("passed")}</p>;
  const tone = days <= 14 ? "bg-rani text-white" : days <= 45 ? "bg-saffron text-ink" : "bg-indigo-soft text-indigo";
  return (
    <p className="flex items-center gap-2 text-sm font-bold">
      <span className={`grid min-w-12 place-items-center rounded-xl px-2 py-1 text-lg leading-none ${tone}`}>{days}</span>{t("daysLeft", { count: days })}
    </p>
  );
}

function Saved() {
  const t = useTranslations("saved");
  const c = useTranslations("common");
  const lang = useLocale();
  const [s, setS] = useState<SavedList | null | "error">(null);
  const [removeError, setRemoveError] = useState(false);
  const load = useCallback(() => { api<SavedList>("saved", { lang }).then(setS).catch(() => setS("error")); }, [lang]);
  useEffect(() => { load(); }, [load]);
  if (s === "error") return <ErrorNote>{c("error")}</ErrorNote>;
  if (!s) return <Loading label={c("loading")} />;
  const name = (slug: string) => s.items.find((i) => i.slug === slug)?.name ?? slug;
  const items = [...s.items].sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  return (
    <div>
      <PageTitle title={t("title")} lead={t("lead")} />
      <div className="space-y-4">
        {removeError && <ErrorNote>{c("error")}</ErrorNote>}
        {s.conflicts.map(([a, b]) => (
          <p key={a + b} className="flex items-start gap-3 rounded-2xl border-2 border-saffron/50 bg-saffron-soft p-4 font-bold text-[#6b4600]">
            <TriangleAlert className="h-5 w-5 shrink-0" />{t("conflict", { a: name(a), b: name(b) })}
          </p>
        ))}
        {items.length === 0 && (
          <Empty title={t("empty")}>
            <p className="max-w-sm text-muted">{t("emptyLead")}</p>
            <Link href="/scholarships" className={btn.primary}>{t("browse")}</Link>
          </Empty>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((r) => (
            <ScholarshipCard key={r.slug} row={r} extra={
              <div className="flex items-center justify-between gap-3 rounded-xl bg-paper p-2.5">
                <Countdown days={daysLeft(r.deadline)} />
                <button onClick={async () => {
                  setRemoveError(false);
                  try { await api(`saved/${r.slug}`, { method: "DELETE" }); load(); } catch { setRemoveError(true); }
                }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-muted hover:bg-rani-soft hover:text-rani">
                  <Trash2 className="h-4 w-4" />{t("remove")}
                </button>
              </div>} />
          ))}
        </div>
      </div>
    </div>
  );
}
export default function Page() { return <RequireAuth><Saved /></RequireAuth>; }

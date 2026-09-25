"use client";
import { CalendarDays, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { COVER_ICON, type Cover } from "@/components/icons";
import { Pill, card } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/dates";
import type { MatchRow, ScholarshipRow, Tab } from "@/lib/types";

export default function ScholarshipCard({ row, tab, extra }: { row: ScholarshipRow | MatchRow; tab?: Tab | "needs_info"; extra?: React.ReactNode }) {
  const t = useTranslations("scholarship");
  const tf = useTranslations("filters");
  const tabs = useTranslations("tabs");
  const tc = useTranslations("countries");
  const c = useTranslations("common");
  const locale = useLocale();
  const est = "deadline_estimated" in row && row.deadline_estimated && row.effective_deadline;
  const when = row.deadline
    ? `${t("deadline")}: ${formatDate(row.deadline, locale)}`
    : est ? t("estimated", { date: formatDate(row.effective_deadline, locale) })
    : row.usual_opening_month ? t("usuallyOpens", { month: c.raw("months")[row.usual_opening_month - 1] }) : t(row.status);
  return (
    <article className={`${card} group relative flex min-w-0 flex-col gap-3 p-5 transition hover:border-indigo/40 hover:shadow-[var(--shadow-lift)]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-snug text-indigo">
            <Link href={`/scholarships/${row.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">{row.name}</Link>
          </h3>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="shrink-0 whitespace-nowrap">{tc.has(row.country) ? tc(row.country) : row.country}</span><span aria-hidden="true">/</span><span className="min-w-0 truncate" dir="auto">{row.provider}</span>
          </p>
        </div>
        {tab && <Pill tone={tab}>{tabs(tab)}</Pill>}
      </div>
      <p className="line-clamp-2 text-sm">{row.summary}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className={`rounded-full px-2.5 py-1 ${row.funding === "full" ? "bg-leaf-soft text-leaf" : "bg-indigo-soft text-indigo"}`}>{tf(row.funding)}</span>
        {row.levels.map((l) => <span key={l} className="rounded-full bg-paper px-2.5 py-1 text-muted">{tf(l)}</span>)}
        {(row.women_only || row.female_quota) && <span className="rounded-full bg-rani-soft px-2.5 py-1 text-rani">{tf(row.women_only ? "women_only" : "female_quota")}</span>}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3">
        <ul className="flex gap-1.5" aria-label={t("covers")}>
          {row.covers.map((cv) => {
            const Icon = COVER_ICON[cv as Cover];
            return Icon ? <li key={cv} title={tf(cv)} className="grid h-8 w-8 place-items-center rounded-full bg-saffron-soft text-[#8a5a00]"><Icon className="h-4 w-4" aria-label={tf(cv)} /></li> : null;
          })}
        </ul>
        <p className="flex items-center gap-1.5 text-xs text-muted"><CalendarDays className="h-3.5 w-3.5" />{when}</p>
      </div>
      {extra && <div className="relative">{extra}</div>}
    </article>
  );
}

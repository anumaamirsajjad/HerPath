"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Filters from "@/components/Filters";
import ScholarshipCard from "@/components/ScholarshipCard";
import { Empty, btn, card, field } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { activeCount, applyFilters, emptyFilters, type FilterState } from "@/lib/filters";
import type { MatchList, Profile, ScholarshipRow, Tab } from "@/lib/types";

export default function ScholarshipBrowser({ initialRows: rows }: { initialRows: ScholarshipRow[] }) {
  const t = useTranslations("filters");
  const l = useTranslations("list");
  const lang = useLocale();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tabs, setTabs] = useState<Record<string, Tab | "needs_info">>({});
  const [f, setF] = useState<FilterState>(emptyFilters);
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    if (!user?.has_profile) return;
    api<Profile>("profile").then(setProfile).catch(() => {});
    api<MatchList>("match", { lang }).then((m) =>
      setTabs(Object.fromEntries(Object.values(m.tabs).flat().map((r) => [r.slug, r.needs_info ? "needs_info" : r.tab])))).catch(() => {});
  }, [user, lang]);
  useEffect(() => { document.body.style.overflow = sheet ? "hidden" : ""; }, [sheet]);
  const shown = applyFilters(rows, f, profile?.data);
  const n = activeCount(f);
  const filters = <Filters value={f} onChange={setF} loggedIn={!!profile} />;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_1fr]">
      <aside className="hidden lg:block">
        <div className={`${card} sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5`}>{filters}</div>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">{t("search")}</span>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input type="search" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder={t("search")} className={`${field} mt-0 ps-11`} />
          </label>
          <button type="button" onClick={() => setSheet(true)} className={`${btn.ghost} lg:hidden`} aria-expanded={sheet}>
            <SlidersHorizontal className="h-5 w-5" /><span>{t("title")}</span>
            {n > 0 && <span className="pop grid h-6 min-w-6 place-items-center rounded-full bg-rani px-1.5 text-xs text-white">{n}</span>}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-muted" aria-live="polite">{t("count", { count: shown.length })}</p>
          {!loading && !user && <Link href="/signup" className={`${btn.link} text-sm`}>{l("signupHint")}</Link>}
        </div>

        {shown.length === 0 ? (
          <Empty title={t("none")}><button onClick={() => setF(emptyFilters)} className={btn.ghost}>{t("clear")}</button></Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {shown.map((r) => <ScholarshipCard key={r.slug} row={r} tab={tabs[r.slug]} />)}
          </div>
        )}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t("title")}>
          <button className="absolute inset-0 bg-ink/40" aria-label={t("clear")} onClick={() => setSheet(false)} tabIndex={-1} />
          <div className="rise absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[1.75rem] bg-paper p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-xl font-bold text-indigo">{t("title")}</p>
              <button onClick={() => setSheet(false)} className="rounded-full p-2 text-muted hover:text-indigo" aria-label="×"><X className="h-6 w-6" /></button>
            </div>
            {filters}
            <button onClick={() => setSheet(false)} className={`${btn.primary} mt-6 w-full`}>{t("show", { count: shown.length })}</button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { ChevronDown, UserPen } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import RequireAuth from "@/components/RequireAuth";
import ScholarshipCard from "@/components/ScholarshipCard";
import { Empty, ErrorNote, Loading, PageTitle, ScoreRing, TONE, btn, card } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { MatchList, MatchRow, Tab } from "@/lib/types";

const TABS: Tab[] = ["apply_now", "ready", "almost", "future"];
const EMPTY = { apply_now: "emptyApply", ready: "emptyReady", almost: "emptyAlmost", future: "emptyFuture" } as const;

function Row({ r }: { r: MatchRow }) {
  const t = useTranslations("tabs");
  const chips = [
    r.gap_count > 0 && r.tab !== "not_eligible" && t("gaps", { count: r.gap_count }),
    r.missing_count > 0 && t("missing", { count: r.missing_count }),
  ].filter(Boolean) as string[];
  return (
    <ScholarshipCard row={r} tab={r.needs_info ? "needs_info" : r.tab} extra={
      (r.score != null || chips.length > 0) && (
        <div className="flex items-center gap-3 rounded-xl bg-paper p-2.5">
          {r.score != null && <ScoreRing score={r.score} size={44} />}
          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            {r.score != null && <span className="text-ink">{t("score", { score: r.score })}</span>}
            {chips.map((c) => <span key={c} className="rounded-full bg-card px-2 py-0.5 text-muted">{c}</span>)}
          </div>
        </div>
      )} />
  );
}

function Results() {
  const t = useTranslations("tabs");
  const r = useTranslations("results");
  const c = useTranslations("common");
  const lang = useLocale();
  const [m, setM] = useState<MatchList | null | "error">(null);
  const [tab, setTab] = useState<Tab | null>(null);
  useEffect(() => { api<MatchList>("match", { lang }).then(setM).catch(() => setM("error")); }, [lang]);
  if (m === "error") return <ErrorNote>{c("error")}</ErrorNote>;
  if (!m) return <Loading label={c("loading")} />;
  if (!m.has_profile) return <Empty title={t("noProfile")}><Link href="/profile" className={btn.primary}>{r("updateProfile")}</Link></Empty>;

  const needsInfo = m.tabs.not_eligible.filter((x) => x.needs_info);
  const blocked = m.tabs.not_eligible.filter((x) => !x.needs_info);
  // Open on the most hopeful tab that has something in it.
  const current = tab ?? TABS.find((k) => m.tabs[k].length) ?? "apply_now";
  const segments: [keyof typeof TONE, number][] = [...TABS.map((k) => [k, m.tabs[k].length] as [Tab, number]), ["needs_info", needsInfo.length], ["not_eligible", blocked.length]];
  const total = segments.reduce((n, [, v]) => n + v, 0);

  return (
    <div className="space-y-8">
      <PageTitle title={r("title")} lead={r("lead")}>
        <Link href="/profile" className={btn.ghost}><UserPen className="h-5 w-5" />{r("updateProfile")}</Link>
      </PageTitle>

      <section className={`${card} p-5`} aria-label={r("overview", { total })}>
        <p className="mb-3 font-bold">{r("overview", { total })}</p>
        <div className="flex h-4 overflow-hidden rounded-full bg-paper">
          {segments.filter(([, v]) => v).map(([k, v]) => (
            <span key={k} className={`${TONE[k].dot} h-full border-e-2 border-card transition-all duration-700 last:border-e-0`} style={{ width: `${(v / total) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {segments.map(([k, v]) => (
            <li key={k} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${TONE[k].dot}`} />{t(k)}<b>{v}</b></li>
          ))}
        </ul>
      </section>

      <div>
        <div role="tablist" className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((k) => (
            <button key={k} role="tab" aria-selected={current === k} onClick={() => setTab(k)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition ${current === k ? "border-indigo bg-indigo text-white" : "border-line bg-card text-ink hover:border-indigo"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${TONE[k].dot}`} />{t(k)} ({m.tabs[k].length})
            </button>
          ))}
        </div>
        <div role="tabpanel" key={current} className="rise mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {m.tabs[current].length === 0 && <div className="md:col-span-2"><Empty title={t(EMPTY[current as keyof typeof EMPTY])} /></div>}
          {m.tabs[current].map((x) => <Row key={x.slug} r={x} />)}
        </div>
      </div>

      {needsInfo.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-indigo">{t("needs_info")} ({needsInfo.length})</h2>
              <p className="text-muted">{r("needsInfoLead")}</p>
            </div>
            <Link href="/profile" className={btn.link}>{t("noProfile")}</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{needsInfo.map((x) => <Row key={x.slug} r={x} />)}</div>
        </section>
      )}

      {blocked.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-display text-xl font-bold text-muted">
            <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />{t("not_eligible")} ({blocked.length})
          </summary>
          <p className="mt-1 text-muted">{r("notEligibleLead")}</p>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">{blocked.map((x) => <Row key={x.slug} r={x} />)}</div>
        </details>
      )}
    </div>
  );
}
export default function Page() { return <RequireAuth><Results /></RequireAuth>; }

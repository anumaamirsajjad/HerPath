"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import RequireAuth from "@/components/RequireAuth";
import ScholarshipCard from "@/components/ScholarshipCard";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { MatchList, MatchRow, Tab } from "@/lib/types";

const TABS: Tab[] = ["apply_now", "almost", "future"];
const EMPTY = { apply_now: "emptyApply", almost: "emptyAlmost", future: "emptyFuture" } as const;

function Row({ r }: { r: MatchRow }) {
  const t = useTranslations("tabs");
  const bits = [
    r.score != null && t("score", { score: r.score }),
    r.gap_count > 0 && r.tab !== "not_eligible" && t("gaps", { count: r.gap_count }),
    r.missing_count > 0 && t("missing", { count: r.missing_count }),
  ].filter(Boolean);
  return <ScholarshipCard row={r} tab={r.needs_info ? "needs_info" : r.tab}
    extra={bits.length > 0 && <p className="mt-1 text-xs">{bits.join(" · ")}</p>} />;
}

function Results() {
  const t = useTranslations("tabs");
  const c = useTranslations("common");
  const lang = useLocale();
  const [m, setM] = useState<MatchList | null | "error">(null);
  const [tab, setTab] = useState<Tab>("apply_now");
  useEffect(() => { api<MatchList>("match", { lang }).then(setM).catch(() => setM("error")); }, [lang]);
  if (m === "error") return <p role="alert">{c("error")}</p>;
  if (!m) return <p>{c("loading")}</p>;
  if (!m.has_profile) return <p><Link href="/profile" className="underline">{t("noProfile")}</Link></p>;
  const needsInfo = m.tabs.not_eligible.filter((r) => r.needs_info);
  const blocked = m.tabs.not_eligible.filter((r) => !r.needs_info);
  return (
    <div className="space-y-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-full px-3 py-1 text-sm ${tab === k ? "bg-emerald-700 text-white" : "border"}`}>
            {t(k)} ({m.tabs[k].length})
          </button>))}
      </div>
      <div role="tabpanel" className="space-y-3">
        {m.tabs[tab].length === 0 && <p className="text-sm text-gray-600">{t(EMPTY[tab as keyof typeof EMPTY])}</p>}
        {m.tabs[tab].map((r) => <Row key={r.slug} r={r} />)}
      </div>
      {needsInfo.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">{t("needs_info")} ({needsInfo.length})</h2>
          <p className="text-sm"><Link href="/profile" className="underline">{t("noProfile")}</Link></p>
          {needsInfo.map((r) => <Row key={r.slug} r={r} />)}
        </section>)}
      {blocked.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer font-semibold">{t("not_eligible")} ({blocked.length})</summary>
          <div className="mt-2 space-y-2">{blocked.map((r) => <Row key={r.slug} r={r} />)}</div>
        </details>)}
    </div>
  );
}
export default function Page() { return <RequireAuth><Results /></RequireAuth>; }

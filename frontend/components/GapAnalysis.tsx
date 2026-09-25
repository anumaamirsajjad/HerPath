"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import GapList from "@/components/GapList";
import { ErrorNote, Loading, Pill, ScoreRing, btn } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import type { MatchResult } from "@/lib/types";

export default function GapAnalysis({ slug }: { slug: string }) {
  const t = useTranslations("scholarship");
  const tabs = useTranslations("tabs");
  const c = useTranslations("common");
  const locale = useLocale();
  const [m, setM] = useState<MatchResult | null | "error">(null);
  useEffect(() => { api<MatchResult>(`match/${slug}`).then(setM).catch(() => setM("error")); }, [slug]);
  if (m === "error") return <ErrorNote>{c("error")}</ErrorNote>;
  if (!m) return <Loading label={c("loading")} rows={2} />;
  if (!m.has_profile) return <Link href="/profile" className={btn.primary}>{tabs("noProfile")}</Link>;
  const headline = m.needs_info ? t("needsInfo")
    : m.tab === "not_eligible" ? t("notEligible") : t("metOf", { met: m.met_count, total: m.total_count });
  const tone = m.needs_info ? "needs_info" : m.tab;
  return (
    <div className="rise space-y-5">
      <div className="flex items-center gap-4">
        {m.score != null && <ScoreRing score={m.score} size={64} />}
        <div className="space-y-1">
          <Pill tone={tone}>{tabs(tone)}</Pill>
          <p className="font-display text-lg font-bold">{headline}</p>
          {m.tab === "ready" && <p className="text-sm text-[#0b6f71]">{t("readyNote")}</p>}
          {m.deadline_estimated && m.deadline && <p className="text-xs text-muted">{t("estimated", { date: formatDate(m.deadline, locale) })}</p>}
        </div>
      </div>
      <GapList requirements={m.requirements} />
      {m.tab === "not_eligible" && !m.needs_info && <Link href="/scholarships" className={btn.link}>{t("similar")}</Link>}
    </div>
  );
}

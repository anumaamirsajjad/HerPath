"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/dates";
import GapList from "@/components/GapList";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { MatchResult } from "@/lib/types";

export default function GapAnalysis({ slug }: { slug: string }) {
  const t = useTranslations("scholarship");
  const tabs = useTranslations("tabs");
  const c = useTranslations("common");
  const locale = useLocale();
  const [m, setM] = useState<MatchResult | null | "error">(null);
  useEffect(() => { api<MatchResult>(`match/${slug}`).then(setM).catch(() => setM("error")); }, [slug]);
  if (m === "error") return <p role="alert">{c("error")}</p>;
  if (!m) return <p>{c("loading")}</p>;
  if (!m.has_profile) return <p className="text-sm"><Link href="/profile" className="underline">{tabs("noProfile")}</Link></p>;
  const headline = m.needs_info ? t("needsInfo")
    : m.tab === "not_eligible" ? t("notEligible") : t("metOf", { met: m.met_count, total: m.total_count });
  return (
    <div>
      <p className="text-sm font-medium">{headline}</p>
      {m.tab === "ready" && <p className="text-sm text-teal-800">{t("readyNote")}</p>}
      {m.deadline_estimated && m.deadline && <p className="text-xs text-gray-600">{t("estimated", { date: formatDate(m.deadline, locale) })}</p>}
      <GapList requirements={m.requirements} />
      {m.tab === "not_eligible" && !m.needs_info && <Link href="/scholarships" className="text-sm underline">{t("similar")}</Link>}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Filters from "@/components/Filters";
import ScholarshipCard from "@/components/ScholarshipCard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { applyFilters, emptyFilters, type FilterState } from "@/lib/filters";
import type { MatchList, Profile, ScholarshipRow, Tab } from "@/lib/types";

export default function Page() {
  const t = useTranslations("filters");
  const c = useTranslations("common");
  const lang = useLocale();
  const { user } = useAuth();
  const [rows, setRows] = useState<ScholarshipRow[] | null>(null);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tabs, setTabs] = useState<Record<string, Tab | "needs_info">>({});
  const [f, setF] = useState<FilterState>(emptyFilters);
  useEffect(() => { api<ScholarshipRow[]>("scholarships", { lang }).then(setRows).catch(() => setError(true)); }, [lang]);
  useEffect(() => {
    if (!user?.has_profile) return;
    api<Profile>("profile").then(setProfile).catch(() => {});
    api<MatchList>("match", { lang }).then((m) =>
      setTabs(Object.fromEntries(Object.values(m.tabs).flat().map((r) => [r.slug, r.needs_info ? "needs_info" : r.tab])))).catch(() => {});
  }, [user, lang]);
  if (error) return <p role="alert">{c("error")}</p>;
  if (!rows) return <p>{c("loading")}</p>;
  const shown = applyFilters(rows, f, profile?.data);
  return (
    <div className="space-y-4">
      <Filters value={f} onChange={setF} loggedIn={!!profile} />
      <p className="text-sm text-gray-600">{t("count", { count: shown.length })}</p>
      {shown.map((r) => <ScholarshipCard key={r.slug} row={r} tab={tabs[r.slug]} />)}
    </div>
  );
}

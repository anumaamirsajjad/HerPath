"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/dates";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { ChangeLogEntry } from "@/lib/types";

export default function Page() {
  const t = useTranslations("changelog");
  const c = useTranslations("common");
  const locale = useLocale();
  const [rows, setRows] = useState<ChangeLogEntry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { api<ChangeLogEntry[]>("changelog").then(setRows).catch(() => setError(true)); }, []);
  if (error) return <p role="alert">{c("error")}</p>;
  if (!rows) return <p>{c("loading")}</p>;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p className="text-sm text-gray-600">{t("intro")}</p>
      <ul className="space-y-2">{rows.map((r, i) => (
        <li key={i} className="rounded border p-3 text-sm">
          <span className="text-gray-500">{formatDate(r.date, locale)}</span> · <Link href={`/scholarships/${r.scholarship}`} className="underline">{r.scholarship}</Link>
          <p>{r.note}</p>
          {r.source && <a href={r.source} className="text-xs underline" target="_blank" rel="noopener" dir="ltr">{r.source}</a>}
        </li>))}
      </ul>
    </div>
  );
}

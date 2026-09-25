"use client";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Empty, ErrorNote, Loading, PageTitle, card } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import type { ChangeLogEntry } from "@/lib/types";

export default function Page() {
  const t = useTranslations("changelog");
  const c = useTranslations("common");
  const locale = useLocale();
  const [rows, setRows] = useState<ChangeLogEntry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { api<ChangeLogEntry[]>("changelog").then(setRows).catch(() => setError(true)); }, []);
  if (error) return <ErrorNote>{c("error")}</ErrorNote>;
  if (!rows) return <Loading label={c("loading")} />;
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title={t("title")} lead={t("intro")} />
      {rows.length === 0 ? <Empty title={t("empty")} /> : (
        <ol className="relative space-y-4">
          <span aria-hidden="true" className="absolute bottom-4 start-[7px] top-4 border-s-2 border-dashed border-saffron/60" />
          {rows.map((r, i) => (
            <li key={i} className="relative flex gap-4">
              <span className="relative z-10 mt-5 h-4 w-4 shrink-0 rounded-full border-4 border-card bg-rani ring-2 ring-rani/30" />
              <div className={`${card} min-w-0 flex-1 p-4`}>
                <p className="text-sm font-bold text-muted">{formatDate(r.date, locale)}</p>
                <Link href={`/scholarships/${r.scholarship}`} className="font-bold text-indigo hover:underline">{r.scholarship}</Link>
                <p className="mt-1">{r.note}</p>
                {r.source && <a href={r.source} className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-muted hover:text-indigo" target="_blank" rel="noopener" dir="ltr"><ExternalLink className="h-3 w-3 shrink-0" /><span className="truncate">{r.source}</span></a>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

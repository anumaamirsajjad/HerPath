"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { ScholarshipRow, Tab } from "@/lib/types";

const TAB_COLOR: Record<Tab | "needs_info", string> = {
  apply_now: "bg-green-100 text-green-800", almost: "bg-yellow-100 text-yellow-800",
  future: "bg-blue-100 text-blue-800", not_eligible: "bg-gray-200 text-gray-700", needs_info: "bg-orange-100 text-orange-800",
};

export default function ScholarshipCard({ row, tab, extra }: { row: ScholarshipRow; tab?: Tab | "needs_info"; extra?: React.ReactNode }) {
  const t = useTranslations("scholarship");
  const tabs = useTranslations("tabs");
  const c = useTranslations("common");
  const when = row.deadline
    ? `${t("deadline")}: ${row.deadline}`
    : row.usual_opening_month ? t("usuallyOpens", { month: c.raw("months")[row.usual_opening_month - 1] }) : t(row.status);
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold"><Link href={`/scholarships/${row.slug}`} className="hover:underline">{row.name}</Link></h3>
          <p className="text-sm text-gray-600">{row.provider} · {row.country}</p>
        </div>
        {tab && <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${TAB_COLOR[tab]}`}>{tabs(tab)}</span>}
      </div>
      <p className="mt-2 text-sm">{row.summary}</p>
      <p className="mt-2 text-xs text-gray-600">{when}</p>
      {extra}
    </div>
  );
}

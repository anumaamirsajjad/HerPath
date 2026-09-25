"use client";
import { BookOpen, CalendarClock, CircleCheck, Hourglass, TriangleAlert, UserPen, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { TONE } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/dates";
import type { LeafResult, Msg, Result, Status } from "@/lib/types";

const ICON: Record<Status, typeof CircleCheck> = { met: CircleCheck, fixable: TriangleAlert, fixable_later: Hourglass, not_eligible: XCircle };

function useMsg() {
  const lang = useLocale();
  return (m: Msg) => (lang === "ur" && m.ur) || m.en;
}

/** The status knot on the stitched line. aria-label keeps the status readable to screen readers (and tests). */
function Knot({ status }: { status: Status }) {
  const Icon = ICON[status];
  const t = TONE[status];
  return (
    <span aria-label={status} className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-card ${t.soft} ${t.text}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

function MissingHint({ r }: { r: Result }) {
  const t = useTranslations("scholarship");
  // An unticked document isn't unknown data, it's a document she doesn't have yet: the fix says what to do.
  if (!r.missingFromProfile || r.status === "met" || (r.kind === "leaf" && r.field.startsWith("documents."))) return null;
  const aboutLevel = r.conditionField === "targetLevel" || (r.kind === "leaf" && r.field === "targetLevel");
  return (
    <Link href="/profile" className="inline-flex items-center gap-1.5 rounded-lg bg-rani-soft px-3 py-1.5 text-sm font-bold text-rani">
      <UserPen className="h-4 w-4" />{aboutLevel ? t("addLevel") : t("addToProfile")}
    </Link>
  );
}

function Fix({ r }: { r: LeafResult }) {
  const t = useTranslations("scholarship");
  const locale = useLocale();
  if (r.status === "met" || r.status === "not_eligible" || !r.fixGuide) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <Link href={`/guides/${r.fixGuide}`} className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-soft px-3 py-1.5 font-bold text-[#6b4600] hover:bg-[#fbe6b3]">
        <BookOpen className="h-4 w-4" />{t("guide")}
      </Link>
      {r.daysNeeded ? <span className="text-muted">{t("days", { count: r.daysNeeded })}</span> : null}
      {r.startBy && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-soft px-3 py-1.5 font-bold text-indigo">
          <CalendarClock className="h-4 w-4" />{t("startBy", { date: formatDate(r.startBy, locale) })}
        </span>
      )}
    </div>
  );
}

function Item({ r, fastest }: { r: Result; fastest?: boolean }) {
  const t = useTranslations("scholarship");
  const msg = useMsg();
  const open = r.status !== "met";
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      <Knot status={r.status} />
      <div className="min-w-0 flex-1 pt-1.5">
        <p className={open ? "font-bold" : "text-muted"}>
          {msg(r.message)}
          {fastest && <span className="ms-2 rounded-full bg-leaf-soft px-2 py-0.5 text-xs font-bold text-leaf">{t("fastest")}</span>}
        </p>
        {open && <div className="mt-1.5 space-y-1.5"><MissingHint r={r} />{r.kind === "leaf" && <Fix r={r} />}</div>}
        {r.kind !== "leaf" && (
          <div className="mt-3 rounded-xl border border-dashed border-line p-3">
            <p className="mb-2 text-xs font-bold text-muted">{r.kind === "anyOf" ? t("options") : t("allOf")}</p>
            <GapList requirements={r.options} nested anyOf={r.kind === "anyOf" && r.status !== "met"} />
          </div>
        )}
      </div>
    </li>
  );
}

export default function GapList({ requirements, nested = false, anyOf = false }: { requirements: Result[]; nested?: boolean; anyOf?: boolean }) {
  return (
    <ul className="relative">
      {!nested && <span aria-hidden="true" className="absolute bottom-6 start-[17px] top-4 border-s-2 border-dashed border-saffron/60" />}
      {requirements.map((r, i) => <Item key={i} r={r} fastest={anyOf && i === 0 && r.status !== "not_eligible"} />)}
    </ul>
  );
}

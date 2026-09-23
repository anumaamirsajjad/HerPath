"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { LeafResult, Msg, Result, Status } from "@/lib/types";

const ICON: Record<Status, string> = { met: "✅", fixable: "⚠️", fixable_later: "⏳", not_eligible: "❌" };

function useMsg() {
  const lang = useLocale();
  return (m: Msg) => (lang === "ur" && m.ur) || m.en;
}

function MissingHint({ r }: { r: Result }) {
  const t = useTranslations("scholarship");
  if (!r.missingFromProfile || r.status === "met") return null;
  return <p><Link href="/profile" className="underline">{r.conditionField === "level" ? t("addLevel") : t("addToProfile")}</Link></p>;
}

function Leaf({ r, fastest }: { r: LeafResult; fastest?: boolean }) {
  const t = useTranslations("scholarship");
  const msg = useMsg();
  return (
    <li className="py-1">
      <span aria-label={r.status}>{ICON[r.status]} </span>
      <span className={r.status === "met" ? "" : "font-semibold"}>{msg(r.message)}</span>
      {fastest && <span className="ms-2 rounded bg-emerald-100 px-1 text-xs">{t("fastest")}</span>}
      {r.status !== "met" && (
        <div className="ms-6 text-sm text-gray-700">
          <MissingHint r={r} />
          {r.status !== "not_eligible" && r.fixGuide && (
            <p>{t("fix")} <Link href={`/guides/${r.fixGuide}`} className="underline">{t("guide")}</Link>{r.daysNeeded ? ` (~${r.daysNeeded}d)` : ""}</p>)}
          {r.startBy && <p>{t("startBy", { date: r.startBy })}</p>}
        </div>)}
    </li>
  );
}

function Node({ r }: { r: Result }) {
  const msg = useMsg();
  if (r.kind === "leaf") return <Leaf r={r} />;
  return (
    <li className="py-1">
      <span aria-label={r.status}>{ICON[r.status]} </span>
      <span className={r.status === "met" ? "" : "font-semibold"}>{msg(r.message)}</span>
      <div className="ms-6 text-sm text-gray-700"><MissingHint r={r} /></div>
      <ul className="ms-6 border-s ps-3">
        {r.options.map((o, j) => o.kind === "leaf"
          ? <Leaf key={j} r={o} fastest={r.kind === "anyOf" && r.status !== "met" && j === 0 && o.status !== "not_eligible"} />
          : <Node key={j} r={o} />)}
      </ul>
    </li>
  );
}

export default function GapList({ requirements }: { requirements: Result[] }) {
  return <ul>{requirements.map((r, i) => <Node key={i} r={r} />)}</ul>;
}

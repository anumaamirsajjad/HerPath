"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import GapAnalysis from "@/components/GapAnalysis";
import ReportProblem from "@/components/ReportProblem";
import WhatsAppShare from "@/components/WhatsAppShare";
import { Link } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SavedList, ScholarshipDetail } from "@/lib/types";

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const t = useTranslations("scholarship");
  const tDocs = useTranslations("documents");
  const c = useTranslations("common");
  const lang = useLocale();
  const { user } = useAuth();
  const [s, setS] = useState<ScholarshipDetail | null | "missing" | "error">(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api<ScholarshipDetail>(`scholarships/${slug}`, { lang }).then(setS)
      .catch((e) => setS(e instanceof ApiError && e.status === 404 ? "missing" : "error"));
  }, [slug, lang]);
  useEffect(() => {
    if (user) api<SavedList>("saved").then((r) => setSaved(r.items.some((i) => i.slug === slug))).catch(() => {});
  }, [user, slug]);
  if (s === "missing") return <p>404</p>;
  if (s === "error") return <p role="alert">{c("error")}</p>;
  if (!s) return <p>{c("loading")}</p>;
  async function toggleSave() {
    if (saved) await api(`saved/${slug}`, { method: "DELETE" });
    else await api("saved", { method: "POST", body: JSON.stringify({ slug }) });
    setSaved(!saved);
  }
  const when = s.deadline
    ? ` · ${t("deadline")}: ${s.deadline}`
    : s.usual_opening_month ? ` · ${t("usuallyOpens", { month: c.raw("months")[s.usual_opening_month - 1] })}` : "";
  return (
    <article className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{s.name}</h1>
        <p className="text-gray-600">{s.provider} · {s.country}</p>
        <p className="text-sm">{t("status")}: {t(s.status)}{when}</p>
        <p className="text-xs text-gray-500">{t("verified", { date: s.last_verified })} · {s.allows_other_scholarship ? t("allowsOther") : t("noOther")}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {user && <button onClick={toggleSave} className="rounded border px-3 py-2">{saved ? t("saved") : t("save")}</button>}
        <WhatsAppShare text={`${s.name} (${s.provider})\n${s.summary}`} label={t("share")} />
        <Link href={`/family/${slug}`} locale="ur" className="rounded border px-3 py-2">{t("family")}</Link>
        <a href={s.official_link} target="_blank" rel="noopener" className="rounded border px-3 py-2">{t("official")}</a>
      </div>
      <section><h2>{t("gapTitle")}</h2>
        {user ? <GapAnalysis slug={slug} /> : <p className="text-sm"><Link href="/login" className="underline">{t("loginToCheck")}</Link></p>}
      </section>
      <section><h2>{t("covers")}</h2><p className="whitespace-pre-line">{s.coverage}</p></section>
      <section><h2>{t("whoFor")}</h2><p className="whitespace-pre-line">{s.who_for}</p></section>
      <section><h2>{t("documents")}</h2><ul>{s.required_documents.map((d) => <li key={d}>{tDocs(d)}</li>)}</ul></section>
      <section><h2>{t("steps")}</h2><p className="whitespace-pre-line">{s.application_steps}</p></section>
      <ReportProblem slug={slug} />
    </article>
  );
}

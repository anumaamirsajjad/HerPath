import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DetailActions, GapSection } from "@/components/DetailActions";
import ReportProblem from "@/components/ReportProblem";
import { formatDate } from "@/lib/dates";
import { getJSON } from "@/lib/server";
import type { ScholarshipDetail } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getJSON<ScholarshipDetail>(`scholarships/${slug}`, locale);
  if (!s) return {};
  return { title: `${s.name} | HerPath`, description: s.summary,
    openGraph: { title: s.name, description: s.summary, siteName: "HerPath", locale: locale === "ur" ? "ur_PK" : "en_PK" } };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const s = await getJSON<ScholarshipDetail>(`scholarships/${slug}`, locale);
  if (!s) notFound();
  const t = await getTranslations("scholarship");
  const tDocs = await getTranslations("documents");
  const tc = await getTranslations("countries");
  const months = (await getTranslations("common")).raw("months") as string[];
  const when = s.deadline
    ? ` · ${t("deadline")}: ${formatDate(s.deadline, locale)}`
    : s.usual_opening_month ? ` · ${t("usuallyOpens", { month: months[s.usual_opening_month - 1] })}` : "";
  return (
    <article className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{s.name}</h1>
        <p className="text-gray-600">{s.provider} · {tc.has(s.country) ? tc(s.country) : s.country}</p>
        <p className="text-sm">{t("status")}: {t(s.status)}{when}</p>
        <p className="text-xs text-gray-500">{t("verified", { date: formatDate(s.last_verified, locale) })} · {s.allows_other_scholarship ? t("allowsOther") : t("noOther")}</p>
      </header>
      <DetailActions slug={slug} shareText={`${s.name} (${s.provider})\n${s.summary}`} officialLink={s.official_link} />
      <section><h2>{t("gapTitle")}</h2><GapSection slug={slug} /></section>
      <section><h2>{t("covers")}</h2><p className="whitespace-pre-line">{s.coverage}</p></section>
      <section><h2>{t("whoFor")}</h2><p className="whitespace-pre-line">{s.who_for}</p></section>
      <section><h2>{t("documents")}</h2><ul>{s.required_documents.map((d) => <li key={d}>{tDocs(d)}</li>)}</ul></section>
      <section><h2>{t("steps")}</h2><p className="whitespace-pre-line">{s.application_steps}</p></section>
      <ReportProblem slug={slug} />
    </article>
  );
}

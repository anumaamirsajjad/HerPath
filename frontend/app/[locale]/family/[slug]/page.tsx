import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import FamilyShare from "@/components/FamilyShare";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/dates";
import { getJSON } from "@/lib/server";
import type { ScholarshipDetail } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getJSON<ScholarshipDetail>(`scholarships/${slug}`, locale);
  if (!s) return {};
  const t = await getTranslations({ locale, namespace: "family" });
  const title = `${t("title")}: ${s.name}`;
  return { title, description: s.family_summary,
    openGraph: { title, description: s.family_summary, siteName: "HerPath", locale: locale === "ur" ? "ur_PK" : "en_PK" } };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const s = await getJSON<ScholarshipDetail>(`scholarships/${slug}`, locale);
  if (!s) notFound();
  const t = await getTranslations("family");
  const ts = await getTranslations("scholarship");
  const tf = await getTranslations("filters");
  const tc = await getTranslations("countries");
  return (
    <article className="space-y-4 text-lg leading-relaxed">
      {locale !== "ur" && <p className="text-sm"><Link href={`/family/${slug}`} locale="ur" className="underline">{t("readUrdu")}</Link></p>}
      <h1 className="text-2xl font-bold">{t("title")}: {s.name}</h1>
      <p>{t("free", { provider: s.provider })}</p>
      <p className="whitespace-pre-line">{s.family_summary}</p>
      <section>
        <h2>{t("covers")}</h2>
        <p className="whitespace-pre-line">{s.coverage}</p>
        <p className="text-sm">{s.covers.map((x) => tf(x)).join(" · ")}</p>
      </section>
      <section>
        <h2>{t("where")}</h2>
        <p>{tc.has(s.country) ? tc(s.country) : s.country}{s.covers.includes("hostel") ? ` · ${tf("hostel")}` : ""}</p>
      </section>
      <p className="text-sm text-gray-600">
        {ts("verified", { date: formatDate(s.last_verified, locale) })} · <a href={s.official_link} className="underline" target="_blank" rel="noopener">{ts("official")}</a>
      </p>
      <FamilyShare text={`${s.name}\n${s.family_summary}`} label={t("share")} />
    </article>
  );
}

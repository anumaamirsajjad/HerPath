import { BadgeCheck, ExternalLink, Gift, Home, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hem } from "@/components/art";
import FamilyShare from "@/components/FamilyShare";
import { COVER_ICON, type Cover } from "@/components/icons";
import { btn, card } from "@/components/ui";
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
  const country = tc.has(s.country) ? tc(s.country) : s.country;
  return (
    <article className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed">
      {locale !== "ur" && <p className="text-base"><Link href={`/family/${slug}`} locale="ur" className={btn.link}>{t("readUrdu")}</Link></p>}

      <header className="relative overflow-hidden rounded-[1.75rem] bg-indigo text-white">
        <Hem className="h-3 w-full" />
        <div className="p-6 sm:p-8">
          <p className="text-white/80">{t("title")}</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">{s.name}</h1>
          <p className="mt-4 max-w-2xl">{s.family_summary}</p>
        </div>
      </header>

      <FamilyShare text={`${s.name}\n${s.family_summary}`} label={t("share")} />

      <section className={`${card} p-6`}>
        <h2 className="mb-4 font-display text-2xl font-bold text-indigo">{t("covers")}</h2>
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {s.covers.map((cv) => {
            const Icon = COVER_ICON[cv as Cover];
            return <li key={cv} className="flex items-center gap-3 rounded-2xl bg-saffron-soft p-3 font-bold text-[#6b4600]">{Icon && <Icon className="h-6 w-6 shrink-0" />}{tf(cv)}</li>;
          })}
        </ul>
        <p className="whitespace-pre-line">{s.coverage}</p>
      </section>

      <section className={`${card} p-6`}>
        <h2 className="mb-3 font-display text-2xl font-bold text-indigo">{t("where")}</h2>
        <p className="flex items-center gap-3"><MapPin className="h-6 w-6 shrink-0 text-rani" />{country}</p>
        {s.covers.includes("hostel") && <p className="mt-2 flex items-center gap-3"><Home className="h-6 w-6 shrink-0 text-rani" />{tf("hostel")}</p>}
      </section>

      <section className="rounded-[1.75rem] bg-leaf-soft p-6">
        <h2 className="mb-4 font-display text-2xl font-bold text-leaf">{t("safe")}</h2>
        <ul className="space-y-3">
          <li className="flex gap-3"><Gift className="mt-1 h-6 w-6 shrink-0 text-leaf" />{t("free", { provider: s.provider })} {t("point.free")}</li>
          <li className="flex gap-3"><ExternalLink className="mt-1 h-6 w-6 shrink-0 text-leaf" /><span>{t("point.official")} <a href={s.official_link} className={btn.link} target="_blank" rel="noopener">{ts("official")}</a></span></li>
          <li className="flex gap-3"><BadgeCheck className="mt-1 h-6 w-6 shrink-0 text-leaf" />{t("point.verified", { date: formatDate(s.last_verified, locale) })}</li>
        </ul>
      </section>

    </article>
  );
}

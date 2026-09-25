import { Clock } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { metaFor } from "@/components/guideMeta";
import { PageTitle, card } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { getJSON } from "@/lib/server";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };
type GuideRow = { slug: string; title: string; days_needed: number };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });
  return { title: `${t("title")} | HerPath`, description: t("lead") };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guides");
  const guides = (await getJSON<GuideRow[]>("guides", locale)) ?? [];
  const groups = (["documents", "tests", "profile"] as const).map((g) => [g, guides.filter((x) => metaFor(x.slug).group === g)] as const);
  return (
    <div>
      <PageTitle title={t("title")} lead={t("lead")} />
      <div className="space-y-10">
        {groups.filter(([, list]) => list.length).map(([g, list]) => (
          <section key={g}>
            <h2 className="mb-4 font-display text-xl font-bold text-indigo">{t(`groups.${g}`)}</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((x) => {
                const Icon = metaFor(x.slug).icon;
                return (
                  <li key={x.slug}>
                    <Link href={`/guides/${x.slug}`} className={`${card} flex h-full items-start gap-3 p-4 transition hover:border-indigo/40 hover:shadow-[var(--shadow-lift)]`}>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-saffron-soft text-[#8a5a00]"><Icon className="h-5 w-5" /></span>
                      <span>
                        <span className="block font-bold leading-snug">{x.title}</span>
                        <span className="mt-1 inline-flex items-center gap-1 text-sm text-muted"><Clock className="h-3.5 w-3.5" />{t("time", { count: x.days_needed })}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

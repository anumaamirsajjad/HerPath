import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { metaFor } from "@/components/guideMeta";
import { Empty, btn, card } from "@/components/ui";
import WhatsAppShare from "@/components/WhatsAppShare";
import { Link } from "@/i18n/routing";
import { getJSON } from "@/lib/server";
import type { Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const g = await getJSON<Guide>(`guides/${slug}`, locale);
  return g ? { title: `${g.title} | HerPath`, openGraph: { title: g.title, siteName: "HerPath" } } : {};
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guides");
  const g = await getJSON<Guide>(`guides/${slug}`, locale);
  const back = <Link href="/guides" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-indigo"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("back")}</Link>;
  if (!g) return <div className="space-y-6">{back}<Empty title={(await getTranslations("scholarship"))("guideSoon")}><Link href="/guides" className={btn.ghost}>{t("back")}</Link></Empty></div>;
  const Icon = metaFor(slug).icon;
  return (
    <div className="space-y-6">
      {back}
      <article className={`${card} mx-auto max-w-3xl p-6 sm:p-10`}>
        <header className="mb-6 flex items-start gap-4 border-b border-dashed border-line pb-6">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-saffron-soft text-[#8a5a00]"><Icon className="h-7 w-7" /></span>
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-indigo">{g.title}</h1>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-muted"><Clock className="h-4 w-4" />{t("time", { count: g.days_needed })}</p>
          </div>
        </header>
        {/* Guide bodies are Markdown written by admins and rendered by the API, so they are trusted HTML. */}
        <div className="prose-hp" dangerouslySetInnerHTML={{ __html: g.body }} />
        <div className="mt-8 border-t border-dashed border-line pt-6"><WhatsAppShare text={g.title} label={t("share")} /></div>
      </article>
    </div>
  );
}
